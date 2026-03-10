-- Migration to fix infinite recursion in RLS policies
-- The recursion occurs because user_org_id() and is_super_admin() query the profiles table,
-- while the profiles table policy calls these functions.

-- 1. Redefine user_org_id to avoid recursion.
-- We use SECURITY DEFINER and a specific search_path to bypass RLS.
create or replace function public.user_org_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  org_id uuid;
begin
  select organization_id into org_id from public.profiles where id = auth.uid();
  return org_id;
end;
$$;

-- 2. Redefine is_super_admin to avoid recursion
create or replace function public.is_super_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  is_admin boolean;
begin
  select (rbac_role = 'super_admin') into is_admin from public.profiles where id = auth.uid();
  return coalesce(is_admin, false);
end;
$$;

-- 3. Fix the profiles policy to break the recursion.
-- We use the helper functions which now safely bypass RLS.
drop policy if exists "Org Scoped Read" on public.profiles;
drop policy if exists "Users can read profiles in their organization" on public.profiles;
drop policy if exists "Profiles visibility" on public.profiles;

create policy "Profiles visibility" on public.profiles
  for select to authenticated
  using (
    -- Case 1: Always allow seeing your own profile (no function call needed)
    id = auth.uid()
    OR
    -- Case 2: Use helper functions that bypass RLS
    public.is_super_admin()
    OR
    organization_id = public.user_org_id()
  );
