require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('node:path');
const fs = require('node:fs');
const db = require('./db');

const INDEX_PATH = path.join(__dirname, '..', 'index.html');

const app = express();
app.disable('x-powered-by');
app.use(express.json());

app.use(session({
  name: 'muzei.sid',
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 3600 * 1000,
  },
}));

function requireAdmin(req, res, next) {
  if (!req.session.isAdmin) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// Само за тестове (NODE_ENV=test) — връща DB-то към default seed state,
// за да са тестовете независими от изпълнението на предишни тестове.
if (process.env.NODE_ENV === 'test') {
  app.post('/api/test/reset', (req, res) => {
    db.seedDefaults();
    req.session.destroy(() => res.json({ ok: true }));
  });
}

// ── Прост in-memory rate limiter за публичния AI чат (пази реалния API
//    ключ от прекомерна консумация от анонимни визитьори). ──
const chatHits = new Map(); // ip -> timestamps[]
const CHAT_LIMIT = 20;
const CHAT_WINDOW_MS = 60 * 60 * 1000;
function rateLimitChat(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const hits = (chatHits.get(ip) || []).filter(t => now - t < CHAT_WINDOW_MS);
  if (hits.length >= CHAT_LIMIT) {
    return res.status(429).json({ error: 'Твърде много съобщения. Опитай по-късно.' });
  }
  hits.push(now);
  chatHits.set(ip, hits);
  next();
}

// ── AUTH ──
app.post('/api/login', (req, res) => {
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'Въведете парола.' });
  const row = db.prepare('SELECT password_hash FROM admin WHERE id = 1').get();
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'Грешна парола.' });
  }
  req.session.isAdmin = true;
  res.json({ ok: true });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/session', (req, res) => {
  res.json({ isAdmin: !!req.session.isAdmin });
});

app.post('/api/change-password', requireAdmin, (req, res) => {
  const { oldPassword, newPassword, confirm } = req.body || {};
  if (!oldPassword || !newPassword || !confirm) {
    return res.status(400).json({ error: 'Попълнете всички полета.' });
  }
  if (newPassword !== confirm) return res.status(400).json({ error: 'Новата парола не съвпада.' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Паролата трябва да е поне 6 символа.' });
  const row = db.prepare('SELECT password_hash FROM admin WHERE id = 1').get();
  if (!bcrypt.compareSync(oldPassword, row.password_hash)) {
    return res.status(401).json({ error: 'Грешна текуща парола.' });
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE admin SET password_hash = ? WHERE id = 1').run(hash);
  res.json({ ok: true });
});

// ── SETTINGS (напр. "template" — публично четим, само admin пише) ──
app.get('/api/settings/:key', (req, res) => {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(req.params.key);
  res.json({ value: row ? JSON.parse(row.value) : null });
});

app.put('/api/settings/:key', requireAdmin, (req, res) => {
  db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).run(req.params.key, JSON.stringify(req.body?.value ?? null));
  res.json({ ok: true });
});

// ── AI PROXY — ключът живее само тук (process.env), клиентът никога не го вижда ──
app.get('/api/ai/status', (_req, res) => {
  res.json({ configured: !!process.env.ANTHROPIC_API_KEY });
});

async function proxyAnthropic(res, { system, messages, maxTokens }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: 'AI не е конфигуриран на сървъра.' });
  // NODE_ENV=test — не викаме реалния Anthropic API (бавно, недетерминистично,
  // изисква реален ключ); връщаме canned отговор, огледален на реалния формат.
  if (process.env.NODE_ENV === 'test') {
    return res.json({ content: [{ text: '[TEST MODE] Ave, пътнико от бъдещето!' }] });
  }
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens || 300,
        system,
        messages,
      }),
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(502).json({ error: 'Anthropic API недостъпен.' });
  }
}

app.post('/api/ai/chat', rateLimitChat, (req, res) => {
  const { system, messages } = req.body || {};
  proxyAnthropic(res, { system, messages: (messages || []).slice(-10), maxTokens: 300 });
});

app.post('/api/ai/generate', requireAdmin, (req, res) => {
  const { system, prompt } = req.body || {};
  proxyAnthropic(res, { system, messages: [{ role: 'user', content: prompt }], maxTokens: 600 });
});

// ── Статичен index.html (self-contained, без build стъпка) ──
// Инжектираме [data-template] server-side (SSR), за да няма "проблясване"
// на грешен темплейт при първо зареждане — избягваме async fetch преди paint.
app.get('/', (_req, res) => {
  fs.readFile(INDEX_PATH, 'utf8', (err, html) => {
    if (err) return res.status(500).send('Failed to read index.html');
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('template');
    const template = row ? JSON.parse(row.value) : null;
    const out = template
      ? html.replace('<html', `<html data-template="${template}"`)
      : html;
    res.type('html').send(out);
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`muzei-lom server listening on http://localhost:${PORT}`);
});
