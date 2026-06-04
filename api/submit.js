// api/submit.js — Vercel Serverless Function
// Forwards intake form submissions to a Google Sheets webhook

const ALLOWED_ORIGINS = [
  'https://aasecretaries.com.ng',
  'https://www.aasecretaries.com.ng',
  'http://localhost:3000',
  'http://localhost:5173'
];

// In-memory rate limiter (per-IP, resets on cold start)
const rateLimit = new Map();
const RATE_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_MAX = 10;              // 10 submissions per IP per minute

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

module.exports = async function handler(req, res) {
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

  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK;
  if (!webhookUrl) {
    return res.status(500).json({ error: 'Sheet webhook not configured' });
  }

  try {
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    if (!webhookResponse.ok) {
      const errText = await webhookResponse.text().catch(() => '');
      console.error('Webhook error:', webhookResponse.status, errText);
      return res.status(502).json({
        error: 'Failed to save to sheet',
        detail: `Webhook returned ${webhookResponse.status}`
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Submit handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}
