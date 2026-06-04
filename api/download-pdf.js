const { generatePdfBuffer } = require('./_lib/pdf-generator');

// ─── Rate Limiting (Map-based, per-process) ────────────────────────────────
const rateMap = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

function isRateLimited(ip) {
  const now = Date.now();
  const record = rateMap.get(ip) || { count: 0, start: now };
  if (now - record.start > WINDOW_MS) {
    rateMap.set(ip, { count: 1, start: now });
    return false;
  }
  if (record.count >= MAX_REQUESTS) return true;
  record.count++;
  rateMap.set(ip, record);
  return false;
}

// ─── CORS Headers ──────────────────────────────────────────────────────────
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

function corsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async function handler(req, res) {
  corsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
  }

  try {
    const submission = req.body;

    if (!submission || typeof submission !== 'object') {
      return res.status(400).json({ error: 'Invalid submission data' });
    }

    const clientName = submission.name || 'Client';
    const pdfBuffer = await generatePdfBuffer(submission);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="tax-report-${clientName.replace(/\s+/g, '-').toLowerCase()}.pdf"`);
    res.setHeader('Cache-Control', 'no-store');

    return res.send(pdfBuffer);
  } catch (err) {
    console.error('[download-pdf] Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF. Please try again.' });
    }
  }
};
