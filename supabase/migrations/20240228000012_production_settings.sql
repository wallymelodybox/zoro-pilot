-- ============================================================
-- Migration: 20240228000012_production_settings.sql
-- ============================================================
-- Production settings support for /settings:
-- - persisted per-user notification preferences
-- - persisted organization groups
-- - organization update policy for DG/admin roles

create table if not exists public.user_settings (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  notification_daily_summary boolean not null default true,
  notification_assignments boolean not null default true,
  notification_push boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_settings enable row level security;

drop policy if exists "Users manage own settings" on public.user_settings;
create policy "Users manage own settings" on public.user_settings
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create table if not exists public.organization_groups (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (organization_id, name)
);

alter table public.organization_groups enable row level security;

create or replace function public.can_manage_org_settings()
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

create or replace function public.can_manage_org_members()
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

  return user_role in ('super_admin', 'admin', 'executive', 'manager');
end;
$$;

drop policy if exists "Org Settings Update" on public.organizations;
create policy "Org Settings Update" on public.organizations
  for update to authenticated
  using (
    id = public.user_org_id()
    and public.can_manage_org_settings()
  )
  with check (
    id = public.user_org_id()
    and public.can_manage_org_settings()
  );

drop policy if exists "Org Groups Read" on public.organization_groups;
create policy "Org Groups Read" on public.organization_groups
  for select to authenticated
  using (
    organization_id = public.user_org_id()
    or public.is_super_admin()
  );

drop policy if exists "Org Groups Insert" on public.organization_groups;
create policy "Org Groups Insert" on public.organization_groups
  for insert to authenticated
  with check (
    organization_id = public.user_org_id()
    and created_by = auth.uid()
    and public.can_manage_org_members()
  );

drop policy if exists "Org Groups Update" on public.organization_groups;
create policy "Org Groups Update" on public.organization_groups
  for update to authenticated
  using (
    organization_id = public.user_org_id()
    and public.can_manage_org_members()
  )
  with check (
    organization_id = public.user_org_id()
    and public.can_manage_org_members()
  );

drop policy if exists "Org Groups Delete" on public.organization_groups;
create policy "Org Groups Delete" on public.organization_groups
  for delete to authenticated
  using (
    organization_id = public.user_org_id()
    and public.can_manage_org_members()
  );
