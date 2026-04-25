/**
 * vite.config.js — Configuración del bundler Vite.
 *
 * Plugins:
 *  - @vitejs/plugin-react: soporte JSX + Fast Refresh para React.
 *  - @tailwindcss/vite: integración nativa de Tailwind CSS v4 (sin postcss).
 *
 * resolve.dedupe: evita instancias duplicadas de react/react-dom (necesario
 * cuando alguna dependencia trae su propia copia).
 *
 * historyApiFallback: redirige cualquier ruta desconocida al index.html
 * para que React Router maneje el enrutamiento del lado del cliente.
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    historyApiFallback: true,
    headers: {
      'X-Frame-Options': 'ALLOWALL',
      'Content-Security-Policy': "frame-ancestors *",
    },
  },
  preview: {
    historyApiFallback: true,
    headers: {
      'X-Frame-Options': 'ALLOWALL',
      'Content-Security-Policy': "frame-ancestors *",
    },
  },
})
