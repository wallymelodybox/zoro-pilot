-- ============================================================
-- RLS: Isolation par organisation
-- Remplace les policies "Authenticated Read" using(true)
-- par un filtrage basé sur l'organisation de l'utilisateur.
-- ============================================================

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
-- Les utilisateurs ne voient que les profils de leur organisation
-- (+ le super admin voit tout via service_role)
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
-- Un utilisateur ne voit que sa propre organisation
do $$ begin
  create policy "Own Org Read" on organizations
    for select to authenticated
    using (
      id = public.user_org_id()
      or public.user_org_id() is null
    );
exception when duplicate_object then null; end $$;

-- ── DELETE policies ──
-- Seuls les propriétaires/assignés peuvent supprimer
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

