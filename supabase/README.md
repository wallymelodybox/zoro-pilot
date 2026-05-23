# Supabase setup

## Empty database

This project expects the SQL files in `supabase/migrations` to be applied in
lexicographic order.

The first migration, `20231231000000_initial_schema.sql`, creates the base
tables that were previously stored only in the root `supabase-schema.sql` file.
It must run before the incremental migrations.

To initialize a new empty Supabase project:

1. Update `.env.local` with the new project values:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
2. Apply all files in `supabase/migrations` in order with the Supabase CLI,
   the Supabase SQL editor, or a direct PostgreSQL connection.
3. Confirm the storage buckets exist:
   - `avatars`
   - `chat-media`

Direct terminal deployment requires either a Supabase access token linked to
the project or the database connection string/password.
