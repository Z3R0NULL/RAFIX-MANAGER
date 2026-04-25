/**
 * useCurrency — hook that returns a formatCurrency function
 * bound to the user's settings (currency + locale).
 *
 * Usage:
 *   const fmt = useCurrency()
 *   fmt(15000)  →  "$ 15.000"  (or whatever currency is configured)
 */
import { useStore } from '../store/useStore'
import { formatCurrency } from './constants'

export function useCurrency() {
  const settings = useStore((s) => s.settings)
  const currency = settings?.currency     || 'ARS'
  const locale   = settings?.currencyLocale || 'es-AR'
  return (val) => formatCurrency(val, currency, locale)
}
