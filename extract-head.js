const fs = require('fs');
const txt = fs.readFileSync('conflicts_summary.txt', 'utf8');

const blocks = txt.split('=== CONFLICT IN ');
let headUnique = '';

blocks.forEach(b => {
  if (!b.includes('<<<<<<< HEAD')) return;
  const fileName = b.split(' ===')[0];
  const headMatch = b.match(/<<<<<<< HEAD([\s\S]*?)======/);
  const theirsMatch = b.match(/======([\s\S]*?)>>>>>>>/);

  if (headMatch && theirsMatch) {
    const headLines = headMatch[1].split('\n').map(l=>l.trim()).filter(l=>l);
    const theirsLines = theirsMatch[1].split('\n').map(l=>l.trim()).filter(l=>l);

    const uniqueToHead = headLines.filter(l => !theirsLines.includes(l) && !theirsLines.some(tl => tl.includes(l) || l.includes(tl) && tl.length > 5));
    if (uniqueToHead.length > 0) {
      headUnique += `\n--- ${fileName} ---\n` + uniqueToHead.join('\n') + '\n';
    }
  }
});

fs.writeFileSync('head_unique.txt', headUnique);
console.log('Saved head unique lines.');
