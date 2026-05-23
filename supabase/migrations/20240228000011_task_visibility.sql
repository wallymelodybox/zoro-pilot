-- ============================================================
-- Migration: 20240228000011_task_visibility.sql
-- ============================================================
-- Task ownership + visibility:
-- - organization members can create private tasks for themselves
-- - DG/admin/executive can assign tasks to any member of their organization
-- - visibility controls whether a task is private or visible to the organization

alter table public.tasks
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists visibility text check (visibility in ('private', 'organization')) default 'private';

update public.tasks
set created_by = coalesce(created_by, assignee_id);

update public.tasks
set visibility = 'private'
where visibility is null;

create or replace function public.can_manage_org_tasks()
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

create or replace function public.profile_belongs_to_user_org(profile_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  profile_org uuid;
begin
  select organization_id into profile_org
  from public.profiles
  where id = profile_id;

  return profile_org = public.user_org_id() or public.is_super_admin();
end;
$$;

drop policy if exists "Authenticated Insert" on public.tasks;
drop policy if exists "Org Scoped Read" on public.tasks;
drop policy if exists "Org Scoped Insert" on public.tasks;
drop policy if exists "Org Scoped Update" on public.tasks;
drop policy if exists "Owner Delete" on public.tasks;

create policy "Task visibility read" on public.tasks
  for select to authenticated
  using (
    organization_id = public.user_org_id()
    and (
      visibility = 'organization'
      or created_by = auth.uid()
      or assignee_id = auth.uid()
      or public.can_manage_org_tasks()
    )
  );

create policy "Task org insert" on public.tasks
  for insert to authenticated
  with check (
    organization_id = public.user_org_id()
    and created_by = auth.uid()
    and (
      (
        public.can_manage_org_tasks()
        and visibility in ('private', 'organization')
        and public.profile_belongs_to_user_org(assignee_id)
      )
      or (
        not public.can_manage_org_tasks()
        and visibility = 'private'
        and assignee_id = auth.uid()
      )
    )
  );

create policy "Task allowed update" on public.tasks
  for update to authenticated
  using (
    organization_id = public.user_org_id()
    and (
      created_by = auth.uid()
      or assignee_id = auth.uid()
      or public.can_manage_org_tasks()
    )
  )
  with check (
    organization_id = public.user_org_id()
    and (
      created_by = auth.uid()
      or assignee_id = auth.uid()
      or public.can_manage_org_tasks()
    )
  );

create policy "Task allowed delete" on public.tasks
  for delete to authenticated
  using (
    organization_id = public.user_org_id()
    and (
      created_by = auth.uid()
      or assignee_id = auth.uid()
      or public.can_manage_org_tasks()
    )
  );
