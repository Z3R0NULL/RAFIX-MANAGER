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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
