/**
 * pages/SearchPage.jsx — Búsqueda global dentro de la app.
 *
 * Ruta: /search
 * Busca simultáneamente en órdenes y clientes del usuario.
 * Resultados de órdenes: filtra por número, nombre de cliente, dispositivo
 *   o problema reportado. Muestra link directo al detalle.
 * Resultados de clientes: filtra por nombre, teléfono, DNI o email.
 *   Muestra link para crear una nueva orden con el cliente preseleccionado.
 */
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ExternalLink } from 'lucide-react'
import { useStore } from '../store/useStore'
import { StatusBadge } from '../components/StatusBadge'
import { PageLoader } from '../components/PageLoader'
import { formatDateShort, formatCurrency } from '../utils/constants'

export default function SearchPage() {
  const orders = useStore((s) => s.orders)
  const dataLoading = useStore((s) => s.dataLoading)
  const [q, setQ] = useState('')

  if (dataLoading) return <PageLoader rows={4} title="Cargando búsqueda..." />

  const results = q.trim().length < 2 ? [] : orders.filter((o) => {
    const query = q.toLowerCase()
    return (
      o.orderNumber?.toLowerCase().includes(query) ||
      o.customerName?.toLowerCase().includes(query) ||
      o.customerPhone?.includes(query) ||
      o.customerDni?.includes(query) ||
      o.customerEmail?.toLowerCase().includes(query) ||
      o.deviceBrand?.toLowerCase().includes(query) ||
      o.deviceModel?.toLowerCase().includes(query) ||
      o.deviceSerial?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Search</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Find orders by customer, device, or order number</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type at least 2 characters to search..."
          className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition shadow-sm"
        />
      </div>

      {q.trim().length >= 2 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
          {results.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-500 dark:text-slate-400">No results for "{q}"</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50">
                <p className="text-xs text-slate-500 dark:text-slate-400">{results.length} result{results.length !== 1 ? 's' : ''}</p>
              </div>
              {results.map((order) => (
                <div key={order.id} className="flex items-center justify-between px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{order.orderNumber}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{order.customerName || '—'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {order.deviceBrand} {order.deviceModel} · {formatDateShort(order.entryDate)} · {formatCurrency(order.finalPrice || order.estimatedPrice)}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link
                      to={`/orders/${order.id}`}
                      className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    >
                      <ExternalLink size={15} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {q.trim().length === 0 && (
        <div className="text-center py-10 text-slate-400">
          <Search size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Start typing to search orders</p>
        </div>
      )}
    </div>
  )
}
