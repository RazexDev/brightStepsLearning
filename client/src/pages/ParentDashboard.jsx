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
import s from './ParentDashboard.module.css';
import { downloadSingleReportPDF, downloadRoutineReportPDF } from '../utils/pdfGenerator';


/* ── Constants ─────────────────────────────── */
const API = '/api';
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

/**
 * RoutinesTab_FULL.jsx
 *
 * DROP-IN REPLACEMENT for the RoutinesTab function inside ParentDashboard.jsx
 *
 * HOW TO INTEGRATE:
 *   1. In ParentDashboard.jsx, find "function RoutinesTab({ childName })"
 *   2. Delete everything from that line to its closing "}" (before TAB 3 Resources)
 *   3. Paste this entire file's content in its place
 *   4. Update the pdfGenerator import at the top of ParentDashboard.jsx:
 *        import { downloadSingleReportPDF, downloadRoutineReportPDF } from '../utils/pdfGenerator';
 *   5. Append the CSS from RoutinesTab.additions.css to ParentDashboard.module.css
 *
 * FEATURES IN THIS FILE:
 *   ✅ AI Generate — modal with full child schedule form, preview before save
 *   ✅ Child Profile Card — polished display with disability badge
 *   ✅ Drag-and-drop task reordering (native HTML5 — no library needed)
 *   ✅ Search + filter bar (searches title, category, type, tasks)
 *   ✅ Better routine CRUD form (title, category, type, goal, tasks+mins)
 *   ✅ Template section with skills, notes, goals — grouped by disability match
 *   ✅ Progress bars per routine card + summary breakdown
 *   ✅ Badge display on routine cards
 *   ✅ PDF button repositioned to summary header area
 *   ✅ All styles use existing CSS module + 3 new classes (see additions file)
 */

// ─── Make sure this import exists at the top of ParentDashboard.jsx ───────────
// import { downloadSingleReportPDF, downloadRoutineReportPDF } from '../utils/pdfGenerator';

