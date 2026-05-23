-- ============================================================
-- Migration: 20260523000000_profiles_org_update_policy.sql
-- ============================================================
-- Allow organization managers (DG/admin/manager) to update profiles

drop policy if exists "Org Admin Update Profiles" on public.profiles;

create policy "Org Admin Update Profiles" on public.profiles
  for update to authenticated
  using (
    organization_id = public.user_org_id()
    and public.can_manage_org_members()
  )
  with check (
    organization_id = public.user_org_id()
    and public.can_manage_org_members()
  );

-- Note: this policy allows org-level managers (as defined by
-- public.can_manage_org_members()) to update profiles within their
-- organization. Fields that can be updated are still constrained by
-- application logic; consider tightening the with check expression
-- to restrict which columns can be modified if necessary.
