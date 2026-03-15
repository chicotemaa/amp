-- Project certificates + collections for client billing and collections
-- Run after:
--   1) 005_rbac_project_policies.sql
--   2) 017_purchase_order_payments.sql

create table if not exists public.project_certificates (
  id uuid primary key default gen_random_uuid(),
  project_id bigint not null references public.projects(id) on delete cascade,
  phase_id uuid references public.project_phases(id) on delete set null,
  certificate_number text not null,
  description text not null,
  issue_date date not null default current_date,
  due_date date,
  amount numeric(14,2) not null check (amount > 0),
  status text not null default 'issued'
    check (status in ('draft', 'issued', 'partially_collected', 'collected', 'cancelled')),
  client_visible boolean not null default true,
  notes text,
  created_by bigint references public.employees(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (project_id, certificate_number)
);

create table if not exists public.project_certificate_collections (
  id uuid primary key default gen_random_uuid(),
  certificate_id uuid not null references public.project_certificates(id) on delete cascade,
  project_id bigint not null references public.projects(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  collection_date date not null default current_date,
  reference text,
  notes text,
  created_by bigint references public.employees(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_certificates_project_date
  on public.project_certificates(project_id, issue_date desc);

create index if not exists idx_project_certificate_collections_project_date
  on public.project_certificate_collections(project_id, collection_date desc);

create index if not exists idx_project_certificate_collections_certificate_id
  on public.project_certificate_collections(certificate_id);

alter table public.project_certificates enable row level security;
alter table public.project_certificate_collections enable row level security;

drop policy if exists "project_certificates_select_by_role" on public.project_certificates;
drop policy if exists "project_certificates_insert_operator_pm" on public.project_certificates;
drop policy if exists "project_certificates_update_operator_pm" on public.project_certificates;
drop policy if exists "project_certificates_delete_operator_pm" on public.project_certificates;

create policy "project_certificates_select_by_role"
on public.project_certificates
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

create policy "project_certificates_insert_operator_pm"
on public.project_certificates
for insert
to authenticated
with check (
  public.current_role() in ('operator', 'pm')
  and public.user_has_project_access(project_id)
);

create policy "project_certificates_update_operator_pm"
on public.project_certificates
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

create policy "project_certificates_delete_operator_pm"
on public.project_certificates
for delete
to authenticated
using (
  public.current_role() in ('operator', 'pm')
  and public.user_has_project_access(project_id)
);

drop policy if exists "project_certificate_collections_select_by_role" on public.project_certificate_collections;
drop policy if exists "project_certificate_collections_insert_operator_pm" on public.project_certificate_collections;
drop policy if exists "project_certificate_collections_update_operator_pm" on public.project_certificate_collections;
drop policy if exists "project_certificate_collections_delete_operator_pm" on public.project_certificate_collections;

create policy "project_certificate_collections_select_by_role"
on public.project_certificate_collections
for select
to authenticated
using (
  (
    public.current_role() in ('operator', 'pm', 'inspector')
    and public.user_has_project_access(project_id)
  )
  or (
    public.current_role() = 'client'
    and exists (
      select 1
      from public.project_certificates pc
      where pc.id = certificate_id
        and pc.project_id = project_id
        and pc.client_visible = true
        and public.user_has_project_access(pc.project_id)
    )
  )
);

create policy "project_certificate_collections_insert_operator_pm"
on public.project_certificate_collections
for insert
to authenticated
with check (
  public.current_role() in ('operator', 'pm')
  and public.user_has_project_access(project_id)
);

create policy "project_certificate_collections_update_operator_pm"
on public.project_certificate_collections
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

create policy "project_certificate_collections_delete_operator_pm"
on public.project_certificate_collections
for delete
to authenticated
using (
  public.current_role() in ('operator', 'pm')
  and public.user_has_project_access(project_id)
);

create or replace function public.guard_project_certificate_collection_consistency()
returns trigger
language plpgsql
as $$
declare
  certificate_row public.project_certificates%rowtype;
  collected_total numeric(14,2) := 0;
begin
  select *
  into certificate_row
  from public.project_certificates
  where id = new.certificate_id;

  if certificate_row.id is null then
    raise exception 'Project certificate not found.';
  end if;

  if certificate_row.status = 'cancelled' then
    raise exception 'Cannot register collections for cancelled certificates.';
  end if;

  if certificate_row.status = 'draft' then
    raise exception 'Cannot register collections for draft certificates.';
  end if;

  new.project_id = certificate_row.project_id;

  if tg_op = 'UPDATE' then
    select coalesce(sum(amount), 0)
    into collected_total
    from public.project_certificate_collections
    where certificate_id = new.certificate_id
      and id <> old.id;
  else
    select coalesce(sum(amount), 0)
    into collected_total
    from public.project_certificate_collections
    where certificate_id = new.certificate_id;
  end if;

  if collected_total + new.amount > certificate_row.amount then
    raise exception 'Collection exceeds remaining certificate amount.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_project_certificate_collection_consistency on public.project_certificate_collections;
create trigger trg_guard_project_certificate_collection_consistency
before insert or update on public.project_certificate_collections
for each row execute function public.guard_project_certificate_collection_consistency();

create or replace function public.sync_project_certificate_collection_state(target_certificate_id uuid)
returns void
language plpgsql
as $$
declare
  certificate_row public.project_certificates%rowtype;
  collected_total numeric(14,2) := 0;
  latest_collection_date date;
  next_status text;
begin
  select *
  into certificate_row
  from public.project_certificates
  where id = target_certificate_id;

  if certificate_row.id is null then
    return;
  end if;

  select
    coalesce(sum(amount), 0),
    max(collection_date)
  into collected_total, latest_collection_date
  from public.project_certificate_collections
  where certificate_id = target_certificate_id;

  if certificate_row.status = 'cancelled' then
    return;
  end if;

  if collected_total >= certificate_row.amount and certificate_row.amount > 0 then
    next_status := 'collected';
  elsif collected_total > 0 then
    next_status := 'partially_collected';
  elsif certificate_row.status in ('partially_collected', 'collected') then
    next_status := 'issued';
  else
    next_status := certificate_row.status;
  end if;

  update public.project_certificates
  set status = next_status
  where id = target_certificate_id;
end;
$$;

create or replace function public.handle_project_certificate_collection_change()
returns trigger
language plpgsql
as $$
begin
  perform public.sync_project_certificate_collection_state(coalesce(new.certificate_id, old.certificate_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_handle_project_certificate_collection_change on public.project_certificate_collections;
create trigger trg_handle_project_certificate_collection_change
after insert or update or delete on public.project_certificate_collections
for each row execute function public.handle_project_certificate_collection_change();

create or replace function public.guard_project_certificate_updates()
returns trigger
language plpgsql
as $$
declare
  collected_total numeric(14,2) := 0;
begin
  select coalesce(sum(amount), 0)
  into collected_total
  from public.project_certificate_collections
  where certificate_id = old.id;

  if new.amount < collected_total then
    raise exception 'Certificate amount cannot be lower than already collected total.';
  end if;

  if new.status = 'cancelled' and collected_total > 0 then
    raise exception 'Cannot cancel a certificate with collections registered.';
  end if;

  if new.status in ('partially_collected', 'collected') and collected_total = 0 then
    raise exception 'Collection status is managed by registered collections.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_project_certificate_updates on public.project_certificates;
create trigger trg_guard_project_certificate_updates
before update on public.project_certificates
for each row execute function public.guard_project_certificate_updates();
