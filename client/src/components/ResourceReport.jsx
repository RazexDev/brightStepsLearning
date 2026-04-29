import React, { useState, useEffect } from 'react';
import { Download, RefreshCcw } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ResourceReport({ studentId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('brightsteps_token');
      const res = await fetch(`/api/resources/report/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Error fetching resource report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [studentId]);

  const downloadPDF = () => {
    if (logs.length === 0) return;

    const doc = new jsPDF();

    // Header
    doc.setFillColor(61, 181, 160);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('BrightSteps — Resource Activity Report', 14, 14);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 24);

    // Table
    autoTable(doc, {
      startY: 40,
      head: [['Resource Name', 'Type', 'View Count', 'Last Viewed']],
      body: logs.map(l => [
        l.resourceName,
        (l.resourceType || 'unknown').toUpperCase(),
        `${l.viewCount}×`,
        new Date(l.lastViewed).toLocaleString(),
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [61, 181, 160],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: { fontSize: 9, textColor: [30, 16, 7] },
      alternateRowStyles: { fillColor: [245, 252, 250] },
      columnStyles: {
        0: { cellWidth: 80 },
        2: { halign: 'center', cellWidth: 28 },
      },
      margin: { left: 14, right: 14 },
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 8);
    }

    doc.save('Resource_Activity_Report.pdf');
  };

  return (
    <div style={{
      marginTop: '40px',
      background: 'white',
      borderRadius: '20px',
      padding: '28px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      border: '1.5px solid rgba(0,0,0,0.05)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
            📊 Resource Activity Report
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
            Resources your child has opened via the Learning Hub.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchReport} title="Refresh" style={refreshBtnStyle}>
            <RefreshCcw size={14} /> Refresh
          </button>
          <button onClick={downloadPDF} disabled={logs.length === 0} title="Download PDF" style={{
            ...refreshBtnStyle,
            background: '#3DB5A0',
            color: 'white',
            border: '1.5px solid #3DB5A0',
            opacity: logs.length === 0 ? 0.5 : 1,
          }}>
            <Download size={14} /> Download PDF
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>⏳ Loading resource activity…</div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📭</div>
          <p style={{ fontWeight: 700, margin: 0 }}>No resources opened yet.</p>
          <p style={{ fontSize: '0.85rem', margin: '6px 0 0' }}>When your child opens a resource, it will appear here.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderRadius: 12 }}>
                {['Resource Name', 'Type', 'View Count', 'Last Viewed'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={log._id || i} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 700, color: '#1e293b' }}>{log.resourceName}</span>
                  </td>
                  <td style={tdStyle}>
                    <span style={typeBadgeStyle(log.resourceType)}>
                      {typeEmoji(log.resourceType)} {(log.resourceType || 'unknown').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      background: '#eff6ff',
                      color: '#3b82f6',
                      borderRadius: '999px',
                      padding: '2px 12px',
                      fontWeight: 800,
                    }}>
                      {log.viewCount}×
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: '#64748b', fontSize: '0.82rem' }}>
                    {new Date(log.lastViewed).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Helpers ── */
function typeEmoji(type) {
  return { video: '🎬', pdf: '📄', link: '🔗', offline: '🌳' }[type] || '📦';
}

function typeBadgeStyle(type) {
  const map = {
    video:   { background: '#fff7ed', color: '#c2410c' },
    pdf:     { background: '#eff6ff', color: '#1d4ed8' },
    link:    { background: '#f0fdf4', color: '#15803d' },
    offline: { background: '#f7fee7', color: '#4d7c0f' },
  };
  const s = map[type] || { background: '#f8fafc', color: '#475569' };
  return {
    ...s,
    padding: '2px 10px',
    borderRadius: '999px',
    fontWeight: 800,
    fontSize: '0.78rem',
  };
}

const thStyle = {
  padding: '12px 16px',
  textAlign: 'left',
  fontWeight: 800,
  fontSize: '0.78rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#64748b',
};

const tdStyle = {
  padding: '14px 16px',
  verticalAlign: 'middle',
};

const refreshBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  borderRadius: '10px',
  border: '1.5px solid #e2e8f0',
  background: 'white',
  color: '#475569',
  fontWeight: 700,
  fontSize: '0.82rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
};
