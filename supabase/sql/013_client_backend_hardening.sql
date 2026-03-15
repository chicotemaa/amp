-- Backend hardening for client visibility and sensitive tables
-- Run after:
--   1) 002_full_domain.sql
--   2) 005_rbac_project_policies.sql
--   3) 009_client_visibility_and_impersonation.sql
--   4) 010_project_members.sql

create or replace function public.client_can_view_visible_project_record(
  p_project_id bigint,
  p_is_visible boolean
)
returns boolean
language sql
stable
as $$
  select
    public.current_role() = 'client'
    and public.user_has_project_access(p_project_id)
    and coalesce(p_is_visible, false) = true
$$;

-- =========================
-- incidents: client should not see or mutate internal incidents
-- =========================
drop policy if exists "incidents_select_by_role" on public.incidents;
drop policy if exists "incidents_update_operator_pm_inspector_client" on public.incidents;

create policy "incidents_select_by_role"
on public.incidents
for select
to authenticated
using (
  public.current_role() = 'operator'
  or (public.current_role() in ('pm', 'inspector') and public.user_has_project_access(project_id))
);

create policy "incidents_update_operator_pm_inspector"
on public.incidents
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

-- =========================
-- publications visible to client only when explicitly marked
-- =========================
drop policy if exists "milestones_select_by_role" on public.milestones;
drop policy if exists "progress_updates_select_by_role" on public.progress_updates;
drop policy if exists "documents_select_by_role" on public.documents;
drop policy if exists "change_orders_select_by_role" on public.change_orders;

create policy "milestones_select_by_role"
on public.milestones
for select
to authenticated
using (
  (
    public.current_role() in ('operator', 'pm', 'inspector')
    and public.user_has_project_access(project_id)
  )
  or (
    public.client_can_view_visible_project_record(project_id, is_client_visible)
    and status in ('published', 'closed')
  )
);

create policy "progress_updates_select_by_role"
on public.progress_updates
for select
to authenticated
using (
  (
    public.current_role() in ('operator', 'pm', 'inspector')
    and public.user_has_project_access(project_id)
  )
  or (
    public.client_can_view_visible_project_record(project_id, is_client_visible)
    and validation_status = 'published'
  )
);

create policy "documents_select_by_role"
on public.documents
for select
to authenticated
using (
  (
    public.current_role() in ('operator', 'pm', 'inspector')
    and public.user_has_project_access(project_id)
  )
  or public.client_can_view_visible_project_record(project_id, is_client_visible)
);

create policy "change_orders_select_by_role"
on public.change_orders
for select
to authenticated
using (
  (
    public.current_role() in ('operator', 'pm')
    and public.user_has_project_access(project_id)
  )
  or (
    public.current_role() = 'client'
    and public.user_has_project_access(project_id)
    and client_visible = true
    and status in ('pending_client', 'approved', 'rejected')
  )
);

-- =========================
-- reports: replace permissive policies from 002_full_domain.sql
-- =========================
drop policy if exists "reports_select_all" on public.reports;
drop policy if exists "reports_insert_all" on public.reports;
drop policy if exists "reports_update_all" on public.reports;
drop policy if exists "reports_delete_all" on public.reports;

create policy "reports_select_by_role"
on public.reports
for select
to authenticated
using (
  (
    public.current_role() in ('operator', 'pm')
    and public.user_has_project_access(project_id)
  )
  or public.client_can_view_visible_project_record(project_id, is_client_visible)
);

create policy "reports_insert_operator_pm"
on public.reports
for insert
to authenticated
with check (
  public.current_role() in ('operator', 'pm')
  and public.user_has_project_access(project_id)
);

create policy "reports_update_operator_pm"
on public.reports
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

create policy "reports_delete_operator_only"
on public.reports
for delete
to authenticated
using (public.current_role() = 'operator');

-- =========================
-- sensitive business tables: remove permissive select for non-authorized roles
-- =========================
drop policy if exists "clients_select_all" on public.clients;
drop policy if exists "clients_insert_all" on public.clients;
drop policy if exists "clients_update_all" on public.clients;
drop policy if exists "clients_delete_all" on public.clients;

create policy "clients_select_operator_pm"
on public.clients
for select
to authenticated
using (public.current_role() in ('operator', 'pm'));

create policy "clients_insert_operator_pm"
on public.clients
for insert
to authenticated
with check (public.current_role() in ('operator', 'pm'));

create policy "clients_update_operator_pm"
on public.clients
for update
to authenticated
using (public.current_role() in ('operator', 'pm'))
with check (public.current_role() in ('operator', 'pm'));

create policy "clients_delete_operator_only"
on public.clients
for delete
to authenticated
using (public.current_role() = 'operator');

drop policy if exists "employees_select_all" on public.employees;
drop policy if exists "employees_insert_all" on public.employees;
drop policy if exists "employees_update_all" on public.employees;
drop policy if exists "employees_delete_all" on public.employees;

