/**
 * pages/AdminDashboard.jsx — Panel global de todas las cuentas (solo superadmin).
 *
 * Ruta: /admin/dashboard
 * A diferencia del Dashboard normal (que solo muestra datos del usuario
 * autenticado), este panel consulta directamente Turso para obtener
 * TODAS las órdenes de TODOS los usuarios del sistema.
 * Muestra:
 *  - Métricas globales: total de órdenes, usuarios activos, ingresos totales.
 *  - Lista de órdenes recientes de cualquier usuario con su creador.
 *  - Gráficos de actividad por usuario y por estado.
 */
import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardList, Clock, Wrench, CheckCircle, AlertTriangle, Users, ArrowRight, RefreshCw, ChevronDown, ChevronRight,
  User,
} from 'lucide-react'
import { turso, isTursoConfigured, initDb } from '../lib/turso'
import { StatusBadge } from '../components/StatusBadge'
import { formatDate, STATUS_CONFIG } from '../utils/constants'
import { useCurrency } from '../utils/useCurrency'

async function fetchAllOrders() {
  if (!isTursoConfigured) return []
  try {
    await initDb()
    const res = await turso.execute('SELECT data FROM orders ORDER BY updated_at DESC')
    return res.rows.map((r) => JSON.parse(r.data)).filter(Boolean)
  } catch {
    return []
  }
}

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
        <Icon size={18} className={color} />
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
    </div>
  )
}

function UserSection({ username, orders, fmt }) {
  const [open, setOpen] = useState(true)
  const recent = orders.slice(0, 5)
  const inRepair = orders.filter((o) => o.status === 'in_repair').length
  const pending = orders.filter((o) => o.status === 'pending').length
  const completed = orders.filter((o) => ['completed', 'delivered'].includes(o.status)).length

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
            <User size={14} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-slate-900 dark:text-white text-sm">{username}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {orders.length} {orders.length === 1 ? 'orden' : 'órdenes'} ·{' '}
              {pending} pendiente{pending !== 1 ? 's' : ''} ·{' '}
              {inRepair} en reparación ·{' '}
              {completed} completada{completed !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {open ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
      </button>

      {/* Orders list */}
      {open && (
        <>
          {recent.length === 0 ? (
            <div className="px-5 py-6 text-center text-sm text-slate-400">Sin órdenes</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recent.map((order) => (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {order.customerName || 'Sin nombre'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {order.orderNumber} · {order.deviceBrand} {order.deviceModel}
                      {order.finalPrice ? ` · ${fmt(order.finalPrice)}` : ''}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(order.entryDate)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <StatusBadge status={order.status} />
                    <ArrowRight size={13} className="text-slate-300 dark:text-slate-600" />
                  </div>
                </Link>
              ))}
            </div>
          )}
          {orders.length > 5 && (
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <Link
                to={`/orders?user=${username}`}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-center gap-1"
              >
                Ver las {orders.length - 5} órdenes restantes <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function AdminDashboard() {
  const fmt = useCurrency()
  const [allOrders, setAllOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    const orders = await fetchAllOrders()
    setAllOrders(orders)
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { load() }, [])

  // Group orders by createdBy
  const ordersByUser = useMemo(() => {
    const map = {}
    for (const order of allOrders) {
      const user = order.createdBy || 'admin'
      if (!map[user]) map[user] = []
      map[user].push(order)
    }
    // Sort each user's orders by date desc
    for (const u in map) map[u].sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate))
    return map
  }, [allOrders])

  const userCount = Object.keys(ordersByUser).length

  const globalStats = {
    total: allOrders.length,
    pending: allOrders.filter((o) => o.status === 'pending').length,
    inRepair: allOrders.filter((o) => o.status === 'in_repair').length,
    completed: allOrders.filter((o) => ['completed', 'delivered'].includes(o.status)).length,
    waitingApproval: allOrders.filter((o) => o.status === 'waiting_approval').length,
    diagnosing: allOrders.filter((o) => o.status === 'diagnosing').length,
  }

  const statCards = [
    { label: 'Total Órdenes', value: globalStats.total, icon: ClipboardList, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { label: 'Usuarios activos', value: userCount, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Pendientes', value: globalStats.pending, icon: Clock, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' },
    { label: 'En reparación', value: globalStats.inRepair, icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { label: 'Completadas', value: globalStats.completed, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Esp. aprobación', value: globalStats.waitingApproval, icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Panel Global</h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full">
              SuperAdmin
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Todas las órdenes de todos los usuarios del sistema
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => <StatCard key={card.label} {...card} />)}
      </div>

      {/* Status distribution */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-5">
        <h2 className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Distribución por estado (global)</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const count = allOrders.filter((o) => o.status === key).length
            const pct = allOrders.length > 0 ? (count / allOrders.length) * 100 : 0
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{cfg.label}</span>
                  <span className="text-xs text-slate-500">{count}</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${cfg.dot} transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Orders by user */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Users size={15} className="text-slate-400" />
            Órdenes por usuario
          </h2>
          <span className="text-xs text-slate-400">{userCount} usuario{userCount !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-10 flex items-center justify-center gap-3 text-slate-400">
            <RefreshCw size={16} className="animate-spin" />
            <span className="text-sm">Cargando órdenes...</span>
          </div>
        ) : userCount === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-10 text-center text-slate-400">
            <ClipboardList size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No hay órdenes en el sistema</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(ordersByUser)
              .sort(([, a], [, b]) => b.length - a.length)
              .map(([username, orders]) => (
                <UserSection key={username} username={username} orders={orders} fmt={fmt} />
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
