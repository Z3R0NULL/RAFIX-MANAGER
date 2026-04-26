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
import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  PlusCircle,
  Search,
  ChevronDown,
  Eye,
  ClipboardList,
  X,
  LayoutList,
  LayoutGrid,
  ArrowUpDown,
  Smartphone,
  User,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { StatusBadge } from '../components/StatusBadge'
import { PageLoader } from '../components/PageLoader'
import { formatDateShort, STATUS_CONFIG } from '../utils/constants'
import { useCurrency } from '../utils/useCurrency'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'oldest', label: 'Más antiguos' },
  { value: 'name_az', label: 'Cliente A→Z' },
  { value: 'name_za', label: 'Cliente Z→A' },
  { value: 'price_desc', label: 'Mayor precio' },
  { value: 'price_asc', label: 'Menor precio' },
]

function sortOrders(orders, sort) {
  const arr = [...orders]
  switch (sort) {
    case 'oldest':   return arr.sort((a, b) => new Date(a.entryDate) - new Date(b.entryDate))
    case 'name_az':  return arr.sort((a, b) => (a.customerName || '').localeCompare(b.customerName || ''))
    case 'name_za':  return arr.sort((a, b) => (b.customerName || '').localeCompare(a.customerName || ''))
    case 'price_desc': return arr.sort((a, b) => (+(b.finalPrice || b.estimatedPrice || 0)) - (+(a.finalPrice || a.estimatedPrice || 0)))
    case 'price_asc':  return arr.sort((a, b) => (+(a.finalPrice || a.estimatedPrice || 0)) - (+(b.finalPrice || b.estimatedPrice || 0)))
    default:         return arr.sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate))
  }
}

