import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Calendar, Gamepad2, Star, Sparkles, ChevronRight, Search, X } from 'lucide-react';
import './StudentDashboard.css';

const BUBBLES = ['⭐','🌟','✨','🎈','🌈','🦋','🌸','🍀','💛','🎵','🚀','☁️'];

const ALL_CARDS = [
  {
    to:        '/routines',
    cls:       'card-routine',
    emoji:     '📅',
    Icon:      Calendar,
    iconColor: '#4ade80',
    title:     'Daily Routine',
    desc:      'Check your visual schedule and tick off today\'s tasks one by one.',
    tags:      ['Schedule', 'Daily Tasks', 'Activities'],
    btnTxt:    'View Routine',
  },
  {
    to:        '/games',
    cls:       'card-games',
    emoji:     '🎮',
    Icon:      Gamepad2,
    iconColor: '#f4956a',
    title:     'Learning Games',
    desc:      'Play calm, fun matching and puzzle games that build your skills.',
    tags:      ['Memory', 'Puzzles', 'Fun', 'Focus Match'],
    btnTxt:    'Play Games',
  },
  {
    to:        '/progress',
    cls:       'card-progress',
    emoji:     '⭐',
    Icon:      Star,
    iconColor: '#38bdf8',
    title:     'My Progress',
    desc:      'See all the stars and milestones you\'ve collected. You\'re amazing!',
    tags:      ['Stars', 'Achievements', 'Milestones'],
    btnTxt:    'See Progress',
  },
];

