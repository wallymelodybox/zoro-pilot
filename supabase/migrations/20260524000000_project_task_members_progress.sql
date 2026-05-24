-- ============================================================
-- Migration: 20260524000000_project_task_members_progress.sql
-- ============================================================
-- Project/task production rules:
-- - Only DG-level roles can update/delete organization projects.
-- - DG-level roles can assign multiple members to projects and tasks.
-- - Tasks have their own progress value; project progress is derived in app
--   from task progress when tasks exist.

alter table public.tasks
  add column if not exists progress integer default 0 check (progress >= 0 and progress <= 100);

update public.tasks
set progress = case
  when status = 'done' then 100
  when status = 'in-progress' and coalesce(progress, 0) = 0 then 50
  else coalesce(progress, 0)
end;

create table if not exists public.project_members (
  organization_id uuid references public.organizations(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'member' check (role in ('owner', 'manager', 'member', 'observer')),
  added_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (project_id, profile_id)
);

create table if not exists public.task_assignees (
  organization_id uuid references public.organizations(id) on delete cascade not null,
  task_id uuid references public.tasks(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (task_id, profile_id)
);

insert into public.project_members (organization_id, project_id, profile_id, role, added_by)
select organization_id, id, owner_id, 'owner', owner_id
from public.projects
where organization_id is not null and owner_id is not null
on conflict (project_id, profile_id) do nothing;

insert into public.task_assignees (organization_id, task_id, profile_id, assigned_by)
select organization_id, id, assignee_id, created_by
from public.tasks
where organization_id is not null and assignee_id is not null
on conflict (task_id, profile_id) do nothing;

create or replace function public.can_manage_org_projects()
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  user_role text;
begin
  select rbac_role into user_role
  from public.profiles
  where id = auth.uid();

  return user_role in ('super_admin', 'admin', 'executive');
end;
$$;

alter table public.project_members enable row level security;
alter table public.task_assignees enable row level security;

drop policy if exists "DG Project Update" on public.projects;
create policy "DG Project Update" on public.projects
  for update to authenticated
  using (
    organization_id = public.user_org_id()
    and public.can_manage_org_projects()
  )
  with check (
    organization_id = public.user_org_id()
    and public.can_manage_org_projects()
  );

drop policy if exists "Owner Delete" on public.projects;
drop policy if exists "DG Project Delete" on public.projects;
create policy "DG Project Delete" on public.projects
  for delete to authenticated
  using (
    organization_id = public.user_org_id()
    and public.can_manage_org_projects()
  );

drop policy if exists "Project Members Read" on public.project_members;
create policy "Project Members Read" on public.project_members
  for select to authenticated
  using (organization_id = public.user_org_id() or public.is_super_admin());

drop policy if exists "Project Members Manage" on public.project_members;
create policy "Project Members Manage" on public.project_members
  for all to authenticated
  using (
    organization_id = public.user_org_id()
    and public.can_manage_org_projects()
  )
  with check (
    organization_id = public.user_org_id()
    and public.can_manage_org_projects()
    and public.profile_belongs_to_user_org(profile_id)
  );

drop policy if exists "Task Assignees Read" on public.task_assignees;
create policy "Task Assignees Read" on public.task_assignees
  for select to authenticated
  using (organization_id = public.user_org_id() or public.is_super_admin());

drop policy if exists "Task Assignees Manage" on public.task_assignees;
create policy "Task Assignees Manage" on public.task_assignees
  for all to authenticated
  using (
    organization_id = public.user_org_id()
    and (
      public.can_manage_org_tasks()
      or profile_id = auth.uid()
      or assigned_by = auth.uid()
    )
  )
  with check (
    organization_id = public.user_org_id()
    and (
      (
        public.can_manage_org_tasks()
        and public.profile_belongs_to_user_org(profile_id)
      )
      or (
        profile_id = auth.uid()
        and assigned_by = auth.uid()
      )
    )
  );

drop policy if exists "Task visibility read" on public.tasks;
create policy "Task visibility read" on public.tasks
  for select to authenticated
  using (
    organization_id = public.user_org_id()
    and (
      visibility = 'organization'
      or created_by = auth.uid()
      or assignee_id = auth.uid()
      or exists (
        select 1 from public.task_assignees ta
        where ta.task_id = public.tasks.id
        and ta.profile_id = auth.uid()
      )
      or public.can_manage_org_tasks()
    )
  );

create index if not exists idx_project_members_org_project
  on public.project_members(organization_id, project_id);

create index if not exists idx_project_members_profile
  on public.project_members(profile_id);

create index if not exists idx_task_assignees_org_task
  on public.task_assignees(organization_id, task_id);

create index if not exists idx_task_assignees_profile
  on public.task_assignees(profile_id);
