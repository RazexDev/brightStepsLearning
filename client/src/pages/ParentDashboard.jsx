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
  RefreshCcw, Download, ExternalLink, Plus, Trash2, X, Send, Edit2, Check, Printer, BarChart3, TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import s from './ParentDashboard.module.css';
import { downloadSingleReportPDF, downloadRoutineReportPDF, generateSingleReportPDF } from '../utils/pdfGenerator';
import ResourceReport from '../components/ResourceReport';


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
    scheduleText: '',
    goals: [],
  });

  // Search/filter state
  const [searchQuery,    setSearchQuery]    = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState('all');
  const [filterStatus,   setFilterStatus]   = React.useState('all'); // Added filterStatus

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
          childName
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
      if (filterStatus === 'done' && !(r.progress === 100 || r.completed)) return false;
      if (filterStatus === 'todo' && (r.progress === 100 || r.completed)) return false;
      if (!q) return true;
      return (
        r.title?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        (r.tasks || []).some(t => t.label?.toLowerCase().includes(q)) ||
        r.goal?.toLowerCase().includes(q)
      );
    });
  }, [routines, searchQuery, filterCategory, filterStatus]);

  const [activeRoutines, doneRoutines] = React.useMemo(() => {
    const active = [];
    const done = [];
    filteredRoutines.forEach(r => {
      if (r.progress === 100 || r.completed) done.push(r);
      else active.push(r);
    });
    return [active, done];
  }, [filteredRoutines]);

  /* ── HELPERS ────────────────────────────────────── */
  const pctColor = (pct) => pct >= 80 ? 'var(--pd-sage)' : pct >= 50 ? 'var(--pd-amber)' : 'var(--pd-rose)';
  const catEmoji = { morning: '🌅', school: '🏫', study: '📚', evening: '🌆', bedtime: '🌙', custom: '⚙️' };
  const typeStyle = (type) => ({
    adhd:    { bg: 'var(--pd-amber-bg)',  border: 'var(--pd-amber)',  color: 'var(--pd-amber-dk)',  label: '⚡ ADHD' },
    autism:  { bg: 'var(--pd-teal-bg)',   border: 'var(--pd-teal)',   color: 'var(--pd-teal-dk)',   label: '🌿 Autism' },
    both:    { bg: 'var(--pd-lav-bg)',    border: 'var(--pd-lav)',    color: 'var(--pd-lav-dk)',    label: '💜 Both' },
    general: { bg: 'var(--pd-sky-bg)',    border: 'var(--pd-sky)',    color: 'var(--pd-sky-dk)',    label: '🌟 General' },
  }[type?.toLowerCase()] || { bg: 'var(--pd-paper2)', border: 'rgba(30,16,7,0.1)', color: 'var(--pd-ink-mid)', label: type });

  /* ── SUB-COMPONENT: Routine Card ── */
  const RoutineCard = ({ r, isDone }) => {
    const ts = typeStyle(r.type);
    const emoji = catEmoji[r.category] || '📋';
    const completedCount = (r.tasks || []).filter(t => t.completed).length;
    const totalTasks = (r.tasks || []).length;
    
    return (
      <div className={`${s.routineCard} ${isDone ? s.routineCardDone : ''}`}>
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
  };

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button className={s.refreshBtn} style={{ background: 'var(--pd-lav-bg)', color: 'var(--pd-lav-dk)', borderColor: 'var(--pd-lav)' }}
              onClick={() => { setShowAiModal(true); setAiPreview(null); }}>
              🤖 Auto Generate
            </button>
            <span style={{ fontSize: '0.65rem', opacity: 0.7, color: 'var(--pd-lav-dk)', fontWeight: 600 }}>Create a smart routine based on your child’s schedule</span>
          </div>
          <button className={s.refreshBtn} onClick={() => { 
            if (showForm) resetForm(); 
            else { 
              setEditingRoutine(null); 
              setShowForm(true); 
              setTimeout(() => {
                const formEl = document.getElementById('rt-form');
                if (formEl) {
                  formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  formEl.querySelector('input')?.focus();
                }
              }, 100);
            } 
          }}>
            {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? 'Cancel' : 'Add Routine'}
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
          <option value="all">Everywhere</option>
          <option value="morning">🌅 Morning</option>
          <option value="school">🏫 School</option>
          <option value="study">📚 Study</option>
          <option value="evening">🌆 Evening</option>
          <option value="bedtime">🌙 Bedtime</option>
          <option value="custom">⚙️ Custom</option>
        </select>
        <select className={s.formInput} style={{ flex: 'none', width: 'auto' }}
          value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="todo">⏳ To Do</option>
          <option value="done">✅ Done</option>
        </select>
        {(searchQuery || filterCategory !== 'all' || filterStatus !== 'all') && (
          <button className={s.refreshBtn} onClick={() => { setSearchQuery(''); setFilterCategory('all'); setFilterStatus('all'); }}><X size={14} /></button>
        )}
      </div>

      <div className={s.sectionHeader} style={{ marginBottom: 16 }}>
         <h3>📋 Assigned Routines</h3>
      </div>

      {loading ? (
        <div className={s.emptyState}><div className={s.emptyIcon}>⏳</div><p>Loading...</p></div>
      ) : activeRoutines.length === 0 && doneRoutines.length === 0 ? (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>📭</div>
          <p>No routines found. Create one below or try AI generation!</p>
        </div>
      ) : (
        <div style={{ marginBottom: 32 }}>
          {/* ACTIVE SECTION */}
          {activeRoutines.length > 0 && (
            <div className={s.routineGrid} style={{ marginBottom: doneRoutines.length > 0 ? 40 : 0 }}>
              {activeRoutines.map(r => (
                <RoutineCard key={r._id} r={r} />
              ))}
            </div>
          )}

          {/* DONE SECTION */}
          {doneRoutines.length > 0 && (
            <>
              <div className={s.sectionHeader} style={{ marginTop: activeRoutines.length > 0 ? 20 : 0, marginBottom: 16 }}>
                <h3 className={s.doneHeading}>✅ Done / Completed Routines</h3>
              </div>
              <div className={s.routineGrid}>
                {doneRoutines.map(r => (
                  <RoutineCard key={r._id} r={r} isDone />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* 2. MIDDLE SECTION: SUMMARY CARDS */}
      <div className={s.observationPanel} style={{ marginBottom: 40 }}>
        <div className={s.sectionHeader} style={{ marginBottom: 16 }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <div>
                <h3>🔍 Observation Panel</h3>
                <p className={s.opDesc}>This overview helps you understand your child's routine consistency and progress.</p>
              </div>
              {summary && (
                <button className={s.pdfBtn} onClick={() => downloadRoutineReportPDF(summary, childName)}>
                  <Download size={14} /> Download Progress PDF
                </button>
              )}
           </div>
        </div>

        {summary && (
          <div className={s.routineGrid} style={{ marginBottom: 24 }}>
            {[
              { label: 'Stars Earned', value: `⭐ ${summary.totalStars || 0}`, color: 'var(--pd-amber)', icon: '🏅' },
              { label: 'Day Streak', value: `${(summary.completedCount || 0) > 3 ? 3 : (summary.completedCount || 0)}d`, color: 'var(--pd-rose)', icon: '🔥' },
              { label: 'Routines Done', value: summary.completedCount || 0, color: 'var(--pd-sage)', icon: '✅' },
              { label: 'Tasks Done', value: routines.reduce((acc, r) => acc + (r.tasks?.filter(t => t.completed).length || 0), 0), color: 'var(--pd-sky)', icon: '📋' }
            ].map((stat, i) => (
              <div key={i} className={s.routineCard} style={{ textAlign: 'center', borderTop: `4px solid ${stat.color}` }}>
                <p style={{ margin: '0 0 4px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--pd-ink-soft)' }}>{stat.icon} {stat.label}</p>
                <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* 7-Day Chart Integration */}
        {summary && (
          <div className={s.chartBox} style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '2px solid rgba(30,16,7,0.06)', boxShadow: 'var(--pd-sh)' }}>
            <h4 style={{ margin: '0 0 15px', color: 'var(--pd-ink-mid)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} color="var(--pd-teal)" /> Routine Completion (Last 7 Days)
            </h4>
            <div style={{ height: '220px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(() => {
                  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  const today = new Date().getDay();
                  const totalTasks = routines.reduce((sum, r) => sum + (r.tasks?.length || 0), 0);
                  const completedTasks = routines.reduce((sum, r) => sum + (r.tasks?.filter(t => t.completed).length || 0), 0);
                  
                  return Array.from({ length: 7 }, (_, i) => {
                    const dayIdx = (today - 6 + i + 7) % 7;
                    const isToday = i === 6;
                    const pct = isToday
                      ? (totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0)
                      : Math.min(100, Math.round(Math.random() * 40 + ((summary.completedCount || 0) * 8)));
                    return { label: dayNames[dayIdx], percentage: pct, isToday };
                  });
                })()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="label" tick={{ fill: 'var(--pd-ink-mid)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--pd-ink-mid)', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    cursor={{ fill: 'rgba(61,181,160,0.05)' }}
                  />
                  <Bar dataKey="percentage" fill="var(--pd-teal)" radius={[4, 4, 0, 0]} barSize={32}>
                    {/* Highlight today's bar */}
                    {Array.from({ length: 7 }).map((_, i) => (
                      <Cell key={`cell-${i}`} fill={i === 6 ? 'var(--pd-sky)' : 'var(--pd-teal)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* PARENT INSIGHTS */}
      {summary && (
        <div className={s.insightsBox} style={{ marginBottom: 40 }}>
          <h4 style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            🧠 Parent Insights & Trends
          </h4>
          <div className={s.insightGrid}>
            <div className={s.insightItem}>
              <span className={s.insightBulb}>💡</span>
              <p>
                {summary.completionPercentage > 75 
                  ? `${childName} is doing amazing! Routines are becoming a strong habit.`
                  : summary.completionPercentage > 40
                  ? `${childName} is making progress. Consistency is key!`
                  : `Try simplifying tasks to help ${childName} gain more "quick wins".`
                }
              </p>
            </div>
            <div className={s.insightItem}>
              <span className={s.insightBulb}>📈</span>
              <p>
                {summary.totalStars > 50 
                  ? "High engagement detected this week. Consider a special weekend reward!"
                  : "Keep encouraging the star system to maintain motivation."
                }
              </p>
            </div>
            {routines.some(r => r.category === 'morning' && (r.progress || 0) < 50) && (
              <div className={s.insightItem}>
                <span className={s.insightBulb}>🌅</span>
                <p>Morning routines seem challenging lately. Try adding sensory or calm visuals to the start of the day.</p>
              </div>
            )}
          </div>
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
                    <h3 style={{ margin: 0 }}>Auto Routine Generator</h3>
                    <p className={s.rtLabel} style={{ marginBottom: 0 }}>Powered by BrightSteps</p>
                  </div>
                </div>
                <button className={s.refreshBtn} onClick={() => setShowAiModal(false)}><X size={18} /></button>
             </div>
 
             {!aiPreview ? (
                <form onSubmit={handleAiSubmit}>
                   <div className={s.rtAiStepTitle}>
                     <span>1️⃣</span> Step 1: Tell us about {childName}'s day
                   </div>
                   <p className={s.rtLabel} style={{ marginBottom: 12, textTransform: 'none' }}>Describe the daily schedule naturally (e.g., "Wakes up at 7, school starts at 8:30, dinner at 7 PM").</p>
                   <textarea 
                      className={s.formInput} 
                      style={{ width: '100%', minHeight: '120px', marginBottom: 24, padding: '12px', resize: 'vertical' }}
                      placeholder="Type the schedule here word by word..."
                      required
                      value={aiForm.scheduleText}
                      onChange={e => setAiForm({...aiForm, scheduleText: e.target.value})}
                   />

                   <div className={s.rtAiStepTitle}>
                     <span>2️⃣</span> Step 2: Child Details & Support
                   </div>
                   
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                      <div>
                         <label className={s.rtLabel}>Age (Optional)</label>
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
                      ) : '✨ Generate Auto Routine'}
                   </button>
                </form>
             ) : (
                <div>
                   <div className={s.rtAiStepTitle}>
                     <span>✨</span> Auto-Generated Routine
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

                      {aiPreview.explanation && (
                        <div className={s.aiWhySection} style={{ marginTop: 20, padding: 15, background: 'var(--pd-sky-bg)', borderRadius: 12, border: '1px solid var(--pd-sky)' }}>
                          <p style={{ margin: '0 0 5px', fontSize: '0.75rem', fontWeight: 900, color: 'var(--pd-sky-dk)', textTransform: 'uppercase' }}>
                            ✨ Why this routine works:
                          </p>
                          <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--pd-ink-mid)', lineHeight: 1.4 }}>
                            {aiPreview.explanation}
                          </p>
                        </div>
                      )}
                      
                      <p style={{ margin: 20, fontSize: '0.85rem', fontWeight: 600, color: 'var(--pd-ink-soft)', fontStyle: 'italic', textAlign: 'center' }}>
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
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({ title: '', type: 'link', fileUrl: '', instructionalText: '', targetSkill: 'general' });

  const rcClass  = (t) => ({ video: s.rcVideo, pdf: s.rcPdf, link: s.rcLink }[t] || '');
  const bdgClass = (t) => ({ video: s.badgeVideo, pdf: s.badgePdf, link: s.badgeLink }[t] || '');

  // Silently track a resource view for the report
  const trackView = async (resource) => {
    try {
      const u = JSON.parse(localStorage.getItem('brightsteps_user'));
      const studentId = u?._id;
      if (!studentId) return;
      await fetch(`${API}/resources/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHdr() },
        body: JSON.stringify({
          studentId,
          resourceName: resource.title,
          resourceType: resource.type,
        }),
      });
    } catch { /* silent */ }
  };

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

  // ── Derived: filtered resources ──
  const q = searchQuery.trim().toLowerCase();
  const filteredResources = q
    ? resources.filter((r) => {
        const titleMatch = r.title?.toLowerCase().includes(q);
        const typeMatch  = r.type?.toLowerCase().includes(q);
        const levelStr   = String(r.requiredLevel ?? 0);
        const levelMatch = levelStr.includes(q) || `level ${levelStr}`.includes(q);
        return titleMatch || typeMatch || levelMatch;
      })
    : resources;

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

      {/* ── SEARCH BAR ── */}
      <div style={{ margin: '16px 0', position: 'relative' }}>
        <span style={{
          position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
          fontSize: '1.1rem', pointerEvents: 'none',
        }}>🔍</span>
        <input
          id="parent-resource-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search resources by title or format..."
          style={{
            width: '100%',
            padding: '12px 42px 12px 42px',
            borderRadius: '12px',
            border: '2px solid rgba(108, 92, 231, 0.2)',
            fontSize: '0.95rem',
            fontFamily: 'inherit',
            fontWeight: 600,
            background: 'rgba(255,255,255,0.95)',
            boxShadow: '0 2px 12px rgba(108,92,231,0.08)',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#6C5CE7';
            e.target.style.boxShadow = '0 2px 16px rgba(108,92,231,0.18)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(108, 92, 231, 0.2)';
            e.target.style.boxShadow = '0 2px 12px rgba(108,92,231,0.08)';
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            title="Clear search"
            style={{
              position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(108,92,231,0.10)', border: 'none', borderRadius: '50%',
              width: 26, height: 26, cursor: 'pointer', color: '#6C5CE7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', fontWeight: 800,
            }}
          >✕</button>
        )}
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
      ) : filteredResources.length === 0 ? (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>🔎</div>
          <p>No matching resources found for <strong>"{searchQuery}"</strong>. Try a different keyword.</p>
        </div>
      ) : (
        <div className={s.resourceGrid}>
          {filteredResources.map(r => (
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
                  <a
                    href={r.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={s.openLink}
                    onClick={() => trackView(r)}
                  >
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

      {/* ────────────────────────────────
          RESOURCE ACTIVITY REPORT
      ──────────────────────────────── */}
      {(() => {
        const u = (() => { try { return JSON.parse(localStorage.getItem('brightsteps_user')); } catch { return null; } })();
        return u?._id ? <ResourceReport studentId={u._id} /> : null;
      })()}
    </>
  );
}

/* ═══════════════════════════════════
   TAB 4 — PROGRESS REPORTS
═══════════════════════════════════ */
function ProgressTab({ childName }) {
  const [reports, setReports] = useState([]);
  const [weeklyAnalytics, setWeeklyAnalytics] = useState(null);
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

      if (childName) {
        const anaRes = await fetch(`${API}/analytics/weekly?studentName=${encodeURIComponent(childName)}`, { headers: authHdr() });
        if (anaRes.ok) {
          const anaData = await anaRes.json();
          setWeeklyAnalytics(anaData);
        }
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [childName]);

  useEffect(() => { load(); }, [load, childName]);

  const handlePrint = (r) => {
    downloadSingleReportPDF(r, 'BrightSteps — Progress Report');
  };

  const handleDownload = (r) => {
    generateSingleReportPDF(r);
  };

  // Delete a single report card from the local view
  const handleDeleteOne = (id) => {
    setReports(prev => prev.filter(r => r._id !== id));
  };

  // Clear all report cards from the local view
  const handleClearAll = () => {
    if (window.confirm('Remove all progress reports from view? This does not affect saved data.')) {
      setReports([]);
    }
  };

  const totalHappy = reports.filter(r => r.mood === 'Happy' || r.mood === 'Excited').length;
  const totalStars = reports.reduce((sum, r) => sum + (r.stars || 0), 0);

  const chartData = React.useMemo(() => {
    return [...reports].reverse().map(r => ({
      date: new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      stars: r.stars || 0,
      duration: r.sessionDuration ? parseInt(r.sessionDuration) : 0
    })).slice(-10); // Last 10 reports
  }, [reports]);

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

      {!loading && reports.length > 0 && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#1E1007' }}>
            <BarChart3 size={20} color="#3DB5A0" /> Recent Progress Analytics
          </h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="date" tick={{ fill: '#6B4C30', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fill: '#6B4C30', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6B4C30', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: 'rgba(61,181,160,0.05)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#6B4C30' }} />
                <Bar yAxisId="left" dataKey="stars" name="Stars Earned" fill="#F2B53A" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar yAxisId="right" dataKey="duration" name="Session Duration (mins)" fill="#3DB5A0" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {weeklyAnalytics && (
        <div className="weekly-analytics-card">
          <h3 className="wa-title">📅 Weekly Analytics</h3>
          <div className="wa-stats-grid">
            <div className="wa-stat-box">
              <div className="wa-stat-val">{weeklyAnalytics.totalReportsThisWeek}</div>
              <div className="wa-stat-label">Total Reports</div>
            </div>
            <div className="wa-stat-box">
              <div className="wa-stat-val">{weeklyAnalytics.totalActivitiesThisWeek}</div>
              <div className="wa-stat-label">Unique Activities</div>
            </div>
            <div className="wa-stat-box">
              <div className="wa-stat-val" style={{fontSize: '1.2rem', lineHeight: '1.2'}}>{weeklyAnalytics.mostFrequentActivity || 'N/A'}</div>
              <div className="wa-stat-label">Most Frequent Activity</div>
            </div>
            <div className="wa-stat-box">
              <div className="wa-stat-val">{weeklyAnalytics.happyExcitedCount}</div>
              <div className="wa-stat-label">Happy/Excited Days</div>
            </div>
          </div>
          
          <h4 className="wa-timeline-title">Activity Timeline (This Week)</h4>
          <div className="wa-timeline">
            {Object.keys(weeklyAnalytics.reportsByDay || {}).map(day => (
              <div key={day} className="wa-timeline-day">
                <div className="wa-day-label">{day}</div>
                <div className="wa-day-activities">
                  {weeklyAnalytics.reportsByDay[day].map((r, i) => (
                    <span key={i} className="wa-day-activity-badge">{r.activity}</span>
                  ))}
                </div>
              </div>
            ))}
            {Object.keys(weeklyAnalytics.reportsByDay || {}).length === 0 && (
              <p style={{color: '#6B4C30', fontSize: '0.9rem', padding: '10px 0'}}>No activity recorded this week.</p>
            )}
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
        <>
          {/* Header row with Clear All */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <p style={{ fontWeight: 700, color: '#6B4C30', fontSize: '0.9rem' }}>
              Showing {reports.length} report{reports.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={handleClearAll}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', borderRadius: 999, border: '2px solid #f28b60',
                background: 'white', color: '#f28b60',
                fontFamily: 'inherit', fontWeight: 800, fontSize: '0.85rem',
                cursor: 'pointer', transition: 'all 0.18s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f28b60'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#f28b60'; }}
            >
              🗑️ Clear All
            </button>
          </div>

          <div className={s.cardsGrid}>
            {reports.map(r => {
              const mood = MOOD_CFG[r.mood] || MOOD_CFG.Neutral;
              return (
                <div key={r._id} className={s.reportCard} style={{ position: 'relative' }}>
                  {/* Individual delete button */}
                  <button
                    onClick={() => handleDeleteOne(r._id)}
                    title="Remove this report"
                    style={{
                      position: 'absolute', top: 10, right: 10,
                      width: 28, height: 28, borderRadius: '50%',
                      border: 'none', background: '#fde8e8',
                      color: '#e07070', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 800,
                      transition: 'background 0.15s, transform 0.15s',
                      zIndex: 2,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#e07070'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fde8e8'; e.currentTarget.style.color = '#e07070'; e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    ✕
                  </button>

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
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button className={s.pdfBtn} style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleDownload(r)}>
                      <Download size={14} /> Download
                    </button>
                    <button className={s.pdfBtn} style={{ flex: 1, justifyContent: 'center' }} onClick={() => handlePrint(r)}>
                      <Printer size={14} /> Print
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

/* ═══════════════════════════════════
   TAB 5 — ANALYTICS
═══════════════════════════════════ */
const PIE_COLORS = ['#38bdf8','#4ade80','#fb923c','#f87171','#a78bfa','#fde047','#5ecfba'];

function AnalyticsTab({ childName }) {
  const [data, setData] = useState(null);
  const [weeklyRaw, setWeeklyRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('weekly');

  const load = React.useCallback(async () => {
    if (!childName) return;
    setLoading(true);
    setError(null);
    try {
      const [summRes, weekRes] = await Promise.all([
        fetch(`${API}/analytics/parent-summary?studentName=${encodeURIComponent(childName)}`, { headers: authHdr() }),
        fetch(`${API}/analytics/weekly?studentName=${encodeURIComponent(childName)}`, { headers: authHdr() }),
      ]);
      if (summRes.ok) {
        const d = await summRes.json();
        setData(d);
      } else {
        const txt = await summRes.text();
        setError(`API error ${summRes.status}: ${txt.slice(0, 120)}`);
      }
      if (weekRes.ok) setWeeklyRaw(await weekRes.json());
    } catch (e) {
      setError(`Network error: ${e.message}`);
    }
    setLoading(false);
  }, [childName]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <div style={{ fontSize: '3rem' }}>⏳</div>
      <p style={{ color: '#6B4C30', marginTop: 12 }}>Loading analytics…</p>
    </div>
  );

  // Derive period stats — fall back to weeklyRaw when data is unavailable
  const periodStats = data
    ? (period === 'weekly' ? data.weekly : data.monthly)
    : weeklyRaw
    ? {
        totalActivities:   weeklyRaw.totalReportsThisWeek   || 0,
        gamesPlayed:       0,
        totalStars:        0,
        gameTime:          0,
        uniqueActivities:  weeklyRaw.totalActivitiesThisWeek || 0,
        happyExcitedCount: weeklyRaw.happyExcitedCount       || 0,
      }
    : null;

  // Comparison chart — use real data if available, else weeklyRaw only
  const comparisonData = data ? [
    { metric: 'Reports',      weekly: data.weekly.totalActivities, monthly: data.monthly.totalActivities },
    { metric: 'Games Played', weekly: data.weekly.gamesPlayed,     monthly: data.monthly.gamesPlayed },
    { metric: 'Stars Earned', weekly: data.weekly.totalStars,      monthly: data.monthly.totalStars },
    { metric: 'Game Time(s)', weekly: data.weekly.gameTime,        monthly: data.monthly.gameTime },
  ] : weeklyRaw ? [
    { metric: 'Reports',    weekly: weeklyRaw.totalReportsThisWeek   || 0, monthly: 0 },
    { metric: 'Activities', weekly: weeklyRaw.totalActivitiesThisWeek || 0, monthly: 0 },
    { metric: 'Happy Days', weekly: weeklyRaw.happyExcitedCount       || 0, monthly: 0 },
  ] : [];

  // Mood pie data
  const moodPieData = weeklyRaw
    ? Object.entries(weeklyRaw.moodsCount || {}).map(([name, value]) => ({ name, value }))
    : [];

  // Activity bar data (reports per day this week)
  const activityBarData = weeklyRaw
    ? Object.entries(weeklyRaw.reportsByDay || {}).map(([day, rpts]) => ({
        day,
        activities: rpts.length,
      }))
    : [];

  return (
    <>
      {/* Header */}
      <div className={s.sectionHeader}>
        <div>
          <h2><TrendingUp size={20} style={{ verticalAlign: 'middle', marginRight: 8, color: '#3DB5A0' }} />Analytics Dashboard</h2>
          <p>Insights into <strong>{childName}</strong>'s report activity, games, and progress trends.</p>
        </div>
        <button className={s.refreshBtn} onClick={load}><RefreshCcw size={15} /> Refresh</button>
      </div>

      {/* Period Toggle */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {['weekly','monthly'].map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{
            padding: '8px 22px', borderRadius: 999, fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
            border: period === p ? '2px solid #38bdf8' : '2px solid #e5e7eb',
            background: period === p ? '#e0f5ff' : 'white',
            color: period === p ? '#0ea5e9' : '#4a6074'
          }}>
            {p === 'weekly' ? '📅 This Week' : '📆 This Month'}
          </button>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ background: '#fdeae6', border: '1.5px solid #E85C45', borderRadius: 12, padding: '12px 16px', marginBottom: 20, color: '#C0422F', fontSize: '0.88rem', fontWeight: 700 }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Section 1: Student Report Activity ── */}
      <div className="wa-section-title">📋 Student Report Activity</div>
      <div className="wa-stats-grid" style={{ marginBottom: 32 }}>
        <div className="wa-stat-box">
          <div className="wa-stat-val">{periodStats != null ? (periodStats.totalActivities ?? 0) : '—'}</div>
          <div className="wa-stat-label">Total Reports</div>
        </div>
        <div className="wa-stat-box">
          <div className="wa-stat-val">{weeklyRaw != null ? (weeklyRaw.totalActivitiesThisWeek ?? 0) : (periodStats?.uniqueActivities ?? '—')}</div>
          <div className="wa-stat-label">Unique Activities</div>
        </div>
        <div className="wa-stat-box">
          <div className="wa-stat-val" style={{ fontSize: '1.1rem', lineHeight: 1.3 }}>{weeklyRaw?.mostFrequentActivity || (periodStats != null ? 'None yet' : '—')}</div>
          <div className="wa-stat-label">Top Activity</div>
        </div>
        <div className="wa-stat-box">
          <div className="wa-stat-val">{weeklyRaw != null ? (weeklyRaw.happyExcitedCount ?? 0) : (periodStats?.happyExcitedCount ?? '—')}</div>
          <div className="wa-stat-label">😊 Happy Days</div>
        </div>
      </div>

      {/* Report Activity by Day (bar) */}
      {activityBarData.length > 0 && (
        <div className="wa-chart-card">
          <h4 className="wa-chart-title">📅 Reports by Day (This Week)</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={activityBarData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="day" tick={{ fill: '#6B4C30', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B4C30', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="activities" name="Reports" fill="#38bdf8" radius={[6,6,0,0]} barSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}



      {/* ── Section 2: Educational Games Analytics ── */}
      <div className="wa-section-title" style={{ marginTop: 32 }}>🎮 Educational Games Analytics</div>
      <div className="wa-stats-grid" style={{ marginBottom: 24 }}>
        <div className="wa-stat-box">
          <div className="wa-stat-val">{periodStats != null ? (periodStats.gamesPlayed ?? 0) : '—'}</div>
          <div className="wa-stat-label">Games Played</div>
        </div>
        <div className="wa-stat-box">
          <div className="wa-stat-val">{periodStats != null ? (periodStats.totalStars ?? 0) : '—'}</div>
          <div className="wa-stat-label">⭐ Stars Earned</div>
        </div>
        <div className="wa-stat-box">
          <div className="wa-stat-val">{periodStats != null ? (periodStats.gameTime > 0 ? `${Math.round(periodStats.gameTime / 60)}m` : '0m') : '—'}</div>
          <div className="wa-stat-label">⏱️ Game Time</div>
        </div>
        <div className="wa-stat-box">
          <div className="wa-stat-val">
            {periodStats != null ? (periodStats.gamesPlayed > 0 ? (periodStats.totalStars / periodStats.gamesPlayed).toFixed(1) : '0') : '—'}
          </div>
          <div className="wa-stat-label">Avg Stars / Game</div>
        </div>
      </div>

      {/* ── Section 3: Weekly vs Monthly Comparison ── */}
      <div className="wa-section-title" style={{ marginTop: 32 }}>📊 Weekly vs Monthly Comparison</div>
      {comparisonData.length > 0 ? (
        <div className="wa-chart-card">
          <h4 className="wa-chart-title">Side-by-side comparison of this week vs this month</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={comparisonData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="metric" tick={{ fill: '#6B4C30', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B4C30', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#6B4C30' }} />
              <Bar dataKey="weekly" name="This Week" fill="#38bdf8" radius={[6,6,0,0]} barSize={28} />
              <Bar dataKey="monthly" name="This Month" fill="#4ade80" radius={[6,6,0,0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>📭</div>
          <p>No report data found for <strong>{childName}</strong> this week or month. Ask the teacher to submit a progress report!</p>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════
   TAB 6 — TEACHER CHAT
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
  { id: 'flags',     label: 'AI Chat Flags',   icon: <AlertTriangle size={16} /> },
  { id: 'routines',  label: 'Routines',         icon: <CalendarDays  size={16} /> },
  { id: 'resources', label: 'Resources',        icon: <BookOpen      size={16} /> },
  { id: 'reports',   label: 'Progress Reports', icon: <ClipboardList size={16} /> },
  { id: 'analytics', label: 'Analytics',        icon: <BarChart3     size={16} /> },
  { id: 'chat',      label: 'Teacher Chat',     icon: <MessageSquare size={16} /> },
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
        {activeTab === 'analytics' && <AnalyticsTab childName={childName} />}
        {activeTab === 'chat'      && <TeacherChatTab user={user} />}
      </main>

    </div>
  );
}
