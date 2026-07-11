-- 1. delete_org_notification (슈퍼관리자)
CREATE OR REPLACE FUNCTION public.delete_org_notification(p_notification_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_role TEXT;
BEGIN
  SELECT role INTO v_user_role FROM public.profiles WHERE id = auth.uid();
  IF v_user_role NOT IN ('super_admin', 'superadmin') THEN
    RAISE EXCEPTION '수퍼관리자만 알림을 삭제할 수 있습니다.';
  END IF;

  -- Delete dependent records
  DELETE FROM public.teacher_notification_status WHERE notification_id = p_notification_id;
  DELETE FROM public.org_admin_notification_status WHERE notification_id = p_notification_id;
  DELETE FROM public.org_notification_reads WHERE notification_id = p_notification_id;
  DELETE FROM public.student_notification_hidden WHERE notification_id = p_notification_id;
  DELETE FROM public.student_hidden_messages WHERE message_id = p_notification_id::text AND message_type = 'org_notification';
  
  -- Delete the notification itself
  DELETE FROM public.org_notifications WHERE id = p_notification_id;
END;
$function$;

-- 2. delete_middle_admin_notification (중간관리자)
CREATE OR REPLACE FUNCTION public.delete_middle_admin_notification(p_notification_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id UUID;
    v_role TEXT;
    v_user_org_id UUID;
    v_notification RECORD;
    v_has_permission BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', '로그인이 필요합니다.');
    END IF;

    SELECT role, organization_id INTO v_role, v_user_org_id 
    FROM public.profiles 
    WHERE id = v_user_id;

    IF v_role != 'middle_admin' THEN
        RETURN json_build_object('success', false, 'error', '중간관리자만 이 기능을 사용할 수 있습니다.');
    END IF;

    SELECT * INTO v_notification
    FROM public.org_notifications
    WHERE id = p_notification_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', '해당 알림을 찾을 수 없거나 이미 삭제되었습니다.');
    END IF;

    v_has_permission := false;
    
    -- 1. 두 organization_id가 동일한지 확인
    IF v_user_org_id IS NOT NULL AND v_user_org_id = v_notification.organization_id THEN
        v_has_permission := true;
    END IF;

    -- 2. 호출자가 해당 발송 건을 삭제할 권한이 있는지 (organizations 테이블의 middle_admin_id)
    IF NOT v_has_permission THEN
        IF EXISTS (
            SELECT 1 FROM public.organizations 
            WHERE id = v_notification.organization_id AND middle_admin_id = v_user_id
        ) THEN
            v_has_permission := true;
        END IF;
    END IF;

    -- 3. 본인이 발송한 알림인지 (sender_id 확인)
    IF NOT v_has_permission THEN
        IF v_notification.sender_id = v_user_id THEN
            v_has_permission := true;
        END IF;
    END IF;

    IF NOT v_has_permission THEN
        RETURN json_build_object('success', false, 'error', '해당 기관의 발송 이력을 삭제할 권한이 없습니다.');
    END IF;

    -- Delete dependent records
    DELETE FROM public.teacher_notification_status WHERE notification_id = p_notification_id;
    DELETE FROM public.org_admin_notification_status WHERE notification_id = p_notification_id;
    DELETE FROM public.org_notification_reads WHERE notification_id = p_notification_id;
    DELETE FROM public.student_notification_hidden WHERE notification_id = p_notification_id;
    DELETE FROM public.student_hidden_messages WHERE message_id = p_notification_id::text AND message_type = 'org_notification';

    -- Delete the notification itself
    DELETE FROM public.org_notifications WHERE id = p_notification_id;

    RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- 3. delete_admin_notification (기관관리자 - 추가 보완)
CREATE OR REPLACE FUNCTION public.delete_admin_notification(p_notification_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id UUID;
    v_role TEXT;
    v_user_org_id UUID;
    v_notification RECORD;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', '로그인이 필요합니다.');
    END IF;

    SELECT role, organization_id INTO v_role, v_user_org_id 
    FROM public.profiles 
    WHERE id = v_user_id;

    IF v_role != 'org_admin' THEN
        RETURN json_build_object('success', false, 'error', '기관관리자만 이 기능을 사용할 수 있습니다.');
    END IF;

    SELECT * INTO v_notification
    FROM public.org_notifications
    WHERE id = p_notification_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', '해당 알림을 찾을 수 없거나 이미 삭제되었습니다.');
    END IF;

    IF v_notification.organization_id != v_user_org_id THEN
        RETURN json_build_object('success', false, 'error', '자신의 기관 알림만 삭제할 수 있습니다.');
    END IF;

    -- Delete dependent records
    DELETE FROM public.teacher_notification_status WHERE notification_id = p_notification_id;
    DELETE FROM public.org_admin_notification_status WHERE notification_id = p_notification_id;
    DELETE FROM public.org_notification_reads WHERE notification_id = p_notification_id;
    DELETE FROM public.student_notification_hidden WHERE notification_id = p_notification_id;
    DELETE FROM public.student_hidden_messages WHERE message_id = p_notification_id::text AND message_type = 'org_notification';

    -- Delete the notification itself
    DELETE FROM public.org_notifications WHERE id = p_notification_id;

    RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;

REVOKE ALL ON FUNCTION public.delete_org_notification(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_org_notification(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.delete_middle_admin_notification(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_middle_admin_notification(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.delete_admin_notification(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_admin_notification(uuid) TO authenticated;
