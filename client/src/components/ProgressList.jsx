import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, Trash2, RefreshCcw } from 'lucide-react';

function ProgressList({ refreshTrigger }) {
  const [reports, setReports] = useState([]);

  const fetchReports = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/progress');
      const data = await response.json();
      setReports(data);
    } catch (error) { console.error('Error:', error); }
  };

  useEffect(() => { fetchReports(); }, [refreshTrigger]);

  const deleteReport = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    try {
      await fetch(`http://localhost:5001/api/progress/${id}`, { method: 'DELETE' });
      fetchReports();
    } catch (error) { console.error('Error:', error); }
  };

  const downloadPDF = (report) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(244, 149, 106);
    doc.text('BrightSteps Progress Report', 20, 22);
    autoTable(doc, {
      startY: 34,
      head: [['Category', 'Details']],
      body: [
        ['Student Name', report.studentName],
        ['Date', new Date(report.date).toLocaleDateString()],
        ['Activity', report.activity],
        ['Mood', report.mood],
        ['Notes', report.notes],
      ],
      headStyles: { fillColor: [56, 189, 248] },
      alternateRowStyles: { fillColor: [240, 253, 250] },
    });
    doc.save(`${report.studentName}_Progress.pdf`);
  };

  const moodEmoji = {
    Happy: '😊', Neutral: '😐', Frustrated: '😤',
    Excited: '🤩', Tired: '😴'
  };

  return (
    <div className="history-section">

      {/* Section header */}
      <div className="history-header">
        <h2>📊 Student Progress History</h2>
        <button className="btn-refresh" onClick={fetchReports} title="Refresh">
          <RefreshCcw size={20} />
        </button>
      </div>

      {/* No reports state */}
      {reports.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '48px 20px',
          color: 'var(--text-mid)', fontWeight: 700, fontSize: '1.05rem'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📭</div>
          No reports yet. Save your first one above!
        </div>
      )}

      {/* Report cards */}
      {reports.map((report, i) => (
        <div
          key={report._id}
          className="history-card"
          style={{ animationDelay: `${0.1 + i * 0.12}s` }}
        >
          {/* Name + badge */}
          <div className="history-card-name">
            👤 {report.studentName}
            <span className="name-badge">
              {moodEmoji[report.mood] || '😊'} {report.mood}
            </span>
          </div>

          {/* Detail pills */}
          <div className="history-detail">
            <span className="detail-pill">
              📅 <strong>{new Date(report.date).toLocaleDateString()}</strong>
            </span>
            {report.activity && (
              <span className="detail-pill">
                🎯 <strong>{report.activity}</strong>
              </span>
            )}
          </div>

          {/* Notes */}
          {report.notes && (
            <div className="history-notes">
              💬 "{report.notes}"
            </div>
          )}

          {/* Actions */}
          <div className="action-bar">
            <button
              onClick={() => downloadPDF(report)}
              className="btn-pdf"
            >
              <Download size={16} />
              PDF
            </button>
            <button
              onClick={() => deleteReport(report._id)}
              className="btn-delete"
              title="Delete report"
            >
              <Trash2 size={17} />
            </button>
          </div>
        </div>
      ))}

      {/* Encouragement footer */}
      {reports.length > 0 && (
        <div className="encourage-row" style={{ marginTop: '32px' }}>
          <div className="encourage-card">
            <span className="ec-emoji">🏆</span>
            <div className="ec-text">
              <h3>Great tracking!</h3>
              <p>Every report you save helps students grow and succeed every day.</p>
            </div>
          </div>
          <div className="encourage-card">
            <span className="ec-emoji">💛</span>
            <div className="ec-text">
              <h3>You're amazing!</h3>
              <p>Your dedication makes a real difference in every child's journey.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ProgressList;
