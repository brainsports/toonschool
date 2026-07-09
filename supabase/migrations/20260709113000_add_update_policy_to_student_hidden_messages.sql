ALTER TABLE public.student_hidden_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can update own hidden messages"
ON public.student_hidden_messages;

CREATE POLICY "Students can update own hidden messages"
ON public.student_hidden_messages
FOR UPDATE
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());
