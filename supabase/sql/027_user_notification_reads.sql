-- Per-user notification read state for in-app operational alerts
-- Run after:
--   1) 026_project_agenda_assignments_and_reminders.sql

create table if not exists public.user_notification_reads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_key text not null,
  read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, notification_key)
);

create index if not exists idx_user_notification_reads_user
  on public.user_notification_reads(user_id, read_at desc);

alter table public.user_notification_reads enable row level security;

drop policy if exists "user_notification_reads_select_self" on public.user_notification_reads;
drop policy if exists "user_notification_reads_insert_self" on public.user_notification_reads;
drop policy if exists "user_notification_reads_update_self" on public.user_notification_reads;
drop policy if exists "user_notification_reads_delete_self" on public.user_notification_reads;

create policy "user_notification_reads_select_self"
on public.user_notification_reads
for select
to authenticated
using (user_id = auth.uid());

create policy "user_notification_reads_insert_self"
on public.user_notification_reads
for insert
to authenticated
with check (user_id = auth.uid());

create policy "user_notification_reads_update_self"
on public.user_notification_reads
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "user_notification_reads_delete_self"
on public.user_notification_reads
for delete
to authenticated
using (user_id = auth.uid());
