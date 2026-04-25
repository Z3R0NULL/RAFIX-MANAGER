/**
 * pages/FinancePage.jsx — Módulo financiero completo del taller.
 *
 * Secciones:
 *  1. KPI strip global (ingresos, costos, ganancia, margen)
 *  2. Órdenes de servicio — ingresos realizados, pendientes, por período
 *  3. Ventas — ingresos de mostrador, margen por venta
 *  4. Inventario — valor del stock, exposición a pérdidas
 *  5. Servicios — facturación por tipo de servicio
 *  6. Ganancias por categoría de reparación (donut)
 *  7. Top ingresos globales
 */
import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, DollarSign, Percent,
  Calendar, ChevronRight, ArrowUpRight, ArrowDownRight,
  Clock, Info, Package, ShoppingCart, Wrench,
  Settings2, AlertTriangle, BarChart3,
  PieChart as PieIcon, Boxes, Layers,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { PageLoader } from '../components/PageLoader'
import { formatDateShort } from '../utils/constants'
import { useCurrency } from '../utils/useCurrency'

// ── Helpers ───────────────────────────────────────────────────────────────────

const n = (v) => { const p = parseFloat(v); return isNaN(p) ? 0 : p }
const isDelivered = (o) => o.status === 'delivered'
const isCompleted  = (o) => o.status === 'completed'

function getYear(iso)  { return iso ? new Date(iso).getFullYear() : null }
function getMonth(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function getDay(iso) { return iso ? iso.slice(0, 10) : null }
function getPeriodDate(o, period) {
  const ref = o.deliveryDate || o.entryDate
  if (period === 'daily')   return getDay(ref)
  if (period === 'monthly') return getMonth(ref)
  return getYear(ref)
}

const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MONTHS_LONG  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function formatPeriodLabel(key, period) {
  if (period === 'monthly') {
    const [yr, mo] = String(key).split('-')
    return { short: MONTHS_SHORT[parseInt(mo, 10) - 1] || mo, long: `${MONTHS_LONG[parseInt(mo, 10) - 1]} ${yr}` }
  }
  if (period === 'daily') {
    const dt = new Date(`${key}T00:00`)
    return {
      short: `${dt.getDate()}/${dt.getMonth() + 1}`,
      long: dt.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
    }
  }
  return { short: String(key), long: String(key) }
}

const PERIOD_LABELS = { daily: 'Diario', monthly: 'Mensual', annual: 'Anual' }

// ── Repair categories ─────────────────────────────────────────────────────────

const REPAIR_CATEGORIES = [
  { key: 'pantalla',  label: 'Pantalla',       color: '#6366f1', keywords: ['pantalla','display','lcd','screen','touch','tactil','táctil','vidrio','glass'] },
  { key: 'bateria',   label: 'Batería',         color: '#10b981', keywords: ['bateria','batería','battery','carga rapida','no carga','no enciende'] },
  { key: 'pin_carga', label: 'Pin de carga',    color: '#f59e0b', keywords: ['pin','puerto','carga','charging','usb','tipo c','type c','conector'] },
  { key: 'boton',     label: 'Botón',           color: '#ef4444', keywords: ['boton','botón','button','power','volumen','home','encendido'] },
  { key: 'corto',     label: 'Corto / Líquido', color: '#8b5cf6', keywords: ['corto','liquido','líquido','agua','humedad','mojado','oxidacion','oxido'] },
  { key: 'reballing', label: 'Reballing',       color: '#ec4899', keywords: ['reballing','reball','micro','chip','soldadura','placa','board'] },
  { key: 'camara',    label: 'Cámara',          color: '#14b8a6', keywords: ['camara','cámara','camera','lente','foto','flash'] },
  { key: 'audio',     label: 'Audio / Bocina',  color: '#f97316', keywords: ['audio','bocina','speaker','microfono','micrófono','auricular','sonido'] },
  { key: 'software',  label: 'Software',        color: '#06b6d4', keywords: ['software','sistema','formateo','formato','flasheo','virus','actualiz','unlock','desbloqueo'] },
  { key: 'otros',     label: 'Otros',           color: '#94a3b8', keywords: [] },
]

function classifyRepair(order) {
  const text = `${order.reportedIssue || ''} ${order.workDone || ''} ${order.technicianNotes || ''}`.toLowerCase()
  for (const cat of REPAIR_CATEGORIES) {
    if (cat.key === 'otros') continue
    if (cat.keywords.some((kw) => text.includes(kw))) return cat.key
  }
  return 'otros'
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, iconColor, title, subtitle, right }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-2.5">
        <Icon size={15} className={iconColor} />
        <div>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</span>
          {subtitle && <span className="ml-2 text-xs text-slate-400">{subtitle}</span>}
        </div>
      </div>
      {right}
    </div>
  )
}

