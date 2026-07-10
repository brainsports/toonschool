-- Allow teachers and organization administrators to read students in their own scope.
-- This keeps RLS enabled and only broadens SELECT to matching center/organization rows.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'students'
      AND policyname = 'students_select_by_staff_scope'
  ) THEN
    CREATE POLICY students_select_by_staff_scope
      ON public.students
      FOR SELECT
      USING (
        id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.id = auth.uid()
            AND (
              p.role = 'super_admin'
              OR (
                p.role IN ('org_admin', 'teacher')
                AND p.organization_id IS NOT NULL
                AND students.organization_id = p.organization_id
              )
              OR (
                p.center_id IS NOT NULL
                AND students.center_id = p.center_id
              )
            )
        )
      );
  END IF;
END $$;
