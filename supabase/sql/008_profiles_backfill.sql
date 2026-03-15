-- Profiles backfill + trigger hardening
-- Run after:
--   1) 004_auth_roles.sql

-- Ensure signup trigger function exists
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

-- Ensure trigger exists on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Backfill missing profiles for already-created auth users
insert into public.profiles (id, role, full_name)
select
  u.id,
  'client'::public.role_type,
  coalesce(u.raw_user_meta_data->>'full_name', u.email)
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- Optional quality fix: fill empty profile names from auth.users
update public.profiles p
set full_name = coalesce(u.raw_user_meta_data->>'full_name', u.email)
from auth.users u
where u.id = p.id
  and (p.full_name is null or btrim(p.full_name) = '');
