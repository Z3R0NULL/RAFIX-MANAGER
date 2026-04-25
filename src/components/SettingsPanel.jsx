/**
 * SettingsPanel.jsx — Panel deslizante de configuración del negocio.
 *
 * Secciones:
 *  1. Negocio — nombre y logo.
 *  2. Regional — moneda e idioma.
 *  3. Garantía — días y cláusulas (editable línea por línea).
 */
import React, { useState, useRef, useEffect } from 'react'
import {
  X,
  Building2,
  Globe,
  ShieldCheck,
  Upload,
  Trash2,
  Plus,
  GripVertical,
  Check,
} from 'lucide-react'
import { useStore, CURRENCY_OPTIONS, LANGUAGE_OPTIONS, DEFAULT_SETTINGS } from '../store/useStore'

export default function SettingsPanel({ open, onClose }) {
  const { settings, updateSettings } = useStore()
  const [local, setLocal] = useState(settings)
  const [saved, setSaved] = useState(false)
  const logoRef = useRef()

  // Sync only when panel opens (not on every settings change while open)
  useEffect(() => {
    if (open) {
      // Merge with defaults to handle missing fields from old localStorage data
      setLocal({ ...DEFAULT_SETTINGS, ...settings })
      setSaved(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const patch = (key, value) => setLocal((prev) => ({ ...prev, [key]: value }))

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => patch('businessLogo', ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleWarrantyLineChange = (idx, val) => {
    const updated = [...local.warrantyPolicy]
    updated[idx] = val
    patch('warrantyPolicy', updated)
  }

  const addWarrantyLine = () =>
    patch('warrantyPolicy', [...local.warrantyPolicy, ''])

  const removeWarrantyLine = (idx) =>
    patch('warrantyPolicy', local.warrantyPolicy.filter((_, i) => i !== idx))

  const handleSave = () => {
    updateSettings(local)
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onClose()
    }, 1200)
  }

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-700/60 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60 flex-shrink-0">
          <div>
            <h2 className="text-white font-semibold text-base">Configuración</h2>
            <p className="text-slate-400 text-xs mt-0.5">Personalización del negocio</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">

          {/* ── Negocio ── */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={14} className="text-indigo-400" />
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Negocio</h3>
            </div>

            {/* Business name */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Nombre del negocio
              </label>
              <input
                type="text"
                value={local.businessName}
                onChange={(e) => patch('businessName', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Ej. TecnoFix"
              />
            </div>

            {/* Logo */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Logo del negocio</label>
              <div className="flex items-center gap-3">
                {local.businessLogo ? (
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-700 bg-slate-800 flex-shrink-0">
                    <img src={local.businessLogo} alt="logo" className="w-full h-full object-contain" />
                    <button
                      onClick={() => patch('businessLogo', null)}
                      className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 rounded-full text-white"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-700 bg-slate-800/50 flex items-center justify-center flex-shrink-0 text-slate-600">
                    <Building2 size={22} />
                  </div>
                )}
                <div className="flex-1">
                  <button
                    onClick={() => logoRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700/70 text-slate-300 text-xs font-medium transition-colors w-full justify-center"
                  >
                    <Upload size={13} />
                    {local.businessLogo ? 'Cambiar logo' : 'Subir logo'}
                  </button>
                  <p className="text-slate-600 text-[10px] mt-1 text-center">PNG, JPG — recomendado cuadrado</p>
                  <input
                    ref={logoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="border-t border-slate-800" />

          {/* ── Regional ── */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Globe size={14} className="text-indigo-400" />
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Regional</h3>
            </div>

            {/* Currency */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Moneda</label>
              <select
                value={local.currency}
                onChange={(e) => {
                  const opt = CURRENCY_OPTIONS.find((o) => o.value === e.target.value)
                  patch('currency', opt.value)
                  patch('currencyLocale', opt.locale)
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {CURRENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-slate-600 text-[10px] mt-1">
                Preview: {new Intl.NumberFormat(local.currencyLocale, { style: 'currency', currency: local.currency, minimumFractionDigits: 0 }).format(15000)}
              </p>
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Idioma de la interfaz</label>
              <div className="flex gap-2">
                {LANGUAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => patch('language', opt.value)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      local.language === opt.value
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700/70'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {local.language !== 'es' && (
                <p className="text-amber-500/80 text-[10px] mt-1.5">
                  ⚠ Cambio de idioma disponible en próximas versiones. La interfaz permanecerá en Español.
                </p>
              )}
            </div>
          </section>

          <div className="border-t border-slate-800" />

          {/* ── Garantía ── */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={14} className="text-indigo-400" />
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Política de Garantía</h3>
            </div>

            {/* Warranty days */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Días de garantía por defecto
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={365}
                  value={local.warrantyDays}
                  onChange={(e) => patch('warrantyDays', parseInt(e.target.value, 10) || 0)}
                  className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <span className="text-slate-400 text-xs">días</span>
              </div>
            </div>

            {/* Policy clauses */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Cláusulas (aparecen en el PDF)
              </label>
              <div className="space-y-2">
                {local.warrantyPolicy.map((clause, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <GripVertical size={14} className="text-slate-700 mt-2.5 flex-shrink-0" />
                    <textarea
                      rows={2}
                      value={clause}
                      onChange={(e) => handleWarrantyLineChange(idx, e.target.value)}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                      placeholder={`Cláusula ${idx + 1}`}
                    />
                    <button
                      onClick={() => removeWarrantyLine(idx)}
                      className="p-1.5 mt-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-900/20 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addWarrantyLine}
                className="mt-2.5 flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <Plus size={13} />
                Agregar cláusula
              </button>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-700/60 flex-shrink-0 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {saved ? (
              <>
                <Check size={15} />
                Guardado
              </>
            ) : (
              'Guardar cambios'
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
