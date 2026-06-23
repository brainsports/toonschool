import { geminiClient } from '../src/shared/lib/gemini.ts';

// Mock import.meta.env
(globalThis as any).import = { meta: { env: { VITE_GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY || 'your_gemini_api_key_here' } } };

async function test() {
  try {
    console.log('Testing...');
    const res = await geminiClient.generateText('hello');
    console.log('Text result:', res);
  } catch (e) {
    console.error('Error:', e);
  }
}
test();
