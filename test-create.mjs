import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf-8') + '\n' + fs.readFileSync('.env', 'utf-8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const url = urlMatch[1].trim();
const key = keyMatch[1].trim();

const supabase = createClient(url, key);

async function main() {
  // 1. Login as teacher
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'teacher@test.com',
    password: 'Test1234!'
  });

  if (authError) {
    console.error('Login failed:', authError.message);
    return;
  }
  console.log('Logged in as:', authData.user.id);

  // 2. Invoke create-student
  console.log('Invoking create-student edge function...');
  const { data, error } = await supabase.functions.invoke('create-student', {
    body: {
      loginId: `testuser_${Date.now()}`,
      name: 'Test Student',
      password: 'Test1234!',
      classId: null,
      className: '',
      grade: 5,
      number: 1
    }
  });

  console.log('Invoke result:', { data, error });
}

main();
