/**
 * pages/Orders.jsx — Lista completa de órdenes de servicio.
 *
 * Ruta: /orders
 * Muestra todas las órdenes del usuario autenticado con:
 *  - Buscador por número de orden, cliente o dispositivo.
 *  - Filtros por estado (todos, pending, in_repair, etc.).
 *  - Tabla/lista con ordenamiento y acceso al detalle de cada orden.
 *  - Botón para crear nueva orden.
 */
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  PlusCircle,
  Search,
  ChevronDown,
  Eye,
  ClipboardList,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { StatusBadge } from '../components/StatusBadge'
import { formatDateShort, formatCurrency, STATUS_CONFIG, DEVICE_TYPES } from '../utils/constants'

export default function Orders() {
  const { orders } = useStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deviceFilter, setDeviceFilter] = useState('')

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      o.orderNumber?.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q) ||
      o.customerPhone?.includes(q) ||
      o.deviceBrand?.toLowerCase().includes(q) ||
      o.deviceModel?.toLowerCase().includes(q)
    const matchStatus = !statusFilter || o.status === statusFilter
    const matchDevice = !deviceFilter || o.deviceType === deviceFilter
    return matchSearch && matchStatus && matchDevice
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Orders</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{orders.length} total orders</p>
        </div>
        <Link
          to="/orders/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <PlusCircle size={16} />
          New Order
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, order #, device..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none pl-3.5 pr-8 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition cursor-pointer"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value)}
            className="appearance-none pl-3.5 pr-8 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition cursor-pointer"
          >
            <option value="">All Devices</option>
            {DEVICE_TYPES.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <ClipboardList size={36} className="mb-3 opacity-40" />
            <p className="font-medium text-slate-500 dark:text-slate-400">No orders found</p>
            <p className="text-sm mt-1">
              {search || statusFilter || deviceFilter ? 'Try adjusting your filters' : 'Create your first order to get started'}
            </p>
            {!search && !statusFilter && !deviceFilter && (
              <Link to="/orders/new" className="mt-4 text-sm text-indigo-600 hover:underline">
                Create order
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="thead-row">
                  <th className="th-std">Order #</th>
                  <th className="th-std">Customer</th>
                  <th className="th-std hidden sm:table-cell">Device</th>
                  <th className="th-std">Status</th>
                  <th className="th-std hidden md:table-cell">Entry</th>
                  <th className="th-std hidden lg:table-cell">Price</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{order.customerName || '—'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{order.customerPhone || ''}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-slate-700 dark:text-slate-300">{order.deviceBrand} {order.deviceModel}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{order.deviceType}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 hidden md:table-cell">
                      {formatDateShort(order.entryDate)}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 hidden lg:table-cell">
                      {formatCurrency(order.finalPrice || order.estimatedPrice)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Link
                          to={`/orders/${order.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                        >
                          <Eye size={15} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
