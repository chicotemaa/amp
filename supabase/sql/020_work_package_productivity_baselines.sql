-- Work package productivity baselines for earned value and phase efficiency
-- Run after:
--   1) 019_work_packages_and_measured_progress.sql

alter table public.work_packages
  add column if not exists budget_category text not null default 'labor'
    check (budget_category in ('materials', 'labor', 'equipment', 'services', 'subcontracts', 'contingency')),
  add column if not exists planned_unit_cost numeric(14,2) not null default 0 check (planned_unit_cost >= 0),
  add column if not exists planned_hours_per_unit numeric(10,2) not null default 0 check (planned_hours_per_unit >= 0);
