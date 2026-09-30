-- Compatibility migration for databases where the full licence lifecycle
-- migration was not applied. Safe to run more than once.

begin;
select pg_advisory_xact_lock(hashtextextended('zoro:ensure-license-status:20260930', 0));
set local lock_timeout = '30s';

alter table public.organizations
  add column if not exists license_status text;

alter table public.organizations
  drop constraint if exists organizations_license_status_check;

alter table public.organizations
  add constraint organizations_license_status_check
  check (license_status in ('essai', 'active', 'expire_bientot', 'expiree', 'suspendue'));

alter table public.organizations
  alter column license_status set default 'active';

update public.organizations
set license_status = case
  when license_type = 'definitive' then 'active'
  when expires_at is not null and expires_at < now() then 'expiree'
  else 'active'
end
where license_status is null;

commit;
