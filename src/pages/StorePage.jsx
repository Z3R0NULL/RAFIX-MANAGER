/**
 * pages/StorePage.jsx — Tienda pública de productos del taller.
 *
 * Ruta pública: /store
 * Muestra todos los productos del inventario que tienen showInStore = true.
 * Incluye barra de búsqueda por nombre, marca y modelo.
 * No requiere autenticación. Tema oscuro.
 */
import React, { useState, useMemo, useEffect } from 'react'
import { Search, X, Package, ShoppingBag, Tag, Smartphone, Wrench, Boxes, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '../store/useStore'
import { formatCurrency } from '../utils/constants'

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
  indigo:  { badge: 'bg-indigo-900/50 text-indigo-300 border border-indigo-700/40',  dot: 'bg-indigo-500' },
  amber:   { badge: 'bg-amber-900/50 text-amber-300 border border-amber-700/40',      dot: 'bg-amber-500' },
  emerald: { badge: 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/40', dot: 'bg-emerald-500' },
  sky:     { badge: 'bg-sky-900/50 text-sky-300 border border-sky-700/40',            dot: 'bg-sky-500' },
  violet:  { badge: 'bg-violet-900/50 text-violet-300 border border-violet-700/40',   dot: 'bg-violet-500' },
  slate:   { badge: 'bg-slate-800 text-slate-400 border border-slate-700',            dot: 'bg-slate-500' },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative max-w-3xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <img src={images[idx]} alt="" className="w-full max-h-[80vh] object-contain rounded-xl" />
        <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black">
          <X size={16} />
        </button>
        {images.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90">
              <ChevronLeft size={18} />
            </button>
            <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90">
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)} className={`w-2 h-2 rounded-full transition-colors ${i === idx ? 'bg-white' : 'bg-white/30'}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StorePage() {
  const inventory     = useStore((s) => s.inventory)
  const settings      = useStore((s) => s.settings)
  const loadFromTurso = useStore((s) => s.loadFromTurso)
  const _hydrated     = useStore((s) => s._hydrated)

  const businessName = settings?.businessName || 'RaFix'
  const currency     = settings?.currency       || 'ARS'
  const locale       = settings?.currencyLocale || 'es-AR'
  const fmt = (val) => formatCurrency(val, currency, locale)

  const [search, setSearch]     = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [lightbox, setLightbox] = useState(null) // { images, index }

  useEffect(() => {
    if (_hydrated) loadFromTurso().catch(() => {})
  }, [_hydrated]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.title = `Tienda — ${businessName}`
    return () => { document.title = `${businessName} — RaFix Manager` }
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

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── Header ── */}
      <header className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-900/50">
              <ShoppingBag size={18} className="text-white" />
            </div>
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
            <p className="text-slate-400 font-medium">Sin resultados para <strong className="text-slate-300">"{search}"</strong></p>
            <button onClick={() => { setSearch(''); setFilterCat('all') }} className="mt-3 text-sm text-indigo-400 hover:text-indigo-300 hover:underline">
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

      {/* Footer */}
      <footer className="mt-16 pb-8 text-center text-xs text-slate-700 border-t border-slate-900 pt-6">
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