/* Highlight matching text inside a string */
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

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');

  /* ── search state ── */
  const [query,       setQuery]       = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const userString = localStorage.getItem('brightsteps_user');
    if (userString) {
      const user = JSON.parse(userString);
      setUserName(user.name ? user.name.split(' ')[0] : 'Explorer');
    }
  }, []);

  /* close dropdown on outside click */
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
    localStorage.removeItem('brightsteps_token');
    localStorage.removeItem('brightsteps_user');
    navigate('/');
  };

  /* ── filter logic ──
     A card matches if query hits its title, desc, or any tag */
  const q = query.trim().toLowerCase();

  const matchedCards = q
    ? ALL_CARDS.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.desc.toLowerCase().includes(q)  ||
        c.tags.some(t => t.toLowerCase().includes(q))
      )
    : ALL_CARDS;

  /* suggestions shown in dropdown = same matched set */
  const suggestions = matchedCards;

  const handleSuggestionClick = () => {
    setShowDropdown(false);
    setQuery('');
  };

  const clearSearch = () => {
    setQuery('');
    setShowDropdown(false);
  };

  return (
    <div className="dashboard-container">

      {/* ── floating bubbles bg ── */}
      <div className="dash-bg" aria-hidden="true">
        {BUBBLES.map((e, i) => (
          <span key={i} className={`dbubble db${i + 1}`}>{e}</span>
        ))}
      </div>

      {/* ══════════════════════════════
          NAVBAR
      ══════════════════════════════ */}
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <Sparkles size={22} color="#f4956a" className="nav-logo-spin" />
          BrightSteps
        </div>

        <h1 className="welcome-text">
          Hi, <span className="name-highlight">{userName || 'Explorer'}</span>!&nbsp;
          <span className="wave-emoji">👋</span>
        </h1>

        <div className="nav-right">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </nav>

      {/* ══════════════════════════════
          HERO
      ══════════════════════════════ */}
      <div className="dash-hero">
        <div className="hero-emoji-row" aria-hidden="true">
          <span>🏆</span><span>🌟</span><span>🎯</span><span>🚀</span>
        </div>

        <h1 className="hero-title">
          Your&nbsp;<span className="ht-green">Learning</span>&nbsp;
          <span className="ht-peach">Control</span>&nbsp;
          <span className="ht-sky">Centre</span>
        </h1>

        <p className="hero-subtitle">
          Everything you need, right here.<br />
          What would you like to explore today? 🌈
        </p>

        <div className="streak-bar">
          <span className="streak-pill sp-green">🌱 Keep growing!</span>
          <span className="streak-pill sp-peach">🎮 3 games ready</span>
          <span className="streak-pill sp-sky">⭐ Earn more stars</span>
        </div>

        {/* ══════════════════════════════
            SEARCH BAR  (lives in hero)
        ══════════════════════════════ */}
        <div className="search-wrapper" ref={searchRef}>
          <div className="search-bar">

            {/* search icon */}
            <span className="search-icon-wrap">
              <Search size={20} color={q ? '#0d9488' : '#94a3b8'} strokeWidth={2.2} />
            </span>

            {/* input */}
            <input
              className="search-input"
              type="text"
              placeholder="Search routines, games, progress…"
              value={query}
              onChange={e => { setQuery(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              aria-label="Search dashboard"
            />

            {/* clear × */}
            <button
              className={`search-clear ${q ? 'visible' : ''}`}
              onClick={clearSearch}
              aria-label="Clear search"
            >
              <X size={13} strokeWidth={3} />
            </button>
          </div>

          {/* ── DROPDOWN SUGGESTIONS ── */}
          {showDropdown && q && (
            <div className="search-suggestions" role="listbox">
              {suggestions.length > 0 ? (
                suggestions.map(card => (
                  <Link
                    key={card.to}
                    to={card.to}
                    className="suggestion-item"
                    role="option"
                    onClick={handleSuggestionClick}
                  >
                    {/* colour icon */}
                    <div
                      className="sug-icon"
                      style={{
                        background: card.cls === 'card-routine'  ? '#dcfce7'
                                  : card.cls === 'card-games'    ? '#fff0e8'
                                  :                                '#e0f5ff'
                      }}
                    >
                      {card.emoji}
                    </div>

                    <div className="sug-info">
                      <div className="sug-name">
                        <HighlightMatch text={card.title} query={q} />
                      </div>
                      <div className="sug-desc">
                        {card.tags
                          .filter(t => t.toLowerCase().includes(q))
                          .slice(0, 2)
                          .map(t => (
                            <span key={t} style={{ marginRight: 6 }}>
                              🏷 <HighlightMatch text={t} query={q} />
                            </span>
                          ))
                        }
                        {!card.tags.some(t => t.toLowerCase().includes(q)) && card.desc.slice(0, 55) + '…'}
                      </div>
                    </div>

                    <ChevronRight size={15} color="#94a3b8" />
                  </Link>
                ))
              ) : (
                <div className="no-results">
                  <span>🔍</span>
                  No results for "<strong>{query}</strong>"
                </div>
              )}
            </div>
          )}
        </div>
        {/* end search-wrapper */}
      </div>

      {/* ══════════════════════════════
          CARDS GRID
      ══════════════════════════════ */}
      <main className="dashboard-content">
        <p className="section-label">
          {q
            ? `🔍 ${matchedCards.length} result${matchedCards.length !== 1 ? 's' : ''} for "${query}"`
            : '🧭 Choose your adventure'
          }
        </p>

        <div className="dashboard-grid">
          {ALL_CARDS.map((card) => {
            const isMatch = !q || matchedCards.includes(card);
            return (
              <Link
                key={card.to}
                to={card.to}
                className={`dash-card ${card.cls}${!isMatch ? ' card-dimmed' : ''}`}
                data-emoji={card.emoji}
              >
                <div className="dash-icon-wrapper">
                  <card.Icon size={34} color={card.iconColor} />
                </div>
                <h3>{card.emoji} {card.title}</h3>
                <p>{card.desc}</p>
                <div className="card-tags">
                  {card.tags.map(t => (
                    <span key={t} className="ctag">{t}</span>
                  ))}
                </div>
                <div className="card-go-btn">
                  {card.btnTxt}
                  <ChevronRight size={17} className="go-arrow" />
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      {/* ── footer banner ── */}
      <div className="dash-footer-banner">
        <div className="dfb-inner">
          <span className="dfb-emoji">💪</span>
          <div className="dfb-text">
            <h3>You're doing brilliantly!</h3>
            <p>
              Every task you complete, every game you play, and every star you earn
              is a huge achievement. We're so proud of you — keep shining! ✨
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}