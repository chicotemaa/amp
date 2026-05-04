-- ==========================================================
-- 033: Budget Excel import model
-- Adds import audit, reusable insumos, typologies, work plan
-- and disbursement tables for computo/presupuesto Excel files.
-- ==========================================================

create table if not exists public.budget_imports (
  id text primary key default gen_random_uuid()::text,
  budget_id text not null references public.project_budgets(id) on delete cascade,
  file_name text not null,
  file_size bigint not null default 0,
  sheet_names text[] not null default '{}',
  source_summary jsonb not null default '{}'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  imported_at timestamptz not null default now()
);

create table if not exists public.budget_insumos (
  id text primary key default gen_random_uuid()::text,
  budget_id text not null references public.project_budgets(id) on delete cascade,
  code integer not null,
  category text,
  description text not null,
  unit text,
  unit_price numeric(14,2) not null default 0,
  source_sheet text,
  source_row integer,
  created_at timestamptz not null default now(),
  unique(budget_id, code)
);

create table if not exists public.budget_typologies (
  id text primary key default gen_random_uuid()::text,
  budget_id text not null references public.project_budgets(id) on delete cascade,
  code text not null,
  name text not null,
  quantity numeric(14,4) not null default 1,
  direct_cost numeric(14,2) not null default 0,
  offer_price numeric(14,2) not null default 0,
  coefficient numeric(12,6) not null default 0,
  source_sheet text,
  created_at timestamptz not null default now(),
  unique(budget_id, code)
);

create table if not exists public.budget_work_plan (
  id text primary key default gen_random_uuid()::text,
  budget_id text not null references public.project_budgets(id) on delete cascade,
  rubro_number integer not null,
  rubro_name text not null,
  incidence_pct numeric(8,4) not null default 0,
  month_percentages numeric(10,6)[] not null default '{}',
  cash_amounts numeric(14,2)[] not null default '{}',
  source_sheet text,
  source_row integer,
  created_at timestamptz not null default now(),
  unique(budget_id, rubro_number)
);

create table if not exists public.budget_disbursements (
  id text primary key default gen_random_uuid()::text,
  budget_id text not null references public.project_budgets(id) on delete cascade,
  month_number integer not null,
  national_amount numeric(14,2) not null default 0,
  provincial_amount numeric(14,2) not null default 0,
  monthly_amount numeric(14,2) not null default 0,
  accumulated_amount numeric(14,2) not null default 0,
  source_sheet text,
  source_row integer,
  created_at timestamptz not null default now(),
  unique(budget_id, month_number)
);

create index if not exists idx_budget_imports_budget_id
on public.budget_imports(budget_id);

create index if not exists idx_budget_insumos_budget_id
on public.budget_insumos(budget_id);

create index if not exists idx_budget_typologies_budget_id
on public.budget_typologies(budget_id);

create index if not exists idx_budget_work_plan_budget_id
on public.budget_work_plan(budget_id);

create index if not exists idx_budget_disbursements_budget_id
on public.budget_disbursements(budget_id);

alter table public.budget_imports enable row level security;
alter table public.budget_insumos enable row level security;
alter table public.budget_typologies enable row level security;
alter table public.budget_work_plan enable row level security;
alter table public.budget_disbursements enable row level security;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'budget_imports',
    'budget_insumos',
    'budget_typologies',
    'budget_work_plan',
    'budget_disbursements'
  ] loop
    execute format('drop policy if exists %I on public.%I', tbl || '_select_operator_pm', tbl);
    execute format('drop policy if exists %I on public.%I', tbl || '_insert_operator_pm', tbl);
    execute format('drop policy if exists %I on public.%I', tbl || '_update_operator_pm', tbl);
    execute format('drop policy if exists %I on public.%I', tbl || '_delete_operator_pm', tbl);

    execute format(
      'create policy %I on public.%I for select to authenticated using (public.user_has_budget_version_access(budget_id))',
      tbl || '_select_operator_pm', tbl
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.user_has_budget_version_access(budget_id))',
      tbl || '_insert_operator_pm', tbl
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.user_has_budget_version_access(budget_id)) with check (public.user_has_budget_version_access(budget_id))',
      tbl || '_update_operator_pm', tbl
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.user_has_budget_version_access(budget_id))',
      tbl || '_delete_operator_pm', tbl
    );
  end loop;
end $$;
