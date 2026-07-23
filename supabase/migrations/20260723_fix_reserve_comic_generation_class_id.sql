-- =====================================================================
-- 20260723_fix_reserve_comic_generation_class_id.sql
-- fix: reserve_comic_generation 의 선언되지 않은 v_class_id 참조 수정
-- =====================================================================
-- 원인:
--   20260720120000_create_comic_quota_system.sql 의 reserve_comic_generation 이
--   DECLARE 하지 않은 v_class_id 를 참조하여 런타임 에러
--   (column "v_class_id" does not exist) 를 발생시켜 예약 RPC 가 실패함.
--   결과로 만화 생성 버튼 클릭 시 "일시적인 문제가 발생했어요..." 알림 후
--   6컷 생성 단계에 진입하지 못함.
--
-- 수정:
--   v_class_id -> s.class_id (students 테이블의 실제 class_id 컬럼).
--
-- 최소 수정 원칙:
--   함수 파라미터 / 반환형(json) / SECURITY DEFINER / 권한 검사 /
--   중복 예약 방지(idempotency) / reserved 상태 생성 / 오류 코드 /
--   교사 ID 조회 / 사용 연도·월 계산 은 기존과 동일.
--   단, v_class_id 참조만 s.class_id 로 변경.
--
-- 성격:
--   additive (CREATE OR REPLACE FUNCTION). 테이블/컬럼/RLS/기존 데이터 변경 없음.
--   재실행 안전. 기존 함수 권한(GRANT EXECUTE 기본 PUBLIC)은 CREATE OR REPLACE 로 유지됨.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.reserve_comic_generation(
  p_student_id uuid, p_comic_id text, p_class_id uuid DEFAULT NULL, p_teacher_id uuid DEFAULT NULL
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_existing comic_usage_records%ROWTYPE;
  v_status json;
  v_teacher uuid;
  v_class uuid;
  v_id uuid;
BEGIN
  IF p_student_id IS NULL OR p_comic_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT';
  END IF;
  IF p_student_id <> auth.uid() AND NOT public.is_student_teacher(p_student_id) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  -- idempotency: 이미 reserved/completed 이면 기존 반환(중복 차감 방지)
  SELECT * INTO v_existing FROM public.comic_usage_records
   WHERE student_id = p_student_id AND comic_id = p_comic_id
     AND status IN ('reserved','completed');
  IF v_existing.id IS NOT NULL THEN
    RETURN json_build_object('ok', true, 'id', v_existing.id, 'status', v_existing.status, 'dedupe', true);
  END IF;

  SELECT COALESCE(p_teacher_id, s.created_by) INTO v_teacher
    FROM public.students s WHERE s.id = p_student_id;
  SELECT COALESCE(p_class_id, s.class_id) INTO v_class
    FROM public.students s WHERE s.id = p_student_id;
  IF v_class IS NULL THEN v_class := p_class_id; END IF;

  v_status := public.get_student_quota_status(p_student_id);
  IF (v_status->>'remaining')::int <= 0 THEN
    RAISE EXCEPTION 'QUOTA_EXCEEDED';
  END IF;

  INSERT INTO public.comic_usage_records
    (student_id, class_id, teacher_id, comic_id, status, usage_year, usage_month)
  VALUES (p_student_id, v_class, v_teacher, p_comic_id, 'reserved', public.kst_year(), public.kst_month())
  RETURNING id INTO v_id;

  RETURN json_build_object('ok', true, 'id', v_id, 'status', 'reserved');
END;
$$;
