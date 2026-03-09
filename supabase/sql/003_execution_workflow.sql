-- Execution workflow module for AMP
-- Run after:
--   1) supabase/sql/001_init_projects_documents.sql
--   2) supabase/sql/002_full_domain.sql

create extension if not exists pgcrypto;

-- =========================
-- Project phases
-- =========================
create table if not exists public.project_phases (
  id uuid primary key default gen_random_uuid(),
  project_id bigint not null references public.projects(id) on delete cascade,
  name text not null,
  phase_order integer not null check (phase_order > 0),
  planned_progress numeric(5,2) not null default 0 check (planned_progress >= 0 and planned_progress <= 100),
  actual_progress numeric(5,2) not null default 0 check (actual_progress >= 0 and actual_progress <= 100),
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  unique (project_id, phase_order),
  unique (project_id, name)
);

create index if not exists idx_project_phases_project_id on public.project_phases(project_id);

insert into public.project_phases (project_id, name, phase_order, planned_progress, actual_progress, start_date, end_date)
values
  (1, 'Fundaciones', 1, 20, 18, '2024-01-15', '2024-02-20'),
  (1, 'Estructura', 2, 45, 40, '2024-02-21', '2024-05-15'),
  (1, 'Instalaciones', 3, 70, 62, '2024-05-16', '2024-06-30'),
  (1, 'Terminaciones', 4, 100, 75, '2024-07-01', '2024-08-30'),
  (2, 'Fundaciones', 1, 10, 8, '2024-04-01', '2024-05-10'),
  (2, 'Estructura', 2, 35, 17, '2024-05-11', '2024-08-10')
on conflict (project_id, phase_order) do update set
  name = excluded.name,
  planned_progress = excluded.planned_progress,
  actual_progress = excluded.actual_progress,
  start_date = excluded.start_date,
  end_date = excluded.end_date;

