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
  customerName: '',
  customerDni: '',
  customerPhone: '',
  customerEmail: '',
  customerAddress: '',
  deviceType: 'phone',
  deviceBrand: '',
  deviceModel: '',
  deviceSerial: '',
  deviceEmail: '',
  accessories: [],
  devicePassword: '',
  lockNotes: '',
  reportedIssue: '',
  technicianNotes: '',
  waterDamage: false,
  physicalDamage: false,
  previouslyOpened: false,
  powersOn: null,
  charges: null,
  screenWorks: null,
  touchWorks: null,
  audioWorks: null,
  buttonsWork: null,
  estimatedPrice: '',
  finalPrice: '',
  repairCost: '',
  budgetStatus: 'pending',
  workDone: '',
  status: 'pending',
}

async function syncOrderToSupabase(order) {
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

async function deleteOrderFromSupabase(id) {
  if (!isSupabaseConfigured) return
  try {
    await supabase.from('orders').delete().eq('id', id)
  } catch (e) {
    console.warn('[Supabase] delete failed:', e)
  }
}

async function syncClientToSupabase(client) {
  if (!isSupabaseConfigured) return
  try {
    await supabase.from('clients').upsert({
      id: client.id,
      name: client.name,
      phone: client.phone,
      email: client.email,
      dni: client.dni,
      address: client.address,
      data: client,
      updated_at: new Date().toISOString(),
    })
  } catch (e) {
    console.warn('[Supabase] client sync failed:', e)
  }
}

export const useStore = create(
  persist(
    (set, get) => ({
      orders: [],
      clients: [],
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

      // ── Clients ──────────────────────────────────────────────────
      upsertClient: (data) => {
        const { clients } = get()
        // Match by DNI or phone to avoid duplicates
        const existing = clients.find(
          (c) =>
            (data.dni && c.dni && c.dni === data.dni) ||
            (data.phone && c.phone && c.phone === data.phone)
        )
        if (existing) {
          const updated = { ...existing, ...data, updatedAt: new Date().toISOString() }
          set((s) => ({ clients: s.clients.map((c) => (c.id === existing.id ? updated : c)) }))
          syncClientToSupabase(updated)
          return updated
        }
        const client = {
          ...data,
          id: `CLT-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((s) => ({ clients: [client, ...s.clients] }))
        syncClientToSupabase(client)
        return client
      },

      deleteClient: (id) => {
        set((s) => ({ clients: s.clients.filter((c) => c.id !== id) }))
        if (isSupabaseConfigured) {
          supabase.from('clients').delete().eq('id', id).then(() => {})
        }
      },

      searchClients: (q) => {
        if (!q || q.length < 2) return []
        const lower = q.toLowerCase()
        return get().clients.filter(
          (c) =>
            c.name?.toLowerCase().includes(lower) ||
            c.phone?.includes(q) ||
            c.dni?.includes(q) ||
            c.email?.toLowerCase().includes(lower)
        ).slice(0, 6)
      },

      // ── Orders ───────────────────────────────────────────────────
      createOrder: (data) => {
        // Auto-register or update client from order data
        if (data.customerName) {
          get().upsertClient({
            name: data.customerName,
            phone: data.customerPhone || '',
            email: data.customerEmail || '',
            dni: data.customerDni || '',
            address: data.customerAddress || '',
          })
        }

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
              note: 'Orden creada',
            },
          ],
        }
        set((s) => ({ orders: [order, ...s.orders] }))
        syncOrderToSupabase(order)
        return order
      },

      updateOrder: (id, data) => {
        // Keep client data in sync if customer info changed
        if (data.customerName) {
          get().upsertClient({
            name: data.customerName,
            phone: data.customerPhone || '',
            email: data.customerEmail || '',
            dni: data.customerDni || '',
            address: data.customerAddress || '',
          })
        }

        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== id) return o
            const updated = { ...o, ...data }
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
            syncOrderToSupabase(updated)
            return updated
          }),
        }))
      },

      deleteOrder: (id) => {
        set((s) => ({ orders: s.orders.filter((o) => o.id !== id) }))
        deleteOrderFromSupabase(id)
      },

      getOrder: (id) => get().orders.find((o) => o.id === id),
      getOrderByNumber: (num) => get().orders.find((o) => o.orderNumber === num),
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
