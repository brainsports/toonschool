-- 20260704130000_rebuild_notification_system.sql

-- 1. Ensure tables exist
CREATE TABLE IF NOT EXISTS public.org_admin_notification_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_admin_id UUID REFERENCES public.profiles(id) NOT NULL,
    notification_id UUID REFERENCES public.org_notifications(id) NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    hidden_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(org_admin_id, notification_id)
);

CREATE TABLE IF NOT EXISTS public.teacher_notification_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) NOT NULL,
    notification_id UUID REFERENCES public.org_notifications(id) NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    hidden_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(teacher_id, notification_id)
);

-- RLS
ALTER TABLE public.org_admin_notification_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_notification_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for users to their own notification status" ON public.org_admin_notification_status;
CREATE POLICY "Enable all access for users to their own notification status"
    ON public.org_admin_notification_status FOR ALL
    USING (org_admin_id = auth.uid());

DROP POLICY IF EXISTS "Enable all access for users to their own notification status" ON public.teacher_notification_status;
CREATE POLICY "Enable all access for users to their own notification status"
    ON public.teacher_notification_status FOR ALL
    USING (teacher_id = auth.uid());

-- 2. Add policies to org_notifications
DROP POLICY IF EXISTS "Enable read access for sender" ON public.org_notifications;
CREATE POLICY "Enable read access for sender"
    ON public.org_notifications FOR SELECT
    USING (sender_id = auth.uid());

DROP POLICY IF EXISTS "Enable read access via org_admin status" ON public.org_notifications;
CREATE POLICY "Enable read access via org_admin status"
    ON public.org_notifications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.org_admin_notification_status s 
            WHERE s.notification_id = id AND s.org_admin_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Enable read access via teacher status" ON public.org_notifications;
CREATE POLICY "Enable read access via teacher status"
    ON public.org_notifications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.teacher_notification_status s 
            WHERE s.notification_id = id AND s.teacher_id = auth.uid()
        )
    );

-- Create an RPC to safely check if current user is student and in the same org
CREATE OR REPLACE FUNCTION public.is_student_in_org(p_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'student' AND organization_id = p_org_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Enable read access for targeted students" ON public.org_notifications;
CREATE POLICY "Enable read access for targeted students"
    ON public.org_notifications FOR SELECT
    USING (
        target_type IN ('all', 'student', 'all_students', 'specific_class', 'specific_student')
        AND public.is_student_in_org(organization_id)
    );

-- 3. Replace create_org_notification RPC
CREATE OR REPLACE FUNCTION public.create_org_notification(
    p_organization_id UUID,
    p_target_type VARCHAR,
    p_title VARCHAR,
    p_message TEXT,
    p_priority VARCHAR,
    p_target_user_id UUID DEFAULT NULL,
    p_target_teacher_id UUID DEFAULT NULL,
    p_category VARCHAR DEFAULT 'notice'
) RETURNS json AS $$
DECLARE
    new_id UUID;
    v_sender_role VARCHAR;
BEGIN
    SELECT role INTO v_sender_role FROM public.profiles WHERE id = auth.uid();

    INSERT INTO public.org_notifications (
        organization_id,
        sender_id,
        sender_role,
        target_type,
        target_user_id,
        target_teacher_id,
        title,
        message,
        priority,
        category,
        notice_date,
        is_public
    ) VALUES (
        p_organization_id,
        auth.uid(),
        v_sender_role,
        p_target_type,
        p_target_user_id,
        p_target_teacher_id,
        p_title,
        p_message,
        p_priority,
        p_category,
        CURRENT_DATE,
        true
    ) RETURNING id INTO new_id;

    -- Generate org_admin_notification_status
    IF p_target_type IN ('all', 'org_admin', 'all_org_admins', 'all_organizations', 'specific_org_admin') THEN
        INSERT INTO public.org_admin_notification_status (org_admin_id, notification_id)
        SELECT id, new_id FROM public.profiles
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
        SELECT id, new_id FROM public.profiles
        WHERE role = 'teacher'
          AND (
            p_target_type IN ('all_teachers') OR
            (p_target_type = 'specific_teacher' AND id = COALESCE(p_target_teacher_id, p_target_user_id)) OR
            (p_target_type IN ('all', 'teacher', 'center_teachers') AND organization_id = p_organization_id)
          )
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN json_build_object('success', true, 'id', new_id);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
