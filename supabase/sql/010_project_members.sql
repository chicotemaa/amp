-- Project members access layer
-- Run after:
--   1) 002_full_domain.sql
--   2) 004_auth_roles.sql
--   3) 005_rbac_project_policies.sql

create extension if not exists pgcrypto;

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id bigint not null references public.projects(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  assignment_role text not null check (assignment_role in ('lead_pm', 'pm', 'inspector', 'viewer')),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (project_id, profile_id)
);

create index if not exists idx_project_members_project_id
  on public.project_members(project_id);

create index if not exists idx_project_members_profile_id
  on public.project_members(profile_id);

-- Backfill current employee assignments into the new access table.
insert into public.project_members (project_id, profile_id, assignment_role, is_primary)
select
  ep.project_id,
  p.id,
  case
    when p.role = 'pm' then 'pm'
    when p.role = 'inspector' then 'inspector'
    else 'viewer'
  end as assignment_role,
  false
from public.employee_projects ep
join public.profiles p on p.employee_id = ep.employee_id
where p.role in ('pm', 'inspector')
on conflict (project_id, profile_id) do nothing;

create or replace function public.user_has_project_access(p_project_id bigint)
returns boolean
language sql
stable
as $$
  select
    case
      when public.current_role() = 'operator' then true
      when public.current_role() in ('pm', 'inspector') then exists (
        select 1
        from public.project_members pm
        where pm.project_id = p_project_id
          and pm.profile_id = auth.uid()
      ) or exists (
        select 1
        from public.employee_projects ep
        where ep.project_id = p_project_id
          and ep.employee_id = public.current_employee_id()
      )
      when public.current_role() = 'client' then exists (
        select 1
        from public.client_projects cp
        where cp.project_id = p_project_id
          and cp.client_id = public.current_client_id()
      )
      else false
    end
$$;

alter table public.project_members enable row level security;

drop policy if exists "project_members_select_by_role" on public.project_members;
drop policy if exists "project_members_insert_operator_pm" on public.project_members;
drop policy if exists "project_members_update_operator_pm" on public.project_members;
drop policy if exists "project_members_delete_operator_only" on public.project_members;

create policy "project_members_select_by_role"
on public.project_members
for select
to authenticated
using (
  public.current_role() = 'operator'
  or profile_id = auth.uid()
  or public.user_has_project_access(project_id)
);

create policy "project_members_insert_operator_pm"
on public.project_members
for insert
to authenticated
with check (
  public.current_role() = 'operator'
  or (public.current_role() = 'pm' and public.user_has_project_access(project_id))
);

create policy "project_members_update_operator_pm"
on public.project_members
for update
to authenticated
using (
  public.current_role() = 'operator'
  or (public.current_role() = 'pm' and public.user_has_project_access(project_id))
)
with check (
  public.current_role() = 'operator'
  or (public.current_role() = 'pm' and public.user_has_project_access(project_id))
);

create policy "project_members_delete_operator_only"
on public.project_members
for delete
to authenticated
using (public.current_role() = 'operator');
