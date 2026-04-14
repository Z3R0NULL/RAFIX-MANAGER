import React, { useState, useRef, useEffect } from 'react'
import {
  User, Smartphone, Shield, Stethoscope, CheckSquare, DollarSign,
  ChevronDown, ChevronUp, Search, UserCheck, UserPlus
} from 'lucide-react'
import { DEVICE_TYPES, ACCESSORIES_OPTIONS, STATUS_CONFIG, DEVICE_SUGGESTIONS, BRAND_LIST } from '../utils/constants'
import { useStore } from '../store/useStore'

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

const TriState = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between py-1.5">
    <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
    <div className="flex gap-1">
      {[true, false, null].map((v) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            value === v
              ? v === true ? 'bg-green-500 text-white'
                : v === false ? 'bg-red-500 text-white'
                : 'bg-slate-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          {v === true ? 'Sí' : v === false ? 'No' : 'N/A'}
        </button>
      ))}
    </div>
  </div>
)

// ── Autocomplete genérico ──────────────────────────────────────────────────
function AutocompleteInput({ value, onChange, suggestions, placeholder, className, required }) {
  const [open, setOpen] = useState(false)
  const [filtered, setFiltered] = useState([])
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!value || value.length < 1) { setFiltered([]); setOpen(false); return }
    const q = value.toLowerCase()
    const matches = suggestions.filter((s) => s.toLowerCase().includes(q)).slice(0, 8)
    setFiltered(matches)
    setOpen(matches.length > 0)
  }, [value, suggestions])

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
        onFocus={() => filtered.length > 0 && setOpen(true)}
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
          placeholder="Buscar por nombre, teléfono o DNI..."
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

