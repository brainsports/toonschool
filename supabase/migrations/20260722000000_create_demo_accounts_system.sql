-- 공개 체험(데모) 계정 시스템.
--
-- 목적:
--   1) 공개 방문자 체험용 계정/기관/학급/데이터를 운영 데이터와 DB 수준에서 구분(is_demo).
--   2) protect_profile_system_fields 트리거에 is_demo 보호 추가 → 클라이언트가 임의 해제 불가.
--   3) demo-login Edge Function 용 요청 제한 테이블.
--   4) 데모 계정의 AI 생성 일일 한도 테이블 + increment_demo_usage RPC.
--
-- 안전:
--   - 전부 멱등(IF NOT EXISTS / CREATE OR REPLACE)이므로 재실행 안전.
--   - 기존 운영 데이터는 is_demo 기본값 false 로 영향 없음.
--   - RLS 정책은 변경하지 않는다. 데모 계정도 기존 RLS를 그대로 타며, 자기 소유 데이터만 접근.
--   - 실제 데모 계정/기관/학급/샘플 데이터 생성은 scripts/provision-demo-accounts.ts 가 담당(별도).

-- ---------------------------------------------------------------------------
-- 1) is_demo 구분 컬럼 추가 (profiles / organizations / classes / students)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists is_demo boolean not null default false;

alter table public.organizations
  add column if not exists is_demo boolean not null default false;

alter table public.classes
  add column if not exists is_demo boolean not null default false;

alter table public.students
  add column if not exists is_demo boolean not null default false;

-- profiles.is_demo 를 클라이언트가 임의로 바꾸지 못하도록 보호 트리거에 추가.
-- (service_role/postgres 는 current_user 가 anon/authenticated 가 아니므로 그대로 변경 가능.
--  프런트엔드에서 데모 여부를 바꿔 제한을 빠져나가는 것을 서버 측에서 차단.)
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
       or new.is_demo is distinct from old.is_demo
     )
  then
    raise exception 'Protected profile fields can only be changed by the server.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.protect_profile_system_fields() from public, anon, authenticated;

-- (트리거 자체는 기존 protect_profile_system_fields 가 이미 동일 이름으로 걸려 있으므로 재생성 불필요.
--  함수 본문만 위에서 교체했고, 트리거는 함수를 참조하므로 새 본문이 즉시 적용된다.)

-- 운영 통계/조회에서 데모 데이터를 제외할 때: where is_demo is distinct from true

-- ---------------------------------------------------------------------------
-- 2) demo-login 요청 제한 테이블 (IP+role+1시간 버킷)
-- ---------------------------------------------------------------------------
create table if not exists public.demo_login_rate_limits (
  ip_hash     text not null,
  role        text not null,
  bucket_hour timestamptz not null,
  count       integer not null default 0,
  primary key (ip_hash, role, bucket_hour)
);

alter table public.demo_login_rate_limits enable row level security;
-- anon/authenticated 는 읽기/쓰기 불가(RLS 정책 없음). service_role 은 RLS 우회로 사용.
revoke all on public.demo_login_rate_limits from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3) 데모 계정 AI 생성 일일 한도 테이블 + 증가 RPC
-- ---------------------------------------------------------------------------
create table if not exists public.demo_usage_limits (
  account_id  uuid not null,
  limit_type  text not null,        -- 'mindmap' | 'image'
  period_date date not null,        -- UTC 기준 일별
  used        integer not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (account_id, limit_type, period_date)
);

alter table public.demo_usage_limits enable row level security;
revoke all on public.demo_usage_limits from anon, authenticated;

-- 데모 계정의 일일 사용량을 1 증가시키고 한도 초과 시 예외를 던진다.
-- SECURITY DEFINER(소유자=슈퍼유저) → Edge Function(service_role)이 호출. 일반 클라이언트는 호출 금지.
-- 한도를 초과한 요청도 used 가 증가하지만 실제 생성은 RAISE 로 차단된다(데모 보호 목적에 충분).
create or replace function public.increment_demo_usage(
  p_account_id uuid,
  p_limit_type text,
  p_limit integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_used integer;
begin
  insert into public.demo_usage_limits (account_id, limit_type, period_date, used)
  values (p_account_id, p_limit_type, CURRENT_DATE, 1)
  on conflict (account_id, limit_type, period_date)
  do update set used = public.demo_usage_limits.used + 1,
                updated_at = now()
  returning used into v_used;

  if v_used > p_limit then
    raise exception 'DEMO_LIMIT_EXCEEDED'
      using errcode = '40001';
  end if;

  return jsonb_build_object('ok', true, 'used', v_used, 'limit', p_limit);
end;
$$;

revoke all on function public.increment_demo_usage(uuid, text, integer) from anon, authenticated;
