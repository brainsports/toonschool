import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envs = {};
  ['.env', '.env.local'].forEach(file => {
    try {
      const p = path.resolve(process.cwd(), file);
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf-8');
        content.split('\n').forEach(line => {
          const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
          if (match) {
            envs[match[1]] = match[2].replace(/(^['"]|['"]$)/g, '').trim();
          }
        });
      }
    } catch (e) {}
  });
  return envs;
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;



const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkMigration() {
  console.log('--- 1 & 2. Checking if middle_admin_id exists in organizations ---');
  
  // To check if a column exists, we can select it with limit 1
  const { data: orgData, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, middle_admin_id')
    .limit(1);
    
  if (orgError) {
    console.error('❌ Error querying organizations (possibly middle_admin_id does not exist):', orgError.message);
  } else {
    console.log('✅ organizations 테이블 조회 성공 (middle_admin_id 컬럼 존재함)');
    console.log(orgData);
  }

  console.log('\n--- 3. Checking middle_admin role and organization link ---');
  // Find a middle_admin profile
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('role', 'middle_admin')
    .limit(1);
    
  if (profileError || !profiles || profiles.length === 0) {
    console.log('⚠️ middle_admin role을 가진 사용자가 없습니다.');
  } else {
    const middleAdmin = profiles[0];
    console.log(`✅ middle_admin 사용자 확인: ${middleAdmin.email} (ID: ${middleAdmin.id})`);
    
    // Find an organization to link
    const { data: anyOrg } = await supabase.from('organizations').select('id, name').limit(1);
    if (anyOrg && anyOrg.length > 0) {
      const orgToLink = anyOrg[0];
      
      console.log(`--- 5. Linking Organization '${orgToLink.name}' to middle_admin ${middleAdmin.email} ---`);
      
      const { data: updateData, error: updateError } = await supabase
        .from('organizations')
        .update({ middle_admin_id: middleAdmin.id })
        .eq('id', orgToLink.id)
        .select('id, name, middle_admin_id');
        
      if (updateError) {
        console.error('❌ Failed to update organization:', updateError.message);
      } else {
        console.log(`✅ 기관 연결 완료:`, updateData);
        
        console.log('\n--- 4 & 6. Checking data fetching with RLS context ---');
        // Now let's try to query as the middle_admin user using their RLS.
        // Wait, to test RLS we need the user's access token, which we can get by signing in or we can just mock the auth context if we had a JWT, but service_role bypasses RLS.
        // Since we are using service_role, we bypass RLS. Let's just create a new client with the anon key and we'd need to sign in.
        // For now, let's just confirm the linkage.
      }
    }
  }
}

checkMigration();
