-- Add invite_code column to invites table for human-readable codes
alter table public.invites add column if not exists invite_code text unique;
