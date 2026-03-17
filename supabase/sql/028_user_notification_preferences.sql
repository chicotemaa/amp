-- User notification preferences for operational agenda delivery
-- Run after:
--   1) 027_user_notification_reads.sql

create table if not exists public.user_notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email_enabled boolean not null default false,
  email_for_reminder_due boolean not null default true,
  email_for_reminder_upcoming boolean not null default true,
  email_for_due_today boolean not null default false,
  email_for_overdue boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_notification_preferences_user
  on public.user_notification_preferences(user_id);

drop trigger if exists trg_user_notification_preferences_touch_updated_at on public.user_notification_preferences;
create trigger trg_user_notification_preferences_touch_updated_at
before update on public.user_notification_preferences
for each row execute function public.touch_updated_at();

alter table public.user_notification_preferences enable row level security;

drop policy if exists "user_notification_preferences_select_self" on public.user_notification_preferences;
drop policy if exists "user_notification_preferences_insert_self" on public.user_notification_preferences;
drop policy if exists "user_notification_preferences_update_self" on public.user_notification_preferences;
drop policy if exists "user_notification_preferences_delete_self" on public.user_notification_preferences;

create policy "user_notification_preferences_select_self"
on public.user_notification_preferences
for select
to authenticated
using (user_id = auth.uid());

create policy "user_notification_preferences_insert_self"
on public.user_notification_preferences
for insert
to authenticated
with check (user_id = auth.uid());

create policy "user_notification_preferences_update_self"
on public.user_notification_preferences
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "user_notification_preferences_delete_self"
on public.user_notification_preferences
for delete
to authenticated
using (user_id = auth.uid());
