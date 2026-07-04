-- 1. organizations 테이블에 이용권 정보 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'license_start_date'
    ) THEN
        ALTER TABLE public.organizations 
        ADD COLUMN license_start_date DATE,
        ADD COLUMN license_end_date DATE,
        ADD COLUMN license_memo TEXT;
    END IF;
END $$;

-- 2. update_middle_org_license RPC 생성 (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION update_middle_org_license(
    p_org_id UUID,
    p_total_licenses INT,
    p_start_date DATE,
    p_end_date DATE,
    p_memo TEXT
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_org RECORD;
    v_other_total INT;
    v_max_licenses INT := 500;
BEGIN
    -- 1) 사용자 인증 확인
    IF v_uid IS NULL THEN 
        RETURN json_build_object('success', false, 'error', '인증되지 않은 사용자입니다.'); 
    END IF;
    
    -- 2) 대상 기관 권한 확인 (본인이 담당하는 기관인지)
    SELECT * INTO v_org 
    FROM organizations 
    WHERE id = p_org_id AND middle_admin_id = v_uid;
    
    IF NOT FOUND THEN 
        RETURN json_build_object('success', false, 'error', '권한이 없거나 존재하지 않는 기관입니다.'); 
    END IF;
    
    -- 3) 회수 방어 로직: 사용한 이용권 수보다 적게 배정할 수 없음
    IF p_total_licenses < v_org.used_licenses THEN
        RETURN json_build_object('success', false, 'error', '이미 사용한 이용권 수보다 적게 배정할 수 없습니다.');
    END IF;

    -- 4) 배정 방어 로직: 중간관리자의 총 이용권(500개) 한도 검증
    SELECT COALESCE(SUM(total_licenses), 0) INTO v_other_total 
    FROM organizations 
    WHERE middle_admin_id = v_uid AND id != p_org_id;

    IF v_other_total + p_total_licenses > v_max_licenses THEN
        RETURN json_build_object('success', false, 'error', '중간관리자의 전체 이용권을 초과하여 배정할 수 없습니다.');
    END IF;

    -- 5) 업데이트 수행
    UPDATE organizations
    SET 
        total_licenses = p_total_licenses,
        license_start_date = p_start_date,
        license_end_date = p_end_date,
        license_memo = p_memo
    WHERE id = p_org_id;

    RETURN json_build_object('success', true);
END;
$$;
