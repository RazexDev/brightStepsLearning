const fs = require('fs');
const path = require('path');

const file = path.join('client', 'src', 'pages', 'TeacherDashboard.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Remove form mood select
content = content.replace(/<div className=\{s\.formGroup\}>\s*<label className=\{s\.formLabel\}>😊 Mood<\/label>\s*<select className=\{s\.formInput\} value=\{form\.mood\}[\s\S]*?<\/select>\s*<\/div>/, '');

// 2. Remove Common Mood from summary panel
content = content.replace(/<div style=\{\{ background: 'white', padding: '12px'[^}]*\}\}>\s*<div style=\{\{ color: 'var\(--td-ink-soft\)', fontSize: '0\.8rem', textTransform: 'uppercase', fontWeight: 800 \}\}>Common Mood<\/div>[\s\S]*?<\/div>\s*<\/div>/, '');

// 3. Remove Mood filter from toolbar
content = content.replace(/<select \s*className="reports-toolbar-select"\s*value=\{filterMood\}[\s\S]*?<\/select>/, '');

// 4. Update clearFilters condition to remove filterMood
content = content.replace(/\|\| filterMood /g, '');

// 5. Remove Top Mood from analytics table head
content = content.replace(/<th>Top Mood<\/th>/g, '');

// 6. Remove Top Mood from analytics table body
content = content.replace(/<td>\{MOOD_EMOJI_MAP\[row\.topMood\] \|\| ''\} \{row\.topMood\}<\/td>/g, '');
content = content.replace(/colSpan="8"/g, 'colSpan="7"');

// 7. Remove Top Mood from jsPDF table
content = content.replace(/, 'Top Mood'\]\],/, ']],');
content = content.replace(/, r\.topMood\]\),/g, ']),');

// 8. Remove Mood Distribution chart
content = content.replace(/<div className=\{s\.analyticsChartCard\}>\s*<h4>Mood Distribution<\/h4>[\s\S]*?<\/div>\s*<\/div>/, '');

// 9. Remove Mood badges from browser lists
content = content.replace(/<span className=\{`\$\{s\.moodBadge\} \$\{mood\.cls\}`\}[^>]*>[\s\S]*?<\/span>/g, '');
content = content.replace(/const mood = MOOD_CFG[^;]+;/g, '');

fs.writeFileSync(file, content);
console.log("Updated TeacherDashboard.jsx to remove Moods");
