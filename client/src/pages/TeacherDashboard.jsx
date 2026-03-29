/**
 * TeacherDashboard.jsx
 * Professional 3-tab interface: My Students | Progress Reports | Resource Library
 * Theme matches the BrightSteps Landing Page (paper/ink/rose/amber/teal palette).
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users, ClipboardList, BookOpen,
  RefreshCcw, LogOut, Download, Trash2,
  ExternalLink, Save, PlusCircle,
  MessageSquare, Send
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import s from './TeacherDashboard.module.css';

/* ── API helpers ─────────────────────────────────── */
const API = 'http://localhost:5001/api';
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('brightsteps_token')}`,
});

/* ── Constants ─────────────────────────────────── */
const MOODS = ['Happy', 'Excited', 'Neutral', 'Tired', 'Frustrated'];
const MOOD_CFG = {
  Happy:      { emoji: '😊', cls: s.moodHappy,      label: 'Happy'      },
  Excited:    { emoji: '🤩', cls: s.moodExcited,    label: 'Excited'    },
  Neutral:    { emoji: '😐', cls: s.moodNeutral,    label: 'Neutral'    },
  Tired:      { emoji: '😴', cls: s.moodTired,      label: 'Tired'      },
  Frustrated: { emoji: '😤', cls: s.moodFrustrated, label: 'Frustrated' },
};
const TYPE_EMOJI = { video: '🎬', pdf: '📄', link: '🔗', offline: '🌳' };
const today = new Date().toISOString().split('T')[0];

/* ═══════════════════════════════════════════════════
   REUSABLE TOAST
═══════════════════════════════════════════════════ */
function Toast({ msg, ok }) {
  if (!msg) return null;
  return <div className={`${s.toast} ${ok ? s.toastOk : s.toastErr}`}>{msg}</div>;
}

/* ═══════════════════════════════════════════════════
   STUDENT DRILL-DOWN VIEW (Phase 5)
═══════════════════════════════════════════════════ */
function DrillDownView({ student, onBack }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch(`${API}/progress?studentName=${encodeURIComponent(student.name)}`, { headers: authHeaders() });
        const data = await res.json();
        if (res.ok) setReports([...data].sort((a, b) => new Date(b.date) - new Date(a.date)));
      } catch { /* silent */ }
      setLoading(false);
    };
    fetchReports();
  }, [student.name]);

  return (
    <div className={s.drillDownContainer}>
      <button className={s.refreshBtn} onClick={onBack} style={{ marginBottom: '20px' }}>
        ⬅️ Back to Roster
      </button>

      <div className={s.drillDownHeader}>
        <div className={s.studentAvatarLg}>{student.name?.charAt(0)?.toUpperCase()}</div>
        <div>
          <h2>{student.name}</h2>
          <p className={s.studentMeta}>{student.email} · Joined {new Date(student.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className={s.sectionHeader} style={{ marginTop: '30px' }}>
        <div>
          <h3>📈 Activity History</h3>
          <p>Progress reports uniquely scoped to {student.name}.</p>
        </div>
        <div className={s.statBox}>{reports.length} Records</div>
      </div>

      {loading ? (
        <div className={s.loader}>Loading history...</div>
      ) : reports.length === 0 ? (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>📭</div>
          <p>No reports found for this student.</p>
        </div>
      ) : (
        <div className={s.cardsGrid}>
          {reports.map((r, i) => {
            const mood = MOOD_CFG[r.mood] || MOOD_CFG.Neutral;
            return (
              <div key={i} className={s.reportCard}>
                <div className={s.cardTopRow}>
                  <div>
                    <p className={s.reportStudentName}>{new Date(r.date).toLocaleDateString()}</p>
                    <p className={s.reportMeta}>🎯 Activity: {r.activity}</p>
                  </div>
                  <span className={`${s.moodBadge} ${mood.cls}`}>
                    {mood.emoji} {r.mood}
                  </span>
                </div>
                {r.notes && <div className={s.notesBox}>{r.notes}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TAB 1 — MY STUDENTS
═══════════════════════════════════════════════════ */
function StudentsTab() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading]  = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/users/students`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setStudents(data);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (selectedStudent) {
    return <DrillDownView student={selectedStudent} onBack={() => setSelectedStudent(null)} />;
  }

  return (
    <>
      <div className={s.sectionHeader}>
        <div>
          <h2>👥 My Students</h2>
          <p>All registered parent / student accounts on the platform.</p>
        </div>
        <button className={s.refreshBtn} onClick={load}>
          <RefreshCcw size={15} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>⏳</div>
          <p>Loading students…</p>
        </div>
      ) : students.length === 0 ? (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>📭</div>
          <p>No students registered yet.</p>
        </div>
      ) : (
        <div className={s.studentGrid}>
          {students.map((u) => (
            <div 
              key={u._id} 
              className={s.studentCard} 
              onClick={() => setSelectedStudent(u)}
              style={{ cursor: 'pointer' }}
              title="Click to view progress history"
            >
              <div className={s.studentAvatar}>
                {u.name?.charAt(0)?.toUpperCase() || '👤'}
              </div>
              <div>
                <p className={s.studentName}>{u.name}</p>
                <p className={s.studentMeta}>{u.email}</p>
                <p className={s.studentMeta}>
                  Joined {new Date(u.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════
   TAB 2 — PROGRESS REPORTS
═══════════════════════════════════════════════════ */
function ReportsTab() {
  const [reports, setReports] = useState([]);
  const [toast,   setToast]   = useState(null);
  const [form, setForm] = useState({
    studentName: '', date: today, activity: '', mood: 'Happy', notes: '', avatar: '👦',
  });

  const flash = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const loadReports = async () => {
    try {
      const res  = await fetch(`${API}/progress`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setReports([...data].sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch { /* silent */ }
  };

  useEffect(() => { loadReports(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res  = await fetch(`${API}/progress`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        flash('✅ Report saved!');
        setForm({ studentName: '', date: today, activity: '', mood: 'Happy', notes: '', avatar: '👦' });
        loadReports();
      } else {
        flash(`❌ ${data.message || 'Failed'}`, false);
      }
    } catch { flash('❌ Cannot connect to backend.', false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    await fetch(`${API}/progress/${id}`, { method: 'DELETE', headers: authHeaders() });
    loadReports();
  };

  const downloadPDF = (r) => {
    const doc = new jsPDF();
    doc.setFontSize(22); doc.setTextColor(61, 181, 160);
    doc.text('BrightSteps — Student Progress Report', 20, 22);
    autoTable(doc, {
      startY: 34,
      head: [['Field', 'Details']],
      body: [
        ['Student',  r.studentName],
        ['Date',     new Date(r.date).toLocaleDateString()],
        ['Activity', r.activity || '—'],
        ['Mood',     r.mood || '—'],
        ['Notes',    r.notes || '—'],
      ],
      headStyles: { fillColor: [61, 181, 160] },
      alternateRowStyles: { fillColor: [240, 253, 250] },
    });
    doc.save(`${r.studentName}_Report.pdf`);
  };

  return (
    <>
      {/* ── Add Report Form ── */}
      <div className={s.formCard}>
        <h3><PlusCircle size={19} /> New Daily Report</h3>
        <Toast {...(toast || { msg: '' })} />
        <form onSubmit={handleSave}>
          <div className={s.formRow}>
            <div className={s.formGroup}>
              <label className={s.formLabel}>👤 Student Name</label>
              <input className={s.formInput} type="text" placeholder="Student name…"
                value={form.studentName} onChange={e => setForm({ ...form, studentName: e.target.value })} required />
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>📅 Date</label>
              <input className={s.formInput} type="date" value={form.date}
                min={today} max={today}
                onChange={e => setForm({ ...form, date: e.target.value })} required />
            </div>
          </div>
          <div className={s.formRow}>
            <div className={s.formGroup}>
              <label className={s.formLabel}>🎯 Activity</label>
              <input className={s.formInput} type="text" placeholder="e.g. Reading, Puzzle, Sensory Play…"
                value={form.activity} onChange={e => setForm({ ...form, activity: e.target.value })} required />
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
          <div className={s.formGroup}>
            <label className={s.formLabel}>📓 Teacher's Notes</label>
            <textarea className={`${s.formInput} ${s.textarea}`}
              placeholder="How was their session today?…"
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button type="submit" className={s.saveBtn}>
            <Save size={16} /> Save Report
          </button>
        </form>
      </div>

      {/* ── Report History ── */}
      <div className={s.sectionHeader}>
        <div>
          <h2>📋 All Reports</h2>
          <p>{reports.length} report{reports.length !== 1 ? 's' : ''} on record.</p>
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
        <div className={s.cardsGrid}>
          {reports.map(r => {
            const mood = MOOD_CFG[r.mood] || MOOD_CFG.Neutral;
            return (
              <div key={r._id} className={s.reportCard}>
                <div className={s.cardTopRow}>
                  <div>
                    <p className={s.reportStudentName}>{r.studentName}</p>
                    <p className={s.reportMeta}>
                      📅 {new Date(r.date).toLocaleDateString()} &nbsp;·&nbsp; 🎯 {r.activity}
                    </p>
                  </div>
                  <span className={`${s.moodBadge} ${mood.cls}`}>
                    {mood.emoji} {r.mood}
                  </span>
                </div>
                {r.notes && <div className={s.notesBox}>{r.notes}</div>}
                <div className={s.cardActions}>
                  <button className={s.pdfBtn} onClick={() => downloadPDF(r)}>
                    <Download size={14} /> PDF
                  </button>
                  <button className={s.delBtn} onClick={() => handleDelete(r._id)}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════
   TAB 3 — RESOURCE LIBRARY
═══════════════════════════════════════════════════ */
function ResourcesTab() {
  const [resources, setResources] = useState([]);
  const [toast,     setToast]     = useState(null);
  const [form, setForm] = useState({
    title: '', type: 'video', fileUrl: '', instructionalText: '', targetSkill: 'general', requiredLevel: 0, offlineInstructions: ''
  });

  const flash = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const loadResources = async () => {
    try {
      const res  = await fetch(`${API}/resources`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setResources(data);
    } catch { /* silent */ }
  };

  useEffect(() => { loadResources(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res  = await fetch(`${API}/resources`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        flash('✅ Resource saved!');
        setForm({ title: '', type: 'video', fileUrl: '', instructionalText: '', targetSkill: 'general', requiredLevel: 0, offlineInstructions: '' });
        loadResources();
      } else {
        flash(`❌ ${data.error || 'Failed'}`, false);
      }
    } catch { flash('❌ Cannot connect to backend.', false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resource?')) return;
    await fetch(`${API}/resources/${id}`, { method: 'DELETE', headers: authHeaders() });
    loadResources();
  };

  const rcClass = (type) =>
    ({ video: s.rcVideo, pdf: s.rcPdf, link: s.rcLink }[type] || '');
  const bdgClass = (type) =>
    ({ video: s.badgeVideo, pdf: s.badgePdf, link: s.badgeLink }[type] || '');

  return (
    <>
      {/* ── Add Resource Form ── */}
      <div className={s.formCard} style={{ borderBottomColor: 'var(--td-lav)' }}>
        <h3><PlusCircle size={19} /> Add Learning Material</h3>
        <Toast {...(toast || { msg: '' })} />
        <form onSubmit={handleSave}>
          <div className={s.formRow}>
            <div className={s.formGroup}>
              <label className={s.formLabel}>📌 Title</label>
              <input className={s.formInput} type="text" placeholder="Resource title…"
                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>🗂️ Type</label>
              <select className={s.formInput} value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="video">🎬 Video</option>
                <option value="pdf">📄 PDF Document</option>
                <option value="link">🔗 Educational Link</option>
                <option value="offline">🌳 Offline Activity</option>
              </select>
            </div>
          </div>
          <div className={s.formRow}>
            <div className={s.formGroup}>
              <label className={s.formLabel}>🎯 Target Skill</label>
              <select className={s.formInput} value={form.targetSkill}
                onChange={e => setForm({ ...form, targetSkill: e.target.value })}>
                <option value="general">General / Routine</option>
                <option value="focus">Focus &amp; Attention</option>
                <option value="calming">Calming &amp; Winding Down</option>
                <option value="communication">Communication &amp; Social</option>
              </select>
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>⭐ Required Level</label>
              <input className={s.formInput} type="number" min="0" max="25"
                value={form.requiredLevel} onChange={e => setForm({ ...form, requiredLevel: parseInt(e.target.value) || 0 })} required />
            </div>
          </div>

          {form.type === 'offline' ? (
            <div className={s.formGroup} style={{ marginBottom: '16px' }}>
              <label className={s.formLabel}>🌳 Offline Instructions</label>
              <textarea className={`${s.formInput} ${s.textarea}`}
                placeholder="Explain the screen-free activity steps here..."
                value={form.offlineInstructions}
                onChange={e => setForm({ ...form, offlineInstructions: e.target.value })} required />
            </div>
          ) : (
            <div className={s.formGroup} style={{ marginBottom: '16px' }}>
              <label className={s.formLabel}>🔗 URL</label>
              <input className={s.formInput} type="text" placeholder="https://…"
                value={form.fileUrl} onChange={e => setForm({ ...form, fileUrl: e.target.value })} required />
            </div>
          )}
          <div className={s.formGroup}>
            <label className={s.formLabel}>🗒️ Instructional Text (Accessibility / TTS)</label>
            <textarea className={`${s.formInput} ${s.textarea}`}
              placeholder="Describe in simple words what the student should do or learn…"
              value={form.instructionalText}
              onChange={e => setForm({ ...form, instructionalText: e.target.value })} required />
          </div>
          <button type="submit" className={s.saveBtn}
            style={{ background:'var(--td-lav)', boxShadow:'0 4px 0 var(--td-lav-dk)' }}>
            <Save size={16} /> Save Resource
          </button>
        </form>
      </div>

      {/* ── Resources Grid ── */}
      <div className={s.sectionHeader}>
        <div>
          <h2>🗂️ Active Resources</h2>
          <p>{resources.length} material{resources.length !== 1 ? 's' : ''} in the library.</p>
        </div>
        <button className={s.refreshBtn} onClick={loadResources}>
          <RefreshCcw size={15} /> Refresh
        </button>
      </div>

      {resources.length === 0 ? (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>📚</div>
          <p>No resources yet — add one above!</p>
        </div>
      ) : (
        <div className={s.cardsGrid}>
          {resources.map(r => (
            <div key={r._id} className={`${s.resourceCard} ${rcClass(r.type)}`}>
              <div className={s.resourceBody}>
                <span className={`${s.typeBadge} ${bdgClass(r.type)}`}>
                  {TYPE_EMOJI[r.type] || '📦'} {r.type.toUpperCase()}
                </span>
                <span className={s.typeBadge} style={{ background: '#fefce8', color: '#92400e', border: '1px solid #fde047', marginLeft: '6px' }}>
                  ⭐ Lvl {r.requiredLevel || 0}
                </span>
                <p className={s.resourceTitle}>{r.title}</p>
                {r.instructionalText && (
                  <p className={s.resourceNotes}>🗒️ {r.instructionalText}</p>
                )}
              </div>
              <div className={s.resourceActions}>
                {r.type !== 'offline' && r.fileUrl ? (
                  <a href={r.fileUrl} target="_blank" rel="noreferrer" className={s.openLink}>
                    <ExternalLink size={14} /> Open Resource
                  </a>
                ) : (
                  <span className={s.openLink} style={{ color: '#27ae60', background: 'none' }}>
                    ✅ Offline Activity
                  </span>
                )}
                <button className={s.delBtn} onClick={() => handleDelete(r._id)}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════
   TAB 4 — INBOX / MESSAGES
═══════════════════════════════════════════════════ */
function InboxTab() {
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await fetch(`${API}/users/students`, { headers: authHeaders() });
        if (res.ok) setContacts(await res.json());
      } catch { }
    };
    fetchContacts();
  }, []);

  useEffect(() => {
    if (!activeContact) return;
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/messages/${activeContact._id}`, { headers: authHeaders() });
        if (res.ok) setMessages(await res.json());
      } catch { }
      setLoading(false);
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [activeContact]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeContact) return;
    try {
      const res = await fetch(`${API}/messages`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ receiverId: activeContact._id, content: newMessage })
      });
      if (res.ok) {
        const savedMsg = await res.json();
        setMessages([...messages, savedMsg]);
        setNewMessage('');
      }
    } catch { }
  };

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('brightsteps_user')); } 
    catch { return null; }
  })();

  return (
    <div className={s.inboxContainer}>
      {/* LEFT PANE - CONTACTS */}
      <div className={s.contactList}>
        <div className={s.contactHeader}>
          <h3>Contacts</h3>
        </div>
        <div className={s.scrollableContacts}>
          {contacts.map(c => (
            <div 
              key={c._id} 
              className={`${s.contactItem} ${activeContact?._id === c._id ? s.contactActive : ''}`}
              onClick={() => setActiveContact(c)}
            >
              <div className={s.contactAvatar}>{c.name.charAt(0).toUpperCase()}</div>
              <div>
                <p className={s.contactName}>{c.parentName || c.name} (Parent)</p>
                <p className={s.contactRole}>Student: {c.name}</p>
              </div>
            </div>
          ))}
          {contacts.length === 0 && <p style={{padding: '20px', color: '#64748B'}}>No assigned students.</p>}
        </div>
      </div>

      {/* RIGHT PANE - CHAT */}
      <div className={s.chatArea}>
        {activeContact ? (
          <>
            <div className={s.chatHeader}>
              <div className={s.contactAvatar}>{activeContact.name.charAt(0).toUpperCase()}</div>
              <div>
                <h3 className={s.chatTitle}>{activeContact.parentName || activeContact.name}</h3>
                <p className={s.chatSubtitle}>Re: {activeContact.name}</p>
              </div>
            </div>
            
            <div className={s.chatHistory}>
              {loading && messages.length === 0 ? <p>Loading messages...</p> : (
                messages.map(m => {
                  const isMine = m.senderId === user?._id;
                  return (
                    <div key={m._id} className={`${s.messageWrapper} ${isMine ? s.messageMine : s.messageTheirs}`}>
                      <div className={s.messageBubble}>
                        {m.content}
                      </div>
                      <div className={s.messageTime}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form className={s.chatForm} onSubmit={handleSend}>
              <input 
                type="text" 
                placeholder="Type your message..." 
                className={s.chatInput}
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
              />
              <button type="submit" className={s.chatSendBtn} disabled={!newMessage.trim()}>
                <Send size={16} /> Send
              </button>
            </form>
          </>
        ) : (
          <div className={s.chatPlaceholder}>
            <MessageSquare size={48} color="#CBD5E1" />
            <p>Select a contact to view conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN — TEACHER DASHBOARD
═══════════════════════════════════════════════════ */
const TABS = [
  { id: 'students',  label: 'My Students',     icon: <Users size={17} /> },
  { id: 'reports',   label: 'Progress Reports', icon: <ClipboardList size={17} /> },
  { id: 'resources', label: 'Resource Library', icon: <BookOpen size={17} /> },
  { id: 'inbox',     label: 'Messages',        icon: <MessageSquare size={17} /> },
];

export default function TeacherDashboard() {
  const navigate       = useNavigate();
  const [activeTab, setActiveTab] = useState('students');

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('brightsteps_user')); }
    catch { return null; }
  })();

  const handleLogout = () => {
    localStorage.removeItem('brightsteps_token');
    localStorage.removeItem('brightsteps_user');
    navigate('/login');
  };

  return (
    <div className={s.wrapper}>

      {/* ── Navigation ── */}
      <nav className={s.nav}>
        <Link to="/teacher-dashboard" className={s.navBrand}>
          ✨ Bright<em>Steps</em>
        </Link>
        <div className={s.navRight}>
          <div className={s.navChip}>
            👩‍🏫 {user?.name || 'Teacher'}
            <span className={s.rolePill}>Teacher</span>
          </div>
          <button className={s.logoutBtn} onClick={handleLogout}>
            <LogOut size={15} /> Log Out
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className={s.hero}>
        <span className={s.heroDeco}>📋</span>
        <span className={s.heroDeco}>🌟</span>
        <span className={s.heroDeco}>📚</span>
        <span className={s.heroDeco}>🎯</span>

        <h1 className={s.heroTitle}>
          Teacher <span className={s.accent}>Dashboard</span>
        </h1>
        <p className={s.heroSub}>
          Monitor students · record progress · manage learning materials
        </p>
        <div className={s.heroStats}>
          <span className={`${s.statChip} ${s.chipAmber}`}>📋 Full Report Access</span>
          <span className={`${s.statChip} ${s.chipTeal}`}>👥 All Students</span>
          <span className={`${s.statChip} ${s.chipSage}`}>🏅 Admin Control</span>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className={s.tabBar}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`${s.tabBtn} ${activeTab === t.id ? s.tabActive : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.icon} {t.label}
            <span className={s.tabDot} />
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <main className={s.main}>
        {activeTab === 'students'  && <StudentsTab />}
        {activeTab === 'reports'   && <ReportsTab />}
        {activeTab === 'resources' && <ResourcesTab />}
        {activeTab === 'inbox'     && <InboxTab />}
      </main>

    </div>
  );
}