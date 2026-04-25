/**
 * components/OrderForm.jsx — Formulario completo para crear/editar órdenes.
 *
 * Es el formulario más extenso de la app. Se divide en secciones colapsables:
 *  1. Datos del Cliente: manual o selección desde clientes registrados.
 *  2. Información del Dispositivo: tipo, marca, modelo, serial, email, accesorios.
 *  3. Seguridad / Bloqueo: contraseña/PIN y notas de bloqueo.
 *  4. Diagnóstico: problema reportado, notas del técnico, flags de daño.
 *  5. Checklist Técnico: estado físico, funciones, cámaras, audio, conectividad,
 *     humedad y software. Con botones para rellenar todo de golpe.
 *  6. Presupuesto y Precios (ARS): precios estimado, final, costo y trabajo hecho.
 *  7. Estado de la Orden: selector con validación de transición y fecha de entrega.
 *
 * Props:
 *  - initialData: datos de la orden a editar (opcional).
 *  - onSubmit(formData): callback al enviar.
 *  - onCancel(): callback para cancelar (botón visible solo si se pasa).
 *  - submitLabel: texto del botón (default: 'Guardar Orden').
 *  - isLoading: desactiva el botón de envío mientras se procesa.
 *
 * Subcomponentes internos:
 *  - Section: sección colapsable con ícono y título.
 *  - Field: label + input wrapper.
 *  - AutocompleteInput: input con dropdown de sugerencias filtradas.
 *  - ClientSearch: buscador de clientes existentes en el store global.
 *  - TriState: OK / Falla / No probado (checklist funcional).
 *  - BoolState: Sí / No / N/A (ítems informativos).
 *  - PhysState: opciones de estado físico personalizadas.
 *  - CheckGroup: separador de categoría dentro del checklist.
 */
import React, { useState, useRef, useEffect } from 'react'
import {
  User, Smartphone, Shield, Stethoscope, CheckSquare, DollarSign,
  ChevronDown, ChevronUp, Search, UserCheck, Camera, Pencil, X,
  Plus, Trash2, Package, Wrench
} from 'lucide-react'
import { DEVICE_TYPES, ACCESSORIES_OPTIONS, STATUS_CONFIG, canTransitionTo } from '../utils/constants'
import { useStore } from '../store/useStore'
import ImageUploader from './ImageUploader'
import PatternInput from './PatternInput'

// ── Sección colapsable ──────────────────────────────────────────────────────
const Section = ({ title, icon: Icon, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon size={15} className="text-indigo-500" />
          <span className="font-semibold text-slate-900 dark:text-white text-sm">{title}</span>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  )
}

const Field = ({ label, required, children }) => (
  <div className="col-span-2 sm:col-span-1">
    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
)

const inputClass =
  'w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition'

const selectClass =
  'w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition cursor-pointer'

// Paleta de colores clara para estados
const CLS = {
  ok:       'bg-green-100  text-green-700  dark:bg-green-900/40  dark:text-green-300',
  warn:     'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  bad:      'bg-red-100    text-red-700    dark:bg-red-900/40    dark:text-red-300',
  neutral:  'bg-slate-200  text-slate-600  dark:bg-slate-700     dark:text-slate-300',
  inactive: 'bg-slate-100  text-slate-400  dark:bg-slate-800     dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700',
}

// OK / Falla / No probado  (funcional)
const TriState = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
    <div className="flex gap-1">
      {[
        { v: true,  cls: CLS.ok,      txt: 'OK'       },
        { v: false, cls: CLS.bad,     txt: 'Falla'    },
        { v: null,  cls: CLS.neutral, txt: 'No prob.' },
      ].map(({ v, cls, txt }) => (
        <button key={String(v)} type="button" onClick={() => onChange(v)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${value === v ? cls : CLS.inactive}`}>
          {txt}
        </button>
      ))}
    </div>
  </div>
)

// Sí / No / N/A  (informativo — software, bloqueos)
const BoolState = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
    <div className="flex gap-1">
      {[
        { v: true,  cls: CLS.warn,    txt: 'Sí'  },
        { v: false, cls: CLS.ok,      txt: 'No'  },
        { v: null,  cls: CLS.neutral, txt: 'N/A' },
      ].map(({ v, cls, txt }) => (
        <button key={String(v)} type="button" onClick={() => onChange(v)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${value === v ? cls : CLS.inactive}`}>
          {txt}
        </button>
      ))}
    </div>
  </div>
)

