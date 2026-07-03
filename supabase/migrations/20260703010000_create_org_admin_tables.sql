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

-- 기관관리자는 자신의 기관 정보를 모두 제어 가능 (role = 'org_admin' 조건 추가)
CREATE POLICY "Enable all access for org_admin"
    ON public.organizations FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.organization_id = organizations.id
        AND profiles.role = 'org_admin'
    ));

-- 일반 구성원(선생님, 학생)은 자신이 속한 기관 정보를 조회만 가능
CREATE POLICY "Enable read access for organization members"
    ON public.organizations FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.organization_id = organizations.id
    ));


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

-- 기관관리자는 자신의 기관에 속한 할당 정보를 모두 제어 가능 (role = 'org_admin' 조건 추가)
CREATE POLICY "Enable all access for org_admin to their org license_allocations"
    ON public.license_allocations FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.organization_id = license_allocations.organization_id
        AND profiles.role = 'org_admin'
    ));

-- 선생님은 자신에게 할당된 이용권 정보만 조회 가능
CREATE POLICY "Enable read access for teachers to their own license_allocations"
    ON public.license_allocations FOR SELECT
    USING (to_user_id = auth.uid());


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

-- 기관관리자는 자신의 기관 이력을 모두 제어 가능 (role = 'org_admin' 조건 추가)
CREATE POLICY "Enable all access for org_admin to their org license_logs"
    ON public.license_logs FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.organization_id = license_logs.organization_id
        AND profiles.role = 'org_admin'
    ));

-- 선생님은 자신과 관련된 이력만 조회 가능
CREATE POLICY "Enable read access for users to their own license_logs"
    ON public.license_logs FOR SELECT
    USING (target_id = auth.uid() OR actor_id = auth.uid());


-- 6. 기관 알림 (org_notifications) 테이블 생성
CREATE TABLE IF NOT EXISTS public.org_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) NOT NULL,
    sender_role TEXT NOT NULL,
    target_type TEXT NOT NULL, -- 'all_teachers', 'all_students', 'specific_teacher', 'specific_student'
    target_user_id UUID REFERENCES public.profiles(id),
    target_teacher_id UUID REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'normal' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS 설정
ALTER TABLE public.org_notifications ENABLE ROW LEVEL SECURITY;

-- 기관관리자는 자신의 기관 알림을 모두 제어 가능 (role = 'org_admin' 조건 추가)
CREATE POLICY "Enable all access for org_admin to their org notifications"
    ON public.org_notifications FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.organization_id = org_notifications.organization_id
        AND profiles.role = 'org_admin'
    ));

-- 일반 구성원(선생님, 학생)은 같은 기관에서 발송된 알림 중 본인 대상의 알림만 조회 가능
CREATE POLICY "Enable read access for targeted users"
    ON public.org_notifications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.organization_id = org_notifications.organization_id
            AND (
                (org_notifications.target_type = 'all_teachers' AND profiles.role = 'teacher') OR
                (org_notifications.target_type = 'all_students' AND profiles.role = 'student') OR
                (org_notifications.target_type = 'specific_teacher' AND org_notifications.target_teacher_id = auth.uid()) OR
                (org_notifications.target_type = 'specific_student' AND org_notifications.target_user_id = auth.uid())
            )
        )
    );


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

-- 기관관리자는 같은 기관의 모든 읽음 상태 기록 조회 가능 (role = 'org_admin' 조건 포함)
CREATE POLICY "Enable read access for org_admin to their org notification reads"
    ON public.org_notification_reads FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.org_notifications n
        JOIN public.profiles p ON p.organization_id = n.organization_id
        WHERE n.id = org_notification_reads.notification_id
        AND p.id = auth.uid()
        AND p.role = 'org_admin'
    ));

-- 일반 구성원(선생님, 학생)은 자신의 읽음 상태만 제어(생성/조회/수정) 가능
CREATE POLICY "Enable all access for users to their own notification reads"
    ON public.org_notification_reads FOR ALL
    USING (user_id = auth.uid());
