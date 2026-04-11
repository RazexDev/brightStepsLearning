const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'client', 'src', 'pages', 'ParentDashboard.jsx');
let content = fs.readFileSync(file, 'utf8');

// The return block
const startStr = `  return (
    <>
      {/* ══════════════════════════════════════
          SECTION HEADER + ACTION BUTTONS
      ══════════════════════════════════════ */}`;

const endStr = `      {/* ══════════════════════════════════════
          AI MODAL
      ══════════════════════════════════════ */}`;

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find start or end index.");
    process.exit(1);
}

const originalReturnBlock = content.slice(startIndex, endIndex);

function extractSection(nameRegex, endRegex) {
    const s = originalReturnBlock.match(nameRegex);
    if (!s) return "";
    const start = s.index;
    const e = originalReturnBlock.substring(start).match(endRegex);
    if (!e) return originalReturnBlock.substring(start);
    return originalReturnBlock.substring(start, start + e.index);
}


// Extract the individual blocks based on the comment headers
const sectionHeader = extractSection(/\{\/\* ══════════════════════════════════════\s*SECTION HEADER \+ ACTION BUTTONS\s*══════════════════════════════════════ \*\/\}/, /\{\/\* ══════════════════════════════════════\s*CHILD PROFILE CARD/);
const childCard = extractSection(/\{\/\* ══════════════════════════════════════\s*CHILD PROFILE CARD\s*══════════════════════════════════════ \*\/\}/, /\{\/\* ══════════════════════════════════════\s*PROGRESS SUMMARY/);
const progressSummary = extractSection(/\{\/\* ══════════════════════════════════════\s*PROGRESS SUMMARY\s*══════════════════════════════════════ \*\/\}/, /\{\/\* ══════════════════════════════════════\s*ROUTINE FORM — Create \/ Edit/);
const routineForm = extractSection(/\{\/\* ══════════════════════════════════════\s*ROUTINE FORM — Create \/ Edit\s*══════════════════════════════════════ \*\/\}/, /\{\/\* ══════════════════════════════════════\s*RECOMMENDED TEMPLATES/);
const recommendedTemplates = extractSection(/\{\/\* ══════════════════════════════════════\s*RECOMMENDED TEMPLATES\s*══════════════════════════════════════ \*\/\}/, /\{\/\* ══════════════════════════════════════\s*SEARCH \+ FILTER BAR/);
const searchBar = extractSection(/\{\/\* ══════════════════════════════════════\s*SEARCH \+ FILTER BAR\s*══════════════════════════════════════ \*\/\}/, /\{\/\* ══════════════════════════════════════\s*ASSIGNED ROUTINES LIST/);
const assignedRoutines = extractSection(/\{\/\* ══════════════════════════════════════\s*ASSIGNED ROUTINES LIST\s*══════════════════════════════════════ \*\/\}/, /\{\/\* ══════════════════════════════════════\s*AI PLACEHOLDER NOTE/);
const aiNote = extractSection(/\{\/\* ══════════════════════════════════════\s*AI PLACEHOLDER NOTE\s*══════════════════════════════════════ \*\/\}/, /$/);


// Modify SECTION HEADER to include the student select.
let newSectionHeader = sectionHeader.replace(
    /<h2>📅 Routine Management<\/h2>\s*<p>Create, assign, and monitor routines for \{selectedStudentName\}\.<\/p>/g,
    `<h2 style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            📅 Routine Management
            <select value={selectedStudentId} onChange={handleStudentChange}
              className={s.formInput}
              style={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, fontSize: '1.2rem', padding: '4px 8px', width: 'auto', background: 'var(--pd-paper)', color: 'var(--pd-teal-dk)' }}>
              {students.map(st => (
                <option key={st._id} value={st._id}>{st.name}</option>
              ))}
            </select>
            {(() => {
              const ts = typeStyle(selectedDisability);
              return <span style={{ background: ts.bg, border: '1.5px solid '+ts.border, color: ts.color, padding: '3px 12px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 800 }}>{ts.label}</span>;
            })()}
          </h2>
          <p>Create, assign, and monitor routines.</p>`
);

/* Simplify Templates */
let cleanedTemplates = recommendedTemplates.replace(/<div className=\{s\.taskPills\}>[\s\S]*?<\/div>\s*<\/div>\s*\}\)\}/, (match) => {
    // Attempt to make it purely inline text rather than huge bubbly pills.
    return match; // We'll keep it simple for now, maybe use regex to remove bubbly pills later if needed
});


const reorderedHTML = `  return (
    <>
${newSectionHeader}
${searchBar}

${assignedRoutines}

${progressSummary}

${routineForm}

${cleanedTemplates}

${aiNote}
`;

const newContent = content.slice(0, startIndex) + reorderedHTML + content.slice(endIndex);

fs.writeFileSync(file, newContent, 'utf8');
console.log("Layout reordered successfully.");

