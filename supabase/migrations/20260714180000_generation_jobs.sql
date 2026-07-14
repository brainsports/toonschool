-- generation_jobs 정식 마이그레이션 (ADDITIVE 전용).
-- 목적: 수동 생성되어 버전 관리에 없던 generation_jobs를 정식으로 관리하고,
--       Edge Function(generate-comic-background) 경로에서 필요한 컬럼/인덱스를 추가.
--
-- 안전 규칙 (운영 데이터 보존):
--  - CREATE TABLE IF NOT EXISTS: 신규 설치에만 스키마 생성. 기존 테이블은 변경하지 않음.
--  - ALTER TABLE ADD COLUMN IF NOT EXISTS: 기존 테이블에 컬럼만 추가.
--  - CREATE INDEX IF NOT EXISTS: 인덱스만 추가.
--  - DROP / RENAME / ALTER TYPE / TRUNCATE / DELETE 일절 없음.
--  - 기존 행/데이터는 전혀 건드리지 않음.

CREATE TABLE IF NOT EXISTS public.generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text,
  cut_number integer,
  prompt_data jsonb,
  status text DEFAULT 'queued',
  result_url text,
  retry_count integer DEFAULT 0,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  elapsed_ms integer,
  -- 신규 컬럼(EF 경로용): 생성자 추적/RLS, idempotency, 요청 추적, 스타일
  user_id uuid,
  cache_key text,
  request_id text,
  style_key text
);

COMMENT ON TABLE public.generation_jobs IS '만화 배경 이미지 생성 작업 큐/이력 (Edge Function generate-comic-background + 기존 워커 경로 공용)';

-- 기존(수동 생성) 테이블에도 동일 컬럼이 없으면 추가 (ADD COLUMN IF NOT EXISTS).
ALTER TABLE public.generation_jobs ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.generation_jobs ADD COLUMN IF NOT EXISTS cache_key text;
ALTER TABLE public.generation_jobs ADD COLUMN IF NOT EXISTS request_id text;
ALTER TABLE public.generation_jobs ADD COLUMN IF NOT EXISTS style_key text;

-- 조회 성능 / idempotency / 좀비 정리용 인덱스.
CREATE INDEX IF NOT EXISTS generation_jobs_project_cut_idx ON public.generation_jobs (project_id, cut_number);
CREATE INDEX IF NOT EXISTS generation_jobs_status_started_idx ON public.generation_jobs (status, started_at);
CREATE INDEX IF NOT EXISTS generation_jobs_cache_key_idx ON public.generation_jobs (cache_key);

-- worker_heartbeats 도 수동 생성 상태이므로 정식화(존재하지 않을 때만 생성).
CREATE TABLE IF NOT EXISTS public.worker_heartbeats (
  id text PRIMARY KEY,
  last_seen timestamptz
);
