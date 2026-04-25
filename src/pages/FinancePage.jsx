/**
 * pages/FinancePage.jsx — Módulo financiero del taller.
 *
 * Ruta: /finance
 * Calcula y muestra indicadores financieros a partir de las órdenes:
 *  - Ingresos totales, del mes actual y del mes anterior.
 *  - Costos de reparación y margen de ganancia.
 *  - Gráfico/listado de ingresos por mes.
 *  - Desglose por estado de presupuesto (aprobados, rechazados, pendientes).
 *  - Filtro por rango de fechas.
 * No persiste datos propios: todo se calcula sobre las órdenes del store.
 */
import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, DollarSign, Percent,
  Calendar, ChevronRight, ArrowUpRight, ArrowDownRight,
  Clock, Info, PieChart as PieIcon,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { PageLoader } from '../components/PageLoader'
import { formatDateShort, STATUS_CONFIG } from '../utils/constants'
import { useCurrency } from '../utils/useCurrency'

// ── Categorías de reparación ──────────────────────────────────────────────────
const REPAIR_CATEGORIES = [
  { key: 'pantalla',    label: 'Pantalla',       color: '#6366f1', keywords: ['pantalla', 'display', 'lcd', 'screen', 'touch', 'tactil', 'táctil', 'vidrio', 'glass'] },
  { key: 'bateria',     label: 'Batería',         color: '#10b981', keywords: ['bateria', 'batería', 'battery', 'carga rapida', 'no carga', 'no enciende'] },
  { key: 'pin_carga',   label: 'Pin de carga',    color: '#f59e0b', keywords: ['pin', 'puerto', 'carga', 'charging', 'usb', 'tipo c', 'type c', 'conector'] },
  { key: 'boton',       label: 'Botón',           color: '#ef4444', keywords: ['boton', 'botón', 'button', 'power', 'volumen', 'home', 'encendido'] },
  { key: 'corto',       label: 'Corto / Líquido', color: '#8b5cf6', keywords: ['corto', 'liquido', 'líquido', 'agua', 'humedad', 'mojado', 'oxidacion', 'oxido'] },
  { key: 'reballing',   label: 'Reballing',       color: '#ec4899', keywords: ['reballing', 'reball', 'micro', 'chip', 'soldadura', 'placa', 'board'] },
  { key: 'camara',      label: 'Cámara',          color: '#14b8a6', keywords: ['camara', 'cámara', 'camera', 'lente', 'foto', 'flash'] },
  { key: 'audio',       label: 'Audio / Bocina',  color: '#f97316', keywords: ['audio', 'bocina', 'speaker', 'microfono', 'micrófono', 'auricular', 'sonido'] },
  { key: 'software',    label: 'Software',        color: '#06b6d4', keywords: ['software', 'sistema', 'formateo', 'formato', 'flasheo', 'virus', 'actualiz', 'unlock', 'desbloqueo'] },
  { key: 'otros',       label: 'Otros',           color: '#94a3b8', keywords: [] },
]

function classifyRepair(order) {
  const text = `${order.reportedIssue || ''} ${order.workDone || ''} ${order.technicianNotes || ''}`.toLowerCase()
  for (const cat of REPAIR_CATEGORIES) {
    if (cat.key === 'otros') continue
    if (cat.keywords.some((kw) => text.includes(kw))) return cat.key
  }
  return 'otros'
}

