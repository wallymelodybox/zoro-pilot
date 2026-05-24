-- ============================================================
-- Migration: 20231231000000_initial_schema.sql
-- ============================================================
-- Initial schema required before the incremental migrations.
-- This mirrors the legacy root-level supabase-schema.sql so a completely
-- empty Supabase project can be rebuilt by running migrations in order.

create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. USERS & TEAMS
-- ==========================================

create table teams (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  parent_team_id uuid references teams(id),
  manager_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table profiles (
  id uuid primary key,
  email text unique not null,
  name text not null,
  role text not null,
  avatar_url text,
  team_id uuid references teams(id),
  rbac_role text not null check (rbac_role in ('admin', 'executive', 'manager', 'member', 'viewer')),
  manager_id uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table teams add constraint teams_manager_id_fkey foreign key (manager_id) references profiles(id);

-- ==========================================
-- 2. STRATEGY (Pillars, Objectives, KRs)
-- ==========================================

create table pillars (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  color text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table objectives (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  pillar_id uuid references pillars(id),
  owner_id uuid references profiles(id),
  period text not null,
  progress integer default 0,
  confidence text check (confidence in ('on-track', 'at-risk', 'off-track')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table key_results (
  id uuid default uuid_generate_v4() primary key,
  objective_id uuid references objectives(id) on delete cascade,
  title text not null,
  type text check (type in ('metric', 'initiative', 'manual')),
  target_value numeric not null,
  current_value numeric not null default 0,
  unit text not null,
  weight integer not null default 1,
  confidence text check (confidence in ('on-track', 'at-risk', 'off-track')),
  owner_id uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table okr_checkins (
  id uuid default uuid_generate_v4() primary key,
  key_result_id uuid references key_results(id) on delete cascade,
  date date not null default current_date,
  progress_delta numeric not null,
  confidence text check (confidence in ('on-track', 'at-risk', 'off-track')),
  note text,
  blocker text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 3. EXECUTION (Projects, Tasks)
-- ==========================================

create table projects (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  team_id uuid references teams(id),
  owner_id uuid references profiles(id),
  status text check (status in ('on-track', 'at-risk', 'off-track')),
  start_date date,
  end_date date,
  progress integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table project_objectives (
  project_id uuid references projects(id) on delete cascade,
  objective_id uuid references objectives(id) on delete cascade,
  primary key (project_id, objective_id)
);

create table project_key_results (
  project_id uuid references projects(id) on delete cascade,
  key_result_id uuid references key_results(id) on delete cascade,
  primary key (project_id, key_result_id)
);

create table tasks (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  assignee_id uuid references profiles(id),
  status text check (status in ('todo', 'in-progress', 'blocked', 'done')),
  priority text check (priority in ('low', 'medium', 'high', 'urgent')),
  due_date date,
  linked_kr_id uuid references key_results(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 4. COLLABORATION (Chat)
-- ==========================================

create table channels (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text check (type in ('public', 'private', 'dm', 'context')),
  context_id uuid,
  context_type text check (context_type in ('objective', 'project', 'task')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table channel_members (
  channel_id uuid references channels(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (channel_id, user_id)
);

create table messages (
  id uuid default uuid_generate_v4() primary key,
  channel_id uuid references channels(id) on delete cascade,
  sender_id uuid references profiles(id),
  content text not null,
  type text check (type in ('text', 'system', 'file')),
  reply_to_id uuid references messages(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 5. RLS POLICIES (demo defaults, hardened later)
-- ==========================================

alter table profiles enable row level security;
alter table teams enable row level security;
alter table objectives enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table messages enable row level security;

create policy "Public Read" on profiles for select using (true);
create policy "Public Read" on teams for select using (true);
create policy "Public Read" on objectives for select using (true);
create policy "Public Read" on projects for select using (true);
create policy "Public Read" on tasks for select using (true);
create policy "Public Read" on messages for select using (true);

create policy "Public Insert" on projects for insert with check (true);
create policy "Public Insert" on tasks for insert with check (true);
create policy "Public Insert" on objectives for insert with check (true);
create policy "Public Insert" on okr_checkins for insert with check (true);
create policy "Public Insert" on messages for insert with check (true);

-- ============================================================
-- Migration: 20240101000000_rbac_setup.sql
-- ============================================================
-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('organization', 'project')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, scope)
);

-- 2. Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL UNIQUE, -- e.g., 'create_project', 'delete_task'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

-- 4. Create user_roles table
-- Note: user_id typically references auth.users(id). 
-- For this setup, we'll assume a public.users table exists or just store the UUID if using auth directly.
-- If you have a users table in public, uncomment the reference.
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  scope_id UUID, -- NULL for organization global scope, project_id for project scope
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role_id, scope_id)
);

-- 5. Seed Data (Roles & Permissions)
DO $$
DECLARE
  -- Role IDs
  owner_role_id UUID;
  admin_role_id UUID;
  manager_org_role_id UUID;
  executor_org_role_id UUID;
  observer_org_role_id UUID;
  
  manager_proj_role_id UUID;
  executor_proj_role_id UUID;
  observer_proj_role_id UUID;

  -- Permission IDs
  perm_manage_org UUID;
  perm_create_project UUID;
  perm_delete_project UUID;
  perm_create_task UUID;
  perm_edit_task UUID;
  perm_delete_task UUID;
  perm_view_data UUID;
BEGIN
  -- Create Organization Roles
  INSERT INTO roles (name, scope, description) VALUES ('Propriétaire', 'organization', 'Accès total') RETURNING id INTO owner_role_id;
  INSERT INTO roles (name, scope, description) VALUES ('Admin', 'organization', 'Administration globale') RETURNING id INTO admin_role_id;
  INSERT INTO roles (name, scope, description) VALUES ('Manager', 'organization', 'Gestion opérationnelle') RETURNING id INTO manager_org_role_id;
  INSERT INTO roles (name, scope, description) VALUES ('Exécutant', 'organization', 'Production') RETURNING id INTO executor_org_role_id;
  INSERT INTO roles (name, scope, description) VALUES ('Observateur', 'organization', 'Lecture seule') RETURNING id INTO observer_org_role_id;

  -- Create Project Roles
  INSERT INTO roles (name, scope, description) VALUES ('Manager', 'project', 'Chef de projet') RETURNING id INTO manager_proj_role_id;
  INSERT INTO roles (name, scope, description) VALUES ('Exécutant', 'project', 'Membre du projet') RETURNING id INTO executor_proj_role_id;
  INSERT INTO roles (name, scope, description) VALUES ('Observateur', 'project', 'Invité') RETURNING id INTO observer_proj_role_id;

  -- Create Permissions
  INSERT INTO permissions (action, description) VALUES ('manage_organization', 'Gérer l''organisation') RETURNING id INTO perm_manage_org;
  INSERT INTO permissions (action, description) VALUES ('create_project', 'Créer des projets') RETURNING id INTO perm_create_project;
  INSERT INTO permissions (action, description) VALUES ('delete_project', 'Supprimer des projets') RETURNING id INTO perm_delete_project;
  INSERT INTO permissions (action, description) VALUES ('create_task', 'Créer des tâches') RETURNING id INTO perm_create_task;
  INSERT INTO permissions (action, description) VALUES ('edit_task', 'Modifier des tâches') RETURNING id INTO perm_edit_task;
  INSERT INTO permissions (action, description) VALUES ('delete_task', 'Supprimer des tâches') RETURNING id INTO perm_delete_task;
  INSERT INTO permissions (action, description) VALUES ('view_data', 'Voir les données') RETURNING id INTO perm_view_data;

  -- Assign Permissions to Roles (Examples)
  
  -- Owner: All permissions (conceptually, usually handled by checking role name or specific super-admin flag, but let's add specific ones)
  INSERT INTO role_permissions (role_id, permission_id) VALUES (owner_role_id, perm_manage_org);
  INSERT INTO role_permissions (role_id, permission_id) VALUES (owner_role_id, perm_create_project);
  INSERT INTO role_permissions (role_id, permission_id) VALUES (owner_role_id, perm_delete_project);
  INSERT INTO role_permissions (role_id, permission_id) VALUES (owner_role_id, perm_view_data);

  -- Admin: Create projects, view data
  INSERT INTO role_permissions (role_id, permission_id) VALUES (admin_role_id, perm_create_project);
  INSERT INTO role_permissions (role_id, permission_id) VALUES (admin_role_id, perm_view_data);

  -- Project Manager: Create/Edit/Delete tasks in their project
  INSERT INTO role_permissions (role_id, permission_id) VALUES (manager_proj_role_id, perm_create_task);
  INSERT INTO role_permissions (role_id, permission_id) VALUES (manager_proj_role_id, perm_edit_task);
  INSERT INTO role_permissions (role_id, permission_id) VALUES (manager_proj_role_id, perm_delete_task);
  INSERT INTO role_permissions (role_id, permission_id) VALUES (manager_proj_role_id, perm_view_data);

  -- Project Executor: Create/Edit tasks
  INSERT INTO role_permissions (role_id, permission_id) VALUES (executor_proj_role_id, perm_create_task);
  INSERT INTO role_permissions (role_id, permission_id) VALUES (executor_proj_role_id, perm_edit_task);
  INSERT INTO role_permissions (role_id, permission_id) VALUES (executor_proj_role_id, perm_view_data);

  -- Project Observer: View only
  INSERT INTO role_permissions (role_id, permission_id) VALUES (observer_proj_role_id, perm_view_data);

END $$;

-- ============================================================
-- Migration: 20240226000000_add_task_description.sql
-- ============================================================
-- Migration to add description to tasks table
alter table tasks add column if not exists description text;

-- ============================================================
-- Migration: 20240226000001_harden_rls.sql
-- ============================================================
-- Migration to harden RLS policies
-- 1. Drop existing public policies
drop policy if exists "Public Read" on profiles;
drop policy if exists "Public Read" on teams;
drop policy if exists "Public Read" on objectives;
drop policy if exists "Public Read" on projects;
drop policy if exists "Public Read" on tasks;
drop policy if exists "Public Read" on messages;

drop policy if exists "Public Insert" on projects;
drop policy if exists "Public Insert" on tasks;
drop policy if exists "Public Insert" on objectives;
drop policy if exists "Public Insert" on okr_checkins;
drop policy if exists "Public Insert" on messages;

-- 2. Create hardened policies (Authenticated users only)

-- Profiles: Users can see all profiles in the organization (demo simplified)
create policy "Authenticated Read" on profiles for select to authenticated using (true);
create policy "Users can update own profile" on profiles for update to authenticated using (auth.uid() = id);

-- Teams: Authenticated users can read team info
create policy "Authenticated Read" on teams for select to authenticated using (true);

-- Objectives: Users can see all objectives (demo simplified)
create policy "Authenticated Read" on objectives for select to authenticated using (true);
create policy "Authenticated Insert" on objectives for insert to authenticated with check (auth.uid() = owner_id);

-- Projects: Users can see all projects (demo simplified)
create policy "Authenticated Read" on projects for select to authenticated using (true);
create policy "Authenticated Insert" on projects for insert to authenticated with check (auth.uid() = owner_id);

-- Tasks: Users can see all tasks (demo simplified)
create policy "Authenticated Read" on tasks for select to authenticated using (true);
create policy "Authenticated Insert" on tasks for insert to authenticated with check (auth.uid() = assignee_id);

-- Messages: Users can see and send messages
create policy "Authenticated Read" on messages for select to authenticated using (true);
create policy "Authenticated Insert" on messages for insert to authenticated with check (auth.uid() = sender_id);

-- OKR Checkins
create policy "Authenticated Insert" on okr_checkins for insert to authenticated with check (true);

-- ============================================================
-- Migration: 20240227000000_organizations.sql
-- ============================================================
-- Organizations + membership (multi-org support)

create table if not exists organizations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists organization_members (
  organization_id uuid references organizations(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (organization_id, profile_id)
);

alter table channels
  add column if not exists organization_id uuid references organizations(id);

alter table organizations enable row level security;
alter table organization_members enable row level security;

-- Demo policies (align with existing public demo behavior)
create policy "Public Read" on organizations for select using (true);
create policy "Public Read" on organization_members for select using (true);
create policy "Public Insert" on organizations for insert with check (true);
create policy "Public Insert" on organization_members for insert with check (true);

-- ============================================================
-- Migration: 20240227000001_chat_supabase.sql
-- ============================================================
-- Chat: entity refs, attachments, read/archive state + storage bucket

-- 1) Extend messages table for entity ref + attachments
alter table public.messages
  add column if not exists entity_type text check (entity_type in ('project','task')),
  add column if not exists entity_id uuid,
  add column if not exists entity_title text,
  add column if not exists attachments jsonb;

-- 2) Per-user message state (read/archive)
create table if not exists public.message_user_state (
  message_id uuid references public.messages(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  read_at timestamp with time zone,
  archived_at timestamp with time zone,
  primary key (message_id, user_id)
);

alter table public.message_user_state enable row level security;

-- Demo policies (align with existing demo openness)
create policy "Public Read" on public.message_user_state for select using (true);
create policy "Public Insert" on public.message_user_state for insert with check (true);
create policy "Public Update" on public.message_user_state for update using (true) with check (true);

-- 3) Storage bucket for chat media
-- Note: Supabase storage tables live in schema 'storage', which is only
-- available on hosted Supabase instances (not plain PostgreSQL).
do $$ begin
  insert into storage.buckets (id, name, public)
  values ('chat-media', 'chat-media', true)
  on conflict (id) do nothing;
exception when invalid_schema_name or undefined_table then
  raise notice 'storage schema not available – skipping bucket creation';
end $$;

-- Public read objects (demo)
do $$ begin
  create policy "Chat Media Public Read" on storage.objects
    for select
    using (bucket_id = 'chat-media');
exception when invalid_schema_name or undefined_table or duplicate_object then
  raise notice 'storage.objects not available or policy exists – skipping';
end $$;

-- Public insert objects (demo)
do $$ begin
  create policy "Chat Media Public Insert" on storage.objects
    for insert
    with check (bucket_id = 'chat-media');
exception when invalid_schema_name or undefined_table or duplicate_object then
  raise notice 'storage.objects not available or policy exists – skipping';
end $$;

-- ============================================================
-- Migration: 20240227000002_chat_rls_policies.sql
-- ============================================================
do $$ begin
  create policy "Profiles Self Insert" on public.profiles
    for insert
    with check (auth.uid() = id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Profiles Self Update" on public.profiles
    for update
    using (auth.uid() = id)
    with check (auth.uid() = id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Channels Public Read" on public.channels
    for select
    using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Channels Auth Insert" on public.channels
    for insert
    with check (auth.uid() is not null);
exception when duplicate_object then null; end $$;



do $$ begin
  create policy "Channel Members Public Read" on public.channel_members
    for select
    using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Channel Members Self Insert" on public.channel_members
    for insert
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- ============================================================
-- Migration: 20240227000003_chat_message_type_entity.sql
-- ============================================================
-- Allow 'entity' message type (for project/task link messages)

do $$ begin
  alter table public.messages drop constraint if exists messages_type_check;
exception when undefined_object then null; end $$;

alter table public.messages
  add constraint messages_type_check
  check (type in ('text', 'system', 'file', 'entity'));

-- ============================================================
-- Migration: 20240227000004_org_branding.sql
-- ============================================================
-- Add logo_url to organizations
alter table organizations add column if not exists logo_url text;
alter table organizations add column if not exists setup_completed boolean default false;

-- Add onboarding flag to profiles if needed or just use organization state
alter table profiles add column if not exists onboarding_completed boolean default false;

-- ============================================================
-- Migration: 20240227000005_license_durations.sql
-- ============================================================
-- Migration to add license duration and expiry fields to organizations
alter table public.organizations 
  add column if not exists license_type text check (license_type in ('mensuelle', 'trimestrielle', 'semestrielle', 'annuelle', 'definitive')) default 'mensuelle',
  add column if not exists expires_at timestamp with time zone;

-- Update existing organizations to have an expiry date (e.g., +1 month from creation)
update public.organizations 
set expires_at = created_at + interval '1 month'
where expires_at is null and license_type != 'definitive';

-- ============================================================
-- Migration: 20240228000000_dg_onboarding_config.sql
-- ============================================================
-- DG Onboarding: company profile, KPI config, dashboard config
-- Adds configuration columns to organizations for auto-generated dashboards

alter table public.organizations
  add column if not exists company_profile text check (company_profile in (
    'groupe_holding',
    'services_b2b',
    'formation_academie',
    'commerce_ecommerce',
    'industrie_production',
    'logistique_livraison',
    'ong_impact',
    'saas_tech'
  )),
  add column if not exists company_sub_profile jsonb default '{}',
  add column if not exists quarterly_objective text check (quarterly_objective in (
    'croissance_ca',
    'rentabilite',
    'satisfaction_client',
    'execution_operationnelle',
    'acquisition_clients',
    'retention',
    'impact_social'
  )),
  add column if not exists selected_kpis jsonb default '[]',
  add column if not exists dashboard_layout jsonb default '{}',
  add column if not exists kpi_thresholds jsonb default '{}',
  add column if not exists dg_onboarding_completed boolean default false;


-- ============================================================
-- Migration: 20240228000001_rls_org_isolation.sql
-- ============================================================
-- ============================================================
-- RLS: Isolation par organisation
-- 1. Ajoute organization_id sur profiles (lien direct)
-- 2. Ajoute organization_id sur teams
-- 3. Remplace les policies "Authenticated Read" using(true)
--    par un filtrage basé sur l'organisation de l'utilisateur.
-- ============================================================

-- ── Étape 0 : Ajouter organization_id aux tables qui en manquent ──
alter table public.profiles
  add column if not exists organization_id uuid references public.organizations(id);

alter table public.teams
  add column if not exists organization_id uuid references public.organizations(id);

-- Profils : lier aux orgs via organization_members (backfill existants)
update public.profiles p
set organization_id = om.organization_id
from public.organization_members om
where om.profile_id = p.id
  and p.organization_id is null;

-- Helper: récupérer l'organization_id de l'utilisateur connecté
create or replace function public.user_org_id()
returns uuid
language sql
stable
security definer
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

-- ── PROFILES ──
drop policy if exists "Authenticated Read" on profiles;
create policy "Org Scoped Read" on profiles
  for select to authenticated
  using (
    organization_id = public.user_org_id()
    or public.user_org_id() is null  -- super admin sans org
    or id = auth.uid()               -- toujours voir son propre profil
  );

-- ── PROJECTS ──
drop policy if exists "Authenticated Read" on projects;
create policy "Org Scoped Read" on projects
  for select to authenticated
  using (
    team_id in (
      select id from teams where organization_id = public.user_org_id()
    )
    or owner_id = auth.uid()
    or public.user_org_id() is null
  );

-- ── TASKS ──
drop policy if exists "Authenticated Read" on tasks;
create policy "Org Scoped Read" on tasks
  for select to authenticated
  using (
    project_id in (
      select id from projects where owner_id = auth.uid()
      union
      select p.id from projects p
        join teams t on p.team_id = t.id
        where t.organization_id = public.user_org_id()
    )
    or assignee_id = auth.uid()
    or public.user_org_id() is null
  );

-- ── OBJECTIVES ──
drop policy if exists "Authenticated Read" on objectives;
create policy "Org Scoped Read" on objectives
  for select to authenticated
  using (
    owner_id = auth.uid()
    or owner_id in (
      select id from profiles where organization_id = public.user_org_id()
    )
    or public.user_org_id() is null
  );

-- ── MESSAGES ──
drop policy if exists "Authenticated Read" on messages;
create policy "Org Scoped Read" on messages
  for select to authenticated
  using (
    sender_id = auth.uid()
    or channel_id in (
      select channel_id from channel_members where user_id = auth.uid()
    )
    or public.user_org_id() is null
  );

-- ── TEAMS ──
drop policy if exists "Authenticated Read" on teams;
create policy "Org Scoped Read" on teams
  for select to authenticated
  using (
    organization_id = public.user_org_id()
    or public.user_org_id() is null
  );

-- ── ORGANIZATIONS ──
do $$ begin
  create policy "Own Org Read" on organizations
    for select to authenticated
    using (
      id = public.user_org_id()
      or public.user_org_id() is null
    );
exception when duplicate_object then null; end $$;

-- ── DELETE policies ──
do $$ begin
  create policy "Owner Delete" on tasks
    for delete to authenticated
    using (assignee_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Owner Delete" on projects
    for delete to authenticated
    using (owner_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Owner Delete" on objectives
    for delete to authenticated
    using (owner_id = auth.uid());
exception when duplicate_object then null; end $$;


-- ============================================================
-- Migration: 20240228000002_invites_system.sql
-- ============================================================
-- Migration to add invites table for member onboarding
create table if not exists public.invites (
  id uuid default uuid_generate_v4() primary key,
  token text unique not null,
  organization_id uuid references public.organizations(id) on delete cascade,
  invited_email text not null,
  rbac_role_assigned text not null,
  role_assigned text not null,
  is_used boolean default false,
  used_at timestamp with time zone,
  used_by uuid references public.profiles(id),
  expires_at timestamp with time zone not null,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.invites enable row level security;

-- Policies for invites
-- 1. Admins/Executives can manage invites for their org
create policy "Org Admins can manage invites" on public.invites
  for all to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and rbac_role in ('admin', 'executive', 'super_admin')
      and (organization_id = public.invites.organization_id or rbac_role = 'super_admin')
    )
  );

-- 2. Anyone can read an invite if they have the token (needed for validation before login)
create policy "Anyone can read valid invite by token" on public.invites
  for select using (true);

-- ============================================================
-- Migration: 20240228000003_profile_org_link.sql
-- ============================================================
-- Migration to add organization_id and onboarding_completed to profiles
alter table public.profiles
  add column if not exists organization_id uuid references public.organizations(id),
  add column if not exists onboarding_completed boolean default false;

-- Add RLS policy for profiles based on organization_id
-- Users can only read profiles within their own organization
drop policy if exists "Users can read profiles in their organization" on public.profiles;
create policy "Users can read profiles in their organization" on public.profiles
  for select to authenticated
  using (
    organization_id = public.user_org_id()
    or rbac_role = 'super_admin'
    or id = auth.uid()
  );

-- ============================================================
-- Migration: 20240228000004_rbac_super_admin.sql
-- ============================================================
-- Migration to update rbac_role check constraint to include super_admin
alter table public.profiles 
  drop constraint if exists profiles_rbac_role_check;

alter table public.profiles
  add constraint profiles_rbac_role_check 
  check (rbac_role in ('super_admin', 'admin', 'executive', 'manager', 'member', 'viewer'));

-- ============================================================
-- Migration: 20240228000005_direct_org_isolation.sql
-- ============================================================
-- Migration to strengthen data isolation by adding organization_id directly to all major entities.
-- This simplifies RLS and makes multi-tenancy more robust.

-- 1. Add organization_id to all major tables
alter table public.pillars add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.objectives add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.key_results add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.projects add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.tasks add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

-- 2. Backfill existing data if any (assuming they can be traced back through teams/owners)
update public.pillars p
set organization_id = prof.organization_id
from public.profiles prof
where p.organization_id is null; -- Fallback for pillars (usually created by admins)

update public.objectives o
set organization_id = prof.organization_id
from public.profiles prof
where o.owner_id = prof.id
  and o.organization_id is null;

update public.key_results kr
set organization_id = o.organization_id
from public.objectives o
where kr.objective_id = o.id
  and kr.organization_id is null;

update public.projects p
set organization_id = t.organization_id
from public.teams t
where p.team_id = t.id
  and p.organization_id is null;

update public.tasks t
set organization_id = p.organization_id
from public.projects p
where t.project_id = p.id
  and t.organization_id is null;

-- 3. Update RLS policies to use direct organization_id link
-- Helper already exists: public.user_org_id()

-- PILLARS
alter table public.pillars enable row level security;
drop policy if exists "Org Scoped Read" on public.pillars;
create policy "Org Scoped Read" on public.pillars
  for select to authenticated
  using (organization_id = public.user_org_id() or public.user_org_id() is null);

-- OBJECTIVES
drop policy if exists "Org Scoped Read" on public.objectives;
create policy "Org Scoped Read" on public.objectives
  for select to authenticated
  using (organization_id = public.user_org_id() or public.user_org_id() is null);

-- KEY RESULTS
alter table public.key_results enable row level security;
drop policy if exists "Org Scoped Read" on public.key_results;
create policy "Org Scoped Read" on public.key_results
  for select to authenticated
  using (organization_id = public.user_org_id() or public.user_org_id() is null);

-- PROJECTS
drop policy if exists "Org Scoped Read" on public.projects;
create policy "Org Scoped Read" on public.projects
  for select to authenticated
  using (organization_id = public.user_org_id() or public.user_org_id() is null);

-- TASKS
drop policy if exists "Org Scoped Read" on public.tasks;
create policy "Org Scoped Read" on public.tasks
  for select to authenticated
  using (organization_id = public.user_org_id() or public.user_org_id() is null);

-- CHANNELS (already has organization_id)
drop policy if exists "Org Scoped Read" on public.channels;
create policy "Org Scoped Read" on public.channels
  for select to authenticated
  using (organization_id = public.user_org_id() or public.user_org_id() is null);

-- ============================================================
-- Migration: 20240228000006_login_profile_lookup.sql
-- ============================================================
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

-- ============================================================
-- Migration: 20240228000007_security_hardening.sql
-- ============================================================
-- ============================================================
-- Security Hardening Migration
-- 1. Replace "user_org_id() is null" bypass with super_admin check
-- 2. Restrict invites SELECT to org members only
-- 3. Remove demo open INSERT policies on organizations/organization_members
-- ============================================================

-- Helper: check if current user is super_admin
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and rbac_role = 'super_admin'
  );
$$;

-- ══════════════════════════════════════════════════════════════
-- PROFILES: replace user_org_id() is null with is_super_admin()
-- ══════════════════════════════════════════════════════════════
drop policy if exists "Org Scoped Read" on profiles;
create policy "Org Scoped Read" on profiles
  for select to authenticated
  using (
    organization_id = public.user_org_id()
    or public.is_super_admin()
    or id = auth.uid()
  );

-- ══════════════════════════════════════════════════════════════
-- PROJECTS: replace user_org_id() is null with is_super_admin()
-- ══════════════════════════════════════════════════════════════
drop policy if exists "Org Scoped Read" on projects;
create policy "Org Scoped Read" on projects
  for select to authenticated
  using (
    team_id in (
      select id from teams where organization_id = public.user_org_id()
    )
    or owner_id = auth.uid()
    or public.is_super_admin()
  );

-- ══════════════════════════════════════════════════════════════
-- TASKS: replace user_org_id() is null with is_super_admin()
-- ══════════════════════════════════════════════════════════════
drop policy if exists "Org Scoped Read" on tasks;
create policy "Org Scoped Read" on tasks
  for select to authenticated
  using (
    project_id in (
      select id from projects where owner_id = auth.uid()
      union
      select p.id from projects p
        join teams t on p.team_id = t.id
        where t.organization_id = public.user_org_id()
    )
    or assignee_id = auth.uid()
    or public.is_super_admin()
  );

-- ══════════════════════════════════════════════════════════════
-- OBJECTIVES: replace user_org_id() is null with is_super_admin()
-- ══════════════════════════════════════════════════════════════
drop policy if exists "Org Scoped Read" on objectives;
create policy "Org Scoped Read" on objectives
  for select to authenticated
  using (
    owner_id = auth.uid()
    or owner_id in (
      select id from profiles where organization_id = public.user_org_id()
    )
    or public.is_super_admin()
  );

-- ══════════════════════════════════════════════════════════════
-- MESSAGES: replace user_org_id() is null with is_super_admin()
-- ══════════════════════════════════════════════════════════════
drop policy if exists "Org Scoped Read" on messages;
create policy "Org Scoped Read" on messages
  for select to authenticated
  using (
    sender_id = auth.uid()
    or channel_id in (
      select channel_id from channel_members where user_id = auth.uid()
    )
    or public.is_super_admin()
  );

-- ══════════════════════════════════════════════════════════════
-- TEAMS: replace user_org_id() is null with is_super_admin()
-- ══════════════════════════════════════════════════════════════
drop policy if exists "Org Scoped Read" on teams;
create policy "Org Scoped Read" on teams
  for select to authenticated
  using (
    organization_id = public.user_org_id()
    or public.is_super_admin()
  );

-- ══════════════════════════════════════════════════════════════
-- ORGANIZATIONS: replace user_org_id() is null with is_super_admin()
-- ══════════════════════════════════════════════════════════════
drop policy if exists "Own Org Read" on organizations;
drop policy if exists "Public Read" on organizations;
drop policy if exists "Org Scoped Read" on organizations;
create policy "Org Scoped Read" on organizations
  for select to authenticated
  using (
    id = public.user_org_id()
    or public.is_super_admin()
  );

-- Remove demo open INSERT on organizations
drop policy if exists "Public Insert" on organizations;

-- ══════════════════════════════════════════════════════════════
-- ORGANIZATION_MEMBERS: remove demo policies, add proper ones
-- ══════════════════════════════════════════════════════════════
drop policy if exists "Public Read" on organization_members;
drop policy if exists "Public Insert" on organization_members;
drop policy if exists "Org Scoped Read" on organization_members;

create policy "Org Scoped Read" on organization_members
  for select to authenticated
  using (
    organization_id = public.user_org_id()
    or public.is_super_admin()
  );

-- ══════════════════════════════════════════════════════════════
-- INVITES: restrict SELECT to org admins only (remove public read)
-- ══════════════════════════════════════════════════════════════
drop policy if exists "Anyone can read valid invite by token" on invites;

-- Invites are only read server-side via ensureProfile (which uses the
-- authenticated user's session). The user only needs to read invites
-- for their own email during login.
create policy "Users can read own invites" on invites
  for select to authenticated
  using (
    invited_email = (select email from auth.users where id = auth.uid())
    or public.is_super_admin()
    or exists (
      select 1 from public.profiles
      where id = auth.uid()
      and rbac_role in ('admin', 'executive')
      and organization_id = invites.organization_id
    )
  );

-- ============================================================
-- Migration: 20240228000008_crm_tables.sql
-- ============================================================
-- ============================================================
-- CRM Module: Contacts, Accounts, Deals, Activities
-- Inspired by Monday.com CRM
-- ============================================================

-- ── ACCOUNTS (Entreprises / Comptes clients) ──
create table if not exists public.crm_accounts (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  domain text,
  industry text,
  company_size text, -- '1-10', '11-50', '51-200', '201-500', '500+'
  phone text,
  email text,
  website text,
  address text,
  city text,
  country text,
  logo_url text,
  description text,
  type text default 'prospect', -- prospect, client, partner, vendor, other
  priority text default 'medium', -- low, medium, high
  annual_revenue numeric,
  owner_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ── CONTACTS ──
create table if not exists public.crm_contacts (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  account_id uuid references public.crm_accounts(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  mobile text,
  job_title text,
  department text,
  avatar_url text,
  linkedin_url text,
  address text,
  city text,
  country text,
  status text default 'active', -- active, inactive, churned
  lead_source text, -- website, referral, linkedin, cold_call, event, advertising, other
  lead_score integer default 0,
  tags text[] default '{}',
  notes text,
  owner_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ── DEAL STAGES (Pipeline stages configurables par org) ──
create table if not exists public.crm_deal_stages (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  color text default '#6366f1',
  position integer not null default 0,
  probability integer default 0, -- 0-100 win probability
  is_won boolean default false,
  is_lost boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ── DEALS (Opportunités de vente) ──
create table if not exists public.crm_deals (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  title text not null,
  value numeric default 0,
  currency text default 'XOF',
  stage_id uuid references public.crm_deal_stages(id) on delete set null,
  contact_id uuid references public.crm_contacts(id) on delete set null,
  account_id uuid references public.crm_accounts(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  priority text default 'medium', -- low, medium, high, urgent
  expected_close_date date,
  actual_close_date date,
  close_reason text, -- won, lost_competitor, lost_budget, lost_timing, lost_no_response, other
  description text,
  tags text[] default '{}',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ── ACTIVITIES (Appels, Emails, Réunions, Notes) ──
create table if not exists public.crm_activities (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  type text not null, -- call, email, meeting, note, task
  title text not null,
  description text,
  contact_id uuid references public.crm_contacts(id) on delete cascade,
  deal_id uuid references public.crm_deals(id) on delete cascade,
  account_id uuid references public.crm_accounts(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete set null,
  due_date timestamp with time zone,
  completed_at timestamp with time zone,
  is_completed boolean default false,
  duration_minutes integer, -- for calls/meetings
  outcome text, -- for calls: answered, voicemail, no_answer, busy
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ── RLS ──
alter table public.crm_accounts enable row level security;
alter table public.crm_contacts enable row level security;
alter table public.crm_deal_stages enable row level security;
alter table public.crm_deals enable row level security;
alter table public.crm_activities enable row level security;

-- Org-scoped read policies
create policy "Org Scoped Read" on crm_accounts
  for select to authenticated
  using (organization_id = public.user_org_id() or public.is_super_admin());

create policy "Org Scoped Read" on crm_contacts
  for select to authenticated
  using (organization_id = public.user_org_id() or public.is_super_admin());

create policy "Org Scoped Read" on crm_deal_stages
  for select to authenticated
  using (organization_id = public.user_org_id() or public.is_super_admin());

create policy "Org Scoped Read" on crm_deals
  for select to authenticated
  using (organization_id = public.user_org_id() or public.is_super_admin());

create policy "Org Scoped Read" on crm_activities
  for select to authenticated
  using (organization_id = public.user_org_id() or public.is_super_admin());

-- Insert policies (authenticated users can create within their org)
create policy "Org Scoped Insert" on crm_accounts
  for insert to authenticated
  with check (organization_id = public.user_org_id());

create policy "Org Scoped Insert" on crm_contacts
  for insert to authenticated
  with check (organization_id = public.user_org_id());

create policy "Org Scoped Insert" on crm_deal_stages
  for insert to authenticated
  with check (organization_id = public.user_org_id());

create policy "Org Scoped Insert" on crm_deals
  for insert to authenticated
  with check (organization_id = public.user_org_id());

create policy "Org Scoped Insert" on crm_activities
  for insert to authenticated
  with check (organization_id = public.user_org_id());

-- Update policies (org members can update)
create policy "Org Scoped Update" on crm_accounts
  for update to authenticated
  using (organization_id = public.user_org_id())
  with check (organization_id = public.user_org_id());

create policy "Org Scoped Update" on crm_contacts
  for update to authenticated
  using (organization_id = public.user_org_id())
  with check (organization_id = public.user_org_id());

create policy "Org Scoped Update" on crm_deal_stages
  for update to authenticated
  using (organization_id = public.user_org_id())
  with check (organization_id = public.user_org_id());

create policy "Org Scoped Update" on crm_deals
  for update to authenticated
  using (organization_id = public.user_org_id())
  with check (organization_id = public.user_org_id());

create policy "Org Scoped Update" on crm_activities
  for update to authenticated
  using (organization_id = public.user_org_id())
  with check (organization_id = public.user_org_id());

-- Delete policies (org members can delete)
create policy "Org Scoped Delete" on crm_accounts
  for delete to authenticated
  using (organization_id = public.user_org_id());

create policy "Org Scoped Delete" on crm_contacts
  for delete to authenticated
  using (organization_id = public.user_org_id());

create policy "Org Scoped Delete" on crm_deal_stages
  for delete to authenticated
  using (organization_id = public.user_org_id());

create policy "Org Scoped Delete" on crm_deals
  for delete to authenticated
  using (organization_id = public.user_org_id());

create policy "Org Scoped Delete" on crm_activities
  for delete to authenticated
  using (organization_id = public.user_org_id());

-- ── DEFAULT DEAL STAGES (inserted per org via trigger) ──
create or replace function public.create_default_deal_stages()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.crm_deal_stages (organization_id, name, color, position, probability) values
    (NEW.id, 'Prospect',       '#94a3b8', 0, 10),
    (NEW.id, 'Qualification',  '#6366f1', 1, 20),
    (NEW.id, 'Proposition',    '#8b5cf6', 2, 40),
    (NEW.id, 'Négociation',    '#f59e0b', 3, 60),
    (NEW.id, 'Closing',        '#22c55e', 4, 80),
    (NEW.id, 'Gagné',          '#10b981', 5, 100),
    (NEW.id, 'Perdu',          '#ef4444', 6, 0);

  -- Mark won/lost stages
  update public.crm_deal_stages set is_won = true
    where organization_id = NEW.id and name = 'Gagné';
  update public.crm_deal_stages set is_lost = true
    where organization_id = NEW.id and name = 'Perdu';

  return NEW;
end;
$$;

-- Create trigger for new organizations
drop trigger if exists on_organization_created_crm_stages on public.organizations;
create trigger on_organization_created_crm_stages
  after insert on public.organizations
  for each row
  execute function public.create_default_deal_stages();

-- Backfill: create default stages for existing organizations that don't have any
do $$
declare
  org_record record;
begin
  for org_record in
    select id from public.organizations
    where id not in (select distinct organization_id from public.crm_deal_stages)
  loop
    insert into public.crm_deal_stages (organization_id, name, color, position, probability, is_won, is_lost) values
      (org_record.id, 'Prospect',       '#94a3b8', 0, 10,  false, false),
      (org_record.id, 'Qualification',  '#6366f1', 1, 20,  false, false),
      (org_record.id, 'Proposition',    '#8b5cf6', 2, 40,  false, false),
      (org_record.id, 'Négociation',    '#f59e0b', 3, 60,  false, false),
      (org_record.id, 'Closing',        '#22c55e', 4, 80,  false, false),
      (org_record.id, 'Gagné',          '#10b981', 5, 100, true,  false),
      (org_record.id, 'Perdu',          '#ef4444', 6, 0,   false, true);
  end loop;
end;
$$;

-- ── INDEXES for performance ──
create index if not exists idx_crm_contacts_org on crm_contacts(organization_id);
create index if not exists idx_crm_contacts_account on crm_contacts(account_id);
create index if not exists idx_crm_accounts_org on crm_accounts(organization_id);
create index if not exists idx_crm_deals_org on crm_deals(organization_id);
create index if not exists idx_crm_deals_stage on crm_deals(stage_id);
create index if not exists idx_crm_deals_contact on crm_deals(contact_id);
create index if not exists idx_crm_activities_org on crm_activities(organization_id);
create index if not exists idx_crm_activities_contact on crm_activities(contact_id);
create index if not exists idx_crm_activities_deal on crm_activities(deal_id);

-- ── updated_at trigger ──
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

create trigger set_updated_at before update on crm_accounts
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on crm_contacts
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on crm_deals
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on crm_activities
  for each row execute function public.update_updated_at();

-- ============================================================
-- Migration: 20240228000008_system_settings.sql
-- ============================================================
-- Migration to create system_settings table for global platform configuration

create table if not exists public.system_settings (
  id text primary key, -- 'global'
  app_domain text default 'zoro-pilot.company',
  admin_domain text default 'zoro-secure-control-net.company',
  total_isolation_enabled boolean default true,
  strict_invite_validation boolean default true,
  maintenance_mode_enabled boolean default false,
  global_banner_message text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_by uuid references public.profiles(id)
);

-- Insert the default 'global' row if it doesn't exist
insert into public.system_settings (id) 
values ('global')
on conflict (id) do nothing;

alter table public.system_settings enable row level security;

-- Only super_admin can read/write system settings
create policy "Super Admins can manage system settings" on public.system_settings
  for all to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and rbac_role = 'super_admin'
    )
  );

-- ============================================================
-- Migration: 20240228000009_avatars_storage.sql
-- ============================================================
-- Migration to create avatars bucket for profile pictures

-- 1) Create avatars bucket
do $$ begin
  insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;
exception when invalid_schema_name or undefined_table then
  raise notice 'storage schema not available – skipping bucket creation';
end $$;

-- 2) Storage RLS Policies for avatars
-- Public read access
do $$ begin
  create policy "Avatars Public Read" on storage.objects
    for select
    using (bucket_id = 'avatars');
exception when invalid_schema_name or undefined_table or duplicate_object then
  raise notice 'storage.objects not available or policy exists – skipping';
end $$;

-- Authenticated users can upload their own avatars
-- We use the path structure 'uid/filename'
do $$ begin
  create policy "Users can upload their own avatars" on storage.objects
    for insert
    to authenticated
    with check (
      bucket_id = 'avatars' 
      and (storage.foldername(name))[1] = auth.uid()::text
    );
exception when invalid_schema_name or undefined_table or duplicate_object then
  raise notice 'storage.objects not available or policy exists – skipping';
end $$;

-- Users can update/delete their own avatars
do $$ begin
  create policy "Users can update their own avatars" on storage.objects
    for update
    to authenticated
    using (
      bucket_id = 'avatars' 
      and (storage.foldername(name))[1] = auth.uid()::text
    );
exception when invalid_schema_name or undefined_table or duplicate_object then
  raise notice 'storage.objects not available or policy exists – skipping';
end $$;

do $$ begin
  create policy "Users can delete their own avatars" on storage.objects
    for delete
    to authenticated
    using (
      bucket_id = 'avatars' 
      and (storage.foldername(name))[1] = auth.uid()::text
    );
exception when invalid_schema_name or undefined_table or duplicate_object then
  raise notice 'storage.objects not available or policy exists – skipping';
end $$;

-- ============================================================
-- Migration: 20240228000010_fix_rls_recursion.sql
-- ============================================================
-- Migration to fix infinite recursion in RLS policies
-- The recursion occurs because user_org_id() and is_super_admin() query the profiles table,
-- while the profiles table policy calls these functions.

-- 1. Redefine user_org_id to avoid recursion.
-- We use SECURITY DEFINER and a specific search_path to bypass RLS.
create or replace function public.user_org_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  org_id uuid;
begin
  select organization_id into org_id from public.profiles where id = auth.uid();
  return org_id;
end;
$$;

-- 2. Redefine is_super_admin to avoid recursion
create or replace function public.is_super_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  is_admin boolean;
begin
  select (rbac_role = 'super_admin') into is_admin from public.profiles where id = auth.uid();
  return coalesce(is_admin, false);
end;
$$;

-- 3. Fix the profiles policy to break the recursion.
-- We use the helper functions which now safely bypass RLS.
drop policy if exists "Org Scoped Read" on public.profiles;
drop policy if exists "Users can read profiles in their organization" on public.profiles;
drop policy if exists "Profiles visibility" on public.profiles;

create policy "Profiles visibility" on public.profiles
  for select to authenticated
  using (
    -- Case 1: Always allow seeing your own profile (no function call needed)
    id = auth.uid()
    OR
    -- Case 2: Use helper functions that bypass RLS
    public.is_super_admin()
    OR
    organization_id = public.user_org_id()
  );

-- ============================================================
-- Migration: 20240228000011_task_visibility.sql
-- ============================================================
-- Task ownership + visibility:
-- - organization members can create private tasks for themselves
-- - DG/admin/executive can assign tasks to any member of their organization
-- - visibility controls whether a task is private or visible to the organization

alter table public.tasks
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists visibility text check (visibility in ('private', 'organization')) default 'private';

update public.tasks
set created_by = coalesce(created_by, assignee_id);

update public.tasks
set visibility = 'private'
where visibility is null;

create or replace function public.can_manage_org_tasks()
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

  return user_role in ('super_admin', 'admin', 'executive');
end;
$$;

create or replace function public.profile_belongs_to_user_org(profile_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  profile_org uuid;
begin
  select organization_id into profile_org
  from public.profiles
  where id = profile_id;

  return profile_org = public.user_org_id() or public.is_super_admin();
end;
$$;

drop policy if exists "Authenticated Insert" on public.tasks;
drop policy if exists "Org Scoped Read" on public.tasks;
drop policy if exists "Org Scoped Insert" on public.tasks;
drop policy if exists "Org Scoped Update" on public.tasks;
drop policy if exists "Owner Delete" on public.tasks;

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
  );

create policy "Task org insert" on public.tasks
  for insert to authenticated
  with check (
    organization_id = public.user_org_id()
    and created_by = auth.uid()
    and (
      (
        public.can_manage_org_tasks()
        and visibility in ('private', 'organization')
        and public.profile_belongs_to_user_org(assignee_id)
      )
      or (
        not public.can_manage_org_tasks()
        and visibility = 'private'
        and assignee_id = auth.uid()
      )
    )
  );

create policy "Task allowed update" on public.tasks
  for update to authenticated
  using (
    organization_id = public.user_org_id()
    and (
      created_by = auth.uid()
      or assignee_id = auth.uid()
      or public.can_manage_org_tasks()
    )
  )
  with check (
    organization_id = public.user_org_id()
    and (
      created_by = auth.uid()
      or assignee_id = auth.uid()
      or public.can_manage_org_tasks()
    )
  );

create policy "Task allowed delete" on public.tasks
  for delete to authenticated
  using (
    organization_id = public.user_org_id()
    and (
      created_by = auth.uid()
      or assignee_id = auth.uid()
      or public.can_manage_org_tasks()
    )
  );

-- ============================================================
-- Migration: 20240228000012_production_settings.sql
-- ============================================================
-- Production settings support for /settings:
-- - persisted per-user notification preferences
-- - persisted organization groups
-- - organization update policy for DG/admin roles

create table if not exists public.user_settings (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  notification_daily_summary boolean not null default true,
  notification_assignments boolean not null default true,
  notification_push boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_settings enable row level security;

drop policy if exists "Users manage own settings" on public.user_settings;
create policy "Users manage own settings" on public.user_settings
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create table if not exists public.organization_groups (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (organization_id, name)
);

alter table public.organization_groups enable row level security;

create or replace function public.can_manage_org_settings()
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

  return user_role in ('super_admin', 'admin', 'executive');
end;
$$;

create or replace function public.can_manage_org_members()
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

  return user_role in ('super_admin', 'admin', 'executive', 'manager');
end;
$$;

drop policy if exists "Org Settings Update" on public.organizations;
create policy "Org Settings Update" on public.organizations
  for update to authenticated
  using (
    id = public.user_org_id()
    and public.can_manage_org_settings()
  )
  with check (
    id = public.user_org_id()
    and public.can_manage_org_settings()
  );

drop policy if exists "Org Groups Read" on public.organization_groups;
create policy "Org Groups Read" on public.organization_groups
  for select to authenticated
  using (
    organization_id = public.user_org_id()
    or public.is_super_admin()
  );

drop policy if exists "Org Groups Insert" on public.organization_groups;
create policy "Org Groups Insert" on public.organization_groups
  for insert to authenticated
  with check (
    organization_id = public.user_org_id()
    and created_by = auth.uid()
    and public.can_manage_org_members()
  );

drop policy if exists "Org Groups Update" on public.organization_groups;
create policy "Org Groups Update" on public.organization_groups
  for update to authenticated
  using (
    organization_id = public.user_org_id()
    and public.can_manage_org_members()
  )
  with check (
    organization_id = public.user_org_id()
    and public.can_manage_org_members()
  );

drop policy if exists "Org Groups Delete" on public.organization_groups;
create policy "Org Groups Delete" on public.organization_groups
  for delete to authenticated
  using (
    organization_id = public.user_org_id()
    and public.can_manage_org_members()
  );

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

-- ============================================================
-- Migration: 20260524000000_project_task_members_progress.sql
-- ============================================================
-- Project/task production rules:
-- - Only DG-level roles can update/delete organization projects.
-- - DG-level roles can assign multiple members to projects and tasks.
-- - Tasks have their own progress value; project progress is derived in app
--   from task progress when tasks exist.

alter table public.tasks
  add column if not exists progress integer default 0 check (progress >= 0 and progress <= 100);

update public.tasks
set progress = case
  when status = 'done' then 100
  when status = 'in-progress' and coalesce(progress, 0) = 0 then 50
  else coalesce(progress, 0)
end;

create table if not exists public.project_members (
  organization_id uuid references public.organizations(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'member' check (role in ('owner', 'manager', 'member', 'observer')),
  added_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (project_id, profile_id)
);

create table if not exists public.task_assignees (
  organization_id uuid references public.organizations(id) on delete cascade not null,
  task_id uuid references public.tasks(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (task_id, profile_id)
);

insert into public.project_members (organization_id, project_id, profile_id, role, added_by)
select organization_id, id, owner_id, 'owner', owner_id
from public.projects
where organization_id is not null and owner_id is not null
on conflict (project_id, profile_id) do nothing;

insert into public.task_assignees (organization_id, task_id, profile_id, assigned_by)
select organization_id, id, assignee_id, created_by
from public.tasks
where organization_id is not null and assignee_id is not null
on conflict (task_id, profile_id) do nothing;

create or replace function public.can_manage_org_projects()
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

  return user_role in ('super_admin', 'admin', 'executive');
end;
$$;

alter table public.project_members enable row level security;
alter table public.task_assignees enable row level security;

drop policy if exists "DG Project Update" on public.projects;
create policy "DG Project Update" on public.projects
  for update to authenticated
  using (
    organization_id = public.user_org_id()
    and public.can_manage_org_projects()
  )
  with check (
    organization_id = public.user_org_id()
    and public.can_manage_org_projects()
  );

drop policy if exists "Owner Delete" on public.projects;
drop policy if exists "DG Project Delete" on public.projects;
create policy "DG Project Delete" on public.projects
  for delete to authenticated
  using (
    organization_id = public.user_org_id()
    and public.can_manage_org_projects()
  );

drop policy if exists "Project Members Read" on public.project_members;
create policy "Project Members Read" on public.project_members
  for select to authenticated
  using (organization_id = public.user_org_id() or public.is_super_admin());

drop policy if exists "Project Members Manage" on public.project_members;
create policy "Project Members Manage" on public.project_members
  for all to authenticated
  using (
    organization_id = public.user_org_id()
    and public.can_manage_org_projects()
  )
  with check (
    organization_id = public.user_org_id()
    and public.can_manage_org_projects()
    and public.profile_belongs_to_user_org(profile_id)
  );

drop policy if exists "Task Assignees Read" on public.task_assignees;
create policy "Task Assignees Read" on public.task_assignees
  for select to authenticated
  using (organization_id = public.user_org_id() or public.is_super_admin());

drop policy if exists "Task Assignees Manage" on public.task_assignees;
create policy "Task Assignees Manage" on public.task_assignees
  for all to authenticated
  using (
    organization_id = public.user_org_id()
    and (
      public.can_manage_org_tasks()
      or profile_id = auth.uid()
      or assigned_by = auth.uid()
    )
  )
  with check (
    organization_id = public.user_org_id()
    and (
      (
        public.can_manage_org_tasks()
        and public.profile_belongs_to_user_org(profile_id)
      )
      or (
        profile_id = auth.uid()
        and assigned_by = auth.uid()
      )
    )
  );

drop policy if exists "Task visibility read" on public.tasks;
create policy "Task visibility read" on public.tasks
  for select to authenticated
  using (
    organization_id = public.user_org_id()
    and (
      visibility = 'organization'
      or created_by = auth.uid()
      or assignee_id = auth.uid()
      or exists (
        select 1 from public.task_assignees ta
        where ta.task_id = public.tasks.id
        and ta.profile_id = auth.uid()
      )
      or public.can_manage_org_tasks()
    )
  );

create index if not exists idx_project_members_org_project
  on public.project_members(organization_id, project_id);

create index if not exists idx_project_members_profile
  on public.project_members(profile_id);

create index if not exists idx_task_assignees_org_task
  on public.task_assignees(organization_id, task_id);

create index if not exists idx_task_assignees_profile
  on public.task_assignees(profile_id);

