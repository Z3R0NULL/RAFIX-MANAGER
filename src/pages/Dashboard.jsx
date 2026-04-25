/**
 * pages/Dashboard.jsx — Vista general del taller.
 * Muestra métricas clave de todas las secciones del sistema.
 */
import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardList, Clock, Wrench, CheckCircle, AlertTriangle,
  PlusCircle, ArrowRight, CalendarClock, PackageX,
  Users, Package, ShoppingCart, Truck, Settings2,
  TrendingUp, TrendingDown, AlertCircle, BarChart3,
  Boxes, Star,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { StatusBadge } from '../components/StatusBadge'
import { PageLoader } from '../components/PageLoader'
import { STATUS_CONFIG } from '../utils/constants'
import { useCurrency } from '../utils/useCurrency'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDeliveryStatus(estimatedDelivery) {
  if (!estimatedDelivery) return null
  const now = new Date()
  const target = /^\d{4}-\d{2}-\d{2}$/.test(estimatedDelivery)
    ? new Date(`${estimatedDelivery}T00:00`)
    : new Date(estimatedDelivery)
  const diffMs  = target - now
  const diffHrs = diffMs / (1000 * 60 * 60)
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  if (diffMs < 0) {
    const overDays = Math.floor(Math.abs(diffDays))
    const overHrs  = Math.abs(diffHrs)
    return {
      type: 'overdue',
      label: overDays >= 1 ? `Atrasado ${overDays}d` : `Atrasado ${Math.ceil(overHrs)}h`,
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
      color: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      dot: 'bg-emerald-500',
      border: 'border-emerald-200 dark:border-emerald-800',
    }
  }
}

const ACTIVE_STATUSES = ['pending', 'diagnosing', 'waiting_approval', 'in_repair', 'completed', 'irreparable']

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, iconColor, to, children, action }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Icon size={14} className={iconColor} />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{title}</span>
        </div>
        {to && (
          <Link to={to} className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 transition-colors">
            {action || 'Ver todo'} <ArrowRight size={11} />
          </Link>
        )}
      </div>
      <div className="flex-1 p-4">{children}</div>
    </div>
  )
}

function KpiRow({ label, value, sub, color = 'text-slate-900 dark:text-white' }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <div className="text-right">
        <span className={`text-sm font-semibold ${color}`}>{value}</span>
        {sub && <span className="block text-[10px] text-slate-400 leading-none">{sub}</span>}
      </div>
    </div>
  )
}