// ── Donut Chart (pure SVG, con hover) ────────────────────────────────────────
function DonutChart({ segments, centerLabel, hovered, onHover }) {
  const R       = 78
  const RHov    = 84
  const stroke  = 22
  const strokeH = 28
  const circumference = 2 * Math.PI * R
  const circumferenceH = 2 * Math.PI * RHov
  let offset = 0

  // Precalcula offsets antes de renderizar
  const segs = segments.map((seg) => {
    const start = offset
    offset += seg.pct
    return { ...seg, start }
  })

  const hovSeg = hovered != null ? segs.find((s) => s.key === hovered) : null

  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[220px] mx-auto" style={{ overflow: 'visible' }}>
      {/* fondo del anillo */}
      <circle cx="100" cy="100" r={R} fill="none" stroke="#e2e8f0" strokeWidth={stroke} opacity="0.5" />

      {/* segmentos normales (opacos si hay hover en otro) */}
      {segs.map((seg) => {
        const isHov = hovered === seg.key
        const r   = isHov ? RHov : R
        const sw  = isHov ? strokeH : stroke
        const circ = 2 * Math.PI * r
        const dash = (seg.pct / 100) * circ
        const gap  = circ - dash
        const dashOffset = -(seg.start / 100) * circ + circ * 0.25
        return (
          <circle
            key={seg.key}
            cx="100" cy="100" r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={sw}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="butt"
            opacity={hovered != null && !isHov ? 0.25 : 1}
            style={{ transition: 'all 0.22s cubic-bezier(.4,0,.2,1)', cursor: 'pointer' }}
            onMouseEnter={() => onHover(seg.key)}
            onMouseLeave={() => onHover(null)}
          />
        )
      })}

      {/* texto central */}
      {hovSeg ? (
        <>
          <text x="100" y="90" textAnchor="middle" fontSize="9" fontWeight="700" fill={hovSeg.color}>
            {hovSeg.label}
          </text>
          <text x="100" y="104" textAnchor="middle" fontSize="11" fontWeight="700" fill={hovSeg.color}>
            {hovSeg.pct.toFixed(1)}%
          </text>
          <text x="100" y="117" textAnchor="middle" fontSize="8" fill="#94a3b8">
            {hovSeg.income > 0 ? `$${hovSeg.income.toLocaleString('es')}` : 'sin ingresos'}
          </text>
        </>
      ) : (
        <>
          <text x="100" y="97" textAnchor="middle" fontSize="11" fontWeight="600" fill="#475569">
            {centerLabel}
          </text>
          <text x="100" y="112" textAnchor="middle" fontSize="9" fill="#94a3b8">
            Ganancias
          </text>
        </>
      )}
    </svg>
  )
}

