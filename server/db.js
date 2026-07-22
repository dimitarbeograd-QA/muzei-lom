const Database = require('better-sqlite3');
const path = require('node:path');
const bcrypt = require('bcryptjs');

// NODE_ENV=test → in-memory база, свежа при всяко стартиране на сървъра
// (playwright.config.js я използва за webServer-а, за да не изтича реален
// admin/settings state между тестови run-ове).
const db = new Database(
  process.env.NODE_ENV === 'test' ? ':memory:' : path.join(__dirname, 'data.db')
);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    password_hash TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('admin', 10);

function seedDefaults() {
  db.prepare('DELETE FROM admin').run();
  db.prepare('DELETE FROM settings').run();
  db.prepare('INSERT INTO admin (id, password_hash) VALUES (1, ?)').run(DEFAULT_PASSWORD_HASH);
}

// Seed default admin акаунт (парола "admin" — трябва да се смени веднага
// след първи вход, виж #adm-pwd секцията в admin панела).
const existing = db.prepare('SELECT id FROM admin WHERE id = 1').get();
if (!existing) seedDefaults();

module.exports = db;
module.exports.seedDefaults = seedDefaults;
