/**
 * pages/Clients.jsx — Gestión del registro de clientes.
 *
 * Ruta: /clients
 * Lista todos los clientes del usuario con:
 *  - Buscador por nombre, teléfono, DNI o email.
 *  - Edición inline de datos del cliente.
 *  - Eliminación con confirmación.
 *  - Acceso rápido para crear una nueva orden pre-cargada con los datos del cliente.
 * Los cambios se persisten en Turso a través del store (updateClient / deleteClient).
 */
import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  PlusCircle,
  Search,
  Pencil,
  Trash2,
  X,
  Check,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  ClipboardList,
  LayoutGrid,
  LayoutList,
  ArrowUpDown,
  ChevronDown,
  Wrench,
  ShoppingCart,
  Wallet,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { PageLoader } from '../components/PageLoader'
import { useCurrency } from '../utils/useCurrency'

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Más recientes' },
  { value: 'oldest',     label: 'Más antiguos' },
  { value: 'name_az',    label: 'Nombre A→Z' },
  { value: 'name_za',    label: 'Nombre Z→A' },
  { value: 'orders_desc', label: 'Más órdenes' },
  { value: 'orders_asc', label: 'Menos órdenes' },
  { value: 'spent_desc', label: 'Mayor gasto' },
  { value: 'spent_asc',  label: 'Menor gasto' },
]

const emptyForm = { name: '', phone: '', email: '', dni: '', address: '' }

