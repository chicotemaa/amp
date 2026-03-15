-- Change Orders workflow hardening
-- Run after:
--   1) 001_init_projects_documents.sql
--   2) 002_full_domain.sql
--   3) 003_execution_workflow.sql
--   4) 004_auth_roles.sql
--   5) 005_rbac_project_policies.sql

-- Add workflow fields
alter table public.change_orders
  add column if not exists operator_reviewed_at timestamptz,
  add column if not exists client_comment text,
  add column if not exists client_reviewed_at timestamptz;

-- Ensure status column exists with a non-null fallback before re-validating
alter table public.change_orders
  alter column status set default 'draft';

-- Replace status constraint with full workflow statuses
do $$
declare
  old_constraint text;
begin
  select conname
  into old_constraint
  from pg_constraint
  where conrelid = 'public.change_orders'::regclass
    and contype = 'c'
    and conname like '%status%';

  if old_constraint is not null then
    execute format('alter table public.change_orders drop constraint %I', old_constraint);
  end if;
end $$;

-- Normalize legacy/invalid statuses before adding the new constraint
update public.change_orders
set status = case
  when status in ('pending', 'draft') then 'draft'
  when status in ('approved', 'rejected', 'pending_operator', 'pending_client') then status
  else 'draft'
end;

-- Force non-null status for safety
update public.change_orders
set status = 'draft'
where status is null;

alter table public.change_orders
  alter column status set not null;

alter table public.change_orders
  add constraint change_orders_status_check
  check (status in ('draft', 'pending_operator', 'pending_client', 'approved', 'rejected'));

-- Helpful indexes
create index if not exists idx_change_orders_project_status
  on public.change_orders(project_id, status);
create index if not exists idx_change_orders_client_reviewed_at
  on public.change_orders(client_reviewed_at desc);
