-- ============================================================================
-- 꿈의 궁전 성장형 보상 시스템 — additive 마이그레이션(작성 전용, 미적용)
-- ============================================================================
-- 목적: 크로스 사용자 기능(우리 반 랭킹 / 교사 학생 점수 조회)을 잠금해제.
--
-- ★ 이 파일은 supabase db push / 마이그레이션 적용 없이 작성만 한다(운영 DB 변경 금지).
--    클라이언트는 이 마이그레이션이 적용되지 않은 상태에서도 안전하게 동작한다:
--      - 학생 본인 점수/레벨/보물지도/정원/레벨업: 본인 reward_logs 클라이언트 계산으로 100% 동작.
--      - 교사 칭찬: teacher_messages 채널 + 학생 자가기록으로 동작(이 파일과 무관).
--      - 랭킹 / 교사 점수 조회: 적용 전엔 fallback, 적용 후 표시.
--
-- 적용 시점에 담당자가 충분한 검토/테스트 후 수동 적용한다.
-- 모든 구문은 ADDITIVE 이며 기존 데이터/정책을 삭제하지 않는다.
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

-- 3) 랭킹용: 같은 학급 동급생의 students 행(이름/학급)을 서로 읽을 수 있도록 허용.
--    (기존 staff 정책과 병합되며, 학생은 동급생 범위로 제한된다)
drop policy if exists "students_select_same_class" on public.students;
create policy "students_select_same_class"
on public.students
for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.students me
    where me.id = auth.uid()
      and me.class_id is not null
      and me.class_id = students.class_id
  )
);

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