function RoutinesTab({ childName }) {
  /* ── state ───────────────────────────────────────── */
  const [routines,       setRoutines]       = React.useState([]);
  const [templates,      setTemplates]      = React.useState([]);
  const [summary,        setSummary]        = React.useState(null);
  const [loading,        setLoading]        = React.useState(true);

  // Form state
  const [showForm,       setShowForm]       = React.useState(false);
  const [editingRoutine, setEditingRoutine] = React.useState(null);

  // AI modal state
  const [showAiModal,    setShowAiModal]    = React.useState(false);
  const [aiLoading,      setAiLoading]      = React.useState(false);
  const [aiPreview,      setAiPreview]      = React.useState(null);

  const [aiForm, setAiForm] = React.useState({
    childName: childName || '',
    childAge: '',
    disabilityType: '',
    wakeUpTime: '7:00 AM',
    schoolTime: '8:30 AM',
    afterSchoolTime: '3:30 PM',
    mealTimes: 'breakfast 7:30, lunch 12:30, dinner 6:00',
    studyTime: '4:30 PM',
    bedTime: '8:30 PM',
    goals: [],
  });

  // Search/filter state
  const [searchQuery,    setSearchQuery]    = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState('all');
  const [filterType,     setFilterType]     = React.useState('all');

  // Drag-and-drop state
  const [dragIndex,      setDragIndex]      = React.useState(null);
  const [dragOverIndex,  setDragOverIndex]  = React.useState(null);

  /* ── user from localStorage ─────────────────────── */
  const user = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem('brightsteps_user')); }
    catch { return null; }
  }, []);

  const studentDiagnosis = React.useMemo(
    () => (user?.diagnosis || 'general').toLowerCase(),
    [user]
  );

  const students = React.useMemo(() => [{
    _id:       user?._id || '',
    name:      childName || 'Student',
    diagnosis: studentDiagnosis,
    age:       user?.age || '',
  }], [user, childName, studentDiagnosis]);

  const [selectedStudentId,   setSelectedStudentId]   = React.useState(user?._id || '');
  const [selectedStudentName, setSelectedStudentName] = React.useState(childName || 'Student');
  const [selectedDisability,  setSelectedDisability]  = React.useState(studentDiagnosis);

  const emptyTask = () => ({ label: '', mins: 5, _key: Math.random().toString(36).slice(2) });

  const [form, setForm] = React.useState({
    title: '', category: 'morning', type: studentDiagnosis,
    goal: '', tags: '', tasks: [emptyTask()],
  });

  /* ── GOAL OPTIONS ───────────────────────────────── */
  const GOAL_OPTIONS = [
    'independence', 'self-care', 'routine consistency', 'emotional regulation',
    'calm bedtime', 'focus improvement', 'school preparation', 'smooth transitions', 'sensory support'
  ];

  /* ── DATA LOADERS ───────────────────────────────── */
  const loadRoutines = React.useCallback(async () => {
    setLoading(true);
    try {
      const url  = selectedStudentId ? `${API}/routines?studentId=${selectedStudentId}` : `${API}/routines`;
      const res  = await fetch(url, { headers: authHdr() });
      const data = await res.json();
      setRoutines(res.ok && Array.isArray(data) ? data : []);
    } catch { setRoutines([]); }
    setLoading(false);
  }, [selectedStudentId]);

  const loadTemplates = React.useCallback(async () => {
    try {
      const res  = await fetch(`${API}/templates?disabilityType=${encodeURIComponent(selectedDisability)}`, { headers: authHdr() });
      const data = await res.json();
      setTemplates(res.ok && Array.isArray(data) ? data : []);
    } catch { setTemplates([]); }
  }, [selectedDisability]);

  const loadSummary = React.useCallback(async () => {
    try {
      const url  = selectedStudentId ? `${API}/routines/progress/summary?studentId=${selectedStudentId}` : `${API}/routines/progress/summary`;
      const res  = await fetch(url, { headers: authHdr() });
      const data = await res.json();
      setSummary(res.ok ? data : null);
    } catch { setSummary(null); }
  }, [selectedStudentId]);

  React.useEffect(() => {
    loadRoutines(); loadTemplates(); loadSummary();
  }, [loadRoutines, loadTemplates, loadSummary]);

  /* ── CHILD SELECT ───────────────────────────────── */
  const handleStudentChange = (e) => {
    const found = students.find(st => st._id === e.target.value);
    setSelectedStudentId(e.target.value);
    setSelectedStudentName(found?.name || childName || 'Student');
    const diag = (found?.diagnosis || 'general').toLowerCase();
    setSelectedDisability(diag);
    setForm(prev => ({ ...prev, type: diag }));
  };

  /* ── TASK HELPERS ───────────────────────────────── */
  const updateTask    = (i, key, val) => setForm(prev => { const t = [...prev.tasks]; t[i] = { ...t[i], [key]: val }; return { ...prev, tasks: t }; });
  const addTask       = ()            => setForm(prev => ({ ...prev, tasks: [...prev.tasks, emptyTask()] }));
  const removeTask    = (i)           => setForm(prev => ({ ...prev, tasks: prev.tasks.length > 1 ? prev.tasks.filter((_, idx) => idx !== i) : [emptyTask()] }));

  /* ── DRAG-AND-DROP (native HTML5) ───────────────── */
  const onDragStart = (i)   => setDragIndex(i);
  const onDragOver  = (e,i) => { e.preventDefault(); setDragOverIndex(i); };
  const onDrop      = (i)   => {
    if (dragIndex === null || dragIndex === i) { setDragIndex(null); setDragOverIndex(null); return; }
    setForm(prev => {
      const next = [...prev.tasks];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(i, 0, moved);
      return { ...prev, tasks: next };
    });
    setDragIndex(null); setDragOverIndex(null);
  };
  const onDragEnd   = ()    => { setDragIndex(null); setDragOverIndex(null); };

  /* ── FORM RESET ─────────────────────────────────── */
  const resetForm = () => {
    setForm({ title: '', category: 'morning', type: selectedDisability, goal: '', tags: '', tasks: [emptyTask()] });
    setEditingRoutine(null);
    setShowForm(false);
  };

  const openEditForm = (routine) => {
    setEditingRoutine(routine);
    setForm({
      title:    routine.title    || '',
      category: routine.category || 'morning',
      type:     routine.type     || selectedDisability,
      goal:     routine.goal     || '',
      tags:     Array.isArray(routine.tags) ? routine.tags.join(', ') : '',
      tasks:    Array.isArray(routine.tasks) && routine.tasks.length
        ? routine.tasks.map(t => ({ label: t.label || '', mins: t.mins ?? 5, _key: Math.random().toString(36).slice(2) }))
        : [emptyTask()],
    });
    setShowForm(true);
    setTimeout(() => document.getElementById('rt-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  /* ── SAVE ROUTINE ───────────────────────────────── */
  const handleSaveRoutine = async (e) => {
    e.preventDefault();
    const cleanedTasks = form.tasks.map(t => ({ label: t.label.trim(), mins: Number(t.mins) || 0 })).filter(t => t.label);
    if (!form.title.trim()) { alert('Routine title is required.'); return; }
    if (!cleanedTasks.length) { alert('Add at least one task.'); return; }

    const payload = {
      title: form.title.trim(), category: form.category, type: form.type,
      goal: form.goal, tasks: cleanedTasks,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      studentId: selectedStudentId, studentName: selectedStudentName,
    };

    try {
      const res = await fetch(
        editingRoutine ? `${API}/routines/${editingRoutine._id}` : `${API}/routines`,
        { method: editingRoutine ? 'PUT' : 'POST', headers: authHdr(), body: JSON.stringify(payload) }
      );
      const data = await res.json();
      if (res.ok) { resetForm(); loadRoutines(); loadSummary(); }
      else alert(data.message || 'Failed to save routine.');
    } catch { alert('Error saving routine.'); }
  };

  /* ── DELETE ROUTINE ─────────────────────────────── */
  const handleDeleteRoutine = async (id) => {
    if (!window.confirm('Delete this routine?')) return;
    try {
      const res = await fetch(`${API}/routines/${id}`, { method: 'DELETE', headers: authHdr() });
      if (res.ok) { loadRoutines(); loadSummary(); }
      else alert('Failed to delete routine.');
    } catch { alert('Error deleting routine.'); }
  };

  /* ── ASSIGN TEMPLATE ────────────────────────────── */
  const handleAssignTemplate = async (templateId) => {
    try {
      const res = await fetch(`${API}/routines/assign-template`, {
        method: 'POST', headers: authHdr(),
        body: JSON.stringify({ templateId, studentId: selectedStudentId, studentName: selectedStudentName }),
      });
      const data = await res.json();
      if (res.ok) { loadRoutines(); loadSummary(); alert('✅ Template assigned!'); }
      else alert(data.message || 'Failed to assign template.');
    } catch { alert('Error assigning template.'); }
  };

  /* ── AI GENERATE ────────────────────────────────── */
  const handleAiSubmit = async (e) => {
    e.preventDefault();
    setAiLoading(true);
    setAiPreview(null);
    try {
      const res  = await fetch(`${API}/routines/ai-generate`, {
        method: 'POST', headers: authHdr(),
        body: JSON.stringify({
          ...aiForm,
          disabilityType: aiForm.disabilityType || selectedDisability,
          mealTimes: aiForm.mealTimes ? aiForm.mealTimes.split(',').map(m => m.trim()) : [],
        }),
      });
      const data = await res.json();
      if (res.ok) setAiPreview(data);
      else alert(data.message || 'AI generation failed.');
    } catch { alert('AI error — please try again.'); }
    setAiLoading(false);
  };

  const handleAiSave = async () => {
    if (!aiPreview) return;
    const payload = {
      title:     aiPreview.title,
      category:  aiPreview.category || 'custom',
      type:      aiPreview.type     || selectedDisability,
      goal:      (aiPreview.goals || [])[0] || '',
      tasks:     (aiPreview.tasks || []).map(t => ({ label: t.label, mins: t.mins || 0 })),
      tags:      aiPreview.goals   || [],
      studentId: selectedStudentId,
      studentName: selectedStudentName,
    };
    try {
      const res = await fetch(`${API}/routines`, { method: 'POST', headers: authHdr(), body: JSON.stringify(payload) });
      if (res.ok) { setShowAiModal(false); setAiPreview(null); loadRoutines(); loadSummary(); alert('✅ AI routine saved!'); }
      else { const d = await res.json(); alert(d.message || 'Failed to save.'); }
    } catch { alert('Error saving AI routine.'); }
  };

  const handleAiEdit = () => {
    if (!aiPreview) return;
    setForm({
      title:    aiPreview.title    || '',
      category: aiPreview.category || 'custom',
      type:     aiPreview.type     || selectedDisability,
      goal:     (aiPreview.goals || [])[0] || '',
      tags:     (aiPreview.goals  || []).join(', '),
      tasks:    (aiPreview.tasks  || []).map(t => ({ label: t.label || '', mins: t.mins || 5, _key: Math.random().toString(36).slice(2) })),
    });
    setShowAiModal(false);
    setAiPreview(null);
    setEditingRoutine(null);
    setShowForm(true);
  };

  /* ── SEARCH / FILTER ────────────────────────────── */
  const filteredRoutines = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return routines.filter(r => {
      if (filterCategory !== 'all' && r.category !== filterCategory) return false;
      if (filterType !== 'all' && r.type !== filterType) return false;
      if (!q) return true;
      return (
        r.title?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        r.type?.toLowerCase().includes(q) ||
        r.goal?.toLowerCase().includes(q) ||
        (r.tags || []).some(t => t.toLowerCase().includes(q)) ||
        (r.tasks || []).some(t => t.label?.toLowerCase().includes(q))
      );
    });
  }, [routines, searchQuery, filterCategory, filterType]);

  /* ── PROGRESS COLOUR ────────────────────────────── */
  const pctColor = (pct) => pct >= 80 ? 'var(--pd-sage)' : pct >= 50 ? 'var(--pd-amber)' : 'var(--pd-rose)';

  /* ── DISABILITY BADGE COLOUR ────────────────────── */
  const typeStyle = (type) => ({
    adhd:    { bg: 'var(--pd-amber-bg)',  border: 'var(--pd-amber)',  color: 'var(--pd-amber-dk)',  label: '⚡ ADHD' },
    autism:  { bg: 'var(--pd-teal-bg)',   border: 'var(--pd-teal)',   color: 'var(--pd-teal-dk)',   label: '🌿 Autism' },
    both:    { bg: 'var(--pd-lav-bg)',    border: 'var(--pd-lav)',    color: 'var(--pd-lav-dk)',    label: '💜 Both' },
    general: { bg: 'var(--pd-sky-bg)',    border: 'var(--pd-sky)',    color: 'var(--pd-sky-dk)',    label: '🌟 General' },
  }[type?.toLowerCase()] || { bg: 'var(--pd-paper2)', border: 'rgba(30,16,7,0.1)', color: 'var(--pd-ink-mid)', label: type });

  const catEmoji = { morning: '🌅', school: '🏫', study: '📚', evening: '🌆', bedtime: '🌙', custom: '⚙️' };

  /* ═══════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════ */
  return (
    <>
      {/* ══════════════════════════════════════
          SECTION HEADER + ACTION BUTTONS
      ══════════════════════════════════════ */}
      <div className={s.sectionHeader}>
        <div>
          <h2>📅 Routine Management</h2>
          <p>Create, assign, and monitor routines for {selectedStudentName}.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* PDF — repositioned here near header */}
          {summary && (
            <button className={s.pdfBtn} onClick={() => downloadRoutineReportPDF(summary, selectedStudentName)}
              title="Download progress PDF">
              <Download size={14} /> Progress PDF
            </button>
          )}
          <button className={s.refreshBtn}
            style={{ background: 'var(--pd-lav-bg)', color: 'var(--pd-lav-dk)', borderColor: 'var(--pd-lav)' }}
            onClick={() => { setShowAiModal(true); setAiPreview(null); }}>
            🤖 AI Generate
          </button>
          <button className={s.refreshBtn}
            onClick={() => { if (showForm) resetForm(); else { setEditingRoutine(null); setShowForm(true); } }}>
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? 'Cancel' : 'New Routine'}
          </button>
          <button className={s.refreshBtn}
            onClick={() => { loadRoutines(); loadTemplates(); loadSummary(); }}>
            <RefreshCcw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════
          CHILD PROFILE CARD
      ══════════════════════════════════════ */}
      <div className={s.rtChildCard}>
        <div className={s.rtChildAvatar}>
          {(selectedStudentName || 'S').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <select value={selectedStudentId} onChange={handleStudentChange}
              className={s.formInput}
              style={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, fontSize: '1rem', border: 'none', background: 'transparent', color: 'var(--pd-ink)', padding: '0', flex: 'none', cursor: 'pointer', appearance: 'none' }}>
              {students.map(st => (
                <option key={st._id} value={st._id}>
                  {st.name}
                </option>
              ))}
            </select>
            {(() => {
              const ts = typeStyle(selectedDisability);
              return (
                <span style={{ background: ts.bg, border: `1.5px solid ${ts.border}`, color: ts.color, padding: '3px 12px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 800 }}>
                  {ts.label}
                </span>
              );
            })()}
          </div>
          <p style={{ margin: '3px 0 0', fontSize: '0.82rem', fontWeight: 700, color: 'var(--pd-ink-soft)' }}>
            Support profile · Routine Manager
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════
          PROGRESS SUMMARY
      ══════════════════════════════════════ */}
      {summary && (
        <div style={{ marginBottom: '24px' }}>
          {/* Stat cards */}
          <div className={s.routineGrid} style={{ marginBottom: '14px' }}>
            {[
              { label: 'Total Assigned', value: summary.totalAssigned || 0,         unit: 'routines', color: 'var(--pd-sky)',   icon: '📋' },
              { label: 'Completed',      value: summary.completedCount || 0,         unit: 'routines', color: 'var(--pd-sage)',  icon: '✅' },
              { label: 'Completion',     value: `${summary.completionPercentage||0}%`, unit: '',       color: pctColor(summary.completionPercentage || 0), icon: '📊' },
              { label: 'Stars Earned',   value: `⭐ ${summary.totalStars || 0}`,     unit: `${(summary.badges||[]).length} badges`, color: 'var(--pd-amber)', icon: '🏅' },
            ].map((item, i) => (
              <div key={i} className={s.routineCard}
                style={{ borderTopColor: item.color }}>
                <p className={s.routineMeta} style={{ marginBottom: 4 }}>{item.icon} {item.label}</p>
                <p style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0 0 4px', color: item.color, lineHeight: 1 }}>{item.value}</p>
                {item.unit && <p className={s.routineMeta}>{item.unit}</p>}
                {item.label === 'Completion' && (
                  <div style={{ background: 'rgba(30,16,7,0.07)', borderRadius: '999px', height: '7px', marginTop: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${summary.completionPercentage||0}%`, height: '100%', borderRadius: '999px', background: item.color, transition: 'width 0.8s ease' }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Category breakdown */}
          {Array.isArray(summary.categoryBreakdown) && summary.categoryBreakdown.length > 0 && (
            <div className={s.routineCard} style={{ borderTopColor: 'var(--pd-teal)', marginBottom: '14px' }}>
              <p className={s.routineName} style={{ marginBottom: 14 }}>📈 Progress by Category</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {summary.categoryBreakdown.map(cat => (
                  <div key={cat.category}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--pd-ink-mid)', textTransform: 'capitalize' }}>
                        {catEmoji[cat.category] || '📋'} {cat.category}
                      </span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--pd-ink-soft)' }}>
                        {cat.completed}/{cat.total} · {cat.pct}%
                      </span>
                    </div>
                    <div style={{ background: 'rgba(30,16,7,0.07)', borderRadius: '999px', height: 9, overflow: 'hidden' }}>
                      <div style={{ width: `${cat.pct}%`, height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg, var(--pd-teal), var(--pd-sky))', transition: 'width 0.7s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Badges */}
          {Array.isArray(summary.badges) && summary.badges.length > 0 && (
            <div className={s.routineCard} style={{ borderTopColor: 'var(--pd-lav)', marginBottom: '14px' }}>
              <p className={s.routineName} style={{ marginBottom: 10 }}>🏅 Badges Earned</p>
              <div className={s.taskPills}>
                {summary.badges.map((b, i) => (
                  <span key={i} className={s.taskPill}
                    style={{ background: 'var(--pd-lav-bg)', color: 'var(--pd-lav-dk)', borderColor: 'var(--pd-lav)' }}>
                    {b}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          ROUTINE FORM — Create / Edit
      ══════════════════════════════════════ */}
      {showForm && (
        <form id="rt-form" onSubmit={handleSaveRoutine} className={s.inlineForm} style={{ marginBottom: 24 }}>
          <h3>{editingRoutine ? '✏️ Edit Routine' : '➕ Create New Routine'}</h3>

          {/* Title */}
          <div style={{ marginBottom: 14 }}>
            <label className={s.rtLabel}>Routine Title *</label>
            <input required placeholder="e.g. Morning Independence Boost…" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className={s.formInput} style={{ width: '100%', maxWidth: 480 }} />
          </div>

          {/* Category + Type + Goal */}
          <div className={s.formGrid} style={{ marginBottom: 14 }}>
            <div>
              <label className={s.rtLabel}>Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={s.formInput}>
                <option value="morning">🌅 Morning</option>
                <option value="school">🏫 School</option>
                <option value="study">📚 Study</option>
                <option value="evening">🌆 Evening</option>
                <option value="bedtime">🌙 Bedtime</option>
                <option value="custom">⚙️ Custom</option>
              </select>
            </div>
            <div>
              <label className={s.rtLabel}>Support Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={s.formInput}>
                <option value="adhd">⚡ ADHD</option>
                <option value="autism">🌿 Autism</option>
                <option value="both">💜 Both</option>
                <option value="general">🌟 General</option>
              </select>
            </div>
            <div>
              <label className={s.rtLabel}>Goal</label>
              <select value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })} className={s.formInput}>
                <option value="">— choose a goal —</option>
                {GOAL_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div style={{ marginBottom: 20 }}>
            <label className={s.rtLabel}>Tags (comma separated, optional)</label>
            <input placeholder="e.g. morning, focus, independence" value={form.tags}
              onChange={e => setForm({ ...form, tags: e.target.value })}
              className={s.formInput} style={{ width: '100%', maxWidth: 420 }} />
          </div>

          {/* Tasks */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <h4 style={{ margin: 0, fontWeight: 800, color: 'var(--pd-ink)', fontSize: '0.98rem' }}>
                📝 Tasks
                <span style={{ marginLeft: 8, fontSize: '0.75rem', fontWeight: 700, color: 'var(--pd-ink-soft)' }}>
                  (drag ⠿ to reorder)
                </span>
              </h4>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--pd-teal-dk)' }}>
                ⏱ {form.tasks.reduce((s, t) => s + (Number(t.mins) || 0), 0)} min total
              </span>
            </div>

            {/* Column labels */}
            <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 110px 36px', gap: 8, padding: '0 4px', marginBottom: 6 }}>
              <span></span>
              <span className={s.rtLabel} style={{ margin: 0 }}>TASK</span>
              <span className={s.rtLabel} style={{ margin: 0 }}>MINUTES</span>
              <span></span>
            </div>

            {form.tasks.map((task, i) => (
              <div
                key={task._key || i}
                draggable
                onDragStart={() => onDragStart(i)}
                onDragOver={(e) => onDragOver(e, i)}
                onDrop={() => onDrop(i)}
                onDragEnd={onDragEnd}
                style={{
                  display: 'grid', gridTemplateColumns: '28px 1fr 110px 36px', gap: 8,
                  marginBottom: 8, alignItems: 'center',
                  opacity:   dragIndex === i ? 0.45 : 1,
                  transform: dragOverIndex === i && dragIndex !== i ? 'translateY(-3px)' : 'none',
                  transition: 'transform 0.15s, opacity 0.15s',
                  background: dragOverIndex === i && dragIndex !== i ? 'var(--pd-teal-bg)' : 'transparent',
                  borderRadius: 8, padding: '2px 0',
                }}>
                {/* Drag handle */}
                <div style={{ cursor: 'grab', color: 'var(--pd-ink-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', userSelect: 'none' }}
                  title="Drag to reorder">
                  ⠿
                </div>
                <input className={s.formInput}
                  placeholder={`Step ${i + 1} — describe the task`}
                  value={task.label}
                  onChange={e => updateTask(i, 'label', e.target.value)} />
                <input type="number" min="0" max="180" className={s.formInput}
                  placeholder="5"
                  value={task.mins}
                  onChange={e => updateTask(i, 'mins', e.target.value)}
                  style={{ textAlign: 'center' }} />
                <button type="button" className={s.refreshBtn}
                  onClick={() => removeTask(i)}
                  style={{ padding: '7px', justifyContent: 'center', color: 'var(--pd-rose)', borderColor: 'rgba(232,92,69,0.2)' }}
                  title="Remove task">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            <button type="button" className={s.refreshBtn} onClick={addTask}
              style={{ marginTop: 4, background: 'var(--pd-teal-bg)', color: 'var(--pd-teal-dk)', borderColor: 'var(--pd-teal)' }}>
              <Plus size={15} /> Add Task
            </button>
          </div>

          {/* Submit */}
          <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="submit" className={s.formSubmitBtn}>
              <Check size={16} style={{ marginRight: 4 }} />
              {editingRoutine ? 'Update Routine' : 'Create Routine'}
            </button>
            <button type="button" className={s.refreshBtn} onClick={resetForm}>
              <X size={15} /> Cancel
            </button>
          </div>
        </form>
      )}

      {/* ══════════════════════════════════════
          RECOMMENDED TEMPLATES
      ══════════════════════════════════════ */}
      <div className={s.sectionHeader} style={{ marginTop: showForm ? 0 : 8 }}>
        <div>
          <h2>🧩 Recommended Templates</h2>
          <p>Matched to <strong style={{ color: 'var(--pd-teal-dk)', textTransform: 'capitalize' }}>{selectedDisability}</strong> support type.</p>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>📭</div>
          <p>No templates yet. Run <code style={{ background: 'var(--pd-paper2)', padding: '2px 6px', borderRadius: 4, fontSize: '0.85em' }}>node server/seedTemplates.js</code> to add them.</p>
        </div>
      ) : (
        <div className={s.routineGrid} style={{ marginBottom: 28 }}>
          {templates.map(tmpl => {
            const ts = typeStyle(tmpl.disabilityType);
            return (
              <div key={tmpl._id} className={s.routineCard} style={{ borderTopColor: 'var(--pd-teal)' }}>
                {/* Header */}
                <div style={{ marginBottom: 10 }}>
                  <p className={s.routineName}>🧩 {tmpl.title}</p>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>
                    <span className={s.taskPill} style={{ background: 'var(--pd-teal-bg)', color: 'var(--pd-teal-dk)', borderColor: 'var(--pd-teal)' }}>
                      {catEmoji[tmpl.category] || '📋'} {tmpl.category}
                    </span>
                    <span className={s.taskPill} style={{ background: ts.bg, color: ts.color, borderColor: ts.border }}>
                      {ts.label}
                    </span>
                    <span className={s.taskPill} style={{ background: 'var(--pd-amber-bg)', color: 'var(--pd-amber-dk)', borderColor: 'var(--pd-amber)' }}>
                      ⏱ {tmpl.estimatedTime || 0}m
                    </span>
                  </div>
                </div>

                {/* Goals */}
                {tmpl.goals?.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <p style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--pd-ink-soft)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Goals</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {tmpl.goals.map((g, i) => (
                        <span key={i} style={{ background: 'var(--pd-sage-bg)', color: 'var(--pd-sage)', border: '1px solid var(--pd-sage)', padding: '2px 9px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>{g}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {tmpl.skills?.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <p style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--pd-ink-soft)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Skills</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {tmpl.skills.map((sk, i) => (
                        <span key={i} style={{ background: 'var(--pd-sky-bg)', color: 'var(--pd-sky-dk)', border: '1px solid var(--pd-sky)', padding: '2px 9px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>{sk}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Task preview */}
                {tmpl.tasks?.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--pd-ink-soft)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tasks ({tmpl.tasks.length})</p>
                    <div className={s.taskPills}>
                      {tmpl.tasks.slice(0, 3).map((t, i) => <span key={i} className={s.taskPill}>{t.label} ({t.mins || 0}m)</span>)}
                      {tmpl.tasks.length > 3 && <span className={s.taskPill} style={{ background: 'rgba(30,16,7,0.05)', color: 'var(--pd-ink-mid)' }}>+{tmpl.tasks.length - 3} more</span>}
                    </div>
                  </div>
                )}

                {/* Parent notes */}
                {tmpl.notes && (
                  <div style={{ background: 'var(--pd-paper2)', borderLeft: '3px solid var(--pd-teal)', borderRadius: 10, padding: '8px 12px', marginBottom: 12, fontSize: '0.8rem', fontWeight: 700, color: 'var(--pd-ink-mid)', lineHeight: 1.5 }}>
                    💡 {tmpl.notes.length > 120 ? tmpl.notes.slice(0, 120) + '…' : tmpl.notes}
                  </div>
                )}

                <button className={s.formSubmitBtn} onClick={() => handleAssignTemplate(tmpl._id)}
                  style={{ fontSize: '0.82rem', padding: '9px 18px' }}>
                  ✅ Assign Template
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════
          SEARCH + FILTER BAR
      ══════════════════════════════════════ */}
      <div className={s.rtSearchBar}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', pointerEvents: 'none' }}>🔍</span>
          <input className={s.formInput}
            style={{ paddingLeft: 36, width: '100%' }}
            placeholder="Search by title, category, goal, or task…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <select className={s.formInput} style={{ flex: 'none', minWidth: 130 }}
          value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="all">All Categories</option>
          <option value="morning">🌅 Morning</option>
          <option value="school">🏫 School</option>
          <option value="study">📚 Study</option>
          <option value="evening">🌆 Evening</option>
          <option value="bedtime">🌙 Bedtime</option>
          <option value="custom">⚙️ Custom</option>
        </select>
        <select className={s.formInput} style={{ flex: 'none', minWidth: 120 }}
          value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          <option value="adhd">⚡ ADHD</option>
          <option value="autism">🌿 Autism</option>
          <option value="both">💜 Both</option>
          <option value="general">🌟 General</option>
        </select>
        {(searchQuery || filterCategory !== 'all' || filterType !== 'all') && (
          <button className={s.refreshBtn}
            onClick={() => { setSearchQuery(''); setFilterCategory('all'); setFilterType('all'); }}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════
          ASSIGNED ROUTINES LIST
      ══════════════════════════════════════ */}
      <div className={s.sectionHeader} style={{ marginTop: 8, marginBottom: 16 }}>
        <div>
          <h2>📋 Assigned Routines</h2>
          <p>
            {filteredRoutines.length} of {routines.length} routine{routines.length !== 1 ? 's' : ''} shown
            {(searchQuery || filterCategory !== 'all' || filterType !== 'all') ? ' (filtered)' : ''}.
          </p>
        </div>
      </div>

      {loading ? (
        <div className={s.emptyState}><div className={s.emptyIcon}>⏳</div><p>Loading routines…</p></div>
      ) : filteredRoutines.length === 0 ? (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>{routines.length === 0 ? '📭' : '🔍'}</div>
          <p>{routines.length === 0 ? 'No routines yet. Create one above or assign a template!' : 'No routines match your search.'}</p>
        </div>
      ) : (
        <div className={s.routineGrid}>
          {filteredRoutines.map(r => {
            const ts          = typeStyle(r.type);
            const emoji       = catEmoji[r.category] || '📋';
            const completedTasks = (r.tasks || []).filter(t => t.completed).length;
            const totalTasks  = (r.tasks || []).length;
            return (
              <div key={r._id} className={s.routineCard}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <p className={s.routineName}>{emoji} {r.title}</p>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
                      <span style={{ background: ts.bg, border: `1px solid ${ts.border}`, color: ts.color, padding: '2px 9px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 800 }}>
                        {ts.label}
                      </span>
                      {r.goal && (
                        <span style={{ background: 'var(--pd-sage-bg)', color: 'var(--pd-sage)', border: '1px solid var(--pd-sage)', padding: '2px 9px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 800 }}>
                          🎯 {r.goal}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    <button className={s.refreshBtn} onClick={() => openEditForm(r)}
                      style={{ padding: '6px 10px' }} title="Edit routine"><Edit2 size={14} /></button>
                    <button className={s.refreshBtn} onClick={() => handleDeleteRoutine(r._id)}
                      style={{ padding: '6px 10px', color: 'var(--pd-rose)', borderColor: 'rgba(232,92,69,0.2)' }} title="Delete routine"><Trash2 size={14} /></button>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--pd-ink-soft)' }}>
                      {completedTasks}/{totalTasks} tasks
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: pctColor(r.progress || 0) }}>
                      {r.progress || 0}%
                      {r.completed && <span style={{ marginLeft: 6, color: 'var(--pd-sage)' }}>✅</span>}
                    </span>
                  </div>
                  <div style={{ background: 'rgba(30,16,7,0.07)', borderRadius: '999px', height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${r.progress || 0}%`, height: '100%', borderRadius: '999px', background: pctColor(r.progress || 0), transition: 'width 0.6s ease' }} />
                  </div>
                </div>

                {/* Task pills (checklist view) */}
                {(r.tasks || []).length > 0 && (
                  <div className={s.taskPills} style={{ marginBottom: 10 }}>
                    {r.tasks.slice(0, 4).map((t, i) => (
                      <span key={i} className={s.taskPill}
                        style={t.completed ? { background: 'var(--pd-sage-bg)', color: 'var(--pd-sage)', borderColor: 'var(--pd-sage)', textDecoration: 'line-through', opacity: 0.8 } : {}}>
                        {t.completed ? '✅ ' : ''}{t.label} ({t.mins || 0}m)
                      </span>
                    ))}
                    {r.tasks.length > 4 && (
                      <span className={s.taskPill} style={{ background: 'rgba(30,16,7,0.05)', color: 'var(--pd-ink-mid)' }}>
                        +{r.tasks.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {/* Rewards */}
                <div style={{ borderTop: '1.5px solid rgba(30,16,7,0.06)', paddingTop: 8 }}>
                  <p className={s.routineMeta} style={{ marginBottom: r.rewards?.badgesEarned?.length ? 6 : 0 }}>
                    ⭐ {r.rewards?.starsEarned || 0} stars earned
                  </p>
                  {r.rewards?.badgesEarned?.length > 0 && (
                    <div className={s.taskPills}>
                      {r.rewards.badgesEarned.map((b, i) => (
                        <span key={i} className={s.taskPill}
                          style={{ background: 'var(--pd-lav-bg)', color: 'var(--pd-lav-dk)', borderColor: 'var(--pd-lav)', fontSize: '0.7rem' }}>{b}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════
          AI PLACEHOLDER NOTE
      ══════════════════════════════════════ */}
      <div className={s.rtAiNote}>
        <p style={{ fontSize: '1.4rem', margin: '0 0 6px' }}>🤖</p>
        <p style={{ fontWeight: 800, color: 'var(--pd-lav-dk)', margin: '0 0 4px', fontFamily: "'Baloo 2', cursive", fontSize: '1.05rem' }}>
          AI Routine Generator
        </p>
        <p style={{ fontSize: '0.83rem', color: 'var(--pd-lav-dk)', margin: 0, fontWeight: 700 }}>
          Click <strong>"AI Generate"</strong> at the top to create a personalised routine from {selectedStudentName}'s daily schedule.
          {' '}Add <code style={{ background: 'rgba(156,128,210,0.15)', padding: '1px 5px', borderRadius: 4 }}>GEMINI_API_KEY</code> to <code style={{ background: 'rgba(156,128,210,0.15)', padding: '1px 5px', borderRadius: 4 }}>.env</code> for live AI generation.
        </p>
      </div>

      {/* ══════════════════════════════════════
          AI MODAL
      ══════════════════════════════════════ */}
      {showAiModal && (
        <div className={s.rtModalOverlay} onClick={(e) => { if (e.target === e.currentTarget) { setShowAiModal(false); setAiPreview(null); } }}>
          <div className={s.rtModal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Baloo 2', cursive", fontSize: '1.3rem', margin: 0 }}>🤖 AI Routine Generator</h3>
              <button className={s.refreshBtn} onClick={() => { setShowAiModal(false); setAiPreview(null); }}
                style={{ padding: '6px 10px' }}><X size={16} /></button>
            </div>

            {!aiPreview ? (
              /* ── AI INPUT FORM ── */
              <form onSubmit={handleAiSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label className={s.rtLabel}>Child Name</label>
                    <input className={s.formInput} placeholder="e.g. Kamal" value={aiForm.childName}
                      onChange={e => setAiForm({ ...aiForm, childName: e.target.value })} />
                  </div>
                  <div>
                    <label className={s.rtLabel}>Age</label>
                    <input type="number" min="3" max="18" className={s.formInput} placeholder="e.g. 8"
                      value={aiForm.childAge} onChange={e => setAiForm({ ...aiForm, childAge: e.target.value })} />
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label className={s.rtLabel}>Support / Disability Type</label>
                  <select className={s.formInput} value={aiForm.disabilityType}
                    onChange={e => setAiForm({ ...aiForm, disabilityType: e.target.value })}>
                    <option value="">— select type —</option>
                    <option value="adhd">⚡ ADHD</option>
                    <option value="autism">🌿 Autism</option>
                    <option value="both">💜 Both</option>
                    <option value="general">🌟 General</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  {[
                    ['Wake-up time',         'wakeUpTime',      '7:00 AM'],
                    ['School starts at',     'schoolTime',      '8:30 AM'],
                    ['After-school home at', 'afterSchoolTime', '3:30 PM'],
                    ['Study / homework at',  'studyTime',       '4:30 PM'],
                    ['Bedtime',              'bedTime',         '8:30 PM'],
                  ].map(([label, key, placeholder]) => (
                    <div key={key}>
                      <label className={s.rtLabel}>{label}</label>
                      <input className={s.formInput} placeholder={placeholder}
                        value={aiForm[key]} onChange={e => setAiForm({ ...aiForm, [key]: e.target.value })} />
                    </div>
                  ))}
                  <div>
                    <label className={s.rtLabel}>Meal times (comma-separated)</label>
                    <input className={s.formInput} placeholder="breakfast 7:30, lunch 12:30, dinner 6:00"
                      value={aiForm.mealTimes} onChange={e => setAiForm({ ...aiForm, mealTimes: e.target.value })} />
                  </div>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label className={s.rtLabel}>Goals (select all that apply)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 6 }}>
                    {GOAL_OPTIONS.map(g => {
                      const sel = aiForm.goals.includes(g);
                      return (
                        <button type="button" key={g}
                          onClick={() => setAiForm(prev => ({ ...prev, goals: sel ? prev.goals.filter(x => x !== g) : [...prev.goals, g] }))}
                          style={{
                            padding: '5px 13px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', border: '1.5px solid',
                            background: sel ? 'var(--pd-teal)' : 'white',
                            color:      sel ? 'white' : 'var(--pd-ink-mid)',
                            borderColor: sel ? 'var(--pd-teal)' : 'rgba(30,16,7,0.12)',
                            transition: 'all 0.15s',
                          }}>
                          {sel ? '✓ ' : ''}{g}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button type="submit" className={s.formSubmitBtn} disabled={aiLoading} style={{ width: '100%' }}>
                  {aiLoading ? '⏳ Generating your routine…' : '🤖 Generate Routine'}
                </button>
              </form>
            ) : (
              /* ── AI PREVIEW ── */
              <div>
                {aiPreview._isMock && (
                  <div style={{ background: 'var(--pd-amber-bg)', border: '1.5px solid var(--pd-amber)', borderRadius: 10, padding: '8px 14px', marginBottom: 14, fontSize: '0.82rem', fontWeight: 700, color: 'var(--pd-amber-dk)' }}>
                    ℹ️ Mock routine generated — add <code>GEMINI_API_KEY</code> to .env for live AI.
                  </div>
                )}

                <h4 style={{ fontFamily: "'Baloo 2', cursive", fontSize: '1.2rem', margin: '0 0 6px' }}>
                  {catEmoji[aiPreview.category] || '📋'} {aiPreview.title}
                </h4>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {[
                    { text: aiPreview.category,     bg: 'var(--pd-teal-bg)',  color: 'var(--pd-teal-dk)' },
                    { text: typeStyle(aiPreview.type)?.label, bg: typeStyle(aiPreview.type)?.bg, color: typeStyle(aiPreview.type)?.color },
                    { text: `⏱ ${aiPreview.estimatedTime || (aiPreview.tasks||[]).reduce((s,t)=>s+t.mins,0)} min`, bg: 'var(--pd-amber-bg)', color: 'var(--pd-amber-dk)' },
                  ].map((b, i) => b.text && (
                    <span key={i} style={{ background: b.bg, color: b.color, padding: '3px 11px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800 }}>{b.text}</span>
                  ))}
                </div>

                {aiPreview.notes && (
                  <div style={{ background: 'var(--pd-paper2)', borderLeft: '3px solid var(--pd-teal)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: '0.85rem', fontWeight: 700, color: 'var(--pd-ink-mid)', lineHeight: 1.5 }}>
                    💡 {aiPreview.notes}
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--pd-ink-soft)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Tasks ({(aiPreview.tasks || []).length})</p>
                  {(aiPreview.tasks || []).map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(30,16,7,0.05)' }}>
                      <span style={{ background: 'var(--pd-teal-bg)', color: 'var(--pd-teal-dk)', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 900, flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 700, color: 'var(--pd-ink)' }}>{t.label}</span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--pd-ink-soft)', flexShrink: 0 }}>{t.mins}m</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className={s.formSubmitBtn} onClick={handleAiSave}>
                    <Check size={16} style={{ marginRight: 4 }} /> Save Routine
                  </button>
                  <button className={s.refreshBtn} onClick={handleAiEdit}
                    style={{ background: 'var(--pd-amber-bg)', color: 'var(--pd-amber-dk)', borderColor: 'var(--pd-amber)' }}>
                    <Edit2 size={14} style={{ marginRight: 4 }} /> Edit First
                  </button>
                  <button className={s.refreshBtn} onClick={() => setAiPreview(null)}>
                    ← Back
                  </button>
                </div>
              </div>
            )}
          </div>
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
    downloadSingleReportPDF(r, 'BrightSteps — Progress Report');
  };

  const totalHappy = reports.filter(r => r.mood === 'Happy' || r.mood === 'Excited').length;
  const totalStars = reports.reduce((sum, r) => sum + (r.stars || 0), 0);

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

      {!loading && reports.length > 0 && (
        <div className={s.progressSummaryBanner}>
          <div className={s.psbAvatarArea}>
            <div className={s.psbAvatar}>🎓</div>
          </div>
          <div className={s.psbDetails}>
            <h3>Child Dashboard Summary</h3>
            <div className={s.psbMetaRow}>
              <span className={`${s.psbPill} ${s.sky}`}>📋 {reports.length} Reports</span>
              <span className={`${s.psbPill} ${s.sage}`}>😊 {totalHappy} Happy Days</span>
              <span className={`${s.psbPill} ${s.amber}`}>⭐ {totalStars} Stars Earned</span>
            </div>
            <p className={s.psbDesc}>
              You are viewing progress reports securely scoped to <strong>{childName}</strong>. 
              All data is directly from teacher submissions and completed learning hub activities.
            </p>
          </div>
        </div>
      )}

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
