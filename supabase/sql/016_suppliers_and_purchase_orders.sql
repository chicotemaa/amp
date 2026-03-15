-- Suppliers + purchase orders for project procurement
-- Run after:
--   1) 007_materials_management.sql
--   2) 015_labor_entries.sql

create table if not exists public.suppliers (
  id bigint primary key,
  name text not null,
  contact_name text,
  email text,
  phone text,
  category text not null default 'materials'
    check (category in ('materials', 'services', 'equipment', 'subcontracts', 'general')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  project_id bigint not null references public.projects(id) on delete cascade,
  material_id uuid references public.materials(id) on delete set null,
  supplier_id bigint not null references public.suppliers(id) on delete restrict,
  phase_id uuid references public.project_phases(id) on delete set null,
  category text not null
    check (category in ('materials', 'services', 'equipment', 'subcontracts')),
  description text not null,
  unit text not null default 'u',
  quantity numeric(14,2) not null default 0 check (quantity >= 0),
  unit_cost numeric(14,2) not null default 0 check (unit_cost >= 0),
  total_amount numeric(14,2) not null default 0 check (total_amount >= 0),
  order_date date not null default current_date,
  expected_date date,
  received_date date,
  payment_date date,
  status text not null default 'ordered'
    check (status in ('draft', 'ordered', 'received', 'paid', 'cancelled')),
  notes text,
  created_by bigint references public.employees(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_purchase_orders_project_date
  on public.purchase_orders(project_id, order_date desc);

create index if not exists idx_purchase_orders_supplier_date
  on public.purchase_orders(supplier_id, order_date desc);

alter table public.suppliers enable row level security;
alter table public.purchase_orders enable row level security;

drop policy if exists "suppliers_select_by_role" on public.suppliers;
drop policy if exists "suppliers_insert_operator_pm" on public.suppliers;
drop policy if exists "suppliers_update_operator_pm" on public.suppliers;
drop policy if exists "suppliers_delete_operator_only" on public.suppliers;

create policy "suppliers_select_by_role"
on public.suppliers
for select
to authenticated
using (public.current_role() in ('operator', 'pm', 'inspector'));

create policy "suppliers_insert_operator_pm"
on public.suppliers
for insert
to authenticated
with check (public.current_role() in ('operator', 'pm'));

create policy "suppliers_update_operator_pm"
on public.suppliers
for update
to authenticated
using (public.current_role() in ('operator', 'pm'))
with check (public.current_role() in ('operator', 'pm'));

create policy "suppliers_delete_operator_only"
on public.suppliers
for delete
to authenticated
using (public.current_role() = 'operator');

drop policy if exists "purchase_orders_select_by_role" on public.purchase_orders;
drop policy if exists "purchase_orders_insert_operator_pm" on public.purchase_orders;
drop policy if exists "purchase_orders_update_operator_pm_inspector" on public.purchase_orders;
drop policy if exists "purchase_orders_delete_operator_pm" on public.purchase_orders;

create policy "purchase_orders_select_by_role"
on public.purchase_orders
for select
to authenticated
using (
  public.current_role() in ('operator', 'pm', 'inspector')
  and public.user_has_project_access(project_id)
);

create policy "purchase_orders_insert_operator_pm"
on public.purchase_orders
for insert
to authenticated
with check (
  public.current_role() in ('operator', 'pm')
  and public.user_has_project_access(project_id)
);

create policy "purchase_orders_update_operator_pm_inspector"
on public.purchase_orders
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

create policy "purchase_orders_delete_operator_pm"
on public.purchase_orders
for delete
to authenticated
using (
  public.current_role() in ('operator', 'pm')
  and public.user_has_project_access(project_id)
);

create or replace function public.guard_purchase_order_updates()
returns trigger
language plpgsql
as $$
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
      or new.payment_date is distinct from old.payment_date
      or new.created_by is distinct from old.created_by
      or new.created_at is distinct from old.created_at then
      raise exception 'Inspectors can only acknowledge purchase order receipt.';
    end if;

    if new.status <> 'received' then
      raise exception 'Inspectors can only set purchase orders to received.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_purchase_order_updates on public.purchase_orders;
create trigger trg_guard_purchase_order_updates
before update on public.purchase_orders
for each row execute function public.guard_purchase_order_updates();

insert into public.suppliers (id, name, contact_name, email, phone, category)
values
  (1, 'Hormigones del Centro', 'Martín López', 'ventas@hormicentro.com', '+54 351 4100-101', 'materials'),
  (2, 'Aceros Serranos', 'Lucía Gutiérrez', 'comercial@acerosserranos.com', '+54 351 4100-102', 'materials'),
  (3, 'Equipos y Grúas SRL', 'Pablo Rivas', 'operaciones@equiposygruas.com', '+54 351 4100-103', 'equipment'),
  (4, 'Instalaciones Integrales SA', 'Sofía Campos', 'admin@instalacionesintegrales.com', '+54 351 4100-104', 'subcontracts')
on conflict (id) do update set
  name = excluded.name,
  contact_name = excluded.contact_name,
  email = excluded.email,
  phone = excluded.phone,
  category = excluded.category,
  is_active = true;
