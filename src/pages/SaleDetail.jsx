import React, { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  Package,
  FileText,
  Trash2,
  ShoppingCart,
  Edit3,
  Check,
  X,
  MessageCircle,
  Mail,
  Share2,
  Link2,
  Printer,
  ChevronDown,
  ExternalLink,
  QrCode,
  Copy,
  Banknote,
  ArrowRightLeft,
  HandCoins,
  Truck,
  Hash,
} from 'lucide-react'
import QRCode from 'qrcode'
import { useStore } from '../store/useStore'
import { formatDate } from '../utils/constants'
import { useCurrency } from '../utils/useCurrency'
import { generateSalePDF } from '../utils/pdfGenerator'

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
  const [status,         setStatus]         = useState(sale.status || 'pending')
  const [notes,          setNotes]          = useState(sale.notes || '')
  const [paymentMethod,  setPaymentMethod]  = useState(sale.paymentMethod || '')
  const [deliveryMethod, setDeliveryMethod] = useState(sale.deliveryMethod || '')
  const [courierName,    setCourierName]    = useState(sale.courierName || '')
  const [trackingNumber, setTrackingNumber] = useState(sale.trackingNumber || '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Editar venta</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{sale.saleNumber}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Estado</label>
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

          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Observaciones de la venta..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
            />
          </div>

          {/* Método de pago */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Pago</label>
            <div className="flex gap-2">
              {[
                { value: 'cash',     label: 'Efectivo',      Icon: Banknote },
                { value: 'transfer', label: 'Transferencia', Icon: ArrowRightLeft },
              ].map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPaymentMethod(paymentMethod === value ? '' : value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all
                    ${paymentMethod === value
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 bg-white dark:bg-slate-800'
                    }`}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Entrega */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Entrega</label>
            <div className="flex gap-2 mb-2">
              {[
                { value: 'in_person', label: 'En mano', Icon: HandCoins },
                { value: 'shipped',   label: 'Correo',  Icon: Truck },
              ].map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDeliveryMethod(deliveryMethod === value ? '' : value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all
                    ${deliveryMethod === value
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 bg-white dark:bg-slate-800'
                    }`}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>
            {deliveryMethod === 'shipped' && (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Correo / empresa (Andreani, OCA...)"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
                />
                <input
                  type="text"
                  placeholder="Número de seguimiento"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave({
              status, notes, paymentMethod, deliveryMethod,
              courierName:    deliveryMethod === 'shipped' ? courierName.trim()    : '',
              trackingNumber: deliveryMethod === 'shipped' ? trackingNumber.trim() : '',
            })}
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
  const { sales, deleteSale, updateSale, settings } = useStore()
  const fmt = useCurrency()

  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [editing, setEditing] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [qrModal, setQrModal] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const contactRef = useRef(null)
  const shareRef = useRef(null)

  const sale = sales.find((s) => s.id === id)

  if (!sale) {
    return (
      <div className="p-6 max-w-3xl mx-auto flex flex-col items-center justify-center py-24 text-slate-400">
        <ShoppingCart size={40} className="mb-3 opacity-40" />
        <p className="font-medium text-slate-500 dark:text-slate-400">Venta no encontrada</p>
        <button onClick={() => navigate('/sales')} className="mt-4 text-sm text-emerald-600 hover:underline">
          Volver a ventas
        </button>
      </div>
    )
  }

  const subtotal = (sale.items || []).reduce((a, i) => a + (i.price || 0) * (i.qty || 1), 0)
  const costos   = (sale.items || []).reduce((a, i) => a + (i.cost  || 0) * (i.qty || 1), 0)
  const total    = sale.total ?? subtotal
  const ganancia = total - costos

  const hasClientData = sale.customerName || sale.customerPhone || sale.customerDni || sale.customerEmail || sale.customerAddress

  const hasWhatsApp = !!sale.customerPhone
  const hasMail     = !!sale.customerEmail
  const hasContact  = hasWhatsApp || hasMail

  function openWhatsApp() {
    const phone = sale.customerPhone?.replace(/\D/g, '')
    const msg = encodeURIComponent(`Hola ${sale.customerName || ''}, le enviamos el comprobante de su compra ${sale.saleNumber}.`)
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
  }

  function openMail() {
    const subject = encodeURIComponent(`Comprobante de venta ${sale.saleNumber}`)
    const body = encodeURIComponent(`Estimado/a ${sale.customerName || ''},\n\nAdjuntamos el comprobante de su compra ${sale.saleNumber}.\n\nGracias por su preferencia.`)
    window.open(`mailto:${sale.customerEmail}?subject=${subject}&body=${body}`)
  }

  function buildTrackingUrl() {
    return `${window.location.origin}/sale-track/${sale.saleNumber}`
  }

  function copySaleLink() {
    navigator.clipboard.writeText(buildTrackingUrl()).then(() => {
      setCopied(true)
      setShareOpen(false)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function openQrModal() {
    setShareOpen(false)
    const url = buildTrackingUrl()
    const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: '#1e2937', light: '#ffffff' } })
    setQrDataUrl(dataUrl)
    setQrModal(true)
  }

  function handleDelete() {
    deleteSale(sale.id)
    navigate('/sales')
  }

  function handleSave(data) {
    updateSale(sale.id, data)
    setEditing(false)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">

      {/* Header — same structure as OrderDetail */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white font-mono">{sale.saleNumber}</h1>
                <SaleBadge status={sale.status} />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {sale.customerName || '—'} · {formatDate(sale.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Contactar */}
          {hasContact && (
            <div className="relative" ref={contactRef}>
              <button
                onClick={() => { setShareOpen(false); setContactOpen((o) => !o) }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <MessageCircle size={14} />
                Contactar
                <ChevronDown size={13} className={`transition-transform ${contactOpen ? 'rotate-180' : ''}`} />
              </button>
              {contactOpen && (
                <div className="absolute left-0 mt-1.5 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                  {hasWhatsApp && (
                    <button
                      onClick={() => { setContactOpen(false); openWhatsApp() }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
                    >
                      <MessageCircle size={15} className="text-green-500" />
                      WhatsApp
                    </button>
                  )}
                  {hasMail && (
                    <button
                      onClick={() => { setContactOpen(false); openMail() }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
                    >
                      <Mail size={15} className="text-indigo-500" />
                      Mail
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Compartir */}
          <div className="relative" ref={shareRef}>
            <button
              onClick={() => { setContactOpen(false); setShareOpen((o) => !o) }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Share2 size={14} />}
              {copied ? 'Copiado!' : 'Compartir'}
              <ChevronDown size={13} className={`transition-transform ${shareOpen ? 'rotate-180' : ''}`} />
            </button>
            {shareOpen && (
              <div className="absolute left-0 mt-1.5 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                <button
                  onClick={openQrModal}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800"
                >
                  <QrCode size={15} className="text-emerald-500" />
                  Código QR
                </button>
                <button
                  onClick={copySaleLink}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Link2 size={15} className="text-emerald-500" />
                  Copiar enlace
                </button>
              </div>
            )}
          </div>

          {/* Seguimiento */}
          <button
            onClick={() => window.open(buildTrackingUrl(), '_blank')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ExternalLink size={14} />
            Seguimiento
          </button>

          {/* PDF */}
          <button
            onClick={() => generateSalePDF(sale, settings)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Printer size={14} />
            PDF
          </button>

          {/* Eliminar */}
          <button
            onClick={() => setDeleteConfirm(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-red-200 dark:border-red-800 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 size={14} />
            Eliminar
          </button>

          {/* Editar */}
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
          >
            <Edit3 size={14} />
            Editar
          </button>
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

        {/* Footer con desglose financiero */}
        {(sale.items || []).length > 0 && (
          <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-b-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Costo</span>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{fmt(costos)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Ganancia</span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{fmt(ganancia)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total</span>
              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{fmt(total)}</span>
            </div>
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

      {/* Pago y Entrega */}
      {(sale.paymentMethod || sale.deliveryMethod) && (
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-t-xl">
            <Banknote size={15} className="text-emerald-400" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Pago y Entrega</span>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5">
            {sale.paymentMethod && (
              <div className="flex items-center gap-3">
                {sale.paymentMethod === 'cash' ? <Banknote size={16} className="text-emerald-500 shrink-0" /> : <ArrowRightLeft size={16} className="text-blue-500 shrink-0" />}
                <div>
                  <p className="text-xs text-slate-400">Método de pago</p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {sale.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'}
                  </p>
                </div>
              </div>
            )}
            {sale.deliveryMethod && (
              <div className="flex items-center gap-3">
                {sale.deliveryMethod === 'in_person' ? <HandCoins size={16} className="text-emerald-500 shrink-0" /> : <Truck size={16} className="text-indigo-500 shrink-0" />}
                <div>
                  <p className="text-xs text-slate-400">Entrega</p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {sale.deliveryMethod === 'in_person' ? 'En mano' : 'Correo'}
                  </p>
                </div>
              </div>
            )}
            {sale.deliveryMethod === 'shipped' && sale.courierName && (
              <div className="flex items-center gap-3">
                <Truck size={16} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Empresa de correo</p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{sale.courierName}</p>
                </div>
              </div>
            )}
            {sale.deliveryMethod === 'shipped' && sale.trackingNumber && (
              <div className="flex items-center gap-3">
                <Hash size={16} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Número de seguimiento</p>
                  <p className="text-sm font-mono font-medium text-slate-800 dark:text-slate-200">{sale.trackingNumber}</p>
                </div>
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
        <EditSaleModal sale={sale} onSave={handleSave} onClose={() => setEditing(false)} />
      )}

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm" onClick={() => setQrModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 max-w-xs w-full shadow-2xl flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between w-full">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Código QR de seguimiento</h3>
                <p className="text-xs text-slate-400 mt-0.5">{sale.saleNumber}</p>
              </div>
              <button onClick={() => setQrModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X size={16} />
              </button>
            </div>
            {qrDataUrl && (
              <img src={qrDataUrl} alt="QR seguimiento" className="w-52 h-52 rounded-xl border border-slate-100 dark:border-slate-800" />
            )}
            <p className="text-xs text-slate-400 text-center leading-relaxed">
              El cliente puede escanear este QR para ver el estado de su venta en tiempo real
            </p>
            <div className="flex gap-2 w-full">
              <button
                onClick={copySaleLink}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                {copied ? 'Copiado!' : 'Copiar enlace'}
              </button>
              <a
                href={qrDataUrl}
                download={`qr-${sale.saleNumber}.png`}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-medium text-white transition-colors"
              >
                Descargar QR
              </a>
            </div>
          </div>
        </div>
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
