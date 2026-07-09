-- Create student_growth_evaluations table
CREATE TABLE IF NOT EXISTS public.student_growth_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comic_id text NOT NULL,
  unit_id text,
  understanding_score integer NOT NULL DEFAULT 0,
  summary_score integer NOT NULL DEFAULT 0,
  expression_score integer NOT NULL DEFAULT 0,
  thinking_score integer NOT NULL DEFAULT 0,
  completion_score integer NOT NULL DEFAULT 0,
  total_score integer NOT NULL DEFAULT 0,
  strength_feedback text NOT NULL DEFAULT '',
  improvement_feedback text NOT NULL DEFAULT '',
  evaluated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT student_growth_evaluations_understanding_check CHECK (understanding_score >= 0 AND understanding_score <= 20),
  CONSTRAINT student_growth_evaluations_summary_check CHECK (summary_score >= 0 AND summary_score <= 20),
  CONSTRAINT student_growth_evaluations_expression_check CHECK (expression_score >= 0 AND expression_score <= 20),
  CONSTRAINT student_growth_evaluations_thinking_check CHECK (thinking_score >= 0 AND thinking_score <= 20),
  CONSTRAINT student_growth_evaluations_completion_check CHECK (completion_score >= 0 AND completion_score <= 20),
  CONSTRAINT student_growth_evaluations_total_check CHECK (total_score >= 0 AND total_score <= 100),
  CONSTRAINT student_growth_evaluations_student_comic_unique UNIQUE (student_id, comic_id)
);

-- Comments
COMMENT ON TABLE public.student_growth_evaluations IS 'Stores AI evaluations of student comic works.';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_student_growth_evaluations_student_date 
ON public.student_growth_evaluations(student_id, evaluated_at DESC);

CREATE INDEX IF NOT EXISTS idx_student_growth_evaluations_comic 
ON public.student_growth_evaluations(comic_id);

-- Enable RLS
ALTER TABLE public.student_growth_evaluations ENABLE ROW LEVEL SECURITY;

-- Create Policies
DROP POLICY IF EXISTS "student_growth_evaluations_select_own" ON public.student_growth_evaluations;
CREATE POLICY "student_growth_evaluations_select_own"
ON public.student_growth_evaluations
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

DROP POLICY IF EXISTS "student_growth_evaluations_insert_own" ON public.student_growth_evaluations;
CREATE POLICY "student_growth_evaluations_insert_own"
ON public.student_growth_evaluations
FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "student_growth_evaluations_update_own" ON public.student_growth_evaluations;
CREATE POLICY "student_growth_evaluations_update_own"
ON public.student_growth_evaluations
FOR UPDATE
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- Triggers for updated_at (if we decide to add updated_at later, but schema doesn't ask for it, so leaving it out)
