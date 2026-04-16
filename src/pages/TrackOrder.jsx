import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Wrench, Search, Clock, DollarSign, MessageCircle, Loader2,
  AlertCircle, RefreshCw, Smartphone, CheckCircle2,
  XCircle, Info, Calendar, Tag, ShieldCheck, ThumbsUp, ThumbsDown,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { turso, isTursoConfigured } from '../lib/turso'
import { StatusBadge } from '../components/StatusBadge'
import {
  formatDate, formatDateShort, formatCurrency, STATUS_CONFIG,
  BUDGET_STATUS_CONFIG, DEVICE_TYPES,
} from '../utils/constants'

function InfoRow({ label, value, mono }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-slate-800 last:border-0">
      <span className="text-xs text-slate-500 flex-shrink-0">{label}</span>
      <span className={`text-xs text-right font-medium text-slate-300 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

function CheckItem({ label, value }) {
  if (value === null || value === undefined) return null
  return (
    <div className="flex items-center gap-2">
      {value
        ? <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
        : <XCircle size={13} className="text-red-400 flex-shrink-0" />}
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  )
}

export default function TrackOrder() {
  const { orderNumber: paramOrderNumber } = useParams()
  const { getOrderByNumber } = useStore()
  const navigate = useNavigate()

  const [query, setQuery] = useState(paramOrderNumber || '')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [budgetAction, setBudgetAction] = useState(null) // 'approving' | 'rejecting' | 'done' | 'error'

  const fetchOrder = useCallback(async (num) => {
    if (!num) return
    setLoading(true)
    setNotFound(false)
    setOrder(null)
    setBudgetAction(null)

    const normalized = num.trim().toUpperCase()

    if (isTursoConfigured) {
      try {
        const res = await turso.execute({
          sql: 'SELECT data, updated_at FROM orders WHERE order_number = ? LIMIT 1',
          args: [normalized],
        })
        const row = res.rows[0]
        if (row) {
          setOrder(JSON.parse(row.data))
          setLastUpdated(row.updated_at)
          setLoading(false)
          return
        }
      } catch {
        // Turso no disponible, se usa el store local como fallback
      }
    }

    const localOrder = getOrderByNumber(normalized)
    if (localOrder) {
      setOrder(localOrder)
      setLastUpdated(new Date().toISOString())
      setLoading(false)
      return
    }

    setNotFound(true)
    setLoading(false)
  }, [getOrderByNumber])

  useEffect(() => {
    if (paramOrderNumber) fetchOrder(paramOrderNumber)
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

  // Aprobación/rechazo del presupuesto desde la vista pública
  const handleBudgetDecision = async (decision) => {
    if (!order) return
    setBudgetAction(decision === 'approved' ? 'approving' : 'rejecting')

    const updatedOrder = {
      ...order,
      budgetStatus: decision,
      // Si acepta, avanzar automáticamente a in_repair (solo si estaba en waiting_approval)
      ...(decision === 'approved' && order.status === 'waiting_approval' ? {
        status: 'in_repair',
        statusHistory: [
          ...(order.statusHistory || []),
          {
            status: 'in_repair',
            timestamp: new Date().toISOString(),
            note: 'Presupuesto aprobado por el cliente',
          },
        ],
      } : {}),
    }

    try {
      if (isTursoConfigured) {
        await turso.execute({
          sql: `UPDATE orders SET data = ?, updated_at = ? WHERE order_number = ?`,
          args: [JSON.stringify(updatedOrder), new Date().toISOString(), order.orderNumber],
        })
      }
      setOrder(updatedOrder)
      setLastUpdated(new Date().toISOString())
      setBudgetAction('done')
    } catch {
      setBudgetAction('error')
    }
  }

  const openWhatsApp = () => {
    const msg = encodeURIComponent(
      `Hola! Estoy consultando sobre mi orden *${order.orderNumber}* para mi ${order.deviceBrand} ${order.deviceModel}. Estado actual: ${STATUS_CONFIG[order.status]?.label}.`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  const deviceTypeLabel = DEVICE_TYPES.find((d) => d.value === order?.deviceType)?.label || order?.deviceType
  const isSearchMode = !paramOrderNumber

  // Lógica para mostrar el bloque de aprobación
  const showBudgetApproval =
    order &&
    order.status === 'waiting_approval' &&
    order.budgetStatus === 'pending' &&
    budgetAction !== 'done'

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-700/60">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Wrench size={15} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">RAFIX</p>
              <p className="text-xs text-slate-400">Seguimiento de Orden</p>
            </div>
          </div>
          {order && (
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
              <h1 className="text-2xl font-bold text-white mb-2">Rastrear tu Reparación</h1>
              <p className="text-slate-400 text-sm">Ingresá tu número de orden para ver el estado actual</p>
            </div>
            <form onSubmit={handleSearch} className="flex gap-2 mb-8">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value.toUpperCase())}
                placeholder="ORD-XXXXXXXX"
                className="flex-1 px-4 py-3 rounded-lg border border-slate-700 bg-slate-900 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition font-mono"
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
          <div className="bg-slate-900 rounded-xl border border-slate-700/60 p-10 flex items-center justify-center gap-3 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Buscando orden...</span>
          </div>
        )}

        {/* Not found */}
        {notFound && !loading && (
          <div className="bg-slate-900 rounded-xl border border-slate-700/60 p-8 text-center">
            <AlertCircle size={24} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">Orden no encontrada</p>
            <p className="text-sm text-slate-500 mt-1">
              Verificá el número de orden o pedile al técnico que te reenvíe el enlace.
            </p>
            <button
              onClick={() => navigate('/track')}
              className="mt-4 text-sm text-indigo-400 hover:underline"
            >
              Buscar otra orden
            </button>
          </div>
        )}

        {/* Order found */}
        {order && !loading && (
          <div className="space-y-4">

            {/* ── BLOQUE DE APROBACIÓN DE PRESUPUESTO ── */}
            {showBudgetApproval && (
              <div className="bg-amber-900/20 rounded-xl border-2 border-amber-500/50 p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <DollarSign size={18} className="text-amber-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-300 text-sm">Presupuesto pendiente de aprobación</p>
                    <p className="text-xs text-amber-400/70 mt-0.5">
                      Tu equipo fue diagnosticado. El técnico está esperando tu decisión para continuar.
                    </p>
                  </div>
                </div>

                {/* Precio final si está definido, si no el estimado */}
                {(order.finalPrice || order.estimatedPrice) && (
                  <div className="flex items-center justify-between bg-slate-900/60 rounded-lg px-4 py-3 mb-4">
                    <span className="text-sm text-slate-300">
                      {order.finalPrice ? 'Precio final de reparación' : 'Precio estimado de reparación'}
                    </span>
                    <span className="text-xl font-bold text-amber-300">
                      {formatCurrency(order.finalPrice || order.estimatedPrice)}
                    </span>
                  </div>
                )}

                {/* Notas del técnico si las hay */}
                {order.technicianNotes && (
                  <div className="bg-slate-900/50 rounded-lg px-4 py-3 mb-4">
                    <p className="text-xs font-medium text-slate-400 mb-1">Nota del técnico</p>
                    <p className="text-sm text-slate-300">{order.technicianNotes}</p>
                  </div>
                )}

                {budgetAction === 'error' && (
                  <div className="flex items-center gap-2 bg-red-900/20 border border-red-800/50 rounded-lg px-3 py-2 mb-3 text-red-400 text-xs">
                    <AlertCircle size={13} />
                    Ocurrió un error al guardar tu respuesta. Intentá de nuevo.
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleBudgetDecision('rejected')}
                    disabled={budgetAction === 'approving' || budgetAction === 'rejecting'}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-red-700/60 bg-red-900/20 text-red-400 hover:bg-red-900/40 hover:text-red-300 text-sm font-medium transition-all active:scale-95 disabled:opacity-50"
                  >
                    {budgetAction === 'rejecting'
                      ? <Loader2 size={15} className="animate-spin" />
                      : <ThumbsDown size={15} />}
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleBudgetDecision('approved')}
                    disabled={budgetAction === 'approving' || budgetAction === 'rejecting'}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-green-900/30"
                  >
                    {budgetAction === 'approving'
                      ? <Loader2 size={15} className="animate-spin" />
                      : <ThumbsUp size={15} />}
                    Aprobar reparación
                  </button>
                </div>
              </div>
            )}

            {/* Confirmación post-decisión */}
            {budgetAction === 'done' && (
              <div className={`rounded-xl border px-5 py-4 flex items-center gap-3 ${
                order.budgetStatus === 'approved'
                  ? 'bg-green-900/20 border-green-700/50'
                  : 'bg-slate-800/50 border-slate-700/50'
              }`}>
                {order.budgetStatus === 'approved'
                  ? <CheckCircle2 size={20} className="text-green-400 flex-shrink-0" />
                  : <XCircle size={20} className="text-slate-400 flex-shrink-0" />}
                <div>
                  <p className={`text-sm font-medium ${order.budgetStatus === 'approved' ? 'text-green-300' : 'text-slate-300'}`}>
                    {order.budgetStatus === 'approved'
                      ? '¡Presupuesto aprobado! Tu equipo está en reparación.'
                      : 'Presupuesto rechazado. El técnico será notificado.'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {order.budgetStatus === 'approved'
                      ? 'Te avisaremos cuando esté listo.'
                      : 'Podés pasar a retirar tu equipo.'}
                  </p>
                </div>
              </div>
            )}

            {/* Welcome banner */}
            <div className="bg-indigo-900/20 rounded-xl border border-indigo-800/50 px-5 py-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-indigo-300">
                  Hola{order.customerName ? `, ${order.customerName.split(' ')[0]}` : ''}! 👋
                </p>
                <p className="text-xs text-indigo-400/80 mt-0.5">
                  Acá podés ver el estado actualizado de tu reparación en tiempo real.
                </p>
              </div>
              {lastUpdated && (
                <p className="text-xs text-indigo-500 flex-shrink-0 mt-0.5">
                  Actualizado {formatDate(lastUpdated)}
                </p>
              )}
            </div>

            {/* Header card — order number + status */}
            <div className="bg-slate-900 rounded-xl border border-slate-700/60 p-5">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="font-mono text-base font-bold text-white">{order.orderNumber}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {deviceTypeLabel} — {order.deviceBrand} {order.deviceModel}
                    {order.deviceSerial ? ` · S/N ${order.deviceSerial}` : ''}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              {/* Key dates + price */}
              <div className="grid sm:grid-cols-3 gap-4 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Calendar size={14} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Fecha de ingreso</p>
                    <p className="text-sm font-medium text-slate-300">{formatDateShort(order.entryDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Clock size={14} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Entrega estimada</p>
                    <p className="text-sm font-medium text-slate-300">
                      {order.estimatedDelivery ? formatDateShort(order.estimatedDelivery) : 'A confirmar'}
                    </p>
                  </div>
                </div>
                {(order.finalPrice || order.estimatedPrice) && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <DollarSign size={14} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">
                        {order.finalPrice ? 'Precio final' : 'Precio estimado'}
                      </p>
                      <p className={`text-sm font-semibold ${order.finalPrice ? 'text-indigo-400' : 'text-slate-300'}`}>
                        {formatCurrency(order.finalPrice || order.estimatedPrice)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Issue & technician notes */}
              {order.reportedIssue && (
                <div className="bg-slate-800/50 rounded-lg p-3.5 mb-3">
                  <p className="text-xs font-medium text-slate-500 mb-1">Problema reportado</p>
                  <p className="text-sm text-slate-300">{order.reportedIssue}</p>
                </div>
              )}

              {order.technicianNotes && !showBudgetApproval && (
                <div className="bg-indigo-900/20 rounded-lg p-3.5 mb-3">
                  <p className="text-xs font-medium text-indigo-400 mb-1">Notas del técnico</p>
                  <p className="text-sm text-slate-300">{order.technicianNotes}</p>
                </div>
              )}

              {order.workDone && (
                <div className="bg-green-900/20 rounded-lg p-3.5 mb-3">
                  <p className="text-xs font-medium text-green-400 mb-1">Trabajo realizado</p>
                  <p className="text-sm text-slate-300">{order.workDone}</p>
                </div>
              )}

              {/* Budget status badge */}
              {order.budgetStatus && order.budgetStatus !== 'pending' && (
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck size={13} className="text-slate-400" />
                  <span className="text-xs text-slate-500">Presupuesto:</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${BUDGET_STATUS_CONFIG[order.budgetStatus]?.color}`}>
                    {BUDGET_STATUS_CONFIG[order.budgetStatus]?.label}
                  </span>
                </div>
              )}

              {/* WhatsApp button */}
              {order.customerPhone && (
                <button
                  onClick={openWhatsApp}
                  className="mt-2 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors w-full justify-center active:scale-95"
                >
                  <MessageCircle size={15} />
                  Consultar por WhatsApp
                </button>
              )}
            </div>

            {/* Device details */}
            <div className="bg-slate-900 rounded-xl border border-slate-700/60 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Smartphone size={15} className="text-slate-400" />
                <h2 className="font-semibold text-white text-sm">Detalles del Equipo</h2>
              </div>
              <div>
                <InfoRow label="Tipo" value={deviceTypeLabel} />
                <InfoRow label="Marca" value={order.deviceBrand} />
                <InfoRow label="Modelo" value={order.deviceModel} />
                <InfoRow label="N° de serie" value={order.deviceSerial} mono />
                {order.accessories?.length > 0 && (
                  <InfoRow label="Accesorios incluidos" value={order.accessories.join(', ')} />
                )}
              </div>

              {(order.powersOn !== null || order.charges !== null || order.screenWorks !== null ||
                order.touchWorks !== null || order.audioWorks !== null || order.buttonsWork !== null ||
                order.waterDamage || order.physicalDamage || order.previouslyOpened) && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <p className="text-xs font-medium text-slate-500 mb-3">Estado al ingreso</p>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                    <CheckItem label="Enciende" value={order.powersOn} />
                    <CheckItem label="Carga" value={order.charges} />
                    <CheckItem label="Pantalla funciona" value={order.screenWorks} />
                    <CheckItem label="Touch funciona" value={order.touchWorks} />
                    <CheckItem label="Audio funciona" value={order.audioWorks} />
                    <CheckItem label="Botones funcionan" value={order.buttonsWork} />
                    {order.waterDamage && (
                      <div className="flex items-center gap-2 col-span-2">
                        <Info size={13} className="text-amber-500 flex-shrink-0" />
                        <span className="text-xs text-amber-400">Daño por líquido</span>
                      </div>
                    )}
                    {order.physicalDamage && (
                      <div className="flex items-center gap-2 col-span-2">
                        <Info size={13} className="text-amber-500 flex-shrink-0" />
                        <span className="text-xs text-amber-400">Daño físico visible</span>
                      </div>
                    )}
                    {order.previouslyOpened && (
                      <div className="flex items-center gap-2 col-span-2">
                        <Info size={13} className="text-slate-400 flex-shrink-0" />
                        <span className="text-xs text-slate-400">Equipo abierto previamente</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Pricing breakdown */}
            {(order.estimatedPrice || order.finalPrice) && (
              <div className="bg-slate-900 rounded-xl border border-slate-700/60 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Tag size={15} className="text-slate-400" />
                  <h2 className="font-semibold text-white text-sm">Presupuesto</h2>
                </div>
                <InfoRow label="Precio estimado" value={order.estimatedPrice ? formatCurrency(order.estimatedPrice) : null} />
                {order.finalPrice && (
                  <div className="flex justify-between items-center pt-2 mt-1 border-t border-slate-800">
                    <span className="text-sm font-semibold text-slate-200">Precio final</span>
                    <span className="text-base font-bold text-indigo-400">{formatCurrency(order.finalPrice)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Status timeline */}
            <div className="bg-slate-900 rounded-xl border border-slate-700/60 p-5">
              <h2 className="font-semibold text-white text-sm mb-5">Historial de Estados</h2>
              <div className="relative">
                <div className="absolute left-3.5 top-0 bottom-0 w-px bg-slate-700" />
                <div className="space-y-5">
                  {(order.statusHistory || []).map((entry, i) => {
                    const cfg = STATUS_CONFIG[entry.status] || STATUS_CONFIG.pending
                    const isLatest = i === (order.statusHistory?.length || 1) - 1
                    return (
                      <div key={i} className="relative flex gap-4 pl-9">
                        <div className={`absolute left-1.5 top-1 w-4 h-4 rounded-full flex items-center justify-center ${isLatest ? cfg.dot : 'bg-slate-700'}`}>
                          {isLatest && <div className="w-2 h-2 rounded-full bg-slate-900" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm font-medium ${isLatest ? 'text-white' : 'text-slate-400'}`}>
                              {cfg.label}
                            </span>
                            <span className="text-xs text-slate-500">{formatDate(entry.timestamp)}</span>
                          </div>
                          {entry.note && <p className="text-xs text-slate-500 mt-0.5">{entry.note}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Progress overview */}
            <div className="bg-slate-900 rounded-xl border border-slate-700/60 p-5">
              <h2 className="font-semibold text-white text-sm mb-4">Progreso General</h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                  const isDone = order.statusHistory?.some((h) => h.status === key)
                  const isCurrent = order.status === key
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isCurrent
                          ? `${cfg.color} ring-2 ring-offset-1 ring-offset-slate-900`
                          : isDone
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-slate-800/50 text-slate-600'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isCurrent ? cfg.dot : isDone ? 'bg-slate-500' : 'bg-slate-700'}`} />
                      {cfg.label}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Search another order */}
            <div className="text-center">
              <button
                onClick={() => navigate('/track')}
                className="text-sm text-slate-500 hover:text-indigo-400 transition-colors"
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
