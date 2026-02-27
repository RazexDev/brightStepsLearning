import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressForm from '../components/ProgressForm';
import ProgressList from '../components/ProgressList';
import '../App.css';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [refreshList, setRefreshList] = useState(false);

  const handleLogout = () => navigate('/');
  const triggerRefresh = () => setRefreshList(prev => !prev);

  return (
    <div className="dashboard-wrapper">

      {/* ══════════════════════════
          HERO BANNER
      ══════════════════════════ */}
      <div className="dashboard-hero">

        {/* Floating emoji decorations */}
        <span className="hero-deco deco-star1"   aria-hidden="true">⭐</span>
        <span className="hero-deco deco-star2"   aria-hidden="true">✨</span>
        <span className="hero-deco deco-star3"   aria-hidden="true">💫</span>
        <span className="hero-deco deco-cloud1"  aria-hidden="true">☁️</span>
        <span className="hero-deco deco-cloud2"  aria-hidden="true">🌤️</span>
        <span className="hero-deco deco-rocket"  aria-hidden="true">🚀</span>
        <span className="hero-deco deco-rainbow" aria-hidden="true">🌈</span>
        <span className="hero-deco deco-balloon" aria-hidden="true">🎈</span>
        <span className="hero-deco deco-heart"   aria-hidden="true">💛</span>
        <span className="hero-deco deco-pencil"  aria-hidden="true">✏️</span>

        <div className="hero-inner">
          {/* Left: Title + stats */}
          <div className="hero-title-block">
            <div className="hero-emoji-row" aria-hidden="true">
              <span>📋</span>
              <span>🌟</span>
              <span>🎯</span>
              <span>📚</span>
            </div>

            <h1 className="dashboard-title">
              <span className="title-word tw-orange">Teacher</span>
              <span className="title-word tw-sky">Dashboard</span>
            </h1>

            <p className="hero-subtitle">
              Manage daily progress reports with ease. ✨
            </p>

            <div className="hero-stats">
              <span className="stat-pill sp-orange">📝 Daily Reports</span>
              <span className="stat-pill sp-sky">📊 Track Progress</span>
              <span className="stat-pill sp-green">🏅 Student Growth</span>
            </div>
          </div>

          {/* Right: Logout */}
          <button onClick={handleLogout} className="btn-logout">
            🚪 Log Out
          </button>
        </div>
      </div>

      {/* ══════════════════════════
          MAIN CONTENT
      ══════════════════════════ */}
      <main className="dashboard-main">
        <div className="dashboard-main-inner">
          <ProgressForm onSave={triggerRefresh} />
          <ProgressList refreshTrigger={refreshList} />
        </div>
      </main>

    </div>
  );
}
