-- 학생 마인드맵 제출·평가·버전·피드백·보상 시스템.
-- 기존 mindmap_projects와 reward_logs를 확장하며 기존 작품/보상 행은 보존한다.

ALTER TABLE public.mindmap_projects
  DROP CONSTRAINT IF EXISTS mindmap_projects_status_chk;

ALTER TABLE public.mindmap_projects
  ADD COLUMN IF NOT EXISTS creation_method text NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS evaluated_at timestamptz,
  ADD COLUMN IF NOT EXISTS resubmitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS revision_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_render_ok boolean NOT NULL DEFAULT true;

ALTER TABLE public.mindmap_projects
  ADD CONSTRAINT mindmap_projects_status_chk CHECK (
    status IN ('draft','completed','submitted','pending_review','evaluated','revision_requested','resubmitted')
  ),
  ADD CONSTRAINT mindmap_projects_creation_method_chk CHECK (creation_method IN ('direct','ai')),
  ADD CONSTRAINT mindmap_projects_revision_count_chk CHECK (revision_count >= 0);

CREATE INDEX IF NOT EXISTS idx_mindmap_projects_teacher_queue
  ON public.mindmap_projects(class_id, status, submitted_at DESC);

CREATE TABLE IF NOT EXISTS public.mindmap_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mindmap_id uuid NOT NULL REFERENCES public.mindmap_projects(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  version integer NOT NULL,
  title text NOT NULL,
  central_topic text NOT NULL,
  nodes jsonb NOT NULL,
  edges jsonb NOT NULL DEFAULT '[]'::jsonb,
  thumbnail_url text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mindmap_id, version)
);

CREATE TABLE IF NOT EXISTS public.mindmap_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mindmap_id uuid NOT NULL REFERENCES public.mindmap_projects(id) ON DELETE CASCADE,
  version integer NOT NULL,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  class_id uuid,
  status text NOT NULL DEFAULT 'evaluated',
  understanding_score integer NOT NULL DEFAULT 0,
  connection_score integer NOT NULL DEFAULT 0,
  detail_score integer NOT NULL DEFAULT 0,
  accuracy_score integer NOT NULL DEFAULT 0,
  presentation_score integer NOT NULL DEFAULT 0,
  total_score integer GENERATED ALWAYS AS (
    understanding_score + connection_score + detail_score + accuracy_score + presentation_score
  ) STORED,
  teacher_feedback text NOT NULL DEFAULT '',
  node_feedback jsonb NOT NULL DEFAULT '[]'::jsonb,
  excellent_praise boolean NOT NULL DEFAULT false,
  evaluated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mindmap_id, version),
  CONSTRAINT mindmap_evaluations_status_chk CHECK (status IN ('evaluated','revision_requested')),
  CONSTRAINT mindmap_evaluations_understanding_chk CHECK (understanding_score BETWEEN 0 AND 20),
  CONSTRAINT mindmap_evaluations_connection_chk CHECK (connection_score BETWEEN 0 AND 20),
  CONSTRAINT mindmap_evaluations_detail_chk CHECK (detail_score BETWEEN 0 AND 20),
  CONSTRAINT mindmap_evaluations_accuracy_chk CHECK (accuracy_score BETWEEN 0 AND 20),
  CONSTRAINT mindmap_evaluations_presentation_chk CHECK (presentation_score BETWEEN 0 AND 20),
  CONSTRAINT mindmap_evaluations_node_feedback_chk CHECK (jsonb_typeof(node_feedback) = 'array')
);