-- =========================
-- Milestones
-- =========================
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  project_id bigint not null references public.projects(id) on delete cascade,
  phase_id uuid references public.project_phases(id) on delete set null,
  name text not null,
  due_date date not null,
  completed_at date,
  status text not null default 'pending' check (status in ('pending', 'in-progress', 'completed', 'delayed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_milestones_project_id on public.milestones(project_id);
create index if not exists idx_milestones_due_date on public.milestones(due_date);

insert into public.milestones (project_id, name, due_date, completed_at, status)
values
  (1, 'Cierre de fundaciones', '2024-02-20', null, 'completed'),
  (1, 'Estructura 50%', '2024-04-15', null, 'in-progress'),
  (1, 'Aprobación de instalaciones', '2024-06-15', null, 'pending'),
  (2, 'Permisos municipales finales', '2024-04-20', null, 'completed'),
  (2, 'Inicio de estructura', '2024-05-15', null, 'in-progress')
on conflict do nothing;

-- =========================
-- Progress updates (log)
-- =========================
create table if not exists public.progress_updates (
  id uuid primary key default gen_random_uuid(),
  project_id bigint not null references public.projects(id) on delete cascade,
  phase_id uuid references public.project_phases(id) on delete set null,
  report_date date not null,
  progress_delta numeric(5,2) not null default 0 check (progress_delta >= 0 and progress_delta <= 100),
  note text,
  reported_by bigint references public.employees(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_progress_updates_project_id on public.progress_updates(project_id);
create index if not exists idx_progress_updates_report_date on public.progress_updates(report_date desc);

insert into public.progress_updates (project_id, report_date, progress_delta, note, reported_by)
values
  (1, '2024-03-01', 6.5, 'Se completó el encofrado del bloque A.', 3),
  (1, '2024-03-08', 4.0, 'Hormigonado de columnas nivel 2.', 2),
  (2, '2024-04-12', 3.0, 'Avance en replanteo de obra.', 5)
on conflict do nothing;

-- =========================
-- Incidents
-- =========================
create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  project_id bigint not null references public.projects(id) on delete cascade,
  phase_id uuid references public.project_phases(id) on delete set null,
  title text not null,
  incident_type text not null check (incident_type in ('safety', 'quality', 'scope', 'cost', 'schedule', 'other')),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  impact_days integer not null default 0 check (impact_days >= 0),
  impact_cost numeric(14,2) not null default 0 check (impact_cost >= 0),
  owner_id bigint references public.employees(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'in-progress', 'blocked', 'resolved', 'closed')),
  opened_at date not null default current_date,
  resolved_at date,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists idx_incidents_project_id on public.incidents(project_id);
create index if not exists idx_incidents_status on public.incidents(status);
create index if not exists idx_incidents_severity on public.incidents(severity);

insert into public.incidents (project_id, title, incident_type, severity, impact_days, impact_cost, owner_id, status, opened_at, description)
values
  (1, 'Retraso en provisión de acero', 'schedule', 'high', 5, 12000, 5, 'in-progress', '2024-03-07', 'Proveedor principal no entregó en fecha acordada.'),
  (1, 'Observación en control de calidad de losa', 'quality', 'medium', 1, 3500, 2, 'open', '2024-03-12', 'Se solicita recálculo de resistencia por laboratorio externo.'),
  (2, 'Falla menor en EPP', 'safety', 'low', 0, 450, 3, 'resolved', '2024-04-10', 'Reposición de cascos y charla de refuerzo.')
on conflict do nothing;

-- =========================
-- Project budget control
-- =========================
create table if not exists public.project_budget_control (
  id uuid primary key default gen_random_uuid(),
  project_id bigint not null unique references public.projects(id) on delete cascade,
  baseline_amount numeric(14,2) not null check (baseline_amount >= 0),
  current_amount numeric(14,2) not null check (current_amount >= 0),
  committed_amount numeric(14,2) not null default 0 check (committed_amount >= 0),
  spent_amount numeric(14,2) not null default 0 check (spent_amount >= 0),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

insert into public.project_budget_control (project_id, baseline_amount, current_amount, committed_amount, spent_amount)
values
  (1, 2500000, 2512000, 1460000, 1325000),
  (2, 4800000, 4850000, 2100000, 1980000),
  (3, 3200000, 3200000, 1780000, 1702000),
  (4, 6500000, 6500000, 900000, 810000),
  (5, 1800000, 1820000, 1800000, 1800000),
  (6, 5200000, 5250000, 3220000, 3110000)
on conflict (project_id) do update set
  baseline_amount = excluded.baseline_amount,
  current_amount = excluded.current_amount,
  committed_amount = excluded.committed_amount,
  spent_amount = excluded.spent_amount,
  updated_at = now();

-- =========================
-- Change orders
-- =========================
create table if not exists public.change_orders (
  id uuid primary key default gen_random_uuid(),
  project_id bigint not null references public.projects(id) on delete cascade,
  reason text not null,
  amount_delta numeric(14,2) not null default 0,
  days_delta integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_by bigint references public.employees(id) on delete set null,
  approved_by bigint references public.employees(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_change_orders_project_id on public.change_orders(project_id);
create index if not exists idx_change_orders_status on public.change_orders(status);

insert into public.change_orders (project_id, reason, amount_delta, days_delta, status, requested_by, approved_by, approved_at)
values
  (1, 'Ajuste de diseño en núcleo de ascensores', 12000, 4, 'approved', 1, 5, now()),
  (2, 'Cambio de especificación en fachada', 50000, 8, 'pending', 4, null, null)
on conflict do nothing;

-- =========================
-- RLS
-- =========================
alter table public.project_phases enable row level security;
alter table public.milestones enable row level security;
alter table public.progress_updates enable row level security;
alter table public.incidents enable row level security;
alter table public.project_budget_control enable row level security;
alter table public.change_orders enable row level security;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'project_phases',
    'milestones',
    'progress_updates',
    'incidents',
    'project_budget_control',
    'change_orders'
  ] loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = tbl
        and policyname = tbl || '_select_all'
    ) then
      execute format(
        'create policy %I on public.%I for select to anon, authenticated using (true)',
        tbl || '_select_all',
        tbl
      );
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = tbl
        and policyname = tbl || '_insert_all'
    ) then
      execute format(
        'create policy %I on public.%I for insert to anon, authenticated with check (true)',
        tbl || '_insert_all',
        tbl
      );
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = tbl
        and policyname = tbl || '_update_all'
    ) then
      execute format(
        'create policy %I on public.%I for update to anon, authenticated using (true) with check (true)',
        tbl || '_update_all',
        tbl
      );
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = tbl
        and policyname = tbl || '_delete_all'
    ) then
      execute format(
        'create policy %I on public.%I for delete to anon, authenticated using (true)',
        tbl || '_delete_all',
        tbl
      );
    end if;
  end loop;
end $$;
