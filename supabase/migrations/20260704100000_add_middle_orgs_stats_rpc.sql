-- 3. 중간관리자 대시보드 - 테스트기관별 통계 집계 RPC
CREATE OR REPLACE FUNCTION get_middle_orgs_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_role TEXT;
  v_result json;
BEGIN
  -- 1) 사용자 인증 확인
  IF v_uid IS NULL THEN
    RETURN '[]'::json;
  END IF;

  -- 2) 현재 사용자의 역할 확인
  SELECT role INTO v_role
  FROM profiles
  WHERE id = v_uid;

  -- 3) middle_admin 권한 검증
  IF v_role != 'middle_admin' THEN
    RETURN '[]'::json;
  END IF;

  -- 4) 기관별 통계 집계
  WITH org_list AS (
    SELECT id FROM organizations WHERE middle_admin_id = v_uid
  ),
  teacher_stats AS (
    SELECT 
      organization_id, 
      count(id) as teacher_count,
      array_agg(center_id) as center_ids
    FROM profiles
    WHERE role = 'teacher' AND organization_id IN (SELECT id FROM org_list)
    GROUP BY organization_id
  ),
  student_stats AS (
    SELECT 
      t.organization_id,
      count(DISTINCT s.id) as student_count,
      count(DISTINCT s.center_id) as class_count
    FROM teacher_stats t
    JOIN students s ON s.center_id = ANY(t.center_ids)
    GROUP BY t.organization_id
  )
  SELECT json_agg(
    json_build_object(
      'organization_id', o.id,
      'teacher_count', COALESCE(t.teacher_count, 0),
      'student_count', COALESCE(s.student_count, 0),
      'class_count', COALESCE(s.class_count, 0)
    )
  )
  INTO v_result
  FROM org_list o
  LEFT JOIN teacher_stats t ON o.id = t.organization_id
  LEFT JOIN student_stats s ON o.id = s.organization_id;

  RETURN COALESCE(v_result, '[]'::json);
END;
$$;
