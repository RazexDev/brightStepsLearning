import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, Unlock, RotateCcw, ChevronRight } from 'lucide-react';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import './ShapeSort.css';
import './FocusMatch.css'; // Reusing the beautiful buttons & UI from Game 1

// --- GAME CONFIGURATION ENGINE ---
const LEVEL_CONFIG = [
  { level: 1, label: 'Color Match', matchType: 'color', binSpecs: ['red', 'blue', 'green'], shapeCount: 6 },
  { level: 2, label: 'Shape Match', matchType: 'shape', binSpecs: ['circle', 'square', 'triangle'], shapeCount: 6 },
  { level: 3, label: 'Color & Shape', matchType: 'both', binSpecs: ['red-circle', 'blue-square', 'green-triangle'], shapeCount: 6 },
  { level: 4, label: 'Expert Sort', matchType: 'both', binSpecs: ['red-square', 'blue-circle', 'green-square', 'red-triangle'], shapeCount: 8 },
];

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
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    cursor: 'grabbing',
    zIndex: 1000,
  } : { cursor: 'grab' };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={`draggable-item ${color} ${shape}`} />
  );
}

function DroppableBin({ id, colorClass, label, children }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`drop-bin ${colorClass} ${isOver ? 'highlight' : ''}`}>
      <h3>{label}</h3>
      <div className="bin-contents">{children}</div>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function ShapeSort() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [highestUnlocked, setHighestUnlocked] = useState(1);
  const [shapes, setShapes] = useState([]);
  const [bins, setBins] = useState([]);
  
  // Game Stats
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const timerRef = useRef(null);

  // Parent Modal
  const [showParentModal, setShowParentModal] = useState(false);
  const [parentPassword, setParentPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Sound logic
  const playWinSound = () => {
    try {
      const winAudio = new Audio('/sounds/hooray.mp3');
      winAudio.volume = 0.4;
      winAudio.play();
    } catch (e) { console.log("Audio blocked"); }
  };

  /* ── Load Progression ── */
  useEffect(() => {
    const saved = localStorage.getItem('brightsteps_shapes_unlocked');
    if (saved) setHighestUnlocked(parseInt(saved));
  }, []);

  /* ── Timer ── */
  useEffect(() => {
    if (gameWon || !startTime) return;
    timerRef.current = setInterval(() => setElapsedSec(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(timerRef.current);
  }, [startTime, gameWon]);

  /* ── Level Generator ── */
  useEffect(() => { initializeGame(currentLevel); }, [currentLevel]);

  const initializeGame = (levelNum) => {
    clearInterval(timerRef.current);
    const config = LEVEL_CONFIG.find(c => c.level === levelNum);
    
    let newBins = [];
    let newShapes = [];
    const allColors = ['red', 'blue', 'green'];
    const allShapes = ['circle', 'square', 'triangle'];

    // 1. Generate the logical Bins
    config.binSpecs.forEach(spec => {
      if (config.matchType === 'color') {
        newBins.push({ id: `bin-${spec}`, label: `${spec.toUpperCase()} Bin`, colorReq: spec, shapeReq: null, colorClass: spec });
      } else if (config.matchType === 'shape') {
        newBins.push({ id: `bin-${spec}`, label: `${spec.toUpperCase()}S`, colorReq: null, shapeReq: spec, colorClass: 'neutral' });
      } else {
        const [col, shp] = spec.split('-');
        newBins.push({ id: `bin-${spec}`, label: `${col.toUpperCase()} ${shp.toUpperCase()}`, colorReq: col, shapeReq: shp, colorClass: col });
      }
    });

    // 2. Generate solvable Shapes
    for (let i = 0; i < config.shapeCount; i++) {
      const targetBin = newBins[i % newBins.length];
      const color = targetBin.colorReq || allColors[Math.floor(Math.random() * allColors.length)];
      const shape = targetBin.shapeReq || allShapes[Math.floor(Math.random() * allShapes.length)];
      newShapes.push({ id: `shape-${i}-${Date.now()}`, color, shape, bin: null });
    }

    // Shuffle shapes
    setShapes(newShapes.sort(() => Math.random() - 0.5));
    setBins(newBins);
    setMoves(0);
    setGameWon(false);
    setElapsedSec(0);
    setStartTime(Date.now());
  };

  /* ── Drag & Drop Validation Logic ── */
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return; // Dropped outside

    const config = LEVEL_CONFIG.find(c => c.level === currentLevel);
    const draggedShape = shapes.find(s => s.id === active.id);
    const targetBin = bins.find(b => b.id === over.id);

    setMoves(prev => prev + 1);

    // The core validation logic matching your requirements
    let isMatch = false;
    if (config.matchType === 'color' && draggedShape.color === targetBin.colorReq) isMatch = true;
    if (config.matchType === 'shape' && draggedShape.shape === targetBin.shapeReq) isMatch = true;
    if (config.matchType === 'both' && draggedShape.color === targetBin.colorReq && draggedShape.shape === targetBin.shapeReq) isMatch = true;

    if (isMatch) {
      setShapes(prev => prev.map(s => s.id === active.id ? { ...s, bin: targetBin.id } : s));
    }
  };

  /* ── Win Condition & DB Save ── */
  useEffect(() => {
    const allSorted = shapes.every(s => s.bin !== null);
    if (allSorted && shapes.length > 0) {
      clearInterval(timerRef.current);
      setGameWon(true);
      playWinSound();

      if (currentLevel === highestUnlocked && currentLevel < LEVEL_CONFIG.length) {
        const next = currentLevel + 1;
        setHighestUnlocked(next);
        localStorage.setItem('brightsteps_shapes_unlocked', next.toString());
      }
      saveProgress();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapes]);

  const saveProgress = async () => {
    const config = LEVEL_CONFIG.find(c => c.level === currentLevel);
    const starsEarned = getStars(moves, config.shapeCount);
    const userString = localStorage.getItem('brightsteps_user');
    let childId = 'guest_player';
    
    if (userString) {
      try {
        const user = JSON.parse(userString);
        childId = user._id || user.user?.id || 'guest_player';
      } catch (e) { console.error(e); }
    }

    const payload = { childId, gameName: "ShapeSort", levelPlayed: currentLevel, score: 100, stars: starsEarned, completionTime: elapsedSec, totalMoves: moves, date: new Date().toISOString() };
    
    try {
      await fetch('http://localhost:5001/api/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (error) { console.error("API error", error); }
  };

  /* ── Parent Gate ── */
  const verifyParentPassword = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
      const user = JSON.parse(localStorage.getItem('brightsteps_user'));
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email || user.user?.email, password: parentPassword }),
      });
      if (response.ok) {
        setHighestUnlocked(LEVEL_CONFIG.length);
        localStorage.setItem('brightsteps_shapes_unlocked', LEVEL_CONFIG.length.toString());
        setShowParentModal(false);
      } else { setPasswordError('Incorrect password.'); }
    } catch { setPasswordError('Server error.'); } finally { setIsVerifying(false); }
  };

  const config = LEVEL_CONFIG[currentLevel - 1];
  const stars = getStars(moves, config.shapeCount);

  return (
    <div className="focus-match-container"> {/* Reusing background layout */}
      
      {/* Parent Modal */}
      {showParentModal && (
        <div className="parent-modal-overlay">
          <div className="parent-modal">
            <div className="modal-icon">🔒</div>
            <h3>Parent Access</h3>
            <p>Unlock all Shape Sort levels.</p>
            <form onSubmit={verifyParentPassword}>
              <input type="password" placeholder="Password..." value={parentPassword} onChange={e => setParentPassword(e.target.value)} required autoFocus />
              {passwordError && <div className="modal-error">⚠️ {passwordError}</div>}
              <div className="modal-actions">
                <button type="button" className="modal-btn btn-cancel" onClick={() => setShowParentModal(false)}>Cancel</button>
                <button type="submit" className="modal-btn btn-verify" disabled={isVerifying}>{isVerifying ? '⏳' : '🔓 Unlock'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="game-header">
        <div className="header-top-row">
          <Link to="/games" className="back-link"><ArrowLeft size={16} /> Games Hub</Link>
          <div className="game-title-wrap"><h1>🎨 Shape Sort</h1></div>
          <button className="restart-btn" onClick={() => initializeGame(currentLevel)}><RotateCcw size={16} /> Restart</button>
        </div>

        {/* Level Controls */}
        <div className="level-controls">
          <div className="level-selector">
            {LEVEL_CONFIG.map(c => (
              <button key={c.level} onClick={() => highestUnlocked >= c.level && setCurrentLevel(c.level)} className={`level-btn ${currentLevel === c.level ? 'active' : ''} ${highestUnlocked >= c.level ? 'unlocked' : 'locked'}`} disabled={highestUnlocked < c.level}>
                {highestUnlocked < c.level ? <><Lock size={12} /> Lvl {c.level}</> : <>Lvl {c.level}</>}
              </button>
            ))}
          </div>
          {highestUnlocked < LEVEL_CONFIG.length && (
            <button onClick={() => setShowParentModal(true)} className="parent-unlock-btn"><Unlock size={12} /> Parent Mode</button>
          )}
        </div>

        {/* Live Stats */}
        {!gameWon && (
          <div className="game-stats">
            <div className="stat-item"><span className="stat-label">Moves</span><span className="stat-value">👣 {moves}</span></div>
            <div className="stat-divider" />
            <div className="stat-item"><span className="stat-label">Sorted</span><span className="stat-value">🎯 {shapes.filter(s => s.bin !== null).length}/{shapes.length}</span></div>
            <div className="stat-divider" />
            <div className="stat-item"><span className="stat-label">Time</span><span className="stat-value">⏱ {fmtTime(elapsedSec)}</span></div>
          </div>
        )}
      </div>

      <div className="game-main">
        {gameWon ? (
          <div className="win-screen-wrap">
            <div className="win-screen">
              <h2>You Sorted Them All!</h2>
              <div className="win-stars">{Array.from({ length: 3 }).map((_, i) => (<span key={i}>{i < stars ? '⭐' : '✩'}</span>))}</div>
              <div className="win-btn-row">
                <button className="play-again-btn" onClick={() => initializeGame(currentLevel)}><RotateCcw size={17} /> Play Again</button>
                {currentLevel < LEVEL_CONFIG.length && (
                  <button className="next-level-btn" onClick={() => setCurrentLevel(currentLevel + 1)}>Next Level <ChevronRight size={17} /></button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <DndContext onDragEnd={handleDragEnd}>
            <div className="level-intro-badge">Level {currentLevel}: {config.label}</div>
            
            {/* The Bins */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${bins.length}, 1fr)`, gap: '1rem', marginBottom: '3rem', width: '100%' }}>
              {bins.map(b => (
                <DroppableBin key={b.id} id={b.id} label={b.label} colorClass={b.colorClass}>
                  {shapes.filter(s => s.bin === b.id).map(s => <DraggableShape key={s.id} id={s.id} color={s.color} shape={s.shape} />)}
                </DroppableBin>
              ))}
            </div>

            {/* The Shape Bank */}
            <div style={{ backgroundColor: '#f5f6fa', padding: '2rem', borderRadius: '16px', display: 'flex', gap: '1rem', justifyContent: 'center', minHeight: '120px', width: '100%', flexWrap: 'wrap' }}>
              {shapes.filter(s => s.bin === null).map(s => <DraggableShape key={s.id} id={s.id} color={s.color} shape={s.shape} />)}
            </div>
          </DndContext>
        )}
      </div>
    </div>
  );
}