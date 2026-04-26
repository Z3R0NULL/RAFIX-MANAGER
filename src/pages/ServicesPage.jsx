/**
 * ServicesPage — Catálogo de servicios prestados (mano de obra, reparaciones, etc.)
 * CRUD completo: nombre, categoría, precio, duración estimada, descripción, activo/inactivo.
 */
import React, { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Search, X, Wrench, Clock, DollarSign, Tag, ToggleLeft, ToggleRight, AlertCircle, Percent, LayoutGrid, List, ArrowUpDown, ChevronDown } from 'lucide-react'

const SORT_OPTIONS_SVC = [
  { value: 'name_az',    label: 'Nombre A→Z' },
  { value: 'name_za',    label: 'Nombre Z→A' },
  { value: 'price_desc', label: 'Mayor precio' },
  { value: 'price_asc',  label: 'Menor precio' },
  { value: 'duration_desc', label: 'Más duración' },
  { value: 'duration_asc',  label: 'Menos duración' },
]
import { useStore } from '../store/useStore'
import { PageLoader } from '../components/PageLoader'

const CATEGORIES = [
  'Todas',
  'Pantalla',
  'Batería',
  'Software',
  'Limpieza',
  'Diagnóstico',
  'Placa / Soldadura',
  'Cámara',
  'Conector',
  'Otro',
]

const EMPTY_FORM = {
  name: '',
  category: 'Otro',
  priceType: 'fixed', // 'fixed' | 'percent'
  price: '',
  duration: '',
  description: '',
  active: true,
}

// ── Modal de creación / edición ───────────────────────────────────────────────

