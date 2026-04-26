import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  ArrowLeft, Trophy, Target, Search, Star, Heart, Clock,
  ChevronDown, ChevronUp, Minimize2, Maximize2, CheckCircle2,
  Zap, Eye, Leaf, LayoutGrid, List, X, Sparkles,
} from "lucide-react";

const API_BASE = process.env.REACT_APP_API_URL || "/api";

/* ─── CATEGORY META ─── */
const CAT = {
  morning: { color: "#C8881A", bg: "#FEF4CC", border: "#F2B53A", label: "Morning" },
  school:  { color: "#2478A4", bg: "#E1F3FB", border: "#44A7CE", label: "School"  },
  bedtime: { color: "#6B52B0", bg: "#EDEAFA", border: "#9C80D2", label: "Bedtime"},
  study:   { color: "#1E8C78", bg: "#E0F7F3", border: "#3DB5A0", label: "Study"   },
  evening: { color: "#C0422F", bg: "#FDEAE6", border: "#E85C45", label: "Evening" },
  custom:  { color: "#3D8450", bg: "#E2F6E7", border: "#5EAD6E", label: "Custom"  },
};

const TYPE_COLORS = {
  adhd:    { color: "#44A7CE", bg: "#E1F3FB" },
  autism:  { color: "#9C80D2", bg: "#EDEAFA" },
  general: { color: "#3DB5A0", bg: "#E0F7F3" },
};

/* ─── PROGRESS RING ─── */
function ProgressRing({ pct, size = 52, stroke = 5, color = "var(--mint-deep,#3dbf9a)" }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--mint,#d4f5ec)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s cubic-bezier(0.34,1.56,0.64,1)" }} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size/2}px ${size/2}px`,
          fill: "var(--text-dark,#2d3a35)", fontFamily: "'Fredoka One',cursive", fontSize: size * 0.24 }}>
        {pct}%
      </text>
    </svg>
  );
}

/* ─── CELEBRATION OVERLAY ─── */
function CelebrationOverlay({ routineTitle, onDismiss }) {
  return (
    <div className="sr-overlay" onClick={onDismiss}>
      <div className="sr-celebration">
        <div className="sr-cel-emojis">🎈 🌟 🎉 🏆 ✨ 🌈</div>
        <h2 className="sr-cel-title">AMAZING JOB! 🌟</h2>
        <p className="sr-cel-sub">You finished <strong>{routineTitle}</strong>!</p>
        <p className="sr-cel-msg">You are a superstar! Keep up the great work! 🚀</p>
        <div className="sr-cel-stars">
          <Star className="s1" size={28} fill="#f5c842" color="#f5c842" />
          <Heart className="s2" size={24} fill="#f28b60" color="#f28b60" />
          <Star className="s3" size={32} fill="#4ab3e8" color="#4ab3e8" />
        </div>
        <button className="sr-cel-dismiss" onClick={onDismiss}>Continue ✨</button>
      </div>
    </div>
  );
}

/* ─── TASK ITEM ─── */
function TaskItem({ task, routineId, index, started, isDone, showMotivation, onToggle, catColor }) {
  return (
    <label className={`sr-task-item ${task.completed ? "done" : ""} ${!started && !isDone ? "locked" : ""}`}>
      <input type="checkbox" className="sr-checkbox" checked={!!task.completed}
        disabled={!started && !isDone}
        onChange={(e) => onToggle(routineId, index, e.target.checked)} />
      <div className="sr-task-check" style={{ borderColor: task.completed ? catColor : "var(--mint,#d4f5ec)", background: task.completed ? catColor : "white" }}>
        {task.completed && <CheckCircle2 size={14} color="white" />}
      </div>
      <div className="sr-task-content">
        <span className="sr-task-label">{task.label}</span>
        <div className="sr-task-right">
          {task.completed && showMotivation && (
            <span className="sr-nice-tag">✨ Nice!</span>
          )}
          {task.mins > 0 && (
            <span className="sr-task-mins"><Clock size={10} /> {task.mins}m</span>
          )}
        </div>
      </div>
    </label>
  );
}

