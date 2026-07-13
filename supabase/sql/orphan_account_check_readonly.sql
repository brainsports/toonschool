-- ============================================================================
-- 읽기 전용 고아 계정 점검 SQL (섹션 9)
-- ----------------------------------------------------------------------------
-- 이 스크립트는 SELECT 만 수행하며 데이터를 변경하지 않습니다.
-- Supabase 대시보드의 SQL Editor 에서 service_role 권한으로 실행하세요.
-- 결과를 보고 정리가 필요하면 별도 승인 후 개별 DELETE/보정 SQL 을 실행합니다.
-- ============================================================================

-- 1) auth.users 에는 있지만 profiles 에 없는 계정
SELECT 'auth_without_profile' AS kind,
       u.id, u.email, u.created_at, u.last_sign_in_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- 2) profiles 에는 있지만 auth.users 에 없는 계정
SELECT 'profile_without_auth' AS kind,
       p.id, p.email, p.role, p.status, p.organization_id, p.created_at
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE u.id IS NULL
ORDER BY p.created_at DESC;

-- 3) profiles.role = 'student' 인데 students 테이블에 행이 없는 계정
SELECT 'profile_student_without_students_row' AS kind,
       p.id, p.email, p.name, p.organization_id, p.center_id
FROM public.profiles p
LEFT JOIN public.students s ON s.id = p.id
WHERE p.role = 'student' AND s.id IS NULL;

-- 4) students 테이블에 행이 있지만 profiles 에 없는 계정
SELECT 'students_without_profile' AS kind,
       s.id, s.name, s.login_id, s.organization_id, s.center_id, s.status
FROM public.students s
LEFT JOIN public.profiles p ON p.id = s.id
WHERE p.id IS NULL;

-- 5) profiles.role = 'middle_admin' 인데 middle_admins 행이 없는 계정
SELECT 'middle_admin_without_row' AS kind,
       p.id, p.email, p.name, p.status
FROM public.profiles p
LEFT JOIN public.middle_admins m ON m.profile_id = p.id
WHERE p.role = 'middle_admin' AND m.id IS NULL;

-- 6) 기관/센터 연결이 비어있는 관리자 계정
SELECT 'admin_without_org' AS kind,
       p.id, p.email, p.role, p.status, p.organization_id, p.center_id
FROM public.profiles p
WHERE p.role IN ('org_admin', 'teacher')
  AND p.organization_id IS NULL
  AND p.status <> 'deleted';

-- 7) 유효하지 않은 role / status 값
SELECT 'invalid_role_or_status' AS kind,
       p.id, p.email, p.role, p.status
FROM public.profiles p
WHERE p.role NOT IN ('free_user', 'super_admin', 'superadmin', 'middle_admin', 'org_admin', 'teacher', 'student')
   OR (p.status IS NOT NULL AND p.status NOT IN ('active', 'pending', 'suspended', 'deleted', 'inactive'));

-- 8) 요약: 역할/상태별 분포
SELECT role, status, COUNT(*) AS cnt
FROM public.profiles
GROUP BY role, status
ORDER BY role, status;
