-- Full domain bootstrap for AMP
-- Run after: supabase/sql/001_init_projects_documents.sql

-- =========================
-- Clients + relation table
-- =========================
create table if not exists public.clients (
  id bigint primary key,
  name text not null,
  company text not null,
  email text not null unique,
  phone text,
  last_interaction date,
  status text not null check (status in ('Activo', 'Potencial', 'Inactivo')),
  notification_prefs text[] not null default '{}',
  avatar text,
  created_at timestamptz not null default now()
);

create table if not exists public.client_projects (
  client_id bigint not null references public.clients(id) on delete cascade,
  project_id bigint not null references public.projects(id) on delete cascade,
  primary key (client_id, project_id)
);

insert into public.clients (id, name, company, email, phone, last_interaction, status, notification_prefs, avatar)
values
  (1, 'Sara Martínez', 'Espacios Modernos S.L.', 'sara@espaciosmodernos.com', '+54 11 4123-4567', '2024-03-15', 'Activo', array['email','sms'], '/avatars/sara.jpg'),
  (2, 'Miguel Chen', 'Desarrollo Urbano Co.', 'mchen@desarrollourbano.com', '+54 11 4234-5678', '2024-03-14', 'Activo', array['email'], '/avatars/miguel.jpg'),
  (3, 'Elena Wilson', 'Constructores Sostenibles', 'elena@sostenible.com', '+54 11 4345-6789', '2024-03-10', 'Potencial', array['email','push'], '/avatars/elena.jpg'),
  (4, 'Roberto Fernández', 'InmoCorp S.A.', 'rfernandez@inmocorp.com', '+54 11 4456-7890', '2024-03-12', 'Activo', array['email','sms'], '/avatars/roberto.jpg'),
  (5, 'Patricia Lagos', 'Lagos & Asociados', 'patricia@lagosasociados.com', '+54 11 4567-8901', '2024-03-08', 'Activo', array['push'], '/avatars/patricia.jpg')
on conflict (id) do update set
  name = excluded.name,
  company = excluded.company,
  email = excluded.email,
  phone = excluded.phone,
  last_interaction = excluded.last_interaction,
  status = excluded.status,
  notification_prefs = excluded.notification_prefs,
  avatar = excluded.avatar;

insert into public.client_projects (client_id, project_id)
values
  (1, 1),
  (2, 2), (2, 6),
  (3, 5),
  (4, 4),
  (5, 3)
on conflict do nothing;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'projects_client_id_fkey'
      and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects
      add constraint projects_client_id_fkey
      foreign key (client_id) references public.clients(id) on delete set null;
  end if;
end $$;

