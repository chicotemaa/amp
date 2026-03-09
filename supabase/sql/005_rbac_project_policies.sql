-- RBAC policies for project-level data access
-- Run after:
--   1) 001_init_projects_documents.sql
--   2) 002_full_domain.sql
--   3) 003_execution_workflow.sql
--   4) 004_auth_roles.sql

-- =========================
-- Helper functions
-- =========================
create or replace function public.current_client_id()
returns bigint
language sql
stable
as $$
  select p.client_id
  from public.profiles p
  where p.id = auth.uid()
    and p.is_active = true
  limit 1
$$;

create or replace function public.current_employee_id()
returns bigint
language sql
stable
as $$
  select p.employee_id
  from public.profiles p
  where p.id = auth.uid()
    and p.is_active = true
  limit 1
$$;

create or replace function public.user_has_project_access(p_project_id bigint)
returns boolean
language sql
stable
as $$
  select
    case
      when public.current_role() = 'operator' then true
      when public.current_role() in ('pm', 'inspector') then exists (
        select 1
        from public.employee_projects ep
        where ep.project_id = p_project_id
          and ep.employee_id = public.current_employee_id()
      )
      when public.current_role() = 'client' then exists (
        select 1
        from public.client_projects cp
        where cp.project_id = p_project_id
          and cp.client_id = public.current_client_id()
      )
      else false
    end
$$;

-- =========================
-- Replace permissive policies
-- =========================
drop policy if exists "projects_select_all" on public.projects;
drop policy if exists "documents_select_all" on public.documents;
drop policy if exists "documents_insert_all" on public.documents;
drop policy if exists "documents_update_all" on public.documents;
drop policy if exists "documents_delete_all" on public.documents;

drop policy if exists "project_phases_select_all" on public.project_phases;
drop policy if exists "project_phases_insert_all" on public.project_phases;
drop policy if exists "project_phases_update_all" on public.project_phases;
drop policy if exists "project_phases_delete_all" on public.project_phases;

drop policy if exists "milestones_select_all" on public.milestones;
drop policy if exists "milestones_insert_all" on public.milestones;
drop policy if exists "milestones_update_all" on public.milestones;
drop policy if exists "milestones_delete_all" on public.milestones;

drop policy if exists "progress_updates_select_all" on public.progress_updates;
drop policy if exists "progress_updates_insert_all" on public.progress_updates;
drop policy if exists "progress_updates_update_all" on public.progress_updates;
drop policy if exists "progress_updates_delete_all" on public.progress_updates;

drop policy if exists "incidents_select_all" on public.incidents;
drop policy if exists "incidents_insert_all" on public.incidents;
drop policy if exists "incidents_update_all" on public.incidents;
drop policy if exists "incidents_delete_all" on public.incidents;

drop policy if exists "project_budget_control_select_all" on public.project_budget_control;
drop policy if exists "project_budget_control_insert_all" on public.project_budget_control;
drop policy if exists "project_budget_control_update_all" on public.project_budget_control;
drop policy if exists "project_budget_control_delete_all" on public.project_budget_control;

drop policy if exists "change_orders_select_all" on public.change_orders;
drop policy if exists "change_orders_insert_all" on public.change_orders;
drop policy if exists "change_orders_update_all" on public.change_orders;
drop policy if exists "change_orders_delete_all" on public.change_orders;

-- =========================
-- projects
-- =========================
create policy "projects_select_by_role"
on public.projects
for select
to authenticated
using (public.user_has_project_access(id));

create policy "projects_insert_operator_pm"
on public.projects
for insert
to authenticated
with check (public.current_role() in ('operator', 'pm'));

create policy "projects_update_operator_pm"
on public.projects
for update
to authenticated
using (
  public.current_role() = 'operator'
  or (public.current_role() = 'pm' and public.user_has_project_access(id))
)
with check (
  public.current_role() = 'operator'
  or (public.current_role() = 'pm' and public.user_has_project_access(id))
);

create policy "projects_delete_operator_only"
on public.projects
for delete
to authenticated
using (public.current_role() = 'operator');

-- =========================
-- project_phases
-- =========================
create policy "project_phases_select_by_role"
on public.project_phases
for select
to authenticated
using (public.user_has_project_access(project_id));

create policy "project_phases_insert_operator_pm"
on public.project_phases
for insert
to authenticated
with check (
  public.current_role() = 'operator'
  or (public.current_role() = 'pm' and public.user_has_project_access(project_id))
);

create policy "project_phases_update_operator_pm"
on public.project_phases
for update
to authenticated
using (
  public.current_role() = 'operator'
  or (public.current_role() = 'pm' and public.user_has_project_access(project_id))
)
with check (
  public.current_role() = 'operator'
  or (public.current_role() = 'pm' and public.user_has_project_access(project_id))
);

create policy "project_phases_delete_operator_only"
on public.project_phases
for delete
to authenticated
using (public.current_role() = 'operator');

