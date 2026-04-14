// FILE: src/components/layouts/SidebarLayout.tsx
// ═══════════════════════════════════════════════════════════
// CHANGES:
// 1. usePortalTheme hook add kiya — theme apply on mount
// 2. School logo session se show karna
// 3. CSS variables use karein hardcoded colors ki jagah
// 4. Backward compatible — koi existing functionality nahi todi
// ═══════════════════════════════════════════════════════════

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { getSidebarNav } from '@/lib/moduleRegistry'
import {
  Users, CheckSquare, CreditCard, BookOpen, Bell,
  Globe, Library, Briefcase, LayoutDashboard,
  LogOut, Settings, Menu, ChevronRight, X,
  UserCheck, User, Zap, BarChart2,
  Image as ImageIcon, Clock, FileText, FileCheck,
  MessageSquare, Award, PlayCircle, Bus, Building,
  Package, UserPlus, Heart, GraduationCap,
  Shield, Search, Lock, Building2,
} from 'lucide-react'
import { clsx } from 'clsx'
import { TrialBanner } from '@/components/ui/TrialBanner'
import { PWAInstallPrompt } from '../pwa/PWAInstallPrompt'
import { ChatWidget } from '../marketing/ChatWidget'
import { usePortalTheme } from '@/hooks/usePortalTheme'

/* ── Icon Map ── */
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Users, CheckSquare, CreditCard, BookOpen, Bell,
  Globe, Library, Briefcase, LayoutDashboard,
  UserCheck, User, Zap, BarChart2,
  Image: ImageIcon, Clock, FileText, FileCheck,
  MessageSquare, Award, PlayCircle, Bus, Building,
  Package, UserPlus, Heart, GraduationCap,
}

/* ── Role Dash Paths ── */
const DASH_PATHS: Record<string, string> = {
  superadmin: '/superadmin',
  admin: '/admin',
  teacher: '/teacher',
  staff: '/admin',
  student: '/student',
  parent: '/parent',
}

/* ── Role Config ── */
function getRoleConfig(role: string) {
  switch (role) {
    case 'admin': return { label: 'Admin Panel' }
    case 'teacher': return { label: 'Teacher Panel' }
    case 'staff': return { label: 'Staff Panel' }
    case 'student': return { label: 'Student Panel' }
    case 'parent': return { label: 'Parent Panel' }
    default: return { label: 'Dashboard' }
  }
}

/* ── Nav Item ── */
function NavItem({
  href,
  label,
  icon,
  active,
  onClick,
}: {
  href: string
  label: string
  icon: React.ReactNode
  active: boolean
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={clsx('portal-nav-item group', active && 'active')}
    >
      <span className="nav-icon">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {active && (
        <ChevronRight size={12} className="text-[var(--primary-500)] opacity-60" />
      )}
    </Link>
  )
}

/* ── Section Label ── */
function NavSection({ label }: { label: string }) {
  return <div className="portal-nav-section-label">{label}</div>
}

/* ════════════════════════════════════════════════════════
   MAIN SIDEBAR LAYOUT
   ════════════════════════════════════════════════════════ */
