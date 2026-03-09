-- Migration to add organization_id and onboarding_completed to profiles
alter table public.profiles
  add column if not exists organization_id uuid references public.organizations(id),
  add column if not exists onboarding_completed boolean default false;

-- Add RLS policy for profiles based on organization_id
-- Users can only read profiles within their own organization
create policy "Users can read profiles in their organization" on public.profiles
  for select to authenticated
  using (
    organization_id = (select organization_id from public.profiles where id = auth.uid())
    or rbac_role = 'super_admin'
  );
