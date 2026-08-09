-- Push notifications: FCM device token storage + trigger to invoke the
-- send-push Edge Function whenever a notification row is inserted.

alter table public.profiles
  add column if not exists fcm_token text;

create extension if not exists pg_net with schema extensions;

create or replace function public.handle_notification_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  project_url text := current_setting('app.settings.supabase_url', true);
  service_key text := current_setting('app.settings.service_role_key', true);
begin
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
