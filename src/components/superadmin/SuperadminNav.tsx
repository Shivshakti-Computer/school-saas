'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { clsx } from 'clsx'
import { useState } from 'react'
import {
  LayoutDashboard, Building2, CreditCard, BarChart3,
  Settings, LogOut, Menu, X, Shield
} from 'lucide-react'

const navItems = [
  { href: '/superadmin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/superadmin/schools', label: 'Schools', icon: Building2 },
  { href: '/superadmin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/superadmin/revenue', label: 'Revenue', icon: BarChart3 },
  { href: '/superadmin/settings', label: 'Settings', icon: Settings },
]

export function SuperadminNav({ userName }: { userName: string }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <header className="bg-slate-900 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="h-14 flex items-center gap-4">
            {/* Logo */}
            <Link href="/superadmin" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <Shield size={14} className="text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-sm font-bold">VidyaFlow</span>
                <span className="text-[10px] text-slate-400 ml-1">Superadmin</span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1 ml-6">
              {navItems.map(item => {
                const isActive = pathname === item.href ||
                  (item.href !== '/superadmin' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors',
                      isActive
                        ? 'bg-slate-800 text-white font-medium'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    )}
                  >
                    <item.icon size={14} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* Right side */}
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden sm:block text-xs text-slate-400">{userName}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
              <button
                className="md:hidden text-slate-400 hover:text-white p-1.5"
                onClick={() => setMobileOpen(true)}
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 h-full bg-slate-900 p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-white">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="text-slate-400">
                <X size={18} />
              </button>
            </div>
            <nav className="space-y-1">
              {navItems.map(item => {
                const isActive = pathname === item.href ||
                  (item.href !== '/superadmin' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={clsx(
                      'flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-colors',
                      isActive
                        ? 'bg-slate-800 text-white font-medium'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    )}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="mt-6 flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-lg w-full"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      )}
    </>
  )
}