import { createClient } from '@libsql/client/web'

const tursoUrl = import.meta.env.VITE_TURSO_DATABASE_URL
const tursoAuthToken = import.meta.env.VITE_TURSO_AUTH_TOKEN

export const isTursoConfigured = !!(tursoUrl && tursoAuthToken)

export const turso = isTursoConfigured
  ? createClient({ url: tursoUrl, authToken: tursoAuthToken })
  : null

/**
 * Initialize database tables if they don't exist yet.
 * Safe to call on every app start (IF NOT EXISTS).
 */
export async function initDb() {
  if (!turso) return

  await turso.batch([
    `CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT NOT NULL,
      created_by TEXT NOT NULL DEFAULT 'admin',
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT,
      phone TEXT,
      email TEXT,
      dni TEXT,
      address TEXT,
      created_by TEXT NOT NULL DEFAULT 'admin',
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS app_users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS login_logs (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      role TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      logged_in_at TEXT NOT NULL
    )`,
  ], 'write')

  // Migrate existing tables — safe to run every time (errors = column already exists)
  const migrations = [
    `ALTER TABLE orders ADD COLUMN created_by TEXT NOT NULL DEFAULT 'admin'`,
    `ALTER TABLE clients ADD COLUMN created_by TEXT NOT NULL DEFAULT 'admin'`,
  ]
  for (const sql of migrations) {
    try { await turso.execute(sql) } catch { /* already exists */ }
  }
}
