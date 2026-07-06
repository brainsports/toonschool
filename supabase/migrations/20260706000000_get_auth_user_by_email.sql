-- Edge Function에서 기존 생성된 auth user(반쪽 계정)를 찾기 위한 내부 함수
-- 오직 service_role 권한으로만 실행 가능하도록 권한 제한

CREATE OR REPLACE FUNCTION get_auth_user_id_by_email(p_email TEXT)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- public, anon, authenticated 접근 차단
REVOKE ALL ON FUNCTION get_auth_user_id_by_email(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_auth_user_id_by_email(TEXT) FROM anon;
REVOKE ALL ON FUNCTION get_auth_user_id_by_email(TEXT) FROM authenticated;

-- 오직 service_role 에게만 실행 권한 부여
GRANT EXECUTE ON FUNCTION get_auth_user_id_by_email(TEXT) TO service_role;
