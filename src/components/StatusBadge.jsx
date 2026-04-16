/**
 * components/StatusBadge.jsx — Badges visuales de estado.
 *
 * Exporta dos componentes de solo presentación (sin lógica):
 *
 *  - StatusBadge({ status }): pill con punto de color y label del estado
 *    de una orden de servicio. Usa STATUS_CONFIG de constants.js.
 *    Fallback: muestra 'pending' si el status no existe en la config.
 *
 *  - BudgetBadge({ status }): pill simple (sin punto) para el estado del
 *    presupuesto (pending / approved / rejected). Usa BUDGET_STATUS_CONFIG.
 */
import React from 'react'
import { STATUS_CONFIG, BUDGET_STATUS_CONFIG } from '../utils/constants'

export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}

export function BudgetBadge({ status }) {
  const config = BUDGET_STATUS_CONFIG[status] || BUDGET_STATUS_CONFIG.pending
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}
