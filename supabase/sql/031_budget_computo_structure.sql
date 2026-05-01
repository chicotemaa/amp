-- ==========================================================
-- 031: Budget Cómputo & Presupuesto Structure
-- Hierarchical budget model based on Argentine construction
-- budget Excel: Rubros → Sub-ítems → Materials + Labor
-- ==========================================================

-- Rubros del presupuesto (ej: "1. Pre. Terreno", "2. Estructura Resistente")
create table if not exists public.budget_rubros (
  id text primary key default gen_random_uuid()::text,
  budget_id text not null references public.project_budgets(id) on delete cascade,
  number integer not null,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Sub-ítems con análisis de precios (ej: "1.1 Limpieza y Replanteo")
create table if not exists public.budget_sub_items (
  id text primary key default gen_random_uuid()::text,
  rubro_id text not null references public.budget_rubros(id) on delete cascade,
  code text not null,
  description text not null,
  unit text not null default 'GL',
  quantity numeric(14,4) not null default 0,
  subtotal_materials numeric(14,2) not null default 0,
  subtotal_labor numeric(14,2) not null default 0,
  cost_net_total numeric(14,2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Materiales de cada sub-ítem
create table if not exists public.budget_sub_item_materials (
  id text primary key default gen_random_uuid()::text,
  sub_item_id text not null references public.budget_sub_items(id) on delete cascade,
  insumo_code integer,
  description text not null,
  unit text not null,
  quantity numeric(14,4) not null default 0,
  unit_price numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  sort_order integer not null default 0
);

-- Mano de obra de cada sub-ítem
create table if not exists public.budget_sub_item_labor (
  id text primary key default gen_random_uuid()::text,
  sub_item_id text not null references public.budget_sub_items(id) on delete cascade,
  labor_category text not null check (labor_category in (
    'oficial_espec', 'oficial', 'medio_oficial', 'ayudante', 'sereno'
  )),
  hours numeric(10,2) not null default 0,
  hourly_rate numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  sort_order integer not null default 0
);

-- Estructura de oferta del presupuesto
create table if not exists public.budget_offer_structure (
  id text primary key default gen_random_uuid()::text,
  budget_id text not null references public.project_budgets(id) on delete cascade,
  subtotal_construction numeric(14,2) not null default 0,
  general_expenses_pct numeric(5,2) not null default 15.00,
  general_expenses_amount numeric(14,2) not null default 0,
  profit_pct numeric(5,2) not null default 10.00,
  profit_amount numeric(14,2) not null default 0,
  taxes_pct numeric(5,2) not null default 10.50,
  taxes_amount numeric(14,2) not null default 0,
  final_price numeric(14,2) not null default 0,
  unique(budget_id)
);

-- Catálogo de tarifas de mano de obra por categoría
create table if not exists public.budget_labor_rates (
  id text primary key default gen_random_uuid()::text,
  budget_id text not null references public.project_budgets(id) on delete cascade,
  category text not null check (category in (
    'oficial_espec', 'oficial', 'medio_oficial', 'ayudante', 'sereno'
  )),
  base_daily_price numeric(14,2) not null default 0,
  attendance_bonus_pct numeric(5,2) not null default 20.00,
  social_charges_pct numeric(5,2) not null default 56.00,
  art_pct numeric(5,2) not null default 14.50,
  other_pct numeric(5,2) not null default 5.00,
  daily_cost numeric(14,2) not null default 0,
  hourly_cost numeric(14,2) not null default 0,
  unique(budget_id, category)
);

-- Gastos generales desglosados por mes
create table if not exists public.budget_general_expenses (
  id text primary key default gen_random_uuid()::text,
  budget_id text not null references public.project_budgets(id) on delete cascade,
  concept text not null,
  month_amounts numeric(14,2)[] not null default '{}',
  total numeric(14,2) not null default 0,
  sort_order integer not null default 0
);

-- =========================
-- RLS
-- =========================
alter table public.budget_rubros enable row level security;
alter table public.budget_sub_items enable row level security;
alter table public.budget_sub_item_materials enable row level security;
alter table public.budget_sub_item_labor enable row level security;
alter table public.budget_offer_structure enable row level security;
alter table public.budget_labor_rates enable row level security;
alter table public.budget_general_expenses enable row level security;

-- Grant policies (operator + pm full access)
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'budget_rubros',
    'budget_sub_items',
    'budget_sub_item_materials',
    'budget_sub_item_labor',
    'budget_offer_structure',
    'budget_labor_rates',
    'budget_general_expenses'
  ] loop
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      tbl || '_select_all', tbl
    );
    execute format(
      'create policy %I on public.%I for insert to anon, authenticated with check (true)',
      tbl || '_insert_all', tbl
    );
    execute format(
      'create policy %I on public.%I for update to anon, authenticated using (true)',
      tbl || '_update_all', tbl
    );
    execute format(
      'create policy %I on public.%I for delete to anon, authenticated using (true)',
      tbl || '_delete_all', tbl
    );
  end loop;
end $$;
