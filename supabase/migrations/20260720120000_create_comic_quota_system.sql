-- =====================================================================
-- 20260720120000_create_comic_quota_system.sql
-- 만화 생성 횟수 제한 + 학년별 기본학급 시스템 (additive / idempotent)
-- =====================================================================
-- 정책:
--   - 1회 사용 확정 = "6컷 생성 + 만화보기/공유 가능한 완성 만화책 저장" 시점
--   - 버튼 클릭 시 즉시 차감 X. reserve -> confirm/completed 또는 release
--   - 가용 = 기본한도 + 학급추가 + 학생개별추가 - completed - reserved (당월)
--   - 월 한도는 한국 시간(KST) 기준. cron 없이 조회 시 lazy 계산.
--   - this_month 추가는 설정된 연/월에만 적용(자동 만료). every_month는 항상 적용.
--
-- 적용 전제:
--   - public.classes / public.students / public.profiles 테이블이 이미 운영에 존재(대시보드 out-of-band 생성).
--   - get_my_role() 헬퍼가 존재(기존 마이그레이션에서 사용 중).
--   - 모두 IF NOT EXISTS / CREATE OR REPLACE 이므로 여러 번 실행해 안전.
-- =====================================================================

-- ---------- 0. updated_at 트리거 함수 (없으면 생성) ----------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- =====================================================================
-- 1. classes 확장: 기본학급 플래그 + 기본 학년
-- =====================================================================
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS default_grade integer;

-- 기본학급은 teacher_id + grade + is_default 조합으로 유일해야 한다.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND tablename='classes' AND indexname='uq_classes_default_teacher_grade'
  ) THEN
    CREATE UNIQUE INDEX uq_classes_default_teacher_grade
      ON public.classes (teacher_id, grade)
      WHERE is_default = true AND teacher_id IS NOT NULL;
  END IF;
END $$;

-- =====================================================================
-- 2. 학급별 만화 생성 설정
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.class_generation_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL,
  base_quota integer NOT NULL DEFAULT 4 CHECK (base_quota >= 0),
  extra_quota integer NOT NULL DEFAULT 0 CHECK (extra_quota >= 0),
  extra_duration text NOT NULL DEFAULT 'this_month' CHECK (extra_duration IN ('this_month','every_month')),
  extra_applied_year integer,
  extra_applied_month integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_class_generation_settings_class UNIQUE (class_id)
);
CREATE INDEX IF NOT EXISTS idx_class_gen_settings_teacher ON public.class_generation_settings(teacher_id);
DROP TRIGGER IF EXISTS trg_class_gen_settings_updated_at ON public.class_generation_settings;
CREATE TRIGGER trg_class_gen_settings_updated_at BEFORE UPDATE ON public.class_generation_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================================
-- 3. 학생 개별 추가 횟수
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.student_quota_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  extra_quota integer NOT NULL DEFAULT 0 CHECK (extra_quota >= 0),
  extra_duration text NOT NULL DEFAULT 'this_month' CHECK (extra_duration IN ('this_month','every_month')),
  extra_applied_year integer,
  extra_applied_month integer,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_student_quota_overrides_student UNIQUE (student_id)
);
CREATE INDEX IF NOT EXISTS idx_student_quota_overrides_teacher ON public.student_quota_overrides(teacher_id);
DROP TRIGGER IF EXISTS trg_student_quota_overrides_updated_at ON public.student_quota_overrides;
CREATE TRIGGER trg_student_quota_overrides_updated_at BEFORE UPDATE ON public.student_quota_overrides
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================================
-- 4. 만화 생성 예약/사용 기록 (월별)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.comic_usage_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  class_id uuid,
  teacher_id uuid NOT NULL,
  comic_id text NOT NULL,
  generation_job_id text,
  status text NOT NULL DEFAULT 'reserved'
    CHECK (status IN ('reserved','completed','released','restored')),
  usage_year integer NOT NULL,
  usage_month integer NOT NULL,
  reserved_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  released_at timestamptz,
  release_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comic_usage_student_month
  ON public.comic_usage_records(student_id, usage_year, usage_month);
