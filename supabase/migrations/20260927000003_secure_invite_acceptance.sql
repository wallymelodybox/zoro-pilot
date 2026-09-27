-- ISO-004: accept an invitation atomically from the authenticated identity.
-- No caller-provided user id, email, role or organization is trusted.

create or replace function public.accept_invite(invite_token text, invitee_name text)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  selected_invite public.invites%rowtype;
  existing_org uuid;
begin
  if current_user_id is null or current_email = '' then
    raise exception 'Utilisateur non authentifié' using errcode = '42501';
  end if;

  select i.* into selected_invite
  from public.invites i
  where i.token = invite_token or i.invite_code = invite_token
  for update;

  if not found then
    raise exception 'Invitation introuvable' using errcode = 'P0002';
  end if;
  if selected_invite.is_used then
    raise exception 'Cette invitation a déjà été utilisée' using errcode = '23505';
  end if;
  if selected_invite.expires_at < now() then
    raise exception 'Cette invitation a expiré' using errcode = '22023';
  end if;
  if lower(trim(selected_invite.invited_email)) <> current_email then
    raise exception 'Cette invitation est destinée à une autre adresse email' using errcode = '42501';
  end if;

  select p.organization_id into existing_org
  from public.profiles p
  where p.id = current_user_id;

  if existing_org is not null and existing_org <> selected_invite.organization_id then
    raise exception 'Ce compte appartient déjà à une autre organisation' using errcode = '42501';
  end if;

  insert into public.profiles (id, email, name, role, rbac_role, organization_id)
  values (
    current_user_id,
    current_email,
    left(coalesce(nullif(trim(invitee_name), ''), split_part(current_email, '@', 1)), 120),
    selected_invite.role_assigned,
    selected_invite.rbac_role_assigned,
    selected_invite.organization_id
  )
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name,
    role = excluded.role,
    rbac_role = excluded.rbac_role,
    organization_id = excluded.organization_id;

  insert into public.organization_members (organization_id, profile_id, title)
  values (selected_invite.organization_id, current_user_id, selected_invite.role_assigned)
  on conflict (organization_id, profile_id) do update set title = excluded.title;

  update public.invites
  set is_used = true, used_at = now(), used_by = current_user_id
  where id = selected_invite.id;
end;
$$;

revoke all on function public.accept_invite(text, text) from public;
grant execute on function public.accept_invite(text, text) to authenticated;

-- Anonymous visitors need a minimal preview before signing up. Expose only
-- display fields, never the invite id, creator, assigned RBAC role or token.
create or replace function public.get_invite_preview(invite_token text)
returns table (
  invited_email text,
  organization_id uuid,
  organization_name text,
  role_assigned text,
  expires_at timestamp with time zone,
  is_used boolean
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select i.invited_email, i.organization_id, o.name, i.role_assigned, i.expires_at, i.is_used
  from public.invites i
  join public.organizations o on o.id = i.organization_id
  where i.token = invite_token or i.invite_code = invite_token
  limit 1
$$;

revoke all on function public.get_invite_preview(text) from public;
grant execute on function public.get_invite_preview(text) to anon, authenticated;
