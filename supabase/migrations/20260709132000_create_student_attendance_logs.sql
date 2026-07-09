-- Create student_attendance_logs table
create table if not exists public.student_attendance_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  attendance_date date not null,
  created_at timestamptz not null default now(),
  constraint student_attendance_logs_unique unique (student_id, attendance_date)
);

-- Index for fast queries
create index if not exists idx_student_attendance_logs_student_date 
on public.student_attendance_logs(student_id, attendance_date);

-- Enable RLS
alter table public.student_attendance_logs enable row level security;

-- Policies
drop policy if exists "student_attendance_logs_select_own" on public.student_attendance_logs;
create policy "student_attendance_logs_select_own"
on public.student_attendance_logs
for select
to authenticated
using (student_id = auth.uid());

drop policy if exists "student_attendance_logs_insert_own" on public.student_attendance_logs;
create policy "student_attendance_logs_insert_own"
on public.student_attendance_logs
for insert
to authenticated
with check (student_id = auth.uid());
