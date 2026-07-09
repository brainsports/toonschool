-- Add RLS policies required for student Dream Garden rewards.
-- Existing item select and garden placement policies are kept as-is.

alter table public.student_gardens enable row level security;
alter table public.student_items enable row level security;
alter table public.reward_logs enable row level security;
alter table public.student_reward_stats enable row level security;

drop policy if exists "student_gardens_insert_own_rewards" on public.student_gardens;
create policy "student_gardens_insert_own_rewards"
on public.student_gardens
for insert
to authenticated
with check (student_id = auth.uid());

drop policy if exists "student_gardens_update_own_rewards" on public.student_gardens;
create policy "student_gardens_update_own_rewards"
on public.student_gardens
for update
to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid());

drop policy if exists "student_items_insert_own_rewards" on public.student_items;
create policy "student_items_insert_own_rewards"
on public.student_items
for insert
to authenticated
with check (
  student_id = auth.uid()
  and exists (
    select 1
    from public.items i
    where i.id = student_items.item_id
      and i.is_active = true
  )
);

drop policy if exists "student_items_update_own_rewards" on public.student_items;
create policy "student_items_update_own_rewards"
on public.student_items
for update
to authenticated
using (student_id = auth.uid())
with check (
  student_id = auth.uid()
  and exists (
    select 1
    from public.items i
    where i.id = student_items.item_id
      and i.is_active = true
  )
);

drop policy if exists "reward_logs_insert_own_rewards" on public.reward_logs;
create policy "reward_logs_insert_own_rewards"
on public.reward_logs
for insert
to authenticated
with check (student_id = auth.uid());

drop policy if exists "student_reward_stats_insert_own_rewards" on public.student_reward_stats;
create policy "student_reward_stats_insert_own_rewards"
on public.student_reward_stats
for insert
to authenticated
with check (student_id = auth.uid());

drop policy if exists "student_reward_stats_update_own_rewards" on public.student_reward_stats;
create policy "student_reward_stats_update_own_rewards"
on public.student_reward_stats
for update
to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid());
