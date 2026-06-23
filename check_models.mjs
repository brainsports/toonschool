import { loadEnv } from 'vite';
const env = loadEnv('development', process.cwd(), '');
const key = env.VITE_GEMINI_API_KEY;
if (key) {
  fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
    .then(res => res.json())
    .then(data => {
      if (data.models) {
        const models = data.models.map(m => m.name);
        console.log('Contains 3.5-flash:', models.includes('models/gemini-3.5-flash'));
        console.log('Flash models:', models.filter(m => m.includes('flash')));
      } else {
        console.error('API Error:', data);
      }
    })
    .catch(console.error);
} else {
  console.error('VITE_GEMINI_API_KEY not found in env');
}
