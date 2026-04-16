import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store/useStore'
import Layout from './components/Layout'
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

function PrivateRoute({ children }) {
  const isLoggedIn = useStore((s) => s.auth.isLoggedIn)
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return children
}

function SuperAdminRoute({ children }) {
  const auth = useStore((s) => s.auth)
  if (!auth.isLoggedIn) return <Navigate to="/login" replace />
  if (auth.role !== 'superadmin') return <Navigate to="/" replace />
  return children
}

function AppWithDarkMode({ children }) {
  const darkMode = useStore((s) => s.darkMode)
  const isLoggedIn = useStore((s) => s.auth.isLoggedIn)
  const _hydrated = useStore((s) => s._hydrated)
  const loadFromTurso = useStore((s) => s.loadFromTurso)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Wait for Zustand to rehydrate from localStorage before loading,
  // so auth.username/role are available when fetchAllFromTurso is called.
  useEffect(() => {
    if (_hydrated && isLoggedIn) loadFromTurso()
  }, [_hydrated, isLoggedIn]) // eslint-disable-line react-hooks/exhaustive-deps

  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AppWithDarkMode>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/track" element={<TrackOrder />} />
          <Route path="/track/:orderNumber" element={<TrackOrder />} />

          {/* Protected routes */}
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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/track" replace />} />
        </Routes>
      </AppWithDarkMode>
    </BrowserRouter>
  )
}
