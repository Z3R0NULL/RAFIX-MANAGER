/**
 * pages/TrackSale.jsx — Seguimiento público de ventas/comprobantes.
 *
 * Ruta: /sale-track y /sale-track/:saleNumber
 * Busca la venta por número (Turso con fallback local) y muestra resumen
 * de estado, productos, total y datos mínimos del cliente.
 */
import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ShoppingCart, Search, Loader2, AlertCircle, RefreshCw,
  MessageCircle, Package, User, FileText, Check, X, Calendar,
  DollarSign, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { turso, isTursoConfigured } from '../lib/turso'
import { formatDate } from '../utils/constants'
import { useCurrency } from '../utils/useCurrency'

const SALE_STATUS = {
  paid:      { label: 'Pagado',    color: 'bg-green-100 text-green-700',  dot: 'bg-green-500',  dotDark: 'bg-green-400' },
  pending:   { label: 'Pendiente', color: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500',  dotDark: 'bg-amber-400' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700',      dot: 'bg-red-500',    dotDark: 'bg-red-400' },
}

function SaleBadge({ status }) {
  const cfg = SALE_STATUS[status] || SALE_STATUS.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function InfoRow({ label, value }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-slate-800 last:border-0">
      <span className="text-xs text-slate-500 flex-shrink-0">{label}</span>
      <span className="text-xs text-right font-medium text-slate-300">{value}</span>
    </div>
  )
}

