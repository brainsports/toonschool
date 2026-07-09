-- Question-centered topic generation tables

create table if not exists public.question_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.question_categories (code, name, description, sort_order)
values
  ('why', '왜 그럴까?', '개념 이해를 돕는 질문', 1),
  ('what_if', '만약 없다면?', '상상과 변화를 생각하는 질문', 2),
  ('experiment', '실험해 보면?', '탐구와 관찰을 이끄는 질문', 3),
  ('life', '우리 생활에서는?', '생활 속 연결을 찾는 질문', 4),
  ('true_or_false', '정말일까?', '오개념을 확인하는 질문', 5),
  ('secret', '어떤 비밀이 있을까?', '흥미와 호기심을 여는 질문', 6)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true;

create table if not exists public.generated_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  grade integer,
  subject text,
  semester text,
  unit_id uuid,
  subunit_id uuid,

  keyword text not null,
  category_code text not null references public.question_categories(code),
  question_text text not null,
  is_selected boolean not null default false,

  created_at timestamptz not null default now()
);

create table if not exists public.generated_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.generated_questions(id) on delete cascade,

  topic_text text not null,
  batch_no integer not null default 1,
  is_selected boolean not null default false,

  created_at timestamptz not null default now()
);

create index if not exists idx_generated_questions_user_id
on public.generated_questions(user_id);

create index if not exists idx_generated_questions_context
on public.generated_questions(subject, grade, keyword, category_code);

create index if not exists idx_generated_topics_question_id
on public.generated_topics(question_id);

create index if not exists idx_generated_topics_user_id
on public.generated_topics(user_id);

alter table public.question_categories enable row level security;
alter table public.generated_questions enable row level security;
alter table public.generated_topics enable row level security;

drop policy if exists "question_categories_select_authenticated" on public.question_categories;
create policy "question_categories_select_authenticated"
on public.question_categories
for select
to authenticated
using (is_active = true);

drop policy if exists "generated_questions_select_own" on public.generated_questions;
create policy "generated_questions_select_own"
on public.generated_questions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "generated_questions_insert_own" on public.generated_questions;
create policy "generated_questions_insert_own"
on public.generated_questions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "generated_questions_update_own" on public.generated_questions;
create policy "generated_questions_update_own"
on public.generated_questions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "generated_topics_select_own" on public.generated_topics;
create policy "generated_topics_select_own"
on public.generated_topics
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "generated_topics_insert_own" on public.generated_topics;
create policy "generated_topics_insert_own"
on public.generated_topics
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "generated_topics_update_own" on public.generated_topics;
create policy "generated_topics_update_own"
on public.generated_topics
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);