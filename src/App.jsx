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

function PrivateRoute({ children }) {
  const isLoggedIn = useStore((s) => s.auth.isLoggedIn)
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return children
}

function AppWithDarkMode({ children }) {
  const darkMode = useStore((s) => s.darkMode)
  const orders = useStore((s) => s.orders)
  const isLoggedIn = useStore((s) => s.auth.isLoggedIn)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // When admin logs in, push any local-only orders to Supabase
  useEffect(() => {
    if (!isLoggedIn || !orders.length) return
    import('./lib/supabase').then(({ supabase, isSupabaseConfigured }) => {
      if (!isSupabaseConfigured) return
      const rows = orders.map((o) => ({
        id: o.id,
        order_number: o.orderNumber,
        data: o,
        updated_at: new Date().toISOString(),
      }))
      supabase.from('orders').upsert(rows).then(({ error }) => {
        if (error) console.warn('[Supabase] bulk sync failed:', error)
      })
    })
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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/track" replace />} />
        </Routes>
      </AppWithDarkMode>
    </BrowserRouter>
  )
}