function MiniBar({ pct, color }) {
  return (
    <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-0.5">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const fmt       = useCurrency()
  const orders    = useStore((s) => s.orders)
  const clients   = useStore((s) => s.clients)
  const inventory = useStore((s) => s.inventory)
  const sales     = useStore((s) => s.sales)
  const suppliers = useStore((s) => s.suppliers)
  const services  = useStore((s) => s.services)
  const dataLoading = useStore((s) => s.dataLoading)

  if (dataLoading) return <PageLoader rows={6} title="Cargando dashboard..." />

  // ── Órdenes ──────────────────────────────────────────────────────────────
  const orderStats = useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    return {
      total:           orders.length,
      pending:         orders.filter((o) => o.status === 'pending').length,
      inRepair:        orders.filter((o) => o.status === 'in_repair').length,
      diagnosing:      orders.filter((o) => o.status === 'diagnosing').length,
      waitingApproval: orders.filter((o) => o.status === 'waiting_approval').length,
      completed:       orders.filter((o) => o.status === 'completed').length,
      delivered:       orders.filter((o) => o.status === 'delivered').length,
      irreparable:     orders.filter((o) => o.status === 'irreparable').length,
      abandoned:       orders.filter((o) => o.status === 'abandoned').length,
      thisMonth:       orders.filter((o) => o.entryDate && new Date(o.entryDate) >= startOfMonth).length,
    }
  }, [orders])

  const withDeadline = useMemo(() => orders
    .filter((o) => ACTIVE_STATUSES.includes(o.status) && o.estimatedDelivery)
    .map((o) => ({ ...o, _ds: getDeliveryStatus(o.estimatedDelivery) }))
    .filter((o) => o._ds !== null)
    .sort((a, b) => {
      const rank = { overdue: 0, soon: 1, ok: 2 }
      return (rank[a._ds.type] - rank[b._ds.type]) || new Date(a.estimatedDelivery) - new Date(b.estimatedDelivery)
    })
    .slice(0, 6), [orders])

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders])

  // ── Clientes ─────────────────────────────────────────────────────────────
  const clientStats = useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const withPhone = clients.filter((c) => c.phone).length
    const thisMonth = clients.filter((c) => c.createdAt && new Date(c.createdAt) >= startOfMonth).length
    return { total: clients.length, withPhone, thisMonth }
  }, [clients])

  // ── Inventario ───────────────────────────────────────────────────────────
  const invStats = useMemo(() => {
    const total      = inventory.length
    const lowStock   = inventory.filter((i) => i.stock !== undefined && i.minStock !== undefined && i.stock > 0 && i.stock <= i.minStock).length
    const outOfStock = inventory.filter((i) => (i.stock ?? 0) === 0).length
    const totalValue = inventory.reduce((acc, i) => acc + ((i.price || 0) * (i.stock || 0)), 0)
    const topLow     = inventory
      .filter((i) => i.stock !== undefined && i.minStock !== undefined && i.stock <= i.minStock)
      .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
      .slice(0, 3)
    return { total, lowStock, outOfStock, totalValue, topLow }
  }, [inventory])

  // ── Ventas ───────────────────────────────────────────────────────────────
  const salesStats = useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonth = sales.filter((s) => s.createdAt && new Date(s.createdAt) >= startOfMonth)
    const totalRevenue = sales.reduce((acc, s) => acc + (parseFloat(s.total) || 0), 0)
    const monthRevenue = thisMonth.reduce((acc, s) => acc + (parseFloat(s.total) || 0), 0)
    const recentSales  = sales.slice(0, 4)
    return { total: sales.length, thisMonth: thisMonth.length, totalRevenue, monthRevenue, recentSales }
  }, [sales])

  // ── Servicios ────────────────────────────────────────────────────────────
  const svcStats = useMemo(() => {
    const active   = services.filter((s) => s.active !== false).length
    const inactive = services.length - active
    const avgPrice = services.length > 0
      ? services.reduce((acc, s) => acc + (parseFloat(s.price) || 0), 0) / services.length
      : 0
    const topSvc = services
      .filter((s) => s.active !== false)
      .sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0))
      .slice(0, 4)
    return { total: services.length, active, inactive, avgPrice, topSvc }
  }, [services])

  // ── Proveedores ──────────────────────────────────────────────────────────
  const supStats = useMemo(() => {
    const total     = suppliers.length
    const favorites = suppliers.filter((s) => s.favorite).length
    const withPhone = suppliers.filter((s) => s.phone).length
    const topFav    = suppliers.filter((s) => s.favorite).slice(0, 3)
    return { total, favorites, withPhone, topFav }
  }, [suppliers])

  // ── Top header KPIs ──────────────────────────────────────────────────────
  const topKpis = [
    { label: 'Órdenes activas', value: orderStats.inRepair + orderStats.pending + orderStats.diagnosing + orderStats.waitingApproval, icon: Wrench, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', to: '/orders' },
    { label: 'Esperando aprobación', value: orderStats.waitingApproval, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', to: '/orders' },
    { label: 'Completadas / Entregadas', value: orderStats.completed + orderStats.delivered, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', to: '/orders' },
    { label: 'Clientes registrados', value: clientStats.total, icon: Users, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-900/20', to: '/clients' },
    { label: 'Ítems con stock bajo', value: invStats.lowStock + invStats.outOfStock, icon: Boxes, color: invStats.lowStock + invStats.outOfStock > 0 ? 'text-red-500' : 'text-slate-400', bg: invStats.lowStock + invStats.outOfStock > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-slate-100 dark:bg-slate-800', to: '/inventory' },
    { label: 'Ventas este mes', value: salesStats.thisMonth, icon: ShoppingCart, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20', to: '/sales' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Vista general del taller</p>
        </div>
      </div>

      {/* ── KPI strip ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {topKpis.map(({ label, value, icon: Icon, color, bg, to }) => (
          <Link key={label} to={to} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon size={16} className={color} />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">{label}</p>
          </Link>
        ))}
      </div>

      {/* ── Entregas próximas / atrasadas ───────────────────────────── */}
      {withDeadline.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <CalendarClock size={14} className="text-indigo-500" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Entregas próximas</span>
              {withDeadline.filter((o) => o._ds.type === 'overdue').length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold">
                  {withDeadline.filter((o) => o._ds.type === 'overdue').length} atrasada{withDeadline.filter((o) => o._ds.type === 'overdue').length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <Link to="/orders" className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 transition-colors">
              Ver todas <ArrowRight size={11} />
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {withDeadline.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${order._ds.dot}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{order.customerName || 'Sin nombre'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{order.orderNumber} · {order.deviceBrand} {order.deviceModel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={order.status} />
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${order._ds.bg} ${order._ds.color} border ${order._ds.border}`}>
                    {order._ds.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Sección principal 3 columnas ────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

        {/* Órdenes recientes */}
        <SectionCard title="Órdenes recientes" icon={ClipboardList} iconColor="text-indigo-500" to="/orders">
          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-slate-400 gap-2">
              <ClipboardList size={28} className="opacity-30" />
              <p className="text-xs">Sin órdenes aún</p>
              <Link to="/orders/new" className="text-xs text-indigo-500 hover:underline">Crear primera orden</Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 -mx-4 -mt-4">
              {recentOrders.map((order) => (
                <Link key={order.id} to={`/orders/${order.id}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{order.customerName || 'Sin nombre'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{order.orderNumber} · {order.deviceBrand} {order.deviceModel}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </Link>
              ))}
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Pendientes', value: orderStats.pending, color: 'text-slate-600 dark:text-slate-300' },
              { label: 'En reparación', value: orderStats.inRepair, color: 'text-orange-500' },
              { label: 'Este mes', value: orderStats.thisMonth, color: 'text-indigo-500' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p className={`text-lg font-bold ${color}`}>{value}</p>
                <p className="text-[10px] text-slate-400 leading-snug">{label}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Distribución de estados */}
        <SectionCard title="Estado de órdenes" icon={BarChart3} iconColor="text-blue-500" to="/orders">
          {orders.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">Sin datos disponibles</p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const count = orders.filter((o) => o.status === key).length
                const pct = (count / orders.length) * 100
                if (count === 0) return null
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600 dark:text-slate-400">{cfg.label}</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{count}</span>
                    </div>
                    <MiniBar pct={pct} color={cfg.dot} />
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>

        {/* Clientes */}
        <SectionCard title="Clientes" icon={Users} iconColor="text-sky-500" to="/clients">
          <div className="space-y-0 divide-y divide-slate-100 dark:divide-slate-800">
            <KpiRow label="Total registrados" value={clientStats.total} />
            <KpiRow label="Con teléfono / WhatsApp" value={clientStats.withPhone} />
            <KpiRow label="Nuevos este mes" value={clientStats.thisMonth} color="text-sky-500 dark:text-sky-400" />
          </div>
          {clients.slice(0, 3).length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              {clients.slice(0, 3).map((c) => (
                <div key={c.id} className="flex items-center justify-between">
                  <span className="text-xs text-slate-700 dark:text-slate-300 truncate max-w-[60%]">{c.name || '—'}</span>
                  <span className="text-[10px] text-slate-400">{c.phone || c.email || '—'}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Inventario */}
        <SectionCard title="Inventario" icon={Package} iconColor="text-violet-500" to="/inventory">
          <div className="space-y-0 divide-y divide-slate-100 dark:divide-slate-800">
            <KpiRow label="Total ítems" value={invStats.total} />
            <KpiRow
              label="Stock bajo"
              value={invStats.lowStock}
              color={invStats.lowStock > 0 ? 'text-amber-500' : 'text-slate-900 dark:text-white'}
            />
            <KpiRow
              label="Sin stock"
              value={invStats.outOfStock}
              color={invStats.outOfStock > 0 ? 'text-red-500' : 'text-slate-900 dark:text-white'}
            />
            <KpiRow label="Valor total del stock" value={fmt(invStats.totalValue)} color="text-violet-500" />
          </div>
          {invStats.topLow.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Críticos</p>
              {invStats.topLow.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-0.5">
                  <span className="text-xs text-slate-700 dark:text-slate-300 truncate max-w-[70%]">{item.name}</span>
                  <span className={`text-xs font-semibold ${(item.stock ?? 0) === 0 ? 'text-red-500' : 'text-amber-500'}`}>
                    {item.stock ?? 0} uds
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Ventas */}
        <SectionCard title="Ventas" icon={ShoppingCart} iconColor="text-emerald-500" to="/sales">
          <div className="space-y-0 divide-y divide-slate-100 dark:divide-slate-800">
            <KpiRow label="Total ventas" value={salesStats.total} />
            <KpiRow label="Ventas este mes" value={salesStats.thisMonth} color="text-emerald-500" />
            <KpiRow label="Ingresos este mes" value={fmt(salesStats.monthRevenue)} color="text-emerald-500" />
            <KpiRow label="Ingresos totales" value={fmt(salesStats.totalRevenue)} />
          </div>
          {salesStats.recentSales.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Últimas ventas</p>
              {salesStats.recentSales.map((sale) => (
                <Link key={sale.id} to={`/sales/${sale.id}`} className="flex items-center justify-between py-0.5 hover:opacity-80 transition-opacity">
                  <span className="text-xs text-slate-600 dark:text-slate-400">{sale.saleNumber}</span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{fmt(parseFloat(sale.total) || 0)}</span>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Servicios + Proveedores */}
        <div className="flex flex-col gap-4">
          <SectionCard title="Servicios" icon={Settings2} iconColor="text-orange-500" to="/services">
            <div className="space-y-0 divide-y divide-slate-100 dark:border-slate-800">
              <KpiRow label="Total servicios" value={svcStats.total} />
              <KpiRow label="Activos" value={svcStats.active} color="text-emerald-500" />
              <KpiRow label="Precio promedio" value={fmt(svcStats.avgPrice)} />
            </div>
            {svcStats.topSvc.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
                {svcStats.topSvc.map((s) => (
                  <div key={s.id} className="flex items-center justify-between">
                    <span className="text-xs text-slate-700 dark:text-slate-300 truncate max-w-[70%]">{s.name}</span>
                    <span className="text-xs font-semibold text-orange-500">{fmt(parseFloat(s.price) || 0)}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Proveedores" icon={Truck} iconColor="text-teal-500" to="/suppliers">
            <div className="space-y-0 divide-y divide-slate-100 dark:divide-slate-800">
              <KpiRow label="Total proveedores" value={supStats.total} />
              <KpiRow label="Favoritos" value={supStats.favorites} color="text-amber-500" />
              <KpiRow label="Con teléfono" value={supStats.withPhone} />
            </div>
            {supStats.topFav.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
                {supStats.topFav.map((s) => (
                  <div key={s.id} className="flex items-center gap-1.5">
                    <Star size={10} className="text-amber-400 fill-amber-400 flex-shrink-0" />
                    <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{s.name}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

      </div>

      {/* ── Órdenes abandonadas ──────────────────────────────────────── */}
      {orderStats.abandoned > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-zinc-200 dark:border-zinc-700/60 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
            <div className="flex items-center gap-2">
              <PackageX size={14} className="text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">Órdenes abandonadas</span>
              <span className="px-1.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold">
                {orderStats.abandoned}
              </span>
            </div>
            <Link to="/orders" className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 transition-colors">
              Ver todas <ArrowRight size={11} />
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {orders.filter((o) => o.status === 'abandoned').map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors gap-3"
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
