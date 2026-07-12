-- =====================================================================
-- 슈퍼관리자 회원 관리 기능용 SECURITY DEFINER RPC 함수들
-- - get_super_admin_members   : 회원 목록 조회 (검색/필터/정렬/페이지네이션 + 요약 카운트)
-- - get_super_admin_member_detail : 회원 상세 조회
-- - update_member_role        : 역할 변경 (super_admin 검증, 자기/마지막 슈퍼 보호, 감사로그)
-- - update_member_status      : 상태 변경 (super_admin 검증, 자기 정지 차단, 감사로그)
--
-- 보안:
-- - 모두 SECURITY DEFINER + SET search_path = public
-- - 호출자 JWT(auth.uid()) 확인 후 profiles.role 이 super_admin 인지 검증
-- - profiles 의 role/status 는 protect_profile_system_fields 트리거가
--   anon/authenticated 의 직접 변경을 막으므로, 반드시 이 RPC(소유자 권한)로만 변경.
-- - anon 실행 금지 (PUBLIC 권한 회수, authenticated 에만 EXECUTE 부여)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) 회원 목록 조회
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_super_admin_members(
  p_search text DEFAULT '',
  p_role text DEFAULT '',
  p_status text DEFAULT '',
  p_sort text DEFAULT 'recent',
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 20
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller_role text;
  v_offset integer;
  v_counts jsonb;
BEGIN
  SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
  IF v_caller_role IS NULL OR v_caller_role NOT IN ('super_admin', 'superadmin') THEN
    RETURN jsonb_build_object('success', false, 'error', '접근 권한이 없습니다.', 'code', 403);
  END IF;

  p_search := COALESCE(p_search, '');
  p_role   := COALESCE(p_role, '');
  p_status := COALESCE(p_status, '');
  p_sort   := COALESCE(p_sort, 'recent');
  p_page   := GREATEST(COALESCE(p_page, 1), 1);
  p_page_size := LEAST(GREATEST(COALESCE(p_page_size, 20), 1), 100);
  v_offset := (p_page - 1) * p_page_size;

  -- 요약 카드용 카운트 (deleted 제외)
  SELECT jsonb_build_object(
    'all',          COUNT(*) FILTER (WHERE status <> 'deleted'),
    'free_user',    COUNT(*) FILTER (WHERE role = 'free_user'    AND status <> 'deleted'),
    'middle_admin', COUNT(*) FILTER (WHERE role = 'middle_admin' AND status <> 'deleted'),
    'org_admin',    COUNT(*) FILTER (WHERE role = 'org_admin'    AND status <> 'deleted'),
    'teacher',      COUNT(*) FILTER (WHERE role = 'teacher'      AND status <> 'deleted'),
    'student',      COUNT(*) FILTER (WHERE role = 'student'      AND status <> 'deleted'),
    'suspended',    COUNT(*) FILTER (WHERE status = 'suspended')
  ) INTO v_counts FROM public.profiles;

  RETURN jsonb_build_object(
    'success', true,
    'counts', v_counts,
    'page', p_page,
    'page_size', p_page_size,
    'total', (
      SELECT COUNT(*)
      FROM public.profiles p
      LEFT JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.status <> 'deleted'
        AND (p_role = '' OR p.role = p_role)
        AND (p_status = '' OR p.status = p_status)
        AND (
          p_search = ''
          OR p.name ILIKE '%' || p_search || '%'
          OR p.email ILIKE '%' || p_search || '%'
          OR p.id::text ILIKE '%' || p_search || '%'
          OR o.name ILIKE '%' || p_search || '%'
        )
    ),
    'members', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', p.id,
        'email', COALESCE(u.email, p.email),
        'name', p.name,
        'role', p.role,
        'status', p.status,
        'organization_id', p.organization_id,
        'organization_name', o.name,
        'plan_type', p.plan_type,
        'monthly_quota', p.monthly_quota,
        'monthly_used', p.monthly_used,
        'created_at', p.created_at,
        'last_sign_in_at', u.last_sign_in_at,
        'email_confirmed_at', u.email_confirmed_at
      ) ORDER BY
        CASE WHEN p_sort = 'oldest'       THEN p.created_at END ASC,
        CASE WHEN p_sort = 'name'         THEN COALESCE(p.name, p.email) END ASC,
        CASE WHEN p_sort = 'recent_login' THEN u.last_sign_in_at END DESC NULLS LAST,
        CASE WHEN p_sort NOT IN ('oldest', 'name', 'recent_login') THEN p.created_at END DESC
      )
      FROM public.profiles p
      LEFT JOIN auth.users u ON u.id = p.id
      LEFT JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.status <> 'deleted'
        AND (p_role = '' OR p.role = p_role)
        AND (p_status = '' OR p.status = p_status)
        AND (
          p_search = ''
          OR p.name ILIKE '%' || p_search || '%'
          OR p.email ILIKE '%' || p_search || '%'
          OR p.id::text ILIKE '%' || p_search || '%'
          OR o.name ILIKE '%' || p_search || '%'
        )
      LIMIT p_page_size OFFSET v_offset
    ), '[]'::jsonb)
  );
