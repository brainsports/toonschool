-- ============================================================================
-- 기관관리자(Organization Admin) 기능 구현을 위한 마이그레이션
-- ============================================================================

-- 1. 기관 (organizations) 테이블 생성
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    total_licenses INTEGER DEFAULT 0 NOT NULL,
    used_licenses INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. profiles 테이블에 organization_id 컬럼 추가 (기존에 없다면)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    END IF;
END $$;

-- 3. organizations RLS 설정
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for users in the same organization"
    ON public.organizations FOR SELECT
    USING (id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1));

-- 4. 이용권 할당 (license_allocations) 테이블 생성
CREATE TABLE IF NOT EXISTS public.license_allocations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) NOT NULL,
    from_user_id UUID REFERENCES public.profiles(id),  -- 배정자 (기관관리자)
    to_user_id UUID REFERENCES public.profiles(id) NOT NULL, -- 수령자 (선생님)
    quantity INTEGER NOT NULL DEFAULT 0,
    used_quantity INTEGER NOT NULL DEFAULT 0,
    remaining_quantity INTEGER GENERATED ALWAYS AS (quantity - used_quantity) STORED,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS 설정
ALTER TABLE public.license_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for org_admin to their org license_allocations"
    ON public.license_allocations FOR ALL
    USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1));


-- 5. 이용권 변동 이력 (license_logs) 테이블 생성
CREATE TABLE IF NOT EXISTS public.license_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) NOT NULL,
    actor_id UUID REFERENCES public.profiles(id) NOT NULL,
    target_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL, -- 'grant_teacher_license', 'revoke_teacher_license' 등
    quantity_before INTEGER NOT NULL DEFAULT 0,
    quantity_after INTEGER NOT NULL DEFAULT 0,
    changed_quantity INTEGER NOT NULL DEFAULT 0,
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS 설정
ALTER TABLE public.license_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for org_admin to their org license_logs"
    ON public.license_logs FOR ALL
    USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1));


-- 6. 기관 알림 (org_notifications) 테이블 생성
CREATE TABLE IF NOT EXISTS public.org_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) NOT NULL,
    sender_role TEXT NOT NULL,
    target_type TEXT NOT NULL, -- 'all', 'specific_teacher', 'all_students', 'specific_class', 'specific_student'
    target_user_id UUID REFERENCES public.profiles(id),
    target_teacher_id UUID REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'normal' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS 설정
ALTER TABLE public.org_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for org_admin to their org notifications"
    ON public.org_notifications FOR ALL
    USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1));


-- 7. 기관 알림 읽음 상태 (org_notification_reads) 테이블 생성
CREATE TABLE IF NOT EXISTS public.org_notification_reads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_id UUID REFERENCES public.org_notifications(id) NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(notification_id, user_id)
);

-- RLS 설정
ALTER TABLE public.org_notification_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for org_admin to their org notification reads"
    ON public.org_notification_reads FOR SELECT
    USING (
        notification_id IN (
            SELECT id FROM public.org_notifications 
            WHERE organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
        )
    );
