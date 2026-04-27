/**
 * pages/NewOrder.jsx — Crear una nueva orden de servicio.
 *
 * Ruta: /orders/new
 * Renderiza el componente OrderForm vacío. Al enviar, llama a
 * store.createOrder() y redirige al detalle de la orden recién creada.
 * Si el usuario viene de Clients (state.prefill), precarga los datos del cliente.
 */
import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useStore } from '../store/useStore'
import OrderForm from '../components/OrderForm'

export default function NewOrder() {
  const createOrder = useStore((s) => s.createOrder)
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = location.state?.prefill || {}

  const handleSubmit = (data) => {
    const order = createOrder(data)
    navigate(`/orders/${order.id}`, { replace: true })
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">New Service Order</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Fill in the customer and device details</p>
        </div>
      </div>
      <OrderForm initialData={prefill} onSubmit={handleSubmit} submitLabel="Crear Orden" />
    </div>
  )
}
