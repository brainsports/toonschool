import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
(async () => {
  const res = await supabase.from('middle_admins').select('*, profiles:profile_id(name, email)').limit(1);
  console.log(JSON.stringify(res, null, 2));
})();
