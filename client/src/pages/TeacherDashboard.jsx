/**
 * TeacherDashboard.jsx
 * Professional 5-tab interface: My Students | Progress Reports | Resource Library | Messages | Analytics
 * Theme matches the BrightSteps Landing Page (paper/ink/rose/amber/teal palette).
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users, ClipboardList, BookOpen,
  RefreshCcw, LogOut, Download, Trash2,
  ExternalLink, Save, PlusCircle,
  MessageSquare, Send, BarChart3, Filter, FileText, CheckCircle, Printer, Edit
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid,
  XAxis, YAxis, Tooltip, Legend, BarChart, Bar,
  PieChart, Pie, Cell
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import s from './TeacherDashboard.module.css';
import { downloadSingleReportPDF, generateSingleReportPDF } from '../utils/pdfGenerator';
import html2canvas from 'html2canvas';

/* ── API helpers ─────────────────────────────────── */
const API = '/api';
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('brightsteps_token')}`,
});

/* ── Constants ─────────────────────────────────── */
const MOODS = ['Happy', 'Excited', 'Neutral', 'Tired', 'Frustrated'];
const MOOD_CFG = {
  Happy:      { emoji: '😊', cls: s.moodHappy,      label: 'Happy'      },
  Excited:    { emoji: '🤩', cls: s.moodExcited,    label: 'Excited'    },
  Neutral:    { emoji: '😐', cls: s.moodNeutral,    label: 'Neutral'    },
  Tired:      { emoji: '😴', cls: s.moodTired,      label: 'Tired'      },
  Frustrated: { emoji: '😤', cls: s.moodFrustrated, label: 'Frustrated' },
};
const TYPE_EMOJI = { video: '🎬', pdf: '📄', link: '🔗', offline: '🌳' };
const today = new Date().toISOString().split('T')[0];

/* ═══════════════════════════════════════════════════
   REUSABLE TOAST
═══════════════════════════════════════════════════ */
function Toast({ msg, ok }) {
  if (!msg) return null;
  return <div className={`${s.toast} ${ok ? s.toastOk : s.toastErr}`}>{msg}</div>;
}

/* ═══════════════════════════════════════════════════
   STUDENT DRILL-DOWN VIEW (Phase 5)
═══════════════════════════════════════════════════ */
function DrillDownView({ student, onBack }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch(`${API}/progress?studentName=${encodeURIComponent(student.name)}`, { headers: authHeaders() });
        const data = await res.json();
        if (res.ok) setReports([...data].sort((a, b) => new Date(b.date) - new Date(a.date)));
      } catch { /* silent */ }
      setLoading(false);
    };
    fetchReports();
  }, [student.name]);

  return (
    <div className={s.drillDownContainer}>
      <button className={s.refreshBtn} onClick={onBack} style={{ marginBottom: '20px' }}>
        ⬅️ Back to Roster
      </button>

      <div className={s.drillDownHeader}>
        <div className={s.studentAvatarLg}>{student.name?.charAt(0)?.toUpperCase()}</div>
        <div>
          <h2>{student.name}</h2>
          <p className={s.studentMeta}>{student.email} · Joined {new Date(student.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className={s.sectionHeader} style={{ marginTop: '30px' }}>
        <div>
          <h3>📈 Activity History</h3>
          <p>Progress reports uniquely scoped to {student.name}.</p>
        </div>
        <div className={s.statBox}>{reports.length} Records</div>
      </div>

      {loading ? (
        <div className={s.loader}>Loading history...</div>
      ) : reports.length === 0 ? (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>📭</div>
          <p>No reports found for this student.</p>
        </div>
      ) : (
        <div className={s.cardsGrid}>
          {reports.map((r, i) => {
            
            return (
              <div key={i} className={s.reportCard}>
                <div className={s.cardTopRow}>
                  <div>
                    <p className={s.reportStudentName}>{new Date(r.date).toLocaleDateString()}</p>
                    <p className={s.reportMeta}>🎯 Activity: {r.activity}</p>
                  </div>
                  
                </div>
                {r.notes && <div className={s.notesBox}>{r.notes}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TAB 1 — MY STUDENTS
═══════════════════════════════════════════════════ */
function StudentsTab() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading]  = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/users/students`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setStudents(data);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (selectedStudent) {
    return <DrillDownView student={selectedStudent} onBack={() => setSelectedStudent(null)} />;
  }

  return (
    <>
      <div className={s.sectionHeader}>
        <div>
          <h2>👥 My Students</h2>
          <p>All registered parent / student accounts on the platform.</p>
        </div>
        <button className={s.refreshBtn} onClick={load}>
          <RefreshCcw size={15} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>⏳</div>
          <p>Loading students…</p>
        </div>
      ) : students.length === 0 ? (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>📭</div>
          <p>No students registered yet.</p>
        </div>
      ) : (
        <div className={s.studentGrid}>
          {students.map((u) => (
            <div 
              key={u._id} 
              className={s.studentCard} 
              onClick={() => setSelectedStudent(u)}
              style={{ cursor: 'pointer' }}
              title="Click to view progress history"
            >
              <div className={s.studentAvatar}>
                {u.name?.charAt(0)?.toUpperCase() || '👤'}
              </div>
              <div>
                <p className={s.studentName}>{u.name}</p>
                <p className={s.studentMeta}>{u.email}</p>
                <p className={s.studentMeta}>
                  Joined {new Date(u.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════
   TAB 2 — PROGRESS REPORTS
══════════════════════════════════════════════════ */
const formatDuration = (mins) => {
  if (!mins) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h} hr${h !== 1 ? 's' : ''} ${m} min${m !== 1 ? 's' : ''}`;
  if (h > 0) return `${h} hr${h !== 1 ? 's' : ''}`;
  return `${m} min${m !== 1 ? 's' : ''}`;
};

const formatDurationFromSeconds = (seconds) => {
  if (seconds === 0) return '0 secs';
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = [];
  if (h > 0) parts.push(`${h} hr${h !== 1 ? 's' : ''}`);
  if (m > 0) parts.push(`${m} min${m !== 1 ? 's' : ''}`);
  if (s > 0 || (h === 0 && m === 0)) parts.push(`${s} sec${s !== 1 ? 's' : ''}`);
  return parts.join(' ');
};

function ReportsTab() {
  const [reports, setReports] = useState([]);
    const [skills, setSkills] = useState([]);
  const [roster, setRoster] = useState([]);
  const [studentSearchFocus, setStudentSearchFocus] = useState(false);
  const [toast, setToast] = useState(null);
  
  const [form, setForm] = useState({
    id: null,
    studentName: '', date: today, activity: '', mood: 'Happy', notes: '', avatar: '👦',
    skillArea: '', engagementLevel: 'High', progressLevel: 'Good',
    recommendations: '', durationHours: '', durationMinutes: '', attendanceStatus: 'Present',
    customActivity: ''
  });

  // Filter & UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [filterMood, setFilterMood] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [selectedStudentName, setSelectedStudentName] = useState(null);
  const [selectedReports, setSelectedReports] = useState([]);
  
  // Skill Modal State
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [manageSkillForm, setManageSkillForm] = useState({ id: null, name: '', activities: '' });

  const flash = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const loadReports = async () => {
    try {
      const res = await fetch(`${API}/progress`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setReports([...data]);
    } catch { /* silent */ }
  };

  const loadSkills = async () => {
    try {
      const res = await fetch(`${API}/skills`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSkills(data);
      }
    } catch { /* silent */ }
  };
  const loadRoster = async () => {
    try {
      const res = await fetch(`${API}/users/students`, { headers: authHeaders() });
      if (res.ok) setRoster(await res.json());
    } catch {}
  };


  useEffect(() => { loadReports(); loadSkills(); loadRoster(); }, []);

  // Update activity when skillArea changes
  useEffect(() => {
    const selectedSkill = skills.find(s => s.name === form.skillArea);
    if (selectedSkill && selectedSkill.activities && selectedSkill.activities.length > 0) {
      setForm(f => ({ ...f, activity: selectedSkill.activities[0] }));
    } else {
      setForm(f => ({ ...f, activity: 'Other' }));
    }
  }, [form.skillArea, skills]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // Resolve the final activity name (custom or from dropdown)
      const finalActivity = form.activity === 'Other' ? (form.customActivity || '') : form.activity;
      
      // Convert hrs+mins to total minutes for the backend
      const h = parseInt(form.durationHours) || 0;
      const m = parseInt(form.durationMinutes) || 0;
      const totalMins = h * 60 + m;

      // Build a clean, explicit payload — never rely solely on ...form spread
      // so no stray UI-only fields (durationHours, durationMinutes, id) leak in
      const payload = {
        studentName:      form.studentName,
        date:             form.date,
        mood:             form.mood,
        notes:            form.notes,
        avatar:           form.avatar,
        skillArea:        form.skillArea,
        activity:         finalActivity,
        engagementLevel:  form.engagementLevel,
        progressLevel:    form.progressLevel,
        attendanceStatus: form.attendanceStatus,
        recommendations:  form.recommendations,
        sessionDuration:  totalMins > 0 ? totalMins : null,
      };

      let res;
      if (form.id) {
        res = await fetch(`${API}/progress/${form.id}`, {
          method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API}/progress`, {
          method: 'POST', headers: authHeaders(), body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (res.ok) {
        flash('✅ Report saved!');
        setForm({ id: null, studentName: '', date: today, activity: '', customActivity: '', mood: 'Happy', notes: '', avatar: '👦',
          skillArea: form.skillArea, engagementLevel: 'High', progressLevel: 'Good',
          recommendations: '', durationHours: '', durationMinutes: '', attendanceStatus: 'Present'
        });
        loadReports();
      } else {
        flash(`❌ ${data.message || 'Failed'}`, false);
      }
    } catch { flash('❌ Cannot connect to backend.', false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    await fetch(`${API}/progress/${id}`, { method: 'DELETE', headers: authHeaders() });
    loadReports();
  };

  const handlePrintReport = (r) => { downloadSingleReportPDF(r, 'BrightSteps — Student Progress Report'); };
  const handleDownloadPDF = (r) => { generateSingleReportPDF(r); };

  const handleEditReport = (report) => {
    if (!report) return;
    let isOther = true;
    let skillFound = skills.find(s => s.name === report.skillArea);
    if (skillFound && skillFound.activities && skillFound.activities.includes(report.activity)) {
      isOther = false;
    }
    
    let durHours = '';
    let durMins = '';
    if (report.sessionDuration) {
      const totalMins = parseInt(report.sessionDuration) || 0;
      durHours = Math.floor(totalMins / 60).toString();
      durMins = (totalMins % 60).toString();
      if (durHours === '0') durHours = '';
      if (durMins === '0') durMins = '';
    }
    
    setForm({
      id: report._id,
      studentName: report.studentName,
      date: report.date ? report.date.split('T')[0] : today,
      activity: isOther ? 'Other' : report.activity,
      customActivity: isOther ? report.activity : '',
      mood: report.mood || 'Happy',
      notes: report.notes || '',
      avatar: report.avatar || '👦',
      skillArea: report.skillArea || '',
      engagementLevel: report.engagementLevel || 'High',
      progressLevel: report.progressLevel || 'Good',
      recommendations: report.recommendations || '',
      durationHours: durHours,
      durationMinutes: durMins,
      attendanceStatus: report.attendanceStatus || 'Present'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearchQuery(''); setFilterStudent(''); setFilterMood(''); setSortOrder('newest');
    setSelectedStudentName(null); setSelectedReports([]);
  };

  const handleBulkDelete = async () => {
    if (!selectedReports.length) return;
    if (!window.confirm(`Delete ${selectedReports.length} selected reports?`)) return;
    try {
      await Promise.all(selectedReports.map(id => fetch(`${API}/progress/${id}`, { method: 'DELETE', headers: authHeaders() })));
      flash(`✅ ${selectedReports.length} reports deleted!`);
      setSelectedReports([]); loadReports();
    } catch { flash('❌ Error deleting reports', false); }
  };

  const handleSaveSkill = async (e) => {
    e.preventDefault();
    const trimmedName = manageSkillForm.name.trim();
    if (!trimmedName) return flash('❌ Skill Area Name is required.', false);
    const activitiesArr = manageSkillForm.activities.split(',').map(s => s.trim()).filter(Boolean);
    if (!activitiesArr.length) return flash('❌ At least one activity is required.', false);

    // Duplicate name check (only for new skills)
    if (!manageSkillForm.id) {
      const dup = skills.find(sk => sk.name.toLowerCase() === trimmedName.toLowerCase());
      if (dup) return flash(`❌ "${trimmedName}" already exists.`, false);
    }

    const payload = { name: trimmedName, activities: activitiesArr };
    try {
      let res;
      if (manageSkillForm.id) {
        res = await fetch(`${API}/skills/${manageSkillForm.id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload) });
      } else {
        res = await fetch(`${API}/skills`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
      }
      if (res.ok) {
        await loadSkills();
        flash(manageSkillForm.id ? '✅ Skill updated!' : '✅ Skill added!');
        setManageSkillForm({ id: null, name: '', activities: '' });
        // Modal stays open so teacher can continue managing
      } else {
        const d = await res.json();
        flash(d.message || '❌ Error saving skill.', false);
      }
    } catch { flash('❌ Network error.', false); }
  };

  const handleDeleteSkill = async (id) => {
    if (!window.confirm('Delete this skill area? This cannot be undone.')) return;
    try {
      await fetch(`${API}/skills/${id}`, { method: 'DELETE', headers: authHeaders() });
      await loadSkills();
      // If we were editing this skill, reset the form
      if (manageSkillForm.id === id) setManageSkillForm({ id: null, name: '', activities: '' });
      flash('✅ Skill deleted.');
    } catch { flash('❌ Could not delete skill.', false); }
  };

  const handleEditSkill = (sk) => {
    setManageSkillForm({ id: sk._id, name: sk.name, activities: (sk.activities || []).join(', ') });
  };

  const handleCancelEditSkill = () => {
    setManageSkillForm({ id: null, name: '', activities: '' });
  };

  // ── Helper: resolve the display-ready activity label from any report type ──
  const resolveActivity = (r) =>
    r.activity || r.gameName || '—';

  // ── Derived Data for Student-Centric Browser ──
  const studentSummaries = React.useMemo(() => {
    const map = new Map();
    reports.forEach(r => {
      let name = r.studentName;
      if (!name && r.childId) {
        const match = roster.find(st => st._id === r.childId);
        if (match) name = match.name;
      }
      name = name || 'Unknown Student';

      if (!map.has(name)) {
        const student = roster.find(st => st.name === name);
        const customId = student?.customId || 'N/A';
        const fallbackId = student?._id ? student._id.substring(0, 6) : 'N/A';
        const displayId = customId !== 'N/A' ? customId : fallbackId;

        map.set(name, {
          id: student?._id || name,
          displayId,
          name,
          totalReports:     0,
          latestDate:       r.date,
          latestMood:       r.mood || '—',
          latestSkill:      r.skillArea       || '—',
          latestActivity:   resolveActivity(r),
          latestProgress:   r.progressLevel   || '—',
          latestEngagement: r.engagementLevel  || '—',
          latestAttendance: r.attendanceStatus || '—',
          avgEngagement: { High: 0, Medium: 0, Low: 0 },
          avgProgress: { Excellent: 0, Good: 0, 'Needs Support': 0 },
          latestReport: r,
          reports: []
        });
      }

      const s = map.get(name);
      s.totalReports += 1;
      s.reports.push(r);
      if (r.engagementLevel) s.avgEngagement[r.engagementLevel] = (s.avgEngagement[r.engagementLevel] || 0) + 1;
      if (r.progressLevel)   s.avgProgress[r.progressLevel]   = (s.avgProgress[r.progressLevel]   || 0) + 1;

      // Update "latest" fields whenever this report is newer or equal
      if (new Date(r.date) >= new Date(s.latestDate)) {
        s.latestDate       = r.date;
        s.latestMood       = r.mood       || s.latestMood;
        s.latestSkill      = r.skillArea       || s.latestSkill      || '—';
        s.latestActivity   = resolveActivity(r) !== '—' ? resolveActivity(r) : s.latestActivity;
        s.latestProgress   = r.progressLevel   || s.latestProgress   || '—';
        s.latestEngagement = r.engagementLevel  || s.latestEngagement || '—';
        s.latestAttendance = r.attendanceStatus || s.latestAttendance || '—';
        s.latestReport     = r;
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [reports, roster]);

  const uniqueStudentNames = React.useMemo(() => studentSummaries.map(s => s.name), [studentSummaries]);

  const allStudentNames = React.useMemo(() => {
    const names = new Set(roster.map(s => s.name));
    uniqueStudentNames.forEach(n => names.add(n));
    return Array.from(names).sort();
  }, [roster, uniqueStudentNames]);

  const filteredSearchStudents = allStudentNames.filter(n => n.toLowerCase().includes(form.studentName.toLowerCase()));

  const filteredSummaries = React.useMemo(() => {
    let list = studentSummaries.filter(s => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!s.name.toLowerCase().includes(q) && !s.displayId.toLowerCase().includes(q)) return false;
      }
      if (filterStudent && s.name !== filterStudent) return false;
      if (filterMood) {
         if (!s.reports.some(r => r.mood === filterMood)) return false;
      }
      return true;
    });
    
    list.sort((a, b) => {
      const dateA = new Date(a.latestDate).getTime();
      const dateB = new Date(b.latestDate).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    return list;
  }, [studentSummaries, searchQuery, filterStudent, filterMood, sortOrder]);

  const exportTablePDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(18);
    doc.text('Student Progress Reports Summary', 14, 20);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
    
    const tableData = filteredSummaries.map(st => [
      st.displayId,
      st.name,
      st.totalReports,
      new Date(st.latestDate).toLocaleDateString(),
      st.latestSkill,
      st.latestActivity,
      st.latestProgress,
      st.latestEngagement,
      st.latestAttendance
    ]);
    
    autoTable(doc, {
      startY: 35,
      head: [['ID', 'Name', 'Total Reports', 'Latest Date', 'Skill Area', 'Activity', 'Progress', 'Engagement', 'Attendance']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [61, 181, 160] }
    });
    doc.save('student-reports-summary.pdf');
  };

  const selectedStudentReports = React.useMemo(() => {
    if (!selectedStudentName) return [];
    const st = studentSummaries.find(s => s.name === selectedStudentName);
    if (!st) return [];
    let reps = [...st.reports];
    if (filterMood) reps = reps.filter(r => r.mood === filterMood);
    reps.sort((a, b) => sortOrder === 'newest' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date));
    return reps;
  }, [selectedStudentName, studentSummaries, filterMood, sortOrder]);

  const selectedFormStudentSummary = React.useMemo(() => {
    if (!form.studentName) return null;
    return studentSummaries.find(s => s.name === form.studentName) || null;
  }, [form.studentName, studentSummaries]);

  const selectedSkillObj = skills.find(s => s.name === form.skillArea);
  const currentActivities = selectedSkillObj ? selectedSkillObj.activities : [];

  // Target games configuration
  const TARGET_GAMES = [
    { key: 'FocusMatch',       label: 'Focus Match',      emoji: '🧠', color: '#2478A4' },
    { key: 'ShapeSort',        label: 'Shape Sort',       emoji: '🔷', color: '#3DB5A0' },
    { key: 'EmotionExplorer',  label: 'Emotion Explorer', emoji: '😊', color: '#8b5cf6' },
  ];

  // Match a record to a game key (handles spaces/case variations)
  const matchGame = (r, key) => {
    const gn = (r.gameName || r.activity || '').replace(/\s+/g, '').toLowerCase();
    return gn === key.toLowerCase();
  };

  const gameAnalytics = React.useMemo(() => {
    if (!selectedFormStudentSummary) return null;

    // All game records for this student
    const gameRecords = selectedFormStudentSummary.reports.filter(r =>
      r.gameName ||
      r.skillArea === 'Games' ||
      (r.activity && r.activity.toLowerCase().includes('game')) ||
      (typeof r.score === 'number' && r.score > 0) ||
      (typeof r.stars === 'number' && r.stars > 0)
    );
    if (!gameRecords.length) return null;

    // Per-game breakdown for the three target games
    const gameBreakdown = TARGET_GAMES.map(g => {
      const recs = gameRecords.filter(r => matchGame(r, g.key));
      if (!recs.length) return { ...g, sessions: 0, avgScore: 0, bestScore: 0, totalStars: 0, latestDate: null };
      const sessions   = recs.length;
      const totalStars = recs.reduce((s, r) => s + (Number(r.stars) || 0), 0);
      const scores     = recs.map(r => Number(r.score) || 0);
      const avgScore   = Math.round(scores.reduce((a, b) => a + b, 0) / sessions);
      const bestScore  = Math.max(...scores);
      const latestDate = recs.reduce((latest, r) => new Date(r.date) > new Date(latest) ? r.date : latest, recs[0].date);
      return { ...g, sessions, avgScore, bestScore, totalStars, latestDate };
    });

    // Combined totals
    const totalSessions = gameRecords.length;
    const totalStars    = gameRecords.reduce((s, r) => s + (Number(r.stars) || 0), 0);
    const allScores     = gameRecords.map(r => Number(r.score) || 0);
    const avgScore      = totalSessions ? Math.round(allScores.reduce((a, b) => a + b, 0) / totalSessions) : 0;
    const bestScore     = allScores.length ? Math.max(...allScores) : 0;
    const avgStars      = totalSessions ? (totalStars / totalSessions).toFixed(1) : '0.0';

    // Most played
    const counts = {};
    gameRecords.forEach(r => {
      const nm = r.gameName || r.activity || 'Unknown';
      counts[nm] = (counts[nm] || 0) + 1;
    });
    const mostPlayedGame = Object.keys(counts).length
      ? Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b)
      : 'None';

    // Latest game
    const sorted     = [...gameRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
    const latestGame = sorted[0].gameName || sorted[0].activity || 'Unknown Game';
    const latestDate = sorted[0].date;

    // Recent 6 sessions for chart (chronological order)
    const recentSessions = sorted.slice(0, 6).reverse().map((r, i) => ({
      name:     `S${i + 1}`,
      score:    Number(r.score) || 0,
      stars:    Number(r.stars) || 0,
      gameName: r.gameName || r.activity || 'Game',
      date:     r.date,
    }));

    // Recent activity list (6 most recent)
    const recentActivity = sorted.slice(0, 6).map(r => ({
      gameName: r.gameName || r.activity || 'Game',
      score:    Number(r.score) || 0,
      stars:    Number(r.stars) || 0,
      date:     r.date,
    }));

    return { totalSessions, totalStars, avgScore, bestScore, avgStars, mostPlayedGame, latestGame, latestDate, recentSessions, recentActivity, gameBreakdown };
  }, [selectedFormStudentSummary]);

  return (
    <>
      {/* ── Add Report Form ── */}
      <div className={s.formCard} style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
        <div style={{ flex: '1 1 600px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
            <h3 style={{ margin: 0 }}>
              {form.id ? <Edit size={19} /> : <PlusCircle size={19} />} 
              {form.id ? 'Edit Report' : 'New Daily Report'}
            </h3>
            {form.id && (
              <button type="button" className={s.refreshBtn} onClick={() => {
                setForm({ id: null, studentName: '', date: today, activity: '', customActivity: '', mood: 'Happy', notes: '', avatar: '👦', skillArea: '', engagementLevel: 'High', progressLevel: 'Good', recommendations: '', durationHours: '', durationMinutes: '', attendanceStatus: 'Present' });
              }}>Cancel Edit</button>
            )}
          </div>
          <Toast {...(toast || { msg: '' })} />
          
          <form onSubmit={handleSave}>
            <div className="form-section-title">👤 Student & Session Details</div>
            <div className={s.formRow} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <div className={s.formGroup} style={{ position: 'relative' }}>
                <label className={s.formLabel}>🔍 Search Student Name</label>
                <input 
                  className={s.formInput} 
                  type="text" 
                  placeholder="Search or type student…"
                  value={form.studentName} 
                  onChange={e => setForm({ ...form, studentName: e.target.value })} 
                  onFocus={() => setStudentSearchFocus(true)}
                  onBlur={() => setTimeout(() => setStudentSearchFocus(false), 200)}
                  autoComplete="off"
                  required 
                />
                {studentSearchFocus && filteredSearchStudents.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '2px solid #e2e8f0', borderRadius: '12px', zIndex: 50, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginTop: '4px' }}>
                    {filteredSearchStudents.map(name => (
                      <div 
                        key={name}
                        onMouseDown={(e) => {
                          e.preventDefault(); // prevent input blur from firing first
                          setForm({ ...form, studentName: name });
                          setStudentSearchFocus(false);
                        }}
                        style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: 'var(--td-ink-mid)' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}
                      >
                        {name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>📅 Date</label>
                <input className={s.formInput} type="date" value={form.date} max={today}
                  onChange={e => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>⏱️ Duration</label>
                <div className={s.durationWrap}>
                  <div className={s.durationField}>
                    <span className={s.durationFieldLabel}>Hours</span>
                    <input
                      className={s.durationInput}
                      type="number"
                      placeholder="0"
                      min="0"
                      value={form.durationHours}
                      onChange={e => setForm({ ...form, durationHours: e.target.value })}
                    />
                  </div>
                  <div className={s.durationField}>
                    <span className={s.durationFieldLabel}>Minutes</span>
                    <input
                      className={s.durationInput}
                      type="number"
                      placeholder="0"
                      min="0"
                      max="59"
                      value={form.durationMinutes}
                      onChange={e => {
                        const raw = e.target.value;
                        if (raw === '' || (Number(raw) >= 0 && Number(raw) <= 59)) {
                          setForm({ ...form, durationMinutes: raw });
                        }
                      }}
                    />
                  </div>
                </div>
                {(() => {
                  const total = (parseInt(form.durationHours) || 0) * 60 + (parseInt(form.durationMinutes) || 0);
                  return total > 0 ? (
                    <div className={s.durationPreview}>⏱️ {formatDuration(total)}</div>
                  ) : null;
                })()}
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>✅ Attendance</label>
                <select className={s.formInput} value={form.attendanceStatus}
                  onChange={e => setForm({ ...form, attendanceStatus: e.target.value })}>
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Partial Session">Partial Session</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>
            </div>

            <div className="form-section-title" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              <span>🎯 Activity & Progress</span>
              <button type="button" onClick={() => setShowSkillModal(true)} style={{ background: 'none', border: 'none', color: 'var(--td-sky-dk)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>
                ⚙️ Manage Skills
              </button>
            </div>
            <div className={s.formRow} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <div className={s.formGroup}>
                <label className={s.formLabel}>📚 Skill Area</label>
                <select className={s.formInput} value={form.skillArea}
                  onChange={e => setForm({ ...form, skillArea: e.target.value })}>
                  <option value="">-- Select Skill Area --</option>
                  {skills.map(sk => <option key={sk._id} value={sk.name}>{sk.name}</option>)}
                </select>
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>Activity Name</label>
                <select className={s.formInput} value={form.activity}
                  onChange={e => setForm({ ...form, activity: e.target.value })} required>
                  {currentActivities && currentActivities.map(act => <option key={act} value={act}>{act}</option>)}
                  <option value="Other">Other (Custom Activity)</option>
                </select>
              </div>
              {form.activity === 'Other' && (
                <div className={s.formGroup}>
                   <label className={s.formLabel}>Custom Activity</label>
                   <input className={s.formInput} type="text" placeholder="Type activity..." 
                     value={form.customActivity} onChange={e => setForm({...form, customActivity: e.target.value})} required />
                </div>
              )}
              <div className={s.formGroup}>
                <label className={s.formLabel}>📈 Progress Level</label>
                <select className={s.formInput} value={form.progressLevel}
                  onChange={e => setForm({ ...form, progressLevel: e.target.value })}>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Needs Support">Needs Support</option>
                </select>
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>🔥 Engagement</label>
                <select className={s.formInput} value={form.engagementLevel}
                  onChange={e => setForm({ ...form, engagementLevel: e.target.value })}>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              
            </div>

            <div className="form-section-title" style={{ marginTop: '16px' }}>📝 Notes & Recommendations</div>
            <div className={s.formRow} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <div className={s.formGroup}>
                <label className={s.formLabel}>Teacher's Notes</label>
                <textarea className={`${s.formInput} ${s.textarea}`}
                  placeholder="How was the session? Observations..."
                  value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>Next Steps / Recommendations</label>
                <textarea className={`${s.formInput} ${s.textarea}`}
                  placeholder="Suggested follow-up activities..."
                  value={form.recommendations} onChange={e => setForm({ ...form, recommendations: e.target.value })} />
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <button type="submit" className={s.saveBtn} style={{ flex: 1, justifyContent: 'center' }}>
                <Save size={18} /> {form.id ? 'Update Report' : 'Save Daily Report'}
              </button>
              {selectedFormStudentSummary && (
                <button type="button" className={s.refreshBtn} onClick={() => { setSelectedStudentName(form.studentName); document.getElementById('reports-browser').scrollIntoView({behavior: 'smooth'}); }}>
                  View Full History
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ── Educational Games Analytics Panel ── */}
        <div style={{ flex: '1 1 300px', background: 'var(--td-paper2)', borderRadius: 'var(--td-r-card)', padding: '20px', border: '2px solid rgba(30,16,7,0.06)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflowY: 'auto' }}>

          <h4 style={{ margin: '0 0 14px', fontFamily: "'Baloo 2', cursive", fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--td-ink)', flexShrink: 0 }}>
            <BarChart3 size={17} color="var(--td-sky-dk)" /> Educational Games Analytics
          </h4>

          {!selectedFormStudentSummary ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--td-ink-soft)' }}>
              <div style={{ fontSize: '2.2rem', marginBottom: '8px' }}>🎮</div>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>Select a student above to view their educational games analytics.</p>
            </div>
          ) : !gameAnalytics ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--td-ink-soft)' }}>
              <div style={{ fontSize: '2.2rem', marginBottom: '8px' }}>📭</div>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>No educational game data available for <strong>{selectedFormStudentSummary.name}</strong> yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>

              {/* Student banner */}
              <div style={{ background: 'linear-gradient(135deg, #2478A4 0%, #1a5f82 100%)', padding: '12px 14px', borderRadius: '12px', color: 'white', boxShadow: '0 4px 12px rgba(36,120,164,0.3)' }}>
                <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '5px' }}>🎓 {selectedFormStudentSummary.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, opacity: 0.92 }}>
                  <span>📊 {gameAnalytics.totalSessions} Session{gameAnalytics.totalSessions !== 1 ? 's' : ''}</span>
                  <span>⭐ {gameAnalytics.totalStars} Stars</span>
                </div>
              </div>

              {/* 4 combined stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
                {[
                  { label: 'Avg Score',   value: gameAnalytics.avgScore,      color: '#2478A4' },
                  { label: 'Best Score',  value: gameAnalytics.bestScore,     color: '#e85c70' },
                  { label: 'Avg Stars',   value: `⭐ ${gameAnalytics.avgStars}`, color: '#f2a520' },
                  { label: 'Most Played', value: gameAnalytics.mostPlayedGame, color: '#8b5cf6', small: true },
                ].map(card => (
                  <div key={card.label} style={{ background: 'white', padding: '10px 12px', borderRadius: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', borderTop: `3px solid ${card.color}` }}>
                    <div style={{ color: 'var(--td-ink-soft)', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px', marginBottom: '3px' }}>{card.label}</div>
                    <div style={{ fontWeight: 800, fontSize: card.small ? '0.78rem' : '1.1rem', color: card.color, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={String(card.value)}>{card.value}</div>
                  </div>
                ))}
              </div>

              {/* Per-game breakdown */}
              <div style={{ background: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ color: 'var(--td-ink-soft)', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px', marginBottom: '8px' }}>🎮 Game Breakdown</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {gameAnalytics.gameBreakdown.map(g => (
                    <div key={g.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '9px', background: 'var(--td-paper)', border: `1.5px solid ${g.color}22` }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${g.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>{g.emoji}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.8rem', color: g.color, marginBottom: '2px' }}>{g.label}</div>
                        {g.sessions === 0 ? (
                          <div style={{ fontSize: '0.7rem', color: 'var(--td-ink-soft)' }}>No sessions yet</div>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px', fontSize: '0.7rem', color: 'var(--td-ink-mid)', flexWrap: 'wrap' }}>
                            <span>{g.sessions} session{g.sessions !== 1 ? 's' : ''}</span>
                            <span>Avg {g.avgScore}</span>
                            <span>Best {g.bestScore}</span>
                            <span>⭐{g.totalStars}</span>
                          </div>
                        )}
                      </div>
                      {g.latestDate && (
                        <div style={{ fontSize: '0.62rem', color: 'var(--td-ink-soft)', flexShrink: 0, textAlign: 'right' }}>
                          {new Date(g.latestDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Game Scores chart */}
              <div style={{ background: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ color: 'var(--td-ink-soft)', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px', marginBottom: '8px' }}>📈 Recent Game Scores</div>
                {gameAnalytics.recentSessions.length > 0 ? (
                  <div style={{ width: '100%', height: '120px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={gameAnalytics.recentSessions} margin={{ top: 4, right: 6, bottom: 0, left: -28 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                        <Tooltip
                          contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', fontSize: '0.78rem' }}
                          formatter={(val, _name, props) => [`Score: ${val}`, props.payload.gameName]}
                          labelFormatter={label => `Session ${label}`}
                        />
                        <Line type="monotone" dataKey="score" stroke="#2478A4" strokeWidth={2.5} dot={{ r: 4, fill: '#2478A4', strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 6 }} name="Score" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p style={{ color: 'var(--td-ink-soft)', fontSize: '0.8rem', margin: 0, textAlign: 'center', padding: '10px 0' }}>No score data yet.</p>
                )}
              </div>

              {/* Recent Game Activity list */}
              <div style={{ background: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ color: 'var(--td-ink-soft)', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px', marginBottom: '8px' }}>🕐 Recent Activity</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {gameAnalytics.recentActivity.map((a, i) => {
                    const tg = TARGET_GAMES.find(g => (a.gameName || '').replace(/\s+/g, '').toLowerCase() === g.key.toLowerCase());
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
                        <span style={{ fontSize: '0.95rem' }}>{tg?.emoji || '🎮'}</span>
                        <span style={{ flex: 1, fontWeight: 700, color: tg?.color || 'var(--td-ink-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.gameName}</span>
                        <span style={{ color: '#e85c70', fontWeight: 700, flexShrink: 0 }}>{a.score}</span>
                        <span style={{ color: '#f2a520', flexShrink: 0 }}>{'⭐'.repeat(Math.min(a.stars, 3)) || '—'}</span>
                        <span style={{ color: 'var(--td-ink-soft)', flexShrink: 0, fontSize: '0.7rem' }}>{new Date(a.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Latest game played */}
              <div style={{ background: 'white', padding: '11px 13px', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>🕹️</div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ color: 'var(--td-ink-soft)', fontSize: '0.62rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>Latest Game Played</div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--td-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{gameAnalytics.latestGame}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--td-ink-soft)', marginTop: '1px' }}>{new Date(gameAnalytics.latestDate).toLocaleDateString()}</div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* ── Manage Skills Modal ── */}
      {showSkillModal && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={e => { if (e.target === e.currentTarget) { setShowSkillModal(false); handleCancelEditSkill(); } }}
        >
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>

            {/* Modal Header */}
            <div style={{ padding: '22px 26px 16px', borderBottom: '2px solid var(--td-paper)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <h3 style={{ margin: 0, fontFamily: "'Baloo 2', cursive", fontSize: '1.15rem', color: 'var(--td-ink)' }}>
                ⚙️ Manage Skill Areas &amp; Activities
              </h3>
              <button onClick={() => { setShowSkillModal(false); handleCancelEditSkill(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--td-ink-soft)', lineHeight: 1, padding: '2px 6px', borderRadius: '6px' }}>✕</button>
            </div>

            <div style={{ padding: '20px 26px', flex: 1 }}>

              {/* Inline toast */}
              {toast && (
                <div className={toast.ok ? s.toastOk : s.toastErr} style={{ marginBottom: '14px' }}>{toast.msg}</div>
              )}

              {/* Form box — teal border when editing */}
              <div style={{ background: 'var(--td-paper)', border: `2px solid ${manageSkillForm.id ? 'var(--td-teal)' : 'rgba(30,16,7,0.08)'}`, borderRadius: '14px', padding: '16px', marginBottom: '20px', transition: 'border-color 0.2s' }}>

                {/* Editing indicator */}
                {manageSkillForm.id && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', padding: '7px 12px', background: 'var(--td-teal-bg)', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--td-teal-dk)' }}>
                    ✏️ Editing: <strong>{manageSkillForm.name || '…'}</strong>
                  </div>
                )}

                <form onSubmit={handleSaveSkill}>
                  <div className={s.formGroup}>
                    <label className={s.formLabel}>Skill Area Name <span style={{ color: 'var(--td-rose)' }}>*</span></label>
                    <input
                      className={s.formInput}
                      required
                      value={manageSkillForm.name}
                      onChange={e => setManageSkillForm({ ...manageSkillForm, name: e.target.value })}
                      placeholder="e.g. Reading, Games, Motor Skills"
                    />
                  </div>
                  <div className={s.formGroup} style={{ marginBottom: '14px' }}>
                    <label className={s.formLabel}>Activities <span style={{ color: 'var(--td-rose)' }}>*</span></label>
                    <textarea
                      className={`${s.formInput} ${s.textarea}`}
                      required
                      rows={3}
                      value={manageSkillForm.activities}
                      onChange={e => setManageSkillForm({ ...manageSkillForm, activities: e.target.value })}
                      placeholder="Comma-separated, e.g. Letter Match, Word Reading, Spelling"
                    />
                    <div style={{ fontSize: '0.72rem', color: 'var(--td-ink-soft)', marginTop: '4px' }}>
                      Separate activities with commas — spaces are trimmed automatically.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="submit"
                      className={s.saveBtn}
                      style={{ padding: '10px 20px', fontSize: '0.9rem', flex: 1, justifyContent: 'center', opacity: (!manageSkillForm.name.trim() || !manageSkillForm.activities.trim()) ? 0.5 : 1 }}
                      disabled={!manageSkillForm.name.trim() || !manageSkillForm.activities.trim()}
                    >
                      {manageSkillForm.id ? '💾 Update Skill' : '➕ Add Skill'}
                    </button>
                    {manageSkillForm.id && (
                      <button type="button" className={s.refreshBtn} onClick={handleCancelEditSkill} style={{ padding: '10px 16px', fontSize: '0.88rem' }}>
                        ✕ Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Skill list */}
              <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--td-ink-soft)', marginBottom: '10px' }}>
                {skills.length} Skill Area{skills.length !== 1 ? 's' : ''} Configured
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {skills.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--td-ink-soft)', background: 'var(--td-paper)', borderRadius: '12px', fontSize: '0.88rem' }}>
                    No skill areas yet — add your first one above.
                  </div>
                ) : skills.map(sk => {
                  const isEditing = manageSkillForm.id === sk._id;
                  return (
                    <div key={sk._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '12px', border: isEditing ? '2px solid var(--td-teal)' : '1.5px solid rgba(30,16,7,0.08)', background: isEditing ? 'var(--td-teal-bg)' : 'var(--td-paper)', boxShadow: isEditing ? '0 2px 10px rgba(61,181,160,0.15)' : 'none', transition: 'all 0.2s' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: isEditing ? 'var(--td-teal-dk)' : 'var(--td-ink)', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          {sk.name}
                          {isEditing && <span style={{ fontSize: '0.6rem', fontWeight: 900, background: 'var(--td-teal)', color: 'white', borderRadius: '6px', padding: '1px 7px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Editing</span>}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--td-ink-soft)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {sk.activities && sk.activities.length > 0 ? sk.activities.join(' · ') : <em>No activities defined</em>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button type="button" title="Edit skill" onClick={() => handleEditSkill(sk)} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: 'none', cursor: 'pointer', background: isEditing ? 'var(--td-teal)' : 'var(--td-sky-bg)', color: isEditing ? 'white' : 'var(--td-sky-dk)', fontSize: '0.9rem', transition: 'background 0.15s' }}>✏️</button>
                        <button type="button" title="Delete skill" onClick={() => handleDeleteSkill(sk._id)} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'var(--td-rose-bg)', color: 'var(--td-rose-dk)', fontSize: '0.9rem' }}>🗑️</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 26px 20px', borderTop: '1.5px solid var(--td-paper)', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
              <button onClick={() => { setShowSkillModal(false); handleCancelEditSkill(); }} className={s.refreshBtn}>✕ Close</button>
            </div>

          </div>
        </div>
      )}

      {/* ── Student-Centric Reports Browser ── */}
      <div id="reports-browser" className={s.sectionHeader}>
        <div>
          <h2>📋 Student Progress Reports</h2>
          <p>Browse reports by student, filter, and export to PDF.</p>
        </div>
        <button className={s.refreshBtn} onClick={loadReports}>
          <RefreshCcw size={15} /> Refresh
        </button>
      </div>

      {reports.length === 0 ? (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>📭</div>
          <p>No reports yet — add one above!</p>
        </div>
      ) : (
        <div className="reports-browser-container">
          
          {/* Toolbar */}
          <div className="reports-toolbar">
            <input 
              type="text" 
              className="reports-toolbar-input" 
              placeholder="🔍 Search name or ID..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <select 
              className="reports-toolbar-select"
              value={filterStudent}
              onChange={e => setFilterStudent(e.target.value)}
            >
              <option value="">All Students</option>
              {uniqueStudentNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            
            <select 
              className="reports-toolbar-select"
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
            >
              <option value="newest">Date: Newest First</option>
              <option value="oldest">Date: Oldest First</option>
            </select>
            
            <button className={s.refreshBtn} onClick={exportTablePDF}>
              <Download size={15} /> Export PDF
            </button>
            
            {(searchQuery || filterStudent || sortOrder !== 'newest') && (
              <button className="reports-toolbar-clear" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>

          {/* Student Summaries Table */}
          {filteredSummaries.length === 0 ? (
            <div className={s.emptyState}>
              <div className={s.emptyIcon}>🔎</div>
              <p>No students match the current filters.</p>
            </div>
          ) : (
            <div className={s.tableContainer}>
              <table className={s.reportsTable}>
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th>Total Reports</th>
                    <th>Latest Date</th>
                    <th>Latest Skill</th>
                    <th>Latest Activity</th>
                    <th>Progress</th>
                    <th>Engagement</th>
                    <th>Attendance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSummaries.map(st => (
                    <tr key={st.name}>
                      <td className={s.cellId}>{st.displayId}</td>
                      <td className={s.cellName}>
                        <div className={s.avatarNameCell}>
                          <div className={s.studentSummaryAvatar}>{st.name.charAt(0).toUpperCase()}</div>
                          {st.name}
                        </div>
                      </td>
                      <td className={s.cellCenter}>
                         <span className={s.badgeTotal}>{st.totalReports}</span>
                      </td>
                      <td>{new Date(st.latestDate).toLocaleDateString()}</td>
                      <td>{st.latestSkill}</td>
                      <td>{st.latestActivity}</td>
                      <td>
                        <span className={`${s.badgeProgress} ${st.latestProgress === 'Excellent' ? s.progressExc : st.latestProgress === 'Good' ? s.progressGood : s.progressNeeds}`}>
                          {st.latestProgress}
                        </span>
                      </td>
                      <td>
                         <span className={`${s.badgeEngagement} ${st.latestEngagement === 'High' ? s.engHigh : st.latestEngagement === 'Medium' ? s.engMed : s.engLow}`}>
                           {st.latestEngagement}
                         </span>
                      </td>
                      <td>{st.latestAttendance}</td>
                      <td>
                        <div className={s.tableActions}>
                          <button className={s.actionBtnView} title="View Details" onClick={() => { 
                            setSelectedStudentName(st.name); 
                            setSelectedReports([]); 
                            setTimeout(() => {
                               document.getElementById('selected-student-view')?.scrollIntoView({behavior: 'smooth'});
                            }, 100);
                          }}>
                            <ExternalLink size={15} />
                          </button>
                          <button className={s.actionBtnPdf} title="Download Latest PDF" onClick={() => handleDownloadPDF(st.latestReport)}>
                            <Download size={15} />
                          </button>
                          <button className={s.actionBtnDel} title="Delete Latest Report" onClick={() => handleDelete(st.latestReport._id)}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Selected Student Details */}
          {selectedStudentName && (
            <div id="selected-student-view" className="selected-student-reports-area">
              <div className="selected-student-header">
                <div className="student-summary-avatar" style={{ width: '60px', height: '60px', fontSize: '1.8rem' }}>
                  {selectedStudentName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3>{selectedStudentName}'s Reports</h3>
                  <p style={{ color: 'var(--text-mid)', fontWeight: 700, margin: 0 }}>
                    {selectedStudentReports.length} report{selectedStudentReports.length !== 1 ? 's' : ''} found.
                  </p>
                </div>
                <button className={s.delBtn} style={{ marginLeft: 'auto', background: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' }} onClick={() => setSelectedStudentName(null)}>
                  Close
                </button>
              </div>

              {selectedStudentReports.length === 0 ? (
                <div className={s.emptyState}>
                  <p>No reports match the current filters for {selectedStudentName}.</p>
                </div>
              ) : (
                <>
                  {/* BULK ACTION BAR */}
                  <div className="bulk-action-bar">
                    <label className="bulk-select-all">
                      <input 
                        type="checkbox" 
                        checked={selectedStudentReports.length > 0 && selectedReports.length === selectedStudentReports.length}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedReports(selectedStudentReports.map(r => r._id));
                          else setSelectedReports([]);
                        }}
                      />
                      <span>Select All</span>
                    </label>
                    {selectedReports.length > 0 && (
                      <div className="bulk-actions">
                        <span className="bulk-count">{selectedReports.length} selected</span>
                        <button className="bulk-del-btn" onClick={handleBulkDelete}>
                          <Trash2 size={14} /> Delete Selected
                        </button>
                        <button className="bulk-clear-btn" onClick={() => setSelectedReports([])}>
                          Clear Selection
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="reports-list-clean">
                    {selectedStudentReports.map(r => {
                      
                      const isChecked = selectedReports.includes(r._id);
                      return (
                        <div key={r._id} className={`report-item-clean ${isChecked ? 'selected' : ''}`}>
                          <div className="report-item-checkbox">
                             <input 
                               type="checkbox" 
                               checked={isChecked}
                               onChange={(e) => {
                                 if (e.target.checked) setSelectedReports([...selectedReports, r._id]);
                                 else setSelectedReports(selectedReports.filter(id => id !== r._id));
                               }}
                             />
                          </div>
                          <div className="report-item-content">
                            <div className="report-item-top">
                              <div>
                                <div className="report-item-date">📅 {new Date(r.date).toLocaleDateString()}</div>
                                <div className="report-item-activity">
                                  🎯 {r.activity} {r.sessionDuration ? `(⏱️ ${formatDuration(r.sessionDuration)})` : ''}
                                </div>
                              </div>
                              
                            </div>
                            {r.notes && (
                              <div className="report-item-notes">
                                <strong>Teacher's Notes:</strong><br/>
                                {r.notes}
                              </div>
                            )}
                            <div className="report-item-actions">
                              <button className={s.pdfBtn} style={{ background: '#fef3c7', color: '#b45309', borderColor: '#fcd34d' }} onClick={() => {
                                handleEditReport(r);
                                setSelectedStudentName(null);
                              }}>
                                <Edit size={14} /> Edit
                              </button>
                              <button className={s.pdfBtn} onClick={() => handleDownloadPDF(r)}>
                                <Download size={14} /> Download PDF
                              </button>
                              <button className={s.pdfBtn} onClick={() => handlePrintReport(r)} style={{ background: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' }}>
                                <Printer size={14} /> Print
                              </button>
                              <button className={s.delBtn} onClick={() => handleDelete(r._id)}>
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════
   TAB 3 — RESOURCE LIBRARY
═══════════════════════════════════════════════════ */
function ResourcesTab() {
  const [resources, setResources] = useState([]);
  const [toast,     setToast]     = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({
    title: '', type: 'video', fileUrl: '', instructionalText: '', targetSkill: 'general', requiredLevel: 0, offlineInstructions: ''
  });

  const flash = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const loadResources = async () => {
    try {
      const res  = await fetch(`${API}/resources`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setResources(data);
    } catch { /* silent */ }
  };

  useEffect(() => { loadResources(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res  = await fetch(`${API}/resources`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({
          ...form,
          requiredLevel: Math.min(25, Math.max(0, parseInt(form.requiredLevel) || 0)),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        flash('✅ Resource saved!');
        setForm({ title: '', type: 'video', fileUrl: '', instructionalText: '', targetSkill: 'general', requiredLevel: 0, offlineInstructions: '' });
        loadResources();
      } else {
        flash(`❌ ${data.error || 'Failed'}`, false);
      }
    } catch { flash('❌ Cannot connect to backend.', false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resource?')) return;
    await fetch(`${API}/resources/${id}`, { method: 'DELETE', headers: authHeaders() });
    loadResources();
  };

  const rcClass = (type) =>
    ({ video: s.rcVideo, pdf: s.rcPdf, link: s.rcLink }[type] || '');
  const bdgClass = (type) =>
    ({ video: s.badgeVideo, pdf: s.badgePdf, link: s.badgeLink }[type] || '');

  // ── Derived: filtered resources ──
  const q = searchQuery.trim().toLowerCase();
  const filteredResources = q
    ? resources.filter((r) => {
        const titleMatch = r.title?.toLowerCase().includes(q);
        const typeMatch  = r.type?.toLowerCase().includes(q);
        const levelStr   = String(r.requiredLevel ?? 0);
        const levelMatch = levelStr.includes(q) || `level ${levelStr}`.includes(q);
        return titleMatch || typeMatch || levelMatch;
      })
    : resources;

  return (
    <>
      {/* ── Add Resource Form ── */}
      <div className={s.formCard} style={{ borderBottomColor: 'var(--td-lav)' }}>
        <h3><PlusCircle size={19} /> Add Learning Material</h3>
        <Toast {...(toast || { msg: '' })} />
        <form onSubmit={handleSave}>
          <div className={s.formRow}>
            <div className={s.formGroup}>
              <label className={s.formLabel}>📌 Title</label>
              <input className={s.formInput} type="text" placeholder="Resource title…"
                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>🗂️ Type</label>
              <select className={s.formInput} value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="video">🎬 Video</option>
                <option value="pdf">📄 PDF Document</option>
                <option value="link">🔗 Educational Link</option>
                <option value="offline">🌳 Offline Activity</option>
              </select>
            </div>
          </div>
          <div className={s.formRow}>
            <div className={s.formGroup}>
              <label className={s.formLabel}>🎯 Target Skill</label>
              <select className={s.formInput} value={form.targetSkill}
                onChange={e => setForm({ ...form, targetSkill: e.target.value })}>
                <option value="general">General / Routine</option>
                <option value="focus">Focus &amp; Attention</option>
                <option value="calming">Calming &amp; Winding Down</option>
                <option value="communication">Communication &amp; Social</option>
              </select>
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>⭐ Required Level</label>
              <input className={s.formInput} type="number" min="0" max="25"
                value={form.requiredLevel}
                onChange={e => setForm({ ...form, requiredLevel: e.target.value })}
                onBlur={e => setForm(f => ({ ...f, requiredLevel: Math.min(25, Math.max(0, parseInt(f.requiredLevel) || 0)) }))}
                required />
            </div>
          </div>

          {form.type === 'offline' ? (
            <div className={s.formGroup} style={{ marginBottom: '16px' }}>
              <label className={s.formLabel}>🌳 Offline Instructions</label>
              <textarea className={`${s.formInput} ${s.textarea}`}
                placeholder="Explain the screen-free activity steps here..."
                value={form.offlineInstructions}
                onChange={e => setForm({ ...form, offlineInstructions: e.target.value })} required />
            </div>
          ) : (
            <div className={s.formGroup} style={{ marginBottom: '16px' }}>
              <label className={s.formLabel}>🔗 URL</label>
              <input className={s.formInput} type="text" placeholder="https://…"
                value={form.fileUrl} onChange={e => setForm({ ...form, fileUrl: e.target.value })} required />
            </div>
          )}
          <div className={s.formGroup}>
            <label className={s.formLabel}>🗒️ Instructional Text (Accessibility / TTS)</label>
            <textarea className={`${s.formInput} ${s.textarea}`}
              placeholder="Describe in simple words what the student should do or learn…"
              value={form.instructionalText}
              onChange={e => setForm({ ...form, instructionalText: e.target.value })} required />
          </div>
          <button type="submit" className={s.saveBtn}
            style={{ background:'var(--td-lav)', boxShadow:'0 4px 0 var(--td-lav-dk)' }}>
            <Save size={16} /> Save Resource
          </button>
        </form>
      </div>

      {/* ── Resources Grid ── */}
      <div className={s.sectionHeader}>
        <div>
          <h2>🗂️ Active Resources</h2>
          <p>{resources.length} material{resources.length !== 1 ? 's' : ''} in the library.</p>
        </div>
        <button className={s.refreshBtn} onClick={loadResources}>
          <RefreshCcw size={15} /> Refresh
        </button>
      </div>

      {/* ── SEARCH BAR ── */}
      <div style={{ margin: '16px 0', position: 'relative' }}>
        <span style={{
          position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
          fontSize: '1.1rem', pointerEvents: 'none',
        }}>🔍</span>
        <input
          id="teacher-resource-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search library by title, format, or level..."
          style={{
            width: '100%',
            padding: '12px 42px 12px 42px',
            borderRadius: '12px',
            border: '2px solid rgba(108, 92, 231, 0.2)',
            fontSize: '0.95rem',
            fontFamily: 'inherit',
            fontWeight: 600,
            background: 'rgba(255,255,255,0.95)',
            boxShadow: '0 2px 12px rgba(108,92,231,0.08)',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--td-lav, #6C5CE7)';
            e.target.style.boxShadow = '0 2px 16px rgba(108,92,231,0.2)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(108, 92, 231, 0.2)';
            e.target.style.boxShadow = '0 2px 12px rgba(108,92,231,0.08)';
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            title="Clear search"
            style={{
              position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(108,92,231,0.10)', border: 'none', borderRadius: '50%',
              width: 26, height: 26, cursor: 'pointer', color: 'var(--td-lav, #6C5CE7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', fontWeight: 800,
            }}
          >✕</button>
        )}
      </div>

      {resources.length === 0 ? (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>📚</div>
          <p>No resources yet — add one above!</p>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>🔎</div>
          <p>No matching resources found for <strong>"{searchQuery}"</strong>. Try a different keyword.</p>
        </div>
      ) : (
        <div className={s.cardsGrid}>
          {filteredResources.map(r => (
            <div key={r._id} className={`${s.resourceCard} ${rcClass(r.type)}`}>
              <div className={s.resourceBody}>
                <span className={`${s.typeBadge} ${bdgClass(r.type)}`}>
                  {TYPE_EMOJI[r.type] || '📦'} {r.type.toUpperCase()}
                </span>
                <span className={s.typeBadge} style={{ background: '#fefce8', color: '#92400e', border: '1px solid #fde047', marginLeft: '6px' }}>
                  ⭐ Lvl {r.requiredLevel || 0}
                </span>
                <p className={s.resourceTitle}>{r.title}</p>
                {r.instructionalText && (
                  <p className={s.resourceNotes}>🗒️ {r.instructionalText}</p>
                )}
              </div>
              <div className={s.resourceActions}>
                {r.type !== 'offline' && r.fileUrl ? (
                  <a href={r.fileUrl} target="_blank" rel="noreferrer" className={s.openLink}>
                    <ExternalLink size={14} /> Open Resource
                  </a>
                ) : (
                  <span className={s.openLink}>
                    <CheckCircle size={14} /> Offline Activity
                  </span>
                )}
                <button className={s.delBtn} onClick={() => handleDelete(r._id)}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════
   TAB 4 — INBOX / MESSAGES
═══════════════════════════════════════════════════ */
function InboxTab() {
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await fetch(`${API}/users/students`, { headers: authHeaders() });
        if (res.ok) setContacts(await res.json());
      } catch { }
    };
    fetchContacts();
  }, []);

  useEffect(() => {
    if (!activeContact) return;
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/messages/${activeContact._id}`, { headers: authHeaders() });
        if (res.ok) setMessages(await res.json());
      } catch { }
      setLoading(false);
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [activeContact]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeContact) return;
    try {
      const res = await fetch(`${API}/messages`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ receiverId: activeContact._id, content: newMessage })
      });
      if (res.ok) {
        const savedMsg = await res.json();
        setMessages([...messages, savedMsg]);
        setNewMessage('');
      }
    } catch { }
  };

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('brightsteps_user')); } 
    catch { return null; }
  })();

  return (
    <div className={s.inboxContainer}>
      {/* LEFT PANE - CONTACTS */}
      <div className={s.contactList}>
        <div className={s.contactHeader}>
          <h3>Contacts</h3>
        </div>
        <div className={s.scrollableContacts}>
          {contacts.map(c => (
            <div 
              key={c._id} 
              className={`${s.contactItem} ${activeContact?._id === c._id ? s.contactActive : ''}`}
              onClick={() => setActiveContact(c)}
            >
              <div className={s.contactAvatar}>{c.name.charAt(0).toUpperCase()}</div>
              <div>
                <p className={s.contactName}>{c.parentName || c.name} (Parent)</p>
                <p className={s.contactRole}>Student: {c.name}</p>
              </div>
            </div>
          ))}
          {contacts.length === 0 && <p style={{padding: '20px', color: '#64748B'}}>No assigned students.</p>}
        </div>
      </div>

      {/* RIGHT PANE - CHAT */}
      <div className={s.chatArea}>
        {activeContact ? (
          <>
            <div className={s.chatHeader}>
              <div className={s.contactAvatar}>{activeContact.name.charAt(0).toUpperCase()}</div>
              <div>
                <h3 className={s.chatTitle}>{activeContact.parentName || activeContact.name}</h3>
                <p className={s.chatSubtitle}>Re: {activeContact.name}</p>
              </div>
            </div>
            
            <div className={s.chatHistory}>
              {loading && messages.length === 0 ? <p>Loading messages...</p> : (
                messages.map(m => {
                  const isMine = m.senderId === user?._id;
                  return (
                    <div key={m._id} className={`${s.messageWrapper} ${isMine ? s.messageMine : s.messageTheirs}`}>
                      <div className={s.messageBubble}>
                        {m.content}
                      </div>
                      <div className={s.messageTime}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form className={s.chatForm} onSubmit={handleSend}>
              <input 
                type="text" 
                placeholder="Type your message..." 
                className={s.chatInput}
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
              />
              <button type="submit" className={s.chatSendBtn} disabled={!newMessage.trim()}>
                <Send size={16} /> Send
              </button>
            </form>
          </>
        ) : (
          <div className={s.chatPlaceholder}>
            <MessageSquare size={48} color="#CBD5E1" />
            <p>Select a contact to view conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TAB 5 — ANALYTICS (real backend data)
═══════════════════════════════════════════════════ */
const CHART_COLORS = ['#E85C45', '#44A7CE', '#5EAD6E', '#9C80D2', '#F2B53A', '#f9a8d4'];

const MOOD_EMOJI_MAP = {
  Happy: '😊', Excited: '🤩', Neutral: '😐', Tired: '😴', Frustrated: '😤',
};

function getPeriodDefaults(reportType) {
  const today = new Date();
  const end = today.toISOString().split('T')[0];
  const startDate = new Date(today);
  if (reportType === 'weekly') {
    startDate.setDate(today.getDate() - 6);
  } else {
    startDate.setDate(today.getDate() - 29);
  }
  return { startDate: startDate.toISOString().split('T')[0], endDate: end };
}

function AnalyticsTab() {
  const [reportType, setReportType] = useState('weekly');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [dateRange, setDateRange] = useState(getPeriodDefaults('weekly'));

  const [data, setData] = useState(null);
  const [compData, setCompData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
    const [dateError, setDateError] = useState(null);
  const [studentSearchFocus, setStudentSearchFocus] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Fetch main analytics data
  const fetchAnalytics = async (period, start, end, student) => {
    const params = new URLSearchParams();
    params.set('period', period);
    if (start) params.set('startDate', start);
    if (end) params.set('endDate', end);
    if (student) params.set('studentName', student);
    const res = await fetch(`${API}/analytics/teacher-summary?${params}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const main = await fetchAnalytics(reportType, dateRange.startDate, dateRange.endDate, selectedStudent);
      setData(main);

      // Fetch comparison data (weekly AND monthly, ignoring filters)
      const [weekly, monthly] = await Promise.all([
        fetchAnalytics('weekly', null, null, selectedStudent),
        fetchAnalytics('monthly', null, null, selectedStudent),
      ]);
      setCompData([
        { metric: 'Active Students', Weekly: weekly.summary.activeStudentsInPeriod, Monthly: monthly.summary.activeStudentsInPeriod },
        { metric: 'Total Reports', Weekly: weekly.summary.totalReports, Monthly: monthly.summary.totalReports },
        { metric: 'Resources Shared', Weekly: weekly.summary.totalResources, Monthly: monthly.summary.totalResources },
        { metric: 'Game Play Time (s)', Weekly: weekly.summary.totalGamePlayTime, Monthly: monthly.summary.totalGamePlayTime },
      ]);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Validate bounds: Start >= 2026, End <= Today
    const startYear = new Date(dateRange.startDate).getFullYear();
    const TODAY = new Date().toISOString().split('T')[0];
    
    if (startYear < 2026 || dateRange.endDate > TODAY) {
      setDateError("⚠️ Invalid date range. Start year must be 2026 or later, and End Date cannot exceed today.");
      return; 
    }
    setDateError(null);
    loadData();
  }, [reportType, dateRange, selectedStudent]); // eslint-disable-line

  useEffect(() => {
    setDateRange(getPeriodDefaults(reportType));
    setDateError(null);
  }, [reportType]);

  const resetFilters = () => {
    setReportType('weekly');
    setSelectedStudent('');
    setDateRange(getPeriodDefaults('weekly'));
  };

  const addChartToDoc = (doc, dataUrl, title) => {
    if (!dataUrl) return;
    doc.addPage();
    let y = 20;
    doc.setFontSize(16); doc.setTextColor(61, 181, 160);
    doc.text(title, 14, y);
    y += 10;
    
    // Scale image correctly based on A4 width limits
    const imgProps = doc.getImageProperties(dataUrl);
    const pdfWidth = 180;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    doc.addImage(dataUrl, 'PNG', 15, y, pdfWidth, pdfHeight);
  };

  const exportAnalyticsPDF = async () => {
    if (!data) return;

    // ── 1. Capture visual graph rows via html2canvas ──
    let img1 = null, img2 = null, img3 = null;
    try {
      const el1 = document.getElementById('charts-row-1');
      const el2 = document.getElementById('charts-row-2');
      const el3 = document.getElementById('charts-row-3');
      const opts = { scale: 1.5, backgroundColor: '#fafffe' }; // match dash bg
      
      if (el1) img1 = (await html2canvas(el1, opts)).toDataURL('image/png');
      if (el2) img2 = (await html2canvas(el2, opts)).toDataURL('image/png');
      if (el3) img3 = (await html2canvas(el3, opts)).toDataURL('image/png');
    } catch(e) { console.error('Error capturing charts', e); }

    // ── 2. Generate original data PDF ──
    const doc = new jsPDF();
    let currentY = 20;
    doc.setFontSize(20); doc.setTextColor(61, 181, 160);
    doc.text('BrightSteps Teacher Analytics Report', 14, currentY); currentY += 10;
    doc.setFontSize(11); doc.setTextColor(70, 70, 70);
    doc.text(`Report Type: ${data.period.toUpperCase()}`, 14, currentY); currentY += 6;
    doc.text(`Date Range: ${data.startDate} to ${data.endDate}`, 14, currentY); currentY += 6;
    if (selectedStudent) { doc.text(`Student: ${selectedStudent}`, 14, currentY); currentY += 6; }
    currentY += 4;
    const summaryRows = [
      ['Total Students', String(data.summary.totalStudents)],
      ['Active This Period', String(data.summary.activeStudentsInPeriod)],
      ['Total Reports', String(data.summary.totalReports)],
      ['Unique Activities', String(data.summary.totalActivities)],
      ['Resources Shared', String(data.summary.totalResources)],
      ['Game Play Time', formatDurationFromSeconds(data.summary.totalGamePlayTime)],
    ];
    autoTable(doc, { startY: currentY, head: [['Metric', 'Value']], body: summaryRows, headStyles: { fillColor: [61, 181, 160] }, alternateRowStyles: { fillColor: [240, 253, 250] } });
    currentY = doc.lastAutoTable.finalY + 10;
    if (data.reportsByStudent.length) {
      autoTable(doc, { 
        startY: currentY, 
        head: [['Student', 'Reports', 'Active Days', 'Attendance', 'Activities', 'Game Plays', 'Game Time', 'Stars']], 
        body: data.reportsByStudent.map(r => [
          r.studentName, 
          r.totalReports, 
          r.activeDays, 
          r.attendance, 
          r.uniqueActivities, 
          r.gameReports, 
          formatDurationFromSeconds(r.totalGameTime), 
          r.totalStars
        ]), 
        headStyles: { fillColor: [94, 207, 186] }, 
        alternateRowStyles: { fillColor: [247, 255, 252] } 
      });
      currentY = doc.lastAutoTable.finalY + 10;
    }
    if (data.leaderboard.length) {
      autoTable(doc, { startY: currentY, head: [['Rank', 'Student', 'Game', 'Stars', 'Time', 'Moves']], body: data.leaderboard.map(r => [r.rank, r.studentName, r.gameName, r.stars, formatDurationFromSeconds(r.completionTime), r.totalMoves]), headStyles: { fillColor: [242, 181, 58] }, alternateRowStyles: { fillColor: [255, 252, 240] } });
    }

    // ── 3. Append Graph Appendices ──
    addChartToDoc(doc, img1, 'Appendix I: Student Report Activity Graphs');
    addChartToDoc(doc, img2, 'Appendix II: Resource & Targets Graphs');
    addChartToDoc(doc, img3, 'Appendix III: Educational Game Progress Graphs');

    doc.save(`teacher_${data.period}_analytics_report.pdf`);
  };

  if (loading) {
    return <div className={s.emptyState}><div className={s.emptyIcon}>⏳</div><p>Loading analytics…</p></div>;
  }
  if (error) {
    return <div className={s.emptyState}><div className={s.emptyIcon}>❌</div><p>Error: {error}</p><button className={s.refreshBtn} onClick={loadData}><RefreshCcw size={15} /> Retry</button></div>;
  }
  if (!data) return null;

  const { summary, reportsByStudent, dailyActivity, moodDistribution, resourceTypeBreakdown, resourceSkillBreakdown, resourceList, levelDistribution, gameTimeData, gamePerformance, leaderboard, students } = data;

  const summaryCards = [
    { icon: '👥', label: 'Total Students',     value: summary.totalStudents },
    { icon: '🟢', label: 'Active This Period',  value: summary.activeStudentsInPeriod },
    { icon: '📋', label: 'Total Reports',       value: summary.totalReports },
    { icon: '🎯', label: 'Unique Activities',   value: summary.totalActivities },
    { icon: '📚', label: 'Resources Shared',    value: summary.totalResources },
    { icon: '🎮', label: 'Game Plays',          value: summary.totalGamePlays ?? 0 },
    { icon: '⏱️', label: 'Game Play Time',      value: formatDurationFromSeconds(summary.totalGamePlayTime) },
  ];

  return (
    <>
      {/* ── Header ── */}
      <div className={s.sectionHeader}>
        <div>
          <h2>📊 {reportType === 'weekly' ? 'Weekly' : 'Monthly'} Analytics</h2>
          <p>Real-time overview of student activity, resources, and game performance.</p>
        </div>
        <button className={s.refreshBtn} onClick={exportAnalyticsPDF}>
          <FileText size={15} /> Export PDF
        </button>
      </div>

      {/* ── Filters ── */}
      <div className={s.analyticsFiltersCard}>
        <div className={s.analyticsFiltersHead}>
          <div className={s.analyticsFiltersLabel}><Filter size={16} /> Filters</div>
          <button className={s.refreshBtn} onClick={resetFilters}>Reset</button>
        </div>
        <div className={s.analyticsFiltersGrid}>
          <div className={s.analyticsFilterGroup}>
            <label>Report Type</label>
            <select className={s.formInput} value={reportType} onChange={e => setReportType(e.target.value)}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className={s.analyticsFilterGroup} style={{ position: 'relative' }}>
              <label>🔍 Student Search</label>
              <input 
                className={s.formInput} 
                type="text" 
                placeholder="All Students..."
                value={studentSearchFocus ? studentSearchQuery : (selectedStudent || 'All Students')} 
                onChange={e => {
                  setStudentSearchQuery(e.target.value);
                  if (e.target.value === '') setSelectedStudent('');
                }} 
                onFocus={() => {
                  setStudentSearchFocus(true);
                  setStudentSearchQuery('');
                }}
                onBlur={() => setTimeout(() => setStudentSearchFocus(false), 200)}
                autoComplete="off"
              />
              {studentSearchFocus && students && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '2px solid #e2e8f0', borderRadius: '12px', zIndex: 50, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginTop: '4px' }}>
                  <div 
                    onClick={() => { setSelectedStudent(''); setStudentSearchFocus(false); }}
                    style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: 'var(--td-ink-mid)' }}
                    onMouseEnter={e => e.target.style.background = '#f8fafc'}
                    onMouseLeave={e => e.target.style.background = 'white'}
                  >
                    All Students
                  </div>
                  {students.filter(st => st.name.toLowerCase().includes(studentSearchQuery.toLowerCase())).map(st => (
                    <div 
                      key={st._id}
                      onClick={() => { setSelectedStudent(st.name); setStudentSearchFocus(false); }}
                      style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: 'var(--td-ink-mid)' }}
                      onMouseEnter={e => e.target.style.background = '#f8fafc'}
                      onMouseLeave={e => e.target.style.background = 'white'}
                    >
                      {st.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          <div className={s.analyticsFilterGroup}>
            <label>Start Date</label>
            <input className={s.formInput} type="date" min="2026-01-01" max={new Date().toISOString().split('T')[0]} value={dateRange.startDate} onChange={e => setDateRange(p => ({ ...p, startDate: e.target.value }))} />
          </div>
          <div className={s.analyticsFilterGroup}>
            <label>End Date</label>
            <input className={s.formInput} type="date" min="2026-01-01" max={new Date().toISOString().split('T')[0]} value={dateRange.endDate} onChange={e => setDateRange(p => ({ ...p, endDate: e.target.value }))} />
          </div>
        </div>
        
        {dateError && (
          <div style={{ color: '#E85C45', background: '#FDEAE6', border: '1px solid #eba498', padding: '12px 16px', borderRadius: '12px', marginTop: '20px', fontWeight: 'bold' }}>
            {dateError}
          </div>
        )}
      </div>

      {/* ── Summary Cards ── */}
      <div className={s.analyticsSummaryGrid}>
        {summaryCards.map(card => (
          <div key={card.label} className={s.analyticsSummaryCard}>
            <div className={s.analyticsSummaryIcon}>{card.icon}</div>
            <div className={s.analyticsSummaryValue}>{card.value}</div>
            <div className={s.analyticsSummaryLabel}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* ── Section 1: Report Activity ── */}
      <div className={s.analyticsBlock}>
        <div className={s.analyticsBlockHead}>
          <h3>1. Student Report Activity</h3>
          <span className={s.statBox}>{summary.totalReports} Reports · {summary.activeStudentsInPeriod} Students</span>
        </div>
        <div id="charts-row-1" className={s.analyticsChartsRow}>
          <div className={s.analyticsChartCard}>
            <h4>Daily Report Trend</h4>
            <div className={s.chartWrap}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" /><YAxis allowDecimals={false} /><Tooltip /><Legend />
                  <Line type="monotone" dataKey="reports" stroke="#E85C45" name="Reports" strokeWidth={3} />
                  <Line type="monotone" dataKey="uniqueStudents" stroke="#44A7CE" name="Active Students" strokeWidth={3} />
                  <Line type="monotone" dataKey="gameReports" stroke="#5EAD6E" name="Game Reports" strokeWidth={3} />
                  <Line type="monotone" dataKey="totalStars" stroke="#F2B53A" name="Stars Earned" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
        </div>
        <div className={s.analyticsTableScroll}>
          <table className={s.analyticsTable}>
            <thead><tr><th>Student</th><th>Reports</th><th>Active Days</th><th>Attendance</th><th>Activities</th><th>Game Reports</th><th>Game Time</th><th>Stars</th></tr></thead>
            <tbody>
              {reportsByStudent.length ? reportsByStudent.map(row => (
                <tr key={row.studentName}>
                  <td>{row.studentName}</td>
                  <td>{row.totalReports}</td>
                  <td>{row.activeDays}</td>
                  <td>{row.attendance}</td>
                  <td>{row.uniqueActivities}</td>
                  <td>{row.gameReports}</td>
                  <td>{formatDurationFromSeconds(row.totalGameTime)}</td>
                  <td>{row.totalStars}</td>
                </tr>
              )) : <tr><td colSpan="8" style={{textAlign:'center',padding:'20px',color:'var(--td-ink-soft)'}}>No report data for this period.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 2: Resource Activity ── */}
      <div className={s.analyticsBlock}>
        <div className={s.analyticsBlockHead}>
          <h3>2. Resource & Recommendation Activity</h3>
          <span className={s.statBox}>{summary.totalResources} Resources Shared</span>
        </div>
        <div id="charts-row-2" className={s.analyticsChartsRow}>
          <div className={s.analyticsChartCard}>
            <h4>Resources by Type</h4>
            <div className={s.chartWrap}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={resourceTypeBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Legend />
                  <Bar dataKey="total" fill="#44A7CE" name="Count" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className={s.analyticsChartCard}>
            <h4>Resources by Target Skill</h4>
            <div className={s.chartWrap}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={resourceSkillBreakdown} dataKey="value" nameKey="name" outerRadius={90} label>
                    {resourceSkillBreakdown.map((entry, index) => (
                      <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className={s.analyticsTableScroll}>
          <table className={s.analyticsTable}>
            <thead><tr><th>Title</th><th>Type</th><th>Target Skill</th><th>Level</th><th>Assigned To</th><th>Date</th></tr></thead>
            <tbody>
              {resourceList.length ? resourceList.map(row => (
                <tr key={row.id}><td>{row.title}</td><td>{row.type}</td><td>{row.targetSkill}</td><td>⭐ Lvl {row.requiredLevel}</td><td>{row.studentName || 'All'}</td><td>{new Date(row.createdAt).toLocaleDateString()}</td></tr>
              )) : <tr><td colSpan="6" style={{textAlign:'center',padding:'20px',color:'var(--td-ink-soft)'}}>No resources shared in this period.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 3: Games Analytics ── */}
      <div className={s.analyticsBlock}>
        <div className={s.analyticsBlockHead}>
          <h3>3. Educational Games Analytics</h3>
          <span className={s.statBox}>{summary.totalGamePlays ?? 0} Plays · {formatDurationFromSeconds(summary.totalGamePlayTime)} Play Time</span>
        </div>
        <div id="charts-row-3" className={s.analyticsChartsRow3}>
          <div className={s.analyticsChartCard}>
            <h4>Performance Distribution</h4>
            <div className={s.chartWrap}>
              {levelDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={levelDistribution} dataKey="value" nameKey="name" outerRadius={80} label>
                      {levelDistribution.map((entry, index) => (
                        <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{height:260,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'var(--td-ink-soft)',gap:'8px'}}>
                  <span style={{fontSize:'2rem'}}>🎮</span>
                  <p style={{margin:0,fontSize:'0.85rem'}}>No game plays in this period</p>
                </div>
              )}
            </div>
          </div>
          <div className={s.analyticsChartCard}>
            <h4>Time Spent per Game</h4>
            <div className={s.chartWrap}>
              {gameTimeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={gameTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip />
                    <Bar dataKey="total" fill="#5EAD6E" name="Seconds" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{height:260,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'var(--td-ink-soft)',gap:'8px'}}>
                  <span style={{fontSize:'2rem'}}>⏱️</span>
                  <p style={{margin:0,fontSize:'0.85rem'}}>No time data in this period</p>
                </div>
              )}
            </div>
          </div>
          <div className={s.analyticsChartCard}>
            <h4>Plays &amp; Moves per Game</h4>
            <div className={s.chartWrap}>
              {gamePerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={gamePerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Legend />
                    <Bar dataKey="plays" fill="#E85C45" name="Plays" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="totalMoves" fill="#9C80D2" name="Total Moves" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{height:260,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'var(--td-ink-soft)',gap:'8px'}}>
                  <span style={{fontSize:'2rem'}}>📊</span>
                  <p style={{margin:0,fontSize:'0.85rem'}}>No play data in this period</p>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Game Performance Summary Table */}
        <div className={s.analyticsTableScroll}>
          <table className={s.analyticsTable}>
            <thead><tr><th>Game</th><th>Total Plays</th><th>Total Moves</th><th>Total Stars</th><th>Avg Stars / Play</th></tr></thead>
            <tbody>
              {gamePerformance.length ? gamePerformance.map(row => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td>{row.plays}</td>
                  <td>{row.totalMoves}</td>
                  <td>{'⭐'.repeat(Math.min(row.totalStars, 10))}{row.totalStars > 10 ? ` (${row.totalStars})` : ''}</td>
                  <td>{row.plays > 0 ? (row.totalStars / row.plays).toFixed(1) : '—'}</td>
                </tr>
              )) : <tr><td colSpan="5" style={{textAlign:'center',padding:'20px',color:'var(--td-ink-soft)'}}>No game data for this period.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Top 5 Leaderboard — shown only when data exists */}
        {leaderboard.length > 0 && (
          <>
            <div style={{marginTop:'16px',fontWeight:600,color:'var(--td-ink)',fontSize:'0.95rem',padding:'0 4px'}}>🏆 Top Plays Leaderboard</div>
            <div className={s.analyticsTableScroll} style={{marginTop:'8px'}}>
              <table className={s.analyticsTable}>
                <thead><tr><th>Rank</th><th>Student</th><th>Game</th><th>Stars</th><th>Time</th><th>Moves</th><th>Date</th></tr></thead>
                <tbody>
                  {leaderboard.map(row => (
                    <tr key={`${row.rank}-${row.gameName}`}>
                      <td>#{row.rank}</td><td>{row.studentName}</td><td>{row.gameName}</td>
                      <td>{'⭐'.repeat(row.stars)}</td><td>{formatDurationFromSeconds(row.completionTime)}</td>
                      <td>{row.totalMoves}</td><td>{new Date(row.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Section 4: Weekly vs Monthly Comparison ── */}
      {compData && (
        <div className={s.analyticsBlock}>
          <div className={s.analyticsBlockHead}>
            <h3>4. Weekly vs Monthly Comparison</h3>
            <span className={s.statBox}>Side-by-Side</span>
          </div>
          <div className={s.analyticsChartCard}>
            <div className={s.chartWrap}>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={compData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" /><YAxis allowDecimals={false} /><Tooltip /><Legend />
                  <Bar dataKey="Weekly" fill="#44A7CE" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Monthly" fill="#E85C45" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


/* ═══════════════════════════════════════════════════
   MAIN — TEACHER DASHBOARD
═══════════════════════════════════════════════════ */
const TABS = [
  { id: 'students',  label: 'My Students',     icon: <Users size={17} /> },
  { id: 'reports',   label: 'Progress Reports', icon: <ClipboardList size={17} /> },
  { id: 'resources', label: 'Resource Library', icon: <BookOpen size={17} /> },
  { id: 'inbox',     label: 'Messages',        icon: <MessageSquare size={17} /> },
  { id: 'analytics', label: 'Analytics',       icon: <BarChart3 size={17} /> },
];

export default function TeacherDashboard() {
  const navigate       = useNavigate();
  const [activeTab, setActiveTab] = useState('students');

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('brightsteps_user')); }
    catch { return null; }
  })();

  const handleLogout = () => {
    localStorage.removeItem('brightsteps_token');
    localStorage.removeItem('brightsteps_user');
    navigate('/login');
  };

  return (
    <div className={s.wrapper}>

      {/* ── Navigation ── */}
      <nav className={s.nav}>
        <Link to="/teacher-dashboard" className={s.navBrand}>
          ✨ Bright<em>Steps</em>
        </Link>
        <div className={s.navRight}>
          <div className={s.navChip}>
            👩‍🏫 {user?.name || 'Teacher'}
            <span className={s.rolePill}>Teacher</span>
          </div>
          <button className={s.logoutBtn} onClick={handleLogout}>
            <LogOut size={15} /> Log Out
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className={s.hero}>
        <span className={s.heroDeco}>📋</span>
        <span className={s.heroDeco}>🌟</span>
        <span className={s.heroDeco}>📚</span>
        <span className={s.heroDeco}>🎯</span>

        <h1 className={s.heroTitle}>
          Teacher <span className={s.accent}>Dashboard</span>
        </h1>
        <p className={s.heroSub}>
          Monitor students · record progress · manage learning materials
        </p>
        <div className={s.heroStats}>
          <span className={`${s.statChip} ${s.chipAmber}`}>📋 Full Report Access</span>
          <span className={`${s.statChip} ${s.chipTeal}`}>👥 All Students</span>
          <span className={`${s.statChip} ${s.chipSage}`}>🏅 Admin Control</span>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className={s.tabBar}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`${s.tabBtn} ${activeTab === t.id ? s.tabActive : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.icon} {t.label}
            <span className={s.tabDot} />
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <main className={s.main}>
        {activeTab === 'students'  && <StudentsTab />}
        {activeTab === 'reports'   && <ReportsTab />}
        {activeTab === 'resources' && <ResourcesTab />}
        {activeTab === 'inbox'     && <InboxTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
      </main>

    </div>
  );
}