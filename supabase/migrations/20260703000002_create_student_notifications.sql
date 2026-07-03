-- Create student_notifications table
CREATE TABLE student_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_key text NOT NULL,
  sender_id uuid,
  sender_role text DEFAULT 'teacher',
  category text NOT NULL DEFAULT 'notice',
  title text NOT NULL,
  content text NOT NULL,
  notice_date date NOT NULL DEFAULT current_date,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Comments
COMMENT ON TABLE student_notifications IS 'Notifications sent to students by teachers or admins.';
COMMENT ON COLUMN student_notifications.target_key IS 'Target identifier like class-5, all-grades, center-id, etc.';
COMMENT ON COLUMN student_notifications.category IS 'Type of notification: notice, learning, event, mission, etc.';

-- Enable RLS
ALTER TABLE student_notifications ENABLE ROW LEVEL SECURITY;

-- Create Policies (Development policies: allow all authenticated users to select/insert/update/delete)
CREATE POLICY "Enable read access for all authenticated users" 
ON student_notifications FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" 
ON student_notifications FOR INSERT 
TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" 
ON student_notifications FOR UPDATE 
TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" 
ON student_notifications FOR DELETE 
TO authenticated USING (true);

-- Index for faster retrieval by target_key and notice_date
CREATE INDEX student_notifications_target_idx ON student_notifications(target_key);
CREATE INDEX student_notifications_date_idx ON student_notifications(notice_date DESC);
