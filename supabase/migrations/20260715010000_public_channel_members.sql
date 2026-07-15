-- Every organization member must automatically belong to its public channels,
-- including the organization-wide "Général" channel.
insert into public.channel_members (channel_id, user_id)
select channels.id, organization_members.profile_id
from public.channels
join public.organization_members
  on organization_members.organization_id = channels.organization_id
where channels.type = 'public'
on conflict (channel_id, user_id) do nothing;

create or replace function public.add_member_to_public_channels()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.channel_members (channel_id, user_id)
  select channels.id, new.profile_id
  from public.channels
  where channels.organization_id = new.organization_id
    and channels.type = 'public'
  on conflict (channel_id, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists organization_member_public_channels on public.organization_members;
create trigger organization_member_public_channels
after insert on public.organization_members
for each row execute function public.add_member_to_public_channels();

create or replace function public.add_organization_to_public_channel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.type = 'public' and new.organization_id is not null then
    insert into public.channel_members (channel_id, user_id)
    select new.id, organization_members.profile_id
    from public.organization_members
    where organization_members.organization_id = new.organization_id
    on conflict (channel_id, user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists public_channel_organization_members on public.channels;
create trigger public_channel_organization_members
after insert or update of type, organization_id on public.channels
for each row execute function public.add_organization_to_public_channel();

do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;
