-- Milestones workflow normalization
-- Run after:
--   1) 003_execution_workflow.sql
--   2) 009_client_visibility_and_impersonation.sql

alter table public.milestones
  add column if not exists field_completed_at timestamptz,
  add column if not exists field_completed_by bigint references public.employees(id) on delete set null;

update public.milestones
set status = case
  when status = 'in-progress' then 'field_completed'
  when status = 'completed' then 'validated'
  when status = 'delayed' then 'rejected'
  else 'pending'
end
where status in ('pending', 'in-progress', 'completed', 'delayed');

do $$
declare
  old_constraint text;
begin
  select conname
  into old_constraint
  from pg_constraint
  where conrelid = 'public.milestones'::regclass
    and contype = 'c'
    and conname like '%status%';

  if old_constraint is not null then
    execute format('alter table public.milestones drop constraint %I', old_constraint);
  end if;
end $$;

alter table public.milestones
  add constraint milestones_status_check
  check (status in ('pending', 'field_completed', 'validated', 'published', 'closed', 'rejected'));
