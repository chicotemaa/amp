-- Work packages + measured progress for phase-level execution control
-- Run after:
--   1) 014_site_daily_logs_and_milestone_governance.sql
--   2) 018_project_certificates_and_collections.sql

create table if not exists public.work_packages (
  id uuid primary key default gen_random_uuid(),
  project_id bigint not null references public.projects(id) on delete cascade,
  phase_id uuid not null references public.project_phases(id) on delete cascade,
  name text not null,
  unit text not null default 'u',
  planned_qty numeric(14,2) not null check (planned_qty > 0),
  executed_qty numeric(14,2) not null default 0 check (executed_qty >= 0),
  weight numeric(6,2) not null default 0 check (weight >= 0),
  status text not null default 'planned'
    check (status in ('planned', 'in_progress', 'completed', 'blocked')),
  created_at timestamptz not null default now(),
  unique (phase_id, name)
);

create index if not exists idx_work_packages_project_phase
  on public.work_packages(project_id, phase_id);

alter table public.progress_updates
  add column if not exists work_package_id uuid references public.work_packages(id) on delete set null,
  add column if not exists executed_qty numeric(14,2) check (executed_qty is null or executed_qty >= 0);

create index if not exists idx_progress_updates_work_package_id
  on public.progress_updates(work_package_id);

alter table public.work_packages enable row level security;

drop policy if exists "work_packages_select_by_role" on public.work_packages;
drop policy if exists "work_packages_insert_operator_pm" on public.work_packages;
drop policy if exists "work_packages_update_operator_pm" on public.work_packages;
drop policy if exists "work_packages_delete_operator_pm" on public.work_packages;

create policy "work_packages_select_by_role"
on public.work_packages
for select
to authenticated
using (public.user_has_project_access(project_id));

create policy "work_packages_insert_operator_pm"
on public.work_packages
for insert
to authenticated
with check (
  public.current_role() = 'operator'
  or (public.current_role() = 'pm' and public.user_has_project_access(project_id))
);

create policy "work_packages_update_operator_pm"
on public.work_packages
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

create policy "work_packages_delete_operator_pm"
on public.work_packages
for delete
to authenticated
using (
  public.current_role() = 'operator'
  or (public.current_role() = 'pm' and public.user_has_project_access(project_id))
);

create or replace function public.guard_progress_update_measurements()
returns trigger
language plpgsql
as $$
declare
  package_row public.work_packages%rowtype;
begin
  if new.work_package_id is not null then
    select *
    into package_row
    from public.work_packages
    where id = new.work_package_id;

    if package_row.id is null then
      raise exception 'Work package not found.';
    end if;

    if package_row.project_id <> new.project_id then
      raise exception 'Work package does not belong to the same project.';
    end if;

    if new.phase_id is not null and new.phase_id <> package_row.phase_id then
      raise exception 'Work package does not belong to the selected phase.';
    end if;

    if new.executed_qty is null or new.executed_qty <= 0 then
      raise exception 'Measured progress requires an executed quantity greater than zero.';
    end if;

    new.phase_id = package_row.phase_id;
  elsif new.executed_qty is not null and new.executed_qty > 0 then
    raise exception 'Executed quantity requires a work package.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_progress_update_measurements on public.progress_updates;
create trigger trg_guard_progress_update_measurements
before insert or update on public.progress_updates
for each row execute function public.guard_progress_update_measurements();
