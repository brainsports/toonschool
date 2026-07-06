CREATE OR REPLACE FUNCTION public.delete_org_notification(p_notification_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_user_role TEXT;
BEGIN
    -- Check permissions
    SELECT role INTO v_user_role FROM public.profiles WHERE id = auth.uid();
    IF v_user_role != 'super_admin' THEN
        RAISE EXCEPTION '수퍼관리자만 알림을 삭제할 수 있습니다.';
    END IF;

    -- Delete dependent status rows first
    DELETE FROM public.teacher_notification_status WHERE notification_id = p_notification_id;
    DELETE FROM public.org_admin_notification_status WHERE notification_id = p_notification_id;

    -- Delete the notification itself
    DELETE FROM public.org_notifications WHERE id = p_notification_id;
END;
$$;
