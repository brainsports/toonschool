import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('1. Logging in as orgadmin@test.com...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'orgadmin@test.com',
    password: 'Test1234!',
  });

  if (authError) {
    console.error('Login failed:', authError.message);
    return;
  }
  
  const userId = authData.user.id;
  console.log('Logged in user ID:', userId);

  console.log('2. Fetching user profile...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (profileError) {
    console.error('Profile fetch failed:', profileError.message);
    return;
  }
  console.log('Profile:', profile);
  
  if (!profile.organization_id) {
    console.log('No organization_id found for profile');
    return;
  }

  console.log('3. Fetching teacher profiles for organization_id:', profile.organization_id);
  const { data: teacherProfiles, error: teacherError } = await supabase
    .from('profiles')
    .select('center_id')
    .eq('organization_id', profile.organization_id)
    .eq('role', 'teacher')
    .not('center_id', 'is', null);
    
  if (teacherError) {
    console.error('Teacher fetch failed:', teacherError.message);
    return;
  }
  console.log('Teacher Profiles:', teacherProfiles);
  
  const centerIds = Array.from(new Set(teacherProfiles.map(p => p.center_id)));
  console.log('Center IDs to check:', centerIds);

  if (centerIds.length === 0) {
    console.log('No center IDs found, student count will be 0');
    return;
  }

  console.log('4. Fetching students with these center_ids...');
  const { data: studentsData, error: studentsError } = await supabase
    .from('students')
    .select('id, name, center_id')
    .in('center_id', centerIds);
    
  if (studentsError) {
    console.error('Students fetch failed:', studentsError.message);
    return;
  }
  console.log(`Found ${studentsData.length} students:`, studentsData);

  const { count, error: countError } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true })
    .in('center_id', centerIds);
    
  console.log('Exact count result:', count, 'Error:', countError?.message);
}

test().catch(console.error);
