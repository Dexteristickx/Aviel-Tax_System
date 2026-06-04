// api/report.js — Vercel Serverless Function
// Proxies report generation requests to the Poe API using OpenAI SDK

const { OpenAI } = require('openai');

const ALLOWED_ORIGINS = [
  'https://aasecretaries.com.ng',
  'https://www.aasecretaries.com.ng',
  'http://localhost:3000',
  'http://localhost:5173'
];

// In-memory rate limiter (per-IP, resets on cold start)
const rateLimit = new Map();
const RATE_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_MAX = 5;               // 5 requests per IP per minute

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

  const apiKey = process.env.POE_API_KEY || 'sk-poe-tvx1ZF2CyHlzGkasqh4ewf-Hvc1KOKe290XZhjapEdc';
  const baseURL = process.env.POE_BASE_URL || 'https://api.poe.com/v1';

  if (!apiKey) {
    return res.status(500).json({ error: 'Report service not configured: POE_API_KEY is missing' });
  }

  try {
    const openai = new OpenAI({
      apiKey,
      baseURL
    });

    const clientModel = req.body.model || 'claude-3-5-sonnet-20240620';
    
    // Map to Poe's model naming convention
    let poeModel = 'claude-sonnet-4';
    if (clientModel.toLowerCase().includes('sonnet')) {
      poeModel = 'claude-sonnet-4';
    } else if (clientModel.toLowerCase().includes('gpt-4o')) {
      poeModel = 'gpt-4o';
    } else if (clientModel.toLowerCase().includes('haiku')) {
      poeModel = 'claude-haiku-4.5';
    } else if (clientModel.toLowerCase().includes('opus')) {
      poeModel = 'claude-opus-4.7';
    } else {
      poeModel = clientModel;
    }

    // Call Poe API using the OpenAI SDK
    const completion = await openai.chat.completions.create({
      model: poeModel,
      messages: req.body.messages,
      max_tokens: req.body.max_tokens || 2000,
      temperature: req.body.temperature ?? 0.7
    });

    const textContent = completion.choices[0]?.message?.content || '';

    // Map OpenAI/Poe response format back to Anthropic message format for the client
    const responseData = {
      id: completion.id,
      type: 'message',
      role: 'assistant',
      model: poeModel,
      content: [
        {
          type: 'text',
          text: textContent
        }
      ],
      stop_reason: completion.choices[0]?.finish_reason || 'end_turn',
      stop_sequence: null,
      usage: {
        input_tokens: completion.usage?.prompt_tokens || 0,
        output_tokens: completion.usage?.completion_tokens || 0
      }
    };

    res.status(200).json(responseData);
  } catch (err) {
    console.error('Report handler error:', err);
    res.status(500).json({ error: err.message });
  }
}
