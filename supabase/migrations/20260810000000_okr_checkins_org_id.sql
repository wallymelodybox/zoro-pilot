-- 20240228000005_direct_org_isolation.sql added organization_id to pillars,
-- objectives, key_results, projects, tasks for direct RLS scoping — but
-- missed okr_checkins, which follows the exact same OKR hierarchy and is
-- queried/inserted with organization_id by both the web and mobile apps.

alter table public.okr_checkins
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

update public.okr_checkins c
set organization_id = kr.organization_id
from public.key_results kr
where c.key_result_id = kr.id
  and c.organization_id is null;

alter table public.okr_checkins enable row level security;

drop policy if exists "Org Scoped Read" on public.okr_checkins;
create policy "Org Scoped Read" on public.okr_checkins
  for select to authenticated
  using (organization_id = public.user_org_id() or public.user_org_id() is null);

drop policy if exists "Public Insert" on public.okr_checkins;
drop policy if exists "Org Scoped Insert" on public.okr_checkins;
create policy "Org Scoped Insert" on public.okr_checkins
  for insert to authenticated
  with check (organization_id = public.user_org_id());
