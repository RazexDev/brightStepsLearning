import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RotateCcw, ChevronRight, Lock, Unlock } from 'lucide-react';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import './ShapeSort.css';

// --- GAME CONFIGURATION ---
const LEVEL_CONFIG = [
  { level: 1, label: 'Color Match',  emoji: '🎨', matchType: 'color',  binSpecs: ['red', 'blue', 'green'],                         shapeCount: 6 },
  { level: 2, label: 'Shape Match',  emoji: '🔷', matchType: 'shape',  binSpecs: ['circle', 'square', 'triangle'],                 shapeCount: 6 },
  { level: 3, label: 'Color & Shape',emoji: '✨', matchType: 'both',   binSpecs: ['red-circle', 'blue-square', 'green-triangle'],   shapeCount: 6 },
  { level: 4, label: 'Expert Sort',  emoji: '🏆', matchType: 'both',   binSpecs: ['red-square','blue-circle','green-square','red-triangle'], shapeCount: 8 },
];

const BIN_EMOJIS = { red: '🔴', blue: '🔵', green: '🟢', neutral: '💜' };

function fmtTime(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function getStars(moves, shapeCount) {
  if (moves <= shapeCount + 2) return 3;
  if (moves <= shapeCount + 5) return 2;
  return 1;
}

// --- DND SUB-COMPONENTS ---
function DraggableShape({ id, color, shape }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, cursor: 'grabbing', zIndex: 1000 }
    : { cursor: 'grab' };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`ss-shape ${color} ${shape}`}
      data-dragging={isDragging}
    />
  );
}

