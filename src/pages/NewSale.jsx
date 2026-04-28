import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  Package,
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CheckCircle2,
  UserCheck,
  Pencil,
  X,
  Hash,
  Banknote,
  ArrowRightLeft,
  CreditCard,
  HandCoins,
  Truck,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { useCurrency } from '../utils/useCurrency'

const SALE_STATUSES = [
  { value: 'paid',      label: 'Pagado' },
  { value: 'pending',   label: 'Pendiente' },
  { value: 'cancelled', label: 'Cancelado' },
]

export default function NewSale() {
  const navigate = useNavigate()
  const { inventory, clients, searchClients, createSale, settings } = useStore()
  const fmt = useCurrency()

  // Customer
  const [customerName,    setCustomerName]    = useState('')
  const [customerPhone,   setCustomerPhone]   = useState('')
  const [customerDni,     setCustomerDni]     = useState('')
  const [customerEmail,   setCustomerEmail]   = useState('')
  const [customerAddress, setCustomerAddress] = useState('')

  // Client lock state (null = sin selección, objeto = cliente seleccionado y bloqueado)
  const [selectedClient, setSelectedClient] = useState(null)
  const [clientEditing,  setClientEditing]  = useState(false)
  const clientReadOnly = selectedClient !== null && !clientEditing

  // Client search
  const [clientQuery,   setClientQuery]   = useState('')
  const [clientResults, setClientResults] = useState([])
  const [clientFocused, setClientFocused] = useState(false)
  const clientRef = useRef(null)

  // Products
  const [productQuery,   setProductQuery]   = useState('')
  const [productResults, setProductResults] = useState([])
  const [productFocused, setProductFocused] = useState(false)
  const productRef = useRef(null)
  const [cartItems, setCartItems] = useState([])   // { id, name, price, cost, qty, stock }

  // Extra
  const [status,          setStatus]          = useState('paid')
  const [notes,           setNotes]           = useState('')
  const [paymentMethod,   setPaymentMethod]   = useState('')   // 'cash' | 'transfer' | ''
  const [deliveryMethod,  setDeliveryMethod]  = useState('')   // 'in_person' | 'shipped' | ''
  const [courierName,     setCourierName]     = useState('')
  const [trackingNumber,  setTrackingNumber]  = useState('')

  // Saving
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [errors, setErrors] = useState({})

  // ── Client search ──────────────────────────────────────────────
  useEffect(() => {
    if (clientQuery.length >= 2) {
      setClientResults(searchClients(clientQuery))
    } else {
      setClientResults([])
    }
  }, [clientQuery]) // eslint-disable-line

  useEffect(() => {
    const handler = (e) => {
      if (clientRef.current && !clientRef.current.contains(e.target)) setClientFocused(false)
      if (productRef.current && !productRef.current.contains(e.target)) setProductFocused(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function selectClient(c) {
    setSelectedClient(c)
    setClientEditing(false)
    setCustomerName(c.name || '')
    setCustomerPhone(c.phone || '')
    setCustomerDni(c.dni || '')
    setCustomerEmail(c.email || '')
    setCustomerAddress(c.address || '')
    setClientQuery('')
    setClientResults([])
    setClientFocused(false)
  }

  function clearSelectedClient() {
    setSelectedClient(null)
    setClientEditing(false)
    setCustomerName('')
    setCustomerPhone('')
    setCustomerDni('')
    setCustomerEmail('')
    setCustomerAddress('')
  }

  // ── Product search ─────────────────────────────────────────────
  useEffect(() => {
    if (productQuery.length >= 1) {
      const q = productQuery.toLowerCase()
      setProductResults(
        inventory
          .filter((item) =>
            (item.name?.toLowerCase().includes(q) ||
             item.sku?.toLowerCase().includes(q) ||
             item.category?.toLowerCase().includes(q)) &&
            (item.stock || 0) > 0
          )
          .slice(0, 8)
      )
    } else {
      setProductResults([])
    }
  }, [productQuery, inventory])

  function addToCart(item) {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        if (existing.qty >= item.stock) return prev
        return prev.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, {
        id:         item.id,
        name:       item.name,
        price:      item.salePrice || item.price || 0,
        cost:       item.costPrice || item.cost  || 0,
        stock:      item.stock  || 0,
        qty:        1,
        identifier: '',
      }]
    })
    setProductQuery('')
    setProductResults([])
    setProductFocused(false)
  }

  function changeQty(id, delta) {
    setCartItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i
        const next = Math.max(1, Math.min(i.stock, i.qty + delta))
        return { ...i, qty: next }
      })
    )
  }

  function removeFromCart(id) {
    setCartItems((prev) => prev.filter((i) => i.id !== id))
  }

  function setIdentifier(id, value) {
    setCartItems((prev) => prev.map((i) => i.id === id ? { ...i, identifier: value } : i))
  }

  const subtotal = cartItems.reduce((a, i) => a + i.price * i.qty, 0)

  const paymentAdj = paymentMethod ? settings?.paymentAdjustments?.[paymentMethod] : null
  const adjActive  = paymentAdj?.enabled && paymentAdj?.value > 0
  const adjAmount  = adjActive
    ? (paymentAdj.type === 'discount' ? -1 : 1) * (subtotal * paymentAdj.value) / 100
    : 0
  const total = subtotal + adjAmount

  // ── Validate & submit ──────────────────────────────────────────
  function validate() {
    const errs = {}
    if (!customerName.trim()) errs.customerName = 'El nombre es obligatorio'
    if (cartItems.length === 0) errs.items = 'Agregá al menos un producto'
    return errs
  }

  async function handleSubmit() {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    createSale({
      customerName:    customerName.trim(),
      customerPhone:   customerPhone.trim(),
      customerDni:     customerDni.trim(),
      customerEmail:   customerEmail.trim(),
      customerAddress: customerAddress.trim(),
      items: cartItems,
      subtotal,
      total,
      paymentAdjustment: adjActive ? { type: paymentAdj.type, value: paymentAdj.value, amount: adjAmount } : null,
      status,
      notes: notes.trim(),
      paymentMethod,
      deliveryMethod,
      courierName:    deliveryMethod === 'shipped' ? courierName.trim()    : '',
      trackingNumber: deliveryMethod === 'shipped' ? trackingNumber.trim() : '',
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => navigate('/sales'), 1200)
  }

  if (saved) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-slate-400">
        <CheckCircle2 size={52} className="text-emerald-500" />
        <p className="text-lg font-semibold text-slate-900 dark:text-white">¡Venta registrada!</p>
        <p className="text-sm">Redirigiendo...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/sales')}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Nueva Venta</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Registrá una venta directa con descuento automático de inventario</p>
        </div>
      </div>

      {/* Customer */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-t-xl">
          <User size={15} className="text-indigo-400" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Datos del Cliente</span>
        </div>
        <div className="p-5 space-y-4">
          {/* Chip si hay cliente seleccionado, buscador si no */}
          {selectedClient && !clientEditing ? (
            <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700/60">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center flex-shrink-0">
                  <UserCheck size={14} className="text-indigo-600 dark:text-indigo-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 truncate">{selectedClient.name}</p>
                  <p className="text-xs text-indigo-500 dark:text-indigo-400 truncate">
                    {[selectedClient.phone, selectedClient.dni && `DNI ${selectedClient.dni}`, selectedClient.email].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                <button
                  type="button"
                  onClick={() => setClientEditing(true)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-800/60 transition-colors"
                >
                  <Pencil size={11} />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={clearSelectedClient}
                  title="Cambiar cliente"
                  className="p-1 rounded-md text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-800/60 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div ref={clientRef} className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar cliente por nombre, teléfono o DNI..."
                  value={clientQuery}
                  onChange={(e) => setClientQuery(e.target.value)}
                  onFocus={() => setClientFocused(true)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition"
                />
                {clientFocused && clientResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    {clientResults.map((c) => (
                      <button
                        key={c.id}
                        onMouseDown={() => selectClient(c)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-indigo-500 uppercase">{c.name?.[0] || '?'}</span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{c.name}</p>
                          <p className="text-xs text-slate-400">{[c.phone, c.dni && `DNI ${c.dni}`, c.email].filter(Boolean).join(' · ')}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1.5">o completá los datos manualmente:</p>
            </div>
          )}

          {/* Aviso modo edición */}
          {clientEditing && selectedClient && (
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Pencil size={11} />
              Editando datos del cliente — los cambios se guardarán al confirmar la venta
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Nombre <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Nombre completo"
                value={customerName}
                readOnly={clientReadOnly}
                onChange={(e) => { if (!clientReadOnly) { setCustomerName(e.target.value); setErrors((p) => ({ ...p, customerName: '' })) } }}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition
                  ${clientReadOnly
                    ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 cursor-default text-slate-500 dark:text-slate-400'
                    : `bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500/40 ${errors.customerName ? 'border-red-400' : 'border-slate-200 dark:border-slate-700 focus:border-indigo-400'}`}`}
              />
              {errors.customerName && <p className="text-xs text-red-400 mt-1">{errors.customerName}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">DNI</label>
              <input
                type="text"
                placeholder="12345678"
                value={customerDni}
                readOnly={clientReadOnly}
                onChange={(e) => { if (!clientReadOnly) setCustomerDni(e.target.value) }}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition
                  ${clientReadOnly
                    ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 cursor-default text-slate-500 dark:text-slate-400'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400'}`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Teléfono</label>
              <input
                type="text"
                placeholder="011 1234-5678"
                value={customerPhone}
                readOnly={clientReadOnly}
                onChange={(e) => { if (!clientReadOnly) setCustomerPhone(e.target.value) }}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition
                  ${clientReadOnly
                    ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 cursor-default text-slate-500 dark:text-slate-400'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400'}`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email</label>
              <input
                type="email"
                placeholder="cliente@mail.com"
                value={customerEmail}
                readOnly={clientReadOnly}
                onChange={(e) => { if (!clientReadOnly) setCustomerEmail(e.target.value) }}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition
                  ${clientReadOnly
                    ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 cursor-default text-slate-500 dark:text-slate-400'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400'}`}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Dirección</label>
            <input
              type="text"
              placeholder="Calle, número, ciudad..."
              value={customerAddress}
              readOnly={clientReadOnly}
              onChange={(e) => { if (!clientReadOnly) setCustomerAddress(e.target.value) }}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition
                ${clientReadOnly
                  ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 cursor-default text-slate-500 dark:text-slate-400'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400'}`}
            />
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-t-xl">
          <Package size={15} className="text-emerald-400" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Productos</span>
        </div>
        <div className="p-5 space-y-4">
          {/* Product search */}
          <div className="relative" ref={productRef}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar producto del inventario..."
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              onFocus={() => setProductFocused(true)}
              className={`w-full pl-8 pr-4 py-2.5 rounded-lg border text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition ${errors.items ? 'border-red-400' : 'border-slate-200 dark:border-slate-700 focus:border-emerald-400'}`}
            />
            {productFocused && productResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                {productResults.map((item) => (
                  <button
                    key={item.id}
                    onMouseDown={() => { addToCart(item); setErrors((p) => ({ ...p, items: '' })) }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.category || ''}{item.sku ? ` · ${item.sku}` : ''} · Stock: {item.stock}</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-500 ml-4 flex-shrink-0">
                      {fmt(item.price)}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {productFocused && productQuery.length >= 1 && productResults.length === 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 px-4 py-3 text-sm text-slate-400">
                Sin resultados o sin stock disponible
              </div>
            )}
          </div>
          {errors.items && <p className="text-xs text-red-400">{errors.items}</p>}

          {/* Cart */}
          {cartItems.length > 0 && (
            <div className="space-y-2">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 overflow-hidden"
                >
                  {/* Product row */}
                  <div className="flex items-center gap-3 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.name}</p>
                      <p className="text-xs text-slate-400">{fmt(item.price)} c/u · stock: {item.stock}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => changeQty(item.id, -1)}
                        className="w-6 h-6 rounded-md flex items-center justify-center bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-slate-600 dark:text-slate-300"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold text-slate-900 dark:text-white">{item.qty}</span>
                      <button
                        onClick={() => changeQty(item.id, 1)}
                        disabled={item.qty >= item.stock}
                        className="w-6 h-6 rounded-md flex items-center justify-center bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 w-24 text-right flex-shrink-0">
                      {fmt(item.price * item.qty)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 rounded text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {/* Identifier row */}
                  <div className="flex items-center gap-2 px-3 pb-3">
                    <Hash size={12} className="text-slate-400 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Identificador opcional (serial, IMEI, ID...)"
                      value={item.identifier}
                      onChange={(e) => setIdentifier(item.id, e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-400 transition"
                    />
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 overflow-hidden">
                {adjActive && (
                  <>
                    <div className="flex items-center justify-between px-3 py-2 border-b border-emerald-100 dark:border-emerald-800/40">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Subtotal</span>
                      <span className="text-sm text-slate-600 dark:text-slate-300">{fmt(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 border-b border-emerald-100 dark:border-emerald-800/40">
                      <span className={`text-xs font-medium ${paymentAdj.type === 'discount' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {paymentAdj.type === 'discount' ? 'Descuento' : 'Recargo'}{` ${paymentMethod === 'cash' ? 'efectivo' : paymentMethod === 'transfer' ? 'transferencia' : 'tarjeta'} (${paymentAdj.value}%)`}
                      </span>
                      <span className={`text-sm font-medium ${paymentAdj.type === 'discount' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {paymentAdj.type === 'discount' ? '-' : '+'}{fmt(Math.abs(adjAmount))}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Total</span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{fmt(total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Status + Payment + Delivery + Notes */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition"
            >
              {SALE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Notas internas</label>
            <input
              type="text"
              placeholder="Observaciones opcionales"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition"
            />
          </div>
        </div>

        {/* Método de pago */}
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Método de pago</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'cash',     label: 'Efectivo',      Icon: Banknote },
              { value: 'transfer', label: 'Transferencia', Icon: ArrowRightLeft },
              { value: 'card',     label: 'Tarjeta',       Icon: CreditCard },
            ].map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setPaymentMethod(paymentMethod === value ? '' : value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all
                  ${paymentMethod === value
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800'
                  }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Método de entrega */}
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Entrega</label>
          <div className="flex gap-2 mb-3">
            {[
              { value: 'in_person', label: 'En mano',  Icon: HandCoins },
              { value: 'shipped',   label: 'Correo',   Icon: Truck },
            ].map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setDeliveryMethod(deliveryMethod === value ? '' : value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all
                  ${deliveryMethod === value
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800'
                  }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
          {deliveryMethod === 'shipped' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Correo / empresa</label>
                <input
                  type="text"
                  placeholder="Ej: Andreani, OCA, DHL..."
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Número de seguimiento</label>
                <input
                  type="text"
                  placeholder="Ej: AR123456789"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pb-6">
        <button
          onClick={() => navigate('/sales')}
          className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
        >
          <ShoppingCart size={15} />
          {saving ? 'Guardando...' : 'Confirmar venta'}
        </button>
      </div>
    </div>
  )
}
