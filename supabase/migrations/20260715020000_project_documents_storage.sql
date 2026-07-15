-- Storage for project documents uploaded from a user's local device.
do $$ begin
  insert into storage.buckets (id, name, public, file_size_limit)
  values ('project-documents', 'project-documents', true, 20971520)
  on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit;
exception when invalid_schema_name or undefined_table then
  raise notice 'storage schema not available - skipping project documents bucket';
end $$;

do $$ begin
  create policy "Project Documents Storage Read" on storage.objects
    for select using (bucket_id = 'project-documents');
exception when invalid_schema_name or undefined_table or duplicate_object then null; end $$;

do $$ begin
  create policy "Project Documents Storage Insert" on storage.objects
    for insert to authenticated
    with check (
      bucket_id = 'project-documents'
      and (storage.foldername(name))[1] = auth.uid()::text
    );
exception when invalid_schema_name or undefined_table or duplicate_object then null; end $$;

do $$ begin
  create policy "Project Documents Storage Delete" on storage.objects
    for delete to authenticated
    using (
      bucket_id = 'project-documents'
      and owner_id = auth.uid()::text
    );
exception when invalid_schema_name or undefined_table or duplicate_object then null; end $$;
