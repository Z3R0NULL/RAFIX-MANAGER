import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Edit3, Printer, ExternalLink, CheckCircle2, XCircle, MinusCircle,
  Clock, User, Smartphone, Shield, FileText, DollarSign, Activity, Copy, Check
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { StatusBadge, BudgetBadge } from '../components/StatusBadge'
import OrderForm from '../components/OrderForm'
import { formatDate, formatDateShort, formatCurrency, DEVICE_TYPES, STATUS_CONFIG } from '../utils/constants'
import { generateInvoicePDF } from '../utils/pdfGenerator'

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
  const { getOrder, updateOrder } = useStore()
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)

  const order = getOrder(id)

  if (!order) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-64 text-slate-400">
        <p className="text-lg font-medium">Order not found</p>
        <Link to="/orders" className="mt-3 text-sm text-indigo-600 hover:underline">Back to orders</Link>
      </div>
    )
  }

  const handleUpdate = (data) => {
    updateOrder(id, data)
    setEditing(false)
  }

  const copyTrackingLink = () => {
    const url = `${window.location.origin}/track/${order.orderNumber}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
          <button
            onClick={copyTrackingLink}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Share Link'}
          </button>
          <Link
            to={`/track/${order.orderNumber}`}
            target="_blank"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ExternalLink size={14} />
            Track Page
          </Link>
          <button
            onClick={() => generateInvoicePDF(order)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Printer size={14} />
            PDF Invoice
          </button>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
          >
            <Edit3 size={14} />
            Edit
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Customer */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <User size={14} className="text-indigo-500" />
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Customer</h2>
            </div>
            <InfoRow label="Full Name" value={order.customerName} />
            <InfoRow label="ID / DNI" value={order.customerDni} />
            <InfoRow label="Phone (WhatsApp)" value={order.customerPhone} />
            <InfoRow label="Email" value={order.customerEmail} />
            <InfoRow label="Address" value={order.customerAddress} />
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
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Security</h2>
            </div>
            <InfoRow label="Password / PIN" value={order.devicePassword} />
            <InfoRow label="Lock Notes" value={order.lockNotes} />
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
            <InfoRow label="Entry Date" value={formatDate(order.entryDate)} />
            <InfoRow label="Delivery Date" value={formatDate(order.deliveryDate)} />
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
