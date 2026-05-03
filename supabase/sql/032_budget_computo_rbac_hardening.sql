-- ==========================================================
-- 032: Budget computo RBAC hardening
-- Run after:
--   1) 004_auth_roles.sql
--   2) 005_rbac_project_policies.sql
--   3) 031_budget_computo_structure.sql
--
-- Replaces permissive anon policies created by 031 with authenticated
-- operator/PM access scoped to the related project.
-- ==========================================================

create or replace function public.user_has_budget_version_access(p_budget_id text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.project_budgets pb
    where pb.id = p_budget_id
      and public.current_role() in ('operator', 'pm')
      and public.user_has_project_access(pb.project_id)
  )
$$;

create or replace function public.user_has_budget_rubro_access(p_rubro_id text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.budget_rubros br
    where br.id = p_rubro_id
      and public.user_has_budget_version_access(br.budget_id)
  )
$$;

create or replace function public.user_has_budget_sub_item_access(p_sub_item_id text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.budget_sub_items bsi
    where bsi.id = p_sub_item_id
      and public.user_has_budget_rubro_access(bsi.rubro_id)
  )
$$;

-- Drop permissive policies from 031.
drop policy if exists "budget_rubros_select_all" on public.budget_rubros;
drop policy if exists "budget_rubros_insert_all" on public.budget_rubros;
drop policy if exists "budget_rubros_update_all" on public.budget_rubros;
drop policy if exists "budget_rubros_delete_all" on public.budget_rubros;

drop policy if exists "budget_sub_items_select_all" on public.budget_sub_items;
drop policy if exists "budget_sub_items_insert_all" on public.budget_sub_items;
drop policy if exists "budget_sub_items_update_all" on public.budget_sub_items;
drop policy if exists "budget_sub_items_delete_all" on public.budget_sub_items;

drop policy if exists "budget_sub_item_materials_select_all" on public.budget_sub_item_materials;
drop policy if exists "budget_sub_item_materials_insert_all" on public.budget_sub_item_materials;
drop policy if exists "budget_sub_item_materials_update_all" on public.budget_sub_item_materials;
drop policy if exists "budget_sub_item_materials_delete_all" on public.budget_sub_item_materials;

drop policy if exists "budget_sub_item_labor_select_all" on public.budget_sub_item_labor;
drop policy if exists "budget_sub_item_labor_insert_all" on public.budget_sub_item_labor;
drop policy if exists "budget_sub_item_labor_update_all" on public.budget_sub_item_labor;
drop policy if exists "budget_sub_item_labor_delete_all" on public.budget_sub_item_labor;

drop policy if exists "budget_offer_structure_select_all" on public.budget_offer_structure;
drop policy if exists "budget_offer_structure_insert_all" on public.budget_offer_structure;
drop policy if exists "budget_offer_structure_update_all" on public.budget_offer_structure;
drop policy if exists "budget_offer_structure_delete_all" on public.budget_offer_structure;

drop policy if exists "budget_labor_rates_select_all" on public.budget_labor_rates;
drop policy if exists "budget_labor_rates_insert_all" on public.budget_labor_rates;
drop policy if exists "budget_labor_rates_update_all" on public.budget_labor_rates;
drop policy if exists "budget_labor_rates_delete_all" on public.budget_labor_rates;

drop policy if exists "budget_general_expenses_select_all" on public.budget_general_expenses;
drop policy if exists "budget_general_expenses_insert_all" on public.budget_general_expenses;
drop policy if exists "budget_general_expenses_update_all" on public.budget_general_expenses;
drop policy if exists "budget_general_expenses_delete_all" on public.budget_general_expenses;

-- Make this migration rerunnable.
drop policy if exists "budget_rubros_select_operator_pm" on public.budget_rubros;
drop policy if exists "budget_rubros_insert_operator_pm" on public.budget_rubros;
drop policy if exists "budget_rubros_update_operator_pm" on public.budget_rubros;
drop policy if exists "budget_rubros_delete_operator_pm" on public.budget_rubros;

