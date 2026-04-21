const fs = require('fs');
const path = require('path');

const file = path.join('client', 'src', 'pages', 'TeacherDashboard.jsx');
let content = fs.readFileSync(file, 'utf8');

// We will replace the ReportsTab function completely.
const startIdx = content.indexOf('function ReportsTab() {');
const endIdx = content.indexOf('/* ═══════════════════════════════════════════════════\r\n   TAB 3 — RESOURCE LIBRARY');
const endIdx2 = content.indexOf('/* ═══════════════════════════════════════════════════\n   TAB 3 — RESOURCE LIBRARY');

const actualEndIdx = endIdx !== -1 ? endIdx : endIdx2;

if (startIdx === -1 || actualEndIdx === -1) {
  console.log("Could not find boundaries.");
  process.exit(1);
}

const newReportsTab = `function ReportsTab() {
  const [reports, setReports] = useState([]);
  const [skills, setSkills] = useState([]);
  const [toast, setToast] = useState(null);
  
  const [form, setForm] = useState({
    studentName: '', date: today, activity: '', mood: 'Happy', notes: '', avatar: '👦',
    skillArea: '', engagementLevel: 'High', progressLevel: 'Good',
    recommendations: '', sessionDuration: '', attendanceStatus: 'Present',
    customActivity: ''
  });

  // Filter & UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [filterMood, setFilterMood] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [selectedStudentName, setSelectedStudentName] = useState(null);
  const [selectedReports, setSelectedReports] = useState([]);
  
  // Skill Modal State
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [manageSkillForm, setManageSkillForm] = useState({ id: null, name: '', activities: '' });

  const flash = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const loadReports = async () => {
    try {
      const res = await fetch(\`\${API}/progress\`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setReports([...data]);
    } catch { /* silent */ }
  };

  const loadSkills = async () => {
    try {
      const res = await fetch(\`\${API}/skills\`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSkills(data);
      }
    } catch { /* silent */ }
  };

  useEffect(() => { loadReports(); loadSkills(); }, []);

  // Update activity when skillArea changes
  useEffect(() => {
    const selectedSkill = skills.find(s => s.name === form.skillArea);
    if (selectedSkill && selectedSkill.activities && selectedSkill.activities.length > 0) {
      setForm(f => ({ ...f, activity: selectedSkill.activities[0] }));
    } else {
      setForm(f => ({ ...f, activity: 'Other' }));
    }
  }, [form.skillArea, skills]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const finalActivity = form.activity === 'Other' ? form.customActivity : form.activity;
      const payload = { ...form, activity: finalActivity };
      
      const res = await fetch(\`\${API}/progress\`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        flash('✅ Report saved!');
        setForm({ studentName: '', date: today, activity: '', customActivity: '', mood: 'Happy', notes: '', avatar: '👦',
          skillArea: form.skillArea, engagementLevel: 'High', progressLevel: 'Good',
          recommendations: '', sessionDuration: '', attendanceStatus: 'Present'
        });
        loadReports();
      } else {
        flash(\`❌ \${data.message || 'Failed'}\`, false);
      }
    } catch { flash('❌ Cannot connect to backend.', false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    await fetch(\`\${API}/progress/\${id}\`, { method: 'DELETE', headers: authHeaders() });
    loadReports();
  };

  const handlePrintReport = (r) => { downloadSingleReportPDF(r, 'BrightSteps — Student Progress Report'); };
  const handleDownloadPDF = (r) => { generateSingleReportPDF(r); };

  const clearFilters = () => {
    setSearchQuery(''); setFilterStudent(''); setFilterMood(''); setSortOrder('newest');
    setSelectedStudentName(null); setSelectedReports([]);
  };

  const handleBulkDelete = async () => {
    if (!selectedReports.length) return;
    if (!window.confirm(\`Delete \${selectedReports.length} selected reports?\`)) return;
    try {
      await Promise.all(selectedReports.map(id => fetch(\`\${API}/progress/\${id}\`, { method: 'DELETE', headers: authHeaders() })));
      flash(\`✅ \${selectedReports.length} reports deleted!\`);
      setSelectedReports([]); loadReports();
    } catch { flash('❌ Error deleting reports', false); }
  };

  const handleSaveSkill = async (e) => {
    e.preventDefault();
    const activitiesArr = manageSkillForm.activities.split(',').map(s => s.trim()).filter(Boolean);
    const payload = { name: manageSkillForm.name, activities: activitiesArr };
    
    try {
      let res;
      if (manageSkillForm.id) {
        res = await fetch(\`\${API}/skills/\${manageSkillForm.id}\`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload) });
      } else {
        res = await fetch(\`\${API}/skills\`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
      }
      if (res.ok) {
        loadSkills();
        setShowSkillModal(false);
        setManageSkillForm({ id: null, name: '', activities: '' });
      } else {
         const d = await res.json();
         alert(d.message || 'Error saving skill');
      }
    } catch { alert('Network error'); }
  };

  const handleDeleteSkill = async (id) => {
    if(!window.confirm('Delete this skill area?')) return;
    await fetch(\`\${API}/skills/\${id}\`, { method: 'DELETE', headers: authHeaders() });
    loadSkills();
  };

  // ── Derived Data for Student-Centric Browser ──
  const studentSummaries = React.useMemo(() => {
    const map = new Map();
    reports.forEach(r => {
      const name = r.studentName || 'Unknown Student';
      if (!map.has(name)) {
        map.set(name, {
          name, totalReports: 0, latestDate: r.date, latestMood: r.mood,
          latestSkill: r.skillArea || '—', latestActivity: r.activity || '—',
          avgEngagement: { High: 0, Medium: 0, Low: 0 },
          avgProgress: { Excellent: 0, Good: 0, 'Needs Support': 0 },
          reports: []
        });
      }
      const s = map.get(name);
      s.totalReports += 1;
      s.reports.push(r);
      if (r.engagementLevel) s.avgEngagement[r.engagementLevel] = (s.avgEngagement[r.engagementLevel] || 0) + 1;
      if (r.progressLevel) s.avgProgress[r.progressLevel] = (s.avgProgress[r.progressLevel] || 0) + 1;
      if (new Date(r.date) > new Date(s.latestDate)) {
        s.latestDate = r.date; s.latestMood = r.mood;
        s.latestSkill = r.skillArea; s.latestActivity = r.activity;
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [reports]);

  const uniqueStudentNames = React.useMemo(() => studentSummaries.map(s => s.name), [studentSummaries]);

  const filteredSummaries = React.useMemo(() => {
    return studentSummaries.filter(s => {
      if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterStudent && s.name !== filterStudent) return false;
      if (filterMood) {
         if (!s.reports.some(r => r.mood === filterMood)) return false;
      }
      return true;
    });
  }, [studentSummaries, searchQuery, filterStudent, filterMood]);

  const selectedStudentReports = React.useMemo(() => {
    if (!selectedStudentName) return [];
    const st = studentSummaries.find(s => s.name === selectedStudentName);
    if (!st) return [];
    let reps = [...st.reports];
    if (filterMood) reps = reps.filter(r => r.mood === filterMood);
    reps.sort((a, b) => sortOrder === 'newest' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date));
    return reps;
  }, [selectedStudentName, studentSummaries, filterMood, sortOrder]);

  const selectedFormStudentSummary = React.useMemo(() => {
    if (!form.studentName) return null;
    return studentSummaries.find(s => s.name === form.studentName) || null;
  }, [form.studentName, studentSummaries]);

  const selectedSkillObj = skills.find(s => s.name === form.skillArea);
  const currentActivities = selectedSkillObj ? selectedSkillObj.activities : [];

  return (
    <>
      {/* ── Add Report Form ── */}
      <div className={s.formCard} style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
        <div style={{ flex: '1 1 600px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
            <h3 style={{ margin: 0 }}><PlusCircle size={19} /> New Daily Report</h3>
          </div>
          <Toast {...(toast || { msg: '' })} />
          
          <form onSubmit={handleSave}>
            <div className="form-section-title">👤 Student & Session Details</div>
            <div className={s.formRow} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <div className={s.formGroup}>
                <label className={s.formLabel}>Student Name</label>
                <input className={s.formInput} list="students-list" type="text" placeholder="Select or type student…"
                  value={form.studentName} onChange={e => setForm({ ...form, studentName: e.target.value })} required />
                <datalist id="students-list">
                   {uniqueStudentNames.map(name => <option key={name} value={name} />)}
                </datalist>
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>📅 Date</label>
                <input className={s.formInput} type="date" value={form.date} max={today}
                  onChange={e => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>⏱️ Duration (mins)</label>
                <input className={s.formInput} type="number" placeholder="e.g. 45"
                  value={form.sessionDuration} onChange={e => setForm({ ...form, sessionDuration: e.target.value })} />
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>✅ Attendance</label>
                <select className={s.formInput} value={form.attendanceStatus}
                  onChange={e => setForm({ ...form, attendanceStatus: e.target.value })}>
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Partial Session">Partial Session</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>
            </div>

            <div className="form-section-title" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              <span>🎯 Activity & Progress</span>
              <button type="button" onClick={() => setShowSkillModal(true)} style={{ background: 'none', border: 'none', color: 'var(--td-sky-dk)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>
                ⚙️ Manage Skills
              </button>
            </div>
            <div className={s.formRow} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <div className={s.formGroup}>
                <label className={s.formLabel}>📚 Skill Area</label>
                <select className={s.formInput} value={form.skillArea}
                  onChange={e => setForm({ ...form, skillArea: e.target.value })}>
                  <option value="">-- Select Skill Area --</option>
                  {skills.map(sk => <option key={sk._id} value={sk.name}>{sk.name}</option>)}
                </select>
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>Activity Name</label>
                <select className={s.formInput} value={form.activity}
                  onChange={e => setForm({ ...form, activity: e.target.value })} required>
                  {currentActivities && currentActivities.map(act => <option key={act} value={act}>{act}</option>)}
                  <option value="Other">Other (Custom Activity)</option>
                </select>
              </div>
              {form.activity === 'Other' && (
                <div className={s.formGroup}>
                   <label className={s.formLabel}>Custom Activity</label>
                   <input className={s.formInput} type="text" placeholder="Type activity..." 
                     value={form.customActivity} onChange={e => setForm({...form, customActivity: e.target.value})} required />
                </div>
              )}
              <div className={s.formGroup}>
                <label className={s.formLabel}>📈 Progress Level</label>
                <select className={s.formInput} value={form.progressLevel}
                  onChange={e => setForm({ ...form, progressLevel: e.target.value })}>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Needs Support">Needs Support</option>
                </select>
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>🔥 Engagement</label>
                <select className={s.formInput} value={form.engagementLevel}
                  onChange={e => setForm({ ...form, engagementLevel: e.target.value })}>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>😊 Mood</label>
                <select className={s.formInput} value={form.mood}
                  onChange={e => setForm({ ...form, mood: e.target.value })}>
                  {MOODS.map(m => (
                    <option key={m} value={m}>{MOOD_CFG[m].emoji} {m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-section-title" style={{ marginTop: '16px' }}>📝 Notes & Recommendations</div>
            <div className={s.formRow} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <div className={s.formGroup}>
                <label className={s.formLabel}>Teacher's Notes</label>
                <textarea className={\`\${s.formInput} \${s.textarea}\`}
                  placeholder="How was the session? Observations..."
                  value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>Next Steps / Recommendations</label>
                <textarea className={\`\${s.formInput} \${s.textarea}\`}
                  placeholder="Suggested follow-up activities..."
                  value={form.recommendations} onChange={e => setForm({ ...form, recommendations: e.target.value })} />
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <button type="submit" className={s.saveBtn} style={{ flex: 1, justifyContent: 'center' }}>
                <Save size={18} /> Save Daily Report
              </button>
              {selectedFormStudentSummary && (
                <button type="button" className={s.refreshBtn} onClick={() => { setSelectedStudentName(form.studentName); document.getElementById('reports-browser').scrollIntoView({behavior: 'smooth'}); }}>
                  View Full History
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ── Student Analytics Summary Panel ── */}
        <div style={{ flex: '1 1 300px', background: 'var(--td-paper2)', borderRadius: 'var(--td-r-card)', padding: '24px', border: '2px solid rgba(30,16,7,0.06)' }}>
           <h4 style={{ margin: '0 0 16px', fontFamily: "'Baloo 2', cursive", fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <BarChart3 size={18} /> Student Analytics Summary
           </h4>
           {!selectedFormStudentSummary ? (
             <p style={{ color: 'var(--td-ink-soft)', fontSize: '0.9rem' }}>Select a student to view their recent progress analytics.</p>
           ) : (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                <div style={{ background: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '4px' }}>{selectedFormStudentSummary.name}</div>
                  <div style={{ color: 'var(--td-ink-soft)' }}>{selectedFormStudentSummary.totalReports} total reports</div>
                </div>
                <div style={{ background: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ color: 'var(--td-ink-soft)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 800 }}>Latest Activity</div>
                  <div style={{ fontWeight: 700 }}>{selectedFormStudentSummary.latestActivity} ({selectedFormStudentSummary.latestSkill})</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--td-ink-mid)', marginTop: '4px' }}>On {new Date(selectedFormStudentSummary.latestDate).toLocaleDateString()}</div>
                </div>
                <div style={{ background: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ color: 'var(--td-ink-soft)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 800 }}>Common Mood</div>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {MOOD_CFG[selectedFormStudentSummary.latestMood]?.emoji || '😐'} {selectedFormStudentSummary.latestMood} (Recent)
                  </div>
                </div>
                <div style={{ background: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ color: 'var(--td-ink-soft)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 800 }}>Recent Notes</div>
                  <div style={{ fontStyle: 'italic', color: 'var(--td-ink-mid)', maxHeight: '100px', overflowY: 'auto' }}>
                    {selectedFormStudentSummary.reports.slice(0, 3).map(r => r.notes).filter(Boolean).join(' | ') || 'No recent notes.'}
                  </div>
                </div>
             </div>
           )}
        </div>
      </div>

      {/* ── Manage Skills Modal ── */}
      {showSkillModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '20px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 20px', fontFamily: "'Baloo 2', cursive" }}>Manage Skill Areas & Activities</h3>
            <form onSubmit={handleSaveSkill} style={{ marginBottom: '24px', background: 'var(--td-paper)', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
               <div className={s.formGroup}>
                 <label className={s.formLabel}>Skill Area Name</label>
                 <input className={s.formInput} required value={manageSkillForm.name} onChange={e => setManageSkillForm({...manageSkillForm, name: e.target.value})} placeholder="e.g. Reading" />
               </div>
               <div className={s.formGroup}>
                 <label className={s.formLabel}>Activities (comma separated)</label>
                 <textarea className={s.formInput} required value={manageSkillForm.activities} onChange={e => setManageSkillForm({...manageSkillForm, activities: e.target.value})} placeholder="e.g. Letter Match, Word Reading" />
               </div>
               <div style={{ display: 'flex', gap: '10px' }}>
                 <button type="submit" className={s.saveBtn} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>{manageSkillForm.id ? 'Update' : 'Add'} Skill</button>
                 {manageSkillForm.id && <button type="button" className={s.refreshBtn} onClick={() => setManageSkillForm({id:null, name:'', activities:''})}>Cancel Edit</button>}
               </div>
            </form>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {skills.map(sk => (
                <div key={sk._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <div>
                    <strong>{sk.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{sk.activities && sk.activities.join(', ')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => setManageSkillForm({ id: sk._id, name: sk.name, activities: sk.activities.join(', ') })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✏️</button>
                    <button onClick={() => handleDeleteSkill(sk._id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button onClick={() => setShowSkillModal(false)} className={s.refreshBtn}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Student-Centric Reports Browser ── */}
      <div id="reports-browser" className={s.sectionHeader}>
        <div>
          <h2>📋 Student Progress Reports</h2>
          <p>Browse reports by student, filter, and export to PDF.</p>
        </div>
        <button className={s.refreshBtn} onClick={loadReports}>
          <RefreshCcw size={15} /> Refresh
        </button>
      </div>

      {reports.length === 0 ? (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>📭</div>
          <p>No reports yet — add one above!</p>
        </div>
      ) : (
        <div className="reports-browser-container">
          
          {/* Toolbar */}
          <div className="reports-toolbar">
            <input 
              type="text" 
              className="reports-toolbar-input" 
              placeholder="🔍 Search student name..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <select 
              className="reports-toolbar-select"
              value={filterStudent}
              onChange={e => setFilterStudent(e.target.value)}
            >
              <option value="">All Students</option>
              {uniqueStudentNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <select 
              className="reports-toolbar-select"
              value={filterMood}
              onChange={e => setFilterMood(e.target.value)}
            >
              <option value="">All Moods</option>
              {MOODS.map(m => (
                <option key={m} value={m}>{MOOD_CFG[m].emoji} {m}</option>
              ))}
            </select>
            <select 
              className="reports-toolbar-select"
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
            >
              <option value="newest">Date: Newest First</option>
              <option value="oldest">Date: Oldest First</option>
            </select>
            {(searchQuery || filterStudent || filterMood || sortOrder !== 'newest') && (
              <button className="reports-toolbar-clear" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>

          {/* Student Summaries List */}
          {filteredSummaries.length === 0 ? (
            <div className={s.emptyState}>
              <div className={s.emptyIcon}>🔎</div>
              <p>No students match the current filters.</p>
            </div>
          ) : (
            <div className="student-summary-list">
              {filteredSummaries.map(st => {
                const isSelected = selectedStudentName === st.name;
                const mood = MOOD_CFG[st.latestMood] || MOOD_CFG.Neutral;
                return (
                  <div 
                    key={st.name} 
                    className={\`student-summary-card \${isSelected ? 'selected' : ''}\`}
                    onClick={() => {
                      setSelectedStudentName(isSelected ? null : st.name);
                      setSelectedReports([]);
                    }}
                  >
                    <div className="student-summary-avatar">
                      {st.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="student-summary-info">
                      <div className="student-summary-name">{st.name}</div>
                      <div className="student-summary-meta">
                        {st.totalReports} Report{st.totalReports !== 1 ? 's' : ''} • Latest: {new Date(st.latestDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <span className={\`\${s.moodBadge} \${mood.cls}\`} title={\`Latest mood: \${mood.label}\`}>
                        {mood.emoji}
                      </span>
                      <button className="student-summary-view-btn">
                        {isSelected ? 'Close' : 'View'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Selected Student Details */}
          {selectedStudentName && (
            <div className="selected-student-reports-area">
              <div className="selected-student-header">
                <div className="student-summary-avatar" style={{ width: '60px', height: '60px', fontSize: '1.8rem' }}>
                  {selectedStudentName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3>{selectedStudentName}'s Reports</h3>
                  <p style={{ color: 'var(--text-mid)', fontWeight: 700, margin: 0 }}>
                    {selectedStudentReports.length} report{selectedStudentReports.length !== 1 ? 's' : ''} found.
                  </p>
                </div>
                <button className={s.delBtn} style={{ marginLeft: 'auto', background: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' }} onClick={() => setSelectedStudentName(null)}>
                  Close
                </button>
              </div>

              {selectedStudentReports.length === 0 ? (
                <div className={s.emptyState}>
                  <p>No reports match the current filters for {selectedStudentName}.</p>
                </div>
              ) : (
                <>
                  {/* BULK ACTION BAR */}
                  <div className="bulk-action-bar">
                    <label className="bulk-select-all">
                      <input 
                        type="checkbox" 
                        checked={selectedStudentReports.length > 0 && selectedReports.length === selectedStudentReports.length}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedReports(selectedStudentReports.map(r => r._id));
                          else setSelectedReports([]);
                        }}
                      />
                      <span>Select All</span>
                    </label>
                    {selectedReports.length > 0 && (
                      <div className="bulk-actions">
                        <span className="bulk-count">{selectedReports.length} selected</span>
                        <button className="bulk-del-btn" onClick={handleBulkDelete}>
                          <Trash2 size={14} /> Delete Selected
                        </button>
                        <button className="bulk-clear-btn" onClick={() => setSelectedReports([])}>
                          Clear Selection
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="reports-list-clean">
                    {selectedStudentReports.map(r => {
                      const mood = MOOD_CFG[r.mood] || MOOD_CFG.Neutral;
                      const isChecked = selectedReports.includes(r._id);
                      return (
                        <div key={r._id} className={\`report-item-clean \${isChecked ? 'selected' : ''}\`}>
                          <div className="report-item-checkbox">
                             <input 
                               type="checkbox" 
                               checked={isChecked}
                               onChange={(e) => {
                                 if (e.target.checked) setSelectedReports([...selectedReports, r._id]);
                                 else setSelectedReports(selectedReports.filter(id => id !== r._id));
                               }}
                             />
                          </div>
                          <div className="report-item-content">
                            <div className="report-item-top">
                              <div>
                                <div className="report-item-date">📅 {new Date(r.date).toLocaleDateString()}</div>
                                <div className="report-item-activity">🎯 {r.activity}</div>
                              </div>
                              <span className={\`\${s.moodBadge} \${mood.cls}\`} style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
                                {mood.emoji} {r.mood}
                              </span>
                            </div>
                            {r.notes && (
                              <div className="report-item-notes">
                                <strong>Teacher's Notes:</strong><br/>
                                {r.notes}
                              </div>
                            )}
                            <div className="report-item-actions">
                              <button className={s.pdfBtn} onClick={() => handleDownloadPDF(r)}>
                                <Download size={14} /> Download PDF
                              </button>
                              <button className={s.pdfBtn} onClick={() => handlePrintReport(r)} style={{ background: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' }}>
                                <Printer size={14} /> Print
                              </button>
                              <button className={s.delBtn} onClick={() => handleDelete(r._id)}>
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      )}
    </>
  );
}
\n`;

const updatedContent = content.substring(0, startIdx) + newReportsTab + content.substring(actualEndIdx);
fs.writeFileSync(file, updatedContent);
console.log("Updated TeacherDashboard.jsx");
