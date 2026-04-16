import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, ChevronRight, Search, X, Lock } from 'lucide-react';
import './StudentDashboard.css';
import MagicCanvas from '../components/MagicCanvas';
import CursorTrail from '../components/CursorTrail';
import { useTilt } from '../hooks/useTilt';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

const ALL_CARDS = [
  {
    to: '/student-routines',
    cls: 'card-routine',
    emoji: '📅',
    title: 'My Routine',
    desc: "See your assigned routines and complete your tasks!",
    tags: ['Schedule', 'Tasks', 'Progress'],
    btnTxt: "Let's Go!",
  },
  {
    to: '/games',
    cls: 'card-games',
    emoji: '🎮',
    title: 'Play Games',
    desc: 'Fun games that help you learn.',
    tags: ['Memory', 'Puzzles'],
    btnTxt: 'Play Now!',
  },
  {
    to: '/manage-resources',
    cls: 'card-progress',
    emoji: '📚',
    title: 'Resources',
    desc: 'Explore learning materials made just for you!',
    tags: ['Videos', 'PDFs'],
    btnTxt: 'Explore!',
  },
];

function HighlightMatch({ text, query }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="sug-match">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function TiltCard({ children, className, to, dataEmoji, dimmed }) {
  const { ref, handlers } = useTilt({ max: 12, scale: 1.04 });

  return (
    <Link
      ref={ref}
      to={to}
      className={`dash-card ${className}${dimmed ? ' card-dimmed' : ''}`}
      data-emoji={dataEmoji}
      {...handlers}
    >
      {children}
    </Link>
  );
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const [showParentModal, setShowParentModal] = useState(false);
  const [parentPin, setParentPin] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const userString = localStorage.getItem('brightsteps_user');
    if (userString) {
      const user = JSON.parse(userString);
      setUserName(user.name ? user.name.split(' ')[0] : 'Explorer');
      setStudentId(user.customId || '');
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    [
      'brightsteps_token',
      'brightsteps_user',
      'brightsteps_focus_unlocked',
      'brightsteps_shapes_unlocked',
      'brightsteps_emotions_unlocked',
    ].forEach((k) => localStorage.removeItem(k));

    sessionStorage.removeItem('parent_unlocked');
    navigate('/login');
  };

  const verifyParentPin = async (e) => {
    e.preventDefault();
    setPasswordError('');

    try {
      const userStr = localStorage.getItem('brightsteps_user');
      if (!userStr) {
        setPasswordError('Session expired. Please log in again.');
        return;
      }

      const user = JSON.parse(userStr);
      const userId = user._id || user.id || user.user?._id || user.user?.id;

      if (!userId) {
        console.error('❌ [verifyParentPin] No valid userId found in local storage:', user);
        setPasswordError('Unable to identify user. Please log in again.');
        return;
      }

      console.log(`📡 [verifyParentPin] Verifying PIN for ${userId} at ${API_BASE}...`);

      const res = await fetch(`${API_BASE}/auth/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, pin: parentPin }),
      });

      const data = await res.json();

      if (res.ok) {
        console.log('✅ [verifyParentPin] Success');
        sessionStorage.setItem('parent_unlocked', 'true');
        setShowParentModal(false);
        setParentPin('');
        setPasswordError('');
        navigate('/parent-dashboard');
      } else {
        console.warn('❌ [verifyParentPin] Rejection:', data.message);
        setPasswordError(data.message || 'Wrong PIN — try again!');
      }
    } catch (error) {
      console.error('🔥 [verifyParentPin] Network/Server Error:', error);
      setPasswordError(`Cannot connect to server. Ensure backend is running at ${API_BASE}`);
    }
  };

  const toggleParentView = () => {
    if (sessionStorage.getItem('parent_unlocked') === 'true') {
      navigate('/parent-dashboard');
    } else {
      setShowParentModal(true);
    }
  };

  const q = query.trim().toLowerCase();
  const matchedCards = q
    ? ALL_CARDS.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.desc.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      )
    : ALL_CARDS;

  return (
    <div className="dashboard-container">
      <CursorTrail />

      {showParentModal && (
        <div className="parent-modal-overlay">
          <div className="parent-modal">
            <div className="modal-icon">🔒</div>
            <h3>Parent Access</h3>
            <p>Enter your 4-digit PIN to open the Parent Portal.</p>

            <form onSubmit={verifyParentPin}>
              <input
                className="modal-pin-input"
                type="password"
                placeholder="••••"
                value={parentPin}
                onChange={(e) =>
                  setParentPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))
                }
                required
                inputMode="numeric"
                autoFocus
              />

              {passwordError && <div className="modal-error">⚠️ {passwordError}</div>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn btn-cancel"
                  onClick={() => {
                    setShowParentModal(false);
                    setParentPin('');
                    setPasswordError('');
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="modal-btn btn-verify"
                  disabled={parentPin.length !== 4}
                >
                  🔓 Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <nav className="dashboard-nav">
        <a href="/" className="nav-brand">
          <div className="nav-logo-badge">✨</div>
          <span className="nav-logo-name">
            Bright<em>Steps</em>
          </span>
        </a>

        <div className="welcome-wrap">
          <h1 className="welcome-text">
            Hi, <span className="name-highlight">{userName || 'Explorer'}</span>!&nbsp;
            <span className="wave-emoji">👋</span>
          </h1>
          {studentId && (
            <div className="id-badge">
              <span className="id-label">ID:</span>
              <span className="id-value">{studentId}</span>
            </div>
          )}
        </div>

        <div className="nav-right">
          <button onClick={toggleParentView} className="nav-btn nav-btn-parent">
            <Lock size={15} /> Parent Portal
          </button>

          <button onClick={handleLogout} className="nav-btn nav-btn-logout">
            <LogOut size={15} /> Log Out
          </button>
        </div>
      </nav>

      <div className="dash-hero">
        <MagicCanvas style={{ opacity: 0.9 }} />

        <div className="hero-blob hero-blob-1" aria-hidden="true" />
        <div className="hero-blob hero-blob-2" aria-hidden="true" />
        <div className="hero-blob hero-blob-3" aria-hidden="true" />

        <div className="hero-greeting">
          <span className="hero-emoji-big">🌟</span>
          <h1 className="hero-title">
            What are we <span className="ht-rose">doing</span>{' '}
            <span className="ht-amber">today</span>
            <span className="ht-teal">?</span>
          </h1>
          <p className="hero-sub">Pick something and let’s have fun! 🚀</p>
        </div>

        <div className="streak-bar">
          <span className="streak-pill sp-sage">🌱 Keep growing!</span>
          <span className="streak-pill sp-rose">📅 Routines ready</span>
          <span className="streak-pill sp-amber">⭐ Earn stars</span>
        </div>

        <div className="search-wrapper" ref={searchRef}>
          <div className="search-bar">
            <span className="search-icon-wrap">
              <Search size={20} color={q ? 'var(--rose)' : 'var(--ink-soft)'} />
            </span>

            <input
              type="text"
              className="search-input"
              placeholder="Search here..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
            />

            <button
              type="button"
              className={`search-clear ${query ? 'visible' : ''}`}
              onClick={() => {
                setQuery('');
                setShowDropdown(false);
              }}
              aria-label="Clear"
            >
              <X size={13} strokeWidth={3} />
            </button>
          </div>

          {showDropdown && q && (
            <div className="search-suggestions" role="listbox">
              {matchedCards.length > 0 ? (
                matchedCards.map((card) => (
                  <Link
                    key={card.to}
                    to={card.to}
                    className="suggestion-item"
                    role="option"
                    onClick={() => {
                      setShowDropdown(false);
                      setQuery('');
                    }}
                  >
                    <div
                      className="sug-icon"
                      style={{
                        background:
                          card.cls === 'card-routine'
                            ? 'var(--sage-bg)'
                            : card.cls === 'card-games'
                            ? 'var(--rose-bg)'
                            : 'var(--sky-bg)',
                      }}
                    >
                      {card.emoji}
                    </div>

                    <div className="sug-info">
                      <div className="sug-name">
                        <HighlightMatch text={card.title} query={q} />
                      </div>
                      <div className="sug-desc">{card.desc}</div>
                    </div>

                    <ChevronRight size={15} color="var(--ink-soft)" />
                  </Link>
                ))
              ) : (
                <div className="no-results">
                  <span>🔍</span>Nothing found for "<strong>{query}</strong>"
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <main className="dashboard-content">
        <p className="section-label">
          {q
            ? `🔍 ${matchedCards.length} result${matchedCards.length !== 1 ? 's' : ''}`
            : '🧭 Choose your adventure'}
        </p>

        <div className="dashboard-grid">
          {ALL_CARDS.map((card) => {
            const isMatch = !q || matchedCards.includes(card);

            return (
              <TiltCard
                key={card.to}
                to={card.to}
                className={card.cls}
                dataEmoji={card.emoji}
                dimmed={!isMatch}
              >
                <span className="dash-card-emoji">{card.emoji}</span>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>

                <div className="card-tags">
                  {card.tags.map((t) => (
                    <span key={t} className="ctag">
                      {t}
                    </span>
                  ))}
                </div>

                <div className="card-go-btn">
                  {card.btnTxt}
                  <ChevronRight size={18} className="go-arrow" />
                </div>
              </TiltCard>
            );
          })}
        </div>
      </main>

      <div className="dash-footer-banner">
        <div className="dfb-inner">
          <span className="dfb-emoji">💪</span>
          <div className="dfb-text">
            <h3>You’re doing brilliantly!</h3>
            <p>Every star you earn is a big win. Keep shining! ✨</p>
          </div>
        </div>
      </div>
    </div>
  );
}