import * as fs from 'fs';
import * as path from 'path';

const envFile = fs.readFileSync(path.resolve('.env'), 'utf-8');
const env = Object.fromEntries(envFile.split('\n').filter(line => line && !line.startsWith('#')).map(line => line.split('=')));

async function checkTable(tableName) {
  const url = `${env.VITE_SUPABASE_URL}/rest/v1/${tableName}?select=*&limit=1`;
  const res = await fetch(url, {
    headers: {
      'apikey': env.VITE_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${env.VITE_SUPABASE_ANON_KEY}`
    }
  });
  const data = await res.json();
  console.log(`Table ${tableName}:`, res.status, data);
}

async function main() {
  await checkTable('classes');
  await checkTable('classrooms');
  await checkTable('school_classes');
  await checkTable('student_classes');
}
main();
