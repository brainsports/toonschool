-- =====================================================================
-- 20260723_fix_reserve_comic_generation_teacher_id.sql
-- fix: reserve_comic_generation 의 teacher_id NOT NULL 위반(23502) 수정
-- =====================================================================
-- 원인:
--   reserve_comic_generation 이 teacher_id 를
--   COALESCE(p_teacher_id, s.created_by) 로만 결정.
--   프런트는 p_teacher_id 를 넘기지 않고, 일부 학생(created_by=NULL)은
--   teacher_id 가 NULL 이 되어 comic_usage_records.teacher_id(NOT NULL) 위반(23502)으로
--   예약이 실패함 → 만화 생성 진입 불가.
--
-- 수정:
--   teacher_id 결정 순서를  p_teacher_id → students.created_by → classes.teacher_id
--   순으로 폴백. 학급에 배정된 학생은 학급 teacher_id 로 채워진다.
--   최종적으로도 teacher_id 가 NULL 이면 INSERT 전에 명확한 'TEACHER_REQUIRED' 예외를
--   발생시켜 원인을 바로 알 수 있도록 한다(NOT NULL 23502 원시 오류 회피).
--
-- 최소 수정 원칙:
--   함수 파라미터/반환/SECURITY DEFINER/권한검사/중복예약방지/할당량계산/
--   상태(reserved)/차감로직/RLS/테이블구조/기존데이터 는 기존과 동일.
--   teacher_id 도출 1개 SELECT 와 TEACHER_REQUIRED 가드만 추가.
--
-- 성격: additive (CREATE OR REPLACE FUNCTION). 재실행 안전.
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

  -- teacher_id: p_teacher_id → students.created_by → classes.teacher_id 순 폴백
  SELECT COALESCE(p_teacher_id, s.created_by, c.teacher_id) INTO v_teacher
    FROM public.students s
    LEFT JOIN public.classes c ON c.id = s.class_id
    WHERE s.id = p_student_id;
  SELECT COALESCE(p_class_id, s.class_id) INTO v_class
    FROM public.students s WHERE s.id = p_student_id;
  IF v_class IS NULL THEN v_class := p_class_id; END IF;

  -- teacher_id 최종 NULL 방지: NOT NULL 위반(23502) 전에 명확한 오류
  IF v_teacher IS NULL THEN
    RAISE EXCEPTION 'TEACHER_REQUIRED';
  END IF;

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
