/**
 * pages/OrderDetail.jsx — Detalle completo de una orden de servicio.
 *
 * Ruta: /orders/:id
 * Muestra toda la información de la orden: datos del cliente, dispositivo,
 * diagnóstico, checklist técnico, presupuesto, historial de estados y fechas.
 * Permite:
 *  - Editar la orden (despliega OrderForm en modo edición).
 *  - Generar e imprimir PDF de la orden (generateInvoicePDF).
 *  - Eliminar la orden con confirmación.
 * Usa íconos TriState para visualizar el resultado del checklist técnico.
 */
import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Edit3, Printer, ExternalLink, CheckCircle2, XCircle, MinusCircle,
  Clock, User, Smartphone, Shield, FileText, DollarSign, Activity, Copy, Check, Trash2,
  RefreshCw, Camera, ZoomIn, X, ChevronLeft, ChevronRight, MessageCircle, Share2, QrCode, Link2,
} from 'lucide-react'
import QRCode from 'qrcode'
import { useStore } from '../store/useStore'
import { StatusBadge, BudgetBadge } from '../components/StatusBadge'
import OrderForm from '../components/OrderForm'
import { formatDate, formatDateShort, formatCurrency, DEVICE_TYPES, STATUS_CONFIG } from '../utils/constants'
import { turso, isTursoConfigured } from '../lib/turso'
import { generateInvoicePDF } from '../utils/pdfGenerator'
import PatternInput from '../components/PatternInput'

