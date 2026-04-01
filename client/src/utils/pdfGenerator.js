import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates and downloads a formatted PDF for a single student progress report.
 * @param {Object} report - The progress report object from the database.
 * @param {string} title - The title rendered at the top of the PDF document.
 */
export const downloadSingleReportPDF = (report, title = 'BrightSteps Progress Report') => {
  const dateObj = report.date ? new Date(report.date) : new Date();
  const dateTxt = dateObj.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  
  const moodMap = { 'Happy': '😊', 'Excited': '🤩', 'Neutral': '😐', 'Tired': '😴', 'Frustrated': '😤' };
  const moodEmoji = moodMap[report.mood] || '😐';
  
  const student = report.studentName || 'Student';
  const activity = report.activity || 'Learning Activity';
  const mood = report.mood || 'N/A';
  const stars = report.stars || 0;
  
  const safeNotes = report.notes ? report.notes.replace(/\n/g, '<br/>') : 'No teacher notes provided for this session.';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${title} — ${student}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap');
    @page { margin: 20mm 18mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family:'Nunito',sans-serif; background:#f8fdfc; color:#1e293b; font-size:14px; }

    .page        { max-width:680px; margin:0 auto; padding:32px; }

    /* Header */
    .report-header {
      background: linear-gradient(135deg, #fff0e8 0%, #e8faf7 50%, #e0f5ff 100%);
      border-radius:20px; padding:28px 32px; margin-bottom:28px;
      display:flex; align-items:center; gap:18px;
      border: 2px solid rgba(94,207,186,0.3);
    }
    .report-header .icon   { font-size:3.2rem; line-height:1; }
    .report-header h1      { font-size:1.55rem; font-weight:900; color:#1e293b; margin-bottom:4px; }
    .report-header .for-txt{ font-size:0.88rem; font-weight:700; color:#4a6074; }
    .report-header .date   { font-size:0.78rem; font-weight:700; color:#94a3b8; margin-top:3px; }

    /* Stats pills */
    .pills { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:28px; }
    .pill  { border-radius:14px; padding:18px 12px; text-align:center; border:2px solid; }
    .pill strong { display:block; font-size:1.6rem; font-weight:900; line-height:1.2; }
    .pill small  { font-size:0.72rem; font-weight:800; color:#4a6074; display:block; margin-top:4px; }
    .pill.p-green { background:#eafff1; border-color:#4ade80; }
    .pill.p-sky   { background:#e0f5ff; border-color:#38bdf8; }
    .pill.p-peach { background:#fff0e8; border-color:#f4956a; }

    /* Section heading */
    .section-heading {
      font-size:1rem; font-weight:900; color:#1e293b;
      margin:24px 0 12px; display:flex; align-items:center; gap:8px;
    }
    .section-heading::after {
      content:''; flex:1; height:2px; background:rgba(94,207,186,0.25); border-radius:2px;
    }

    /* Content Box */
    .content-box {
      background: #ffffff; border-radius: 14px; padding: 20px;
      border: 2px solid #e2e8f0; font-size: 0.95rem; line-height: 1.6; color:#334155;
    }

    /* Footer */
    .report-footer {
      text-align:center; margin-top:36px; padding-top:20px;
      border-top:2px dashed rgba(94,207,186,0.3);
      font-size:0.78rem; font-weight:700; color:#94a3b8;
    }
  </style>
</head>
<body>
<div class="page">
  <div class="report-header">
    <div class="icon">📖</div>
    <div>
      <h1>${title}</h1>
      <p class="for-txt">for <strong>${student}</strong></p>
      <p class="date">Generated on ${dateTxt}</p>
    </div>
  </div>

  <div class="pills">
    <div class="pill p-sky"  ><strong>${activity}</strong><small>🎯 Learning Focus</small></div>
    <div class="pill p-green"><strong>${moodEmoji} ${mood}</strong><small>😊 Today's Mood</small></div>
    <div class="pill p-peach"><strong>${stars}</strong><small>⭐ Stars Earned</small></div>
  </div>

  <div class="section-heading">📝 Teacher Notes</div>
  <div class="content-box">
    ${safeNotes}
  </div>

  <div class="report-footer">
    BrightSteps Official Record &nbsp;·&nbsp; Keep shining, ${student}! 🌟
  </div>
</div>
<script>window.onload = () => { setTimeout(() => window.print(), 400); }</script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) win.onafterprint = () => URL.revokeObjectURL(url);
};
