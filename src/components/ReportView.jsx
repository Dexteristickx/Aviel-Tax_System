import React, { useState } from 'react';

export default function ReportView({ submission, onClose }) {
  if (!submission) return null;

  const [copied, setCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const downloadPdf = async () => {
    setPdfLoading(true);
    try {
      const res = await fetch('/api/download-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tax-report-${(submission.name || 'client').toLowerCase().replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Could not generate PDF. Please try again or use Print.');
      console.error('[PDF download]', err);
    } finally {
      setPdfLoading(false);
    }
  };

  const copyReport = () => {
    navigator.clipboard.writeText(submission.reportText || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRiskClass = (risk) => {
    switch (risk) {
      case 'Critical': return 'critical';
      case 'High': return 'high';
      case 'Moderate': return 'moderate';
      default: return 'low';
    }
  };

  // Split report sections if they follow "1. Section Name" pattern
  const renderSections = () => {
    const reportText = submission.reportText || '';
    const parts = reportText.split(/\n(?=\d+\.\s)/).filter(Boolean);

    if (parts.length <= 1) {
      return <div className="report-body" style={{ whiteSpace: 'pre-wrap' }}>{reportText}</div>;
    }

    return parts.map((section, idx) => {
      const match = section.match(/^(\d+)\.\s*([^\n]+)\n?([\s\S]*)/);
      if (match) {
        const [, num, title, body] = match;
        return (
          <div key={idx} className="report-section">
            <div className="report-section-title">{num}. {title}</div>
            <div className="report-body" style={{ whiteSpace: 'pre-wrap' }}>{body.trim()}</div>
          </div>
        );
      }
      return <div key={idx} className="report-body" style={{ whiteSpace: 'pre-wrap', marginBottom: '14px' }}>{section}</div>;
    });
  };

  return (
    <div id="view-reports" className="view active" style={{ display: 'block' }}>
      <div className="view-title">Tax Advisory Report</div>
      <div className="view-sub">Generated advisory report based on compliance intake analysis.</div>

      <div className="report-output" style={{ display: 'block' }}>
        {/* Report Header block */}
        <div className="report-header-block">
          <div className="report-co">AVIEL ALPHA SECRETARIES LTD</div>
          <div className="report-title-big">TAX HEALTH ADVISORY</div>
          <div className="report-meta-grid">
            <div><span>Prepared For:</span> {submission.name}</div>
            <div><span>Tax Profile:</span> {submission.type}</div>
            <div><span>Contact Email:</span> {submission.email}</div>
            <div><span>Report Date:</span> {submission.timestamp}</div>
            {submission.type === 'Business' && <div><span>Business Name:</span> {submission.bizName}</div>}
          </div>
        </div>

        {/* Risk Gauge */}
        <div className="risk-gauge">
          <div className={`gauge-score ${getRiskClass(submission.risk)}`}>
            {submission.score}
          </div>
          <div>
            <div className="gauge-label" style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              {submission.risk} Compliance Risk
            </div>
            <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>
              This risk rating is computed based on key compliance factors, registrations, and filing history.
            </div>
          </div>
        </div>

        {/* Report Sections */}
        {renderSections()}

        {/* Action Panel */}
        <div className="report-actions">
          <button className="btn-secondary" onClick={() => window.print()}>🖨 Print Report</button>
          <button className="btn-secondary" onClick={copyReport}>
            {copied ? '✓ Copied' : '📋 Copy Text'}
          </button>
          
          <button
            className="btn-secondary"
            onClick={downloadPdf}
            disabled={pdfLoading}
            style={{ opacity: pdfLoading ? 0.6 : 1, cursor: pdfLoading ? 'wait' : 'pointer' }}
          >
            {pdfLoading ? '⏳ Generating…' : '📥 Download PDF'}
          </button>

          <button className="btn-primary" style={{ marginTop: 0 }} onClick={onClose}>← Back to Dashboard</button>
        </div>

        <div style={{ marginTop: '28px', padding: '16px', background: '#141414', border: '1px solid #2e2e2e', fontSize: '.75rem', color: '#888', lineHeight: '1.6' }}>
          <strong>Disclaimer:</strong> This report is based on information provided by the client. It does not constitute legal or tax advice. Errors or omissions in information provided may affect the accuracy of this assessment. Aviel Alpha Secretaries Ltd is not liable for decisions taken solely on the basis of this report.
        </div>
      </div>
    </div>
  );
}
