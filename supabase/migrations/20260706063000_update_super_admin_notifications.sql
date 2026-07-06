-- 1. Drop existing target_type check constraint and recreate
ALTER TABLE public.org_notifications DROP CONSTRAINT IF EXISTS org_notifications_target_type_check;
ALTER TABLE public.org_notifications ADD CONSTRAINT org_notifications_target_type_check 
  CHECK (target_type IN ('all', 'middle_admin', 'org_admin', 'teacher', 'student'));

-- 2. Add RLS policy for middle_admin and teacher to read super_admin notifications
DROP POLICY IF EXISTS "Middle admin and teacher can read super_admin notifications" ON public.org_notifications;
CREATE POLICY "Middle admin and teacher can read super_admin notifications" ON public.org_notifications
FOR SELECT
USING (
  sender_role = 'super_admin' AND (
    (target_type = 'all') OR
    (target_type = 'middle_admin' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'middle_admin')) OR
    (target_type = 'teacher' AND organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher'))
  )
);

-- 3. Replace create_org_notification function
DROP FUNCTION IF EXISTS public.create_org_notification(uuid, text, text, text, text, uuid, uuid);
DROP FUNCTION IF EXISTS public.create_org_notification(uuid, text, text, text, text, text, uuid, uuid);
DROP FUNCTION IF EXISTS public.create_org_notification(uuid, character varying, character varying, text, character varying, uuid, uuid, character varying);

CREATE OR REPLACE FUNCTION public.create_org_notification(
    p_organization_id uuid,
    p_target_type text,
    p_title text,
    p_message text,
    p_priority text DEFAULT 'normal'::text,
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
  v_org_record RECORD;
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

  IF p_target_type NOT IN ('all', 'middle_admin', 'org_admin', 'teacher', 'student') THEN
    RAISE EXCEPTION '잘못된 발송 대상입니다.';
  END IF;

  -- Handle 'all' target type: broadcast to all roles individually
  IF p_target_type = 'all' THEN
    -- middle_admin notification (organization_id is null)
    INSERT INTO public.org_notifications (target_type, title, message, priority, sender_id, sender_role)
    VALUES ('middle_admin', p_title, p_message, COALESCE(p_priority, 'normal'), v_user_id, v_role);

    -- Loop through all organizations for other roles
    FOR v_org_record IN SELECT id FROM public.organizations LOOP
        -- org_admin notification
        INSERT INTO public.org_notifications (organization_id, target_type, title, message, priority, sender_id, sender_role)
        VALUES (v_org_record.id, 'org_admin', p_title, p_message, COALESCE(p_priority, 'normal'), v_user_id, v_role);

        -- student notification
        INSERT INTO public.org_notifications (organization_id, target_type, title, message, priority, sender_id, sender_role)
        VALUES (v_org_record.id, 'student', p_title, p_message, COALESCE(p_priority, 'normal'), v_user_id, v_role);

        -- teacher notification
        INSERT INTO public.org_notifications (organization_id, target_type, title, message, priority, sender_id, sender_role)
        VALUES (v_org_record.id, 'teacher', p_title, p_message, COALESCE(p_priority, 'normal'), v_user_id, v_role)
        RETURNING id INTO v_notification_id;

        -- Create teacher_notification_status for each teacher in the organization
        INSERT INTO public.teacher_notification_status (teacher_id, notification_id)
        SELECT id, v_notification_id FROM public.profiles
        WHERE role = 'teacher' AND organization_id = v_org_record.id
        ON CONFLICT DO NOTHING;
    END LOOP;

    RETURN NULL;
  END IF;

  -- Default creation for specific target type
  INSERT INTO public.org_notifications (
    organization_id,
    target_type,
    title,
    message,
    priority,
    target_user_id,
    target_teacher_id,
    sender_id,
    sender_role
  )
  VALUES (
    p_organization_id,
    p_target_type,
    p_title,
    p_message,
    COALESCE(p_priority, 'normal'),
    p_target_user_id,
    p_target_teacher_id,
    v_user_id,
    v_role
  )
  RETURNING id INTO v_notification_id;

  -- Create teacher_notification_status for teacher target
  IF p_target_type = 'teacher' THEN
      INSERT INTO public.teacher_notification_status (teacher_id, notification_id)
      SELECT id, v_notification_id FROM public.profiles
      WHERE role = 'teacher' AND organization_id = p_organization_id
        AND (p_target_teacher_id IS NULL OR id = p_target_teacher_id)
      ON CONFLICT DO NOTHING;
  END IF;

  RETURN v_notification_id;
END;
$function$;
