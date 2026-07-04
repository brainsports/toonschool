-- 20260704150000_fix_teacher_notification_rls.sql

-- 선생님 알림 조회를 위한 RLS 정책의 변수 범위 오류 수정
-- (s.notification_id = id -> s.notification_id = org_notifications.id)
DROP POLICY IF EXISTS "Enable read access via teacher status" ON public.org_notifications;

CREATE POLICY "Enable read access via teacher status"
    ON public.org_notifications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.teacher_notification_status s 
            WHERE s.notification_id = org_notifications.id AND s.teacher_id = auth.uid()
        )
    );
