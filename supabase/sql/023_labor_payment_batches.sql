-- Labor payment batches for administrative payroll traceability
-- Run after:
--   1) 015_labor_entries.sql

create table if not exists public.labor_payment_batches (
  id uuid primary key default gen_random_uuid(),
  project_id bigint not null references public.projects(id) on delete cascade,
  batch_number text not null,
  period_start date not null,
  period_end date not null,
  total_amount numeric(14,2) not null default 0 check (total_amount >= 0),
  status text not null default 'draft'
    check (status in ('draft', 'approved', 'paid')),
  notes text,
  created_by bigint references public.employees(id) on delete set null,
  approved_by bigint references public.employees(id) on delete set null,
  approved_at timestamptz,
  paid_by bigint references public.employees(id) on delete set null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (project_id, batch_number)
);

alter table public.labor_payment_batches
  alter column status set default 'draft';

create index if not exists idx_labor_payment_batches_project_period
  on public.labor_payment_batches(project_id, period_end desc);

alter table public.labor_entries
  add column if not exists payment_batch_id uuid references public.labor_payment_batches(id) on delete set null,
  add column if not exists approved_by bigint references public.employees(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists paid_by bigint references public.employees(id) on delete set null,
  add column if not exists paid_at timestamptz;

create index if not exists idx_labor_entries_payment_batch
  on public.labor_entries(payment_batch_id);

alter table public.labor_payment_batches enable row level security;

drop policy if exists "labor_payment_batches_select_operator_pm" on public.labor_payment_batches;
drop policy if exists "labor_payment_batches_insert_operator_pm" on public.labor_payment_batches;
drop policy if exists "labor_payment_batches_update_operator_pm" on public.labor_payment_batches;
drop policy if exists "labor_payment_batches_delete_operator_pm" on public.labor_payment_batches;

create policy "labor_payment_batches_select_operator_pm"
on public.labor_payment_batches
for select
to authenticated
using (
  public.current_role() in ('operator', 'pm')
  and public.user_has_project_access(project_id)
);

create policy "labor_payment_batches_insert_operator_pm"
on public.labor_payment_batches
for insert
to authenticated
with check (
  public.current_role() in ('operator', 'pm')
  and public.user_has_project_access(project_id)
);

create policy "labor_payment_batches_update_operator_pm"
on public.labor_payment_batches
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

create policy "labor_payment_batches_delete_operator_pm"
on public.labor_payment_batches
for delete
to authenticated
using (
  public.current_role() in ('operator', 'pm')
  and public.user_has_project_access(project_id)
);

create or replace function public.guard_labor_payment_batch_consistency()
returns trigger
language plpgsql
as $$
declare
  batch_row public.labor_payment_batches%rowtype;
begin
  if public.current_role() = 'inspector' then
    if new.payment_status <> 'pending'
      or new.payment_batch_id is not null
      or new.approved_by is not null
      or new.approved_at is not null
      or new.paid_by is not null
      or new.paid_at is not null then
      raise exception 'Inspectors can only register pending labor entries.';
    end if;
  end if;

  if new.payment_status = 'paid' and new.payment_batch_id is null then
    raise exception 'Paid labor entries require a labor payment batch.';
  end if;

  if new.payment_batch_id is null then
    if new.payment_status = 'pending' then
      new.approved_by = null;
      new.approved_at = null;
      new.paid_by = null;
      new.paid_at = null;
    elsif new.payment_status = 'approved' then
      if tg_op = 'UPDATE' then
        new.approved_by = coalesce(new.approved_by, old.approved_by, public.current_employee_id());
        new.approved_at = coalesce(new.approved_at, old.approved_at, now());
      else
        new.approved_by = coalesce(new.approved_by, public.current_employee_id());
        new.approved_at = coalesce(new.approved_at, now());
      end if;
      new.paid_by = null;
      new.paid_at = null;
    end if;
    return new;
  end if;

  select *
  into batch_row
  from public.labor_payment_batches
  where id = new.payment_batch_id;

  if batch_row.id is null then
    raise exception 'Labor payment batch not found.';
  end if;

  if batch_row.project_id <> new.project_id then
    raise exception 'Labor payment batch does not belong to the same project.';
  end if;

  if new.payment_status not in ('approved', 'paid') then
    raise exception 'Labor entries assigned to a batch must be approved or paid.';
  end if;

  if batch_row.status = 'paid' and new.payment_status <> 'paid' then
    raise exception 'Entries in a paid batch must remain paid.';
  end if;

  if batch_row.status <> 'paid' and new.payment_status <> 'approved' then
    raise exception 'Entries in open batches must remain approved until payment is registered.';
  end if;

  if tg_op = 'UPDATE' then
    new.approved_by = coalesce(new.approved_by, old.approved_by, public.current_employee_id());
    new.approved_at = coalesce(new.approved_at, old.approved_at, now());
  else
    new.approved_by = coalesce(new.approved_by, public.current_employee_id());
    new.approved_at = coalesce(new.approved_at, now());
  end if;

  if batch_row.status = 'paid' then
    if tg_op = 'UPDATE' then
      new.paid_by = coalesce(new.paid_by, old.paid_by, batch_row.paid_by, public.current_employee_id());
      new.paid_at = coalesce(new.paid_at, old.paid_at, batch_row.paid_at, now());
    else
      new.paid_by = coalesce(new.paid_by, batch_row.paid_by, public.current_employee_id());
      new.paid_at = coalesce(new.paid_at, batch_row.paid_at, now());
    end if;
  else
    new.paid_by = null;
    new.paid_at = null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_labor_payment_batch_consistency on public.labor_entries;
create trigger trg_guard_labor_payment_batch_consistency
before insert or update on public.labor_entries
for each row execute function public.guard_labor_payment_batch_consistency();

create or replace function public.sync_labor_payment_batch_total(target_batch_id uuid)
returns void
language plpgsql
as $$
declare
  batch_total numeric(14,2) := 0;
  paid_entries integer := 0;
  total_entries integer := 0;
begin
  if target_batch_id is null then
    return;
  end if;

  select
    coalesce(sum(amount_paid), 0),
    count(*),
    count(*) filter (where payment_status = 'paid')
  into batch_total, total_entries, paid_entries
  from public.labor_entries
  where payment_batch_id = target_batch_id;

  update public.labor_payment_batches
  set
    total_amount = batch_total,
    status = case
      when total_entries = 0 then 'draft'
      when paid_entries = total_entries then 'paid'
      else 'approved'
    end
  where id = target_batch_id;
end;
$$;

create or replace function public.handle_labor_payment_batch_change()
returns trigger
language plpgsql
as $$
begin
  perform public.sync_labor_payment_batch_total(coalesce(new.payment_batch_id, old.payment_batch_id));
  if tg_op = 'UPDATE' and new.payment_batch_id is distinct from old.payment_batch_id then
    perform public.sync_labor_payment_batch_total(old.payment_batch_id);
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_handle_labor_payment_batch_change on public.labor_entries;
create trigger trg_handle_labor_payment_batch_change
after insert or update or delete on public.labor_entries
for each row execute function public.handle_labor_payment_batch_change();

create or replace function public.guard_labor_payment_batch_updates()
returns trigger
language plpgsql
as $$
declare
  entry_count integer := 0;
  pending_count integer := 0;
begin
  if new.project_id is distinct from old.project_id then
    raise exception 'Labor payment batch project cannot be changed.';
  end if;

  if new.period_end < new.period_start then
    raise exception 'Labor payment batch period end cannot be earlier than period start.';
  end if;

  if old.status = 'paid' and new.status <> old.status then
    raise exception 'Paid labor batches cannot be reopened.';
  end if;

  if new.status = 'paid' and old.status <> 'paid' then
    if public.current_role() <> 'operator' then
      raise exception 'Only operators can mark labor payment batches as paid.';
    end if;

    select
      count(*),
      count(*) filter (where payment_status = 'pending')
    into entry_count, pending_count
    from public.labor_entries
    where payment_batch_id = old.id;

    if entry_count = 0 then
      raise exception 'Cannot mark an empty labor payment batch as paid.';
    end if;

    if pending_count > 0 then
      raise exception 'All labor entries must be approved before registering payment.';
    end if;

    new.approved_by = coalesce(new.approved_by, old.approved_by, public.current_employee_id());
    new.approved_at = coalesce(new.approved_at, old.approved_at, now());
    new.paid_by = coalesce(new.paid_by, old.paid_by, public.current_employee_id());
    new.paid_at = coalesce(new.paid_at, old.paid_at, now());
  elsif new.status = 'approved' then
    new.approved_by = coalesce(new.approved_by, old.approved_by, public.current_employee_id());
    new.approved_at = coalesce(new.approved_at, old.approved_at, now());
    new.paid_by = null;
    new.paid_at = null;
  elsif new.status = 'draft' then
    new.approved_by = null;
    new.approved_at = null;
    new.paid_by = null;
    new.paid_at = null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_labor_payment_batch_updates on public.labor_payment_batches;
create trigger trg_guard_labor_payment_batch_updates
before update on public.labor_payment_batches
for each row execute function public.guard_labor_payment_batch_updates();

create or replace function public.handle_labor_payment_batch_status_change()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'paid' and old.status <> 'paid' then
    update public.labor_entries
    set
      payment_status = 'paid',
      approved_by = coalesce(approved_by, new.approved_by),
      approved_at = coalesce(approved_at, new.approved_at, now()),
      paid_by = coalesce(new.paid_by, public.current_employee_id()),
      paid_at = coalesce(new.paid_at, now())
    where payment_batch_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_handle_labor_payment_batch_status_change on public.labor_payment_batches;
create trigger trg_handle_labor_payment_batch_status_change
after update on public.labor_payment_batches
for each row execute function public.handle_labor_payment_batch_status_change();
