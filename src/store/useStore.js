import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const SUPERADMIN = 'admin'

async function getClientIp() {
  try {
    const res = await fetch('https://api.ipify.org?format=json')
    const json = await res.json()
    return json.ip || 'unknown'
  } catch {
    return 'unknown'
  }
}

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
  estimatedDelivery: '',
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

export async function fetchAllFromSupabase() {
  if (!isSupabaseConfigured) return null

  const ordersRes = await supabase.from('orders').select('data').order('updated_at', { ascending: false })
  if (ordersRes.error) console.warn('[Supabase] orders fetch error:', ordersRes.error)

  const clientsRes = await supabase.from('clients').select('data').order('updated_at', { ascending: false })
  if (clientsRes.error) console.warn('[Supabase] clients fetch error:', clientsRes.error)

  const orders = (ordersRes.data || []).map((r) => r.data).filter(Boolean)
  const clients = (clientsRes.data || []).map((r) => r.data).filter(Boolean)

  console.log(`[Supabase] loaded ${orders.length} orders, ${clients.length} clients`)
  return { orders, clients }
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
      appUsers: [],
      loginLogs: [],
      darkMode: false,
      auth: { isLoggedIn: false },
      _hydrated: false,
      setHydrated: () => set({ _hydrated: true }),

      // ── Auth ─────────────────────────────────────────────────────
      login: async (username, password) => {
        // 1. Check custom app_users in Supabase first
        if (isSupabaseConfigured) {
          const { data: userRow } = await supabase
            .from('app_users')
            .select('*')
            .eq('username', username)
            .eq('is_active', true)
            .single()

          if (userRow && userRow.password === password) {
            const ip = await getClientIp()
            const logEntry = {
              id: `LOG-${Date.now()}`,
              username,
              role: userRow.role,
              ip_address: ip,
              user_agent: navigator.userAgent,
              logged_in_at: new Date().toISOString(),
            }
            await supabase.from('login_logs').insert(logEntry)
            set({ auth: { isLoggedIn: true, username, role: userRow.role } })
            const result = await fetchAllFromSupabase()
            if (result) set({ orders: result.orders, clients: result.clients })
            return true
          }
        }

        // 2. Fallback: hardcoded superadmin
        if (username === SUPERADMIN && password === 'admin123') {
          const ip = await getClientIp()
          if (isSupabaseConfigured) {
            await supabase.from('login_logs').insert({
              id: `LOG-${Date.now()}`,
              username,
              role: 'superadmin',
              ip_address: ip,
              user_agent: navigator.userAgent,
              logged_in_at: new Date().toISOString(),
            })
          }
          set({ auth: { isLoggedIn: true, username, role: 'superadmin' } })
          const result = await fetchAllFromSupabase()
          if (result) set({ orders: result.orders, clients: result.clients })
          return true
        }

        return false
      },

      logout: () => set({ auth: { isLoggedIn: false }, orders: [], clients: [] }),

      // Load all data from Supabase (used on app start when already logged in)
      loadFromSupabase: async () => {
        const result = await fetchAllFromSupabase()
        if (result) set({ orders: result.orders, clients: result.clients })
      },

      // ── App Users (superadmin only) ───────────────────────────────
      fetchAppUsers: async () => {
        if (!isSupabaseConfigured) return
        const { data, error } = await supabase
          .from('app_users')
          .select('id, username, role, is_active, created_at, updated_at')
          .order('created_at', { ascending: false })
        if (!error && data) set({ appUsers: data })
      },

      createAppUser: async ({ username, password, role }) => {
        if (!isSupabaseConfigured) return { error: 'Supabase not configured' }
        const newUser = {
          id: `USR-${Date.now()}`,
          username,
          password,
          role: role || 'admin',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        const { error } = await supabase.from('app_users').insert(newUser)
        if (!error) {
          set((s) => ({ appUsers: [{ ...newUser, password: undefined }, ...s.appUsers] }))
        }
        return { error }
      },

      updateAppUser: async (id, updates) => {
        if (!isSupabaseConfigured) return { error: 'Supabase not configured' }
        const payload = { ...updates, updated_at: new Date().toISOString() }
        const { error } = await supabase.from('app_users').update(payload).eq('id', id)
        if (!error) {
          set((s) => ({
            appUsers: s.appUsers.map((u) => (u.id === id ? { ...u, ...payload } : u)),
          }))
        }
        return { error }
      },

      deleteAppUser: async (id) => {
        if (!isSupabaseConfigured) return { error: 'Supabase not configured' }
        const { error } = await supabase.from('app_users').delete().eq('id', id)
        if (!error) set((s) => ({ appUsers: s.appUsers.filter((u) => u.id !== id) }))
        return { error }
      },

      // ── Login Logs ────────────────────────────────────────────────
      fetchLoginLogs: async () => {
        if (!isSupabaseConfigured) return
        const { data, error } = await supabase
          .from('login_logs')
          .select('*')
          .order('logged_in_at', { ascending: false })
          .limit(200)
        if (!error && data) set({ loginLogs: data })
      },

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
      // Only persist auth and darkMode — everything else comes from Supabase
      partialize: (state) => ({
        auth: state.auth,
        darkMode: state.darkMode,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrated()
      },
    }
  )
)

export { initialOrder }
