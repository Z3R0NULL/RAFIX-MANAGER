export const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
    dot: 'bg-slate-400',
  },
  diagnosing: {
    label: 'Diagnosing',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  waiting_approval: {
    label: 'Waiting Approval',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    dot: 'bg-yellow-500',
  },
  in_repair: {
    label: 'In Repair',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    dot: 'bg-orange-500',
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    dot: 'bg-green-500',
  },
  irreparable: {
    label: 'Irreparable',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    dot: 'bg-red-500',
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    dot: 'bg-purple-500',
  },
}

export const BUDGET_STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
}

export const DEVICE_TYPES = [
  { value: 'phone', label: 'Phone / Smartphone' },
  { value: 'laptop', label: 'Laptop / Notebook' },
  { value: 'desktop', label: 'Desktop / PC' },
  { value: 'gpu', label: 'GPU / Graphics Card' },
  { value: 'audio', label: 'Audio Equipment' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'console', label: 'Gaming Console' },
  { value: 'other', label: 'Other' },
]

export const ACCESSORIES_OPTIONS = [
  'Charger',
  'Cable',
  'Case / Cover',
  'Screen Protector',
  'Battery',
  'Stylus',
  'Earphones',
  'Memory Card',
  'SIM Card',
  'Manual / Box',
]

export const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatDateShort = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const formatCurrency = (val) => {
  if (!val && val !== 0) return '—'
  const num = parseFloat(val)
  if (isNaN(num)) return '—'
  return `$${num.toFixed(2)}`
}