END;
$$;

-- ---------------------------------------------------------------------
-- 2) 회원 상세 조회
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_super_admin_member_detail(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller_role text;
  v_detail jsonb;
BEGIN
  SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
  IF v_caller_role IS NULL OR v_caller_role NOT IN ('super_admin', 'superadmin') THEN
    RETURN jsonb_build_object('success', false, 'error', '접근 권한이 없습니다.', 'code', 403);
  END IF;

  SELECT jsonb_build_object(
    'id', p.id,
    'email', COALESCE(u.email, p.email),
    'name', p.name,
    'role', p.role,
    'status', p.status,
    'center_id', p.center_id,
    'organization_id', p.organization_id,
    'organization_name', o.name,
    'plan_type', p.plan_type,
    'monthly_quota', p.monthly_quota,
    'monthly_used', p.monthly_used,
    'created_at', p.created_at,
    'updated_at', p.updated_at,
    'last_sign_in_at', u.last_sign_in_at,
    'email_confirmed_at', u.email_confirmed_at
  )
  INTO v_detail
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  LEFT JOIN public.organizations o ON o.id = p.organization_id
  WHERE p.id = p_user_id;

  IF v_detail IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', '사용자를 찾을 수 없습니다.', 'code', 404);
  END IF;

  RETURN jsonb_build_object('success', true, 'member', v_detail);
END;
$$;

-- ---------------------------------------------------------------------
-- 3) 역할 변경
--  - super_admin 검증, 자기 자신 강등 차단, 마지막 슈퍼관리자 보호
--  - 허용 역할: free_user, middle_admin, org_admin, teacher, student
--    (super_admin 지정은 이 UI/RPC 에서 제외)
--  - org_admin/teacher 는 organization_id 필수
--  - student 전환은 학생 관리 생성 플로우가 필요하므로 차단(안내)
--  - middle_admin 승격 시 middle_admins 행 보장(소프트), 강등 시 소프트 삭제
--  - 감사로그(audit_logs) 기록
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_member_role(
  p_target_id uuid,
  p_new_role text,
  p_organization_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller_id uuid;
  v_caller_role text;
  v_old_role text;
  v_target_name text;
  v_super_count integer;
BEGIN
  v_caller_id := auth.uid();
  SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_caller_id;
  IF v_caller_role IS NULL OR v_caller_role NOT IN ('super_admin', 'superadmin') THEN
    RETURN jsonb_build_object('success', false, 'error', '접근 권한이 없습니다.', 'code', 403);
  END IF;

  -- 허용 역할 검증 (super_admin 은 제외)
  IF p_new_role NOT IN ('free_user', 'middle_admin', 'org_admin', 'teacher', 'student') THEN
    RETURN jsonb_build_object('success', false, 'error', '허용되지 않은 역할입니다.');
  END IF;

  -- 자기 자신 강등 차단
  IF v_caller_id = p_target_id THEN
    RETURN jsonb_build_object('success', false, 'error', '자기 자신의 역할은 변경할 수 없습니다.');
  END IF;

  -- 대상 조회
  SELECT role, name INTO v_old_role, v_target_name FROM public.profiles WHERE id = p_target_id;
  IF v_old_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', '대상 사용자를 찾을 수 없습니다.', 'code', 404);
  END IF;

  -- 마지막 슈퍼관리자 보호 (슈퍼관리자를 다른 역할로 강등할 때)
  IF v_old_role IN ('super_admin', 'superadmin') THEN
    SELECT COUNT(*) INTO v_super_count
    FROM public.profiles
    WHERE role IN ('super_admin', 'superadmin') AND status <> 'deleted';
    IF v_super_count <= 1 THEN
      RETURN jsonb_build_object('success', false, 'error', '마지막 슈퍼관리자는 강등할 수 없습니다.');
    END IF;
  END IF;

  -- org_admin / teacher 는 소속 기관 필수
  IF p_new_role IN ('org_admin', 'teacher') AND p_organization_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', '해당 역할은 소속 기관 선택이 필요합니다.');
  END IF;

  -- 학생 전환은 별도 생성 플로우 필요(login_id/class/grade 등)
  IF p_new_role = 'student' THEN
    RETURN jsonb_build_object('success', false, 'error', '학생 전환은 학생 관리에서 별도로 생성해야 합니다.');
  END IF;

  -- 역할 및 기관 연결 업데이트 (기관 관련 데이터는 즉시 삭제하지 않음)
  UPDATE public.profiles SET
    role = p_new_role,
    organization_id = CASE
      WHEN p_new_role IN ('org_admin', 'teacher') THEN p_organization_id
      WHEN p_new_role = 'middle_admin' THEN NULL
      ELSE organization_id
    END,
    updated_at = now()
  WHERE id = p_target_id;

  -- middle_admin 승격: middle_admins 행 보장 (기존 행이 있으면 활성화)
  IF p_new_role = 'middle_admin' THEN
    UPDATE public.middle_admins
      SET status = 'active', display_name = COALESCE(v_target_name, display_name)
      WHERE profile_id = p_target_id;
    IF NOT FOUND THEN
      INSERT INTO public.middle_admins (profile_id, display_name, status, license_total)
      VALUES (p_target_id, v_target_name, 'active', 0);
    END IF;
  END IF;

  -- middle_admin 에서 다른 역할로 강등: middle_admins 행 소프트 삭제(데이터 보존)
  IF v_old_role = 'middle_admin' AND p_new_role <> 'middle_admin' THEN
    UPDATE public.middle_admins SET status = 'deleted' WHERE profile_id = p_target_id;
  END IF;

  -- 감사 로그
  INSERT INTO public.audit_logs (actor_id, action, target_table, target_id, before_data, after_data)
  VALUES (
    v_caller_id,
    'UPDATE_MEMBER_ROLE',
    'profiles',
    p_target_id,
    jsonb_build_object('role', v_old_role),
    jsonb_build_object('role', p_new_role, 'organization_id', p_organization_id)
  );

  RETURN jsonb_build_object('success', true, 'old_role', v_old_role, 'new_role', p_new_role);
END;
$$;

-- ---------------------------------------------------------------------
-- 4) 상태 변경
--  - 허용 상태: active, pending, suspended
--  - 자기 자신 상태 변경 차단
--  - 감사로그 기록
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_member_status(
  p_target_id uuid,
  p_new_status text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller_id uuid;
  v_caller_role text;
  v_old_status text;
BEGIN
  v_caller_id := auth.uid();
  SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_caller_id;
  IF v_caller_role IS NULL OR v_caller_role NOT IN ('super_admin', 'superadmin') THEN
    RETURN jsonb_build_object('success', false, 'error', '접근 권한이 없습니다.', 'code', 403);
  END IF;

  IF p_new_status NOT IN ('active', 'pending', 'suspended') THEN
    RETURN jsonb_build_object('success', false, 'error', '허용되지 않은 상태입니다.');
  END IF;

  IF v_caller_id = p_target_id THEN
    RETURN jsonb_build_object('success', false, 'error', '자기 자신의 상태는 변경할 수 없습니다.');
  END IF;

  SELECT status INTO v_old_status FROM public.profiles WHERE id = p_target_id;
  IF v_old_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', '대상 사용자를 찾을 수 없습니다.', 'code', 404);
  END IF;

  UPDATE public.profiles SET status = p_new_status, updated_at = now() WHERE id = p_target_id;

  INSERT INTO public.audit_logs (actor_id, action, target_table, target_id, before_data, after_data)
  VALUES (
    v_caller_id,
    'UPDATE_MEMBER_STATUS',
    'profiles',
    p_target_id,
    jsonb_build_object('status', v_old_status),
    jsonb_build_object('status', p_new_status)
  );

  RETURN jsonb_build_object('success', true, 'old_status', v_old_status, 'new_status', p_new_status);
END;
$$;

-- 권한: PUBLIC 회수, authenticated 에만 실행 부여
REVOKE ALL ON FUNCTION public.get_super_admin_members(text, text, text, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_super_admin_members(text, text, text, text, integer, integer) TO authenticated;

REVOKE ALL ON FUNCTION public.get_super_admin_member_detail(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_super_admin_member_detail(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.update_member_role(uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_member_role(uuid, text, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.update_member_status(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_member_status(uuid, text) TO authenticated;
