import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vcxqutyuwsiiwdrwbrwx.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjeHF1dHl1d3NpaXdkcndicnd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NTk2NDIsImV4cCI6MjA5NjAzNTY0Mn0.5TwEe4XfvoQKeYrJmQUjkjLE-AbKusfn5MGhrgLX8fQ'
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  // Login as orgadmin
  console.log('--- ORG ADMIN ---')
  let { error } = await supabase.auth.signInWithPassword({ email: 'orgadmin@test.com', password: 'password123!' })
  if (error) console.log('Login error:', error.message)
  let res = await supabase.from('profiles').select('id, role').eq('organization_id', 'cf1eada8-962d-44f5-b440-6eeb15ba85f6')
  console.log('Profiles for orgadmin:', res.data)

  // Login as middleadmin
  console.log('--- MIDDLE ADMIN ---')
  await supabase.auth.signOut()
  await supabase.auth.signInWithPassword({ email: 'middleadmin@test.com', password: 'password123!' })
  res = await supabase.from('profiles').select('id, role').eq('organization_id', 'cf1eada8-962d-44f5-b440-6eeb15ba85f6')
  console.log('Profiles for middleadmin:', res.data)
}

test()
