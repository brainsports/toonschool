-- 20260703064000_add_org_admin_notification_status.sql
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

ALTER TABLE public.org_admin_notification_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for users to their own notification status"
    ON public.org_admin_notification_status FOR ALL
    USING (org_admin_id = auth.uid());

-- Ensure org_admin can read notifications targeted to them even if organization_id is null or different
CREATE POLICY "Enable read access for targeted org_admin"
    ON public.org_notifications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'org_admin'
            AND (
                org_notifications.target_type = 'all_org_admins' OR
                org_notifications.target_type = 'all_organizations' OR
                (org_notifications.target_type = 'specific_org_admin' AND org_notifications.target_user_id = auth.uid()) OR
                (org_notifications.organization_id = profiles.organization_id)
            )
        )
    );
