-- Drop duplicated create_org_notification functions
DROP FUNCTION IF EXISTS public.create_org_notification(uuid, text, text, text, text);
DROP FUNCTION IF EXISTS public.create_org_notification(uuid, character varying, character varying, text, character varying, uuid, uuid, character varying);

-- Recreate a single, unified create_org_notification function matching frontend parameters
CREATE OR REPLACE FUNCTION public.create_org_notification(
    p_organization_id uuid,
    p_target_type text,
    p_title text,
    p_message text,
    p_priority text DEFAULT 'normal'::text,
    p_category text DEFAULT 'notice'::text,
    p_target_user_id uuid DEFAULT NULL::uuid,
    p_target_teacher_id uuid DEFAULT NULL::uuid
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_role text;
  v_notification_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '로그인이 필요합니다.';
  END IF;

  SELECT role
  INTO v_role
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_role NOT IN ('super_admin', 'middle_admin') THEN
    RAISE EXCEPTION '알림을 발송할 권한이 없습니다.';
  END IF;

  IF v_role = 'middle_admin' THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.organizations
      WHERE id = p_organization_id
        AND middle_admin_id = v_user_id
    ) THEN
      RAISE EXCEPTION '담당 기관에만 알림을 발송할 수 있습니다.';
    END IF;
  END IF;

  IF p_target_type NOT IN ('all', 'org_admin', 'teacher', 'student', 'all_org_admins', 'all_organizations', 'specific_org_admin', 'all_teachers', 'specific_teacher', 'center_teachers') THEN
    RAISE EXCEPTION '잘못된 발송 대상입니다.';
  END IF;

  INSERT INTO public.org_notifications (
    organization_id,
    target_type,
    title,
    message,
    priority,
    category,
    target_user_id,
    target_teacher_id,
    is_public,
    sender_id,
    sender_role,
    notice_date
  )
  VALUES (
    p_organization_id,
    p_target_type,
    p_title,
    p_message,
    COALESCE(p_priority, 'normal'),
    COALESCE(p_category, 'notice'),
    p_target_user_id,
    p_target_teacher_id,
    true,
    v_user_id,
    v_role,
    TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')
  )
  RETURNING id INTO v_notification_id;

  -- Generate org_admin_notification_status
  IF p_target_type IN ('all', 'org_admin', 'all_org_admins', 'all_organizations', 'specific_org_admin') THEN
      INSERT INTO public.org_admin_notification_status (org_admin_id, notification_id)
      SELECT id, v_notification_id FROM public.profiles
      WHERE role = 'org_admin'
        AND (
          p_target_type IN ('all_org_admins', 'all_organizations') OR
          (p_target_type = 'specific_org_admin' AND id = p_target_user_id) OR
          (p_target_type IN ('all', 'org_admin') AND organization_id = p_organization_id)
        )
      ON CONFLICT DO NOTHING;
  END IF;

  -- Generate teacher_notification_status
  IF p_target_type IN ('all', 'teacher', 'all_teachers', 'specific_teacher', 'center_teachers') THEN
      INSERT INTO public.teacher_notification_status (teacher_id, notification_id)
      SELECT id, v_notification_id FROM public.profiles
      WHERE role = 'teacher'
        AND (
          p_target_type IN ('all_teachers') OR
          (p_target_type = 'specific_teacher' AND id = COALESCE(p_target_teacher_id, p_target_user_id)) OR
          (p_target_type IN ('all', 'teacher', 'center_teachers') AND organization_id = p_organization_id)
        )
      ON CONFLICT DO NOTHING;
  END IF;

  RETURN v_notification_id;
END;
$function$;
