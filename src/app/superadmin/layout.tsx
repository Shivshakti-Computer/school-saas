// =============================================================
// FILE: src/app/superadmin/layout.tsx
// Superadmin ka alag layout — sidebar nahi, simple nav
// =============================================================
 
import { getServerSession } from 'next-auth'
import { redirect }         from 'next/navigation'
import { authOptions }      from '@/lib/auth'
import Link                 from 'next/link'
 
export default async function SuperadminLayout({
  children,
}: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'superadmin') redirect('/login')
 
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <header className="bg-slate-900 text-white px-6 py-3 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center text-xs font-bold">S</div>
          <span className="text-sm font-semibold">Superadmin</span>
        </div>
        <nav className="flex gap-1">
          {[
            { href: '/superadmin',         label: 'Dashboard' },
            { href: '/superadmin/schools', label: 'Schools' },
            { href: '/superadmin/revenue', label: 'Revenue' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto text-xs text-slate-400">
          {session.user.name} · Superadmin
        </div>
      </header>
 
      <main className="p-6">{children}</main>
    </div>
  )
}
 