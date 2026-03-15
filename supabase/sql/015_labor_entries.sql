-- Labor entries for project-level workforce cost tracking
-- Run after:
--   1) 005_rbac_project_policies.sql
--   2) 014_site_daily_logs_and_milestone_governance.sql

create table if not exists public.labor_entries (
  id uuid primary key default gen_random_uuid(),
  project_id bigint not null references public.projects(id) on delete cascade,
  phase_id uuid references public.project_phases(id) on delete set null,
  employee_id bigint not null references public.employees(id) on delete cascade,
  work_date date not null,
  hours_worked numeric(6,2) not null default 0 check (hours_worked >= 0),
  hourly_rate numeric(14,2) not null default 0 check (hourly_rate >= 0),
  amount_paid numeric(14,2) not null default 0 check (amount_paid >= 0),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'approved', 'paid')),
  notes text,
  created_by bigint references public.employees(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_labor_entries_project_date
  on public.labor_entries(project_id, work_date desc);

create index if not exists idx_labor_entries_employee_date
  on public.labor_entries(employee_id, work_date desc);

alter table public.labor_entries enable row level security;

drop policy if exists "labor_entries_select_by_role" on public.labor_entries;
drop policy if exists "labor_entries_insert_operator_pm_inspector" on public.labor_entries;
drop policy if exists "labor_entries_update_operator_pm" on public.labor_entries;
drop policy if exists "labor_entries_delete_operator_pm" on public.labor_entries;

create policy "labor_entries_select_by_role"
on public.labor_entries
for select
to authenticated
using (
  public.current_role() in ('operator', 'pm', 'inspector')
  and public.user_has_project_access(project_id)
);

create policy "labor_entries_insert_operator_pm_inspector"
on public.labor_entries
for insert
to authenticated
with check (
  public.current_role() in ('operator', 'pm', 'inspector')
  and public.user_has_project_access(project_id)
);

create policy "labor_entries_update_operator_pm"
on public.labor_entries
for update
to authenticated
using (
  public.current_role() in ('operator', 'pm')
  and public.user_has_project_access(project_id)
)
with check (
  public.current_role() in ('operator', 'pm')
  and public.user_has_project_access(project_id)
);

create policy "labor_entries_delete_operator_pm"
on public.labor_entries
for delete
to authenticated
using (
  public.current_role() in ('operator', 'pm')
  and public.user_has_project_access(project_id)
);