// Componente para estados físicos con opciones personalizadas
const PhysState = ({ label, value, onChange, options }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
    <div className="flex gap-1">
      {options.map((opt) => (
        <button key={opt.value} type="button"
          onClick={() => onChange(value === opt.value ? null : opt.value)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${value === opt.value ? opt.cls : CLS.inactive}`}>
          {opt.label}
        </button>
      ))}
    </div>
  </div>
)

const PHYS_OK_DMG_BRK = [
  { value: 'ok',        label: 'OK',      cls: CLS.ok   },
  { value: 'scratched', label: 'Rayado',  cls: CLS.warn },
  { value: 'broken',    label: 'Roto',    cls: CLS.bad  },
]
const PHYS_OK_DENTED_BENT = [
  { value: 'ok',     label: 'OK',      cls: CLS.ok   },
  { value: 'dented', label: 'Golpes',  cls: CLS.warn },
  { value: 'bent',   label: 'Doblado', cls: CLS.bad  },
]
const PHYS_SIM = [
  { value: 'present', label: 'Presente', cls: CLS.ok   },
  { value: 'damaged', label: 'Dañada',   cls: CLS.warn },
  { value: 'missing', label: 'Faltante', cls: CLS.bad  },
]

// ── Input de moneda con separadores de miles automáticos ───────────────────
// Guarda el valor numérico puro en el store (ej: 950000)
// Muestra con puntos de miles mientras se escribe (ej: "950.000")
function CurrencyInput({ value, onChange, placeholder = '0', className }) {
  const format = (raw) => {
    const digits = String(raw ?? '').replace(/\D/g, '')
    if (!digits) return ''
    return Number(digits).toLocaleString('es-AR', { maximumFractionDigits: 0 })
  }

  const [display, setDisplay] = useState(() => format(value))

  // Sincroniza al montar con initialData
  useEffect(() => {
    setDisplay(format(value))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '')
    setDisplay(raw ? Number(raw).toLocaleString('es-AR', { maximumFractionDigits: 0 }) : '')
    onChange(raw ? Number(raw) : '')
  }

  return (
    <input
      className={className}
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      placeholder={placeholder}
      autoComplete="off"
    />
  )
}

// Separador de grupo dentro del checklist
const CheckGroup = ({ title }) => (
  <p className="pt-5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 select-none border-t border-slate-100 dark:border-slate-800 mt-1">
    {title}
  </p>
)

// ── Autocomplete genérico ──────────────────────────────────────────────────
function AutocompleteInput({ value, onChange, suggestions, placeholder, className, required }) {
  const [open, setOpen] = useState(false)
  const [filtered, setFiltered] = useState([])
  const [focused, setFocused] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!value || value.length < 1) { setFiltered([]); setOpen(false); return }
    const q = value.toLowerCase()
    const matches = suggestions.filter((s) => s.toLowerCase().includes(q)).slice(0, 8)
    setFiltered(matches)
    setOpen(focused && matches.length > 0)
  }, [value, suggestions, focused])

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={wrapRef} className="relative">
      <input
        className={className}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        onFocus={() => { setFocused(true); filtered.length > 0 && setOpen(true) }}
        onBlur={() => setFocused(false)}
      />
      {open && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {filtered.map((s) => (
            <li key={s}>
              <button
                type="button"
                className="w-full text-left px-3.5 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                onMouseDown={(e) => { e.preventDefault(); onChange(s); setOpen(false) }}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Buscador de cliente registrado ─────────────────────────────────────────
function ClientSearch({ onSelect }) {
  const searchClients = useStore((s) => s.searchClients)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const wrapRef = useRef(null)

  useEffect(() => {
    setResults(searchClients(query))
  }, [query, searchClients])

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setResults([]) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition"
          placeholder="Buscar cliente por nombre, teléfono o DNI..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
      </div>
      {results.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden">
          {results.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                onMouseDown={(e) => { e.preventDefault(); onSelect(c); setQuery(''); setResults([]) }}
              >
                <p className="text-sm font-medium text-slate-900 dark:text-white">{c.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {[c.phone, c.dni && `DNI ${c.dni}`, c.email].filter(Boolean).join(' · ')}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Chip del cliente seleccionado ───────────────────────────────────────────
function SelectedClientChip({ client, onEdit, onClear }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700/60">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center flex-shrink-0">
          <UserCheck size={14} className="text-indigo-600 dark:text-indigo-300" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 truncate">{client.name}</p>
          <p className="text-xs text-indigo-500 dark:text-indigo-400 truncate">
            {[client.phone, client.dni && `DNI ${client.dni}`, client.email].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-800/60 transition-colors"
        >
          <Pencil size={11} />
          Editar
        </button>
        <button
          type="button"
          onClick={onClear}
          title="Cambiar cliente"
          className="p-1 rounded-md text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-800/60 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Editor de ítems de presupuesto ─────────────────────────────────────────
function BudgetItemsEditor({ items = [], onChange, inventory = [], services = [] }) {
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [type, setType] = useState('service') // 'service' | 'inventory' | 'custom'
  const [customName, setCustomName] = useState('')
  const [customQty, setCustomQty]   = useState(1)
  const [customPrice, setCustomPrice] = useState('')
  const searchRef = useRef(null)

  // Merge services + inventory for search
  const allSuggestions = [
    ...services.map((s) => ({
      id: s.id,
      label: s.name,
      price: s.priceType === 'percent' ? 0 : (Number(s.price) || 0),
      priceDisplay: s.priceType === 'percent' ? `${s.price ?? '?'}% repuesto` : `$${Number(s.price || 0).toLocaleString('es-AR')}`,
      isPercent: s.priceType === 'percent',
      percentValue: s.priceType === 'percent' ? s.price : null,
      type: 'service',
    })),
    ...inventory.map((i) => ({
      id: i.id,
      label: i.name,
      price: Number(i.salePrice || i.price || 0),
      priceDisplay: `$${Number(i.salePrice || i.price || 0).toLocaleString('es-AR')}`,
      isPercent: false,
      percentValue: null,
      type: 'inventory',
      stock: i.stock,
    })),
  ]

  const filtered = search.length >= 1
    ? allSuggestions.filter((s) => s.label?.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : []

  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const addItem = (suggestion) => {
    const newItem = {
      id: `BI-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      sourceId: suggestion.id,
      type: suggestion.type,
      name: suggestion.label,
      qty: 1,
      unitPrice: Number(suggestion.price) || 0,
      isPercent: suggestion.isPercent || false,
      percentValue: suggestion.isPercent ? suggestion.percentValue : null,
    }
    onChange([...items, newItem])
    setSearch('')
    setSearchOpen(false)
  }

  const addCustom = () => {
    if (!customName.trim()) return
    const newItem = {
      id: `BI-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      sourceId: null,
      type: 'custom',
      name: customName.trim(),
      qty: Number(customQty) || 1,
      unitPrice: Number(customPrice) || 0,
    }
    onChange([...items, newItem])
    setCustomName('')
    setCustomQty(1)
    setCustomPrice('')
  }

  const updateItem = (id, field, value) => {
    onChange(items.map((it) => it.id === id ? { ...it, [field]: value } : it))
  }

  const removeItem = (id) => {
    onChange(items.filter((it) => it.id !== id))
  }

  const total = items.reduce((acc, it) => acc + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0)

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium">
        {[
          { id: 'service',   label: 'Servicios / Inventario' },
          { id: 'custom',    label: 'Ítem personalizado'      },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setType(tab.id)}
            className={`flex-1 py-1.5 rounded-md transition-colors ${type === tab.id ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Búsqueda de servicios/inventario */}
      {type === 'service' && (
        <div ref={searchRef} className="relative">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full pl-8 pr-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition"
              placeholder="Buscar en servicios e inventario..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSearchOpen(true) }}
              onFocus={() => setSearchOpen(true)}
              autoComplete="off"
            />
          </div>
          {searchOpen && filtered.length > 0 && (
            <ul className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
              {filtered.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); addItem(s) }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                  >
                    {s.type === 'service'
                      ? <Wrench size={13} className="text-indigo-400 flex-shrink-0" />
                      : <Package size={13} className="text-emerald-400 flex-shrink-0" />
                    }
                    <span className="flex-1 text-left truncate">{s.label}</span>
                    <span className={`text-xs flex-shrink-0 ${s.isPercent ? 'text-violet-400' : 'text-slate-400'}`}>{s.priceDisplay}</span>
                    {s.type === 'inventory' && s.stock !== undefined && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${s.stock > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {s.stock > 0 ? `Stock: ${s.stock}` : 'Sin stock'}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {searchOpen && search.length >= 1 && filtered.length === 0 && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl px-4 py-3 text-xs text-slate-400">
              Sin resultados — usá «Ítem personalizado» para agregarlo manualmente.
            </div>
          )}
        </div>
      )}

      {/* Ítem personalizado */}
      {type === 'custom' && (
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-12 sm:col-span-6">
            <input
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition"
              placeholder="Descripción del ítem o servicio"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
          </div>
          <div className="col-span-4 sm:col-span-2">
            <input
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition text-center"
              type="number" min="1" step="1"
              placeholder="Cant."
              value={customQty}
              onChange={(e) => setCustomQty(e.target.value)}
            />
          </div>
          <div className="col-span-5 sm:col-span-3 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
            <input
              className="w-full pl-6 pr-2 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition"
              type="number" min="0" step="1"
              placeholder="Precio"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
            />
          </div>
          <div className="col-span-3 sm:col-span-1">
            <button
              type="button"
              onClick={addCustom}
              className="w-full h-full flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Lista de ítems */}
      {items.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((it) => (
              <div key={it.id} className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-slate-900/60">
                <span className="flex-shrink-0">
                  {it.type === 'service'   && <Wrench  size={12} className="text-indigo-400" />}
                  {it.type === 'inventory' && <Package size={12} className="text-emerald-400" />}
                  {it.type === 'custom'    && <DollarSign size={12} className="text-amber-400" />}
                </span>
                <span className="flex-1 text-sm text-slate-800 dark:text-slate-200 truncate min-w-0">
                  {it.name}
                </span>
                {it.isPercent ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 font-semibold flex-shrink-0">
                    {it.percentValue}% del repuesto
                  </span>
                ) : (
                  <>
                    <input
                      type="number" min="1" step="1"
                      value={it.qty}
                      onChange={(e) => updateItem(it.id, 'qty', Number(e.target.value) || 1)}
                      className="w-14 text-center text-xs px-1.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                    <span className="text-xs text-slate-400">×</span>
                    {it.type === 'inventory' || it.type === 'service' ? (
                      <span className="w-24 text-right text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                        ${Number(it.unitPrice).toLocaleString('es-AR')}
                      </span>
                    ) : (
                      <div className="relative w-24 flex-shrink-0">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                        <input
                          type="number" min="0" step="1"
                          value={it.unitPrice}
                          onChange={(e) => updateItem(it.id, 'unitPrice', Number(e.target.value) || 0)}
                          className="w-full pl-5 pr-1 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                      </div>
                    )}
                    <span className="w-20 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 flex-shrink-0">
                      ${((Number(it.qty) || 0) * (Number(it.unitPrice) || 0)).toLocaleString('es-AR')}
                    </span>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => removeItem(it.id)}
                  className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          {/* Total */}
          <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Total ítems ({items.length})
            </span>
            <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
              ${total.toLocaleString('es-AR')}
            </span>
          </div>
        </div>
      )}

      {items.length === 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-3">
          Sin ítems — buscá en servicios/inventario o agregá uno personalizado
        </p>
      )}
    </div>
  )
}

// ── Formulario principal ───────────────────────────────────────────────────
export default function OrderForm({ initialData, onSubmit, onCancel, submitLabel = 'Guardar Orden', isLoading }) {
  const clients = useStore((s) => s.clients)
  const deviceCatalog = useStore((s) => s.deviceCatalog)
  const inventory = useStore((s) => s.inventory)
  const services  = useStore((s) => s.services)
  // null = buscando / sin selección | { id, ... } = cliente seleccionado de la DB
  const [selectedClient, setSelectedClient] = useState(null)
  // true = campos de cliente en modo edición (solo lectura por defecto si hay cliente seleccionado)
  const [clientEditing, setClientEditing] = useState(false)

  const [form, setForm] = useState(() => ({
    customerName: '',
    customerDni: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    deviceType: 'phone',
    deviceBrand: '',
    deviceModel: '',
    deviceSerial: '',
    deviceEmail: '',
    accessories: [],
    devicePassword: '',
    devicePattern: [],
    lockNotes: '',
    reportedIssue: '',
    techFindings: '',
    technicianNotes: '',
    waterDamage: false,
    physicalDamage: false,
    previouslyOpened: false,
    // Checklist funcional
    powersOn: null,
    charges: null,
    screenWorks: null,
    touchWorks: null,
    audioWorks: null,
    buttonsWork: null,
    // Estado físico
    screenCondition: null,
    backCoverCondition: null,
    frameCondition: null,
    simTray: null,
    // Cámaras
    rearCameraWorks: null,
    frontCameraWorks: null,
    flashWorks: null,
    // Conectividad y sensores
    wifiWorks: null,
    bluetoothWorks: null,
    gpsWorks: null,
    micWorks: null,
    earSpeakerWorks: null,
    vibrationWorks: null,
    biometricWorks: null,
    chargingPortWorks: null,
    // Humedad / Líquidos
    humidityIndicator: null,
    liquidSigns: null,
    corrosionVisible: null,
    // Software
    hasPinPattern: null,
    hasGoogleIcloud: null,
    frpActive: null,
    bootsSystem: null,
    estimatedPrice: '',
    finalPrice: '',
    repairCost: '',
    budgetStatus: 'pending',
    budgetItems: [],
    workDone: '',
    status: 'pending',
    statusNote: '',
    estimatedDelivery: '',
    photosEntry: [],
    photosExit: [],
    ...initialData,
    // Normalize ISO date to date input value (yyyy-mm-dd)
    estimatedDelivery: initialData?.estimatedDelivery
      ? initialData.estimatedDelivery.slice(0, 10)
      : '',
  }))

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))
  const toggle = (key) => set(key, !form[key])

  // ── Relleno masivo del checklist ──────────────────────────────────────────
  const TRISTATE_KEYS = [
    'powersOn','chargingPortWorks','charges','screenWorks','touchWorks',
    'buttonsWork','vibrationWorks','rearCameraWorks','frontCameraWorks',
    'flashWorks','audioWorks','earSpeakerWorks','micWorks','wifiWorks',
    'bluetoothWorks','gpsWorks','biometricWorks','bootsSystem',
  ]
  const BOOL_DAMAGE_KEYS = ['humidityIndicator','liquidSigns','corrosionVisible']
  const BOOL_INFO_KEYS   = ['hasPinPattern','hasGoogleIcloud','frpActive']

  const fillChecklist = (mode) => {
    setForm((f) => {
      const patch = {}
      if (mode === 'ok') {
        TRISTATE_KEYS.forEach((k)    => { patch[k] = true  })
        BOOL_DAMAGE_KEYS.forEach((k) => { patch[k] = false }) // false = sin daño
        BOOL_INFO_KEYS.forEach((k)   => { patch[k] = null  })
        patch.screenCondition = 'ok'; patch.backCoverCondition = 'ok'
        patch.frameCondition  = 'ok'; patch.simTray = 'present'
      } else if (mode === 'fail') {
        TRISTATE_KEYS.forEach((k)    => { patch[k] = false })
        BOOL_DAMAGE_KEYS.forEach((k) => { patch[k] = true  })
        BOOL_INFO_KEYS.forEach((k)   => { patch[k] = null  })
        patch.screenCondition = 'broken'; patch.backCoverCondition = 'broken'
        patch.frameCondition  = 'bent';   patch.simTray = 'missing'
      } else {
        ;[...TRISTATE_KEYS, ...BOOL_DAMAGE_KEYS, ...BOOL_INFO_KEYS].forEach((k) => { patch[k] = null })
        patch.screenCondition = null; patch.backCoverCondition = null
        patch.frameCondition  = null; patch.simTray = null
      }
      return { ...f, ...patch }
    })
  }

  // Validación de transición de estado (solo para delivered/abandoned)
  const statusTransitionError = initialData
    ? canTransitionTo(initialData, form.status)
    : { ok: true }
  const toggleAccessory = (acc) => {
    set('accessories', form.accessories.includes(acc)
      ? form.accessories.filter((a) => a !== acc)
      : [...form.accessories, acc])
  }

  const fillFromClient = (client) => {
    setSelectedClient(client)
    setClientEditing(false)
    setForm((f) => ({
      ...f,
      customerName: client.name || '',
      customerDni: client.dni || '',
      customerPhone: client.phone || '',
      customerEmail: client.email || '',
      customerAddress: client.address || '',
    }))
  }

  const clearSelectedClient = () => {
    setSelectedClient(null)
    setClientEditing(false)
    setForm((f) => ({
      ...f,
      customerName: '',
      customerDni: '',
      customerPhone: '',
      customerEmail: '',
      customerAddress: '',
    }))
  }

  // Campos de cliente en solo lectura si hay cliente seleccionado y no está en modo edición
  const clientReadOnly = selectedClient !== null && !clientEditing

  // Brand and model suggestions come exclusively from the DB catalog
  const brandSuggestions = [...new Set(deviceCatalog.map((i) => i.brand))].sort()
  const modelSuggestions = deviceCatalog
    .filter((i) => i.brand === form.deviceBrand)
    .map((i) => i.model)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* ── Cliente ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700/60 flex items-center gap-2.5">
          <User size={15} className="text-indigo-500" />
          <span className="font-semibold text-slate-900 dark:text-white text-sm">Datos del Cliente</span>
        </div>

        <div className="p-5 space-y-4">
          {/* Buscador siempre visible arriba */}
          {!selectedClient ? (
            <div>
              <ClientSearch onSelect={fillFromClient} />
              {clients.length > 0 && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
                  <UserCheck size={11} />
                  {clients.length} cliente{clients.length !== 1 ? 's' : ''} registrado{clients.length !== 1 ? 's' : ''} · Si no aparece, rellena los campos de abajo para crear uno nuevo
                </p>
              )}
            </div>
          ) : (
            <SelectedClientChip
              client={selectedClient}
              onEdit={() => setClientEditing(true)}
              onClear={clearSelectedClient}
            />
          )}

          {/* Campos del cliente */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre completo" required>
              <input
                className={`${inputClass} ${clientReadOnly ? 'opacity-70 cursor-default' : ''}`}
                value={form.customerName}
                onChange={(e) => set('customerName', e.target.value)}
                placeholder="Juan Pérez"
                required
                readOnly={clientReadOnly}
              />
            </Field>
            <Field label="DNI">
              <input
                className={`${inputClass} ${clientReadOnly ? 'opacity-70 cursor-default' : ''}`}
                value={form.customerDni}
                onChange={(e) => set('customerDni', e.target.value)}
                placeholder="12345678"
                readOnly={clientReadOnly}
              />
            </Field>
            <Field label="Teléfono (WhatsApp)">
              <input
                className={`${inputClass} ${clientReadOnly ? 'opacity-70 cursor-default' : ''}`}
                type="tel"
                value={form.customerPhone}
                onChange={(e) => set('customerPhone', e.target.value)}
                placeholder="+54 11 1234-5678"
                readOnly={clientReadOnly}
              />
            </Field>
            <Field label="Email">
              <input
                className={`${inputClass} ${clientReadOnly ? 'opacity-70 cursor-default' : ''}`}
                type="email"
                value={form.customerEmail}
                onChange={(e) => set('customerEmail', e.target.value)}
                placeholder="cliente@email.com"
                readOnly={clientReadOnly}
              />
            </Field>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Dirección (opcional)</label>
              <input
                className={`${inputClass} ${clientReadOnly ? 'opacity-70 cursor-default' : ''}`}
                value={form.customerAddress}
                onChange={(e) => set('customerAddress', e.target.value)}
                placeholder="Calle, Ciudad, CP"
                readOnly={clientReadOnly}
              />
            </div>
          </div>

          {/* Indicador de modo edición */}
          {clientEditing && selectedClient && (
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Pencil size={11} />
              Editando datos del cliente — los cambios se guardarán al crear la orden
            </p>
          )}
        </div>
      </div>

      {/* ── Dispositivo ── */}
      <Section title="Información del Dispositivo" icon={Smartphone}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tipo de dispositivo" required>
            <select className={selectClass} value={form.deviceType} onChange={(e) => set('deviceType', e.target.value)} required>
              {DEVICE_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </Field>

          <Field label="Marca">
            <AutocompleteInput
              value={form.deviceBrand}
              onChange={(v) => { set('deviceBrand', v); if (form.deviceModel) set('deviceModel', '') }}
              suggestions={brandSuggestions}
              placeholder="Samsung, Apple, Motorola..."
              className={inputClass}
            />
          </Field>

          <Field label="Modelo">
            <AutocompleteInput
              value={form.deviceModel}
              onChange={(v) => set('deviceModel', v)}
              suggestions={modelSuggestions}
              placeholder={form.deviceBrand ? `Modelos de ${form.deviceBrand}...` : 'Galaxy S24, iPhone 15...'}
              className={inputClass}
            />
          </Field>

          <Field label="Número de serie / IMEI">
            <input className={inputClass} value={form.deviceSerial} onChange={(e) => set('deviceSerial', e.target.value)} placeholder="SN o IMEI" />
          </Field>

          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Accesorios recibidos</label>
            <div className="flex flex-wrap gap-2">
              {ACCESSORIES_OPTIONS.map((acc) => (
                <button
                  key={acc}
                  type="button"
                  onClick={() => toggleAccessory(acc)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    form.accessories.includes(acc)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                  }`}
                >
                  {acc}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Seguridad ── */}
      <Section title="Seguridad / Bloqueo" icon={Shield} defaultOpen={false}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Contraseña / PIN">
            <input
              className={inputClass}
              value={form.devicePassword}
              onChange={(e) => set('devicePassword', e.target.value)}
              placeholder="1234, code, etc."
            />
          </Field>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
              Patrón de desbloqueo
            </label>
            <PatternInput
              value={form.devicePattern}
              onChange={(p) => set('devicePattern', p)}
            />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Notas de bloqueo</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={2}
              value={form.lockNotes}
              onChange={(e) => set('lockNotes', e.target.value)}
              placeholder="Cuentas bloqueadas, Find My, iCloud, etc."
            />
          </div>
        </div>
      </Section>

      {/* ── Diagnóstico ── */}
      <Section title="Diagnóstico" icon={Stethoscope}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Problema reportado por el cliente <span className="text-red-400">*</span>
            </label>
            <textarea className={`${inputClass} resize-none`} rows={3} value={form.reportedIssue} onChange={(e) => set('reportedIssue', e.target.value)} placeholder="¿Qué le pasa al dispositivo según el cliente?" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Problema encontrado por el técnico</label>
            <textarea className={`${inputClass} resize-none`} rows={3} value={form.techFindings} onChange={(e) => set('techFindings', e.target.value)} placeholder="¿Qué encontró el técnico al revisar el equipo?" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Observaciones del técnico</label>
            </div>
            <textarea className={`${inputClass} resize-none`} rows={3} value={form.technicianNotes} onChange={(e) => set('technicianNotes', e.target.value)} placeholder="Notas internas del técnico (no visible para el cliente)..." />
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'waterDamage', label: 'Daño por agua', color: 'blue' },
              { key: 'physicalDamage', label: 'Daño físico', color: 'orange' },
              { key: 'previouslyOpened', label: 'Abierto anteriormente', color: 'yellow' },
            ].map(({ key, label, color }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggle(key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-medium transition-colors ${
                  form[key]
                    ? color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                      : color === 'orange' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300'
                      : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${form[key] ? (color === 'blue' ? 'bg-blue-500' : color === 'orange' ? 'bg-orange-500' : 'bg-yellow-500') : 'bg-slate-300 dark:bg-slate-600'}`} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Checklist técnico ── */}
      <Section title="Checklist Técnico" icon={CheckSquare} defaultOpen={false}>
        {/* Relleno masivo */}
        <div className="flex items-center gap-1 mb-5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
          {[
            { mode: 'ok',   label: 'Todo OK',    dot: 'bg-green-400' },
            { mode: 'fail', label: 'Todo falla',  dot: 'bg-red-400'   },
            { mode: 'na',   label: 'No probado',  dot: 'bg-slate-400' },
          ].map(({ mode, label, dot }) => (
            <button
              key={mode}
              type="button"
              onClick={() => fillChecklist(mode)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 hover:shadow-sm transition-all duration-150"
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
              {label}
            </button>
          ))}
        </div>
        <div className="space-y-0">

          {/* Estado físico */}
          <CheckGroup title="Estado físico" />
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <PhysState label="Pantalla" value={form.screenCondition} onChange={(v) => set('screenCondition', v)} options={PHYS_OK_DMG_BRK} />
            <PhysState label="Tapa trasera" value={form.backCoverCondition} onChange={(v) => set('backCoverCondition', v)} options={PHYS_OK_DMG_BRK} />
            <PhysState label="Marco / bordes" value={form.frameCondition} onChange={(v) => set('frameCondition', v)} options={PHYS_OK_DENTED_BENT} />
            <PhysState label="Bandeja SIM" value={form.simTray} onChange={(v) => set('simTray', v)} options={PHYS_SIM} />
          </div>

          {/* Funciones básicas */}
          <CheckGroup title="Funciones básicas" />
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <TriState label="Enciende" value={form.powersOn} onChange={(v) => set('powersOn', v)} />
            <TriState label="Puerto de carga" value={form.chargingPortWorks} onChange={(v) => set('chargingPortWorks', v)} />
            <TriState label="Carga correctamente" value={form.charges} onChange={(v) => set('charges', v)} />
            <TriState label="Pantalla" value={form.screenWorks} onChange={(v) => set('screenWorks', v)} />
            <TriState label="Touch / táctil" value={form.touchWorks} onChange={(v) => set('touchWorks', v)} />
            <TriState label="Botones (vol. / encendido)" value={form.buttonsWork} onChange={(v) => set('buttonsWork', v)} />
            <TriState label="Vibración" value={form.vibrationWorks} onChange={(v) => set('vibrationWorks', v)} />
          </div>

          {/* Cámaras */}
          <CheckGroup title="Cámaras" />
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <TriState label="Cámara trasera" value={form.rearCameraWorks} onChange={(v) => set('rearCameraWorks', v)} />
            <TriState label="Cámara frontal" value={form.frontCameraWorks} onChange={(v) => set('frontCameraWorks', v)} />
            <TriState label="Flash / Linterna" value={form.flashWorks} onChange={(v) => set('flashWorks', v)} />
          </div>

          {/* Audio */}
          <CheckGroup title="Audio" />
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <TriState label="Bocina / altavoz" value={form.audioWorks} onChange={(v) => set('audioWorks', v)} />
            <TriState label="Auricular (llamadas)" value={form.earSpeakerWorks} onChange={(v) => set('earSpeakerWorks', v)} />
            <TriState label="Micrófono" value={form.micWorks} onChange={(v) => set('micWorks', v)} />
          </div>

          {/* Conectividad y sensores */}
          <CheckGroup title="Conectividad y sensores" />
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <TriState label="Wi-Fi" value={form.wifiWorks} onChange={(v) => set('wifiWorks', v)} />
            <TriState label="Bluetooth" value={form.bluetoothWorks} onChange={(v) => set('bluetoothWorks', v)} />
            <TriState label="GPS" value={form.gpsWorks} onChange={(v) => set('gpsWorks', v)} />
            <TriState label="Face ID / Huella digital" value={form.biometricWorks} onChange={(v) => set('biometricWorks', v)} />
          </div>

          {/* Humedad / Líquidos */}
          <CheckGroup title="Humedad / Líquidos" />
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <BoolState label="Indicador de humedad activado" value={form.humidityIndicator} onChange={(v) => set('humidityIndicator', v)} />
            <BoolState label="Señales visibles de líquido" value={form.liquidSigns} onChange={(v) => set('liquidSigns', v)} />
            <BoolState label="Oxidación visible en placa" value={form.corrosionVisible} onChange={(v) => set('corrosionVisible', v)} />
          </div>

          {/* Software */}
          <CheckGroup title="Software" />
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <TriState label="Inicia el sistema" value={form.bootsSystem} onChange={(v) => set('bootsSystem', v)} />
            <BoolState label="Tiene PIN / patrón / contraseña" value={form.hasPinPattern} onChange={(v) => set('hasPinPattern', v)} />
            <BoolState label="Tiene cuenta Google / iCloud" value={form.hasGoogleIcloud} onChange={(v) => set('hasGoogleIcloud', v)} />
            <BoolState label="FRP / Bloqueo de activación activo" value={form.frpActive} onChange={(v) => set('frpActive', v)} />
          </div>

        </div>
      </Section>

      {/* ── Fotos ── */}
      <Section title="Fotos del Equipo" icon={Camera} defaultOpen={false}>
        <div className="grid sm:grid-cols-2 gap-6">
          <ImageUploader
            label="Fotos de ingreso (cómo llegó)"
            images={form.photosEntry}
            onChange={(imgs) => set('photosEntry', imgs)}
          />
          <ImageUploader
            label="Fotos de salida (cómo se fue)"
            images={form.photosExit}
            onChange={(imgs) => set('photosExit', imgs)}
          />
        </div>
      </Section>

      {/* ── Presupuesto ── */}
      <Section title="Presupuesto y Precios (ARS)" icon={DollarSign} defaultOpen={false}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Precio estimado">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input
                className={`${inputClass} pl-7`}
                type="text"
                inputMode="numeric"
                value={form.estimatedPrice === '' ? '' : Number(form.estimatedPrice).toLocaleString('es-AR')}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\./g, '').replace(/,/g, '').replace(/[^\d]/g, '')
                  set('estimatedPrice', raw === '' ? '' : raw)
                }}
                placeholder="0"
              />
            </div>
          </Field>
          <Field label="Precio final">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input
                className={`${inputClass} pl-7`}
                type="text"
                inputMode="numeric"
                value={form.finalPrice === '' ? '' : Number(form.finalPrice).toLocaleString('es-AR')}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\./g, '').replace(/,/g, '').replace(/[^\d]/g, '')
                  set('finalPrice', raw === '' ? '' : raw)
                }}
                placeholder="0"
              />
            </div>
          </Field>
          <Field label="Costo de reparación">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input
                className={`${inputClass} pl-7`}
                type="text"
                inputMode="numeric"
                value={form.repairCost === '' ? '' : Number(form.repairCost).toLocaleString('es-AR')}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\./g, '').replace(/,/g, '').replace(/[^\d]/g, '')
                  set('repairCost', raw === '' ? '' : raw)
                }}
                placeholder="0"
              />
            </div>
          </Field>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Aprobación del cliente
            </label>
            <div className="flex rounded-lg border border-slate-700 overflow-hidden text-xs">
              {[
                { value: 'pending',  label: 'Pendiente', activeClass: 'bg-slate-600 text-white' },
                { value: 'approved', label: '✓ Aprobado', activeClass: 'bg-green-600 text-white' },
                { value: 'rejected', label: '✕ Rechazado', activeClass: 'bg-red-600 text-white' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('budgetStatus', opt.value)}
                  className={`flex-1 py-2.5 font-medium transition-colors ${
                    form.budgetStatus === opt.value
                      ? opt.activeClass
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
              Ítems del presupuesto
            </label>
            <BudgetItemsEditor
              items={form.budgetItems}
              onChange={(items) => set('budgetItems', items)}
              inventory={inventory}
              services={services}
            />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Trabajo realizado / Servicios prestados</label>
            <textarea className={`${inputClass} resize-none`} rows={3} value={form.workDone} onChange={(e) => set('workDone', e.target.value)} placeholder="Describir qué se hizo, piezas reemplazadas, etc." />
          </div>
        </div>
      </Section>

      {/* ── Estado ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Estado de la Orden</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Estado actual">
            <select className={selectClass} value={form.status} onChange={(e) => set('status', e.target.value)}>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Nota del cambio">
            <input className={inputClass} value={form.statusNote} onChange={(e) => set('statusNote', e.target.value)} placeholder="Nota opcional..." />
          </Field>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Fecha estimada de entrega
            </label>
            <input
              className={inputClass}
              type="date"
              value={form.estimatedDelivery}
              onChange={(e) => set('estimatedDelivery', e.target.value)}
              min={(initialData?.entryDate || new Date().toISOString()).slice(0, 10)}
            />
          </div>
          {!statusTransitionError.ok && (
            <div className="col-span-2 flex items-start gap-2.5 px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-sm text-amber-700 dark:text-amber-400">
              <svg className="flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7.5" stroke="currentColor"/><path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              {statusTransitionError.reason}
            </div>
          )}
        </div>
      </div>

      {/* ── Acciones ── */}
      <div className="flex gap-3 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading || !statusTransitionError.ok}
          className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Guardando...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
