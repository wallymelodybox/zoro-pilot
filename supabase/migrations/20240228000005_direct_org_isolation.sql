-- Migration to strengthen data isolation by adding organization_id directly to all major entities.
-- This simplifies RLS and makes multi-tenancy more robust.

-- 1. Add organization_id to all major tables
alter table public.pillars add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.objectives add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.key_results add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.projects add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.tasks add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

-- 2. Backfill existing data if any (assuming they can be traced back through teams/owners)
update public.pillars p
set organization_id = prof.organization_id
from public.profiles prof
where p.organization_id is null; -- Fallback for pillars (usually created by admins)

update public.objectives o
set organization_id = prof.organization_id
from public.profiles prof
where o.owner_id = prof.id
  and o.organization_id is null;

update public.key_results kr
set organization_id = o.organization_id
from public.objectives o
where kr.objective_id = o.id
  and kr.organization_id is null;

update public.projects p
set organization_id = t.organization_id
from public.teams t
where p.team_id = t.id
  and p.organization_id is null;

update public.tasks t
set organization_id = p.organization_id
from public.projects p
where t.project_id = p.id
  and t.organization_id is null;

-- 3. Update RLS policies to use direct organization_id link
-- Helper already exists: public.user_org_id()

-- PILLARS
alter table public.pillars enable row level security;
drop policy if exists "Org Scoped Read" on public.pillars;
create policy "Org Scoped Read" on public.pillars
  for select to authenticated
  using (organization_id = public.user_org_id() or public.user_org_id() is null);

-- OBJECTIVES
drop policy if exists "Org Scoped Read" on public.objectives;
create policy "Org Scoped Read" on public.objectives
  for select to authenticated
  using (organization_id = public.user_org_id() or public.user_org_id() is null);

-- KEY RESULTS
alter table public.key_results enable row level security;
drop policy if exists "Org Scoped Read" on public.key_results;
create policy "Org Scoped Read" on public.key_results
  for select to authenticated
  using (organization_id = public.user_org_id() or public.user_org_id() is null);

-- PROJECTS
drop policy if exists "Org Scoped Read" on public.projects;
create policy "Org Scoped Read" on public.projects
  for select to authenticated
  using (organization_id = public.user_org_id() or public.user_org_id() is null);

-- TASKS
drop policy if exists "Org Scoped Read" on public.tasks;
create policy "Org Scoped Read" on public.tasks
  for select to authenticated
  using (organization_id = public.user_org_id() or public.user_org_id() is null);

-- CHANNELS (already has organization_id)
drop policy if exists "Org Scoped Read" on public.channels;
create policy "Org Scoped Read" on public.channels
  for select to authenticated
  using (organization_id = public.user_org_id() or public.user_org_id() is null);
