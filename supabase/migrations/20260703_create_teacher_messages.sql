-- 선생님 말씀 테이블 생성 SQL
-- 이 파일을 Supabase SQL Editor에 복사하여 실행해 주세요.

CREATE TABLE IF NOT EXISTS public.teacher_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_key TEXT NOT NULL,
    teacher_id UUID REFERENCES auth.users(id),
    center_id TEXT,
    title TEXT,
    content TEXT NOT NULL,
    message_date DATE NOT NULL,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS 활성화
ALTER TABLE public.teacher_messages ENABLE ROW LEVEL SECURITY;

-- 조회 정책: 누구나 읽을 수 있음
CREATE POLICY "Enable read access for all users" 
ON public.teacher_messages FOR SELECT 
USING (true);

-- 생성 정책: 로그인한 사용자만
CREATE POLICY "Enable insert access for authenticated users" 
ON public.teacher_messages FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- 수정/삭제 정책: 작성자만
CREATE POLICY "Enable update access for users based on teacher_id" 
ON public.teacher_messages FOR UPDATE 
USING (auth.uid() = teacher_id);

CREATE POLICY "Enable delete access for users based on teacher_id" 
ON public.teacher_messages FOR DELETE 
USING (auth.uid() = teacher_id);