-- =========================
-- Employees + relation table
-- =========================
create table if not exists public.employees (
  id bigint primary key,
  name text not null,
  role text not null,
  department text not null check (department in ('Diseño', 'Ingeniería', 'Construcción', 'Gestión')),
  email text not null unique,
  phone text,
  status text not null check (status in ('Activo', 'En Proyecto', 'Disponible', 'Inactivo')),
  avatar text,
  hours_this_week integer not null default 0 check (hours_this_week >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.employee_projects (
  employee_id bigint not null references public.employees(id) on delete cascade,
  project_id bigint not null references public.projects(id) on delete cascade,
  primary key (employee_id, project_id)
);

insert into public.employees (id, name, role, department, email, phone, status, avatar, hours_this_week)
values
  (1, 'Carlos Rodríguez', 'Arquitecto Senior', 'Diseño', 'carlos@archipro.com', '+54 11 5101-1001', 'Activo', '/avatars/carlos.jpg', 42),
  (2, 'Ana García', 'Ingeniera Estructural', 'Ingeniería', 'ana@archipro.com', '+54 11 5101-1002', 'Activo', '/avatars/ana.jpg', 38),
  (3, 'Luis Torres', 'Supervisor de Obra', 'Construcción', 'luis@archipro.com', '+54 11 5101-1003', 'En Proyecto', '/avatars/luis.jpg', 45),
  (4, 'Valentina Ruiz', 'Arquitecta Junior', 'Diseño', 'valentina@archipro.com', '+54 11 5101-1004', 'Activo', '/avatars/valentina.jpg', 40),
  (5, 'Diego Morales', 'Jefe de Proyectos', 'Gestión', 'diego@archipro.com', '+54 11 5101-1005', 'Activo', '/avatars/diego.jpg', 44),
  (6, 'Carmen López', 'Diseñadora de Interiores', 'Diseño', 'carmen@archipro.com', '+54 11 5101-1006', 'Activo', '/avatars/carmen.jpg', 35),
  (7, 'Pablo Hernández', 'Ingeniero de Instalaciones', 'Ingeniería', 'pablo@archipro.com', '+54 11 5101-1007', 'Activo', '/avatars/pablo.jpg', 41),
  (8, 'Sofía Castro', 'Coordinadora Administrativa', 'Gestión', 'sofia@archipro.com', '+54 11 5101-1008', 'Activo', '/avatars/sofia.jpg', 32)
on conflict (id) do update set
  name = excluded.name,
  role = excluded.role,
  department = excluded.department,
  email = excluded.email,
  phone = excluded.phone,
  status = excluded.status,
  avatar = excluded.avatar,
  hours_this_week = excluded.hours_this_week;

insert into public.employee_projects (employee_id, project_id)
values
  (1,1),(1,3),(1,6),
  (2,1),(2,4),
  (3,3),
  (4,2),(4,6),
  (5,1),(5,2),(5,4),
  (6,5),
  (7,3),(7,6)
on conflict do nothing;

-- =======
-- Reports
-- =======
create table if not exists public.reports (
  id bigint primary key,
  title text not null,
  project_id bigint not null references public.projects(id) on delete cascade,
  report_date date not null,
  status text not null check (status in ('completed', 'pending', 'in-review')),
  author_id bigint not null references public.employees(id) on delete restrict,
  created_at timestamptz not null default now()
);

insert into public.reports (id, title, project_id, report_date, status, author_id)
values
  (1, 'Avance estructural — Mes 3', 1, '2024-03-15', 'completed', 2),
  (2, 'Informe de cimentación', 3, '2024-03-14', 'in-review', 7),
  (3, 'Planificación inicial aprobada', 4, '2024-03-13', 'pending', 5),
  (4, 'Entrega final — Documentación', 5, '2024-03-01', 'completed', 1),
  (5, 'Avance de obra — Semana 24', 6, '2024-02-28', 'completed', 5)
on conflict (id) do update set
  title = excluded.title,
  project_id = excluded.project_id,
  report_date = excluded.report_date,
  status = excluded.status,
  author_id = excluded.author_id;

-- =========
-- Cashflow
-- =========
create table if not exists public.transactions (
  id bigint primary key,
  type text not null check (type in ('ingreso', 'egreso')),
  description text not null,
  amount numeric(14,2) not null check (amount >= 0),
  txn_date date not null,
  category text not null check (category in ('contracts', 'materials', 'labor', 'services', 'equipment', 'subcontracts')),
  project_id bigint references public.projects(id) on delete set null,
  project_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.monthly_cashflow (
  month_key text primary key,
  ingresos numeric(14,2) not null default 0,
  egresos numeric(14,2) not null default 0
);

insert into public.transactions (id, type, description, amount, txn_date, category, project_id, project_name)
values
  (1, 'ingreso', 'Cuota 1/4 — Torre Residencial Marina', 150000, '2024-03-18', 'contracts', 1, 'Torre Residencial Marina'),
  (2, 'ingreso', 'Cuota 1/3 — Centro Comercial Plaza Norte', 180000, '2024-03-14', 'contracts', 2, 'Centro Comercial Plaza Norte'),
  (3, 'ingreso', 'Liquidación final — Eco-Resort Costa Verde', 120000, '2024-02-28', 'contracts', 5, 'Eco-Resort Costa Verde'),
  (4, 'egreso', 'Compra materiales — Torre Residencial', 52000, '2024-03-17', 'materials', 1, 'Torre Residencial Marina'),
  (5, 'egreso', 'Pago nómina equipo — Marzo 2024', 58000, '2024-03-16', 'labor', null, 'General'),
  (6, 'egreso', 'Compra materiales acabados — Centro Comercial', 65000, '2024-03-15', 'materials', 2, 'Centro Comercial Plaza Norte'),
  (7, 'egreso', 'Subcontratista estructuras — Torre Residencial', 68000, '2024-03-10', 'subcontracts', 1, 'Torre Residencial Marina'),
  (8, 'egreso', 'Alquiler grúa — Complejo Deportivo Olímpico', 28000, '2024-03-08', 'equipment', 3, 'Complejo Deportivo Olímpico'),
  (9, 'egreso', 'Pago nómina equipo — Febrero 2024', 55000, '2024-02-29', 'labor', null, 'General'),
  (10, 'egreso', 'Servicios generales (agua, luz, oficina)', 5500, '2024-03-05', 'services', null, 'General')
on conflict (id) do update set
  type = excluded.type,
  description = excluded.description,
  amount = excluded.amount,
  txn_date = excluded.txn_date,
  category = excluded.category,
  project_id = excluded.project_id,
  project_name = excluded.project_name;

insert into public.monthly_cashflow (month_key, ingresos, egresos)
values
  ('Ene', 45000, 38000),
  ('Feb', 120000, 98000),
  ('Mar', 285000, 195500),
  ('Abr', 0, 0),
  ('May', 0, 0),
  ('Jun', 0, 0)
on conflict (month_key) do update set
  ingresos = excluded.ingresos,
  egresos = excluded.egresos;

-- ===========
-- RLS Policies
-- ===========
alter table public.clients enable row level security;
alter table public.client_projects enable row level security;
alter table public.employees enable row level security;
alter table public.employee_projects enable row level security;
alter table public.reports enable row level security;
alter table public.transactions enable row level security;
alter table public.monthly_cashflow enable row level security;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'clients',
    'client_projects',
    'employees',
    'employee_projects',
    'reports',
    'transactions',
    'monthly_cashflow'
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
  end loop;
end $$;
