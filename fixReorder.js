const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'client/src/pages/ParentDashboard.jsx');
let content = fs.readFileSync(srcPath, 'utf8');

// The boundaries
const blocks = [
  "SECTION HEADER + ACTION BUTTONS",
  "CHILD PROFILE CARD",
  "PROGRESS SUMMARY",
  "ROUTINE FORM — Create / Edit",
  "RECOMMENDED TEMPLATES",
  "SEARCH + FILTER BAR",
  "ASSIGNED ROUTINES LIST",
  "AI PLACEHOLDER NOTE",
  "AI MODAL"
];

function extractBlock(name, nextName) {
  const startRegex = new RegExp(`\\{\\/\\* ══════════════════════════════════════\\s*${name}\\s*══════════════════════════════════════ \\*\\/\\}`);
  let nextRegex = null;
  if (nextName) {
    nextRegex = new RegExp(`\\{\\/\\* ══════════════════════════════════════\\s*${nextName}\\s*══════════════════════════════════════ \\*\\/\\}`);
  }

  const matchStart = content.match(startRegex);
  if (!matchStart) return null;
  let matchEnd;
  if (nextRegex) {
     matchEnd = content.substring(matchStart.index).match(nextRegex);
  }
  
  if (nextRegex && matchEnd) {
     return content.substring(matchStart.index, Math.max(matchStart.index, matchStart.index + matchEnd.index));
  } else if (!nextRegex) {
     // AI modal ends at </>\n  );\n}
     const endStr = "    </>\n  );\n}";
     const endIdx = content.indexOf(endStr, matchStart.index);
     if (endIdx > -1) {
       return content.substring(matchStart.index, endIdx);
     }
  }
  return null;
}

const headerBlock = extractBlock(blocks[0], blocks[1]);
const childBlock = extractBlock(blocks[1], blocks[2]);
const progBlock = extractBlock(blocks[2], blocks[3]);
const createBlock = extractBlock(blocks[3], blocks[4]);
const templatesBlock = extractBlock(blocks[4], blocks[5]);
const searchBlock = extractBlock(blocks[5], blocks[6]);
const routListBlock = extractBlock(blocks[6], blocks[7]);
const aiNoteBlock = extractBlock(blocks[7], blocks[8]);
const aiModalBlock = extractBlock(blocks[8], null);

if (!headerBlock || !childBlock || !progBlock || !createBlock || 
    !templatesBlock || !searchBlock || !routListBlock || !aiNoteBlock || !aiModalBlock) {
  console.log("Could not extract all blocks");
  process.exit(1);
}

// Modify Header to include selected student logic
let newHeader = headerBlock.replace(
  /<h2>📅 Routine Management<\/h2>\s*<p>Create, assign, and monitor routines for \{selectedStudentName\}\.<\/p>/,
  `
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
            <h2 style={{ margin: 0 }}>📅 Routine Management</h2>
            <select value={selectedStudentId} onChange={handleStudentChange}
              className={s.formInput}
              style={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, fontSize: '1rem', padding: '4px 8px', width: 'auto', background: 'var(--pd-paper2)', color: 'var(--pd-teal-dk)', border: 'none' }}>
              {students.map(st => (
                <option key={st._id} value={st._id}>{st.name}</option>
              ))}
            </select>
            {(() => {
              const ts = typeStyle(selectedDisability);
              return <span style={{ background: ts.bg, border: '1.5px solid '+ts.border, color: ts.color, padding: '3px 12px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 800 }}>{ts.label}</span>;
            })()}
          </div>
          <p style={{ margin: 0 }}>Create, assign, and monitor routines.</p>
`
);

// We reconstruct the return statement contents 
const newReturnContent = [
   newHeader,
   searchBlock,
   routListBlock,
   progBlock,
   createBlock,
   templatesBlock,
   aiNoteBlock,
   aiModalBlock
].join("\n");

const startRegex = new RegExp(`\\{\\/\\* ══════════════════════════════════════\\s*${blocks[0]}\\s*══════════════════════════════════════ \\*\\/\\}`);
const matchStart = content.match(startRegex);
const endStr = "    </>\n  );\n}";
const endIdx = content.indexOf(endStr, matchStart.index);

if (!matchStart || endIdx === -1) {
    console.log("Could not assemble blocks");
    process.exit(1);
}

const finalContent = content.substring(0, matchStart.index) + newReturnContent + content.substring(endIdx);
fs.writeFileSync(srcPath, finalContent, 'utf8');

console.log("Layout reorganized successfully!");
