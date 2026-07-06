-- Profiles RLS 정책 업데이트 (재귀 조회 방지)

-- 기존 profiles 관련 정책이 있다면 삭제하거나 비활성화합니다.
-- DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;

-- 1. 자신의 프로필 조회
CREATE POLICY "profiles_select_self" 
ON profiles FOR SELECT 
TO authenticated 
USING ( id = auth.uid() );

-- 2. 수퍼관리자: 모든 profiles 조회 (JWT metadata 확인)
CREATE POLICY "profiles_select_super_admin" 
ON profiles FOR SELECT 
TO authenticated 
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
);

-- 3. 중간관리자: 담당 기관의 사용자(선생님/학생) 조회
-- 중간관리자의 담당 기관은 organizations 테이블의 middle_admin_id 로 식별합니다.
CREATE POLICY "profiles_select_middle_admin" 
ON profiles FOR SELECT 
TO authenticated 
USING (
  (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'middle_admin'
    OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'middle_admin'
  )
  AND
  organization_id IN (
    SELECT id FROM organizations WHERE middle_admin_id = auth.uid()
  )
);

-- 4. 기관관리자: 자기 기관의 사용자 조회
-- 기관관리자는 자신의 profiles.organization_id 와 동일한 organization_id를 가진 사용자를 볼 수 있습니다.
-- 단, profiles 재조회를 피하기 위해 JWT 메타데이터에 organization_id가 들어있다고 가정하거나,
-- JWT에 기관정보가 없다면 RLS 우회 함수(security definer)를 생성하여 사용해야 합니다.

-- [중요] 만약 기관관리자의 경우 JWT에 organization_id가 없다면, 
-- 다음과 같은 Security Definer 함수를 사용해야 Circular Dependency를 막을 수 있습니다.
CREATE OR REPLACE FUNCTION get_user_org_id(user_uid uuid)
RETURNS uuid AS $$
  SELECT organization_id FROM profiles WHERE id = user_uid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE POLICY "profiles_select_org_admin" 
ON profiles FOR SELECT 
TO authenticated 
USING (
  (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'org_admin'
    OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'org_admin'
  )
  AND
  organization_id = get_user_org_id(auth.uid())
);
