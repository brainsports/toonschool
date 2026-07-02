import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vcxqutyuwsiiwdrwbrwx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjeHF1dHl1d3NpaXdkcndicnd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NTk2NDIsImV4cCI6MjA5NjAzNTY0Mn0.5TwEe4XfvoQKeYrJmQUjkjLE-AbKusfn5MGhrgLX8fQ'
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data: profiles } = await supabase.from('profiles').select('*')
  console.log('--- Profiles ---')
  console.dir(profiles, { depth: null })

  const { data: students } = await supabase.from('students').select('*')
  console.log('\n--- Students ---')
  console.dir(students, { depth: null })

  const { data: projects } = await supabase.from('toon_projects').select('*')
  console.log('\n--- Projects ---')
  console.dir(projects, { depth: null })
}
check()
