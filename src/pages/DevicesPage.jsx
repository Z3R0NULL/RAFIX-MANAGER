/**
 * pages/DevicesPage.jsx
 *
 * Ruta: /devices
 * Dos pestañas:
 *  1. Historial — agrupa las órdenes del usuario por modelo y muestra estadísticas.
 *  2. Catálogo  — listado de dispositivos en DB, separados por categoría.
 *                 CRUD completo: agregar / editar / eliminar modelos.
 */
import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Smartphone, ChevronRight, Search, TrendingUp, Clock, CheckCircle2,
  Wrench, BookOpen, Plus, Pencil, Trash2, X, ChevronDown, ChevronRight as CR,
  Loader2, AlertCircle,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { DEVICE_TYPES, STATUS_CONFIG, formatCurrency } from '../utils/constants'

// ── Modal genérico ───────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700/60">
          <h2 className="font-semibold text-slate-900 dark:text-white text-sm">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={15} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ── Formulario agregar / editar ──────────────────────────────────────────────
const CATEGORIES = DEVICE_TYPES.map((d) => d.label)

function CatalogForm({ initial, onSave, onClose, loading }) {
  const [form, setForm] = useState({
    category: initial?.category || '',
    brand: initial?.brand || '',
    model: initial?.model || '',
  })
  const [error, setError] = useState('')

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.category.trim()) return setError('La categoría es requerida.')
    if (!form.brand.trim()) return setError('La marca es requerida.')
    if (!form.model.trim()) return setError('El modelo es requerido.')
    setError('')
    onSave(form)
  }

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition'
  const labelClass = 'block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>Categoría</label>
        <select className={inputClass} value={form.category} onChange={f('category')} required>
          <option value="">Seleccionar categoría...</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className={labelClass}>Marca</label>
        <input className={inputClass} value={form.brand} onChange={f('brand')} placeholder="Samsung, Apple, Dell…" required />
      </div>
      <div>
        <label className={labelClass}>Modelo</label>
        <input className={inputClass} value={form.model} onChange={f('model')} placeholder="Galaxy S24 Ultra, iPhone 15 Pro…" required />
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
          <AlertCircle size={13} /> {error}
        </p>
      )}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-60">
          {loading && <Loader2 size={13} className="animate-spin" />}
          {initial ? 'Guardar cambios' : 'Agregar modelo'}
        </button>
      </div>
    </form>
  )
}

