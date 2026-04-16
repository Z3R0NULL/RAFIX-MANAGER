/**
 * store/useStore.js — Estado global de la aplicación (Zustand + persist).
 *
 * Este archivo es el núcleo de la lógica del sistema. Centraliza:
 *
 * Estado persistido en localStorage (solo auth y darkMode):
 *  - auth: { isLoggedIn, username, role }
 *  - darkMode: boolean
 *
 * Estado en memoria (recargado desde Turso al iniciar sesión):
 *  - orders: lista de órdenes de servicio del usuario autenticado.
 *  - clients: lista de clientes registrados por el usuario.
 *  - inventory: piezas y repuestos del taller.
 *  - suppliers: proveedores registrados.
 *  - appUsers: usuarios del sistema (solo visible para superadmin).
 *  - loginLogs: historial de accesos (solo visible para superadmin).
 *
 * Acciones principales:
 *  - login / logout: autenticación contra Turso; fallback al superadmin hardcodeado.
 *  - loadFromTurso: recarga todos los datos del usuario desde la DB.
 *  - CRUD de orders, clients, inventory, suppliers, appUsers.
 *  - getOrder / getOrderByNumber: búsqueda local de órdenes.
 *
 * Helpers internos (no exportados):
 *  - syncOrderToTurso / syncInventoryItemToTurso / etc.: sincronizan cada
 *    operación local hacia la DB en segundo plano.
 *  - fetchAllFromTurso: obtiene todos los registros del usuario desde Turso.
 *  - getClientIp: obtiene la IP pública del cliente para el log de acceso.
 *  - generateOrderNumber: genera un número de orden único (ORD-XXXXXXXX).
 *
 * initialOrder: objeto con todos los campos vacíos de una orden nueva.
 *   Se exporta para usarlo como valor por defecto en el formulario.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { turso, isTursoConfigured, initDb } from '../lib/turso'
import { canTransitionTo } from '../utils/constants'

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

export const initialOrder = {
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

// ── Turso helpers ────────────────────────────────────────────────────────────

async function syncOrderToTurso(order) {
  if (!isTursoConfigured) return
  try {
    await turso.execute({
      sql: `INSERT INTO orders (id, order_number, created_by, data, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              order_number = excluded.order_number,
              created_by   = excluded.created_by,
              data         = excluded.data,
              updated_at   = excluded.updated_at`,
      args: [
        order.id,
        order.orderNumber,
        order.createdBy || 'admin',
        JSON.stringify(order),
        new Date().toISOString(),
      ],
    })
  } catch (e) {
    console.warn('[Turso] order sync failed:', e)
  }
}

async function syncInventoryItemToTurso(item, username) {
  if (!isTursoConfigured) return
  try {
    await turso.execute({
      sql: `INSERT INTO inventory (id, created_by, data, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              created_by = excluded.created_by,
              data       = excluded.data,
              updated_at = excluded.updated_at`,
      args: [item.id, username || item.createdBy || 'admin', JSON.stringify(item), new Date().toISOString()],
    })
  } catch (e) {
    console.warn('[Turso] inventory sync failed:', e)
  }
}

async function syncSupplierToTurso(supplier, username) {
  if (!isTursoConfigured) return
  try {
    await turso.execute({
      sql: `INSERT INTO suppliers (id, created_by, data, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              created_by = excluded.created_by,
              data       = excluded.data,
              updated_at = excluded.updated_at`,
      args: [supplier.id, username || supplier.createdBy || 'admin', JSON.stringify(supplier), new Date().toISOString()],
    })
  } catch (e) {
    console.warn('[Turso] supplier sync failed:', e)
  }
}

async function deleteSupplierFromTurso(id) {
  if (!isTursoConfigured) return
  try {
    await turso.execute({ sql: 'DELETE FROM suppliers WHERE id = ?', args: [id] })
  } catch (e) {
    console.warn('[Turso] supplier delete failed:', e)
  }
}

async function deleteInventoryItemFromTurso(id) {
  if (!isTursoConfigured) return
  try {
    await turso.execute({ sql: 'DELETE FROM inventory WHERE id = ?', args: [id] })
  } catch (e) {
    console.warn('[Turso] inventory delete failed:', e)
  }
}

async function deleteOrderFromTurso(id) {
  if (!isTursoConfigured) return
  try {
    await turso.execute({ sql: 'DELETE FROM orders WHERE id = ?', args: [id] })
  } catch (e) {
    console.warn('[Turso] order delete failed:', e)
  }
}

async function syncClientToTurso(client) {
  if (!isTursoConfigured) return
  try {
    await turso.execute({
      sql: `INSERT INTO clients (id, name, phone, email, dni, address, created_by, data, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              name       = excluded.name,
              phone      = excluded.phone,
              email      = excluded.email,
              dni        = excluded.dni,
              address    = excluded.address,
              created_by = excluded.created_by,
              data       = excluded.data,
              updated_at = excluded.updated_at`,
      args: [
        client.id,
        client.name || '',
        client.phone || '',
        client.email || '',
        client.dni || '',
        client.address || '',
        client.createdBy || 'admin',
        JSON.stringify(client),
        new Date().toISOString(),
      ],
    })
  } catch (e) {
    console.warn('[Turso] client sync failed:', e)
  }
}

export async function fetchAllFromTurso({ username } = {}) {
  if (!isTursoConfigured) return null

  try {
    await initDb()

    // All users (including superadmin) only see their own orders/clients in the
    // regular store. The AdminDashboard (Panel Global) fetches all orders
    // independently via its own direct Turso query.
    const ordersRes = await turso.execute({
      sql: 'SELECT data FROM orders WHERE created_by = ? ORDER BY updated_at DESC',
      args: [username],
    })

    const clientsRes = await turso.execute({
      sql: 'SELECT data FROM clients WHERE created_by = ? ORDER BY updated_at DESC',
      args: [username],
    })

    const inventoryRes = await turso.execute({
      sql: 'SELECT data FROM inventory WHERE created_by = ? ORDER BY updated_at DESC',
      args: [username],
    })

    const suppliersRes = await turso.execute({
      sql: 'SELECT data FROM suppliers WHERE created_by = ? ORDER BY updated_at DESC',
      args: [username],
    })

    const orders    = ordersRes.rows.map((r) => JSON.parse(r.data)).filter(Boolean)
    const clients   = clientsRes.rows.map((r) => JSON.parse(r.data)).filter(Boolean)
    const inventory = inventoryRes.rows.map((r) => JSON.parse(r.data)).filter(Boolean)
    const suppliers = suppliersRes.rows.map((r) => JSON.parse(r.data)).filter(Boolean)

    console.log(`[Turso] loaded ${orders.length} orders, ${clients.length} clients, ${inventory.length} inventory, ${suppliers.length} suppliers (user: ${username})`)
    return { orders, clients, inventory, suppliers }
  } catch (e) {
    console.warn('[Turso] fetchAll failed:', e)
    return null
  }
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useStore = create(
  persist(
    (set, get) => ({
      orders: [],
      clients: [],
      inventory: [],
      suppliers: [],
      appUsers: [],
      loginLogs: [],
      darkMode: false,
      auth: { isLoggedIn: false },
      _hydrated: false,
      setHydrated: () => set({ _hydrated: true }),

      // ── Auth ───────────────────────────────────────────────────────
      login: async (username, password) => {
        if (isTursoConfigured) {
          try {
            await initDb()
            const res = await turso.execute({
              sql: `SELECT * FROM app_users WHERE username = ? AND is_active = 1 LIMIT 1`,
              args: [username],
            })
            const userRow = res.rows[0]

            if (userRow && userRow.password === password) {
              const ip = await getClientIp()
              await turso.execute({
                sql: `INSERT INTO login_logs (id, username, role, ip_address, user_agent, logged_in_at)
                      VALUES (?, ?, ?, ?, ?, ?)`,
                args: [
                  `LOG-${Date.now()}`,
                  username,
                  userRow.role,
                  ip,
                  navigator.userAgent,
                  new Date().toISOString(),
                ],
              })
              set({ auth: { isLoggedIn: true, username, role: userRow.role } })
              const result = await fetchAllFromTurso({ username })
              if (result) set({ orders: result.orders, clients: result.clients, inventory: result.inventory || [], suppliers: result.suppliers || [] })
              return true
            }
          } catch (e) {
            console.warn('[Turso] login check failed:', e)
          }
        }

        // Fallback: hardcoded superadmin
        if (username === SUPERADMIN && password === 'admin123') {
          const ip = await getClientIp()
          if (isTursoConfigured) {
            try {
              await turso.execute({
                sql: `INSERT INTO login_logs (id, username, role, ip_address, user_agent, logged_in_at)
                      VALUES (?, ?, ?, ?, ?, ?)`,
                args: [
                  `LOG-${Date.now()}`,
                  username,
                  'superadmin',
                  ip,
                  navigator.userAgent,
                  new Date().toISOString(),
                ],
              })
            } catch (e) {
              console.warn('[Turso] login log insert failed:', e)
            }
          }
          set({ auth: { isLoggedIn: true, username, role: 'superadmin' } })
          const result = await fetchAllFromTurso({ username })
          if (result) set({ orders: result.orders, clients: result.clients, inventory: result.inventory || [] })
          return true
        }

        return false
      },

      logout: () => set({ auth: { isLoggedIn: false }, orders: [], clients: [], inventory: [], suppliers: [] }),

      loadFromTurso: async () => {
        const { auth } = get()
        const result = await fetchAllFromTurso({ username: auth?.username })
        if (result) set({ orders: result.orders, clients: result.clients, inventory: result.inventory || [], suppliers: result.suppliers || [] })
      },

      // ── Inventory ──────────────────────────────────────────────────
      addInventoryItem: (data) => {
        const { auth } = get()
        const username = auth?.username || 'admin'
        const item = {
          ...data,
          id: `INV-${Date.now()}`,
          createdBy: username,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((s) => ({ inventory: [item, ...s.inventory] }))
        syncInventoryItemToTurso(item, username)
        return item
      },

      updateInventoryItem: (id, data) => {
        const { auth } = get()
        const username = auth?.username || 'admin'
        set((s) => {
          const updated = s.inventory.map((item) => {
            if (item.id !== id) return item
            const next = { ...item, ...data, id: item.id, createdBy: item.createdBy, createdAt: item.createdAt, updatedAt: new Date().toISOString() }
            syncInventoryItemToTurso(next, username)
            return next
          })
          return { inventory: updated }
        })
      },

      deleteInventoryItem: (id) => {
        set((s) => ({ inventory: s.inventory.filter((item) => item.id !== id) }))
        deleteInventoryItemFromTurso(id)
      },

      adjustInventoryStock: (id, delta) => {
        const { auth } = get()
        const username = auth?.username || 'admin'
        set((s) => {
          const updated = s.inventory.map((item) => {
            if (item.id !== id) return item
            const newStock = Math.max(0, (item.stock || 0) + delta)
            const next = { ...item, stock: newStock, updatedAt: new Date().toISOString() }
            syncInventoryItemToTurso(next, username)
            return next
          })
          return { inventory: updated }
        })
      },

      // ── Suppliers ──────────────────────────────────────────────────
      addSupplier: (data) => {
        const { auth } = get()
        const username = auth?.username || 'admin'
        const supplier = {
          ...data,
          id: `SUP-${Date.now()}`,
          createdBy: username,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((s) => ({ suppliers: [supplier, ...s.suppliers] }))
        syncSupplierToTurso(supplier, username)
        return supplier
      },

      updateSupplier: (id, data) => {
        const { auth } = get()
        const username = auth?.username || 'admin'
        set((s) => {
          const updated = s.suppliers.map((sup) => {
            if (sup.id !== id) return sup
            const next = { ...sup, ...data, id: sup.id, createdBy: sup.createdBy, createdAt: sup.createdAt, updatedAt: new Date().toISOString() }
            syncSupplierToTurso(next, username)
            return next
          })
          return { suppliers: updated }
        })
      },

      deleteSupplier: (id) => {
        set((s) => ({ suppliers: s.suppliers.filter((sup) => sup.id !== id) }))
        deleteSupplierFromTurso(id)
      },

      // ── App Users (superadmin only) ────────────────────────────────
      fetchAppUsers: async () => {
        if (!isTursoConfigured) return
        try {
          const res = await turso.execute(
            'SELECT id, username, role, is_active, created_at, updated_at FROM app_users ORDER BY created_at DESC'
          )
          const users = res.rows.map((r) => ({
            id: r.id,
            username: r.username,
            role: r.role,
            is_active: Boolean(r.is_active),
            created_at: r.created_at,
            updated_at: r.updated_at,
          }))
          set({ appUsers: users })
        } catch (e) {
          console.warn('[Turso] fetchAppUsers failed:', e)
        }
      },

      createAppUser: async ({ username, password, role }) => {
        if (!isTursoConfigured) return { error: 'Turso not configured' }
        const newUser = {
          id: `USR-${Date.now()}`,
          username,
          password,
          role: role || 'admin',
          is_active: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        try {
          await turso.execute({
            sql: `INSERT INTO app_users (id, username, password, role, is_active, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [
              newUser.id,
              newUser.username,
              newUser.password,
              newUser.role,
              newUser.is_active,
              newUser.created_at,
              newUser.updated_at,
            ],
          })
          set((s) => ({
            appUsers: [{ ...newUser, password: undefined, is_active: true }, ...s.appUsers],
          }))
          return { error: null }
        } catch (e) {
          return { error: e.message || 'Insert failed' }
        }
      },

      updateAppUser: async (id, updates) => {
        if (!isTursoConfigured) return { error: 'Turso not configured' }
        const updated_at = new Date().toISOString()
        try {
          const fields = Object.keys(updates)
          const setClauses = fields.map((f) => `${f} = ?`).join(', ')
          const values = fields.map((f) => updates[f])
          await turso.execute({
            sql: `UPDATE app_users SET ${setClauses}, updated_at = ? WHERE id = ?`,
            args: [...values, updated_at, id],
          })
          set((s) => ({
            appUsers: s.appUsers.map((u) =>
              u.id === id ? { ...u, ...updates, updated_at } : u
            ),
          }))
          return { error: null }
        } catch (e) {
          return { error: e.message || 'Update failed' }
        }
      },

      deleteAppUser: async (id) => {
        if (!isTursoConfigured) return { error: 'Turso not configured' }
        try {
          await turso.execute({ sql: 'DELETE FROM app_users WHERE id = ?', args: [id] })
          set((s) => ({ appUsers: s.appUsers.filter((u) => u.id !== id) }))
          return { error: null }
        } catch (e) {
          return { error: e.message || 'Delete failed' }
        }
      },

      // ── Login Logs ─────────────────────────────────────────────────
      fetchLoginLogs: async () => {
        if (!isTursoConfigured) return
        try {
          const res = await turso.execute(
            'SELECT * FROM login_logs ORDER BY logged_in_at DESC LIMIT 200'
          )
          const logs = res.rows.map((r) => ({
            id: r.id,
            username: r.username,
            role: r.role,
            ip_address: r.ip_address,
            user_agent: r.user_agent,
            logged_in_at: r.logged_in_at,
          }))
          set({ loginLogs: logs })
        } catch (e) {
          console.warn('[Turso] fetchLoginLogs failed:', e)
        }
      },

      // Dark mode
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),

      // ── Clients ────────────────────────────────────────────────────
      upsertClient: (data) => {
        const { clients, auth } = get()
        const currentUser = auth?.username || 'admin'
        const normDni   = (data.dni   || '').trim()
        const normPhone = (data.phone || '').trim()
        const normEmail = (data.email || '').trim().toLowerCase()
        // Match by any unique identifier (dni, phone, or email) within this user's clients
        const existing = clients.find(
          (c) =>
            c.createdBy === currentUser &&
            (
              (normDni   && (c.dni   || '').trim()                  === normDni)   ||
              (normPhone && (c.phone || '').trim()                  === normPhone) ||
              (normEmail && (c.email || '').trim().toLowerCase()    === normEmail)
            )
        )
        if (existing) {
          // Merge: only overwrite a field if the new value is non-empty
          const merged = { ...existing }
          for (const key of ['name', 'phone', 'email', 'dni', 'address']) {
            if (data[key] && (data[key] || '').trim()) merged[key] = data[key]
          }
          const updated = { ...merged, createdBy: currentUser, updatedAt: new Date().toISOString() }
          set((s) => ({ clients: s.clients.map((c) => (c.id === existing.id ? updated : c)) }))
          syncClientToTurso(updated)
          return updated
        }
        const client = {
          ...data,
          id: `CLT-${Date.now()}`,
          createdBy: currentUser,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((s) => ({ clients: [client, ...s.clients] }))
        syncClientToTurso(client)
        return client
      },

      updateClient: (id, data) => {
        set((s) => {
          const updated = s.clients.map((c) => {
            if (c.id !== id) return c
            const next = { ...c, ...data, id: c.id, createdBy: c.createdBy, createdAt: c.createdAt, updatedAt: new Date().toISOString() }
            syncClientToTurso(next)
            return next
          })
          return { clients: updated }
        })
      },

      deleteClient: (id) => {
        set((s) => ({ clients: s.clients.filter((c) => c.id !== id) }))
        if (isTursoConfigured) {
          turso.execute({ sql: 'DELETE FROM clients WHERE id = ?', args: [id] }).catch(() => {})
        }
      },

      searchClients: (q) => {
        if (!q || q.length < 2) return []
        const lower = q.toLowerCase()
        return get()
          .clients.filter(
            (c) =>
              c.name?.toLowerCase().includes(lower) ||
              c.phone?.includes(q) ||
              c.dni?.includes(q) ||
              c.email?.toLowerCase().includes(lower)
          )
          .slice(0, 6)
      },

      // ── Orders ─────────────────────────────────────────────────────
      createOrder: (data) => {
        if (data.customerName) {
          get().upsertClient({
            name: data.customerName,
            phone: data.customerPhone || '',
            email: data.customerEmail || '',
            dni: data.customerDni || '',
            address: data.customerAddress || '',
          })
        }

        const { auth } = get()
        const order = {
          ...initialOrder,
          ...data,
          id: Date.now().toString(),
          orderNumber: generateOrderNumber(),
          createdBy: data.createdBy || auth?.username || 'admin',
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
        syncOrderToTurso(order)
        return order
      },

      updateOrder: (id, data) => {
        if (data.customerName) {
          get().upsertClient({
            name: data.customerName,
            phone: data.customerPhone || '',
            email: data.customerEmail || '',
            dni: data.customerDni || '',
            address: data.customerAddress || '',
          })
        }

        // Validate status transition before applying
        if (data.status) {
          const currentOrder = get().orders.find((o) => o.id === id)
          if (currentOrder) {
            const check = canTransitionTo(currentOrder, data.status)
            if (!check.ok) {
              return { error: check.reason }
            }
          }
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
            syncOrderToTurso(updated)
            return updated
          }),
        }))
        return { error: null }
      },

      deleteOrder: (id) => {
        set((s) => ({ orders: s.orders.filter((o) => o.id !== id) }))
        deleteOrderFromTurso(id)
      },

      getOrder: (id) => get().orders.find((o) => o.id === id),
      getOrderByNumber: (num) => get().orders.find((o) => o.orderNumber === num),
    }),
    {
      name: 'repairpro-store',
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
