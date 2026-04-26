import React, { useState } from 'react';

function ProgressForm({ onSave }) {
  const [formData, setFormData] = useState({
    studentName: '',
    date: '',
    activity: '',
    mood: 'Happy',
    notes: '',
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        alert('✅ Progress Saved!');
        setFormData({
          studentName: '',
          date: '',
          activity: '',
          mood: 'Happy',
          notes: '',
        });
        if (onSave) onSave();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="ui-card">
      <h2 style={{ fontFamily: 'Fredoka One', marginTop: 0, color: 'var(--text-dark)' }}>
        📝 New Report
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Student Name</label>
          <input
            className="form-input"
            type="text"
            name="studentName"
            value={formData.studentName}
            onChange={handleChange}
            placeholder="e.g. Alex Johnson"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Date</label>
          <input
            className="form-input"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Activity</label>
          <input
            className="form-input"
            type="text"
            name="activity"
            value={formData.activity}
            onChange={handleChange}
            placeholder="e.g. Reading, Math, Art..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">Mood</label>
          <select
            className="form-input"
            name="mood"
            value={formData.mood}
            onChange={handleChange}
          >
            <option value="Happy">😊 Happy</option>
            <option value="Neutral">😐 Neutral</option>
            <option value="Frustrated">😤 Frustrated</option>
            <option value="Excited">🤩 Excited</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea
            className="form-input"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Any observations or highlights..."
            style={{ minHeight: '100px', resize: 'vertical' }}
          />
        </div>

        <button type="submit" className="btn btn-primary">
          💾 Save Progress
        </button>
      </form>
    </div>
  );
}

export default ProgressForm;
