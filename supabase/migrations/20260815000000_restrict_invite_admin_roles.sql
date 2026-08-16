-- Empêche un admin/executive d'organisation de créer une invitation qui accorde
-- un rôle admin/executive/super_admin (équivalent DG). Ces comptes ne doivent
-- être créés que depuis le back-office par le super admin (createDGAccount),
-- pas via le flux d'invitation d'équipe.
drop policy if exists "Org Admins can manage invites" on public.invites;

create policy "Org Admins can manage invites" on public.invites
  for all to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and rbac_role in ('admin', 'executive', 'super_admin')
      and (organization_id = public.invites.organization_id or rbac_role = 'super_admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and rbac_role in ('admin', 'executive', 'super_admin')
      and (organization_id = public.invites.organization_id or rbac_role = 'super_admin')
    )
    and (
      rbac_role_assigned not in ('admin', 'executive', 'super_admin')
      or exists (
        select 1 from public.profiles
        where id = auth.uid() and rbac_role = 'super_admin'
      )
    )
  );
