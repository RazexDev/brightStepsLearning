// NOTE: Per architecture rules, this file is saved as LearningHub.jsx (NOT StudentDashboard.jsx)
// The existing StudentDashboard.jsx with the 3D Canvas is preserved separately.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Volume2, PlayCircle, FileText, ExternalLink, LogOut, Sparkles, Download, RefreshCcw, Lock, X, Eye, EyeOff } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { downloadSingleReportPDF } from '../utils/pdfGenerator';
import './ResourceManager.css';
import './Dashboard.css'; 

export default function LearningHub() {
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  
  const [currentLevel, setCurrentLevel] = useState(0);
  const [progressPct, setProgressPct] = useState(0);
  const [nextGoal, setNextGoal] = useState('');
  const [studentName, setStudentName] = useState('Student');
  const [reports, setReports]         = useState([]);

  // ── Parent PIN Gateway state ──
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinValue,     setPinValue]     = useState('');
  const [pinError,     setPinError]     = useState('');
  const [pinLoading,   setPinLoading]   = useState(false);
  const [showPin,      setShowPin]      = useState(false);

  // ── Offline Modal state ──
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [selectedOfflineResource, setSelectedOfflineResource] = useState(null);

  const MOOD_CONFIG = {
    Happy:      { emoji: '😊', cls: 'mood-happy'      },
    Neutral:    { emoji: '😐', cls: 'mood-neutral'    },
    Frustrated: { emoji: '😤', cls: 'mood-frustrated' },
    Excited:    { emoji: '🤩', cls: 'mood-excited'    },
    Tired:      { emoji: '😴', cls: 'mood-tired'      },
  };

  const fetchReports = async (name) => {
    try {
      if (!name) return;
      const res = await axios.get(`http://localhost:5001/api/progress?studentName=${encodeURIComponent(name)}`);
      setReports([...res.data].sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
  };

  const downloadPDF = (report) => {
    downloadSingleReportPDF(report, 'My BrightSteps Progress Report');
  };

  const logProgressAndRefresh = async (activityTitle, type) => {
    try {
      await axios.post('http://localhost:5001/api/progress', {
        studentName,
        date: new Date(),
        activity: activityTitle,
        mood: 'Happy',
        notes: `Completed ${type} Resource: ${activityTitle}`,
        stars: 2, 
        totalMoves: 0,
        completionTime: 0,
        gameName: 'Learning Material'
      });
      
      // Refresh the level and recommendations dynamically
      const res = await axios.get(`http://localhost:5001/api/resources/recommend/${encodeURIComponent(studentName)}`);
      const newLevel = res.data.currentLevel || 0;
      const newPct = res.data.progressPct || 0;

      if (newLevel > currentLevel) {
        setProgressPct(100);
        setTimeout(() => {
          setCurrentLevel(newLevel);
          setProgressPct(newPct);
          setNextGoal(res.data.nextGoal || '');
          setResources(res.data.resources || []);
          fetchReports(studentName);
        }, 800);
      } else {
        setCurrentLevel(newLevel);
        setProgressPct(newPct);
        setNextGoal(res.data.nextGoal || '');
        setResources(res.data.resources || []);
        fetchReports(studentName);
      }
    } catch (err) {
      console.error('Error logging progress:', err);
    }
  };

  useEffect(() => {
    // Auth Check — reads the logged-in user from localStorage
    const storedUser = JSON.parse(localStorage.getItem('brightsteps_user'));
    const activeName = storedUser?.name || 'Student';
    setStudentName(activeName);

    const fetchRecommendations = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/resources/recommend/${encodeURIComponent(activeName)}`);
        setResources(res.data.resources || []);
        setCurrentLevel(res.data.currentLevel || 0);
        setProgressPct(res.data.progressPct || 0);
        setNextGoal(res.data.nextGoal || '');
      } catch (err) {
        console.error("Error fetching recommendations:", err);
      }
    };

    fetchRecommendations();
    fetchReports(activeName);
  }, []);

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); 
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85; 
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Oops! Your browser doesn't support the Listen feature.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('brightsteps_token');
    localStorage.removeItem('brightsteps_user');
    navigate('/login');
  };

  // ── Parent PIN verification ──
  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setPinError('');
    if (pinValue.length !== 4) { setPinError('PIN must be exactly 4 digits.'); return; }
    setPinLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('brightsteps_user'));
      const res  = await fetch('http://localhost:5001/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?._id, pin: pinValue }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem('parent_unlocked', 'true');
        setShowPinModal(false);
        navigate('/parent-dashboard');
      } else {
        setPinError(data.message || 'Incorrect PIN. Please try again.');
      }
    } catch {
      setPinError('Cannot connect to server.');
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <div className="student-container" style={{ backgroundColor: '#fdfbfb', minHeight: '100vh', padding: '40px', position: 'relative' }}>

      {/* ── Floating Parent Portal Button ── */}
      <button
        onClick={() => { setPinValue(''); setPinError(''); setShowPinModal(true); }}
        title="Parent Portal"
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 999,
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg, #3DB5A0, #44A7CE)',
          color: 'white', border: 'none',
          padding: '12px 22px', borderRadius: '999px',
          fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '0.95rem',
          cursor: 'pointer', boxShadow: '0 4px 0 #1E8C78, 0 8px 24px rgba(61,181,160,0.35)',
          transition: 'transform 0.12s, box-shadow 0.12s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 0 #1E8C78, 0 12px 32px rgba(61,181,160,0.4)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 0 #1E8C78, 0 8px 24px rgba(61,181,160,0.35)'; }}
      >
        <Lock size={17} /> Parent Portal
      </button>

      {/* ── PIN Modal Overlay ── */}
      {showPinModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(30,16,7,0.55)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: '#FEFCF5', borderRadius: 28,
            padding: '40px 36px', maxWidth: 400, width: '100%',
            boxShadow: '0 8px 0 rgba(30,16,7,0.12), 0 24px 64px rgba(30,16,7,0.22)',
            border: '2px solid rgba(30,16,7,0.07)', position: 'relative',
            animation: 'pinModalIn 0.25s cubic-bezier(0.2,0.8,0.2,1) both',
          }}>
            <style>{`
              @keyframes pinModalIn {
                from { opacity: 0; transform: scale(0.92) translateY(12px); }
                to   { opacity: 1; transform: scale(1) translateY(0); }
              }
            `}</style>

            {/* Close */}
            <button onClick={() => setShowPinModal(false)} style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(30,16,7,0.07)', border: 'none',
              borderRadius: '50%', width: 34, height: 34,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#6B4C30',
            }}><X size={18} /></button>

            {/* Icon */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(135deg, #3DB5A0, #44A7CE)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px', boxShadow: '0 4px 0 #1E8C78',
              }}>
                <Lock size={28} color="white" />
              </div>
              <h2 style={{ fontFamily: 'Baloo 2, Fredoka One, cursive', fontSize: '1.5rem', color: '#1E1007', margin: 0 }}>
                Parent Portal
              </h2>
              <p style={{ color: '#6B4C30', fontWeight: 700, fontSize: '0.9rem', margin: '6px 0 0' }}>
                Enter your 4-digit PIN to continue.
              </p>
            </div>

            {/* Error */}
            {pinError && (
              <div style={{
                background: '#FDEAE6', border: '1.5px solid #E85C45',
                borderRadius: 12, padding: '10px 14px',
                color: '#C0422F', fontWeight: 800, fontSize: '0.88rem',
                marginBottom: 16,
              }}>⚠️ {pinError}</div>
            )}

            {/* Form */}
            <form onSubmit={handlePinSubmit}>
              <div style={{ position: 'relative', marginBottom: 20 }}>
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={4}
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  placeholder="••••"
                  value={pinValue}
                  onChange={e => setPinValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  style={{
                    width: '100%', padding: '16px 48px 16px 20px',
                    border: '2px solid rgba(30,16,7,0.12)',
                    borderRadius: 14, fontSize: '1.4rem',
                    fontFamily: 'Nunito, sans-serif', fontWeight: 800,
                    textAlign: 'center', letterSpacing: '0.3em',
                    background: '#FFF8EC', outline: 'none',
                    color: '#1E1007', boxSizing: 'border-box',
                  }}
                  autoFocus
                />
                <button type="button" onClick={() => setShowPin(p => !p)} style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#B8906A',
                }}>
                  {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button type="submit" disabled={pinLoading || pinValue.length !== 4} style={{
                width: '100%', padding: '14px', border: 'none',
                borderRadius: '999px', cursor: pinLoading || pinValue.length !== 4 ? 'not-allowed' : 'pointer',
                background: pinValue.length === 4 ? 'linear-gradient(135deg,#3DB5A0,#44A7CE)' : 'rgba(30,16,7,0.08)',
                color: pinValue.length === 4 ? 'white' : '#B8906A',
                fontFamily: 'Baloo 2, cursive', fontSize: '1rem', fontWeight: 700,
                boxShadow: pinValue.length === 4 ? '0 4px 0 #1E8C78' : 'none',
                transition: 'background 0.2s',
              }}>
                {pinLoading ? 'Verifying…' : '🔓 Unlock Portal'}
              </button>
            </form>
          </div>
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 className="splash-title" style={{ fontSize: '3rem', color: '#6C5CE7', margin: 0 }}>
          🌟 {studentName}'s Learning Hub 🌟
        </h1>
        
        <button onClick={handleLogout} className="tts-btn" style={{ backgroundColor: '#ef4444', color: 'white' }}>
          <LogOut size={18} style={{ marginRight: '8px' }} /> Log Out
        </button>
      </div>

      {/* ── PROGRESSION BANNER ── */}
      <div className="progression-banner">
        <div className="banner-top">
          <div className="level-badge">
            ⭐ Level {currentLevel}
          </div>
          <div className="progress-bar-bg">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${progressPct}%`, transition: 'width 0.5s ease-out' }}
            ></div>
          </div>
        </div>
        <div className="next-goal-text">
          <Sparkles size={18} style={{ color: '#f39c12', marginRight: '8px' }} />
          {nextGoal}
        </div>
      </div>

      <div className="student-grid">
        {resources.map((res) => (
          <div key={res._id} className={`student-card card-${res.type}`}>
            <div className="card-level-pill">Level {res.requiredLevel || 0}</div>
            
            <div className="card-icon">
              {res.type === 'video' ? '📺' : res.type === 'pdf' ? '📖' : res.type === 'offline' ? '🌳' : '🔗'}
            </div>
            
            <h2 style={{ fontFamily: 'Fredoka One, cursive', color: 'white', marginBottom: '15px' }}>
              {res.title}
            </h2>

            {res.type === 'pdf' && (
              <button 
                className="action-btn" 
                onClick={() => handleSpeak(res.instructionalText)}
                style={{ width: '100%', marginBottom: '10px', backgroundColor: '#f6b93b', color: '#2d3436' }}
              >
                <Volume2 size={20} style={{ marginRight: '8px' }} /> Listen to Instructions
              </button>
            )}

            {res.type === 'offline' ? (
              <button 
                className="action-btn" 
                style={{ width: '100%', backgroundColor: '#27ae60', color: 'white' }}
                onClick={() => {
                  setSelectedOfflineResource(res);
                  setShowOfflineModal(true);
                }}
              >
                <FileText size={20} />
                <span style={{ marginLeft: '8px' }}>View Instructions</span>
              </button>
            ) : (
              <a 
                href={res.fileUrl} 
                target="_blank" 
                rel="noreferrer" 
                style={{ textDecoration: 'none' }}
                onClick={() => logProgressAndRefresh(res.title, res.type === 'video' ? 'Video' : res.type === 'pdf' ? 'PDF Document' : 'Link')}
              >
                <button className="action-btn" style={{ width: '100%', backgroundColor: '#333', color: 'white' }}>
                  {res.type === 'video' ? <PlayCircle size={20} /> : res.type === 'pdf' ? <FileText size={20} /> : <ExternalLink size={20} />}
                  <span style={{ marginLeft: '8px' }}>Start Learning</span>
                </button>
              </a>
            )}
          </div>
        ))}
        
        {resources.length === 0 && (
          <h3 style={{ textAlign: 'center', color: '#b2bec3', width: '100%' }}>
            No activities available right now. Let's play a game first!
          </h3>
        )}
      </div>

      {/* ══════════════════════════════════════
          MY PROGRESS REPORTS — History Section
      ══════════════════════════════════════ */}
      <div className="history-wrapper" style={{ marginTop: 48 }}>
        <div className="history-topbar">
          <div>
            <h2 className="history-title">📖 My Reports</h2>
            <p className="history-subtitle">See what your teacher wrote about you.</p>
          </div>
          <button className="btn-refresh-modern" onClick={() => fetchReports(studentName)}>
            <RefreshCcw size={17} /> Refresh
          </button>
        </div>

        {reports.length === 0 ? (
          <div className="history-empty">
            <div className="history-empty-icon">📭</div>
            <h3>No reports yet!</h3>
            <p>Your teacher will add your progress here soon.</p>
          </div>
        ) : (
          <div className="history-grid">
            {reports.map((r, i) => {
              const mood = MOOD_CONFIG[r.mood] || MOOD_CONFIG.Happy;
              return (
                <div key={r._id} className="history-card-modern" style={{ animationDelay: `${0.05 + i * 0.08}s` }}>
                  <div className="card-top">
                    <h3 className="student-name">📅 {new Date(r.date).toLocaleDateString()}</h3>
                    <span className={`mood-badge ${mood.cls}`}>{mood.emoji} {r.mood}</span>
                  </div>
                  <div className="info-row">
                    <div className="info-chip">
                      <span className="chip-label">🎯 What I did</span>
                      <span className="chip-value">{r.activity || 'Something fun!'}</span>
                    </div>
                  </div>
                  <div className="notes-box">
                    <div className="notes-title">💬 What my teacher said</div>
                    <p>{r.notes || 'Great work today! Keep it up!'}</p>
                  </div>
                  <div className="card-actions">
                    <button className="btn-action btn-pdf-modern" onClick={() => downloadPDF(r)}>
                      <Download size={15} /> My Report
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── OFFLINE ACTIVITY MODAL ── */}
      {showOfflineModal && selectedOfflineResource && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(30,16,7,0.7)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: '#FEFCF5', borderRadius: 28,
            padding: '40px', maxWidth: 600, width: '100%',
            boxShadow: '0 8px 0 rgba(30,16,7,0.12), 0 24px 64px rgba(30,16,7,0.22)',
            position: 'relative',
          }}>
            <button onClick={() => setShowOfflineModal(false)} style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(30,16,7,0.07)', border: 'none',
              borderRadius: '50%', width: 34, height: 34,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#6B4C30',
            }}><X size={18} /></button>
            
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: '3rem' }}>🌳</div>
              <h2 style={{ fontFamily: 'Baloo 2, cursive', fontSize: '2rem', color: '#27ae60', margin: '10px 0 0' }}>
                {selectedOfflineResource.title}
              </h2>
            </div>
            
            <div style={{ 
              background: '#e8f8f5', padding: '24px', borderRadius: '16px', 
              fontSize: '1.2rem', color: '#2c3e50', lineHeight: 1.6,
              border: '2px solid #a3e4d7', fontFamily: 'Nunito, sans-serif',
              whiteSpace: 'pre-wrap'
            }}>
              {selectedOfflineResource.offlineInstructions}
            </div>

            <button 
              onClick={async () => {
                await logProgressAndRefresh(selectedOfflineResource.title, 'Offline Activity');
                setShowOfflineModal(false);
                setSelectedOfflineResource(null);
              }} 
              style={{
                width: '100%', padding: '16px', border: 'none', marginTop: '24px',
                borderRadius: '999px', cursor: 'pointer',
                background: 'linear-gradient(135deg, #27ae60, #2ecc71)', color: 'white',
                fontFamily: 'Baloo 2, cursive', fontSize: '1.2rem', fontWeight: 700,
                boxShadow: '0 4px 0 #219a52',
              }}
            >
              ✅ I Completed It!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
