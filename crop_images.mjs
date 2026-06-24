import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const characters = ['hana', 'doyoon', 'seoa'];
const expressions = ['normal', 'smile', 'thinking', 'surprise', 'explain', 'cheer'];

const rows = 2;
const cols = 3;

async function processImage(character) {
  const inputFile = path.join('public', 'images', 'toonschool', 'characters', 'v2', `${character}-master`, `${character}-v2-expression-sheet.png`);
  const outputDir = path.join('public', 'images', 'toonschool', 'characters', 'v2', 'expressions', character);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const metadata = await sharp(inputFile).metadata();
  const cellWidth = Math.floor(metadata.width / cols);
  const cellHeight = Math.floor(metadata.height / rows);

  let index = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (index >= expressions.length) break;
      const expression = expressions[index];
      
      const outputFile = path.join(outputDir, `${character}-${expression}.png`);
      
      await sharp(inputFile)
        .extract({ left: col * cellWidth, top: row * cellHeight, width: cellWidth, height: cellHeight })
        .toFile(outputFile);
        
      console.log(`Saved ${outputFile}`);
      index++;
    }
  }
}

async function main() {
  for (const character of characters) {
    await processImage(character);
  }
}

main().catch(console.error);
