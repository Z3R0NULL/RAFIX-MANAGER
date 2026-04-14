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
import AdminPanel from './pages/AdminPanel'

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

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const loadFromTurso = useStore((s) => s.loadFromTurso)

  // On mount: covers page refresh with session already persisted in localStorage.
  // On isLoggedIn change: covers fresh login from the login page.
  useEffect(() => {
    if (isLoggedIn) loadFromTurso()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isLoggedIn) loadFromTurso()
  }, [isLoggedIn]) // eslint-disable-line react-hooks/exhaustive-deps

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
            path="/admin"
            element={
              <SuperAdminRoute>
                <Layout>
                  <AdminPanel />
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
