-- Les comptes créés comme « Directeur Général » par le back-office étaient
-- historiquement enregistrés avec le rôle délégué `admin`. Le rôle propriétaire
-- attendu par les politiques sensibles (dont la suppression de projets) est
-- `executive`. Ne convertir que les vrais DG afin de préserver les admins délégués.
update public.profiles
set rbac_role = 'executive'
where rbac_role = 'admin'
  and lower(trim(coalesce(role, ''))) in ('directeur général', 'directeur general', 'dg', 'propriétaire', 'proprietaire');