// ── Pestaña Catálogo ─────────────────────────────────────────────────────────
function CatalogTab() {
  const deviceCatalog = useStore((s) => s.deviceCatalog)
  const addCatalogItem = useStore((s) => s.addCatalogItem)
  const updateCatalogItem = useStore((s) => s.updateCatalogItem)
  const deleteCatalogItem = useStore((s) => s.deleteCatalogItem)

  const [q, setQ] = useState('')
  const [modal, setModal] = useState(null) // null | { type: 'add' | 'edit' | 'delete', item? }
  const [loading, setLoading] = useState(false)
  const [expandedCats, setExpandedCats] = useState({})

  // Group by category → brand → models
  const grouped = useMemo(() => {
    const lower = q.toLowerCase()
    const filtered = q.trim()
      ? deviceCatalog.filter(
          (item) =>
            item.category.toLowerCase().includes(lower) ||
            item.brand.toLowerCase().includes(lower) ||
            item.model.toLowerCase().includes(lower)
        )
      : deviceCatalog

    const map = {}
    for (const item of filtered) {
      if (!map[item.category]) map[item.category] = {}
      if (!map[item.category][item.brand]) map[item.category][item.brand] = []
      map[item.category][item.brand].push(item)
    }
    return map
  }, [deviceCatalog, q])

  const toggleCat = (cat) =>
    setExpandedCats((p) => ({ ...p, [cat]: p[cat] === false ? true : false }))

  const isCatExpanded = (cat) => expandedCats[cat] !== false // default open

  const handleAdd = (form) => {
    setLoading(true)
    addCatalogItem(form)
    setLoading(false)
    setModal(null)
  }

  const handleEdit = (form) => {
    setLoading(true)
    updateCatalogItem(modal.item.id, form)
    setLoading(false)
    setModal(null)
  }

  const handleDelete = () => {
    deleteCatalogItem(modal.item.id)
    setModal(null)
  }

  const totalItems = deviceCatalog.length
  const totalCategories = Object.keys(grouped).length
  const totalBrands = useMemo(() => {
    const brands = new Set(deviceCatalog.map((i) => `${i.category}__${i.brand}`))
    return brands.size
  }, [deviceCatalog])

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Categorías', value: Object.keys(grouped).length || totalCategories },
          { label: 'Marcas', value: totalBrands },
          { label: 'Modelos', value: totalItems },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar categoría, marca o modelo..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition shadow-sm"
          />
        </div>
        <button
          onClick={() => setModal({ type: 'add' })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={15} />
          Agregar modelo
        </button>
      </div>

      {/* Catalog grouped by category */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60">
          <BookOpen size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">
            {deviceCatalog.length === 0 ? 'El catálogo está vacío. Agregá tu primer modelo.' : 'Sin resultados para esa búsqueda.'}
          </p>
          {deviceCatalog.length === 0 && (
            <button
              onClick={() => setModal({ type: 'add' })}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
            >
              <Plus size={14} /> Agregar modelo
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([category, brands]) => {
            const expanded = isCatExpanded(category)
            const modelCount = Object.values(brands).flat().length
            return (
              <div key={category} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
                {/* Category header */}
                <button
                  type="button"
                  onClick={() => toggleCat(category)}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                      <Smartphone size={14} className="text-indigo-500" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{category}</p>
                      <p className="text-xs text-slate-400">
                        {Object.keys(brands).length} marca{Object.keys(brands).length !== 1 ? 's' : ''} · {modelCount} modelo{modelCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {expanded
                    ? <ChevronDown size={15} className="text-slate-400 flex-shrink-0" />
                    : <CR size={15} className="text-slate-400 flex-shrink-0" />
                  }
                </button>

                {/* Brands + models */}
                {expanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                    {Object.entries(brands).map(([brand, items]) => (
                      <div key={brand}>
                        {/* Brand sub-header */}
                        <div className="px-5 py-2 bg-slate-50/70 dark:bg-slate-800/30">
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{brand}</p>
                        </div>
                        {/* Models */}
                        {items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between px-5 py-2.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                            <p className="text-sm text-slate-800 dark:text-slate-200">{item.model}</p>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setModal({ type: 'edit', item })}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                title="Editar"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => setModal({ type: 'delete', item })}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      {modal?.type === 'add' && (
        <Modal title="Agregar modelo al catálogo" onClose={() => setModal(null)}>
          <CatalogForm onSave={handleAdd} onClose={() => setModal(null)} loading={loading} />
        </Modal>
      )}
      {modal?.type === 'edit' && (
        <Modal title="Editar modelo" onClose={() => setModal(null)}>
          <CatalogForm initial={modal.item} onSave={handleEdit} onClose={() => setModal(null)} loading={loading} />
        </Modal>
      )}
      {modal?.type === 'delete' && (
        <Modal title="Eliminar modelo" onClose={() => setModal(null)}>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
            ¿Eliminar <strong className="text-slate-900 dark:text-white">{modal.item.brand} {modal.item.model}</strong>?
            Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setModal(null)} className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Cancelar
            </button>
            <button onClick={handleDelete} className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors">
              Eliminar
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Pestaña Historial ────────────────────────────────────────────────────────
function HistorialTab() {
  const orders = useStore((s) => s.orders)
  const [q, setQ] = useState('')

  const models = useMemo(() => {
    const map = {}
    for (const order of orders) {
      const brand = (order.deviceBrand || '').trim()
      const model = (order.deviceModel || '').trim()
      if (!brand && !model) continue
      const key = `${brand}__${model}`
      if (!map[key]) map[key] = { brand, model, deviceType: order.deviceType, orders: [] }
      map[key].orders.push(order)
    }
    return Object.values(map).sort((a, b) => b.orders.length - a.orders.length)
  }, [orders])

  const filtered = useMemo(() => {
    if (!q.trim()) return models
    const lower = q.toLowerCase()
    return models.filter(
      (m) => m.brand.toLowerCase().includes(lower) || m.model.toLowerCase().includes(lower)
    )
  }, [models, q])

  const totalModels = models.length
  const totalOrders = orders.length
  const activeOrders = orders.filter((o) => !['delivered', 'irreparable'].includes(o.status)).length
  const completedOrders = orders.filter((o) => o.status === 'completed' || o.status === 'delivered').length

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Modelos distintos', value: totalModels, icon: Smartphone, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { label: 'Total órdenes', value: totalOrders, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'En proceso', value: activeOrders, icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
          { label: 'Completados', value: completedOrders, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={16} className={color} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 dark:text-white leading-none">{value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por marca o modelo..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition shadow-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Smartphone size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">
            {orders.length === 0 ? 'No hay órdenes registradas aún.' : 'Sin resultados para esa búsqueda.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/60">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {filtered.length} modelo{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map(({ brand, model, deviceType, orders: modelOrders }) => {
              const deviceLabel = DEVICE_TYPES.find((d) => d.value === deviceType)?.label || ''
              const active = modelOrders.filter((o) => !['delivered', 'irreparable'].includes(o.status))
              const completed = modelOrders.filter((o) => ['completed', 'delivered'].includes(o.status))
              const slug = encodeURIComponent(`${brand}__${model}`)

              return (
                <Link
                  key={slug}
                  to={`/devices/${slug}`}
                  className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0">
                      <Smartphone size={16} className="text-indigo-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {brand && model ? `${brand} ${model}` : brand || model || 'Sin identificar'}
                      </p>
                      {deviceLabel && <p className="text-xs text-slate-400 dark:text-slate-500">{deviceLabel}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                    <div className="hidden sm:flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-orange-500">
                        <Clock size={11} />{active.length} activas
                      </span>
                      <span className="flex items-center gap-1 text-xs text-green-500">
                        <CheckCircle2 size={11} />{completed.length} completadas
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                        {modelOrders.length}
                      </span>
                      <ChevronRight size={15} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function DevicesPage() {
  const [activeTab, setActiveTab] = useState('catalog')

  const tabs = [
    { id: 'catalog', label: 'Catálogo', icon: BookOpen },
    { id: 'history', label: 'Historial', icon: TrendingUp },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Devices</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Catálogo de modelos y estadísticas de reparaciones
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'catalog' ? <CatalogTab /> : <HistorialTab />}
    </div>
  )
}
