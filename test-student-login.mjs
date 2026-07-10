import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf-8') + '\n' + fs.readFileSync('.env', 'utf-8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const url = urlMatch[1].trim();
const key = keyMatch[1].trim();

const supabase = createClient(url, key);

async function main() {
  const loginId = 'testuser_1783672314178';
  const password = 'Test1234!';
  
  const loginEmail = loginId.includes('@') ? loginId : `${loginId.toLowerCase()}@student.toonschool.local`;
  
  console.log('Attempting login with:', loginEmail);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: loginEmail,
    password
  });

  if (error) {
    console.error('Login failed:', error.message);
  } else {
    console.log('Login successful! User ID:', data.user.id);
  }
}

main();
