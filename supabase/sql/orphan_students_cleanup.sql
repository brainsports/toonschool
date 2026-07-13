-- ============================================================================
-- 고아 학생 데이터 점검 및 정리 (섹션 8)
-- ----------------------------------------------------------------------------
-- 목적: 수퍼관리자 회원삭제 후 auth.users/profiles 는 삭제됐지만 students 행(또는
-- 배정/부가 데이터)만 남아 선생님 학생관리에 계속 노출되는 고아 데이터를 정리.
--
-- ⚠️ 이 스크립트의 DELETE 구문은 데이터를 변경합니다. 반드시 대시보드 SQL Editor 에서
-- service_role 로, 아래 순서대로 실행하세요. 먼저 1)~3) 검수 쿼리로 대상을 확인하고
-- 4) 트랜잭션 정리를 실행한 뒤 영향 행수를 확인 후 COMMIT/ROLLBACK 하세요.
-- 이름만 보고 삭제하지 말고 UUID 기반으로 확인합니다.
-- ============================================================================

-- 1) 완전 고아: auth.users 도 profiles 도 없는 students 행
SELECT s.id, s.name, s.login_id, s.organization_id, s.center_id, s.created_by, s.created_at
FROM public.students s
LEFT JOIN auth.users u ON u.id = s.id
LEFT JOIN public.profiles p ON p.id = s.id
WHERE u.id IS NULL AND p.id IS NULL
ORDER BY s.created_at DESC;

-- 2) profiles 만 있고 auth.users 는 없는 학생(반쪽 고아)
SELECT p.id, p.name, p.email, p.organization_id, p.center_id, p.status
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.role = 'student' AND u.id IS NULL;

-- 3) (참고) 현재 노출 의심 학생을 이름/아이디로 사전 확인 — 삭제 기준은 UUID 로.
--    예: 화면에 보인 학생들(Test Student, 선덕이, Codex *)을 login_id 로 조회.
SELECT id, name, login_id, organization_id, center_id, created_by, status
FROM public.students
WHERE login_id ILIKE '%codex%' OR name ILIKE '%test student%' OR login_id = 'seondeok'
ORDER BY created_at DESC;

-- ---------------------------------------------------------------------------
-- 4) 트랜잭션 정리: 1)의 완전 고아 students 행과 그 잔여 부가 데이터를 안전 삭제.
--    auth/profile 이 이미 없으므로 CASCADE 경로 없이 students/부가행만 단순 삭제.
--    실행 전 반드시 1) 결과로 대상 UUID 를 눈으로 확인할 것.
-- ---------------------------------------------------------------------------
BEGIN;

-- 4-1) 고아 students 의 UUID 집합을 임시 테이블로 고정(한 트랜잭션 내 일관성)
CREATE TEMP TABLE _orphan_students AS
SELECT s.id
FROM public.students s
LEFT JOIN auth.users u ON u.id = s.id
LEFT JOIN public.profiles p ON p.id = s.id
WHERE u.id IS NULL AND p.id IS NULL;

-- 4-2) 잔여 부가 데이터 정리(profile/auth 가 없어 CASCADE 가 작동하지 않은 행)
DELETE FROM public.student_notification_hidden WHERE student_id IN (SELECT id FROM _orphan_students);
DELETE FROM public.toon_projects                 WHERE user_id    IN (SELECT id FROM _orphan_students);
-- 학생 부가 테이블들(외래키가 profiles 을 가리키지만 profile 이 없으므로 잔여 가능)
DELETE FROM public.student_gardens              WHERE student_id IN (SELECT id FROM _orphan_students);
DELETE FROM public.student_items                WHERE student_id IN (SELECT id FROM _orphan_students);
DELETE FROM public.student_attendance_logs      WHERE student_id IN (SELECT id FROM _orphan_students);
DELETE FROM public.student_growth_evaluations   WHERE student_id IN (SELECT id FROM _orphan_students);

-- 4-3) 고아 students 행 삭제
DELETE FROM public.students WHERE id IN (SELECT id FROM _orphan_students);

-- 4-4) 정리 전후 카운트 비교(아래 출력을 보고 이상 없으면 COMMIT)
SELECT 'orphan_count' AS metric, COUNT(*) AS cnt FROM _orphan_students;

-- 결과 확인 후 아래 중 하나만 실행:
-- COMMIT;
-- ROLLBACK;

-- ---------------------------------------------------------------------------
-- 5) (선택) 2)의 반쪽 고아(profile 만 있고 auth 없는 학생) 정리 — 별도 승인 후.
--    profile 을 지우면 role=student 프로필이 사라져 목록에서도 즉시 제거됨.
-- ---------------------------------------------------------------------------
-- BEGIN;
-- DELETE FROM public.student_notification_hidden
--  WHERE student_id IN (
--    SELECT p.id FROM public.profiles p
--    LEFT JOIN auth.users u ON u.id = p.id
--    WHERE p.role='student' AND u.id IS NULL
--  );
-- DELETE FROM public.profiles
--  WHERE id IN (
--    SELECT p.id FROM public.profiles p
--    LEFT JOIN auth.users u ON u.id = p.id
--    WHERE p.role='student' AND u.id IS NULL
--  );
-- COMMIT;
