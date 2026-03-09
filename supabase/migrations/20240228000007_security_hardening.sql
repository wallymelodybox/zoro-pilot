-- ============================================================
-- Security Hardening Migration
-- 1. Replace "user_org_id() is null" bypass with super_admin check
-- 2. Restrict invites SELECT to org members only
-- 3. Remove demo open INSERT policies on organizations/organization_members
-- ============================================================

-- Helper: check if current user is super_admin
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and rbac_role = 'super_admin'
  );
$$;

-- ══════════════════════════════════════════════════════════════
-- PROFILES: replace user_org_id() is null with is_super_admin()
-- ══════════════════════════════════════════════════════════════
drop policy if exists "Org Scoped Read" on profiles;
create policy "Org Scoped Read" on profiles
  for select to authenticated
  using (
    organization_id = public.user_org_id()
    or public.is_super_admin()
    or id = auth.uid()
  );

-- ══════════════════════════════════════════════════════════════
-- PROJECTS: replace user_org_id() is null with is_super_admin()
-- ══════════════════════════════════════════════════════════════
drop policy if exists "Org Scoped Read" on projects;
create policy "Org Scoped Read" on projects
  for select to authenticated
  using (
    team_id in (
      select id from teams where organization_id = public.user_org_id()
    )
    or owner_id = auth.uid()
    or public.is_super_admin()
  );

-- ══════════════════════════════════════════════════════════════
-- TASKS: replace user_org_id() is null with is_super_admin()
-- ══════════════════════════════════════════════════════════════
drop policy if exists "Org Scoped Read" on tasks;
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
    or public.is_super_admin()
  );

-- ══════════════════════════════════════════════════════════════
-- OBJECTIVES: replace user_org_id() is null with is_super_admin()
-- ══════════════════════════════════════════════════════════════
drop policy if exists "Org Scoped Read" on objectives;
create policy "Org Scoped Read" on objectives
  for select to authenticated
  using (
    owner_id = auth.uid()
    or owner_id in (
      select id from profiles where organization_id = public.user_org_id()
    )
    or public.is_super_admin()
  );

-- ══════════════════════════════════════════════════════════════
-- MESSAGES: replace user_org_id() is null with is_super_admin()
-- ══════════════════════════════════════════════════════════════
drop policy if exists "Org Scoped Read" on messages;
create policy "Org Scoped Read" on messages
  for select to authenticated
  using (
    sender_id = auth.uid()
    or channel_id in (
      select channel_id from channel_members where user_id = auth.uid()
    )
    or public.is_super_admin()
  );

-- ══════════════════════════════════════════════════════════════
-- TEAMS: replace user_org_id() is null with is_super_admin()
-- ══════════════════════════════════════════════════════════════
drop policy if exists "Org Scoped Read" on teams;
create policy "Org Scoped Read" on teams
  for select to authenticated
  using (
    organization_id = public.user_org_id()
    or public.is_super_admin()
  );

-- ══════════════════════════════════════════════════════════════
-- ORGANIZATIONS: replace user_org_id() is null with is_super_admin()
-- ══════════════════════════════════════════════════════════════
drop policy if exists "Own Org Read" on organizations;
drop policy if exists "Public Read" on organizations;
create policy "Org Scoped Read" on organizations
  for select to authenticated
  using (
    id = public.user_org_id()
    or public.is_super_admin()
  );

-- Remove demo open INSERT on organizations
drop policy if exists "Public Insert" on organizations;

-- ══════════════════════════════════════════════════════════════
-- ORGANIZATION_MEMBERS: remove demo policies, add proper ones
-- ══════════════════════════════════════════════════════════════
drop policy if exists "Public Read" on organization_members;
drop policy if exists "Public Insert" on organization_members;

create policy "Org Scoped Read" on organization_members
  for select to authenticated
  using (
    organization_id = public.user_org_id()
    or public.is_super_admin()
  );

-- ══════════════════════════════════════════════════════════════
-- INVITES: restrict SELECT to org admins only (remove public read)
-- ══════════════════════════════════════════════════════════════
drop policy if exists "Anyone can read valid invite by token" on invites;

-- Invites are only read server-side via ensureProfile (which uses the
-- authenticated user's session). The user only needs to read invites
-- for their own email during login.
create policy "Users can read own invites" on invites
  for select to authenticated
  using (
    invited_email = (select email from auth.users where id = auth.uid())
    or public.is_super_admin()
    or exists (
      select 1 from public.profiles
      where id = auth.uid()
      and rbac_role in ('admin', 'executive')
      and organization_id = invites.organization_id
    )
  );
