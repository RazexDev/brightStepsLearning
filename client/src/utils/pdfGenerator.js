/**
 * utils/pdfGenerator.js
 * Utility for generating PDF reports in the Parent Portal.
 *
 * Uses the browser's built-in print API with a styled hidden iframe.
 *
 * Two exports:
 *   downloadSingleReportPDF(report, title)  — for individual progress reports
 *   downloadRoutineReportPDF(summary, childName) — for routine progress summaries
 */

/* ─────────────────────────────────────────────────────
   EXISTING — Progress Report PDF (keep as-is)
───────────────────────────────────────────────────── */
export function downloadSingleReportPDF(report, title = "BrightSteps — Progress Report") {
  const mood = report.mood || "N/A";
  const date = report.date ? new Date(report.date).toLocaleDateString() : "N/A";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>${title}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1E1007; }
        h1   { color: #E85C45; font-size: 26px; margin-bottom: 4px; }
        h2   { color: #3DB5A0; font-size: 18px; margin: 24px 0 8px; }
        .meta { color: #6B4C30; font-size: 13px; margin-bottom: 28px; }
        .row  { display: flex; gap: 12px; margin-bottom: 10px; }
        .label{ font-weight: 700; min-width: 160px; }
        .val  { color: #3DB5A0; font-weight: 700; }
        .notes{ background: #FFF8EC; border-left: 4px solid #3DB5A0; border-radius: 8px; padding: 14px; margin-top: 10px; }
        .footer { margin-top: 48px; font-size: 11px; color: #B8906A; }
      </style>
    </head>
    <body>
      <h1>✨ BrightSteps — Progress Report</h1>
      <p class="meta">Generated on ${new Date().toLocaleDateString()}</p>
      <h2>Student Details</h2>
      <div class="row"><span class="label">Student Name:</span><span class="val">${report.studentName || "N/A"}</span></div>
      <div class="row"><span class="label">Date:</span><span class="val">${date}</span></div>
      <div class="row"><span class="label">Activity:</span><span class="val">${report.activity || "N/A"}</span></div>
      <div class="row"><span class="label">Mood:</span><span class="val">${mood}</span></div>
      <div class="row"><span class="label">Stars Earned:</span><span class="val">⭐ ${report.stars || 0}</span></div>
      ${report.notes ? `<div class="notes"><strong>Teacher Notes:</strong><br/>${report.notes}</div>` : ""}
      <p class="footer">BrightSteps Educational Platform — Confidential Parent Report</p>
    </body>
    </html>
  `;

  _printHTML(html, title);
}

/* ─────────────────────────────────────────────────────
   NEW — Routine Progress PDF
───────────────────────────────────────────────────── */
export function downloadRoutineReportPDF(summary, childName = "Student") {
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric"
  });

  const badges = (summary.badges || []);
  const categoryRows = (summary.categoryBreakdown || [])
    .map(c => `
      <tr>
        <td style="text-transform:capitalize">${c.category}</td>
        <td>${c.total}</td>
        <td>${c.completed}</td>
        <td>
          <div style="background:#eee;border-radius:999px;height:10px;width:120px;overflow:hidden">
            <div style="background:#3DB5A0;height:100%;width:${c.pct}%;border-radius:999px"></div>
          </div>
          <span style="font-size:11px;color:#6B4C30">${c.pct}%</span>
        </td>
      </tr>
    `)
    .join("");

  const badgeHTML = badges.length
    ? badges.map(b => `<span style="background:#FEF4CC;color:#C8881A;border:1px solid #F2B53A;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700;margin:4px;display:inline-block">${b}</span>`).join("")
    : `<span style="color:#B8906A">No badges earned yet.</span>`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>BrightSteps — Routine Progress Report</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 48px; color: #1E1007; background: white; }
        .header { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; }
        .logo { font-size: 32px; }
        h1 { margin: 0; font-size: 26px; color: #1E1007; }
        h1 em { color: #E85C45; font-style: normal; }
        .subtitle { color: #6B4C30; font-size: 13px; margin: 4px 0 32px; }
        h2 { font-size: 16px; color: #3DB5A0; border-bottom: 2px solid #E0F7F3; padding-bottom: 6px; margin: 28px 0 14px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 8px; }
        .stat-card { background: #FFF8EC; border: 2px solid rgba(30,16,7,0.07); border-top: 4px solid #F2B53A; border-radius: 12px; padding: 16px; text-align: center; }
        .stat-value { font-size: 28px; font-weight: 900; color: #1E1007; }
        .stat-label { font-size: 11px; color: #6B4C30; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px; }
        .progress-bar-wrap { background: #eee; border-radius: 999px; height: 16px; margin: 12px 0 4px; overflow: hidden; }
        .progress-bar-fill { background: linear-gradient(90deg, #3DB5A0, #44A7CE); height: 100%; border-radius: 999px; }
        .pct-label { font-size: 13px; font-weight: 700; color: #3DB5A0; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background: #E0F7F3; color: #1E8C78; font-weight: 800; padding: 10px 12px; text-align: left; }
        td { padding: 10px 12px; border-bottom: 1px solid rgba(30,16,7,0.06); }
        tr:last-child td { border-bottom: none; }
        .badges-wrap { line-height: 2; }
        .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #eee; font-size: 10px; color: #B8906A; display: flex; justify-content: space-between; }
      </style>
    </head>
    <body>
      <div class="header">
        <span class="logo">✨</span>
        <h1>Bright<em>Steps</em> — Routine Progress Report</h1>
      </div>
      <p class="subtitle">
        Child: <strong>${childName}</strong> &nbsp;|&nbsp; Generated: ${today}
      </p>

      <h2>📊 Summary Overview</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${summary.totalAssigned || 0}</div>
          <div class="stat-label">Total Assigned</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${summary.completedCount || 0}</div>
          <div class="stat-label">Completed</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${summary.completionPercentage || 0}%</div>
          <div class="stat-label">Completion Rate</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">⭐ ${summary.totalStars || 0}</div>
          <div class="stat-label">Stars Earned</div>
        </div>
      </div>

      <h2>📈 Overall Completion</h2>
      <div class="progress-bar-wrap">
        <div class="progress-bar-fill" style="width: ${summary.completionPercentage || 0}%"></div>
      </div>
      <span class="pct-label">${summary.completionPercentage || 0}% of all assigned routines completed</span>

      ${categoryRows ? `
        <h2>📋 Category Breakdown</h2>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Assigned</th>
              <th>Completed</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>${categoryRows}</tbody>
        </table>
      ` : ""}

      <h2>🏅 Badges Earned</h2>
      <div class="badges-wrap">${badgeHTML}</div>

      <div class="footer">
        <span>BrightSteps Educational Platform — Confidential Parent Report</span>
        <span>Printed: ${today}</span>
      </div>
    </body>
    </html>
  `;

  _printHTML(html, `BrightSteps — Routine Progress Report`);
}

/* ─────────────────────────────────────────────────────
   Internal helper — hidden iframe print trigger
───────────────────────────────────────────────────── */
function _printHTML(html, title) {
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  // Give browser time to render before printing
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    // Clean up after print dialog closes
    setTimeout(() => document.body.removeChild(iframe), 1500);
  }, 400);
}
