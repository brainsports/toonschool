const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

async function checkModels() {
  if (!apiKey) {
    console.log("No GEMINI_API_KEY found in process.env");
    return;
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.models) {
    console.log("AVAILABLE MODELS:");
    const modelNames = data.models.map(m => m.name);
    console.log(modelNames.filter(name => name.includes("flash") || name.includes("imagen")).join('\n'));
  } else {
    console.log("Error checking models:", data);
  }
}

checkModels();
