/**
 * lib/turso.js — Cliente de base de datos Turso (libSQL sobre SQLite en la nube).
 *
 * Exporta:
 *  - turso: instancia del cliente. Es null si las variables de entorno no están configuradas.
 *  - isTursoConfigured: booleano que indica si Turso está disponible.
 *  - initDb(): crea las tablas necesarias si no existen y aplica migraciones
 *    incremetales (ALTER TABLE). Seguro ejecutar en cada inicio de sesión.
 *
 * Tablas creadas:
 *  - orders: órdenes de servicio técnico.
 *  - clients: clientes del taller.
 *  - app_users: usuarios que pueden iniciar sesión en el sistema.
 *  - login_logs: registro de accesos (IP, user-agent, fecha).
 *  - inventory: ítems del inventario de piezas/repuestos.
 *  - suppliers: proveedores del taller.
 *  - device_catalog: catálogo de dispositivos (categoría, marca, modelo).
 *  - services: catálogo de servicios prestados (mano de obra, reparaciones, etc.).
 *
 * Si las variables VITE_TURSO_DATABASE_URL / VITE_TURSO_AUTH_TOKEN no están
 * definidas, la app funciona únicamente con localStorage (sin sincronización).
 */
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
    `CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      created_by TEXT NOT NULL DEFAULT 'admin',
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      created_by TEXT NOT NULL DEFAULT 'admin',
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS device_catalog (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      created_by TEXT NOT NULL DEFAULT 'admin',
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      sale_number TEXT NOT NULL,
      created_by TEXT NOT NULL DEFAULT 'admin',
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS user_settings (
      username TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS device_types (
      id TEXT PRIMARY KEY,
      value TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
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

  // Seed device_types with defaults if empty
  try {
    const existing = await turso.execute('SELECT COUNT(*) as cnt FROM device_types')
    if (Number(existing.rows[0].cnt) === 0) {
      const defaults = [
        { value: 'phone',        label: 'Smartphone' },
        { value: 'laptop',       label: 'Laptop' },
        { value: 'desktop',      label: 'PC' },
        { value: 'tablet',       label: 'Tablet' },
        { value: 'console',      label: 'Consola' },
        { value: 'smartwatch',   label: 'Smartwatch' },
        { value: 'gpu',          label: 'Placa de video' },
        { value: 'motherboard',  label: 'Motherboard' },
        { value: 'storage',      label: 'Disco (HDD/SSD)' },
        { value: 'power_supply', label: 'Fuente de poder' },
        { value: 'audio',        label: 'Audio' },
        { value: 'tv',           label: 'TV / Monitor' },
        { value: 'printer',      label: 'Impresora' },
        { value: 'network',      label: 'Equipo de red' },
        { value: 'camera',       label: 'Cámara' },
        { value: 'drone',        label: 'Drone' },
        { value: 'board',        label: 'Placa' },
        { value: 'other',        label: 'Otro' },
      ]
      const now = new Date().toISOString()
      await turso.batch(
        defaults.map((d, i) => ({
          sql: `INSERT OR IGNORE INTO device_types (id, value, label, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
          args: [`DT-${i + 1}`, d.value, d.label, i, now, now],
        })),
        'write'
      )
    }
  } catch { /* seed failed — non-critical */ }
}
