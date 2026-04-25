/**
 * pages/Dashboard.jsx — Panel principal del taller.
 *
 * Ruta: /
 * Muestra un resumen del estado actual del negocio:
 *  - Tarjetas de métricas: total de órdenes, en reparación, completadas, ingresos del mes.
 *  - Lista de órdenes recientes con estado, dispositivo y cliente.
 *  - Acceso rápido a crear nueva orden y ver todas las órdenes.
 * Los datos se obtienen directamente del store (sin llamadas extra a la DB).
 */
import React from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardList,
  Clock,
  Wrench,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  PlusCircle,
  ArrowRight,
  CalendarClock,
  PackageX,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { StatusBadge } from '../components/StatusBadge'
import { PageLoader } from '../components/PageLoader'
import { formatDate, STATUS_CONFIG } from '../utils/constants'
import { useCurrency } from '../utils/useCurrency'

// ── Helpers de tiempo ────────────────────────────────────────────────────────
function getDeliveryStatus(estimatedDelivery) {
  if (!estimatedDelivery) return null
  const now = new Date()
  // Tratar fecha plain (YYYY-MM-DD) como medianoche local
  const target = /^\d{4}-\d{2}-\d{2}$/.test(estimatedDelivery)
    ? new Date(`${estimatedDelivery}T00:00`)
    : new Date(estimatedDelivery)
  const diffMs = target - now
  const diffHrs = diffMs / (1000 * 60 * 60)
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffMs < 0) {
    const overHrs = Math.abs(diffHrs)
    const overDays = Math.floor(Math.abs(diffDays))
    return {
      type: 'overdue',
      label: overDays >= 1 ? `Atrasado ${overDays}d` : `Atrasado ${Math.ceil(overHrs)}h`,
      detail: overDays >= 1
        ? `${overDays} día${overDays !== 1 ? 's' : ''} de atraso`
        : `${Math.ceil(overHrs)} hora${Math.ceil(overHrs) !== 1 ? 's' : ''} de atraso`,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
      dot: 'bg-red-500',
      border: 'border-red-200 dark:border-red-800',
    }
  } else if (diffHrs <= 48) {
    const hrs = Math.ceil(diffHrs)
    return {
      type: 'soon',
      label: hrs <= 1 ? 'Vence en 1h' : `Vence en ${hrs}h`,
      detail: `${hrs} hora${hrs !== 1 ? 's' : ''} restante${hrs !== 1 ? 's' : ''}`,
      color: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      dot: 'bg-amber-500',
      border: 'border-amber-200 dark:border-amber-800',
    }
  } else {
    const days = Math.ceil(diffDays)
    return {
      type: 'ok',
      label: `${days}d restantes`,
      detail: `${days} día${days !== 1 ? 's' : ''} restante${days !== 1 ? 's' : ''}`,
      color: 'text-green-700 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
      dot: 'bg-green-500',
      border: 'border-green-200 dark:border-green-800',
    }
  }
}

const ACTIVE_STATUSES = ['pending', 'diagnosing', 'waiting_approval', 'in_repair', 'completed', 'irreparable']

export default function Dashboard() {
  const fmt = useCurrency()
  const orders = useStore((s) => s.orders)
  const dataLoading = useStore((s) => s.dataLoading)

  if (dataLoading) return <PageLoader rows={5} title="Cargando órdenes..." />


  const abandonedOrders = orders.filter((o) => o.status === 'abandoned')

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    inRepair: orders.filter((o) => o.status === 'in_repair').length,
    completed: orders.filter((o) => o.status === 'completed').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    waitingApproval: orders.filter((o) => o.status === 'waiting_approval').length,
    diagnosing: orders.filter((o) => o.status === 'diagnosing').length,
    irreparable: orders.filter((o) => o.status === 'irreparable').length,
    abandoned: abandonedOrders.length,
  }

  const recent = orders.slice(0, 5)

  // Órdenes activas con fecha estimada de entrega
  const withDeadline = orders
    .filter((o) => ACTIVE_STATUSES.includes(o.status) && o.estimatedDelivery)
    .map((o) => ({ ...o, _ds: getDeliveryStatus(o.estimatedDelivery) }))
    .filter((o) => o._ds !== null)
    .sort((a, b) => {
      // Ordenar: atrasados primero, luego por fecha más próxima
      const order = { overdue: 0, soon: 1, ok: 2 }
      return (order[a._ds.type] - order[b._ds.type]) ||
        new Date(a.estimatedDelivery) - new Date(b.estimatedDelivery)
    })
    .slice(0, 8)

  const statCards = [
    { label: 'Total órdenes', value: stats.total, icon: ClipboardList, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { label: 'Pendientes', value: stats.pending, icon: Clock, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' },
    { label: 'En reparación', value: stats.inRepair, icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { label: 'Completados', value: stats.completed + stats.delivered, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Esperando aprobación', value: stats.waitingApproval, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Diagnóstico', value: stats.diagnosing, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Vista general del taller</p>
        </div>
        <Link
          to="/orders/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <PlusCircle size={16} />
          Nueva orden
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tiempo restante de entrega */}
      {withDeadline.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center gap-2">
              <CalendarClock size={15} className="text-indigo-500" />
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Tiempo restante para entrega</h2>
            </div>
            <Link to="/orders" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {withDeadline.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${order._ds.dot}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{order.customerName || 'Sin nombre'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{order.orderNumber} · {order.deviceBrand} {order.deviceModel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={order.status} />
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${order._ds.bg} ${order._ds.color} border ${order._ds.border}`}>
                    {order._ds.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent orders */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700/60">
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Órdenes recientes</h2>
            <Link to="/orders" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <ClipboardList size={32} className="mb-2 opacity-40" />
              <p className="text-sm">Sin órdenes aún</p>
              <Link to="/orders/new" className="mt-3 text-xs text-indigo-600 hover:underline">Crear primera orden</Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recent.map((order) => (
                <Link key={order.id} to={`/orders/${order.id}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{order.customerName || 'Sin nombre'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{order.orderNumber} · {order.deviceBrand} {order.deviceModel}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Status distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700/60">
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Distribución por estado</h2>
          </div>
          <div className="p-5 space-y-3">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const count = orders.filter((o) => o.status === key).length
              const pct = orders.length > 0 ? (count / orders.length) * 100 : 0
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{cfg.label}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-500">{count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${cfg.dot} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {orders.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">Sin datos disponibles</p>
            )}
          </div>
        </div>
      </div>

      {/* Órdenes abandonadas */}
      {abandonedOrders.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-zinc-200 dark:border-zinc-700/60 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-700/60 bg-zinc-50 dark:bg-zinc-900/40">
            <div className="flex items-center gap-2">
              <PackageX size={15} className="text-zinc-500" />
              <h2 className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm">
                Órdenes abandonadas
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-semibold">
                {abandonedOrders.length}
              </span>
            </div>
            <Link to="/orders" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {abandonedOrders.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{order.customerName || 'Sin nombre'}</p>
                  <p className="text-xs text-slate-400">{order.orderNumber} · {order.deviceBrand} {order.deviceModel}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-slate-400">{order.customerPhone || '—'}</span>
                  <StatusBadge status={order.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
