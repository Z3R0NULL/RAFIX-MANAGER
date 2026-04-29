/**
 * main.jsx — Punto de entrada de la aplicación React.
 *
 * Monta el componente raíz <App /> dentro del elemento #root del index.html.
 * StrictMode activa advertencias adicionales en desarrollo para detectar
 * problemas potenciales en los componentes.
 */

// React base para componentes/JSX.
import React from 'react'
// API de React 18 para crear la raíz de renderizado.
import ReactDOM from 'react-dom/client'
// Componente principal de la aplicación.
import App from './App.jsx'
// Estilos globales de toda la app.
import './index.css'

// Force dark class before React renders anything — prevents iOS Safari
// from flashing light-mode backgrounds during the JS hydration window.
// Fuerza tema oscuro desde el primer instante para evitar parpadeo visual.
document.documentElement.classList.add('dark')

// Store global (Zustand) para estado compartido e hidratación persistida.
import { useStore } from './store/useStore.js'

// Safety timeout: if Zustand never fires onRehydrateStorage (blocked localStorage,
// browser extension interference, etc.) force _hydrated after 2 s so the app
// never gets stuck on a blank/gray screen.
// Fallback defensivo: evita pantalla en blanco si la hidratación falla.
setTimeout(() => {
  // Si aún no terminó la hidratación del store, forzar estado listo.
  if (!useStore.getState()._hydrated) {
    // Deja traza en consola para diagnóstico.
    console.warn('[store] hydration timeout — forcing _hydrated')
    // Desbloquea la app marcando hidratación como completada.
    useStore.setState({ _hydrated: true })
  }
}, 2000)

// Toma el contenedor #root de index.html y renderiza la app React.
ReactDOM.createRoot(document.getElementById('root')).render(
  // StrictMode añade verificaciones extra en desarrollo.
  <React.StrictMode>
    {/* Componente raíz de la interfaz */}
    <App />
  </React.StrictMode>,
)