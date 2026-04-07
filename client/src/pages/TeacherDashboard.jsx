/**
 * TeacherDashboard.jsx
 * Professional 5-tab interface: My Students | Progress Reports | Resource Library | Messages | Analytics
 * Theme matches the BrightSteps Landing Page (paper/ink/rose/amber/teal palette).
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users, ClipboardList, BookOpen,
  RefreshCcw, LogOut, Download, Trash2,
  ExternalLink, Save, PlusCircle,
  MessageSquare, Send, BarChart3, Filter, FileText
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid,
  XAxis, YAxis, Tooltip, Legend, BarChart, Bar,
  PieChart, Pie, Cell
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import s from './TeacherDashboard.module.css';
import { downloadSingleReportPDF } from '../utils/pdfGenerator';
import html2canvas from 'html2canvas';

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
    downloadSingleReportPDF(r, 'BrightSteps — Student Progress Report');
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
   TAB 5 — ANALYTICS (real backend data)
═══════════════════════════════════════════════════ */
const CHART_COLORS = ['#E85C45', '#44A7CE', '#5EAD6E', '#9C80D2', '#F2B53A', '#f9a8d4'];

const MOOD_EMOJI_MAP = {
  Happy: '😊', Excited: '🤩', Neutral: '😐', Tired: '😴', Frustrated: '😤',
};

function getPeriodDefaults(reportType) {
  const today = new Date();
  const end = today.toISOString().split('T')[0];
  const startDate = new Date(today);
  if (reportType === 'weekly') {
    startDate.setDate(today.getDate() - 6);
  } else {
    startDate.setDate(today.getDate() - 29);
  }
  return { startDate: startDate.toISOString().split('T')[0], endDate: end };
}

