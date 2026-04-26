/**
 * pages/InventoryPage.jsx — Gestión del inventario de piezas y repuestos.
 *
 * Ruta: /inventory
 * Permite administrar el stock de componentes del taller:
 *  - Agregar, editar y eliminar ítems (nombre, categoría, stock, precio, proveedor).
 *  - Ajuste rápido de stock (+1 / -1).
 *  - Buscador y filtro por categoría.
 *  - Alerta visual para ítems con stock bajo (bajo el umbral configurado).
 *  - Ordenamiento por nombre, stock o precio.
 * Los datos se persisten en Turso a través del store (addInventoryItem, etc.).
 */
import React, { useState, useMemo } from 'react'
import {
  Package, Plus, Search, Pencil, Trash2, X, Check,
  ChevronUp, ChevronDown, AlertTriangle, Tag, Boxes,
  Wrench, Smartphone, LayoutGrid, List, ArrowUpDown,
} from 'lucide-react'

const SORT_OPTIONS = [
  { value: 'name_az',    label: 'Nombre A→Z' },
  { value: 'name_za',    label: 'Nombre Z→A' },
  { value: 'stock_desc', label: 'Mayor stock' },
  { value: 'stock_asc',  label: 'Menor stock' },
  { value: 'price_desc', label: 'Mayor precio' },
  { value: 'price_asc',  label: 'Menor precio' },
]
import { useStore } from '../store/useStore'
import { useCurrency } from '../utils/useCurrency'
import { PageLoader } from '../components/PageLoader'

// ── Category config ───────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'modulo',      label: 'Módulo / Pantalla',  color: 'indigo',  icon: Smartphone },
  { value: 'herramienta', label: 'Herramienta',         color: 'amber',   icon: Wrench },
  { value: 'celular',     label: 'Celular / Equipo',    color: 'emerald', icon: Smartphone },
  { value: 'accesorio',   label: 'Accesorio',           color: 'sky',     icon: Tag },
  { value: 'insumo',      label: 'Insumo / Repuesto',   color: 'violet',  icon: Boxes },
  { value: 'otro',        label: 'Otro',                color: 'slate',   icon: Package },
]

const CAT_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]))

