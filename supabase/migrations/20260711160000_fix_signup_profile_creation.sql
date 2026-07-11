-- Create signup profiles on the server and keep protected profile fields
-- outside direct client control.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    email,
    name,
    role,
    status,
    plan_type,
    monthly_quota,
    organization_id
  )
  values (
    new.id,
    new.email,
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    'free_user',
    'active',
    'free',
    3,
    null
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create or replace trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create or replace function public.protect_profile_system_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated')
     and (
       new.id is distinct from old.id
       or new.email is distinct from old.email
       or new.role is distinct from old.role
       or new.center_id is distinct from old.center_id
       or new.plan_type is distinct from old.plan_type
       or new.monthly_quota is distinct from old.monthly_quota
       or new.monthly_used is distinct from old.monthly_used
       or new.status is distinct from old.status
       or new.created_at is distinct from old.created_at
       or new.organization_id is distinct from old.organization_id
     )
  then
    raise exception 'Protected profile fields can only be changed by the server.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.protect_profile_system_fields() from public, anon, authenticated;

create or replace trigger protect_profile_system_fields
before update on public.profiles
for each row
execute function public.protect_profile_system_fields();

-- Direct profile creation remains unavailable to browser clients. The broad
-- table grant is narrowed as defense in depth; service_role keeps its access.
revoke insert on table public.profiles from anon, authenticated;

-- User metadata is client-editable and must never grant administrative reads.
-- The existing is_super_admin() policy remains as the DB-backed replacement.
do $$
begin
  execute format(
    'drop policy if exists %I on public.profiles',
    'Super admins can read all profiles'
  );
end;
$$;

-- Repair only the explicitly identified signup test account. Do not infer a
-- role for any other auth user that is missing a profile.
insert into public.profiles (
  id,
  email,
  name,
  role,
  status,
  plan_type,
  monthly_quota,
  organization_id
)
select
  u.id,
  u.email,
  nullif(btrim(u.raw_user_meta_data ->> 'name'), ''),
  'free_user',
  'active',
  'free',
  3,
  null
from auth.users as u
where lower(u.email) = 'toonschooltest+signup1410@gmail.com'
on conflict (id) do nothing;
