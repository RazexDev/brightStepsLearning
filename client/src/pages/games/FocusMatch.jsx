import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, Unlock, RotateCcw, ChevronRight } from 'lucide-react';
import './FocusMatch.css';

const ALL_EMOJIS = ['🐶','🐱','🐰','🐼','🦊','🐸','🦁','🐮','🐷','🐵','🦉','🦄'];

const LEVEL_CONFIG = [
  { level: 1, pairs: 3,  columns: 3, label: 'Easy',   emoji: '🌱' },
  { level: 2, pairs: 4,  columns: 4, label: 'Medium',  emoji: '🌿' },
  { level: 3, pairs: 6,  columns: 4, label: 'Hard',    emoji: '🌳' },
  { level: 4, pairs: 8,  columns: 4, label: 'Expert',  emoji: '🏆' },
];

/* 18 emoji bubbles — mix of calm friendly icons */
const BUBBLES = [
  '⭐','🌟','✨','🎈','🌈','🦋',
  '🌸','🍀','💛','🎵','🚀','☁️',
  '🌙','💫','🐝','🌺','🎨','🍭',
];

function getStars(moves, pairs) {
  if (moves <= pairs + 2) return 3;
  if (moves <= pairs + 6) return 2;
  return 1;
}

function fmtTime(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function FocusMatch() {
  const [currentLevel,    setCurrentLevel]    = useState(1);
  const [highestUnlocked, setHighestUnlocked] = useState(1);
  const [cards,           setCards]           = useState([]);
  const [flippedIndices,  setFlippedIndices]  = useState([]);
  const [matchedPairs,    setMatchedPairs]    = useState([]);
  const [moves,           setMoves]           = useState(0);
  const [isLocked,        setIsLocked]        = useState(false);
  const [gameWon,         setGameWon]         = useState(false);
  const [startTime,       setStartTime]       = useState(null);
  const [elapsedSec,      setElapsedSec]      = useState(0);
  
  // Parent Modal State
  const [showParentModal, setShowParentModal] = useState(false);
  const [parentPassword,  setParentPassword]  = useState('');
  const [passwordError,   setPasswordError]   = useState('');
  const [isVerifying,     setIsVerifying]     = useState(false);

  const timerRef = useRef(null);

  /* ── Audio Logic (Soft Positive Reinforcement) ── */
  const playWinSound = () => {
    try {
      const winAudio = new Audio('/sounds/hooray.mp3');
      winAudio.volume = 0.4; // Soft volume to prevent sensory overload
      winAudio.play();
    } catch (error) {
      console.log("Audio playback was prevented by the browser.", error);
    }
  };

  /* ── Load saved progression ── */
  useEffect(() => {
    const saved = localStorage.getItem('brightsteps_focus_unlocked');
    if (saved) setHighestUnlocked(parseInt(saved));
  }, []);

  /* ── Init game on level change ── */
  useEffect(() => { initializeGame(currentLevel); }, [currentLevel]);

  /* ── Live Timer ── */
  useEffect(() => {
    if (gameWon || !startTime) return;
    timerRef.current = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [startTime, gameWon]);

  const initializeGame = (levelNum) => {
    clearInterval(timerRef.current);
    const config  = LEVEL_CONFIG.find(c => c.level === levelNum);
    const emojis  = ALL_EMOJIS.slice(0, config.pairs);
    const shuffled = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji }));
    
    setCards(shuffled);
    setFlippedIndices([]);
    setMatchedPairs([]);
    setMoves(0);
    setGameWon(false);
    setElapsedSec(0);
    setStartTime(Date.now());
  };

  /* ── Gameplay Logic ── */
  const handleCardClick = (index) => {
    if (isLocked || flippedIndices.includes(index) || matchedPairs.includes(cards[index].emoji)) return;

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setIsLocked(true);
      setMoves(prev => prev + 1);

      const firstCard  = cards[newFlipped[0]].emoji;
      const secondCard = cards[newFlipped[1]].emoji;

      if (firstCard === secondCard) {
        setMatchedPairs(prev => [...prev, firstCard]);
        setFlippedIndices([]);
        setIsLocked(false);
      } else {
        setTimeout(() => {
          setFlippedIndices([]);
          setIsLocked(false);
        }, 1200);
      }
    }
  };

  /* ── Save Progress to MongoDB ── */
  const saveProgress = useCallback(async (totalPairs) => {
    const starsEarned = getStars(moves, totalPairs); 
    const userString = localStorage.getItem('brightsteps_user');
    
    // Safely get user ID, fallback to 'guest_player' if not logged in
    let childId = 'guest_player';
    if (userString) {
        try {
            const user = JSON.parse(userString);
            if (user && user._id) {
                childId = user._id; // Use the actual MongoDB ObjectId
            } else if (user && user.user && user.user.id) {
                childId = user.user.id; // Fallback depending on exactly how your auth payload is structured
            }
        } catch (e) {
            console.error("Error parsing user data", e);
        }
    }

    const payload = {
      childId: childId,
      gameName: "FocusMatch",
      levelPlayed: currentLevel,
      score: 100, 
      stars: starsEarned,
      completionTime: elapsedSec,
      totalMoves: moves,
      date: new Date().toISOString()
    };
    
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log("✅ Successfully saved game stats to MongoDB!");
      } else {
        console.error("❌ Backend rejected the save request.");
      }
    } catch (error) {
      console.error("❌ Failed to connect to backend API:", error);
    }
  }, [currentLevel, elapsedSec, moves]);

  /* ── Check Win Condition & Trigger Save ── */
  useEffect(() => {
    const config = LEVEL_CONFIG.find(c => c.level === currentLevel);
    if (config && matchedPairs.length === config.pairs && config.pairs > 0) {
      clearInterval(timerRef.current);
      setGameWon(true);
      const event = new CustomEvent('sparky-cheer', { detail: { gameName: 'Focus Match' } });
      window.dispatchEvent(event);
      
      // 👉 Trigger the positive reinforcement sound
      playWinSound();
      
      // Unlock next level if applicable
      if (currentLevel === highestUnlocked && currentLevel < LEVEL_CONFIG.length) {
        const next = currentLevel + 1;
        setHighestUnlocked(next);
        localStorage.setItem('brightsteps_focus_unlocked', next.toString());
      }

      // Save to database
      saveProgress(config.pairs);
    }
  }, [matchedPairs, currentLevel, highestUnlocked, saveProgress]);

  /* ── Parent Gate Logic ── */
  const handleParentUnlockClick = () => {
    setShowParentModal(true);
    setPasswordError('');
    setParentPassword('');
  };

  const verifyParentPassword = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    setPasswordError('');
    try {
      const userString = localStorage.getItem('brightsteps_user');
      if (!userString) throw new Error('No user found');
      
      const user = JSON.parse(userString);
      const userId = user._id || user.id || user.user?._id || user.user?.id;

      const response = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, pin: parentPassword }),
      });
      
      if (response.ok) {
        setHighestUnlocked(LEVEL_CONFIG.length);
        localStorage.setItem('brightsteps_focus_unlocked', LEVEL_CONFIG.length.toString());
        setShowParentModal(false);
      } else {
        setPasswordError('Incorrect PIN. Please try again.');
      }
    } catch {
      setPasswordError('Server connection error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const config = LEVEL_CONFIG[currentLevel - 1];
  const stars  = getStars(moves, config.pairs);

  return (
    <div className="focus-match-container">

      {/* Floating Background */}
      <div className="infinity-bg" aria-hidden="true">
        {BUBBLES.map((emoji, i) => (
          <span key={i} className={`bubble b${i + 1}`}>{emoji}</span>
        ))}
      </div>

      {/* Parent Modal */}
      {showParentModal && (
        <div className="parent-modal-overlay">
          <div className="parent-modal">
            <div className="modal-icon">🔒</div>
            <h3>Parent Access</h3>
            <p>Enter your 4-digit PIN to unlock all levels instantly.</p>
            <form onSubmit={verifyParentPassword}>
              <input
                type="password"
                placeholder="Enter PIN..."
                value={parentPassword}
                onChange={e => setParentPassword(e.target.value)}
                required autoFocus
              />
              {passwordError && <div className="modal-error">⚠️ {passwordError}</div>}
              <div className="modal-actions">
                <button type="button" className="modal-btn btn-cancel" onClick={() => setShowParentModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="modal-btn btn-verify" disabled={isVerifying}>
                  {isVerifying ? '⏳ Checking...' : '🔓 Unlock All'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="game-header">
        <div className="header-top-row">
          <Link to="/games" className="back-link">
            <ArrowLeft size={16} /> Games Hub
          </Link>
          <div className="game-title-wrap">
            <h1>🃏 Focus Match</h1>
          </div>
          <button className="restart-btn" onClick={() => initializeGame(currentLevel)}>
            <RotateCcw size={16} /> Restart
          </button>
        </div>

        {/* Level Controls */}
        <div className="level-controls">
          <div className="level-selector">
            {LEVEL_CONFIG.map(c => (
              <button
                key={c.level}
                onClick={() => highestUnlocked >= c.level && setCurrentLevel(c.level)}
                className={`level-btn ${currentLevel === c.level ? 'active' : ''} ${highestUnlocked >= c.level ? 'unlocked' : 'locked'}`}
                disabled={highestUnlocked < c.level}
              >
                {highestUnlocked < c.level
                  ? <><Lock size={12} /> Level {c.level}</>
                  : <>{c.emoji} Level {c.level}</>
                }
              </button>
            ))}
          </div>
          {highestUnlocked < LEVEL_CONFIG.length && (
            <button onClick={handleParentUnlockClick} className="parent-unlock-btn">
              <Unlock size={12} /> Parent Mode: Unlock All
            </button>
          )}
        </div>

        {/* Live Stats */}
        {!gameWon && (
          <div className="game-stats">
            <div className="stat-item">
              <span className="stat-label">Moves</span>
              <span className="stat-value">👣 {moves}</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-label">Matches</span>
              <span className="stat-value">🎯 {matchedPairs.length}/{config.pairs}</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-label">Time</span>
              <span className="stat-value">⏱ {fmtTime(elapsedSec)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Game Area */}
      <div className="game-main">
        {gameWon ? (

          /* Win Screen */
          <div className="win-screen-wrap">
            <div className="win-screen">
              <div className="win-confetti-row">
                {['🎉','🌟','🏆','🌟','🎉'].map((e, i) => <span key={i}>{e}</span>)}
              </div>
              <h2>You Did It!</h2>
              <p className="win-sub">Level {currentLevel} — {config.label} complete!</p>
              <div className="win-stars">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span key={i}>{i < stars ? '⭐' : '✩'}</span>
                ))}
              </div>
              <div className="win-stat-row">
                <div className="win-stat-pill">👣 {moves} moves</div>
                <div className="win-stat-pill">⏱ {fmtTime(elapsedSec)}</div>
                <div className="win-stat-pill">🎯 {config.pairs} pairs</div>
              </div>
              <div className="win-btn-row">
                <button className="play-again-btn" onClick={() => initializeGame(currentLevel)}>
                  <RotateCcw size={17} /> Play Again
                </button>
                {currentLevel < LEVEL_CONFIG.length && (
                  <button className="next-level-btn" onClick={() => setCurrentLevel(currentLevel + 1)}>
                    Next Level <ChevronRight size={17} />
                  </button>
                )}
              </div>
            </div>
          </div>

        ) : (

          /* Game Board */
          <>
            <div className="level-intro-badge">
              <span className="level-dot" />
              {config.emoji} Level {currentLevel} · {config.label} · {config.pairs} pairs
            </div>

            <div
              className="game-board"
              style={{ gridTemplateColumns: `repeat(${config.columns}, 1fr)` }}
            >
              {cards.map((card, index) => {
                const isFlipped = flippedIndices.includes(index) || matchedPairs.includes(card.emoji);
                const isMatched = matchedPairs.includes(card.emoji);

                return (
                  <div
                    key={index}
                    className={`memory-card${isFlipped ? ' flipped' : ''}${isMatched ? ' matched' : ''}`}
                    onClick={() => handleCardClick(index)}
                  >
                    <div className="card-face card-front">
                      {card.emoji}
                    </div>
                    <div className="card-face card-back">
                      ?
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

    </div>
  );
}