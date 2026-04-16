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
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      react: path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom'),
    },
  },
  server: {
    historyApiFallback: true,
  },
  preview: {
    historyApiFallback: true,
  },
})
