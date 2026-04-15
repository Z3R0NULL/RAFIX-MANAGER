import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Smartphone, ChevronRight, Search, TrendingUp, Clock, CheckCircle2, Wrench } from 'lucide-react'
import { useStore } from '../store/useStore'
import { DEVICE_TYPES, STATUS_CONFIG, formatCurrency } from '../utils/constants'

export default function DevicesPage() {
  const orders = useStore((s) => s.orders)
  const [q, setQ] = useState('')

  // Group orders by brand+model
  const models = useMemo(() => {
    const map = {}
    for (const order of orders) {
      const brand = (order.deviceBrand || '').trim()
      const model = (order.deviceModel || '').trim()
      if (!brand && !model) continue
      const key = `${brand}__${model}`
      if (!map[key]) {
        map[key] = {
          brand,
          model,
          deviceType: order.deviceType,
          orders: [],
        }
      }
      map[key].orders.push(order)
    }
    // Sort by order count desc
    return Object.values(map).sort((a, b) => b.orders.length - a.orders.length)
  }, [orders])

  const filtered = useMemo(() => {
    if (!q.trim()) return models
    const lower = q.toLowerCase()
    return models.filter(
      (m) =>
        m.brand.toLowerCase().includes(lower) ||
        m.model.toLowerCase().includes(lower)
    )
  }, [models, q])

  // Summary stats
  const totalModels = models.length
  const totalOrders = orders.length
  const activeOrders = orders.filter((o) => !['delivered', 'irreparable'].includes(o.status)).length
  const completedOrders = orders.filter((o) => o.status === 'completed' || o.status === 'delivered').length

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Devices</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Modelos con historial de reparaciones
        </p>
      </div>

      {/* Stats row */}
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

      {/* Search */}
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

      {/* Model list */}
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
                      {deviceLabel && (
                        <p className="text-xs text-slate-400 dark:text-slate-500">{deviceLabel}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                    <div className="hidden sm:flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-orange-500">
                        <Clock size={11} />
                        {active.length} activas
                      </span>
                      <span className="flex items-center gap-1 text-xs text-green-500">
                        <CheckCircle2 size={11} />
                        {completed.length} completadas
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
