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
import { canTransitionTo, buildStatusHistory } from '../utils/constants'


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
  devicePattern: [],
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
  budgetItems: [],
  workDone: '',
  status: 'pending',
  estimatedDelivery: '',
  photosEntry: [],
  photosExit: [],
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

async function syncCatalogItemToTurso(item) {
  if (!isTursoConfigured) return
  try {
    await turso.execute({
      sql: `INSERT INTO device_catalog (id, category, brand, model, created_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              category   = excluded.category,
              brand      = excluded.brand,
              model      = excluded.model,
              updated_at = excluded.updated_at`,
      args: [item.id, item.category, item.brand, item.model, item.createdBy, item.createdAt, item.updatedAt],
    })
  } catch (e) {
    console.warn('[Turso] catalog sync failed:', e)
  }
}

async function deleteCatalogItemFromTurso(id) {
  if (!isTursoConfigured) return
  try {
    await turso.execute({ sql: 'DELETE FROM device_catalog WHERE id = ?', args: [id] })
  } catch (e) {
    console.warn('[Turso] catalog delete failed:', e)
  }
}

async function syncServiceToTurso(service, username) {
  if (!isTursoConfigured) return
  try {
    await initDb()
    await turso.execute({
      sql: `INSERT INTO services (id, created_by, data, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              created_by = excluded.created_by,
              data       = excluded.data,
              updated_at = excluded.updated_at`,
      args: [service.id, username || service.createdBy || 'admin', JSON.stringify(service), new Date().toISOString()],
    })
  } catch (e) {
    console.warn('[Turso] service sync failed:', e)
  }
}

async function deleteServiceFromTurso(id) {
  if (!isTursoConfigured) return
  try {
    await turso.execute({ sql: 'DELETE FROM services WHERE id = ?', args: [id] })
  } catch (e) {
    console.warn('[Turso] service delete failed:', e)
  }
}

async function syncSaleToTurso(sale) {
  if (!isTursoConfigured) return
  try {
    await turso.execute({
      sql: `INSERT INTO sales (id, sale_number, created_by, data, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              sale_number = excluded.sale_number,
              created_by  = excluded.created_by,
              data        = excluded.data,
              updated_at  = excluded.updated_at`,
      args: [sale.id, sale.saleNumber, sale.createdBy || 'admin', JSON.stringify(sale), new Date().toISOString()],
    })
  } catch (e) {
    console.warn('[Turso] sale sync failed:', e)
  }
}

