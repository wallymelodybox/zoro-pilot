
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. USERS & TEAMS
-- ==========================================

-- Teams Table
create table teams (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  parent_team_id uuid references teams(id),
  manager_id uuid, -- Reference to users(id), circular dependency resolved later
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Users Table (extends Supabase auth.users but can stand alone for now)
create table profiles (
  id uuid primary key, -- Should match auth.users.id
  email text unique not null,
  name text not null,
  role text not null, -- Job title
  avatar_url text,
  team_id uuid references teams(id),
  rbac_role text not null check (rbac_role in ('admin', 'executive', 'manager', 'member', 'viewer')),
  manager_id uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add manager_id foreign key to teams
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

-- Many-to-Many: Projects <-> Objectives
create table project_objectives (
  project_id uuid references projects(id) on delete cascade,
  objective_id uuid references objectives(id) on delete cascade,
  primary key (project_id, objective_id)
);

-- Many-to-Many: Projects <-> Key Results
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
  context_id uuid, -- Polymorphic reference (ID of Project, Objective, etc)
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
-- 5. RLS POLICIES (Example - Basic)
-- ==========================================

alter table profiles enable row level security;
alter table teams enable row level security;
alter table objectives enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table messages enable row level security;

-- Policy: Everyone can read everything (for now, as per demo requirements)
create policy "Public Read" on profiles for select using (true);
create policy "Public Read" on teams for select using (true);
create policy "Public Read" on objectives for select using (true);
create policy "Public Read" on projects for select using (true);
create policy "Public Read" on tasks for select using (true);
create policy "Public Read" on messages for select using (true);

-- Insert policy: Authenticated users can insert
create policy "Auth Insert" on tasks for insert with check (auth.role() = 'authenticated');
create policy "Auth Insert" on messages for insert with check (auth.role() = 'authenticated');
