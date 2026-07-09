-- Student-specific hidden content for teacher messages and notifications.
-- This hides content only for the current student and does not delete source records.

create table if not exists public.student_hidden_messages (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  message_id uuid not null,
  message_type text not null,
  hidden_at timestamptz not null default now(),
  constraint student_hidden_messages_type_check check (
    message_type in ('teacher_message', 'student_notification', 'org_notification', 'announcement')
  ),
  constraint student_hidden_messages_unique unique (student_id, message_id, message_type)
);

create index if not exists idx_student_hidden_messages_student_type
on public.student_hidden_messages(student_id, message_type);

create index if not exists idx_student_hidden_messages_message
on public.student_hidden_messages(message_id, message_type);

alter table public.student_hidden_messages enable row level security;

drop policy if exists "student_hidden_messages_select_own" on public.student_hidden_messages;
create policy "student_hidden_messages_select_own"
on public.student_hidden_messages
for select
to authenticated
using (student_id = auth.uid());

drop policy if exists "student_hidden_messages_insert_own" on public.student_hidden_messages;
create policy "student_hidden_messages_insert_own"
on public.student_hidden_messages
for insert
to authenticated
with check (student_id = auth.uid());

drop policy if exists "student_hidden_messages_delete_own" on public.student_hidden_messages;
create policy "student_hidden_messages_delete_own"
on public.student_hidden_messages
for delete
to authenticated
using (student_id = auth.uid());