-- Create enum types if they don't exist
DO $$ BEGIN
    CREATE TYPE resource_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE resource_importance AS ENUM ('normal', 'important', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. admin_resources table
CREATE TABLE IF NOT EXISTS public.admin_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    file_name TEXT,
    file_size BIGINT,
    file_type TEXT,
    target_role TEXT NOT NULL CHECK (target_role IN ('all', 'middle_admin', 'org_admin', 'teacher', 'student')),
    status resource_status DEFAULT 'published',
    importance resource_importance DEFAULT 'normal',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.admin_resources ENABLE ROW LEVEL SECURITY;

-- Policies for admin_resources
DROP POLICY IF EXISTS "Anyone can view published resources based on role" ON public.admin_resources;
CREATE POLICY "Anyone can view published resources based on role" ON public.admin_resources
FOR SELECT USING (
    deleted_at IS NULL
);

DROP POLICY IF EXISTS "Authenticated users can insert admin resources" ON public.admin_resources;
CREATE POLICY "Authenticated users can insert admin resources" ON public.admin_resources
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update admin resources" ON public.admin_resources;
CREATE POLICY "Authenticated users can update admin resources" ON public.admin_resources
FOR UPDATE USING (auth.role() = 'authenticated');

-- 2. resource_read_status table
CREATE TABLE IF NOT EXISTS public.resource_read_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id UUID REFERENCES public.admin_resources(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(resource_id, user_id)
);

ALTER TABLE public.resource_read_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own read status" ON public.resource_read_status;
CREATE POLICY "Users can view their own read status" ON public.resource_read_status
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own read status" ON public.resource_read_status;
CREATE POLICY "Users can insert their own read status" ON public.resource_read_status
FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 3. Storage bucket for admin-resources
INSERT INTO storage.buckets (id, name, public) 
VALUES ('admin-resources', 'admin-resources', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for storage.objects
DROP POLICY IF EXISTS "Anyone can download admin-resources" ON storage.objects;
CREATE POLICY "Anyone can download admin-resources" ON storage.objects
FOR SELECT USING (bucket_id = 'admin-resources');

DROP POLICY IF EXISTS "Authenticated users can upload admin-resources" ON storage.objects;
CREATE POLICY "Authenticated users can upload admin-resources" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'admin-resources' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update admin-resources" ON storage.objects;
CREATE POLICY "Authenticated users can update admin-resources" ON storage.objects
FOR UPDATE USING (bucket_id = 'admin-resources' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete admin-resources" ON storage.objects;
CREATE POLICY "Authenticated users can delete admin-resources" ON storage.objects
FOR DELETE USING (bucket_id = 'admin-resources' AND auth.role() = 'authenticated');
