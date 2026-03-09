-- Materials management module for AMP
-- Run after:
--   1) 001_init_projects_documents.sql
--   2) 002_full_domain.sql
--   3) 003_execution_workflow.sql
--   4) 004_auth_roles.sql
--   5) 005_rbac_project_policies.sql

create extension if not exists pgcrypto;

-- =========================
-- Materials
-- =========================
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  project_id bigint not null references public.projects(id) on delete cascade,
  name text not null,
  unit text not null,
  planned_qty numeric(14,2) not null default 0 check (planned_qty >= 0),
  current_stock numeric(14,2) not null default 0 check (current_stock >= 0),
  reorder_point numeric(14,2) not null default 0 check (reorder_point >= 0),
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, name)
);

create index if not exists idx_materials_project_id on public.materials(project_id);
create index if not exists idx_materials_name on public.materials(name);

-- Reuse shared updated_at trigger function created in 004_auth_roles.sql
drop trigger if exists trg_materials_touch_updated_at on public.materials;
create trigger trg_materials_touch_updated_at
before update on public.materials
for each row execute function public.touch_updated_at();

-- =========================
-- Material movements
-- =========================
create table if not exists public.material_movements (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  project_id bigint not null references public.projects(id) on delete cascade,
  movement_type text not null check (movement_type in ('ingreso', 'egreso')),
  quantity numeric(14,2) not null check (quantity > 0),
  note text,
  created_by bigint references public.employees(id) on delete set null,
  movement_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_material_movements_project_id on public.material_movements(project_id);
create index if not exists idx_material_movements_material_id on public.material_movements(material_id);
create index if not exists idx_material_movements_movement_date on public.material_movements(movement_date desc);

-- Seed
insert into public.materials (project_id, name, unit, planned_qty, current_stock, reorder_point, location)
values
  (1, 'Cemento Portland', 'bolsas', 600, 420, 120, 'Almacén Principal'),
  (1, 'Hierro 12mm', 'metros', 4200, 2600, 700, 'Patio de Acopio'),
  (1, 'Ladrillos cerámicos', 'unidades', 18000, 11200, 2500, 'Zona Norte'),
  (2, 'Hormigón H30', 'm3', 380, 240, 80, 'Planta de Bombeo'),
  (2, 'Malla electrosoldada', 'm2', 2100, 1300, 300, 'Depósito B')
on conflict (project_id, name) do update set
  unit = excluded.unit,
  planned_qty = excluded.planned_qty,
  current_stock = excluded.current_stock,
  reorder_point = excluded.reorder_point,
  location = excluded.location;

-- =========================
-- RLS
-- =========================
alter table public.materials enable row level security;
alter table public.material_movements enable row level security;

drop policy if exists "materials_select_by_role" on public.materials;
drop policy if exists "materials_insert_operator_pm_inspector" on public.materials;
drop policy if exists "materials_update_operator_pm_inspector" on public.materials;
drop policy if exists "materials_delete_operator_pm" on public.materials;

create policy "materials_select_by_role"
on public.materials
for select
to authenticated
using (public.user_has_project_access(project_id));

create policy "materials_insert_operator_pm_inspector"
on public.materials
for insert
to authenticated
with check (
  public.current_role() = 'operator'
  or (public.current_role() in ('pm', 'inspector') and public.user_has_project_access(project_id))
);

create policy "materials_update_operator_pm_inspector"
on public.materials
for update
to authenticated
using (
  public.current_role() = 'operator'
  or (public.current_role() in ('pm', 'inspector') and public.user_has_project_access(project_id))
)
with check (
  public.current_role() = 'operator'
  or (public.current_role() in ('pm', 'inspector') and public.user_has_project_access(project_id))
);

create policy "materials_delete_operator_pm"
on public.materials
for delete
to authenticated
using (
  public.current_role() = 'operator'
  or (public.current_role() = 'pm' and public.user_has_project_access(project_id))
);

drop policy if exists "material_movements_select_by_role" on public.material_movements;
drop policy if exists "material_movements_insert_operator_pm_inspector" on public.material_movements;
drop policy if exists "material_movements_update_operator_pm" on public.material_movements;
drop policy if exists "material_movements_delete_operator_pm" on public.material_movements;

create policy "material_movements_select_by_role"
on public.material_movements
for select
to authenticated
using (public.user_has_project_access(project_id));

create policy "material_movements_insert_operator_pm_inspector"
on public.material_movements
for insert
to authenticated
with check (
  public.current_role() = 'operator'
  or (public.current_role() in ('pm', 'inspector') and public.user_has_project_access(project_id))
);

create policy "material_movements_update_operator_pm"
on public.material_movements
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

create policy "material_movements_delete_operator_pm"
on public.material_movements
for delete
to authenticated
using (
  public.current_role() = 'operator'
  or (public.current_role() = 'pm' and public.user_has_project_access(project_id))
);
