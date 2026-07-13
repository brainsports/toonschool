-- ============================================================================
-- [보고용 마이그레이션 — 적용 전 승인 필요] supabase db push / migration up 금지 상태로
-- 사용자가 대시보드에서 직접 검수 후 적용 여부 결정.
-- ----------------------------------------------------------------------------
-- 배경: 2026-07-13 수정으로 학생 목록이 students.created_by(생성한 선생님) 기준으로
-- 격리된다. 과거에 만들어진 students 행은 created_by 가 NULL 이라 기존 선생님에게
-- 보이지 않을 수 있다. 이 마이그레이션은 created_by 를 최대한 복원한다.
--
-- 복원 기준(결정적이고 안전한 경우만):
--   한 center_id 에 선생님(profiles.role='teacher')이 정확히 1명 존재하면,
--   그 center 의 students.created_by 를 해당 선생님으로 채운다.
--   (선생님이 0명 또는 2명 이상인 center 는 자동 판단 불가 → 수동 검수 대상)
--
-- 영향: students.created_by 가 NULL 인 행 중 조건을 만족하는 행만 UPDATE.
-- 롤백: UPDATE students SET created_by = NULL WHERE <조건>; 으로 되돌릴 수 있음.
-- ============================================================================

-- 1) 적용 전 사전 검수: 어느 정도 채워지는지 확인(UPDATE 아님).
SELECT
  COUNT(*) FILTER (WHERE p.id IS NOT NULL) AS can_backfill,
  COUNT(*) FILTER (WHERE p.id IS NULL)     AS needs_manual_review
FROM public.students s
LEFT JOIN LATERAL (
  SELECT t.id
  FROM public.profiles t
  WHERE t.role = 'teacher'
    AND t.center_id IS NOT NULL
    AND t.center_id = s.center_id
  GROUP BY t.center_id
  HAVING COUNT(*) = 1
) p ON true
WHERE s.created_by IS NULL;

-- 2) 실제 백필(승인 후 실행).
UPDATE public.students s
SET created_by = t.id
FROM public.profiles t
WHERE s.created_by IS NULL
  AND s.center_id IS NOT NULL
  AND t.role = 'teacher'
  AND t.center_id = s.center_id
  AND (
    SELECT COUNT(*) FROM public.profiles t2
    WHERE t2.role = 'teacher' AND t2.center_id = s.center_id
  ) = 1;

-- 3) 결과 확인: 여전히 created_by 가 NULL 인 학생(수동 검수 대상)
SELECT center_id, COUNT(*) AS null_created_by_count
FROM public.students
WHERE created_by IS NULL
GROUP BY center_id
ORDER BY null_created_by_count DESC;
