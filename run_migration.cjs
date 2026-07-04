const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({path:'.env.local'});
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const {data: orgs} = await supabase.from('organizations').select('*').limit(1);
  console.log('Organizations columns:', orgs ? Object.keys(orgs[0] || {}) : 'no data');
  
  const {data: allocs} = await supabase.from('license_allocations').select('*').limit(1);
  console.log('License allocations columns:', allocs ? Object.keys(allocs[0] || {}) : 'no data');
}
run();
const fs = require('fs'); const sql = fs.readFileSync('supabase/migrations/20260704110000_add_license_dates_to_organizations.sql', 'utf8'); async function runMig() { const { error } = await supabase.rpc('exec_sql', { sql_string: sql }); if (error) console.log('RPC error, trying normal query'); const {error:e2} = await supabase.from('organizations').select('*').limit(1); console.log(e2); } runMig();
