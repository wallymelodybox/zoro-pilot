-- ============================================================
-- Migration: 20260822000000_license_lifecycle_and_billing.sql
-- ============================================================
-- Vision ZP section 36-37 : cycle de vie de licence explicite (essai/active/
-- expire_bientot/expiree/suspendue), notifications programmées d'expiration
-- (J-30/J-15/J-7/J-1), mode lecture seule strict à expiration, et le socle
-- pour le renouvellement Stripe (self-service web + mobile via WebView vers
-- la même Checkout Session).

-- ── 1. Statut de cycle de vie explicite ──────────────────────────────────
-- Distinct de `license_type` (qui reste la DURÉE choisie : mensuelle/
-- trimestrielle/etc.). `license_status` est calculé/maintenu à partir de
-- `expires_at` et des événements Stripe, jamais deviné depuis `license_type`
-- seul (une licence 'definitive' n'expire jamais mais peut quand même être
-- 'suspendue' par le super admin).
alter table public.organizations
  add column if not exists license_status text
    check (license_status in ('essai', 'active', 'expire_bientot', 'expiree', 'suspendue'))
    default 'active',
  add column if not exists trial_ends_at timestamp with time zone,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

-- Backfill : toute organisation existante avec une licence encore valide
-- passe 'active', celles déjà expirées passent 'expiree'. Une organisation
-- 'definitive' est toujours 'active' (jamais d'expiration).
update public.organizations
set license_status = case
  when license_type = 'definitive' then 'active'
  when expires_at is null then 'active'
  when expires_at < now() then 'expiree'
  else 'active'
end
where license_status is null or license_status = 'active';

-- ── 2. Fonction centrale de calcul du statut réel ────────────────────────
-- Recalculée à la volée plutôt que de faire confiance à la colonne stockée
-- pour les décisions de sécurité (RLS) : `license_status` peut être en
-- retard d'une exécution de job, mais `expires_at` est la source de vérité
-- immédiate. La colonne stockée sert surtout à piloter l'UI et les jobs de
-- notification sans recalculer à chaque affichage.
create or replace function public.organization_license_is_active(org_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  org record;
begin
  select license_type, license_status, expires_at into org
  from public.organizations where id = org_id;

  if org is null then
    return false;
  end if;

  if org.license_status = 'suspendue' then
    return false;
  end if;

  if org.license_type = 'definitive' then
    return true;
  end if;

  return org.expires_at is null or org.expires_at >= now();
end;
$$;

-- ── 3. Trigger de lecture seule : bloque les mutations du cœur métier
-- quand la licence de l'organisation n'est plus active. Centralisé en un
-- seul endroit plutôt que dans chaque policy RLS individuelle, pour que
-- toute nouvelle table du cœur métier n'ait qu'à attacher ce même trigger.
create or replace function public.enforce_active_license()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  org_id uuid;
begin
  org_id := coalesce(new.organization_id, old.organization_id);

  if org_id is null then
    return coalesce(new, old);
  end if;

  if public.is_super_admin() then
    return coalesce(new, old);
  end if;

  if not public.organization_license_is_active(org_id) then
    raise exception 'Licence expirée ou suspendue : organisation en lecture seule. Renouvelez votre abonnement pour continuer.'
      using errcode = 'P0001';
  end if;

  return coalesce(new, old);
end;
$$;

-- Certaines de ces tables (ex. task_checklist_items) viennent d'une
-- migration plus récente (20260821000003) qui peut ne pas encore avoir été
-- appliquée sur cette base — on ignore silencieusement les tables absentes
-- plutôt que de faire échouer toute la migration, et on rattrapera le
-- trigger la prochaine fois que ce script sera relancé (idempotent).
do $$
declare
  protected_table text;
begin
  foreach protected_table in array array[
    'projects', 'tasks', 'project_events', 'project_documents',
    'project_members', 'task_assignees', 'task_checklist_items'
  ]
  loop
    if not exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = protected_table
    ) then
      continue;
    end if;

    execute format(
      'drop trigger if exists enforce_active_license_trigger on public.%I',
      protected_table
    );
    execute format(
      'create trigger enforce_active_license_trigger
         before insert or update or delete on public.%I
         for each row execute function public.enforce_active_license()',
      protected_table
    );
  end loop;
end $$;

-- ── 4. Table des paiements Stripe ────────────────────────────────────────
create table if not exists public.subscription_payments (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  stripe_subscription_id text,
  license_type text not null check (license_type in ('mensuelle', 'trimestrielle', 'semestrielle', 'annuelle')),
  amount_cents integer,
  currency text default 'xof',
  status text not null check (status in ('pending', 'succeeded', 'failed', 'refunded')) default 'pending',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

create index if not exists subscription_payments_org_id_idx on public.subscription_payments(organization_id);

alter table public.subscription_payments enable row level security;

-- Lecture : le DG/admin de l'organisation voit son propre historique de
-- paiement ; le super admin voit tout (audit/support).
drop policy if exists "Subscription Payments Read" on public.subscription_payments;
create policy "Subscription Payments Read" on public.subscription_payments
  for select to authenticated
  using (
    public.is_super_admin()
    or organization_id = public.user_org_id()
  );

-- Écriture : réservée au backend (service role, qui bypass RLS) — le client
-- ne doit jamais insérer/modifier une ligne de paiement directement, ce qui
-- se ferait forcément côté Server Action avec la clé Stripe secrète.
-- Aucune policy insert/update/delete n'est créée ici : RLS activée + zéro
-- policie d'écriture = tout accès non service-role est refusé par défaut.

-- ── 5. Notifications d'expiration programmées ────────────────────────────
-- Appelée par un cron (pg_cron si disponible, sinon une invocation externe
-- planifiée — ex. un Edge Function déclenché par un scheduler) une fois par
-- jour. Idempotente : ne renotifie pas un DG déjà notifié pour le même
-- palier (vérifie qu'aucune notification 'alert' avec ce lien exact
-- n'existe déjà pour l'organisation).
create or replace function public.notify_expiring_licenses()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  org record;
  dg record;
  days_left integer;
  milestone text;
begin
  for org in
    select id, name, expires_at, license_type
    from public.organizations
    where license_type <> 'definitive'
      and expires_at is not null
      and expires_at >= now()
      and expires_at <= now() + interval '30 days'
  loop
    days_left := ceil(extract(epoch from (org.expires_at - now())) / 86400);

    milestone := case
      when days_left <= 1 then 'J-1'
      when days_left <= 7 then 'J-7'
      when days_left <= 15 then 'J-15'
      when days_left <= 30 then 'J-30'
      else null
    end;

    if milestone is null then
      continue;
    end if;

    for dg in
      select id from public.profiles
      where organization_id = org.id and rbac_role in ('admin', 'executive')
    loop
      if not exists (
        select 1 from public.notifications
        where user_id = dg.id
          and link = '/settings?section=billing&milestone=' || milestone || '&org=' || org.id
      ) then
        insert into public.notifications (organization_id, user_id, type, title, content, link)
        values (
          org.id,
          dg.id,
          'alert',
          'Licence bientôt expirée',
          format('La licence de %s expire dans %s jour(s). Renouvelez pour éviter une interruption.', org.name, days_left),
          '/settings?section=billing&milestone=' || milestone || '&org=' || org.id
        );
      end if;
    end loop;
  end loop;

  -- Bascule les statuts stockés en cohérence avec expires_at, pour piloter
  -- l'UI (badge "Expire bientôt" / "Expirée") sans recalculer à l'affichage.
  update public.organizations
  set license_status = 'expire_bientot'
  where license_type <> 'definitive'
    and license_status = 'active'
    and expires_at is not null
    and expires_at <= now() + interval '7 days'
    and expires_at >= now();

  update public.organizations
  set license_status = 'expiree'
  where license_type <> 'definitive'
    and license_status <> 'expiree'
    and license_status <> 'suspendue'
    and expires_at is not null
    and expires_at < now();
end;
$$;

do $outer$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'notify-expiring-licenses-daily',
      '0 7 * * *',
      'select public.notify_expiring_licenses();'
    );
  end if;
exception when others then
  -- pg_cron non disponible sur ce projet Supabase (plan/tier) : la fonction
  -- reste appelable manuellement ou depuis un scheduler externe.
  null;
end $outer$;