drop policy if exists "budget_sub_items_select_operator_pm" on public.budget_sub_items;
drop policy if exists "budget_sub_items_insert_operator_pm" on public.budget_sub_items;
drop policy if exists "budget_sub_items_update_operator_pm" on public.budget_sub_items;
drop policy if exists "budget_sub_items_delete_operator_pm" on public.budget_sub_items;

drop policy if exists "budget_sub_item_materials_select_operator_pm" on public.budget_sub_item_materials;
drop policy if exists "budget_sub_item_materials_insert_operator_pm" on public.budget_sub_item_materials;
drop policy if exists "budget_sub_item_materials_update_operator_pm" on public.budget_sub_item_materials;
drop policy if exists "budget_sub_item_materials_delete_operator_pm" on public.budget_sub_item_materials;

drop policy if exists "budget_sub_item_labor_select_operator_pm" on public.budget_sub_item_labor;
drop policy if exists "budget_sub_item_labor_insert_operator_pm" on public.budget_sub_item_labor;
drop policy if exists "budget_sub_item_labor_update_operator_pm" on public.budget_sub_item_labor;
drop policy if exists "budget_sub_item_labor_delete_operator_pm" on public.budget_sub_item_labor;

drop policy if exists "budget_offer_structure_select_operator_pm" on public.budget_offer_structure;
drop policy if exists "budget_offer_structure_insert_operator_pm" on public.budget_offer_structure;
drop policy if exists "budget_offer_structure_update_operator_pm" on public.budget_offer_structure;
drop policy if exists "budget_offer_structure_delete_operator_pm" on public.budget_offer_structure;

drop policy if exists "budget_labor_rates_select_operator_pm" on public.budget_labor_rates;
drop policy if exists "budget_labor_rates_insert_operator_pm" on public.budget_labor_rates;
drop policy if exists "budget_labor_rates_update_operator_pm" on public.budget_labor_rates;
drop policy if exists "budget_labor_rates_delete_operator_pm" on public.budget_labor_rates;

drop policy if exists "budget_general_expenses_select_operator_pm" on public.budget_general_expenses;
drop policy if exists "budget_general_expenses_insert_operator_pm" on public.budget_general_expenses;
drop policy if exists "budget_general_expenses_update_operator_pm" on public.budget_general_expenses;
drop policy if exists "budget_general_expenses_delete_operator_pm" on public.budget_general_expenses;

-- budget_rubros
create policy "budget_rubros_select_operator_pm"
on public.budget_rubros
for select
to authenticated
using (public.user_has_budget_version_access(budget_id));

create policy "budget_rubros_insert_operator_pm"
on public.budget_rubros
for insert
to authenticated
with check (public.user_has_budget_version_access(budget_id));

create policy "budget_rubros_update_operator_pm"
on public.budget_rubros
for update
to authenticated
using (public.user_has_budget_version_access(budget_id))
with check (public.user_has_budget_version_access(budget_id));

create policy "budget_rubros_delete_operator_pm"
on public.budget_rubros
for delete
to authenticated
using (public.user_has_budget_version_access(budget_id));

-- budget_sub_items
create policy "budget_sub_items_select_operator_pm"
on public.budget_sub_items
for select
to authenticated
using (public.user_has_budget_rubro_access(rubro_id));

create policy "budget_sub_items_insert_operator_pm"
on public.budget_sub_items
for insert
to authenticated
with check (public.user_has_budget_rubro_access(rubro_id));

create policy "budget_sub_items_update_operator_pm"
on public.budget_sub_items
for update
to authenticated
using (public.user_has_budget_rubro_access(rubro_id))
with check (public.user_has_budget_rubro_access(rubro_id));

create policy "budget_sub_items_delete_operator_pm"
on public.budget_sub_items
for delete
to authenticated
using (public.user_has_budget_rubro_access(rubro_id));

