-- Push notifications: FCM device token storage + trigger to invoke the
-- send-push Edge Function whenever a notification row is inserted.
--
-- `alter database ... set app.settings.x` requires superuser, which hosted
-- Supabase projects don't grant — so instead of session GUCs we keep the
-- project URL/service key in a tiny config table only postgres can read.

alter table public.profiles
  add column if not exists fcm_token text;

create extension if not exists pg_net with schema extensions;

create schema if not exists private;

create table if not exists private.push_config (
  key text primary key,
  value text not null
);

-- No RLS policies are created for private.push_config on purpose: with RLS
-- enabled and zero policies, nothing is accessible via PostgREST/anon/authenticated,
-- only the trigger function below (running as the table owner) can read it.
alter table private.push_config enable row level security;

create or replace function public.handle_notification_push()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  project_url text;
  service_key text;
begin
  select value into project_url from private.push_config where key = 'supabase_url';
  select value into service_key from private.push_config where key = 'service_role_key';

  if project_url is null or service_key is null then
    return new;
  end if;

  perform net.http_post(
    url := project_url || '/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object(
      'notification_id', new.id,
      'user_id', new.user_id,
      'title', new.title,
      'content', new.content,
      'link', new.link,
      'type', new.type
    )
  );

  return new;
end;
$$;

drop trigger if exists on_notification_created_push on public.notifications;
create trigger on_notification_created_push
  after insert on public.notifications
  for each row execute function public.handle_notification_push();