CREATE INDEX IF NOT EXISTS idx_comic_usage_status ON public.comic_usage_records(status);
CREATE INDEX IF NOT EXISTS idx_comic_usage_teacher ON public.comic_usage_records(teacher_id);
-- 동일 student + comic 은 reserved/completed 중 동시에 하나만
CREATE UNIQUE INDEX IF NOT EXISTS uq_comic_usage_active_student_comic
  ON public.comic_usage_records(student_id, comic_id)
  WHERE status IN ('reserved','completed');
DROP TRIGGER IF EXISTS trg_comic_usage_updated_at ON public.comic_usage_records;
CREATE TRIGGER trg_comic_usage_updated_at BEFORE UPDATE ON public.comic_usage_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================================
-- 5. 감사 로그 (복구/해제/설정 변경)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.quota_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  comic_id text,
  reservation_id uuid,
  action text NOT NULL,
  before_status text,
  after_status text,
  actor_id uuid NOT NULL,
  reason text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quota_audit_student ON public.quota_audit_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_quota_audit_actor ON public.quota_audit_logs(actor_id);

-- =====================================================================
-- 6. RLS 정책
-- =====================================================================
ALTER TABLE public.class_generation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_quota_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comic_usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quota_audit_logs ENABLE ROW LEVEL SECURITY;

-- 헬퍼: 호출자가 해당 학생의 담당 교사인가
CREATE OR REPLACE FUNCTION public.is_student_teacher(p_student_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = p_student_id
      AND (s.created_by = auth.uid()
           OR s.class_id IN (SELECT id FROM public.classes WHERE teacher_id = auth.uid()))
  ) OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('super_admin','middle_admin','org_admin')
  );
$$;

-- class_generation_settings: 교사는 본인 소유 학급만 / 관리자 전체
DROP POLICY IF EXISTS class_gen_settings_teacher_own ON public.class_generation_settings;
CREATE POLICY class_gen_settings_teacher_own ON public.class_generation_settings
  FOR ALL USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());
DROP POLICY IF EXISTS class_gen_settings_admin_all ON public.class_generation_settings;
CREATE POLICY class_gen_settings_admin_all ON public.class_generation_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','middle_admin','org_admin'))
  );

-- student_quota_overrides
DROP POLICY IF EXISTS student_quota_overrides_teacher_own ON public.student_quota_overrides;
CREATE POLICY student_quota_overrides_teacher_own ON public.student_quota_overrides
  FOR ALL USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());
DROP POLICY IF EXISTS student_quota_overrides_admin_all ON public.student_quota_overrides;
CREATE POLICY student_quota_overrides_admin_all ON public.student_quota_overrides
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','middle_admin','org_admin'))
  );

-- comic_usage_records: 학생 본인 또는 담당 교사/관리자
DROP POLICY IF EXISTS comic_usage_self ON public.comic_usage_records;
CREATE POLICY comic_usage_self ON public.comic_usage_records
  FOR ALL USING (student_id = auth.uid() OR public.is_student_teacher(student_id))
  WITH CHECK (student_id = auth.uid() OR public.is_student_teacher(student_id));

-- quota_audit_logs: 읽기는 본인/담당교사/관리자, 쓰기는 RPC(SECRET 호출에서는 RLS 통과)
DROP POLICY IF EXISTS quota_audit_read ON public.quota_audit_logs;
CREATE POLICY quota_audit_read ON public.quota_audit_logs
  FOR SELECT USING (student_id = auth.uid() OR public.is_student_teacher(student_id));

-- =====================================================================
-- 7. 월/연 도우미 (한국 시간)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.kst_year()
RETURNS integer LANGUAGE sql STABLE AS $$
  SELECT extract(year from timezone('Asia/Seoul', now()))::integer;
$$;
CREATE OR REPLACE FUNCTION public.kst_month()
RETURNS integer LANGUAGE sql STABLE AS $$
  SELECT extract(month from timezone('Asia/Seoul', now()))::integer;
$$;

-- =====================================================================
-- 8. 학생 한도 상태 조회 (lazy 월 계산)
-- =====================================================================
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

  v_final := v_class_base + v_class_extra + v_student_extra;

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
    'completed', v_completed,
    'reserved', v_reserved,
    'remaining', GREATEST(v_final - v_completed - v_reserved, 0),
    'year', v_y, 'month', v_m
  );