function ServiceModal({ service, onClose, onSave }) {
  const [form, setForm] = useState(service
    ? {
        ...service,
        priceType: service.priceType || 'fixed',
        price: service.price != null ? String(service.price) : '',
      }
    : { ...EMPTY_FORM })
  const [errors, setErrors] = useState({})

  const set = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'El nombre es obligatorio'
    if (form.price !== '' && isNaN(Number(form.price))) e.price = 'Ingresá un número válido'
    if (form.duration !== '' && isNaN(Number(form.duration))) e.duration = 'Ingresá un número válido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSave({
      ...form,
      price: form.price !== '' ? Number(form.price) : null,
      duration: form.duration !== '' ? Number(form.duration) : null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 rounded-xl border border-slate-700/60 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60">
          <h2 className="text-sm font-semibold text-white">
            {service ? 'Editar servicio' : 'Nuevo servicio'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
              Nombre del servicio <span className="text-red-400">*</span>
            </label>
            <input
              className="input-std"
              placeholder="Ej: Cambio de pantalla"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
              Categoría
            </label>
            <select
              className="input-std"
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
            >
              {CATEGORIES.filter((c) => c !== 'Todas').map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Tipo de precio + valor */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
              Precio
            </label>
            <div className="flex gap-0 rounded-lg overflow-hidden border border-slate-700 mb-2">
              <button
                type="button"
                onClick={() => { set('priceType', 'fixed'); set('price', '') }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                  form.priceType === 'fixed'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <DollarSign size={12} />
                Monto fijo
              </button>
              <button
                type="button"
                onClick={() => { set('priceType', 'percent'); set('price', '') }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                  form.priceType === 'percent'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Percent size={12} />
                % del repuesto
              </button>
            </div>
            <div className="relative">
              {form.priceType !== 'percent' ? (
                <>
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium pointer-events-none z-10">$</span>
                  <input
                    style={{ paddingLeft: '1.75rem' }}
                    className="w-full pr-3.5 py-2.5 rounded-lg border border-slate-700 bg-slate-800 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
                    placeholder="0"
                    type="text"
                    inputMode="numeric"
                    value={form.price === '' || form.price == null ? '' : Number(form.price).toLocaleString('es-AR')}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\./g, '').replace(/,/g, '').replace(/[^\d]/g, '')
                      set('price', raw === '' ? '' : raw)
                    }}
                  />
                </>
              ) : (
                <>
                  <input
                    className="input-std pr-10"
                    placeholder="100"
                    type="text"
                    inputMode="numeric"
                    value={form.price}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d]/g, '')
                      set('price', raw)
                    }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium pointer-events-none">%</span>
                </>
              )}
            </div>
            {errors.price && <p className="text-xs text-red-400 mt-1">{errors.price}</p>}
          </div>

          {/* Duración */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
              Duración (min)
            </label>
            <input
              className="input-std"
              placeholder="60"
              value={form.duration}
              onChange={(e) => set('duration', e.target.value)}
              inputMode="numeric"
            />
            {errors.duration && <p className="text-xs text-red-400 mt-1">{errors.duration}</p>}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
              Descripción
            </label>
            <textarea
              className="input-std resize-none"
              rows={3}
              placeholder="Descripción detallada del servicio..."
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          {/* Activo */}
          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700/60">
            <span className="text-sm text-slate-300">Servicio activo</span>
            <button
              type="button"
              onClick={() => set('active', !form.active)}
              className={`transition-colors ${form.active ? 'text-indigo-400' : 'text-slate-600'}`}
            >
              {form.active ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-lg border border-slate-700 text-slate-400 text-sm hover:text-white hover:border-slate-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
            >
              {service ? 'Guardar cambios' : 'Crear servicio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Confirmación de eliminación ───────────────────────────────────────────────

function DeleteConfirm({ service, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-slate-900 rounded-xl border border-slate-700/60 shadow-2xl p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <AlertCircle size={18} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Eliminar servicio</p>
            <p className="text-sm text-slate-400 mt-1">
              ¿Estás seguro que querés eliminar <span className="text-white font-medium">"{service.name}"</span>? Esta acción no se puede deshacer.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-lg border border-slate-700 text-slate-400 text-sm hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-900/20 border-indigo-800/40 text-indigo-400',
    green:  'bg-green-900/20  border-green-800/40  text-green-400',
    amber:  'bg-amber-900/20  border-amber-800/40  text-amber-400',
    slate:  'bg-slate-800     border-slate-700/60  text-slate-400',
  }
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-4 ${colors[color]}`}>
      <div className="w-9 h-9 rounded-lg bg-current/10 flex items-center justify-center flex-shrink-0 opacity-80">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-white mt-0.5">{value}</p>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function ServicesPage() {
  const services       = useStore((s) => s.services)
  const addService     = useStore((s) => s.addService)
  const updateService  = useStore((s) => s.updateService)
  const deleteService  = useStore((s) => s.deleteService)
  const dataLoading    = useStore((s) => s.dataLoading)

  const [search, setSearch]       = useState('')
  const [catFilter, setCatFilter] = useState('Todas')
  const [showInactive, setShowInactive] = useState(false)
  const [modal, setModal]         = useState(null) // null | 'new' | service object
  const [toDelete, setToDelete]   = useState(null)
  const [viewMode, setViewMode]   = useState(() => localStorage.getItem('servicesView') || (window.innerWidth < 768 ? 'grid' : 'table'))
  const [sort, setSort]           = useState('name_az')
  const [sortOpen, setSortOpen]   = useState(false)

  React.useEffect(() => {
    const handler = (e) => { if (!e.target.closest('[data-sort-dropdown]')) setSortOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  React.useEffect(() => { localStorage.setItem('servicesView', viewMode) }, [viewMode])

  const filtered = useMemo(() => {
    let list = services || []
    if (!showInactive) list = list.filter((s) => s.active !== false)
    if (catFilter !== 'Todas') list = list.filter((s) => s.category === catFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.category?.toLowerCase().includes(q)
      )
    }
    return list.sort((a, b) => {
      switch (sort) {
        case 'name_za':       return (b.name || '').localeCompare(a.name || '')
        case 'price_desc':    return (b.price || 0) - (a.price || 0)
        case 'price_asc':     return (a.price || 0) - (b.price || 0)
        case 'duration_desc': return (b.duration || 0) - (a.duration || 0)
        case 'duration_asc':  return (a.duration || 0) - (b.duration || 0)
        default:              return (a.name || '').localeCompare(b.name || '')
      }
    })
  }, [services, search, catFilter, showInactive, sort])

  // KPIs
  const total    = (services || []).length
  const active   = (services || []).filter((s) => s.active !== false).length
  const avgPrice = (() => {
    const priced = (services || []).filter((s) => s.price != null)
    if (!priced.length) return '—'
    const avg = priced.reduce((acc, s) => acc + s.price, 0) / priced.length
    return `$${avg.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
  })()

  const handleSave = (data) => {
    if (modal && modal !== 'new') {
      updateService(modal.id, data)
    } else {
      addService(data)
    }
    setModal(null)
  }

  const handleDelete = () => {
    deleteService(toDelete.id)
    setToDelete(null)
  }

  const formatPrice = (svc) => {
    if (svc.price == null || svc.price === '') return '—'
    if (svc.priceType === 'percent') return `${svc.price}% del repuesto`
    return `$${Number(svc.price).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`
  }

  const formatDuration = (min) => {
    if (min == null) return '—'
    if (min < 60) return `${min} min`
    const h = Math.floor(min / 60)
    const m = min % 60
    return m ? `${h}h ${m}m` : `${h}h`
  }

  if (dataLoading) return <PageLoader rows={5} title="Cargando servicios..." />

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-white">Servicios</h1>
          <p className="text-sm text-slate-400 mt-0.5">Catálogo de servicios y mano de obra</p>
        </div>
        <button
          onClick={() => setModal('new')}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
        >
          <Plus size={15} />
          Nuevo servicio
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <KpiCard icon={Wrench}      label="Total servicios"  value={total}   color="indigo" />
        <KpiCard icon={ToggleRight} label="Activos"          value={active}  color="green"  />
        <KpiCard icon={DollarSign}  label="Precio promedio"  value={avgPrice} color="amber" />
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 transition-colors"
            placeholder="Buscar servicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowInactive((v) => !v)}
          className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
            showInactive
              ? 'border-indigo-500/50 bg-indigo-900/20 text-indigo-400'
              : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
          }`}
        >
          {showInactive ? 'Ocultar inactivos' : 'Mostrar inactivos'}
        </button>

        {/* View + Sort */}
        <div className="flex items-center gap-1.5 bg-slate-800 rounded-xl p-1 flex-shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            title="Vista cuadrícula"
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setViewMode('table')}
            title="Vista lista"
            className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
          >
            <List size={14} />
          </button>
          <div className="w-px h-5 bg-slate-700 mx-0.5" />
          <div className="relative" data-sort-dropdown>
            <button
              onClick={() => setSortOpen((o) => !o)}
              className="flex items-center gap-1.5 pl-2 pr-2.5 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-700 transition-colors whitespace-nowrap"
            >
              <ArrowUpDown size={14} className="text-slate-400" />
              {SORT_OPTIONS_SVC.find((o) => o.value === sort)?.label}
              <ChevronDown size={12} className={`text-slate-400 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
            </button>
            {sortOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                {SORT_OPTIONS_SVC.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSort(opt.value); setSortOpen(false) }}
                    className={`w-full flex items-center px-4 py-2.5 text-sm transition-colors border-b border-slate-800 last:border-0
                      ${sort === opt.value ? 'bg-indigo-900/20 text-indigo-400 font-medium' : 'text-slate-300 hover:bg-slate-800'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Categorías */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCatFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              catFilter === cat
                ? 'bg-indigo-900/30 border-indigo-500/50 text-indigo-300'
                : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((svc) => (
            <div key={svc.id} className="bg-slate-900 rounded-xl border border-slate-700/60 p-4 flex flex-col gap-3 hover:border-slate-600 transition-colors group">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{svc.name}</p>
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700/60 text-[10px] text-slate-300">
                    <Tag size={9} />
                    {svc.category}
                  </span>
                </div>
                {svc.active !== false ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-900/30 border border-green-800/50 text-green-400 text-[10px] font-semibold flex-shrink-0">Activo</span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-slate-500 text-[10px] font-semibold flex-shrink-0">Inactivo</span>
                )}
              </div>
              {/* Price + Duration */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Precio</p>
                  {svc.priceType === 'percent' ? (
                    <span className="font-bold text-violet-400 text-sm flex items-center gap-0.5">
                      <Percent size={11} />{svc.price != null ? `${svc.price}% rep.` : '—'}
                    </span>
                  ) : (
                    <span className="font-bold text-emerald-400 text-sm">{formatPrice(svc)}</span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Duración</p>
                  <span className="text-xs text-slate-300 flex items-center gap-1 justify-end">
                    <Clock size={10} />{formatDuration(svc.duration)}
                  </span>
                </div>
              </div>
              {svc.description && (
                <p className="text-xs text-slate-400 truncate border-t border-slate-800 pt-2">{svc.description}</p>
              )}
              {/* Actions */}
              <div className="flex gap-2 pt-1 border-t border-slate-800">
                <button onClick={() => setModal(svc)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-indigo-400 hover:bg-indigo-900/20 transition-colors">
                  <Pencil size={12} /> Editar
                </button>
                <button onClick={() => setToDelete(svc)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-900/20 transition-colors">
                  <Trash2 size={12} /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-3">
            <Wrench size={22} className="text-slate-600" />
          </div>
          <p className="text-slate-400 font-medium">
            {(services || []).length === 0 ? 'No hay servicios registrados' : 'Sin resultados para los filtros aplicados'}
          </p>
          {(services || []).length === 0 && (
            <button
              onClick={() => setModal('new')}
              className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
            >
              Agregar primer servicio
            </button>
          )}
        </div>
      )}

      {/* Tabla */}
      {filtered.length > 0 && viewMode === 'table' && (
        <div className="bg-slate-900 rounded-xl border border-slate-700/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/60">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Servicio</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Categoría</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Precio</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Duración</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Descripción</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {filtered.map((svc) => (
                <tr key={svc.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-100">{svc.name}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800 border border-slate-700/60 text-xs text-slate-300">
                      <Tag size={10} />
                      {svc.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {svc.priceType === 'percent' ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-violet-400">
                        <Percent size={11} />
                        {svc.price != null ? `${svc.price}% repuesto` : '—'}
                      </span>
                    ) : (
                      <span className="font-semibold text-emerald-400">{formatPrice(svc)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1 text-slate-400 text-xs">
                      <Clock size={11} />
                      {formatDuration(svc.duration)}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <p className="text-slate-400 text-xs truncate max-w-[200px]">
                      {svc.description || <span className="text-slate-600 italic">Sin descripción</span>}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {svc.active !== false ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-900/30 border border-green-800/50 text-green-400 text-xs font-medium">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-slate-500 text-xs font-medium">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => setModal(svc)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-indigo-400 hover:bg-indigo-900/20 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setToDelete(svc)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {modal && (
        <ServiceModal
          service={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {toDelete && (
        <DeleteConfirm
          service={toDelete}
          onClose={() => setToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}
