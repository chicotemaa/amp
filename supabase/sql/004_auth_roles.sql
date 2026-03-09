-- Auth + Roles bootstrap for AMP (B2B2C)
-- Run after:
--   1) supabase/sql/001_init_projects_documents.sql
--   2) supabase/sql/002_full_domain.sql
--   3) supabase/sql/003_execution_workflow.sql

-- =========================
-- Enums
-- =========================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'role_type') then
    create type public.role_type as enum ('operator', 'pm', 'inspector', 'client');
  end if;
end $$;

-- =========================
-- Profiles
-- =========================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.role_type not null,
  full_name text,
  employee_id bigint references public.employees(id) on delete set null,
  client_id bigint references public.clients(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_owner_check check (
    (role in ('operator', 'pm', 'inspector') and client_id is null)
    or (role = 'client' and employee_id is null)
  )
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_employee_id on public.profiles(employee_id);
create index if not exists idx_profiles_client_id on public.profiles(client_id);

-- Keep updated_at consistent
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_touch_updated_at on public.profiles;
create trigger trg_profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

-- Auto-create profile after signup (default: client placeholder)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (new.id, 'client', coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- =========================
-- Helper functions for RLS
-- =========================
create or replace function public.current_role()
returns public.role_type
language sql
stable
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
    and p.is_active = true
  limit 1
$$;

create or replace function public.is_operator()
returns boolean
language sql
stable
as $$
  select public.current_role() = 'operator'
$$;

-- =========================
-- RLS on profiles
-- =========================
alter table public.profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_select_self_or_operator'
  ) then
    create policy "profiles_select_self_or_operator"
      on public.profiles
      for select
      to authenticated
      using (id = auth.uid() or public.is_operator());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_update_self_or_operator'
  ) then
    create policy "profiles_update_self_or_operator"
      on public.profiles
      for update
      to authenticated
      using (id = auth.uid() or public.is_operator())
      with check (id = auth.uid() or public.is_operator());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_insert_operator_only'
  ) then
    create policy "profiles_insert_operator_only"
      on public.profiles
      for insert
      to authenticated
      with check (public.is_operator());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_delete_operator_only'
  ) then
    create policy "profiles_delete_operator_only"
      on public.profiles
      for delete
      to authenticated
      using (public.is_operator());
  end if;
end $$;

-- NOTE:
-- After creating users in Supabase Auth, set their final role and owner reference:
--   update public.profiles set role='operator', employee_id=5 where id='<auth_user_uuid>';
--   update public.profiles set role='client', client_id=2 where id='<auth_user_uuid>';
