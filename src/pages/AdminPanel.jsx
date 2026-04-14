import React, { useEffect, useState } from 'react'
import {
  Users, Plus, Pencil, Trash2, ShieldCheck, Shield,
  Monitor, Clock, Globe, CheckCircle, XCircle, RefreshCw,
  Eye, EyeOff, X, AlertTriangle,
} from 'lucide-react'
import { useStore } from '../store/useStore'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function RoleBadge({ role }) {
  if (role === 'superadmin')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
        <ShieldCheck size={11} /> Superadmin
      </span>
    )
  if (role === 'usuario')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400">
        <Shield size={11} /> Usuario
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
      <Shield size={11} /> Admin
    </span>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700/60">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function UserForm({ initial, onSave, onClose, isEdit }) {
  const [form, setForm] = useState({
    username: initial?.username || '',
    password: '',
    role: initial?.role || 'usuario',
    is_active: initial?.is_active ?? true,
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.username.trim()) return setError('El usuario es requerido.')
    if (!isEdit && !form.password.trim()) return setError('La contraseña es requerida.')
    setLoading(true)
    const payload = { username: form.username.trim(), role: form.role, is_active: form.is_active }
    if (form.password.trim()) payload.password = form.password.trim()
    const err = await onSave(payload)
    setLoading(false)
    if (err) setError(err)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Usuario</label>
        <input
          value={form.username}
          onChange={f('username')}
          disabled={isEdit}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          placeholder="nombre_usuario"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
          Contraseña {isEdit && <span className="text-slate-400">(dejar vacío para no cambiar)</span>}
        </label>
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            value={form.password}
            onChange={f('password')}
            className="w-full px-3 py-2 pr-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            placeholder="••••••••"
          />
          <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Rol</label>
        <select
          value={form.role}
          onChange={f('role')}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        >
          <option value="usuario">Usuario</option>
          <option value="admin">Admin</option>
          <option value="superadmin">Superadmin</option>
        </select>
      </div>
      {isEdit && (
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
            className="w-4 h-4 rounded accent-indigo-600"
          />
          Usuario activo
        </label>
      )}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={12} />{error}</p>
      )}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium transition-colors">
          {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
        </button>
      </div>
    </form>
  )
}

export default function AdminPanel() {
  const { appUsers, loginLogs, fetchAppUsers, fetchLoginLogs, createAppUser, updateAppUser, deleteAppUser } = useStore()
  const [tab, setTab] = useState('users')
  const [modal, setModal] = useState(null) // null | { type: 'create' | 'edit' | 'delete', user?: {} }
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    fetchAppUsers()
    fetchLoginLogs()
  }, [])

  const refresh = async () => {
    setLoading(true)
    await Promise.all([fetchAppUsers(), fetchLoginLogs()])
    setLoading(false)
  }

  const flash = (text, type = 'ok') => {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 3000)
  }

  const handleCreate = async (data) => {
    const { error } = await createAppUser(data)
    if (error) return error.message || 'Error al crear usuario.'
    setModal(null)
    flash('Usuario creado correctamente.')
  }

  const handleEdit = async (data) => {
    const { error } = await updateAppUser(modal.user.id, data)
    if (error) return error.message || 'Error al actualizar.'
    setModal(null)
    flash('Usuario actualizado.')
  }

  const handleDelete = async () => {
    const { error } = await deleteAppUser(modal.user.id)
    if (error) { flash(error.message || 'Error al eliminar.', 'err'); return }
    setModal(null)
    flash('Usuario eliminado.')
  }

  const tabs = [
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'logs', label: 'Sesiones', icon: Monitor },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Panel de Administrador</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Gestión de usuarios y actividad del sistema</p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Flash message */}
      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${
          msg.type === 'ok'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50'
        }`}>
          {msg.type === 'ok' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === id
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── USERS TAB ── */}
      {tab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700/60">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Usuarios del sistema</h2>
              <p className="text-xs text-slate-400 mt-0.5">{appUsers.length} usuario{appUsers.length !== 1 ? 's' : ''} registrado{appUsers.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={() => setModal({ type: 'create' })}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <Plus size={13} />
              Nuevo usuario
            </button>
          </div>

          {/* Superadmin row (always shown) */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <div className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={14} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">admin</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Cuenta del sistema — no editable</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <RoleBadge role="superadmin" />
                <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle size={12} /> Activo
                </span>
              </div>
            </div>

            {appUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                      {user.username?.[0] || '?'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{user.username}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Creado {formatDate(user.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <RoleBadge role={user.role} />
                  <span className={`inline-flex items-center gap-1 text-xs ${user.is_active ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                    {user.is_active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {user.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                  <button
                    onClick={() => setModal({ type: 'edit', user })}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setModal({ type: 'delete', user })}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}

            {appUsers.length === 0 && (
              <div className="flex flex-col items-center py-10 text-slate-400">
                <Users size={28} className="mb-2 opacity-40" />
                <p className="text-sm">No hay usuarios creados todavía</p>
                <button onClick={() => setModal({ type: 'create' })} className="mt-3 text-xs text-indigo-600 hover:underline">
                  Crear primer usuario
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LOGS TAB ── */}
      {tab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700/60">
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Historial de sesiones</h2>
            <p className="text-xs text-slate-400 mt-0.5">Últimas {loginLogs.length} conexiones registradas</p>
          </div>

          {loginLogs.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-slate-400">
              <Clock size={28} className="mb-2 opacity-40" />
              <p className="text-sm">Sin sesiones registradas aún</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">Usuario</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">Rol</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1"><Globe size={11} />IP</span>
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1"><Clock size={11} />Fecha y hora</span>
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">Dispositivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/80">
                  {loginLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                              {log.username?.[0] || '?'}
                            </span>
                          </div>
                          <span className="font-medium text-slate-900 dark:text-white">{log.username}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <RoleBadge role={log.role || 'admin'} />
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                          {log.ip_address || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
                        {formatDate(log.logged_in_at)}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[200px] block" title={log.user_agent}>
                          {parseUA(log.user_agent)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MODALS ── */}
      {modal?.type === 'create' && (
        <Modal title="Crear nuevo usuario" onClose={() => setModal(null)}>
          <UserForm onSave={handleCreate} onClose={() => setModal(null)} isEdit={false} />
        </Modal>
      )}
      {modal?.type === 'edit' && (
        <Modal title={`Editar usuario: ${modal.user.username}`} onClose={() => setModal(null)}>
          <UserForm initial={modal.user} onSave={handleEdit} onClose={() => setModal(null)} isEdit />
        </Modal>
      )}
      {modal?.type === 'delete' && (
        <Modal title="Eliminar usuario" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/50">
              <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">
                ¿Eliminar el usuario <strong>{modal.user.username}</strong>? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setModal(null)} className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Cancelar
              </button>
              <button onClick={handleDelete} className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function parseUA(ua) {
  if (!ua) return '—'
  if (/iPhone|iPad/.test(ua)) return 'iOS / Safari'
  if (/Android/.test(ua)) return 'Android'
  if (/Windows/.test(ua) && /Chrome/.test(ua)) return 'Windows / Chrome'
  if (/Windows/.test(ua) && /Firefox/.test(ua)) return 'Windows / Firefox'
  if (/Mac/.test(ua) && /Safari/.test(ua) && !/Chrome/.test(ua)) return 'macOS / Safari'
  if (/Mac/.test(ua) && /Chrome/.test(ua)) return 'macOS / Chrome'
  if (/Linux/.test(ua)) return 'Linux'
  return ua.slice(0, 40) + '…'
}
