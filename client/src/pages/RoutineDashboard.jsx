import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  ArrowLeft, Search, X, Plus, Pencil, Trash2, Download,
  Sparkles, ChevronDown, ChevronUp, CheckCircle2, Clock,
  LayoutGrid, List, Minimize2, Maximize2, Filter, Star,
  Trophy, Zap, Sun, Shield, RotateCcw, AlertCircle,
} from "lucide-react";

/* ─── MOCK DATA (remove when connecting real API) ─── */
const MOCK_ROUTINES = [
  { _id: "1", title: "Morning Kick-off", category: "morning", type: "adhd", iconEmoji: "🌅", progress: 75, tasks: [{ label: "Brush teeth", mins: 5 }, { label: "Eat breakfast", mins: 15 }, { label: "Pack bag", mins: 10 }], rewards: { starsEarned: 8, badgesEarned: ["🌟"] } },
  { _id: "2", title: "School Prep", category: "school", type: "autism", iconEmoji: "🎒", progress: 50, tasks: [{ label: "Review timetable", mins: 5 }, { label: "Homework check", mins: 20 }], rewards: { starsEarned: 4, badgesEarned: [] } },
  { _id: "3", title: "Bedtime Wind-down", category: "bedtime", type: "general", iconEmoji: "🌙", progress: 100, tasks: [{ label: "Bath", mins: 15 }, { label: "Read story", mins: 20 }, { label: "Lights off", mins: 0 }], rewards: { starsEarned: 15, badgesEarned: ["🔥"] } },
  { _id: "4", title: "Evening Study", category: "study", type: "adhd", iconEmoji: "📚", progress: 30, tasks: [{ label: "Math practice", mins: 25 }, { label: "Reading", mins: 20 }], rewards: { starsEarned: 2, badgesEarned: [] } },
];

const MOCK_TEMPLATES = [
  { _id: "t1", title: "ADHD Morning", category: "morning", disabilityType: "ADHD", estimatedTime: 45, tasks: [{ label: "Wake up" }, { label: "Brush teeth" }, { label: "Breakfast" }, { label: "Pack bag" }] },
  { _id: "t2", title: "Calm Bedtime", category: "bedtime", disabilityType: "Autism", estimatedTime: 40, tasks: [{ label: "Bath" }, { label: "Pyjamas" }, { label: "Story" }, { label: "Lights off" }] },
];

const MOCK_SUMMARY = { totalAssigned: 4, completedCount: 1, completionPercentage: 62, totalStars: 29 };

/* ─── CONSTANTS ─── */
const BADGES = [
  { id: "first", emoji: "🌟", label: "First Star", threshold: 1 },
  { id: "five", emoji: "⭐", label: "5 Stars", threshold: 5 },
  { id: "ten", emoji: "🔥", label: "10 Stars", threshold: 10 },
  { id: "twenty", emoji: "💪", label: "20 Stars", threshold: 20 },
  { id: "superstar", emoji: "👑", label: "Superstar", threshold: 50 },
];

const CATEGORY_META = {
  morning: { color: "var(--peach-deep,#f28b60)", bg: "var(--peach,#fde8d8)", label: "Morning" },
  school: { color: "var(--sky-deep,#4ab3e8)", bg: "var(--sky,#cce8ff)", label: "School" },
  bedtime: { color: "#b48be0", bg: "var(--lavender,#e8e0ff)", label: "Bedtime" },
  study: { color: "var(--mint-deep,#3dbf9a)", bg: "var(--mint,#d4f5ec)", label: "Study" },
  evening: { color: "var(--yellow-deep,#e6b800)", bg: "#fff7cc", label: "Evening" },
  custom: { color: "var(--text-mid,#6b7c75)", bg: "var(--bg,#eaf9f5)", label: "Custom" },
};

const TYPE_META = {
  adhd: { label: "ADHD", color: "var(--sky-deep,#4ab3e8)" },
  autism: { label: "Autism", color: "#b48be0" },
  general: { label: "General", color: "var(--mint-deep,#3dbf9a)" },
};

/* ─── PROGRESS RING ─── */
function ProgressRing({ pct, size = 48, stroke = 5, color = "var(--mint-deep,#3dbf9a)" }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--mint,#d4f5ec)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s cubic-bezier(0.34,1.56,0.64,1)" }} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        style={{
          transform: "rotate(90deg)", transformOrigin: `${size / 2}px ${size / 2}px`,
          fill: "var(--text-dark,#2d3a35)", fontFamily: "'Fredoka One',cursive", fontSize: size * 0.26
        }}>
        {pct}%
      </text>
    </svg>
  );
}

