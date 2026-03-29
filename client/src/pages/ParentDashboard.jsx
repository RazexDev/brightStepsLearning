/**
 * ParentDashboard.jsx
 * 5-tab Parent Portal: AI Chat Flags | Routines | Resources | Reports | Teacher Chat
 * Protected by sessionStorage 'parent_unlocked' gate.
 * Matches BrightSteps landing page design system.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, CalendarDays, BookOpen,
  ClipboardList, MessageSquare, LogOut,
  RefreshCcw, Download, ExternalLink, Plus, Trash2, X, Send, Edit2, Check
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import s from './ParentDashboard.module.css';

/* ── Constants ─────────────────────────────── */
const API = 'http://localhost:5001/api';
const authHdr = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('brightsteps_token')}`,
});

const TYPE_EMOJI = { video: '🎬', pdf: '📄', link: '🔗', offline: '🌳' };
const MOOD_CFG = {
  Happy:      { emoji: '😊', cls: s.moodHappy      },
  Excited:    { emoji: '🤩', cls: s.moodExcited    },
  Neutral:    { emoji: '😐', cls: s.moodNeutral    },
  Tired:      { emoji: '😴', cls: s.moodTired      },
  Frustrated: { emoji: '😤', cls: s.moodFrustrated },
};

/* ═══════════════════════════════════
   TAB 1 — AI CHAT FLAGS
═══════════════════════════════════ */
function ChatFlagsTab({ childName }) {
  const [flags,   setFlags]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/flags`, { headers: authHdr() });
      const data = await res.json();
      if (res.ok) setFlags(data);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const flagClass    = (sev) => ({ high: s.flagHigh, medium: s.flagMedium, low: s.flagLow }[sev] || s.flagLow);
  const sevBadgeCls  = (sev) => ({ high: s.sevHigh,  medium: s.sevMedium,  low: s.sevLow  }[sev] || s.sevLow);
  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso);
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <>
      <div className={s.sectionHeader}>
        <div>
          <h2>🚩 AI Chat Flags</h2>
          <p>SparkyBot flagged these conversations for parental awareness.</p>
        </div>
        <button className={s.refreshBtn} onClick={load}>
          <RefreshCcw size={15} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className={s.emptyState}><div className={s.emptyIcon}>⏳</div><p>Loading flags…</p></div>
      ) : flags.length === 0 ? (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>✅</div>
          <p>No flags! Everything looks great.</p>
        </div>
      ) : (
        <div className={s.flagGrid}>
          {flags.map(f => (
            <div key={f._id} className={`${s.flagCard} ${flagClass(f.severity)}`}>
              <div className={s.flagTopRow}>
                <div>
                  <p className={s.flagStudent}>🤖 SparkyBot detected: <strong>{f.emotion}</strong></p>
                  <p className={s.flagTime}>🕐 {timeAgo(f.timestamp)}</p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {f.resolved && <span className={s.resolvedBadge}>✅ Resolved</span>}
                  <span className={`${s.severityBadge} ${sevBadgeCls(f.severity)}`}>
                    {f.severity === 'high' ? '🔴' : f.severity === 'medium' ? '🟡' : '🟢'} {f.severity}
                  </span>
                </div>
              </div>
              <p className={s.flagMessage}>"{f.message}"</p>
              <p className={s.flagContext}>📍 {f.context}</p>
              <div className={s.sparkyNote}>
                🤖 {f.sparkyNote}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════
   TAB 2 — ROUTINE MANAGEMENT
═══════════════════════════════════ */
function RoutinesTab({ childName }) {
  const [routines, setRoutines] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', cls: 'morning', type: 'adhd' });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/routines`, { headers: authHdr() });
      const data = await res.json();
      if (res.ok) setRoutines(data);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAddRoutine = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, studentName: childName, defaultTasks: [{ label: 'Custom Task 1', mins: 5 }] };
      const res = await fetch(`${API}/routines`, {
        method: 'POST',
        headers: authHdr(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ title: '', cls: 'morning', type: 'adhd' });
        load();
      } else {
        alert('Failed to add routine.');
      }
    } catch (err) { alert('Error adding routine.'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this routine?')) {
      try {
        const res = await fetch(`${API}/routines/${id}`, { method: 'DELETE', headers: authHdr() });
        if (res.ok) setRoutines(routines.filter(r => r._id !== id));
      } catch (err) { alert('Error deleting routine.'); }
    }
  };

  return (
    <>
      <div className={s.sectionHeader}>
        <div>
          <h2>📅 Routine Management</h2>
          <p>Daily schedules assigned to {childName}.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className={s.refreshBtn} onClick={() => setShowForm(!showForm)}>
            {showForm ? <X size={15}/> : <Plus size={15}/>} {showForm ? 'Cancel' : 'New Routine'}
          </button>
          <button className={s.refreshBtn} onClick={load}>
            <RefreshCcw size={15} /> Refresh
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAddRoutine} className={s.inlineForm}>
          <h3>Add Custom Routine</h3>
          <div className={s.formGrid}>
            <input required placeholder="Routine Title (e.g., Morning Prep)" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className={s.formInput} />
            <select value={form.cls} onChange={e => setForm({...form, cls: e.target.value})} className={s.formInput}>
              <option value="morning">Morning</option>
              <option value="school">School</option>
              <option value="bedtime">Bedtime</option>
              <option value="custom">Custom</option>
            </select>
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className={s.formInput}>
              <option value="adhd">ADHD Track</option>
              <option value="autism">Autism Track</option>
            </select>
            <button type="submit" className={s.formSubmitBtn}>Save Routine</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className={s.emptyState}><div className={s.emptyIcon}>⏳</div><p>Loading routines…</p></div>
      ) : routines.length === 0 ? (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>📭</div>
          <p>No routines yet. Create them above!</p>
        </div>
      ) : (
        <div className={s.routineGrid}>
          {routines.map(r => (
            <div key={r._id} className={s.routineCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <p className={s.routineName}>{r.iconEmoji || '📋'} {r.title}</p>
                <button className={s.delIconButton} onClick={() => handleDelete(r._id)} title="Delete Routine">
                  <Trash2 size={16} />
                </button>
              </div>
              <p className={s.routineMeta}>
                {r.isDefault ? '⭐ Default routine' : '🛠️ Custom routine'} · {r.defaultTasks?.length || 0} tasks
              </p>
              {r.defaultTasks && r.defaultTasks.length > 0 && (
                <div className={s.taskPills}>
                  {r.defaultTasks.slice(0, 4).map((t, i) => (
                    <span key={i} className={s.taskPill}>{t.label || t}</span>
                  ))}
                  {r.defaultTasks.length > 4 && (
                    <span className={s.taskPill}>+{r.defaultTasks.length - 4} more</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════
   TAB 3 — RESOURCES
═══════════════════════════════════ */
function ResourcesTab({ childName }) {
  const [resources, setResources] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [form, setForm] = useState({ title: '', type: 'link', fileUrl: '', instructionalText: '', targetSkill: 'general' });

  const rcClass  = (t) => ({ video: s.rcVideo, pdf: s.rcPdf, link: s.rcLink }[t] || '');
  const bdgClass = (t) => ({ video: s.badgeVideo, pdf: s.badgePdf, link: s.badgeLink }[t] || '');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/resources?studentName=${encodeURIComponent(childName)}`, { headers: authHdr() });
      const data = await res.json();
      if (res.ok) setResources(data);
    } catch { /* silent */ }
    setLoading(false);
  }, [childName]);

  useEffect(() => { load(); }, [load, childName]);

  const handleAddResource = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, studentName: childName };
      const res = await fetch(`${API}/resources`, {
        method: 'POST',
        headers: authHdr(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ title: '', type: 'link', fileUrl: '', instructionalText: '', targetSkill: 'general' });
        load();
      } else {
        alert('Failed to add resource.');
      }
    } catch (err) { alert('Error adding resource.'); }
  };

  return (
    <>
      <div className={s.sectionHeader}>
        <div>
          <h2>📚 Learning Resources</h2>
          <p>Materials assigned by your child's teacher and added by you.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className={s.refreshBtn} onClick={() => setShowForm(!showForm)}>
            {showForm ? <X size={15}/> : <Plus size={15}/>} {showForm ? 'Cancel' : 'Add Home Resource'}
          </button>
          <button className={s.refreshBtn} onClick={load}>
            <RefreshCcw size={15} /> Refresh
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAddResource} className={s.inlineForm}>
          <h3>Add Private Home Resource</h3>
          <div className={s.formGrid}>
            <input required placeholder="Resource Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className={s.formInput} />
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className={s.formInput}>
              <option value="link">Website Link</option>
              <option value="video">Video URL</option>
              <option value="pdf">PDF Link</option>
            </select>
            <input required placeholder="URL (e.g. https://...)" value={form.fileUrl} onChange={e => setForm({...form, fileUrl: e.target.value})} className={s.formInput} />
            <input placeholder="Short Note (e.g. Watch before bed)" value={form.instructionalText} onChange={e => setForm({...form, instructionalText: e.target.value})} className={s.formInput} />
            <button type="submit" className={s.formSubmitBtn}>Save Resource</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className={s.emptyState}><div className={s.emptyIcon}>⏳</div><p>Loading resources…</p></div>
      ) : resources.length === 0 ? (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>📚</div>
          <p>No resources assigned yet.</p>
        </div>
      ) : (
        <div className={s.resourceGrid}>
          {resources.map(r => (
            <div key={r._id} className={`${s.resourceCard} ${rcClass(r.type)}`}>
              <div className={s.resourceBody}>
                <span className={`${s.typeBadge} ${bdgClass(r.type)}`}>
                  {TYPE_EMOJI[r.type] || '📦'} {r.type?.toUpperCase()}
                </span>
                <span className={s.typeBadge} style={{ background: '#fefce8', color: '#92400e', border: '1px solid #fde047', marginLeft: '6px' }}>
                  ⭐ Lvl {r.requiredLevel || 0}
                </span>
                <p className={s.resourceTitle}>{r.title}</p>
                {r.instructionalText && (
                  <p className={s.resourceNotes}>🗒️ {r.instructionalText}</p>
                )}
                {r.studentName && (
                  <p className={s.studentTag}>🏠 Private Upload</p>
                )}
              </div>
              <div className={s.resourceBar}>
                {r.type !== 'offline' && r.fileUrl ? (
                  <a href={r.fileUrl} target="_blank" rel="noreferrer" className={s.openLink}>
                    <ExternalLink size={14} /> Open
                  </a>
                ) : (
                  <span className={s.openLink} style={{ color: '#27ae60', background: 'none' }}>
                    ✅ Offline Activity
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════
   TAB 4 — PROGRESS REPORTS
═══════════════════════════════════ */
function ProgressTab({ childName }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const url = childName
        ? `${API}/progress?studentName=${encodeURIComponent(childName)}`
        : `${API}/progress`;
      const res  = await fetch(url, { headers: authHdr() });
      const data = await res.json();
      if (res.ok) setReports([...data].sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch { /* silent */ }
    setLoading(false);
  }, [childName]);

  useEffect(() => { load(); }, [load, childName]);

  const downloadPDF = (r) => {
    const doc = new jsPDF();
    doc.setFontSize(22); doc.setTextColor(61, 181, 160);
    doc.text('BrightSteps — Progress Report', 20, 22);
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
      <div className={s.sectionHeader}>
        <div>
          <h2>📋 Progress Reports</h2>
          <p>{reports.length} report{reports.length !== 1 ? 's' : ''} from {childName}'s teachers.</p>
        </div>
        <button className={s.refreshBtn} onClick={load}>
          <RefreshCcw size={15} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className={s.emptyState}><div className={s.emptyIcon}>⏳</div><p>Loading reports…</p></div>
      ) : reports.length === 0 ? (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>📭</div>
          <p>No reports yet — your teacher will add these soon.</p>
        </div>
      ) : (
        <div className={s.cardsGrid}>
          {reports.map(r => {
            const mood = MOOD_CFG[r.mood] || MOOD_CFG.Neutral;
            return (
              <div key={r._id} className={s.reportCard}>
                <div className={s.cardTopRow}>
                  <div>
                    <p className={s.reportName}>{r.studentName}</p>
                    <p className={s.reportMeta}>
                      📅 {new Date(r.date).toLocaleDateString()} · 🎯 {r.activity}
                    </p>
                  </div>
                  <span className={`${s.moodBadge} ${mood.cls}`}>
                    {mood.emoji} {r.mood}
                  </span>
                </div>
                {r.notes && <div className={s.notesBox}>{r.notes}</div>}
                <button className={s.pdfBtn} onClick={() => downloadPDF(r)}>
                  <Download size={14} /> Download PDF
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════
   TAB 5 — TEACHER CHAT
═══════════════════════════════════ */
const DUMMY_TEACHER_ID = '640000000000000000000000'; // Generic Inbox Pool

function TeacherChatTab({ user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/messages/${DUMMY_TEACHER_ID}`, { headers: authHdr() });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const res = await fetch(`${API}/messages`, {
        method: 'POST',
        headers: authHdr(),
        body: JSON.stringify({ receiverId: DUMMY_TEACHER_ID, text })
      });
      if (res.ok) {
        const newMsg = await res.json();
        setMessages([...messages, newMsg]);
        setText('');
      }
    } catch (err) { alert('Failed to send message'); }
  };

  return (
    <div className={s.chatContainer}>
      <div className={s.sectionHeader}>
        <div>
          <h2>💬 Teacher Inbox</h2>
          <p>Direct messaging with the BrightSteps teaching staff.</p>
        </div>
        <button className={s.refreshBtn} onClick={load}>
          <RefreshCcw size={15} /> Refresh
        </button>
      </div>

      <div className={s.chatWindow}>
        <div className={s.chatHistory}>
          {loading ? (
             <div className={s.emptyState}><p>Connecting...</p></div>
          ) : messages.length === 0 ? (
             <div className={s.emptyState}><div className={s.emptyIcon}>👋</div><p>Start the conversation with your teacher!</p></div>
          ) : (
            messages.map(m => {
              const isMine = m.senderId === user._id;
              return (
                <div key={m._id} className={`${s.chatBubbleWrapper} ${isMine ? s.chatMine : s.chatTheirs}`}>
                  <div className={s.chatBubble}>
                    {m.text}
                  </div>
                  <div className={s.chatTime}>
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <form onSubmit={handleSend} className={s.chatInputArea}>
          <input 
            type="text" 
            placeholder="Type your message..." 
            value={text} 
            onChange={e => setText(e.target.value)} 
            className={s.chatInput}
          />
          <button type="submit" className={s.chatSendBtn}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════
   MAIN — PARENT DASHBOARD
═══════════════════════════════════ */
const TABS = [
  { id: 'flags',    label: 'AI Chat Flags',   icon: <AlertTriangle size={16} /> },
  { id: 'routines', label: 'Routines',         icon: <CalendarDays  size={16} /> },
  { id: 'resources',label: 'Resources',        icon: <BookOpen      size={16} /> },
  { id: 'reports',  label: 'Progress Reports', icon: <ClipboardList size={16} /> },
  { id: 'chat',     label: 'Teacher Chat',     icon: <MessageSquare size={16} /> },
];

export default function ParentDashboard() {
  const navigate     = useNavigate();
  const [activeTab, setActiveTab] = useState('flags');

  // ── Security gate: must have been unlocked via PIN modal ──
  useEffect(() => {
    const unlocked = sessionStorage.getItem('parent_unlocked');
    if (!unlocked || unlocked !== 'true') {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('brightsteps_user')); }
    catch { return null; }
  })();

  const childName = user?.name || 'Student';

  const [parentNameEditing, setParentNameEditing] = useState(false);
  const [newParentName, setNewParentName] = useState(user?.parentName || '');

  const handleUpdateName = async () => {
    try {
      const res = await fetch(`${API}/users/${user._id}/parent-name`, {
        method: 'PATCH',
        headers: authHdr(),
        body: JSON.stringify({ parentName: newParentName })
      });
      if (res.ok) {
        const data = await res.json();
        user.parentName = data.parentName; // update local ref
        localStorage.setItem('brightsteps_user', JSON.stringify(user));
        setParentNameEditing(false);
      }
    } catch { alert('Failed updating name'); }
  };

  const currentParentNameDisplay = user?.parentName ? `Welcome, ${user.parentName}` : `Welcome, ${childName}'s Parent`;

  const handleExit = () => {
    sessionStorage.removeItem('parent_unlocked');
    navigate('/dashboard');
  };

  return (
    <div className={s.wrapper}>

      {/* ── Nav ── */}
      <nav className={s.nav}>
        <span className={s.navBrand}>✨ Bright<em>Steps</em></span>
        <div className={s.navRight}>
          <div className={s.navChip}>
            👨‍👩‍👧 {user?.parentName || `${childName}'s Parent`}
            <span className={s.rolePill}>Parent</span>
          </div>
          <button className={s.exitBtn} onClick={handleExit}>
            <LogOut size={15} /> Exit Portal
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className={s.hero}>
        <span className={s.heroDeco}>🌟</span>
        <span className={s.heroDeco}>💬</span>
        <span className={s.heroDeco}>📊</span>
        <span className={s.heroDeco}>📚</span>
        <h1 className={s.heroTitle}>
          {parentNameEditing ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <input 
                className={s.formInput} 
                style={{ width: '200px', fontSize: '1.5rem', textAlign: 'center' }} 
                value={newParentName} 
                onChange={e => setNewParentName(e.target.value)} 
                placeholder="Your Name"
              />
              <button className={s.refreshBtn} onClick={handleUpdateName}>
                <Check size={18} color="green" /> Save
              </button>
              <button className={s.refreshBtn} onClick={() => setParentNameEditing(false)}>
                <X size={18} color="red" />
              </button>
            </div>
          ) : (
            <>
              {currentParentNameDisplay}
              <button className={s.delIconButton} style={{ display: 'inline-flex', verticalAlign: 'middle', marginLeft: 10 }} onClick={() => setParentNameEditing(true)}>
                <Edit2 size={24} />
              </button>
            </>
          )}
        </h1>
        <p className={s.heroSub}>
          Monitor progress · review routines · stay connected
        </p>
        <div className={s.heroStats}>
          <span className={`${s.statChip} ${s.chipTeal}`}>👶 {childName}'s Dashboard</span>
          <span className={`${s.statChip} ${s.chipAmber}`}>📋 Full Visibility</span>
          <span className={`${s.statChip} ${s.chipLav}`}>🔒 PIN Protected</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className={s.tabBar}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`${s.tabBtn} ${activeTab === t.id ? s.tabActive : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <main className={s.main}>
        {activeTab === 'flags'     && <ChatFlagsTab childName={childName} />}
        {activeTab === 'routines'  && <RoutinesTab  childName={childName} />}
        {activeTab === 'resources' && <ResourcesTab childName={childName} />}
        {activeTab === 'reports'   && <ProgressTab  childName={childName} />}
        {activeTab === 'chat'      && <TeacherChatTab user={user} />}
      </main>

    </div>
  );
}
