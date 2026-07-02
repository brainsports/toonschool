import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const env: Record<string, string> = {};
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.join('=').trim().replace(/^['"]|['"]$/g, '');
  }
});

const supabaseUrl = env['VITE_SUPABASE_URL'] || '';
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'] || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Updating shared_comic_books with slug: uqlijp...');
  const { data, error } = await supabase
    .from('shared_comic_books')
    .update({ 
      title: '급식시간에 시작된 강줄기 소동',
      subject: '사회'
    })
    .eq('slug', 'uqlijp')
    .select();
    
  if (error) {
    console.error('Error updating:', error);
  } else {
    console.log('Update successful:', data);
  }
}

run();
