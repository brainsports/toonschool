-- ============================================================================
-- 중간관리자(Middle Admin) 기능 구현을 위한 마이그레이션
-- ============================================================================

-- 1. organizations 테이블에 middle_admin_id 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'middle_admin_id'
    ) THEN
        ALTER TABLE public.organizations ADD COLUMN middle_admin_id UUID REFERENCES public.profiles(id);
    END IF;
END $$;

-- 2. organizations RLS 정책 추가 (중간관리자용)
-- 중간관리자는 자신에게 배정된 기관(middle_admin_id = auth.uid())만 제어 가능
CREATE POLICY "Enable all access for middle_admin to their assigned orgs"
    ON public.organizations FOR ALL
    USING (
        middle_admin_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'middle_admin'
        )
    );

-- 3. license_allocations RLS 정책 추가 (중간관리자용)
-- 중간관리자는 자신에게 배정된 기관의 라이선스 내역 조회/수정 가능
CREATE POLICY "Enable all access for middle_admin to assigned orgs license_allocations"
    ON public.license_allocations FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.organizations
        WHERE organizations.id = license_allocations.organization_id
        AND organizations.middle_admin_id = auth.uid()
    ) AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'middle_admin'
    ));

-- 4. license_logs RLS 정책 추가 (중간관리자용)
CREATE POLICY "Enable all access for middle_admin to assigned orgs license_logs"
    ON public.license_logs FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.organizations
        WHERE organizations.id = license_logs.organization_id
        AND organizations.middle_admin_id = auth.uid()
    ) AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'middle_admin'
    ));

-- 5. students RLS 정책 추가 (중간관리자용)
-- 중간관리자는 자신에게 배정된 기관에 소속된 선생님(center_id)이 관리하는 학생을 조회 가능
CREATE POLICY "Enable all access for middle_admin to assigned org students"
    ON public.students FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles teacher
        WHERE teacher.center_id = students.center_id
        AND EXISTS (
            SELECT 1 FROM public.organizations
            WHERE organizations.id = teacher.organization_id
            AND organizations.middle_admin_id = auth.uid()
        )
    ) AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'middle_admin'
    ));

-- 6. profiles RLS 정책 (기관관리자/선생님 조회) (중간관리자용)
-- 중간관리자는 자신에게 배정된 기관에 속한 사용자(기관관리자, 선생님 등) 목록 조회 가능
CREATE POLICY "Enable read access for middle_admin to users in assigned orgs"
    ON public.profiles FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.organizations
        WHERE organizations.id = profiles.organization_id
        AND organizations.middle_admin_id = auth.uid()
    ) AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'middle_admin'
    ));

-- 7. classes RLS 정책 (만약 존재한다면)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'classes'
    ) THEN
        EXECUTE '
            CREATE POLICY "Enable all access for middle_admin to assigned org classes"
                ON public.classes FOR ALL
                USING (EXISTS (
                    SELECT 1 FROM public.organizations
                    WHERE organizations.id = classes.organization_id
                    AND organizations.middle_admin_id = auth.uid()
                ) AND EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role = ''middle_admin''
                ));
        ';
    END IF;
END $$;