END;
$$;

-- =====================================================================
-- 9. 예약 (원자, idempotent)
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
  SELECT COALESCE(p_class_id, v_class_id) INTO v_class
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

-- =====================================================================
-- 10. 완료 확정 (완성 만화책 저장 시점)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.confirm_comic_completion(
  p_student_id uuid, p_comic_id text
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_id uuid; v_count integer;
BEGIN
  IF p_student_id IS NULL OR p_comic_id IS NULL THEN RAISE EXCEPTION 'INVALID_ARGUMENT'; END IF;
  IF p_student_id <> auth.uid() AND NOT public.is_student_teacher(p_student_id) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  UPDATE public.comic_usage_records
     SET status = 'completed', completed_at = now()
   WHERE student_id = p_student_id AND comic_id = p_comic_id AND status = 'reserved'
   RETURNING id INTO v_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN json_build_object('ok', true, 'id', v_id, 'updated', v_count);
END;
$$;

-- =====================================================================
-- 11. 예약 해제 (실패/취소)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.release_comic_reservation(
  p_student_id uuid, p_comic_id text, p_reason text DEFAULT NULL
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_id uuid; v_count integer;
BEGIN
  IF p_student_id <> auth.uid() AND NOT public.is_student_teacher(p_student_id) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  UPDATE public.comic_usage_records
     SET status = 'released', released_at = now(), release_reason = p_reason
   WHERE student_id = p_student_id AND comic_id = p_comic_id AND status = 'reserved'
   RETURNING id INTO v_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN json_build_object('ok', true, 'id', v_id, 'updated', v_count);
END;
$$;

-- =====================================================================
-- 12. 횟수 복원 (교사/관리자, completed -> restored + 감사)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.restore_comic_quota(
  p_student_id uuid, p_comic_id text, p_reason text
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_row comic_usage_records%ROWTYPE; v_count integer;
BEGIN
  IF NOT public.is_student_teacher(p_student_id) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN RAISE EXCEPTION 'REASON_REQUIRED'; END IF;

  SELECT * INTO v_row FROM public.comic_usage_records
   WHERE student_id = p_student_id AND comic_id = p_comic_id AND status = 'completed'
   ORDER BY completed_at DESC LIMIT 1;
  IF v_row.id IS NULL THEN
    RETURN json_build_object('ok', false, 'message', 'no completed record');
  END IF;

  UPDATE public.comic_usage_records
     SET status = 'restored'
   WHERE id = v_row.id;

  INSERT INTO public.quota_audit_logs
    (student_id, comic_id, reservation_id, action, before_status, after_status, actor_id, reason)
  VALUES (p_student_id, p_comic_id, v_row.id, 'restore', 'completed', 'restored', auth.uid(), p_reason);

  RETURN json_build_object('ok', true, 'restored_id', v_row.id);
END;
$$;

-- =====================================================================
-- 13. 오래된 예약 일괄 해제 (lazy 정리용, 교사/관리자 호출)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.release_stale_reservations(
  p_student_id uuid DEFAULT NULL, p_older_than_days integer DEFAULT 1
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_count integer;
BEGIN
  IF p_student_id IS NOT NULL AND NOT public.is_student_teacher(p_student_id) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  UPDATE public.comic_usage_records
     SET status = 'released', released_at = now(), release_reason = 'stale_auto_release'
   WHERE status = 'reserved'
     AND reserved_at < now() - (p_older_than_days || ' days')::interval
     AND (p_student_id IS NULL OR student_id = p_student_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN json_build_object('ok', true, 'released', v_count);
END;
$$;

-- =====================================================================
-- 14. 기본학급 조회/생성 (teacher_id + grade 별 1개)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_or_create_default_class(
  p_teacher_id uuid, p_grade integer, p_organization_id uuid DEFAULT NULL, p_center_id text DEFAULT NULL
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_existing public.classes%ROWTYPE;
  v_org uuid;
  v_ctr text;
  v_name text;
BEGIN
  IF p_teacher_id IS NULL OR p_grade IS NULL THEN RAISE EXCEPTION 'INVALID_ARGUMENT'; END IF;
  IF p_teacher_id <> auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','org_admin','middle_admin')
  ) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  SELECT * INTO v_existing FROM public.classes
   WHERE teacher_id = p_teacher_id AND grade = p_grade AND is_default = true
   LIMIT 1;
  IF v_existing.id IS NOT NULL THEN
    RETURN json_build_object('ok', true, 'class_id', v_existing.id, 'created', false);
  END IF;

  SELECT COALESCE(p_organization_id, organization_id) INTO v_org
    FROM public.profiles WHERE id = p_teacher_id;
  SELECT COALESCE(p_center_id, center_id) INTO v_ctr
    FROM public.profiles WHERE id = p_teacher_id;
  v_name := p_grade || '학년 기본학급';

  INSERT INTO public.classes
    (organization_id, name, grade, teacher_id, status, is_default, default_grade, student_count)
  VALUES (COALESCE(v_org, p_organization_id), v_name, p_grade, p_teacher_id, 'active', true, p_grade, 0)
  ON CONFLICT DO NOTHING
  RETURNING * INTO v_existing;

  RETURN json_build_object('ok', true, 'class_id', v_existing.id, 'created', true);
END;
$$;

-- =====================================================================
-- 15. 학생을 해당 학년 기본학급에 배정
-- =====================================================================
CREATE OR REPLACE FUNCTION public.assign_student_to_default_class(
  p_student_id uuid, p_grade integer
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_student public.students%ROWTYPE;
  v_teacher uuid;
  v_class json;
  v_grade_text text;
BEGIN
  IF p_student_id IS NULL THEN RAISE EXCEPTION 'INVALID_ARGUMENT'; END IF;
  IF NOT public.is_student_teacher(p_student_id) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF p_grade IS NULL THEN RAISE EXCEPTION 'GRADE_REQUIRED'; END IF;

  SELECT * INTO v_student FROM public.students WHERE id = p_student_id;
  IF v_student.id IS NULL THEN RAISE EXCEPTION 'STUDENT_NOT_FOUND'; END IF;

  v_teacher := v_student.created_by;
  v_class := public.get_or_create_default_class(v_teacher, p_grade, v_student.organization_id, v_student.center_id);

  UPDATE public.students SET class_id = (v_class->>'class_id')::uuid
   WHERE id = p_student_id;

  RETURN json_build_object('ok', true, 'class_id', (v_class->>'class_id')::uuid);
END;
$$;

-- =====================================================================
-- 16. 학급 만화생성 설정 저장 (교사)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.save_class_generation_setting(
  p_class_id uuid, p_base_quota integer, p_extra_quota integer,
  p_extra_duration text
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_teacher uuid;
  v_y integer := public.kst_year();
  v_m integer := public.kst_month();
BEGIN
  IF p_extra_duration NOT IN ('this_month','every_month') THEN RAISE EXCEPTION 'INVALID_DURATION'; END IF;

  SELECT teacher_id INTO v_teacher FROM public.classes WHERE id = p_class_id;
  IF v_teacher IS NULL THEN RAISE EXCEPTION 'CLASS_NOT_FOUND'; END IF;
  IF v_teacher <> auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','org_admin','middle_admin')
  ) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  INSERT INTO public.class_generation_settings
    (class_id, teacher_id, base_quota, extra_quota, extra_duration,
     extra_applied_year, extra_applied_month)
  VALUES (p_class_id, v_teacher, p_base_quota, p_extra_quota, p_extra_duration,
    CASE WHEN p_extra_duration = 'this_month' THEN v_y ELSE NULL END,
    CASE WHEN p_extra_duration = 'this_month' THEN v_m ELSE NULL END)
  ON CONFLICT (class_id) DO UPDATE SET
    base_quota = EXCLUDED.base_quota,
    extra_quota = EXCLUDED.extra_quota,
    extra_duration = EXCLUDED.extra_duration,
    extra_applied_year = CASE WHEN EXCLUDED.extra_duration = 'this_month' THEN v_y ELSE NULL END,
    extra_applied_month = CASE WHEN EXCLUDED.extra_duration = 'this_month' THEN v_m ELSE NULL END,
    teacher_id = EXCLUDED.teacher_id,
    updated_at = now();

  RETURN json_build_object('ok', true);
END;
$$;

-- =====================================================================
-- 17. 학급 설정 조회 + 학급 내 학생 수/총 추가량 요약
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_class_quota_summary(p_class_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_setting class_generation_settings%ROWTYPE;
  v_student_count integer := 0;
  v_total_extra integer := 0;
  v_y integer := public.kst_year();
  v_m integer := public.kst_month();
BEGIN
  SELECT * INTO v_setting FROM public.class_generation_settings WHERE class_id = p_class_id;
  SELECT count(*) INTO v_student_count FROM public.students
   WHERE class_id = p_class_id AND status = 'active';

  -- 학급 추가가 당월 적용이면 학급 전체 추가량 = extra * 학생수
  v_total_extra := CASE
    WHEN v_setting.extra_duration = 'every_month' THEN COALESCE(v_setting.extra_quota,0) * v_student_count
    WHEN v_setting.extra_duration = 'this_month'
         AND v_setting.extra_applied_year = v_y AND v_setting.extra_applied_month = v_m
      THEN COALESCE(v_setting.extra_quota,0) * v_student_count
    ELSE 0
  END;

  RETURN json_build_object(
    'base_quota', COALESCE(v_setting.base_quota, 0),
    'extra_quota', COALESCE(v_setting.extra_quota, 0),
    'extra_duration', COALESCE(v_setting.extra_duration, 'this_month'),
    'student_count', v_student_count,
    'per_student_total', COALESCE(v_setting.base_quota,0)
      + CASE WHEN (v_setting.extra_duration='every_month'
                   OR (v_setting.extra_duration='this_month' AND v_setting.extra_applied_year=v_y AND v_setting.extra_applied_month=v_m))
             THEN COALESCE(v_setting.extra_quota,0) ELSE 0 END,
    'class_total_extra', v_total_extra,
    'class_grand_total', COALESCE(v_setting.base_quota,0) * v_student_count + v_total_extra,
    'has_setting', v_setting.id IS NOT NULL
  );
END;
$$;

-- =====================================================================
-- 18. 학생 개별 추가 횟수 저장 (교사)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.save_student_quota_override(
  p_student_id uuid, p_extra_quota integer, p_extra_duration text, p_reason text DEFAULT NULL
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_teacher uuid;
  v_y integer := public.kst_year();
  v_m integer := public.kst_month();
BEGIN
  IF p_extra_duration NOT IN ('this_month','every_month') THEN RAISE EXCEPTION 'INVALID_DURATION'; END IF;
  IF NOT public.is_student_teacher(p_student_id) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  SELECT created_by INTO v_teacher FROM public.students WHERE id = p_student_id;
  IF v_teacher IS NULL THEN
    SELECT teacher_id INTO v_teacher FROM public.classes c
      JOIN public.students s ON s.class_id = c.id WHERE s.id = p_student_id;
  END IF;

  INSERT INTO public.student_quota_overrides
    (student_id, teacher_id, extra_quota, extra_duration, reason,
     extra_applied_year, extra_applied_month)
  VALUES (p_student_id, COALESCE(v_teacher, auth.uid()), p_extra_quota, p_extra_duration, p_reason,
    CASE WHEN p_extra_duration='this_month' THEN v_y ELSE NULL END,
    CASE WHEN p_extra_duration='this_month' THEN v_m ELSE NULL END)
  ON CONFLICT (student_id) DO UPDATE SET
    extra_quota = EXCLUDED.extra_quota,
    extra_duration = EXCLUDED.extra_duration,
    reason = EXCLUDED.reason,
    extra_applied_year = CASE WHEN EXCLUDED.extra_duration='this_month' THEN v_y ELSE NULL END,
    extra_applied_month = CASE WHEN EXCLUDED.extra_duration='this_month' THEN v_m ELSE NULL END,
    teacher_id = EXCLUDED.teacher_id,
    updated_at = now();

  INSERT INTO public.quota_audit_logs(student_id, action, after_status, actor_id, reason, metadata)
  VALUES (p_student_id, 'override_change', p_extra_duration, auth.uid(), p_reason,
    json_build_object('extra_quota', p_extra_quota));

  RETURN json_build_object('ok', true);
END;
$$;
