import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wrench, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useStore } from '../store/useStore'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const login = useStore((s) => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const ok = await login(form.username, form.password)
    if (ok) {
      navigate('/')
    } else {
      setError('Usuario o contraseña incorrectos.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-600/20">
            <Wrench size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">RAFIX Manager</h1>
          <p className="text-sm text-slate-400 mt-1">Ingresá con tu cuenta</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 rounded-xl shadow-xl border border-slate-700/60 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                Usuario
              </label>
              <input
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="input-std"
                placeholder="nombre_usuario"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-std pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-900/20 border border-red-800/50 text-red-400 text-sm">
                <AlertCircle size={14} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-medium rounded-lg transition-all mt-1"
            >
              Iniciar sesión
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-5">
          RAFIX Service Manager · Acceso restringido
        </p>
      </div>
    </div>
  )
}