async function deleteSaleFromTurso(id) {
  if (!isTursoConfigured) return
  try {
    await turso.execute({ sql: 'DELETE FROM sales WHERE id = ?', args: [id] })
  } catch (e) {
    console.warn('[Turso] sale delete failed:', e)
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

async function syncSettingsToTurso(username, settings) {
  if (!isTursoConfigured || !username) return
  try {
    await turso.execute({
      sql: `INSERT INTO user_settings (username, data, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(username) DO UPDATE SET
              data       = excluded.data,
              updated_at = excluded.updated_at`,
      args: [username, JSON.stringify(settings), new Date().toISOString()],
    })
  } catch (e) {
    console.warn('[Turso] settings sync failed:', e)
  }
}

async function fetchSettingsFromTurso(username) {
  if (!isTursoConfigured || !username) return null
  try {
    const res = await turso.execute({
      sql: 'SELECT data FROM user_settings WHERE username = ? LIMIT 1',
      args: [username],
    })
    if (res.rows[0]) return JSON.parse(res.rows[0].data)
  } catch (e) {
    console.warn('[Turso] settings fetch failed:', e)
  }
  return null
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

    const catalogRes = await turso.execute(
      'SELECT id, category, brand, model, created_by, created_at, updated_at FROM device_catalog ORDER BY category, brand, model'
    )

    const deviceTypesRes = await turso.execute(
      'SELECT id, value, label, sort_order FROM device_types ORDER BY sort_order ASC, label ASC'
    )

    const servicesRes = await turso.execute({
      sql: 'SELECT data FROM services WHERE created_by = ? ORDER BY updated_at DESC',
      args: [username],
    })

    const salesRes = await turso.execute({
      sql: 'SELECT data FROM sales WHERE created_by = ? ORDER BY updated_at DESC',
      args: [username],
    })

    const orders    = ordersRes.rows.map((r) => JSON.parse(r.data)).filter(Boolean)
    const clients   = clientsRes.rows.map((r) => JSON.parse(r.data)).filter(Boolean)
    const inventory = inventoryRes.rows.map((r) => JSON.parse(r.data)).filter(Boolean)
    const suppliers = suppliersRes.rows.map((r) => JSON.parse(r.data)).filter(Boolean)
    const services  = servicesRes.rows.map((r) => JSON.parse(r.data)).filter(Boolean)
    const sales     = salesRes.rows.map((r) => JSON.parse(r.data)).filter(Boolean)
    const deviceCatalog = catalogRes.rows.map((r) => ({
      id: r.id, category: r.category, brand: r.brand, model: r.model,
      createdBy: r.created_by, createdAt: r.created_at, updatedAt: r.updated_at,
    }))

    const deviceTypes = deviceTypesRes.rows.map((r) => ({
      id: r.id, value: r.value, label: r.label, sortOrder: r.sort_order,
    }))

    // Datos cargados correctamente desde Turso
    return { orders, clients, inventory, suppliers, deviceCatalog, services, sales, deviceTypes }
  } catch (e) {
    console.warn('[Turso] fetchAll failed:', e)
    return null
  }
}

// ── Store ────────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS = {
  businessName: 'RAFIX',
  businessAddress: '',
  businessLogo: null,        // base64 data URL
  currency: 'ARS',
  currencyLocale: 'es-AR',
  language: 'es',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Argentina/Buenos_Aires',
  warrantyDays: 30,
  warrantyPolicy: [
    'El taller no se hace responsable por la pérdida de datos. El cliente debe realizar una copia de seguridad antes del servicio.',
    'Los equipos no retirados después de 30 días generarán cargos de almacenamiento.',
    'El presupuesto es válido por 7 días. Los precios pueden cambiar después de este período.',
    'Los daños físicos o por líquido descubiertos durante la reparación pueden generar cargos adicionales.',
    'Garantizamos nuestras reparaciones por 30 días bajo condiciones de uso normal.',
    'El pago se realiza al momento de retirar el equipo.',
  ],
  // Redes sociales
  socialLinks: {
    instagram: '',
    facebook: '',
    twitter: '',
    tiktok: '',
    youtube: '',
    whatsapp: '',
    website: '',
  },
  // Ajustes de precio por método de pago (% positivo = recargo, negativo = descuento)
  paymentAdjustments: {
    cash:     { enabled: false, value: 0, type: 'discount' },   // efectivo
    transfer: { enabled: false, value: 0, type: 'surcharge' },  // transferencia
  },
}

export const CURRENCY_OPTIONS = [
  { value: 'ARS', locale: 'es-AR', label: 'ARS — Peso Argentino' },
  { value: 'USD', locale: 'en-US', label: 'USD — Dólar' },
  { value: 'EUR', locale: 'es-ES', label: 'EUR — Euro' },
  { value: 'MXN', locale: 'es-MX', label: 'MXN — Peso Mexicano' },
  { value: 'CLP', locale: 'es-CL', label: 'CLP — Peso Chileno' },
  { value: 'COP', locale: 'es-CO', label: 'COP — Peso Colombiano' },
  { value: 'PEN', locale: 'es-PE', label: 'PEN — Sol Peruano' },
  { value: 'BRL', locale: 'pt-BR', label: 'BRL — Real Brasileño' },
  { value: 'GBP', locale: 'en-GB', label: 'GBP — Libra Esterlina' },
]

export const LANGUAGE_OPTIONS = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
]

