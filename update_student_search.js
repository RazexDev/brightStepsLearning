const fs = require('fs');
const path = require('path');

const file = path.join('client', 'src', 'pages', 'TeacherDashboard.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add roster state and search focus state
const stateInjection = `  const [skills, setSkills] = useState([]);
  const [roster, setRoster] = useState([]);
  const [studentSearchFocus, setStudentSearchFocus] = useState(false);`;
content = content.replace(/const \[skills, setSkills\] = useState\(\[\]\);/, stateInjection);

// 2. Add loadRoster function
const loadRosterFunc = `
  const loadRoster = async () => {
    try {
      const res = await fetch(\`\${API}/users/students\`, { headers: authHeaders() });
      if (res.ok) setRoster(await res.json());
    } catch {}
  };
`;
content = content.replace(/const loadSkills = async \(\) => \{[\s\S]*?catch \{ \/\* silent \*\/ \}\n  \};/, match => match + loadRosterFunc);

// 3. Update useEffect
content = content.replace(/useEffect\(\(\) => \{ loadReports\(\); loadSkills\(\); \}, \[\]\);/, 'useEffect(() => { loadReports(); loadSkills(); loadRoster(); }, []);');

// 4. Add allStudentNames computation
const derivedData = `
  const allStudentNames = React.useMemo(() => {
    const names = new Set(roster.map(s => s.name));
    uniqueStudentNames.forEach(n => names.add(n));
    return Array.from(names).sort();
  }, [roster, uniqueStudentNames]);

  const filteredSearchStudents = allStudentNames.filter(n => n.toLowerCase().includes(form.studentName.toLowerCase()));
`;
content = content.replace(/const uniqueStudentNames = [^\n]+\n/, match => match + derivedData);

// 5. Replace the input element
const oldInputGroup = /<div className=\{s\.formGroup\}>\s*<label className=\{s\.formLabel\}>Student Name<\/label>\s*<input className=\{s\.formInput\} list="students-list" type="text" placeholder="Select or type student…"[\s\S]*?<\/datalist>\s*<\/div>/;

const newInputGroup = `<div className={s.formGroup} style={{ position: 'relative' }}>
                <label className={s.formLabel}>🔍 Search Student Name</label>
                <input 
                  className={s.formInput} 
                  type="text" 
                  placeholder="Search or type student…"
                  value={form.studentName} 
                  onChange={e => setForm({ ...form, studentName: e.target.value })} 
                  onFocus={() => setStudentSearchFocus(true)}
                  onBlur={() => setTimeout(() => setStudentSearchFocus(false), 200)}
                  autoComplete="off"
                  required 
                />
                {studentSearchFocus && filteredSearchStudents.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '2px solid #e2e8f0', borderRadius: '12px', zIndex: 50, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginTop: '4px' }}>
                    {filteredSearchStudents.map(name => (
                      <div 
                        key={name}
                        onClick={() => {
                          setForm({ ...form, studentName: name });
                          setStudentSearchFocus(false);
                        }}
                        style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: 'var(--td-ink-mid)' }}
                        onMouseEnter={e => e.target.style.background = '#f8fafc'}
                        onMouseLeave={e => e.target.style.background = 'white'}
                      >
                        {name}
                      </div>
                    ))}
                  </div>
                )}
              </div>`;

content = content.replace(oldInputGroup, newInputGroup);

fs.writeFileSync(file, content);
console.log("Updated TeacherDashboard.jsx with explicit Student Search Bar");
