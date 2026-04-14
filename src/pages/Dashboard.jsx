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
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { StatusBadge } from '../components/StatusBadge'
import { formatDate, formatCurrency, STATUS_CONFIG } from '../utils/constants'

export default function Dashboard() {
  const orders = useStore((s) => s.orders)

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    inRepair: orders.filter((o) => o.status === 'in_repair').length,
    completed: orders.filter((o) => o.status === 'completed').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    waitingApproval: orders.filter((o) => o.status === 'waiting_approval').length,
    diagnosing: orders.filter((o) => o.status === 'diagnosing').length,
    irreparable: orders.filter((o) => o.status === 'irreparable').length,
  }

  const recent = orders.slice(0, 5)

  const statCards = [
    { label: 'Total Orders', value: stats.total, icon: ClipboardList, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' },
    { label: 'In Repair', value: stats.inRepair, icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { label: 'Completed', value: stats.completed + stats.delivered, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Waiting Approval', value: stats.waitingApproval, icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { label: 'Diagnosing', value: stats.diagnosing, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Overview of your repair shop</p>
        </div>
        <Link
          to="/orders/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <PlusCircle size={16} />
          New Order
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

      {/* Status breakdown */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent orders */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700/60">
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Recent Orders</h2>
            <Link to="/orders" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <ClipboardList size={32} className="mb-2 opacity-40" />
              <p className="text-sm">No orders yet</p>
              <Link to="/orders/new" className="mt-3 text-xs text-indigo-600 hover:underline">Create your first order</Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recent.map((order) => (
                <Link key={order.id} to={`/orders/${order.id}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{order.customerName || 'Unknown'}</p>
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
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Status Distribution</h2>
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
              <p className="text-sm text-slate-400 text-center py-4">No data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
