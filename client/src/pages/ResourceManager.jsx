
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Trash2, ExternalLink, LogOut } from 'lucide-react';
import './ResourceManager.css';

const TYPE_EMOJI  = { video: '🎬', pdf: '📄', link: '🔗' };
const TYPE_LABEL  = { video: 'Video', pdf: 'PDF Document', link: 'Educational Link' };

export default function ResourceManager() {
  const [resources, setResources] = useState([]);
  const [formData, setFormData] = useState({
    title: '', type: 'video', fileUrl: '', instructionalText: '',
  });

  useEffect(() => { fetchResources(); }, []);

  const fetchResources = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/resources');
      setResources(res.data);
    } catch (err) {
      console.error('Error fetching resources:', err);
    }
  };

  const handleSpeak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5001/api/resources', formData);
      if (res.status === 201 || res.status === 200) {
        alert('✨ Success! Resource saved.');
        setFormData({ title: '', type: 'video', fileUrl: '', instructionalText: '' });
        fetchResources();
      }
    } catch (err) {
      console.error('Error saving resource:', err);
      alert('❌ Error: Could not save the resource.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      console.log('Attempting to delete ID:', id);
      await axios.delete(`http://localhost:5001/api/resources/${id}`);
      fetchResources();
    } catch (err) {
      console.error('Error deleting resource:', err);
      alert('❌ Failed to delete the resource.');
    }
  };

  return (
    <div className="resource-manager">

      {/* ══════════════════════════
          ① HERO BANNER
      ══════════════════════════ */}
      <div className="rm-hero">

        {/* floating emoji decorations */}
        <span className="hero-deco deco-s1"  aria-hidden="true">⭐</span>
        <span className="hero-deco deco-s2"  aria-hidden="true">✨</span>
        <span className="hero-deco deco-s3"  aria-hidden="true">💫</span>
        <span className="hero-deco deco-c1"  aria-hidden="true">☁️</span>
        <span className="hero-deco deco-c2"  aria-hidden="true">🌤️</span>
        <span className="hero-deco deco-rkt" aria-hidden="true">🚀</span>
        <span className="hero-deco deco-bow" aria-hidden="true">🌈</span>
        <span className="hero-deco deco-bal" aria-hidden="true">🎈</span>
        <span className="hero-deco deco-hrt" aria-hidden="true">💛</span>
        <span className="hero-deco deco-pnc" aria-hidden="true">✏️</span>

        {/* back link */}
        <Link to="/dashboard" className="back-to-dash">
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        {/* logout */}
        <Link to="/logout" className="logout-btn">
          <LogOut size={16} />
          Log Out
        </Link>

        {/* title block */}
        <div className="hero-title-block">
          <div className="hero-emoji-row" aria-hidden="true">
            <span>👩‍🏫</span>
            <span>🌟</span>
            <span>📚</span>
            <span>🌟</span>
            <span>🎓</span>
          </div>

          <h1 className="hub-title">
            <span className="title-word tw-orange">Teacher</span>
            <span className="title-word tw-sky">Dashboard</span>
          </h1>

          <p className="hub-subtitle">
            Add new learning materials or remove old ones.<br />
            Students cannot access this page. 🔒
          </p>

          <div className="hero-stats">
            <span className="stat-pill sp-orange">📝 Add Resources</span>
            <span className="stat-pill sp-sky">📊 {resources.length} Saved</span>
            <span className="stat-pill sp-green">🏅 Keep Learning!</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════
          ② MAIN CONTENT
      ══════════════════════════ */}
      <div className="rm-content">

        {/* ── Form ── */}
        <form className="resource-form" onSubmit={handleSubmit}>
          <h2 className="form-heading">➕ Add New Resource</h2>

          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Counting to 10 Video"
              required
            />
          </div>

          <div className="form-group">
            <label>Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="video">🎬 Video</option>
              <option value="pdf">📄 PDF Document</option>
              <option value="link">🔗 Educational Link</option>
            </select>
          </div>

          <div className="form-group">
            <label>URL (Link or File Path)</label>
            <input
              type="text"
              value={formData.fileUrl}
              onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
              placeholder="https://..."
              required
            />
          </div>

          <div className="form-group">
            <label>Instructional Text (Accessibility / TTS)</label>
            <textarea
              value={formData.instructionalText}
              onChange={(e) => setFormData({ ...formData, instructionalText: e.target.value })}
              placeholder="Describe this resource in simple words…"
              required
            />
          </div>

          <button type="submit" className="add-btn">
            🌟 Save Resource
          </button>
        </form>

        {/* ── Cards heading ── */}
        <div className="cards-heading">
          <h2>🗂️ Manage Saved Resources</h2>
          <p>All your materials in one place — easy to update or remove.</p>
        </div>

        {/* ── Resource cards ── */}
        <div className="resource-list">
          {resources.map((res) => (
            <div key={res._id} className={`resource-item card-${res.type}`}>
              <div className="resource-item-inner">

                {/* type badge */}
                <span className={`type-badge badge-${res.type}`}>
                  {TYPE_EMOJI[res.type] || '📦'} {TYPE_LABEL[res.type] || res.type}
                </span>

                <h3>{res.title}</h3>

                {/* notes block */}
                <div className="notes-block">
                  🗒️ {res.instructionalText}
                </div>

                {/* detail pills */}
                <div className="detail-pills">
                  <span className="d-pill">📁 {res.type.toUpperCase()}</span>
                  <span className="d-pill">👤 Solo activity</span>
                </div>
              </div>

              {/* action bar */}
              <div className="card-actions">
                <button
                  className="tts-btn"
                  onClick={() => handleSpeak(res.instructionalText)}
                  type="button"
                >
                  🔊 Listen
                </button>

                <a
                  href={res.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="open-link"
                >
                  <ExternalLink size={14} /> Open
                </a>

                <button
                  className="delete-btn"
                  onClick={() => handleDelete(res._id)}
                  type="button"
                >
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════
          ③ ENCOURAGEMENT FOOTER
      ══════════════════════════ */}
      <div className="hub-footer-section">
        <div className="encourage-row">
          <div className="encourage-card">
            <span className="ec-emoji">🏆</span>
            <div className="ec-text">
              <h3>You're making a difference!</h3>
              <p>Every resource you add helps a student learn something amazing today. Keep up the great work!</p>
            </div>
          </div>
          <div className="encourage-card">
            <span className="ec-emoji">💛</span>
            <div className="ec-text">
              <h3>Amazing teacher!</h3>
              <p>Your dedication to creating accessible, friendly learning materials makes every student feel supported.</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}