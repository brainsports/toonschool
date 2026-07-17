-- 마인드맵 에디터: mindmap_projects 테이블 + RLS + 공개 공유 뷰.
--
-- 규칙(기존 additive 마이그레이션과 동일):
--  - CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS / CREATE INDEX IF NOT EXISTS
--  - DROP · RENAME · ALTER TYPE · TRUNCATE · DELETE 일절 없음.
--  - 기존 행/데이터/운영 테이블에 전혀 영향을 주지 않는다.
--
-- 이 마이그레이션은 "파일만 작성"하고 운영 Supabase 에는 적용하지 않는다.
-- 로컬 검증은 localStorage 영속층(mindmapService)으로 수행한다.

CREATE TABLE IF NOT EXISTS public.mindmap_projects (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      uuid NOT NULL,
  organization_id uuid,
  class_id        uuid,
  student_name    text,

  title           text NOT NULL DEFAULT '제목 없는 마인드맵',
  grade           integer NOT NULL DEFAULT 1,
  grade_name      text,
  subject         text NOT NULL DEFAULT '',
  subject_code    text,
  semester        integer NOT NULL DEFAULT 1,
  unit_id         text NOT NULL DEFAULT '',
  unit_title      text NOT NULL DEFAULT '',

  central_topic   text NOT NULL DEFAULT '',
  theme_id        text NOT NULL DEFAULT 'pastel',
  layout_type     text NOT NULL DEFAULT 'radial',
  status          text NOT NULL DEFAULT 'draft',

  -- 노드/연결선 데이터(JSONB). AI 가 고정 이미지가 아닌 데이터를 생성·편집.
  nodes           jsonb NOT NULL DEFAULT '[]'::jsonb,
  edges           jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- 썸네일/공유 대표 이미지는 data URL 인라인 저장(Storage 버킷 의존 최소화).
  thumbnail_url         text,
  share_thumbnail_url   text,

  -- 친구 공유
  share_slug        text UNIQUE,
  is_public         boolean NOT NULL DEFAULT false,
  shared_at         timestamptz,
  share_revoked_at  timestamptz,

  version           integer NOT NULL DEFAULT 1,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT mindmap_projects_layout_chk CHECK (layout_type IN ('radial','tree')),
  CONSTRAINT mindmap_projects_status_chk CHECK (status IN ('draft','completed'))
);

CREATE INDEX IF NOT EXISTS idx_mindmap_projects_student
  ON public.mindmap_projects(student_id);
CREATE INDEX IF NOT EXISTS idx_mindmap_projects_class
  ON public.mindmap_projects(class_id);
CREATE INDEX IF NOT EXISTS idx_mindmap_projects_share_slug
  ON public.mindmap_projects(share_slug);

COMMENT ON TABLE public.mindmap_projects IS '학생 마인드맵 작품. 노드/연결선은 JSONB 로 편집 가능한 데이터로 저장.';

-- updated_at 자동 갱신.
CREATE OR REPLACE FUNCTION public.set_mindmap_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.version = COALESCE(OLD.version, 0) + 1;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mindmap_projects_updated_at ON public.mindmap_projects;
CREATE TRIGGER trg_mindmap_projects_updated_at
  BEFORE UPDATE ON public.mindmap_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_mindmap_updated_at();

-- ============================================================================
-- RLS
-- ============================================================================
ALTER TABLE public.mindmap_projects ENABLE ROW LEVEL SECURITY;

-- 학생: 본인 작품 SELECT / INSERT / UPDATE / DELETE.
DROP POLICY IF EXISTS "mindmap_projects_select_own" ON public.mindmap_projects;
CREATE POLICY "mindmap_projects_select_own" ON public.mindmap_projects
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    -- 담당 교사: 본인 반 학생 작품 조회(created_by 또는 classes.teacher_id 기반).
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = mindmap_projects.student_id
      AND (
        s.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = s.class_id AND c.teacher_id = auth.uid())
      )
    )
    -- 공개 공유 작품(인증 사용자도 볼 수 있음). 비공개 컬럼 보호는 별도 뷰로 분리.
    OR (is_public = true AND share_revoked_at IS NULL)
  );

DROP POLICY IF EXISTS "mindmap_projects_insert_own" ON public.mindmap_projects;
CREATE POLICY "mindmap_projects_insert_own" ON public.mindmap_projects
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "mindmap_projects_update_own" ON public.mindmap_projects;
CREATE POLICY "mindmap_projects_update_own" ON public.mindmap_projects
  FOR UPDATE TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "mindmap_projects_delete_own" ON public.mindmap_projects;
CREATE POLICY "mindmap_projects_delete_own" ON public.mindmap_projects
  FOR DELETE TO authenticated
  USING (student_id = auth.uid());

-- ============================================================================
-- 공개 공유 전용 뷰(개인정보 최소화).
--  - share_slug 로 누구나(비로그인 포함) 읽기 전용 열람 가능.
--  - 학생 ID · 이메일 · 학급명 · 기관명 · 교사 정보 · 내부 관리 컬럼은 노출하지 않는다.
--  - is_public=false 이거나 공유 중지(share_revoked_at)된 작품은 보이지 않는다.
-- ============================================================================
CREATE OR REPLACE VIEW public.mindmap_public_shares AS
SELECT
  id, share_slug, title, subject, unit_title, central_topic,
  theme_id, layout_type, student_name, nodes, edges,
  share_thumbnail_url, created_at
FROM public.mindmap_projects
WHERE is_public = true AND share_revoked_at IS NULL;

GRANT SELECT ON public.mindmap_public_shares TO anon, authenticated;
