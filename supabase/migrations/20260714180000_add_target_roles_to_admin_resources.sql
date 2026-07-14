-- ─────────────────────────────────────────────────────────────────────────────
-- 수퍼관리자 자료실(admin_resources) 복수 공개 대상 지원
-- ─────────────────────────────────────────────────────────────────────────────
-- 목적: '공개 대상'을 단일 값(target_role)에서 복수 역할(target_roles, text[])로 확장.
--       예) 학생 제외, 선생님 제외, 관리자 전용, 직접 선택(역할 조합).
--
-- 원칙:
--   - target_roles(text[]) 를 source of truth 로 추가.
--   - 기존 target_role(단일, CHECK 제약 'all'|'middle_admin'|'org_admin'|'teacher'|'student')은
--     레고시 하위 호환을 위해 그대로 유지(삭제/변경 없음). 앱은 target_roles 우선 조회.
--   - super_admin 은 CHECK 제약에 없으므로 target_role 이 아닌 target_roles 에만 저장.
--
-- ★ 적용 전 확인:
--   1) 이 마이그레이션은 supabase db push 등으로 임의 적용하지 않는다(운영 DB 변경 금지).
--      충분한 검토/테스트 후 담당자가 수동 적용.
--   2) idempotent — target_roles 가 이미 존재(out-of-band 추가)해도 안전하게 통과.
--   3) 기존 자료는 아래 백필로 target_roles 가 채워지며, 앱 미갱신 환경에서도
--      resourceService의 방어 로직(target_roles → target_role 폴백)으로 기존 서비스가 깨지지 않음.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) target_roles 컬럼 추가(이미 있으면 스킵)
ALTER TABLE public.admin_resources
  ADD COLUMN IF NOT EXISTS target_roles TEXT[];

-- 2) 기존 자료 백필(하위 호환): target_roles 가 비어 있으면 레거시 target_role에서 유도.
--    'all' -> 전체 5역할 / 그 외 단일 -> 해당 역할 1개 배열.
UPDATE public.admin_resources
  SET target_roles = ARRAY['student','teacher','org_admin','middle_admin','super_admin']
  WHERE target_roles IS NULL
    AND target_role = 'all';

UPDATE public.admin_resources
  SET target_roles = ARRAY[target_role]
  WHERE target_roles IS NULL
    AND target_role IS NOT NULL
    AND target_role <> 'all';

COMMENT ON COLUMN public.admin_resources.target_roles IS
  '복수 공개 대상 역할 배열(student/teacher/org_admin/middle_admin/super_admin). source of truth. target_role은 레거시 호환 파생값.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 롤백 방법:
--   ALTER TABLE public.admin_resources DROP COLUMN IF EXISTS target_roles;
-- (target_role은 유지되므로 롤백 후에도 레거시 단일 선택 동작 유지됨.)
-- ─────────────────────────────────────────────────────────────────────────────
