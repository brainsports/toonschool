-- Allow hidden encounter rewards in the existing Dream Garden reward tables.

alter table public.student_items
  drop constraint if exists student_items_source_type_check;

alter table public.student_items
  add constraint student_items_source_type_check check (
    source_type in ('attendance', 'comic_complete', 'lucky_reward', 'hidden_encounter', 'teacher_reward', 'event')
  );

alter table public.reward_logs
  drop constraint if exists reward_logs_reward_type_check;

alter table public.reward_logs
  add constraint reward_logs_reward_type_check check (
    reward_type in ('attendance', 'comic_complete', 'lucky_reward', 'hidden_encounter', 'teacher_reward', 'event')
  );