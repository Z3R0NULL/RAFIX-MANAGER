import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  LogOut,
  Wrench,
  Smartphone,
  ShieldCheck,
  Globe,
  Users,
  BarChart2,
  Package,
  Truck,
} from 'lucide-react'
import { useStore } from '../store/useStore'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/orders', label: 'Ordenes', icon: ClipboardList, end: true },
  { to: '/clients', label: 'Clientes', icon: Users },
  { to: '/devices', label: 'Dispositivos', icon: Smartphone },
  { to: '/finance', label: 'Finanzas', icon: BarChart2 },
  { to: '/inventory', label: 'Inventario', icon: Package },
  { to: '/suppliers', label: 'Proveedores', icon: Truck },
]

export default function Sidebar({ onClose }) {
  const { logout, auth } = useStore()
  const navigate = useNavigate()
  const isSuperAdmin = auth?.role === 'superadmin'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-900/30 text-indigo-400'
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
    }`

  const adminNavLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-purple-900/30 text-purple-400'
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
    }`

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-700/60 w-64">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/60">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <Wrench size={15} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-sm tracking-tight">RAFIX</p>
          <p className="text-[11px] text-slate-500 font-medium">Service Manager</p>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        <p className="px-3 mb-2 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
          Principal
        </p>
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={navLinkClass}
          >
            <Icon size={16} className="flex-shrink-0" />
            <span className="flex-1">{label}</span>
          </NavLink>
        ))}

        {/* Superadmin section */}
        {isSuperAdmin && (
          <div className="pt-4">
            <p className="px-3 mb-2 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
              Administración
            </p>
            <NavLink to="/admin/dashboard" onClick={onClose} className={adminNavLinkClass}>
              <Globe size={16} className="flex-shrink-0" />
              <span className="flex-1">Panel Global</span>
            </NavLink>
            <NavLink to="/admin" end onClick={onClose} className={adminNavLinkClass}>
              <ShieldCheck size={16} className="flex-shrink-0" />
              <span className="flex-1">Usuarios</span>
            </NavLink>
          </div>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-slate-700/60 space-y-1">
        {/* User info card */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800/60 mb-2">
          <div className="w-7 h-7 rounded-full bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-indigo-400 uppercase">
              {auth?.username?.[0] || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{auth?.username || 'Admin'}</p>
            <p className="text-[11px] text-slate-400 capitalize">{auth?.role || 'usuario'}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
        >
          <LogOut size={16} className="flex-shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
