-- Realtime call invitations for chat channel members.
create table if not exists public.call_sessions (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  caller_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'ringing' check (status in ('ringing', 'ended')),
  created_at timestamptz not null default now(),
  ended_at timestamptz,
  expires_at timestamptz not null default (now() + interval '1 hour')
);

create index if not exists call_sessions_channel_status_idx
  on public.call_sessions (channel_id, status, created_at desc);

alter table public.call_sessions enable row level security;

do $$ begin
  create policy "Channel Members Read Calls" on public.call_sessions
    for select
    using (
      exists (
        select 1
        from public.channels
        where channels.id = call_sessions.channel_id
          and (
            exists (
              select 1 from public.channel_members
              where channel_members.channel_id = channels.id
                and channel_members.user_id = auth.uid()
            )
            or (
              channels.type = 'public'
              and exists (
                select 1 from public.organization_members
                where organization_members.organization_id = channels.organization_id
                  and organization_members.profile_id = auth.uid()
              )
            )
          )
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Channel Members Start Calls" on public.call_sessions
    for insert
    with check (
      caller_id = auth.uid()
      and exists (
        select 1
        from public.channels
        where channels.id = call_sessions.channel_id
          and (
            exists (
              select 1 from public.channel_members
              where channel_members.channel_id = channels.id
                and channel_members.user_id = auth.uid()
            )
            or (
              channels.type = 'public'
              and exists (
                select 1 from public.organization_members
                where organization_members.organization_id = channels.organization_id
                  and organization_members.profile_id = auth.uid()
              )
            )
          )
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Callers End Calls" on public.call_sessions
    for update
    using (caller_id = auth.uid())
    with check (caller_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.call_sessions;
exception when duplicate_object then null; end $$;
