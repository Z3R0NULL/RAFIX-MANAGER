/**
 * pages/PublicStorePage.jsx — Tienda pública por usuario.
 *
 * Ruta pública: /store/:username
 * Carga directamente desde Turso el inventario y settings del usuario indicado.
 * No requiere autenticación. Ideal para compartir a clientes.
 */
import React, { useState, useMemo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Search, X, Package, ShoppingBag, Tag, Smartphone, Wrench,
  Boxes, ZoomIn, ChevronLeft, ChevronRight, AlertCircle,
  MapPin, Globe, MessageCircle, ChevronRight as ChevronRightIcon,
} from 'lucide-react'
import { turso, isTursoConfigured } from '../lib/turso'
import { formatCurrency } from '../utils/constants'

// ── Social icons (SVG inline) ─────────────────────────────────────────────────
const SocialIcons = {
  instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.74a4.85 4.85 0 01-1.01-.05z"/>
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
}

const SOCIAL_CONFIG = {
  whatsapp:  { label: 'WhatsApp',  color: 'hover:bg-green-600/20  hover:border-green-600/50  hover:text-green-400',  buildUrl: (v) => `https://wa.me/${v.replace(/\D/g, '')}` },
  instagram: { label: 'Instagram', color: 'hover:bg-pink-600/20   hover:border-pink-600/50   hover:text-pink-400',   buildUrl: (v) => `https://instagram.com/${v.replace('@','')}` },
  facebook:  { label: 'Facebook',  color: 'hover:bg-blue-600/20   hover:border-blue-600/50   hover:text-blue-400',   buildUrl: (v) => v.startsWith('http') ? v : `https://facebook.com/${v}` },
  twitter:   { label: 'X / Twitter', color: 'hover:bg-slate-600/20 hover:border-slate-500/50  hover:text-slate-300', buildUrl: (v) => `https://x.com/${v.replace('@','')}` },
  tiktok:    { label: 'TikTok',    color: 'hover:bg-fuchsia-600/20 hover:border-fuchsia-600/50 hover:text-fuchsia-400', buildUrl: (v) => `https://tiktok.com/@${v.replace('@','')}` },
  youtube:   { label: 'YouTube',   color: 'hover:bg-red-600/20    hover:border-red-600/50    hover:text-red-400',    buildUrl: (v) => v.startsWith('http') ? v : `https://youtube.com/${v}` },
  website:   { label: 'Sitio web', color: 'hover:bg-indigo-600/20 hover:border-indigo-600/50 hover:text-indigo-400', buildUrl: (v) => v.startsWith('http') ? v : `https://${v}` },
}

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
  indigo:  { badge: 'bg-indigo-900/50 text-indigo-300 border border-indigo-700/40',   dot: 'bg-indigo-500' },
  amber:   { badge: 'bg-amber-900/50 text-amber-300 border border-amber-700/40',       dot: 'bg-amber-500' },
  emerald: { badge: 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/40', dot: 'bg-emerald-500' },
  sky:     { badge: 'bg-sky-900/50 text-sky-300 border border-sky-700/40',             dot: 'bg-sky-500' },
  violet:  { badge: 'bg-violet-900/50 text-violet-300 border border-violet-700/40',    dot: 'bg-violet-500' },
  slate:   { badge: 'bg-slate-800 text-slate-400 border border-slate-700',             dot: 'bg-slate-500' },
}

// ── Floating Contact Widget ───────────────────────────────────────────────────
const SOCIAL_ORDER = ['whatsapp','instagram','facebook','twitter','tiktok','youtube','website']

const SOCIAL_COLORS = {
  whatsapp:  { icon: 'text-green-400',   bg: 'hover:bg-green-500/15',  border: 'hover:border-green-500/40'  },
  instagram: { icon: 'text-pink-400',    bg: 'hover:bg-pink-500/15',   border: 'hover:border-pink-500/40'   },
  facebook:  { icon: 'text-blue-400',    bg: 'hover:bg-blue-500/15',   border: 'hover:border-blue-500/40'   },
  twitter:   { icon: 'text-slate-300',   bg: 'hover:bg-slate-500/15',  border: 'hover:border-slate-500/40'  },
  tiktok:    { icon: 'text-fuchsia-400', bg: 'hover:bg-fuchsia-500/15',border: 'hover:border-fuchsia-500/40'},
  youtube:   { icon: 'text-red-400',     bg: 'hover:bg-red-500/15',    border: 'hover:border-red-500/40'    },
  website:   { icon: 'text-indigo-400',  bg: 'hover:bg-indigo-500/15', border: 'hover:border-indigo-500/40' },
}

