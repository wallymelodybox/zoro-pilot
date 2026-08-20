-- ============================================================
-- Migration: 20260821000002_project_membership_confidentiality.sql
-- ============================================================
-- Vision ZP section 11 : confidentialité Projet↔Projet. Jusqu'ici, tout
-- membre d'une organisation pouvait lire tous les projets/tâches/réunions/
-- documents de l'org, indépendamment de son appartenance au projet
-- (project_members). Cette migration introduit un vrai filtrage :
--   - DG ('executive') et Admin Organisation ('admin') continuent de tout
--     voir dans leur organisation (can_manage_org_projects()).
--   - manager/member/viewer ne voient que les projets où ils figurent dans
--     project_members (ou en sont owner_id), et le contenu qui en dépend
--     (tâches, réunions, documents).
-- Les policies d'écriture (insert/update/delete) ne changent pas ici.

create or replace function public.can_view_project(target_project_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  proj_org uuid;
begin
  if target_project_id is null then
    return true; -- content not attached to any project is governed elsewhere
  end if;

  select organization_id into proj_org
  from public.projects
  where id = target_project_id;

  if proj_org is null then
    return false;
  end if;

  return
    public.is_super_admin()
    or (proj_org = public.user_org_id() and public.can_manage_org_projects())
    or exists (
      select 1 from public.project_members pm
      where pm.project_id = target_project_id and pm.profile_id = auth.uid()
    )
    or exists (
      select 1 from public.projects p
      where p.id = target_project_id and p.owner_id = auth.uid()
    );
end;
$$;

-- ── PROJECTS ────────────────────────────────────────────────────────────
drop policy if exists "Org Scoped Read" on public.projects;
create policy "Org Scoped Read" on public.projects
  for select to authenticated
  using (
    public.is_super_admin()
    or (organization_id = public.user_org_id() and public.can_view_project(id))
  );

-- ── TASKS ───────────────────────────────────────────────────────────────
-- Layered on top of the existing visibility rules (private/organization,
-- creator/assignee, can_manage_org_tasks) rather than replacing them: a task
-- must still satisfy those AND belong to a project the user can see (tasks
-- with no project_id are unaffected by the project filter).
drop policy if exists "Task visibility read" on public.tasks;
create policy "Task visibility read" on public.tasks
  for select to authenticated
  using (
    organization_id = public.user_org_id()
    and (
      visibility = 'organization'
      or created_by = auth.uid()
      or assignee_id = auth.uid()
      or public.can_manage_org_tasks()
    )
    and public.can_view_project(project_id)
  );

-- ── PROJECT EVENTS (réunions, échéances, jalons) ──────────────────────────
drop policy if exists "Project Events Read" on public.project_events;
create policy "Project Events Read" on public.project_events
  for select to authenticated
  using (
    (organization_id = public.user_org_id() and public.can_view_project(project_id))
    or public.is_super_admin()
  );

-- ── PROJECT DOCUMENTS ──────────────────────────────────────────────────
drop policy if exists "Project Documents Read" on public.project_documents;
create policy "Project Documents Read" on public.project_documents
  for select to authenticated
  using (
    (organization_id = public.user_org_id() and public.can_view_project(project_id))
    or public.is_super_admin()
  );
