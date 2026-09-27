-- ISO-002: remove the historical demo policies and enforce organization and
-- channel membership isolation for every chat table.

alter table public.channels
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

alter table public.channels enable row level security;
alter table public.channel_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_user_state enable row level security;

-- SECURITY DEFINER avoids channels <-> channel_members policy recursion while
-- keeping the authorization rule in one place.
create or replace function public.can_access_channel(target_channel_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.channels c
    where c.id = target_channel_id
      and c.organization_id = public.user_org_id()
      and (
        c.type = 'public'
        or c.created_by = auth.uid()
        or exists (
          select 1
          from public.channel_members cm
          where cm.channel_id = c.id
            and cm.user_id = auth.uid()
        )
      )
  )
$$;

revoke all on function public.can_access_channel(uuid) from public;
grant execute on function public.can_access_channel(uuid) to authenticated;

drop policy if exists "Channels Public Read" on public.channels;
drop policy if exists "Channels Auth Insert" on public.channels;
drop policy if exists "Org Scoped Read" on public.channels;

create policy "Channels isolated read" on public.channels
  for select to authenticated
  using (public.can_access_channel(id));

create policy "Channels organization insert" on public.channels
  for insert to authenticated
  with check (
    organization_id = public.user_org_id()
    and created_by = auth.uid()
  );

create policy "Channels creator or manager update" on public.channels
  for update to authenticated
  using (
    organization_id = public.user_org_id()
    and (created_by = auth.uid() or public.can_manage_org_projects())
  )
  with check (
    organization_id = public.user_org_id()
    and (created_by = auth.uid() or public.can_manage_org_projects())
  );

create policy "Channels creator or manager delete" on public.channels
  for delete to authenticated
  using (
    organization_id = public.user_org_id()
    and (created_by = auth.uid() or public.can_manage_org_projects())
  );

drop policy if exists "Channel Members Public Read" on public.channel_members;
drop policy if exists "Channel Members Self Insert" on public.channel_members;

create policy "Channel members isolated read" on public.channel_members
  for select to authenticated
  using (public.can_access_channel(channel_id));

create policy "Channel members isolated insert" on public.channel_members
  for insert to authenticated
  with check (
    public.can_access_channel(channel_id)
    and exists (
      select 1
      from public.channels c
      join public.profiles p on p.id = channel_members.user_id
      where c.id = channel_members.channel_id
        and c.organization_id = public.user_org_id()
        and p.organization_id = c.organization_id
    )
  );

create policy "Channel members isolated delete" on public.channel_members
  for delete to authenticated
  using (public.can_access_channel(channel_id));

drop policy if exists "Authenticated Read" on public.messages;
drop policy if exists "Authenticated Insert" on public.messages;
drop policy if exists "Org Scoped Read" on public.messages;

create policy "Messages channel read" on public.messages
  for select to authenticated
  using (public.can_access_channel(channel_id));

create policy "Messages channel insert" on public.messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and public.can_access_channel(channel_id)
  );

create policy "Messages sender update" on public.messages
  for update to authenticated
  using (sender_id = auth.uid() and public.can_access_channel(channel_id))
  with check (sender_id = auth.uid() and public.can_access_channel(channel_id));

create policy "Messages sender delete" on public.messages
  for delete to authenticated
  using (sender_id = auth.uid() and public.can_access_channel(channel_id));

drop policy if exists "Public Read" on public.message_user_state;
drop policy if exists "Public Insert" on public.message_user_state;
drop policy if exists "Public Update" on public.message_user_state;

create policy "Message state owner read" on public.message_user_state
  for select to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.messages m
      where m.id = message_user_state.message_id
        and public.can_access_channel(m.channel_id)
    )
  );

create policy "Message state owner insert" on public.message_user_state
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.messages m
      where m.id = message_user_state.message_id
        and public.can_access_channel(m.channel_id)
    )
  );

create policy "Message state owner update" on public.message_user_state
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Message state owner delete" on public.message_user_state
  for delete to authenticated
  using (user_id = auth.uid());
