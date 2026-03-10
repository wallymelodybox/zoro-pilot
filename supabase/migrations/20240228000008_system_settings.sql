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
