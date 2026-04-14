import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const generateOrderNumber = () => {
  const prefix = 'ORD'
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  return `${prefix}-${timestamp}${random}`
}

const initialOrder = {
  // Customer
  customerName: '',
  customerDni: '',
  customerPhone: '',
  customerEmail: '',
  customerAddress: '',
  // Device
  deviceType: 'phone',
  deviceBrand: '',
  deviceModel: '',
  deviceSerial: '',
  deviceEmail: '',
  accessories: [],
  // Security
  devicePassword: '',
  lockNotes: '',
  // Diagnosis
  reportedIssue: '',
  technicianNotes: '',
  waterDamage: false,
  physicalDamage: false,
  previouslyOpened: false,
  // Checklist
  powersOn: null,
  charges: null,
  screenWorks: null,
  touchWorks: null,
  audioWorks: null,
  buttonsWork: null,
  // Budget
  estimatedPrice: '',
  finalPrice: '',
  repairCost: '',
  budgetStatus: 'pending',
  // Work done
  workDone: '',
  // Status
  status: 'pending',
}

// Sync a single order to Supabase (upsert)
async function syncToSupabase(order) {
  if (!isSupabaseConfigured) return
  try {
    await supabase.from('orders').upsert({
      id: order.id,
      order_number: order.orderNumber,
      data: order,
      updated_at: new Date().toISOString(),
    })
  } catch (e) {
    console.warn('[Supabase] sync failed:', e)
  }
}

// Delete an order from Supabase
async function deleteFromSupabase(id) {
  if (!isSupabaseConfigured) return
  try {
    await supabase.from('orders').delete().eq('id', id)
  } catch (e) {
    console.warn('[Supabase] delete failed:', e)
  }
}

export const useStore = create(
  persist(
    (set, get) => ({
      orders: [],
      darkMode: false,
      auth: { isLoggedIn: false },
      _hydrated: false,
      setHydrated: () => set({ _hydrated: true }),

      // Auth
      login: (username, password) => {
        if (username === 'admin' && password === 'admin123') {
          set({ auth: { isLoggedIn: true, username } })
          return true
        }
        return false
      },
      logout: () => set({ auth: { isLoggedIn: false } }),

      // Dark mode
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),

      // Orders
      createOrder: (data) => {
        const order = {
          ...initialOrder,
          ...data,
          id: Date.now().toString(),
          orderNumber: generateOrderNumber(),
          entryDate: new Date().toISOString(),
          deliveryDate: null,
          statusHistory: [
            {
              status: data.status || 'pending',
              timestamp: new Date().toISOString(),
              note: 'Order created',
            },
          ],
        }
        set((s) => ({ orders: [order, ...s.orders] }))
        syncToSupabase(order)
        return order
      },

      updateOrder: (id, data) => {
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== id) return o
            const updated = { ...o, ...data }
            // Track status changes
            if (data.status && data.status !== o.status) {
              updated.statusHistory = [
                ...(o.statusHistory || []),
                {
                  status: data.status,
                  timestamp: new Date().toISOString(),
                  note: data.statusNote || '',
                },
              ]
              if (data.status === 'delivered') {
                updated.deliveryDate = new Date().toISOString()
              }
            }
            syncToSupabase(updated)
            return updated
          }),
        }))
      },

      deleteOrder: (id) => {
        set((s) => ({ orders: s.orders.filter((o) => o.id !== id) }))
        deleteFromSupabase(id)
      },

      getOrder: (id) => {
        return get().orders.find((o) => o.id === id)
      },

      getOrderByNumber: (num) => {
        return get().orders.find((o) => o.orderNumber === num)
      },
    }),
    {
      name: 'repairpro-store',
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrated()
      },
    }
  )
)

export { initialOrder }
