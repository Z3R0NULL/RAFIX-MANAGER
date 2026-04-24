/**
 * pages/SuppliersPage.jsx — Gestión de proveedores del taller.
 *
 * Ruta: /suppliers
 * CRUD completo de proveedores:
 *  - Agregar, editar y eliminar proveedores.
 *  - Campos: nombre, contacto, teléfono, email, web, dirección, notas,
 *    tags de productos (multi-tag libre) y calificación (estrella favorito).
 *  - Buscador por nombre, contacto o email.
 *  - Filtro por tag.
 * Los datos se persisten en Turso a través del store (addSupplier, etc.).
 */
import React, { useState, useMemo, useRef } from 'react'
import {
  Truck, Plus, Search, Pencil, Trash2, X, Check,
  Phone, Mail, Globe, MapPin, Hash, Star, StarOff,
  ChevronDown, ChevronUp, MessageSquare, Tag,
  LayoutGrid, List, ArrowUpDown,
} from 'lucide-react'

const SORT_OPTIONS_SUP = [
  { value: 'name_az',     label: 'Nombre A→Z' },
  { value: 'name_za',     label: 'Nombre Z→A' },
  { value: 'rating_desc', label: 'Mayor calificación' },
  { value: 'rating_asc',  label: 'Menor calificación' },
  { value: 'fav_first',   label: 'Favoritos primero' },
]
import { PageLoader } from '../components/PageLoader'
import { useStore } from '../store/useStore'

// ── Tag suggestions ───────────────────────────────────────────────────────────
const TAG_SUGGESTIONS = [
  'Módulos', 'Pantallas', 'Baterías', 'Repuestos', 'Herramientas',
  'Accesorios', 'Celulares', 'Insumos', 'Carcasas', 'Conectores',
  'Cámaras', 'Botones', 'Cables', 'Cargadores', 'Mayorista',
]

// Normaliza un proveedor viejo (category string) a tags array
function normalizeTags(supplier) {
  if (!supplier) return []
  if (Array.isArray(supplier.tags)) return supplier.tags
  if (supplier.category) {
    // mapeo legacy
    const MAP = {
      modulos: 'Módulos', repuestos: 'Repuestos', herramientas: 'Herramientas',
      accesorios: 'Accesorios', equipos: 'Celulares', insumos: 'Insumos', otro: 'Otro',
    }
    return [MAP[supplier.category] || supplier.category]
  }
  return []
}

const RATINGS = [1, 2, 3, 4, 5]

// ── Blank form ────────────────────────────────────────────────────────────────
const BLANK = {
  name: '',
  tags: [],
  contactName: '',
  phone: '',
  email: '',
  website: '',
  address: '',
  taxId: '',
  rating: 0,
  paymentTerms: '',
  deliveryDays: '',
  notes: '',
  favorite: false,
}

// ── TagInput ──────────────────────────────────────────────────────────────────
function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)

  const suggestions = TAG_SUGGESTIONS.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
  )
  const showSuggestions = focused && (input.length > 0 ? suggestions.length > 0 : TAG_SUGGESTIONS.filter((s) => !tags.includes(s)).length > 0)
  const visibleSuggestions = input.length > 0 ? suggestions : TAG_SUGGESTIONS.filter((s) => !tags.includes(s)).slice(0, 8)

  const addTag = (tag) => {
    const t = tag.trim()
    if (!t || tags.includes(t)) return
    onChange([...tags, t])
    setInput('')
    inputRef.current?.focus()
  }

  const removeTag = (tag) => onChange(tags.filter((t) => t !== tag))

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div className="relative">
      <div
        className="min-h-[2.5rem] w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-wrap gap-1.5 items-center cursor-text focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900/40 transition-colors"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
              className="hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded p-0.5 transition-colors"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={tags.length === 0 ? 'Ej: Módulos, Baterías…' : ''}
          className="flex-1 min-w-[80px] bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none py-0.5"
        />
      </div>
      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Sugerencias</p>
          </div>
          <div className="flex flex-wrap gap-1.5 p-2.5">
            {visibleSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); addTag(s) }}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
          {input.trim() && !TAG_SUGGESTIONS.includes(input.trim()) && (
            <div className="border-t border-slate-100 dark:border-slate-800 px-2.5 pb-2.5 pt-1.5">
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); addTag(input.trim()) }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
              >
                <Plus size={11} />
                Agregar "{input.trim()}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── SupplierModalField ────────────────────────────────────────────────────────
