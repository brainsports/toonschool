import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const match = envFile.match(/VITE_GEMINI_API_KEY=(.*)/);
if (match) {
  const apiKey = match[1].trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${apiKey}`;
  
  const payload = {
    instances: [ { prompt: "A highly detailed educational background without characters, elementary school classroom" } ],
    parameters: {
      sampleCount: 1,
      aspectRatio: "3:4",
      outputOptions: {
        mimeType: "image/jpeg"
      }
    }
  };

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(async r => {
    if (r.ok) {
        const data = await r.json();
        console.log("Success!", data.predictions ? "Image received" : data);
    } else {
        console.log("Error:", r.status, await r.text());
    }
  });
}
