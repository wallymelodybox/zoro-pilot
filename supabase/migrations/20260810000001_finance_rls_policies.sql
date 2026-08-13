-- 20260526000001_sub_budgets_and_transactions.sql enabled RLS on sub_budgets
-- and financial_transactions but never added policies — with RLS on and zero
-- policies, every request is denied, which PostgREST surfaces as a generic
-- "table not found in schema cache" (PGRST205) rather than a 403, so this
-- looked like a missing/uncached table instead of a missing policy.
--
-- Both tables only carry project_id (no direct organization_id), so scope
-- them transitively through projects.organization_id, same pattern as the
-- rest of the org-isolation policies.

drop policy if exists "Org Scoped Read" on public.sub_budgets;
create policy "Org Scoped Read" on public.sub_budgets
  for select to authenticated
  using (
    project_id in (
      select id from public.projects
      where organization_id = public.user_org_id() or public.user_org_id() is null
    )
  );

drop policy if exists "Org Scoped Write" on public.sub_budgets;
create policy "Org Scoped Write" on public.sub_budgets
  for insert to authenticated
  with check (
    project_id in (
      select id from public.projects where organization_id = public.user_org_id()
    )
  );

drop policy if exists "Org Scoped Update" on public.sub_budgets;
create policy "Org Scoped Update" on public.sub_budgets
  for update to authenticated
  using (
    project_id in (
      select id from public.projects where organization_id = public.user_org_id()
    )
  );

drop policy if exists "Org Scoped Delete" on public.sub_budgets;
create policy "Org Scoped Delete" on public.sub_budgets
  for delete to authenticated
  using (
    project_id in (
      select id from public.projects where organization_id = public.user_org_id()
    )
  );

drop policy if exists "Org Scoped Read" on public.financial_transactions;
create policy "Org Scoped Read" on public.financial_transactions
  for select to authenticated
  using (
    project_id is null
    or project_id in (
      select id from public.projects
      where organization_id = public.user_org_id() or public.user_org_id() is null
    )
  );

drop policy if exists "Org Scoped Write" on public.financial_transactions;
create policy "Org Scoped Write" on public.financial_transactions
  for insert to authenticated
  with check (
    project_id is null
    or project_id in (
      select id from public.projects where organization_id = public.user_org_id()
    )
  );

drop policy if exists "Org Scoped Update" on public.financial_transactions;
create policy "Org Scoped Update" on public.financial_transactions
  for update to authenticated
  using (
    project_id is null
    or project_id in (
      select id from public.projects where organization_id = public.user_org_id()
    )
  );

drop policy if exists "Org Scoped Delete" on public.financial_transactions;
create policy "Org Scoped Delete" on public.financial_transactions
  for delete to authenticated
  using (
    project_id is null
    or project_id in (
      select id from public.projects where organization_id = public.user_org_id()
    )
  );

-- Force PostgREST to reload its schema cache, in case the earlier migration
-- did run but PostgREST never picked up the new tables (the PGRST205 seen
-- in the app can also be this, independently of the missing policies above).
notify pgrst, 'reload schema';
