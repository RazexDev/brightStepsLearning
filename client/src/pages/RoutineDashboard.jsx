import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  X,
  Plus,
  Pencil,
  Trash2,
  Download,
  Sparkles,
} from "lucide-react";
import "./RoutineDashboard.css";

const API_BASE = process.env.REACT_APP_API_URL || "/api";

async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem("brightsteps_token");

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...opts,
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

const BADGES = [
  { id: "first", emoji: "🌟", label: "First Star", threshold: 1 },
  { id: "five", emoji: "⭐", label: "5 Stars", threshold: 5 },
  { id: "ten", emoji: "🔥", label: "10 Stars", threshold: 10 },
  { id: "twenty", emoji: "💪", label: "20 Stars", threshold: 20 },
  { id: "superstar", emoji: "👑", label: "Superstar", threshold: 50 },
];

function generateReportPDF({ studentName, totalStars, completedRoutines, earnedBadges, completionPercentage }) {
  const date = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>BrightSteps Routine Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #1E1007; background: #FEFCF5; }
          .card { background: white; border-radius: 18px; padding: 24px; border: 2px solid #eee; }
          h1 { margin: 0 0 10px; }
          .meta { color: #6B4C30; margin-bottom: 24px; }
          .row { display: flex; gap: 12px; margin-bottom: 20px; }
          .pill { flex: 1; border-radius: 14px; padding: 16px; text-align: center; border: 2px solid #ddd; background: #fafafa; }
          .pill strong { display: block; font-size: 28px; margin-bottom: 6px; }
          ul { padding-left: 20px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>BrightSteps Routine Report</h1>
          <div class="meta">For <strong>${studentName}</strong> · Generated on ${date}</div>

          <div class="row">
            <div class="pill">
              <strong>${completedRoutines}</strong>
              Completed Routines
            </div>
            <div class="pill">
              <strong>${completionPercentage}%</strong>
              Completion Rate
            </div>
            <div class="pill">
              <strong>${totalStars}</strong>
              Stars Earned
            </div>
          </div>

          <h3>Badges Earned</h3>
          <ul>
            ${
              earnedBadges.length
                ? earnedBadges.map((b) => `<li>${b.emoji} ${b.label}</li>`).join("")
                : "<li>No badges earned yet</li>"
            }
          </ul>
        </div>

      </body>
    </html>
  `;

  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 1500);
  }, 400);
}

function ConfirmDeleteModal({ routine, onConfirm, onCancel }) {
  return (
    <div className="rd-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="rd-modal rd-confirm-modal">
        <div className="rd-confirm-icon">🗑️</div>
        <h2 className="rd-confirm-title">Delete Routine?</h2>
        <p className="rd-confirm-sub">
          Are you sure you want to delete <strong>"{routine.title}"</strong>?
        </p>
        <div className="rd-confirm-actions">
          <button className="rd-ghost-btn" onClick={onCancel}>Cancel</button>
          <button className="rd-danger-btn" onClick={onConfirm}>Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}

function RoutineFormModal({ initial, onSave, onClose, selectedStudentId, selectedStudentName }) {
  const isEdit = !!initial;

  const [form, setForm] = useState(() => ({
    title: initial?.title || "",
    category: initial?.category || "morning",
    type: initial?.type || "adhd",
    tasksText: (initial?.tasks || [])
      .map((t) => `${t.label} - ${t.mins || 0} min`)
      .join("\n"),
    goalId: initial?.goalId || "",
  }));

  const [errors, setErrors] = useState({});

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const next = {};

    if (!form.title.trim()) next.title = "Title is required.";
    if (!form.tasksText.trim()) next.tasksText = "At least one task is required.";
    if (!selectedStudentId) next.studentId = "Select a student first.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const parseTasks = (text) => {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^(.*?)(?:\s*-\s*(\d+)\s*min)?$/i);
        return {
          label: match?.[1]?.trim() || line,
          mins: Number(match?.[2] || 0),
        };
      });
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSave({
      ...(initial?._id ? { _id: initial._id } : {}),
      title: form.title.trim(),
      category: form.category,
      type: form.type,
      tasks: parseTasks(form.tasksText),
      goalId: form.goalId || null,
      studentId: selectedStudentId,
      studentName: selectedStudentName,
    });
  };

  return (
    <div className="rd-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rd-modal rd-form-modal">
        <button className="rd-modal-close" onClick={onClose}>
          <X size={16} />
        </button>

        <div className="rd-form-header">
          <div className="rd-form-icon-preview">📋</div>
          <div>
            <h2 className="rd-form-title">{isEdit ? "✏️ Edit Routine" : "✨ New Routine"}</h2>
            <p className="rd-form-sub">Manage routines for {selectedStudentName || "student"}</p>
          </div>
        </div>

        <div className="rd-form-body">
          <div className="rd-field">
            <label className="rd-label">Title</label>
            <input
              className={`rd-input ${errors.title ? "error" : ""}`}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Routine title"
            />
            {errors.title && <span className="rd-error-msg">{errors.title}</span>}
          </div>

          <div className="rd-form-row-2">
            <div className="rd-field">
              <label className="rd-label">Category</label>
              <select
                className="rd-input"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              >
                <option value="morning">Morning</option>
                <option value="school">School</option>
                <option value="bedtime">Bedtime</option>
                <option value="study">Study</option>
                <option value="evening">Evening</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="rd-field">
              <label className="rd-label">Track</label>
              <select
                className="rd-input"
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
              >
                <option value="adhd">ADHD</option>
                <option value="autism">Autism</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>

          <div className="rd-field">
            <label className="rd-label">Tasks</label>
            <textarea
              className={`rd-input ${errors.tasksText ? "error" : ""}`}
              style={{ minHeight: 140 }}
              value={form.tasksText}
              onChange={(e) => set("tasksText", e.target.value)}
              placeholder={`One task per line
Brush teeth - 5 min
Eat breakfast - 15 min`}
            />
            {errors.tasksText && <span className="rd-error-msg">{errors.tasksText}</span>}
          </div>

          {!selectedStudentId && (
            <span className="rd-error-msg">Please select a child before saving.</span>
          )}
        </div>

        <div className="rd-confirm-actions">
          <button className="rd-ghost-btn" onClick={onClose}>Cancel</button>
          <button className="rd-primary-btn" onClick={handleSubmit}>
            {isEdit ? "Save Changes" : "Create Routine"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AiGenerateModal({ onClose, onGenerate, selectedDisability }) {
  const [form, setForm] = useState({
    childAge: "",
    disabilityType: selectedDisability || "adhd",
    wakeUpTime: "06:30",
    schoolTime: "07:30",
    studyTime: "17:00",
    sleepTime: "21:00",
    goals: "",
  });

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    onGenerate({
      ...form,
      goals: form.goals
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="rd-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rd-modal rd-form-modal">
        <button className="rd-modal-close" onClick={onClose}>
          <X size={16} />
        </button>

        <div className="rd-form-header">
          <div className="rd-form-icon-preview">🤖</div>
          <div>
            <h2 className="rd-form-title">AI Routine Generator</h2>
            <p className="rd-form-sub">Generate a balanced daily routine</p>
          </div>
        </div>

        <div className="rd-form-body">
          <div className="rd-form-row-2">
            <div className="rd-field">
              <label className="rd-label">Child Age</label>
              <input
                className="rd-input"
                value={form.childAge}
                onChange={(e) => set("childAge", e.target.value)}
                placeholder="Age"
              />
            </div>

            <div className="rd-field">
              <label className="rd-label">Disability Type</label>
              <select
                className="rd-input"
                value={form.disabilityType}
                onChange={(e) => set("disabilityType", e.target.value)}
              >
                <option value="adhd">ADHD</option>
                <option value="autism">Autism</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>

          <div className="rd-form-row-2">
            <div className="rd-field">
              <label className="rd-label">Wake-up Time</label>
              <input type="time" className="rd-input" value={form.wakeUpTime} onChange={(e) => set("wakeUpTime", e.target.value)} />
            </div>
            <div className="rd-field">
              <label className="rd-label">School Time</label>
              <input type="time" className="rd-input" value={form.schoolTime} onChange={(e) => set("schoolTime", e.target.value)} />
            </div>
          </div>

          <div className="rd-form-row-2">
            <div className="rd-field">
              <label className="rd-label">Study Time</label>
              <input type="time" className="rd-input" value={form.studyTime} onChange={(e) => set("studyTime", e.target.value)} />
            </div>
            <div className="rd-field">
              <label className="rd-label">Sleep Time</label>
              <input type="time" className="rd-input" value={form.sleepTime} onChange={(e) => set("sleepTime", e.target.value)} />
            </div>
          </div>

          <div className="rd-field">
            <label className="rd-label">Goals</label>
            <input
              className="rd-input"
              value={form.goals}
              onChange={(e) => set("goals", e.target.value)}
              placeholder="Focus, independence, bedtime calm"
            />
          </div>
        </div>

        <div className="rd-confirm-actions">
          <button className="rd-ghost-btn" onClick={onClose}>Cancel</button>
          <button className="rd-primary-btn" onClick={handleSubmit}>Generate</button>
        </div>
      </div>
    </div>
  );
}

function TemplateCard({ template, onAssign }) {
  return (
    <div className="rd-card">
      <div className="rd-card-top">
        <div className="rd-card-icon">🧩</div>
        <div className="rd-card-actions">
          <button className="rd-icon-btn" onClick={() => onAssign(template)}>
            <Plus size={15} />
          </button>
        </div>
      </div>

      <h3 className="rd-card-title">{template.title}</h3>
      <p className="rd-card-sub">
        {template.category} · {template.disabilityType} · {template.estimatedTime || 0} min
      </p>

      <div className="rd-task-tags">
        {(template.tasks || []).slice(0, 4).map((task, idx) => (
          <span className="rd-task-chip" key={idx}>{task.label}</span>
        ))}
      </div>
    </div>
  );
}

function RoutineCard({ routine, onEdit, onDelete }) {
  return (
    <div className="rd-card">
      <div className="rd-card-top">
        <div className="rd-card-icon">{routine.iconEmoji || "📋"}</div>

        <div className="rd-card-actions">
          <button className="rd-icon-btn" onClick={() => onEdit(routine)} title="Edit">
            <Pencil size={15} />
          </button>
          <button className="rd-icon-btn danger" onClick={() => onDelete(routine)} title="Delete">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <h3 className="rd-card-title">{routine.title}</h3>
      <p className="rd-card-sub">
        {routine.category} · {(routine.tasks || []).length} tasks · {routine.progress || 0}% complete
      </p>

      <div className="rd-task-tags">
        {(routine.tasks || []).slice(0, 4).map((task, idx) => (
          <span className="rd-task-chip" key={idx}>{task.label}</span>
        ))}
      </div>

      <div className="rd-card-foot">
        <span>⭐ {routine.rewards?.starsEarned || 0}</span>
        <span>
          🏅 {routine.rewards?.badgesEarned?.length ? routine.rewards.badgesEarned.join(", ") : "No badge yet"}
        </span>
      </div>
    </div>
  );
}

export default function RoutineDashboard() {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("brightsteps_user")) || null;
    } catch {
      return null;
    }
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState(user?._id || "");
  const [selectedStudentName, setSelectedStudentName] = useState(user?.name || "Student");
  const [selectedDisability, setSelectedDisability] = useState(
    (user?.diagnosis || "adhd").toLowerCase()
  );

  const [students] = useState([
    {
      _id: user?._id || "",
      name: user?.name || "Student",
      diagnosis: (user?.diagnosis || "adhd").toLowerCase(),
      age: user?.age || "",
    },
  ]);

  const [routines, setRoutines] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [showAiForm, setShowAiForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // loadRoutines, etc are defined here but we move the guard check later


  const loadRoutines = React.useCallback(async () => {
    try {
      setLoading(true);
      setApiError("");

      const data = await apiFetch(`/routines?studentId=${selectedStudentId}`);
      setRoutines(Array.isArray(data) ? data : []);
    } catch (err) {
      setApiError(err.message || "Failed to load routines");
      setRoutines([]);
    } finally {
      setLoading(false);
    }
  }, [selectedStudentId]);

  const loadTemplates = React.useCallback(async () => {
    try {
      const data = await apiFetch(`/templates?disabilityType=${encodeURIComponent(selectedDisability)}`);
      setTemplates(Array.isArray(data) ? data : []);
    } catch {
      setTemplates([]);
    }
  }, [selectedDisability]);

  const loadSummary = React.useCallback(async () => {
    try {
      const data = await apiFetch(`/routines/progress/summary?studentId=${selectedStudentId}`);
      setSummary(data);
    } catch {
      setSummary(null);
    }
  }, [selectedStudentId]);

  useEffect(() => {
    if (!selectedStudentId) return;
    loadRoutines();
    loadTemplates();
    loadSummary();
  }, [selectedStudentId, selectedDisability, loadRoutines, loadTemplates, loadSummary]);

  const filteredRoutines = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return routines;

    return routines.filter((r) => {
      const title = (r.title || "").toLowerCase();
      const tags = (r.tags || []).join(" ").toLowerCase();
      const tasks = (r.tasks || []).map((t) => t.label || "").join(" ").toLowerCase();
      return title.includes(q) || tags.includes(q) || tasks.includes(q);
    });
  }, [routines, searchQuery]);

  const totalStars = summary?.totalStars || 0;
  const completedRoutines = summary?.completedCount || 0;
  const completionPercentage = summary?.completionPercentage || 0;
  const earnedBadges = BADGES.filter((b) => totalStars >= b.threshold);
  const latestBadge = earnedBadges[earnedBadges.length - 1];

  const handleStudentChange = (value) => {
    const found = students.find((s) => s._id === value);
    setSelectedStudentId(value);
    setSelectedStudentName(found?.name || "Student");
    setSelectedDisability((found?.diagnosis || "adhd").toLowerCase());
  };

  const handleCreate = async (payload) => {
    try {
      await apiFetch("/routines", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setShowForm(false);
      await loadRoutines();
      await loadSummary();
    } catch (err) {
      alert(err.message || "Failed to create routine");
    }
  };

  const handleUpdate = async (payload) => {
    try {
      await apiFetch(`/routines/${payload._id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setEditTarget(null);
      await loadRoutines();
      await loadSummary();
    } catch (err) {
      alert(err.message || "Failed to update routine");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await apiFetch(`/routines/${deleteTarget._id}`, {
        method: "DELETE",
      });

      setDeleteTarget(null);
      await loadRoutines();
      await loadSummary();
    } catch (err) {
      alert(err.message || "Failed to delete routine");
    }
  };

  const handleAssignTemplate = async (template) => {
    try {
      await apiFetch("/routines/assign-template", {
        method: "POST",
        body: JSON.stringify({
          templateId: template._id,
          studentId: selectedStudentId,
          studentName: selectedStudentName,
        }),
      });

      await loadRoutines();
      await loadSummary();
    } catch (err) {
      alert(err.message || "Failed to assign template");
    }
  };

  const handleAiGenerate = async (payload) => {
    try {
      const data = await apiFetch("/routines/ai-generate", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setShowAiForm(false);
      setEditTarget(null);
      setShowForm(true);

      // open form already filled using editTarget pattern by direct create
      const aiPayload = {
        title: data.title || "AI Generated Routine",
        category: data.category || "custom",
        type: data.type || selectedDisability,
        tasks: data.tasks || [],
        goalId: null,
        studentId: selectedStudentId,
        studentName: selectedStudentName,
      };

      await handleCreate(aiPayload);
    } catch (err) {
      alert(err.message || "Failed to generate AI routine");
    }
  };

  // Auth/Role Guard
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "parent") return <Navigate to="/dashboard" replace />;

  return (
    <div className="rd-page">
      <div className="rd-hero">
        <div className="rd-blob rd-blob-1" aria-hidden="true" />
        <div className="rd-blob rd-blob-2" aria-hidden="true" />
        <div className="rd-blob rd-blob-3" aria-hidden="true" />
        <span className="rd-deco deco-star1" aria-hidden="true">⭐</span>
        <span className="rd-deco deco-star2" aria-hidden="true">✨</span>
        <span className="rd-deco deco-star3" aria-hidden="true">💫</span>
        <span className="rd-deco deco-cloud1" aria-hidden="true">☁️</span>
        <span className="rd-deco deco-cloud2" aria-hidden="true">🌤️</span>
        <span className="rd-deco deco-rocket" aria-hidden="true">🚀</span>
        <span className="rd-deco deco-rainbow" aria-hidden="true">🌈</span>
        <span className="rd-deco deco-balloon" aria-hidden="true">🎈</span>

        <div className="rd-hero-top">
          <Link to="/parent-dashboard" className="rd-back-link">
            <ArrowLeft size={17} /> Back
          </Link>

          <div className="rd-hero-right">
            <div className="rd-stars-chip">
              <span>⭐</span>
              <span>{totalStars} stars</span>
              {latestBadge && <span className="rd-latest-badge-chip">{latestBadge.emoji}</span>}
            </div>

            <button
              className="rd-report-link"
              onClick={() =>
                generateReportPDF({
                  studentName: selectedStudentName,
                  totalStars,
                  completedRoutines,
                  earnedBadges,
                  completionPercentage,
                })
              }
            >
              <Download size={15} /> Report
            </button>
          </div>
        </div>

        <div className="rd-hero-title-block">
          <div className="rd-hero-emoji-row" aria-hidden="true">
            <span>📅</span>
            <span>🧩</span>
            <span>⭐</span>
            <span>🤖</span>
            <span>🏆</span>
          </div>

          <h1 className="rd-hub-title">
            <span className="rd-tw rd-tw-rose">Routine</span>
            <span className="rd-tw rd-tw-amber">Manager</span>
          </h1>

          <p className="rd-hub-subtitle">
            Plan, assign, and monitor routines for {selectedStudentName}.
          </p>

          <div className="rd-hero-stats">
            <span className="rd-stat-pill rd-sp-rose">📋 {routines.length} Assigned</span>
            <span className="rd-stat-pill rd-sp-amber">⭐ {totalStars} Stars</span>
            <span className="rd-stat-pill rd-sp-sage">✅ {completionPercentage}% Complete</span>
          </div>
        </div>
      </div>

      <div className="rd-tab-bar">
        <div className="rd-tab-bar-inner">
          <div className="rd-tabs">
            <select
              className="rd-search"
              value={selectedStudentId}
              onChange={(e) => handleStudentChange(e.target.value)}
            >
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name} ({student.diagnosis})
                </option>
              ))}
            </select>
          </div>

          <div className="rd-search-wrap">
            <Search size={15} className="rd-search-icon" />
            <input
              className="rd-search"
              placeholder="Search routines…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="rd-search-clear" onClick={() => setSearchQuery("")}>
                <X size={13} />
              </button>
            )}
          </div>

          <button className="rd-create-btn" onClick={() => setShowAiForm(true)}>
            <Sparkles size={16} /> AI Generate
          </button>

          <button className="rd-create-btn" onClick={() => setShowForm(true)}>
            <Plus size={16} /> New Routine
          </button>
        </div>
      </div>

      <section className="rd-cards-section">
        {apiError && <div className="rd-api-notice">⚠️ {apiError}</div>}

        <div className="rd-cards-heading">
          <h2>
            My Routines <span className="rd-count-chip">{filteredRoutines.length}</span>
          </h2>
        </div>

        {summary && (
          <div className="rd-game-cards-wrapper" style={{ marginBottom: 24 }}>
            <div className="rd-card">
              <h3 className="rd-card-title">📋 Total Assigned</h3>
              <p className="rd-card-sub">{summary.totalAssigned || 0} routines</p>
            </div>
            <div className="rd-card">
              <h3 className="rd-card-title">✅ Completed</h3>
              <p className="rd-card-sub">{summary.completedCount || 0} routines</p>
            </div>
            <div className="rd-card">
              <h3 className="rd-card-title">📊 Completion</h3>
              <p className="rd-card-sub">{summary.completionPercentage || 0}% complete</p>
            </div>
          </div>
        )}

        <div className="rd-cards-heading">
          <h2>
            🧩 Templates <span className="rd-count-chip">{templates.length}</span>
          </h2>
        </div>

        {templates.length > 0 && (
          <div className="rd-game-cards-wrapper" style={{ marginBottom: 28 }}>
            {templates.map((template, i) => (
              <div key={template._id} className="rd-card-anim" style={{ animationDelay: `${i * 0.05}s` }}>
                <TemplateCard template={template} onAssign={handleAssignTemplate} />
              </div>
            ))}
          </div>
        )}

        <div className="rd-cards-heading">
          <h2>
            📅 Assigned Routines <span className="rd-count-chip">{filteredRoutines.length}</span>
          </h2>
        </div>

        {loading ? (
          <div className="rd-loading">
            <div className="rd-spinner" />
            <p>Loading routines…</p>
          </div>
        ) : filteredRoutines.length === 0 ? (
          <div className="rd-empty">
            <span>📭</span>
            <p>No routines found.</p>
          </div>
        ) : (
          <div className="rd-game-cards-wrapper">
            {filteredRoutines.map((routine, i) => (
              <div key={routine._id} className="rd-card-anim" style={{ animationDelay: `${i * 0.06}s` }}>
                <RoutineCard
                  routine={routine}
                  onEdit={setEditTarget}
                  onDelete={setDeleteTarget}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="rd-footer-section">
        <div className="rd-encourage-row">
          <div className="rd-encourage-card">
            <span className="rd-ec-emoji">🏆</span>
            <div className="rd-ec-text">
              <h3>Keep routines consistent</h3>
              <p>Templates + AI + tracking help parents guide daily habits smoothly.</p>
            </div>
          </div>

          <div className="rd-encourage-card">
            <span className="rd-ec-emoji">💛</span>
            <div className="rd-ec-text">
              <h3>Progress stays child-focused</h3>
              <p>Only assigned routines flow into the student experience.</p>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <RoutineFormModal
          onSave={handleCreate}
          onClose={() => setShowForm(false)}
          selectedStudentId={selectedStudentId}
          selectedStudentName={selectedStudentName}
        />
      )}

      {editTarget && (
        <RoutineFormModal
          initial={editTarget}
          onSave={handleUpdate}
          onClose={() => setEditTarget(null)}
          selectedStudentId={selectedStudentId}
          selectedStudentName={selectedStudentName}
        />
      )}

      {showAiForm && (
        <AiGenerateModal
          selectedDisability={selectedDisability}
          onClose={() => setShowAiForm(false)}
          onGenerate={handleAiGenerate}
        />
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