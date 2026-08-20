-- 'admin' (Admin Organisation) est un rôle délégué distinct du DG/Owner
-- ('executive') — voir lib/roles.ts. Supprimer un projet entier reste une
-- action réservée au DG, pas déléguée à un admin d'organisation, même si
-- can_manage_org_projects() (qui inclut 'admin') reste utilisé pour les
-- opérations courantes (update, membres).
create or replace function public.is_org_owner()
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

  return user_role in ('super_admin', 'executive');
end;
$$;

drop policy if exists "DG Project Delete" on public.projects;
create policy "DG Project Delete" on public.projects
  for delete to authenticated
  using (
    organization_id = public.user_org_id()
    and public.is_org_owner()
  );
