/**
 * components/PageLoader.jsx — Skeleton de carga para páginas de datos.
 * Se muestra mientras se cargan datos desde Turso.
 */
import React from 'react'
import { Loader2 } from 'lucide-react'

export function PageLoader({ rows = 5, title = 'Cargando datos...' }) {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-4 w-28 bg-slate-100 dark:bg-slate-800 rounded" />
        </div>
        <div className="h-9 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg" />
      </div>

      {/* Search bar skeleton */}
      <div className="flex gap-3">
        <div className="h-10 flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg" />
        <div className="h-10 w-24 bg-slate-100 dark:bg-slate-800 rounded-lg" />
        <div className="h-10 w-24 bg-slate-100 dark:bg-slate-800 rounded-lg" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
        {/* Table header */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex gap-4">
          {[120, 160, 100, 80, 90].map((w, i) => (
            <div key={i} className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded" style={{ width: w }} />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="px-4 py-3.5 border-b border-slate-50 dark:border-slate-800/50 last:border-0 flex items-center gap-4"
            style={{ opacity: 1 - i * 0.12 }}
          >
            <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded w-28" />
            <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded w-36" />
            <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded w-24" />
            <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-full w-20" />
            <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded w-20 ml-auto" />
          </div>
        ))}
      </div>

      {/* Floating spinner + label */}
      <div className="flex items-center justify-center gap-2 pt-2 text-slate-400 dark:text-slate-500">
        <Loader2 size={16} className="animate-spin" style={{ animationDuration: '0.8s' }} />
        <span className="text-sm">{title}</span>
      </div>
    </div>
  )
}
