-- 1. 기관관리자 대시보드 통계 집계 RPC
CREATE OR REPLACE FUNCTION get_org_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_role TEXT;
  v_org_id UUID;
  v_teacher_count INT := 0;
  v_student_count INT := 0;
  v_center_ids UUID[];
BEGIN
  -- 1) 사용자 인증 확인
  IF v_uid IS NULL THEN
    RETURN json_build_object('teacherCount', 0, 'studentCount', 0, 'error', 'Not authenticated');
  END IF;

  -- 2) 현재 사용자의 역할 및 소속 기관 ID 확인
  SELECT role, organization_id INTO v_role, v_org_id
  FROM profiles
  WHERE id = v_uid;

  -- 3) org_admin 권한 검증
  IF v_role != 'org_admin' OR v_org_id IS NULL THEN
    RETURN json_build_object('teacherCount', 0, 'studentCount', 0, 'error', 'Unauthorized or no organization');
  END IF;

  -- 4) 소속 선생님 수 카운트
  SELECT count(*) INTO v_teacher_count
  FROM profiles
  WHERE organization_id = v_org_id AND role = 'teacher';

  -- 5) 소속 선생님들의 center_id 목록 확보
  SELECT array_agg(center_id) INTO v_center_ids
  FROM profiles
  WHERE organization_id = v_org_id AND role = 'teacher' AND center_id IS NOT NULL;

  -- 6) 학생 수 카운트 (선생님들의 center_id 기준)
  IF v_center_ids IS NOT NULL AND array_length(v_center_ids, 1) > 0 THEN
    SELECT count(DISTINCT id) INTO v_student_count
    FROM students
    WHERE center_id = ANY(v_center_ids);
  END IF;

  RETURN json_build_object(
    'teacherCount', COALESCE(v_teacher_count, 0),
    'studentCount', COALESCE(v_student_count, 0)
  );
END;
$$;


-- 2. 중간관리자 대시보드 통계 집계 RPC
CREATE OR REPLACE FUNCTION get_middle_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_role TEXT;
  v_org_ids UUID[];
  v_center_ids UUID[];
  v_teacher_count INT := 0;
  v_student_count INT := 0;
  v_class_count INT := 0;
BEGIN
  -- 1) 사용자 인증 확인
  IF v_uid IS NULL THEN
    RETURN json_build_object('teacherCount', 0, 'studentCount', 0, 'classCount', 0, 'error', 'Not authenticated');
  END IF;

  -- 2) 현재 사용자의 역할 확인
  SELECT role INTO v_role
  FROM profiles
  WHERE id = v_uid;

  -- 3) middle_admin 권한 검증
  IF v_role != 'middle_admin' THEN
    RETURN json_build_object('teacherCount', 0, 'studentCount', 0, 'classCount', 0, 'error', 'Unauthorized');
  END IF;

  -- 4) 중간관리자 담당 기관 ID 목록 확보
  SELECT array_agg(id) INTO v_org_ids
  FROM organizations
  WHERE middle_admin_id = v_uid;

  IF v_org_ids IS NULL OR array_length(v_org_ids, 1) IS NULL THEN
    RETURN json_build_object('teacherCount', 0, 'studentCount', 0, 'classCount', 0);
  END IF;

  -- 5) 담당 기관들의 선생님 수 및 center_id 목록 확보
  SELECT count(*), array_agg(center_id)
  INTO v_teacher_count, v_center_ids
  FROM profiles
  WHERE organization_id = ANY(v_org_ids) AND role = 'teacher';

  -- 6) 전체 학생 수 및 고유 학급(center_id) 수 카운트
  IF v_center_ids IS NOT NULL AND array_length(v_center_ids, 1) > 0 THEN
    SELECT count(DISTINCT id), count(DISTINCT center_id)
    INTO v_student_count, v_class_count
    FROM students
    WHERE center_id = ANY(v_center_ids);
  END IF;

  RETURN json_build_object(
    'teacherCount', COALESCE(v_teacher_count, 0),
    'studentCount', COALESCE(v_student_count, 0),
    'classCount', COALESCE(v_class_count, 0)
  );
END;
$$;
