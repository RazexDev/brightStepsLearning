import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, PlayCircle, Star, Trophy, Target } from 'lucide-react';
import { useTilt } from '../hooks/useTilt';
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

function RoutineCard({ routine, started, onStart, onToggleTask }) {
  const { ref, handlers } = useTilt({ max: 10, scale: 1.02, glare: true });
  
  return (
    <div 
      ref={ref} 
      {...handlers} 
      className={`sr-card ${routine.category || 'custom'}`}
      style={{ isolation: 'isolate' }}
    >
      <div className="sr-card-top">
        <div className="sr-card-header">
          <div className="sr-card-emoji-box">{routine.iconEmoji || '📋'}</div>
          <div>
            <h2 className="sr-card-title">{routine.title}</h2>
            <p className="sr-card-meta">{routine.category} · {routine.type}</p>
          </div>
        </div>

        <button
          className={`sr-start-btn ${started ? 'active' : ''}`}
          onClick={() => onStart(routine._id)}
        >
          {started ? '🚀 Doing it!' : '▶️ Start'}
        </button>
      </div>

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
              disabled={!started}
              onChange={(e) => onToggleTask(routine._id, index, e.target.checked)}
            />
            <div className="sr-task-content">
              <span className="sr-task-label">{task.label}</span>
              {task.mins > 0 && <span className="sr-task-time">⏱️ {task.mins}m</span>}
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

export default function StudentRoutinePage() {
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [startedRoutineId, setStartedRoutineId] = useState(null);

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
    } catch (err) {
      alert('Oops! Could not save progress. Checking connection...');
    }
  };

  const totalCompleted = routines.filter((r) => r.completed).length;
  const totalStars = routines.reduce((sum, r) => sum + (r.rewards?.starsEarned || 0), 0);

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
            <span>📅</span><span>🌈</span><span>⭐</span>
          </div>
          <h1 className="sr-title">My Morning & Day!</h1>
          <p className="sr-subtitle">Let’s crush those routines, {studentName}! 🚀</p>

          <div className="sr-stats-row">
            <div className="sr-stat-pill amber">⭐ {totalStars} Stars</div>
            <div className="sr-stat-pill teal">✅ {totalCompleted} Done</div>
            <div className="sr-stat-pill rose">📋 {routines.length} Today</div>
          </div>
        </div>
      </section>

      <main className="sr-main">
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
        ) : routines.length === 0 ? (
          <div className="sr-empty-state">
            <div className="sr-empty-emoji">📭</div>
            <h3>No routines yet!</h3>
            <p>Ask your parent to set up a new daily schedule for you.</p>
          </div>
        ) : (
          <div className="sr-grid">
            {routines.map((routine) => (
              <RoutineCard
                key={routine._id}
                routine={routine}
                started={startedRoutineId === routine._id}
                onStart={handleStartRoutine}
                onToggleTask={handleTaskToggle}
              />
            ))}
          </div>
        )}
      </main>

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