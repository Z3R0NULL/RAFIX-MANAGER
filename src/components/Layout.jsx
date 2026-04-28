import React, { useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import { useStore } from '../store/useStore'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const businessName = useStore((s) => s.settings?.businessName || 'RAFIX')

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-50 flex-shrink-0">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-700/60">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-800"
          >
            <Menu size={20} />
          </button>
          <span className="font-semibold text-white text-sm">{businessName}</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  )
}
