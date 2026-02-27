-- Migration to add license duration and expiry fields to organizations
alter table public.organizations 
  add column if not exists license_type text check (license_type in ('mensuelle', 'trimestrielle', 'semestrielle', 'annuelle', 'definitive')) default 'mensuelle',
  add column if not exists expires_at timestamp with time zone;

-- Update existing organizations to have an expiry date (e.g., +1 month from creation)
update public.organizations 
set expires_at = created_at + interval '1 month'
where expires_at is null and license_type != 'definitive';
