-- Keep the web repository as the canonical Supabase schema for Programmes.
-- A programme is only a grouping layer: attaching a project to one must not
-- change who can see the project, its tasks, or its comments.

-- Supabase SQL Editor can accidentally launch the same query twice. Serialize
-- every execution of this migration: a second run waits here instead of each
-- transaction locking projects/programs/tasks in a different phase and
-- deadlocking. All statements below are idempotent and safe to retry after a
-- previous 40P01 rollback.
begin;
select pg_advisory_xact_lock(hashtextextended('zoro:programs-member-visibility:20260927', 0));
set local lock_timeout = '30s';

create table if not exists public.programs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  status text not null default 'on-track',
  image_url text,
  image_file_id text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.programs
  add column if not exists image_url text,
  add column if not exists image_file_id text;

alter table public.projects
  add column if not exists program_id uuid references public.programs(id) on delete set null,
  add column if not exists image_file_id text;

create index if not exists idx_programs_organization
  on public.programs(organization_id, created_at desc);

create index if not exists idx_projects_program
  on public.projects(program_id)
  where program_id is not null;

alter table public.programs enable row level security;

drop policy if exists "Programs organization read" on public.programs;
create policy "Programs organization read" on public.programs
  for select to authenticated
  using (
    organization_id = public.user_org_id()
    or public.is_super_admin()
  );

drop policy if exists "Programs organization insert" on public.programs;
create policy "Programs organization insert" on public.programs
  for insert to authenticated
  with check (
    organization_id = public.user_org_id()
    and created_by = auth.uid()
    and public.can_manage_org_projects()
  );

drop policy if exists "Programs organization update" on public.programs;
create policy "Programs organization update" on public.programs
  for update to authenticated
  using (
    organization_id = public.user_org_id()
    and public.can_manage_org_projects()
  )
  with check (
    organization_id = public.user_org_id()
    and public.can_manage_org_projects()
  );

drop policy if exists "Programs organization delete" on public.programs;
create policy "Programs organization delete" on public.programs
  for delete to authenticated
  using (
    organization_id = public.user_org_id()
    and public.is_org_owner()
  );

-- SECURITY DEFINER deliberately bypasses the projects/project_members RLS
-- cycle while retaining explicit organization and membership checks.
create or replace function public.can_view_project(target_project_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  proj_org uuid;
begin
  if target_project_id is null then
    return true;
  end if;

  select p.organization_id
    into proj_org
  from public.projects p
  where p.id = target_project_id;

  if proj_org is null then
    return false;
  end if;

  return
    public.is_super_admin()
    or (
      proj_org = public.user_org_id()
      and (
        public.can_manage_org_projects()
        or exists (
          select 1
          from public.project_members pm
          where pm.project_id = target_project_id
            and pm.profile_id = auth.uid()
        )
        or exists (
          select 1
          from public.projects owned
          where owned.id = target_project_id
            and owned.owner_id = auth.uid()
        )
      )
    );
end;
$$;

revoke all on function public.can_view_project(uuid) from public;
grant execute on function public.can_view_project(uuid) to authenticated;

drop policy if exists "Org Scoped Read" on public.projects;
create policy "Org Scoped Read" on public.projects
  for select to authenticated
  using (
    public.is_super_admin()
    or (
      organization_id = public.user_org_id()
      and public.can_view_project(id)
    )
  );

-- Restore multi-assignee access that was omitted by the later project
-- confidentiality migration. The project membership check remains required.
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
        select 1
        from public.task_assignees ta
        where ta.task_id = tasks.id
          and ta.profile_id = auth.uid()
      )
      or public.can_manage_org_tasks()
    )
    and public.can_view_project(project_id)
  );

-- The mobile app already uses task_comments; declaring it here prevents the
-- live schema and the canonical web migration history from drifting again.
create table if not exists public.task_comments (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists idx_task_comments_task_created
  on public.task_comments(task_id, created_at);

create index if not exists idx_task_comments_organization
  on public.task_comments(organization_id);

alter table public.task_comments enable row level security;

drop policy if exists "Task Comments Read" on public.task_comments;
create policy "Task Comments Read" on public.task_comments
  for select to authenticated
  using (
    organization_id = public.user_org_id()
    and exists (
      select 1
      from public.tasks t
      where t.id = task_comments.task_id
        and public.can_view_project(t.project_id)
        and (
          t.visibility = 'organization'
          or t.created_by = auth.uid()
          or t.assignee_id = auth.uid()
          or exists (
            select 1
            from public.task_assignees ta
            where ta.task_id = t.id
              and ta.profile_id = auth.uid()
          )
          or public.can_manage_org_tasks()
        )
    )
  );

drop policy if exists "Task Comments Insert" on public.task_comments;
create policy "Task Comments Insert" on public.task_comments
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and organization_id = public.user_org_id()
    and exists (
      select 1
      from public.tasks t
      where t.id = task_comments.task_id
        and t.organization_id = task_comments.organization_id
        and public.can_view_project(t.project_id)
    )
  );

drop policy if exists "Task Comments Delete" on public.task_comments;
create policy "Task Comments Delete" on public.task_comments
  for delete to authenticated
  using (
    organization_id = public.user_org_id()
    and (
      author_id = auth.uid()
      or public.can_manage_org_tasks()
    )
  );

commit;
