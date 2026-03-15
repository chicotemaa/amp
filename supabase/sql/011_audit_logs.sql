-- Audit logs for critical workflow actions
-- Run after:
--   1) 004_auth_roles.sql
--   2) 005_rbac_project_policies.sql

create extension if not exists pgcrypto;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  project_id bigint references public.projects(id) on delete set null,
  action text not null,
  from_state text,
  to_state text,
  actor_profile_id uuid not null references public.profiles(id) on delete cascade,
  actor_role public.role_type not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_project_id
  on public.audit_logs(project_id);

create index if not exists idx_audit_logs_entity
  on public.audit_logs(entity_type, entity_id);

create index if not exists idx_audit_logs_created_at
  on public.audit_logs(created_at desc);

alter table public.audit_logs enable row level security;

drop policy if exists "audit_logs_select_by_role" on public.audit_logs;
drop policy if exists "audit_logs_insert_authenticated" on public.audit_logs;

create policy "audit_logs_select_by_role"
on public.audit_logs
for select
to authenticated
using (
  public.current_role() = 'operator'
  or (project_id is not null and public.user_has_project_access(project_id))
);

create policy "audit_logs_insert_authenticated"
on public.audit_logs
for insert
to authenticated
with check (
  actor_profile_id = auth.uid()
  and (
    public.current_role() = 'operator'
    or project_id is null
    or public.user_has_project_access(project_id)
  )
);
