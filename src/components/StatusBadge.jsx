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
