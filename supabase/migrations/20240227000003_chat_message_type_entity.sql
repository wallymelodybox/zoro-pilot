-- Allow 'entity' message type (for project/task link messages)

do $$ begin
  alter table public.messages drop constraint if exists messages_type_check;
exception when undefined_object then null; end $$;

alter table public.messages
  add constraint messages_type_check
  check (type in ('text', 'system', 'file', 'entity'));
