const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'client/src/pages/ParentDashboard.jsx');
let content = fs.readFileSync(srcPath, 'utf8').replace(/\r\n/g, '\n');

// Start parsing near line 440
const SEARCH_START = content.indexOf(`  return (\n    <>`);
const SEARCH_END = content.indexOf(`    </>\n  );\n}`, SEARCH_START);

if (SEARCH_START === -1 || SEARCH_END === -1) {
    console.log("Could not find the bounds of RoutinesTab return block");
    process.exit(1);
}

const originalBlock = content.substring(SEARCH_START, SEARCH_END);

const MARKERS = [
    "{/* ══════════════════════════════════════\n          SECTION HEADER + ACTION BUTTONS",
    "{/* ══════════════════════════════════════\n          CHILD PROFILE CARD",
    "{/* ══════════════════════════════════════\n          PROGRESS SUMMARY",
    "{/* ══════════════════════════════════════\n          ROUTINE FORM — Create / Edit",
    "{/* ══════════════════════════════════════\n          RECOMMENDED TEMPLATES",
    "{/* ══════════════════════════════════════\n          SEARCH + FILTER BAR",
    "{/* ══════════════════════════════════════\n          ASSIGNED ROUTINES LIST",
    "{/* ══════════════════════════════════════\n          AI PLACEHOLDER NOTE",
    "{/* ══════════════════════════════════════\n          AI MODAL"
];

function getBlockContent(index) {
    let startMarker = MARKERS[index];
    let startIdx = originalBlock.indexOf(startMarker);
    if (startIdx === -1) return null;
    let endIdx = originalBlock.length;
    if (index + 1 < MARKERS.length) {
        let nextMarker = MARKERS[index + 1];
        let nextIdx = originalBlock.indexOf(nextMarker);
        if (nextIdx !== -1) endIdx = nextIdx;
    }
    // ensure to capture up to but not including the next marker, skipping whitespace
    return originalBlock.substring(startIdx - 6, endIdx).trimEnd() + '\n\n      ';
}

const headerBlock = getBlockContent(0);
const childCardBlock = getBlockContent(1); // will be discarded/merged into Header
const progressSummaryBlock = getBlockContent(2);
const routineFormBlock = getBlockContent(3);
const templatesBlock = getBlockContent(4);
const searchBarBlock = getBlockContent(5);
const assignedListBlock = getBlockContent(6);
const aiNoteBlock = getBlockContent(7);
const aiModalBlock = getBlockContent(8);

if (!headerBlock || !searchBarBlock || !assignedListBlock) {
    console.log("Failed to parse some blocks.");
    process.exit(1);
}

// Modify Header to include child selection instead of the profile card
let newHeaderBlock = headerBlock.replace(
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

// Simplify template cards by stripping bulky tags/pills visually.
// This matches: <div className={s.taskPills}> ... </div> blocks inside Recommended Templates
let simplifiedTemplatesBlock = templatesBlock
    .replace(/marginTop: showForm \? 0 : 8/, `marginTop: 24`); // Un-bunch top margin
    // Removing the whole Goals UI chunk from individual template cards:
    simplifiedTemplatesBlock = simplifiedTemplatesBlock.replace(
        /\{tmpl\.goals\?\.length > 0 && \([\s\S]*?\}\)/g, 
        ""
    );
    // Removing the whole Skills UI chunk:
    simplifiedTemplatesBlock = simplifiedTemplatesBlock.replace(
        /\{tmpl\.skills\?\.length > 0 && \([\s\S]*?\}\)/g, 
        ""
    );

// Final Order:
// Header, Search Bar, Assigned Routines, Progress Stats, Routine Creation, Templates, AI Note, AI Modal
let newReconstructed = `  return (
    <>
      ` + [
          newHeaderBlock.trimStart(),
          searchBarBlock.trimStart(),
          assignedListBlock.trimStart(),
          progressSummaryBlock.trimStart(),
          routineFormBlock.trimStart(),
          simplifiedTemplatesBlock.trimStart(),
          aiNoteBlock.trimStart(),
          aiModalBlock.trimStart()
      ].join('');

fs.writeFileSync(srcPath, content.substring(0, SEARCH_START) + newReconstructed + content.substring(SEARCH_END), 'utf8');
console.log("Successfully reordered ParentDashboard layout and simplified templates!");
