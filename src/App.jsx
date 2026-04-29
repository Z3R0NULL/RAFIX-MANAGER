/**
 * App.jsx — Componente raíz de la aplicación.
 *
 * Define el enrutamiento global con React Router y gestiona:
 * - Rutas públicas: /login (inicio de sesión) y /track (seguimiento de órdenes por cliente).
 * - Rutas protegidas (PrivateRoute): requieren que el usuario esté autenticado.
 * - Rutas de superadmin (SuperAdminRoute): requieren rol 'superadmin'.
 * - AppWithDarkMode: aplica la clase CSS 'dark' al <html> y carga los datos
 *   desde Turso DB una vez que Zustand termina de rehidratar desde localStorage.
 */
import React, { useEffect } from 'react'
// Router de navegador para SPA + definición declarativa de rutas.
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
// Store global (Zustand): auth, settings e hidratación persistida.
import { useStore } from './store/useStore'
// Layout principal (sidebar/header/contenedor de páginas privadas).
import Layout from './components/Layout'
// Páginas/rutas de la aplicación.
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import NewOrder from './pages/NewOrder'
import OrderDetail from './pages/OrderDetail'
import TrackOrder from './pages/TrackOrder'
import SearchPage from './pages/SearchPage'
import DevicesPage from './pages/DevicesPage'
import DeviceModelDetail from './pages/DeviceModelDetail'
import FinancePage from './pages/FinancePage'
import AdminPanel from './pages/AdminPanel'
import AdminDashboard from './pages/AdminDashboard'
import Clients from './pages/Clients'
import InventoryPage from './pages/InventoryPage'
import SuppliersPage from './pages/SuppliersPage'
import ServicesPage from './pages/ServicesPage'
import SalesPage from './pages/SalesPage'
import NewSale from './pages/NewSale'
import SaleDetail from './pages/SaleDetail'
import TrackSale from './pages/TrackSale'
import SettingsPage from './pages/SettingsPage'

