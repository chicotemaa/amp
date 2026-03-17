-- Manual project agenda events for operational tracking
-- Run after:
--   1) 005_rbac_project_policies.sql
--   2) 024_contract_publication_governance.sql

create table if not exists public.project_agenda_events (
  id uuid primary key default gen_random_uuid(),
  project_id bigint not null references public.projects(id) on delete cascade,
  phase_id uuid references public.project_phases(id) on delete set null,
  title text not null,
  description text,
  category text not null default 'operation'
    check (category in ('operation', 'deadline', 'meeting', 'inspection', 'delivery', 'payment', 'client')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  is_all_day boolean not null default true,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'in_progress', 'completed', 'cancelled', 'delayed')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'critical')),
  created_by bigint references public.employees(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_agenda_events_range_check check (
    ends_at is null or ends_at >= starts_at
  )
);

create index if not exists idx_project_agenda_events_project_start
  on public.project_agenda_events(project_id, starts_at desc);

create index if not exists idx_project_agenda_events_phase
  on public.project_agenda_events(phase_id);

drop trigger if exists trg_project_agenda_events_touch_updated_at on public.project_agenda_events;
create trigger trg_project_agenda_events_touch_updated_at
before update on public.project_agenda_events
for each row execute function public.touch_updated_at();

create or replace function public.assign_project_agenda_event_creator()
returns trigger
language plpgsql
as $$
begin
  new.created_by = coalesce(new.created_by, public.current_employee_id());
  return new;
end;
$$;

drop trigger if exists trg_assign_project_agenda_event_creator on public.project_agenda_events;
create trigger trg_assign_project_agenda_event_creator
before insert on public.project_agenda_events
for each row execute function public.assign_project_agenda_event_creator();

alter table public.project_agenda_events enable row level security;

drop policy if exists "project_agenda_events_select_by_role" on public.project_agenda_events;
drop policy if exists "project_agenda_events_insert_by_role" on public.project_agenda_events;
drop policy if exists "project_agenda_events_update_by_role" on public.project_agenda_events;
drop policy if exists "project_agenda_events_delete_by_role" on public.project_agenda_events;

create policy "project_agenda_events_select_by_role"
on public.project_agenda_events
for select
to authenticated
using (
  public.current_role() in ('operator', 'pm', 'inspector')
  and public.user_has_project_access(project_id)
);

create policy "project_agenda_events_insert_by_role"
on public.project_agenda_events
for insert
to authenticated
with check (
  public.current_role() in ('operator', 'pm', 'inspector')
  and public.user_has_project_access(project_id)
);

create policy "project_agenda_events_update_by_role"
on public.project_agenda_events
for update
to authenticated
using (
  (
    public.current_role() = 'operator'
    or (public.current_role() = 'pm' and public.user_has_project_access(project_id))
    or (
      public.current_role() = 'inspector'
      and public.user_has_project_access(project_id)
      and created_by = public.current_employee_id()
    )
  )
)
with check (
  (
    public.current_role() = 'operator'
    or (public.current_role() = 'pm' and public.user_has_project_access(project_id))
    or (
      public.current_role() = 'inspector'
      and public.user_has_project_access(project_id)
      and created_by = public.current_employee_id()
    )
  )
);

create policy "project_agenda_events_delete_by_role"
on public.project_agenda_events
for delete
to authenticated
using (
  public.current_role() = 'operator'
  or (public.current_role() = 'pm' and public.user_has_project_access(project_id))
  or (
    public.current_role() = 'inspector'
    and public.user_has_project_access(project_id)
    and created_by = public.current_employee_id()
  )
);
