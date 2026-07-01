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

async function run() {
  const email = 'student@test.com';
  const password = 'Test1234!';
  
  // Try to sign in to check if exists
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  let userId = signInData?.user?.id;

  if (signInError) {
    console.log('SignIn Error:', signInError.message);
    if (signInError.message.includes('Invalid login credentials')) {
      // It exists but wrong password or doesn't exist
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) {
        console.log('SignUp error (maybe user exists?):', signUpError.message);
      } else {
        console.log('Created user:', signUpData.user?.email);
        userId = signUpData.user?.id;
      }
    }
  } else {
    console.log('User already exists and logged in with correct password.');
  }

  // Update profile
  if (userId) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        role: 'student',
        // Also add student info to profiles or separate table if it exists
      })
      .eq('id', userId);
      
    if (profileError) {
      console.log('Profile update error (may not exist yet, trying insert):', profileError.message);
      await supabase.from('profiles').insert({
        id: userId,
        email,
        role: 'student'
      });
    } else {
      console.log('Profile updated to student.');
    }

    // Now what about student info? Is there a students table? 
    // Let's check tables.
    const { data: tablesData, error: tablesError } = await supabase.from('students').select('*').limit(1);
    if (tablesError) {
      console.log('students table error (might not exist):', tablesError.message);
      // Wait, let's check `users` or similar. Maybe we just need to put it in profiles?
    } else {
      console.log('students table exists, updating info...');
      const studentInfo = {
        id: userId, // Assuming relation by ID
        name: '김학생',
        grade: 5,
        class_name: '5학년 1반', // or classId
        institution_name: '행복지역아동센터',
      };
      const { error: stuError } = await supabase.from('students').upsert(studentInfo);
      console.log('students update error:', stuError?.message || 'Success');
    }
  }
}

run().catch(console.error);