function SupplierModalField({ label, type = 'text', placeholder, icon: Icon, value, onChange, error }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{label}</label>
      <div className="relative">
        {Icon && <Icon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full ${Icon ? 'pl-8' : 'px-3'} pr-3 py-2 rounded-lg border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none transition-colors focus:ring-2 ${
            error
              ? 'border-red-400 focus:ring-red-200 dark:focus:ring-red-900/40'
              : 'border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-indigo-100 dark:focus:ring-indigo-900/40'
          }`}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}

// ── SupplierModal ─────────────────────────────────────────────────────────────
function SupplierModal({ supplier, onClose, onSave }) {
  const [form, setForm] = useState(supplier
    ? { ...supplier, tags: normalizeTags(supplier) }
    : { ...BLANK })
  const [errors, setErrors] = useState({})

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nombre requerido'
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email inválido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    onSave({ ...form })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            {supplier ? 'Editar proveedor' : 'Nuevo proveedor'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Name + Favorite */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Nombre del proveedor *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Ej: Distribuidora Techtronics"
                className={`flex-1 px-3 py-2 rounded-lg border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none transition-colors focus:ring-2 ${
                  errors.name
                    ? 'border-red-400 focus:ring-red-200 dark:focus:ring-red-900/40'
                    : 'border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-indigo-100 dark:focus:ring-indigo-900/40'
                }`}
              />
              <button
                type="button"
                onClick={() => set('favorite', !form.favorite)}
                title={form.favorite ? 'Quitar favorito' : 'Marcar favorito'}
                className={`px-3 rounded-lg border transition-colors ${
                  form.favorite
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-500'
                    : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-300 dark:hover:border-amber-700 hover:text-amber-500'
                }`}
              >
                {form.favorite ? <Star size={15} fill="currentColor" /> : <StarOff size={15} />}
              </button>
            </div>
            {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Tags / Rubros
              <span className="ml-1.5 text-slate-400 font-normal">Enter o coma para agregar</span>
            </label>
            <TagInput tags={form.tags} onChange={(tags) => set('tags', tags)} />
          </div>

          {/* Contact name + phone */}
          <div className="grid grid-cols-2 gap-3">
            <SupplierModalField label="Nombre de contacto" placeholder="Juan García" value={form.contactName} onChange={(e) => set('contactName', e.target.value)} error={errors.contactName} />
            <SupplierModalField label="Teléfono / WhatsApp" icon={Phone} placeholder="+54 11 …" value={form.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} />
          </div>

          {/* Email + website */}
          <div className="grid grid-cols-2 gap-3">
            <SupplierModalField label="Email" type="email" icon={Mail} placeholder="ventas@proveedor.com" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
            <SupplierModalField label="Sitio web" icon={Globe} placeholder="www.proveedor.com" value={form.website} onChange={(e) => set('website', e.target.value)} error={errors.website} />
          </div>

          {/* Address + Tax ID */}
          <div className="grid grid-cols-2 gap-3">
            <SupplierModalField label="Dirección" icon={MapPin} placeholder="Calle 123, Ciudad" value={form.address} onChange={(e) => set('address', e.target.value)} error={errors.address} />
            <SupplierModalField label="CUIT / RUT / Tax ID" icon={Hash} placeholder="20-12345678-9" value={form.taxId} onChange={(e) => set('taxId', e.target.value)} error={errors.taxId} />
          </div>

          {/* Payment terms + delivery days */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Condición de pago</label>
              <select
                value={form.paymentTerms}
                onChange={(e) => set('paymentTerms', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40 transition-colors"
              >
                <option value="">— Seleccionar —</option>
                <option value="contado">Contado</option>
                <option value="15dias">15 días</option>
                <option value="30dias">30 días</option>
                <option value="60dias">60 días</option>
                <option value="consignacion">Consignación</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <SupplierModalField label="Días de entrega estimados" type="number" placeholder="3" value={form.deliveryDays} onChange={(e) => set('deliveryDays', e.target.value)} error={errors.deliveryDays} />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Calificación</label>
            <div className="flex gap-1.5">
              {RATINGS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => set('rating', form.rating === r ? 0 : r)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={20}
                    className={r <= form.rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}
                    fill={r <= form.rating ? 'currentColor' : 'none'}
                  />
                </button>
              ))}
              {form.rating > 0 && (
                <button
                  type="button"
                  onClick={() => set('rating', 0)}
                  className="text-xs text-slate-400 hover:text-slate-600 ml-1 self-center"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Notas / Observaciones</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              placeholder="Productos que ofrece, descuentos, condiciones especiales…"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-2"
          >
            <Check size={14} />
            {supplier ? 'Guardar cambios' : 'Agregar proveedor'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── StarRating display ────────────────────────────────────────────────────────
function StarRating({ rating }) {
  if (!rating) return <span className="text-xs text-slate-400">Sin calificar</span>
  return (
    <div className="flex gap-0.5">
      {RATINGS.map((r) => (
        <Star
          key={r}
          size={11}
          className={r <= rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}
          fill={r <= rating ? 'currentColor' : 'none'}
        />
      ))}
    </div>
  )
}

// ── TagChips display ──────────────────────────────────────────────────────────
function TagChips({ tags, max = 3 }) {
  if (!tags || tags.length === 0) return <span className="text-xs text-slate-400">—</span>
  const visible = tags.slice(0, max)
  const extra = tags.length - max
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
        >
          {tag}
        </span>
      ))}
      {extra > 0 && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          +{extra}
        </span>
      )}
    </div>
  )
}

// ── ContactLink ───────────────────────────────────────────────────────────────
function ContactLink({ icon: Icon, value, href }) {
  if (!value) return null
  return (
    <a
      href={href || '#'}
      target={href ? '_blank' : undefined}
      rel="noreferrer"
      onClick={!href ? (e) => e.preventDefault() : undefined}
      className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate"
    >
      <Icon size={11} className="flex-shrink-0" />
      <span className="truncate">{value}</span>
    </a>
  )
}

// ── ExpandedRow ───────────────────────────────────────────────────────────────
function ExpandedRow({ supplier, colSpan }) {
  const PAYMENT_LABELS = {
    contado: 'Contado', '15dias': '15 días', '30dias': '30 días',
    '60dias': '60 días', consignacion: 'Consignación', otro: 'Otro',
  }
  return (
    <tr className="bg-indigo-50/50 dark:bg-indigo-900/10">
      <td colSpan={colSpan} className="px-5 py-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          {supplier.address && (
            <div>
              <p className="text-slate-400 mb-0.5 uppercase tracking-wider text-[10px]">Dirección</p>
              <p className="text-slate-700 dark:text-slate-300">{supplier.address}</p>
            </div>
          )}
          {supplier.taxId && (
            <div>
              <p className="text-slate-400 mb-0.5 uppercase tracking-wider text-[10px]">CUIT / Tax ID</p>
              <p className="text-slate-700 dark:text-slate-300">{supplier.taxId}</p>
            </div>
          )}
          {supplier.paymentTerms && (
            <div>
              <p className="text-slate-400 mb-0.5 uppercase tracking-wider text-[10px]">Condición de pago</p>
              <p className="text-slate-700 dark:text-slate-300">{PAYMENT_LABELS[supplier.paymentTerms] || supplier.paymentTerms}</p>
            </div>
          )}
          {supplier.deliveryDays && (
            <div>
              <p className="text-slate-400 mb-0.5 uppercase tracking-wider text-[10px]">Entrega estimada</p>
              <p className="text-slate-700 dark:text-slate-300">{supplier.deliveryDays} día{supplier.deliveryDays !== '1' ? 's' : ''}</p>
            </div>
          )}
          {supplier.notes && (
            <div className="col-span-2 sm:col-span-4">
              <p className="text-slate-400 mb-0.5 uppercase tracking-wider text-[10px]">Notas</p>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line">{supplier.notes}</p>
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SuppliersPage() {
  const suppliers       = useStore((s) => s.suppliers)
  const addSupplier     = useStore((s) => s.addSupplier)
  const updateSupplier  = useStore((s) => s.updateSupplier)
  const deleteSupplier  = useStore((s) => s.deleteSupplier)
  const dataLoading     = useStore((s) => s.dataLoading)

  const [search, setSearch]         = useState('')
  const [filterTag, setFilterTag]   = useState('all')
  const [filterFav, setFilterFav]   = useState(false)
  const [modal, setModal]           = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [expanded, setExpanded]     = useState(null)
  const [viewMode, setViewMode]     = useState(() => localStorage.getItem('suppliersView') || 'table')
  const [sort, setSort]             = useState('fav_first')
  const [sortOpen, setSortOpen]     = useState(false)

  React.useEffect(() => {
    const handler = (e) => { if (!e.target.closest('[data-sort-dropdown]')) setSortOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  React.useEffect(() => { localStorage.setItem('suppliersView', viewMode) }, [viewMode])

  // ── All tags used across suppliers (for filter row) ────────────────────────
  const allTags = useMemo(() => {
    const set = new Set()
    suppliers.forEach((s) => normalizeTags(s).forEach((t) => set.add(t)))
    return [...set].sort()
  }, [suppliers])

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total     = suppliers.length
    const favorites = suppliers.filter((s) => s.favorite).length
    const withPhone = suppliers.filter((s) => s.phone).length
    const rated     = suppliers.filter((s) => s.rating > 0)
    const avgRating = rated.length
      ? (rated.reduce((a, s) => a + s.rating, 0) / rated.length).toFixed(1)
      : '—'
    return { total, favorites, withPhone, avgRating }
  }, [suppliers])

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...suppliers]
    if (filterFav) list = list.filter((s) => s.favorite)
    if (filterTag !== 'all') list = list.filter((s) => normalizeTags(s).includes(filterTag))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((s) =>
        s.name?.toLowerCase().includes(q) ||
        s.contactName?.toLowerCase().includes(q) ||
        s.phone?.includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.notes?.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q) ||
        normalizeTags(s).some((t) => t.toLowerCase().includes(q))
      )
    }
    return list.sort((a, b) => {
      switch (sort) {
        case 'name_az':     return (a.name || '').localeCompare(b.name || '')
        case 'name_za':     return (b.name || '').localeCompare(a.name || '')
        case 'rating_desc': return (b.rating || 0) - (a.rating || 0)
        case 'rating_asc':  return (a.rating || 0) - (b.rating || 0)
        default: // fav_first
          if (a.favorite && !b.favorite) return -1
          if (!a.favorite && b.favorite) return 1
          return (a.name || '').localeCompare(b.name || '')
      }
    })
  }, [suppliers, filterTag, filterFav, search, sort])

  const handleSave = (data) => {
    if (modal === 'new') addSupplier(data)
    else updateSupplier(modal.id, data)
    setModal(null)
  }

  const handleDelete = (id) => {
    deleteSupplier(id)
    setConfirmDel(null)
  }

  const toggleExpanded = (id) => setExpanded((prev) => (prev === id ? null : id))

  const PAYMENT_LABELS = {
    contado: 'Contado', '15dias': '15 días', '30dias': '30 días',
    '60dias': '60 días', consignacion: 'Consignación', otro: 'Otro',
  }

  if (dataLoading) return <PageLoader rows={5} title="Cargando proveedores..." />

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Proveedores</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Directorio de proveedores y contactos de compra
          </p>
        </div>
        <button
          onClick={() => setModal('new')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Nuevo proveedor
        </button>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total proveedores" value={stats.total}     icon={Truck}  color="indigo" />
        <KpiCard label="Favoritos"          value={stats.favorites} icon={Star}   color="amber" />
        <KpiCard label="Con teléfono"       value={stats.withPhone} icon={Phone}  color="emerald" />
        <KpiCard label="Calificación media" value={stats.avgRating} icon={Star}   color="violet" isText />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-3">
        {/* Row 1: Search + Favorite + View/Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, contacto, tag…"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={13} />
              </button>
            )}
          </div>

          <button
            onClick={() => setFilterFav((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors flex-shrink-0 ${
              filterFav
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Star size={14} fill={filterFav ? 'currentColor' : 'none'} />
            Favoritos
          </button>

          {/* View + Sort */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 flex-shrink-0">
            <button onClick={() => setViewMode('table')} title="Vista lista"
              className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
              <List size={14} />
            </button>
            <button onClick={() => setViewMode('grid')} title="Vista cuadrícula"
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
              <LayoutGrid size={14} />
            </button>
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />
            <div className="relative" data-sort-dropdown>
              <button
                onClick={() => setSortOpen((o) => !o)}
                className="flex items-center gap-1.5 pl-2 pr-2.5 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
              >
                <ArrowUpDown size={14} className="text-slate-500 dark:text-slate-400" />
                {SORT_OPTIONS_SUP.find((o) => o.value === sort)?.label}
                <ChevronDown size={12} className={`text-slate-400 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                  {SORT_OPTIONS_SUP.map((opt) => (
                    <button key={opt.value} onClick={() => { setSort(opt.value); setSortOpen(false) }}
                      className={`w-full flex items-center px-4 py-2.5 text-sm transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0 ${sort === opt.value ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Tag filters (dynamic from data) */}
        {allTags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap items-center">
            <span className="flex items-center gap-1 text-[10px] text-slate-400 uppercase tracking-wide font-medium mr-0.5">
              <Tag size={10} /> Tags
            </span>
            <FilterBtn active={filterTag === 'all'} onClick={() => setFilterTag('all')}>Todos</FilterBtn>
            {allTags.map((tag) => (
              <FilterBtn key={tag} active={filterTag === tag} onClick={() => setFilterTag(tag)}>
                {tag}
              </FilterBtn>
            ))}
          </div>
        )}
      </div>

      {/* ── Empty state ── */}
      {suppliers.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
          <Truck size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No hay proveedores registrados</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">Agregá tus distribuidores, mayoristas y contactos de compra</p>
          <button onClick={() => setModal('new')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus size={14} />
            Agregar primer proveedor
          </button>
        </div>
      )}

      {/* ── No results ── */}
      {suppliers.length > 0 && filtered.length === 0 && (
        <div className="text-center py-10 text-slate-400 text-sm">
          Sin resultados para <strong>"{search}"</strong> con los filtros aplicados.
        </div>
      )}

      {/* ── Grid view ── */}
      {filtered.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((sup) => {
            const tags = normalizeTags(sup)
            return (
              <div key={sup.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
                {/* Top */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      {sup.favorite && <Star size={12} className="text-amber-400 flex-shrink-0" fill="currentColor" />}
                      <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{sup.name}</p>
                    </div>
                    {sup.contactName && <p className="text-xs text-slate-400">{sup.contactName}</p>}
                    {tags.length > 0 && <div className="mt-1.5"><TagChips tags={tags} max={4} /></div>}
                  </div>
                </div>
                {/* Contact */}
                <div className="space-y-1">
                  <ContactLink icon={Phone} value={sup.phone} href={sup.phone ? `tel:${sup.phone}` : null} />
                  <ContactLink icon={Mail}  value={sup.email} href={sup.email ? `mailto:${sup.email}` : null} />
                  <ContactLink icon={Globe} value={sup.website} href={sup.website ? (sup.website.startsWith('http') ? sup.website : `https://${sup.website}`) : null} />
                </div>
                {/* Rating + actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <StarRating rating={sup.rating} />
                  <div className="flex gap-1">
                    {sup.phone && (
                      <a href={`https://wa.me/${sup.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                        className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-600 transition-colors">
                        <MessageSquare size={13} />
                      </a>
                    )}
                    <button onClick={() => setModal(sup)}
                      className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-400 hover:text-indigo-600 transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setConfirmDel(sup.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Table ── */}
      {filtered.length > 0 && viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="thead-row">
                  <th className="px-4 py-3 w-6" />
                  <th className="th-std">Proveedor</th>
                  <th className="th-std">Tags</th>
                  <th className="th-std">Contacto</th>
                  <th className="th-std">Calificación</th>
                  <th className="th-std">Pago</th>
                  <th className="th-std-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sup) => {
                  const isExpanded = expanded === sup.id
                  const tags = normalizeTags(sup)
                  return (
                    <React.Fragment key={sup.id}>
                      <tr className={`border-b border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${isExpanded ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}>
                        <td className="px-2 py-3 text-center">
                          <button onClick={() => toggleExpanded(sup.id)}
                            className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-400">
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {sup.favorite && <Star size={12} className="text-amber-400 flex-shrink-0" fill="currentColor" />}
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">{sup.name}</p>
                              {sup.contactName && <p className="text-xs text-slate-400 truncate">{sup.contactName}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <TagChips tags={tags} max={3} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-0.5">
                            <ContactLink icon={Phone} value={sup.phone} href={sup.phone ? `tel:${sup.phone}` : null} />
                            <ContactLink icon={Mail}  value={sup.email} href={sup.email ? `mailto:${sup.email}` : null} />
                            <ContactLink icon={Globe} value={sup.website} href={sup.website ? (sup.website.startsWith('http') ? sup.website : `https://${sup.website}`) : null} />
                          </div>
                        </td>
                        <td className="px-4 py-3"><StarRating rating={sup.rating} /></td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                          {sup.paymentTerms ? PAYMENT_LABELS[sup.paymentTerms] || sup.paymentTerms : '—'}
                          {sup.deliveryDays && <span className="block text-slate-400">{sup.deliveryDays}d entrega</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {sup.phone && (
                              <a href={`https://wa.me/${sup.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                                title="WhatsApp"
                                className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                <MessageSquare size={13} />
                              </a>
                            )}
                            <button onClick={() => setModal(sup)}
                              className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => setConfirmDel(sup.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && <ExpandedRow supplier={sup} colSpan={7} />}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
            {filtered.length} proveedor{filtered.length !== 1 ? 'es' : ''}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {modal !== null && (
        <SupplierModal
          supplier={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">¿Eliminar proveedor?</p>
                <p className="text-xs text-slate-500 mt-0.5">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setConfirmDel(null)}
                className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Cancelar
              </button>
              <button onClick={() => handleDelete(confirmDel)}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── KpiCard ───────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, color, isText }) {
  const colorMap = {
    indigo:  { bg: 'bg-indigo-50 dark:bg-indigo-900/20',   icon: 'text-indigo-500' },
    amber:   { bg: 'bg-amber-50 dark:bg-amber-900/20',     icon: 'text-amber-500' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-500' },
    violet:  { bg: 'bg-violet-50 dark:bg-violet-900/20',   icon: 'text-violet-500' },
  }
  const c = colorMap[color] || colorMap.indigo
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
      <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center mb-3`}>
        <Icon size={16} className={c.icon} />
      </div>
      <p className={`font-bold text-slate-900 dark:text-white leading-none ${isText ? 'text-xl' : 'text-2xl'}`}>{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</p>
    </div>
  )
}

// ── FilterBtn ─────────────────────────────────────────────────────────────────
function FilterBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active
          ? 'bg-indigo-600 text-white'
          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
      }`}
    >
      {children}
    </button>
  )
}