export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const sidebarRef = useRef<HTMLElement>(null)

  // ── Theme Hook — session se initial values ──
  usePortalTheme({
    schoolId: session?.user?.tenantId || '',
    primaryColor: (session?.user as any)?.theme?.primary,
    accentColor: (session?.user as any)?.theme?.secondary,
    darkMode: 'light',
  })

  useEffect(() => {
    if (mobileOpen) closeMobile()
  }, [pathname]) // eslint-disable-line

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const closeMobile = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      setMobileOpen(false)
      setIsClosing(false)
    }, 200)
  }, [])

  if (!session) return null

  const role = session.user.role
  const plan = session.user.plan ?? 'starter'
  const modules = (session.user.modules ?? []) as string[]
  const subscriptionStatus = (session.user as any).subscriptionStatus as string || 'trial'
  const isExpired = subscriptionStatus === 'expired'
  const isTrial = subscriptionStatus === 'trial'
  const isActive = subscriptionStatus === 'active'
  const dashHref = DASH_PATHS[role] ?? '/admin'
  const roleConfig = getRoleConfig(role)

  // ── School Logo from session ──
  const schoolLogo = session.user.schoolLogo
  const schoolName = session.user.schoolName || 'School'
  const schoolInitial = schoolName.charAt(0).toUpperCase()

  const allowedModules = (session.user as any).allowedModules as string[] || []

  const navItems = isExpired
    ? []
    : role === 'staff'
      ? getSidebarNav(modules, plan, role, allowedModules)
      : role === 'teacher' && allowedModules.length > 0
        ? getSidebarNav(modules, plan, 'staff', allowedModules)
        : getSidebarNav(modules, plan, role)

  const isTeacherRestricted = role === 'teacher' && allowedModules.length === 0
  const isStaffNoModules = role === 'staff' && allowedModules.length === 0

  const checkActive = (href: string) =>
    pathname === href ||
    (href !== dashHref && pathname.startsWith(href + '/'))

  const userName = session.user.name || 'User'
  const userInitial = userName.charAt(0).toUpperCase()

  // Plan badge
  const planBadge = isExpired
    ? { text: 'Expired', bg: 'var(--danger-light)', color: 'var(--danger-dark)', border: 'rgba(239,68,68,0.3)' }
    : isTrial
      ? { text: 'Trial', bg: 'var(--warning-light)', color: 'var(--warning-dark)', border: 'rgba(245,158,11,0.3)' }
      : plan === 'enterprise'
        ? { text: 'Enterprise', bg: 'var(--warning-light)', color: 'var(--warning-dark)', border: 'rgba(245,158,11,0.3)' }
        : plan === 'pro'
          ? { text: 'Pro', bg: 'var(--primary-50)', color: 'var(--primary-700)', border: 'var(--primary-200)' }
          : plan === 'growth'
            ? { text: 'Growth', bg: 'var(--info-light)', color: 'var(--info-dark)', border: 'rgba(59,130,246,0.3)' }
            : { text: 'Starter', bg: 'var(--bg-muted)', color: 'var(--text-muted)', border: 'var(--border)' }

  const roleLabel = role === 'staff'
    ? `Staff${(session.user as any).staffCategory ? ` • ${(session.user as any).staffCategory}` : ''}`
    : role

  /* ── Sidebar Content ── */
  const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <div className="flex flex-col h-full">

      {/* ── School Branding ── */}
      <div
        className="px-4 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          {/* Logo or Initial */}
          <div
            className="
              w-10 h-10 rounded-xl flex-shrink-0
              flex items-center justify-center
              overflow-hidden
            "
            style={{
              background: schoolLogo
                ? 'var(--bg-muted)'
                : 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
              border: '1px solid var(--border)',
            }}
          >
            {schoolLogo ? (
              <img
                src={schoolLogo}
                alt={schoolName}
                className="w-full h-full object-contain p-0.5"
              />
            ) : (
              <span className="text-sm font-bold text-white">
                {schoolInitial}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-semibold truncate leading-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {schoolName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: 'var(--success)' }}
              />
              <span
                className="text-[0.6875rem]"
                style={{ color: 'var(--text-muted)' }}
              >
                {roleConfig.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-2.5 py-2 overflow-y-auto portal-scrollbar">

        {/* Dashboard */}
        {!isExpired && (
          <>
            <NavSection label="Main" />
            <NavItem
              href={dashHref}
              label="Dashboard"
              icon={<LayoutDashboard size={16} />}
              active={pathname === dashHref}
              onClick={onNavClick}
            />
          </>
        )}

        {/* Module Navigation */}
        {navItems.length > 0 && (
          <>
            <NavSection label="Modules" />
            {navItems.map(item => {
              const Icon = ICON_MAP[item.icon ?? ''] ?? LayoutDashboard
              return (
                <NavItem
                  key={item.key}
                  href={item.href ?? '#'}
                  label={item.label}
                  icon={<Icon size={16} />}
                  active={checkActive(item.href ?? '')}
                  onClick={onNavClick}
                />
              )
            })}
          </>
        )}

        {/* Staff with no modules */}
        {isStaffNoModules && !isExpired && (
          <div
            className="mx-1 my-4 p-4 rounded-xl text-center"
            style={{
              background: 'var(--bg-muted)',
              border: '1px solid var(--border)',
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2.5"
              style={{ background: 'var(--bg-muted)' }}
            >
              <Lock size={18} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p
              className="text-xs font-semibold"
              style={{ color: 'var(--text-secondary)' }}
            >
              No Modules Assigned
            </p>
            <p
              className="text-[0.6875rem] leading-relaxed mt-0.5"
              style={{ color: 'var(--text-muted)' }}
            >
              Contact your administrator to get access.
            </p>
          </div>
        )}

        {/* Teacher restricted */}
        {isTeacherRestricted && navItems.length === 0 && !isExpired && (
          <div
            className="mx-1 my-4 p-4 rounded-xl text-center"
            style={{
              background: 'var(--info-light)',
              border: '1px solid rgba(59,130,246,0.2)',
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2.5"
              style={{ background: 'rgba(59,130,246,0.1)' }}
            >
              <Clock size={18} style={{ color: 'var(--info)' }} />
            </div>
            <p
              className="text-xs font-semibold"
              style={{ color: 'var(--info-dark)' }}
            >
              Awaiting Module Access
            </p>
            <p
              className="text-[0.6875rem] leading-relaxed mt-0.5"
              style={{ color: 'var(--info)' }}
            >
              Your admin will assign modules soon.
            </p>
          </div>
        )}

        {/* Expired */}
        {isExpired && role === 'admin' && (
          <div
            className="mx-1 my-4 p-4 rounded-xl text-center"
            style={{
              background: 'var(--danger-light)',
              border: '1px solid rgba(239,68,68,0.2)',
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2.5"
              style={{ background: 'rgba(239,68,68,0.1)' }}
            >
              <Zap size={18} style={{ color: 'var(--danger)' }} />
            </div>
            <p className="text-xs font-semibold" style={{ color: 'var(--danger-dark)' }}>
              Access Blocked
            </p>
            <p className="text-[0.6875rem] leading-relaxed mt-0.5" style={{ color: 'var(--danger)' }}>
              Subscription expired.
            </p>
          </div>
        )}

        {/* Trial info */}
        {isTrial && role === 'admin' && (
          <div
            className="mx-1 my-4 p-4 rounded-xl text-center"
            style={{
              background: 'var(--warning-light)',
              border: '1px solid rgba(245,158,11,0.3)',
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2.5"
              style={{ background: 'rgba(245,158,11,0.1)' }}
            >
              <Clock size={18} style={{ color: 'var(--warning)' }} />
            </div>
            <p className="text-xs font-semibold" style={{ color: 'var(--warning-dark)' }}>
              Free Trial Active
            </p>
            <p className="text-[0.6875rem] leading-relaxed mt-0.5 mb-2" style={{ color: 'var(--warning)' }}>
              Basic features only. Upgrade for full access.
            </p>
            <Link
              href="/admin/subscription"
              className="text-[0.6875rem] font-semibold"
              style={{ color: 'var(--warning-dark)' }}
            >
              Upgrade Now →
            </Link>
          </div>
        )}

        {/* System Section */}
        {!isExpired && (
          <>
            <NavSection label="System" />

            {role === 'admin' && (
              <Link
                href="/admin/subscription"
                onClick={onNavClick}
                className={clsx(
                  'portal-nav-item group',
                  pathname.startsWith('/admin/subscription') && 'active'
                )}
              >
                <span className="nav-icon"><Zap size={16} /></span>
                <span className="flex-1 truncate">Subscription</span>
                {isTrial && (
                  <span
                    className="text-[0.625rem] px-1.5 py-0.5 rounded-md font-semibold"
                    style={{ background: 'var(--warning-light)', color: 'var(--warning-dark)' }}
                  >
                    Trial
                  </span>
                )}
                {isActive && (
                  <span
                    className="text-[0.625rem] px-1.5 py-0.5 rounded-md font-semibold"
                    style={{ background: 'var(--success-light)', color: 'var(--success-dark)' }}
                  >
                    Active
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
                onClick={onNavClick}
              />
            )}

            <NavItem
              href={
                role === 'admin' || role === 'staff' ? '/admin/security'
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
              onClick={onNavClick}
            />
          </>
        )}

        {/* Expired — subscription only */}
        {isExpired && role === 'admin' && (
          <>
            <NavSection label="System" />
            <Link
              href="/admin/subscription"
              onClick={onNavClick}
              className={clsx(
                'portal-nav-item group',
                pathname.startsWith('/admin/subscription') && 'active'
              )}
            >
              <span className="nav-icon"><Zap size={16} /></span>
              <span className="flex-1 truncate">Subscription</span>
              <span
                className="text-[0.625rem] px-1.5 py-0.5 rounded-md font-semibold animate-pulse"
                style={{ background: 'var(--danger-light)', color: 'var(--danger-dark)' }}
              >
                Renew
              </span>
            </Link>
          </>
        )}
      </nav>

      {/* ── User Footer ── */}
      <div
        className="px-3 py-3 flex-shrink-0"
        style={{
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--bg-subtle)',
        }}
      >
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg mb-1">
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
            style={{
              background: role === 'staff'
                ? 'linear-gradient(135deg, var(--role-student), #6d28d9)'
                : 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
              boxShadow: `0 1px 3px rgba(var(--primary-rgb), 0.3)`,
            }}
          >
            {userInitial}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-[0.8125rem] font-medium truncate leading-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {userName}
            </p>
            <p
              className="text-[0.6875rem] capitalize leading-tight mt-0.5"
              style={{ color: 'var(--text-muted)' }}
            >
              {roleLabel}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="
            flex items-center gap-2 w-full px-2.5 py-2
            text-[0.8125rem] rounded-lg
            transition-all duration-150 group
          "
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.backgroundColor = 'var(--danger-light)'
            el.style.color = 'var(--danger)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.backgroundColor = 'transparent'
            el.style.color = 'var(--text-muted)'
          }}
        >
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--portal-bg)' }}
    >

      {/* ═══ Desktop Sidebar ═══ */}
      <aside
        className="hidden md:flex w-[var(--sidebar-width)] flex-col flex-shrink-0"
        style={{
          backgroundColor: 'var(--portal-sidebar-bg)',
          borderRight: '1px solid var(--border)',
        }}
      >
        <SidebarContent />
      </aside>

      {/* ═══ Mobile Overlay ═══ */}
      {mobileOpen && (
        <>
          <div
            className={clsx(
              'portal-overlay md:hidden',
              isClosing && 'closing'
            )}
            onClick={closeMobile}
            aria-hidden="true"
          />
          <aside
            ref={sidebarRef}
            className={clsx(
              'portal-mobile-sidebar md:hidden',
              isClosing && 'closing'
            )}
          >
            <button
              onClick={closeMobile}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-lg flex items-center justify-center z-10 transition-colors"
              style={{
                backgroundColor: 'var(--bg-muted)',
                color: 'var(--text-muted)',
              }}
              aria-label="Close sidebar"
            >
              <X size={16} />
            </button>
            <SidebarContent onNavClick={closeMobile} />
          </aside>
        </>
      )}

      {/* ═══ Main Content ═══ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Trial Banner */}
        {role === 'admin' && isTrial && <TrialBanner />}

        {/* Expired Banner */}
        {role === 'admin' && isExpired && (
          <div
            className="px-4 py-2.5 flex items-center justify-between flex-shrink-0"
            style={{ background: 'linear-gradient(90deg, var(--danger), #b91c1c)' }}
          >
            <div
              className="flex items-center gap-2 text-sm"
              style={{ color: 'rgba(255,255,255,0.95)' }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <X size={10} style={{ color: '#FFFFFF' }} />
              </div>
              <span className="text-[0.8125rem]">
                Subscription expired. All features are blocked.
              </span>
            </div>
            <Link
              href="/admin/subscription"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.25)',
              }}
            >
              Subscribe Now
            </Link>
          </div>
        )}

        {/* ── Header Bar ── */}
        <header
          className="px-4 md:px-6 flex items-center gap-3 flex-shrink-0"
          style={{
            backgroundColor: 'var(--portal-header-bg)',
            borderBottom: '1px solid var(--border)',
            height: 'var(--header-height)',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
            style={{
              backgroundColor: 'var(--bg-muted)',
              color: 'var(--text-muted)',
            }}
            aria-label="Open sidebar"
          >
            <Menu size={18} />
          </button>

          {/* Search */}
          <div className="hidden md:flex portal-search max-w-xs flex-1">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search modules..."
              readOnly
            />
            <kbd
              className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[0.625rem] font-mono rounded"
              style={{
                color: 'var(--text-muted)',
                backgroundColor: 'var(--bg-muted)',
                border: '1px solid var(--border)',
              }}
            >
              ⌘K
            </kbd>
          </div>

          <div className="flex-1" />

          {/* Header Right */}
          <div className="flex items-center gap-2.5">
            {/* Notification bell */}
            <button
              className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
              style={{
                backgroundColor: 'var(--bg-muted)',
                color: 'var(--text-muted)',
              }}
            >
              <Bell size={16} />
            </button>

            {/* Plan badge */}
            {(role === 'admin' || role === 'staff') && (
              <Link href={role === 'admin' ? '/admin/subscription' : '#'}>
                <span
                  className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-lg text-[0.6875rem] font-semibold capitalize transition-all"
                  style={{
                    backgroundColor: planBadge.bg,
                    color: planBadge.color,
                    border: `1px solid ${planBadge.border}`,
                  }}
                >
                  <Zap size={10} style={{ marginRight: '4px' }} />
                  {planBadge.text}
                </span>
              </Link>
            )}

            {/* Staff badge */}
            {role === 'staff' && (
              <span
                className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[0.625rem] font-semibold"
                style={{
                  backgroundColor: 'var(--primary-50)',
                  color: 'var(--primary-700)',
                  border: '1px solid var(--primary-200)',
                }}
              >
                Staff
              </span>
            )}

            {/* User avatar + name */}
            <div
              className="hidden md:flex items-center gap-2 pl-2.5"
              style={{ borderLeft: '1px solid var(--border)' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{
                  background: `linear-gradient(135deg, var(--primary-500), var(--primary-700))`,
                  boxShadow: `0 1px 3px rgba(var(--primary-rgb), 0.3)`,
                }}
              >
                {userInitial}
              </div>
              <div className="hidden lg:block">
                <p
                  className="text-[0.8125rem] font-medium leading-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {userName}
                </p>
                <p
                  className="text-[0.625rem] capitalize leading-tight"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {roleLabel}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 overflow-y-auto portal-main-scroll">
          <div className="p-4 md:p-6 portal-content-enter">
            {children}
          </div>
          <ChatWidget />
        </main>
      </div>

      <PWAInstallPrompt />
    </div>
  )
}