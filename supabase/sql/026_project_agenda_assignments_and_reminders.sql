-- Agenda assignees + reminders for operational follow-up
-- Run after:
--   1) 025_project_agenda_events.sql

alter table public.project_agenda_events
  add column if not exists assigned_to bigint references public.employees(id) on delete set null,
  add column if not exists reminder_at timestamptz;

create index if not exists idx_project_agenda_events_assigned_to
  on public.project_agenda_events(assigned_to);

create index if not exists idx_project_agenda_events_reminder
  on public.project_agenda_events(reminder_at);

create or replace function public.guard_project_agenda_event_assignment()
returns trigger
language plpgsql
as $$
begin
  if new.assigned_to is not null then
    if not exists (
      select 1
      from public.employee_projects ep
      where ep.project_id = new.project_id
        and ep.employee_id = new.assigned_to
    ) then
      raise exception 'Assigned employee must belong to the selected project.';
    end if;
  end if;

  if new.reminder_at is not null and new.reminder_at > new.starts_at then
    raise exception 'Reminder must be earlier than or equal to the event start.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_project_agenda_event_assignment on public.project_agenda_events;
create trigger trg_guard_project_agenda_event_assignment
before insert or update on public.project_agenda_events
for each row execute function public.guard_project_agenda_event_assignment();
