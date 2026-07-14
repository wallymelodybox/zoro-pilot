-- Notifications table: powers the bell icon, task/chat alerts, org-wide broadcasts
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null default 'info' check (type in ('info', 'alert', 'success', 'task', 'message')),
  title text not null,
  content text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_organization_id_idx
  on public.notifications (organization_id);

alter table public.notifications enable row level security;

do $$ begin
  create policy "Notifications Self Read" on public.notifications
    for select
    using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Notifications Self Update" on public.notifications
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Notifications Auth Insert" on public.notifications
    for insert
    with check (auth.uid() is not null);
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; end $$;
