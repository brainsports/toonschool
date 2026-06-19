import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  const { data, error } = await supabase.from('curriculum_units').select('*').limit(1)
  console.log('curriculum_units:', { data, error })

  const { data: sData, error: sError } = await supabase.from('subjects').select('*').limit(1)
  console.log('subjects:', { data: sData, error: sError })
}

test()