CREATE INDEX IF NOT EXISTS idx_mindmap_versions_student ON public.mindmap_versions(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mindmap_evaluations_student ON public.mindmap_evaluations(student_id, evaluated_at DESC);
CREATE INDEX IF NOT EXISTS idx_mindmap_evaluations_teacher ON public.mindmap_evaluations(teacher_id, evaluated_at DESC);

ALTER TABLE public.reward_logs ADD COLUMN IF NOT EXISTS points integer;

CREATE OR REPLACE FUNCTION public.is_assigned_mindmap_teacher(p_student_id uuid, p_class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.id = p_student_id
      AND (
        s.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.classes c
          WHERE c.id = COALESCE(p_class_id, s.class_id)
            AND c.teacher_id = auth.uid()
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.is_assigned_mindmap_teacher(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_assigned_mindmap_teacher(uuid, uuid) TO authenticated;

ALTER TABLE public.mindmap_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mindmap_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mindmap_projects_select_own" ON public.mindmap_projects;
CREATE POLICY "mindmap_projects_select_scoped" ON public.mindmap_projects
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR public.is_assigned_mindmap_teacher(student_id, class_id)
    OR (is_public = true AND share_revoked_at IS NULL)
  );

DROP POLICY IF EXISTS "mindmap_projects_update_own" ON public.mindmap_projects;
CREATE POLICY "mindmap_projects_update_own_editable" ON public.mindmap_projects
  FOR UPDATE TO authenticated
  USING (student_id = auth.uid() AND status IN ('draft','completed','revision_requested'))
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "mindmap_versions_select_scoped" ON public.mindmap_versions;
CREATE POLICY "mindmap_versions_select_scoped" ON public.mindmap_versions
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.mindmap_projects p
      WHERE p.id = mindmap_versions.mindmap_id
        AND public.is_assigned_mindmap_teacher(p.student_id, p.class_id)
    )
  );

DROP POLICY IF EXISTS "mindmap_versions_insert_own" ON public.mindmap_versions;
CREATE POLICY "mindmap_versions_insert_own" ON public.mindmap_versions
  FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "mindmap_evaluations_select_scoped" ON public.mindmap_evaluations;
CREATE POLICY "mindmap_evaluations_select_scoped" ON public.mindmap_evaluations
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR (teacher_id = auth.uid() AND public.is_assigned_mindmap_teacher(student_id, class_id))
  );

DROP POLICY IF EXISTS "mindmap_evaluations_insert_teacher" ON public.mindmap_evaluations;
CREATE POLICY "mindmap_evaluations_insert_teacher" ON public.mindmap_evaluations
  FOR INSERT TO authenticated
  WITH CHECK (
    teacher_id = auth.uid()
    AND public.is_assigned_mindmap_teacher(student_id, class_id)
  );

DROP POLICY IF EXISTS "mindmap_evaluations_update_teacher" ON public.mindmap_evaluations;
CREATE POLICY "mindmap_evaluations_update_teacher" ON public.mindmap_evaluations
  FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid() AND public.is_assigned_mindmap_teacher(student_id, class_id))
  WITH CHECK (teacher_id = auth.uid() AND public.is_assigned_mindmap_teacher(student_id, class_id));

CREATE OR REPLACE FUNCTION public.submit_mindmap(p_mindmap_id uuid)
RETURNS public.mindmap_projects
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p public.mindmap_projects;
  next_status text;