// ── Formulario principal ───────────────────────────────────────────────────
export default function OrderForm({ initialData, onSubmit, onCancel, submitLabel = 'Guardar Orden', isLoading }) {
  const clients = useStore((s) => s.clients)
  const [clientMode, setClientMode] = useState('manual')

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
    lockNotes: '',
    reportedIssue: '',
    technicianNotes: '',
    waterDamage: false,
    physicalDamage: false,
    previouslyOpened: false,
    powersOn: null,
    charges: null,
    screenWorks: null,
    touchWorks: null,
    audioWorks: null,
    buttonsWork: null,
    estimatedPrice: '',
    finalPrice: '',
    repairCost: '',
    budgetStatus: 'pending',
    workDone: '',
    status: 'pending',
    statusNote: '',
    estimatedDelivery: '',
    ...initialData,
    // Normalize ISO date to date input value (yyyy-mm-dd)
    estimatedDelivery: initialData?.estimatedDelivery
      ? initialData.estimatedDelivery.slice(0, 10)
      : '',
  }))

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))
  const toggle = (key) => set(key, !form[key])
  const toggleAccessory = (acc) => {
    set('accessories', form.accessories.includes(acc)
      ? form.accessories.filter((a) => a !== acc)
      : [...form.accessories, acc])
  }

  const fillFromClient = (client) => {
    setForm((f) => ({
      ...f,
      customerName: client.name || '',
      customerDni: client.dni || '',
      customerPhone: client.phone || '',
      customerEmail: client.email || '',
      customerAddress: client.address || '',
    }))
    setClientMode('manual')
  }

  const modelSuggestions = DEVICE_SUGGESTIONS[form.deviceBrand] || []
  const hasClients = clients.length > 0

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* ── Cliente ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <User size={15} className="text-indigo-500" />
            <span className="font-semibold text-slate-900 dark:text-white text-sm">Datos del Cliente</span>
          </div>
          {hasClients && (
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setClientMode('existing')}
                className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                  clientMode === 'existing'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <UserCheck size={12} />
                Cliente registrado
              </button>
              <button
                type="button"
                onClick={() => setClientMode('manual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                  clientMode === 'manual'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <UserPlus size={12} />
                Nuevo
              </button>
            </div>
          )}
        </div>

        <div className="p-5">
          {clientMode === 'existing' && hasClients && (
            <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800/40">
              <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium mb-2">
                Seleccioná un cliente para autocompletar:
              </p>
              <ClientSearch onSelect={fillFromClient} />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                {clients.length} cliente{clients.length !== 1 ? 's' : ''} registrado{clients.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre completo" required>
              <input className={inputClass} value={form.customerName} onChange={(e) => set('customerName', e.target.value)} placeholder="Juan Pérez" required />
            </Field>
            <Field label="DNI">
              <input className={inputClass} value={form.customerDni} onChange={(e) => set('customerDni', e.target.value)} placeholder="12345678" />
            </Field>
            <Field label="Teléfono (WhatsApp)">
              <input className={inputClass} type="tel" value={form.customerPhone} onChange={(e) => set('customerPhone', e.target.value)} placeholder="+54 11 1234-5678" />
            </Field>
            <Field label="Email">
              <input className={inputClass} type="email" value={form.customerEmail} onChange={(e) => set('customerEmail', e.target.value)} placeholder="cliente@email.com" />
            </Field>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Dirección (opcional)</label>
              <input className={inputClass} value={form.customerAddress} onChange={(e) => set('customerAddress', e.target.value)} placeholder="Calle, Ciudad, CP" />
            </div>
          </div>
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
              suggestions={BRAND_LIST}
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
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Email asociado al dispositivo</label>
            <input className={inputClass} type="email" value={form.deviceEmail} onChange={(e) => set('deviceEmail', e.target.value)} placeholder="icloud@email.com" />
          </div>

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
          <Field label="Contraseña / PIN / Patrón">
            <input className={inputClass} value={form.devicePassword} onChange={(e) => set('devicePassword', e.target.value)} placeholder="Código de desbloqueo" />
          </Field>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Notas de bloqueo</label>
            <textarea className={`${inputClass} resize-none`} rows={2} value={form.lockNotes} onChange={(e) => set('lockNotes', e.target.value)} placeholder="Cuentas bloqueadas, Find My, iCloud, etc." />
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
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Observaciones del técnico</label>
            <textarea className={`${inputClass} resize-none`} rows={3} value={form.technicianNotes} onChange={(e) => set('technicianNotes', e.target.value)} placeholder="Notas internas del técnico..." />
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
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <TriState label="Enciende" value={form.powersOn} onChange={(v) => set('powersOn', v)} />
          <TriState label="Carga" value={form.charges} onChange={(v) => set('charges', v)} />
          <TriState label="Pantalla funciona" value={form.screenWorks} onChange={(v) => set('screenWorks', v)} />
          <TriState label="Touch funciona" value={form.touchWorks} onChange={(v) => set('touchWorks', v)} />
          <TriState label="Audio funciona" value={form.audioWorks} onChange={(v) => set('audioWorks', v)} />
          <TriState label="Botones funcionan" value={form.buttonsWork} onChange={(v) => set('buttonsWork', v)} />
        </div>
      </Section>

      {/* ── Presupuesto ── */}
      <Section title="Presupuesto y Precios (ARS)" icon={DollarSign} defaultOpen={false}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Precio estimado">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input className={`${inputClass} pl-7`} type="number" step="1" min="0" value={form.estimatedPrice} onChange={(e) => set('estimatedPrice', e.target.value)} placeholder="0" />
            </div>
          </Field>
          <Field label="Precio final">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input className={`${inputClass} pl-7`} type="number" step="1" min="0" value={form.finalPrice} onChange={(e) => set('finalPrice', e.target.value)} placeholder="0" />
            </div>
          </Field>
          <Field label="Costo de reparación">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input className={`${inputClass} pl-7`} type="number" step="1" min="0" value={form.repairCost} onChange={(e) => set('repairCost', e.target.value)} placeholder="0" />
            </div>
          </Field>
          <Field label="Estado del presupuesto">
            <select className={selectClass} value={form.budgetStatus} onChange={(e) => set('budgetStatus', e.target.value)}>
              <option value="pending">Pendiente</option>
              <option value="approved">Aprobado</option>
              <option value="rejected">Rechazado</option>
            </select>
          </Field>
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
            />
          </div>
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
          disabled={isLoading}
          className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Guardando...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
