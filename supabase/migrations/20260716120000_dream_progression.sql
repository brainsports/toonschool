-- ============================================================================
-- 꿈의 궁전 성장형 보상 시스템 — additive 마이그레이션
-- ============================================================================
-- 목적: 크로스 사용자 기능(우리 반 랭킹 / 교사 학생 점수 조회)을 잠금해제.
--
-- 적용 이력(2026-07-17): 본 파일을 운영 DB 에 수동 적용(supabase db query --linked -f).
--   - denorm 3컬럼(dream_score/activity_score/dream_level): 적용됨(정상).
--   - student_reward_stats_select_same_class / _for_teacher 정책: 적용됨(정상).
--   - students_select_same_class 정책: ★적용 후 무한 재귀(500)로 곧바로 DROP 했음★.
--     (RLS 정책이 자기 테이블(students)을 서브쿼리 참조 → PostgreSQL RLS 재귀 에러.
--      같은 학급 students 행 상호 읽기는 SECURITY DEFINER 헬퍼(get_my_class_id) 도입 후
--      별도 마이그레이션으로 안전하게 재도입해야 한다. 현재는 랭킹 이름 노출만 fallback.)
--
-- 모든 구문은 ADDITIVE/멱등(IF NOT EXISTS, DROP POLICY IF EXISTS)이며 기존 데이터를 삭제하지 않는다.
-- ============================================================================

-- 1) student_reward_stats 에 denorm 점수/레벨 컬럼 추가(클라이언트가 best-effort 로 갱신).
alter table public.student_reward_stats
  add column if not exists dream_score integer not null default 0,
  add column if not exists activity_score integer not null default 0,
  add column if not exists dream_level integer not null default 1;

alter table public.student_reward_stats
  drop constraint if exists student_reward_stats_dream_level_check;
alter table public.student_reward_stats
  add constraint student_reward_stats_dream_level_check check (dream_level >= 1);

-- 2) 랭킹용: 같은 학급 동급생의 student_reward_stats 행을 서로 읽을 수 있도록 허용.
--    (본인은 기존 정책으로 이미 읽기 가능)
drop policy if exists "student_reward_stats_select_same_class" on public.student_reward_stats;
create policy "student_reward_stats_select_same_class"
on public.student_reward_stats
for select
to authenticated
using (
  student_id = auth.uid()
  or exists (
    -- 요청자와 대상 학생이 같은 class_id 인 경우만 노출
    select 1
    from public.students me
    join public.students them on them.class_id = me.class_id
    where me.id = auth.uid()
      and them.id = student_reward_stats.student_id
      and me.class_id is not null
  )
);

-- 3) ★ students_select_same_class 정책은 제외됨(재귀 버그) ★
--    원래 같은 학급 students 행 상호 읽기를 허용하려 했으나, RLS 정책이 students 를
--    서브쿼리로 자기 참조하여 PostgreSQL RLS 무한 재귀(500 에러)를 유발한다.
--    운영 적용 후 즉시 DROP 했고 이 파일에서도 제외한다.
--    [복구 필요] 동급생 students 행 읽기(랭킹 이름 표시)를 켜려면 SECURITY DEFINER 함수
--    get_my_class_id() 를 만들어 자식 참조 없이 class_id = public.get_my_class_id() 형태로
--    별도 마이그레이션에서 재도입할 것.

-- 4) 교사용: 담당 학생(created_by 본인 OR 본인 소유 학급)의 student_reward_stats 읽기 허용.
drop policy if exists "student_reward_stats_select_for_teacher" on public.student_reward_stats;
create policy "student_reward_stats_select_for_teacher"
on public.student_reward_stats
for select
to authenticated
using (
  get_my_role() = 'teacher'
  and exists (
    select 1
    from public.students s
    where s.id = student_reward_stats.student_id
      and (
        s.created_by = auth.uid()
        or s.class_id in (select id from public.classes where teacher_id = auth.uid())
      )
  )
);

-- 5) 교사용: 담당 학생의 students 행 읽기는 기존 staff 정책으로 이미 가능.
--    (student-by-teacher EF 가 service_role 으로 스코핑하므로 이 파일에서 추가 불필요)

-- 참고: 교사 칭찬 점수는 teacher_messages(class_key=praise:{studentId}) + 학생 자가기록으로
--       동작하므로 reward_logs 에 대한 교사 INSERT 정책은 불필요(이 파일에서 추가하지 않음).
