-- Migration to update rbac_role check constraint to include super_admin
alter table public.profiles 
  drop constraint if exists profiles_rbac_role_check;

alter table public.profiles
  add constraint profiles_rbac_role_check 
  check (rbac_role in ('super_admin', 'admin', 'executive', 'manager', 'member', 'viewer'));