export default function Orders() {
  const fmt = useCurrency()
  const { orders, dataLoading } = useStore()
  const location = useLocation()
  const navigate = useNavigate()

  const getClientFilter = (search) => {
    const params = new URLSearchParams(search)
    return { phone: params.get('phone') || '', dni: params.get('dni') || '', email: params.get('email') || '' }
  }

  const [clientFilter, setClientFilter] = useState(() => getClientFilter(location.search))
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [view, setView] = useState(() => localStorage.getItem('ordersView') || (window.innerWidth < 768 ? 'grid' : 'list'))
  const [sort, setSort] = useState('newest')
  const [sortOpen, setSortOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)

  useEffect(() => {
    setClientFilter(getClientFilter(location.search))
    setSearch('')
  }, [location.search])

  useEffect(() => {
    localStorage.setItem('ordersView', view)
  }, [view])

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('[data-sort-dropdown]')) setSortOpen(false)
      if (!e.target.closest('[data-status-dropdown]')) setStatusOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = orders.filter((o) => {
    // Excluir ventas que pudieran haberse colado (id SAL- o saleNumber VTA-)
    if (o.id?.startsWith('SAL-') || o.saleNumber) return false

    if (clientFilter.phone) return o.customerPhone === clientFilter.phone
    if (clientFilter.dni) return o.customerDni === clientFilter.dni
    if (clientFilter.email) return o.customerEmail === clientFilter.email
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      o.orderNumber?.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q) ||
      o.customerPhone?.includes(q) ||
      o.deviceBrand?.toLowerCase().includes(q) ||
      o.deviceModel?.toLowerCase().includes(q)
    const matchStatus = !statusFilter || o.status === statusFilter
    return matchSearch && matchStatus
  })

  const sorted = sortOrders(filtered, sort)
  const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label || 'Ordenar'

  if (dataLoading) return <PageLoader rows={6} title="Cargando órdenes..." />

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Orders</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{orders.filter(o => !o.id?.startsWith('SAL-') && !o.saleNumber).length} total orders</p>
        </div>
        <Link
          to="/orders/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <PlusCircle size={16} />
          New Order
        </Link>
      </div>

      {/* Client filter banner */}
      {(clientFilter.phone || clientFilter.dni || clientFilter.email) && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700/50 rounded-lg text-sm text-indigo-700 dark:text-indigo-300">
          <span>
            Mostrando órdenes de: <span className="font-medium">{clientFilter.phone || clientFilter.dni || clientFilter.email}</span>
          </span>
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center gap-1 text-xs hover:text-indigo-900 dark:hover:text-indigo-100 transition-colors"
          >
            <X size={13} /> Limpiar filtro
          </button>
        </div>
      )}

      {/* Filters + view controls */}
      {!clientFilter.phone && !clientFilter.dni && !clientFilter.email && (
        <div className="flex flex-col gap-3">
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
          <div className="flex flex-row items-center gap-2">
          {/* Status dropdown */}
          <div className="relative flex-shrink-0" data-status-dropdown>
            <button
              onClick={() => setStatusOpen((o) => !o)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-sm transition-colors whitespace-nowrap
                ${statusFilter
                  ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              {statusFilter ? STATUS_CONFIG[statusFilter]?.label : 'Estado'}
              <ChevronDown size={13} className={`transition-transform ${statusOpen ? 'rotate-180' : ''} ${statusFilter ? 'text-indigo-400' : 'text-slate-400'}`} />
            </button>
            {statusOpen && (
              <div className="absolute left-0 mt-1.5 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                <button
                  onClick={() => { setStatusFilter(''); setStatusOpen(false) }}
                  className={`w-full flex items-center px-4 py-2.5 text-sm transition-colors border-b border-slate-100 dark:border-slate-800
                    ${!statusFilter ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  Todos los estados
                </button>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => { setStatusFilter(k); setStatusOpen(false) }}
                    className={`w-full flex items-center px-4 py-2.5 text-sm transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0
                      ${statusFilter === k ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Device dropdown */}
          {/* View + Sort pill group */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 ml-auto flex-shrink-0">
            {/* Grid icon */}
            <button
              onClick={() => setView('grid')}
              title="Vista cuadrícula"
              className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <LayoutGrid size={15} />
            </button>
            {/* List icon */}
            <button
              onClick={() => setView('list')}
              title="Vista lista"
              className={`p-2 rounded-lg transition-colors ${view === 'list' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <LayoutList size={15} />
            </button>

            {/* Divider */}
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5"></div>

            {/* Sort dropdown */}
            <div className="relative" data-sort-dropdown>
              <button
                onClick={() => setSortOpen((o) => !o)}
                className="flex items-center gap-1.5 pl-2 pr-2.5 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
              >
                <ArrowUpDown size={14} className="text-slate-500 dark:text-slate-400" />
                {sortLabel}
                <ChevronDown size={12} className={`text-slate-400 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSort(opt.value); setSortOpen(false) }}
                      className={`w-full flex items-center px-4 py-2.5 text-sm transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0
                        ${sort === opt.value
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {sorted.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-col items-center justify-center py-16 text-slate-400">
          <ClipboardList size={36} className="mb-3 opacity-40" />
          <p className="font-medium text-slate-500 dark:text-slate-400">No orders found</p>
          <p className="text-sm mt-1">
            {search || statusFilter ? 'Try adjusting your filters' : 'Create your first order to get started'}
          </p>
          {!search && !statusFilter && (
            <Link to="/orders/new" className="mt-4 text-sm text-indigo-600 hover:underline">
              Create order
            </Link>
          )}
        </div>
      ) : view === 'list' ? (
        /* ── LIST VIEW ── */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
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
                {sorted.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{order.customerName || '—'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {order.customerDni || order.customerPhone || order.customerEmail || ''}
                      </p>
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
                      {fmt(order.finalPrice || order.estimatedPrice)}
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
        </div>
      ) : (
        /* ── GRID VIEW ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sorted.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400 font-medium">{order.orderNumber}</span>
                <StatusBadge status={order.status} />
              </div>

              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-indigo-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{order.customerName || '—'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {order.customerDni || order.customerPhone || order.customerEmail || ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 min-w-0">
                <Smartphone size={13} className="text-slate-400 flex-shrink-0" />
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                  {[order.deviceBrand, order.deviceModel].filter(Boolean).join(' ') || '—'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-400">{formatDateShort(order.entryDate)}</span>
                {(order.finalPrice || order.estimatedPrice)
                  ? <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{fmt(order.finalPrice || order.estimatedPrice)}</span>
                  : null}
              </div>
            </Link>
          ))}
        </div>
      )}

    </div>
  )
}