-- =========================
-- milestones
-- =========================
create policy "milestones_select_by_role"
on public.milestones
for select
to authenticated
using (public.user_has_project_access(project_id));

create policy "milestones_insert_operator_pm_inspector"
on public.milestones
for insert
to authenticated
with check (
  public.current_role() = 'operator'
  or (public.current_role() in ('pm', 'inspector') and public.user_has_project_access(project_id))
);

create policy "milestones_update_operator_pm_inspector"
on public.milestones
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

create policy "milestones_delete_operator_pm"
on public.milestones
for delete
to authenticated
using (
  public.current_role() = 'operator'
  or (public.current_role() = 'pm' and public.user_has_project_access(project_id))
);

-- =========================
-- progress_updates
-- =========================
create policy "progress_updates_select_by_role"
on public.progress_updates
for select
to authenticated
using (public.user_has_project_access(project_id));

create policy "progress_updates_insert_operator_pm_inspector"
on public.progress_updates
for insert
to authenticated
with check (
  public.current_role() = 'operator'
  or (public.current_role() in ('pm', 'inspector') and public.user_has_project_access(project_id))
);

create policy "progress_updates_update_operator_pm_inspector"
on public.progress_updates
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

create policy "progress_updates_delete_operator_pm"
on public.progress_updates
for delete
to authenticated
using (
  public.current_role() = 'operator'
  or (public.current_role() = 'pm' and public.user_has_project_access(project_id))
);

-- =========================
-- incidents
-- =========================
create policy "incidents_select_by_role"
on public.incidents
for select
to authenticated
using (public.user_has_project_access(project_id));

create policy "incidents_insert_operator_pm_inspector"
on public.incidents
for insert
to authenticated
with check (
  public.current_role() = 'operator'
  or (public.current_role() in ('pm', 'inspector') and public.user_has_project_access(project_id))
);

create policy "incidents_update_operator_pm_inspector_client"
on public.incidents
for update
to authenticated
using (
  public.current_role() = 'operator'
  or (public.current_role() in ('pm', 'inspector', 'client') and public.user_has_project_access(project_id))
)
with check (
  public.current_role() = 'operator'
  or (public.current_role() in ('pm', 'inspector', 'client') and public.user_has_project_access(project_id))
);

create policy "incidents_delete_operator_pm"
on public.incidents
for delete
to authenticated
using (
  public.current_role() = 'operator'
  or (public.current_role() = 'pm' and public.user_has_project_access(project_id))
);

-- =========================
-- documents
-- =========================
create policy "documents_select_by_role"
on public.documents
for select
to authenticated
using (public.user_has_project_access(project_id));

create policy "documents_insert_operator_pm_inspector"
on public.documents
for insert
to authenticated
with check (
  public.current_role() = 'operator'
  or (public.current_role() in ('pm', 'inspector') and public.user_has_project_access(project_id))
);

create policy "documents_update_operator_pm_inspector"
on public.documents
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

create policy "documents_delete_operator_pm"
on public.documents
for delete
to authenticated
using (
  public.current_role() = 'operator'
  or (public.current_role() = 'pm' and public.user_has_project_access(project_id))
);

-- =========================
-- project_budget_control
-- =========================
create policy "project_budget_control_select_by_role"
on public.project_budget_control
for select
to authenticated
using (
  public.current_role() in ('operator', 'pm')
  and public.user_has_project_access(project_id)
);

create policy "project_budget_control_insert_operator_pm"
on public.project_budget_control
for insert
to authenticated
with check (
  public.current_role() in ('operator', 'pm')
  and public.user_has_project_access(project_id)
);

create policy "project_budget_control_update_operator_pm"
on public.project_budget_control
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

create policy "project_budget_control_delete_operator_only"
on public.project_budget_control
for delete
to authenticated
using (public.current_role() = 'operator');

-- =========================
-- change_orders
-- =========================
create policy "change_orders_select_by_role"
on public.change_orders
for select
to authenticated
using (public.user_has_project_access(project_id));

create policy "change_orders_insert_operator_pm"
on public.change_orders
for insert
to authenticated
with check (
  public.current_role() in ('operator', 'pm')
  and public.user_has_project_access(project_id)
);

create policy "change_orders_update_by_role"
on public.change_orders
for update
to authenticated
using (
  (
    public.current_role() in ('operator', 'pm')
    and public.user_has_project_access(project_id)
  )
  or (
    public.current_role() = 'client'
    and public.user_has_project_access(project_id)
  )
)
with check (
  (
    public.current_role() in ('operator', 'pm')
    and public.user_has_project_access(project_id)
  )
  or (
    public.current_role() = 'client'
    and public.user_has_project_access(project_id)
  )
);

create policy "change_orders_delete_operator_only"
on public.change_orders
for delete
to authenticated
using (public.current_role() = 'operator');

