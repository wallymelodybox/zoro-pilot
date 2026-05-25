-- ============================================================
-- Migration: 20260525000000_commissions_sub_projects.sql
-- ============================================================
-- Adds operational commissions through teams and project hierarchy.

alter table public.projects
  add column if not exists parent_project_id uuid references public.projects(id) on delete cascade;

alter table public.teams
  add column if not exists type text default 'team' check (type in ('team', 'commission'));

drop policy if exists "Teams DG Insert" on public.teams;
create policy "Teams DG Insert" on public.teams
  for insert to authenticated
  with check (
    organization_id = public.user_org_id()
    and public.can_manage_org_projects()
  );

drop policy if exists "Teams DG Update" on public.teams;
create policy "Teams DG Update" on public.teams
  for update to authenticated
  using (
    organization_id = public.user_org_id()
    and public.can_manage_org_projects()
  )
  with check (
    organization_id = public.user_org_id()
    and public.can_manage_org_projects()
  );

create index if not exists idx_projects_parent_project
  on public.projects(parent_project_id);

create index if not exists idx_teams_org_type
  on public.teams(organization_id, type);
