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
