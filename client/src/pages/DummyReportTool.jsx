/**
 * DummyReportTool.jsx
 * ─────────────────────────────────────────────────
 * Standalone page for testing manual progress report creation.
 * Extracted from feature-reports TeacherDashboard's ProgressForm component.
 * Uses the same backend API: POST http://localhost:5001/api/progress
 * ─────────────────────────────────────────────────
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import './Dashboard.css';

const MOOD_OPTIONS = [
  { value: 'Happy',      emoji: '😊' },
  { value: 'Excited',    emoji: '🤩' },
  { value: 'Neutral',    emoji: '😐' },
  { value: 'Tired',      emoji: '😴' },
  { value: 'Frustrated', emoji: '😤' },
];

const AVATARS = ['👦', '👧', '🧒', '👶', '🧑', '🌟', '🎓', '🦄', '🐬', '🐸'];

const today = new Date().toISOString().split('T')[0];

export default function DummyReportTool() {
  const [formData, setFormData] = useState({
    studentName: '',
    date: today,
    activity: '',
    mood: 'Happy',
    notes: '',
  });
  const [selectedAvatar, setSelectedAvatar] = useState('👦');
  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Saving...');
    try {
      const res = await fetch('http://localhost:5001/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, avatar: selectedAvatar }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('✅ Report saved successfully!');
        setFormData({ studentName: '', date: today, activity: '', mood: 'Happy', notes: '' });
        setSelectedAvatar('👦');
      } else {
        setStatus(`❌ ${data.message || 'Failed to save'}`);
      }
    } catch (err) {
      setStatus('❌ Cannot connect to backend. Is the server running?');
    }
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '40px 24px', fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Back link */}
        <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-mid)', fontWeight: 800, textDecoration: 'none', marginBottom: 24 }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <div className="form-card">
          <div className="section-heading">
            <h2>📝 Manual Report Generator</h2>
            <p>Use this to test manual progress report creation until the Teacher Dashboard is fully integrated.</p>
          </div>

          {status && (
            <div style={{ padding: '12px 18px', borderRadius: 12, marginBottom: 20, background: status.startsWith('✅') ? '#eafff1' : '#fee2e2', color: status.startsWith('✅') ? '#16a34a' : '#991b1b', fontWeight: 800 }}>
              {status}
            </div>
          )}

          <form onSubmit={handleSubmit} className="progress-form-modern">

            {/* Avatar picker */}
            <div className="avatar-picker-section">
              <div className="avatar-display">
                <div className="avatar-display-img" style={{ background: 'linear-gradient(135deg,#38bdf8,#5ecfba)' }}>
                  {selectedAvatar}
                </div>
              </div>
              <span className="avatar-grid-label">Choose an avatar</span>
              <div className="avatar-grid">
                {AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={`avatar-option${selectedAvatar === emoji ? ' selected' : ''}`}
                    onClick={() => setSelectedAvatar(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">👤 Student Name</label>
              <input className="form-input" type="text" name="studentName" placeholder="Enter student name..." value={formData.studentName} onChange={handleChange} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">📅 Date</label>
                <input className="form-input" type="date" name="date" value={formData.date} min={today} max={today} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">😊 Mood</label>
                <select className="form-input" name="mood" value={formData.mood} onChange={handleChange}>
                  {MOOD_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>{m.emoji} {m.value}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">🎯 Activity Done</label>
              <input className="form-input" type="text" name="activity" placeholder="e.g. Reading, Puzzle, Sensory Play..." value={formData.activity} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label className="form-label">📓 Teacher's Notes</label>
              <textarea className="form-input textarea-modern" name="notes" placeholder="How was their session? Any highlights..." value={formData.notes} onChange={handleChange} />
            </div>

            <button type="submit" className="save-btn-modern">
              <Save size={16} /> Save Report
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
