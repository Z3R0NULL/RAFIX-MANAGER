import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  Package,
  FileText,
  Trash2,
  ShoppingCart,
  Calendar,
  Hash,
  Edit3,
  Check,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { formatDate, formatCurrency } from '../utils/constants'
import { useCurrency } from '../utils/useCurrency'

const SALE_STATUS_CONFIG = {
  paid:      { label: 'Pagado',    color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',  dot: 'bg-green-500' },
  pending:   { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', dot: 'bg-amber-500' },
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

function EditSaleModal({ sale, onSave, onClose }) {
  const [status, setStatus] = useState(sale.status || 'pending')
  const [notes, setNotes]   = useState(sale.notes || '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Editar venta</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{sale.saleNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Estado */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              Estado
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(SALE_STATUS_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatus(key)}
                  className={`relative flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 text-xs font-medium transition-all
                    ${status === key
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                  {status === key && (
                    <span className="absolute top-1.5 right-1.5">
                      <Check size={10} className="text-emerald-500" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              Notas
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Observaciones de la venta..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave({ status, notes })}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SaleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { sales, deleteSale, updateSale } = useStore()

  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [editing, setEditing] = useState(false)

  const sale = sales.find((s) => s.id === id)

  if (!sale) {
    return (
      <div className="p-6 max-w-3xl mx-auto flex flex-col items-center justify-center py-24 text-slate-400">
        <ShoppingCart size={40} className="mb-3 opacity-40" />
        <p className="font-medium text-slate-500 dark:text-slate-400">Venta no encontrada</p>
        <button
          onClick={() => navigate('/sales')}
          className="mt-4 text-sm text-emerald-600 hover:underline"
        >
          Volver a ventas
        </button>
      </div>
    )
  }

  const subtotal = (sale.items || []).reduce((a, i) => a + (i.price || 0) * (i.qty || 1), 0)
  const costos   = (sale.items || []).reduce((a, i) => a + (i.cost  || 0) * (i.qty || 1), 0)
  const total    = sale.total ?? subtotal
  const ganancia = total - costos

  function handleDelete() {
    deleteSale(sale.id)
    navigate('/sales')
  }

  function handleSave(data) {
    updateSale(sale.id, data)
    setEditing(false)
  }

  const hasClientData = sale.customerName || sale.customerPhone || sale.customerDni || sale.customerEmail || sale.customerAddress

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/sales')}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
              {sale.saleNumber}
            </h1>
            <SaleBadge status={sale.status} />
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {sale.createdAt ? formatDate(sale.createdAt) : '—'}
            </span>
            {sale.createdBy && (
              <span className="flex items-center gap-1">
                <Hash size={11} />
                {sale.createdBy}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setDeleteConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs font-medium transition-colors"
          >
            <Trash2 size={13} />
            Eliminar
          </button>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors"
          >
            <Edit3 size={13} />
            Editar
          </button>
        </div>
      </div>

      {/* Resumen rápido (3 tarjetas) */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
          <p className="text-xs text-slate-400 mb-1">Total venta</p>
          <p className="text-xl font-bold text-blue-500 dark:text-blue-400">{fmt(total)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
          <p className="text-xs text-slate-400 mb-1">Costo</p>
          <p className="text-xl font-bold text-slate-500 dark:text-slate-400">{fmt(costos)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
          <p className="text-xs text-slate-400 mb-1">Ganancia</p>
          <p className={`text-xl font-bold ${ganancia >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
            {fmt(ganancia)}
          </p>
        </div>
      </div>

      {/* Productos */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-t-xl">
          <Package size={15} className="text-emerald-400" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Productos</span>
          <span className="ml-auto text-xs text-slate-400">
            {sale.items?.length || 0} {(sale.items?.length || 0) === 1 ? 'producto' : 'productos'}
          </span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {(sale.items || []).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Sin productos registrados</p>
          ) : (
            (sale.items || []).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.name || '—'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {fmt(item.price || 0)} c/u
                    {item.qty > 1 && <span className="text-slate-300 dark:text-slate-600 mx-1">×</span>}
                    {item.qty > 1 && <span>{item.qty}</span>}
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex-shrink-0">
                  {fmt((item.price || 0) * (item.qty || 1))}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer total */}
        {(sale.items || []).length > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-b-xl">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total</span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{fmt(total)}</span>
          </div>
        )}
      </section>

      {/* Cliente */}
      {hasClientData && (
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-t-xl">
            <User size={15} className="text-indigo-400" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Cliente</span>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5">
            <Field label="Nombre"    value={sale.customerName} />
            <Field label="Teléfono"  value={sale.customerPhone} />
            <Field label="DNI"       value={sale.customerDni} />
            <Field label="Email"     value={sale.customerEmail} />
            {sale.customerAddress && (
              <div className="sm:col-span-2">
                <Field label="Dirección" value={sale.customerAddress} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Notas */}
      {sale.notes && (
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-t-xl">
            <FileText size={15} className="text-slate-400" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Notas</span>
          </div>
          <div className="p-5">
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{sale.notes}</p>
          </div>
        </section>
      )}

      {/* Edit modal */}
      {editing && (
        <EditSaleModal
          sale={sale}
          onSave={handleSave}
          onClose={() => setEditing(false)}
        />
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">¿Eliminar venta?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              La venta <span className="font-mono font-medium">{sale.saleNumber}</span> será eliminada permanentemente.
              El stock <span className="font-semibold text-amber-500">no</span> será restituido automáticamente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
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

function Field({ label, value }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-slate-800 dark:text-slate-200">{value}</p>
    </div>
  )
}
