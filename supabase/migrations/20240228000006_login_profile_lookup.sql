-- Fonction sécurisée pour le login : récupère le profil de l'utilisateur connecté
-- en bypassant les RLS (SECURITY DEFINER). Appelée uniquement par ensureProfile().
create or replace function public.get_my_profile()
returns table (
  id uuid,
  organization_id uuid,
  rbac_role text
)
language sql
stable
security definer
as $$
  select id, organization_id, rbac_role
  from public.profiles
  where id = auth.uid()
  limit 1;
$$;

-- Fonction pour récupérer l'organization_id depuis organization_members
-- pour l'auto-réparation des profils DG sans org.
create or replace function public.get_my_org_from_members()
returns uuid
language sql
stable
security definer
as $$
  select organization_id
  from public.organization_members
  where profile_id = auth.uid()
  limit 1;
$$;