function ClientModal({ client, onSave, onClose, onDelete }) {
  const [form, setForm] = useState(client ? { ...client } : { ...emptyForm })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.name?.trim()) e.name = 'Name is required'
    return e
  }

  const handleSubmit = (ev) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onSave(form)
  }

  const field = (key) => ({
    value: form[key] || '',
    onChange: (ev) => setForm((f) => ({ ...f, [key]: ev.target.value })),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            {client ? 'Edit Client' : 'New Client'}
          </h2>
          <button onClick={onClose} className="btn-modal-close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              {...field('name')}
              onChange={(ev) => {
                const val = ev.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g, '')
                setForm((f) => ({ ...f, name: val }))
              }}
              placeholder="John Doe"
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition ${
                errors.name ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Phone + DNI */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Phone</label>
              <input
                {...field('phone')}
                onChange={(ev) => {
                  const val = ev.target.value.replace(/[^0-9+\s\-()]/g, '')
                  setForm((f) => ({ ...f, phone: val }))
                }}
                placeholder="+1 555 0000"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">DNI / ID</label>
              <input
                {...field('dni')}
                placeholder="12345678"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Email</label>
            <input
              {...field('email')}
              type="email"
              placeholder="john@example.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Address</label>
            <input
              {...field('address')}
              placeholder="123 Main St"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition"
            />
          </div>

          <div className="flex gap-3 pt-1">
            {client && onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="py-2.5 px-4 rounded-lg border border-red-200 dark:border-red-800 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
              >
                <Trash2 size={14} />
                Delete
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Check size={15} />
              {client ? 'Save Changes' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Clients() {
  const { clients, upsertClient, updateClient, deleteClient, orders, sales, auth, dataLoading } = useStore()

  const fmt = useCurrency()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | 'new' | client object
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [view, setView] = useState(() => localStorage.getItem('clientsView') || (window.innerWidth < 768 ? 'grid' : 'grid'))
  const [sort, setSort] = useState('newest')
  const [sortOpen, setSortOpen] = useState(false)
  const [activityFilter, setActivityFilter] = useState('')
  const [activityOpen, setActivityOpen] = useState(false)

  // Close dropdowns on outside click
  React.useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('[data-sort-dropdown]')) setSortOpen(false)
      if (!e.target.closest('[data-activity-dropdown]')) setActivityOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  React.useEffect(() => { localStorage.setItem('clientsView', view) }, [view])

  // Only show this user's clients (already filtered by store, but double-safe)
  const myClients = clients.filter((c) => !c.createdBy || c.createdBy === auth?.username)

  const filtered = useMemo(() => {
    let list = myClients.filter((c) => {
      // text search
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchText =
          c.name?.toLowerCase().includes(q) ||
          c.phone?.includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.dni?.includes(q)
        if (!matchText) return false
      }
      // activity filter
      if (activityFilter) {
        const hasOrders = getOrderCount(c) > 0
        const hasSales  = getSaleCount(c) > 0
        if (activityFilter === 'orders' && !(hasOrders && !hasSales)) return false
        if (activityFilter === 'sales'  && !(hasSales  && !hasOrders)) return false
        if (activityFilter === 'both'   && !(hasOrders && hasSales))   return false
      }
      return true
    })
    // sort
    return list.sort((a, b) => {
      switch (sort) {
        case 'newest':      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        case 'oldest':      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        case 'name_za':     return (b.name || '').localeCompare(a.name || '')
        case 'name_az':     return (a.name || '').localeCompare(b.name || '')
        case 'orders_desc': return getOrderCount(b) - getOrderCount(a)
        case 'orders_asc':  return getOrderCount(a) - getOrderCount(b)
        case 'spent_desc':  return getTotalSpent(b) - getTotalSpent(a)
        case 'spent_asc':   return getTotalSpent(a) - getTotalSpent(b)
        default:            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myClients, search, sort, activityFilter])

  const getClientOrders = (client) =>
    orders.filter(
      (o) =>
        (o.customerPhone && client.phone && o.customerPhone === client.phone) ||
        (o.customerDni && client.dni && o.customerDni === client.dni) ||
        (o.customerEmail && client.email && o.customerEmail === client.email)
    )

  const getOrderCount = (client) => getClientOrders(client).length

  const getClientSales = (client) =>
    (sales || []).filter(
      (s) =>
        (s.customerPhone && client.phone && s.customerPhone === client.phone) ||
        (s.customerDni && client.dni && s.customerDni === client.dni) ||
        (s.customerEmail && client.email && s.customerEmail === client.email)
    )

  const getSaleCount = (client) => getClientSales(client).length

  const getClientStatus = (client) => {
    const clientOrders = getClientOrders(client)
    if (clientOrders.length === 0) return null
    if (clientOrders.some((o) => o.status === 'abandoned'))
      return { label: 'Riesgoso', dot: 'bg-red-500', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' }
    const twoMonthsAgo = new Date()
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
    const recentOrders = clientOrders.filter((o) => o.entryDate && new Date(o.entryDate) >= twoMonthsAgo)
    if (recentOrders.length >= 4)
      return { label: 'Frecuente', dot: 'bg-green-500', text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' }
    if (recentOrders.length >= 2)
      return { label: 'Ocasional', dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' }
    return null
  }

  const getTotalSpent = (client) => {
    const fromOrders = getClientOrders(client)
      .filter((o) => o.status === 'delivered')
      .reduce((sum, o) => {
        const val = parseFloat(o.finalPrice)
        return sum + (isNaN(val) ? 0 : val)
      }, 0)
    const fromSales = getClientSales(client)
      .reduce((sum, s) => {
        const val = parseFloat(s.total)
        return sum + (isNaN(val) ? 0 : val)
      }, 0)
    return fromOrders + fromSales
  }

  const handleSave = (form) => {
    if (modal && modal !== 'new') {
      updateClient(modal.id, form)
    } else {
      upsertClient(form)
    }
    setModal(null)
  }

  const handleDeleteFromModal = () => {
    setConfirmDelete(modal.id)
    setModal(null)
  }

  const handleDelete = (id) => {
    deleteClient(id)
    setConfirmDelete(null)
  }

  if (dataLoading) return <PageLoader rows={6} title="Cargando clientes..." />

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Clientes</h1>
        </div>
        <button
          onClick={() => setModal('new')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <PlusCircle size={16} />
          Nuevo Cliente
        </button>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-3">
        {/* Row 1: search */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Row 2: filters + view/sort pill */}
        <div className="flex flex-row items-center gap-2">

        {/* Activity filter dropdown */}
        <div className="relative flex-shrink-0" data-activity-dropdown>
          <button
            onClick={() => setActivityOpen((o) => !o)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-sm transition-colors whitespace-nowrap
              ${activityFilter
                ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            {activityFilter === 'orders' ? 'Solo reparaciones' : activityFilter === 'sales' ? 'Solo compras' : activityFilter === 'both' ? 'Ambas' : 'Actividad'}
            <ChevronDown size={13} className={`transition-transform ${activityOpen ? 'rotate-180' : ''} ${activityFilter ? 'text-indigo-400' : 'text-slate-400'}`} />
          </button>
          {activityOpen && (
            <div className="absolute left-0 mt-1.5 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
              {[
                { value: '', label: 'Todos los clientes' },
                { value: 'orders', label: 'Solo reparaciones' },
                { value: 'sales',  label: 'Solo compras' },
                { value: 'both',   label: 'Ambas' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setActivityFilter(opt.value); setActivityOpen(false) }}
                  className={`w-full flex items-center px-4 py-2.5 text-sm transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0
                    ${activityFilter === opt.value
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View + Sort pill */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 ml-auto flex-shrink-0">
          <button
            onClick={() => setView('grid')}
            title="Vista cuadrícula"
            className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setView('list')}
            title="Vista lista"
            className={`p-2 rounded-lg transition-colors ${view === 'list' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <LayoutList size={15} />
          </button>
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />
          <div className="relative" data-sort-dropdown>
            <button
              onClick={() => setSortOpen((o) => !o)}
              className="flex items-center gap-1.5 pl-2 pr-2.5 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
            >
              <ArrowUpDown size={14} className="text-slate-500 dark:text-slate-400" />
              {SORT_OPTIONS.find((o) => o.value === sort)?.label}
              <ChevronDown size={12} className={`text-slate-400 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
            </button>
            {sortOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSort(opt.value); setSortOpen(false) }}
                    className={`w-full flex items-center px-4 py-2.5 text-sm transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0
                      ${sort === opt.value ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>{/* end row 2 */}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Users size={40} className="mb-3 opacity-30" />
          <p className="font-medium text-slate-500 dark:text-slate-400">
            {search ? 'No hay clientes que coincidan' : 'Sin clientes aún'}
          </p>
          {!search && (
            <button
              onClick={() => setModal('new')}
              className="mt-4 text-sm text-indigo-600 hover:underline"
            >
              Agregar primer cliente
            </button>
          )}
        </div>
      ) : view === 'list' ? (
        /* ── LIST VIEW ── */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="thead-row">
                  <th className="th-std">Cliente</th>
                  <th className="th-std hidden sm:table-cell">Teléfono</th>
                  <th className="th-std hidden md:table-cell">Email</th>
                  <th className="th-std hidden lg:table-cell">Dirección</th>
                  <th className="th-std-center">Órdenes</th>
                  <th className="th-std-right hidden sm:table-cell">Gastado</th>
                  <th className="th-std-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((client) => {
                  const orderCount = getOrderCount(client)
                  const totalSpent = getTotalSpent(client)
                  const clientStatus = getClientStatus(client)
                  return (
                    <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-slate-900 dark:text-white">{client.name || '—'}</p>
                          {clientStatus && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium ${clientStatus.bg} ${clientStatus.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${clientStatus.dot}`} />
                              {clientStatus.label}
                            </span>
                          )}
                        </div>
                        {client.dni && <p className="text-xs text-slate-400 mt-0.5">DNI {client.dni}</p>}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-slate-600 dark:text-slate-300 text-xs">{client.phone || '—'}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-slate-600 dark:text-slate-300 text-xs truncate max-w-[160px]">{client.email || '—'}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-slate-500 dark:text-slate-400 text-xs truncate max-w-[160px]">{client.address || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        {orderCount > 0 ? (
                          <Link
                            to={`/orders?${client.phone ? `phone=${encodeURIComponent(client.phone)}` : client.dni ? `dni=${encodeURIComponent(client.dni)}` : `email=${encodeURIComponent(client.email || '')}`}`}
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                          >
                            {orderCount}
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {totalSpent > 0 ? fmt(totalSpent) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setModal(client)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
            {filtered.length} cliente{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      ) : (
        /* ── GRID VIEW ── */
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((client) => {
            const orderCount = getOrderCount(client)
            const saleCount = getSaleCount(client)
            const totalSpent = getTotalSpent(client)
            const clientStatus = getClientStatus(client)
            const AVATAR_COLORS = [
              'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300',
              'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300',
              'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300',
              'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300',
              'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300',
              'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300',
            ]
            const avatarColor = AVATAR_COLORS[(client.name?.charCodeAt(0) || 0) % AVATAR_COLORS.length]
            const initials = (client.name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
            return (
              <div
                key={client.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-5 flex flex-col gap-3"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${avatarColor}`}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{client.name || '—'}</p>
                        {clientStatus && (
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium ${clientStatus.bg} ${clientStatus.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${clientStatus.dot}`} />
                            {clientStatus.label}
                          </span>
                        )}
                      </div>
                      {client.dni && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <CreditCard size={12} className="text-slate-400 flex-shrink-0" />
                          <span className="text-xs text-slate-500 dark:text-slate-400">{client.dni}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setModal(client)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                      title="Edit client"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5">
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-slate-400 flex-shrink-0" />
                      <span className="text-sm text-slate-600 dark:text-slate-300">{client.phone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-slate-400 flex-shrink-0" />
                      <span className="text-sm text-slate-600 dark:text-slate-300 truncate">{client.email}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-slate-400 flex-shrink-0" />
                      <span className="text-sm text-slate-600 dark:text-slate-300 truncate">{client.address}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 mt-auto">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Wrench size={13} />
                      {orderCount} Reparacion{orderCount !== 1 ? 'es' : ''}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <ShoppingCart size={13} />
                      {saleCount} Compra{saleCount !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Wallet size={13} />
                      {totalSpent > 0 ? fmt(totalSpent) : '—'}
                    </div>
                  </div>
                  {orderCount > 0 && (
                    <Link
                      to={`/orders?${client.phone ? `phone=${encodeURIComponent(client.phone)}` : client.dni ? `dni=${encodeURIComponent(client.dni)}` : `email=${encodeURIComponent(client.email || '')}`}`}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      View orders
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal !== null && (
        <ClientModal
          client={modal === 'new' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
          onDelete={modal !== 'new' ? handleDeleteFromModal : undefined}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Delete Client?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              This will remove the client record permanently. Orders linked to this client will not be deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
