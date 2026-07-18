-- 제출 이후 평가 이력이 보존되도록 학생 삭제도 작성 단계로 제한한다.
DROP POLICY IF EXISTS "mindmap_projects_delete_own" ON public.mindmap_projects;
CREATE POLICY "mindmap_projects_delete_own_editable" ON public.mindmap_projects
  FOR DELETE TO authenticated
  USING (student_id = auth.uid() AND status IN ('draft','completed'));
