-- ============================================================
-- RLS: Isolation par organisation
-- 1. Ajoute organization_id sur profiles (lien direct)
-- 2. Ajoute organization_id sur teams
-- 3. Remplace les policies "Authenticated Read" using(true)
--    par un filtrage basé sur l'organisation de l'utilisateur.
-- ============================================================

-- ── Étape 0 : Ajouter organization_id aux tables qui en manquent ──
alter table public.profiles
  add column if not exists organization_id uuid references public.organizations(id);

alter table public.teams
  add column if not exists organization_id uuid references public.organizations(id);

-- Profils : lier aux orgs via organization_members (backfill existants)
update public.profiles p
set organization_id = om.organization_id
from public.organization_members om
where om.profile_id = p.id
  and p.organization_id is null;

-- Helper: récupérer l'organization_id de l'utilisateur connecté
create or replace function public.user_org_id()
returns uuid
language sql
stable
security definer
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

-- ── PROFILES ──
drop policy if exists "Authenticated Read" on profiles;
create policy "Org Scoped Read" on profiles
  for select to authenticated
  using (
    organization_id = public.user_org_id()
    or public.user_org_id() is null  -- super admin sans org
    or id = auth.uid()               -- toujours voir son propre profil
  );

-- ── PROJECTS ──
drop policy if exists "Authenticated Read" on projects;
create policy "Org Scoped Read" on projects
  for select to authenticated
  using (
    team_id in (
      select id from teams where organization_id = public.user_org_id()
    )
    or owner_id = auth.uid()
    or public.user_org_id() is null
  );

-- ── TASKS ──
drop policy if exists "Authenticated Read" on tasks;
create policy "Org Scoped Read" on tasks
  for select to authenticated
  using (
    project_id in (
      select id from projects where owner_id = auth.uid()
      union
      select p.id from projects p
        join teams t on p.team_id = t.id
        where t.organization_id = public.user_org_id()
    )
    or assignee_id = auth.uid()
    or public.user_org_id() is null
  );

-- ── OBJECTIVES ──
drop policy if exists "Authenticated Read" on objectives;
create policy "Org Scoped Read" on objectives
  for select to authenticated
  using (
    owner_id = auth.uid()
    or owner_id in (
      select id from profiles where organization_id = public.user_org_id()
    )
    or public.user_org_id() is null
  );

-- ── MESSAGES ──
drop policy if exists "Authenticated Read" on messages;
create policy "Org Scoped Read" on messages
  for select to authenticated
  using (
    sender_id = auth.uid()
    or channel_id in (
      select channel_id from channel_members where user_id = auth.uid()
    )
    or public.user_org_id() is null
  );

-- ── TEAMS ──
drop policy if exists "Authenticated Read" on teams;
create policy "Org Scoped Read" on teams
  for select to authenticated
  using (
    organization_id = public.user_org_id()
    or public.user_org_id() is null
  );

-- ── ORGANIZATIONS ──
do $$ begin
  create policy "Own Org Read" on organizations
    for select to authenticated
    using (
      id = public.user_org_id()
      or public.user_org_id() is null
    );
exception when duplicate_object then null; end $$;

-- ── DELETE policies ──
do $$ begin
  create policy "Owner Delete" on tasks
    for delete to authenticated
    using (assignee_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Owner Delete" on projects
    for delete to authenticated
    using (owner_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Owner Delete" on objectives
    for delete to authenticated
    using (owner_id = auth.uid());
exception when duplicate_object then null; end $$;

