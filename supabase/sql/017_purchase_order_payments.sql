-- Purchase order payments + due dates for procurement administration
-- Run after:
--   1) 016_suppliers_and_purchase_orders.sql

alter table public.purchase_orders
  add column if not exists invoice_number text,
  add column if not exists due_date date;

create table if not exists public.purchase_order_payments (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  project_id bigint not null references public.projects(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  payment_date date not null default current_date,
  reference text,
  notes text,
  created_by bigint references public.employees(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_purchase_order_payments_project_date
  on public.purchase_order_payments(project_id, payment_date desc);

create index if not exists idx_purchase_order_payments_order_id
  on public.purchase_order_payments(purchase_order_id);

insert into public.purchase_order_payments (
  purchase_order_id,
  project_id,
  amount,
  payment_date,
  reference,
  notes,
  created_by
)
select
  po.id,
  po.project_id,
  po.total_amount,
  coalesce(po.payment_date, po.received_date, po.order_date),
  po.invoice_number,
  'Backfill de compra marcada como pagada antes de registrar pagos parciales.',
  po.created_by
from public.purchase_orders po
left join public.purchase_order_payments pop
  on pop.purchase_order_id = po.id
where po.status = 'paid'
  and pop.id is null;

alter table public.purchase_order_payments enable row level security;

drop policy if exists "purchase_order_payments_select_by_role" on public.purchase_order_payments;
drop policy if exists "purchase_order_payments_insert_operator_pm" on public.purchase_order_payments;
drop policy if exists "purchase_order_payments_update_operator_pm" on public.purchase_order_payments;
drop policy if exists "purchase_order_payments_delete_operator_pm" on public.purchase_order_payments;

create policy "purchase_order_payments_select_by_role"
on public.purchase_order_payments
for select
to authenticated
using (
  public.current_role() in ('operator', 'pm', 'inspector')
  and public.user_has_project_access(project_id)
);

create policy "purchase_order_payments_insert_operator_pm"
on public.purchase_order_payments
for insert
to authenticated
with check (
  public.current_role() in ('operator', 'pm')
  and public.user_has_project_access(project_id)
);

create policy "purchase_order_payments_update_operator_pm"
on public.purchase_order_payments
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

create policy "purchase_order_payments_delete_operator_pm"
on public.purchase_order_payments
for delete
to authenticated
using (
  public.current_role() in ('operator', 'pm')
  and public.user_has_project_access(project_id)
);

create or replace function public.guard_purchase_order_payment_consistency()
returns trigger
language plpgsql
as $$
declare
  order_row public.purchase_orders%rowtype;
  paid_total numeric(14,2) := 0;
begin
  select *
  into order_row
  from public.purchase_orders
  where id = new.purchase_order_id;

  if order_row.id is null then
    raise exception 'Purchase order not found.';
  end if;

  if order_row.status = 'cancelled' then
    raise exception 'Cannot register payments for cancelled purchase orders.';
  end if;

  if order_row.status = 'draft' then
    raise exception 'Cannot register payments for draft purchase orders.';
  end if;

  new.project_id = order_row.project_id;

  if tg_op = 'UPDATE' then
    select coalesce(sum(amount), 0)
    into paid_total
    from public.purchase_order_payments
    where purchase_order_id = new.purchase_order_id
      and id <> old.id;
  else
    select coalesce(sum(amount), 0)
    into paid_total
    from public.purchase_order_payments
    where purchase_order_id = new.purchase_order_id;
  end if;

  if paid_total + new.amount > order_row.total_amount then
    raise exception 'Payment exceeds remaining amount for purchase order.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_purchase_order_payment_consistency on public.purchase_order_payments;
create trigger trg_guard_purchase_order_payment_consistency
before insert or update on public.purchase_order_payments
for each row execute function public.guard_purchase_order_payment_consistency();

create or replace function public.sync_purchase_order_payment_state(target_order_id uuid)
returns void
language plpgsql
as $$
declare
  order_row public.purchase_orders%rowtype;
  paid_total numeric(14,2) := 0;
  latest_payment_date date;
  next_status text;
begin
  select *
  into order_row
  from public.purchase_orders
  where id = target_order_id;

  if order_row.id is null then
    return;
  end if;

  select
    coalesce(sum(amount), 0),
    max(payment_date)
  into paid_total, latest_payment_date
  from public.purchase_order_payments
  where purchase_order_id = target_order_id;

  if order_row.status = 'cancelled' then
    update public.purchase_orders
    set payment_date = latest_payment_date
    where id = target_order_id;
    return;
  end if;

  if paid_total >= order_row.total_amount and order_row.total_amount > 0 then
    next_status := 'paid';
  elsif order_row.received_date is not null then
    next_status := 'received';
  elsif order_row.status = 'paid' then
    next_status := 'ordered';
  else
    next_status := order_row.status;
  end if;

  update public.purchase_orders
  set
    status = next_status,
    payment_date = latest_payment_date
  where id = target_order_id;
end;
$$;

create or replace function public.handle_purchase_order_payment_change()
returns trigger
language plpgsql
as $$
begin
  perform public.sync_purchase_order_payment_state(coalesce(new.purchase_order_id, old.purchase_order_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_handle_purchase_order_payment_change on public.purchase_order_payments;
create trigger trg_handle_purchase_order_payment_change
after insert or update or delete on public.purchase_order_payments
for each row execute function public.handle_purchase_order_payment_change();

create or replace function public.guard_purchase_order_updates()
returns trigger
language plpgsql
as $$
declare
  paid_total numeric(14,2) := 0;
begin
  if public.current_role() = 'inspector' then
    if new.project_id is distinct from old.project_id
      or new.material_id is distinct from old.material_id
      or new.supplier_id is distinct from old.supplier_id
      or new.phase_id is distinct from old.phase_id
      or new.category is distinct from old.category
      or new.description is distinct from old.description
      or new.unit is distinct from old.unit
      or new.quantity is distinct from old.quantity
      or new.unit_cost is distinct from old.unit_cost
      or new.total_amount is distinct from old.total_amount
      or new.order_date is distinct from old.order_date
      or new.expected_date is distinct from old.expected_date
      or new.due_date is distinct from old.due_date
      or new.invoice_number is distinct from old.invoice_number
      or new.payment_date is distinct from old.payment_date
      or new.created_by is distinct from old.created_by
      or new.created_at is distinct from old.created_at then
      raise exception 'Inspectors can only acknowledge purchase order receipt.';
    end if;

    if new.status <> 'received' then
      raise exception 'Inspectors can only set purchase orders to received.';
    end if;
  end if;

  if new.status = 'paid' then
    select coalesce(sum(amount), 0)
    into paid_total
    from public.purchase_order_payments
    where purchase_order_id = old.id;

    if paid_total < old.total_amount then
      raise exception 'Purchase orders can only be marked as paid through registered payments.';
    end if;
  end if;

  return new;
end;
$$;
