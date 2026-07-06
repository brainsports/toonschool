const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  if(line.includes('=')) {
    const [k, v] = line.split('=');
    env[k.trim()] = v.trim();
  }
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function runMig(sql) { 
  const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql }); 
  if (error) {
    console.error('RPC error:', error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

const sql = `
  SELECT
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
  FROM pg_policies
  WHERE tablename = 'profiles';
`;
runMig(sql);