function KpiCard({ label, value, icon: Icon, iconColor, bg, delta, deltaInverted, subtitle }) {
  const positive = deltaInverted ? (delta !== null && delta <= 0) : (delta !== null && delta >= 0)
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={16} className={iconColor} />
        </div>
        {delta !== null && delta !== undefined && (
          <div className={`flex items-center gap-0.5 text-xs font-semibold ${positive ? 'text-emerald-500' : 'text-red-500'}`}>
            {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(delta).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-xl font-bold text-slate-900 dark:text-white mt-3 leading-none">{value}</p>
      <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1">{label}</p>
      {subtitle && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  )
}

function StatRow({ label, value, valueColor = 'text-slate-800 dark:text-slate-200', sub, border = true }) {
  return (
    <div className={`flex items-center justify-between py-2 ${border ? 'border-b border-slate-100 dark:border-slate-800 last:border-0' : ''}`}>
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <div className="text-right">
        <span className={`text-sm font-semibold ${valueColor}`}>{value}</span>
        {sub && <span className="block text-[10px] text-slate-400 leading-none mt-0.5">{sub}</span>}
      </div>
    </div>
  )
}

function MiniBar({ pct, color = 'bg-indigo-500' }) {
  return (
    <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-0.5">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  )
}

function MarginBadge({ margin, bold }) {
  const cls = margin >= 50
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
    : margin >= 20
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
      : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
  return (
    <span className={`text-xs ${bold ? 'font-bold' : 'font-semibold'} px-2 py-0.5 rounded-full ${cls}`}>
      {margin.toFixed(1)}%
    </span>
  )
}

function PeriodRow({ label, value, color, bold, fmt }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`text-sm ${color} ${bold ? 'font-bold' : 'font-semibold'}`}>{fmt(value)}</span>
    </div>
  )
}

// ── Bar Chart (SVG, mejorado) ─────────────────────────────────────────────────

function formatAxisValue(v) {
  if (v === 0) return '0'
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}k`
  return String(Math.round(v))
}

function BarChart({ data, fmt }) {
  const [hov, setHov] = useState(null)
  if (!data.length) return null

  const CHART_H    = 200
  const CHART_W    = 600
  const PAD_LEFT   = 52
  const PAD_RIGHT  = 12
  const PAD_TOP    = 16
  const PAD_BOTTOM = 28
  const innerH     = CHART_H - PAD_TOP - PAD_BOTTOM
  const innerW     = CHART_W - PAD_LEFT - PAD_RIGHT

  const safeMax = Math.max(...data.map((d) => Math.max(d.income, d.expense, 1))) * 1.08
  const GRID_LINES = 4
  const step = safeMax / GRID_LINES

  const barGroupW = innerW / data.length
  const barW      = Math.max(4, Math.min(18, barGroupW * 0.32))
  const gap       = Math.max(2, barW * 0.3)

  function yPos(v) { return PAD_TOP + innerH - (v / safeMax) * innerH }

  // Profit line points
  const profitPoints = data.map((d, i) => {
    const cx = PAD_LEFT + barGroupW * i + barGroupW / 2
    const cy = yPos(Math.max(0, d.income - d.expense))
    return `${cx},${cy}`
  }).join(' ')

  const hovData = hov !== null ? data[hov] : null

  return (
    <div className="relative w-full select-none">
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="w-full"
        style={{ overflow: 'visible' }}
        onMouseLeave={() => setHov(null)}
      >
        <defs>
          <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#34d399" stopOpacity="1" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#fb7185" stopOpacity="1" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#818cf8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
          </linearGradient>
          <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#00000022" />
          </filter>
        </defs>

        {/* Grid lines + Y labels */}
        {Array.from({ length: GRID_LINES + 1 }, (_, i) => {
          const v  = step * (GRID_LINES - i)
          const y  = yPos(v)
          return (
            <g key={i}>
              <line
                x1={PAD_LEFT} y1={y} x2={CHART_W - PAD_RIGHT} y2={y}
                stroke="currentColor" strokeOpacity={i === GRID_LINES ? 0.2 : 0.08}
                strokeWidth={i === GRID_LINES ? 1.5 : 1}
                className="text-slate-500"
                strokeDasharray={i === GRID_LINES ? '' : '4 4'}
              />
              <text
                x={PAD_LEFT - 6} y={y + 4}
                textAnchor="end" fontSize="9"
                className="fill-slate-400" fill="#94a3b8"
              >
                {formatAxisValue(v)}
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const cx     = PAD_LEFT + barGroupW * i + barGroupW / 2
          const xInc   = cx - gap / 2 - barW
          const xExp   = cx + gap / 2
          const hInc   = Math.max(0, (d.income  / safeMax) * innerH)
          const hExp   = Math.max(0, (d.expense / safeMax) * innerH)
          const yInc   = PAD_TOP + innerH - hInc
          const yExp   = PAD_TOP + innerH - hExp
          const isHov  = hov === i
          const r      = Math.min(3, barW / 2)
          return (
            <g key={i} style={{ cursor: 'pointer' }} onMouseEnter={() => setHov(i)}>
              {/* Hover bg */}
              <rect
                x={PAD_LEFT + barGroupW * i} y={PAD_TOP}
                width={barGroupW} height={innerH}
                fill={isHov ? 'currentColor' : 'transparent'}
                fillOpacity={0.04}
                className="text-slate-500"
                rx="2"
              />
              {/* Income bar */}
              {hInc > 0 && (
                <rect x={xInc} y={yInc} width={barW} height={hInc}
                  fill="url(#incGrad)" rx={r}
                  opacity={hov !== null && !isHov ? 0.4 : 1}
                  filter={isHov ? 'url(#barShadow)' : ''}
                  style={{ transition: 'opacity 0.15s' }}
                />
              )}
              {/* Expense bar */}
              {hExp > 0 && (
                <rect x={xExp} y={yExp} width={barW} height={hExp}
                  fill="url(#expGrad)" rx={r}
                  opacity={hov !== null && !isHov ? 0.4 : 1}
                  filter={isHov ? 'url(#barShadow)' : ''}
                  style={{ transition: 'opacity 0.15s' }}
                />
              )}
              {/* X label */}
              <text
                x={cx} y={CHART_H - 6}
                textAnchor="middle" fontSize="9"
                fill={isHov ? '#6366f1' : '#94a3b8'}
                fontWeight={isHov ? '700' : '400'}
              >
                {d.shortLabel}
              </text>
            </g>
          )
        })}

        {/* Profit area fill */}
        {data.length > 1 && (() => {
          const pts = data.map((d, i) => {
            const cx = PAD_LEFT + barGroupW * i + barGroupW / 2
            return `${cx},${yPos(Math.max(0, d.income - d.expense))}`
          })
          const base = PAD_TOP + innerH
          const area = `M ${pts[0]} L ${pts.join(' L ')} L ${PAD_LEFT + barGroupW * (data.length - 1) + barGroupW / 2},${base} L ${PAD_LEFT + barGroupW / 2},${base} Z`
          return <path d={area} fill="url(#profGrad)" />
        })()}

        {/* Profit line */}
        {data.length > 1 && (
          <polyline
            points={profitPoints}
            fill="none"
            stroke="#818cf8"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray="4 2"
            opacity="0.7"
          />
        )}

        {/* Profit dots */}
        {data.map((d, i) => {
          const cx = PAD_LEFT + barGroupW * i + barGroupW / 2
          const cy = yPos(Math.max(0, d.income - d.expense))
          const isHov = hov === i
          if (!isHov) return null
          return (
            <circle key={i} cx={cx} cy={cy} r={4}
              fill="#818cf8" stroke="white" strokeWidth="1.5" />
          )
        })}

        {/* Tooltip (rendered inside SVG as foreignObject for rich content) */}
        {hovData !== null && (() => {
          const i  = hov
          const cx = PAD_LEFT + barGroupW * i + barGroupW / 2
          const TW = 140
          const TH = 72
          let tx = cx - TW / 2
          if (tx < PAD_LEFT) tx = PAD_LEFT
          if (tx + TW > CHART_W - PAD_RIGHT) tx = CHART_W - PAD_RIGHT - TW
          const ty = PAD_TOP - TH - 8
          return (
            <g>
              <rect x={tx} y={ty} width={TW} height={TH} rx="8"
                fill="#1e293b" opacity="0.97" />
              <text x={tx + TW / 2} y={ty + 14} textAnchor="middle" fontSize="9" fontWeight="700" fill="#e2e8f0">{hovData.label}</text>
              <text x={tx + 10} y={ty + 29} fontSize="9" fill="#34d399">▲  {fmt(hovData.income)}</text>
              <text x={tx + 10} y={ty + 43} fontSize="9" fill="#fb7185">▼  {fmt(hovData.expense)}</text>
              <line x1={tx + 8} y1={ty + 49} x2={tx + TW - 8} y2={ty + 49} stroke="#334155" strokeWidth="1" />
              <text x={tx + 10} y={ty + 62} fontSize="9" fill="#a5b4fc" fontWeight="600">= {fmt(hovData.income - hovData.expense)}</text>
            </g>
          )
        })()}
      </svg>
    </div>
  )
}

// ── Donut Chart ───────────────────────────────────────────────────────────────

function DonutChart({ segments, centerLabel, hovered, onHover }) {
  const R = 78, RHov = 84, stroke = 22, strokeH = 28
  let offset = 0
  const segs = segments.map((seg) => { const start = offset; offset += seg.pct; return { ...seg, start } })
  const hovSeg = hovered != null ? segs.find((s) => s.key === hovered) : null
  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[220px] mx-auto" style={{ overflow: 'visible' }}>
      <circle cx="100" cy="100" r={R} fill="none" stroke="#e2e8f0" strokeWidth={stroke} opacity="0.5" />
      {segs.map((seg) => {
        const isHov = hovered === seg.key
        const r = isHov ? RHov : R, sw = isHov ? strokeH : stroke
        const circ = 2 * Math.PI * r
        const dash = (seg.pct / 100) * circ
        const dashOffset = -(seg.start / 100) * circ + circ * 0.25
        return (
          <circle key={seg.key} cx="100" cy="100" r={r} fill="none" stroke={seg.color} strokeWidth={sw}
            strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={dashOffset} strokeLinecap="butt"
            opacity={hovered != null && !isHov ? 0.25 : 1}
            style={{ transition: 'all 0.22s cubic-bezier(.4,0,.2,1)', cursor: 'pointer' }}
            onMouseEnter={() => onHover(seg.key)} onMouseLeave={() => onHover(null)} />
        )
      })}
      {hovSeg ? (
        <>
          <text x="100" y="90"  textAnchor="middle" fontSize="9"  fontWeight="700" fill={hovSeg.color}>{hovSeg.label}</text>
          <text x="100" y="104" textAnchor="middle" fontSize="11" fontWeight="700" fill={hovSeg.color}>{hovSeg.pct.toFixed(1)}%</text>
          <text x="100" y="117" textAnchor="middle" fontSize="8"  fill="#94a3b8">{hovSeg.income > 0 ? `$${hovSeg.income.toLocaleString('es')}` : 'sin ingresos'}</text>
        </>
      ) : (
        <>
          <text x="100" y="97"  textAnchor="middle" fontSize="11" fontWeight="600" fill="#475569">{centerLabel}</text>
          <text x="100" y="112" textAnchor="middle" fontSize="9"  fill="#94a3b8">Ganancia neta</text>
        </>
      )}
    </svg>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function FinancePage() {
  const fmt         = useCurrency()
  const orders      = useStore((s) => s.orders)
  const sales       = useStore((s) => s.sales)
  const inventory   = useStore((s) => s.inventory)
  const services    = useStore((s) => s.services)
  const dataLoading = useStore((s) => s.dataLoading)

  const [period, setPeriod]   = useState('monthly')
  const [donutHov, setDonutHov] = useState(null)

  // ── 1. Órdenes: billed & pending ─────────────────────────────────────────
  const { billedOrders, pendingOrders } = useMemo(() => {
    const billed = [], pending = []
    for (const o of orders) {
      const row = { ...o, _income: n(o.finalPrice) || n(o.estimatedPrice), _expense: n(o.repairCost), _type: 'order' }
      if (isDelivered(o)) billed.push(row)
      else if (isCompleted(o)) pending.push(row)
    }
    return { billedOrders: billed, pendingOrders: pending }
  }, [orders])

  // ── 2. Ventas: billed & pending ───────────────────────────────────────────
  const { billedSales, pendingSales } = useMemo(() => {
    const billed = [], pending = []
    for (const s of sales) {
      const income  = n(s.total) || (s.items || []).reduce((a, i) => a + n(i.price) * (i.qty || 1), 0)
      const expense = (s.items || []).reduce((a, i) => a + n(i.cost) * (i.qty || 1), 0)
      const row = { ...s, _income: income, _expense: expense, _type: 'sale',
        deliveryDate: s.createdAt, entryDate: s.createdAt,
        orderNumber: s.saleNumber, customerName: s.customerName || '' }
      if (s.status === 'paid') billed.push(row)
      else if (s.status !== 'cancelled') pending.push(row)
    }
    return { billedSales: billed, pendingSales: pending }
  }, [sales])

  // ── 3. Combined for chart / global KPIs ──────────────────────────────────
  const billed = useMemo(() => [...billedOrders, ...billedSales], [billedOrders, billedSales])

  const global = useMemo(() => {
    const income  = billed.reduce((s, o) => s + o._income,  0)
    const expense = billed.reduce((s, o) => s + o._expense, 0)
    const profit  = income - expense
    const margin  = income > 0 ? (profit / income) * 100 : 0
    const pendingIncome = [...pendingOrders, ...pendingSales].reduce((s, o) => s + o._income, 0)
    return { income, expense, profit, margin, pendingIncome }
  }, [billed, pendingOrders, pendingSales])

  // ── 4. Period chart ───────────────────────────────────────────────────────
  const periodData = useMemo(() => {
    const map = {}
    for (const o of billed) {
      const key = getPeriodDate(o, period)
      if (!key) continue
      if (!map[key]) map[key] = { key, income: 0, expense: 0, orders: [] }
      map[key].income  += o._income
      map[key].expense += o._expense
      map[key].orders.push(o)
    }
    return Object.values(map).sort((a, b) => (String(a.key) > String(b.key) ? 1 : -1))
  }, [billed, period])

  const chartData = useMemo(() => {
    const sliced = period === 'daily' ? periodData.slice(-30) : period === 'monthly' ? periodData.slice(-12) : periodData
    return sliced.map((d) => { const { short, long } = formatPeriodLabel(d.key, period); return { ...d, shortLabel: short, label: long } })
  }, [periodData, period])

  const currentPeriod = chartData[chartData.length - 1]
  const prevPeriod    = chartData[chartData.length - 2]

  function pctDelta(curr, prev, field) {
    if (!curr || !prev || prev[field] === 0) return null
    return ((curr[field] - prev[field]) / prev[field]) * 100
  }

  // ── 5. Órdenes stats ──────────────────────────────────────────────────────
  const ordersStats = useMemo(() => {
    const income  = billedOrders.reduce((s, o) => s + o._income,  0)
    const expense = billedOrders.reduce((s, o) => s + o._expense, 0)
    const profit  = income - expense
    const margin  = income > 0 ? (profit / income) * 100 : 0
    const pendingIncome = pendingOrders.reduce((s, o) => s + o._income, 0)
    const avgTicket = billedOrders.length > 0 ? income / billedOrders.length : 0
    return { income, expense, profit, margin, pendingIncome, count: billedOrders.length, avgTicket }
  }, [billedOrders, pendingOrders])

  // ── 6. Ventas stats ───────────────────────────────────────────────────────
  const salesStats = useMemo(() => {
    const income  = billedSales.reduce((s, o) => s + o._income,  0)
    const expense = billedSales.reduce((s, o) => s + o._expense, 0)
    const profit  = income - expense
    const margin  = income > 0 ? (profit / income) * 100 : 0
    const pendingIncome = pendingSales.reduce((s, o) => s + o._income, 0)
    const avgTicket = billedSales.length > 0 ? income / billedSales.length : 0
    // Top ventas
    const top = [...billedSales].sort((a, b) => b._income - a._income).slice(0, 5)
    return { income, expense, profit, margin, pendingIncome, count: billedSales.length, avgTicket, top }
  }, [billedSales, pendingSales])

  // ── 7. Inventario stats ───────────────────────────────────────────────────
  const invStats = useMemo(() => {
    const totalValue   = inventory.reduce((a, i) => a + (n(i.price) * (i.stock || 0)), 0)
    const costValue    = inventory.reduce((a, i) => a + (n(i.costPrice) * (i.stock || 0)), 0)
    const potProfit    = totalValue - costValue
    const lowStockVal  = inventory
      .filter((i) => i.stock !== undefined && i.minStock !== undefined && i.stock >= 0 && i.stock <= i.minStock)
      .reduce((a, i) => a + (n(i.costPrice) * (i.stock || 0)), 0)
    const outOfStock   = inventory.filter((i) => (i.stock ?? 0) === 0).length
    const lowStock     = inventory.filter((i) => i.stock !== undefined && i.minStock !== undefined && i.stock > 0 && i.stock <= i.minStock).length

    // By category
    const catMap = {}
    for (const item of inventory) {
      const cat = item.category || 'otro'
      if (!catMap[cat]) catMap[cat] = { value: 0, count: 0 }
      catMap[cat].value += n(item.price) * (item.stock || 0)
      catMap[cat].count += 1
    }
    const byCategory = Object.entries(catMap)
      .map(([cat, d]) => ({ cat, value: d.value, count: d.count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    return { totalValue, costValue, potProfit, lowStockVal, outOfStock, lowStock, byCategory, total: inventory.length }
  }, [inventory])

  // ── 8. Servicios stats ────────────────────────────────────────────────────
  const svcStats = useMemo(() => {
    // Calcula cuántas veces se usó cada servicio en órdenes entregadas (via budgetItems)
    const svcMap = {}
    for (const o of billedOrders) {
      for (const item of (o.budgetItems || [])) {
        const id = item.serviceId || item.id
        if (!id) continue
        if (!svcMap[id]) svcMap[id] = { id, name: item.name || item.description || '—', income: 0, count: 0 }
        svcMap[id].income += n(item.price) * (item.qty || 1)
        svcMap[id].count  += 1
      }
    }
    // También de ventas
    for (const s of billedSales) {
      for (const item of (s.items || [])) {
        const id = item.serviceId || item.id
        if (!id || item.type !== 'service') continue
        if (!svcMap[id]) svcMap[id] = { id, name: item.name || '—', income: 0, count: 0 }
        svcMap[id].income += n(item.price) * (item.qty || 1)
        svcMap[id].count  += 1
      }
    }
    const total = services.length
    const active = services.filter((s) => s.active !== false).length
    const byService = Object.values(svcMap).sort((a, b) => b.income - a.income).slice(0, 6)
    const totalBilled = byService.reduce((a, s) => a + s.income, 0)
    return { total, active, byService, totalBilled }
  }, [services, billedOrders, billedSales])

  // ── 9. Category donut ─────────────────────────────────────────────────────
  const categoryData = useMemo(() => {
    const map = {}
    for (const cat of REPAIR_CATEGORIES) map[cat.key] = { ...cat, income: 0, count: 0, totalOrders: 0 }
    for (const o of billedOrders) {
      const key = classifyRepair(o)
      map[key].totalOrders += 1
      const profit = o._income - o._expense
      if (profit > 0) { map[key].income += profit; map[key].count += 1 }
    }
    const totalProfit = Object.values(map).reduce((s, c) => s + c.income, 0)
    return Object.values(map)
      .filter((c) => c.income > 0 || (c.key === 'otros' && c.totalOrders > 0))
      .sort((a, b) => b.income - a.income)
      .map((c) => ({ ...c, pct: totalProfit > 0 ? (c.income / totalProfit) * 100 : 0 }))
  }, [billedOrders])

  // ── 10. Top ingresos globales ─────────────────────────────────────────────
  const topItems = useMemo(() =>
    [...billed].filter((o) => o._income > 0).sort((a, b) => b._income - a._income).slice(0, 8)
  , [billed])

  // ── All pending for "sin cobrar" panel ────────────────────────────────────
  const allPending = useMemo(() => [...pendingOrders, ...pendingSales], [pendingOrders, pendingSales])

  if (dataLoading) return <PageLoader rows={5} title="Cargando finanzas..." />

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Finanzas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Vista financiera completa — órdenes, ventas, inventario y servicios
          </p>
        </div>
        <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-sm bg-white dark:bg-slate-900 shadow-sm">
          {['daily', 'monthly', 'annual'].map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 font-medium transition-colors ${period === p ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Nota informativa ────────────────────────────────────────── */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40 text-xs text-indigo-700 dark:text-indigo-300">
        <Info size={14} className="flex-shrink-0 mt-0.5" />
        <span>
          Ingresos contabilizan órdenes <strong>Entregadas</strong> + ventas <strong>Pagadas</strong>.
          Órdenes completadas sin entregar y ventas pendientes aparecen como ingreso no cobrado.
          {global.pendingIncome > 0 && <> — Hay <strong>{fmt(global.pendingIncome)}</strong> por cobrar.</>}
        </span>
      </div>

      {/* ── KPI strip global ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Ingresos realizados"   value={fmt(global.income)}              icon={TrendingUp}   iconColor="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-900/20"
          delta={pctDelta(currentPeriod, prevPeriod, 'income')} subtitle={`${billedOrders.length} órdenes · ${billedSales.length} ventas`} />
        <KpiCard label="Costos totales"        value={fmt(global.expense)}             icon={TrendingDown} iconColor="text-rose-500"    bg="bg-rose-50 dark:bg-rose-900/20"
          delta={pctDelta(currentPeriod, prevPeriod, 'expense')} deltaInverted subtitle="Reparaciones + costo de ventas" />
        <KpiCard label="Ganancia neta"         value={fmt(global.profit)}              icon={DollarSign}   iconColor={global.profit >= 0 ? 'text-indigo-500' : 'text-red-500'} bg={global.profit >= 0 ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-red-50 dark:bg-red-900/20'}
          subtitle="Ingresos − Costos" />
        <KpiCard label="Margen de ganancia"    value={`${global.margin.toFixed(1)}%`}  icon={Percent}      iconColor="text-violet-500"  bg="bg-violet-50 dark:bg-violet-900/20"
          subtitle="Sobre ingresos realizados" />
      </div>

      {/* ── Ingreso pendiente sin cobrar ────────────────────────────── */}
      {allPending.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800/50 overflow-hidden">
          <div className="px-5 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-amber-500" />
              <h2 className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Ingreso pendiente — sin cobrar</h2>
              <span className="text-xs text-amber-600 dark:text-amber-400">({allPending.length} item{allPending.length !== 1 ? 's' : ''})</span>
            </div>
            <span className="text-sm font-bold text-amber-700 dark:text-amber-300">{fmt(global.pendingIncome)}</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {allPending.slice(0, 5).map((o) => (
              <Link key={o.id} to={o._type === 'sale' ? `/sales/${o.id}` : `/orders/${o.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">{o.orderNumber}</span>
                    {o._type === 'sale'
                      ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium">Venta</span>
                      : <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-medium">Orden</span>}
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {o.customerName || '—'}{o._type === 'order' && o.deviceBrand ? ` · ${o.deviceBrand} ${o.deviceModel}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{fmt(o._income)}</p>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </div>
              </Link>
            ))}
            {allPending.length > 5 && (
              <div className="px-5 py-2.5 text-xs text-slate-400 text-center">+{allPending.length - 5} más</div>
            )}
          </div>
        </div>
      )}

      {/* ── Gráfico de períodos ──────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
          <SectionHeader icon={BarChart3} iconColor="text-indigo-500" title={`Ingresos vs Gastos — ${PERIOD_LABELS[period]}`}
            right={
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />Ingresos
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block" />Gastos
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="18" height="8" className="inline-block -mt-0.5"><line x1="0" y1="4" x2="18" y2="4" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="4 2" /></svg>
                  Ganancia
                </span>
              </div>
            } />
          <div className="p-5">
            {chartData.length === 0
              ? <div className="h-36 flex items-center justify-center text-slate-400 text-sm">Sin datos en este período</div>
              : <BarChart data={chartData} fmt={fmt} />}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
          <SectionHeader icon={Calendar} iconColor="text-indigo-500" title="Período actual" />
          <div className="p-5 space-y-3">
            {currentPeriod ? (
              <>
                <PeriodRow label="Ingresos" value={currentPeriod.income}  color="text-emerald-600 dark:text-emerald-400" fmt={fmt} />
                <PeriodRow label="Costos"   value={currentPeriod.expense} color="text-rose-600 dark:text-rose-400" fmt={fmt} />
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                  <PeriodRow label="Ganancia" value={currentPeriod.income - currentPeriod.expense}
                    color={(currentPeriod.income - currentPeriod.expense) >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-600 dark:text-red-400'}
                    bold fmt={fmt} />
                </div>
                <p className="text-xs text-slate-400">{currentPeriod.orders.length} entrega{currentPeriod.orders.length !== 1 ? 's' : ''} en este período</p>
              </>
            ) : (
              <p className="text-sm text-slate-400">Sin entregas en este período.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Desglose por período ─────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
        <SectionHeader icon={Layers} iconColor="text-slate-500" title={`Desglose por período — ${PERIOD_LABELS[period]}`} />
        {periodData.length === 0
          ? <div className="p-8 text-center text-slate-400 text-sm">Sin datos registrados aún.</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="thead-row">
                    <th className="th-std">Período</th>
                    <th className="th-std-right">Operaciones</th>
                    <th className="th-std-right">Ingresos</th>
                    <th className="th-std-right">Costos</th>
                    <th className="th-std-right">Ganancia</th>
                    <th className="th-std-right">Margen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[...periodData].reverse().map((d) => {
                    const profit = d.income - d.expense
                    const margin = d.income > 0 ? (profit / d.income) * 100 : 0
                    const { long } = formatPeriodLabel(d.key, period)
                    return (
                      <tr key={d.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-300">{long}</td>
                        <td className="px-5 py-3 text-right text-slate-500">{d.orders.length}</td>
                        <td className="px-5 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">{fmt(d.income)}</td>
                        <td className="px-5 py-3 text-right font-semibold text-rose-500 dark:text-rose-400">{fmt(d.expense)}</td>
                        <td className={`px-5 py-3 text-right font-bold ${profit >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500'}`}>{fmt(profit)}</td>
                        <td className="px-5 py-3 text-right"><MarginBadge margin={margin} /></td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <td className="px-5 py-3 font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">Total</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">{billed.length}</td>
                    <td className="px-5 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{fmt(global.income)}</td>
                    <td className="px-5 py-3 text-right font-bold text-rose-500 dark:text-rose-400">{fmt(global.expense)}</td>
                    <td className={`px-5 py-3 text-right font-bold ${global.profit >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500'}`}>{fmt(global.profit)}</td>
                    <td className="px-5 py-3 text-right"><MarginBadge margin={global.margin} bold /></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
      </div>

      {/* ── Sección 3 cols: Órdenes · Ventas · Inventario ───────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Órdenes de servicio */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
          <SectionHeader icon={Wrench} iconColor="text-purple-500" title="Órdenes de servicio"
            right={<Link to="/orders" className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 flex items-center gap-1">Ver <ChevronRight size={11}/></Link>} />
          <div className="p-4 space-y-0">
            <StatRow label="Órdenes entregadas"    value={ordersStats.count} />
            <StatRow label="Ingresos realizados"   value={fmt(ordersStats.income)}  valueColor="text-emerald-600 dark:text-emerald-400" />
            <StatRow label="Costos de reparación"  value={fmt(ordersStats.expense)} valueColor="text-rose-500" />
            <StatRow label="Ganancia neta"         value={fmt(ordersStats.profit)}  valueColor={ordersStats.profit >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500'} />
            <StatRow label="Margen"                value={`${ordersStats.margin.toFixed(1)}%`} />
            <StatRow label="Ticket promedio"       value={fmt(ordersStats.avgTicket)} />
            <StatRow label="Por cobrar"            value={fmt(ordersStats.pendingIncome)} valueColor="text-amber-600 dark:text-amber-400"
              sub={`${pendingOrders.length} orden${pendingOrders.length !== 1 ? 'es' : ''}`} />
          </div>
        </div>

        {/* Ventas de mostrador */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
          <SectionHeader icon={ShoppingCart} iconColor="text-emerald-500" title="Ventas de mostrador"
            right={<Link to="/sales" className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 flex items-center gap-1">Ver <ChevronRight size={11}/></Link>} />
          <div className="p-4 space-y-0">
            <StatRow label="Ventas cobradas"    value={salesStats.count} />
            <StatRow label="Ingresos"           value={fmt(salesStats.income)}  valueColor="text-emerald-600 dark:text-emerald-400" />
            <StatRow label="Costo de productos" value={fmt(salesStats.expense)} valueColor="text-rose-500" />
            <StatRow label="Ganancia bruta"     value={fmt(salesStats.profit)}  valueColor={salesStats.profit >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500'} />
            <StatRow label="Margen"             value={`${salesStats.margin.toFixed(1)}%`} />
            <StatRow label="Ticket promedio"    value={fmt(salesStats.avgTicket)} />
            <StatRow label="Por cobrar"         value={fmt(salesStats.pendingIncome)} valueColor="text-amber-600 dark:text-amber-400"
              sub={`${pendingSales.length} venta${pendingSales.length !== 1 ? 's' : ''}`} />
          </div>
          {salesStats.top.length > 0 && (
            <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Top ventas</p>
              {salesStats.top.map((s) => (
                <Link key={s.id} to={`/sales/${s.id}`} className="flex items-center justify-between py-1 hover:opacity-80 transition-opacity">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{s.orderNumber}</span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{fmt(s._income)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Inventario */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
          <SectionHeader icon={Package} iconColor="text-violet-500" title="Inventario (stock)"
            right={<Link to="/inventory" className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 flex items-center gap-1">Ver <ChevronRight size={11}/></Link>} />
          <div className="p-4 space-y-0">
            <StatRow label="Total ítems"          value={invStats.total} />
            <StatRow label="Valor de venta"        value={fmt(invStats.totalValue)}   valueColor="text-violet-600 dark:text-violet-400" />
            <StatRow label="Valor de costo"        value={fmt(invStats.costValue)}    valueColor="text-rose-500" />
            <StatRow label="Ganancia potencial"    value={fmt(invStats.potProfit)}    valueColor="text-emerald-600 dark:text-emerald-400" />
            <StatRow label="Ítems con stock bajo"  value={invStats.lowStock}          valueColor={invStats.lowStock > 0 ? 'text-amber-600' : undefined} />
            <StatRow label="Sin stock"             value={invStats.outOfStock}        valueColor={invStats.outOfStock > 0 ? 'text-red-500' : undefined} />
          </div>
          {invStats.outOfStock > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-red-50 dark:bg-red-900/10">
              <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />
              <span className="text-xs text-red-600 dark:text-red-400 font-medium">{invStats.outOfStock} ítem{invStats.outOfStock !== 1 ? 's' : ''} sin stock — posible lucro cesante</span>
            </div>
          )}
          {invStats.byCategory.length > 0 && (
            <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Valor por categoría</p>
              {invStats.byCategory.map((c) => {
                const pct = invStats.totalValue > 0 ? (c.value / invStats.totalValue) * 100 : 0
                return (
                  <div key={c.cat} className="mb-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600 dark:text-slate-400 capitalize">{c.cat}</span>
                      <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">{fmt(c.value)}</span>
                    </div>
                    <MiniBar pct={pct} color="bg-violet-400" />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Servicios ───────────────────────────────────────────────── */}
      {(svcStats.total > 0 || svcStats.byService.length > 0) && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
          <SectionHeader icon={Settings2} iconColor="text-orange-500" title="Servicios" subtitle={`${svcStats.active} activos`}
            right={<Link to="/services" className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 flex items-center gap-1">Ver <ChevronRight size={11}/></Link>} />
          <div className="p-5">
            {svcStats.byService.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Sin servicios facturados en órdenes entregadas aún.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide pb-1 border-b border-slate-100 dark:border-slate-800">
                  <span>Servicio</span>
                  <div className="flex gap-8">
                    <span>Usos</span>
                    <span>Facturado</span>
                  </div>
                </div>
                {svcStats.byService.map((s) => {
                  const pct = svcStats.totalBilled > 0 ? (s.income / svcStats.totalBilled) * 100 : 0
                  return (
                    <div key={s.id}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-[60%]">{s.name}</span>
                        <div className="flex items-center gap-8 flex-shrink-0">
                          <span className="text-xs text-slate-400 w-8 text-center">{s.count}</span>
                          <span className="text-sm font-semibold text-orange-600 dark:text-orange-400 min-w-[5rem] text-right">{fmt(s.income)}</span>
                        </div>
                      </div>
                      <MiniBar pct={pct} color="bg-orange-400" />
                    </div>
                  )
                })}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total facturado</span>
                  <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{fmt(svcStats.totalBilled)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Ganancias por categoría (donut) ─────────────────────────── */}
      {categoryData.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
          <SectionHeader icon={PieIcon} iconColor="text-indigo-500" title="Ganancias netas por categoría de reparación" />
          <div className="p-5">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="w-full lg:w-64 flex-shrink-0">
                <DonutChart segments={categoryData} centerLabel={fmt(global.profit)} hovered={donutHov} onHover={setDonutHov} />
              </div>
              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categoryData.map((cat) => {
                  const isHov = donutHov === cat.key
                  return (
                    <div key={cat.key}
                      className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 cursor-default"
                      style={{ backgroundColor: isHov ? `${cat.color}18` : undefined, boxShadow: isHov ? `inset 0 0 0 1.5px ${cat.color}55` : 'inset 0 0 0 1.5px transparent' }}
                      onMouseEnter={() => setDonutHov(cat.key)} onMouseLeave={() => setDonutHov(null)}>
                      <span className="flex-shrink-0 rounded-full transition-all duration-200"
                        style={{ backgroundColor: cat.color, width: isHov ? '14px' : '10px', height: isHov ? '14px' : '10px' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate transition-colors duration-200" style={{ color: isHov ? cat.color : undefined }}>{cat.label}</p>
                        <p className="text-[10px] text-slate-400">
                          {cat.key === 'otros' ? `${cat.totalOrders} sin categoría` : `${cat.count} orden${cat.count !== 1 ? 'es' : ''}`}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{cat.income > 0 ? fmt(cat.income) : '—'}</p>
                        <p className="text-[10px] font-medium" style={{ color: cat.color }}>{cat.income > 0 ? `${cat.pct.toFixed(1)}%` : 'sin datos'}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Top ingresos globales ────────────────────────────────────── */}
      {topItems.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
          <SectionHeader icon={TrendingUp} iconColor="text-emerald-500" title="Top ingresos globales" subtitle={`${topItems.length} mayores operaciones`} />
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {topItems.map((o) => (
              <Link key={o.id} to={o._type === 'sale' ? `/sales/${o.id}` : `/orders/${o.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-slate-400">{o.orderNumber}</span>
                    {o._type === 'sale'
                      ? <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />Venta</span>
                      : <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"><span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1" />Entregado</span>}
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {o.customerName || '—'}{o._type === 'order' && o.deviceBrand ? ` · ${o.deviceBrand} ${o.deviceModel}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    {o._expense > 0 && <p className="text-xs text-rose-500">− {fmt(o._expense)}</p>}
                    <p className="text-xs text-slate-400">{formatDateShort(o.deliveryDate || o.entryDate)}</p>
                  </div>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 min-w-[5rem] text-right">{fmt(o._income)}</p>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
