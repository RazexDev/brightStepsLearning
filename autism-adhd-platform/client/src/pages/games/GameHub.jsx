import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Play, Award, Shapes, Smile } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './GameHub.css';

// ─────────────────────────────────────────────────────────────────
// useTilt hook — inline copy so GameHub is self-contained.
// If you prefer, delete this and import from '../hooks/useTilt'.
// ─────────────────────────────────────────────────────────────────
function useTilt({ max = 14, scale = 1.04, glare = true } = {}) {
  const ref = useRef(null);

  const onMouseMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 2; // −1 → 1
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 2; // −1 → 1

    const rotY =  x * max;
    const rotX = -y * max;

    el.style.transform  = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(${scale},${scale},${scale})`;
    el.style.transition = 'transform 0.08s ease-out';

    if (glare) {
      let glareEl = el.querySelector('.tilt-glare');
      if (!glareEl) {
        glareEl = document.createElement('div');
        glareEl.className = 'tilt-glare';
        el.appendChild(glareEl);
      }
      // normalise 0→1 for CSS custom properties
      const gx = ((x + 1) / 2) * 100;
      const gy = ((y + 1) / 2) * 100;
      glareEl.style.setProperty('--gx', `${gx}%`);
      glareEl.style.setProperty('--gy', `${gy}%`);
      glareEl.style.opacity = '1';
    }
  }, [max, scale, glare]);

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform  = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
    el.style.transition = 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)';

    const glareEl = el.querySelector('.tilt-glare');
    if (glareEl) glareEl.style.opacity = '0';
  }, []);

  return { ref, handlers: { onMouseMove, onMouseLeave } };
}

// ─────────────────────────────────────────────────────────────────
// Helper: one card that uses its own tilt instance
// ─────────────────────────────────────────────────────────────────
function TiltCard({ className, dataEmoji, children }) {
  const { ref, handlers } = useTilt({ max: 10, scale: 1.025, glare: true });
  return (
    <div
      ref={ref}
      className={className}
      data-emoji={dataEmoji}
      {...handlers}
    >
      {children}
    </div>
  );
}

function TiltEncourageCard({ children }) {
  const { ref, handlers } = useTilt({ max: 8, scale: 1.02, glare: false });
  return (
    <div ref={ref} className="encourage-card" {...handlers}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Star row helper
// ─────────────────────────────────────────────────────────────────
function StarRow({ filled = 0, total = 3, label }) {
  return (
    <div className="game-stars">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`star-icon ${i < filled ? 'lit' : ''}`}>⭐</span>
      ))}
      {label && <span className="stars-label">{label}</span>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Progress bar helper
// ─────────────────────────────────────────────────────────────────
function ProgressBar({ pct, levelLabel }) {
  return (
    <div className="game-progress">
      <div className="progress-meta">
        <span>{levelLabel}</span>
        <span>{Math.round(pct)}% done</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────
export default function GameHub() {
  const [userName,   setUserName]   = useState('Student');
  const [gameStats,  setGameStats]  = useState([]);
  const [totalStars, setTotalStars] = useState(0);

  // Per-game level state
  const [focusLevel,   setFocusLevel]   = useState(1);
  const [shapeLevel,   setShapeLevel]   = useState(1);
  const [emotionLevel, setEmotionLevel] = useState(1);

  const TOTAL_LEVELS = 4;

  /* ── Load & Fetch ── */
  useEffect(() => {
    const userString = localStorage.getItem('brightsteps_user');
    if (userString) {
      try {
        const user = JSON.parse(userString);
        setUserName(user.name || user.user?.name || 'Student');
        const id = user._id || user.user?.id;
        if (id) fetchGameStats(id);
      } catch { /* parse error */ }
    }

    const savedFocus   = localStorage.getItem('brightsteps_focus_unlocked');
    const savedShape   = localStorage.getItem('brightsteps_shapes_unlocked');
    const savedEmotion = localStorage.getItem('brightsteps_emotions_unlocked');
    if (savedFocus)   setFocusLevel(parseInt(savedFocus));
    if (savedShape)   setShapeLevel(parseInt(savedShape));
    if (savedEmotion) setEmotionLevel(parseInt(savedEmotion));
  }, []);

  const fetchGameStats = async (id) => {
    try {
      const res  = await fetch(`http://localhost:5001/api/progress/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setGameStats(data);
      setTotalStars(data.reduce((sum, g) => sum + (g.stars || 0), 0));

      const calcLevel = (name) => {
        const games = data.filter(g => g.gameName === name);
        if (!games.length) return 1;
        return Math.min(Math.max(...games.map(g => g.levelPlayed)) + 1, TOTAL_LEVELS);
      };
      setFocusLevel(calcLevel('FocusMatch'));
      setShapeLevel(calcLevel('ShapeSort'));
      setEmotionLevel(calcLevel('EmotionExplorer'));
    } catch { /* network error */ }
  };

  /* ── PDF Report ── */
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185);
    doc.text('Bright Steps — Student Game Report', 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Student: ${userName}`, 14, 30);
    doc.text(`Total Stars: ${totalStars}`, 14, 38);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 46);
    autoTable(doc, {
      head: [['Date', 'Game', 'Level', 'Stars', 'Moves']],
      body: gameStats.map(s => [
        new Date(s.date).toLocaleDateString(),
        s.gameName,
        `Level ${s.levelPlayed}`,
        `${s.stars} ⭐`,
        s.totalMoves,
      ]),
      startY: 55,
      theme: 'grid',
      headStyles: { fillColor: [61, 181, 160] },
    });
    doc.save(`${userName}_Game_Report.pdf`);
  };

  /* ── Progress % ── */
  const calcProgress = (gameName, currentUnlocked) => {
    const games = gameStats.filter(g => g.gameName === gameName);
    if (games.length > 0) {
      const unique = new Set(games.map(g => g.levelPlayed)).size;
      return (unique / TOTAL_LEVELS) * 100;
    }
    return ((currentUnlocked - 1) / TOTAL_LEVELS) * 100;
  };

  const focusPct   = calcProgress('FocusMatch',      focusLevel);
  const shapePct   = calcProgress('ShapeSort',        shapeLevel);
  const emotionPct = calcProgress('EmotionExplorer',  emotionLevel);

  /* ── Best stars per game ── */
  const bestStars = (name) => {
    const games = gameStats.filter(g => g.gameName === name);
    return games.length ? Math.max(...games.map(g => g.stars || 0)) : 0;
  };

  return (
    <div className="game-hub-container">

      {/* ══ HERO ══ */}
      <section className="hub-hero">
        {/* Floating decorations */}
        <span className="hero-deco deco-star1">⭐</span>
        <span className="hero-deco deco-star2">✨</span>
        <span className="hero-deco deco-star3">🌟</span>
        <span className="hero-deco deco-cloud1">☁️</span>
        <span className="hero-deco deco-cloud2">⛅</span>
        <span className="hero-deco deco-rocket">🚀</span>
        <span className="hero-deco deco-rainbow">🌈</span>
        <span className="hero-deco deco-balloon">🎈</span>
        <span className="hero-deco deco-heart">💛</span>
        <span className="hero-deco deco-music">🎵</span>

        {/* Top row: back + download */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2, marginBottom: 36 }}>
          <Link to="/dashboard" className="back-to-dash">
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <button className="download-report-btn" onClick={generatePDF}>
            <Download size={15} /> Download Report
          </button>
        </div>

        {/* Title */}
        <div className="hero-title-block">
          <div className="hero-emoji-row">
            <span>🎮</span><span>🧩</span><span>⭐</span><span>🎨</span><span>🏆</span>
          </div>
          <h1 className="hub-title">
            <span className="title-word tw-rose">Hi, {userName}!</span>{' '}
            <span className="title-word tw-amber">Let's</span>{' '}
            <span className="title-word tw-teal">Play!</span>
          </h1>
          <p className="hub-subtitle">
            Pick a game below and earn stars 🌟 Every level makes your brain stronger!
          </p>

          {/* Stat pills */}
          <div className="hero-stats">
            <div className="stat-pill sp-amber">⭐ {totalStars} Stars Earned</div>
            <div className="stat-pill sp-teal">🎮 3 Games Available</div>
            <div className="stat-pill sp-rose">🏅 Keep it up!</div>
          </div>
        </div>
      </section>

      {/* ══ CARDS ══ */}
      <section className="cards-section">
        <div className="cards-heading">
          <h2>🎯 Your Games</h2>
          <p>Drag, match, and explore — every game is a new adventure!</p>
        </div>

        <div className="game-cards-wrapper">

          {/* ── FOCUS MATCH ── */}
          <TiltCard className="game-menu-card focus-game" dataEmoji="🧠">
            <div className="game-icon-col">
              <div className="game-icon-large">
                <Award size={38} color="var(--sky-dk)" strokeWidth={2} />
              </div>
              <span className="new-badge invisible">NEW</span>
            </div>

            <div className="game-info">
              <h2>🧠 Focus Match</h2>
              <p>Find the matching pairs! Trains your working memory and helps you focus longer.</p>
              <div className="game-tags">
                <span className="tag">Memory</span>
                <span className="tag">Focus</span>
                <span className="tag">4 Levels</span>
              </div>
              <ProgressBar pct={focusPct} levelLabel={`Level ${focusLevel} / ${TOTAL_LEVELS}`} />
              <StarRow filled={bestStars('FocusMatch')} label="Best run" />
            </div>

            <div className="play-col">
              <Link to="/games/focus-match" className="play-button">
                <span className="play-btn-icon">▶</span>
                <span className="play-btn-text">Play!</span>
              </Link>
              <span className="players-label">👤 Solo</span>
            </div>
          </TiltCard>

          {/* ── SHAPE SORT ── */}
          <TiltCard className="game-menu-card shape-game" dataEmoji="🔷">
            <div className="game-icon-col">
              <div className="game-icon-large">
                <Shapes size={38} color="var(--rose-dk)" strokeWidth={2} />
              </div>
              <span className="new-badge invisible">NEW</span>
            </div>

            <div className="game-info">
              <h2>🎨 Shape Sort</h2>
              <p>Drag shapes into the right bins! Sharpens motor skills, logic, and colour recognition.</p>
              <div className="game-tags">
                <span className="tag">Motor Skills</span>
                <span className="tag">Logic</span>
                <span className="tag">4 Levels</span>
              </div>
              <ProgressBar pct={shapePct} levelLabel={`Level ${shapeLevel} / ${TOTAL_LEVELS}`} />
              <StarRow filled={bestStars('ShapeSort')} label="Best run" />
            </div>

            <div className="play-col">
              <Link to="/games/shape-sort" className="play-button">
                <span className="play-btn-icon">▶</span>
                <span className="play-btn-text">Play!</span>
              </Link>
              <span className="players-label">👤 Solo</span>
            </div>
          </TiltCard>

          {/* ── EMOTION EXPLORER ── */}
          <TiltCard className="game-menu-card emotion-game" dataEmoji="😊">
            <div className="game-icon-col">
              <div className="game-icon-large">
                <Smile size={38} color="var(--amber-dk)" strokeWidth={2} />
              </div>
              <span className="new-badge">NEW ✨</span>
            </div>

            <div className="game-info">
              <h2>😊 Emotion Explorer</h2>
              <p>Identify feelings and social cues through fun everyday stories and scenarios.</p>
              <div className="game-tags">
                <span className="tag">Emotions</span>
                <span className="tag">Social Skills</span>
                <span className="tag">4 Levels</span>
              </div>
              <ProgressBar pct={emotionPct} levelLabel={`Level ${emotionLevel} / ${TOTAL_LEVELS}`} />
              <StarRow filled={bestStars('EmotionExplorer')} label="Best run" />
            </div>

            <div className="play-col">
              <Link to="/games/emotion-explorer" className="play-button">
                <span className="play-btn-icon">▶</span>
                <span className="play-btn-text">Play!</span>
              </Link>
              <span className="players-label">👤 Solo</span>
            </div>
          </TiltCard>

        </div>
      </section>

      {/* ══ ENCOURAGE FOOTER ══ */}
      <section className="hub-footer-section">
        <div className="encourage-row">
          <TiltEncourageCard>
            <span className="ec-emoji">🏆</span>
            <div className="ec-text">
              <h3>You're doing amazing!</h3>
              <p>Every game you finish makes your brain grow stronger. Keep going — you've got this! 💪</p>
            </div>
          </TiltEncourageCard>

          <TiltEncourageCard>
            <span className="ec-emoji">🌟</span>
            <div className="ec-text">
              <h3>Stars for everything!</h3>
              <p>You earn up to 3 stars per level. Try to beat your best score and collect them all! ⭐</p>
            </div>
          </TiltEncourageCard>
        </div>
      </section>

    </div>
  );
}