import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCcw, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Dashboard.css';

const NAV_ITEMS = [
  { id: 'home',     icon: '≡ƒÅá', label: 'Home'       },
  { id: 'reports',  icon: '≡ƒôï', label: 'Reports'    },
  { id: 'progress', icon: '≡ƒôê', label: 'Progress'   },
  { id: 'messages', icon: '≡ƒÆ¼', label: 'Messages'   },
];

const MOOD_CONFIG = {
  Happy:      { emoji:'≡ƒÿè', cls:'mood-happy'      },
  Neutral:    { emoji:'≡ƒÿÉ', cls:'mood-neutral'    },
  Frustrated: { emoji:'≡ƒÿñ', cls:'mood-frustrated' },
  Excited:    { emoji:'≡ƒñ⌐', cls:'mood-excited'    },
  Tired:      { emoji:'≡ƒÿ┤', cls:'mood-tired'      },
};

export default function ParentDashboard() {
  const navigate   = useNavigate();
  const [activeNav, setActiveNav] = useState('home');
  const [reports,   setReports]   = useState([]);

  // In real app, childName comes from auth context / JWT
  // Here we use a placeholder
  const childName  = 'Emma Johnson';
  const childEmoji = '≡ƒæº';
  const childClass = 'Class 3B';
  const childAge   = '8 years';

  const fetchReports = async () => {
    try {
      const res  = await fetch(`http://localhost:5000/api/progress?studentName=${encodeURIComponent(childName)}`);
      const data = await res.json();
      setReports([...data].sort((a,b) => new Date(b.date)-new Date(a.date)));
    } catch { console.error('Fetch failed'); }
  };

  useEffect(() => { fetchReports(); }, []);

  const downloadPDF = report => {
    const doc = new jsPDF();
    doc.setFontSize(22); doc.setTextColor(56,189,248);
    doc.text('BrightSteps ΓÇö Child Progress Report', 20, 22);
    autoTable(doc, {
      startY:34,
      head:[['Category','Details']],
      body:[['Student',report.studentName],['Date',new Date(report.date).toLocaleDateString()],['Activity',report.activity||'-'],['Mood',report.mood||'-'],['Notes',report.notes||'-']],
      headStyles:{ fillColor:[94,207,186] },
      alternateRowStyles:{ fillColor:[240,253,250] },
    });
    doc.save(`${report.studentName}_Report.pdf`);
  };

  const totalHappy = reports.filter(r => r.mood === 'Happy' || r.mood === 'Excited').length;

  return (
    <div className="dashboard-wrapper role-parent">

      {/* ΓöÇΓöÇ NAV ΓöÇΓöÇ */}
      <nav className="dash-nav">
        <a href="#" className="nav-logo">
          <div className="nav-logo-icon parent">≡ƒîê</div>
          BrightSteps
        </a>
        <ul className="nav-links">
          {NAV_ITEMS.map(item => (
            <li key={item.id}>
              <button className={`nav-link${activeNav===item.id?' active':''}`} onClick={()=>setActiveNav(item.id)}>
                {item.icon} {item.label}
              </button>
            </li>
          ))}
        </ul>
        <div className="nav-right">
          <div className="nav-avatar-chip">
            <div className="nav-avatar parent">≡ƒæ⌐</div>
            <div>
              <div className="nav-avatar-name">Mrs. Johnson</div>
              <span className="nav-role-badge badge-parent">Parent</span>
            </div>
          </div>
          <button className="btn-nav-logout" onClick={()=>navigate('/')}>≡ƒÜ¬ Log Out</button>
        </div>
      </nav>

      {/* ΓöÇΓöÇ HERO ΓöÇΓöÇ */}
      <div className="dashboard-hero hero-parent">
        <span className="hero-deco deco-1" aria-hidden>≡ƒîê</span>
        <span className="hero-deco deco-2" aria-hidden>Γ¡É</span>
        <span className="hero-deco deco-3" aria-hidden>≡ƒÆ½</span>
        <span className="hero-deco deco-4" aria-hidden>Γÿü∩╕Å</span>
        <span className="hero-deco deco-5" aria-hidden>≡ƒÄê</span>
        <span className="hero-deco deco-6" aria-hidden>≡ƒî╕</span>
        <span className="hero-deco deco-7" aria-hidden>Γ£¿</span>
        <span className="hero-deco deco-8" aria-hidden>≡ƒªï</span>
        <span className="hero-deco deco-9" aria-hidden>≡ƒÆ¢</span>
        <span className="hero-deco deco-10" aria-hidden>≡ƒîƒ</span>

        <div className="hero-inner">
          <div className="hero-title-block">
            <div className="hero-emoji-row" aria-hidden><span>≡ƒæ¿ΓÇì≡ƒæ⌐ΓÇì≡ƒæº</span><span>≡ƒÆ¢</span><span>≡ƒîƒ</span><span>≡ƒôû</span></div>
            <h1 className="dashboard-title">
              <span className="title-word tw-sky">Parent</span>
              <span className="title-word tw-green">Portal</span>
            </h1>
            <p className="hero-subtitle">
              Stay connected with {childName.split(' ')[0]}'s daily learning journey. ≡ƒÆ¢
            </p>
            <div className="hero-stats">
              <span className="stat-pill sp-sky">≡ƒôï {reports.length} Reports</span>
              <span className="stat-pill sp-green">≡ƒÿè {totalHappy} Happy Days</span>
              <span className="stat-pill sp-yellow">≡ƒÄ» View Only</span>
            </div>
          </div>

          {/* Child profile card */}
          <div className="hero-profile-card">
            <div className="profile-avatar-wrap">
              <div className="profile-avatar parent">{childEmoji}</div>
              <div className="profile-status-dot"/>
            </div>
            <div className="profile-name">{childName}</div>
            <div className="profile-role role-tag-parent">≡ƒÄÆ {childClass}</div>
            <div className="profile-stats-row">
              <div className="profile-stat">
                <span className="profile-stat-num">{reports.length}</span>
                <span className="profile-stat-label">Reports</span>
              </div>
              <div className="profile-divider"/>
              <div className="profile-stat">
                <span className="profile-stat-num">{childAge}</span>
                <span className="profile-stat-label">Age</span>
              </div>
              <div className="profile-divider"/>
              <div className="profile-stat">
                <span className="profile-stat-num">Γ¡É</span>
                <span className="profile-stat-label">Star</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ΓöÇΓöÇ MAIN ΓöÇΓöÇ */}
      <main className="dashboard-main">
        <div className="dashboard-main-inner">

          {/* Child detail banner */}
          <div className="parent-child-card">
            <div className="child-card-inner">
              <div className="child-avatar-section">
                <div className="child-avatar">{childEmoji}</div>
                <span className="child-name">{childName.split(' ')[0]}</span>
              </div>
              <div className="child-details">
                <h2>≡ƒæ¿ΓÇì≡ƒæ⌐ΓÇì≡ƒæº My Child's Profile</h2>
                <div className="child-meta-row">
                  <span className="child-meta-pill">≡ƒÄÆ {childClass}</span>
                  <span className="child-meta-pill">≡ƒÄé {childAge}</span>
                  <span className="child-meta-pill">≡ƒôï {reports.length} Reports</span>
                  <span className="child-meta-pill">≡ƒÿè {totalHappy} Happy Days</span>
                </div>
                <p style={{ color:'var(--text-mid)', fontWeight:700, fontSize:'0.95rem', lineHeight:1.6 }}>
                  You are viewing progress reports for <strong>{childName}</strong> only.
                  All reports are submitted by the class teacher.
                </p>
              </div>
            </div>
          </div>

          {/* Reports */}
          <div className="history-wrapper">
            <div className="history-topbar">
              <div>
                <h2 className="history-title">≡ƒôÜ {childName.split(' ')[0]}'s Reports</h2>
                <p className="history-subtitle">Daily progress submitted by the teacher.</p>
              </div>
              <button className="btn-refresh-modern" onClick={fetchReports}><RefreshCcw size={17}/> Refresh</button>
            </div>

            {reports.length === 0 ? (
              <div className="history-empty">
                <div className="history-empty-icon">≡ƒô¡</div>
                <h3>No reports yet</h3>
                <p>Reports will appear here once the teacher submits them.</p>
              </div>
            ) : (
              <div className="history-grid">
                {reports.map((r, i) => {
                  const mood = MOOD_CONFIG[r.mood] || MOOD_CONFIG.Happy;
                  return (
                    <div key={r._id} className="history-card-modern" style={{ animationDelay:`${0.05+i*0.08}s` }}>
                      <div className="card-top">
                        <div>
                          <h3 className="student-name">≡ƒôà {new Date(r.date).toLocaleDateString()}</h3>
                        </div>
                        <span className={`mood-badge ${mood.cls}`}>{mood.emoji} {r.mood}</span>
                      </div>
                      <div className="info-row">
                        <div className="info-chip">
                          <span className="chip-label">≡ƒÄ» Activity</span>
                          <span className="chip-value">{r.activity || 'None added'}</span>
                        </div>
                      </div>
                      <div className="notes-box">
                        <div className="notes-title">≡ƒôô Teacher's Note</div>
                        <p>{r.notes || 'No notes for this report.'}</p>
                      </div>
                      {/* Parents can download but NOT delete */}
                      <div className="card-actions">
                        <button className="btn-action btn-pdf-modern" onClick={()=>downloadPDF(r)}>
                          <Download size={15}/> Download PDF
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="encourage-row">
            <div className="encourage-card">
              <span className="ec-emoji">≡ƒÆ¢</span>
              <div className="ec-text"><h3>Your child is doing great!</h3><p>Stay connected and celebrate every little win together.</p></div>
            </div>
            <div className="encourage-card">
              <span className="ec-emoji">≡ƒîƒ</span>
              <div className="ec-text"><h3>You're a super parent!</h3><p>Being involved in their journey makes all the difference.</p></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
