/**
 * utils/constants.js — Constantes globales y utilidades puras de la app.
 *
 * Exporta:
 *
 * STATUS_CONFIG: configuración visual (label, colores Tailwind, punto de color)
 *   para cada estado posible de una orden de servicio:
 *   pending → diagnosing → waiting_approval → in_repair → completed / irreparable → delivered / abandoned
 *
 * canTransitionTo(order, newStatus): valida si una orden puede cambiar al nuevo
 *   estado según las reglas de flujo (TRANSITION_RULES). Devuelve { ok, reason }.
 *
 * BUDGET_STATUS_CONFIG: colores para los estados del presupuesto (pending, approved, rejected).
 *
 * DEVICE_TYPES: tipos de dispositivos para el select del formulario.
 *
 * ACCESSORIES_OPTIONS: accesorios comunes que puede traer el cliente con el equipo.
 *
 *
 * formatDate(iso): fecha completa con hora en es-AR.
 * formatDateShort(iso): fecha sin hora en es-AR.
 * formatCurrency(val): formato ARS sin decimales (ej. $ 15.000).
 */
export const STATUS_CONFIG = {
  pending: {
    label: 'Pendiente',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
    dot: 'bg-slate-400',
  },
  diagnosing: {
    label: 'Diagnóstico',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  waiting_approval: {
    label: 'Esperando aprobación',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  in_repair: {
    label: 'En reparación',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    dot: 'bg-orange-500',
  },
  completed: {
    label: 'Completado',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    dot: 'bg-green-500',
  },
  irreparable: {
    label: 'Sin reparación',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    dot: 'bg-red-500',
  },
  delivered: {
    label: 'Entregado',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    dot: 'bg-purple-500',
  },
  abandoned: {
    label: 'Abandonado',
    color: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400',
    dot: 'bg-zinc-400',
  },
}

// Ruta canónica implícita para cada estado final
// Define todos los pasos que "ya habrían ocurrido" antes de llegar a ese estado
export const STATUS_PATHS = {
  pending:          ['pending'],
  diagnosing:       ['pending', 'diagnosing'],
  waiting_approval: ['pending', 'diagnosing', 'waiting_approval'],
  in_repair:        ['pending', 'diagnosing', 'waiting_approval', 'in_repair'],
  completed:        ['pending', 'diagnosing', 'waiting_approval', 'in_repair', 'completed'],
  irreparable:      ['pending', 'diagnosing', 'irreparable'],
  // delivered y abandoned heredan la ruta según si la orden pasó por completed o irreparable
  delivered:        null,
  abandoned:        null,
}

// Rutas canónicas para delivered y abandoned según el camino previo de la orden
const PATH_VIA_COMPLETED = ['pending', 'diagnosing', 'waiting_approval', 'in_repair', 'completed']
const PATH_VIA_IRREPARABLE = ['pending', 'diagnosing', 'irreparable']

function getTerminalPath(existingHistory, terminalStatus) {
  const history = existingHistory || []
  const viaIrrep = history.some((e) => e.status === 'irreparable')
  const base = viaIrrep ? PATH_VIA_IRREPARABLE : PATH_VIA_COMPLETED

  // Si vamos a "delivered" y ya hubo un "abandoned" previo, conservarlo en la ruta
  if (terminalStatus === 'delivered' && history.some((e) => e.status === 'abandoned')) {
    return [...base, 'abandoned', 'delivered']
  }

  return [...base, terminalStatus]
}

// Genera el statusHistory completo para un estado destino.
// Para estados con ruta canónica fija, reconstruye esa ruta preservando timestamps reales.
// Para delivered/abandoned, detecta el camino previo (completed vs irreparable) y arma la ruta correcta.
export function buildStatusHistory(existingHistory, newStatus, note = '') {
  const now = new Date().toISOString()

  const path =
    newStatus === 'delivered' || newStatus === 'abandoned'
      ? getTerminalPath(existingHistory, newStatus)
      : STATUS_PATHS[newStatus]

  return path.map((s, i) => {
    const isLast = i === path.length - 1
    const existing = (existingHistory || []).find((e) => e.status === s)
    return {
      status: s,
      timestamp: existing?.timestamp || now,
      note: isLast ? note : (existing?.note || ''),
    }
  })
}

// Valida si una orden puede pasar al nuevo estado.
// Solo bloquea delivered/abandoned si no hubo completed ni irreparable antes.
export function canTransitionTo(order, newStatus) {
  if (newStatus === 'delivered' || newStatus === 'abandoned') {
    const history = order.statusHistory || []
    const hadFinal = history.some((h) => h.status === 'completed' || h.status === 'irreparable')
    if (!hadFinal) {
      return {
        ok: false,
        reason: 'La orden debe estar en "Completado" o "Sin reparación" antes de marcarla como Entregada o Abandonada.',
      }
    }
  }
  return { ok: true }
}

export const BUDGET_STATUS_CONFIG = {
  pending: { label: 'Pendiente', color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  approved: { label: 'Aprobado', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
}

export const DEVICE_TYPES = [
  { value: 'phone', label: 'Smartphone' },
  { value: 'laptop', label: 'Laptop' },
  { value: 'desktop', label: 'PC' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'console', label: 'Consola' },
  { value: 'smartwatch', label: 'Smartwatch' },
  { value: 'gpu', label: 'Placa de video' },
  { value: 'motherboard', label: 'Motherboard' },
  { value: 'storage', label: 'Disco (HDD/SSD)' },
  { value: 'power_supply', label: 'Fuente de poder' },
  { value: 'audio', label: 'Audio' },
  { value: 'tv', label: 'TV / Monitor' },
  { value: 'printer', label: 'Impresora' },
  { value: 'network', label: 'Equipo de red' },
  { value: 'camera', label: 'Camara' },
  { value: 'drone', label: 'Drone' },
  { value: 'board', label: 'Placa' },
  { value: 'other', label: 'Otro' },
]

export const ACCESSORIES_OPTIONS = [
  'Cargador',
  'Cable',
  'Funda',
  'Protector de pantalla',
  'Batería',
  'Auriculares',
  'Adaptador',
  'Tarjeta SIM',
  'Bandeja SIM',
  'Tarjeta de memoria (SD)',
  'Disco externo',
  'Pendrive',
  'Teclado',
  'Mouse',
  'Control',
  'Dock / Base',
  'Stylus',
  'Caja',
  'Manual',
]

// Parse a date string safely: if it's a plain date (YYYY-MM-DD) treat it as
// local midnight to avoid UTC offset shifting the day backwards.
function parseDate(iso) {
  if (!iso) return null
  // Plain date without time component → append T00:00 so it's local time
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return new Date(`${iso}T00:00`)
  return new Date(iso)
}

export const formatDate = (iso) => {
  const d = parseDate(iso)
  if (!d) return '—'
  return d.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatDateShort = (iso) => {
  const d = parseDate(iso)
  if (!d) return '—'
  return d.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// formatCurrency uses dynamic currency/locale when provided,
// falling back to ARS/es-AR for backwards compatibility.
export const formatCurrency = (val, currency = 'ARS', locale = 'es-AR') => {
  if (!val && val !== 0) return '—'
  const num = parseFloat(val)
  if (isNaN(num)) return '—'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

// Hook-friendly wrapper — reads settings from the store snapshot.
// Usage: import { useCurrency } from '../utils/constants'
// const fmt = useCurrency(); fmt(15000)
export function makeCurrencyFormatter(settings) {
  const currency = settings?.currency || 'ARS'
  const locale   = settings?.currencyLocale || 'es-AR'
  return (val) => formatCurrency(val, currency, locale)
}

