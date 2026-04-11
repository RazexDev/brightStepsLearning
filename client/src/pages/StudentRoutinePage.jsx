import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Target, Search, Star, Heart } from 'lucide-react';
import './StudentRoutinePage.css';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('brightsteps_token');

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...opts,
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

function StarRow({ filled = 0, total = 5 }) {
  return (
    <div className="sr-star-row">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`sr-star-icon ${i < filled ? 'lit' : ''}`}>⭐</span>
      ))}
    </div>
  );
}

function RoutineCard({ routine, started, onStart, onToggleTask, showMotivation, isDone }) {
  return (
    <div className={`sr-card ${routine.category || 'custom'} ${isDone ? 'sr-card-done' : ''}`}>
      <div className="sr-card-top">
        <div className="sr-card-header">
          <div className="sr-card-emoji-box">{routine.iconEmoji || routine.emoji || '📋'}</div>
          <div>
            <h2 className="sr-card-title">{routine.title}</h2>
            <p className="sr-card-meta">{routine.category} · {routine.type}</p>
          </div>
        </div>

        {!isDone && (
          <button
            className={`sr-start-btn ${started ? 'active' : ''}`}
            onClick={() => onStart(routine._id)}
          >
            {started ? '🚀 Doing it!' : '▶️ Start'}
          </button>
        )}
      </div>

      {routine.goal && (
        <div className="sr-card-goal">
          <Target size={14} style={{ marginRight: '8px' }} />
          {routine.goal}
        </div>
      )}

      {routine.desc && <p className="sr-card-meta" style={{ marginBottom: '16px', textTransform: 'none' }}>{routine.desc}</p>}

      <div className="sr-progress-container">
        <div className="sr-progress-header">
          <span>{routine.progress || 0}% Complete</span>
          <StarRow filled={Math.floor((routine.progress || 0) / 20)} total={5} />
        </div>
        <div className="sr-progress-track">
          <div className="sr-progress-fill" style={{ width: `${routine.progress || 0}%` }} />
        </div>
      </div>

      <div className="sr-task-list">
        {(routine.tasks || []).map((task, index) => (
          <label key={`${routine._id}-${index}`} className={`sr-task-item ${task.completed ? 'done' : ''}`}>
            <input
              type="checkbox"
              className="sr-checkbox"
              checked={!!task.completed}
              disabled={!started && !isDone}
              onChange={(e) => onToggleTask(routine._id, index, e.target.checked)}
            />
            <div className="sr-task-content">
              <span className="sr-task-label">{task.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {task.completed && showMotivation && (
                  <span className="sr-motivation-tag" style={{ margin: 0, padding: '2px 8px', fontSize: '0.8rem' }}>
                    ✨ NICE!
                  </span>
                )}
                {task.mins > 0 && <span className="sr-task-time">⏱️ {task.mins}m</span>}
              </div>
            </div>
          </label>
        ))}
      </div>

      <div className="sr-card-footer">
        {routine.completed ? (
          <span className="sr-status-tag success">🏆 Routine Complete!</span>
        ) : (
          <span className="sr-status-tag info">✨ {routine.tasks.filter(t => !t.completed).length} tasks left</span>
        )}
        <div className="sr-reward-badge">
          <Trophy size={14} /> {routine.rewards?.starsEarned || 0} stars
        </div>
      </div>
    </div>
  );
}

function CelebrationOverlay({ routineTitle }) {
  return (
    <div className="sr-celebration-overlay">
      <div className="sr-celebration-content">
        <div className="sr-celebration-emojis">🎈 🌟 🎉 🏆 ✨ 🌈</div>
        <h2 className="sr-celebration-title">AMAZING JOB! 🌟</h2>
        <p className="sr-celebration-subtitle">You finished <strong>{routineTitle}</strong>!</p>
        <p className="sr-celebration-subtext">You are a superstar! Keep up the great work! 🚀</p>
        <div className="sr-celebration-stars">
           <Star className="celebration-star s1" />
           <Star className="celebration-star s2" />
           <Heart className="celebration-heart h1" />
           <Star className="celebration-star s3" />
        </div>
      </div>
    </div>
  );
}

export default function StudentRoutinePage() {
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [startedRoutineId, setStartedRoutineId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMotivation, setShowMotivation] = useState(false);
  const [celebrationRoutineId, setCelebrationRoutineId] = useState(null);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = days[new Date().getDay()];
  const todayEmoji = ['☀️', '🌞', '⛅', '🌈', '✨'][new Date().getDay() % 5];

  const user = useMemo(() => {
    try {
      const u = JSON.parse(localStorage.getItem('brightsteps_user'));
      return u?.user || u || null;
    } catch {
      return null;
    }
  }, []);

  const studentName = user?.name?.split(' ')[0] || 'Explorer';

  const loadRoutines = async () => {
    try {
      setLoading(true);
      setApiError('');
      const data = await apiFetch('/routines/student');
      setRoutines(Array.isArray(data) ? data : []);
    } catch (err) {
      setApiError('Failed to load your routines. Try again later!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutines();
  }, []);

  const handleStartRoutine = (routineId) => {
    setStartedRoutineId(routineId);
  };

  const handleTaskToggle = async (routineId, taskIndex, completed) => {
    try {
      const updated = await apiFetch('/routines/progress', {
        method: 'PATCH',
        body: JSON.stringify({ routineId, taskIndex, completed }),
      });

      setRoutines((prev) =>
        prev.map((routine) => (routine._id === updated._id ? updated : routine))
      );

      if (completed) {
        setShowMotivation(true);
        setTimeout(() => setShowMotivation(false), 3000);

        if (updated.completed) {
          setCelebrationRoutineId(updated._id);
          setTimeout(() => setCelebrationRoutineId(null), 5000);
        }
      }
    } catch (err) {
      alert('Oops! Could not save progress. Checking connection...');
    }
  };

  const totalCompleted = useMemo(() => routines.filter((r) => r.completed).length, [routines]);
  const totalStars = useMemo(() => routines.reduce((sum, r) => sum + (r.rewards?.starsEarned || 0), 0), [routines]);

  const filteredRoutines = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return routines.filter((r) => {
      return (
        r.title.toLowerCase().includes(q) ||
        (r.category && r.category.toLowerCase().includes(q)) ||
        (r.tasks && r.tasks.some((t) => t.label.toLowerCase().includes(q)))
      );
    });
  }, [routines, searchQuery]);

  const [activeRoutines, doneRoutines] = useMemo(() => {
    const active = [];
    const done = [];
    filteredRoutines.forEach(r => {
      if (r.completed) done.push(r);
      else active.push(r);
    });
    return [active, done];
  }, [filteredRoutines]);

  const focusRoutine = activeRoutines.find((r) => !r.completed);

  return (
    <div className="sr-page">
      {/* ══ HERO ══ */}
      <section className="sr-hero">
        <span className="sr-deco deco-star1">⭐</span>
        <span className="sr-deco deco-star2">✨</span>
        <span className="sr-deco deco-cloud1">☁️</span>
        <span className="sr-deco deco-cloud2">⛅</span>
        <span className="sr-deco deco-balloon">🎈</span>
        <span className="sr-deco deco-heart">💛</span>

        <div className="sr-hero-top">
          <Link to="/dashboard" className="sr-back-link">
            <ArrowLeft size={16} /> Dashboard
          </Link>
        </div>

        <div className="sr-hero-content">
          <div className="sr-hero-emoji-row">
            <span>{todayEmoji}</span><span>🌈</span><span>⭐</span>
          </div>
          <h1 className="sr-title">{todayEmoji} Today is {todayName}</h1>
          <p className="sr-subtitle">
            Here's your routine for today, {studentName}! <br/>
            <span className="sr-tagline">You're doing great — let's complete one step at a time! 🚀</span>
          </p>

          <div className="sr-stats-row">
            <div className="sr-stat-pill amber">⭐ {totalStars} Stars</div>
            <div className="sr-stat-pill teal">✅ {totalCompleted} Done</div>
            <div className="sr-stat-pill rose">📋 {routines.length} Total</div>
          </div>
        </div>
      </section>

      <main className="sr-main">
        {/* ══ SEARCH ══ */}
        <div className="sr-search-area">
          <div className="sr-search-bar">
            <Search size={20} color="var(--sky)" />
            <input
              type="text"
              placeholder="Search routines or tasks..."
              className="sr-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* ══ FOCUS SECTION ══ */}
        {!loading && focusRoutine && !searchQuery && (
          <section className="sr-focus-section">
            <div className="sr-focus-label">🌟 Focus for Today</div>
            <div className="sr-focus-content">
              <div className="sr-ec-icon" style={{ fontSize: '4rem' }}>{focusRoutine.iconEmoji || focusRoutine.emoji || '🎯'}</div>
              <div>
                <h3 style={{ fontFamily: 'Baloo 2', fontSize: '2rem', margin: '0 0 10px' }}>
                  Let's do this together: <strong>{focusRoutine.title}</strong>
                </h3>
                <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--sr-ink-mid)' }}>
                  Just one step at a time, you can do it! ✨
                </p>
                <div style={{ marginTop: '20px' }}>
                  <button
                    className={`sr-start-btn ${startedRoutineId === focusRoutine._id ? 'active' : ''}`}
                    onClick={() => handleStartRoutine(focusRoutine._id)}
                  >
                    {startedRoutineId === focusRoutine._id ? '🚀 Doing it!' : '▶️ Start Now'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
        {apiError && (
          <div className="sr-error-card">
            <span>⚠️</span> {apiError}
          </div>
        )}

        {loading ? (
          <div className="sr-loading-state">
            <div className="sr-spinner" />
            <p>Gathering your routines...</p>
          </div>
        ) : activeRoutines.length === 0 && doneRoutines.length === 0 ? (
          <div className="sr-empty-state">
            <div className="sr-empty-emoji">📭</div>
            <h3>No routines yet!</h3>
            <p>Ask your parent to set up a new daily schedule for you.</p>
          </div>
        ) : (
          <div className="sr-content-stack">
            {/* ══ ACTIVE ══ */}
            {activeRoutines.length > 0 && (
              <div className="sr-active-section">
                <div className="sr-grid">
                  {activeRoutines.map((routine) => (
                    <RoutineCard
                      key={routine._id}
                      routine={routine}
                      started={startedRoutineId === routine._id}
                      onStart={handleStartRoutine}
                      onToggleTask={handleTaskToggle}
                      showMotivation={showMotivation}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ══ DONE ══ */}
            {doneRoutines.length > 0 && (
              <div className="sr-done-section">
                <h3 className="sr-done-heading">✅ Everything Done!</h3>
                <div className="sr-grid">
                  {doneRoutines.map((routine) => (
                    <RoutineCard
                      key={routine._id}
                      routine={routine}
                      started={false}
                      onStart={() => {}}
                      onToggleTask={handleTaskToggle}
                      showMotivation={showMotivation}
                      isDone
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {celebrationRoutineId && (
        <CelebrationOverlay 
          routineTitle={routines.find(r => r._id === celebrationRoutineId)?.title || 'Routine'} 
        />
      )}

      {/* ══ ENCOURAGEMENT ══ */}
      <footer className="sr-footer">
        <div className="sr-encourage-card">
          <div className="sr-ec-icon">🏆</div>
          <div className="sr-ec-text">
            <h3>You're doing great!</h3>
            <p>Every small step counts towards a big win. Keep it up!</p>
          </div>
        </div>
      </footer>
    </div>
  );
}