'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { getSidebarNav } from '@/lib/moduleRegistry'
import {
    Users, CheckSquare, CreditCard, BookOpen, Bell,
    Globe, Library, Briefcase, LayoutDashboard,
    LogOut, Settings, Menu, X, ChevronRight,
    UserCheck, User, Zap,
    BarChart2,
} from 'lucide-react'
import type { ModuleKey, Plan, Role } from '@/lib/moduleRegistry'
import { clsx } from 'clsx'
import { TrialBanner } from '@/components/ui/TrialBanner'
import { PWAInstallPrompt } from '../pwa/PWAInstallPrompt'

const ICON_MAP: Record<string, React.ComponentType<any>> = {
    Users, CheckSquare, CreditCard, BookOpen, Bell,
    Globe, Library, Briefcase, LayoutDashboard,
    UserCheck, User, Zap, BarChart2
}

export function SidebarLayout({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession()
    const pathname = usePathname()
    const [open, setOpen] = useState(false)

    if (!session) return null

    const role = session.user.role as Role
    const plan = (session.user.plan as Plan) ?? 'starter'
    const modules = (session.user.modules ?? []) as ModuleKey[]

    const dashHref =
        role === 'superadmin' ? '/superadmin' :
            role === 'admin' ? '/admin' :
                role === 'teacher' ? '/teacher' :
                    role === 'student' ? '/student' : '/parent'

    const navItems = getSidebarNav(modules, plan, role)

    const isActive = (href: string) =>
        pathname === href || (href !== dashHref && pathname.startsWith(href + '/'))

    const roleColors: Record<string, string> = {
        admin: 'bg-indigo-600',
        teacher: 'bg-blue-600',
        student: 'bg-purple-600',
        parent: 'bg-amber-600',
    }

    const planBadgeStyle =
        plan === 'enterprise' ? 'bg-purple-100 text-purple-700' :
            plan === 'pro' ? 'bg-indigo-100 text-indigo-700' :
                'bg-slate-100 text-slate-600'

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* School name */}
            <div className="px-4 py-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className={clsx(
                        'w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0',
                        roleColors[role] ?? 'bg-indigo-600'
                    )}>
                        {session.user.schoolName?.charAt(0) ?? 'S'}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                            {session.user.schoolName}
                        </p>
                        <p className="text-xs text-slate-400 capitalize">{role} panel</p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
                <NavItem
                    href={dashHref}
                    label="Dashboard"
                    icon={<LayoutDashboard size={16} />}
                    active={pathname === dashHref}
                />

                {navItems.map(item => {
                    const Icon = ICON_MAP[item.icon ?? ''] ?? LayoutDashboard
                    return (
                        <NavItem
                            key={item.key}
                            href={item.href ?? '#'}
                            label={item.label}
                            icon={<Icon size={16} />}
                            active={isActive(item.href ?? '')}
                        />
                    )
                })}

                {role === 'admin' && (
                    <Link
                        href="/admin/subscription"
                        className={clsx(
                            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                            pathname.startsWith('/admin/subscription')
                                ? 'bg-amber-50 text-amber-700 font-medium'
                                : 'text-slate-600 hover:bg-slate-50'
                        )}
                    >
                        <Zap
                            size={16}
                            className={pathname.startsWith('/admin/subscription') ? 'text-amber-600' : 'text-slate-400'}
                        />
                        <span className="flex-1">Subscription</span>
                        {!session.user.subscriptionId && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md">
                                Trial
                            </span>
                        )}
                    </Link>
                )}

                {role === 'admin' && (
                    <NavItem
                        href="/admin/settings"
                        label="Settings"
                        icon={<Settings size={16} />}
                        active={pathname.startsWith('/admin/settings')}
                    />
                )}
            </nav>

            {/* User + Logout */}
            <div className="px-3 py-3 border-t border-slate-100">
                <div className="flex items-center gap-3 px-3 py-2 mb-1">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-semibold flex-shrink-0">
                        {session.user.name?.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-700 truncate">{session.user.name}</p>
                        <p className="text-xs text-slate-400 capitalize">{role}</p>
                    </div>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                >
                    <LogOut size={14} />
                    Logout
                </button>
            </div>
        </div>
    )

    return (
        // ← CHANGED: added relative + z-0 to contain stacking context
        <div className="flex h-screen bg-slate-50 relative" style={{ zIndex: 0 }}>

            {/* Desktop sidebar */}
            <aside className="hidden md:flex w-60 bg-white border-r border-slate-100 flex-col flex-shrink-0">
                <SidebarContent />
            </aside>

            {/* Mobile sidebar */}
            {open && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
                    <aside className="relative w-60 h-full bg-white shadow-xl">
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* Main — ← CHANGED: added relative + z-0 to prevent children from escaping */}
            <div className="flex-1 flex flex-col min-w-0 relative" style={{ zIndex: 0 }}>

                {role === 'admin' && <TrialBanner />}

                {/* Top bar */}
                <header className="bg-white border-b border-slate-100 px-4 md:px-6 py-3 flex items-center gap-4 flex-shrink-0">
                    <button
                        onClick={() => setOpen(true)}
                        className="md:hidden text-slate-400 hover:text-slate-600"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="flex-1" />

                    {role === 'admin' && (
                        <Link href="/admin/subscription">
                            <span className={clsx(
                                'hidden sm:inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium capitalize cursor-pointer hover:opacity-80 transition-opacity',
                                planBadgeStyle
                            )}>
                                {plan} plan
                            </span>
                        </Link>
                    )}
                </header>

                {/* ← CHANGED: removed overflow-y-auto from main, added to inner div instead */}
                <main className="flex-1 relative" style={{ zIndex: 0 }}>
                    <div className="absolute inset-0 overflow-y-auto p-4 md:p-6">
                        {children}
                    </div>
                </main>
            </div>

            <PWAInstallPrompt />
        </div>
    )
}

function NavItem({ href, label, icon, active }: {
    href: string; label: string; icon: React.ReactNode; active: boolean
}) {
    return (
        <Link
            href={href}
            className={clsx(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                active ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
            )}
        >
            <span className={active ? 'text-indigo-600' : 'text-slate-400'}>{icon}</span>
            <span className="flex-1">{label}</span>
            {active && <ChevronRight size={12} className="text-indigo-400" />}
        </Link>
    )
}