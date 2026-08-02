import { geminiClient } from '../src/shared/lib/gemini.ts';

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
