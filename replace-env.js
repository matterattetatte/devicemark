const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'frontend/.env') });

const REPLACEMENTS = [
  ['DEVICESQA_CONTRACT_ADDRESS', process.env.DEVICESQA_CONTRACT_ADDRESS],
  ['DMC_CONTRACT_ADDRESS', process.env.DMC_CONTRACT_ADDRESS],
  ['DEVICE_NFT_CONTRACT_ADDRESS', process.env.DEVICE_NFT_CONTRACT_ADDRESS],
];

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let replaced = false;
  REPLACEMENTS.forEach(([key, value]) => {
    if (value) {
      const regex = new RegExp(key, 'g');
      if (content.match(regex)) replaced = true;
      content = content.replace(regex, value);
    }
  });
  if (replaced) fs.writeFileSync(filePath, content, 'utf8');
}

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const fullPath = path.join(dir, f);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (/\.(html|js|ts|json|css)$/.test(f)) {
      replaceInFile(fullPath);
    }
  });
}

walk(path.join(__dirname, 'frontend'));