import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, X, Plus, Pencil, Trash2, Download, GripVertical } from "lucide-react";
import "./RoutineDashboard.css";

/* ═══════════════════════════════════════════════════════
   API HELPER
   Set REACT_APP_API_URL in your .env — defaults to localhost
═══════════════════════════════════════════════════════ */
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('brightsteps_token');
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
    ...opts,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

/* ═══════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════ */
const CHILD_NAME = "John";

const BADGES = [
  { id: "first", emoji: "🌟", label: "First Star", threshold: 1 },
  { id: "five", emoji: "⭐", label: "5 Stars", threshold: 5 },
  { id: "ten", emoji: "🔥", label: "10 Stars", threshold: 10 },
  { id: "twenty", emoji: "💪", label: "20 Stars", threshold: 20 },
  { id: "superstar", emoji: "👑", label: "Superstar", threshold: 50 },
];

/* Card accent colours */
const CLS_META = {
  morning: { border: "#ffe0cd", accent: "#f4956a", accentDark: "#d97846", accentBg: "#fff0e8", iconBg: "#fff0e8" },
  school: { border: "#c8ecff", accent: "#38bdf8", accentDark: "#0ea5e9", accentBg: "#e0f5ff", iconBg: "#e0f5ff" },
  bedtime: { border: "#c0f7d4", accent: "#4ade80", accentDark: "#16a34a", accentBg: "#eafff1", iconBg: "#eafff1" },
  custom: { border: "#e9d5ff", accent: "#c084fc", accentDark: "#9333ea", accentBg: "#f3e8ff", iconBg: "#f3e8ff" },
};
const CLS_META_AUTISM = {
  morning: { border: "#e9d5ff", accent: "#c084fc", accentDark: "#9333ea", accentBg: "#f3e8ff", iconBg: "#f3e8ff" },
  school: { border: "#fef08a", accent: "#fde047", accentDark: "#92400e", accentBg: "#fefce8", iconBg: "#fefce8" },
  bedtime: { border: "#bae6fd", accent: "#38bdf8", accentDark: "#0ea5e9", accentBg: "#e0f5ff", iconBg: "#e0f5ff" },
  custom: { border: "#e9d5ff", accent: "#c084fc", accentDark: "#9333ea", accentBg: "#f3e8ff", iconBg: "#f3e8ff" },
};

function getMeta(type, cls) {
  return type === "autism"
    ? (CLS_META_AUTISM[cls] || CLS_META_AUTISM.custom)
    : (CLS_META[cls] || CLS_META.custom);
}

const ICON_OPTIONS = ["☀️", "🌙", "🎒", "📚", "🌸", "🧩", "💙", "🏃", "🎨", "🍎", "🚿", "🎵", "💤", "🌿", "📖"];
const TYPE_OPTIONS = [{ value: "adhd", label: "⚡ ADHD" }, { value: "autism", label: "🧩 Autism" }];
const CLS_OPTIONS = [
  { value: "morning", label: "🌅 Morning" },
  { value: "school", label: "🎒 After School" },
  { value: "bedtime", label: "🌙 Bedtime" },
  { value: "custom", label: "✨ Custom" },
];

/* ── DEFAULT routines ── */
const DEFAULT_ADHD_ROUTINES = [
  {
    _id: "adhd-1", cls: "morning", type: "adhd", isDefault: true, emoji: "🌅", iconEmoji: "☀️",
    title: "ADHD Morning Routine", goal: "Develop independent morning skills",
    skillFocus: "Self-care, Task initiation, Focus building",
    tags: ["Self-Care", "Focus", "Morning"], badge: "Daily Must!",
    defaultTasks: [{ label: "Wake Up with Alarm", mins: 2 }, { label: "Brush Teeth", mins: 3 }, { label: "Wash Face", mins: 2 }, { label: "Get Dressed", mins: 5 }, { label: "Eat Breakfast", mins: 10 }]
  },
  {
    _id: "adhd-2", cls: "school", type: "adhd", isDefault: true, emoji: "🎒", iconEmoji: "📚",
    title: "ADHD After School Routine", goal: "Transition smoothly from school to home",
    skillFocus: "Focus building, Task sequencing, Relaxation",
    tags: ["Homework", "Snack", "Focus"], badge: null,
    defaultTasks: [{ label: "Put away school bag", mins: 2 }, { label: "Have a healthy snack", mins: 10 }, { label: "Complete homework", mins: 30 }, { label: "Free play time", mins: 20 }]
  },
  {
    _id: "adhd-3", cls: "bedtime", type: "adhd", isDefault: true, emoji: "🌙", iconEmoji: "🌙",
    title: "ADHD Bedtime Routine", goal: "Wind down and prepare for restful sleep",
    skillFocus: "Self-regulation, Routine adherence, Relaxation",
    tags: ["Sleep", "Calm", "Self-Care"], badge: "Sweet Dreams!",
    defaultTasks: [{ label: "Take a shower", mins: 10 }, { label: "Put on pyjamas", mins: 3 }, { label: "Read a book", mins: 15 }, { label: "Lights off & sleep", mins: 0 }]
  },
];
const DEFAULT_AUTISM_ROUTINES = [
  {
    _id: "aut-1", cls: "morning", type: "autism", isDefault: true, emoji: "🌅", iconEmoji: "🌸",
    title: "Autism Morning Routine", goal: "Structured morning independence",
    skillFocus: "Self-care, Routine adherence, Task sequencing",
    tags: ["Structure", "Self-Care", "Morning"], badge: "Daily Must!",
    defaultTasks: [{ label: "Wake Up with Alarm", mins: 2 }, { label: "Brush Teeth", mins: 3 }, { label: "Wash Face", mins: 2 }, { label: "Get Dressed", mins: 5 }, { label: "Eat Breakfast", mins: 10 }]
  },
  {
    _id: "aut-2", cls: "school", type: "autism", isDefault: true, emoji: "🎒", iconEmoji: "🧩",
    title: "Autism After School Routine", goal: "Predictable transition from school to home",
    skillFocus: "Task sequencing, Sensory regulation, Social skills",
    tags: ["Structure", "Sensory", "Calm"], badge: null,
    defaultTasks: [{ label: "Put away school bag", mins: 2 }, { label: "Sensory break / quiet", mins: 15 }, { label: "Have a healthy snack", mins: 10 }, { label: "Complete homework", mins: 30 }]
  },
  {
    _id: "aut-3", cls: "bedtime", type: "autism", isDefault: true, emoji: "🌙", iconEmoji: "💙",
    title: "Autism Bedtime Routine", goal: "Calm, predictable end to the day",
    skillFocus: "Self-regulation, Routine adherence, Sensory wind-down",
    tags: ["Structure", "Calm", "Sleep"], badge: "Sweet Dreams!",
    defaultTasks: [{ label: "Take a warm shower", mins: 10 }, { label: "Put on pyjamas", mins: 3 }, { label: "Quiet activity / book", mins: 15 }, { label: "Lights off & sleep", mins: 0 }]
  },
];

