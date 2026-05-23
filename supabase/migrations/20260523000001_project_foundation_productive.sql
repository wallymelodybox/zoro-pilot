-- ============================================================
-- Migration: 20260523000001_project_foundation_productive.sql
-- ============================================================
-- Foundation Productive: project agenda + documents.
-- These tables power the project cockpit without mock data or AI.

create table if not exists public.project_events (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  type text not null check (type in ('meeting', 'deadline', 'milestone', 'reminder', 'event')),
  starts_at timestamp with time zone not null,
  ends_at timestamp with time zone,
  location text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.project_documents (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  url text not null,
  version text default 'v1',
  file_type text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.project_events enable row level security;
alter table public.project_documents enable row level security;

drop policy if exists "Project Events Read" on public.project_events;
create policy "Project Events Read" on public.project_events
  for select to authenticated
  using (organization_id = public.user_org_id() or public.is_super_admin());

drop policy if exists "Project Events Insert" on public.project_events;
create policy "Project Events Insert" on public.project_events
  for insert to authenticated
  with check (
    organization_id = public.user_org_id()
    and created_by = auth.uid()
  );

drop policy if exists "Project Events Update" on public.project_events;
create policy "Project Events Update" on public.project_events
  for update to authenticated
  using (
    organization_id = public.user_org_id()
    and (created_by = auth.uid() or public.can_manage_org_tasks())
  )
  with check (
    organization_id = public.user_org_id()
    and (created_by = auth.uid() or public.can_manage_org_tasks())
  );

drop policy if exists "Project Documents Read" on public.project_documents;
create policy "Project Documents Read" on public.project_documents
  for select to authenticated
  using (organization_id = public.user_org_id() or public.is_super_admin());

drop policy if exists "Project Documents Insert" on public.project_documents;
create policy "Project Documents Insert" on public.project_documents
  for insert to authenticated
  with check (
    organization_id = public.user_org_id()
    and created_by = auth.uid()
  );

drop policy if exists "Project Documents Update" on public.project_documents;
create policy "Project Documents Update" on public.project_documents
  for update to authenticated
  using (
    organization_id = public.user_org_id()
    and (created_by = auth.uid() or public.can_manage_org_tasks())
  )
  with check (
    organization_id = public.user_org_id()
    and (created_by = auth.uid() or public.can_manage_org_tasks())
  );

create index if not exists idx_project_events_org_project_start
  on public.project_events(organization_id, project_id, starts_at);

create index if not exists idx_project_documents_org_project
  on public.project_documents(organization_id, project_id, created_at desc);
