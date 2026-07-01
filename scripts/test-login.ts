import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = Object.fromEntries(
  envContent.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const idx = line.indexOf('=');
      return [line.slice(0, idx), line.slice(idx + 1)];
    })
);

const supabaseUrl = envVars['VITE_SUPABASE_URL'] || '';
const supabaseKey = envVars['VITE_SUPABASE_ANON_KEY'] || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'student@test.com',
    password: 'Test1234!'
  });

  if (error) {
    console.error('로그인 실패:', error.message);
  } else {
    console.log('로그인 성공! 유저 ID:', data.user.id);
    
    // 역할 확인
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
    console.log('프로필 역할:', profile?.role);

    // 학생 정보 확인
    const { data: student } = await supabase.from('students').select('*').eq('id', data.user.id).single();
    console.log('학생 테이블 정보 이름:', student?.name, ', 학년:', student?.grade);
  }
}

testLogin();
