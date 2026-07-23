-- 학생별 절대 월 만화 생성 한도(monthly_quota_override) 도입 + get_student_quota_status 재정의.
--
-- 목적:
--   1) 학생 개별 절대 월 한도(주1=4, 주2=8, 주5=20) 설정 — 학급 전체가 아닌 학생 단위.
--   2) class 설정 행이 아예 없는 신규/미설정 학생에게 기본 월 8 폴백.
--      (class_generation_settings 행이 존재하되 base_quota=0 인 "명시적 0"은 유지)
--
-- 호환성:
--   - 기존 extra_quota(학생/학급 "추가분") 의미·데이터 보존. monthly_quota_override는 별개 절대 한도.
--   - comic_usage_records(완료/예약/복원)는 일절 건드리지 않음.
--   - 멱등(ALTER ... IF NOT EXISTS, CREATE OR REPLACE FUNCTION).

-- 1) 학생별 절대 월 한도 컬럼 추가 (nullable, 양의 정수만. UI는 4/8/20 + 학급기본=NULL)
ALTER TABLE public.student_quota_overrides
  ADD COLUMN IF NOT EXISTS monthly_quota_override integer;
ALTER TABLE public.student_quota_overrides
  DROP CONSTRAINT IF EXISTS student_quota_overrides_monthly_quota_override_check;
ALTER TABLE public.student_quota_overrides
  ADD CONSTRAINT student_quota_overrides_monthly_quota_override_check
  CHECK (monthly_quota_override IS NULL OR monthly_quota_override > 0);

-- 2) get_student_quota_status 재정의
--    우선순위: 학생 절대 override > class 설정 행(있으면 base+extra, 명시적 0 포함) > 폴백 8(행 없으면)
CREATE OR REPLACE FUNCTION public.get_student_quota_status(p_student_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_class_id uuid;
  v_cls class_generation_settings%ROWTYPE;
  v_stu student_quota_overrides%ROWTYPE;
  v_class_base integer := 0;
  v_class_extra integer := 0;
  v_student_extra integer := 0;
  v_final integer := 0;
  v_completed integer := 0;
  v_reserved integer := 0;
  v_y integer := public.kst_year();
  v_m integer := public.kst_month();
BEGIN
  SELECT class_id INTO v_class_id FROM public.students WHERE id = p_student_id;

  SELECT * INTO v_cls FROM public.class_generation_settings WHERE class_id = v_class_id;
  v_class_base := COALESCE(v_cls.base_quota, 0);
  v_class_extra := CASE
    WHEN v_cls.extra_duration = 'every_month' THEN COALESCE(v_cls.extra_quota, 0)
    WHEN v_cls.extra_duration = 'this_month'
         AND v_cls.extra_applied_year = v_y AND v_cls.extra_applied_month = v_m
      THEN COALESCE(v_cls.extra_quota, 0)
    ELSE 0
  END;

  SELECT * INTO v_stu FROM public.student_quota_overrides WHERE student_id = p_student_id;
  v_student_extra := CASE
    WHEN v_stu.extra_duration = 'every_month' THEN COALESCE(v_stu.extra_quota, 0)
    WHEN v_stu.extra_duration = 'this_month'
         AND v_stu.extra_applied_year = v_y AND v_stu.extra_applied_month = v_m
      THEN COALESCE(v_stu.extra_quota, 0)
    ELSE 0
  END;

  -- 기준 한도 결정: 학생 절대 override > class 설정 행 > 폴백 8
  IF v_stu.monthly_quota_override IS NOT NULL THEN
    v_final := v_stu.monthly_quota_override;
  ELSIF v_cls.id IS NOT NULL THEN
    v_final := v_class_base + v_class_extra + v_student_extra;
  ELSE
    v_final := 8;  -- class 설정 행 자체가 없으면 기본 월 8
  END IF;

  SELECT count(*) INTO v_completed FROM public.comic_usage_records
   WHERE student_id = p_student_id AND status = 'completed'
     AND usage_year = v_y AND usage_month = v_m;

  SELECT count(*) INTO v_reserved FROM public.comic_usage_records
   WHERE student_id = p_student_id AND status = 'reserved'
     AND usage_year = v_y AND usage_month = v_m;

  RETURN json_build_object(
    'final_limit', v_final,
    'class_base', v_class_base,
    'class_extra', v_class_extra,
    'student_extra', v_student_extra,
    'monthly_quota_override', v_stu.monthly_quota_override,
    'has_class_setting', (v_cls.id IS NOT NULL),
    'completed', v_completed,
    'reserved', v_reserved,
    'remaining', GREATEST(v_final - v_completed - v_reserved, 0),
    'year', v_y, 'month', v_m
  );
END;
$$;

-- 적용 후 검증(참고용, 자동 실행 아님):
-- SELECT public.get_student_quota_status('<student-with-no-settings>');  -- final_limit = 8
