-- Fix reminder validation for all-day agenda events
-- Run after:
--   1) 026_project_agenda_assignments_and_reminders.sql

create or replace function public.guard_project_agenda_event_assignment()
returns trigger
language plpgsql
as $$
declare
  reminder_limit timestamptz;
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

  if new.reminder_at is not null then
    if coalesce(new.is_all_day, false) then
      reminder_limit :=
        date_trunc('day', coalesce(new.ends_at, new.starts_at))
        + interval '1 day'
        - interval '1 second';
    else
      reminder_limit := coalesce(new.starts_at, new.ends_at);
    end if;

    if reminder_limit is not null and new.reminder_at > reminder_limit then
      raise exception 'Reminder must be earlier than or equal to the agenda due window.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_project_agenda_event_assignment on public.project_agenda_events;
create trigger trg_guard_project_agenda_event_assignment
before insert or update on public.project_agenda_events
for each row execute function public.guard_project_agenda_event_assignment();
