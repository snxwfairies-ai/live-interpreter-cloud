import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "../data/app.db");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS api_keys (
    provider    TEXT PRIMARY KEY,
    key_value   TEXT NOT NULL,
    updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
  );
  CREATE TABLE IF NOT EXISTS admin (
    id            INTEGER PRIMARY KEY DEFAULT 1,
    password_hash TEXT NOT NULL,
    email         TEXT,
    updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
  );
  CREATE TABLE IF NOT EXISTS users (
    id              TEXT PRIMARY KEY,
    email           TEXT UNIQUE,
    plan            TEXT NOT NULL DEFAULT 'free',
    plan_expires_at INTEGER,
    rc_user_id      TEXT,
    sessions_today  INTEGER NOT NULL DEFAULT 0,
    sessions_date   TEXT NOT NULL DEFAULT '',
    total_sessions  INTEGER NOT NULL DEFAULT 0,
    total_minutes   REAL    NOT NULL DEFAULT 0,
    is_blocked      INTEGER NOT NULL DEFAULT 0,
    created_at      INTEGER NOT NULL DEFAULT (unixepoch()),
    last_seen       INTEGER NOT NULL DEFAULT (unixepoch())
  );
  CREATE TABLE IF NOT EXISTS sessions (
    id                TEXT PRIMARY KEY,
    user_id           TEXT,
    from_lang         TEXT,
    to_lang           TEXT,
    duration_seconds  INTEGER NOT NULL DEFAULT 0,
    translation_count INTEGER NOT NULL DEFAULT 0,
    engine_used       TEXT,
    created_at        INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS revenue (
    id              TEXT PRIMARY KEY,
    user_id         TEXT,
    plan            TEXT,
    amount_inr      REAL,
    currency        TEXT DEFAULT 'INR',
    store           TEXT DEFAULT 'google_play',
    product_id      TEXT,
    purchase_token  TEXT,
    verified        INTEGER DEFAULT 0,
    created_at      INTEGER NOT NULL DEFAULT (unixepoch())
  );
`);

const adminExists = db.prepare("SELECT id FROM admin WHERE id=1").get();
if (!adminExists) {
  const defaultPass = process.env.ADMIN_PASSWORD || "admin@snxwfairies123";
  const hash = bcrypt.hashSync(defaultPass, 10);
  db.prepare("INSERT INTO admin (id, password_hash, email) VALUES (1, ?, ?)").run(hash, "admin@snxwfairies.com");
  console.log(`\n  🔐 Default admin password: ${defaultPass}`);
  console.log("  ⚠️  Change this immediately in Admin Panel!\n");
}

export const ApiKeys = {
  get: (provider: string): string | null => {
    // First check env var (for Railway/VPS zero-config)
    const envKey = provider === "openrouter" ? process.env.OPENROUTER_API_KEY
                 : provider === "sarvam"     ? process.env.SARVAM_API_KEY
                 : null;
    if (envKey) return envKey;
    // Fallback to SQLite (set via Admin Panel)
    const row = db.prepare("SELECT key_value FROM api_keys WHERE provider=?").get(provider) as any;
    return row?.key_value || null;
  },
  set: (provider: string, value: string): void => {
    db.prepare(`INSERT INTO api_keys (provider, key_value, updated_at) VALUES (?,?,unixepoch())
      ON CONFLICT(provider) DO UPDATE SET key_value=excluded.key_value, updated_at=unixepoch()`).run(provider, value);
  },
};

export const Users = {
  get: (id: string) => db.prepare("SELECT * FROM users WHERE id=?").get(id) as any,
  upsert: (id: string) => {
    const today = new Date().toISOString().slice(0, 10);
    db.prepare(`INSERT INTO users (id, sessions_date) VALUES (?, ?)
      ON CONFLICT(id) DO UPDATE SET last_seen=unixepoch()`).run(id, today);
    return Users.get(id);
  },
  resetDailyIfNeeded: (id: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const u = Users.get(id);
    if (u && u.sessions_date !== today) {
      db.prepare("UPDATE users SET sessions_today=0, sessions_date=? WHERE id=?").run(today, id);
    }
  },
  incrementSession: (id: string) => {
    db.prepare("UPDATE users SET sessions_today=sessions_today+1, total_sessions=total_sessions+1 WHERE id=?").run(id);
  },
  addMinutes: (id: string, mins: number) => {
    db.prepare("UPDATE users SET total_minutes=total_minutes+? WHERE id=?").run(mins, id);
  },
  setPlan: (id: string, plan: string, expiresAt: number | null) => {
    db.prepare("UPDATE users SET plan=?, plan_expires_at=? WHERE id=?").run(plan, expiresAt, id);
  },
  list: (limit = 100, offset = 0) => db.prepare("SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?").all(limit, offset) as any[],
  count: () => (db.prepare("SELECT COUNT(*) as n FROM users").get() as any).n,
};

export const Admin = {
  check: (password: string): boolean => {
    const row = db.prepare("SELECT password_hash FROM admin WHERE id=1").get() as any;
    return row ? bcrypt.compareSync(password, row.password_hash) : false;
  },
  setPassword: (newPass: string) => {
    const hash = bcrypt.hashSync(newPass, 10);
    db.prepare("UPDATE admin SET password_hash=?, updated_at=unixepoch() WHERE id=1").run(hash);
  },
  getEmail: (): string => (db.prepare("SELECT email FROM admin WHERE id=1").get() as any)?.email || "",
};

export const Analytics = {
  summary: () => {
    const totalUsers = (db.prepare("SELECT COUNT(*) as n FROM users").get() as any).n;
    const activeToday = (db.prepare("SELECT COUNT(*) as n FROM users WHERE sessions_date=?").get(new Date().toISOString().slice(0, 10)) as any).n;
    const totalSessions = (db.prepare("SELECT COUNT(*) as n FROM sessions").get() as any).n;
    const totalMinutes = (db.prepare("SELECT SUM(duration_seconds)/60.0 as m FROM sessions").get() as any).m || 0;
    const paidUsers = (db.prepare("SELECT COUNT(*) as n FROM users WHERE plan != 'free'").get() as any).n;
    const revenueTotal = (db.prepare("SELECT SUM(amount_inr) as r FROM revenue WHERE verified=1").get() as any).r || 0;
    const sarvamCalls = (db.prepare("SELECT COUNT(*) as n FROM sessions WHERE engine_used='sarvam'").get() as any).n;
    const openrouterCalls = (db.prepare("SELECT COUNT(*) as n FROM sessions WHERE engine_used='openrouter'").get() as any).n;
    const planBreakdown = db.prepare("SELECT plan, COUNT(*) as n FROM users GROUP BY plan").all();
    return { totalUsers, activeToday, totalSessions, totalMinutes: Math.round(totalMinutes), paidUsers, revenueTotal, sarvamCalls, openrouterCalls, planBreakdown };
  },
  dailySessions: () => db.prepare(`
    SELECT date(created_at,'unixepoch') as day, COUNT(*) as n
    FROM sessions WHERE created_at > unixepoch('now','-7 days')
    GROUP BY day ORDER BY day
  `).all() as any[],
};

export default db;
