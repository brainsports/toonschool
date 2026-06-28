import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (key) => {
  const match = env.match(new RegExp(key + '=(.*)'));
  return match ? match[1].trim() : '';
};

const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

async function check() {
  const tables = ['student_works', 'scripts', 'user_works', 'works'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(t, '-> Error:', error.message);
    } else {
      console.log(t, '-> Exists! Columns:', data.length > 0 ? Object.keys(data[0]) : 'Empty table');
    }
  }
}
check();