create policy "employees_select_operator_pm"
on public.employees
for select
to authenticated
using (public.current_role() in ('operator', 'pm'));

create policy "employees_insert_operator_pm"
on public.employees
for insert
to authenticated
with check (public.current_role() in ('operator', 'pm'));

create policy "employees_update_operator_pm"
on public.employees
for update
to authenticated
using (public.current_role() in ('operator', 'pm'))
with check (public.current_role() in ('operator', 'pm'));

create policy "employees_delete_operator_only"
on public.employees
for delete
to authenticated
using (public.current_role() = 'operator');

drop policy if exists "transactions_select_all" on public.transactions;
drop policy if exists "transactions_insert_all" on public.transactions;
drop policy if exists "transactions_update_all" on public.transactions;
drop policy if exists "transactions_delete_all" on public.transactions;

create policy "transactions_select_operator_only"
on public.transactions
for select
to authenticated
using (public.current_role() = 'operator');

create policy "transactions_insert_operator_only"
on public.transactions
for insert
to authenticated
with check (public.current_role() = 'operator');

create policy "transactions_update_operator_only"
on public.transactions
for update
to authenticated
using (public.current_role() = 'operator')
with check (public.current_role() = 'operator');

create policy "transactions_delete_operator_only"
on public.transactions
for delete
to authenticated
using (public.current_role() = 'operator');

drop policy if exists "monthly_cashflow_select_all" on public.monthly_cashflow;
drop policy if exists "monthly_cashflow_insert_all" on public.monthly_cashflow;
drop policy if exists "monthly_cashflow_update_all" on public.monthly_cashflow;
drop policy if exists "monthly_cashflow_delete_all" on public.monthly_cashflow;

create policy "monthly_cashflow_select_operator_only"
on public.monthly_cashflow
for select
to authenticated
using (public.current_role() = 'operator');

create policy "monthly_cashflow_insert_operator_only"
on public.monthly_cashflow
for insert
to authenticated
with check (public.current_role() = 'operator');

create policy "monthly_cashflow_update_operator_only"
on public.monthly_cashflow
for update
to authenticated
using (public.current_role() = 'operator')
with check (public.current_role() = 'operator');

create policy "monthly_cashflow_delete_operator_only"
on public.monthly_cashflow
for delete
to authenticated
using (public.current_role() = 'operator');

drop policy if exists "project_budgets_select_all" on public.project_budgets;
drop policy if exists "project_budgets_insert_all" on public.project_budgets;
drop policy if exists "project_budgets_update_all" on public.project_budgets;
drop policy if exists "project_budgets_delete_all" on public.project_budgets;

create policy "project_budgets_select_operator_pm"
on public.project_budgets
for select
to authenticated
using (
  public.current_role() in ('operator', 'pm')
  and public.user_has_project_access(project_id)
);

create policy "project_budgets_insert_operator_pm"
on public.project_budgets
for insert
to authenticated
with check (
  public.current_role() in ('operator', 'pm')
  and public.user_has_project_access(project_id)
);

create policy "project_budgets_update_operator_pm"
on public.project_budgets
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

create policy "project_budgets_delete_operator_only"
on public.project_budgets
for delete
to authenticated
using (public.current_role() = 'operator');

drop policy if exists "project_budget_items_select_all" on public.project_budget_items;
drop policy if exists "project_budget_items_insert_all" on public.project_budget_items;
drop policy if exists "project_budget_items_update_all" on public.project_budget_items;
drop policy if exists "project_budget_items_delete_all" on public.project_budget_items;

create policy "project_budget_items_select_operator_pm"
on public.project_budget_items
for select
to authenticated
using (
  exists (
    select 1
    from public.project_budgets pb
    where pb.id = project_budget_items.budget_id
      and public.current_role() in ('operator', 'pm')
      and public.user_has_project_access(pb.project_id)
  )
);

create policy "project_budget_items_insert_operator_pm"
on public.project_budget_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.project_budgets pb
    where pb.id = project_budget_items.budget_id
      and public.current_role() in ('operator', 'pm')
      and public.user_has_project_access(pb.project_id)
  )
);

create policy "project_budget_items_update_operator_pm"
on public.project_budget_items
for update
to authenticated
using (
  exists (
    select 1
    from public.project_budgets pb
    where pb.id = project_budget_items.budget_id
      and public.current_role() in ('operator', 'pm')
      and public.user_has_project_access(pb.project_id)
  )
)
with check (
  exists (
    select 1
    from public.project_budgets pb
    where pb.id = project_budget_items.budget_id
      and public.current_role() in ('operator', 'pm')
      and public.user_has_project_access(pb.project_id)
  )
);

create policy "project_budget_items_delete_operator_only"
on public.project_budget_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.project_budgets pb
    where pb.id = project_budget_items.budget_id
      and public.current_role() = 'operator'
  )
);
