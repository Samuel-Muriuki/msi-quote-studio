-- CAD uploads: SVG (and later DXF/PDF) drawings the estimator uploads to
-- speed up dimension entry on a line. Stores extracted bounding-box +
-- path count as a complexity hint that the AI prompt will use later.
--
-- Files themselves live in the cad-uploads Storage bucket; this table is
-- the metadata index. Rows are created via a server action that handles
-- auth, validation and the storage upload atomically.

create table if not exists cad_uploads (
  id                  uuid          primary key default gen_random_uuid(),
  estimator_id        text          not null references "user"(id) on delete cascade,
  storage_path        text          not null unique,
  original_filename   text          not null,
  mime_type           text          not null,
  file_size_bytes     int           not null,
  -- Extracted properties (nullable until parser succeeds)
  width_inches        numeric(8,3),
  height_inches       numeric(8,3),
  path_count          int,
  parse_error         text,
  created_at          timestamptz   not null default now()
);

create index if not exists idx_cad_uploads_estimator
  on cad_uploads(estimator_id, created_at desc);

alter table cad_uploads enable row level security;
-- Server-only access (no anon policy). The Storage bucket has its own
-- per-user policies via storage.objects RLS below.

-- Create the private storage bucket idempotently.
insert into storage.buckets (id, name, public)
values ('cad-uploads', 'cad-uploads', false)
on conflict (id) do nothing;

-- Storage RLS: each estimator can only read/write their own folder. The
-- folder convention is `{user_id}/{file}`; better-auth user.id is the first
-- path segment.
drop policy if exists "cad uploads owner read"  on storage.objects;
drop policy if exists "cad uploads owner write" on storage.objects;
drop policy if exists "cad uploads owner update" on storage.objects;
drop policy if exists "cad uploads owner delete" on storage.objects;

-- We use the service role from the server (bypasses RLS), so these policies
-- exist for defence in depth in case the anon key is ever used here. They
-- restrict to the auth.uid() folder which is the Supabase Auth pattern;
-- since Better Auth doesn't populate auth.uid(), anon access is effectively
-- closed.
create policy "cad uploads owner read"
  on storage.objects for select to authenticated
  using (bucket_id = 'cad-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "cad uploads owner write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'cad-uploads' and (storage.foldername(name))[1] = auth.uid()::text);
