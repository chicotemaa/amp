-- Project contracts + amendments for contractual governance
-- Run after:
--   1) 018_project_certificates_and_collections.sql
--   2) 021_work_package_traceability.sql

create table if not exists public.project_contracts (
  id uuid primary key default gen_random_uuid(),
  project_id bigint not null unique references public.projects(id) on delete cascade,
  contract_number text not null,
  title text not null,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'suspended', 'completed', 'terminated')),
  signed_date date,
  start_date date,
  end_date date,
  original_amount numeric(14,2) not null check (original_amount >= 0),
  client_visible boolean not null default false,
  notes text,
  created_by bigint references public.employees(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_contracts_status
  on public.project_contracts(status);

create table if not exists public.project_contract_amendments (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.project_contracts(id) on delete cascade,
  project_id bigint not null references public.projects(id) on delete cascade,
  amendment_number text not null,
  title text not null,
  amendment_type text not null default 'scope_adjustment'
    check (amendment_type in ('change_order', 'redetermination', 'extension', 'scope_adjustment', 'other')),
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'approved', 'rejected', 'cancelled')),
  effective_date date not null default current_date,
  amount_delta numeric(14,2) not null default 0,
  days_delta integer not null default 0,
  client_visible boolean not null default false,
  description text,
  created_by bigint references public.employees(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (contract_id, amendment_number)
);

create index if not exists idx_project_contract_amendments_project_effective
  on public.project_contract_amendments(project_id, effective_date desc);

alter table public.project_contracts enable row level security;
alter table public.project_contract_amendments enable row level security;

drop policy if exists "project_contracts_select_by_role" on public.project_contracts;
drop policy if exists "project_contracts_insert_operator_pm" on public.project_contracts;
drop policy if exists "project_contracts_update_operator_pm" on public.project_contracts;
drop policy if exists "project_contracts_delete_operator_pm" on public.project_contracts;

create policy "project_contracts_select_by_role"
on public.project_contracts
for select
to authenticated
using (
  (
    public.current_role() in ('operator', 'pm', 'inspector')
    and public.user_has_project_access(project_id)
  )
  or (
    public.current_role() = 'client'
    and public.user_has_project_access(project_id)
    and client_visible = true
  )
);

create policy "project_contracts_insert_operator_pm"
on public.project_contracts
for insert
to authenticated
with check (
  public.current_role() in ('operator', 'pm')
  and public.user_has_project_access(project_id)
);

create policy "project_contracts_update_operator_pm"
on public.project_contracts
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

create policy "project_contracts_delete_operator_pm"
on public.project_contracts
for delete
to authenticated
using (
  public.current_role() in ('operator', 'pm')
  and public.user_has_project_access(project_id)
);

drop policy if exists "project_contract_amendments_select_by_role" on public.project_contract_amendments;
drop policy if exists "project_contract_amendments_insert_operator_pm" on public.project_contract_amendments;
drop policy if exists "project_contract_amendments_update_operator_pm" on public.project_contract_amendments;
drop policy if exists "project_contract_amendments_delete_operator_pm" on public.project_contract_amendments;

create policy "project_contract_amendments_select_by_role"
on public.project_contract_amendments
for select
to authenticated
using (
  (
    public.current_role() in ('operator', 'pm', 'inspector')
    and public.user_has_project_access(project_id)
  )
  or (
    public.current_role() = 'client'
    and public.user_has_project_access(project_id)
    and client_visible = true
    and status = 'approved'
  )
);

create policy "project_contract_amendments_insert_operator_pm"
on public.project_contract_amendments
for insert
to authenticated
with check (
  public.current_role() in ('operator', 'pm')
  and public.user_has_project_access(project_id)
);

create policy "project_contract_amendments_update_operator_pm"
on public.project_contract_amendments
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

create policy "project_contract_amendments_delete_operator_pm"
on public.project_contract_amendments
for delete
to authenticated
using (
  public.current_role() in ('operator', 'pm')
  and public.user_has_project_access(project_id)
);

create or replace function public.guard_project_contract_amendment_consistency()
returns trigger
language plpgsql
as $$
declare
  contract_row public.project_contracts%rowtype;
begin
  select *
  into contract_row
  from public.project_contracts
  where id = new.contract_id;

  if contract_row.id is null then
    raise exception 'Project contract not found.';
  end if;

  new.project_id = contract_row.project_id;

  if contract_row.status = 'terminated' and new.status = 'approved' then
    raise exception 'Cannot approve amendments on terminated contracts.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_project_contract_amendment_consistency on public.project_contract_amendments;
create trigger trg_guard_project_contract_amendment_consistency
before insert or update on public.project_contract_amendments
for each row execute function public.guard_project_contract_amendment_consistency();
