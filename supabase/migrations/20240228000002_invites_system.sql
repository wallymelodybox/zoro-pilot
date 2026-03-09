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
