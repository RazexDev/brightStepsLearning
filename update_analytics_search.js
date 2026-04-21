const fs = require('fs');
const path = require('path');

const file = path.join('client', 'src', 'pages', 'TeacherDashboard.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add studentSearchFocus state to AnalyticsTab
const stateInjection = `  const [dateError, setDateError] = useState(null);
  const [studentSearchFocus, setStudentSearchFocus] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');`;
content = content.replace(/const \[dateError, setDateError\] = useState\(null\);/, stateInjection);

// 2. Replace the select box
const oldGroup = /<div className=\{s\.analyticsFilterGroup\}>\s*<label>Student<\/label>\s*<select className=\{s\.formInput\} value=\{selectedStudent\} onChange=\{e => setSelectedStudent\(e\.target\.value\)\}>\s*<option value="">All Students<\/option>\s*\{students\.map\(st => <option key=\{st\._id\} value=\{st\.name\}>\{st\.name\}<\/option>\)\}\s*<\/select>\s*<\/div>/;

const newGroup = `<div className={s.analyticsFilterGroup} style={{ position: 'relative' }}>
              <label>🔍 Student Search</label>
              <input 
                className={s.formInput} 
                type="text" 
                placeholder="All Students..."
                value={studentSearchFocus ? studentSearchQuery : (selectedStudent || 'All Students')} 
                onChange={e => {
                  setStudentSearchQuery(e.target.value);
                  if (e.target.value === '') setSelectedStudent('');
                }} 
                onFocus={() => {
                  setStudentSearchFocus(true);
                  setStudentSearchQuery('');
                }}
                onBlur={() => setTimeout(() => setStudentSearchFocus(false), 200)}
                autoComplete="off"
              />
              {studentSearchFocus && students && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '2px solid #e2e8f0', borderRadius: '12px', zIndex: 50, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginTop: '4px' }}>
                  <div 
                    onClick={() => { setSelectedStudent(''); setStudentSearchFocus(false); }}
                    style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: 'var(--td-ink-mid)' }}
                    onMouseEnter={e => e.target.style.background = '#f8fafc'}
                    onMouseLeave={e => e.target.style.background = 'white'}
                  >
                    All Students
                  </div>
                  {students.filter(st => st.name.toLowerCase().includes(studentSearchQuery.toLowerCase())).map(st => (
                    <div 
                      key={st._id}
                      onClick={() => { setSelectedStudent(st.name); setStudentSearchFocus(false); }}
                      style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: 'var(--td-ink-mid)' }}
                      onMouseEnter={e => e.target.style.background = '#f8fafc'}
                      onMouseLeave={e => e.target.style.background = 'white'}
                    >
                      {st.name}
                    </div>
                  ))}
                </div>
              )}
            </div>`;

content = content.replace(oldGroup, newGroup);

fs.writeFileSync(file, content);
console.log("Updated TeacherDashboard.jsx with Analytics Student Search Bar");
