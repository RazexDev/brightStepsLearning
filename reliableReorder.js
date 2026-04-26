const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'client/src/pages/ParentDashboard.jsx');
let content = fs.readFileSync(srcPath, 'utf8');

const MARKER_NAMES = [
    "SECTION HEADER \\+ ACTION BUTTONS",
    "CHILD PROFILE CARD",
    "PROGRESS SUMMARY",
    "ROUTINE FORM — Create \\/ Edit",
    "RECOMMENDED TEMPLATES",
    "SEARCH \\+ FILTER BAR",
    "ASSIGNED ROUTINES LIST",
    "AI PLACEHOLDER NOTE",
    "AI MODAL"
];

function getRegexFor(name) {
    return new RegExp("^[ \\t]*\\{\\/\\* ══════════════════════════════════════\\r?\\n[ \\t]*" + name + "\\r?\\n[ \\t]*══════════════════════════════════════ \\*\\/\\}", "m");
}

const blocks = [];
let currentIndex = 0;

for (let i = 0; i < MARKER_NAMES.length; i++) {
    const startRegex = getRegexFor(MARKER_NAMES[i]);
    const startMatch = content.substring(currentIndex).match(startRegex);
    
    if (!startMatch) {
       console.log("Failed to find marker: ", MARKER_NAMES[i]);
       process.exit(1);
    }
    
    const trueStart = currentIndex + startMatch.index;
    
    let endIdx = content.length;
    if (i < MARKER_NAMES.length - 1) {
        const nextRegex = getRegexFor(MARKER_NAMES[i+1]);
        const nextMatch = content.substring(trueStart + startMatch[0].length).match(nextRegex);
        if (nextMatch) {
            endIdx = trueStart + startMatch[0].length + nextMatch.index;
        }
    } else {
        // Last block ends at return block end
        const endMatch = content.substring(trueStart).match(/^[ \t]*<\/>[ \t]*\r?\n[ \t]*\);[ \t]*\r?\n\}/m);
        if (endMatch) {
            endIdx = trueStart + endMatch.index;
        }
    }
    
    blocks[i] = content.substring(trueStart, endIdx);
    currentIndex = endIdx;
}

const [
    header, childCard, progress, form, templates, search, list, aiNote, aiModal
] = blocks;

const finalHeader = header.replace(
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

let simplifiedTemplates = templates
    .replace(/marginTop: showForm \? 0 : 8/, `marginTop: 24`); 

// Strip goals and skills
simplifiedTemplates = simplifiedTemplates.replace(
    /\{tmpl\.goals\?\.length > 0 && \([\s\S]*?\}\)/g, 
    ""
);
simplifiedTemplates = simplifiedTemplates.replace(
    /\{tmpl\.skills\?\.length > 0 && \([\s\S]*?\}\)/g, 
    ""
);

const newOrder = [
    finalHeader,
    search,
    list,
    progress,
    form,
    simplifiedTemplates,
    aiNote,
    aiModal
].join("");

const fullFileMatchStart = content.match(getRegexFor(MARKER_NAMES[0])).index;
const endMatch = content.match(/^[ \t]*<\/>[ \t]*\r?\n[ \t]*\);[ \t]*\r?\n\}/m);
const fullFileMatchEnd = endMatch.index;

fs.writeFileSync(srcPath, content.substring(0, fullFileMatchStart) + newOrder + content.substring(fullFileMatchEnd), "utf8");
console.log("Success with robust regex replacement.");