const COLOR_CLASSES = {
  indigo:  { badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',  dot: 'bg-indigo-500' },
  amber:   { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',      dot: 'bg-amber-500' },
  emerald: { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', dot: 'bg-emerald-500' },
  sky:     { badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',              dot: 'bg-sky-500' },
  violet:  { badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',  dot: 'bg-violet-500' },
  slate:   { badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',         dot: 'bg-slate-400' },
}

// ── Blank form ────────────────────────────────────────────────────────────────
const BLANK = {
  name: '',
  category: 'modulo',
  brand: '',
  model: '',
  stock: '',
  minStock: '',
  price: '',
  costPrice: '',
  location: '',
  notes: '',
}


// ── ModalField ────────────────────────────────────────────────────────────────
function ModalField({ label, name, type = 'text', placeholder, value, onChange, error }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none transition-colors focus:ring-2 ${
          error
            ? 'border-red-400 focus:ring-red-200 dark:focus:ring-red-900/40'
            : 'border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-indigo-100 dark:focus:ring-indigo-900/40'
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}

// ── ItemModal ─────────────────────────────────────────────────────────────────
function ItemModal({ item, onClose, onSave }) {
  const [form, setForm] = useState(item
    ? {
        ...item,
        price:     item.price     != null ? String(item.price)     : '',
        costPrice: item.costPrice != null ? String(item.costPrice) : '',
      }
    : { ...BLANK })
  const [errors, setErrors] = useState({})

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nombre requerido'
    if (form.stock !== '' && isNaN(Number(form.stock))) e.stock = 'Debe ser número'
    if (form.minStock !== '' && isNaN(Number(form.minStock))) e.minStock = 'Debe ser número'
    if (form.price !== '' && isNaN(Number(form.price))) e.price = 'Debe ser número'
    if (form.costPrice !== '' && isNaN(Number(form.costPrice))) e.costPrice = 'Debe ser número'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    onSave({
      ...form,
      stock:     form.stock     !== '' ? Number(form.stock)     : 0,
      minStock:  form.minStock  !== '' ? Number(form.minStock)  : 0,
      price:     form.price     !== '' ? Number(form.price)     : null,
      costPrice: form.costPrice !== '' ? Number(form.costPrice) : null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            {item ? 'Editar ítem' : 'Agregar al inventario'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Name */}
          <ModalField label={<>Nombre <span className="text-red-400">*</span></>} placeholder="Ej: Módulo Samsung A32" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Categoría</label>
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40 transition-colors"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Brand + Model */}
          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Marca" placeholder="Samsung, Apple…" value={form.brand} onChange={(e) => set('brand', e.target.value)} error={errors.brand} />
            <ModalField label="Modelo" placeholder="A32, iPhone 13…" value={form.model} onChange={(e) => set('model', e.target.value)} error={errors.model} />
          </div>

          {/* Stock + Min stock */}
          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Stock actual" type="number" placeholder="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} error={errors.stock} />
            <ModalField label="Stock mínimo" type="number" placeholder="0" value={form.minStock} onChange={(e) => set('minStock', e.target.value)} error={errors.minStock} />
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Precio de venta ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={form.price === '' || form.price == null ? '' : Number(form.price).toLocaleString('es-AR')}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\./g, '').replace(/,/g, '').replace(/[^\d]/g, '')
                    set('price', raw === '' ? '' : raw)
                  }}
                  className={`w-full pl-7 pr-3 py-2 rounded-lg border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none transition-colors focus:ring-2 ${
                    errors.price
                      ? 'border-red-400 focus:ring-red-200 dark:focus:ring-red-900/40'
                      : 'border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-indigo-100 dark:focus:ring-indigo-900/40'
                  }`}
                />
              </div>
              {errors.price && <p className="text-xs text-red-500 mt-0.5">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Precio de costo ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={form.costPrice === '' || form.costPrice == null ? '' : Number(form.costPrice).toLocaleString('es-AR')}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\./g, '').replace(/,/g, '').replace(/[^\d]/g, '')
                    set('costPrice', raw === '' ? '' : raw)
                  }}
                  className={`w-full pl-7 pr-3 py-2 rounded-lg border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none transition-colors focus:ring-2 ${
                    errors.costPrice
                      ? 'border-red-400 focus:ring-red-200 dark:focus:ring-red-900/40'
                      : 'border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-indigo-100 dark:focus:ring-indigo-900/40'
                  }`}
                />
              </div>
              {errors.costPrice && <p className="text-xs text-red-500 mt-0.5">{errors.costPrice}</p>}
            </div>
          </div>

          {/* Location */}
          <ModalField label="Ubicación / Depósito" placeholder="Ej: Estante A2, Caja 3…" value={form.location} onChange={(e) => set('location', e.target.value)} error={errors.location} />

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Notas</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              placeholder="Observaciones, estado, etc."
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
            {item ? 'Guardar cambios' : 'Agregar ítem'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── StockAdjuster ─────────────────────────────────────────────────────────────
function StockAdjuster({ item }) {
  const adjustInventoryStock = useStore((s) => s.adjustInventoryStock)
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => adjustInventoryStock(item.id, -1)}
        disabled={item.stock <= 0}
        className="w-6 h-6 rounded-md flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-300 dark:hover:border-rose-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronDown size={12} className="text-slate-500" />
      </button>
      <span className={`font-bold text-sm min-w-[2rem] text-center ${
        item.stock === 0
          ? 'text-red-500 dark:text-red-400'
          : item.minStock > 0 && item.stock <= item.minStock
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-slate-900 dark:text-white'
      }`}>
        {item.stock}
      </span>
      <button
        onClick={() => adjustInventoryStock(item.id, +1)}
        className="w-6 h-6 rounded-md flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
      >
        <ChevronUp size={12} className="text-slate-500" />
      </button>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const fmt = useCurrency()
  const inventory          = useStore((s) => s.inventory)
  const addInventoryItem   = useStore((s) => s.addInventoryItem)
  const updateInventoryItem = useStore((s) => s.updateInventoryItem)
  const deleteInventoryItem = useStore((s) => s.deleteInventoryItem)
  const dataLoading        = useStore((s) => s.dataLoading)

  const [search, setSearch]       = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [modal, setModal]         = useState(null)   // null | 'new' | item object
  const [confirmDel, setConfirmDel] = useState(null) // item id
  const [viewMode, setViewMode]   = useState(() => localStorage.getItem('inventoryView') || (window.innerWidth < 768 ? 'grid' : 'table')) // 'table' | 'grid'
  const [sort, setSort]           = useState('name_az')
  const [sortOpen, setSortOpen]   = useState(false)

  React.useEffect(() => {
    const handler = (e) => { if (!e.target.closest('[data-sort-dropdown]')) setSortOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  React.useEffect(() => { localStorage.setItem('inventoryView', viewMode) }, [viewMode])

  // ── Derived stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total     = inventory.length
    const lowStock  = inventory.filter((i) => i.minStock > 0 && i.stock <= i.minStock && i.stock > 0).length
    const outStock  = inventory.filter((i) => i.stock === 0).length
    const totalValue = inventory.reduce((s, i) => s + (i.stock || 0) * (i.price || 0), 0)
    return { total, lowStock, outStock, totalValue }
  }, [inventory])

  // ── Filtered + sorted list ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...inventory]
    if (filterCat !== 'all') list = list.filter((i) => i.category === filterCat)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((i) =>
        i.name?.toLowerCase().includes(q) ||
        i.brand?.toLowerCase().includes(q) ||
        i.model?.toLowerCase().includes(q) ||
        i.location?.toLowerCase().includes(q) ||
        i.notes?.toLowerCase().includes(q)
      )
    }
    return list.sort((a, b) => {
      switch (sort) {
        case 'name_za':    return (b.name || '').localeCompare(a.name || '')
        case 'stock_desc': return (b.stock || 0) - (a.stock || 0)
        case 'stock_asc':  return (a.stock || 0) - (b.stock || 0)
        case 'price_desc': return (b.price || 0) - (a.price || 0)
        case 'price_asc':  return (a.price || 0) - (b.price || 0)
        default:           return (a.name || '').localeCompare(b.name || '')
      }
    })
  }, [inventory, filterCat, search, sort])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSave = (data) => {
    if (modal === 'new') {
      addInventoryItem(data)
    } else {
      updateInventoryItem(modal.id, data)
    }
    setModal(null)
  }

  const handleDelete = (id) => {
    deleteInventoryItem(id)
    setConfirmDel(null)
  }

  if (dataLoading) return <PageLoader rows={6} title="Cargando inventario..." />

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventario</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Módulos, herramientas, celulares y más
          </p>
        </div>
        <button
          onClick={() => setModal('new')}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Agregar ítem
        </button>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total ítems"    value={stats.total}            icon={Package}       color="indigo" />
        <KpiCard label="Stock bajo"     value={stats.lowStock}         icon={AlertTriangle} color="amber"  />
        <KpiCard label="Sin stock"      value={stats.outStock}         icon={AlertTriangle} color="red"    />
        <KpiCard label="Valor del stock" value={fmt(stats.totalValue)} icon={Tag}           color="emerald" isText />
      </div>

      {/* ── Filters + search ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, marca, modelo, ubicación…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="flex gap-1 flex-wrap">
          <FilterBtn active={filterCat === 'all'} onClick={() => setFilterCat('all')}>Todos</FilterBtn>
          {CATEGORIES.map((c) => (
            <FilterBtn key={c.value} active={filterCat === c.value} onClick={() => setFilterCat(c.value)}>
              {c.label}
            </FilterBtn>
          ))}
        </div>

        {/* View + Sort */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 flex-shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            title="Vista cuadrícula"
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setViewMode('table')}
            title="Vista lista"
            className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <List size={14} />
          </button>
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />
          <div className="relative" data-sort-dropdown>
            <button
              onClick={() => setSortOpen((o) => !o)}
              className="flex items-center gap-1.5 pl-2 pr-2.5 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
            >
              <ArrowUpDown size={14} className="text-slate-500 dark:text-slate-400" />
              {SORT_OPTIONS.find((o) => o.value === sort)?.label}
              <ChevronDown size={12} className={`text-slate-400 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
            </button>
            {sortOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSort(opt.value); setSortOpen(false) }}
                    className={`w-full flex items-center px-4 py-2.5 text-sm transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0
                      ${sort === opt.value ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Empty state ── */}
      {inventory.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
          <Package size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No hay ítems en el inventario</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">Empezá agregando módulos, herramientas o cualquier producto</p>
          <button
            onClick={() => setModal('new')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={14} />
            Agregar primer ítem
          </button>
        </div>
      )}

      {/* ── No results ── */}
      {inventory.length > 0 && filtered.length === 0 && (
        <div className="text-center py-10 text-slate-400 text-sm">
          Sin resultados para <strong>"{search}"</strong> en esta categoría.
        </div>
      )}

      {/* ── Table view ── */}
      {viewMode === 'table' && filtered.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="thead-row">
                  <th className="th-std">Nombre</th>
                  <th className="th-std">Categoría</th>
                  <th className="th-std">Marca / Modelo</th>
                  <th className="th-std-center">Stock</th>
                  <th className="th-std-right">Precio venta</th>
                  <th className="th-std-right">Costo</th>
                  <th className="th-std">Ubicación</th>
                  <th className="th-std-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((item) => {
                  const cat    = CAT_MAP[item.category] || CAT_MAP['otro']
                  const colors = COLOR_CLASSES[cat.color]
                  const isLow  = item.minStock > 0 && item.stock <= item.minStock && item.stock > 0
                  const isOut  = item.stock === 0
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{item.name}</p>
                        {item.notes && (
                          <p className="text-xs text-slate-400 truncate max-w-[200px]">{item.notes}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                          {cat.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                        {[item.brand, item.model].filter(Boolean).join(' · ') || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-center gap-1">
                          <StockAdjuster item={item} />
                          {(isLow || isOut) && (
                            <span className={`text-[10px] font-semibold ${isOut ? 'text-red-500' : 'text-amber-600 dark:text-amber-400'}`}>
                              {isOut ? '¡Sin stock!' : 'Stock bajo'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {item.price != null ? fmt(item.price) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">
                        {item.costPrice != null ? fmt(item.costPrice) : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                        {item.location || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setModal(item)}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setConfirmDel(item.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
            {filtered.length} ítem{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* ── Grid view ── */}
      {viewMode === 'grid' && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const cat    = CAT_MAP[item.category] || CAT_MAP['otro']
            const colors = COLOR_CLASSES[cat.color]
            const isLow  = item.minStock > 0 && item.stock <= item.minStock && item.stock > 0
            const isOut  = item.stock === 0
            return (
              <div key={item.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm leading-snug truncate">{item.name}</p>
                    {[item.brand, item.model].filter(Boolean).length > 0 && (
                      <p className="text-xs text-slate-400 mt-0.5">{[item.brand, item.model].filter(Boolean).join(' · ')}</p>
                    )}
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${colors.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                    {cat.label}
                  </span>
                </div>

                {/* Stock row */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Stock</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <StockAdjuster item={item} />
                      {isOut && <span className="text-[10px] font-bold text-red-500 ml-1">Sin stock</span>}
                      {isLow && !isOut && <span className="text-[10px] font-bold text-amber-500 ml-1">Bajo</span>}
                    </div>
                  </div>
                  {item.price != null && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Precio venta</span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{fmt(item.price)}</span>
                    </div>
                  )}
                </div>

                {/* Location / notes */}
                {(item.location || item.notes) && (
                  <p className="text-xs text-slate-400 truncate border-t border-slate-100 dark:border-slate-800 pt-2">
                    {item.location && <span className="mr-2">📍 {item.location}</span>}
                    {item.notes}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setModal(item)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                  >
                    <Pencil size={12} /> Editar
                  </button>
                  <button
                    onClick={() => setConfirmDel(item.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 size={12} /> Eliminar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal: add / edit ── */}
      {modal !== null && (
        <ItemModal
          item={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {/* ── Confirm delete ── */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">¿Eliminar ítem?</p>
                <p className="text-xs text-slate-500 mt-0.5">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmDel(null)}
                className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDel)}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
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

// ── KpiCard ───────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, color, isText }) {
  const colorMap = {
    indigo:  { bg: 'bg-indigo-50 dark:bg-indigo-900/20',  icon: 'text-indigo-500' },
    amber:   { bg: 'bg-amber-50 dark:bg-amber-900/20',    icon: 'text-amber-500' },
    red:     { bg: 'bg-red-50 dark:bg-red-900/20',        icon: 'text-red-500' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-500' },
  }
  const c = colorMap[color] || colorMap.indigo
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
      <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center mb-3`}>
        <Icon size={16} className={c.icon} />
      </div>
      <p className={`font-bold text-slate-900 dark:text-white leading-none ${isText ? 'text-lg' : 'text-2xl'}`}>{value}</p>
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
