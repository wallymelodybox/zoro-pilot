-- Migration to create avatars bucket for profile pictures

-- 1) Create avatars bucket
do $$ begin
  insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;
exception when invalid_schema_name or undefined_table then
  raise notice 'storage schema not available – skipping bucket creation';
end $$;

-- 2) Storage RLS Policies for avatars
-- Public read access
do $$ begin
  create policy "Avatars Public Read" on storage.objects
    for select
    using (bucket_id = 'avatars');
exception when invalid_schema_name or undefined_table or duplicate_object then
  raise notice 'storage.objects not available or policy exists – skipping';
end $$;

-- Authenticated users can upload their own avatars
-- We use the path structure 'uid/filename'
do $$ begin
  create policy "Users can upload their own avatars" on storage.objects
    for insert
    to authenticated
    with check (
      bucket_id = 'avatars' 
      and (storage.foldername(name))[1] = auth.uid()::text
    );
exception when invalid_schema_name or undefined_table or duplicate_object then
  raise notice 'storage.objects not available or policy exists – skipping';
end $$;

-- Users can update/delete their own avatars
do $$ begin
  create policy "Users can update their own avatars" on storage.objects
    for update
    to authenticated
    using (
      bucket_id = 'avatars' 
      and (storage.foldername(name))[1] = auth.uid()::text
    );
exception when invalid_schema_name or undefined_table or duplicate_object then
  raise notice 'storage.objects not available or policy exists – skipping';
end $$;

do $$ begin
  create policy "Users can delete their own avatars" on storage.objects
    for delete
    to authenticated
    using (
      bucket_id = 'avatars' 
      and (storage.foldername(name))[1] = auth.uid()::text
    );
exception when invalid_schema_name or undefined_table or duplicate_object then
  raise notice 'storage.objects not available or policy exists – skipping';
end $$;
