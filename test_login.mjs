import { createClient } from '@supabase/supabase-js'; 
const supabase = createClient('https://vcxqutyuwsiiwdrwbrwx.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjeHF1dHl1d3NpaXdkcndicnd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NTk2NDIsImV4cCI6MjA5NjAzNTY0Mn0.5TwEe4XfvoQKeYrJmQUjkjLE-AbKusfn5MGhrgLX8fQ'); 
async function check() { 
  const { data, error } = await supabase.auth.signInWithPassword({ email: 'orgadmin@test.com', password: 'Test1234!' }); 
  if (error) {
    console.log('Login failed:', error.message); 
  } else { 
    console.log('Login success'); 
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single(); 
    console.log('Profile:', profile); 
  } 
} 
check();
