-- Agenda notification delivery log for external channels
-- Run after:
--   1) 028_user_notification_preferences.sql

create table if not exists public.agenda_notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_key text not null,
  channel text not null check (channel in ('email')),
  recipient text not null,
  subject text not null,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed', 'skipped')),
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  unique (user_id, notification_key, channel)
);

create index if not exists idx_agenda_notification_deliveries_user
  on public.agenda_notification_deliveries(user_id, created_at desc);

create index if not exists idx_agenda_notification_deliveries_status
  on public.agenda_notification_deliveries(status, created_at desc);

alter table public.agenda_notification_deliveries enable row level security;

drop policy if exists "agenda_notification_deliveries_select_self" on public.agenda_notification_deliveries;

create policy "agenda_notification_deliveries_select_self"
on public.agenda_notification_deliveries
for select
to authenticated
using (user_id = auth.uid());
