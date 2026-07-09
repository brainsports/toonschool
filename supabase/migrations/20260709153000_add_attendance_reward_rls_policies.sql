-- Add RLS policies required for attendance reward grants.
-- Existing policies are preserved; these policies allow only each student to write their own reward rows.

alter table public.student_items enable row level security;

drop policy if exists "student_items_insert_own" on public.student_items;
create policy "student_items_insert_own"
on public.student_items
for insert
to authenticated
with check (student_id = auth.uid());

alter table public.reward_logs enable row level security;

drop policy if exists "reward_logs_insert_own" on public.reward_logs;
create policy "reward_logs_insert_own"
on public.reward_logs
for insert
to authenticated
with check (student_id = auth.uid());

alter table public.student_reward_stats enable row level security;

drop policy if exists "student_reward_stats_insert_own" on public.student_reward_stats;
create policy "student_reward_stats_insert_own"
on public.student_reward_stats
for insert
to authenticated
with check (student_id = auth.uid());

drop policy if exists "student_reward_stats_update_own" on public.student_reward_stats;
create policy "student_reward_stats_update_own"
on public.student_reward_stats
for update
to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid());
