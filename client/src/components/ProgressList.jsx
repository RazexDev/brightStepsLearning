import React, { useEffect, useState } from 'react';
import { Download, Trash2, RefreshCcw } from 'lucide-react';

const MOOD_EMOJI = {
  Happy: '😊',
  Excited: '🤩',
  Neutral: '😐',
  Frustrated: '😤',
};

function ProgressList({ refreshTrigger }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/progress');
      const data = await response.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [refreshTrigger]);

  const deleteReport = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    try {
      await fetch(`/api/progress/${id}`, { method: 'DELETE' });
      fetchReports();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const downloadPDF = async (report) => {
    try {
      // Dynamic import so jsPDF is only loaded when needed
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();

      // ── Header ──────────────────────────────────────────────────────
      doc.setFillColor(56, 178, 172);
      doc.rect(0, 0, 220, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('BrightSteps Progress Report', 14, 19);

      // ── Body ────────────────────────────────────────────────────────
      doc.setTextColor(0, 0, 0);
      autoTable(doc, {
        startY: 38,
        head: [['Category', 'Details']],
        body: [
          ['Student Name', report.studentName],
          ['Date', new Date(report.date).toLocaleDateString()],
          ['Activity', report.activity || '—'],
          ['Mood', `${MOOD_EMOJI[report.mood] || ''} ${report.mood}`],
          ['Notes', report.notes || '—'],
        ],
        headStyles: { fillColor: [56, 178, 172], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 253, 250] },
        styles: { font: 'helvetica', fontSize: 11 },
      });

      doc.save(`${report.studentName.replace(/\s+/g, '_')}_Progress.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Could not generate PDF. Make sure jspdf and jspdf-autotable are installed.');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>
        ⏳ Loading reports...
      </div>
    );
  }

  return (
    <div style={{ marginTop: '50px' }}>
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h2 style={{ fontFamily: 'Fredoka One', margin: 0, color: 'var(--text-dark)' }}>
          📊 Progress History
        </h2>
        <button
          onClick={fetchReports}
          title="Refresh"
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            padding: '6px',
          }}
        >
          <RefreshCcw size={22} color="var(--primary-color)" />
        </button>
      </div>

      {/* Empty State */}
      {reports.length === 0 ? (
        <div
          className="ui-card"
          style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-light)' }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
          <p style={{ fontFamily: 'Fredoka One', fontSize: '1.2rem' }}>No reports yet.</p>
          <p>Fill in the form above to save your first progress report!</p>
        </div>
      ) : (
        reports.map((report) => (
          <div key={report._id} className="ui-card" style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Small background icon */}
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                right: '-8px',
                bottom: '-8px',
                fontSize: '6rem',
                opacity: 0.06,
                pointerEvents: 'none',
                userSelect: 'none',
                lineHeight: 1,
              }}
            >
              {MOOD_EMOJI[report.mood] || '📋'}
            </span>

            <h3
              style={{
                fontFamily: 'Fredoka One',
                margin: '0 0 14px 0',
                fontSize: '1.4rem',
                color: 'var(--text-dark)',
              }}
            >
              {report.studentName}
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              <p style={{ margin: 0 }}>
                <strong>📅 Date:</strong>{' '}
                {new Date(report.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
              <p style={{ margin: 0 }}>
                <strong>🎯 Activity:</strong> {report.activity || '—'}
              </p>
            </div>

            {/* Mood Badge */}
            <div style={{ marginBottom: '12px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--bg-color)',
                  border: '2px solid var(--primary-color)',
                  color: 'var(--primary-color)',
                  borderRadius: '999px',
                  padding: '4px 14px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                {MOOD_EMOJI[report.mood] || '😊'} {report.mood}
              </span>
            </div>

            {report.notes && (
              <p
                style={{
                  margin: '0 0 6px',
                  fontStyle: 'italic',
                  color: 'var(--text-light)',
                  lineHeight: 1.6,
                  background: 'var(--bg-color)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-soft)',
                }}
              >
                "{report.notes}"
              </p>
            )}

            {/* Actions */}
            <div className="action-bar">
              <button
                onClick={() => downloadPDF(report)}
                className="btn btn-primary"
                style={{ width: 'auto', marginTop: 0, padding: '8px 20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Download size={16} /> PDF
              </button>
              <button
                onClick={() => deleteReport(report._id)}
                className="btn btn-danger"
                style={{ padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default ProgressList;
