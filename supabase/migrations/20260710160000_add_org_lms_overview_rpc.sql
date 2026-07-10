CREATE OR REPLACE FUNCTION public.get_org_lms_overview()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
  v_org_id uuid;
  v_org record;
  v_result jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  SELECT role, organization_id
  INTO v_role, v_org_id
  FROM public.profiles
  WHERE id = v_uid;

  IF v_role <> 'org_admin' OR v_org_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Unauthorized or no organization');
  END IF;

  SELECT *
  INTO v_org
  FROM public.organizations
  WHERE id = v_org_id;

  IF v_org.id IS NULL THEN
    RETURN jsonb_build_object('error', 'Organization not found');
  END IF;

  WITH teachers AS (
    SELECT
      p.id,
      p.email,
      p.name,
      p.center_id,
      COALESCE(p.status, 'active') AS status,
      p.created_at,
      la.quantity,
      la.used_quantity,
      la.license_start_date,
      la.license_end_date,
      COALESCE((
        SELECT count(DISTINCT s.id)::int
        FROM public.students s
        WHERE s.center_id = p.center_id
      ), 0) AS student_count
    FROM public.profiles p
    LEFT JOIN public.license_allocations la
      ON la.organization_id = v_org_id
     AND la.to_user_id = p.id
     AND COALESCE(la.status, 'active') = 'active'
    WHERE p.organization_id = v_org_id
      AND p.role = 'teacher'
  ),
  student_totals AS (
    SELECT count(DISTINCT s.id)::int AS student_count
    FROM public.students s
    WHERE s.center_id IN (
      SELECT center_id
      FROM teachers
      WHERE center_id IS NOT NULL
    )
  ),
  teacher_json AS (
    SELECT
      COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', id,
          'email', email,
          'name', name,
          'center_id', center_id,
          'status', status,
          'created_at', created_at,
          'allocated_licenses', COALESCE(quantity, 0),
          'stored_used_licenses', COALESCE(used_quantity, 0),
          'used_licenses', student_count,
          'remaining_licenses', GREATEST(COALESCE(quantity, 0) - student_count, 0),
          'student_count', student_count,
          'assigned_class', center_id,
          'license_start_date', license_start_date,
          'license_end_date', license_end_date
        )
        ORDER BY name NULLS LAST, email NULLS LAST
      ), '[]'::jsonb) AS teachers,
      count(*)::int AS teacher_count,
      COALESCE(sum(COALESCE(quantity, 0)), 0)::int AS allocated_licenses
    FROM teachers
  )
  SELECT jsonb_build_object(
    'organization', jsonb_build_object(
      'id', v_org.id,
      'name', v_org.name,
      'total_licenses', COALESCE(v_org.total_licenses, 0),
      'stored_used_licenses', COALESCE(v_org.used_licenses, 0),
      'license_start_date', v_org.license_start_date,
      'license_end_date', v_org.license_end_date
    ),
    'teachers', teacher_json.teachers,
    'totals', jsonb_build_object(
      'teacher_count', teacher_json.teacher_count,
      'student_count', COALESCE(student_totals.student_count, 0),
      'total_licenses', COALESCE(v_org.total_licenses, 0),
      'allocated_licenses', teacher_json.allocated_licenses,
      'used_licenses', COALESCE(student_totals.student_count, 0),
      'remaining_licenses', GREATEST(COALESCE(v_org.total_licenses, 0) - teacher_json.allocated_licenses, 0)
    )
  )
  INTO v_result
  FROM teacher_json
  CROSS JOIN student_totals;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_org_lms_overview() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_org_lms_overview() TO authenticated;
