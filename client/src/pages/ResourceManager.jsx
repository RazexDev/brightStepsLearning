import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ExternalLink, LogOut, FileText } from 'lucide-react';
import './ResourceManager.css';

const TYPE_EMOJI  = { video: '🎬', pdf: '📄', link: '🔗', offline: '🌳' };
const TYPE_LABEL  = { video: 'Video', pdf: 'PDF Document', link: 'Educational Link', offline: 'Offline Activity' };

export default function ResourceManager() {
  const [resources, setResources] = useState([]);
  const [studentName, setStudentName] = useState('Student');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [nextGoal, setNextGoal] = useState('');
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [selectedOfflineResource, setSelectedOfflineResource] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('brightsteps_user'));
    const activeName = storedUser?.name || 'Student';
    setStudentName(activeName);
    
    const fetchResources = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/resources/recommend/${encodeURIComponent(activeName)}`);
        setResources(res.data.resources || []);
        setCurrentLevel(res.data.currentLevel || 0);
        setNextGoal(res.data.nextGoal || '');
      } catch (err) {
        console.error('Error fetching resources:', err);
      }
    };
    fetchResources();
  }, []);

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="resource-manager">
      <div className="rm-hero">
        <span className="hero-deco deco-s1"  aria-hidden="true">⭐</span>
        <span className="hero-deco deco-s2"  aria-hidden="true">✨</span>
        <span className="hero-deco deco-c1"  aria-hidden="true">☁️</span>
        <span className="hero-deco deco-bow" aria-hidden="true">🌈</span>
        
        <Link to="/learning-hub" className="back-to-dash">
          <ArrowLeft size={16} />
          Back to Hub
        </Link>
        <Link to="/login" className="logout-btn" onClick={() => localStorage.clear()}>
          <LogOut size={16} />
          Log Out
        </Link>

        <div className="hero-title-block">
          <h1 className="hub-title">
            <span className="title-word tw-sky">Available</span>
            <span className="title-word tw-green">Resources</span>
          </h1>
          <p className="hub-subtitle">
            Explore all the fun learning materials your teacher unlocked for you!
          </p>
        </div>
      </div>

      <div className="rm-content">
        <div className="cards-heading">
          <h2>🗂️ Browse Your Materials</h2>
          <p>{resources.length} activities ready for {studentName}</p>
        </div>

        {/* ── PROGRESSION BANNER ── */}
        <div className="progression-banner" style={{ marginBottom: '40px' }}>
          <div className="banner-top">
            <div className="level-badge">
              ⭐ Level {currentLevel}
            </div>
            <div className="progress-bar-bg">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${(currentLevel / 25) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="next-goal-text">
            ✨ {nextGoal}
          </div>
        </div>

        <div className="resource-list">
          {resources.map((res) => (
            <div key={res._id} className={`resource-item card-${res.type}`}>
              <div className="resource-item-inner">
                <span className={`type-badge badge-${res.type}`}>
                  {TYPE_EMOJI[res.type] || '📦'} {TYPE_LABEL[res.type] || res.type}
                </span>

                <h3>{res.title}</h3>

                <div className="notes-block">
                  🗒️ {res.instructionalText}
                </div>

                <div className="detail-pills">
                  <span className="d-pill">📁 {res.type.toUpperCase()}</span>
                  <span className="d-pill levels-pill">⭐ Level {res.requiredLevel || 0}</span>
                </div>
              </div>

              <div className="card-actions">
                {res.type === 'pdf' && (
                  <button className="tts-btn" onClick={() => handleSpeak(res.instructionalText)} type="button">
                    🔊 Listen
                  </button>
                )}

                {res.type === 'offline' ? (
                  <button 
                    className="open-link" 
                    style={{ background: '#00b894', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px' }}
                    onClick={() => {
                      setSelectedOfflineResource(res);
                      setShowOfflineModal(true);
                    }}
                  >
                    <FileText size={15} /> View Instructions
                  </button>
                ) : res.fileUrl ? (
                  <a href={res.fileUrl} target="_blank" rel="noreferrer" className="open-link">
                    <ExternalLink size={14} /> Open
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

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
            }}>✕</button>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: '3rem' }}>🌳</div>
              <h2 style={{ fontFamily: 'Baloo 2, cursive', fontSize: '2rem', color: '#27ae60', margin: '10px 0 0' }}>{selectedOfflineResource.title}</h2>
            </div>
            <div style={{ background: '#e8f8f5', padding: '24px', borderRadius: '16px', fontSize: '1.2rem', color: '#2c3e50', lineHeight: 1.6, border: '2px solid #a3e4d7', whiteSpace: 'pre-wrap' }}>
              {selectedOfflineResource.offlineInstructions}
            </div>
            <button onClick={() => setShowOfflineModal(false)} style={{ width: '100%', padding: '16px', border: 'none', marginTop: '24px', borderRadius: '999px', cursor: 'pointer', background: 'linear-gradient(135deg, #27ae60, #2ecc71)', color: 'white', fontWeight: 700 }}>✅ I Completed It!</button>
          </div>
        </div>
      )}
    </div>
  );
}