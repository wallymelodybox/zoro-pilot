-- Add logo_url to organizations
alter table organizations add column if not exists logo_url text;
alter table organizations add column if not exists setup_completed boolean default false;

-- Add onboarding flag to profiles if needed or just use organization state
alter table profiles add column if not exists onboarding_completed boolean default false;
