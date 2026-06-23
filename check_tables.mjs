import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (key) => {
  const match = env.match(new RegExp(key + '=(.*)'));
  return match ? match[1].trim() : '';
};

const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

async function check() {
  const { data, error } = await supabase.rpc('get_tables');
  if(error) {
    console.log('RPC error, trying to select from a non-existent table just to get schema cache if possible? No.');
    // alternative: fetch information_schema if we have access, normally anon key doesn't.
  }
  console.log(data);
}
check();
