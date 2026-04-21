const fs = require('fs');
const execSync = require('child_process').execSync;

const status = execSync('git status --porcelain').toString();
const conflictedFiles = status
  .split('\n')
  .filter(line => line.startsWith('UU ') || line.startsWith('AA '))
  .map(line => line.slice(3).trim());

let output = '';

conflictedFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('<<<<<<<')) {
    output += `\n\n=== CONFLICT IN ${file} ===\n`;
    const lines = content.split('\n');
    let inConflict = false;
    let block = '';
    lines.forEach(line => {
      if (line.startsWith('<<<<<<<')) {
        inConflict = true;
      }
      if (inConflict) {
        block += line + '\n';
      }
      if (line.startsWith('>>>>>>>')) {
        inConflict = false;
        output += block + '\n------------------\n';
        block = '';
      }
    });
  }
});

fs.writeFileSync('conflicts_summary.txt', output);
console.log(`Extracted conflicts for ${conflictedFiles.length} files.`);
