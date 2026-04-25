/**
 * pages/DeviceModelDetail.jsx — Detalle de órdenes por modelo de dispositivo.
 *
 * Ruta: /devices/:slug (slug = brand-model en kebab-case)
 * Muestra todas las órdenes del usuario que corresponden a ese modelo con:
 *  - Métricas: total, completadas, en progreso, ingresos generados.
 *  - Historial de precios (promedio estimado y final).
 *  - Lista de órdenes con acceso directo al detalle.
 */
import React, { useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Smartphone, Hash, BarChart2, TrendingUp,
  CheckCircle2, XCircle, Wrench, ChevronRight,
  DollarSign, AlertTriangle,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { DEVICE_TYPES, STATUS_CONFIG, formatDateShort } from '../utils/constants'
import { useCurrency } from '../utils/useCurrency'

export default function DeviceModelDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const orders = useStore((s) => s.orders)
  const fmt = useCurrency()

  const decoded = decodeURIComponent(slug || '')
  const [brand, model] = decoded.split('__')

  // All orders for this brand+model
  const modelOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        (o.deviceBrand || '').trim() === brand &&
        (o.deviceModel || '').trim() === model
    )
  }, [orders, brand, model])

  // ── Statistics ────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = modelOrders.length
    const active = modelOrders.filter((o) => !['delivered', 'irreparable'].includes(o.status)).length
    const completed = modelOrders.filter((o) => ['completed', 'delivered'].includes(o.status)).length
    const irreparable = modelOrders.filter((o) => o.status === 'irreparable').length

    const statusCounts = {}
    for (const o of modelOrders) {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1
    }

    const revenues = modelOrders
      .map((o) => parseFloat(o.finalPrice || o.estimatedPrice || 0))
      .filter((n) => !isNaN(n) && n > 0)
    const totalRevenue = revenues.reduce((a, b) => a + b, 0)
    const avgRevenue = revenues.length ? totalRevenue / revenues.length : 0

    const waterDamage = modelOrders.filter((o) => o.waterDamage).length
    const physicalDamage = modelOrders.filter((o) => o.physicalDamage).length
    const previouslyOpened = modelOrders.filter((o) => o.previouslyOpened).length

    return {
      total, active, completed, irreparable,
      statusCounts, totalRevenue, avgRevenue,
      waterDamage, physicalDamage, previouslyOpened,
    }
  }, [modelOrders])

  // ── Group by serial / IMEI / id ───────────────────────────────────────────
  const deviceGroups = useMemo(() => {
    const withSerial = []
    const withoutSerial = []

    for (const o of modelOrders) {
      const serial = (o.deviceSerial || '').trim()
      if (serial) {
        withSerial.push(o)
      } else {
        withoutSerial.push(o)
      }
    }

    // Group by serial
    const serialMap = {}
    for (const o of withSerial) {
      const key = o.deviceSerial.trim()
      if (!serialMap[key]) serialMap[key] = []
      serialMap[key].push(o)
    }

    // Sort each group newest first
    for (const key of Object.keys(serialMap)) {
      serialMap[key].sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate))
    }

    // Sort groups: most orders first
    const groups = Object.entries(serialMap)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([serial, grpOrders]) => ({ serial, orders: grpOrders }))

    // Orders without serial go as individual entries
    withoutSerial.sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate))

    return { groups, withoutSerial }
  }, [modelOrders])

  const deviceTypeLabel = DEVICE_TYPES.find((d) =>
    d.value === (modelOrders[0]?.deviceType)
  )?.label || ''

  if (modelOrders.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-64 text-slate-400">
        <Smartphone size={32} className="mb-3 opacity-30" />
        <p className="font-medium">Modelo no encontrado</p>
        <button
          onClick={() => navigate('/devices')}
          className="mt-3 text-sm text-indigo-600 hover:underline"
        >
          Volver a Devices
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/devices')}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mb-1">
            <Link to="/devices" className="hover:text-indigo-500 transition-colors">Devices</Link>
            <ChevronRight size={12} />
            <span>{brand || 'Sin marca'}</span>
            <ChevronRight size={12} />
            <span className="text-slate-600 dark:text-slate-300">{model || 'Sin modelo'}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {brand && model ? `${brand} ${model}` : brand || model || 'Dispositivo'}
          </h1>
          {deviceTypeLabel && (
            <p className="text-sm text-slate-500 dark:text-slate-400">{deviceTypeLabel}</p>
          )}
        </div>
      </div>

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total órdenes', value: stats.total, icon: BarChart2, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { label: 'En proceso', value: stats.active, icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
          { label: 'Completados', value: stats.completed, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Sin reparación', value: stats.irreparable, icon: XCircle, color: 'text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={16} className={color} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 dark:text-white leading-none">{value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Detailed stats ── */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Status breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-indigo-500" />
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Distribución de estados</h2>
          </div>
          <div className="space-y-2.5">
            {Object.entries(stats.statusCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => {
                const cfg = STATUS_CONFIG[status] || { label: status, dot: 'bg-slate-400' }
                const pct = Math.round((count / stats.total) * 100)
                return (
                  <div key={status}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        <span className="text-xs text-slate-600 dark:text-slate-400">{cfg.label}</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{count}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-1.5 rounded-full ${cfg.dot}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Revenue + damage */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={14} className="text-indigo-500" />
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Ingresos (ARS)</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Total facturado</p>
                <p className="text-base font-bold text-slate-900 dark:text-white">{fmt(stats.totalRevenue)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Promedio por orden</p>
                <p className="text-base font-bold text-slate-900 dark:text-white">{fmt(stats.avgRevenue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} className="text-indigo-500" />
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Daños frecuentes</h2>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Daño por agua', value: stats.waterDamage, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
                { label: 'Daño físico', value: stats.physicalDamage, color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' },
                { label: 'Abierto anteriormente', value: stats.previouslyOpened, color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
                    {value} ({stats.total ? Math.round((value / stats.total) * 100) : 0}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Dispositivos (grouped by serial/IMEI) ── */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Hash size={16} className="text-indigo-500" />
          Dispositivos
        </h2>

        <div className="space-y-4">
          {deviceGroups.groups.map(({ serial, orders: grpOrders }) => (
            <DeviceGroup key={serial} serial={serial} grpOrders={grpOrders} />
          ))}

          {/* Orders without serial — each shown as individual card */}
          {deviceGroups.withoutSerial.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Smartphone size={13} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sin número de serie</p>
                    <p className="text-xs text-slate-400">{deviceGroups.withoutSerial.length} orden{deviceGroups.withoutSerial.length !== 1 ? 'es' : ''}</p>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {deviceGroups.withoutSerial.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </div>
            </div>
          )}

          {deviceGroups.groups.length === 0 && deviceGroups.withoutSerial.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">Sin dispositivos agrupados.</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DeviceGroup({ serial, grpOrders }) {
  const latest = grpOrders[0]
  const activeOrder = grpOrders.find((o) => !['delivered', 'irreparable'].includes(o.status))

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
      {/* Group header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
            <Smartphone size={13} className="text-indigo-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-900 dark:text-white font-mono">{serial}</p>
              {activeOrder && (
                <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                  <Wrench size={10} />
                  Activo
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {grpOrders.length} orden{grpOrders.length !== 1 ? 'es' : ''} · Cliente: {latest.customerName || '—'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Último ingreso</p>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{formatDateShort(latest.entryDate)}</p>
        </div>
      </div>

      {/* Order rows */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {grpOrders.map((order) => (
          <OrderRow key={order.id} order={order} />
        ))}
      </div>
    </div>
  )
}

function OrderRow({ order }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending

  return (
    <Link
      to={`/orders/${order.id}`}
      className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5 mb-0.5">
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{order.orderNumber}</span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1.5`} />
            {cfg.label}
          </span>
        </div>
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{order.customerName || '—'}</p>
        {order.reportedIssue && (
          <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{order.reportedIssue}</p>
        )}
      </div>
      <div className="flex items-center gap-3 ml-4 flex-shrink-0">
        <div className="hidden sm:block text-right">
          <p className="text-xs text-slate-400">{formatDateShort(order.entryDate)}</p>
          {(order.finalPrice || order.estimatedPrice) && (
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {fmt(order.finalPrice || order.estimatedPrice)}
            </p>
          )}
        </div>
        <ChevronRight size={15} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" />
      </div>
    </Link>
  )
}
