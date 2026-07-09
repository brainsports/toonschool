-- Dream garden item system tables

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category text not null,
  rarity text not null,
  description text,
  image_url text,
  is_placeable boolean not null default true,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint items_category_check check (
    category in ('nature', 'animal', 'spirit', 'decor', 'sky', 'legend')
  ),
  constraint items_rarity_check check (
    rarity in ('common', 'uncommon', 'rare', 'epic', 'legendary')
  )
);

create table if not exists public.student_items (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete restrict,
  source_type text not null,
  source_id text,
  acquired_at timestamptz not null default now(),
  quantity integer not null default 1,
  is_new boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_items_source_type_check check (
    source_type in ('attendance', 'comic_complete', 'lucky_reward', 'teacher_reward', 'event')
  ),
  constraint student_items_quantity_check check (quantity > 0)
);

create table if not exists public.student_gardens (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.profiles(id) on delete cascade,
  garden_name text not null,
  level integer not null default 1,
  experience integer not null default 0,
  background_code text not null default 'default_garden',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_gardens_level_check check (level > 0),
  constraint student_gardens_experience_check check (experience >= 0)
);

create table if not exists public.garden_placements (
  id uuid primary key default gen_random_uuid(),
  garden_id uuid not null references public.student_gardens(id) on delete cascade,
  student_item_id uuid not null references public.student_items(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete restrict,
  x numeric not null default 0,
  y numeric not null default 0,
  scale numeric not null default 1,
  z_index integer not null default 1,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint garden_placements_scale_check check (scale > 0),
  constraint garden_placements_student_item_unique unique (garden_id, student_item_id)
);

create table if not exists public.reward_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  reward_type text not null,
  source_id text,
  reward_date date,
  item_id uuid references public.items(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint reward_logs_reward_type_check check (
    reward_type in ('attendance', 'comic_complete', 'lucky_reward', 'teacher_reward', 'event')
  )
);

create table if not exists public.student_reward_stats (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.profiles(id) on delete cascade,
  completed_comic_count integer not null default 0,
  last_lucky_reward_count integer not null default 0,
  last_attendance_reward_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_reward_stats_completed_comic_count_check check (completed_comic_count >= 0),
  constraint student_reward_stats_last_lucky_reward_count_check check (last_lucky_reward_count >= 0)
);

create index if not exists idx_student_items_student_id
on public.student_items(student_id);

create index if not exists idx_student_items_item_id
on public.student_items(item_id);

create index if not exists idx_student_items_source_type
on public.student_items(source_type);

create index if not exists idx_student_gardens_student_id
on public.student_gardens(student_id);

create index if not exists idx_garden_placements_garden_id
on public.garden_placements(garden_id);

create index if not exists idx_garden_placements_student_item_id
on public.garden_placements(student_item_id);

create index if not exists idx_reward_logs_student_id
on public.reward_logs(student_id);

create index if not exists idx_reward_logs_reward_type
on public.reward_logs(reward_type);

create unique index if not exists idx_reward_logs_student_reward_source_unique
on public.reward_logs(student_id, reward_type, source_id)
where source_id is not null;

create unique index if not exists idx_reward_logs_student_reward_date_unique
on public.reward_logs(student_id, reward_type, reward_date)
where source_id is null and reward_date is not null;

create index if not exists idx_student_reward_stats_student_id
on public.student_reward_stats(student_id);

drop trigger if exists trg_items_set_updated_at on public.items;
create trigger trg_items_set_updated_at
before update on public.items
for each row execute function public.set_updated_at();

drop trigger if exists trg_student_items_set_updated_at on public.student_items;
create trigger trg_student_items_set_updated_at
before update on public.student_items
for each row execute function public.set_updated_at();

drop trigger if exists trg_student_gardens_set_updated_at on public.student_gardens;
create trigger trg_student_gardens_set_updated_at
before update on public.student_gardens
for each row execute function public.set_updated_at();

drop trigger if exists trg_garden_placements_set_updated_at on public.garden_placements;
create trigger trg_garden_placements_set_updated_at
before update on public.garden_placements
for each row execute function public.set_updated_at();

drop trigger if exists trg_student_reward_stats_set_updated_at on public.student_reward_stats;
create trigger trg_student_reward_stats_set_updated_at
before update on public.student_reward_stats
for each row execute function public.set_updated_at();

alter table public.items enable row level security;
alter table public.student_items enable row level security;
alter table public.student_gardens enable row level security;
alter table public.garden_placements enable row level security;
alter table public.reward_logs enable row level security;
alter table public.student_reward_stats enable row level security;

drop policy if exists "items_select_active_authenticated" on public.items;
create policy "items_select_active_authenticated"
on public.items
for select
to authenticated
using (is_active = true);

drop policy if exists "student_items_select_own" on public.student_items;
create policy "student_items_select_own"
on public.student_items
for select
to authenticated
using (student_id = auth.uid());


drop policy if exists "student_gardens_select_own" on public.student_gardens;
create policy "student_gardens_select_own"
on public.student_gardens
for select
to authenticated
using (student_id = auth.uid());


drop policy if exists "garden_placements_select_own" on public.garden_placements;
create policy "garden_placements_select_own"
on public.garden_placements
for select
to authenticated
using (
  exists (
    select 1
    from public.student_gardens g
    where g.id = garden_placements.garden_id
      and g.student_id = auth.uid()
  )
);

drop policy if exists "garden_placements_insert_own" on public.garden_placements;
create policy "garden_placements_insert_own"
on public.garden_placements
for insert
to authenticated
with check (
  exists (
    select 1
    from public.student_gardens g
    where g.id = garden_placements.garden_id
      and g.student_id = auth.uid()
  )
  and exists (
    select 1
    from public.student_items si
    join public.items i on i.id = si.item_id
    where si.id = garden_placements.student_item_id
      and si.student_id = auth.uid()
      and si.item_id = garden_placements.item_id
      and i.is_placeable = true
      and i.is_active = true
  )
);

drop policy if exists "garden_placements_update_own" on public.garden_placements;
create policy "garden_placements_update_own"
on public.garden_placements
for update
to authenticated
using (
  exists (
    select 1
    from public.student_gardens g
    where g.id = garden_placements.garden_id
      and g.student_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.student_gardens g
    where g.id = garden_placements.garden_id
      and g.student_id = auth.uid()
  )
  and exists (
    select 1
    from public.student_items si
    join public.items i on i.id = si.item_id
    where si.id = garden_placements.student_item_id
      and si.student_id = auth.uid()
      and si.item_id = garden_placements.item_id
      and i.is_placeable = true
      and i.is_active = true
  )
);

drop policy if exists "garden_placements_delete_own" on public.garden_placements;
create policy "garden_placements_delete_own"
on public.garden_placements
for delete
to authenticated
using (
  exists (
    select 1
    from public.student_gardens g
    where g.id = garden_placements.garden_id
      and g.student_id = auth.uid()
  )
);

drop policy if exists "reward_logs_select_own" on public.reward_logs;
create policy "reward_logs_select_own"
on public.reward_logs
for select
to authenticated
using (student_id = auth.uid());

drop policy if exists "student_reward_stats_select_own" on public.student_reward_stats;
create policy "student_reward_stats_select_own"
on public.student_reward_stats
for select
to authenticated
using (student_id = auth.uid());



