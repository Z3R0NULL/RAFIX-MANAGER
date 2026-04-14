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
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppWithDarkMode>
    </BrowserRouter>
  )
}
