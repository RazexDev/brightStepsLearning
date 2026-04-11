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

/* ═══════════════════════════════════
   TAB 2 — ROUTINES
═══════════════════════════════════ */
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
    childAge: '',
    disabilityType: '',
    wakeUpTime: '07:00 AM',
    schoolTime: '08:30 AM',
    afterSchoolTime: '03:30 PM',
    studyTime: '04:30 PM',
    bedTime: '08:30 PM',
    mealTimes: 'breakfast 07:30 AM, dinner 06:30 PM',
    goals: [],
  });

  // Search/filter state
  const [searchQuery,    setSearchQuery]    = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState('all');

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

  const [selectedStudentId]   = React.useState(user?._id || '');
  const [selectedDisability]  = React.useState(studentDiagnosis);

  const emptyTask = () => ({ label: '', mins: 5, _key: Math.random().toString(36).slice(2), completed: false });

  const [form, setForm] = React.useState({
    title: '', category: 'morning', type: studentDiagnosis,
    goal: '', tags: '', tasks: [emptyTask()],
  });

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

  /* ── TASK HELPERS ───────────────────────────────── */
  const updateTask    = (i, key, val) => setForm(prev => { 
    const t = [...prev.tasks]; 
    t[i] = { ...t[i], [key]: val }; 
    return { ...prev, tasks: t }; 
  });
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
        ? routine.tasks.map(t => ({ label: t.label || '', mins: t.mins ?? 5, completed: t.completed ?? false, _key: Math.random().toString(36).slice(2) }))
        : [emptyTask()],
    });
    setShowForm(true);
    setTimeout(() => document.getElementById('rt-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  /* ── SAVE ROUTINE ───────────────────────────────── */
  const handleSaveRoutine = async (e) => {
    e.preventDefault();
    const cleanedTasks = form.tasks.map(t => ({ label: t.label.trim(), mins: Number(t.mins) || 0, completed: !!t.completed })).filter(t => t.label);
    if (!form.title.trim()) { alert('Routine title is required.'); return; }
    if (!cleanedTasks.length) { alert('Add at least one task.'); return; }

    const payload = {
      title: form.title.trim(), category: form.category, type: form.type,
      disabilityType: form.type,
      goal: form.goal, tasks: cleanedTasks,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      studentId: selectedStudentId, studentName: childName,
    };

    try {
      const res = await fetch(
        editingRoutine ? `${API}/routines/${editingRoutine._id}` : `${API}/routines`,
        { method: editingRoutine ? 'PUT' : 'POST', headers: authHdr(), body: JSON.stringify(payload) }
      );
      if (res.ok) { resetForm(); loadRoutines(); loadSummary(); }
      else { const d = await res.json(); alert(d.message || 'Failed to save routine.'); }
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

  /* ── TOGGLE TASK COMPLETION ─────────────────────── */
  const handleToggleTask = async (routine, taskIndex) => {
    const updatedTasks = [...routine.tasks];
    updatedTasks[taskIndex].completed = !updatedTasks[taskIndex].completed;
    
    // Calculate new progress
    const completedCount = updatedTasks.filter(t => t.completed).length;
    const progress = Math.round((completedCount / updatedTasks.length) * 100);

    try {
      const res = await fetch(`${API}/routines/${routine._id}`, {
        method: 'PUT',
        headers: authHdr(),
        body: JSON.stringify({ ...routine, tasks: updatedTasks, progress })
      });
      if (res.ok) { loadRoutines(); loadSummary(); }
    } catch { /* silent fail */ }
  };

  /* ── ASSIGN TEMPLATE ────────────────────────────── */
  const handleAssignTemplate = async (templateId) => {
    try {
      const res = await fetch(`${API}/routines/assign-template`, {
        method: 'POST', headers: authHdr(),
        body: JSON.stringify({ templateId, studentId: selectedStudentId, studentName: childName }),
      });
      const data = await res.json();
      if (res.ok) { loadRoutines(); loadSummary(); alert('✅ Template assigned!'); }
      else alert(data.message || 'Failed to assign template.');
    } catch { alert('Error assigning template.'); }
  };

  /* ── AI GENERATE ────────────────────────────────── */
  const handleAiSubmit = async (e) => {
    e.preventDefault();
    if (!aiForm.disabilityType) { 
      alert('Please select a support type (ADHD, Autism, etc.) to help the AI tailor your routine.'); 
      return; 
    }
    if (aiForm.goals.length === 0) {
      if (!window.confirm('No specific goals selected. Would you like the AI to generate a general routine?')) return;
    }
    setAiLoading(true);
    setAiPreview(null);
    try {
      const res  = await fetch(`${API}/routines/ai-generate`, {
        method: 'POST', headers: authHdr(),
        body: JSON.stringify({
          ...aiForm,
          childName,
          // split mealTimes if it's a string, or send as is if it's expected to be a string
          mealTimes: typeof aiForm.mealTimes === 'string' ? aiForm.mealTimes.split(',').map(m => m.trim()) : aiForm.mealTimes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAiPreview(data);
      } else {
        alert(data.message || 'AI generation failed.');
      }
    } catch (err) {
      alert('AI error — please check your connection and try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiSave = async () => {
    if (!aiPreview) return;
    const payload = {
      title:     aiPreview.title,
      category:  aiPreview.category || 'custom',
      type:      aiPreview.type     || selectedDisability,
      disabilityType: aiPreview.type || selectedDisability,
      goal:      (aiPreview.goals || [])[0] || '',
      tasks:     (aiPreview.tasks || []).map(t => ({ label: t.label, mins: t.mins || 0, completed: false })),
      tags:      aiPreview.goals   || [],
      studentId: selectedStudentId,
      studentName: childName,
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
      tasks:    (aiPreview.tasks  || []).map(t => ({ label: t.label || '', mins: t.mins || 5, completed: false, _key: Math.random().toString(36).slice(2) })),
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
      if (!q) return true;
      return (
        r.title?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        (r.tasks || []).some(t => t.label?.toLowerCase().includes(q)) ||
        r.goal?.toLowerCase().includes(q)
      );
    });
  }, [routines, searchQuery, filterCategory]);

  /* ── HELPERS ────────────────────────────────────── */
  const pctColor = (pct) => pct >= 80 ? 'var(--pd-sage)' : pct >= 50 ? 'var(--pd-amber)' : 'var(--pd-rose)';
  const catEmoji = { morning: '🌅', school: '🏫', study: '📚', evening: '🌆', bedtime: '🌙', custom: '⚙️' };
  const typeStyle = (type) => ({
    adhd:    { bg: 'var(--pd-amber-bg)',  border: 'var(--pd-amber)',  color: 'var(--pd-amber-dk)',  label: '⚡ ADHD' },
    autism:  { bg: 'var(--pd-teal-bg)',   border: 'var(--pd-teal)',   color: 'var(--pd-teal-dk)',   label: '🌿 Autism' },
    both:    { bg: 'var(--pd-lav-bg)',    border: 'var(--pd-lav)',    color: 'var(--pd-lav-dk)',    label: '💜 Both' },
    general: { bg: 'var(--pd-sky-bg)',    border: 'var(--pd-sky)',    color: 'var(--pd-sky-dk)',    label: '🌟 General' },
  }[type?.toLowerCase()] || { bg: 'var(--pd-paper2)', border: 'rgba(30,16,7,0.1)', color: 'var(--pd-ink-mid)', label: type });

  /* ═══════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════ */
  return (
    <>
      {/* 1. TOP SECTION: SEARCH + ASSIGNED ROUTINES */}
      <div className={s.sectionHeader}>
        <div>
          <h2>📅 Routine Management</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
             <p style={{ margin: 0 }}>Viewing routines for <strong>{childName}</strong></p>
             {(() => {
               const ts = typeStyle(selectedDisability);
               return <span style={{ background: ts.bg, border: '1.5px solid '+ts.border, color: ts.color, padding: '2px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>{ts.label}</span>;
             })()}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className={s.refreshBtn} style={{ background: 'var(--pd-lav-bg)', color: 'var(--pd-lav-dk)', borderColor: 'var(--pd-lav)' }}
            onClick={() => { setShowAiModal(true); setAiPreview(null); }}>
            🤖 AI Generate
          </button>
          <button className={s.refreshBtn} onClick={() => { if (showForm) resetForm(); else { setEditingRoutine(null); setShowForm(true); } }}>
            {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? 'Cancel' : 'New Routine'}
          </button>
          <button className={s.refreshBtn} onClick={() => { loadRoutines(); loadTemplates(); loadSummary(); }}>
            <RefreshCcw size={15} /> Refresh
          </button>
        </div>
      </div>

      <div className={s.rtSearchBar} style={{ marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>🔍</span>
          <input className={s.formInput} style={{ paddingLeft: 36, width: '100%' }}
            placeholder="Search routines or tasks..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <select className={s.formInput} style={{ flex: 'none', width: 'auto' }}
          value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="all">All Categories</option>
          <option value="morning">🌅 Morning</option>
          <option value="school">🏫 School</option>
          <option value="study">📚 Study</option>
          <option value="evening">🌆 Evening</option>
          <option value="bedtime">🌙 Bedtime</option>
          <option value="custom">⚙️ Custom</option>
        </select>
        {(searchQuery || filterCategory !== 'all') && (
          <button className={s.refreshBtn} onClick={() => { setSearchQuery(''); setFilterCategory('all'); }}><X size={14} /></button>
        )}
      </div>

      <div className={s.sectionHeader} style={{ marginBottom: 16 }}>
         <h3>📋 Assigned Routines</h3>
      </div>

      {loading ? (
        <div className={s.emptyState}><div className={s.emptyIcon}>⏳</div><p>Loading...</p></div>
      ) : filteredRoutines.length === 0 ? (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>📭</div>
          <p>No routines found. Create one below or try AI generation!</p>
        </div>
      ) : (
        <div className={s.routineGrid} style={{ marginBottom: 32 }}>
          {filteredRoutines.map(r => {
            const ts = typeStyle(r.type);
            const emoji = catEmoji[r.category] || '📋';
            const completedCount = (r.tasks || []).filter(t => t.completed).length;
            const totalTasks = (r.tasks || []).length;
            return (
              <div key={r._id} className={s.routineCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <p className={s.routineName}>{emoji} {r.title}</p>
                    <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
                      <span style={{ background: ts.bg, color: ts.color, border: `1px solid ${ts.border}`, padding: '2px 8px', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 800 }}>{ts.label}</span>
                      {r.goal && <span style={{ background: 'var(--pd-sage-bg)', color: 'var(--pd-sage)', padding: '2px 8px', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 800 }}>🎯 {r.goal}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className={s.refreshBtn} style={{ padding: 6 }} onClick={() => openEditForm(r)}><Edit2 size={13}/></button>
                    <button className={s.refreshBtn} style={{ padding: 6, color: 'var(--pd-rose)' }} onClick={() => handleDeleteRoutine(r._id)}><Trash2 size={13}/></button>
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--pd-ink-soft)' }}>{completedCount}/{totalTasks} tasks</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: pctColor(r.progress || 0) }}>{r.progress || 0}%</span>
                  </div>
                  <div style={{ background: 'rgba(30,16,7,0.06)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${r.progress || 0}%`, height: '100%', background: pctColor(r.progress || 0), transition: 'width 0.5s' }} />
                  </div>
                </div>

                <div className={s.taskChecklist}>
                  {(r.tasks || []).map((t, i) => (
                    <div key={i} onClick={() => handleToggleTask(r, i)} 
                      className={`${s.checkItem} ${t.completed ? s.checkItemDone : ''}`}>
                      <div className={`${s.checkCircle} ${t.completed ? s.checkCircleDone : ''}`}>
                        {t.completed && <Check size={12} color="white" />}
                      </div>
                      <span className={`${s.checkLabel} ${t.completed ? s.checkLabelDone : ''}`}>
                        {t.label} <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>({t.mins}m)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. MIDDLE SECTION: SUMMARY CARDS */}
      <div className={s.sectionHeader} style={{ marginBottom: 16 }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <h3>📊 Progress Overview</h3>
            {summary && (
              <button className={s.pdfBtn} onClick={() => downloadRoutineReportPDF(summary, childName)}>
                <Download size={14} /> Download Progress PDF
              </button>
            )}
         </div>
      </div>

      {summary && (
        <div className={s.routineGrid} style={{ marginBottom: 32 }}>
          {[
            { label: 'Total Routines', value: summary.totalAssigned || 0, color: 'var(--pd-sky)', icon: '📋' },
            { label: 'Completed', value: summary.completedCount || 0, color: 'var(--pd-sage)', icon: '✅' },
            { label: 'Completion Rate', value: `${summary.completionPercentage || 0}%`, color: pctColor(summary.completionPercentage), icon: '📈' },
            { label: 'Total Stars', value: `⭐ ${summary.totalStars || 0}`, color: 'var(--pd-amber)', icon: '🏅' }
          ].map((stat, i) => (
            <div key={i} className={s.routineCard} style={{ textAlign: 'center', borderTop: `4px solid ${stat.color}` }}>
              <p style={{ margin: '0 0 4px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--pd-ink-soft)' }}>{stat.icon} {stat.label}</p>
              <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* 3. BOTTOM SECTION: CREATION + TEMPLATES */}
      <div id="rt-creation-area" style={{ display: 'grid', gridTemplateColumns: showForm ? '1fr' : '1fr 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* Custom Creation Form */}
        {showForm && (
          <div className={s.routineCard} id="rt-form" style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
               <h3>{editingRoutine ? '✏️ Edit Routine' : '➕ Create Custom Routine'}</h3>
               <button className={s.refreshBtn} onClick={resetForm}><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveRoutine}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label className={s.rtLabel}>Routine Title *</label>
                  <input required className={s.formInput} value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Morning Spark..." />
                </div>
                <div>
                  <label className={s.rtLabel}>Category</label>
                  <select className={s.formInput} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {Object.keys(catEmoji).map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label className={s.rtLabel}>Goal</label>
                  <select className={s.formInput} value={form.goal} onChange={e => setForm({...form, goal: e.target.value})}>
                    <option value="">Choose Goal</option>
                    {GOAL_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className={s.rtLabel}>Support Type</label>
                  <select className={s.formInput} value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="adhd">⚡ ADHD</option>
                    <option value="autism">🌿 Autism</option>
                    <option value="both">💜 Both</option>
                    <option value="general">🌟 General</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <p className={s.rtLabel}>Tasks (Drag ⠿ to reorder) | ⏱ {form.tasks.reduce((s,t)=>s+(Number(t.mins)||0),0)}m total</p>
                {form.tasks.map((task, i) => (
                  <div key={task._key} draggable onDragStart={() => onDragStart(i)} onDragOver={(e) => onDragOver(e, i)} onDrop={() => onDrop(i)} onDragEnd={onDragEnd}
                    style={{ display: 'grid', gridTemplateColumns: '30px 1fr 100px 40px', gap: 8, marginBottom: 8, opacity: dragIndex === i ? 0.5 : 1, background: dragOverIndex === i ? 'rgba(0,0,0,0.02)' : 'transparent', padding: 4, borderRadius: 8 }}>
                    <div style={{ cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⠿</div>
                    <input className={s.formInput} placeholder="Task description..." value={task.label} onChange={e => updateTask(i, 'label', e.target.value)} />
                    <input type="number" className={s.formInput} value={task.mins} onChange={e => updateTask(i, 'mins', e.target.value)} style={{ textAlign: 'center' }} />
                    <button type="button" className={s.refreshBtn} onClick={() => removeTask(i)} style={{ color: 'var(--pd-rose)', borderColor: 'transparent' }}><Trash2 size={14}/></button>
                  </div>
                ))}
                <button type="button" className={s.refreshBtn} onClick={addTask} style={{ width: '100%', borderStyle: 'dashed' }}><Plus size={14} /> Add Task</button>
              </div>

              <button type="submit" className={s.formSubmitBtn} style={{ width: '100%' }}>{editingRoutine ? 'Update Routine' : 'Create Routine'}</button>
            </form>
          </div>
        )}

        {/* Templates Section */}
        <div style={{ gridColumn: showForm ? '1 / -1' : 'span 2' }}>
           <div className={s.sectionHeader} style={{ marginBottom: 16 }}>
              <h3>🧩 Recommended Templates</h3>
           </div>
           {templates.length === 0 ? (
             <p className={s.emptyState}>No matching templates found.</p>
           ) : (
             <div className={s.routineGrid}>
               {templates.map(tmpl => {
                 const ts = typeStyle(tmpl.disabilityType);
                 return (
                   <div key={tmpl._id} className={s.routineCard} style={{ borderLeft: `6px solid ${ts.border}`, padding: '16px' }}>
                     <h4 style={{ margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>{catEmoji[tmpl.category]} {tmpl.title}</h4>
                     
                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                        {tmpl.goals?.slice(0, 2).map((g, i) => <span key={i} style={{ background: 'var(--pd-sage-bg)', color: 'var(--pd-sage)', fontSize: '0.65rem', padding: '2px 8px', borderRadius: 99 }}>🎯 {g}</span>)}
                        {tmpl.skills?.slice(0, 2).map((sk, i) => <span key={i} style={{ background: 'var(--pd-sky-bg)', color: 'var(--pd-sky-dk)', fontSize: '0.65rem', padding: '2px 8px', borderRadius: 99 }}>🎓 {sk}</span>)}
                     </div>

                     <div style={{ background: 'rgba(0,0,0,0.03)', padding: 10, borderRadius: 8, marginBottom: 12 }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6, margin: '0 0 6px' }}>Task Preview</p>
                        {tmpl.tasks?.slice(0, 3).map((t, i) => <p key={i} style={{ margin: '0 0 4px', fontSize: '0.78rem', fontWeight: 600 }}>• {t.label}</p>)}
                        {tmpl.tasks?.length > 3 && <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--pd-teal-dk)', fontWeight: 800 }}>+ {tmpl.tasks.length - 3} more</p>}
                     </div>

                     <button className={s.formSubmitBtn} style={{ width: '100%', fontSize: '0.8rem', padding: '8px' }} onClick={() => handleAssignTemplate(tmpl._id)}>Assign to {childName}</button>
                   </div>
                 );
               })}
             </div>
           )}
        </div>
      </div>

      {/* AI MODAL */}
      {showAiModal && (
        <div className={s.rtModalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setShowAiModal(false); }}>
          <div className={s.rtModal}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className={s.rtChildAvatar}>🤖</div>
                  <div>
                    <h3 style={{ margin: 0 }}>AI Routine Generator</h3>
                    <p className={s.rtLabel} style={{ marginBottom: 0 }}>Powered by BrightSteps AI</p>
                  </div>
                </div>
                <button className={s.refreshBtn} onClick={() => setShowAiModal(false)}><X size={18} /></button>
             </div>
 
             {!aiPreview ? (
                <form onSubmit={handleAiSubmit}>
                   <div className={s.rtAiStepTitle}>
                     <span>1️⃣</span> Step 1: Tell us about {childName}
                   </div>
                   
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                      <div>
                         <label className={s.rtLabel}>Age</label>
                         <input className={s.formInput} type="number" placeholder="e.g. 8" value={aiForm.childAge} onChange={e => setAiForm({...aiForm, childAge: e.target.value})} />
                      </div>
                      <div>
                         <label className={s.rtLabel}>Support Type *</label>
                         <select required className={s.formInput} value={aiForm.disabilityType} onChange={e => setAiForm({...aiForm, disabilityType: e.target.value})}>
                            <option value="">Select Type</option>
                            <option value="adhd">⚡ ADHD</option>
                            <option value="autism">🌿 Autism</option>
                            <option value="both">💜 Both</option>
                            <option value="general">🌟 General</option>
                         </select>
                      </div>
                   </div>
 
                   <div className={s.rtAiStepTitle}>
                     <span>2️⃣</span> Step 2: Daily Schedule
                   </div>
                   <p className={s.rtLabel} style={{ marginBottom: 12, textTransform: 'none' }}>Enter approximate times to help AI plan the day.</p>
 
                   <div className={s.rtAiGrid}>
                      {[
                        ['Wake Up', 'wakeUpTime'], 
                        ['School Start', 'schoolTime'], 
                        ['Home / After School', 'afterSchoolTime'], 
                        ['Study / Homework', 'studyTime'],
                        ['Bedtime', 'bedTime']
                      ].map(([lbl, key]) => (
                        <div key={key}>
                           <label className={s.rtLabel}>{lbl}</label>
                           <input className={s.formInput} value={aiForm[key]} onChange={e => setAiForm({...aiForm, [key]: e.target.value})} placeholder="e.g. 7:00 AM" />
                        </div>
                      ))}
                      <div>
                         <label className={s.rtLabel}>Meal Times (Optional)</label>
                         <input className={s.formInput} value={aiForm.mealTimes} onChange={e => setAiForm({...aiForm, mealTimes: e.target.value})} placeholder="e.g. B: 7:30, D: 6:30" />
                      </div>
                   </div>
 
                   <div className={s.rtAiStepTitle}>
                     <span>3️⃣</span> Step 3: Routine Goals
                   </div>
                   <div className={s.rtAiGoalGrid}>
                      {GOAL_OPTIONS.map(g => {
                        const active = aiForm.goals.includes(g);
                        return (
                          <button 
                            type="button" 
                            key={g} 
                            onClick={() => setAiForm(p => ({...p, goals: active ? p.goals.filter(x=>x!==g) : [...p.goals, g]}))}
                            className={`${s.rtAiGoalBtn} ${active ? s.rtAiGoalBtnActive : ''}`}
                          >
                             {g}
                          </button>
                        );
                      })}
                   </div>
 
                   <button type="submit" className={s.formSubmitBtn} style={{ width: '100%', padding: '14px', fontSize: '1rem' }} disabled={aiLoading || !aiForm.disabilityType}>
                      {aiLoading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <span className={s.spinner} style={{ width: 16, height: 16 }}></span>
                          Generating special routine...
                        </div>
                      ) : '✨ Generate AI Routine'}
                   </button>
                </form>
             ) : (
                <div>
                   <div className={s.rtAiStepTitle}>
                     <span>✨</span> AI Recommended Routine
                   </div>
                   
                   <div className={s.rtAiPreviewCard}>
                      <div className={s.rtAiPreviewHeader}>
                        <div>
                          <h4 className={s.rtAiPreviewTitle}>{aiPreview.title || 'Daily Routine'}</h4>
                          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                            <span className={s.rtAiPreviewMeta}>{aiPreview.type || aiForm.disabilityType}</span>
                            <span className={s.rtAiPreviewMeta} style={{ background: 'var(--pd-amber-bg)', color: 'var(--pd-amber-dk)' }}>{aiPreview.category || 'custom'}</span>
                          </div>
                        </div>
                        <div style={{ fontSize: '2.5rem' }}>{catEmoji[aiPreview.category] || '📋'}</div>
                      </div>
 
                      <p className={s.rtLabel} style={{ textTransform: 'none', marginBottom: 12 }}>
                        🎯 Goals: {Array.isArray(aiPreview.goals) && aiPreview.goals.length ? aiPreview.goals.join(', ') : 'General growth'}
                      </p>
                      
                      <div className={s.rtAiTaskList}>
                         {(aiPreview.tasks || []).map((t, i) => (
                           <div key={i} className={s.rtAiTaskItem}>
                              <span>{t.label}</span>
                              <span className={s.rtAiTaskTime}>{t.mins}m</span>
                           </div>
                         ))}
                      </div>
                      
                      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--pd-ink-soft)', fontStyle: 'italic', textAlign: 'center' }}>
                        "This routine is tailored for {childName}'s {aiForm.disabilityType} needs."
                      </p>
                   </div>
 
                   <div className={s.rtAiActionRow}>
                      <button className={s.formSubmitBtn} onClick={handleAiSave} style={{ flex: 1 }}>Save Routine</button>
                      <button className={s.refreshBtn} onClick={handleAiEdit}>Edit First</button>
                      <button className={s.refreshBtn} onClick={() => setAiPreview(null)}>Retry</button>
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
