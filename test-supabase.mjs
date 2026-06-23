import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vcxqutyuwsiiwdrwbrwx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjeHF1dHl1d3NpaXdkcndicnd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NTk2NDIsImV4cCI6MjA5NjAzNTY0Mn0.5TwEe4XfvoQKeYrJmQUjkjLE-AbKusfn5MGhrgLX8fQ'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  const { data, error } = await supabase.from('curriculum_units').select('*').limit(5)
  if (error) console.error(error)
  else console.log(JSON.stringify(data, null, 2))
}
test()