function DroppableBin({ id, colorClass, label, binEmoji, children }) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className={`ss-drop-bin ${colorClass} ${isOver ? 'highlight' : ''}`}>
      <span className="ss-bin-emoji">{binEmoji}</span>
      <p className="ss-bin-label">{label}</p>
      <div className="ss-bin-contents">{children}</div>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function ShapeSort() {
  const [currentLevel, setCurrentLevel]       = useState(1);
  const [highestUnlocked, setHighestUnlocked] = useState(1);
  const [shapes, setShapes]                   = useState([]);
  const [bins, setBins]                       = useState([]);
  const [moves, setMoves]                     = useState(0);
  const [gameWon, setGameWon]                 = useState(false);
  const [startTime, setStartTime]             = useState(null);
  const [elapsedSec, setElapsedSec]           = useState(0);
  const timerRef = useRef(null);

  // Parent Modal
  const [showParentModal, setShowParentModal] = useState(false);
  const [parentPassword, setParentPassword]   = useState('');
  const [passwordError, setPasswordError]     = useState('');
  const [isVerifying, setIsVerifying]         = useState(false);

  const playWinSound = () => {
    try {
      const audio = new Audio('/sounds/hooray.mp3');
      audio.volume = 0.4;
      audio.play();
    } catch (e) { /* audio blocked */ }
  };

  /* ── Load Progression ── */
  useEffect(() => {
    const saved = localStorage.getItem('brightsteps_shapes_unlocked');
    if (saved) setHighestUnlocked(parseInt(saved));
  }, []);

  /* ── Timer ── */
  useEffect(() => {
    if (gameWon || !startTime) return;
    timerRef.current = setInterval(
      () => setElapsedSec(Math.floor((Date.now() - startTime) / 1000)),
      1000
    );
    return () => clearInterval(timerRef.current);
  }, [startTime, gameWon]);

  /* ── Level Generator ── */
  useEffect(() => { initializeGame(currentLevel); }, [currentLevel]);

  const initializeGame = (levelNum) => {
    clearInterval(timerRef.current);
    const config  = LEVEL_CONFIG.find(c => c.level === levelNum);
    const allColors  = ['red', 'blue', 'green'];
    const allShapes  = ['circle', 'square', 'triangle'];
    const newBins    = [];
    const newShapes  = [];

    config.binSpecs.forEach(spec => {
      if (config.matchType === 'color') {
        newBins.push({ id: `bin-${spec}`, label: `${spec.toUpperCase()} Bin`, colorReq: spec, shapeReq: null, colorClass: spec });
      } else if (config.matchType === 'shape') {
        newBins.push({ id: `bin-${spec}`, label: `${spec.toUpperCase()}S`,    colorReq: null, shapeReq: spec, colorClass: 'neutral' });
      } else {
        const [col, shp] = spec.split('-');
        newBins.push({ id: `bin-${spec}`, label: `${col.toUpperCase()} ${shp.toUpperCase()}`, colorReq: col, shapeReq: shp, colorClass: col });
      }
    });

    for (let i = 0; i < config.shapeCount; i++) {
      const targetBin = newBins[i % newBins.length];
      const color = targetBin.colorReq || allColors[Math.floor(Math.random() * allColors.length)];
      const shape = targetBin.shapeReq || allShapes[Math.floor(Math.random() * allShapes.length)];
      newShapes.push({ id: `shape-${i}-${Date.now()}`, color, shape, bin: null });
    }

    setShapes(newShapes.sort(() => Math.random() - 0.5));
    setBins(newBins);
    setMoves(0);
    setGameWon(false);
    setElapsedSec(0);
    setStartTime(Date.now());
  };

  /* ── Drag Validation ── */
  const handleDragEnd = ({ active, over }) => {
    if (!over) return;
    const config       = LEVEL_CONFIG.find(c => c.level === currentLevel);
    const draggedShape = shapes.find(s => s.id === active.id);
    const targetBin    = bins.find(b => b.id === over.id);

    setMoves(prev => prev + 1);

    let isMatch = false;
    if (config.matchType === 'color' && draggedShape.color === targetBin.colorReq) isMatch = true;
    if (config.matchType === 'shape' && draggedShape.shape === targetBin.shapeReq) isMatch = true;
    if (config.matchType === 'both'  && draggedShape.color === targetBin.colorReq && draggedShape.shape === targetBin.shapeReq) isMatch = true;

    if (isMatch) {
      setShapes(prev => prev.map(s => s.id === active.id ? { ...s, bin: targetBin.id } : s));
    }
  };

  /* ── Win Condition ── */
  useEffect(() => {
    if (shapes.length === 0) return;
    const allSorted = shapes.every(s => s.bin !== null);
    if (!allSorted) return;

    clearInterval(timerRef.current);
    setGameWon(true);
    playWinSound();
    window.dispatchEvent(new CustomEvent('sparky-cheer', { detail: { gameName: 'Shape Sort' } }));

    if (currentLevel === highestUnlocked && currentLevel < LEVEL_CONFIG.length) {
      const next = currentLevel + 1;
      setHighestUnlocked(next);
      localStorage.setItem('brightsteps_shapes_unlocked', next.toString());
    }
    saveProgress();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapes]);

  const saveProgress = async () => {
    const config      = LEVEL_CONFIG.find(c => c.level === currentLevel);
    const starsEarned = getStars(moves, config.shapeCount);
    const userString  = localStorage.getItem('brightsteps_user');
    let childId       = 'guest_player';

    if (userString) {
      try {
        const user = JSON.parse(userString);
        childId = user._id || user.user?.id || 'guest_player';
      } catch { /* parse error */ }
    }

    const payload = {
      childId, gameName: 'ShapeSort', levelPlayed: currentLevel,
      score: 100, stars: starsEarned, completionTime: elapsedSec,
      totalMoves: moves, date: new Date().toISOString(),
    };
    try {
      await fetch('http://localhost:5001/api/progress', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch { /* API error */ }
  };

  /* ── Parent Gate ── */
  const verifyParentPassword = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
      const user     = JSON.parse(localStorage.getItem('brightsteps_user'));
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email || user.user?.email, password: parentPassword }),
      });
      if (response.ok) {
        setHighestUnlocked(LEVEL_CONFIG.length);
        localStorage.setItem('brightsteps_shapes_unlocked', LEVEL_CONFIG.length.toString());
        setShowParentModal(false);
      } else { setPasswordError('Incorrect password. Try again! 🔒'); }
    } catch { setPasswordError('Server error. Please try again.'); }
    finally   { setIsVerifying(false); }
  };

  const config = LEVEL_CONFIG[currentLevel - 1];
  const stars  = getStars(moves, config.shapeCount);
  const sorted = shapes.filter(s => s.bin !== null).length;

  return (
    <div className="shapesort-root">

      {/* ── Parent Modal ── */}
      {showParentModal && (
        <div className="ss-modal-overlay">
          <div className="ss-modal">
            <div className="ss-modal-icon">🔒</div>
            <h3>Parent Access</h3>
            <p>Enter your password to unlock all Shape Sort levels.</p>
            <form onSubmit={verifyParentPassword}>
              <input
                type="password"
                placeholder="Enter password…"
                value={parentPassword}
                onChange={e => setParentPassword(e.target.value)}
                required
                autoFocus
              />
              {passwordError && <div className="ss-modal-error">⚠️ {passwordError}</div>}
              <div className="ss-modal-actions">
                <button type="button" className="ss-modal-cancel" onClick={() => { setShowParentModal(false); setPasswordError(''); }}>
                  Cancel
                </button>
                <button type="submit" className="ss-modal-submit" disabled={isVerifying}>
                  {isVerifying ? '⏳ Checking…' : '🔓 Unlock All'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="ss-header">
        <div className="ss-header-top">
          <Link to="/games" className="ss-back-link">
            <ArrowLeft size={15} /> Games Hub
          </Link>

          <div className="ss-title-block">
            <h1>🎨 Shape Sort</h1>
          </div>

          <button className="ss-restart-btn" onClick={() => initializeGame(currentLevel)}>
            <RotateCcw size={15} /> Restart
          </button>
        </div>

        {/* Level Buttons */}
        <div className="ss-level-row">
          {LEVEL_CONFIG.map(c => {
            const unlocked = highestUnlocked >= c.level;
            return (
              <button
                key={c.level}
                onClick={() => unlocked && setCurrentLevel(c.level)}
                className={`ss-level-btn ${currentLevel === c.level ? 'active' : ''} ${!unlocked ? 'locked' : ''}`}
                disabled={!unlocked}
              >
                {unlocked ? c.emoji : <Lock size={11} />} Lvl {c.level}
              </button>
            );
          })}

          {highestUnlocked < LEVEL_CONFIG.length && (
            <button className="ss-parent-unlock-btn" onClick={() => setShowParentModal(true)}>
              <Unlock size={11} /> Parent Mode
            </button>
          )}
        </div>

        {/* Stats */}
        {!gameWon && (
          <div className="ss-stats">
            <div className="ss-stat-item">
              <span className="ss-stat-label">Moves</span>
              <span className="ss-stat-value">👣 {moves}</span>
            </div>
            <div className="ss-stat-divider" />
            <div className="ss-stat-item">
              <span className="ss-stat-label">Sorted</span>
              <span className="ss-stat-value">🎯 {sorted}/{shapes.length}</span>
            </div>
            <div className="ss-stat-divider" />
            <div className="ss-stat-item">
              <span className="ss-stat-label">Time</span>
              <span className="ss-stat-value">⏱ {fmtTime(elapsedSec)}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Game Area ── */}
      <div className="ss-main">
        {gameWon ? (
          /* ── Win Screen ── */
          <div className="ss-win-screen">
            <div className="ss-win-card">
              <div className="ss-win-confetti-strip" />
              <span className="ss-win-emoji">🎉</span>
              <h2>You Sorted Them All!</h2>
              <p className="ss-win-subtitle">Incredible work! You're a sorting superstar ⭐</p>

              <div className="ss-win-stars">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span key={i} className={`ss-star ${i >= stars ? 'empty' : ''}`}>⭐</span>
                ))}
              </div>

              <div className="ss-win-meta">
                <div className="ss-win-meta-item">
                  <span>Moves</span>
                  <span>👣 {moves}</span>
                </div>
                <div className="ss-win-meta-item">
                  <span>Time</span>
                  <span>⏱ {fmtTime(elapsedSec)}</span>
                </div>
                <div className="ss-win-meta-item">
                  <span>Stars</span>
                  <span>⭐ {stars}/3</span>
                </div>
              </div>

              <div className="ss-win-btn-row">
                <button className="ss-btn-secondary" onClick={() => initializeGame(currentLevel)}>
                  <RotateCcw size={15} /> Play Again
                </button>
                {currentLevel < LEVEL_CONFIG.length && (
                  <button className="ss-btn-primary" onClick={() => setCurrentLevel(currentLevel + 1)}>
                    Next Level <ChevronRight size={15} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ── Active Game ── */
          <DndContext onDragEnd={handleDragEnd}>
            <div className="ss-level-badge">
              {config.emoji} Level {config.level}: {config.label}
            </div>

            {/* Bins */}
            <div
              className="ss-bins-grid"
              style={{ gridTemplateColumns: `repeat(${bins.length}, 1fr)` }}
            >
              {bins.map(b => (
                <DroppableBin
                  key={b.id}
                  id={b.id}
                  label={b.label}
                  colorClass={b.colorClass}
                  binEmoji={BIN_EMOJIS[b.colorClass] || '🟣'}
                >
                  {shapes
                    .filter(s => s.bin === b.id)
                    .map(s => (
                      <DraggableShape key={s.id} id={s.id} color={s.color} shape={s.shape} />
                    ))
                  }
                </DroppableBin>
              ))}
            </div>

            {/* Shape Bank */}
            <div className="ss-shape-bank">
              <span className="ss-shape-bank-label">🧩 Shape Bank</span>
              {shapes
                .filter(s => s.bin === null)
                .map(s => (
                  <DraggableShape key={s.id} id={s.id} color={s.color} shape={s.shape} />
                ))
              }
            </div>
          </DndContext>
        )}
      </div>
    </div>
  );
}