-- Native project comments plus Telegram-backed image/video attachments for
-- both task and project comments. Supabase stores metadata only.

begin;
select pg_advisory_xact_lock(hashtextextended('zoro:comment-media:20260930', 0));
set local lock_timeout = '30s';

create table if not exists public.project_comments (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null default '',
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table if not exists public.comment_attachments (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_comment_id uuid references public.task_comments(id) on delete cascade,
  project_comment_id uuid references public.project_comments(id) on delete cascade,
  uploader_id uuid not null references public.profiles(id) on delete cascade,
  telegram_file_id text not null,
  media_type text not null check (media_type in ('image', 'video')),
  file_name text not null,
  mime_type text,
  byte_size bigint not null check (byte_size >= 0 and byte_size <= 19922944),
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint comment_attachments_one_parent check (
    (task_comment_id is not null)::integer +
    (project_comment_id is not null)::integer = 1
  )
);

create index if not exists idx_project_comments_project_created
  on public.project_comments(project_id, created_at);
create index if not exists idx_comment_attachments_task_comment
  on public.comment_attachments(task_comment_id) where task_comment_id is not null;
create index if not exists idx_comment_attachments_project_comment
  on public.comment_attachments(project_comment_id) where project_comment_id is not null;
create index if not exists idx_comment_attachments_telegram_file
  on public.comment_attachments(telegram_file_id);

alter table public.project_comments enable row level security;
alter table public.comment_attachments enable row level security;

drop policy if exists "Project Comments Read" on public.project_comments;
create policy "Project Comments Read" on public.project_comments
  for select to authenticated
  using (
    organization_id = public.user_org_id()
    and public.can_view_project(project_id)
  );

drop policy if exists "Project Comments Insert" on public.project_comments;
create policy "Project Comments Insert" on public.project_comments
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and organization_id = public.user_org_id()
    and public.can_view_project(project_id)
  );

drop policy if exists "Project Comments Delete" on public.project_comments;
create policy "Project Comments Delete" on public.project_comments
  for delete to authenticated
  using (
    organization_id = public.user_org_id()
    and (author_id = auth.uid() or public.can_manage_org_tasks())
  );

drop policy if exists "Comment Attachments Read" on public.comment_attachments;
create policy "Comment Attachments Read" on public.comment_attachments
  for select to authenticated
  using (
    organization_id = public.user_org_id()
    and (
      exists (
        select 1 from public.task_comments tc
        where tc.id = comment_attachments.task_comment_id
      )
      or exists (
        select 1 from public.project_comments pc
        where pc.id = comment_attachments.project_comment_id
      )
    )
  );

-- Inserts are performed only by telegram-upload after it verifies the caller
-- can read the parent comment. No direct authenticated INSERT policy exists.
drop policy if exists "Comment Attachments Delete" on public.comment_attachments;
create policy "Comment Attachments Delete" on public.comment_attachments
  for delete to authenticated
  using (
    organization_id = public.user_org_id()
    and (uploader_id = auth.uid() or public.can_manage_org_tasks())
  );

commit;
