-- Site daily logs + milestone governance hardening
-- Run after:
--   1) 005_rbac_project_policies.sql
--   2) 012_milestones_workflow.sql
--   3) 013_client_backend_hardening.sql

create table if not exists public.site_daily_logs (
  id uuid primary key default gen_random_uuid(),
  project_id bigint not null references public.projects(id) on delete cascade,
  phase_id uuid references public.project_phases(id) on delete set null,
  log_date date not null,
  weather_condition text not null default 'clear'
    check (weather_condition in ('clear', 'cloudy', 'rain', 'storm', 'wind', 'heat', 'cold', 'other')),
  weather_impact text not null default 'none'
    check (weather_impact in ('none', 'minor', 'moderate', 'severe')),
  workforce_count integer not null default 0 check (workforce_count >= 0),
  hours_worked numeric(6,2) not null default 0 check (hours_worked >= 0),
  hours_lost numeric(6,2) not null default 0 check (hours_lost >= 0),
  notes text,
  created_by bigint references public.employees(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (project_id, log_date)
);

create index if not exists idx_site_daily_logs_project_date
  on public.site_daily_logs(project_id, log_date desc);

alter table public.site_daily_logs enable row level security;

drop policy if exists "site_daily_logs_select_by_role" on public.site_daily_logs;
drop policy if exists "site_daily_logs_insert_operator_pm_inspector" on public.site_daily_logs;
drop policy if exists "site_daily_logs_update_operator_pm_inspector" on public.site_daily_logs;
drop policy if exists "site_daily_logs_delete_operator_pm" on public.site_daily_logs;

create policy "site_daily_logs_select_by_role"
on public.site_daily_logs
for select
to authenticated
using (
  public.current_role() in ('operator', 'pm', 'inspector')
  and public.user_has_project_access(project_id)
);

create policy "site_daily_logs_insert_operator_pm_inspector"
on public.site_daily_logs
for insert
to authenticated
with check (
  public.current_role() in ('operator', 'pm', 'inspector')
  and public.user_has_project_access(project_id)
);

create policy "site_daily_logs_update_operator_pm_inspector"
on public.site_daily_logs
for update
to authenticated
using (
  public.current_role() in ('operator', 'pm', 'inspector')
  and public.user_has_project_access(project_id)
)
with check (
  public.current_role() in ('operator', 'pm', 'inspector')
  and public.user_has_project_access(project_id)
);

create policy "site_daily_logs_delete_operator_pm"
on public.site_daily_logs
for delete
to authenticated
using (
  public.current_role() in ('operator', 'pm')
  and public.user_has_project_access(project_id)
);

drop policy if exists "milestones_insert_operator_pm_inspector" on public.milestones;
drop policy if exists "milestones_insert_operator_pm" on public.milestones;
create policy "milestones_insert_operator_pm"
on public.milestones
for insert
to authenticated
with check (
  public.current_role() = 'operator'
  or (public.current_role() = 'pm' and public.user_has_project_access(project_id))
);

drop policy if exists "milestones_update_operator_pm_inspector" on public.milestones;
drop policy if exists "milestones_update_by_role" on public.milestones;
create policy "milestones_update_by_role"
on public.milestones
for update
to authenticated
using (
  public.current_role() = 'operator'
  or (public.current_role() = 'pm' and public.user_has_project_access(project_id))
  or (public.current_role() = 'inspector' and public.user_has_project_access(project_id))
)
with check (
  public.current_role() = 'operator'
  or (public.current_role() = 'pm' and public.user_has_project_access(project_id))
  or (public.current_role() = 'inspector' and public.user_has_project_access(project_id))
);

create or replace function public.guard_milestone_updates()
returns trigger
language plpgsql
as $$
begin
  if public.current_role() = 'inspector' then
    if new.project_id is distinct from old.project_id
      or new.phase_id is distinct from old.phase_id
      or new.name is distinct from old.name
      or new.due_date is distinct from old.due_date
      or new.created_at is distinct from old.created_at
      or coalesce(new.is_client_visible, false) is distinct from coalesce(old.is_client_visible, false)
      or new.validated_at is distinct from old.validated_at
      or new.validated_by is distinct from old.validated_by then
      raise exception 'Inspectors can only update milestone execution statuses.';
    end if;

    if new.status not in ('pending', 'field_completed', 'rejected') then
      raise exception 'Inspectors can only set milestones to pending, field_completed or rejected.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_milestone_updates on public.milestones;
create trigger trg_guard_milestone_updates
before update on public.milestones
for each row execute function public.guard_milestone_updates();
