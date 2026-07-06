-- ============================================================================
-- 수퍼관리자의 기관(organizations) 관리 및 조회 권한 수정을 위한 마이그레이션
-- ============================================================================

-- 1. organizations 테이블에 status 컬럼 추가 (deleted 상태 처리용)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.organizations ADD COLUMN status TEXT DEFAULT 'active' NOT NULL;
    END IF;
END $$;

-- 2. 수퍼관리자가 organizations 테이블의 모든 권한을 갖도록 RLS 정책 추가
-- (무한 반복 에러를 방지하기 위해 profiles의 role 필드 직접 조회 방식 사용)
DROP POLICY IF EXISTS "Enable all access for super_admin" ON public.organizations;
CREATE POLICY "Enable all access for super_admin"
    ON public.organizations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );
