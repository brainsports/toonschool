-- org_notifications 테이블 컬럼 추가
ALTER TABLE public.org_notifications
ADD COLUMN category TEXT DEFAULT 'notice' NOT NULL,
ADD COLUMN notice_date TEXT DEFAULT to_char(timezone('utc'::text, now()), 'YYYY-MM-DD') NOT NULL,
ADD COLUMN is_public BOOLEAN DEFAULT true NOT NULL;

-- 기존 데이터 마이그레이션 (필요시)
-- 이미 DEFAULT가 있으므로 기존 행들에도 기본값이 들어갈 것임. (주의: notice_date는 timezone utc now 기준이므로 기존 데이터도 현재 시간으로 채워질 수 있음. 다만 created_at을 활용하고 싶다면 아래 주석을 참고)
UPDATE public.org_notifications 
SET notice_date = to_char(created_at, 'YYYY-MM-DD') 
WHERE notice_date = to_char(timezone('utc'::text, now()), 'YYYY-MM-DD');

-- 학생용 숨김 처리 테이블
CREATE TABLE IF NOT EXISTS public.student_notification_hidden (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) NOT NULL,
    notification_id UUID REFERENCES public.org_notifications(id) NOT NULL,
    hidden_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id, notification_id)
);

ALTER TABLE public.student_notification_hidden ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for users to their own hidden notifications"
    ON public.student_notification_hidden FOR ALL
    USING (student_id = auth.uid());
