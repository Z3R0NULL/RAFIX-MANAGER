/**
 * main.jsx — Punto de entrada de la aplicación React.
 *
 * Monta el componente raíz <App /> dentro del elemento #root del index.html.
 * StrictMode activa advertencias adicionales en desarrollo para detectar
 * problemas potenciales en los componentes.
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Force dark class before React renders anything — prevents iOS Safari
// from flashing light-mode backgrounds during the JS hydration window.
document.documentElement.classList.add('dark')
import { useStore } from './store/useStore.js'

// Safety timeout: if Zustand never fires onRehydrateStorage (blocked localStorage,
// browser extension interference, etc.) force _hydrated after 2 s so the app
// never gets stuck on a blank/gray screen.
setTimeout(() => {
  if (!useStore.getState()._hydrated) {
    console.warn('[store] hydration timeout — forcing _hydrated')
    useStore.setState({ _hydrated: true })
  }
}, 2000)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
