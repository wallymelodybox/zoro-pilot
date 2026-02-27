-- Chat: entity refs, attachments, read/archive state + storage bucket

-- 1) Extend messages table for entity ref + attachments
alter table public.messages
  add column if not exists entity_type text check (entity_type in ('project','task')),
  add column if not exists entity_id uuid,
  add column if not exists entity_title text,
  add column if not exists attachments jsonb;

-- 2) Per-user message state (read/archive)
create table if not exists public.message_user_state (
  message_id uuid references public.messages(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  read_at timestamp with time zone,
  archived_at timestamp with time zone,
  primary key (message_id, user_id)
);

alter table public.message_user_state enable row level security;

-- Demo policies (align with existing demo openness)
create policy "Public Read" on public.message_user_state for select using (true);
create policy "Public Insert" on public.message_user_state for insert with check (true);
create policy "Public Update" on public.message_user_state for update using (true) with check (true);

-- 3) Storage bucket for chat media
-- Note: Supabase storage tables live in schema 'storage'
insert into storage.buckets (id, name, public)
values ('chat-media', 'chat-media', true)
on conflict (id) do nothing;

-- Public read objects (demo)
create policy "Chat Media Public Read" on storage.objects
  for select
  using (bucket_id = 'chat-media');

-- Public insert objects (demo)
create policy "Chat Media Public Insert" on storage.objects
  for insert
  with check (bucket_id = 'chat-media');
