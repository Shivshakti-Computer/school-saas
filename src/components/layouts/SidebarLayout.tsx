'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { getSidebarNav } from '@/lib/moduleRegistry'
import {
  Users, CheckSquare, CreditCard, BookOpen, Bell,
  Globe, Library, Briefcase, LayoutDashboard,
  LogOut, Settings, Menu, ChevronRight,
  UserCheck, User, Zap, BarChart2,
  Image, Clock, FileText, FileCheck, MessageSquare,
  Award, PlayCircle, Bus, Building, Package,
  UserPlus, Heart, GraduationCap,
  Shield,
} from 'lucide-react'
import type { ModuleKey, Plan, Role } from '@/lib/moduleRegistry'
import { clsx } from 'clsx'
import { TrialBanner } from '@/components/ui/TrialBanner'
import { PWAInstallPrompt } from '../pwa/PWAInstallPrompt'

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Users, CheckSquare, CreditCard, BookOpen, Bell,
  Globe, Library, Briefcase, LayoutDashboard,
  UserCheck, User, Zap, BarChart2,
  Image, Clock, FileText, FileCheck, MessageSquare,
  Award, PlayCircle, Bus, Building, Package,
  UserPlus, Heart, GraduationCap,
}

function NavItem({
  href, label, icon, active,
}: {
  href: string; label: string; icon: React.ReactNode; active: boolean
}) {
  return (
    <Link
      href={href}
      className={clsx(
        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
        active
          ? 'bg-indigo-50 text-indigo-700 font-medium'
          : 'text-slate-600 hover:bg-slate-50'
      )}
    >
      <span className={active ? 'text-indigo-600' : 'text-slate-400'}>
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {active && <ChevronRight size={12} className="text-indigo-400" />}
    </Link>
  )
}

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!session) return null

  const role = session.user.role as Role
  const plan = (session.user.plan as Plan) ?? 'starter'
  const modules = (session.user.modules ?? []) as ModuleKey[]

  // ── Subscription status from JWT (refreshed every 30s from DB) ──
  const subscriptionStatus = (session.user as any).subscriptionStatus as string || 'trial'
  const isExpired = subscriptionStatus === 'expired'
  const isTrial = subscriptionStatus === 'trial'
  const isActive = subscriptionStatus === 'active'

  const dashHref =
    role === 'superadmin' ? '/superadmin'
      : role === 'admin' ? '/admin'
        : role === 'teacher' ? '/teacher'
          : role === 'student' ? '/student'
            : '/parent'

  // ── Nav items based on subscription status ──
  // Expired → empty (only subscription link visible)
  // Trial → only starter modules
  // Active → plan ke modules
  const navItems = isExpired
    ? []
    : getSidebarNav(modules, plan, role)

  const checkActive = (href: string) =>
    pathname === href || (href !== dashHref && pathname.startsWith(href + '/'))

  const roleColors: Record<string, string> = {
    admin: 'bg-indigo-600',
    teacher: 'bg-blue-600',
    student: 'bg-purple-600',
    parent: 'bg-amber-600',
  }

  // ── Plan badge in header ──
  const planBadgeClass =
    isExpired ? 'bg-red-100 text-red-700'
      : isTrial ? 'bg-amber-100 text-amber-700'
        : plan === 'enterprise' ? 'bg-amber-100 text-amber-700'
          : plan === 'pro' ? 'bg-purple-100 text-purple-700'
            : plan === 'growth' ? 'bg-indigo-100 text-indigo-700'
              : 'bg-slate-100 text-slate-600'

  const planBadgeText =
    isExpired ? 'Expired'
      : isTrial ? 'Trial'
        : `${plan} plan`

  /* ── Sidebar Content ── */
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* School header */}
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

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">

        {/* Dashboard — always visible (even when expired, it redirects via middleware) */}
        {!isExpired && (
          <NavItem
            href={dashHref}
            label="Dashboard"
            icon={<LayoutDashboard size={16} />}
            active={pathname === dashHref}
          />
        )}

        {/* Module nav items — empty when expired */}
        {navItems.map(item => {
          const Icon = ICON_MAP[item.icon ?? ''] ?? LayoutDashboard
          return (
            <NavItem
              key={item.key}
              href={item.href ?? '#'}
              label={item.label}
              icon={<Icon size={16} />}
              active={checkActive(item.href ?? '')}
            />
          )
        })}

        {/* Expired message */}
        {isExpired && role === 'admin' && (
          <div className="mx-1 my-3 p-3 bg-red-50 border border-red-200 rounded-xl text-center">
            <p className="text-xs text-red-800 font-semibold mb-1">
              ⚠️ Access Blocked
            </p>
            <p className="text-[11px] text-red-600 leading-relaxed">
              Subscription expired. Subscribe to continue using all features.
            </p>
          </div>
        )}

        {/* Trial info */}
        {isTrial && role === 'admin' && (
          <div className="mx-1 my-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <p className="text-xs text-amber-800 font-semibold mb-1">
              ⏱️ Free Trial
            </p>
            <p className="text-[11px] text-amber-600 leading-relaxed">
              Basic features only. Subscribe for full access.
            </p>
          </div>
        )}

        {/* Subscription link — admin only */}
        {role === 'admin' && (
          <Link
            href="/admin/subscription"
            className={clsx(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname.startsWith('/admin/subscription')
                ? 'bg-amber-50 text-amber-700 font-medium'
                : isExpired
                  ? 'bg-red-50 text-red-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            <Zap
              size={16}
              className={
                pathname.startsWith('/admin/subscription')
                  ? 'text-amber-600'
                  : isExpired
                    ? 'text-red-600'
                    : 'text-slate-400'
              }
            />
            <span className="flex-1">Subscription</span>
            {isTrial && (
              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md">
                Trial
              </span>
            )}
            {isExpired && (
              <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md animate-pulse">
                Expired
              </span>
            )}
            {isActive && (
              <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md">
                Active
              </span>
            )}
          </Link>
        )}

        {/* Settings — only when not expired */}
        {role === 'admin' && !isExpired && (
          <NavItem
            href="/admin/settings"
            label="Settings"
            icon={<Settings size={16} />}
            active={pathname.startsWith('/admin/settings')}
          />
        )}

        {/* Security — ALL ROLES, not expired */}
        {!isExpired && (
          <NavItem
            href={
              role === 'admin' ? '/admin/security'
                : role === 'teacher' ? '/teacher/security'
                  : role === 'student' ? '/student/security'
                    : role === 'parent' ? '/parent/security'
                      : '#'
            }
            label="Security"
            icon={<Shield size={16} />}
            active={
              pathname.startsWith('/admin/security') ||
              pathname.startsWith('/teacher/security') ||
              pathname.startsWith('/student/security') ||
              pathname.startsWith('/parent/security')
            }
          />
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-semibold flex-shrink-0">
            {session.user.name?.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-700 truncate">
              {session.user.name}
            </p>
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
    <div className="flex h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-white border-r border-slate-100 flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-60 h-full bg-white shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Trial banner — only show during active trial, not expired */}
        {role === 'admin' && isTrial && <TrialBanner />}

        {/* Expired banner — full width red */}
        {role === 'admin' && isExpired && (
          <div className="bg-red-600 px-4 py-2.5 flex items-center justify-between text-sm text-white">
            <div className="flex items-center gap-2">
              <span>❌</span>
              <span>Subscription expired. All features are blocked.</span>
            </div>
            <Link
              href="/admin/subscription"
              className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-xs font-medium transition-colors"
            >
              Subscribe Now
            </Link>
          </div>
        )}

        {/* Top bar */}
        <header className="bg-white border-b border-slate-100 px-4 md:px-6 py-3 flex items-center gap-4 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden text-slate-400 hover:text-slate-600"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          {role === 'admin' && (
            <Link href="/admin/subscription">
              <span className={clsx(
                'hidden sm:inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium capitalize cursor-pointer hover:opacity-80 transition-opacity',
                planBadgeClass
              )}>
                {planBadgeText}
              </span>
            </Link>
          )}
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>

      <PWAInstallPrompt />
    </div>
  )
}