-- budget_sub_item_materials
create policy "budget_sub_item_materials_select_operator_pm"
on public.budget_sub_item_materials
for select
to authenticated
using (public.user_has_budget_sub_item_access(sub_item_id));

create policy "budget_sub_item_materials_insert_operator_pm"
on public.budget_sub_item_materials
for insert
to authenticated
with check (public.user_has_budget_sub_item_access(sub_item_id));

create policy "budget_sub_item_materials_update_operator_pm"
on public.budget_sub_item_materials
for update
to authenticated
using (public.user_has_budget_sub_item_access(sub_item_id))
with check (public.user_has_budget_sub_item_access(sub_item_id));

create policy "budget_sub_item_materials_delete_operator_pm"
on public.budget_sub_item_materials
for delete
to authenticated
using (public.user_has_budget_sub_item_access(sub_item_id));

-- budget_sub_item_labor
create policy "budget_sub_item_labor_select_operator_pm"
on public.budget_sub_item_labor
for select
to authenticated
using (public.user_has_budget_sub_item_access(sub_item_id));

create policy "budget_sub_item_labor_insert_operator_pm"
on public.budget_sub_item_labor
for insert
to authenticated
with check (public.user_has_budget_sub_item_access(sub_item_id));

create policy "budget_sub_item_labor_update_operator_pm"
on public.budget_sub_item_labor
for update
to authenticated
using (public.user_has_budget_sub_item_access(sub_item_id))
with check (public.user_has_budget_sub_item_access(sub_item_id));

create policy "budget_sub_item_labor_delete_operator_pm"
on public.budget_sub_item_labor
for delete
to authenticated
using (public.user_has_budget_sub_item_access(sub_item_id));

-- budget_offer_structure
create policy "budget_offer_structure_select_operator_pm"
on public.budget_offer_structure
for select
to authenticated
using (public.user_has_budget_version_access(budget_id));

create policy "budget_offer_structure_insert_operator_pm"
on public.budget_offer_structure
for insert
to authenticated
with check (public.user_has_budget_version_access(budget_id));

create policy "budget_offer_structure_update_operator_pm"
on public.budget_offer_structure
for update
to authenticated
using (public.user_has_budget_version_access(budget_id))
with check (public.user_has_budget_version_access(budget_id));

create policy "budget_offer_structure_delete_operator_pm"
on public.budget_offer_structure
for delete
to authenticated
using (public.user_has_budget_version_access(budget_id));

-- budget_labor_rates
create policy "budget_labor_rates_select_operator_pm"
on public.budget_labor_rates
for select
to authenticated
using (public.user_has_budget_version_access(budget_id));

create policy "budget_labor_rates_insert_operator_pm"
on public.budget_labor_rates
for insert
to authenticated
with check (public.user_has_budget_version_access(budget_id));

create policy "budget_labor_rates_update_operator_pm"
on public.budget_labor_rates
for update
to authenticated
using (public.user_has_budget_version_access(budget_id))
with check (public.user_has_budget_version_access(budget_id));

create policy "budget_labor_rates_delete_operator_pm"
on public.budget_labor_rates
for delete
to authenticated
using (public.user_has_budget_version_access(budget_id));

-- budget_general_expenses
create policy "budget_general_expenses_select_operator_pm"
on public.budget_general_expenses
for select
to authenticated
using (public.user_has_budget_version_access(budget_id));

create policy "budget_general_expenses_insert_operator_pm"
on public.budget_general_expenses
for insert
to authenticated
with check (public.user_has_budget_version_access(budget_id));

create policy "budget_general_expenses_update_operator_pm"
on public.budget_general_expenses
for update
to authenticated
using (public.user_has_budget_version_access(budget_id))
with check (public.user_has_budget_version_access(budget_id));

create policy "budget_general_expenses_delete_operator_pm"
on public.budget_general_expenses
for delete
to authenticated
using (public.user_has_budget_version_access(budget_id));
