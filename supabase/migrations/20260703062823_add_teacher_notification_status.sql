-- 선생님용 알림 상태 관리 테이블 생성
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

-- RLS 설정
ALTER TABLE public.teacher_notification_status ENABLE ROW LEVEL SECURITY;

-- 선생님은 자신의 알림 상태만 제어 가능
CREATE POLICY "Enable all access for users to their own notification status"
    ON public.teacher_notification_status FOR ALL
    USING (teacher_id = auth.uid());
