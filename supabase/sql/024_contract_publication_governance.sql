-- Contract publication governance for PM/operator/client separation
-- Run after:
--   1) 022_project_contracts.sql

alter table public.project_contracts
  add column if not exists published_by bigint references public.employees(id) on delete set null,
  add column if not exists published_at timestamptz;

alter table public.project_contract_amendments
  add column if not exists submitted_by bigint references public.employees(id) on delete set null,
  add column if not exists submitted_at timestamptz,
  add column if not exists approved_by bigint references public.employees(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists published_by bigint references public.employees(id) on delete set null,
  add column if not exists published_at timestamptz;

update public.project_contracts
set
  published_by = coalesce(published_by, created_by),
  published_at = coalesce(published_at, created_at)
where client_visible = true
  and published_at is null;

update public.project_contract_amendments
set
  submitted_by = coalesce(submitted_by, created_by),
  submitted_at = coalesce(submitted_at, created_at)
where status in ('submitted', 'approved', 'rejected', 'cancelled')
  and submitted_at is null;

update public.project_contract_amendments
set
  approved_by = coalesce(approved_by, created_by),
  approved_at = coalesce(approved_at, created_at)
where status = 'approved'
  and approved_at is null;

update public.project_contract_amendments
set
  published_by = coalesce(published_by, approved_by, created_by),
  published_at = coalesce(published_at, approved_at, created_at)
where client_visible = true
  and published_at is null;

create or replace function public.guard_project_contract_publication()
returns trigger
language plpgsql
as $$
begin
  if coalesce(new.client_visible, false) and new.status not in ('active', 'completed') then
    raise exception 'Only active or completed contracts can be published to the client portal.';
  end if;

  if public.current_role() = 'pm' then
    if tg_op = 'INSERT' and coalesce(new.client_visible, false) then
      raise exception 'PMs cannot publish contracts to the client portal.';
    end if;

    if tg_op = 'UPDATE'
      and coalesce(new.client_visible, false) is distinct from coalesce(old.client_visible, false) then
      raise exception 'Only operators can publish contracts to the client portal.';
    end if;
  end if;

  if coalesce(new.client_visible, false) then
    if tg_op = 'UPDATE' then
      new.published_by = coalesce(new.published_by, old.published_by, public.current_employee_id());
      new.published_at = coalesce(new.published_at, old.published_at, now());
    else
      new.published_by = coalesce(new.published_by, public.current_employee_id());
      new.published_at = coalesce(new.published_at, now());
    end if;
  else
    new.published_by = null;
    new.published_at = null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_project_contract_publication on public.project_contracts;
create trigger trg_guard_project_contract_publication
before insert or update on public.project_contracts
for each row execute function public.guard_project_contract_publication();

create or replace function public.guard_project_contract_amendment_workflow()
returns trigger
language plpgsql
as $$
begin
  if public.current_role() = 'pm' then
    if coalesce(new.client_visible, false)
      or (
        tg_op = 'UPDATE'
        and coalesce(new.client_visible, false) is distinct from coalesce(old.client_visible, false)
      ) then
      raise exception 'Only operators can publish amendments to the client portal.';
    end if;

    if new.status in ('approved', 'rejected') then
      raise exception 'PMs can only draft, submit or cancel amendments.';
    end if;
  end if;

  if coalesce(new.client_visible, false) and new.status <> 'approved' then
    raise exception 'Only approved amendments can be published to the client portal.';
  end if;

  if new.status in ('submitted', 'approved', 'rejected', 'cancelled') then
    if tg_op = 'UPDATE' then
      new.submitted_by = coalesce(new.submitted_by, old.submitted_by, public.current_employee_id());
      new.submitted_at = coalesce(new.submitted_at, old.submitted_at, now());
    else
      new.submitted_by = coalesce(new.submitted_by, public.current_employee_id());
      new.submitted_at = coalesce(new.submitted_at, now());
    end if;
  else
    new.submitted_by = null;
    new.submitted_at = null;
  end if;

  if new.status = 'approved' then
    if tg_op = 'UPDATE' then
      new.approved_by = coalesce(new.approved_by, old.approved_by, public.current_employee_id());
      new.approved_at = coalesce(new.approved_at, old.approved_at, now());
    else
      new.approved_by = coalesce(new.approved_by, public.current_employee_id());
      new.approved_at = coalesce(new.approved_at, now());
    end if;
  else
    new.approved_by = null;
    new.approved_at = null;
  end if;

  if coalesce(new.client_visible, false) then
    if tg_op = 'UPDATE' then
      new.published_by = coalesce(new.published_by, old.published_by, public.current_employee_id());
      new.published_at = coalesce(new.published_at, old.published_at, now());
    else
      new.published_by = coalesce(new.published_by, public.current_employee_id());
      new.published_at = coalesce(new.published_at, now());
    end if;
  else
    new.published_by = null;
    new.published_at = null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_project_contract_amendment_workflow on public.project_contract_amendments;
create trigger trg_guard_project_contract_amendment_workflow
before insert or update on public.project_contract_amendments
for each row execute function public.guard_project_contract_amendment_workflow();
