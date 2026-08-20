-- Affine la restriction posée par 20260815000000_restrict_invite_admin_roles.sql.
-- Le rôle 'admin' (Admin Organisation) est désormais un rôle délégué avec des
-- droits réduits par rapport au DG (voir lib/roles.ts::isOwner). Le DG
-- ('executive') peut donc déléguer ce rôle par invitation, mais :
--   - un 'admin' existant ne peut pas en créer d'autres (seul le DG le peut) ;
--   - personne (sauf le super admin en back-office) ne peut créer une
--     invitation accordant 'executive' ou 'super_admin' — le compte DG/Owner
--     reste exclusivement créé via createDGAccount.
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
      -- Le super admin (back-office) peut tout créer.
      exists (
        select 1 from public.profiles
        where id = auth.uid() and rbac_role = 'super_admin'
      )
      or (
        -- 'executive'/'super_admin' restent réservés au back-office, jamais invitables.
        rbac_role_assigned not in ('executive', 'super_admin')
        and (
          -- Déléguer le rôle 'admin' est réservé au DG lui-même.
          rbac_role_assigned <> 'admin'
          or exists (
            select 1 from public.profiles
            where id = auth.uid() and rbac_role = 'executive'
          )
        )
      )
    )
  );
