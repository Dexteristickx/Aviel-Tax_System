// api/email.js — Vercel Serverless Function
// Sends Tax Health Reports via Resend

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// ═══════════════ CONFIG ═══════════════
const FROM_EMAIL = process.env.FROM_EMAIL || 'Aviel Alpha <onboarding@resend.dev>';
const BCC_ADMIN = process.env.ADMIN_EMAIL || 'sprqsm001@gmail.com';
const ALLOWED_ORIGINS = [
  'https://yourdomain.com',
  'https://www.yourdomain.com',
  'http://localhost:3000',
  'http://localhost:5173'
];

// Simple in-memory rate limiter (per-IP, resets on cold start)
const rateLimit = new Map();
const RATE_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_MAX = 5;               // 5 emails per IP per minute

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimit.get(ip) || { count: 0, start: now };
  if (now - entry.start > RATE_WINDOW_MS) {
    rateLimit.set(ip, { count: 1, start: now });
    return false;
  }
  entry.count += 1;
  rateLimit.set(ip, entry);
  return entry.count > RATE_MAX;
}

// ═══════════════ HANDLER ═══════════════
export default async function handler(req, res) {
  // CORS
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limit
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
  }

  try {
    const { to, subject, message, reportText, clientName, score, risk } = req.body || {};

    // ── Validation ──
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return res.status(400).json({ error: 'Valid recipient email required' });
    }
    if (!subject || subject.length > 200) {
      return res.status(400).json({ error: 'Subject required (max 200 chars)' });
    }
    if (!reportText) {
      return res.status(400).json({ error: 'Report text required' });
    }
    if (reportText.length > 20000) {
      return res.status(400).json({ error: 'Report too large' });
    }

    // ── Build HTML email ──
    const html = buildEmailHTML({
      clientName: clientName || 'Valued Client',
      message: message || '',
      reportText,
      score: Number(score) || 0,
      risk: risk || 'Moderate'
    });

    const text = buildPlainText({
      clientName: clientName || 'Valued Client',
      message: message || '',
      reportText,
      score: Number(score) || 0,
      risk: risk || 'Moderate'
    });

    // ── Send via Resend ──
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      bcc: BCC_ADMIN ? [BCC_ADMIN] : undefined,
      subject: subject.slice(0, 200),
      html,
      text,
      reply_to: BCC_ADMIN
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Email provider error', detail: error.message });
    }

    return res.status(200).json({ success: true, id: data?.id });

  } catch (err) {
    console.error('Email handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ═══════════════ EMAIL TEMPLATE ═══════════════
function buildEmailHTML({ clientName, message, reportText, score, risk }) {
  const riskColor = risk === 'Critical' ? '#c0392b'
                  : risk === 'High'     ? '#d68910'
                  : risk === 'Moderate' ? '#1e8449'
                  :                       '#166534';

  // Convert report text (numbered sections) into styled HTML
  const reportHTML = reportText
    .split(/\n(?=\d+\.\s)/)
    .filter(s => s.trim())
    .map(section => {
      const match = section.match(/^(\d+)\.\s*([^\n]+)\n?([\s\S]*)/);
      if (match) {
        const [, num, title, body] = match;
        return `
          <div style="margin-bottom:24px;">
            <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#ff6b00;border-bottom:1px solid #e5e5e5;padding-bottom:6px;margin-bottom:10px;">
              ${num}. ${escapeHTML(title)}
            </div>
            <div style="font-size:14px;line-height:1.7;color:#333;">
              ${escapeHTML(body.trim()).replace(/\n/g, '<br>')}
            </div>
          </div>`;
      }
      return `<div style="font-size:14px;line-height:1.7;color:#333;margin-bottom:14px;">${escapeHTML(section).replace(/\n/g, '<br>')}</div>`;
    })
    .join('');

  const personalNote = message ? `
    <div style="background:#fff8f0;border-left:4px solid #ff6b00;padding:14px 18px;margin-bottom:24px;font-size:14px;line-height:1.6;color:#444;white-space:pre-wrap;">
      ${escapeHTML(message)}
    </div>` : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tax Health Report</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:20px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:#1a1a1a;padding:24px 32px;border-bottom:3px solid #ff6b00;">
          <div style="font-size:18px;font-weight:700;color:#fff;letter-spacing:0.5px;">
            Aviel Alpha <span style="color:#ff6b00;">Secretaries</span>
          </div>
          <div style="font-family:'Courier New',monospace;font-size:10px;color:#888;letter-spacing:2px;text-transform:uppercase;margin-top:4px;">
            Integrated Tax Service System
          </div>
        </td></tr>

        <!-- Title -->
        <tr><td style="padding:32px 32px 0;">
          <div style="font-size:22px;font-weight:700;color:#1a1a1a;margin-bottom:6px;">
            Your Tax Health Report
          </div>
          <div style="font-size:13px;color:#888;margin-bottom:24px;">
            Prepared for ${escapeHTML(clientName)}
          </div>
        </td></tr>

        <!-- Personal note -->
        ${personalNote ? `<tr><td style="padding:0 32px;">${personalNote}</td></tr>` : ''}

        <!-- Risk gauge -->
        <tr><td style="padding:0 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border:1px solid #e5e5e5;">
            <tr>
              <td style="padding:20px;width:120px;text-align:center;">
                <div style="font-family:Georgia,serif;font-size:42px;font-weight:900;color:${riskColor};line-height:1;">
                  ${score}
                </div>
                <div style="font-size:10px;color:#888;letter-spacing:1px;margin-top:4px;">/ 100</div>
              </td>
              <td style="padding:20px;border-left:1px solid #e5e5e5;">
                <div style="font-family:'Courier New',monospace;font-size:13px;font-weight:700;color:${riskColor};text-transform:uppercase;letter-spacing:1px;">
                  ${escapeHTML(risk)} Risk
                </div>
                <div style="font-size:12px;color:#666;margin-top:6px;line-height:1.5;">
                  Your tax compliance risk score based on the information you provided.
                </div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Report body -->
        <tr><td style="padding:0 32px 24px;">
          ${reportHTML}
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:0 32px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#ff6b00;">
            <tr><td style="padding:20px 24px;">
              <div style="color:#fff;font-size:15px;font-weight:600;margin-bottom:6px;">
                Need help acting on this report?
              </div>
              <div style="color:#fff;font-size:13px;opacity:0.9;line-height:1.5;">
                Reply to this email or contact us at
                <a href="mailto:${BCC_ADMIN}" style="color:#fff;text-decoration:underline;">${BCC_ADMIN}</a>
                to discuss next steps with our team.
              </div>
            </td></tr>
          </table>
        </td></tr>

        <!-- Disclaimer -->
        <tr><td style="padding:20px 32px;background:#fafafa;border-top:1px solid #e5e5e5;">
          <div style="font-size:11px;color:#888;line-height:1.6;">
            <strong>Disclaimer:</strong> This report is based on information provided by you and does not constitute legal or tax advice. Errors or omissions may affect accuracy. Aviel Alpha Secretaries Ltd is not liable for decisions taken solely on this report.
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px;background:#1a1a1a;text-align:center;">
          <div style="font-size:11px;color:#888;line-height:1.6;">
            © ${new Date().getFullYear()} Aviel Alpha Secretaries Ltd · All rights reserved<br>
            Data handled per Nigeria Data Protection Act (NDPA) 2023
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildPlainText({ clientName, message, reportText, score, risk }) {
  return `AVIEL ALPHA SECRETARIES — TAX HEALTH REPORT
Prepared for: ${clientName}
Risk Score: ${score}/100 (${risk} Risk)

${message ? message + '\n\n' + '─'.repeat(50) + '\n\n' : ''}${reportText}

─────────────────────────────────────────
Need help? Reply to this email or contact ${BCC_ADMIN}

Disclaimer: This report is based on information you provided and does not constitute legal or tax advice.

© ${new Date().getFullYear()} Aviel Alpha Secretaries Ltd
Data handled per Nigeria Data Protection Act (NDPA) 2023`;
}

function escapeHTML(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
