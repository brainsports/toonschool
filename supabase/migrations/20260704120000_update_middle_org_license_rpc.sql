-- update_middle_org_license RPC 생성 (권한 검증 및 license_allocations, organizations 업데이트)
CREATE OR REPLACE FUNCTION public.update_middle_org_license(
    p_org_id uuid,
    p_total_licenses integer,
    p_start_date date,
    p_end_date date,
    p_memo text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_role text;
    v_middle_admin_id uuid;
    v_used_quantity integer;
BEGIN
    -- 1. 사용자 역할 확인
    SELECT role INTO v_role FROM profiles WHERE id = v_uid;
    IF v_role NOT IN ('super_admin', 'middle_admin') THEN
        RETURN json_build_object('success', false, 'error', '수정 권한이 없습니다. (super_admin 또는 middle_admin만 가능)');
    END IF;

    -- 2. 권한 검증: middle_admin은 자신이 관리하는 소속기관만 수정 가능
    IF v_role = 'middle_admin' THEN
        SELECT middle_admin_id INTO v_middle_admin_id FROM organizations WHERE id = p_org_id;
        IF v_middle_admin_id IS NULL OR v_middle_admin_id != v_uid THEN
            RETURN json_build_object('success', false, 'error', '본인이 관리하는 소속기관만 수정할 수 있습니다.');
        END IF;
    END IF;

    -- 3. 회수 제한 검증
    -- license_allocations에서 현재까지 사용한 수량(used_quantity) 조회
    -- 여러 건일 경우를 대비해 MAX 값 사용 (일반적으로 1건이거나, 합산일 수 있으나 가장 안전한 기준)
    SELECT MAX(used_quantity) INTO v_used_quantity 
    FROM license_allocations 
    WHERE organization_id = p_org_id;

    IF v_used_quantity IS NULL THEN
        -- license_allocations에 없으면 organizations 테이블의 used_licenses 참조
        SELECT used_licenses INTO v_used_quantity FROM organizations WHERE id = p_org_id;
    END IF;

    IF v_used_quantity IS NULL THEN
        v_used_quantity := 0;
    END IF;

    IF p_total_licenses < v_used_quantity THEN
        RETURN json_build_object('success', false, 'error', '이미 사용한 이용권(' || v_used_quantity || '개)보다 적은 수량으로 저장할 수 없습니다.');
    END IF;

    -- 4. 업데이트 실행
    -- (1) license_allocations 테이블 업데이트
    -- 메모(p_memo)는 새 컬럼을 만들지 않고 무시합니다.
    UPDATE license_allocations
    SET 
        quantity = p_total_licenses,
        license_start_date = p_start_date,
        license_end_date = p_end_date,
        updated_at = now()
    WHERE organization_id = p_org_id;

    -- (2) organizations 테이블 업데이트 (UI 동기화 및 기존 데이터 보존용)
    UPDATE organizations
    SET 
        total_licenses = p_total_licenses,
        license_start_date = p_start_date,
        license_end_date = p_end_date
    WHERE id = p_org_id;

    RETURN json_build_object('success', true);
END;
$$;
