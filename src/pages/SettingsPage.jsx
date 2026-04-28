import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Globe,
  ShieldCheck,
  Upload,
  Trash2,
  Plus,
  GripVertical,
  Check,
  Settings,
  AtSign,
  Music2,
  MessageCircle,
  Link,
  Banknote,
  ArrowRightLeft,
  CreditCard,
  Percent,
  X,
} from 'lucide-react'
import { useStore, CURRENCY_OPTIONS, LANGUAGE_OPTIONS, DEFAULT_SETTINGS } from '../store/useStore'

//Youtube

export default function SettingsPage() {
  const navigate = useNavigate()
  const { settings, updateSettings } = useStore()
  const [local, setLocal] = useState({ ...DEFAULT_SETTINGS, ...settings })
  const [saved, setSaved] = useState(false)
  const logoRef = useRef()

  useEffect(() => {
    setLocal({ ...DEFAULT_SETTINGS, ...settings })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5 pb-10">

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
          <Settings size={16} className="text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Configuración</h1>
          <p className="text-slate-500 text-xs">Personalización del negocio</p>
        </div>
      </div>

      {/* ── Negocio ── */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-900 overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-700/50 bg-slate-800/40">
          <div className="w-6 h-6 rounded-md bg-blue-500/15 flex items-center justify-center">
            <Building2 size={13} className="text-blue-400" />
          </div>
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest">Negocio</h3>
        </div>
        <div className="px-4 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Nombre del negocio</label>
            <input
              type="text"
              value={local.businessName}
              onChange={(e) => patch('businessName', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
              placeholder="Ej. TecnoFix"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Logo del negocio</label>
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
                <p className="text-slate-600 text-[10px] mt-1.5 text-center">PNG, JPG — recomendado cuadrado</p>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Regional ── */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-900 overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-700/50 bg-slate-800/40">
          <div className="w-6 h-6 rounded-md bg-green-500/15 flex items-center justify-center">
            <Globe size={13} className="text-green-400" />
          </div>
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest">Regional</h3>
        </div>
        <div className="px-4 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Moneda</label>
            <select
              value={local.currency}
              onChange={(e) => {
                const opt = CURRENCY_OPTIONS.find((o) => o.value === e.target.value)
                patch('currency', opt.value)
                patch('currencyLocale', opt.locale)
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
            >
              {CURRENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-slate-600 text-[10px] mt-1.5 pl-0.5">
              Vista previa: {new Intl.NumberFormat(local.currencyLocale, { style: 'currency', currency: local.currency, minimumFractionDigits: 0 }).format(15000)}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Idioma de la interfaz</label>
            <div className="flex gap-2">
              {LANGUAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => patch('language', opt.value)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    local.language === opt.value
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700/70 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {local.language !== 'es' && (
              <p className="text-amber-500/80 text-[10px] mt-1.5 pl-0.5">
                ⚠ Cambio de idioma disponible en próximas versiones.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Garantía ── */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-900 overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-700/50 bg-slate-800/40">
          <div className="w-6 h-6 rounded-md bg-indigo-500/15 flex items-center justify-center">
            <ShieldCheck size={13} className="text-indigo-400" />
          </div>
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest">Política de Garantía</h3>
        </div>
        <div className="px-4 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Días de garantía por defecto</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={365}
                value={local.warrantyDays}
                onChange={(e) => patch('warrantyDays', parseInt(e.target.value, 10) || 0)}
                className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
              />
              <span className="text-slate-500 text-xs">días</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Cláusulas <span className="text-slate-600 font-normal">(aparecen en el PDF)</span>
            </label>
            <div className="space-y-2">
              {local.warrantyPolicy.map((clause, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <GripVertical size={14} className="text-slate-700 mt-2.5 flex-shrink-0" />
                  <textarea
                    rows={2}
                    value={clause}
                    onChange={(e) => handleWarrantyLineChange(idx, e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors resize-none"
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
              className="mt-3 flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <Plus size={13} />
              Agregar cláusula
            </button>
          </div>
        </div>
      </div>

      {/* ── Redes Sociales ── */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-900 overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-700/50 bg-slate-800/40">
          <div className="w-6 h-6 rounded-md bg-pink-500/15 flex items-center justify-center">
            <AtSign size={13} className="text-pink-400" />
          </div>
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest">Redes Sociales</h3>
        </div>
        <div className="px-4 py-4 space-y-3">
          {[
            { key: 'instagram', label: 'Instagram',   Icon: AtSign,        placeholder: 'https://instagram.com/tunegocio', color: 'text-pink-400' },
            { key: 'facebook',  label: 'Facebook',    Icon: AtSign,        placeholder: 'https://facebook.com/tunegocio',  color: 'text-blue-400' },
            { key: 'twitter',   label: 'Twitter / X', Icon: AtSign,        placeholder: 'https://x.com/tunegocio',         color: 'text-sky-400' },
            { key: 'tiktok',    label: 'TikTok',      Icon: Music2,        placeholder: 'https://tiktok.com/@tunegocio',   color: 'text-slate-300' },
            { key: 'youtube',   label: 'YouTube',     Icon: Youtube,       placeholder: 'https://youtube.com/@tunegocio',  color: 'text-red-400' },
            { key: 'whatsapp',  label: 'WhatsApp',    Icon: MessageCircle, placeholder: '5491112345678',                   color: 'text-green-400' },
            { key: 'website',   label: 'Sitio web',   Icon: Link,          placeholder: 'https://tunegocio.com',           color: 'text-indigo-400' },
          ].map(({ key, label, Icon, placeholder, color }) => (
            <div key={key}>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
                <Icon size={11} className={color} />
                {label}
              </label>
              <input
                type="text"
                value={local.socialLinks?.[key] ?? ''}
                onChange={(e) => patch('socialLinks', { ...local.socialLinks, [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Ajustes de Pago ── */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-900 overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-700/50 bg-slate-800/40">
          <div className="w-6 h-6 rounded-md bg-emerald-500/15 flex items-center justify-center">
            <Percent size={13} className="text-emerald-400" />
          </div>
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest">Ajustes de Pago</h3>
        </div>
        <div className="px-4 py-4 space-y-4">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Configurá un descuento o recargo automático según el método de pago. Se aplica al total de ventas y presupuestos.
          </p>
          {[
            { key: 'cash',     label: 'Efectivo',      Icon: Banknote,       iconColor: 'text-emerald-400' },
            { key: 'transfer', label: 'Transferencia', Icon: ArrowRightLeft, iconColor: 'text-blue-400' },
            { key: 'card',     label: 'Tarjeta',       Icon: CreditCard,     iconColor: 'text-violet-400' },
          ].map(({ key, label, Icon, iconColor }) => {
            const adj = local.paymentAdjustments?.[key] ?? { enabled: false, value: 0, type: 'discount' }
            const patchAdj = (changes) =>
              patch('paymentAdjustments', {
                ...local.paymentAdjustments,
                [key]: { ...adj, ...changes },
              })
            return (
              <div key={key} className="rounded-lg border border-slate-700/60 bg-slate-800/40 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={14} className={iconColor} />
                    <span className="text-sm font-medium text-slate-200">{label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => patchAdj({ enabled: !adj.enabled })}
                    className={`relative w-9 h-5 rounded-full transition-colors ${adj.enabled ? 'bg-emerald-600' : 'bg-slate-600'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${adj.enabled ? 'left-4' : 'left-0.5'}`} />
                  </button>
                </div>
                {adj.enabled && (
                  <div className="flex items-center gap-2">
                    <div className="flex rounded-lg overflow-hidden border border-slate-700 flex-shrink-0">
                      {[
                        { value: 'discount',  label: 'Desc.' },
                        { value: 'surcharge', label: 'Rec.' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => patchAdj({ type: opt.value })}
                          className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                            adj.type === opt.value
                              ? opt.value === 'discount' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={adj.value}
                        onChange={(e) => patchAdj({ value: parseFloat(e.target.value) || 0 })}
                        className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
                      />
                      <span className="text-slate-400 text-sm">%</span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-md ${adj.type === 'discount' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-amber-900/30 text-amber-400'}`}>
                      {adj.type === 'discount' ? '-' : '+'}{adj.value}%
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Guardar */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
        >
          {saved ? <><Check size={15} /> Guardado</> : 'Guardar cambios'}
        </button>
      </div>

    </div>
  )
}
