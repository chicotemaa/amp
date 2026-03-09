-- Supabase bootstrap for AMP documents module
-- Run in Supabase SQL Editor

create extension if not exists pgcrypto;

-- Projects table (minimal schema needed for FK integrity with documents.project_id)
create table if not exists public.projects (
  id bigint primary key,
  name text not null,
  location text,
  type text check (type in ('residential', 'commercial', 'industrial')),
  status text check (status in ('in-progress', 'planning', 'completed', 'on-hold')),
  progress integer check (progress >= 0 and progress <= 100),
  start_date date,
  end_date date,
  team_size integer,
  budget numeric(14, 2),
  image text,
  client_id bigint,
  on_track boolean default true,
  description text,
  created_at timestamptz not null default now()
);

-- Seed demo projects used by the current frontend (safe re-run with ON CONFLICT)
insert into public.projects (
  id, name, location, type, status, progress, start_date, end_date,
  team_size, budget, image, client_id, on_track, description
)
values
  (1, 'Torre Residencial Marina', 'Zona Costera Este', 'residential', 'in-progress', 75, '2024-01-15', '2024-08-30', 15, 2500000, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=60', 1, true, 'Complejo residencial de 12 plantas con amenities en primera línea de playa.'),
  (2, 'Centro Comercial Plaza Norte', 'Distrito Financiero', 'commercial', 'planning', 25, '2024-04-01', '2025-03-31', 20, 4800000, 'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?w=800&auto=format&fit=crop&q=60', 2, true, 'Centro comercial de 3 niveles con 85 locales y estacionamiento subterráneo.'),
  (3, 'Complejo Deportivo Olímpico', 'Parque Central', 'commercial', 'in-progress', 45, '2024-02-15', '2024-12-15', 18, 3200000, 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&auto=format&fit=crop&q=60', 5, false, 'Complejo multiusos con piscina olímpica, pistas de atletismo y gimnasio.'),
  (4, 'Hospital Metropolitano', 'Distrito Sanitario Norte', 'industrial', 'planning', 10, '2024-05-01', '2025-09-30', 25, 6500000, 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&auto=format&fit=crop&q=60', 4, true, 'Hospital de alta complejidad con 200 camas y sector de emergencias.'),
  (5, 'Eco-Resort Costa Verde', 'Bahía del Sol', 'residential', 'completed', 100, '2023-06-15', '2024-02-28', 12, 1800000, 'https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?w=800&auto=format&fit=crop&q=60', 3, true, 'Resort sustentable con 40 cabañas, centro de spa y restaurante orgánico.'),
  (6, 'Campus Universitario Tech', 'Zona Educativa Sur', 'industrial', 'in-progress', 60, '2023-09-01', '2024-09-30', 22, 5200000, 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop&q=60', 2, true, 'Campus tecnológico con 4 edificios académicos, biblioteca y coworking.')
on conflict (id) do update set
  name = excluded.name,
  location = excluded.location,
  type = excluded.type,
  status = excluded.status,
  progress = excluded.progress,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  team_size = excluded.team_size,
  budget = excluded.budget,
  image = excluded.image,
  client_id = excluded.client_id,
  on_track = excluded.on_track,
  description = excluded.description;

-- Documents table
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('pdf', 'image', 'plan', 'spreadsheet', 'other')),
  stage text not null check (stage in ('general', 'foundations', 'structure', 'enclosures', 'installations', 'finishes', 'delivery')),
  version text not null default '1.0',
  file_url text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  description text,
  is_photo boolean not null default false,
  project_id bigint not null references public.projects(id) on delete cascade,
  uploaded_at timestamptz not null default now()
);

create index if not exists idx_documents_project_id on public.documents(project_id);
create index if not exists idx_documents_uploaded_at on public.documents(uploaded_at desc);

-- RLS for table access from anon/authenticated client
alter table public.projects enable row level security;
alter table public.documents enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'projects'
      and policyname = 'projects_select_all'
  ) then
    create policy "projects_select_all"
    on public.projects
    for select
    to anon, authenticated
    using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'projects'
      and policyname = 'projects_insert_all'
  ) then
    create policy "projects_insert_all"
    on public.projects
    for insert
    to anon, authenticated
    with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'projects'
      and policyname = 'projects_update_all'
  ) then
    create policy "projects_update_all"
    on public.projects
    for update
    to anon, authenticated
    using (true)
    with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'projects'
      and policyname = 'projects_delete_all'
  ) then
    create policy "projects_delete_all"
    on public.projects
    for delete
    to anon, authenticated
    using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'documents'
      and policyname = 'documents_select_all'
  ) then
    create policy "documents_select_all"
    on public.documents
    for select
    to anon, authenticated
    using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'documents'
      and policyname = 'documents_insert_all'
  ) then
    create policy "documents_insert_all"
    on public.documents
    for insert
    to anon, authenticated
    with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'documents'
      and policyname = 'documents_update_all'
  ) then
    create policy "documents_update_all"
    on public.documents
    for update
    to anon, authenticated
    using (true)
    with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'documents'
      and policyname = 'documents_delete_all'
  ) then
    create policy "documents_delete_all"
    on public.documents
    for delete
    to anon, authenticated
    using (true);
  end if;
end $$;

-- Storage bucket
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

-- Storage RLS policies
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'documents_bucket_public_read'
  ) then
    create policy "documents_bucket_public_read"
    on storage.objects
    for select
    to anon, authenticated
    using (bucket_id = 'documents');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'documents_bucket_insert'
  ) then
    create policy "documents_bucket_insert"
    on storage.objects
    for insert
    to anon, authenticated
    with check (bucket_id = 'documents');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'documents_bucket_update'
  ) then
    create policy "documents_bucket_update"
    on storage.objects
    for update
    to anon, authenticated
    using (bucket_id = 'documents')
    with check (bucket_id = 'documents');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'documents_bucket_delete'
  ) then
    create policy "documents_bucket_delete"
    on storage.objects
    for delete
    to anon, authenticated
    using (bucket_id = 'documents');
  end if;
end $$;
