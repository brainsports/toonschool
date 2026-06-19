const fs = require('fs');

const filePath = 'C:\\Users\\oomir\\workspace\\toonschool\\git_diff_decoded.txt';
const text = fs.readFileSync(filePath, 'utf-8');
const lines = text.split('\n');

console.log('Total lines:', lines.length);

let hunkCount = 0;
lines.forEach((line, i) => {
  if (line.startsWith('@@')) {
    hunkCount++;
    console.log(`Hunk #${hunkCount} at line ${i+1}: ${line}`);
  }
});
