-- Work package traceability for labor and procurement
-- Run after:
--   1) 020_work_package_productivity_baselines.sql

alter table public.labor_entries
  add column if not exists work_package_id uuid references public.work_packages(id) on delete set null;

create index if not exists idx_labor_entries_work_package_date
  on public.labor_entries(work_package_id, work_date desc);

alter table public.purchase_orders
  add column if not exists work_package_id uuid references public.work_packages(id) on delete set null;

create index if not exists idx_purchase_orders_work_package
  on public.purchase_orders(work_package_id);

create or replace function public.guard_labor_entry_work_package_consistency()
returns trigger
language plpgsql
as $$
declare
  package_row public.work_packages%rowtype;
begin
  if new.work_package_id is null then
    return new;
  end if;

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

  new.phase_id = package_row.phase_id;
  return new;
end;
$$;

drop trigger if exists trg_guard_labor_entry_work_package_consistency on public.labor_entries;
create trigger trg_guard_labor_entry_work_package_consistency
before insert or update on public.labor_entries
for each row execute function public.guard_labor_entry_work_package_consistency();

create or replace function public.guard_purchase_order_work_package_consistency()
returns trigger
language plpgsql
as $$
declare
  package_row public.work_packages%rowtype;
begin
  if new.work_package_id is null then
    return new;
  end if;

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

  new.phase_id = package_row.phase_id;
  return new;
end;
$$;

drop trigger if exists trg_guard_purchase_order_work_package_consistency on public.purchase_orders;
create trigger trg_guard_purchase_order_work_package_consistency
before insert or update on public.purchase_orders
for each row execute function public.guard_purchase_order_work_package_consistency();
