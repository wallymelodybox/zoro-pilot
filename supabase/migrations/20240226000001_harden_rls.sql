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