function PhotoGallery({ photos, label, dark = false }) {
  const [lightbox, setLightbox] = useState(null)

  const prev = () => setLightbox((i) => (i - 1 + photos.length) % photos.length)
  const next = () => setLightbox((i) => (i + 1) % photos.length)

  if (!photos?.length) return null

  const borderClass = dark
    ? 'border-slate-700/60 bg-slate-900'
    : 'border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900'

  return (
    <>
      <div className={`rounded-xl border p-5 ${borderClass}`}>
        <div className="flex items-center gap-2 mb-4">
          <Camera size={14} className="text-indigo-500" />
          <h2 className={`font-semibold text-sm ${dark ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
            {label || 'Fotos del equipo'}
          </h2>
          <span className={`text-xs ml-auto ${dark ? 'text-slate-500' : 'text-slate-400 dark:text-slate-500'}`}>
            {photos.length} foto{photos.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {photos.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setLightbox(i)}
              className="relative group aspect-square rounded-lg overflow-hidden bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <img src={src} alt={`foto-${i + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <ZoomIn size={18} className="text-white" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={photos[lightbox]}
              alt={`foto-${lightbox + 1}`}
              className="w-full h-full object-contain rounded-xl"
            />
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/80 flex items-center justify-center text-white hover:bg-slate-800 transition-colors"
            >
              <X size={16} />
            </button>
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/80 flex items-center justify-center text-white hover:bg-slate-700 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="absolute right-12 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/80 flex items-center justify-center text-white hover:bg-slate-700 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLightbox(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${i === lightbox ? 'bg-white' : 'bg-slate-600 hover:bg-slate-400'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

const TriIcon = ({ val }) => {
  if (val === true) return <CheckCircle2 size={15} className="text-green-500" />
  if (val === false) return <XCircle size={15} className="text-red-500" />
  return <MinusCircle size={15} className="text-slate-300 dark:text-slate-600" />
}

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-4 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
    <span className="text-xs text-slate-400 dark:text-slate-500 sm:w-36 flex-shrink-0">{label}</span>
    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{value || '—'}</span>
  </div>
)

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getOrder, updateOrder, deleteOrder, auth } = useStore()
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [remoteOrder, setRemoteOrder] = useState(null)
  const [loadingRemote, setLoadingRemote] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [qrModal, setQrModal] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const shareRef = useRef(null)

  // Cerrar dropdown share al click fuera
  useEffect(() => {
    const handler = (e) => { if (shareRef.current && !shareRef.current.contains(e.target)) setShareOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isSuperAdmin = auth?.role === 'superadmin'
  const localOrder = getOrder(id)

  // Si el superadmin no encuentra la orden localmente, buscarla en Turso
  useEffect(() => {
    if (localOrder || !isSuperAdmin || !isTursoConfigured) return
    setLoadingRemote(true)
    turso.execute({ sql: 'SELECT data FROM orders WHERE id = ? LIMIT 1', args: [id] })
      .then((res) => {
        const row = res.rows[0]
        if (row) setRemoteOrder(JSON.parse(row.data))
      })
      .catch(() => {})
      .finally(() => setLoadingRemote(false))
  }, [id, localOrder, isSuperAdmin])

  const order = localOrder || remoteOrder
  // El superadmin puede ver órdenes ajenas pero no editarlas (son de otro usuario)
  // isOwner: la orden fue encontrada localmente (no es de otro usuario via Turso)
  const isOwner = !remoteOrder || localOrder !== null

  if (loadingRemote) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-64 text-slate-400 gap-3">
        <RefreshCw size={20} className="animate-spin" />
        <p className="text-sm">Cargando orden...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-64 text-slate-400">
        <p className="text-lg font-medium">Orden no encontrada</p>
        <Link to="/orders" className="mt-3 text-sm text-indigo-600 hover:underline">Volver a órdenes</Link>
      </div>
    )
  }

  const handleUpdate = (data) => {
    updateOrder(id, data)
    setEditing(false)
  }

  const buildTrackingUrl = () => {
    return `${window.location.origin}/track/${order.orderNumber}`
  }

  const copyTrackingLink = () => {
    navigator.clipboard.writeText(buildTrackingUrl())
    setCopied(true)
    setShareOpen(false)
    setTimeout(() => setCopied(false), 2000)
  }

  const openQrModal = async () => {
    setShareOpen(false)
    const url = buildTrackingUrl()
    const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: '#1e2937', light: '#ffffff' } })
    setQrDataUrl(dataUrl)
    setQrModal(true)
  }

  const openWhatsApp = () => {
    const phone = (order.customerPhone || '').replace(/\D/g, '')
    if (!phone) return
    const status = STATUS_CONFIG[order.status]?.label || order.status
    const trackingUrl = buildTrackingUrl()
    const msg = [
      `¡Hola ${order.customerName || 'cliente'}! 👋`,
      `Te contactamos desde el taller por tu ${order.deviceBrand ? order.deviceBrand + ' ' : ''}${order.deviceModel || 'equipo'}.`,
      ``,
      `📋 *Orden:* ${order.orderNumber}`,
      `🔧 *Estado:* ${status}`,
      order.estimatedDelivery ? `📅 *Entrega estimada:* ${order.estimatedDelivery}` : '',
      order.finalPrice ? `💰 *Precio final:* $${order.finalPrice}` : '',
      ``,
      `🔗 Seguí el estado de tu reparación en: ${trackingUrl}`,
    ].filter((l) => l !== undefined && !(l === '' && false)).join('\n')
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const hasWhatsApp = !!(order.customerPhone || '').replace(/\D/g, '')

  const deviceTypeLabel = DEVICE_TYPES.find((d) => d.value === order.deviceType)?.label || order.deviceType

  if (editing) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditing(false)}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Order</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{order.orderNumber}</p>
          </div>
        </div>
        <OrderForm initialData={order} onSubmit={handleUpdate} onCancel={() => setEditing(false)} submitLabel="Save Changes" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white font-mono">{order.orderNumber}</h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {order.customerName} · {order.deviceBrand} {order.deviceModel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Badge de solo lectura cuando superadmin ve orden ajena */}
          {!isOwner && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              Solo lectura · {order.createdBy}
            </span>
          )}
          {hasWhatsApp && (
            <button
              onClick={openWhatsApp}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-green-200 dark:border-green-800/60 bg-green-50 dark:bg-green-900/20 text-sm text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors font-medium"
            >
              <MessageCircle size={14} />
              WhatsApp
            </button>
          )}
          {/* Dropdown Compartir */}
          <div className="relative" ref={shareRef}>
            <button
              onClick={() => setShareOpen((o) => !o)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Share2 size={14} />}
              {copied ? 'Copiado!' : 'Compartir'}
            </button>
            {shareOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                <button
                  onClick={openQrModal}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800"
                >
                  <QrCode size={15} className="text-indigo-500" />
                  Código QR
                </button>
                <button
                  onClick={copyTrackingLink}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Link2 size={15} className="text-indigo-500" />
                  Copiar enlace
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => window.open(buildTrackingUrl(), '_blank')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ExternalLink size={14} />
            Seguimiento
          </button>
          <button
            onClick={() => generateInvoicePDF(order)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Printer size={14} />
            PDF
          </button>
          {isOwner && (
            <>
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-red-200 dark:border-red-800 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 size={14} />
                Eliminar
              </button>
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
              >
                <Edit3 size={14} />
                Editar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Delete Order?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              This action cannot be undone. The order and all its data will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { deleteOrder(id); navigate('/orders') }}
                className="flex-1 py-2 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm" onClick={() => setQrModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 max-w-xs w-full shadow-2xl flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between w-full">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Código QR de seguimiento</h3>
                <p className="text-xs text-slate-400 mt-0.5">{order.orderNumber}</p>
              </div>
              <button onClick={() => setQrModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X size={16} />
              </button>
            </div>
            {qrDataUrl && (
              <img src={qrDataUrl} alt="QR seguimiento" className="w-52 h-52 rounded-xl border border-slate-100 dark:border-slate-800" />
            )}
            <p className="text-xs text-slate-400 text-center leading-relaxed">
              El cliente puede escanear este QR para ver el estado de su reparación en tiempo real
            </p>
            <div className="flex gap-2 w-full">
              <button
                onClick={copyTrackingLink}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                {copied ? 'Copiado!' : 'Copiar enlace'}
              </button>
              <a
                href={qrDataUrl}
                download={`qr-${order.orderNumber}.png`}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-medium text-white transition-colors"
              >
                Descargar QR
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Customer */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <User size={14} className="text-indigo-500" />
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Cliente</h2>
            </div>
            <InfoRow label="Nombre completo" value={order.customerName} />
            <InfoRow label="DNI" value={order.customerDni} />
            <InfoRow label="Teléfono (WhatsApp)" value={order.customerPhone} />
            <InfoRow label="Email" value={order.customerEmail} />
            <InfoRow label="Dirección" value={order.customerAddress} />
          </div>

          {/* Device */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Smartphone size={14} className="text-indigo-500" />
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Device</h2>
            </div>
            <InfoRow label="Type" value={deviceTypeLabel} />
            <InfoRow label="Brand" value={order.deviceBrand} />
            <InfoRow label="Model" value={order.deviceModel} />
            <InfoRow label="Serial / IMEI" value={order.deviceSerial} />
            <InfoRow label="Associated Email" value={order.deviceEmail} />
            <div className="py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <span className="text-xs text-slate-400 dark:text-slate-500 block mb-1.5">Accessories</span>
              {order.accessories?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {order.accessories.map((a) => (
                    <span key={a} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">{a}</span>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-slate-700 dark:text-slate-300">—</span>
              )}
            </div>
          </div>

          {/* Diagnosis */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={14} className="text-indigo-500" />
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Diagnosis</h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Customer-Reported Issue</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{order.reportedIssue || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Technician Notes</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{order.technicianNotes || '—'}</p>
              </div>
              <div className="flex gap-2 flex-wrap pt-1">
                {[
                  { key: 'waterDamage', label: 'Water Damage', activeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
                  { key: 'physicalDamage', label: 'Physical Damage', activeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
                  { key: 'previouslyOpened', label: 'Previously Opened', activeColor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
                ].map(({ key, label, activeColor }) => (
                  <span
                    key={key}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${order[key] ? activeColor : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 line-through'}`}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Photos */}
          <PhotoGallery photos={order.photosEntry} label="Fotos de ingreso" />
          <PhotoGallery photos={order.photosExit} label="Fotos de salida" />

          {/* Technical Checklist */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-5">
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Technical Checklist</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { key: 'powersOn', label: 'Powers On' },
                { key: 'charges', label: 'Charges' },
                { key: 'screenWorks', label: 'Screen Works' },
                { key: 'touchWorks', label: 'Touch Works' },
                { key: 'audioWorks', label: 'Audio Works' },
                { key: 'buttonsWork', label: 'Buttons Work' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                  <TriIcon val={order[key]} />
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={14} className="text-indigo-500" />
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Seguridad</h2>
            </div>
            <InfoRow label="Contraseña / PIN" value={order.devicePassword} />
            {order.devicePattern?.length > 0 && (
              <div className="py-2.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-400 dark:text-slate-500 block mb-2">Patrón de desbloqueo</span>
                <PatternInput value={order.devicePattern} readOnly />
              </div>
            )}
            <InfoRow label="Notas de bloqueo" value={order.lockNotes} />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Budget */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={14} className="text-indigo-500" />
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Budget</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Estimated</span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatCurrency(order.estimatedPrice)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Repair Cost</span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatCurrency(order.repairCost)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-t border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">Final Price</span>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(order.finalPrice)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Budget Status</span>
                <BudgetBadge status={order.budgetStatus} />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={14} className="text-indigo-500" />
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Dates</h2>
            </div>
            <InfoRow label="Fecha de ingreso" value={formatDate(order.entryDate)} />
            <InfoRow label="Entrega estimada" value={order.estimatedDelivery ? formatDateShort(order.estimatedDelivery) : '—'} />
            <InfoRow label="Fecha de entrega real" value={formatDate(order.deliveryDate)} />
          </div>

          {/* Work Done */}
          {order.workDone && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={14} className="text-indigo-500" />
                <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Work Performed</h2>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{order.workDone}</p>
            </div>
          )}

          {/* Status Timeline */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-5">
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Status History</h2>
            <div className="relative">
              <div className="absolute left-3.5 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="space-y-4">
                {(order.statusHistory || []).map((entry, i) => {
                  const cfg = STATUS_CONFIG[entry.status] || STATUS_CONFIG.pending
                  return (
                    <div key={i} className="relative flex gap-4 pl-8">
                      <div className={`absolute left-2 top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${cfg.dot}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{cfg.label}</span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">{formatDateShort(entry.timestamp)}</span>
                        </div>
                        {entry.note && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{entry.note}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
