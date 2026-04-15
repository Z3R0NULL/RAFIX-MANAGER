import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  LogOut,
  Wrench,
  Moon,
  Sun,
  Smartphone,
  ShieldCheck,
  Globe,
  Users,
  BarChart2,
} from 'lucide-react'
import { useStore } from '../store/useStore'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/orders', label: 'Orders', icon: ClipboardList, end: true },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/devices', label: 'Devices', icon: Smartphone },
  { to: '/finance', label: 'Finanzas', icon: BarChart2 },
]

export default function Sidebar({ onClose }) {
  const { darkMode, toggleDarkMode, logout, auth } = useStore()
  const navigate = useNavigate()
  const isSuperAdmin = auth?.role === 'superadmin'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/60 w-64">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-200 dark:border-slate-700/60">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <Wrench size={16} className="text-white" />
        </div>
        <div>
          <p className="font-semibold text-slate-900 dark:text-white text-sm">RepairPro</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Service Manager</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Superadmin section */}
      {isSuperAdmin && (
        <div className="px-3 pb-2">
          <p className="px-3 py-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Administración
          </p>
          <NavLink
            to="/admin/dashboard"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              }`
            }
          >
            <Globe size={16} />
            Panel Global
          </NavLink>
          <NavLink
            to="/admin"
            end
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              }`
            }
          >
            <ShieldCheck size={16} />
            Usuarios
          </NavLink>
        </div>
      )}

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-slate-200 dark:border-slate-700/60 space-y-1">
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        <div className="px-3 py-2">
          <p className="text-xs text-slate-500 dark:text-slate-500">Logged in as</p>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{auth.username || 'Admin'}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  )
}