export const useStore = create(
  persist(
    (set, get) => ({
      orders: [],
      clients: [],
      inventory: [],
      suppliers: [],
      services: [],
      sales: [],
      deviceCatalog: [],
      deviceTypes: [],
      appUsers: [],
      loginLogs: [],
      darkMode: true,
      auth: { isLoggedIn: false },
      settings: { ...DEFAULT_SETTINGS },
      _hydrated: false,
      dataLoading: false,
      setHydrated: () => set({ _hydrated: true }),

      // ── Settings ───────────────────────────────────────────────────
      updateSettings: (patch) => {
        const { auth } = get()
        set((s) => {
          const next = { ...s.settings, ...patch }
          syncSettingsToTurso(auth?.username, next)
          return { settings: next }
        })
      },

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
              set({ auth: { isLoggedIn: true, username, role: userRow.role }, dataLoading: true })
              try {
                const [result, remoteSettings] = await Promise.all([
                  fetchAllFromTurso({ username }),
                  fetchSettingsFromTurso(username),
                ])
                if (result) set({ orders: result.orders, clients: result.clients, inventory: result.inventory || [], suppliers: result.suppliers || [], services: result.services || [], sales: result.sales || [], deviceCatalog: result.deviceCatalog || [], deviceTypes: result.deviceTypes || [] })
                if (remoteSettings) set((s) => ({ settings: { ...DEFAULT_SETTINGS, ...remoteSettings } }))
              } finally {
                set({ dataLoading: false })
              }
              return true
            }
          } catch (e) {
            console.warn('[Turso] login check failed:', e)
            set({ dataLoading: false })
          }
        }

        return false
      },

      logout: () => set({ auth: { isLoggedIn: false }, orders: [], clients: [], inventory: [], suppliers: [], services: [], sales: [], deviceCatalog: [], deviceTypes: [] }),

      loadFromTurso: async () => {
        const { auth } = get()
        set({ dataLoading: true })
        // Safety: always stop the loading spinner after 10 s max,
        // even if Turso is unreachable (common on slow mobile connections).
        const timeout = setTimeout(() => {
          if (get().dataLoading) {
            console.warn('[store] loadFromTurso timeout — forcing dataLoading=false')
            set({ dataLoading: false })
          }
        }, 10000)
        try {
          const [result, remoteSettings] = await Promise.all([
            fetchAllFromTurso({ username: auth?.username }),
            fetchSettingsFromTurso(auth?.username),
          ])
          if (result) set({ orders: result.orders, clients: result.clients, inventory: result.inventory || [], suppliers: result.suppliers || [], services: result.services || [], sales: result.sales || [], deviceCatalog: result.deviceCatalog || [], deviceTypes: result.deviceTypes || [] })
          if (remoteSettings) set((s) => ({ settings: { ...DEFAULT_SETTINGS, ...remoteSettings } }))
        } catch (e) {
          console.warn('[store] loadFromTurso failed:', e)
        } finally {
          clearTimeout(timeout)
          set({ dataLoading: false })
        }
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

      // ── Services ───────────────────────────────────────────────────
      addService: (data) => {
        const { auth } = get()
        const username = auth?.username || 'admin'
        const service = {
          ...data,
          id: `SVC-${Date.now()}`,
          createdBy: username,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((s) => ({ services: [service, ...s.services] }))
        syncServiceToTurso(service, username)
        return service
      },

      updateService: (id, data) => {
        const { auth } = get()
        const username = auth?.username || 'admin'
        set((s) => {
          const updated = s.services.map((svc) => {
            if (svc.id !== id) return svc
            const next = { ...svc, ...data, id: svc.id, createdBy: svc.createdBy, createdAt: svc.createdAt, updatedAt: new Date().toISOString() }
            syncServiceToTurso(next, username)
            return next
          })
          return { services: updated }
        })
      },

      deleteService: (id) => {
        set((s) => ({ services: s.services.filter((svc) => svc.id !== id) }))
        deleteServiceFromTurso(id)
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

      // ── Device Catalog ─────────────────────────────────────────────
      addCatalogItem: (data) => {
        const { auth } = get()
        const username = auth?.username || ''
        const item = {
          id: `CAT-${Date.now()}`,
          category: data.category.trim(),
          brand: data.brand.trim(),
          model: data.model.trim(),
          createdBy: username,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((s) => ({ deviceCatalog: [...s.deviceCatalog, item].sort((a, b) => `${a.category}${a.brand}${a.model}`.localeCompare(`${b.category}${b.brand}${b.model}`)) }))
        syncCatalogItemToTurso(item)
        return item
      },

      updateCatalogItem: (id, data) => {
        set((s) => {
          const updated = s.deviceCatalog.map((item) => {
            if (item.id !== id) return item
            const next = { ...item, category: data.category.trim(), brand: data.brand.trim(), model: data.model.trim(), updatedAt: new Date().toISOString() }
            syncCatalogItemToTurso(next)
            return next
          })
          return { deviceCatalog: updated.sort((a, b) => `${a.category}${a.brand}${a.model}`.localeCompare(`${b.category}${b.brand}${b.model}`)) }
        })
      },

      deleteCatalogItem: (id) => {
        set((s) => ({ deviceCatalog: s.deviceCatalog.filter((item) => item.id !== id) }))
        deleteCatalogItemFromTurso(id)
      },

      // ── Device Types ───────────────────────────────────────────────
      addDeviceType: async ({ value, label }) => {
        const v = value.trim().toLowerCase().replace(/\s+/g, '_')
        const l = label.trim()
        if (!v || !l) return { error: 'Valor y etiqueta requeridos' }
        const { deviceTypes } = get()
        if (deviceTypes.find((d) => d.value === v)) return { error: 'Ya existe un tipo con ese valor' }
        const now = new Date().toISOString()
        const item = { id: `DT-${Date.now()}`, value: v, label: l, sortOrder: deviceTypes.length }
        set((s) => ({ deviceTypes: [...s.deviceTypes, item].sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label)) }))
        if (isTursoConfigured) {
          try {
            await turso.execute({
              sql: `INSERT INTO device_types (id, value, label, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
              args: [item.id, item.value, item.label, item.sortOrder, now, now],
            })
          } catch (e) { return { error: e.message || 'Insert failed' } }
        }
        return { error: null }
      },

      updateDeviceType: async (id, { label }) => {
        const l = (label || '').trim()
        if (!l) return { error: 'La etiqueta es requerida' }
        const now = new Date().toISOString()
        set((s) => ({ deviceTypes: s.deviceTypes.map((d) => d.id === id ? { ...d, label: l } : d) }))
        if (isTursoConfigured) {
          try {
            await turso.execute({ sql: `UPDATE device_types SET label = ?, updated_at = ? WHERE id = ?`, args: [l, now, id] })
          } catch (e) { return { error: e.message || 'Update failed' } }
        }
        return { error: null }
      },

      deleteDeviceType: async (id) => {
        set((s) => ({ deviceTypes: s.deviceTypes.filter((d) => d.id !== id) }))
        if (isTursoConfigured) {
          try {
            await turso.execute({ sql: 'DELETE FROM device_types WHERE id = ?', args: [id] })
          } catch (e) { console.warn('[Turso] device_type delete failed:', e) }
        }
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
          // Resolve username so we can cascade-delete all related data
          const userToDelete = get().appUsers.find((u) => u.id === id)
          const username = userToDelete?.username

          await turso.execute({ sql: 'DELETE FROM app_users WHERE id = ?', args: [id] })

          // Cascade: delete all data that belongs to this user
          if (username) {
            await turso.batch([
              { sql: 'DELETE FROM orders       WHERE created_by = ?', args: [username] },
              { sql: 'DELETE FROM clients      WHERE created_by = ?', args: [username] },
              { sql: 'DELETE FROM inventory    WHERE created_by = ?', args: [username] },
              { sql: 'DELETE FROM suppliers    WHERE created_by = ?', args: [username] },
              { sql: 'DELETE FROM services     WHERE created_by = ?', args: [username] },
              { sql: 'DELETE FROM sales        WHERE created_by = ?', args: [username] },
              { sql: 'DELETE FROM user_settings WHERE username  = ?', args: [username] },
              { sql: 'DELETE FROM login_logs   WHERE username   = ?', args: [username] },
            ], 'write')
          }

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

      // ── Clients ────────────────────────────────────────────────────
      upsertClient: (data) => {
        const { clients, auth } = get()
        const currentUser = auth?.username || 'admin'
        const normDni   = (data.dni   || '').trim()
        const normPhone = (data.phone || '').trim()
        const normEmail = (data.email || '').trim().toLowerCase()
        const normName  = (data.name  || '').trim().toLowerCase()
        // Match by any unique identifier (dni, phone, email, or name as fallback)
        const existing = clients.find(
          (c) =>
            c.createdBy === currentUser &&
            (
              (normDni   && (c.dni   || '').trim()               === normDni)   ||
              (normPhone && (c.phone || '').trim()               === normPhone) ||
              (normEmail && (c.email || '').trim().toLowerCase() === normEmail) ||
              (normName  && (c.name  || '').trim().toLowerCase() === normName)
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
      // ── Inventory stock adjustment helpers for orders ──────────────
      _adjustInventoryForBudgetItems: (prevItems = [], nextItems = [], username) => {
        // Build a map of net qty change per inventory sourceId
        const delta = {}
        for (const it of prevItems) {
          if (it.type === 'inventory' && it.sourceId) {
            delta[it.sourceId] = (delta[it.sourceId] || 0) + (Number(it.qty) || 1)
          }
        }
        for (const it of nextItems) {
          if (it.type === 'inventory' && it.sourceId) {
            delta[it.sourceId] = (delta[it.sourceId] || 0) - (Number(it.qty) || 1)
          }
        }
        // Apply deltas: negative delta means more units consumed → deduct stock
        const { inventory } = get()
        const updatedInventory = inventory.map((item) => {
          if (!(item.id in delta) || delta[item.id] === 0) return item
          const newStock = Math.max(0, (item.stock || 0) + delta[item.id])
          const next = { ...item, stock: newStock, updatedAt: new Date().toISOString() }
          syncInventoryItemToTurso(next, username)
          return next
        })
        set({ inventory: updatedInventory })
      },

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
        const username = data.createdBy || auth?.username || 'admin'
        const order = {
          ...initialOrder,
          ...data,
          id: Date.now().toString(),
          orderNumber: generateOrderNumber(),
          createdBy: username,
          entryDate: new Date().toISOString(),
          deliveryDate: null,
          statusHistory: buildStatusHistory([], data.status || 'pending', 'Orden creada'),
        }
        set((s) => ({ orders: [order, ...s.orders] }))
        syncOrderToTurso(order)

        // Deduct inventory stock for any budget items included at creation
        if (data.budgetItems?.length) {
          get()._adjustInventoryForBudgetItems([], data.budgetItems, username)
        }

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

        // Adjust inventory stock if budgetItems changed
        if (data.budgetItems !== undefined) {
          const { auth, orders } = get()
          const username = auth?.username || 'admin'
          const currentOrder = orders.find((o) => o.id === id)
          get()._adjustInventoryForBudgetItems(
            currentOrder?.budgetItems || [],
            data.budgetItems,
            username
          )
        }

        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== id) return o
            const updated = { ...o, ...data }
            if (data.status && data.status !== o.status) {
              updated.statusHistory = buildStatusHistory(
                o.statusHistory,
                data.status,
                data.statusNote || ''
              )
              if (data.status === 'delivered' || data.status === 'cancelled') {
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
      getSaleByNumber: (num) => get().sales.find((s) => s.saleNumber === num),

      // ── Sales ──────────────────────────────────────────────────────
      createSale: (data) => {
        const { auth, inventory } = get()
        const username = auth?.username || 'admin'

        // Deduct stock for each item sold
        const updatedInventory = inventory.map((item) => {
          const soldItem = (data.items || []).find((i) => i.id === item.id)
          if (!soldItem) return item
          const newStock = Math.max(0, (item.stock || 0) - soldItem.qty)
          const next = { ...item, stock: newStock, updatedAt: new Date().toISOString() }
          syncInventoryItemToTurso(next, username)
          return next
        })
        set({ inventory: updatedInventory })

        const prefix = 'VTA'
        const ts = Date.now().toString().slice(-6)
        const rand = Math.floor(Math.random() * 100).toString().padStart(2, '0')
        const saleNumber = `${prefix}-${ts}${rand}`

        const sale = {
          ...data,
          id: `SAL-${Date.now()}`,
          saleNumber,
          createdBy: username,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((s) => ({ sales: [sale, ...s.sales] }))
        syncSaleToTurso(sale)
        return sale
      },

      updateSale: (id, data) => {
        set((s) => ({
          sales: s.sales.map((sale) => {
            if (sale.id !== id) return sale
            const updated = { ...sale, ...data, id: sale.id, createdBy: sale.createdBy, createdAt: sale.createdAt, updatedAt: new Date().toISOString() }
            syncSaleToTurso(updated)
            return updated
          }),
        }))
      },

      deleteSale: (id) => {
        set((s) => ({ sales: s.sales.filter((s2) => s2.id !== id) }))
        deleteSaleFromTurso(id)
      },
    }),
    {
      name: 'repairpro-store',
      partialize: (state) => ({
        auth: state.auth,
        darkMode: state.darkMode,
        settings: state.settings,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          // Hydration failed (e.g. corrupted localStorage). Force hydrated so
          // the app doesn't hang on a gray screen — user will just be logged out.
          console.warn('[store] rehydration error, resetting auth:', error)
          useStore.setState({ _hydrated: true, auth: { isLoggedIn: false } })
          return
        }
        if (state) state.setHydrated()
      },
    }
  )
)
