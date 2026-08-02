import fs from 'fs';

let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey && fs.existsSync('.env.local')) {
  const envFile = fs.readFileSync('.env.local', 'utf-8');
  const match = envFile.match(/GEMINI_API_KEY=(.*)/);
  if (match) apiKey = match[1].trim();
}

if (apiKey) {
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
