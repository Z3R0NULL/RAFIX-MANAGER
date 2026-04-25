import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  PlusCircle,
  Search,
  ChevronDown,
  Eye,
  ShoppingCart,
  ArrowUpDown,
  LayoutList,
  LayoutGrid,
  Trash2,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { PageLoader } from '../components/PageLoader'
import { formatDateShort, formatCurrency } from '../utils/constants'

const SALE_STATUS_CONFIG = {
  paid:    { label: 'Pagado',   color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',     dot: 'bg-green-500' },
  pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',   dot: 'bg-amber-500' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',         dot: 'bg-red-500' },
}

function SaleBadge({ status }) {
  const cfg = SALE_STATUS_CONFIG[status] || SALE_STATUS_CONFIG.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'oldest', label: 'Más antiguos' },
  { value: 'name_az', label: 'Cliente A→Z' },
  { value: 'price_desc', label: 'Mayor total' },
  { value: 'price_asc', label: 'Menor total' },
]

function sortSales(sales, sort) {
  const arr = [...sales]
  switch (sort) {
    case 'oldest':     return arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    case 'name_az':    return arr.sort((a, b) => (a.customerName || '').localeCompare(b.customerName || ''))
    case 'price_desc': return arr.sort((a, b) => (b.total || 0) - (a.total || 0))
    case 'price_asc':  return arr.sort((a, b) => (a.total || 0) - (b.total || 0))
    default:           return arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }
}

export default function SalesPage() {
  const { sales, dataLoading, deleteSale } = useStore()

  const [search, setSearch]         = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [view, setView]             = useState(() => localStorage.getItem('salesView') || 'list')
  const [sort, setSort]             = useState('newest')
  const [sortOpen, setSortOpen]     = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => { localStorage.setItem('salesView', view) }, [view])

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('[data-sort-dd]')) setSortOpen(false)
      if (!e.target.closest('[data-status-dd]')) setStatusOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = sales.filter((s) => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      s.saleNumber?.toLowerCase().includes(q) ||
      s.customerName?.toLowerCase().includes(q) ||
      s.customerPhone?.includes(q) ||
      (s.items || []).some((i) => i.name?.toLowerCase().includes(q))
    const matchStatus = !statusFilter || s.status === statusFilter
    return matchSearch && matchStatus
  })

  const sorted = sortSales(filtered, sort)
  const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label || 'Ordenar'

  // Stats
  const totalVentas   = sales.length
  const pagadas       = sales.filter((s) => s.status === 'paid').length
  const ingresos      = sales.filter((s) => s.status === 'paid').reduce((a, s) => a + (s.total || 0), 0)
  const costos        = sales.filter((s) => s.status === 'paid').reduce((a, s) =>
    a + (s.items || []).reduce((b, i) => b + (i.cost || 0) * i.qty, 0), 0)
  const ganancia      = ingresos - costos

  if (dataLoading) return <PageLoader rows={6} title="Cargando ventas..." />

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ventas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {sales.length} {sales.length === 1 ? 'orden de venta' : 'órdenes de venta'}
          </p>
        </div>
        <Link
          to="/sales/new"
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <PlusCircle size={16} />
          Nueva venta
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalVentas}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Total ventas</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{pagadas}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pagadas</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
          <p className="text-2xl font-bold text-blue-500 dark:text-blue-400">{formatCurrency(ingresos)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Ingresos totales</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
          <p className="text-2xl font-bold text-emerald-500">{formatCurrency(ganancia)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Ganancia neta</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, orden, producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition"
          />
        </div>

        {/* Status filter */}
        <div className="relative" data-status-dd>
          <button
            onClick={() => setStatusOpen((o) => !o)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-sm transition-colors whitespace-nowrap
              ${statusFilter
                ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            {statusFilter ? SALE_STATUS_CONFIG[statusFilter]?.label : 'Estado'}
            <ChevronDown size={13} className={`transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
          </button>
          {statusOpen && (
            <div className="absolute left-0 mt-1.5 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
              <button
                onClick={() => { setStatusFilter(''); setStatusOpen(false) }}
                className={`w-full flex items-center px-4 py-2.5 text-sm transition-colors border-b border-slate-100 dark:border-slate-800
                  ${!statusFilter ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                Todos
              </button>
              {Object.entries(SALE_STATUS_CONFIG).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => { setStatusFilter(k); setStatusOpen(false) }}
                  className={`w-full flex items-center px-4 py-2.5 text-sm transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0
                    ${statusFilter === k ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View + Sort */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 ml-auto flex-shrink-0">
          <button
            onClick={() => setView('grid')}
            className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-2 rounded-lg transition-colors ${view === 'list' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <LayoutList size={15} />
          </button>
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />
          <div className="relative" data-sort-dd>
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
                      ${sort === opt.value ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {sorted.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-col items-center justify-center py-16 text-slate-400">
          <ShoppingCart size={36} className="mb-3 opacity-40" />
          <p className="font-medium text-slate-500 dark:text-slate-400">No hay ventas registradas</p>
          <p className="text-sm mt-1">
            {search || statusFilter ? 'Ajustá los filtros' : 'Registrá tu primera venta'}
          </p>
          {!search && !statusFilter && (
            <Link to="/sales/new" className="mt-4 text-sm text-emerald-600 hover:underline">
              Nueva venta
            </Link>
          )}
        </div>
      ) : view === 'list' ? (
        /* LIST VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="thead-row">
                  <th className="th-std">Orden #</th>
                  <th className="th-std">Cliente</th>
                  <th className="th-std hidden sm:table-cell">Productos</th>
                  <th className="th-std">Estado</th>
                  <th className="th-std hidden md:table-cell">Fecha</th>
                  <th className="th-std hidden lg:table-cell">Total</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sorted.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {sale.saleNumber}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{sale.customerName || '—'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{sale.customerPhone || sale.customerDni || ''}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-slate-700 dark:text-slate-300">
                        {sale.items?.length === 1 ? '1 producto' : `${sale.items?.length || 0} productos`}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                        {(sale.items || []).map((i) => i.name).join(', ')}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <SaleBadge status={sale.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 hidden md:table-cell">
                      {formatDateShort(sale.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-blue-500 dark:text-blue-400 hidden lg:table-cell">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Link
                          to={`/sales/${sale.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                          title="Ver detalle"
                        >
                          <Eye size={15} />
                        </Link>
                        <button
                          onClick={() => setDeleteConfirm(sale)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Eliminar venta"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sorted.map((sale) => (
            <div
              key={sale.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4 flex flex-col gap-3 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400 font-medium">{sale.saleNumber}</span>
                <SaleBadge status={sale.status} />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-900 dark:text-white">{sale.customerName || '—'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{sale.customerPhone || sale.customerDni || ''}</p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {(sale.items || []).map((i) => i.name).join(', ') || '—'}
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-400">{formatDateShort(sale.createdAt)}</span>
                <span className="text-sm font-bold text-blue-500 dark:text-blue-400">{formatCurrency(sale.total)}</span>
              </div>
              <div className="flex items-center justify-end gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                <Link
                  to={`/sales/${sale.id}`}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                  title="Ver detalle"
                >
                  <Eye size={15} />
                </Link>
                <button
                  onClick={() => setDeleteConfirm(sale)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Eliminar venta"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">¿Eliminar venta?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              La venta <span className="font-mono font-medium">{deleteConfirm.saleNumber}</span> será eliminada permanentemente.
              El stock <span className="font-semibold text-amber-500">no</span> será restituido automáticamente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => { deleteSale(deleteConfirm.id); setDeleteConfirm(null) }}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
