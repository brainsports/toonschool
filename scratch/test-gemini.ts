import { geminiClient } from '../src/shared/lib/gemini.ts';

async function test() {
  try {
    console.log('Testing text generation...');
    const text = await geminiClient.generateText('hello');
    console.log('Text result:', text);
  } catch (e) {
    console.error('Text error:', e);
  }
}
test();
