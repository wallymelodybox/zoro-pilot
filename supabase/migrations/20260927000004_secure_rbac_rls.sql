-- ISO-001: the legacy RBAC tables must never rely on default public grants.

alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;

revoke insert, update, delete on public.roles from anon, authenticated;
revoke insert, update, delete on public.permissions from anon, authenticated;
revoke insert, update, delete on public.role_permissions from anon, authenticated;

drop policy if exists "Authenticated role catalog read" on public.roles;
create policy "Authenticated role catalog read" on public.roles
  for select to authenticated using (true);

drop policy if exists "Authenticated permission catalog read" on public.permissions;
create policy "Authenticated permission catalog read" on public.permissions
  for select to authenticated using (true);

drop policy if exists "Authenticated role permissions read" on public.role_permissions;
create policy "Authenticated role permissions read" on public.role_permissions
  for select to authenticated using (true);

drop policy if exists "User roles isolated read" on public.user_roles;
create policy "User roles isolated read" on public.user_roles
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_super_admin()
    or (
      public.can_manage_org_projects()
      and exists (
        select 1 from public.profiles target
        where target.id = user_roles.user_id
          and target.organization_id = public.user_org_id()
      )
    )
  );

drop policy if exists "User roles organization manage" on public.user_roles;
create policy "User roles organization manage" on public.user_roles
  for all to authenticated
  using (
    public.can_manage_org_projects()
    and exists (
      select 1 from public.profiles target
      where target.id = user_roles.user_id
        and target.organization_id = public.user_org_id()
    )
  )
  with check (
    public.can_manage_org_projects()
    and exists (
      select 1 from public.profiles target
      where target.id = user_roles.user_id
        and target.organization_id = public.user_org_id()
    )
    and (
      user_roles.scope_id is null
      or exists (
        select 1 from public.projects p
        where p.id = user_roles.scope_id
          and p.organization_id = public.user_org_id()
      )
    )
  );