/* ─── ROUTINE CARD ─── */
function RoutineCard({ routine, started, onStart, onToggleTask, showMotivation, isDone, focusMode, viewMode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);

  const cat = CAT[routine.category] || CAT.custom;
  const typeC = TYPE_COLORS[routine.type] || TYPE_COLORS.general;

  const completedCount = (routine.tasks || []).filter((t) => t.completed).length;
  const totalCount = (routine.tasks || []).length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // In focus mode, show only the next incomplete task
  const displayTasks = useMemo(() => {
    const tasks = (routine.tasks || []).map((t, i) => ({ ...t, originalIndex: i }));
    if (focusMode && !isDone) {
      const nextIdx = tasks.findIndex((t) => !t.completed);
      return nextIdx !== -1 ? [tasks[nextIdx]] : tasks.slice(-1);
    }
    return tasks;
  }, [routine.tasks, focusMode, isDone]);

  const visibleTasks = showAllTasks ? displayTasks : displayTasks.slice(0, 3);
  const hasMore = displayTasks.length > 3 && !showAllTasks;
  const totalMins = (routine.tasks || []).reduce((s, t) => s + (t.mins || 0), 0);

  if (viewMode === "list") {
    return (
      <div className="sr-list-item" style={{ "--cat-color": cat.color, "--cat-bg": cat.bg }}>
        <div className="sr-list-emoji" style={{ background: cat.bg }}>{routine.iconEmoji || "📋"}</div>
        <div className="sr-list-info">
          <span className="sr-list-title">{routine.title}</span>
          <div className="sr-list-meta">
            <span className="sr-chip-tiny" style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
            <span className="sr-chip-tiny" style={{ background: typeC.bg, color: typeC.color }}>{routine.type?.toUpperCase()}</span>
            {totalMins > 0 && <span className="sr-chip-tiny sr-chip-clock"><Clock size={10} /> {totalMins}m</span>}
          </div>
        </div>
        <div className="sr-list-right">
          <ProgressRing pct={pct} size={42} stroke={4} color={cat.color} />
          <span className="sr-star-ct">⭐ {routine.rewards?.starsEarned || 0}</span>
          {!isDone && (
            <button className={`sr-start-btn-sm ${started ? "active" : ""}`} onClick={() => onStart(routine._id)}>
              {started ? "🚀 Going!" : "▶️ Start"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`sr-card ${isDone ? "sr-card-done" : ""} ${collapsed ? "sr-card-collapsed" : ""}`}
      style={{ "--cat-color": cat.color, "--cat-bg": cat.bg, "--cat-border": cat.border }}>

      {/* Focus mode hint */}
      {focusMode && !isDone && !collapsed && (
        <div className="sr-focus-hint">
          <Eye size={12} /> Just focus on this one step!
        </div>
      )}

      {/* Card header */}
      <div className="sr-card-head">
        <div className="sr-card-emoji" style={{ background: cat.bg }}>{routine.iconEmoji || "📋"}</div>
        <div className="sr-card-head-info">
          <h3 className="sr-card-title">{routine.title}</h3>
          {!collapsed && (
            <div className="sr-chip-row">
              <span className="sr-chip-tiny" style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
              <span className="sr-chip-tiny" style={{ background: typeC.bg, color: typeC.color }}>{routine.type?.toUpperCase()}</span>
              {totalMins > 0 && <span className="sr-chip-tiny sr-chip-clock"><Clock size={10} />{totalMins}m</span>}
            </div>
          )}
          {routine.sourceTemplateId && (
            <div className="sr-recommended-badge">
              <Sparkles size={10} /> Recommended by Parent
            </div>
          )}
        </div>
        {/* Window controls */}
        <div className="sr-card-controls">
          <button className="sr-ctrl" onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand" : "Minimise"} aria-label={collapsed ? "Expand card" : "Minimise card"}>
            {collapsed ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
          </button>
          {!isDone && !collapsed && (
            <button className={`sr-ctrl start ${started ? "active" : ""}`}
              onClick={() => onStart(routine._id)} title={started ? "In progress" : "Start routine"}
              aria-label={started ? "Routine started" : "Start routine"}>
              {started ? "🚀" : "▶️"}
            </button>
          )}
        </div>
      </div>

      {/* Collapsed pill bar */}
      {collapsed && (
        <div className="sr-collapsed-bar">
          <ProgressRing pct={pct} size={36} stroke={3.5} color={cat.color} />
          <span className="sr-star-ct">⭐ {routine.rewards?.starsEarned || 0}</span>
          {isDone && <span className="sr-done-chip">✅ Done!</span>}
        </div>
      )}

      {/* Full body */}
      {!collapsed && (
        <>
          {/* Progress row */}
          <div className="sr-progress-row">
            <ProgressRing pct={pct} size={54} stroke={5} color={cat.color} />
            <div className="sr-progress-info">
              <span className="sr-progress-label">{completedCount}/{totalCount} tasks done</span>
              {routine.goal && (
                <div className="sr-goal-row">
                  <Target size={12} color={cat.color} />
                  <span className="sr-goal-text">{routine.goal}</span>
                </div>
              )}
              <span className="sr-star-ct">⭐ {routine.rewards?.starsEarned || 0} stars earned</span>
            </div>
          </div>

          {/* Task list */}
          <div className="sr-task-list">
            {visibleTasks.map((task) => (
              <TaskItem key={task.originalIndex} task={task} routineId={routine._id}
                index={task.originalIndex} started={started} isDone={isDone}
                showMotivation={showMotivation} onToggle={onToggleTask} catColor={cat.color} />
            ))}
            {hasMore && (
              <button className="sr-show-more" onClick={() => setShowAllTasks(true)}>
                +{displayTasks.length - 3} more tasks <ChevronDown size={12} />
              </button>
            )}
            {showAllTasks && displayTasks.length > 3 && (
              <button className="sr-show-more" onClick={() => setShowAllTasks(false)}>
                Show less <ChevronUp size={12} />
              </button>
            )}
          </div>

          {/* Card footer */}
          <div className="sr-card-footer">
            {isDone ? (
              <span className="sr-status-chip done">🏆 Routine Complete!</span>
            ) : (
              <span className="sr-status-chip info" style={{ background: cat.bg, color: cat.color }}>
                ✨ {totalCount - completedCount} tasks left
              </span>
            )}
            {!isDone && !started && (
              <button className="sr-start-btn" onClick={() => onStart(routine._id)}>
                ▶️ Start
              </button>
            )}
            {started && !isDone && (
              <span className="sr-doing-chip">🚀 Doing it!</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── MAIN PAGE ─── */
export default function StudentRoutinePage() {
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [studentName, setStudentName] = useState("Explorer");
  const [startedRoutineId, setStartedRoutineId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showMotivation, setShowMotivation] = useState(false);
  const [celebrationId, setCelebrationId] = useState(null);
  const [balloons, setBalloons] = useState([]);
  const [focusMode, setFocusMode] = useState(false);
  const [calmMode, setCalmMode] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [doneSectionOpen, setDoneSectionOpen] = useState(true);

  // Fetch routines on mount
  useEffect(() => {
    const userStr = localStorage.getItem("brightsteps_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setStudentName(user.name?.split(" ")[0] || "Explorer");
    }
    fetchRoutines();
  }, []);

  const fetchRoutines = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("brightsteps_token");
      const res = await fetch(`${API_BASE}/routines/student`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch routines");
      setRoutines(data);
    } catch (err) {
      console.error("Fetch routines error:", err);
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const todayName = days[new Date().getDay()];
  const todayEmojis = ["☀️","🌞","⛅","🌈","✨","🌤️","🎯"];
  const todayEmoji = todayEmojis[new Date().getDay()];

  const launchBalloons = useCallback(() => {
    if (calmMode) return;
    const items = Array.from({ length: 10 }).map((_, i) => ({
      id: Date.now() + i,
      left: Math.random() * 85 + 5,
      delay: Math.random() * 0.6,
      emoji: ["🎈","✨","🌟","🎉","💫","⭐"][Math.floor(Math.random() * 6)],
    }));
    setBalloons((p) => [...p, ...items]);
    setTimeout(() => setBalloons((p) => p.filter((b) => !items.find((n) => n.id === b.id))), 3200);
  }, [calmMode]);

  const handleStart = (id) => setStartedRoutineId(id);

  const handleToggleTask = async (routineId, taskIndex, completed) => {
    // Optimistic update
    setRoutines((prev) =>
      prev.map((r) => {
        if (r._id !== routineId) return r;
        const newTasks = [...r.tasks];
        newTasks[taskIndex] = { ...newTasks[taskIndex], completed };
        const allDone = newTasks.every((t) => t.completed);
        return {
          ...r,
          tasks: newTasks,
          completed: allDone,
          progress: Math.round((newTasks.filter((t) => t.completed).length / newTasks.length) * 100),
        };
      })
    );

    if (completed) {
      setShowMotivation(true);
      launchBalloons();
      setTimeout(() => setShowMotivation(false), 2800);
    }

    try {
      const token = localStorage.getItem("brightsteps_token");
      const res = await fetch(`${API_BASE}/routines/progress`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ routineId, taskIndex, completed }),
      });
      const updatedRoutine = await res.json();
      if (!res.ok) throw new Error(updatedRoutine.message || "Update failed");

      // Sync with server response
      setRoutines((prev) => prev.map((r) => (r._id === routineId ? updatedRoutine : r)));

      if (updatedRoutine.completed && completed && !calmMode) {
        setCelebrationId(routineId);
        setTimeout(() => setCelebrationId(null), 5000);
      }
    } catch (err) {
      console.error("Update progress failed:", err);
      // Fallback: refetch to ensure consistency
      fetchRoutines();
    }
  };

  const filteredRoutines = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return routines.filter((r) => {
      const matchSearch = !q || r.title.toLowerCase().includes(q) ||
        (r.tasks || []).some((t) => t.label.toLowerCase().includes(q));
      const matchType = filterType === "all" || (r.type || "").toLowerCase() === filterType;
      return matchSearch && matchType;
    });
  }, [routines, searchQuery, filterType]);

  const [recommendedRoutines, activeRoutines, doneRoutines] = useMemo(() => {
    const rec = [], act = [], done = [];
    filteredRoutines.forEach((r) => {
      if (r.completed) {
        done.push(r);
      } else if (r.sourceTemplateId) {
        rec.push(r);
      } else {
        act.push(r);
      }
    });
    return [rec, act, done];
  }, [filteredRoutines]);

  const focusRoutine = activeRoutines[0];
  const totalStars = routines.reduce((s, r) => s + (r.rewards?.starsEarned || 0), 0);
  const overallPct = routines.length
    ? Math.round(routines.reduce((s, r) => s + r.progress, 0) / routines.length)
    : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Baloo+2:wght@500;600;700;800&family=Nunito:wght@400;600;700;800;900&display=swap');
        
        :root {
          --paper: #FEFCF5;
          --ink: #1E1007;
          --ink-mid: #6B4C30;
          --ink-soft: #B8906A;
          --r-lg: 32px;
          --r-pill: 999px;
          --sh-card: 0 8px 0 rgba(30,16,7,0.06), 0 20px 50px rgba(30,16,7,0.1);
          --sh-spot: 0 12px 0 rgba(61,181,160,0.15), 0 24px 60px rgba(61,181,160,0.1);
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .sr-page {
          min-height: 100vh;
          background-color: var(--paper);
          font-family: 'Nunito', sans-serif;
          color: var(--ink);
          background-image:
            radial-gradient(ellipse 800px 600px at 0% 0%,   rgba(254,244,204,0.6)  0%, transparent 60%),
            radial-gradient(ellipse 600px 500px at 100% 0%,  rgba(253,234,230,0.5)  0%, transparent 55%),
            radial-gradient(ellipse 700px 600px at 0% 100%,  rgba(224,247,243,0.4)  0%, transparent 55%),
            radial-gradient(ellipse 500px 400px at 100% 100%,rgba(237,234,250,0.3) 0%, transparent 55%);
          background-attachment: fixed;
        }

        /* ── HERO ── */
        .sr-hero {
          position: relative; overflow: hidden;
          background: linear-gradient(135deg, #E0F7F3 0%, #E1F3FB 55%, #FEF4CC 100%);
          padding: 28px 24px 44px;
        }
        .sr-blob { position: absolute; border-radius: 50%; filter: blur(48px); opacity: 0.4; pointer-events: none; }
        .sr-blob-1 { width: 260px; height: 260px; background: var(--lavender,#e8e0ff); top: -80px; right: -40px; }
        .sr-blob-2 { width: 200px; height: 200px; background: var(--peach,#fde8d8); bottom: -40px; left: 0; }
        .sr-blob-3 { width: 160px; height: 160px; background: var(--mint,#d4f5ec); top: 20px; left: 40%; }

        .sr-deco { position: absolute; pointer-events: none; user-select: none; }
        .sr-deco.d1 { top: 14px;  right: 16%; font-size: 1.6rem; animation: fA 4s ease-in-out infinite; }
        .sr-deco.d2 { top: 48px;  right: 7%;  font-size: 1.1rem; animation: fB 5s ease-in-out infinite; }
        .sr-deco.d3 { bottom: 16px; left: 10%; font-size: 1.3rem; animation: fA 3.5s ease-in-out infinite; }
        .sr-deco.d4 { bottom: 10px; right: 20%; font-size: 1.8rem; animation: fB 6s ease-in-out infinite; }

        @keyframes fA { 0%,100%{ transform:translateY(0) rotate(-5deg);} 50%{ transform:translateY(-10px) rotate(5deg);} }
        @keyframes fB { 0%,100%{ transform:translateY(0);} 50%{ transform:translateY(-13px);} }

        .sr-hero-top { display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 2; margin-bottom: 22px; }

        .sr-back-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: white; border: none; padding: 9px 18px; border-radius: 999px;
          font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 0.9rem;
          color: var(--text-dark,#2d3a35); cursor: pointer; text-decoration: none;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .sr-back-btn:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.1); }

        .sr-hero-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

        .sr-stars-chip {
          display: flex; align-items: center; gap: 6px;
          background: white; border-radius: 999px; padding: 8px 16px;
          font-family: 'Fredoka One', cursive; font-size: 0.95rem;
          color: var(--yellow-deep,#e6b800); box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .sr-hero-body { position: relative; z-index: 2; text-align: center; }

        .sr-hero-emoji-row { display: flex; justify-content: center; gap: 14px; font-size: 1.8rem; margin-bottom: 10px; }
        .sr-hero-emoji-row span { display: inline-block; animation: fA 3s ease-in-out infinite; }
        .sr-hero-emoji-row span:nth-child(2n) { animation: fB 4s ease-in-out infinite; }

        .sr-title {
          font-family: 'Fredoka One', cursive;
          font-size: clamp(2rem, 6vw, 3.2rem);
          color: var(--ink); margin-bottom: 8px;
          letter-spacing: -0.5px;
        }
        .sr-subtitle { 
          font-family: 'Baloo 2', cursive;
          font-size: 1.1rem; font-weight: 700; color: var(--ink-mid); line-height: 1.4; margin-bottom: 20px; 
        }
        .sr-tagline { font-weight: 800; color: #1E8C78; }

        /* Overall progress bar */
        .sr-overall-bar-wrap { max-width: 420px; margin: 0 auto 16px; }
        .sr-overall-bar-label { display: flex; justify-content: space-between; font-size: 0.82rem; font-weight: 700; color: var(--text-mid,#6b7c75); margin-bottom: 6px; }
        .sr-overall-track { height: 12px; background: rgba(255,255,255,0.5); border-radius: 999px; overflow: hidden; }
        .sr-overall-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--mint-deep,#3dbf9a), var(--sky-deep,#4ab3e8)); transition: width 0.7s cubic-bezier(0.34,1.56,0.64,1); }

        /* Mode toggles */
        .sr-mode-row { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }
        .sr-mode-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 18px; border-radius: 999px; border: 2px solid transparent;
          background: white; font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 0.85rem;
          color: var(--text-mid,#6b7c75); cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.07);
          transition: all 0.2s ease;
        }
        .sr-mode-btn:hover { transform: translateY(-2px); }
        .sr-mode-btn.active { background: linear-gradient(135deg, var(--mint-deep,#3dbf9a), var(--sky-deep,#4ab3e8)); color: white; border-color: transparent; box-shadow: 0 6px 18px rgba(61,191,154,0.3); }
        .sr-mode-btn.calm.active { background: linear-gradient(135deg, var(--lavender,#e8e0ff), #c8b8f8); color: #6040c0; }

        /* ── STICKY TOOLBAR ── */
        .sr-toolbar {
          position: sticky; top: 0; z-index: 40;
          background: rgba(255,252,245,0.95); backdrop-filter: blur(12px);
          border-bottom: 2px solid rgba(30,16,7,0.06);
          padding: 14px 20px;
        }
        .sr-toolbar-inner { max-width: 900px; margin: 0 auto; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

        .sr-search-wrap { flex: 1; min-width: 180px; max-width: 320px; position: relative; display: flex; align-items: center; }
        .sr-search-icon-pos { position: absolute; left: 16px; color: var(--ink-soft); pointer-events: none; }
        .sr-search {
          width: 100%; padding: 12px 36px 12px 42px;
          border-radius: var(--r-pill); border: 2.5px solid rgba(30,16,7,0.1);
          background: white; font-family: 'Baloo 2', cursive;
          font-size: 0.95rem; font-weight: 600; color: var(--ink); outline: none;
          transition: all 0.2s;
        }
        .sr-search:focus { border-color: #E85C45; box-shadow: 0 0 0 4px rgba(232,92,69,0.1); }
        .sr-search-clear { position: absolute; right: 14px; background: none; border: none; cursor: pointer; color: var(--ink-soft); display: flex; align-items: center; }

        .sr-filter-pills { display: flex; gap: 8px; flex-wrap: wrap; }
        .sr-filter-pill {
          padding: 8px 16px; border-radius: var(--r-pill); border: 2.5px solid rgba(30,16,7,0.08);
          background: white; font-family: 'Baloo 2', cursive;
          font-weight: 700; font-size: 0.85rem; color: var(--ink-mid);
          cursor: pointer; transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        .sr-filter-pill:hover { border-color: #3DB5A0; color: #1E8C78; transform: translateY(-2px); }
        .sr-filter-pill.active { background: #3DB5A0; border-color: transparent; color: white; box-shadow: 0 4px 12px rgba(61,181,160,0.3); }

        .sr-view-toggle { display: flex; gap: 4px; background: rgba(30,16,7,0.05); border-radius: var(--r-pill); padding: 4px; border: 1.5px solid rgba(30,16,7,0.05); }
        .sr-view-btn { width: 34px; height: 34px; border-radius: var(--r-pill); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; background: transparent; color: var(--ink-soft); transition: all 0.2s; }
        .sr-view-btn.active { background: white; color: #3DB5A0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

        /* ── BODY ── */
        .sr-body { max-width: 900px; margin: 0 auto; padding: 24px 20px 60px; }

        /* FOCUS SPOTLIGHT */
        .sr-focus-spotlight {
          background: white; border-radius: var(--r-lg);
          border-bottom: 8px solid #3DB5A0;
          box-shadow: var(--sh-spot);
          padding: 28px 32px; margin-bottom: 32px;
          display: flex; gap: 24px; align-items: center; flex-wrap: wrap;
          animation: cardIn 0.4s cubic-bezier(0.34,1.56,0.64,1);
          position: relative;
          overflow: hidden;
        }
        .sr-focus-spotlight::before {
          content: '🎯'; position: absolute; right: -10px; top: -10px; font-size: 8rem; opacity: 0.05; pointer-events: none;
        }
        .sr-spotlight-icon { font-size: 4rem; flex-shrink: 0; filter: drop-shadow(0 8px 16px rgba(0,0,0,0.1)); }
        .sr-spotlight-body { flex: 1; min-width: 200px; position: relative; z-index: 2; }
        .sr-spotlight-label { font-family: 'Baloo 2', cursive; font-size: 0.9rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #3DB5A0; margin-bottom: 6px; }
        .sr-spotlight-title { font-family: 'Fredoka One', cursive; font-size: 1.8rem; color: var(--ink); margin-bottom: 6px; }
        .sr-spotlight-sub { font-family: 'Nunito', sans-serif; font-size: 1rem; font-weight: 700; color: var(--ink-mid); margin-bottom: 20px; }
        .sr-spotlight-start {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 24px; border-radius: 999px; border: none; cursor: pointer;
          background: linear-gradient(135deg, var(--mint-deep,#3dbf9a), var(--sky-deep,#4ab3e8));
          color: white; font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 0.95rem;
          box-shadow: 0 6px 18px rgba(61,191,154,0.35);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .sr-spotlight-start:hover { transform: translateY(-3px); box-shadow: 0 10px 26px rgba(61,191,154,0.4); }
        .sr-spotlight-start.active { background: linear-gradient(135deg, var(--peach-deep,#f28b60), #f5a070); box-shadow: 0 6px 18px rgba(242,139,96,0.35); }

        /* SECTION */
        .sr-section { margin-bottom: 28px; }
        .sr-section-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .sr-section-title { font-family: 'Fredoka One', cursive; font-size: 1.2rem; color: var(--text-dark,#2d3a35); flex: 1; display: flex; align-items: center; gap: 8px; }
        .sr-count-chip { display: inline-flex; align-items: center; justify-content: center; background: var(--mint,#d4f5ec); color: var(--mint-deep,#3dbf9a); font-family: 'Nunito', sans-serif; font-size: 0.78rem; font-weight: 800; min-width: 24px; height: 24px; border-radius: 999px; padding: 0 7px; }
        .sr-section-toggle { width: 32px; height: 32px; border-radius: 50%; background: var(--mint,#d4f5ec); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--mint-deep,#3dbf9a); transition: all 0.2s; }
        .sr-section-toggle:hover { background: var(--mint-deep,#3dbf9a); color: white; }

        /* CARDS GRID / LIST */
        .sr-cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 16px; }
        .sr-cards-list { display: flex; flex-direction: column; gap: 10px; }

        /* ROUTINE CARD */
        .sr-card {
          background: white; border-radius: var(--r-lg);
          border-bottom: 6px solid var(--cat-border, #3DB5A0);
          box-shadow: var(--sh-card);
          padding: 22px; transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
          animation: cardIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
          border-top: 1px solid rgba(255,255,255,0.8);
        }
        .sr-card:hover { transform: translateY(-8px); box-shadow: 0 15px 0 rgba(30,16,7,0.06), 0 30px 60px rgba(30,16,7,0.12); }
        .sr-card-done { opacity: 0.85; filter: saturate(0.8); }
        .sr-card-collapsed { padding-bottom: 16px; }

        @keyframes cardIn { from{ opacity:0; transform:translateY(14px) scale(0.97);} to{ opacity:1; transform:none;} }

        .sr-focus-hint {
          display: flex; align-items: center; gap: 6px;
          background: var(--sky,#cce8ff); color: var(--sky-deep,#4ab3e8);
          font-size: 0.78rem; font-weight: 700; padding: 6px 12px; border-radius: 999px;
          margin-bottom: 12px; width: fit-content;
        }

        .sr-card-head { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
        .sr-card-emoji { width: 42px; height: 42px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0; }
        .sr-card-head-info { flex: 1; min-width: 0; }
        .sr-card-title { font-family: 'Fredoka One', cursive; font-size: 1rem; color: var(--text-dark,#2d3a35); line-height: 1.2; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .sr-chip-row { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 3px; }
        .sr-chip-tiny { display: inline-flex; align-items: center; gap: 3px; padding: 2px 9px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; }
        .sr-chip-clock { background: var(--mint,#d4f5ec) !important; color: var(--mint-deep,#3dbf9a) !important; }

        .sr-card-controls { display: flex; gap: 4px; flex-shrink: 0; align-items: flex-start; }
        .sr-ctrl { width: 30px; height: 30px; border-radius: 50%; background: var(--bg,#eaf9f5); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-mid,#6b7c75); font-size: 0.9rem; transition: all 0.15s ease; }
        .sr-ctrl:hover { background: var(--mint,#d4f5ec); color: var(--mint-deep,#3dbf9a); transform: scale(1.1); }
        .sr-ctrl.start { background: var(--peach,#fde8d8); }
        .sr-ctrl.start.active { background: var(--peach-deep,#f28b60); color: white; }

        .sr-collapsed-bar { display: flex; align-items: center; gap: 10px; padding-top: 0; }

        .sr-progress-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .sr-progress-info { display: flex; flex-direction: column; gap: 3px; }
        .sr-progress-label { font-family: 'Fredoka One', cursive; font-size: 0.95rem; color: var(--text-dark,#2d3a35); }
        .sr-goal-row { display: flex; align-items: center; gap: 5px; }
        .sr-goal-text { font-size: 0.78rem; color: var(--text-mid,#6b7c75); font-style: italic; }
        .sr-star-ct { font-size: 0.8rem; font-weight: 700; color: var(--text-mid,#6b7c75); }

        /* TASK LIST */
        .sr-task-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }

        .sr-task-item {
          display: flex; align-items: center; gap: 14px;
          padding: 12px 16px; border-radius: 20px; cursor: pointer;
          background: #F0FBF8; transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
          border: 2px solid transparent;
        }
        .sr-task-item:not(.locked):hover { 
          background: white; border-color: var(--cat-border, #3DB5A0); 
          transform: scale(1.02) translateX(4px); 
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .sr-task-item.done { opacity: 0.7; background: rgba(255,255,255,0.5); }
        .sr-task-item.done .sr-task-label { text-decoration: line-through; color: var(--ink-soft); }
        .sr-task-item.locked { cursor: not-allowed; opacity: 0.5; }

        input.sr-checkbox { display: none; }

        .sr-task-check {
          width: 28px; height: 28px; border-radius: 10px; border: 3px solid;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
          background: white;
        }
        .sr-task-item:hover .sr-task-check { transform: scale(1.1); }

        .sr-task-content { flex: 1; display: flex; align-items: center; justify-content: space-between; gap: 8px; min-width: 0; }
        .sr-task-label { font-size: 0.88rem; font-weight: 700; color: var(--text-dark,#2d3a35); }
        .sr-task-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .sr-nice-tag { background: var(--mint,#d4f5ec); color: var(--mint-deep,#3dbf9a); font-size: 0.72rem; font-weight: 800; padding: 2px 9px; border-radius: 999px; }
        .sr-task-mins { display: flex; align-items: center; gap: 3px; font-size: 0.75rem; font-weight: 700; color: var(--text-mid,#6b7c75); background: white; padding: 2px 8px; border-radius: 999px; }

        .sr-show-more { display: inline-flex; align-items: center; gap: 4px; background: none; border: none; cursor: pointer; font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 0.8rem; color: var(--mint-deep,#3dbf9a); padding: 4px 0; transition: color 0.15s; }
        .sr-show-more:hover { color: var(--sky-deep,#4ab3e8); }

        /* CARD FOOTER */
        .sr-card-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }

        .sr-status-chip { display: inline-flex; align-items: center; gap: 4px; padding: 5px 12px; border-radius: 999px; font-size: 0.78rem; font-weight: 700; }
        .sr-status-chip.done { background: var(--mint,#d4f5ec); color: var(--mint-deep,#3dbf9a); }
        .sr-done-chip { display: inline-flex; align-items: center; gap: 4px; background: var(--mint,#d4f5ec); color: var(--mint-deep,#3dbf9a); font-size: 0.75rem; font-weight: 700; padding: 3px 10px; border-radius: 999px; }

        .sr-start-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 18px; border-radius: 999px; border: none; cursor: pointer;
          background: linear-gradient(135deg, var(--peach-deep,#f28b60), #f5a070);
          color: white; font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 0.85rem;
          box-shadow: 0 4px 14px rgba(242,139,96,0.3);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .sr-start-btn:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(242,139,96,0.4); }

        .sr-doing-chip { background: linear-gradient(90deg, var(--mint-deep,#3dbf9a), var(--sky-deep,#4ab3e8)); color: white; font-size: 0.78rem; font-weight: 700; padding: 5px 12px; border-radius: 999px; box-shadow: 0 4px 12px rgba(61,191,154,0.3); }

        /* LIST ITEM */
        .sr-list-item {
          background: white; border-radius: 20px;
          border-left: 5px solid var(--cat-color, var(--mint-deep,#3dbf9a));
          box-shadow: 0 4px 14px rgba(0,0,0,0.05);
          padding: 14px 18px; display: flex; align-items: center; gap: 14px;
          animation: cardIn 0.3s ease both;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .sr-list-item:hover { transform: translateY(-3px); box-shadow: 0 8px 22px rgba(0,0,0,0.08); }
        .sr-list-emoji { width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
        .sr-list-info { flex: 1; min-width: 0; }
        .sr-list-title { font-family: 'Fredoka One', cursive; font-size: 0.95rem; color: var(--text-dark,#2d3a35); display: block; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sr-list-meta { display: flex; gap: 5px; align-items: center; flex-wrap: wrap; }
        .sr-list-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .sr-start-btn-sm { padding: 6px 16px; border-radius: var(--r-pill); border: none; cursor: pointer; background: linear-gradient(135deg, #F4956A, #E85C45); color: white; font-family: 'Baloo 2', cursive; font-weight: 800; font-size: 0.8rem; box-shadow: 0 3px 0 #C0422F, 0 6px 12px rgba(232,92,69,0.2); transition: all 0.2s; }
        .sr-start-btn-sm:hover { transform: translateY(-2px); box-shadow: 0 5px 0 #C0422F, 0 8px 16px rgba(232,92,69,0.3); }
        .sr-start-btn-sm.active { background: linear-gradient(135deg, #3DB5A0, #44A7CE); box-shadow: 0 3px 0 #1E8C78, 0 6px 12px rgba(61,181,160,0.2); }

        /* LOADING / EMPTY / ERROR */
        .sr-loading { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px 0; color: var(--ink-soft); }
        .sr-spinner { width: 36px; height: 36px; border: 4px solid rgba(61,181,160,0.15); border-top-color: #3DB5A0; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .sr-empty { text-align: center; padding: 60px 20px; color: var(--ink-soft); }
        .sr-empty-emoji { font-size: 5rem; display: block; margin-bottom: 20px; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.1)); }
        .sr-empty h3 { font-family: 'Fredoka One', cursive; font-size: 1.8rem; color: var(--ink); margin-bottom: 8px; }
        .sr-empty p { font-family: 'Baloo 2', cursive; font-size: 1.1rem; font-weight: 700; }

        .sr-error { display: flex; align-items: center; gap: 10px; background: #fde8e8; border-radius: 20px; padding: 14px 18px; margin-bottom: 20px; color: #e07070; font-weight: 700; font-size: 0.9rem; }

        /* FLOATING BALLOONS */
        .sr-balloon {
          position: fixed; bottom: -40px; font-size: 1.8rem; pointer-events: none;
          animation: floatUp 3s ease-out forwards; z-index: 200;
        }
        @keyframes floatUp { 0%{ transform: translateY(0) rotate(-5deg); opacity:1; } 80%{ opacity:1; } 100%{ transform:translateY(-110vh) rotate(15deg); opacity:0; } }

        /* CELEBRATION OVERLAY */
        .sr-overlay {
          position: fixed; inset: 0; z-index: 300;
          background: rgba(0,0,0,0.3); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn { from{ opacity:0; } to{ opacity:1; } }

        .sr-celebration {
          background: white; border-radius: 40px; padding: 48px 40px;
          text-align: center; max-width: 440px; width: 92%;
          box-shadow: 0 40px 90px rgba(30,16,7,0.25);
          animation: popIn 0.4s cubic-bezier(0.34,1.56,0.64,1);
          border-bottom: 10px solid #3DB5A0;
          border-top: 1px solid rgba(255,255,255,0.8);
        }
        @keyframes popIn { from{ transform:scale(0.85); opacity:0; } to{ transform:scale(1); opacity:1; } }
        .sr-cel-emojis { font-size: 2.2rem; margin-bottom: 16px; letter-spacing: 6px; }
        .sr-cel-title { font-family: 'Fredoka One', cursive; font-size: 2.4rem; color: var(--ink); margin-bottom: 10px; line-height: 1.1; }
        .sr-cel-sub { font-family: 'Baloo 2', cursive; font-size: 1.2rem; font-weight: 700; color: var(--ink-mid); margin-bottom: 6px; }
        .sr-cel-msg { font-size: 1rem; font-weight: 700; color: var(--ink-soft); margin-bottom: 28px; }
        .sr-cel-stars { display: flex; justify-content: center; gap: 16px; margin-bottom: 32px; }
        .sr-cel-stars .s1 { animation: fA 1.5s ease-in-out infinite; }
        .sr-cel-stars .s2 { animation: fB 2s ease-in-out infinite; }
        .sr-cel-stars .s3 { animation: fA 1.8s ease-in-out infinite; }
        .sr-cel-dismiss {
          padding: 14px 36px; border-radius: var(--r-pill); border: none; cursor: pointer;
          background: linear-gradient(135deg, #3DB5A0, #44A7CE);
          color: white; font-family: 'Baloo 2', cursive; font-weight: 800; font-size: 1.1rem;
          box-shadow: 0 6px 0 #1E8C78, 0 10px 24px rgba(61,181,160,0.3);
          transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        .sr-cel-dismiss:hover { transform: translateY(-4px); box-shadow: 0 10px 0 #1E8C78, 0 16px 32px rgba(61,181,160,0.4); }

        /* FOOTER */
        .sr-footer { background: white; border-top: 2px solid rgba(30,16,7,0.06); padding: 32px 20px; }
        .sr-footer-inner { max-width: 900px; margin: 0 auto; }
        .sr-encourage-card {
          display: flex; align-items: center; gap: 20px;
          background: #F0FBF8; border-radius: 28px; padding: 24px 28px;
          border-bottom: 6px solid #3DB5A0;
          transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
          box-shadow: 0 8px 0 rgba(30,16,7,0.04);
        }
        .sr-encourage-card:hover { transform: translateY(-5px); box-shadow: 0 14px 28px rgba(0,0,0,0.06), 0 10px 0 rgba(30,16,7,0.04); }
        .sr-ec-emoji { font-size: 3rem; flex-shrink: 0; filter: drop-shadow(0 8px 12px rgba(0,0,0,0.1)); }
        .sr-ec-title { font-family: 'Fredoka One', cursive; font-size: 1.25rem; color: var(--ink); margin-bottom: 6px; }
        .sr-ec-sub { font-family: 'Baloo 2', cursive; font-size: 1rem; font-weight: 700; color: var(--ink-mid); line-height: 1.45; }

        .sr-recommended-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #EDEAFA, #D6D1F8);
          color: #6B52B0;
          font-family: 'Baloo 2', cursive;
          font-size: 0.75rem;
          font-weight: 800;
          padding: 4px 12px;
          border-radius: var(--r-pill);
          margin-top: 8px;
          box-shadow: 0 3px 0 #9C80D2;
          animation: pulseSoft 2s infinite;
          border: 1px solid rgba(156,128,210,0.2);
        }
        @keyframes pulseSoft {
          0% { transform: scale(1); }
          50% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }

        /* RESPONSIVE */
        @media (max-width: 600px) {
          .sr-hero { padding: 18px 14px 32px; }
          .sr-toolbar-inner { gap: 8px; }
          .sr-body { padding: 18px 14px 48px; }
          .sr-cards-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="sr-page">

        {/* ── HERO ── */}
        <section className="sr-hero">
          <div className="sr-blob sr-blob-1" aria-hidden="true" />
          <div className="sr-blob sr-blob-2" aria-hidden="true" />
          <div className="sr-blob sr-blob-3" aria-hidden="true" />
          <span className="sr-deco d1" aria-hidden="true">⭐</span>
          <span className="sr-deco d2" aria-hidden="true">✨</span>
          <span className="sr-deco d3" aria-hidden="true">🎈</span>
          <span className="sr-deco d4" aria-hidden="true">🚀</span>

          <div className="sr-hero-top">
            <button className="sr-back-btn" onClick={() => window.history.back()} aria-label="Go back">
              <ArrowLeft size={16} /> Dashboard
            </button>
            <div className="sr-hero-right">
              <div className="sr-stars-chip" aria-label={`${totalStars} total stars`}>
                ⭐ {totalStars} stars
              </div>
            </div>
          </div>

          <div className="sr-hero-body">
            <div className="sr-hero-emoji-row" aria-hidden="true">
              <span>{todayEmoji}</span><span>🌈</span><span>⭐</span>
            </div>
            <h1 className="sr-title">Let's do today's routines! 🎈</h1>
            <p className="sr-subtitle">
              You're doing amazing, {studentName}! Pick a routine and let's go.<br />
              <span className="sr-tagline">One small step at a time! ✨</span>
            </p>

            {/* Overall progress */}
            <div className="sr-overall-bar-wrap">
              <div className="sr-overall-bar-label">
                <span>Today's Progress</span>
                <span>{overallPct}%</span>
              </div>
              <div className="sr-overall-track">
                <div className="sr-overall-fill" style={{ width: `${overallPct}%` }} />
              </div>
            </div>

            {/* Mode toggles */}
            <div className="sr-mode-row">
              <button className={`sr-mode-btn ${focusMode ? "active" : ""}`} onClick={() => setFocusMode((v) => !v)}
                aria-pressed={focusMode}>
                <Eye size={14} /> {focusMode ? "Focus Mode: On" : "Enable Focus Mode"}
              </button>
              <button className={`sr-mode-btn calm ${calmMode ? "active" : ""}`} onClick={() => setCalmMode((v) => !v)}
                aria-pressed={calmMode}>
                <Leaf size={14} /> {calmMode ? "Calm Mode: On" : "Enable Calm Mode"}
              </button>
            </div>
          </div>
        </section>

        {/* ── STICKY TOOLBAR ── */}
        <div className="sr-toolbar">
          <div className="sr-toolbar-inner">
            <div className="sr-search-wrap">
              <Search size={15} className="sr-search-icon-pos" aria-hidden="true" />
              <input className="sr-search" placeholder="Search routines…" value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} aria-label="Search routines" />
              {searchQuery && (
                <button className="sr-search-clear" onClick={() => setSearchQuery("")} aria-label="Clear search"><X size={13} /></button>
              )}
            </div>

            <div className="sr-filter-pills" role="group" aria-label="Filter by type">
              {["all", "adhd", "autism", "general"].map((t) => (
                <button key={t} className={`sr-filter-pill ${filterType === t ? "active" : ""}`}
                  onClick={() => setFilterType(t)} aria-pressed={filterType === t}>
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="sr-spacer" />

            <div className="sr-view-toggle" role="group" aria-label="View mode">
              <button className={`sr-view-btn ${viewMode === "grid" ? "active" : ""}`} onClick={() => setViewMode("grid")} aria-label="Grid view" title="Grid view">
                <LayoutGrid size={15} />
              </button>
              <button className={`sr-view-btn ${viewMode === "list" ? "active" : ""}`} onClick={() => setViewMode("list")} aria-label="List view" title="List view">
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="sr-body">

          {/* API Error */}
          {apiError && (
            <div className="sr-error" role="alert">⚠️ {apiError}</div>
          )}

          {/* Focus Spotlight */}
          {!loading && focusRoutine && !searchQuery && (
            <div className="sr-focus-spotlight" role="region" aria-label="Focus routine">
              <div className="sr-spotlight-icon">{focusRoutine.iconEmoji || "🎯"}</div>
              <div className="sr-spotlight-body">
                <div className="sr-spotlight-label">🌟 Focus for Today</div>
                <div className="sr-spotlight-title">{focusRoutine.title}</div>
                <div className="sr-spotlight-sub">Just one step at a time — you can do it! ✨</div>
                <button
                  className={`sr-spotlight-start ${startedRoutineId === focusRoutine._id ? "active" : ""}`}
                  onClick={() => handleStart(focusRoutine._id)}>
                  {startedRoutineId === focusRoutine._id ? "🚀 Doing it!" : "▶️ Start Now"}
                </button>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="sr-loading"><div className="sr-spinner" /><p>Gathering your routines…</p></div>
          ) : recommendedRoutines.length === 0 && activeRoutines.length === 0 && doneRoutines.length === 0 ? (
            <div className="sr-empty">
              <span className="sr-empty-emoji">📭</span>
              <h3>No routines yet!</h3>
              <p>Ask your parent to set up a daily schedule for you.</p>
            </div>
          ) : (
            <>
              {/* RECOMMENDED / ASSIGNED BY PARENT */}
              {recommendedRoutines.length > 0 && (
                <div className="sr-section sr-recommended-section">
                  <div className="sr-section-head">
                    <h2 className="sr-section-title">
                      <Sparkles size={18} color="#6040c0" /> 
                      Assigned for You <span className="sr-count-chip" style={{ background: "#e8e0ff", color: "#6040c0" }}>{recommendedRoutines.length}</span>
                    </h2>
                  </div>
                  <div className={viewMode === "grid" ? "sr-cards-grid" : "sr-cards-list"}>
                    {recommendedRoutines.map((r, i) => (
                      <div key={r._id} style={{ animationDelay: `${i * 0.08}s` }}>
                        <RoutineCard routine={r} started={startedRoutineId === r._id}
                          onStart={handleStart} onToggleTask={handleToggleTask}
                          showMotivation={showMotivation} focusMode={focusMode} viewMode={viewMode} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* ACTIVE ROUTINES */}
              {activeRoutines.length > 0 && (
                <div className="sr-section">
                  <div className="sr-section-head">
                    <h2 className="sr-section-title">
                      🚀 Active Routines <span className="sr-count-chip">{activeRoutines.length}</span>
                    </h2>
                  </div>
                  <div className={viewMode === "grid" ? "sr-cards-grid" : "sr-cards-list"}>
                    {activeRoutines.map((r, i) => (
                      <div key={r._id} style={{ animationDelay: `${i * 0.06}s` }}>
                        <RoutineCard routine={r} started={startedRoutineId === r._id}
                          onStart={handleStart} onToggleTask={handleToggleTask}
                          showMotivation={showMotivation} focusMode={focusMode} viewMode={viewMode} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DONE ROUTINES */}
              {doneRoutines.length > 0 && (
                <div className="sr-section">
                  <div className="sr-section-head">
                    <h2 className="sr-section-title">
                      ✅ Completed <span className="sr-count-chip">{doneRoutines.length}</span>
                    </h2>
                    <button className="sr-section-toggle" onClick={() => setDoneSectionOpen((v) => !v)}
                      aria-label={doneSectionOpen ? "Collapse completed" : "Expand completed"}>
                      {doneSectionOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                  {doneSectionOpen && (
                    <div className={viewMode === "grid" ? "sr-cards-grid" : "sr-cards-list"}>
                      {doneRoutines.map((r, i) => (
                        <div key={r._id} style={{ animationDelay: `${i * 0.05}s` }}>
                          <RoutineCard routine={r} started={false} onStart={() => {}}
                            onToggleTask={handleToggleTask} showMotivation={false}
                            isDone focusMode={false} viewMode={viewMode} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── FOOTER ── */}
        <footer className="sr-footer">
          <div className="sr-footer-inner">
            <div className="sr-encourage-card">
              <span className="sr-ec-emoji">🏆</span>
              <div>
                <div className="sr-ec-title">You're doing great, {studentName}!</div>
                <div className="sr-ec-sub">Every small step counts. Keep going — you're a superstar! ⭐</div>
              </div>
            </div>
          </div>
        </footer>

        {/* Floating balloons */}
        {balloons.map((b) => (
          <div key={b.id} className="sr-balloon"
            style={{ left: `${b.left}%`, animationDelay: `${b.delay}s` }} aria-hidden="true">
            {b.emoji}
          </div>
        ))}

        {/* Celebration overlay */}
        {celebrationId && (
          <CelebrationOverlay
            routineTitle={routines.find((r) => r._id === celebrationId)?.title || "Routine"}
            onDismiss={() => setCelebrationId(null)}
          />
        )}
      </div>
    </>
  );
}
