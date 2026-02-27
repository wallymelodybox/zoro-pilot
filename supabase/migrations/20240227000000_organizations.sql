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