function FloatingContact({ settings }) {
  const [open, setOpen] = useState(false)

  const links  = settings?.socialLinks || {}
  const address = settings?.businessAddress?.trim()
  const activeLinks = SOCIAL_ORDER.filter((k) => links[k]?.trim())

  if (!activeLinks.length && !address) return null

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center flex-row-reverse">

      {/* ── Panel desplegable ── */}
      <div
        className={`flex flex-col gap-1 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-l-2xl shadow-2xl shadow-black/60 overflow-hidden transition-all duration-300 ease-in-out ${
          open ? 'w-44 opacity-100' : 'w-0 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header del panel */}
        <div className="px-4 pt-4 pb-2 border-b border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Contacto</p>
        </div>

        <div className="px-2 py-2 flex flex-col gap-0.5">
          {activeLinks.map((key) => {
            const cfg    = SOCIAL_CONFIG[key]
            const colors = SOCIAL_COLORS[key]
            const Icon   = SocialIcons[key]
            return (
              <a
                key={key}
                href={cfg.buildUrl(links[key])}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border border-transparent transition-all text-sm font-medium text-slate-400 ${colors.icon} ${colors.bg} ${colors.border}`}
              >
                <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                  {key === 'website' ? <Globe size={15} /> : Icon}
                </span>
                <span className="text-xs whitespace-nowrap">{cfg.label}</span>
              </a>
            )
          })}

          {address && (
            <div className="flex items-start gap-2.5 px-3 py-2 rounded-xl text-slate-500 text-xs">
              <MapPin size={13} className="flex-shrink-0 mt-0.5" />
              <span className="leading-tight line-clamp-2">{address}</span>
            </div>
          )}
        </div>

        <div className="pb-3" />
      </div>

      {/* ── Botón toggle pegado a la derecha ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex flex-col items-center justify-center w-8 py-4 rounded-l-xl shadow-xl transition-all duration-300 gap-2 group ${
          open
            ? 'bg-indigo-600 border border-indigo-500 shadow-indigo-900/50'
            : 'bg-slate-800/90 border border-slate-700 hover:bg-slate-700 backdrop-blur-sm shadow-black/40'
        }`}
        title={open ? 'Cerrar contacto' : 'Ver contacto'}
      >
        <span className="transition-all duration-200">
          {open
            ? <X size={13} className="text-white" />
            : <MessageCircle size={13} className="text-indigo-400 group-hover:text-white" />
          }
        </span>
        {!open && (
          <span
            className="text-[9px] font-bold tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', letterSpacing: '0.15em' }}
          >
            CONTACTO
          </span>
        )}
      </button>
    </div>
  )
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex)
  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length)
  const next = () => setIdx((i) => (i + 1) % images.length)

  useEffect(() => {
    const fn = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div className="relative max-w-3xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <img src={images[idx]} alt="" className="w-full max-h-[80vh] object-contain rounded-xl" />
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black"
        >
          <X size={16} />
        </button>
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90"
            >
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${i === idx ? 'bg-white' : 'bg-white/30'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PublicStorePage() {
  const { username } = useParams()

  const [inventory, setInventory] = useState([])
  const [settings, setSettings]   = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  const [search, setSearch]       = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [lightbox, setLightbox]   = useState(null)

  // Load store data from Turso for this username
  useEffect(() => {
    if (!username) { setError('Usuario no especificado.'); setLoading(false); return }
    if (!isTursoConfigured) { setError('Base de datos no configurada.'); setLoading(false); return }

    async function loadStore() {
      try {
        const [invRes, settingsRes] = await Promise.all([
          turso.execute({
            sql: 'SELECT data FROM inventory WHERE created_by = ? ORDER BY updated_at DESC',
            args: [username],
          }),
          turso.execute({
            sql: 'SELECT data FROM user_settings WHERE username = ? LIMIT 1',
            args: [username],
          }),
        ])

        const items = invRes.rows.map((r) => JSON.parse(r.data)).filter(Boolean)
        setInventory(items)

        if (settingsRes.rows[0]) {
          setSettings(JSON.parse(settingsRes.rows[0].data))
        }
      } catch (e) {
        console.error('[PublicStore] load failed:', e)
        setError('No se pudo cargar la tienda. Intenta de nuevo más tarde.')
      } finally {
        setLoading(false)
      }
    }

    loadStore()
  }, [username])

  const businessName = settings?.businessName || username || 'Tienda'
  const businessLogo = settings?.businessLogo || null
  const currency     = settings?.currency       || 'ARS'
  const locale       = settings?.currencyLocale || 'es-AR'
  const fmt = (val) => formatCurrency(val, currency, locale)

  useEffect(() => {
    document.title = `Tienda — ${businessName}`
    return () => { document.title = 'RaFix Manager' }
  }, [businessName])

  const storeItems = useMemo(
    () => inventory.filter((i) => i.showInStore),
    [inventory]
  )

  const filtered = useMemo(() => {
    let list = [...storeItems]
    if (filterCat !== 'all') list = list.filter((i) => i.category === filterCat)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((i) =>
        i.name?.toLowerCase().includes(q) ||
        i.brand?.toLowerCase().includes(q) ||
        i.model?.toLowerCase().includes(q) ||
        i.notes?.toLowerCase().includes(q)
      )
    }
    return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }, [storeItems, search, filterCat])

  const activeCats = useMemo(
    () => CATEGORIES.filter((c) => storeItems.some((i) => i.category === c.value)),
    [storeItems]
  )

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="w-8 h-8 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#6366f1" strokeWidth="4" />
            <path className="opacity-75" fill="#6366f1" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-slate-500 text-sm">Cargando tienda...</p>
        </div>
      </div>
    )
  }

  // ── Error ──
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-900/30 border border-red-800/50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={26} className="text-red-400" />
          </div>
          <h2 className="text-white font-semibold text-lg mb-1">Tienda no disponible</h2>
          <p className="text-slate-500 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── Header ── */}
      <header className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {businessLogo ? (
              <img src={businessLogo} alt="logo" className="w-9 h-9 rounded-xl object-contain bg-slate-800 border border-slate-700" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-900/50">
                <ShoppingBag size={18} className="text-white" />
              </div>
            )}
            <div>
              <h1 className="font-bold text-white text-lg leading-tight">{businessName}</h1>
              <p className="text-xs text-slate-500">Tienda de productos</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-700 bg-slate-800 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Category filters */}
        {activeCats.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterCat('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterCat === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              Todos ({storeItems.length})
            </button>
            {activeCats.map((c) => {
              const count = storeItems.filter((i) => i.category === c.value).length
              return (
                <button
                  key={c.value}
                  onClick={() => setFilterCat(c.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterCat === c.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  {c.label} ({count})
                </button>
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {storeItems.length === 0 && (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={28} className="text-slate-600" />
            </div>
            <h2 className="text-slate-300 font-semibold text-lg">Tienda en preparación</h2>
            <p className="text-slate-600 text-sm mt-1">Pronto habrá productos disponibles.</p>
          </div>
        )}

        {/* No results */}
        {storeItems.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16">
            <Search size={28} className="mx-auto text-slate-700 mb-3" />
            <p className="text-slate-400 font-medium">
              Sin resultados para <strong className="text-slate-300">"{search}"</strong>
            </p>
            <button
              onClick={() => { setSearch(''); setFilterCat('all') }}
              className="mt-3 text-sm text-indigo-400 hover:text-indigo-300 hover:underline"
            >
              Limpiar búsqueda
            </button>
          </div>
        )}

        {/* Products grid */}
        {filtered.length > 0 && (
          <>
            <p className="text-xs text-slate-600">
              {filtered.length} producto{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((item) => {
                const cat    = CAT_MAP[item.category] || CAT_MAP['otro']
                const colors = COLOR_CLASSES[cat.color]
                const isOut  = item.stock === 0
                const isLow  = !isOut && item.minStock > 0 && item.stock <= item.minStock
                return (
                  <div
                    key={item.id}
                    className={`bg-slate-900 rounded-2xl border overflow-hidden flex flex-col transition-all hover:shadow-xl hover:shadow-black/40 hover:-translate-y-0.5 ${
                      isOut ? 'border-slate-800 opacity-60' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Image or accent bar */}
                    {item.images?.length > 0 ? (
                      <div
                        className="relative aspect-video w-full bg-slate-800 group cursor-zoom-in"
                        onClick={() => setLightbox({ images: item.images, index: 0 })}
                      >
                        <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <ZoomIn size={22} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                        </div>
                        {item.images.length > 1 && (
                          <div className="absolute bottom-2 right-2 flex gap-1">
                            {item.images.slice(0, 4).map((src, i) => (
                              <button
                                key={i}
                                onClick={(e) => { e.stopPropagation(); setLightbox({ images: item.images, index: i }) }}
                                className={`w-6 h-6 rounded overflow-hidden border-2 transition-all ${i === 0 ? 'border-white/80' : 'border-white/30 hover:border-white/80'}`}
                              >
                                <img src={src} alt="" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`h-0.5 w-full ${colors.dot}`} />
                    )}

                    <div className="p-4 flex flex-col gap-3 flex-1">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm leading-snug">{item.name}</p>
                          {(item.brand || item.model) && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {[item.brand, item.model].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${colors.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                          {cat.label}
                        </span>
                      </div>

                      {/* Notes */}
                      {item.notes && (
                        <p className="text-xs text-slate-500 line-clamp-2">{item.notes}</p>
                      )}

                      {/* Footer */}
                      <div className="flex items-end justify-between mt-auto pt-3 border-t border-slate-800">
                        <div>
                          {item.price != null ? (
                            <p className="text-lg font-bold text-emerald-400">{fmt(item.price)}</p>
                          ) : (
                            <p className="text-sm text-slate-600 italic">Precio a consultar</p>
                          )}
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isOut
                            ? 'bg-red-900/50 text-red-400 border border-red-800/50'
                            : isLow
                              ? 'bg-amber-900/50 text-amber-400 border border-amber-800/50'
                              : 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/40'
                        }`}>
                          {isOut ? 'Sin stock' : `Stock: ${item.stock}`}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </main>

      {/* ── Floating contact widget ── */}
      <FloatingContact settings={settings} />

      {/* Footer */}
      <footer className="mt-8 pb-8 text-center text-xs text-slate-700 pt-4">
        Tienda de {businessName} · Powered by RaFix Manager
      </footer>

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          images={lightbox.images}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}