/* ─── CONFIRM DELETE MODAL ─── */
function ConfirmDeleteModal({ routine, onConfirm, onCancel }) {
  return (
    <div className="rd-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="rd-modal rd-confirm-modal">
        <div className="rd-confirm-icon">🗑️</div>
        <h2 className="rd-confirm-title">Delete Routine?</h2>
        <p className="rd-confirm-sub">
          Are you sure you want to delete <strong>"{routine.title}"</strong>? This can't be undone.
        </p>
        <div className="rd-modal-actions">
          <button className="rd-ghost-btn" onClick={onCancel}>Cancel</button>
          <button className="rd-danger-btn" onClick={onConfirm}>Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ─── ROUTINE FORM MODAL ─── */
function RoutineFormModal({ initial, onSave, onClose, studentName }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    title: initial?.title || "",
    category: initial?.category || "morning",
    type: initial?.type || "adhd",
    tasksText: (initial?.tasks || []).map((t) => `${t.label}${t.mins ? ` - ${t.mins} min` : ""}`).join("\n"),
  });
  const [errors, setErrors] = useState({});
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required.";
    if (!form.tasksText.trim()) e.tasksText = "At least one task is required.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const parseTasks = (text) =>
    text.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const m = l.match(/^(.*?)(?:\s*-\s*(\d+)\s*min)?$/i);
      return { label: m?.[1]?.trim() || l, mins: Number(m?.[2] || 0) };
    });

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({ ...(initial?._id ? { _id: initial._id } : {}), ...form, tasks: parseTasks(form.tasksText) });
  };

  return (
    <div className="rd-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rd-modal rd-form-modal">
        <button className="rd-modal-close" onClick={onClose} aria-label="Close"><X size={16} /></button>
        <div className="rd-form-header">
          <div className="rd-form-icon-preview">{isEdit ? "✏️" : "✨"}</div>
          <div>
            <h2 className="rd-form-title">{isEdit ? "Edit Routine" : "New Routine"}</h2>
            <p className="rd-form-sub">For {studentName}</p>
          </div>
        </div>
        <div className="rd-form-body">
          <div className="rd-field">
            <label className="rd-label">Title</label>
            <input className={`rd-input ${errors.title ? "error" : ""}`} value={form.title}
              onChange={(e) => set("title", e.target.value)} placeholder="Routine title" />
            {errors.title && <span className="rd-error-msg"><AlertCircle size={12} />{errors.title}</span>}
          </div>
          <div className="rd-form-row-2">
            <div className="rd-field">
              <label className="rd-label">Category</label>
              <select className="rd-input" value={form.category} onChange={(e) => set("category", e.target.value)}>
                {Object.entries(CATEGORY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="rd-field">
              <label className="rd-label">Track</label>
              <select className="rd-input" value={form.type} onChange={(e) => set("type", e.target.value)}>
                {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div className="rd-field">
            <label className="rd-label">Tasks <span className="rd-label-hint">(one per line · "label - X min")</span></label>
            <textarea className={`rd-input ${errors.tasksText ? "error" : ""}`} style={{ minHeight: 130 }}
              value={form.tasksText} onChange={(e) => set("tasksText", e.target.value)}
              placeholder={"Brush teeth - 5 min\nEat breakfast - 15 min"} />
            {errors.tasksText && <span className="rd-error-msg"><AlertCircle size={12} />{errors.tasksText}</span>}
          </div>
        </div>
        <div className="rd-modal-actions">
          <button className="rd-ghost-btn" onClick={onClose}>Cancel</button>
          <button className="rd-primary-btn" onClick={handleSubmit}>{isEdit ? "Save Changes" : "Create Routine"}</button>
        </div>
      </div>
    </div>
  );
}

/* ─── AI GENERATE MODAL ─── */
function AiGenerateModal({ onClose, onGenerate, selectedDisability }) {
  const [form, setForm] = useState({ childAge: "", disabilityType: selectedDisability || "adhd", wakeUpTime: "06:30", schoolTime: "07:30", studyTime: "17:00", sleepTime: "21:00", goals: "" });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  return (
    <div className="rd-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rd-modal rd-form-modal">
        <button className="rd-modal-close" onClick={onClose} aria-label="Close"><X size={16} /></button>
        <div className="rd-form-header">
          <div className="rd-form-icon-preview">🤖</div>
          <div>
            <h2 className="rd-form-title">AI Routine Generator</h2>
            <p className="rd-form-sub">Smart daily schedule tailored to your child</p>
          </div>
        </div>
        <div className="rd-form-body">
          <div className="rd-form-row-2">
            <div className="rd-field">
              <label className="rd-label">Child Age</label>
              <input className="rd-input" value={form.childAge} onChange={(e) => set("childAge", e.target.value)} placeholder="e.g. 8" />
            </div>
            <div className="rd-field">
              <label className="rd-label">Disability Type</label>
              <select className="rd-input" value={form.disabilityType} onChange={(e) => set("disabilityType", e.target.value)}>
                <option value="adhd">ADHD</option>
                <option value="autism">Autism</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>
          <div className="rd-form-row-2">
            <div className="rd-field"><label className="rd-label">Wake-up</label><input type="time" className="rd-input" value={form.wakeUpTime} onChange={(e) => set("wakeUpTime", e.target.value)} /></div>
            <div className="rd-field"><label className="rd-label">School</label><input type="time" className="rd-input" value={form.schoolTime} onChange={(e) => set("schoolTime", e.target.value)} /></div>
          </div>
          <div className="rd-form-row-2">
            <div className="rd-field"><label className="rd-label">Study</label><input type="time" className="rd-input" value={form.studyTime} onChange={(e) => set("studyTime", e.target.value)} /></div>
            <div className="rd-field"><label className="rd-label">Sleep</label><input type="time" className="rd-input" value={form.sleepTime} onChange={(e) => set("sleepTime", e.target.value)} /></div>
          </div>
          <div className="rd-field">
            <label className="rd-label">Goals <span className="rd-label-hint">(comma-separated)</span></label>
            <input className="rd-input" value={form.goals} onChange={(e) => set("goals", e.target.value)} placeholder="Focus, independence, bedtime calm" />
          </div>
        </div>
        <div className="rd-modal-actions">
          <button className="rd-ghost-btn" onClick={onClose}>Cancel</button>
          <button className="rd-primary-btn" onClick={() => onGenerate({ ...form, goals: form.goals.split(",").map((g) => g.trim()).filter(Boolean) })}>
            <Sparkles size={15} /> Generate
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── ROUTINE CARD (with collapse/expand) ─── */
function RoutineCard({ routine, onEdit, onDelete, viewMode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState(false); // full detail expand
  const cat = CATEGORY_META[routine.category] || CATEGORY_META.custom;
  const type = TYPE_META[routine.type] || TYPE_META.general;
  const totalMins = (routine.tasks || []).reduce((s, t) => s + (t.mins || 0), 0);

  if (viewMode === "list") {
    return (
      <div className={`rd-list-item ${collapsed ? "rd-list-collapsed" : ""}`}>
        <div className="rd-list-left">
          <div className="rd-list-emoji" style={{ background: cat.bg }}>{routine.iconEmoji || "📋"}</div>
          <div className="rd-list-info">
            <span className="rd-list-title">{routine.title}</span>
            <div className="rd-list-meta">
              <span className="rd-chip-tiny" style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
              <span className="rd-chip-tiny" style={{ background: type.color + "22", color: type.color }}>{type.label}</span>
              {totalMins > 0 && <span className="rd-chip-tiny rd-chip-clock"><Clock size={10} /> {totalMins} min</span>}
            </div>
          </div>
        </div>
        <div className="rd-list-right">
          <ProgressRing pct={routine.progress || 0} size={42} stroke={4} color={cat.color} />
          <span className="rd-star-count">⭐ {routine.rewards?.starsEarned || 0}</span>
          <button className="rd-icon-btn" onClick={() => onEdit(routine)} title="Edit"><Pencil size={14} /></button>
          <button className="rd-icon-btn danger" onClick={() => onDelete(routine)} title="Delete"><Trash2 size={14} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rd-card ${collapsed ? "rd-card-collapsed" : ""} ${expanded ? "rd-card-expanded" : ""}`}
      style={{ "--cat-color": cat.color, "--cat-bg": cat.bg }}>

      {/* Card Header — always visible */}
      <div className="rd-card-header">
        <div className="rd-card-emoji-wrap" style={{ background: cat.bg }}>
          {routine.iconEmoji || "📋"}
        </div>
        <div className="rd-card-header-info">
          <h3 className="rd-card-title">{routine.title}</h3>
          {!collapsed && (
            <div className="rd-chip-row">
              <span className="rd-chip-tiny" style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
              <span className="rd-chip-tiny" style={{ background: type.color + "22", color: type.color }}>{type.label}</span>
              {totalMins > 0 && <span className="rd-chip-tiny rd-chip-clock"><Clock size={10} />{totalMins} min</span>}
            </div>
          )}
        </div>

        {/* Window controls */}
        <div className="rd-card-controls">
          <button className="rd-ctrl-btn" onClick={() => { setCollapsed((c) => !c); setExpanded(false); }}
            title={collapsed ? "Expand" : "Minimise"} aria-label={collapsed ? "Expand card" : "Minimise card"}>
            {collapsed ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
          </button>
          <button className="rd-ctrl-btn" onClick={() => onEdit(routine)} title="Edit" aria-label="Edit routine">
            <Pencil size={13} />
          </button>
          <button className="rd-ctrl-btn danger" onClick={() => onDelete(routine)} title="Delete" aria-label="Delete routine">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Collapsed pill-bar */}
      {collapsed && (
        <div className="rd-collapsed-bar">
          <ProgressRing pct={routine.progress || 0} size={36} stroke={3.5} color={cat.color} />
          <span className="rd-star-count">⭐ {routine.rewards?.starsEarned || 0}</span>
          <span className="rd-chip-tiny" style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
        </div>
      )}

      {/* Expanded body */}
      {!collapsed && (
        <>
          {/* Progress */}
          <div className="rd-card-progress-row">
            <ProgressRing pct={routine.progress || 0} size={52} stroke={5} color={cat.color} />
            <div className="rd-card-progress-text">
              <span className="rd-progress-label">{routine.progress || 0}% complete</span>
              <span className="rd-star-count">⭐ {routine.rewards?.starsEarned || 0} stars</span>
              {routine.rewards?.badgesEarned?.length > 0 && (
                <span className="rd-badges-inline">{routine.rewards.badgesEarned.join(" ")}</span>
              )}
            </div>
          </div>

          {/* Tasks */}
          <div className="rd-task-list">
            {(routine.tasks || []).slice(0, expanded ? undefined : 3).map((task, idx) => (
              <div key={idx} className="rd-task-row">
                <div className="rd-task-dot" style={{ background: cat.color }} />
                <span className="rd-task-label">{task.label}</span>
                {task.mins > 0 && <span className="rd-task-mins">{task.mins}m</span>}
              </div>
            ))}
            {!expanded && routine.tasks?.length > 3 && (
              <button className="rd-show-more" onClick={() => setExpanded(true)}>
                +{routine.tasks.length - 3} more tasks <ChevronDown size={12} />
              </button>
            )}
            {expanded && routine.tasks?.length > 3 && (
              <button className="rd-show-more" onClick={() => setExpanded(false)}>
                Show less <ChevronUp size={12} />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── TEMPLATE CARD ─── */
function TemplateCard({ template, onAssign }) {
  const [collapsed, setCollapsed] = useState(false);
  const cat = CATEGORY_META[template.category] || CATEGORY_META.custom;
  return (
    <div className={`rd-card rd-template-card ${collapsed ? "rd-card-collapsed" : ""}`}
      style={{ "--cat-color": cat.color, "--cat-bg": cat.bg }}>
      <div className="rd-card-header">
        <div className="rd-card-emoji-wrap" style={{ background: cat.bg }}>🧩</div>
        <div className="rd-card-header-info">
          <h3 className="rd-card-title">{template.title}</h3>
          {!collapsed && (
            <div className="rd-chip-row">
              <span className="rd-chip-tiny" style={{ background: cat.bg, color: cat.color }}>{template.disabilityType}</span>
              {template.estimatedTime > 0 && <span className="rd-chip-tiny rd-chip-clock"><Clock size={10} />{template.estimatedTime} min</span>}
            </div>
          )}
        </div>
        <div className="rd-card-controls">
          <button className="rd-ctrl-btn" onClick={() => setCollapsed((c) => !c)} title={collapsed ? "Expand" : "Minimise"}>
            {collapsed ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
          </button>
          <button className="rd-ctrl-btn success" onClick={() => onAssign(template)} title="Assign to child">
            <Plus size={13} />
          </button>
        </div>
      </div>
      {collapsed && <div className="rd-collapsed-bar"><span className="rd-chip-tiny" style={{ background: cat.bg, color: cat.color }}>{cat.label}</span></div>}
      {!collapsed && (
        <div className="rd-task-list">
          {(template.tasks || []).slice(0, 4).map((task, idx) => (
            <div key={idx} className="rd-task-row">
              <div className="rd-task-dot" style={{ background: cat.color }} />
              <span className="rd-task-label">{task.label}</span>
            </div>
          ))}
          {template.tasks?.length > 4 && <span className="rd-show-more">+{template.tasks.length - 4} more</span>}
        </div>
      )}
    </div>
  );
}

/* ─── MAIN DASHBOARD ─── */
export default function RoutineDashboard() {
  const [routines, setRoutines] = useState(MOCK_ROUTINES);
  const [templates] = useState(MOCK_TEMPLATES);
  const [summary, setSummary] = useState(MOCK_SUMMARY);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [sectionsCollapsed, setSectionsCollapsed] = useState({ stats: false, templates: false, routines: false });

  const [showForm, setShowForm] = useState(false);
  const [showAiForm, setShowAiForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const studentName = "Alex";
  const totalStars = summary?.totalStars || 0;
  const completedRoutines = summary?.completedCount || 0;
  const completionPercentage = summary?.completionPercentage || 0;
  const earnedBadges = BADGES.filter((b) => totalStars >= b.threshold);
  const latestBadge = earnedBadges[earnedBadges.length - 1];

  const filteredRoutines = useMemo(() => {
    let list = routines;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) =>
        (r.title || "").toLowerCase().includes(q) ||
        (r.tasks || []).some((t) => t.label.toLowerCase().includes(q))
      );
    }
    if (filterCategory !== "all") list = list.filter((r) => r.category === filterCategory);
    if (filterType !== "all") list = list.filter((r) => r.type === filterType);
    return list;
  }, [routines, searchQuery, filterCategory, filterType]);

  const toggleSection = (key) =>
    setSectionsCollapsed((p) => ({ ...p, [key]: !p[key] }));

  const handleCreate = (payload) => {
    setRoutines((p) => [...p, { ...payload, _id: Date.now().toString(), progress: 0, rewards: { starsEarned: 0, badgesEarned: [] } }]);
    setShowForm(false);
  };

  const handleUpdate = (payload) => {
    setRoutines((p) => p.map((r) => (r._id === payload._id ? { ...r, ...payload } : r)));
    setEditTarget(null);
  };

  const handleDelete = () => {
    setRoutines((p) => p.filter((r) => r._id !== deleteTarget._id));
    setDeleteTarget(null);
  };

  const handleAssignTemplate = (template) => {
    setRoutines((p) => [
      ...p,
      { _id: Date.now().toString(), title: template.title, category: template.category, type: template.disabilityType?.toLowerCase() || "general", iconEmoji: "🧩", progress: 0, tasks: template.tasks || [], rewards: { starsEarned: 0, badgesEarned: [] } },
    ]);
  };

  const activeFilters = [filterCategory !== "all" && filterCategory, filterType !== "all" && filterType].filter(Boolean);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .rd-page {
          min-height: 100vh;
          background: var(--bg, #eaf9f5);
          font-family: 'Nunito', sans-serif;
          color: var(--text-dark, #2d3a35);
        }

        /* ── HERO ── */
        .rd-hero {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, var(--mint,#d4f5ec) 0%, var(--sky,#cce8ff) 60%, var(--lavender,#e8e0ff) 100%);
          padding: 32px 28px 40px;
        }

        .rd-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(50px);
          opacity: 0.35;
          pointer-events: none;
        }
        .rd-blob-1 { width: 260px; height: 260px; background: var(--peach,#fde8d8); top: -80px; right: -60px; }
        .rd-blob-2 { width: 200px; height: 200px; background: var(--mint,#d4f5ec); bottom: -40px; left: 20px; }
        .rd-blob-3 { width: 150px; height: 150px; background: var(--lavender,#e8e0ff); top: 20px; left: 40%; }

        .rd-deco { position: absolute; pointer-events: none; user-select: none; }
        .deco-s1 { top: 16px; right: 18%; font-size: 1.6rem; animation: floatA 4s ease-in-out infinite; }
        .deco-s2 { top: 50px; right: 8%;  font-size: 1.1rem; animation: floatB 5s ease-in-out infinite; }
        .deco-s3 { bottom: 14px; left: 12%; font-size: 1.3rem; animation: floatA 3.5s ease-in-out infinite; }
        .deco-rocket { bottom: 10px; right: 22%; font-size: 1.8rem; animation: floatB 6s ease-in-out infinite; }

        @keyframes floatA { 0%,100%{ transform:translateY(0) rotate(-5deg); } 50%{ transform:translateY(-10px) rotate(5deg); } }
        @keyframes floatB { 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-14px); } }

        .rd-hero-top { display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 2; margin-bottom: 24px; }

        .rd-back-link {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 0.9rem;
          color: var(--text-dark,#2d3a35); text-decoration: none;
          background: white; padding: 8px 18px; border-radius: 999px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          border: none; cursor: pointer;
        }
        .rd-back-link:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.1); }

        .rd-hero-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

        .rd-stars-chip {
          display: flex; align-items: center; gap: 6px;
          background: white; border-radius: 999px; padding: 8px 16px;
          font-family: 'Fredoka One', cursive; font-size: 0.95rem;
          color: var(--yellow-deep,#e6b800);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .rd-report-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: linear-gradient(135deg, var(--mint-deep,#3dbf9a), var(--sky-deep,#4ab3e8));
          color: white; font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 0.85rem;
          padding: 9px 18px; border-radius: 999px; border: none; cursor: pointer;
          box-shadow: 0 4px 14px rgba(61,191,154,0.3);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .rd-report-btn:hover { transform: translateY(-3px); box-shadow: 0 8px 22px rgba(61,191,154,0.4); }

        .rd-hero-body { position: relative; z-index: 2; text-align: center; }

        .rd-hero-emoji-row { font-size: 1.8rem; margin-bottom: 10px; display: flex; justify-content: center; gap: 12px; }
        .rd-hero-emoji-row span { display: inline-block; animation: floatA 3s ease-in-out infinite; }
        .rd-hero-emoji-row span:nth-child(2n) { animation: floatB 4s ease-in-out infinite; }

        .rd-hub-title {
          font-family: 'Fredoka One', cursive;
          font-size: clamp(2.2rem, 5vw, 3rem);
          color: var(--text-dark,#2d3a35);
          margin-bottom: 6px;
          display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;
        }

        .rd-tw { display: inline-block; }
        .rd-tw-mint  { color: var(--mint-deep,#3dbf9a); }
        .rd-tw-sky   { color: var(--sky-deep,#4ab3e8); }

        .rd-hub-subtitle { font-size: 1rem; color: var(--text-mid,#6b7c75); margin-bottom: 18px; }

        .rd-hero-stats { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }

        .rd-stat-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 18px; border-radius: 999px;
          font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 0.85rem;
          background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .rd-sp-mint  { color: var(--mint-deep,#3dbf9a); }
        .rd-sp-sky   { color: var(--sky-deep,#4ab3e8); }
        .rd-sp-peach { color: var(--peach-deep,#f28b60); }

        /* ── TOOLBAR ── */
        .rd-toolbar {
          position: sticky; top: 0; z-index: 40;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(12px);
          border-bottom: 2px solid var(--mint,#d4f5ec);
          padding: 12px 24px;
        }

        .rd-toolbar-inner {
          max-width: 1100px; margin: 0 auto;
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
        }

        .rd-search-wrap {
          flex: 1; min-width: 180px; max-width: 320px;
          position: relative; display: flex; align-items: center;
        }
        .rd-search-icon { position: absolute; left: 14px; color: var(--text-mid,#6b7c75); pointer-events: none; }
        .rd-search {
          width: 100%; padding: 10px 36px 10px 38px;
          border-radius: 999px; border: 2px solid var(--mint,#d4f5ec);
          background: var(--bg,#eaf9f5); font-family: 'Nunito', sans-serif;
          font-size: 0.9rem; color: var(--text-dark,#2d3a35); outline: none;
          transition: border-color 0.2s;
        }
        .rd-search:focus { border-color: var(--mint-deep,#3dbf9a); background: white; }
        .rd-search-clear {
          position: absolute; right: 12px;
          background: none; border: none; cursor: pointer;
          color: var(--text-mid,#6b7c75); display: flex; align-items: center;
        }

        .rd-filter-select {
          padding: 10px 14px; border-radius: 999px;
          border: 2px solid var(--mint,#d4f5ec);
          background: var(--bg,#eaf9f5); font-family: 'Nunito', sans-serif;
          font-size: 0.85rem; color: var(--text-dark,#2d3a35); outline: none; cursor: pointer;
          transition: border-color 0.2s;
        }
        .rd-filter-select:focus { border-color: var(--mint-deep,#3dbf9a); }

        .rd-view-toggle {
          display: flex; gap: 4px;
          background: var(--bg,#eaf9f5); border-radius: 999px; padding: 4px;
          border: 2px solid var(--mint,#d4f5ec);
        }

        .rd-view-btn {
          width: 34px; height: 34px; border-radius: 999px;
          border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
          background: transparent; color: var(--text-mid,#6b7c75);
          transition: all 0.2s ease;
        }
        .rd-view-btn.active {
          background: white; color: var(--mint-deep,#3dbf9a);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .rd-spacer { flex: 1; }

        .rd-ai-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 10px 20px; border-radius: 999px; border: none; cursor: pointer;
          background: linear-gradient(135deg, var(--lavender,#e8e0ff), #c8b8f8);
          color: #6040c0; font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 0.9rem;
          box-shadow: 0 4px 14px rgba(160,130,240,0.25);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .rd-ai-btn:hover { transform: translateY(-3px); box-shadow: 0 8px 22px rgba(160,130,240,0.35); }

        .rd-create-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 10px 20px; border-radius: 999px; border: none; cursor: pointer;
          background: linear-gradient(135deg, var(--mint-deep,#3dbf9a), var(--sky-deep,#4ab3e8));
          color: white; font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 0.9rem;
          box-shadow: 0 4px 14px rgba(61,191,154,0.3);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .rd-create-btn:hover { transform: translateY(-3px); box-shadow: 0 8px 22px rgba(61,191,154,0.4); }

        /* ACTIVE FILTER CHIPS */
        .rd-active-filters { display: flex; gap: 6px; flex-wrap: wrap; padding: 0 24px 10px; max-width: 1100px; margin: 0 auto; }
        .rd-filter-chip {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 4px 12px; border-radius: 999px;
          background: var(--mint,#d4f5ec); color: var(--mint-deep,#3dbf9a);
          font-family: 'Nunito', sans-serif; font-size: 0.78rem; font-weight: 700;
          cursor: pointer; border: none; transition: transform 0.15s;
        }
        .rd-filter-chip:hover { transform: scale(1.05); }

        /* ── BODY ── */
        .rd-body { max-width: 1100px; margin: 0 auto; padding: 28px 24px 60px; }

        /* ── SECTION ── */
        .rd-section { margin-bottom: 32px; }

        .rd-section-head {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 16px;
        }

        .rd-section-title {
          font-family: 'Fredoka One', cursive; font-size: 1.3rem;
          color: var(--text-dark,#2d3a35); flex: 1;
          display: flex; align-items: center; gap: 8px;
        }

        .rd-count-chip {
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--mint,#d4f5ec); color: var(--mint-deep,#3dbf9a);
          font-family: 'Nunito', sans-serif; font-size: 0.78rem; font-weight: 800;
          min-width: 24px; height: 24px; border-radius: 999px; padding: 0 7px;
        }

        .rd-section-toggle {
          width: 32px; height: 32px; border-radius: 50%;
          background: var(--mint,#d4f5ec); border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: var(--mint-deep,#3dbf9a); transition: transform 0.2s ease, background 0.2s;
        }
        .rd-section-toggle:hover { background: var(--mint-deep,#3dbf9a); color: white; }

        /* ── STATS GRID ── */
        .rd-stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; }

        .rd-stat-card {
          background: white; border-radius: 24px; padding: 20px 18px;
          border-bottom: 5px solid var(--accent-color, var(--mint-deep,#3dbf9a));
          box-shadow: 0 6px 20px rgba(0,0,0,0.06);
          display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .rd-stat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(0,0,0,0.09); }

        .rd-stat-icon {
          width: 48px; height: 48px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.4rem;
        }
        .rd-stat-num { font-family: 'Fredoka One', cursive; font-size: 2rem; color: var(--accent-color, var(--mint-deep,#3dbf9a)); line-height: 1; }
        .rd-stat-label { font-size: 0.82rem; font-weight: 700; color: var(--text-mid,#6b7c75); }

        /* ── CARD GRID ── */
        .rd-cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
        .rd-cards-list { display: flex; flex-direction: column; gap: 10px; }

        /* ── ROUTINE CARD ── */
        .rd-card {
          background: white; border-radius: 28px;
          border-bottom: 5px solid var(--cat-color, var(--mint-deep,#3dbf9a));
          box-shadow: 0 6px 20px rgba(0,0,0,0.06);
          padding: 18px; overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease, max-height 0.35s ease;
          animation: cardIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        .rd-card:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(0,0,0,0.09); }
        .rd-card-collapsed { padding-bottom: 14px; }
        .rd-template-card { border-left: 4px solid var(--cat-color, var(--mint-deep,#3dbf9a)); border-bottom-width: 3px; }

        @keyframes cardIn { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: none; } }

        .rd-card-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }

        .rd-card-emoji-wrap {
          width: 42px; height: 42px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.4rem; flex-shrink: 0;
        }

        .rd-card-header-info { flex: 1; min-width: 0; }
        .rd-card-title { font-family: 'Fredoka One', cursive; font-size: 1rem; color: var(--text-dark,#2d3a35); line-height: 1.2; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .rd-chip-row { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 4px; }

        .rd-chip-tiny {
          display: inline-flex; align-items: center; gap: 3px;
          padding: 2px 9px; border-radius: 999px;
          font-size: 0.72rem; font-weight: 700;
        }
        .rd-chip-clock { background: var(--mint,#d4f5ec) !important; color: var(--mint-deep,#3dbf9a) !important; }

        /* Window controls */
        .rd-card-controls { display: flex; gap: 4px; flex-shrink: 0; }

        .rd-ctrl-btn {
          width: 28px; height: 28px; border-radius: 50%;
          background: var(--bg,#eaf9f5); border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-mid,#6b7c75);
          transition: background 0.15s ease, transform 0.15s ease, color 0.15s ease;
        }
        .rd-ctrl-btn:hover { background: var(--mint,#d4f5ec); color: var(--mint-deep,#3dbf9a); transform: scale(1.1); }
        .rd-ctrl-btn.danger:hover { background: #fde8e8; color: #e07070; }
        .rd-ctrl-btn.success:hover { background: var(--mint,#d4f5ec); color: var(--mint-deep,#3dbf9a); }

        /* Collapsed bar */
        .rd-collapsed-bar { display: flex; align-items: center; gap: 10px; padding-top: 0; }

        /* Progress row */
        .rd-card-progress-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .rd-card-progress-text { display: flex; flex-direction: column; gap: 3px; }
        .rd-progress-label { font-family: 'Fredoka One', cursive; font-size: 0.95rem; color: var(--text-dark,#2d3a35); }
        .rd-star-count { font-size: 0.82rem; font-weight: 700; color: var(--text-mid,#6b7c75); }
        .rd-badges-inline { font-size: 1rem; }

        /* Task list */
        .rd-task-list { display: flex; flex-direction: column; gap: 6px; }
        .rd-task-row { display: flex; align-items: center; gap: 8px; padding: 5px 0; }
        .rd-task-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .rd-task-label { flex: 1; font-size: 0.85rem; font-weight: 600; color: var(--text-dark,#2d3a35); }
        .rd-task-mins { font-size: 0.75rem; font-weight: 700; color: var(--text-mid,#6b7c75); background: var(--bg,#eaf9f5); padding: 1px 7px; border-radius: 999px; }

        .rd-show-more {
          display: inline-flex; align-items: center; gap: 4px;
          background: none; border: none; cursor: pointer;
          font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 0.8rem;
          color: var(--mint-deep,#3dbf9a); padding: 4px 0;
          transition: color 0.15s;
        }
        .rd-show-more:hover { color: var(--sky-deep,#4ab3e8); }

        /* ── LIST ITEM ── */
        .rd-list-item {
          background: white; border-radius: 20px;
          border-left: 5px solid var(--mint-deep,#3dbf9a);
          box-shadow: 0 4px 14px rgba(0,0,0,0.05);
          padding: 14px 18px;
          display: flex; align-items: center; gap: 14px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          animation: cardIn 0.3s ease both;
        }
        .rd-list-item:hover { transform: translateY(-3px); box-shadow: 0 8px 22px rgba(0,0,0,0.08); }
        .rd-list-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
        .rd-list-emoji { width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
        .rd-list-info { flex: 1; min-width: 0; }
        .rd-list-title { font-family: 'Fredoka One', cursive; font-size: 0.95rem; color: var(--text-dark,#2d3a35); display: block; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .rd-list-meta { display: flex; gap: 5px; align-items: center; flex-wrap: wrap; }
        .rd-list-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

        /* ── EMPTY / LOADING ── */
        .rd-empty {
          text-align: center; padding: 48px 20px;
          color: var(--text-mid,#6b7c75); font-size: 0.95rem;
        }
        .rd-empty .rd-empty-emoji { font-size: 3rem; display: block; margin-bottom: 12px; }

        .rd-loading { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px 0; color: var(--text-mid,#6b7c75); }
        .rd-spinner { width: 36px; height: 36px; border: 3px solid var(--mint,#d4f5ec); border-top-color: var(--mint-deep,#3dbf9a); border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── ENCOURAGE FOOTER ── */
        .rd-footer { background: white; border-top: 2px solid var(--mint,#d4f5ec); padding: 28px 24px; margin-top: 8px; }
        .rd-footer-inner { max-width: 1100px; margin: 0 auto; display: flex; gap: 16px; flex-wrap: wrap; }
        .rd-encourage-card {
          flex: 1; min-width: 220px;
          background: var(--bg,#eaf9f5); border-radius: 24px; padding: 18px 20px;
          border-bottom: 4px solid var(--mint-deep,#3dbf9a);
          display: flex; align-items: flex-start; gap: 14px;
          transition: transform 0.2s ease;
        }
        .rd-encourage-card:hover { transform: translateY(-3px); }
        .rd-ec-emoji { font-size: 1.8rem; flex-shrink: 0; }
        .rd-ec-title { font-family: 'Fredoka One', cursive; font-size: 1rem; color: var(--text-dark,#2d3a35); margin-bottom: 4px; }
        .rd-ec-sub { font-size: 0.82rem; color: var(--text-mid,#6b7c75); line-height: 1.4; }

        /* ── MODAL ── */
        .rd-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(0,0,0,0.25); backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center; padding: 20px;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .rd-modal {
          background: white; border-radius: 32px; width: 100%; max-width: 500px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.18);
          animation: modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
          position: relative; overflow: hidden;
        }
        @keyframes modalIn { from { transform: scale(0.88) translateY(20px); opacity: 0; } to { transform: none; opacity: 1; } }

        .rd-modal-close {
          position: absolute; top: 16px; right: 16px;
          width: 32px; height: 32px; border-radius: 50%;
          background: var(--bg,#eaf9f5); border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-mid,#6b7c75); transition: background 0.15s;
        }
        .rd-modal-close:hover { background: var(--mint,#d4f5ec); }

        .rd-confirm-modal { padding: 40px 32px; text-align: center; }
        .rd-confirm-icon { font-size: 3rem; margin-bottom: 12px; }
        .rd-confirm-title { font-family: 'Fredoka One', cursive; font-size: 1.5rem; color: var(--text-dark,#2d3a35); margin-bottom: 8px; }
        .rd-confirm-sub { font-size: 0.9rem; color: var(--text-mid,#6b7c75); line-height: 1.5; margin-bottom: 24px; }

        .rd-form-modal { padding: 0; }

        .rd-form-header {
          display: flex; align-items: center; gap: 14px;
          padding: 24px 28px 18px;
          border-bottom: 2px solid var(--mint,#d4f5ec);
        }
        .rd-form-icon-preview { font-size: 2rem; }
        .rd-form-title { font-family: 'Fredoka One', cursive; font-size: 1.3rem; color: var(--text-dark,#2d3a35); }
        .rd-form-sub { font-size: 0.82rem; color: var(--text-mid,#6b7c75); margin-top: 2px; }

        .rd-form-body { padding: 18px 28px; display: flex; flex-direction: column; gap: 14px; max-height: 50vh; overflow-y: auto; }
        .rd-form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .rd-field { display: flex; flex-direction: column; gap: 5px; }
        .rd-label { font-size: 0.82rem; font-weight: 700; color: var(--text-dark,#2d3a35); display: flex; align-items: center; gap: 6px; }
        .rd-label-hint { font-weight: 400; color: var(--text-mid,#6b7c75); font-size: 0.76rem; }

        .rd-input {
          padding: 10px 14px; border-radius: 14px;
          border: 2px solid var(--mint,#d4f5ec);
          background: var(--bg,#eaf9f5); font-family: 'Nunito', sans-serif;
          font-size: 0.9rem; color: var(--text-dark,#2d3a35); outline: none;
          transition: border-color 0.2s, background 0.2s; resize: vertical;
        }
        .rd-input:focus { border-color: var(--mint-deep,#3dbf9a); background: white; }
        .rd-input.error { border-color: #e07070; }

        .rd-error-msg { display: flex; align-items: center; gap: 4px; font-size: 0.78rem; color: #e07070; font-weight: 700; }

        .rd-modal-actions {
          display: flex; justify-content: flex-end; gap: 10px;
          padding: 16px 28px 24px;
          border-top: 2px solid var(--mint,#d4f5ec);
        }

        .rd-ghost-btn {
          padding: 10px 22px; border-radius: 999px;
          border: 2px solid var(--mint,#d4f5ec); background: white;
          font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 0.9rem;
          color: var(--text-mid,#6b7c75); cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }
        .rd-ghost-btn:hover { border-color: var(--mint-deep,#3dbf9a); color: var(--mint-deep,#3dbf9a); }

        .rd-primary-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 10px 22px; border-radius: 999px; border: none; cursor: pointer;
          background: linear-gradient(135deg, var(--mint-deep,#3dbf9a), var(--sky-deep,#4ab3e8));
          color: white; font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 0.9rem;
          box-shadow: 0 4px 14px rgba(61,191,154,0.3);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .rd-primary-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(61,191,154,0.4); }

        .rd-danger-btn {
          padding: 10px 22px; border-radius: 999px; border: none; cursor: pointer;
          background: linear-gradient(135deg, #f28b8b, #e06060);
          color: white; font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 0.9rem;
          box-shadow: 0 4px 14px rgba(224,96,96,0.3);
          transition: transform 0.2s ease;
        }
        .rd-danger-btn:hover { transform: translateY(-2px); }

        /* ── RESPONSIVE ── */
        @media (max-width: 600px) {
          .rd-hero { padding: 20px 16px 28px; }
          .rd-toolbar-inner { gap: 8px; }
          .rd-body { padding: 20px 16px 48px; }
          .rd-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .rd-form-row-2 { grid-template-columns: 1fr; }
          .rd-hero-right { gap: 6px; }
        }
      `}</style>

      <div className="rd-page">

        {/* ── HERO ── */}
        <div className="rd-hero">
          <div className="rd-blob rd-blob-1" aria-hidden="true" />
          <div className="rd-blob rd-blob-2" aria-hidden="true" />
          <div className="rd-blob rd-blob-3" aria-hidden="true" />
          <span className="rd-deco deco-s1" aria-hidden="true">⭐</span>
          <span className="rd-deco deco-s2" aria-hidden="true">✨</span>
          <span className="rd-deco deco-s3" aria-hidden="true">💫</span>
          <span className="rd-deco deco-rocket" aria-hidden="true">🚀</span>

          <div className="rd-hero-top">
            <button className="rd-back-link" onClick={() => window.history.back()} aria-label="Go back">
              <ArrowLeft size={16} /> Back
            </button>
            <div className="rd-hero-right">
              <div className="rd-stars-chip" aria-label={`${totalStars} stars earned`}>
                ⭐ {totalStars} stars {latestBadge && <span title={latestBadge.label}>{latestBadge.emoji}</span>}
              </div>
              <button className="rd-report-btn" aria-label="Download report">
                <Download size={14} /> Report
              </button>
            </div>
          </div>

          <div className="rd-hero-body">
            <div className="rd-hero-emoji-row" aria-hidden="true">
              <span>📅</span><span>🧩</span><span>⭐</span><span>🤖</span><span>🏆</span>
            </div>
            <h1 className="rd-hub-title">
              <span className="rd-tw rd-tw-mint">Routine</span>
              <span className="rd-tw rd-tw-sky">Manager</span>
            </h1>
            <p className="rd-hub-subtitle">Plan, assign, and track routines for {studentName} 🌟</p>
            <div className="rd-hero-stats">
              <span className="rd-stat-pill rd-sp-mint">📋 {routines.length} Assigned</span>
              <span className="rd-stat-pill rd-sp-sky">⭐ {totalStars} Stars</span>
              <span className="rd-stat-pill rd-sp-peach">✅ {completionPercentage}% Done</span>
            </div>
          </div>
        </div>

        {/* ── STICKY TOOLBAR ── */}
        <div className="rd-toolbar">
          <div className="rd-toolbar-inner">
            {/* Search */}
            <div className="rd-search-wrap">
              <Search size={15} className="rd-search-icon" aria-hidden="true" />
              <input className="rd-search" placeholder="Search routines…" value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} aria-label="Search routines" />
              {searchQuery && (
                <button className="rd-search-clear" onClick={() => setSearchQuery("")} aria-label="Clear search"><X size={13} /></button>
              )}
            </div>

            {/* Filters */}
            <select className="rd-filter-select" value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)} aria-label="Filter by category">
              <option value="all">All Categories</option>
              {Object.entries(CATEGORY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>

            <select className="rd-filter-select" value={filterType}
              onChange={(e) => setFilterType(e.target.value)} aria-label="Filter by type">
              <option value="all">All Types</option>
              {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>

            {/* View toggle */}
            <div className="rd-view-toggle" role="group" aria-label="View mode">
              <button className={`rd-view-btn ${viewMode === "grid" ? "active" : ""}`} onClick={() => setViewMode("grid")} aria-label="Grid view" title="Grid view">
                <LayoutGrid size={15} />
              </button>
              <button className={`rd-view-btn ${viewMode === "list" ? "active" : ""}`} onClick={() => setViewMode("list")} aria-label="List view" title="List view">
                <List size={15} />
              </button>
            </div>

            <div className="rd-spacer" />

            <button className="rd-ai-btn" onClick={() => setShowAiForm(true)} aria-label="AI generate routine">
              <Sparkles size={15} /> AI Generate
            </button>
            <button className="rd-create-btn" onClick={() => setShowForm(true)} aria-label="Create new routine">
              <Plus size={15} /> New Routine
            </button>
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="rd-active-filters" role="list" aria-label="Active filters">
            {filterCategory !== "all" && (
              <button className="rd-filter-chip" role="listitem" onClick={() => setFilterCategory("all")}>
                {CATEGORY_META[filterCategory]?.label} <X size={10} />
              </button>
            )}
            {filterType !== "all" && (
              <button className="rd-filter-chip" role="listitem" onClick={() => setFilterType("all")}>
                {TYPE_META[filterType]?.label} <X size={10} />
              </button>
            )}
          </div>
        )}

        {/* ── BODY ── */}
        <div className="rd-body">

          {/* STATS SECTION */}
          <div className="rd-section">
            <div className="rd-section-head">
              <h2 className="rd-section-title">📊 Overview</h2>
              <button className="rd-section-toggle" onClick={() => toggleSection("stats")}
                aria-label={sectionsCollapsed.stats ? "Expand stats" : "Collapse stats"}>
                {sectionsCollapsed.stats ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
            </div>
            {!sectionsCollapsed.stats && summary && (
              <div className="rd-stats-grid">
                {[
                  { label: "Assigned", val: summary.totalAssigned || 0, emoji: "📋", color: "var(--sky-deep,#4ab3e8)", bg: "var(--sky,#cce8ff)" },
                  { label: "Completed", val: summary.completedCount || 0, emoji: "✅", color: "var(--mint-deep,#3dbf9a)", bg: "var(--mint,#d4f5ec)" },
                  { label: "Completion", val: `${summary.completionPercentage || 0}%`, emoji: "📈", color: "var(--peach-deep,#f28b60)", bg: "var(--peach,#fde8d8)" },
                  { label: "Stars Earned", val: summary.totalStars || 0, emoji: "⭐", color: "var(--yellow-deep,#e6b800)", bg: "#fff7cc" },
                ].map((s) => (
                  <div key={s.label} className="rd-stat-card" style={{ "--accent-color": s.color }}>
                    <div className="rd-stat-icon" style={{ background: s.bg }}>{s.emoji}</div>
                    <div className="rd-stat-num">{s.val}</div>
                    <div className="rd-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TEMPLATES SECTION */}
          <div className="rd-section">
            <div className="rd-section-head">
              <h2 className="rd-section-title">🧩 Templates <span className="rd-count-chip">{templates.length}</span></h2>
              <button className="rd-section-toggle" onClick={() => toggleSection("templates")}
                aria-label={sectionsCollapsed.templates ? "Expand templates" : "Collapse templates"}>
                {sectionsCollapsed.templates ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
            </div>
            {!sectionsCollapsed.templates && (
              templates.length === 0 ? (
                <div className="rd-empty"><span className="rd-empty-emoji">📭</span>No templates available.</div>
              ) : (
                <div className="rd-cards-grid">
                  {templates.map((t, i) => (
                    <div key={t._id} style={{ animationDelay: `${i * 0.06}s` }}>
                      <TemplateCard template={t} onAssign={handleAssignTemplate} />
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* ROUTINES SECTION */}
          <div className="rd-section">
            <div className="rd-section-head">
              <h2 className="rd-section-title">📅 Assigned Routines <span className="rd-count-chip">{filteredRoutines.length}</span></h2>
              <button className="rd-section-toggle" onClick={() => toggleSection("routines")}
                aria-label={sectionsCollapsed.routines ? "Expand routines" : "Collapse routines"}>
                {sectionsCollapsed.routines ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
            </div>
            {!sectionsCollapsed.routines && (
              loading ? (
                <div className="rd-loading"><div className="rd-spinner" /><p>Loading routines…</p></div>
              ) : filteredRoutines.length === 0 ? (
                <div className="rd-empty">
                  <span className="rd-empty-emoji">📭</span>
                  {searchQuery || activeFilters.length ? "No routines match your filters." : "No routines yet — create one above!"}
                </div>
              ) : (
                <div className={viewMode === "grid" ? "rd-cards-grid" : "rd-cards-list"}>
                  {filteredRoutines.map((r, i) => (
                    <div key={r._id} style={{ animationDelay: `${i * 0.05}s` }}>
                      <RoutineCard routine={r} onEdit={setEditTarget} onDelete={setDeleteTarget} viewMode={viewMode} />
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="rd-footer">
          <div className="rd-footer-inner">
            <div className="rd-encourage-card">
              <span className="rd-ec-emoji">🏆</span>
              <div>
                <div className="rd-ec-title">Keep routines consistent</div>
                <div className="rd-ec-sub">Templates + AI + tracking help parents guide daily habits smoothly.</div>
              </div>
            </div>
            <div className="rd-encourage-card">
              <span className="rd-ec-emoji">💛</span>
              <div>
                <div className="rd-ec-title">Progress stays child-focused</div>
                <div className="rd-ec-sub">Only assigned routines flow into the student experience.</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── MODALS ── */}
        {showForm && (
          <RoutineFormModal onSave={handleCreate} onClose={() => setShowForm(false)} studentName={studentName} />
        )}
        {editTarget && (
          <RoutineFormModal initial={editTarget} onSave={handleUpdate} onClose={() => setEditTarget(null)} studentName={studentName} />
        )}
        {showAiForm && (
          <AiGenerateModal onClose={() => setShowAiForm(false)} onGenerate={(p) => { handleCreate({ ...p, title: "AI Routine", category: p.disabilityType, type: p.disabilityType, tasks: [{ label: "Task from AI", mins: 10 }] }); setShowAiForm(false); }} selectedDisability="adhd" />
        )}
        {deleteTarget && (
          <ConfirmDeleteModal routine={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
        )}
      </div>
    </>
  );
}