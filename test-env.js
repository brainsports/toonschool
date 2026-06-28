import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const match = envFile.match(/VITE_GEMINI_API_KEY=(.*)/);
if (match) {
  const apiKey = match[1].trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  fetch(url).then(r=>r.json()).then(data => {
    if (data.models) {
      console.log("AVAILABLE MODELS:");
      const modelNames = data.models.map(m => m.name);
      console.log(modelNames.filter(name => name.includes("flash") || name.includes("imagen")).join('\n'));
    } else {
      console.log("Error checking models:", data);
    }
  });
}
