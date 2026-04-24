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
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { formatCurrency } from '../utils/constants'

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
  const { clients, upsertClient, updateClient, deleteClient, orders, auth } = useStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | 'new' | client object
  const [confirmDelete, setConfirmDelete] = useState(null)

  // Only show this user's clients (already filtered by store, but double-safe)
  const myClients = clients.filter((c) => !c.createdBy || c.createdBy === auth?.username)

  const filtered = myClients.filter((c) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      c.name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.dni?.includes(q)
    )
  })

  const getClientOrders = (client) =>
    orders.filter(
      (o) =>
        (o.customerPhone && client.phone && o.customerPhone === client.phone) ||
        (o.customerDni && client.dni && o.customerDni === client.dni) ||
        (o.customerEmail && client.email && o.customerEmail === client.email)
    )

  const getOrderCount = (client) => getClientOrders(client).length

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

  const getTotalSpent = (client) =>
    getClientOrders(client)
      .filter((o) => o.status === 'delivered')
      .reduce((sum, o) => {
        const val = parseFloat(o.finalPrice)
        return sum + (isNaN(val) ? 0 : val)
      }, 0)

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

  const handleNewOrderForClient = (client) => {
    navigate('/orders/new', {
      state: {
        prefill: {
          customerName: client.name || '',
          customerPhone: client.phone || '',
          customerEmail: client.email || '',
          customerDni: client.dni || '',
          customerAddress: client.address || '',
        },
      },
    })
  }

  const handleDelete = (id) => {
    deleteClient(id)
    setConfirmDelete(null)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Clients</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{myClients.length} registered clients</p>
        </div>
        <button
          onClick={() => setModal('new')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <PlusCircle size={16} />
          New Client
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, phone, DNI..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Users size={40} className="mb-3 opacity-30" />
          <p className="font-medium text-slate-500 dark:text-slate-400">
            {search ? 'No clients match your search' : 'No clients yet'}
          </p>
          {!search && (
            <button
              onClick={() => setModal('new')}
              className="mt-4 text-sm text-indigo-600 hover:underline"
            >
              Add your first client
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((client) => {
            const orderCount = getOrderCount(client)
            const totalSpent = getTotalSpent(client)
            const clientStatus = getClientStatus(client)
            return (
              <div
                key={client.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-5 flex flex-col gap-3"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
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
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleNewOrderForClient(client)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                      title="New order for this client"
                    >
                      <PlusCircle size={14} />
                    </button>
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
                      <ClipboardList size={13} />
                      {orderCount} order{orderCount !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <CreditCard size={13} />
                      {totalSpent > 0 ? formatCurrency(totalSpent) : '—'}
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
