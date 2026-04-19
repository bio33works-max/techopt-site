// In-memory rate limiter: max 3 requests per IP per 60 seconds
const rateLimitMap = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 3;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }

  const timestamps = rateLimitMap.get(ip).filter(t => now - t < windowMs);
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);

  return timestamps.length > maxRequests;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { company, name, phone, comment, source, _hp } = req.body;

  // Honeypot check — silently return 200 if bot filled hidden field
  if (_hp && _hp.trim() !== '') {
    return res.status(200).json({ ok: true });
  }

  // Required fields validation
  if (!name || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Phone format validation
  const phoneRegex = /^[\+\d\s\-\(\)]{7,20}$/;
  if (!phoneRegex.test(phone.trim())) {
    return res.status(400).json({ error: 'Invalid phone number format' });
  }

  // Rate limiting
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket?.remoteAddress
    || 'unknown';

  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  // Save to Supabase
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          company: company || null,
          name,
          phone,
          comment: comment || null,
          source: source || null,
          ip
        })
      });
    } catch (err) {
      console.error('Supabase error:', err);
      // Non-fatal: continue to send Telegram message
    }
  }

  // Send Telegram message
  const text = [
    `🔔 <b>Новая заявка — TechOpt</b>`,
    ``,
    company ? `🏢 <b>Компания:</b> ${escapeHtml(company)}` : null,
    `👤 <b>Контакт:</b> ${escapeHtml(name)}`,
    `📞 <b>Телефон:</b> ${escapeHtml(phone)}`,
    comment ? `💬 <b>Комментарий:</b> ${escapeHtml(comment)}` : null,
    ``,
    `📍 <i>Источник: ${escapeHtml(source || 'неизвестно')}</i>`,
    `🌐 <i>IP: ${escapeHtml(ip)}</i>`,
  ].filter(Boolean).join('\n');

  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('Missing Telegram credentials');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const tgRes = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'HTML',
    }),
  });

  if (!tgRes.ok) {
    const err = await tgRes.json();
    console.error('Telegram error:', err);
    return res.status(500).json({ error: 'Telegram API error' });
  }

  return res.status(200).json({ ok: true });
}
