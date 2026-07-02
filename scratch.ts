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
  console.log('Fetching shared_comic_books with slug: uqlijp...');
  const { data: shared, error: err1 } = await supabase
    .from('shared_comic_books')
    .select('id, slug, project_id, title, subject, grade, student_name, thumbnail_url, created_at')
    .eq('slug', 'uqlijp')
    .single();
    
  if (err1) {
    console.error('Error fetching shared_comic_books:', err1);
  } else {
    console.log('--- SHARED COMIC BOOK ---');
    console.log(JSON.stringify(shared, null, 2));
  }

  if (shared && shared.project_id) {
    console.log(`\nFetching toon_projects with id: ${shared.project_id}...`);
    const { data: project, error: err2 } = await supabase
      .from('toon_projects')
      .select('id, title, summary, content')
      .eq('id', shared.project_id)
      .single();

    if (err2) {
      console.error('Error fetching toon_projects:', err2);
    } else {
      console.log('--- TOON PROJECT ---');
      console.log(JSON.stringify({
        id: project.id,
        title: project.title,
        summary: project.summary,
        subject_in_content: project.content?.subject,
        topic_title_in_content: project.content?.topicTitle || project.content?.title || project.content?.selectedTopic?.title
      }, null, 2));
      console.log('Full content:', JSON.stringify(project.content, null, 2));
    }
  }
}

run();