/* ═══════════════════════════════════════════════════════
   PDF GENERATOR  (pure browser — opens print dialog)
═══════════════════════════════════════════════════════ */
function generateReportPDF({ totalStars, completedRoutines, earnedBadges }) {
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const nextBadge = BADGES.find((b) => totalStars < b.threshold);
  const nextTxt = nextBadge
    ? `Earn <strong>${nextBadge.threshold - totalStars} more ⭐</strong> to unlock ${nextBadge.emoji} <strong>${nextBadge.label}</strong>`
    : "🏆 All badges earned! You're a true superstar!";

  const badgeRows = BADGES.map((b) => {
    const earned = totalStars >= b.threshold;
    return `
      <tr class="${earned ? "earned-row" : "locked-row"}">
        <td>${earned ? b.emoji : "🔒"}&nbsp; ${b.label}</td>
        <td class="center">${b.threshold}★</td>
        <td class="center ${earned ? "status-earned" : "status-locked"}">${earned ? "✅ Earned" : "Locked"}</td>
      </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>BrightSteps Progress Report — ${CHILD_NAME}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap');
    @page { margin: 20mm 18mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family:'Nunito',sans-serif; background:#f8fdfc; color:#1e293b; font-size:14px; }

    .page        { max-width:680px; margin:0 auto; padding:32px; }

    /* Header */
    .report-header {
      background: linear-gradient(135deg, #fff0e8 0%, #e8faf7 50%, #e0f5ff 100%);
      border-radius:20px; padding:28px 32px; margin-bottom:28px;
      display:flex; align-items:center; gap:18px;
      border: 2px solid rgba(94,207,186,0.3);
    }
    .report-header .icon   { font-size:3.2rem; line-height:1; }
    .report-header h1      { font-size:1.55rem; font-weight:900; color:#1e293b; margin-bottom:4px; }
    .report-header .for-txt{ font-size:0.88rem; font-weight:700; color:#4a6074; }
    .report-header .date   { font-size:0.78rem; font-weight:700; color:#94a3b8; margin-top:3px; }

    /* Stats pills */
    .pills { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:28px; }
    .pill  { border-radius:14px; padding:18px 12px; text-align:center; border:2px solid; }
    .pill strong { display:block; font-size:2.2rem; font-weight:900; line-height:1.1; }
    .pill small  { font-size:0.72rem; font-weight:800; color:#4a6074; display:block; margin-top:4px; }
    .pill.p-green { background:#eafff1; border-color:#4ade80; }
    .pill.p-sky   { background:#e0f5ff; border-color:#38bdf8; }
    .pill.p-peach { background:#fff0e8; border-color:#f4956a; }

    /* Section heading */
    .section-heading {
      font-size:1rem; font-weight:900; color:#1e293b;
      margin:24px 0 12px; display:flex; align-items:center; gap:8px;
    }
    .section-heading::after {
      content:''; flex:1; height:2px; background:rgba(94,207,186,0.25); border-radius:2px;
    }

    /* Badge table */
    table   { width:100%; border-collapse:collapse; border-radius:14px; overflow:hidden; }
    thead tr{ background:#e8faf7; }
    th      { padding:10px 14px; text-align:left; font-size:0.78rem; font-weight:900; color:#0d9488; }
    td      { padding:9px 14px; font-size:0.85rem; font-weight:700; border-bottom:1px solid #f0f9f6; }
    .center { text-align:center; }
    .earned-row td    { background:#fafffe; }
    .locked-row td    { background:#fafafa; color:#94a3b8; }
    .status-earned    { color:#16a34a; font-weight:900; }
    .status-locked    { color:#94a3b8; }

    /* Next goal */
    .next-goal {
      background:#e0f5ff; border:2px solid #38bdf8; border-radius:14px;
      padding:14px 18px; font-size:0.9rem; font-weight:700; color:#0ea5e9;
      margin-top:20px; line-height:1.6;
    }

    /* Footer */
    .report-footer {
      text-align:center; margin-top:36px; padding-top:20px;
      border-top:2px dashed rgba(94,207,186,0.3);
      font-size:0.78rem; font-weight:700; color:#94a3b8;
    }
  </style>
</head>
<body>
<div class="page">

  <div class="report-header">
    <div class="icon">📊</div>
    <div>
      <h1>BrightSteps Progress Report</h1>
      <p class="for-txt">for <strong>${CHILD_NAME}</strong></p>
      <p class="date">Generated on ${date}</p>
    </div>
  </div>

  <div class="pills">
    <div class="pill p-green"><strong>${totalStars}</strong><small>⭐ Stars Earned</small></div>
    <div class="pill p-sky"  ><strong>${completedRoutines}</strong><small>✅ Routines Completed</small></div>
    <div class="pill p-peach"><strong>${earnedBadges.length} / ${BADGES.length}</strong><small>🏅 Badges Earned</small></div>
  </div>

  <div class="section-heading">🏅 Badge Progress</div>
  <table>
    <thead>
      <tr><th>Badge</th><th class="center">Stars Required</th><th class="center">Status</th></tr>
    </thead>
    <tbody>${badgeRows}</tbody>
  </table>

  <div class="next-goal">🎯 Next Goal: ${nextTxt}</div>

  <div class="report-footer">
    BrightSteps Routine Management &nbsp;·&nbsp; Keep going, ${CHILD_NAME}! 🌟
  </div>

</div>
<script>window.onload = () => { setTimeout(() => window.print(), 400); }</script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) win.onafterprint = () => URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════════════════════
   CONFIRM DELETE MODAL
═══════════════════════════════════════════════════════ */
function ConfirmDeleteModal({ routine, onConfirm, onCancel }) {
  return (
    <div className="rd-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="rd-modal rd-confirm-modal">
        <div className="rd-confirm-icon">🗑️</div>
        <h2 className="rd-confirm-title">Delete Routine?</h2>
        <p className="rd-confirm-sub">
          Are you sure you want to delete <strong>"{routine.title}"</strong>? This cannot be undone.
        </p>
        <div className="rd-confirm-actions">
          <button className="rd-ghost-btn" onClick={onCancel}>Cancel</button>
          <button className="rd-danger-btn" onClick={onConfirm}>Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CRUD FORM MODAL
═══════════════════════════════════════════════════════ */
function RoutineFormModal({ initial, onSave, onClose }) {
  const isEdit = !!initial;
  const blankTasks = [{ id: 1, label: "", mins: "" }];

  const [form, setForm] = useState(() => {
    if (!initial) return { title: "", goal: "", skillFocus: "", desc: "", type: "adhd", cls: "morning", iconEmoji: "☀️", badge: "", tagsStr: "", tasks: blankTasks };
    return {
      title: initial.title || "",
      goal: initial.goal || "",
      skillFocus: initial.skillFocus || "",
      desc: initial.desc || "",
      type: initial.type || "adhd",
      cls: initial.cls || "morning",
      iconEmoji: initial.iconEmoji || "☀️",
      badge: initial.badge || "",
      tagsStr: (initial.tags || []).join(", "),
      tasks: (initial.defaultTasks || blankTasks).map((t, i) => ({
        id: i + 1,
        label: typeof t === "string" ? t : t.label,
        mins: typeof t === "object" && t.mins ? String(t.mins) : "",
      })),
    };
  });
  const [errors, setErrors] = useState({});
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverTask, setDragOverTask] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setTask = (id, k, v) => setForm((f) => ({ ...f, tasks: f.tasks.map((t) => t.id === id ? { ...t, [k]: v } : t) }));
  const addRow = () => setForm((f) => ({ ...f, tasks: [...f.tasks, { id: Date.now(), label: "", mins: "" }] }));
  const removeRow = (id) => setForm((f) => ({ ...f, tasks: f.tasks.filter((t) => t.id !== id) }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required.";
    if (!form.goal.trim()) e.goal = "Goal is required.";
    if (!form.tasks.some((t) => t.label.trim())) e.tasks = "Add at least one task.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index);
    setDraggedTask(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverTask !== index) {
      setDragOverTask(index);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = draggedTask;
    if (sourceIndex === null || sourceIndex === targetIndex) return;

    setForm((f) => {
      const newTasks = Array.from(f.tasks);
      const [moved] = newTasks.splice(sourceIndex, 1);
      newTasks.splice(targetIndex, 0, moved);
      return { ...f, tasks: newTasks };
    });
    setDraggedTask(null);
    setDragOverTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverTask(null);
  };

  const handleSave = () => {
    if (!validate()) return;
    const meta = getMeta(form.type, form.cls);
    const tags = form.tagsStr.split(",").map((s) => s.trim()).filter(Boolean);
    const defaultTasks = form.tasks.filter((t) => t.label.trim()).map((t) => ({ label: t.label.trim(), mins: parseInt(t.mins) || 0 }));
    onSave({
      _id: initial?._id || undefined, title: form.title.trim(), goal: form.goal.trim(),
      skillFocus: form.skillFocus.trim(), desc: form.desc.trim(), type: form.type, cls: form.cls,
      iconEmoji: form.iconEmoji, emoji: form.iconEmoji, badge: form.badge.trim() || null,
      tags, defaultTasks, isDefault: false, iconBg: meta.iconBg
    });
  };

  const meta = getMeta(form.type, form.cls);

  return (
    <div className="rd-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rd-modal rd-form-modal">
        <button className="rd-modal-close" onClick={onClose}><X size={16} /></button>

        <div className="rd-form-header">
          <div className="rd-form-icon-preview" style={{ background: meta.iconBg }}>{form.iconEmoji}</div>
          <div>
            <h2 className="rd-form-title">{isEdit ? "✏️ Edit Routine" : "✨ Create New Routine"}</h2>
            <p className="rd-form-sub">Fill in the details below</p>
          </div>
        </div>

        <div className="rd-form-body">
          {/* Type + Category */}
          <div className="rd-form-row-2">
            <div className="rd-field">
              <label className="rd-label">Type</label>
              <div className="rd-radio-group">
                {TYPE_OPTIONS.map((o) => (
                  <button key={o.value} type="button"
                    className={`rd-radio-btn ${form.type === o.value ? "active" : ""}`}
                    onClick={() => set("type", o.value)}>{o.label}</button>
                ))}
              </div>
            </div>
            <div className="rd-field">
              <label className="rd-label">Category</label>
              <div className="rd-radio-group">
                {CLS_OPTIONS.map((o) => (
                  <button key={o.value} type="button"
                    className={`rd-radio-btn ${form.cls === o.value ? "active" : ""}`}
                    onClick={() => set("cls", o.value)}>{o.label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Icon */}
          <div className="rd-field">
            <label className="rd-label">Icon</label>
            <div className="rd-icon-picker">
              {ICON_OPTIONS.map((ic) => (
                <button key={ic} type="button"
                  className={`rd-icon-opt ${form.iconEmoji === ic ? "active" : ""}`}
                  onClick={() => set("iconEmoji", ic)}>{ic}</button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="rd-field">
            <label className="rd-label">Title <span className="rd-required">*</span></label>
            <input className={`rd-input ${errors.title ? "error" : ""}`}
              placeholder="e.g. Morning Hygiene Routine"
              value={form.title} onChange={(e) => set("title", e.target.value)} />
            {errors.title && <span className="rd-error-msg">{errors.title}</span>}
          </div>

          {/* Goal */}
          <div className="rd-field">
            <label className="rd-label">Goal <span className="rd-required">*</span></label>
            <input className={`rd-input ${errors.goal ? "error" : ""}`}
              placeholder="e.g. Build independent morning skills"
              value={form.goal} onChange={(e) => set("goal", e.target.value)} />
            {errors.goal && <span className="rd-error-msg">{errors.goal}</span>}
          </div>

          {/* Skill Focus */}
          <div className="rd-field">
            <label className="rd-label">Skill Focus</label>
            <input className="rd-input" placeholder="e.g. Self-care, Focus building"
              value={form.skillFocus} onChange={(e) => set("skillFocus", e.target.value)} />
          </div>

          {/* Description */}
          <div className="rd-field">
            <label className="rd-label">Description</label>
            <textarea className="rd-input rd-textarea" rows={2}
              placeholder="Short description of this routine…"
              value={form.desc} onChange={(e) => set("desc", e.target.value)} />
          </div>

          {/* Tags */}
          <div className="rd-field">
            <label className="rd-label">Tags <span className="rd-hint">(comma separated)</span></label>
            <input className="rd-input" placeholder="e.g. Morning, Self-Care, Focus"
              value={form.tagsStr} onChange={(e) => set("tagsStr", e.target.value)} />
          </div>

          {/* Badge */}
          <div className="rd-field">
            <label className="rd-label">Badge Label <span className="rd-hint">(optional)</span></label>
            <input className="rd-input" placeholder="e.g. Daily Must!"
              value={form.badge} onChange={(e) => set("badge", e.target.value)} />
          </div>

          {/* Tasks */}
          <div className="rd-field">
            <label className="rd-label">Tasks <span className="rd-required">*</span><span className="rd-hint"> — drag to reorder</span></label>
            {errors.tasks && <span className="rd-error-msg">{errors.tasks}</span>}
            <div className="rd-task-builder">
              {form.tasks.map((task, idx) => (
                <div
                  key={task.id}
                  className={`rd-task-build-row ${draggedTask === idx ? 'dragging' : ''} ${dragOverTask === idx ? 'drag-over' : ''}`}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="rd-task-drag-handle">
                    <GripVertical size={16} />
                  </div>
                  <span className="rd-task-num">{idx + 1}</span>
                  <input className="rd-input rd-task-label-input" placeholder="Task name"
                    value={task.label} onChange={(e) => setTask(task.id, "label", e.target.value)} />
                  <input className="rd-input rd-task-mins-input" type="number" min="0" placeholder="min"
                    value={task.mins} onChange={(e) => setTask(task.id, "mins", e.target.value)} />
                  <button type="button" className="rd-task-remove-btn"
                    onClick={() => removeRow(task.id)} disabled={form.tasks.length === 1}><X size={13} /></button>
                </div>
              ))}
              <button type="button" className="rd-add-task-row-btn" onClick={addRow}>
                <Plus size={14} /> Add Task
              </button>
            </div>
          </div>
        </div>

        <div className="rd-form-actions">
          <button className="rd-ghost-btn" onClick={onClose}>Cancel</button>
          <button className="rd-primary-btn rd-save-routine-btn" onClick={handleSave}>
            {isEdit ? "💾 Save Changes" : "✨ Create Routine"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   REPORT MODAL  — with Download PDF button
═══════════════════════════════════════════════════════ */
function ReportModal({ onClose, totalStars, completedRoutines, earnedBadges }) {
  return (
    <div className="rd-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rd-modal rd-report">
        <button className="rd-modal-close" onClick={onClose}><X size={16} /></button>

        <div className="rd-report-top">
          <span className="rd-report-icon">📊</span>
          <div>
            <h2>Progress Report</h2>
            <p>for <strong>{CHILD_NAME}</strong></p>
          </div>
        </div>

        <div className="rd-report-pills">
          <div className="rd-rpill rp-green"><strong>{totalStars}</strong><small>⭐ Stars Earned</small></div>
          <div className="rd-rpill rp-sky"  ><strong>{completedRoutines}</strong><small>✅ Routines Done</small></div>
          <div className="rd-rpill rp-peach"><strong>{earnedBadges.length}</strong><small>🏅 Badges Earned</small></div>
        </div>

        <p className="rd-section-label">🏅 Badges Earned</p>
        <div className="rd-badges-grid">
          {BADGES.map((b) => {
            const earned = totalStars >= b.threshold;
            return (
              <div key={b.id} className={`rd-badge-chip ${earned ? "earned" : "locked"}`}>
                <span>{earned ? b.emoji : "🔒"}</span>
                <small>{b.label}</small>
                <small className="rd-badge-req">{b.threshold}★</small>
              </div>
            );
          })}
        </div>

        <p className="rd-section-label">🎯 Next Goal</p>
        <div className="rd-next-goal">
          {(() => {
            const next = BADGES.find((b) => totalStars < b.threshold);
            if (!next) return <p>🏆 All badges earned! You are a true superstar!</p>;
            return <p>Earn <strong>{next.threshold - totalStars} more ⭐</strong> to unlock <strong>{next.emoji} {next.label}</strong></p>;
          })()}
        </div>

        {totalStars === 0 && (
          <div className="rd-empty-note">📝 Complete tasks to earn stars and see your progress here!</div>
        )}

        {/* ── Download PDF ── */}
        <button
          className="rd-download-btn"
          onClick={() => generateReportPDF({ totalStars, completedRoutines, earnedBadges })}
        >
          <Download size={16} /> Download Report as PDF
        </button>

        <button className="rd-ghost-btn rd-close-report-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   REWARD MODAL
═══════════════════════════════════════════════════════ */
function RewardModal({ taskLabel, totalStars, onClose }) {
  const latestBadge = [...BADGES].reverse().find((b) => totalStars >= b.threshold);
  return (
    <div className="rd-overlay">
      <div className="rd-modal rd-reward">
        <div className="rd-reward-emoji">{latestBadge ? latestBadge.emoji : "⭐"}</div>
        <h2>Great job, {CHILD_NAME}!</h2>
        <p className="rd-reward-task">You completed:<br /><strong>"{taskLabel}"</strong></p>
        <div className="rd-reward-stars">
          <span className="rd-star-count">⭐ {totalStars} stars total</span>
        </div>
        {latestBadge && totalStars === latestBadge.threshold && (
          <div className="rd-badge-unlocked">🎉 Badge unlocked: <strong>{latestBadge.emoji} {latestBadge.label}</strong></div>
        )}
        <button className="rd-primary-btn" onClick={onClose} style={{ marginTop: 20 }}>Keep Going!</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CHECKLIST MODAL
   — receives the routine with MERGED tasks (default + saved extras)
   — when a new task is added, calls onTaskAdded() to persist it
═══════════════════════════════════════════════════════ */
function ChecklistModal({ routine, onClose, totalStars, onStarEarned, onRoutineComplete, onTaskAdded }) {
  // Initialise from the already-merged routine.defaultTasks
  const [tasks, setTasks] = useState(
    routine.defaultTasks.map((t, i) => ({
      id: i,
      label: typeof t === "string" ? t : t.label,
      mins: typeof t === "object" ? t.mins : 0,
      done: false,
    }))
  );
  const [newTask, setNewTask] = useState("");
  const [reward, setReward] = useState(null);
  const [localStars, setLocalStars] = useState(totalStars);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverTask, setDragOverTask] = useState(null);

  const toggleTask = (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task || task.done) return;
    const updated = tasks.map((t) => t.id === id ? { ...t, done: true } : t);
    setTasks(updated);
    const newTotal = localStars + 1;
    setLocalStars(newTotal);
    onStarEarned(1);
    setReward({ label: task.label, stars: newTotal });
    if (updated.every((t) => t.done)) onRoutineComplete();
  };

  const handleDragStart = (e, index) => {
    const task = tasks[index];
    if (task.done) {
      e.preventDefault();
      return false;
    }
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index);
    setDraggedTask(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverTask !== index) {
      setDragOverTask(index);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = draggedTask;
    if (sourceIndex === null || sourceIndex === targetIndex) return;

    const sourceTask = tasks[sourceIndex];
    const targetTask = tasks[targetIndex];
    
    // Don't allow dropping if either task is done
    if (sourceTask.done || targetTask.done) return;

    setTasks((prev) => {
      const newTasks = Array.from(prev);
      const [moved] = newTasks.splice(sourceIndex, 1);
      newTasks.splice(targetIndex, 0, moved);
      return newTasks;
    });
    setDraggedTask(null);
    setDragOverTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverTask(null);
  };

  const addTask = () => {
    const label = newTask.trim();
    if (!label) return;
    const task = { id: Date.now(), label, mins: 0, done: false };
    setTasks((prev) => [...prev, task]);
    // Persist the new task so it shows next time this routine is opened
    onTaskAdded(routine._id, { label, mins: 0 });
    setNewTask("");
  };

  const removeTask = (id) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const doneCount = tasks.filter((t) => t.done).length;
  const progress = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  if (reward) return (
    <RewardModal taskLabel={reward.label} totalStars={reward.stars} onClose={() => setReward(null)} />
  );

  return (
    <div className="rd-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`rd-modal rd-checklist-modal ${routine.type}`}>
        <button className="rd-modal-close" onClick={onClose}><X size={16} /></button>

        <div className="rd-cl-header">
          <div className="rd-cl-icon" style={{ background: routine.iconBg || getMeta(routine.type, routine.cls).iconBg }}>
            <span>{routine.iconEmoji}</span>
          </div>
          <div className="rd-cl-title-block">
            <h2>{routine.title}</h2>
            {routine.goal && <p><strong>Goal:</strong> {routine.goal}</p>}
            {routine.skillFocus && <p><strong>Skills:</strong> {routine.skillFocus}</p>}
          </div>
        </div>

        <div className="rd-progress-row">
          <div className="rd-progress-bar">
            <div className="rd-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="rd-progress-label">{doneCount}/{tasks.length} · ⭐ {localStars}</span>
        </div>

        <div className="rd-task-list">
          {tasks.map((task, idx) => (
            <div
              key={task.id}
              className={`rd-task-row ${task.done ? "done" : ""} ${draggedTask === idx ? 'dragging' : ''} ${dragOverTask === idx ? 'drag-over' : ''}`}
              draggable={!task.done}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
            >
              {!task.done && (
                <div className="rd-task-drag-handle">
                  <GripVertical size={16} />
                </div>
              )}
              <div className={`rd-tick ${task.done ? "checked" : ""}`} onClick={() => !task.done && toggleTask(task.id)}>
                {task.done && "✓"}
              </div>
              <span className="rd-task-label" onClick={() => !task.done && toggleTask(task.id)}>{task.label}</span>
              {task.done && <span className="rd-task-star">⭐</span>}
              {task.mins > 0 && !task.done && <span className="rd-task-mins">{task.mins}m</span>}
              {!task.done && (
                <button className="rd-remove" onClick={(e) => { e.stopPropagation(); removeTask(task.id); }}>
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="rd-add-row">
          <input className="rd-add-input" placeholder="Add a task — it'll be saved to this routine…"
            value={newTask} onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()} />
          <button className="rd-add-task-btn" onClick={addTask}>+</button>
        </div>

        <button className="rd-primary-btn" onClick={onClose} style={{ marginTop: 20 }}>
          {doneCount === tasks.length && tasks.length > 0 ? "All done! 🎉" : "Save & Close"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ROUTINE CARD
═══════════════════════════════════════════════════════ */
function RoutineCard({ routine, onOpen, onEdit, onDelete }) {
  const meta = getMeta(routine.type, routine.cls);
  return (
    <div
      className={`rd-card type-${routine.type} cls-${routine.cls}`}
      style={{
        "--card-border": meta.border,
        "--card-accent": meta.accent,
        "--card-accent-dark": meta.accentDark,
        "--card-accent-bg": meta.accentBg,
      }}
      data-emoji={routine.iconEmoji}
    >
      <div className="rd-card-stripe" />

      <div className="rd-card-icon-wrap" style={{ background: routine.iconBg || meta.iconBg }}>
        <span className="rd-card-icon">{routine.iconEmoji}</span>
      </div>

      <div className="rd-card-body">
        <div className="rd-card-title-row">
          <h3>{routine.title}</h3>
          <div className="rd-card-title-right">
            {routine.badge && <span className="rd-card-badge">{routine.badge}</span>}
            {!routine.isDefault && <span className="rd-custom-chip">Custom</span>}
          </div>
        </div>
        {routine.goal && <p className="rd-card-goal"><strong>Goal:</strong> {routine.goal}</p>}
        {routine.skillFocus && <p className="rd-card-skill"><strong>Skills:</strong> {routine.skillFocus}</p>}
        <div className="rd-card-tags">
          {(routine.tags || []).map((t) => <span key={t} className="rd-tag">{t}</span>)}
        </div>
        <p className="rd-task-count">📋 {(routine.defaultTasks || []).length} tasks</p>
      </div>

      <div className="rd-card-actions">
        {/* Edit / Delete only for custom routines */}
        {!routine.isDefault && (
          <div className="rd-crud-btns">
            <button className="rd-crud-btn rd-edit-btn" title="Edit routine" onClick={() => onEdit(routine)}><Pencil size={14} /></button>
            <button className="rd-crud-btn rd-delete-btn" title="Delete routine" onClick={() => onDelete(routine)}><Trash2 size={14} /></button>
          </div>
        )}
        <button className="rd-open-btn" onClick={() => onOpen(routine)}>
          <span className="rd-open-btn-arrow">▶</span>
          <span className="rd-open-btn-label">Start</span>
        </button>
        <span className="rd-solo-label">👤 Solo</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
export default function RoutineDashboard() {

  /* ── Tab / search ── */
  const [activeTab, setActiveTab] = useState("adhd");
  const [searchQuery, setSearchQuery] = useState("");

  /* ── Progress ── */
  const [totalStars, setTotalStars] = useState(0);
  const [completedRoutines, setCompletedRoutines] = useState(0);

  /* ── Modal visibility ── */
  const [activeRoutine, setActiveRoutine] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ── Data ── */
  const [customRoutines, setCustomRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  /* ── Extra tasks added by the user to DEFAULT routines
        Shape: { [routineId]: [{ label, mins }] }
        Loaded from backend, saved back on every new task  ── */
  const [extraTasksMap, setExtraTasksMap] = useState({});

  /* ══ Load everything on mount ══ */
  useEffect(() => {
    async function boot() {
      setLoading(true);
      setApiError("");
      try {
        const [routinesData, extraData] = await Promise.all([
          apiFetch("/routines"),
          apiFetch("/extra-tasks"),
        ]);
        setCustomRoutines(routinesData);
        // extraData is [{ routineId, tasks:[{label,mins}] }]
        const map = {};
        (extraData || []).forEach(({ routineId, tasks }) => { map[routineId] = tasks; });
        setExtraTasksMap(map);
      } catch (err) {
        console.error("Boot fetch failed:", err);
        setApiError("Backend unavailable — running offline. Changes won't be saved between sessions.");
      } finally {
        setLoading(false);
      }
    }
    boot();
  }, []);

  /* ══ HANDLERS ══ */
  const handleStarEarned = () => setTotalStars((s) => s + 1);
  const handleRoutineComplete = () => setCompletedRoutines((c) => c + 1);

  /* Called when user adds a task inside ChecklistModal */
  const handleTaskAdded = async (routineId, newTask) => {
    // Update local state immediately
    setExtraTasksMap((prev) => ({
      ...prev,
      [routineId]: [...(prev[routineId] || []), newTask],
    }));
    // Persist to backend
    try {
      await apiFetch(`/extra-tasks/${routineId}`, {
        method: "POST",
        body: JSON.stringify(newTask),
      });
    } catch { /* silent — already updated in local state */ }
  };

  /* CRUD */
  const handleCreate = async (data) => {
    try {
      const saved = await apiFetch("/routines", { method: "POST", body: JSON.stringify(data) });
      setCustomRoutines((p) => [...p, saved]);
    } catch {
      setCustomRoutines((p) => [...p, { ...data, _id: "local-" + Date.now() }]);
    }
    setShowForm(false);
  };

  const handleUpdate = async (data) => {
    try {
      const saved = await apiFetch(`/routines/${data._id}`, { method: "PUT", body: JSON.stringify(data) });
      setCustomRoutines((p) => p.map((r) => r._id === saved._id ? saved : r));
    } catch {
      setCustomRoutines((p) => p.map((r) => r._id === data._id ? data : r));
    }
    setEditTarget(null);
  };

  const handleDelete = async () => {
    try { await apiFetch(`/routines/${deleteTarget._id}`, { method: "DELETE" }); } catch { /* silent */ }
    setCustomRoutines((p) => p.filter((r) => r._id !== deleteTarget._id));
    setDeleteTarget(null);
  };

  /* ══ Merge extra tasks into a routine's defaultTasks before rendering ══ */
  function mergeExtras(routine) {
    const extras = extraTasksMap[routine._id];
    if (!extras || extras.length === 0) return routine;
    return { ...routine, defaultTasks: [...routine.defaultTasks, ...extras] };
  }

  /* ══ Build display list ══ */
  const defaultsForTab = activeTab === "adhd" ? DEFAULT_ADHD_ROUTINES : DEFAULT_AUTISM_ROUTINES;
  const customForTab = customRoutines.filter((r) => r.type === activeTab);
  const allForTab = [...defaultsForTab, ...customForTab].map(mergeExtras);

  /* ══ Filter by search ══ */
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return allForTab;
    const q = searchQuery.toLowerCase();
    return allForTab.filter((r) =>
      r.title.toLowerCase().includes(q) ||
      (r.goal || "").toLowerCase().includes(q) ||
      (r.skillFocus || "").toLowerCase().includes(q) ||
      (r.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }, [allForTab, searchQuery]);

  const earnedBadges = BADGES.filter((b) => totalStars >= b.threshold);
  const latestBadge = earnedBadges[earnedBadges.length - 1];

  /* ══════════════════════════ RENDER ══════════════════════════ */
  return (
    <div className="rd-page">

      {/* ── HERO ── */}
      <div className="rd-hero">
        <span className="rd-deco deco-star1" aria-hidden="true">⭐</span>
        <span className="rd-deco deco-star2" aria-hidden="true">✨</span>
        <span className="rd-deco deco-star3" aria-hidden="true">💫</span>
        <span className="rd-deco deco-cloud1" aria-hidden="true">☁️</span>
        <span className="rd-deco deco-cloud2" aria-hidden="true">🌤️</span>
        <span className="rd-deco deco-rocket" aria-hidden="true">🚀</span>
        <span className="rd-deco deco-rainbow" aria-hidden="true">🌈</span>
        <span className="rd-deco deco-balloon" aria-hidden="true">🎈</span>
        <span className="rd-deco deco-heart" aria-hidden="true">💛</span>
        <span className="rd-deco deco-music" aria-hidden="true">🎵</span>

        <div className="rd-hero-top">
          <Link to="/dashboard" className="rd-back-link">
            <ArrowLeft size={17} /> Back to Dashboard
          </Link>
          <div className="rd-hero-right">
            <div className="rd-stars-chip">
              <span>⭐</span>
              <span>{totalStars} stars</span>
              {latestBadge && <span className="rd-latest-badge-chip">{latestBadge.emoji}</span>}
            </div>
            {/* Report button — opens modal */}
            <button className="rd-report-link" onClick={() => setShowReport(true)}>📊 Report</button>
          </div>
        </div>

        <div className="rd-hero-title-block">
          <div className="rd-hero-emoji-row" aria-hidden="true">
            <span>🌅</span><span>🌟</span><span>📋</span><span>🌟</span><span>🌙</span>
          </div>
          <h1 className="rd-hub-title">
            <span className="rd-tw rd-tw-orange">Routine</span>
            <span className="rd-tw rd-tw-sky">Management</span>
          </h1>
          <p className="rd-hero-for">for <strong>{CHILD_NAME}</strong></p>
          <p className="rd-hub-subtitle">
            Build independence through consistent daily habits.<br />
            Every routine brings you one step closer to being a superstar! 🏆
          </p>
          <div className="rd-hero-stats">
            <span className="rd-stat-pill rd-sp-orange">📋 {allForTab.length} Routines</span>
            <span className="rd-stat-pill rd-sp-sky">🧠 Build Habits</span>
            <span className="rd-stat-pill rd-sp-green">🏅 Earn Stars</span>
          </div>
        </div>
      </div>

      {/* ── TAB BAR ── */}
      <div className="rd-tab-bar">
        <div className="rd-tab-bar-inner">
          <div className="rd-tabs">
            <button className={`rd-tab ${activeTab === "adhd" ? "active" : ""}`}
              onClick={() => { setActiveTab("adhd"); setSearchQuery(""); }}>⚡ ADHD Routines</button>
            <button className={`rd-tab ${activeTab === "autism" ? "active" : ""}`}
              onClick={() => { setActiveTab("autism"); setSearchQuery(""); }}>🧩 Autism Routines</button>
          </div>

          <div className="rd-search-wrap">
            <Search size={15} className="rd-search-icon" />
            <input className="rd-search" placeholder="Search routines…"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            {searchQuery && (
              <button className="rd-search-clear" onClick={() => setSearchQuery("")}><X size={13} /></button>
            )}
          </div>

          <button className="rd-create-btn" onClick={() => setShowForm(true)}>
            <Plus size={16} /> New Routine
          </button>
        </div>
        <p className="rd-tab-note">
          {activeTab === "adhd"
            ? "⚡ Short structured tasks to support focus and task initiation."
            : "🧩 Predictable steps to support sensory comfort and routine."}
        </p>
      </div>

      {/* ── CARDS ── */}
      <section className="rd-cards-section">
        {apiError && <div className="rd-api-notice">⚠️ {apiError}</div>}

        <div className="rd-cards-heading">
          <h2>
            {activeTab === "adhd" ? "⚡ ADHD" : "🧩 Autism"} Routines
            <span className="rd-count-chip">{filtered.length}</span>
          </h2>
          <p>All routines are calm, friendly, and go at your own pace.</p>
        </div>

        {loading ? (
          <div className="rd-loading"><div className="rd-spinner" /><p>Loading routines…</p></div>
        ) : filtered.length === 0 ? (
          <div className="rd-empty">
            <span>🔍</span>
            <p>No routines match "<strong>{searchQuery}</strong>"</p>
            <button className="rd-text-btn" onClick={() => setSearchQuery("")}>Clear search</button>
          </div>
        ) : (
          <div className="rd-game-cards-wrapper">
            {filtered.map((routine, i) => (
              <div key={routine._id} className="rd-card-anim" style={{ animationDelay: `${i * 0.08}s` }}>
                <RoutineCard
                  routine={routine}
                  onOpen={setActiveRoutine}
                  onEdit={setEditTarget}
                  onDelete={setDeleteTarget}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── FOOTER ── */}
      <div className="rd-footer-section">
        <div className="rd-encourage-row">
          <div className="rd-encourage-card">
            <span className="rd-ec-emoji">🏆</span>
            <div className="rd-ec-text">
              <h3>Every routine is a win!</h3>
              <p>There's no rush here. Take your time, build your habits, and celebrate every step.</p>
            </div>
          </div>
          <div className="rd-encourage-card">
            <span className="rd-ec-emoji">💛</span>
            <div className="rd-ec-text">
              <h3>You're doing amazing, {CHILD_NAME}!</h3>
              <p>These routines were made just for you. You are already a superstar just for trying!</p>
            </div>
          </div>
        </div>
      </div>


      {activeRoutine && (
        <ChecklistModal
          routine={activeRoutine}
          onClose={() => setActiveRoutine(null)}
          totalStars={totalStars}
          onStarEarned={handleStarEarned}
          onRoutineComplete={handleRoutineComplete}
          onTaskAdded={handleTaskAdded}
        />
      )}
      {showReport && (
        <ReportModal
          onClose={() => setShowReport(false)}
          totalStars={totalStars}
          completedRoutines={completedRoutines}
          earnedBadges={earnedBadges}
        />
      )}
      {showForm && (
        <RoutineFormModal onSave={handleCreate} onClose={() => setShowForm(false)} />
      )}
      {editTarget && (
        <RoutineFormModal initial={editTarget} onSave={handleUpdate} onClose={() => setEditTarget(null)} />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal
          routine={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}