BEGIN
  SELECT * INTO p FROM public.mindmap_projects WHERE id = p_mindmap_id FOR UPDATE;
  IF p.id IS NULL OR p.student_id <> auth.uid() THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;
  IF p.status NOT IN ('completed','revision_requested') THEN
    RAISE EXCEPTION 'invalid_status';
  END IF;

  next_status := CASE WHEN p.status = 'revision_requested' THEN 'resubmitted' ELSE 'pending_review' END;
  INSERT INTO public.mindmap_versions(
    mindmap_id, student_id, version, title, central_topic, nodes, edges, thumbnail_url
  ) VALUES (
    p.id, p.student_id, p.version, p.title, p.central_topic, p.nodes, p.edges, p.thumbnail_url
  ) ON CONFLICT (mindmap_id, version) DO NOTHING;

  UPDATE public.mindmap_projects
  SET status = next_status,
      submitted_at = COALESCE(submitted_at, now()),
      resubmitted_at = CASE WHEN next_status = 'resubmitted' THEN now() ELSE resubmitted_at END,
      revision_count = revision_count + CASE WHEN next_status = 'resubmitted' THEN 1 ELSE 0 END
  WHERE id = p.id
  RETURNING * INTO p;

  INSERT INTO public.reward_logs(student_id, reward_type, source_id, points)
  VALUES (
    p.student_id, 'event',
    'mindmap:first-unit:' || COALESCE(NULLIF(p.unit_id, ''), p.unit_title),
    80
  ) ON CONFLICT DO NOTHING;

  IF next_status = 'resubmitted' THEN
    INSERT INTO public.reward_logs(student_id, reward_type, source_id, points)
    VALUES (p.student_id, 'event', 'mindmap:resubmit:' || p.id::text, 20)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN p;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_mindmap(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.save_mindmap_evaluation(
  p_mindmap_id uuid,
  p_status text,
  p_understanding integer,
  p_connection integer,
  p_detail integer,
  p_accuracy integer,
  p_presentation integer,
  p_feedback text,
  p_node_feedback jsonb,
  p_excellent_praise boolean DEFAULT false
)
RETURNS public.mindmap_evaluations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p public.mindmap_projects;
  e public.mindmap_evaluations;
BEGIN
  SELECT * INTO p FROM public.mindmap_projects WHERE id = p_mindmap_id FOR UPDATE;
  IF p.id IS NULL OR NOT public.is_assigned_mindmap_teacher(p.student_id, p.class_id) THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;
  IF p.status NOT IN ('pending_review','resubmitted','submitted') THEN
    RAISE EXCEPTION 'invalid_status';
  END IF;
  IF p_status NOT IN ('evaluated','revision_requested') THEN
    RAISE EXCEPTION 'invalid_evaluation_status';
  END IF;

  INSERT INTO public.mindmap_evaluations(
    mindmap_id, version, student_id, teacher_id, class_id, status,
    understanding_score, connection_score, detail_score, accuracy_score,
    presentation_score, teacher_feedback, node_feedback, excellent_praise,
    evaluated_at, updated_at
  ) VALUES (
    p.id, p.version, p.student_id, auth.uid(), p.class_id, p_status,
    p_understanding, p_connection, p_detail, p_accuracy,
    p_presentation, COALESCE(p_feedback, ''), COALESCE(p_node_feedback, '[]'::jsonb),
    p_excellent_praise, now(), now()
  )
  ON CONFLICT (mindmap_id, version) DO UPDATE SET
    status = EXCLUDED.status,
    understanding_score = EXCLUDED.understanding_score,
    connection_score = EXCLUDED.connection_score,
    detail_score = EXCLUDED.detail_score,
    accuracy_score = EXCLUDED.accuracy_score,
    presentation_score = EXCLUDED.presentation_score,
    teacher_feedback = EXCLUDED.teacher_feedback,
    node_feedback = EXCLUDED.node_feedback,
    excellent_praise = EXCLUDED.excellent_praise,
    evaluated_at = now(),
    updated_at = now()
  RETURNING * INTO e;

  UPDATE public.mindmap_projects
  SET status = p_status, evaluated_at = now()
  WHERE id = p.id;

  IF p_status = 'evaluated' THEN
    INSERT INTO public.reward_logs(student_id, reward_type, source_id, points)
    VALUES (p.student_id, 'event', 'mindmap:evaluated:' || p.id::text, 20)
    ON CONFLICT DO NOTHING;
  END IF;
  IF p_excellent_praise THEN
    INSERT INTO public.reward_logs(student_id, reward_type, source_id, points)
    VALUES (p.student_id, 'event', 'mindmap:excellent:' || p.id::text, 30)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN e;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_mindmap_evaluation(
  uuid,text,integer,integer,integer,integer,integer,text,jsonb,boolean
) TO authenticated;

