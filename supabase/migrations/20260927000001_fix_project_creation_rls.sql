-- Restore project creation after organization-scoped RLS hardening.
-- The mobile and web clients both provide the authenticated user as owner_id
-- and the organization attached to that user's profile.

alter table public.projects enable row level security;

-- Remove the historical owner-only policy so the effective rule is explicit
-- and cannot accept a project for another organization.
drop policy if exists "Authenticated Insert" on public.projects;
drop policy if exists "Org Scoped Insert" on public.projects;

create policy "Org Scoped Insert" on public.projects
  for insert to authenticated
  with check (
    auth.uid() is not null
    and owner_id = auth.uid()
    and organization_id = public.user_org_id()
    and public.can_manage_org_projects()
  );

comment on policy "Org Scoped Insert" on public.projects is
  'Allows authenticated members to create projects only in their own organization and as themselves.';

-- createProject() immediately records the creator in project_members. Keep
-- the broader manager policy intact, while allowing this one self-membership
-- insert for users who have just created their own project.
alter table public.project_members enable row level security;

drop policy if exists "Project Creator Membership Insert" on public.project_members;
create policy "Project Creator Membership Insert" on public.project_members
  for insert to authenticated
  with check (
    organization_id = public.user_org_id()
    and profile_id = auth.uid()
    and added_by = auth.uid()
    and role = 'owner'
    and public.can_manage_org_projects()
    and exists (
      select 1
      from public.projects p
      where p.id = project_members.project_id
        and p.organization_id = project_members.organization_id
        and p.owner_id = auth.uid()
    )
  );
