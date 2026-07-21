-- =====================================================================
-- 20260721120000_create_student_vocabulary_words.sql
-- 학생별 툰어휘사전 단어장 저장 테이블 (additive / idempotent)
-- =====================================================================
-- 목적:
--   - 툰어휘사전에서 학생이 '저장하기'한 단어를 학생별로 영구 저장.
--   - 마이페이지 '나의 단어장'(/student/vocabulary)에서 다시 확인.
--
-- 정책:
--   - 동일 학생 + 동일 단어(normalized_word 기준)는 중복 행 없이 갱신(upsert).
--   - 학생 본인만 자신의 단어를 저장/조회/수정/삭제(RLS).
--
-- 적용 전제:
--   - public.profiles 테이블이 운영에 이미 존재(profiles.id = auth.users.id).
--   - 모두 IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS 이므로 여러 번 실행해 안전.
--   - DROP · RENAME · ALTER TYPE · TRUNCATE · DELETE 일절 없음.
-- =====================================================================

-- updated_at 자동 갱신 트리거 함수(프로젝트 표준 패턴).
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 단어장 테이블
CREATE TABLE IF NOT EXISTS public.student_vocabulary_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  word text NOT NULL,
  normalized_word text NOT NULL,
  part_of_speech text,
  dictionary_definition text,
  easy_definition text,
  daily_example text,
  subject_example text,
  summary text,
  source_type text,
  source_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT student_vocabulary_words_student_word_unique UNIQUE (student_id, normalized_word)
);

-- 코멘트
COMMENT ON TABLE public.student_vocabulary_words IS '학생별 툰어휘사전 저장 단어(나의 단어장).';
COMMENT ON COLUMN public.student_vocabulary_words.normalized_word IS '공백/대소문자 정규화한 단어. 중복 저장 판별 기준(student_id + normalized_word 유일).';
COMMENT ON COLUMN public.student_vocabulary_words.source_type IS '저장 출처: mindmap_start | mindmap_editor | comic_editor (nullable).';
COMMENT ON COLUMN public.student_vocabulary_words.source_id IS '마인드맵/만화 작품 ID. 시작 화면처럼 작업물이 없으면 null.';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_student_vocabulary_words_student_updated
ON public.student_vocabulary_words(student_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_student_vocabulary_words_student_word
ON public.student_vocabulary_words(student_id, normalized_word);

-- updated_at 자동 갱신 트리거
DROP TRIGGER IF EXISTS trg_student_vocabulary_words_set_updated_at ON public.student_vocabulary_words;
CREATE TRIGGER trg_student_vocabulary_words_set_updated_at
BEFORE UPDATE ON public.student_vocabulary_words
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS 활성화
ALTER TABLE public.student_vocabulary_words ENABLE ROW LEVEL SECURITY;

-- SELECT: 본인만
DROP POLICY IF EXISTS "student_vocabulary_words_select_own" ON public.student_vocabulary_words;
CREATE POLICY "student_vocabulary_words_select_own"
ON public.student_vocabulary_words
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- INSERT: 본인만
DROP POLICY IF EXISTS "student_vocabulary_words_insert_own" ON public.student_vocabulary_words;
CREATE POLICY "student_vocabulary_words_insert_own"
ON public.student_vocabulary_words
FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());

-- UPDATE: 본인만
DROP POLICY IF EXISTS "student_vocabulary_words_update_own" ON public.student_vocabulary_words;
CREATE POLICY "student_vocabulary_words_update_own"
ON public.student_vocabulary_words
FOR UPDATE
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- DELETE: 본인만
DROP POLICY IF EXISTS "student_vocabulary_words_delete_own" ON public.student_vocabulary_words;
CREATE POLICY "student_vocabulary_words_delete_own"
ON public.student_vocabulary_words
FOR DELETE
TO authenticated
USING (student_id = auth.uid());
