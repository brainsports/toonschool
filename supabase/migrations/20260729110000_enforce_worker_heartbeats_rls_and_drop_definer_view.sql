-- =====================================================================
-- 20260729110000_enforce_worker_heartbeats_rls_and_drop_definer_view.sql
-- 6단계/7단계: worker_heartbeats RLS 활성화 & anon 권한 차단 & 기존 Definer View 삭제
-- =====================================================================

-- 1. worker_heartbeats : RLS 활성화 및 외부(anon, authenticated, PUBLIC) 접근 완전 차단
ALTER TABLE public.worker_heartbeats ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.worker_heartbeats FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "worker_heartbeats_all_anon" ON public.worker_heartbeats;
DROP POLICY IF EXISTS "worker_heartbeats_all_policy" ON public.worker_heartbeats;

-- service_role 은 RLS를 바이패스하여 하트비트를 자유롭게 upsert 합니다.


-- 2. mindmap_projects : 외부 anon 직접 접근 차단
REVOKE ALL ON TABLE public.mindmap_projects FROM anon;

-- authenticated 사용자의 기존 RLS 및 조작 권한은 유지됩니다.


-- 3. Security Definer View 원인 제거 : 기존 뷰 삭제 (RPC get_public_mindmap_share 로 대체 완료)
DROP VIEW IF EXISTS public.mindmap_public_shares;
