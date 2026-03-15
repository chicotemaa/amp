-- Client visibility flags + impersonation audit
-- Run after:
--   1) 004_auth_roles.sql
--   2) 005_rbac_project_policies.sql
--   3) 006_change_orders_workflow.sql

alter table public.documents
  add column if not exists is_client_visible boolean not null default false;

alter table public.reports
  add column if not exists is_client_visible boolean not null default false;

alter table public.progress_updates
  add column if not exists is_client_visible boolean not null default false,
  add column if not exists validated_by bigint references public.employees(id) on delete set null,
  add column if not exists validated_at timestamptz,
  add column if not exists validation_status text not null default 'recorded'
    check (validation_status in ('recorded', 'validated', 'published'));

alter table public.milestones
  add column if not exists is_client_visible boolean not null default true,
  add column if not exists validated_at timestamptz,
  add column if not exists validated_by bigint references public.employees(id) on delete set null;

alter table public.change_orders
  add column if not exists client_visible boolean not null default true;

alter table public.projects
  add column if not exists client_status_summary text;

create table if not exists public.impersonation_audit (
  id uuid primary key default gen_random_uuid(),
  operator_user_id uuid not null references public.profiles(id) on delete cascade,
  viewed_role public.role_type not null,
  reason text,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists idx_impersonation_audit_operator_user_id
  on public.impersonation_audit(operator_user_id);

create index if not exists idx_impersonation_audit_started_at
  on public.impersonation_audit(started_at desc);

alter table public.impersonation_audit enable row level security;

drop policy if exists "impersonation_audit_select_operator_only" on public.impersonation_audit;
drop policy if exists "impersonation_audit_insert_operator_only" on public.impersonation_audit;
drop policy if exists "impersonation_audit_update_operator_only" on public.impersonation_audit;

create policy "impersonation_audit_select_operator_only"
on public.impersonation_audit
for select
to authenticated
using (public.current_role() = 'operator');

create policy "impersonation_audit_insert_operator_only"
on public.impersonation_audit
for insert
to authenticated
with check (
  public.current_role() = 'operator'
  and operator_user_id = auth.uid()
);

create policy "impersonation_audit_update_operator_only"
on public.impersonation_audit
for update
to authenticated
using (
  public.current_role() = 'operator'
  and operator_user_id = auth.uid()
)
with check (
  public.current_role() = 'operator'
  and operator_user_id = auth.uid()
);
