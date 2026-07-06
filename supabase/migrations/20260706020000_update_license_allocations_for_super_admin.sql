-- ============================================================================
-- 수퍼관리자의 배정 이용권(license_allocations) 권한 추가를 위한 마이그레이션
-- ============================================================================

-- 수퍼관리자가 license_allocations 테이블의 모든 권한을 갖도록 RLS 정책 추가
-- (무한 반복 에러를 방지하기 위해 profiles의 role 필드 직접 조회 방식 사용)
DROP POLICY IF EXISTS "Enable all access for super_admin" ON public.license_allocations;
CREATE POLICY "Enable all access for super_admin"
    ON public.license_allocations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );
