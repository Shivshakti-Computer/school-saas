// FILE: src/components/layouts/SidebarLayout.tsx
// FIXES:
// 1. Staff dashboard path correct
// 2. Teacher with no allowedModules shows proper message
// 3. Teacher allowedModules filtering

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { getSidebarNav } from '@/lib/moduleRegistry'
import {
  Users, CheckSquare, CreditCard, BookOpen, Bell,
  Globe, Library, Briefcase, LayoutDashboard,
  LogOut, Settings, Menu, ChevronRight, X,
  UserCheck, User, Zap, BarChart2,
  Image, Clock, FileText, FileCheck, MessageSquare,
  Award, PlayCircle, Bus, Building, Package,
  UserPlus, Heart, GraduationCap,
  Shield, Search, ChevronDown, Lock,
} from 'lucide-react'
import type { ModuleKey, Plan, Role } from '@/lib/moduleRegistry'
import { clsx } from 'clsx'
import { TrialBanner } from '@/components/ui/TrialBanner'
import { PWAInstallPrompt } from '../pwa/PWAInstallPrompt'

/* ── Icon Map ── */
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Users, CheckSquare, CreditCard, BookOpen, Bell,
  Globe, Library, Briefcase, LayoutDashboard,
  UserCheck, User, Zap, BarChart2,
  Image, Clock, FileText, FileCheck, MessageSquare,
  Award, PlayCircle, Bus, Building, Package,
  UserPlus, Heart, GraduationCap,
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
    case 'admin':
      return { bg: '#2563EB', label: 'Admin Panel' }
    case 'teacher':
      return { bg: '#2563EB', label: 'Teacher Panel' }
    case 'staff':
      return { bg: '#7C3AED', label: 'Staff Panel' }
    case 'student':
      return { bg: '#7C3AED', label: 'Student Panel' }
    case 'parent':
      return { bg: '#D97706', label: 'Parent Panel' }
    default:
      return { bg: '#2563EB', label: 'Dashboard' }
  }
}

/* ── Nav Item Component ── */
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
      className={clsx(
        'portal-nav-item group',
        active && 'active'
      )}
    >
      <span className="nav-icon">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {active && (
        <ChevronRight
          size={12}
          className="text-[#2563EB] opacity-60"
        />
      )}
    </Link>
  )
}

/* ── Section Label ── */
function NavSection({ label }: { label: string }) {
  return (
    <div className="px-3 pt-5 pb-1.5">
      <span className="text-[0.625rem] font-semibold uppercase tracking-widest text-slate-300">
        {label}
      </span>
    </div>
  )
}

/* ── Arrow Right SVG ── */
function ArrowRightIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

/* ══════════════════════════════════════════════════
   MAIN SIDEBAR LAYOUT
   ══════════════════════════════════════════════════ */
export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const sidebarRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (mobileOpen) closeMobile()
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
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

  // ── Use string type to avoid Role type mismatch ──
  const role = session.user.role
  const plan = session.user.plan ?? 'starter'
  const modules = (session.user.modules ?? []) as string[]
  const subscriptionStatus = (session.user as any).subscriptionStatus as string || 'trial'
  const isExpired = subscriptionStatus === 'expired'
  const isTrial = subscriptionStatus === 'trial'
  const isActive = subscriptionStatus === 'active'
  const dashHref = DASH_PATHS[role] ?? '/admin'
  const roleConfig = getRoleConfig(role)

  // ── Staff & Teacher allowed modules from session ──
  const allowedModules = (session.user as any).allowedModules as string[] || []

  // ── Build nav items based on role ──
  // Admin: sees all modules (no filter)
  // Staff: sees only allowedModules
  // Teacher: sees default teacher modules OR only allowedModules if set
  const navItems = isExpired
    ? []
    : role === 'staff'
      ? getSidebarNav(modules, plan, role, allowedModules)
      : role === 'teacher' && allowedModules.length > 0
        ? getSidebarNav(modules, plan, 'staff', allowedModules) // Teacher with explicit permissions → filter like staff
        : getSidebarNav(modules, plan, role)

  // Check if teacher has restricted access (allowedModules set but empty means no access granted yet)
  const isTeacherRestricted = role === 'teacher' && allowedModules.length === 0
  const isStaffNoModules = role === 'staff' && allowedModules.length === 0

  const checkActive = (href: string) =>
    pathname === href || (href !== dashHref && pathname.startsWith(href + '/'))

  const userName = session.user.name || 'User'
  const schoolName = session.user.schoolName || 'School'
  const userInitial = userName.charAt(0).toUpperCase()
  const schoolInitial = schoolName.charAt(0).toUpperCase()

  // Plan badge config
  const planBadge = isExpired
    ? { text: 'Expired', bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' }
    : isTrial
      ? { text: 'Trial', bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' }
      : plan === 'enterprise'
        ? { text: 'Enterprise', bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' }
        : plan === 'pro'
          ? { text: 'Pro', bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE' }
          : plan === 'growth'
            ? { text: 'Growth', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' }
            : { text: 'Starter', bg: '#F8FAFC', color: '#475569', border: '#E2E8F0' }

  // Role label for footer
  const roleLabel = role === 'staff'
    ? `Staff${(session.user as any).staffCategory ? ` • ${(session.user as any).staffCategory}` : ''}`
    : role

  /* ── Sidebar Content ── */
  const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <div className="flex flex-col h-full">

      {/* ── School Branding ── */}
      <div className="px-4 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: roleConfig.bg, color: '#FFFFFF' }}
          >
            {schoolInitial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
              {schoolName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: '#10B981' }}
              />
              <span className="text-[0.6875rem] text-slate-400">{roleConfig.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-2.5 py-2 overflow-y-auto portal-scrollbar">

        {/* Dashboard — always visible (not expired) */}
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

        {/* ── Staff with no modules assigned ── */}
        {isStaffNoModules && !isExpired && (
          <div className="mx-1 my-4 p-4 rounded-xl text-center" style={{ background: 'linear-gradient(135deg, #F8FAFC, #F1F5F9)', border: '1px solid #E2E8F0' }}>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2.5"
              style={{ backgroundColor: '#F1F5F9' }}
            >
              <Lock size={18} style={{ color: '#94A3B8' }} />
            </div>
            <p className="text-xs font-semibold" style={{ color: '#475569' }}>
              No Modules Assigned
            </p>
            <p className="text-[0.6875rem] leading-relaxed mt-0.5" style={{ color: '#94A3B8' }}>
              Your admin has not assigned any modules to you yet. Please contact your school administrator.
            </p>
          </div>
        )}

        {/* ── Teacher with no modules — waiting for admin ── */}
        {isTeacherRestricted && navItems.length === 0 && !isExpired && (
          <div className="mx-1 my-4 p-4 rounded-xl text-center" style={{ background: 'linear-gradient(135deg, #EFF6FF, #F0F9FF)', border: '1px solid #BFDBFE' }}>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2.5"
              style={{ backgroundColor: '#DBEAFE' }}
            >
              <Clock size={18} style={{ color: '#2563EB' }} />
            </div>
            <p className="text-xs font-semibold" style={{ color: '#1E40AF' }}>
              Awaiting Module Access
            </p>
            <p className="text-[0.6875rem] leading-relaxed mt-0.5" style={{ color: '#3B82F6' }}>
              Your admin will assign modules to you soon. You can access the dashboard in the meantime.
            </p>
          </div>
        )}

        {/* Expired State */}
        {isExpired && role === 'admin' && (
          <div className="mx-1 my-4 p-4 rounded-xl text-center" style={{ background: 'linear-gradient(135deg, #FEF2F2, #FFF1F2)', border: '1px solid #FECACA' }}>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2.5"
              style={{ backgroundColor: '#FEE2E2' }}
            >
              <Zap size={18} style={{ color: '#EF4444' }} />
            </div>
            <p className="text-xs font-semibold" style={{ color: '#991B1B' }}>
              Access Blocked
            </p>
            <p className="text-[0.6875rem] leading-relaxed mt-0.5" style={{ color: '#DC2626' }}>
              Your subscription has expired. Subscribe to continue using all features.
            </p>
          </div>
        )}

        {/* Trial Info */}
        {isTrial && role === 'admin' && (
          <div className="mx-1 my-4 p-4 rounded-xl text-center" style={{ background: 'linear-gradient(135deg, #FFFBEB, #FFF7ED)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2.5"
              style={{ backgroundColor: '#FEF3C7' }}
            >
              <Clock size={18} style={{ color: '#D97706' }} />
            </div>
            <p className="text-xs font-semibold" style={{ color: '#92400E' }}>
              Free Trial Active
            </p>
            <p className="text-[0.6875rem] leading-relaxed mt-0.5" style={{ color: '#B45309' }}>
              Basic features only. Upgrade for full access to all modules.
            </p>
            <Link
              href="/admin/subscription"
              className="inline-flex items-center gap-1 mt-2.5 text-[0.6875rem] font-semibold transition-colors"
              style={{ color: '#B45309' }}
            >
              Upgrade Now <ArrowRightIcon size={10} />
            </Link>
          </div>
        )}

        {/* System Section */}
        {!isExpired && (
          <>
            <NavSection label="System" />

            {/* Subscription - admin only */}
            {role === 'admin' && (
              <Link
                href="/admin/subscription"
                onClick={onNavClick}
                className={clsx(
                  'portal-nav-item group',
                  pathname.startsWith('/admin/subscription') && 'active',
                )}
              >
                <span className="nav-icon">
                  <Zap size={16} />
                </span>
                <span className="flex-1 truncate">Subscription</span>
                {isTrial && (
                  <span
                    className="text-[0.625rem] px-1.5 py-0.5 rounded-md font-semibold"
                    style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}
                  >
                    Trial
                  </span>
                )}
                {isExpired && (
                  <span
                    className="text-[0.625rem] px-1.5 py-0.5 rounded-md font-semibold animate-pulse"
                    style={{ backgroundColor: '#FEE2E2', color: '#B91C1C' }}
                  >
                    Renew
                  </span>
                )}
                {isActive && (
                  <span
                    className="text-[0.625rem] px-1.5 py-0.5 rounded-md font-semibold"
                    style={{ backgroundColor: '#ECFDF5', color: '#047857' }}
                  >
                    Active
                  </span>
                )}
              </Link>
            )}

            {/* Settings — admin only */}
            {role === 'admin' && (
              <NavItem
                href="/admin/settings"
                label="Settings"
                icon={<Settings size={16} />}
                active={pathname.startsWith('/admin/settings')}
                onClick={onNavClick}
              />
            )}

            {/* Security — all roles */}
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

        {/* Expired — admin only system section */}
        {isExpired && role === 'admin' && (
          <>
            <NavSection label="System" />
            <Link
              href="/admin/subscription"
              onClick={onNavClick}
              className={clsx(
                'portal-nav-item group',
                pathname.startsWith('/admin/subscription') && 'active',
              )}
            >
              <span className="nav-icon"><Zap size={16} /></span>
              <span className="flex-1 truncate">Subscription</span>
              <span
                className="text-[0.625rem] px-1.5 py-0.5 rounded-md font-semibold animate-pulse"
                style={{ backgroundColor: '#FEE2E2', color: '#B91C1C' }}
              >
                Renew
              </span>
            </Link>
          </>
        )}
      </nav>

      {/* ── User Footer ── */}
      <div className="px-3 py-3 border-t border-slate-100" style={{ backgroundColor: '#FAFBFC' }}>
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg mb-1">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              background: role === 'staff'
                ? 'linear-gradient(135deg, #7C3AED, #6D28D9)'
                : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: '#FFFFFF',
              boxShadow: role === 'staff'
                ? '0 1px 3px rgba(124,58,237,0.3)'
                : '0 1px 3px rgba(37,99,235,0.3)',
            }}
          >
            {userInitial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[0.8125rem] font-medium text-slate-700 truncate leading-tight">
              {userName}
            </p>
            <p className="text-[0.6875rem] text-slate-400 capitalize leading-tight mt-0.5">
              {roleLabel}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 w-full px-2.5 py-2 text-[0.8125rem] rounded-lg transition-all duration-150 group"
          style={{ color: '#64748B' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#FEF2F2'
            e.currentTarget.style.color = '#DC2626'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#64748B'
          }}
        >
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#F8FAFC' }}>

      {/* ═══ Desktop Sidebar ═══ */}
      <aside
        className="hidden md:flex w-[16.5rem] flex-col flex-shrink-0"
        style={{
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #F1F5F9',
        }}
      >
        <SidebarContent />
      </aside>

      {/* ═══ Mobile Sidebar Overlay ═══ */}
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
              style={{ backgroundColor: '#F1F5F9', color: '#94A3B8' }}
              aria-label="Close sidebar"
            >
              <X size={16} />
            </button>
            <SidebarContent onNavClick={closeMobile} />
          </aside>
        </>
      )}

      {/* ═══ Main Content Area ═══ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Trial Banner ── */}
        {role === 'admin' && isTrial && <TrialBanner />}

        {/* ── Expired Banner ── */}
        {role === 'admin' && isExpired && (
          <div
            className="px-4 py-2.5 flex items-center justify-between flex-shrink-0"
            style={{ background: 'linear-gradient(90deg, #DC2626, #B91C1C)' }}
          >
            <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.95)' }}>
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
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #F1F5F9',
            height: '3.75rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
            style={{ backgroundColor: '#F8FAFC', color: '#64748B' }}
            aria-label="Open sidebar"
          >
            <Menu size={18} />
          </button>

          <div className="hidden md:flex portal-search max-w-xs flex-1">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search modules..."
              className="bg-transparent"
              readOnly
            />
            <kbd
              className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[0.625rem] font-mono rounded"
              style={{
                color: '#94A3B8',
                backgroundColor: '#F1F5F9',
                border: '1px solid #E2E8F0',
              }}
            >
              ⌘K
            </kbd>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2.5">
            <button
              className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
              style={{ backgroundColor: '#F8FAFC', color: '#94A3B8' }}
            >
              <Bell size={16} />
            </button>

            {/* Plan Badge — admin & staff */}
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
                style={{ backgroundColor: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE' }}
              >
                Staff
              </span>
            )}

            <div className="hidden md:flex items-center gap-2 pl-2.5" style={{ borderLeft: '1px solid #F1F5F9' }}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: role === 'staff'
                    ? 'linear-gradient(135deg, #7C3AED, #6D28D9)'
                    : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  color: '#FFFFFF',
                  boxShadow: role === 'staff'
                    ? '0 1px 3px rgba(124,58,237,0.3)'
                    : '0 1px 3px rgba(37,99,235,0.3)',
                }}
              >
                {userInitial}
              </div>
              <div className="hidden lg:block">
                <p className="text-[0.8125rem] font-medium text-slate-700 leading-tight">
                  {userName}
                </p>
                <p className="text-[0.625rem] text-slate-400 capitalize leading-tight">
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
        </main>
      </div>

      <PWAInstallPrompt />
    </div>
  )
}