// Loader de pantalla completa usado mientras el estado persistido se hidrata.
function AppLoader() {
  return (
    <div style={{ background: '#020617', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg style={{ width: 32, height: 32, animation: 'spin 1s linear infinite' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="#6366f1" strokeWidth="4" />
        <path style={{ opacity: 0.85 }} fill="#6366f1" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  )
}

// Guard de autenticación: solo deja pasar si hay sesión activa.
function PrivateRoute({ children }) {
  const isLoggedIn = useStore((s) => s.auth.isLoggedIn)
  const _hydrated = useStore((s) => s._hydrated)
  // Wait for Zustand to rehydrate from localStorage before redirecting.
  // Without this, slow devices redirect to /login before auth state is restored.
  if (!_hydrated) return <AppLoader />
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return children
}

// Guard de autorización: restringe acceso a rutas exclusivas de superadmin.
function SuperAdminRoute({ children }) {
  const auth = useStore((s) => s.auth)
  const _hydrated = useStore((s) => s._hydrated)
  if (!_hydrated) return <AppLoader />
  if (!auth.isLoggedIn) return <Navigate to="/login" replace />
  if (auth.role !== 'superadmin') return <Navigate to="/" replace />
  return children
}

// Wrapper global: fuerza dark mode y controla carga inicial de datos.
function AppWithDarkMode({ children }) {
  const isLoggedIn = useStore((s) => s.auth.isLoggedIn)
  const _hydrated = useStore((s) => s._hydrated)
  const loadFromTurso = useStore((s) => s.loadFromTurso)
  const businessName = useStore((s) => s.settings.businessName)
  // Track whether the initial hydration has already triggered a load,
  // so we don't re-load on every isLoggedIn change (e.g. right after login,
  // which already loads data internally and would cause duplicates).
  const didInitialLoad = React.useRef(false)

  useEffect(() => {
    // Garantiza clase dark en <html> al montar la app.
    document.documentElement.classList.add('dark')
  }, [])

  useEffect(() => {
    // Título dinámico en pestaña según nombre del negocio configurado.
    const name = businessName?.trim() || 'RaFix'
    document.title = `${name} — RaFix Manager`
  }, [businessName])

  // Only load from Turso once, when Zustand finishes rehydrating from
  // localStorage with an active session (i.e. page refresh scenario).
  // The login() action handles its own data fetch, so we must not call
  // loadFromTurso() again right after login or duplicates will appear.
  useEffect(() => {
    // Tras rehidratación + sesión válida, carga inicial desde Turso (una sola vez).
    if (_hydrated && isLoggedIn && !didInitialLoad.current) {
      didInitialLoad.current = true
      loadFromTurso()
    }
    // Al cerrar sesión, resetea bandera para permitir próxima carga inicial.
    if (!isLoggedIn) {
      didInitialLoad.current = false
    }
  }, [_hydrated, isLoggedIn]) // eslint-disable-line react-hooks/exhaustive-deps

  return children
}

// Componente raíz: define enrutamiento público, protegido y fallback.
export default function App() {
  return (
    <BrowserRouter>
      <AppWithDarkMode>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/track" element={<TrackOrder />} />
          <Route path="/track/:orderNumber" element={<TrackOrder />} />
          <Route path="/sale-track" element={<TrackSale />} />
          <Route path="/sale-track/:saleNumber" element={<TrackSale />} />

          {/* Rutas protegidas: requieren usuario autenticado */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          {/* Sección órdenes */}
          <Route
            path="/orders"
            element={
              <PrivateRoute>
                <Layout>
                  <Orders />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/orders/new"
            element={
              <PrivateRoute>
                <Layout>
                  <NewOrder />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <PrivateRoute>
                <Layout>
                  <OrderDetail />
                </Layout>
              </PrivateRoute>
            }
          />
          {/* Sección búsqueda y dispositivos */}
          <Route
            path="/search"
            element={
              <PrivateRoute>
                <Layout>
                  <SearchPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/devices"
            element={
              <PrivateRoute>
                <Layout>
                  <DevicesPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/devices/:slug"
            element={
              <PrivateRoute>
                <Layout>
                  <DeviceModelDetail />
                </Layout>
              </PrivateRoute>
            }
          />
          {/* Sección ventas */}
          <Route
            path="/sales"
            element={
              <PrivateRoute>
                <Layout>
                  <SalesPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/sales/new"
            element={
              <PrivateRoute>
                <Layout>
                  <NewSale />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/sales/:id"
            element={
              <PrivateRoute>
                <Layout>
                  <SaleDetail />
                </Layout>
              </PrivateRoute>
            }
          />
          {/* Sección clientes/finanzas/inventario/proveedores */}
          <Route
            path="/clients"
            element={
              <PrivateRoute>
                <Layout>
                  <Clients />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/finance"
            element={
              <PrivateRoute>
                <Layout>
                  <FinancePage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <PrivateRoute>
                <Layout>
                  <InventoryPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/suppliers"
            element={
              <PrivateRoute>
                <Layout>
                  <SuppliersPage />
                </Layout>
              </PrivateRoute>
            }
          />

          {/* Catálogo de servicios */}
          <Route
            path="/services"
            element={
              <PrivateRoute>
                <Layout>
                  <ServicesPage />
                </Layout>
              </PrivateRoute>
            }
          />

          {/* Rutas exclusivas de superadmin */}
          <Route
            path="/admin"
            element={
              <SuperAdminRoute>
                <Layout>
                  <AdminPanel />
                </Layout>
              </SuperAdminRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <SuperAdminRoute>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </SuperAdminRoute>
            }
          />

          {/* Configuración general de la instancia */}
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Layout>
                  <SettingsPage />
                </Layout>
              </PrivateRoute>
            }
          />

          {/* Fallback: cualquier ruta desconocida redirige al tracking público */}
          <Route path="*" element={<Navigate to="/track" replace />} />
        </Routes>
      </AppWithDarkMode>
    </BrowserRouter>
  )
}