function AnalyticsTab() {
  const [reportType, setReportType] = useState('weekly');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [dateRange, setDateRange] = useState(getPeriodDefaults('weekly'));

  const [data, setData] = useState(null);
  const [compData, setCompData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateError, setDateError] = useState(null);

  // Fetch main analytics data
  const fetchAnalytics = async (period, start, end, student) => {
    const params = new URLSearchParams();
    params.set('period', period);
    if (start) params.set('startDate', start);
    if (end) params.set('endDate', end);
    if (student) params.set('studentName', student);
    const res = await fetch(`${API}/analytics/teacher-summary?${params}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const main = await fetchAnalytics(reportType, dateRange.startDate, dateRange.endDate, selectedStudent);
      setData(main);

      // Fetch comparison data (weekly AND monthly, ignoring filters)
      const [weekly, monthly] = await Promise.all([
        fetchAnalytics('weekly', null, null, selectedStudent),
        fetchAnalytics('monthly', null, null, selectedStudent),
      ]);
      setCompData([
        { metric: 'Active Students', Weekly: weekly.summary.activeStudentsInPeriod, Monthly: monthly.summary.activeStudentsInPeriod },
        { metric: 'Total Reports', Weekly: weekly.summary.totalReports, Monthly: monthly.summary.totalReports },
        { metric: 'Resources Shared', Weekly: weekly.summary.totalResources, Monthly: monthly.summary.totalResources },
        { metric: 'Game Play Time (s)', Weekly: weekly.summary.totalGamePlayTime, Monthly: monthly.summary.totalGamePlayTime },
      ]);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Validate bounds: Start >= 2026, End <= Today
    const startYear = new Date(dateRange.startDate).getFullYear();
    const TODAY = new Date().toISOString().split('T')[0];
    
    if (startYear < 2026 || dateRange.endDate > TODAY) {
      setDateError("⚠️ Invalid date range. Start year must be 2026 or later, and End Date cannot exceed today.");
      return; 
    }
    setDateError(null);
    loadData();
  }, [reportType, dateRange, selectedStudent]); // eslint-disable-line

  useEffect(() => {
    setDateRange(getPeriodDefaults(reportType));
    setDateError(null);
  }, [reportType]);

  const resetFilters = () => {
    setReportType('weekly');
    setSelectedStudent('');
    setDateRange(getPeriodDefaults('weekly'));
  };

  const addChartToDoc = (doc, dataUrl, title) => {
    if (!dataUrl) return;
    doc.addPage();
    let y = 20;
    doc.setFontSize(16); doc.setTextColor(61, 181, 160);
    doc.text(title, 14, y);
    y += 10;
    
    // Scale image correctly based on A4 width limits
    const imgProps = doc.getImageProperties(dataUrl);
    const pdfWidth = 180;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    doc.addImage(dataUrl, 'PNG', 15, y, pdfWidth, pdfHeight);
  };

  const exportAnalyticsPDF = async () => {
    if (!data) return;

    // ── 1. Capture visual graph rows via html2canvas ──
    let img1 = null, img2 = null, img3 = null;
    try {
      const el1 = document.getElementById('charts-row-1');
      const el2 = document.getElementById('charts-row-2');
      const el3 = document.getElementById('charts-row-3');
      const opts = { scale: 1.5, backgroundColor: '#fafffe' }; // match dash bg
      
      if (el1) img1 = (await html2canvas(el1, opts)).toDataURL('image/png');
      if (el2) img2 = (await html2canvas(el2, opts)).toDataURL('image/png');
      if (el3) img3 = (await html2canvas(el3, opts)).toDataURL('image/png');
    } catch(e) { console.error('Error capturing charts', e); }

    // ── 2. Generate original data PDF ──
    const doc = new jsPDF();
    let currentY = 20;
    doc.setFontSize(20); doc.setTextColor(61, 181, 160);
    doc.text('BrightSteps Teacher Analytics Report', 14, currentY); currentY += 10;
    doc.setFontSize(11); doc.setTextColor(70, 70, 70);
    doc.text(`Report Type: ${data.period.toUpperCase()}`, 14, currentY); currentY += 6;
    doc.text(`Date Range: ${data.startDate} to ${data.endDate}`, 14, currentY); currentY += 6;
    if (selectedStudent) { doc.text(`Student: ${selectedStudent}`, 14, currentY); currentY += 6; }
    currentY += 4;
    const summaryRows = [
      ['Total Students', String(data.summary.totalStudents)],
      ['Active This Period', String(data.summary.activeStudentsInPeriod)],
      ['Total Reports', String(data.summary.totalReports)],
      ['Unique Activities', String(data.summary.totalActivities)],
      ['Resources Shared', String(data.summary.totalResources)],
      ['Game Play Time', `${data.summary.totalGamePlayTime}s`],
    ];
    autoTable(doc, { startY: currentY, head: [['Metric', 'Value']], body: summaryRows, headStyles: { fillColor: [61, 181, 160] }, alternateRowStyles: { fillColor: [240, 253, 250] } });
    currentY = doc.lastAutoTable.finalY + 10;
    if (data.reportsByStudent.length) {
      autoTable(doc, { startY: currentY, head: [['Student', 'Reports', 'Active Days', 'Attendance', 'Activities', 'Game Reports', 'Top Mood']], body: data.reportsByStudent.map(r => [r.studentName, r.totalReports, r.activeDays, r.attendance, r.uniqueActivities, r.gameReports, r.topMood]), headStyles: { fillColor: [94, 207, 186] }, alternateRowStyles: { fillColor: [247, 255, 252] } });
      currentY = doc.lastAutoTable.finalY + 10;
    }
    if (data.leaderboard.length) {
      autoTable(doc, { startY: currentY, head: [['Rank', 'Student', 'Game', 'Stars', 'Time(s)', 'Moves']], body: data.leaderboard.map(r => [r.rank, r.studentName, r.gameName, r.stars, r.completionTime, r.totalMoves]), headStyles: { fillColor: [242, 181, 58] }, alternateRowStyles: { fillColor: [255, 252, 240] } });
    }

    // ── 3. Append Graph Appendices ──
    addChartToDoc(doc, img1, 'Appendix I: Student Report Activity Graphs');
    addChartToDoc(doc, img2, 'Appendix II: Resource & Targets Graphs');
    addChartToDoc(doc, img3, 'Appendix III: Educational Game Progress Graphs');

    doc.save(`teacher_${data.period}_analytics_report.pdf`);
  };

  if (loading) {
    return <div className={s.emptyState}><div className={s.emptyIcon}>⏳</div><p>Loading analytics…</p></div>;
  }
  if (error) {
    return <div className={s.emptyState}><div className={s.emptyIcon}>❌</div><p>Error: {error}</p><button className={s.refreshBtn} onClick={loadData}><RefreshCcw size={15} /> Retry</button></div>;
  }
  if (!data) return null;

  const { summary, reportsByStudent, dailyActivity, moodDistribution, resourceTypeBreakdown, resourceSkillBreakdown, resourceList, levelDistribution, gameTimeData, gamePerformance, leaderboard, students } = data;

  const summaryCards = [
    { icon: '👥', label: 'Total Students',     value: summary.totalStudents },
    { icon: '🟢', label: 'Active This Period',  value: summary.activeStudentsInPeriod },
    { icon: '📋', label: 'Total Reports',       value: summary.totalReports },
    { icon: '🎯', label: 'Unique Activities',   value: summary.totalActivities },
    { icon: '📚', label: 'Resources Shared',    value: summary.totalResources },
    { icon: '🎮', label: 'Game Plays',          value: summary.totalGamePlays ?? 0 },
    { icon: '⏱️', label: 'Game Play Time',      value: `${summary.totalGamePlayTime}s` },
  ];

  return (
    <>
      {/* ── Header ── */}
      <div className={s.sectionHeader}>
        <div>
          <h2>📊 {reportType === 'weekly' ? 'Weekly' : 'Monthly'} Analytics</h2>
          <p>Real-time overview of student activity, resources, and game performance.</p>
        </div>
        <button className={s.refreshBtn} onClick={exportAnalyticsPDF}>
          <FileText size={15} /> Export PDF
        </button>
      </div>

      {/* ── Filters ── */}
      <div className={s.analyticsFiltersCard}>
        <div className={s.analyticsFiltersHead}>
          <div className={s.analyticsFiltersLabel}><Filter size={16} /> Filters</div>
          <button className={s.refreshBtn} onClick={resetFilters}>Reset</button>
        </div>
        <div className={s.analyticsFiltersGrid}>
          <div className={s.analyticsFilterGroup}>
            <label>Report Type</label>
            <select className={s.formInput} value={reportType} onChange={e => setReportType(e.target.value)}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className={s.analyticsFilterGroup}>
            <label>Student</label>
            <select className={s.formInput} value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
              <option value="">All Students</option>
              {students.map(st => <option key={st._id} value={st.name}>{st.name}</option>)}
            </select>
          </div>
          <div className={s.analyticsFilterGroup}>
            <label>Start Date</label>
            <input className={s.formInput} type="date" min="2026-01-01" max={new Date().toISOString().split('T')[0]} value={dateRange.startDate} onChange={e => setDateRange(p => ({ ...p, startDate: e.target.value }))} />
          </div>
          <div className={s.analyticsFilterGroup}>
            <label>End Date</label>
            <input className={s.formInput} type="date" min="2026-01-01" max={new Date().toISOString().split('T')[0]} value={dateRange.endDate} onChange={e => setDateRange(p => ({ ...p, endDate: e.target.value }))} />
          </div>
        </div>
        
        {dateError && (
          <div style={{ color: '#E85C45', background: '#FDEAE6', border: '1px solid #eba498', padding: '12px 16px', borderRadius: '12px', marginTop: '20px', fontWeight: 'bold' }}>
            {dateError}
          </div>
        )}
      </div>

      {/* ── Summary Cards ── */}
      <div className={s.analyticsSummaryGrid}>
        {summaryCards.map(card => (
          <div key={card.label} className={s.analyticsSummaryCard}>
            <div className={s.analyticsSummaryIcon}>{card.icon}</div>
            <div className={s.analyticsSummaryValue}>{card.value}</div>
            <div className={s.analyticsSummaryLabel}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* ── Section 1: Report Activity ── */}
      <div className={s.analyticsBlock}>
        <div className={s.analyticsBlockHead}>
          <h3>1. Student Report Activity</h3>
          <span className={s.statBox}>{summary.totalReports} Reports · {summary.activeStudentsInPeriod} Students</span>
        </div>
        <div id="charts-row-1" className={s.analyticsChartsRow}>
          <div className={s.analyticsChartCard}>
            <h4>Daily Report Trend</h4>
            <div className={s.chartWrap}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" /><YAxis allowDecimals={false} /><Tooltip /><Legend />
                  <Line type="monotone" dataKey="reports" stroke="#E85C45" name="Reports" strokeWidth={3} />
                  <Line type="monotone" dataKey="uniqueStudents" stroke="#44A7CE" name="Active Students" strokeWidth={3} />
                  <Line type="monotone" dataKey="gameReports" stroke="#5EAD6E" name="Game Reports" strokeWidth={3} />
                  <Line type="monotone" dataKey="totalStars" stroke="#F2B53A" name="Stars Earned" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className={s.analyticsChartCard}>
            <h4>Mood Distribution</h4>
            <div className={s.chartWrap}>
              {moodDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={moodDistribution} dataKey="value" nameKey="name" outerRadius={90} label>
                      {moodDistribution.map((entry, index) => (
                        <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} reports`, `${MOOD_EMOJI_MAP[name] || ''} ${name}`]} /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{height:300,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'var(--td-ink-soft)',gap:'8px'}}>
                  <span style={{fontSize:'2rem'}}>😐</span>
                  <p style={{margin:0,fontSize:'0.85rem'}}>No mood data — teacher reports needed</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className={s.analyticsTableScroll}>
          <table className={s.analyticsTable}>
            <thead><tr><th>Student</th><th>Reports</th><th>Active Days</th><th>Attendance</th><th>Activities</th><th>Game Reports</th><th>Stars</th><th>Top Mood</th></tr></thead>
            <tbody>
              {reportsByStudent.length ? reportsByStudent.map(row => (
                <tr key={row.studentName}><td>{row.studentName}</td><td>{row.totalReports}</td><td>{row.activeDays}</td><td>{row.attendance}</td><td>{row.uniqueActivities}</td><td>{row.gameReports}</td><td>{row.totalStars}</td><td>{MOOD_EMOJI_MAP[row.topMood] || ''} {row.topMood}</td></tr>
              )) : <tr><td colSpan="8" style={{textAlign:'center',padding:'20px',color:'var(--td-ink-soft)'}}>No report data for this period.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 2: Resource Activity ── */}
      <div className={s.analyticsBlock}>
        <div className={s.analyticsBlockHead}>
          <h3>2. Resource & Recommendation Activity</h3>
          <span className={s.statBox}>{summary.totalResources} Resources Shared</span>
        </div>
        <div id="charts-row-2" className={s.analyticsChartsRow}>
          <div className={s.analyticsChartCard}>
            <h4>Resources by Type</h4>
            <div className={s.chartWrap}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={resourceTypeBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Legend />
                  <Bar dataKey="total" fill="#44A7CE" name="Count" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className={s.analyticsChartCard}>
            <h4>Resources by Target Skill</h4>
            <div className={s.chartWrap}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={resourceSkillBreakdown} dataKey="value" nameKey="name" outerRadius={90} label>
                    {resourceSkillBreakdown.map((entry, index) => (
                      <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className={s.analyticsTableScroll}>
          <table className={s.analyticsTable}>
            <thead><tr><th>Title</th><th>Type</th><th>Target Skill</th><th>Level</th><th>Assigned To</th><th>Date</th></tr></thead>
            <tbody>
              {resourceList.length ? resourceList.map(row => (
                <tr key={row.id}><td>{row.title}</td><td>{row.type}</td><td>{row.targetSkill}</td><td>⭐ Lvl {row.requiredLevel}</td><td>{row.studentName || 'All'}</td><td>{new Date(row.createdAt).toLocaleDateString()}</td></tr>
              )) : <tr><td colSpan="6" style={{textAlign:'center',padding:'20px',color:'var(--td-ink-soft)'}}>No resources shared in this period.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 3: Games Analytics ── */}
      <div className={s.analyticsBlock}>
        <div className={s.analyticsBlockHead}>
          <h3>3. Educational Games Analytics</h3>
          <span className={s.statBox}>{summary.totalGamePlays ?? 0} Plays · {summary.totalGamePlayTime}s Play Time</span>
        </div>
        <div id="charts-row-3" className={s.analyticsChartsRow3}>
          <div className={s.analyticsChartCard}>
            <h4>Performance Distribution</h4>
            <div className={s.chartWrap}>
              {levelDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={levelDistribution} dataKey="value" nameKey="name" outerRadius={80} label>
                      {levelDistribution.map((entry, index) => (
                        <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{height:260,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'var(--td-ink-soft)',gap:'8px'}}>
                  <span style={{fontSize:'2rem'}}>🎮</span>
                  <p style={{margin:0,fontSize:'0.85rem'}}>No game plays in this period</p>
                </div>
              )}
            </div>
          </div>
          <div className={s.analyticsChartCard}>
            <h4>Time Spent per Game</h4>
            <div className={s.chartWrap}>
              {gameTimeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={gameTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip />
                    <Bar dataKey="total" fill="#5EAD6E" name="Seconds" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{height:260,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'var(--td-ink-soft)',gap:'8px'}}>
                  <span style={{fontSize:'2rem'}}>⏱️</span>
                  <p style={{margin:0,fontSize:'0.85rem'}}>No time data in this period</p>
                </div>
              )}
            </div>
          </div>
          <div className={s.analyticsChartCard}>
            <h4>Plays &amp; Moves per Game</h4>
            <div className={s.chartWrap}>
              {gamePerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={gamePerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Legend />
                    <Bar dataKey="plays" fill="#E85C45" name="Plays" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="totalMoves" fill="#9C80D2" name="Total Moves" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{height:260,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'var(--td-ink-soft)',gap:'8px'}}>
                  <span style={{fontSize:'2rem'}}>📊</span>
                  <p style={{margin:0,fontSize:'0.85rem'}}>No play data in this period</p>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Game Performance Summary Table */}
        <div className={s.analyticsTableScroll}>
          <table className={s.analyticsTable}>
            <thead><tr><th>Game</th><th>Total Plays</th><th>Total Moves</th><th>Total Stars</th><th>Avg Stars / Play</th></tr></thead>
            <tbody>
              {gamePerformance.length ? gamePerformance.map(row => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td>{row.plays}</td>
                  <td>{row.totalMoves}</td>
                  <td>{'⭐'.repeat(Math.min(row.totalStars, 10))}{row.totalStars > 10 ? ` (${row.totalStars})` : ''}</td>
                  <td>{row.plays > 0 ? (row.totalStars / row.plays).toFixed(1) : '—'}</td>
                </tr>
              )) : <tr><td colSpan="5" style={{textAlign:'center',padding:'20px',color:'var(--td-ink-soft)'}}>No game data for this period.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Top 5 Leaderboard — shown only when data exists */}
        {leaderboard.length > 0 && (
          <>
            <div style={{marginTop:'16px',fontWeight:600,color:'var(--td-ink)',fontSize:'0.95rem',padding:'0 4px'}}>🏆 Top Plays Leaderboard</div>
            <div className={s.analyticsTableScroll} style={{marginTop:'8px'}}>
              <table className={s.analyticsTable}>
                <thead><tr><th>Rank</th><th>Student</th><th>Game</th><th>Stars</th><th>Time</th><th>Moves</th><th>Date</th></tr></thead>
                <tbody>
                  {leaderboard.map(row => (
                    <tr key={`${row.rank}-${row.gameName}`}>
                      <td>#{row.rank}</td><td>{row.studentName}</td><td>{row.gameName}</td>
                      <td>{'⭐'.repeat(row.stars)}</td><td>{row.completionTime}s</td>
                      <td>{row.totalMoves}</td><td>{new Date(row.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Section 4: Weekly vs Monthly Comparison ── */}
      {compData && (
        <div className={s.analyticsBlock}>
          <div className={s.analyticsBlockHead}>
            <h3>4. Weekly vs Monthly Comparison</h3>
            <span className={s.statBox}>Side-by-Side</span>
          </div>
          <div className={s.analyticsChartCard}>
            <div className={s.chartWrap}>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={compData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" /><YAxis allowDecimals={false} /><Tooltip /><Legend />
                  <Bar dataKey="Weekly" fill="#44A7CE" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Monthly" fill="#E85C45" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </>
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
  { id: 'analytics', label: 'Analytics',       icon: <BarChart3 size={17} /> },
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
        {activeTab === 'analytics' && <AnalyticsTab />}
      </main>

    </div>
  );
}