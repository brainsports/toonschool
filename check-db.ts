import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env', 'utf-8')
const env: Record<string, string> = {}
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) env[match[1]] = match[2].trim()
})

const supabaseUrl = env['VITE_SUPABASE_URL'] || ''
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'] || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  console.log('--- Organizations ---')
  const { data: orgs } = await supabase.from('organizations').select('*')
  console.log(orgs)

  console.log('\n--- Profiles (Teachers) ---')
  const { data: teachers } = await supabase.from('profiles').select('*').eq('role', 'teacher')
  console.log(teachers)

  console.log('\n--- Profiles (Students) ---')
  const { data: profilesStudents } = await supabase.from('profiles').select('*').eq('role', 'student')
  console.log(profilesStudents)

  console.log('\n--- Students Table ---')
  const { data: students } = await supabase.from('students').select('*')
  console.log(students)

  console.log('\n--- Profiles (Middle Admin) ---')
  const { data: middleAdmins } = await supabase.from('profiles').select('*').eq('role', 'middle_admin')
  console.log(middleAdmins)

  console.log('\n--- Profiles (Org Admin) ---')
  const { data: orgAdmins } = await supabase.from('profiles').select('*').eq('role', 'org_admin')
  console.log(orgAdmins)
}

checkData()