// ── Sección dona con hover compartido ────────────────────────────────────────
function DonutSection({ categoryData, fmt, globalProfit }) {
  const [hovered, setHovered] = useState(null)
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <PieIcon size={14} className="text-indigo-500" />
        <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Ganancias netas por categoría</h2>
      </div>
      <div className="p-5">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Donut SVG */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <DonutChart
              segments={categoryData}
              centerLabel={fmt(globalProfit)}
              hovered={hovered}
              onHover={setHovered}
            />
          </div>
          {/* Leyenda */}
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
            {categoryData.map((cat) => {
              const isHov = hovered === cat.key
              return (
                <div
                  key={cat.key}
                  className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 cursor-default"
                  style={{
                    backgroundColor: isHov ? `${cat.color}18` : undefined,
                    boxShadow: isHov ? `inset 0 0 0 1.5px ${cat.color}55` : 'inset 0 0 0 1.5px transparent',
                  }}
                  onMouseEnter={() => setHovered(cat.key)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <span
                    className="flex-shrink-0 rounded-full transition-all duration-200"
                    style={{
                      backgroundColor: cat.color,
                      width:  isHov ? '14px' : '10px',
                      height: isHov ? '14px' : '10px',
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-semibold truncate transition-colors duration-200"
                      style={{ color: isHov ? cat.color : undefined }}
                    >
                      {cat.label}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {cat.key === 'otros'
                        ? `${cat.totalOrders} orden${cat.totalOrders !== 1 ? 'es' : ''} sin categoría`
                        : `${cat.count} orden${cat.count !== 1 ? 'es' : ''}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {cat.income > 0 ? fmt(cat.income) : '—'}
                    </p>
                    <p className="text-[10px] font-medium" style={{ color: cat.color }}>
                      {cat.income > 0 ? `${cat.pct.toFixed(1)}%` : 'sin datos'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── helpers ───────────────────────────────────────────────────────────────────

const n = (v) => { const p = parseFloat(v); return isNaN(p) ? 0 : p }

// Una orden cuenta financieramente SOLO si fue entregada al cliente (status = 'delivered').
// Ese estado equivale a "completada Y entregada" en este sistema.
// Las órdenes 'abandoned' quedan excluidas al no cumplir ninguna de estas condiciones.
const isDelivered = (o) => o.status === 'delivered'

// Órdenes completadas pero pendientes de entrega (ingreso potencial, no realizado)
const isCompleted = (o) => o.status === 'completed'

function getYear(iso)  { return iso ? new Date(iso).getFullYear() : null }
function getMonth(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function getDay(iso) { return iso ? iso.slice(0, 10) : null }

// Para agrupar por fecha usamos deliveryDate en órdenes delivered
function getPeriodDate(o, period) {
  const ref = o.deliveryDate || o.entryDate
  if (period === 'daily')   return getDay(ref)
  if (period === 'monthly') return getMonth(ref)
  return getYear(ref)
}

function formatPeriodLabel(key, period) {
  const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const MONTHS_LONG  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
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

// ── bar chart (pure CSS) ──────────────────────────────────────────────────────
function BarChart({ data, fmt }) {
  if (!data.length) return null
  const safeMax = Math.max(...data.map((d) => Math.max(d.income, d.expense)), 1)

  return (
    <div className="flex items-end gap-1 h-36 w-full">
      {data.map((d, i) => {
        const incPct = Math.round((d.income  / safeMax) * 100)
        const expPct = Math.round((d.expense / safeMax) * 100)
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative min-w-0">
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
              <div className="bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-xl">
                <p className="font-semibold mb-0.5">{d.label}</p>
                <p className="text-emerald-300">↑ {fmt(d.income)}</p>
                <p className="text-rose-300">↓ {fmt(d.expense)}</p>
                <p className="text-slate-300 border-t border-slate-600 mt-0.5 pt-0.5">= {fmt(d.income - d.expense)}</p>
              </div>
              <div className="w-2 h-2 bg-slate-800 dark:bg-slate-700 rotate-45 -mt-1" />
            </div>
            {/* Bars */}
            <div className="flex items-end gap-0.5 w-full h-32">
              <div
                className="flex-1 rounded-t-sm bg-emerald-400 dark:bg-emerald-500 transition-all duration-300"
                style={{ height: `${incPct}%`, minHeight: incPct > 0 ? 2 : 0 }}
              />
              <div
                className="flex-1 rounded-t-sm bg-rose-400 dark:bg-rose-500 transition-all duration-300"
                style={{ height: `${expPct}%`, minHeight: expPct > 0 ? 2 : 0 }}
              />
            </div>
            <span className="text-[9px] text-slate-400 truncate w-full text-center leading-none">{d.shortLabel}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function FinancePage() {
  const fmt = useCurrency()
  const orders = useStore((s) => s.orders)
  const sales  = useStore((s) => s.sales)
  const dataLoading = useStore((s) => s.dataLoading)
  const [period, setPeriod] = useState('monthly')

  // ── Partición de órdenes ──────────────────────────────────────────────────
  // Contabilizadas: órdenes ENTREGADAS + ventas PAGADAS
  // Pendientes:     órdenes completadas aún no entregadas + ventas pendientes
  const { billed, pending: pendingOrders } = useMemo(() => {
    const billed  = []
    const pending = []

    for (const o of orders) {
      if (isDelivered(o)) {
        billed.push({
          ...o,
          _income:  n(o.finalPrice) || n(o.estimatedPrice),
          _expense: n(o.repairCost),
          _type: 'order',
        })
      } else if (isCompleted(o)) {
        pending.push({
          ...o,
          _income:  n(o.finalPrice) || n(o.estimatedPrice),
          _expense: n(o.repairCost),
          _type: 'order',
        })
      }
    }

    for (const s of sales) {
      const income  = n(s.total) || (s.items || []).reduce((a, i) => a + n(i.price) * (i.qty || 1), 0)
      const expense = (s.items || []).reduce((a, i) => a + n(i.cost) * (i.qty || 1), 0)
      if (s.status === 'paid') {
        billed.push({
          ...s,
          _income:  income,
          _expense: expense,
          _type: 'sale',
          // normalizar campos para compatibilidad con funciones de período
          deliveryDate: s.createdAt,
          entryDate:    s.createdAt,
          orderNumber:  s.saleNumber,
          customerName: s.customerName || '',
        })
      } else if (s.status === 'pending') {
        pending.push({
          ...s,
          _income:  income,
          _expense: expense,
          _type: 'sale',
          deliveryDate: s.createdAt,
          entryDate:    s.createdAt,
          orderNumber:  s.saleNumber,
          customerName: s.customerName || '',
        })
      }
    }

    return { billed, pending }
  }, [orders, sales])

  // ── Global summary (solo billed) ──────────────────────────────────────────
  const global = useMemo(() => {
    const income  = billed.reduce((s, o) => s + o._income,  0)
    const expense = billed.reduce((s, o) => s + o._expense, 0)
    const profit  = income - expense
    const margin  = income > 0 ? (profit / income) * 100 : 0
    const pendingIncome = pendingOrders.reduce((s, o) => s + o._income, 0)
    return { income, expense, profit, margin, pendingIncome }
  }, [billed, pendingOrders])

  // ── Period grouping (agrupado por deliveryDate) ───────────────────────────
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

  // ── Chart data (last N periods) ───────────────────────────────────────────
  const chartData = useMemo(() => {
    const sliced = period === 'daily'
      ? periodData.slice(-30)
      : period === 'monthly'
        ? periodData.slice(-12)
        : periodData

    return sliced.map((d) => {
      const { short, long } = formatPeriodLabel(d.key, period)
      return { ...d, shortLabel: short, label: long }
    })
  }, [periodData, period])

  // ── Current vs previous period ────────────────────────────────────────────
  const currentPeriod = chartData[chartData.length - 1]
  const prevPeriod    = chartData[chartData.length - 2]

  function pctDelta(curr, prev, field) {
    if (!curr || !prev || prev[field] === 0) return null
    return ((curr[field] - prev[field]) / prev[field]) * 100
  }

  // ── Top orders by income ──────────────────────────────────────────────────
  const topOrders = useMemo(() => {
    return [...billed]
      .filter((o) => o._income > 0)
      .sort((a, b) => b._income - a._income)
      .slice(0, 8)
  }, [billed])

  // ── Ganancias por categoría de reparación ─────────────────────────────────
  const categoryData = useMemo(() => {
    const map = {}
    for (const cat of REPAIR_CATEGORIES) map[cat.key] = { ...cat, income: 0, count: 0, totalOrders: 0 }
    for (const o of billed) {
      const key = classifyRepair(o)
      map[key].totalOrders += 1
      const profit = o._income - o._expense
      if (profit > 0) {
        map[key].income += profit
        map[key].count  += 1
      }
    }
    const totalProfit = Object.values(map).reduce((s, c) => s + c.income, 0)
    return Object.values(map)
      .filter((c) => c.income > 0 || (c.key === 'otros' && c.totalOrders > 0))
      .sort((a, b) => b.income - a.income)
      .map((c) => ({ ...c, pct: totalProfit > 0 ? (c.income / totalProfit) * 100 : 0 }))
  }, [billed])

  if (dataLoading) return <PageLoader rows={5} title="Cargando finanzas..." />

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Finanzas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Órdenes <span className="font-medium text-purple-600 dark:text-purple-400">entregadas</span> + ventas <span className="font-medium text-emerald-600 dark:text-emerald-400">pagadas</span>
          </p>
        </div>
        {/* Period selector */}
        <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-sm bg-white dark:bg-slate-900 shadow-sm">
          {['daily', 'monthly', 'annual'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 font-medium transition-colors ${
                period === p
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Criterio visible ── */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40 text-xs text-indigo-700 dark:text-indigo-300">
        <Info size={14} className="flex-shrink-0 mt-0.5" />
        <span>
          Los ingresos incluyen órdenes con estado <strong>Entregado</strong> y ventas con estado <strong>Pagado</strong>.
          Órdenes canceladas, sin reparación o en proceso y ventas canceladas no se contabilizan.
          {global.pendingIncome > 0 && (
            <> Hay <strong>{fmt(global.pendingIncome)}</strong> en órdenes completadas sin entregar y ventas pendientes.</>
          )}
        </span>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Ingresos realizados"
          value={fmt(global.income)}
          icon={TrendingUp}
          iconColor="text-emerald-500"
          bg="bg-emerald-50 dark:bg-emerald-900/20"
          delta={pctDelta(currentPeriod, prevPeriod, 'income')}
          subtitle={`${billed.filter(b => b._type === 'order').length} órdenes · ${billed.filter(b => b._type === 'sale').length} ventas`}
        />
        <KpiCard
          label="Costos de reparación"
          value={fmt(global.expense)}
          icon={TrendingDown}
          iconColor="text-rose-500"
          bg="bg-rose-50 dark:bg-rose-900/20"
          delta={pctDelta(currentPeriod, prevPeriod, 'expense')}
          deltaInverted
          subtitle="Solo órdenes entregadas"
        />
        <KpiCard
          label="Ganancia neta"
          value={fmt(global.profit)}
          icon={DollarSign}
          iconColor={global.profit >= 0 ? 'text-indigo-500' : 'text-red-500'}
          bg={global.profit >= 0 ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-red-50 dark:bg-red-900/20'}
          subtitle="Ingresos − Costos"
        />
        <KpiCard
          label="Margen de ganancia"
          value={`${global.margin.toFixed(1)}%`}
          icon={Percent}
          iconColor="text-violet-500"
          bg="bg-violet-50 dark:bg-violet-900/20"
          subtitle="Sobre ingresos realizados"
        />
      </div>

      {/* ── Ingreso pendiente (completadas no entregadas) ── */}
      {pendingOrders.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800/50 overflow-hidden">
          <div className="px-5 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-amber-500" />
              <h2 className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
                Ingreso pendiente — sin cobrar
              </h2>
            </div>
            <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
              {fmt(global.pendingIncome)}
            </span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {pendingOrders.slice(0, 5).map((o) => (
              <Link
                key={o.id}
                to={o._type === 'sale' ? `/sales/${o.id}` : `/orders/${o.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">{o.orderNumber}</span>
                    {o._type === 'sale' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium">Venta</span>
                    )}
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
            {pendingOrders.length > 5 && (
              <div className="px-5 py-2.5 text-xs text-slate-400 text-center">
                +{pendingOrders.length - 5} más
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Chart + period summary ── */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">
              Ingresos vs Gastos — {PERIOD_LABELS[period]}
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />Ingresos</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block" />Gastos</span>
            </div>
          </div>
          {chartData.length === 0 ? (
            <div className="h-36 flex items-center justify-center text-slate-400 text-sm">
              Sin órdenes entregadas aún
            </div>
          ) : (
            <BarChart data={chartData} fmt={fmt} />
          )}
        </div>

        {/* Current period summary */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-5 space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Calendar size={14} className="text-indigo-500" />
            Período actual
          </h2>
          {currentPeriod ? (
            <div className="space-y-3">
              <PeriodRow label="Ingresos"     value={currentPeriod.income}  color="text-emerald-600 dark:text-emerald-400" fmt={fmt} />
              <PeriodRow label="Costos"       value={currentPeriod.expense} color="text-rose-600 dark:text-rose-400" fmt={fmt} />
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <PeriodRow
                  label="Ganancia"
                  value={currentPeriod.income - currentPeriod.expense}
                  color={(currentPeriod.income - currentPeriod.expense) >= 0
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-red-600 dark:text-red-400'}
                  bold
                  fmt={fmt}
                />
              </div>
              <p className="text-xs text-slate-400">
                {currentPeriod.orders.length} entrega{currentPeriod.orders.length !== 1 ? 's' : ''} en este período
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Sin entregas en este período.</p>
          )}
        </div>
      </div>

      {/* ── Period breakdown table ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white text-sm">
            Desglose por período — {PERIOD_LABELS[period]}
          </h2>
        </div>
        {periodData.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">Sin órdenes entregadas registradas.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="thead-row">
                  <th className="th-std">Período</th>
                  <th className="th-std-right">Entregas</th>
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
                      <td className={`px-5 py-3 text-right font-bold ${profit >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500'}`}>
                        {fmt(profit)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <MarginBadge margin={margin} />
                      </td>
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
                  <td className={`px-5 py-3 text-right font-bold ${global.profit >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500'}`}>
                    {fmt(global.profit)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <MarginBadge margin={global.margin} bold />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ── Ganancias por categoría (donut) ── */}
      {categoryData.length > 0 && (
        <DonutSection categoryData={categoryData} fmt={fmt} globalProfit={global.profit} />
      )}

      {/* ── Top orders by income ── */}
      {topOrders.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Top ingresos</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {topOrders.map((o) => (
              <Link
                key={o.id}
                to={o._type === 'sale' ? `/sales/${o.id}` : `/orders/${o.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-slate-400">{o.orderNumber}</span>
                    {o._type === 'sale' ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
                        Venta
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1" />
                        Entregado
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {o.customerName || '—'}{o._type === 'order' && o.deviceBrand ? ` · ${o.deviceBrand} ${o.deviceModel}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    {o._expense > 0 && (
                      <p className="text-xs text-rose-500">− {fmt(o._expense)}</p>
                    )}
                    <p className="text-xs text-slate-400">{formatDateShort(o.deliveryDate || o.entryDate)}</p>
                  </div>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 min-w-[5rem] text-right">
                    {fmt(o._income)}
                  </p>
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

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon: Icon, iconColor, bg, delta, deltaInverted, subtitle }) {
  const positive = deltaInverted ? (delta !== null && delta <= 0) : (delta !== null && delta >= 0)
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={16} className={iconColor} />
        </div>
        {delta !== null && (
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

function PeriodRow({ label, value, color, bold, fmt }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`text-sm ${color} ${bold ? 'font-bold' : 'font-semibold'}`}>{fmt(value)}</span>
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
