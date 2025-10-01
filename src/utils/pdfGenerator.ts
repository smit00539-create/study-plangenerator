import { GeneratedSchedule, StudyPlan } from "@/types/studyPlan";

export async function generatePDF(schedule: GeneratedSchedule, plan: StudyPlan): Promise<void> {
  // Create a new window for PDF generation
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Unable to open print window. Please allow popups for this site.');
  }

  const htmlContent = generatePDFHTML(schedule, plan);
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Wait for content to load then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
}

function generatePDFHTML(schedule: GeneratedSchedule, plan: StudyPlan): string {
  const title = plan.exam_name || 'Study Plan';
  const startDate = plan.start_date ? new Date(plan.start_date).toLocaleDateString() : 'Not specified';
  const endDate = plan.start_date ? 
    new Date(new Date(plan.start_date).getTime() + (plan.duration_days - 1) * 24 * 60 * 60 * 1000).toLocaleDateString() :
    'Not specified';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title} - Study Plan</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background: white;
        }
        
        .page {
          padding: 20mm;
          max-width: 210mm;
          margin: 0 auto;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #3b82f6;
        }
        
        .header h1 {
          font-size: 28px;
          color: #1e40af;
          margin-bottom: 10px;
        }
        
        .header p {
          font-size: 14px;
          color: #666;
          margin: 5px 0;
        }
        
        .summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .summary-card {
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
        }
        
        .summary-card h3 {
          font-size: 14px;
          color: #666;
          margin-bottom: 5px;
        }
        
        .summary-card .value {
          font-size: 24px;
          font-weight: bold;
          color: #1e40af;
        }
        
        .subjects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          margin-bottom: 30px;
        }
        
        .subject-item {
          background: #f1f5f9;
          padding: 10px;
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
        }
        
        .schedule-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        
        .schedule-table th,
        .schedule-table td {
          border: 1px solid #d1d5db;
          padding: 8px;
          text-align: left;
          font-size: 12px;
        }
        
        .schedule-table th {
          background: #3b82f6;
          color: white;
          font-weight: 600;
        }
        
        .schedule-table tr:nth-child(even) {
          background: #f8fafc;
        }
        
        .schedule-table tr.buffer-day {
          background: #fef3c7;
          opacity: 0.7;
        }
        
        .lecture-item {
          margin: 2px 0;
          font-size: 11px;
        }
        
        .chapter-name {
          font-weight: 600;
        }
        
        .lecture-count {
          color: #666;
        }
        
        .subjects-badge {
          display: inline-block;
          background: #dbeafe;
          color: #1e40af;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          margin: 1px;
        }
        
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #d1d5db;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
        
        @media print {
          .page {
            padding: 15mm;
          }
          
          .schedule-table {
            page-break-inside: avoid;
          }
          
          .schedule-table thead {
            display: table-header-group;
          }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <!-- Header -->
        <div class="header">
          <h1>${title}</h1>
          <p><strong>Duration:</strong> ${plan.duration_days} days (${startDate} - ${endDate})</p>
          <p><strong>Total Lectures:</strong> ${schedule.summary.total_lectures} | <strong>Max per Day:</strong> ${plan.max_lectures_per_day}</p>
        </div>
        
        <!-- Summary -->
        <div class="summary">
          <div class="summary-card">
            <h3>Total Lectures</h3>
            <div class="value">${schedule.summary.total_lectures}</div>
          </div>
          <div class="summary-card">
            <h3>Completion Day</h3>
            <div class="value">${schedule.summary.completion_day}</div>
          </div>
          <div class="summary-card">
            <h3>Buffer Days</h3>
            <div class="value">${schedule.summary.buffer_days}</div>
          </div>
          <div class="summary-card">
            <h3>Avg. Daily Load</h3>
            <div class="value">${(schedule.summary.total_lectures / schedule.summary.completion_day).toFixed(1)}</div>
          </div>
        </div>
        
        <!-- Subject Distribution -->
        <h2 style="margin-bottom: 15px; color: #1e40af;">Subject Distribution</h2>
        <div class="subjects-grid">
          ${Object.entries(schedule.summary.lectures_per_subject).map(([subject, lectures]) => `
            <div class="subject-item">
              <span><strong>${subject}</strong></span>
              <span>${lectures} lectures</span>
            </div>
          `).join('')}
        </div>
        
        <!-- Daily Schedule -->
        <h2 style="margin-bottom: 15px; color: #1e40af;">Daily Schedule</h2>
        <table class="schedule-table">
          <thead>
            <tr>
              <th style="width: 6%;">Day</th>
              <th style="width: 10%;">Date</th>
              <th style="width: 15%;">Subjects</th>
              <th style="width: 25%;">Lectures</th>
              <th style="width: 15%;">Revisions</th>
              <th style="width: 15%;">Custom</th>
              <th style="width: 14%;">Notes</th>
            </tr>
          </thead>
          <tbody>
            ${schedule.days.map(day => `
              <tr ${day.lectures.length === 0 ? 'class="buffer-day"' : ''}>
                <td><strong>Day ${day.day}</strong></td>
                <td>${day.date || '—'}</td>
                <td>
                  ${day.subjects.map(subject => `<span class="subjects-badge">${subject}</span>`).join('')}
                </td>
                <td>
                  ${day.lectures.map(lecture => `
                    <div class="lecture-item">
                      <span class="chapter-name">${lecture.chapter}</span>
                      <span class="lecture-count">(${lecture.count})</span>
                    </div>
                  `).join('')}
                  ${day.lectures.length === 0 ? '<em style="color: #666;">No lectures scheduled</em>' : ''}
                </td>
                <td style="color: #e11d48; font-size: 11px;">
                  ${day.revisions.map(revision => `
                    <div>${revision.revision}</div>
                  `).join('')}
                  ${day.revisions.length === 0 ? '—' : ''}
                </td>
                <td style="color: #f59e0b; font-size: 11px;">
                  ${day.customFactors.map(factor => `
                    <div><strong>${factor.factorType}:</strong> ${factor.factorName} - ${factor.value}</div>
                  `).join('')}
                  ${day.customFactors.length === 0 ? '—' : ''}
                </td>
                <td style="font-style: italic; color: #666;">${day.practice_note || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <!-- Footer -->
        <div class="footer">
          <p><strong>Generated by StudyPlan Generator</strong></p>
          <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <p><em>Legend: Numbers in parentheses indicate lecture count for each chapter</em></p>
        </div>
      </div>
    </body>
    </html>
  `;
}