-- Add the student garden insert policy used when a student first opens Dream Garden.

alter table public.student_gardens enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'student_gardens'
      and policyname = 'student_gardens_insert_own'
  ) then
    create policy student_gardens_insert_own
    on public.student_gardens
    for insert
    to authenticated
    with check (student_id = auth.uid());
  end if;
end $$;
