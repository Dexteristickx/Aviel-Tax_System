const PDFDocument = require('pdfkit');
const path = require('path');

// Logo path — bundled alongside this file
const logoPath = path.join(__dirname, 'logo.png');

// ─── Helper: Draw Page Header (Logo + Company Name) on every page ──────────
function addPageHeader(doc) {
  // Gold accent bar
  doc.rect(0, 0, 6, doc.page.height).fill('#ff6b00');

  // Logo
  try {
    doc.image(logoPath, 50, 18, { width: 22 });
  } catch (err) {
    // Fallback: draw a gold square placeholder if logo file is missing
    doc.rect(50, 18, 22, 22).fill('#ff6b00');
  }

  // Company name — full formatted
  doc
    .fill('#ff6b00')
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('AVIEL ALPHA', 80, 22, { characterSpacing: 2, continued: false });

  doc
    .fill('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('SECRETARIES', 80, 33, { characterSpacing: 2 });

  // Thin divider below header
  doc.moveTo(50, 50).lineTo(doc.page.width - 50, 50).strokeColor('#2e2e2e').lineWidth(0.5).stroke();
}

// ─── Helper: Draw Page Footer on every page ────────────────────────────────
function addPageFooter(doc) {
  const y = doc.page.height - 35;
  doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor('#2e2e2e').lineWidth(0.5).stroke();
  doc
    .fill('#444444')
    .font('Helvetica')
    .fontSize(7)
    .text('Aviel Alpha Secretaries Ltd  ·  Confidential  ·  This report does not constitute legal or tax advice.', 50, y + 6, { width: doc.page.width - 100, align: 'center' });
}

// ─── Helper: Add Cover Page ────────────────────────────────────────────────
function addCoverPage(doc, submission) {
  const { name, email, date } = submission.meta || {};
  const clientName = name || submission.name || 'Client';
  const clientEmail = email || submission.email;
  const score = submission.overallScore ?? submission.score ?? 'N/A';

  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#111111');

  // Gold accent bar
  doc.rect(0, 0, 6, doc.page.height).fill('#ff6b00');

  // Logo (larger on cover page)
  try {
    doc.image(logoPath, 50, 45, { width: 36 });
  } catch (err) {
    doc.rect(50, 45, 36, 36).fill('#ff6b00');
  }

  // Company name — full formatted, beside logo
  doc
    .fill('#ff6b00')
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('AVIEL ALPHA', 96, 50, { characterSpacing: 3 });

  doc
    .fill('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('SECRETARIES', 96, 65, { characterSpacing: 3 });

  doc
    .fill('#888888')
    .font('Helvetica')
    .fontSize(7)
    .text('Integrated Tax Service System', 96, 80, { characterSpacing: 1 });

  // Main title
  doc
    .fill('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(28)
    .text('Tax Analysis Report', 50, 110);

  // Divider
  doc.moveTo(50, 148).lineTo(doc.page.width - 50, 148).strokeColor('#ff6b00').lineWidth(1).stroke();

  // Client info block
  const infoY = 170;
  doc.fill('#888888').font('Helvetica').fontSize(9).text('PREPARED FOR', 50, infoY, { characterSpacing: 2 });
  doc.fill('#ffffff').font('Helvetica-Bold').fontSize(14).text(clientName, 50, infoY + 16);

  if (clientEmail) {
    doc.fill('#888888').font('Helvetica').fontSize(9).text(clientEmail, 50, infoY + 34);
  }

  const dateVal = date || submission.timestamp;
  let dateStr;
  try {
    dateStr = dateVal
      ? new Date(dateVal).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  doc.fill('#888888').font('Helvetica').fontSize(9).text(dateStr, 50, infoY + 52);

  // Score badge
  const numericScore = Number(score) || 0;
  const scoreColor = numericScore >= 70 ? '#27ae60' : numericScore >= 40 ? '#f39c12' : '#e74c3c';
  const scoreLabel = numericScore >= 70 ? 'STRONG' : numericScore >= 40 ? 'MODERATE' : 'NEEDS ATTENTION';
  const badgeX = doc.page.width - 160;

  doc.roundedRect(badgeX, infoY - 10, 110, 90, 8).fill('#1e1e1e');
  doc.fill(scoreColor).font('Helvetica-Bold').fontSize(32).text(`${score}`, badgeX, infoY + 12, { width: 110, align: 'center' });
  doc.fill('#888888').font('Helvetica').fontSize(8).text('OVERALL SCORE', badgeX, infoY + 52, { width: 110, align: 'center', characterSpacing: 2 });
  doc.fill(scoreColor).font('Helvetica-Bold').fontSize(8).text(scoreLabel, badgeX, infoY + 64, { width: 110, align: 'center', characterSpacing: 1 });

  // Footer
  addPageFooter(doc);
}

// ─── Helper: Add Section ──────────────────────────────────────────────────
function addSection(doc, title, items) {
  doc.addPage();
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#111111');
  addPageHeader(doc);

  // Section title
  doc.fill('#ff6b00').font('Helvetica-Bold').fontSize(8).text('SECTION', 50, 62, { characterSpacing: 3 });
  doc.fill('#ffffff').font('Helvetica-Bold').fontSize(18).text(title, 50, 76);
  doc.moveTo(50, 102).lineTo(doc.page.width - 50, 102).strokeColor('#2e2e2e').lineWidth(1).stroke();

  let y = 118;
  const lineH = 22;
  const colW = (doc.page.width - 100) / 2;

  items.forEach(({ label, value, highlight }, i) => {
    if (y > doc.page.height - 80) {
      addPageFooter(doc);
      doc.addPage();
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#111111');
      addPageHeader(doc);
      y = 65;
    }

    const isEven = i % 2 === 0;
    if (isEven) {
      doc.rect(50, y - 4, doc.page.width - 100, lineH).fill('#1a1a1a');
    }

    doc.fill('#888888').font('Helvetica').fontSize(9).text(label, 60, y);
    const valueColor = highlight === 'good' ? '#27ae60' : highlight === 'warn' ? '#f39c12' : highlight === 'bad' ? '#e74c3c' : '#ffffff';
    doc.fill(valueColor).font('Helvetica-Bold').fontSize(9).text(String(value ?? '—'), 60 + colW, y, { width: colW - 20, align: 'right' });

    y += lineH;
  });

  addPageFooter(doc);
}

// ─── Helper: Add Recommendations Page ─────────────────────────────────────
function addRecommendations(doc, recommendations) {
  if (!recommendations || recommendations.length === 0) return;

  doc.addPage();
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#111111');
  addPageHeader(doc);

  doc.fill('#ff6b00').font('Helvetica-Bold').fontSize(8).text('ANALYSIS', 50, 62, { characterSpacing: 3 });
  doc.fill('#ffffff').font('Helvetica-Bold').fontSize(18).text('Recommendations', 50, 76);
  doc.moveTo(50, 102).lineTo(doc.page.width - 50, 102).strokeColor('#2e2e2e').lineWidth(1).stroke();

  let y = 118;

  recommendations.forEach((rec, i) => {
    if (y > doc.page.height - 120) {
      addPageFooter(doc);
      doc.addPage();
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#111111');
      addPageHeader(doc);
      y = 65;
    }

    const priorityColor = rec.priority === 'HIGH' ? '#e74c3c' : rec.priority === 'MEDIUM' ? '#f39c12' : '#27ae60';

    doc.rect(50, y, doc.page.width - 100, 60).fill('#1e1e1e');
    doc.rect(50, y, 3, 60).fill(priorityColor);

    doc.fill(priorityColor).font('Helvetica-Bold').fontSize(7).text(rec.priority || 'INFO', 62, y + 8, { characterSpacing: 2 });
    doc.fill('#ffffff').font('Helvetica-Bold').fontSize(11).text(rec.title || `Recommendation ${i + 1}`, 62, y + 20);
    doc.fill('#888888').font('Helvetica').fontSize(9).text(rec.description || '', 62, y + 34, { width: doc.page.width - 130 });

    y += 74;
  });

  addPageFooter(doc);
}

// ─── Helper: Build recommendations from submission ─────────────────────────
function buildRecommendations(submission) {
  const recs = [];
  const data = submission || {};

  if (data.cac === 'No' || data.cac === 'no') {
    recs.push({ priority: 'HIGH', title: 'CAC Corporate Registration', description: 'Your business is not registered with CAC. Register immediately to legally operate and open corporate tax files.' });
  }
  if (data.tin === 'No' || data.tin === 'no') {
    recs.push({ priority: 'HIGH', title: 'TIN Registration', description: 'A Tax Identification Number is mandatory for all taxpayers in Nigeria. Register with FIRS/State IRS immediately.' });
  }
  if (data.returns === 'Never' || data.filed === 'Never') {
    recs.push({ priority: 'HIGH', title: 'Back-File Outstanding Returns', description: 'Failure to file taxes carries heavy penalties. Start compiling historical books to file outstanding returns.' });
  }
  if (data.tcc === 'Never' || data.tcc === 'Expired') {
    recs.push({ priority: 'MEDIUM', title: 'Process/Renew Tax Clearance', description: 'A Tax Clearance Certificate (TCC) is required for corporate actions, contracts, and bidding. Renew your TCC.' });
  }
  if (data.audit === 'Yes' || data.query === 'Yes') {
    recs.push({ priority: 'HIGH', title: 'Audit Representation', description: 'You have active audit/queries. Respond professionally to avoid severe back-duty assessments and penalties.' });
  }

  if (recs.length === 0) {
    recs.push({ priority: 'LOW', title: 'Maintain Good Practices', description: 'Continue timely filing of returns and keep financial records well-organized.' });
  }
  return recs;
}

// ─── Core PDF Buffer Generator ─────────────────────────────────────────────
function generatePdfBuffer(submission) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
        info: {
          Title: 'Tax Analysis Report',
          Author: 'Aviel Alpha Secretaries Ltd',
          Subject: `Tax Report for ${submission.name || 'Client'}`
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', err => reject(err));

      // 1. Cover Page
      addCoverPage(doc, submission);

      // 2. Personal/General Info Section
      if (submission.type === 'Business') {
        addSection(doc, 'Business Information', [
          { label: 'Business/Contact Name', value: submission.name },
          { label: 'Business Name', value: submission.bizName },
          { label: 'Email Address', value: submission.email },
          { label: 'Phone Number', value: submission.phone },
          { label: 'Industry Sector', value: submission.industry },
          { label: 'Years Active', value: submission.years },
          { label: 'Employee Count', value: submission.employees },
        ]);

        addSection(doc, 'Financial & Compliance Overview', [
          { label: 'CAC Registered', value: submission.cac, highlight: submission.cac === 'No' ? 'bad' : 'good' },
          { label: 'Annual Revenue Range', value: submission.revenue },
          { label: 'Financial Records Tracking', value: submission.track, highlight: submission.track === 'Poor' ? 'bad' : submission.track === 'Fair' ? 'warn' : 'good' },
          { label: 'Retained Tax Consultant', value: submission.consult, highlight: submission.consult === 'No' ? 'warn' : 'good' },
          { label: 'Tax Returns Filing Frequency', value: submission.returns, highlight: submission.returns === 'Never' ? 'bad' : submission.returns === 'Sometimes' ? 'warn' : 'good' },
          { label: 'Active Tax Audit / Query', value: submission.audit, highlight: submission.audit === 'Yes' ? 'bad' : 'good' },
        ]);
      } else {
        addSection(doc, 'Personal Information', [
          { label: 'Taxpayer Name', value: submission.name },
          { label: 'Email Address', value: submission.email },
          { label: 'Phone Number', value: submission.phone },
          { label: 'Employment Status', value: submission.employ },
          { label: 'Current Employer', value: submission.employer },
          { label: 'Occupation/Role', value: submission.occupation },
          { label: 'State of Residence', value: submission.state },
        ]);

        addSection(doc, 'Income & Filing Status', [
          { label: 'Has TIN (Tax ID)', value: submission.tin, highlight: submission.tin === 'No' ? 'bad' : 'good' },
          { label: 'Annual Income Range', value: submission.income },
          { label: 'PAYE Deducted by Employer', value: submission.paye, highlight: submission.paye === 'No' ? 'warn' : 'good' },
          { label: 'Filed PIT Returns Before', value: submission.filed, highlight: submission.filed === 'Never' ? 'bad' : 'good' },
          { label: 'Tax Clearance Certificate (TCC)', value: submission.tcc, highlight: submission.tcc === 'Never' ? 'bad' : submission.tcc === 'Expired' ? 'warn' : 'good' },
          { label: 'Active Tax Authority Queries', value: submission.query, highlight: submission.query === 'Yes' ? 'bad' : 'good' },
        ]);
      }

      // 3. Detailed recommendations
      const recommendations = buildRecommendations(submission);
      addRecommendations(doc, recommendations);

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = {
  generatePdfBuffer,
  buildRecommendations
};
