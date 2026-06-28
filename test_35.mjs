import { loadEnv } from 'vite';

async function test() {
  const env = loadEnv('development', process.cwd(), '');
  const key = env.VITE_GEMINI_API_KEY;
  if (!key) return console.log('No key');
  
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] })
  });
  
  const text = await res.text();
  console.log(`Status: ${res.status}`);
  console.log(`Body: ${text.substring(0, 500)}`);
}

test();
