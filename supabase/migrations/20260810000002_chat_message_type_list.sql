-- Allow 'list' message type (for checklist messages shared in chat).
--
-- The mobile app's ChatRepository.send() sets type: 'list' for checklist
-- entities (see chat_repository.dart), but messages_type_check only ever
-- allowed 'text', 'system', 'file', 'entity' — every checklist send was
-- silently rejected by Postgres with a check-constraint violation.

do $$ begin
  alter table public.messages drop constraint if exists messages_type_check;
exception when undefined_object then null; end $$;

alter table public.messages
  add constraint messages_type_check
  check (type in ('text', 'system', 'file', 'entity', 'list'));
