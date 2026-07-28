-- =====================================================================
-- 20260729100000_create_get_public_mindmap_share_rpc.sql
-- 1단계: 공개 공유 전용 SECURITY DEFINER RPC 함수 생성
-- (기존 public.mindmap_public_shares 뷰 및 mindmap_projects 권한은 유지)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.get_public_mindmap_share(p_slug text)
RETURNS TABLE (
  id uuid,
  share_slug text,
  title text,
  subject text,
  unit_title text,
  central_topic text,
  theme_id text,
  layout_type text,
  student_name text,
  nodes jsonb,
  edges jsonb,
  share_thumbnail_url text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT
    p.id,
    p.share_slug,
    p.title,
    p.subject,
    p.unit_title,
    p.central_topic,
    p.theme_id,
    p.layout_type,
    p.student_name,
    p.nodes,
    p.edges,
    p.share_thumbnail_url,
    p.created_at
  FROM public.mindmap_projects p
  WHERE p.share_slug = p_slug
    AND p.is_public = true
    AND p.share_revoked_at IS NULL
  LIMIT 1;
$$;

-- PUBLIC 기본 권한 취수 후 anon, authenticated 명시적 실행 권한 부여
REVOKE ALL ON FUNCTION public.get_public_mindmap_share(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_mindmap_share(text) TO anon, authenticated;
