import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates and downloads a formatted PDF for a single student progress report.
 * @param {Object} report - The progress report object from the database.
 * @param {string} title - The title rendered at the top of the PDF document.
 */
export const downloadSingleReportPDF = (report, title = 'BrightSteps — Progress Report') => {
  const doc = new jsPDF();
  
  doc.setFontSize(22); 
  doc.setTextColor(61, 181, 160);
  doc.text(title, 20, 22);
  
  autoTable(doc, {
    startY: 34,
    head: [['Field', 'Details']],
    body: [
      ['Student',  report.studentName || 'Unknown'],
      ['Date',     report.date ? new Date(report.date).toLocaleDateString() : '—'],
      ['Activity', report.activity || '—'],
      ['Mood',     report.mood || '—'],
      ['Notes',    report.notes || '—'],
    ],
    headStyles: { fillColor: [61, 181, 160] },
    alternateRowStyles: { fillColor: [240, 253, 250] },
  });
  
  doc.save(`${report.studentName}_Report.pdf`);
};