export default function TrackSale() {
  const { saleNumber: paramSaleNumber } = useParams()
  const { getSaleByNumber, settings } = useStore()
  const fmt = useCurrency()
  const navigate = useNavigate()

  const businessName = settings?.businessName || 'RAFIX'

  const [query, setQuery] = useState(paramSaleNumber || '')
  const [sale, setSale] = useState(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchSale = useCallback(async (num) => {
    if (!num) return
    setLoading(true)
    setNotFound(false)
    setSale(null)

    const normalized = num.trim().toUpperCase()

    if (isTursoConfigured) {
      try {
        const res = await turso.execute({
          sql: 'SELECT data, updated_at FROM sales WHERE sale_number = ? LIMIT 1',
          args: [normalized],
        })
        const row = res.rows[0]
        if (row) {
          setSale(JSON.parse(row.data))
          setLastUpdated(row.updated_at)
          setLoading(false)
          return
        }
      } catch {
        // Turso no disponible, se usa el store local como fallback
      }
    }

    const localSale = getSaleByNumber(normalized)
    if (localSale) {
      setSale(localSale)
      setLastUpdated(new Date().toISOString())
      setLoading(false)
      return
    }

    setNotFound(true)
    setLoading(false)
  }, [getSaleByNumber])

  useEffect(() => {
    if (paramSaleNumber) fetchSale(paramSaleNumber)
  }, [paramSaleNumber, fetchSale])

  const handleSearch = (e) => {
    e.preventDefault()
    const trimmed = query.trim().toUpperCase()
    if (!trimmed) return
    navigate(`/sale-track/${trimmed}`)
  }

  const handleRefresh = () => {
    if (paramSaleNumber) fetchSale(paramSaleNumber)
  }

  const openWhatsApp = () => {
    const msg = encodeURIComponent(
      `Hola! Estoy consultando sobre mi compra *${sale.saleNumber}*. Estado: ${SALE_STATUS[sale.status]?.label || sale.status}.`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  const isSearchMode = !paramSaleNumber

  const subtotal = (sale?.items || []).reduce((a, i) => a + (i.price || 0) * (i.qty || 1), 0)
  const total = sale?.total ?? subtotal

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-700/60">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <ShoppingCart size={15} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">{businessName}</p>
              <p className="text-xs text-slate-400">Seguimiento de Compra</p>
            </div>
          </div>
          {sale && (
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-40"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Actualizar
            </button>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Search form */}
        {isSearchMode && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">Rastrear tu Compra</h1>
              <p className="text-slate-400 text-sm">Ingresá tu número de comprobante para ver el estado</p>
            </div>
            <form onSubmit={handleSearch} className="flex gap-2 mb-8">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value.toUpperCase())}
                placeholder="VTA-XXXXXXXX"
                className="flex-1 px-4 py-3 rounded-lg border border-slate-700 bg-slate-900 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition font-mono"
              />
              <button
                type="submit"
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Search size={15} />
                Buscar
              </button>
            </form>
          </>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-slate-900 rounded-xl border border-slate-700/60 p-10 flex items-center justify-center gap-3 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Buscando comprobante...</span>
          </div>
        )}

        {/* Not found */}
        {notFound && !loading && (
          <div className="bg-slate-900 rounded-xl border border-slate-700/60 p-8 text-center">
            <AlertCircle size={24} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">Comprobante no encontrado</p>
            <p className="text-sm text-slate-500 mt-1">
              Verificá el número de comprobante o pedile al vendedor que te reenvíe el enlace.
            </p>
            <button
              onClick={() => navigate('/sale-track')}
              className="mt-4 text-sm text-emerald-400 hover:underline"
            >
              Buscar otra compra
            </button>
          </div>
        )}

        {/* Sale found */}
        {sale && !loading && (
          <div className="space-y-4">

            {/* Welcome banner */}
            <div className="bg-emerald-900/20 rounded-xl border border-emerald-800/50 px-5 py-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-emerald-300">
                  Hola{sale.customerName ? `, ${sale.customerName.split(' ')[0]}` : ''}! 👋
                </p>
                <p className="text-xs text-emerald-400/80 mt-0.5">
                  Acá podés ver el estado de tu compra en tiempo real.
                </p>
              </div>
              {lastUpdated && (
                <p className="text-xs text-emerald-600 flex-shrink-0 mt-0.5">
                  Actualizado {formatDate(lastUpdated)}
                </p>
              )}
            </div>

            {/* Header card — sale number + status */}
            <div className="bg-slate-900 rounded-xl border border-slate-700/60 p-5">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="font-mono text-base font-bold text-white">{sale.saleNumber}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {sale.items?.length || 0} producto{(sale.items?.length || 0) !== 1 ? 's' : ''}
                    {sale.createdBy ? ` · ${sale.createdBy}` : ''}
                  </p>
                </div>
                <SaleBadge status={sale.status} />
              </div>

              {/* Date + Total */}
              <div className="grid sm:grid-cols-2 gap-4 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Calendar size={14} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Fecha de compra</p>
                    <p className="text-sm font-medium text-slate-300">{formatDate(sale.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <DollarSign size={14} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Total</p>
                    <p className="text-sm font-semibold text-emerald-400">{fmt(total)}</p>
                  </div>
                </div>
              </div>

              {/* WhatsApp button */}
              {sale.customerPhone && (
                <button
                  onClick={openWhatsApp}
                  className="mt-2 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors w-full justify-center active:scale-95"
                >
                  <MessageCircle size={15} />
                  Consultar por WhatsApp
                </button>
              )}
            </div>

            {/* Products */}
            <div className="bg-slate-900 rounded-xl border border-slate-700/60">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-800">
                <Package size={15} className="text-emerald-400" />
                <h2 className="font-semibold text-white text-sm">Productos</h2>
                <span className="ml-auto text-xs text-slate-500">
                  {sale.items?.length || 0} ítem{(sale.items?.length || 0) !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="divide-y divide-slate-800">
                {(sale.items || []).length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">Sin productos registrados</p>
                ) : (
                  (sale.items || []).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-4 px-5 py-3.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{item.name || '—'}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {fmt(item.price || 0)} c/u
                          {item.qty > 1 && <span className="mx-1 text-slate-600">×</span>}
                          {item.qty > 1 && <span>{item.qty}</span>}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-slate-200 flex-shrink-0">
                        {fmt((item.price || 0) * (item.qty || 1))}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Total row */}
              {(sale.items || []).length > 0 && (
                <div className="px-5 py-4 border-t border-slate-800 bg-slate-800/40 rounded-b-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-300">Total</span>
                    <span className="text-lg font-bold text-emerald-400">{fmt(total)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Customer info (partial — no sensitive data) */}
            {sale.customerName && (
              <div className="bg-slate-900 rounded-xl border border-slate-700/60 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <User size={15} className="text-slate-400" />
                  <h2 className="font-semibold text-white text-sm">Cliente</h2>
                </div>
                <InfoRow label="Nombre" value={sale.customerName} />
              </div>
            )}

            {/* Notes */}
            {sale.notes && (
              <div className="bg-slate-900 rounded-xl border border-slate-700/60 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={15} className="text-slate-400" />
                  <h2 className="font-semibold text-white text-sm">Notas</h2>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{sale.notes}</p>
              </div>
            )}

            {/* Status */}
            <div className="bg-slate-900 rounded-xl border border-slate-700/60 p-5">
              <h2 className="font-semibold text-white text-sm mb-4">Estado de la Compra</h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(SALE_STATUS).map(([key, cfg]) => {
                  const isCurrent = sale.status === key
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isCurrent
                          ? `${cfg.color} ring-2 ring-offset-1 ring-offset-slate-900`
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isCurrent ? cfg.dot : 'bg-slate-600'}`} />
                      {cfg.label}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Search another */}
            <div className="text-center">
              <button
                onClick={() => navigate('/sale-track')}
                className="text-sm text-slate-500 hover:text-emerald-400 transition-colors"
              >
                Buscar otra compra →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
