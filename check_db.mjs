import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (key) => {
  const match = env.match(new RegExp(key + '=(.*)'));
  return match ? match[1].trim() : '';
};

const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('VITE_SUPABASE_ANON_KEY');

const supabase = createClient(url, key);

async function check() {
  const tables = ['curriculum_units', 'curriculum_subunits', 'learning_topics', 'learning_objectives', 'topics', 'curriculum_topics'];
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
