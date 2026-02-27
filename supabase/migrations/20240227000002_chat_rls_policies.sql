do $$ begin
  create policy "Profiles Self Insert" on public.profiles
    for insert
    with check (auth.uid() = id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Profiles Self Update" on public.profiles
    for update
    using (auth.uid() = id)
    with check (auth.uid() = id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Channels Public Read" on public.channels
    for select
    using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Channels Auth Insert" on public.channels
    for insert
    with check (auth.uid() is not null);
exception when duplicate_object then null; end $$;



do $$ begin
  create policy "Channel Members Public Read" on public.channel_members
    for select
    using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Channel Members Self Insert" on public.channel_members
    for insert
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
