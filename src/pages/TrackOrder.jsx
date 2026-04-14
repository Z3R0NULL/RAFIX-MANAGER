import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Wrench, Search, Clock, DollarSign, MessageCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { useStore } from '../store/useStore'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { StatusBadge } from '../components/StatusBadge'
import { formatDate, formatDateShort, formatCurrency, STATUS_CONFIG } from '../utils/constants'

export default function TrackOrder() {
  const { orderNumber: paramOrderNumber } = useParams()
  const { getOrderByNumber, _hydrated } = useStore()
  const navigate = useNavigate()

  const [query, setQuery] = useState(paramOrderNumber || '')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchOrder = useCallback(async (num) => {
    if (!num) return
    setLoading(true)
    setNotFound(false)
    setOrder(null)

    // 1. Try Supabase first (live, cross-device)
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('data, updated_at')
          .eq('order_number', num.trim().toUpperCase())
          .single()

        if (!error && data) {
          setOrder(data.data)
          setLastUpdated(data.updated_at)
          setLoading(false)
          return
        }
      } catch (e) {
        console.warn('[TrackOrder] Supabase fetch failed, falling back to local store')
      }
    }

    // 2. Fallback: local store (same browser/device as admin)
    if (_hydrated) {
      const localOrder = getOrderByNumber(num.trim().toUpperCase())
      if (localOrder) {
        setOrder(localOrder)
        setLastUpdated(new Date().toISOString())
        setLoading(false)
        return
      }
    }

    setNotFound(true)
    setLoading(false)
  }, [_hydrated, getOrderByNumber])

  // Auto-search if order number is in URL
  useEffect(() => {
    if (paramOrderNumber) {
      fetchOrder(paramOrderNumber)
    }
  }, [paramOrderNumber, fetchOrder])

  const handleSearch = (e) => {
    e.preventDefault()
    const trimmed = query.trim().toUpperCase()
    if (!trimmed) return
    navigate(`/track/${trimmed}`)
  }

  const handleRefresh = () => {
    if (paramOrderNumber) fetchOrder(paramOrderNumber)
  }

  const openWhatsApp = () => {
    const msg = encodeURIComponent(
      `Hola! Estoy consultando sobre mi orden *${order.orderNumber}* para mi ${order.deviceBrand} ${order.deviceModel}. Estado actual: ${STATUS_CONFIG[order.status]?.label}.`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  const isSearchMode = !paramOrderNumber

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700/60">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Wrench size={15} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">RepairPro</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Seguimiento de Orden</p>
            </div>
          </div>
          {order && (
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors disabled:opacity-40"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Actualizar
            </button>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Search form (always visible when no param or as secondary) */}
        {isSearchMode && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Rastrear tu Reparación</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Ingresá tu número de orden para ver el estado actual</p>
            </div>
            <form onSubmit={handleSearch} className="flex gap-2 mb-8">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value.toUpperCase())}
                placeholder="ORD-XXXXXXXX"
                className="flex-1 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition font-mono"
              />
              <button
                type="submit"
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Search size={15} />
                Buscar
              </button>
            </form>
          </>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-10 flex items-center justify-center gap-3 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Buscando orden...</span>
          </div>
        )}

        {/* Not found */}
        {notFound && !loading && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-8 text-center">
            <AlertCircle size={24} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">Orden no encontrada</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              Verificá el número de orden o pedile al técnico que te reenvíe el enlace.
            </p>
            <button
              onClick={() => navigate('/track')}
              className="mt-4 text-sm text-indigo-600 hover:underline"
            >
              Buscar otra orden
            </button>
          </div>
        )}

        {/* Order found */}
        {order && !loading && (
          <div className="space-y-4">
            {/* Welcome banner */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800/50 px-5 py-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">
                  Hola{order.customerName ? `, ${order.customerName.split(' ')[0]}` : ''}! 👋
                </p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                  Acá podés ver el estado actualizado de tu reparación en tiempo real.
                </p>
              </div>
              {lastUpdated && (
                <p className="text-xs text-indigo-400 dark:text-indigo-500 flex-shrink-0 mt-0.5">
                  Actualizado {formatDate(lastUpdated)}
                </p>
              )}
            </div>

            {/* Order card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">{order.orderNumber}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {order.deviceBrand} {order.deviceModel}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Clock size={14} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Fecha de ingreso</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatDateShort(order.entryDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Clock size={14} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Entrega estimada</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatDateShort(order.deliveryDate) || 'A confirmar'}</p>
                  </div>
                </div>
                {(order.finalPrice || order.estimatedPrice) && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <DollarSign size={14} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Precio</p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatCurrency(order.finalPrice || order.estimatedPrice)}</p>
                    </div>
                  </div>
                )}
              </div>

              {order.reportedIssue && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3.5 mb-3">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Problema reportado</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{order.reportedIssue}</p>
                </div>
              )}

              {order.technicianNotes && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3.5">
                  <p className="text-xs font-medium text-indigo-700 dark:text-indigo-400 mb-1">Notas del técnico</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{order.technicianNotes}</p>
                </div>
              )}

              {order.customerPhone && (
                <button
                  onClick={openWhatsApp}
                  className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors w-full justify-center"
                >
                  <MessageCircle size={15} />
                  Contactar por WhatsApp
                </button>
              )}
            </div>

            {/* Status timeline */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-5">
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm mb-5">Historial de Estados</h2>
              <div className="relative">
                <div className="absolute left-3.5 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
                <div className="space-y-5">
                  {(order.statusHistory || []).map((entry, i) => {
                    const cfg = STATUS_CONFIG[entry.status] || STATUS_CONFIG.pending
                    const isLatest = i === (order.statusHistory?.length || 1) - 1
                    return (
                      <div key={i} className="relative flex gap-4 pl-9">
                        <div className={`absolute left-1.5 top-1 w-4 h-4 rounded-full flex items-center justify-center ${isLatest ? cfg.dot : 'bg-slate-200 dark:bg-slate-700'}`}>
                          {isLatest && <div className="w-2 h-2 rounded-full bg-white dark:bg-slate-900" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm font-medium ${isLatest ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                              {cfg.label}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(entry.timestamp)}</span>
                          </div>
                          {entry.note && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{entry.note}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Progress overview */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-5">
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Progreso General</h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                  const isDone = order.statusHistory?.some((h) => h.status === key)
                  const isCurrent = order.status === key
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isCurrent
                          ? `${cfg.color} ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-900`
                          : isDone
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          : 'bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isCurrent ? cfg.dot : isDone ? 'bg-slate-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
                      {cfg.label}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Search another order link */}
            <div className="text-center">
              <button
                onClick={() => navigate('/track')}
                className="text-sm text-slate-400 hover:text-indigo-600 transition-colors"
              >
                Buscar otra orden →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
