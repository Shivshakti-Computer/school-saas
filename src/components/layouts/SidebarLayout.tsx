// FILE: src/components/layouts/SidebarLayout.tsx
// ═══════════════════════════════════════════════════════════
// ✅ UPDATED: Settings + Subscription + Security under one roof
// ✅ BACKWARD COMPATIBLE — All existing logic preserved
// ═══════════════════════════════════════════════════════════

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
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
  Shield, Lock, ChevronUp, ChevronDown,
  ChevronsUpDown, Sparkles, TrendingUp, Crown,
  Star, Flame,
} from 'lucide-react'
import { clsx } from 'clsx'
import { TrialBanner } from '@/components/ui/TrialBanner'
import { PWAInstallPrompt } from '../pwa/PWAInstallPrompt'
import { ChatWidget } from '../marketing/ChatWidget'
import { usePortalTheme } from '@/hooks/usePortalTheme'

/* ─────────────────────────────────────────────────────────
   ICON MAP
───────────────────────────────────────────────────────── */
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Users, CheckSquare, CreditCard, BookOpen, Bell,
  Globe, Library, Briefcase, LayoutDashboard,
  UserCheck, User, Zap, BarChart2,
  Image: ImageIcon, Clock, FileText, FileCheck,
  MessageSquare, Award, PlayCircle, Bus, Building,
  Package, UserPlus, Heart, GraduationCap,
}

/* ─────────────────────────────────────────────────────────
   DASH PATHS
───────────────────────────────────────────────────────── */
const DASH_PATHS: Record<string, string> = {
  superadmin: '/superadmin',
  admin: '/admin',
  teacher: '/teacher',
  staff: '/admin',
  student: '/student',
  parent: '/parent',
}

/* ─────────────────────────────────────────────────────────
   ROLE CONFIG
───────────────────────────────────────────────────────── */
function getRoleConfig(role: string) {
  switch (role) {
    case 'admin':
      return {
        label: 'Admin Panel',
        gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        iconBg: 'rgba(99,102,241,0.1)',
        iconColor: '#6366f1',
        dotColor: '#6366f1',
      }
    case 'teacher':
      return {
        label: 'Teacher Panel',
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        iconBg: 'rgba(16,185,129,0.1)',
        iconColor: '#10b981',
        dotColor: '#10b981',
      }
    case 'staff':
      return {
        label: 'Staff Panel',
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        iconBg: 'rgba(59,130,246,0.1)',
        iconColor: '#3b82f6',
        dotColor: '#3b82f6',
      }
    case 'student':
      return {
        label: 'Student Panel',
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        iconBg: 'rgba(139,92,246,0.1)',
        iconColor: '#8b5cf6',
        dotColor: '#8b5cf6',
      }
    case 'parent':
      return {
        label: 'Parent Panel',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        iconBg: 'rgba(245,158,11,0.1)',
        iconColor: '#f59e0b',
        dotColor: '#f59e0b',
      }
    default:
      return {
        label: 'Dashboard',
        gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        iconBg: 'rgba(99,102,241,0.1)',
        iconColor: '#6366f1',
        dotColor: '#6366f1',
      }
  }
}

/* ─────────────────────────────────────────────────────────
   NAV ITEM
───────────────────────────────────────────────────────── */
function NavItem({
  href,
  label,
  icon,
  active,
  onClick,
  badge,
}: {
  href: string
  label: string
  icon: React.ReactNode
  active: boolean
  onClick?: () => void
  badge?: number | string
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={clsx(
        'group relative flex items-center gap-2.5 px-2.5 py-1.75 rounded-lg transition-all duration-150',
        active
          ? 'bg-gradient-to-r from-[var(--primary-50)] to-transparent'
          : 'hover:bg-[var(--bg-muted)]'
      )}
      style={active ? {
        borderLeft: '2.5px solid var(--primary-500)',
        paddingLeft: 'calc(0.625rem - 2.5px)',
      } : undefined}
    >
      <div
        className={clsx(
          'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-150',
          active ? 'scale-105' : 'group-hover:scale-105'
        )}
        style={{
          background: active ? 'var(--primary-100)' : 'var(--bg-subtle)',
          color: active ? 'var(--primary-600)' : 'var(--text-muted)',
          boxShadow: active ? '0 1px 4px rgba(99,102,241,0.15)' : 'none',
        }}
      >
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={clsx(
            'text-[0.8125rem] font-semibold truncate leading-tight transition-colors',
            active ? 'text-[var(--primary-700)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
          )}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {label}
        </p>
      </div>

      {badge ? (
        <span
          className="px-1.5 py-0.5 rounded-md text-[0.5625rem] font-bold flex-shrink-0"
          style={{
            background: active ? 'var(--primary-500)' : 'var(--bg-muted)',
            color: active ? '#fff' : 'var(--text-muted)',
          }}
        >
          {badge}
        </span>
      ) : active ? (
        <div
          className="w-1 h-1 rounded-full flex-shrink-0"
          style={{ background: 'var(--primary-500)' }}
        />
      ) : null}

      {!active && (
        <div
          className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(99,102,241,0.03) 0%, transparent 70%)',
          }}
        />
      )}
    </Link>
  )
}

/* ─────────────────────────────────────────────────────────
   NAV SECTION LABEL
───────────────────────────────────────────────────────── */
function NavSection({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 mt-3 mb-0.5">
      <span
        className="text-[0.625rem] font-bold uppercase tracking-widest flex-shrink-0"
        style={{
          color: 'var(--text-light)',
          fontFamily: 'var(--font-display)',
        }}
      >
        {label}
      </span>
      <div
        className="flex-1 h-px"
        style={{
          background: 'linear-gradient(90deg, var(--border) 0%, transparent 100%)',
        }}
      />
    </div>
  )
}

/* ═════════════════════════════════════════════════════════
   SIDEBAR LAYOUT — MAIN EXPORT
═════════════════════════════════════════════════════════ */
export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  // ✅ FIX: Logo error state (instead of innerHTML)
  const [logoError, setLogoError] = useState(false)

  const userDropdownRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // ✅ FIX: Reset logo error when logo URL changes
  useEffect(() => {
    setLogoError(false)
  }, [session?.user?.schoolLogo])

  /* ── usePortalTheme ── */
  usePortalTheme({
    schoolId: session?.user?.tenantId || '',
    primaryColor: (session?.user as any)?.theme?.primary,
    accentColor: (session?.user as any)?.theme?.secondary,
    darkMode: 'light',
  })

  /* ── Effects ── */
  useEffect(() => {
    if (mobileOpen) closeMobile()
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node))
        setUserDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // ✅ REMOVED: systemOpen useEffect (no longer needed)

  const closeMobile = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => { setMobileOpen(false); setIsClosing(false) }, 200)
  }, [])

  if (!session) return null

  /* ── Session data ── */
  const role = session.user.role
  const plan = session.user.plan ?? 'starter'
  const modules = (session.user.modules ?? []) as string[]
  const subscriptionStatus = (session.user as any).subscriptionStatus as string || 'trial'
  const isExpired = subscriptionStatus === 'expired'
  const isTrial = subscriptionStatus === 'trial'
  const isActive = subscriptionStatus === 'active'
  const dashHref = DASH_PATHS[role] ?? '/admin'
  const roleConfig = getRoleConfig(role)
  const schoolLogo = session.user.schoolLogo
  const schoolName = session.user.schoolName || 'School'
  const schoolInitial = schoolName.charAt(0).toUpperCase()
  const allowedModules = (session.user as any).allowedModules as string[] || []

  /* ── Nav items ── */
  const navItems = isExpired
    ? []
    : role === 'staff'
      ? getSidebarNav(modules, plan, 'staff', allowedModules)
      : getSidebarNav(modules, plan, role)

  const isTeacherRestricted = false
  const isStaffNoModules = role === 'staff' && allowedModules.length === 0

  const checkActive = (href: string) =>
    pathname === href || (href !== dashHref && pathname.startsWith(href + '/'))

  const userName = session.user.name || 'User'
  const userInitial = userName.charAt(0).toUpperCase()

  /* ── Plan badge ── */
  const planBadge = isExpired
    ? { text: 'Expired', icon: X, bg: 'var(--danger-light)', color: 'var(--danger-dark)', border: 'rgba(239,68,68,0.3)' }
    : isTrial
      ? { text: 'Trial', icon: Sparkles, bg: 'var(--warning-light)', color: 'var(--warning-dark)', border: 'rgba(245,158,11,0.3)' }
      : plan === 'enterprise'
        ? { text: 'Enterprise', icon: Crown, bg: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#fff', border: 'transparent' }
        : plan === 'pro'
          ? { text: 'Pro', icon: Star, bg: 'var(--primary-50)', color: 'var(--primary-700)', border: 'var(--primary-200)' }
          : plan === 'growth'
            ? { text: 'Growth', icon: TrendingUp, bg: 'var(--info-light)', color: 'var(--info-dark)', border: 'rgba(59,130,246,0.3)' }
            : { text: 'Starter', icon: Zap, bg: 'var(--bg-muted)', color: 'var(--text-muted)', border: 'var(--border)' }

  /* ── Role label ── */
  const roleLabel = role === 'staff'
    ? `Staff${(session.user as any).staffCategory ? ` • ${(session.user as any).staffCategory}` : ''}`
    : role

  /* ── Security & Subscription href — UPDATED for Settings tab ── */
  const securityHref = '/admin/settings?tab=security'
  const subscriptionHref = '/admin/settings?tab=subscription'  // ← ADD THIS

  const isSecurityActive = pathname.startsWith('/admin/settings') &&
    searchParams.get('tab') === 'security'

  const isSubscriptionActive = pathname.startsWith('/admin/settings') &&
    searchParams.get('tab') === 'subscription'  // ← ADD THIS

  /* ═══════════════════════════════════════════════════
     SIDEBAR CONTENT
  ═══════════════════════════════════════════════════ */
  const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <div className="flex flex-col h-full">

      {/* ══ SCHOOL BRANDING ══ */}
      <div
        className="px-4 pt-5 pb-4 flex-shrink-0 relative overflow-hidden"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-5 pointer-events-none"
          style={{ background: roleConfig.gradient }}
        />

        <div className="relative flex items-start gap-3">
          {/* Logo */}
          <div className="relative flex-shrink-0">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden relative"
              style={{
                background: schoolLogo && !logoError ? 'var(--bg-card)' : roleConfig.gradient,
                border: '2px solid var(--border)',
                boxShadow: `0 4px 12px ${roleConfig.iconColor}25`,
              }}
            >
              {/* ✅ FIX: Proper React conditional rendering */}
              {schoolLogo && !logoError ? (
                <img
                  src={schoolLogo}
                  alt={schoolName}
                  className="w-full h-full object-contain p-1"
                  onError={() => {
                    console.error('[SidebarLayout] Logo load failed:', schoolLogo)
                    setLogoError(true)
                  }}
                  onLoad={() => {
                    console.log('[SidebarLayout] Logo loaded:', schoolLogo)
                  }}
                />
              ) : (
                <span
                  className="text-lg font-black text-white"
                  style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}
                >
                  {schoolInitial}
                </span>
              )}
            </div>

            {/* Animated pulse ring */}
            <div
              className="absolute -inset-1 rounded-2xl animate-pulse"
              style={{
                background: `radial-gradient(circle, ${roleConfig.iconColor}20 0%, transparent 70%)`,
                pointerEvents: 'none',
              }}
            />

            {/* Status indicator */}
            <div className="absolute -bottom-1 -right-1 flex items-center justify-center">
              <span
                className="w-4 h-4 rounded-full border-2 relative"
                style={{
                  background: roleConfig.dotColor,
                  borderColor: 'var(--portal-sidebar-bg)',
                  boxShadow: `0 0 8px ${roleConfig.dotColor}60`,
                }}
              >
                <span
                  className="absolute inset-0 rounded-full animate-ping"
                  style={{ background: roleConfig.dotColor, opacity: 0.4 }}
                />
              </span>
            </div>
          </div>

          {/* School info */}
          <div className="flex-1 min-w-0 pt-0.5">
            <p
              className="text-base font-black truncate leading-tight mb-1.5"
              style={{
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.02em',
              }}
            >
              {schoolName}
            </p>

            {/* Role badge */}
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
              style={{
                background: roleConfig.iconBg,
                border: `1px solid ${roleConfig.iconColor}30`,
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: roleConfig.iconColor }}
              />
              <span
                className="text-[0.6875rem] font-bold uppercase tracking-wide"
                style={{
                  color: roleConfig.iconColor,
                  fontFamily: 'var(--font-display)',
                }}
              >
                {roleConfig.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ══ NAV ══ */}
      <nav className="flex-1 px-2.5 py-3 overflow-y-auto portal-scrollbar">

        {/* Dashboard */}
        {!isExpired && (
          <div className="mb-1">
            <NavItem
              href={dashHref}
              label="Dashboard"
              icon={<LayoutDashboard size={15} />}
              active={pathname === dashHref}
              onClick={onNavClick}
            />
          </div>
        )}

        {/* Modules */}
        {navItems.length > 0 && (
          <>
            <NavSection label="Modules" />
            <div className="space-y-0.5">
              {navItems.map(item => {
                const Icon = ICON_MAP[item.icon ?? ''] ?? LayoutDashboard
                return (
                  <NavItem
                    key={item.key}
                    href={item.href ?? '#'}
                    label={item.label}
                    icon={<Icon size={15} />}
                    active={checkActive(item.href ?? '')}
                    onClick={onNavClick}
                  />
                )
              })}
            </div>
          </>
        )}

        {/* Empty states */}
        {isStaffNoModules && !isExpired && (
          <div
            className="mx-1 my-3 p-3.5 rounded-xl text-center relative overflow-hidden"
            style={{
              background: 'var(--bg-subtle)',
              border: '2px dashed var(--border-strong)',
            }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-2"
              style={{
                background: 'var(--bg-muted)',
                border: '1px solid var(--border)',
              }}
            >
              <Lock size={16} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p
              className="text-xs font-bold mb-0.5"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
            >
              No Modules Assigned
            </p>
            <p className="text-[0.6875rem] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Contact your administrator
            </p>
          </div>
        )}

        {isTeacherRestricted && navItems.length === 0 && !isExpired && (
          <div
            className="mx-1 my-3 p-3.5 rounded-xl text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.05), rgba(59,130,246,0.02))',
              border: '1px solid rgba(59,130,246,0.2)',
            }}
          >
            <Clock size={16} className="mx-auto mb-2" style={{ color: 'var(--info)' }} />
            <p
              className="text-xs font-bold mb-0.5"
              style={{ color: 'var(--info-dark)', fontFamily: 'var(--font-display)' }}
            >
              Awaiting Access
            </p>
            <p className="text-[0.6875rem]" style={{ color: 'var(--info)' }}>
              Modules will be assigned soon
            </p>
          </div>
        )}

        {isExpired && role === 'admin' && (
          <div
            className="mx-1 my-3 p-3.5 rounded-xl text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.03))',
              border: '1px solid rgba(239,68,68,0.25)',
            }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-2"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <Zap size={16} style={{ color: 'var(--danger)' }} />
            </div>
            <p
              className="text-xs font-bold mb-0.5"
              style={{ color: 'var(--danger-dark)', fontFamily: 'var(--font-display)' }}
            >
              Access Blocked
            </p>
            <p className="text-[0.6875rem]" style={{ color: 'var(--danger)' }}>
              Subscription expired
            </p>
          </div>
        )}

        {/* Trial upgrade card */}
        {isTrial && role === 'admin' && (
          <div
            className="mx-1 my-3 p-3 rounded-xl relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(249,115,22,0.04) 100%)',
              border: '1px solid rgba(245,158,11,0.25)',
            }}
          >
            <div
              className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, var(--warning), transparent)' }}
            />

            <div className="relative">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles size={12} style={{ color: 'var(--warning)' }} />
                <p
                  className="text-[0.625rem] font-bold uppercase tracking-wide"
                  style={{ color: 'var(--warning-dark)', fontFamily: 'var(--font-display)' }}
                >
                  Trial Active
                </p>
              </div>
              <p className="text-[0.6875rem] mb-2 leading-relaxed" style={{ color: 'var(--warning)' }}>
                Upgrade to unlock all features
              </p>
              <Link
                href="/admin/subscription"
                className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg font-bold text-[0.6875rem] transition-all hover:scale-105"
                style={{
                  background: 'var(--warning)',
                  color: '#fff',
                  boxShadow: '0 2px 6px rgba(245,158,11,0.25)',
                }}
              >
                <Flame size={10} />
                Upgrade Now
              </Link>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
   SYSTEM SECTION — UPDATED
   Clean structure: Settings + Subscription + Security
══════════════════════════════════════════════════ */}
        <div
          className="mt-3 pt-2"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          {/* Settings — All config under one roof (admin only) */}
          {role === 'admin' && !isExpired && (
            <NavItem
              href="/admin/settings"
              label="Settings"
              icon={<Settings size={15} />}
              active={pathname.startsWith('/admin/settings')}
              onClick={onNavClick}
            />
          )}

          {/* Subscription — Quick access (admin only) — UPDATED */}
          {(role === 'admin' || isExpired) && (
            <NavItem
              href={subscriptionHref}  // ← CHANGE: /admin/subscription → subscriptionHref
              label="Subscription"
              icon={<Zap size={15} />}
              active={isSubscriptionActive}  // ← CHANGE: pathname → isSubscriptionActive
              onClick={onNavClick}
              badge={
                isTrial ? 'Trial' : isActive ? 'Active' : isExpired ? 'Renew' : undefined
              }
            />
          )}

          {/* Security — All roles (now under Settings tab) */}
          {!isExpired && (
            <NavItem
              href={securityHref}
              label="Security"
              icon={<Shield size={15} />}
              active={isSecurityActive}
              onClick={onNavClick}
            />
          )}
        </div>
      </nav>

      {/* ══ USER FOOTER ══ */}
      <div
        ref={userMenuRef}
        className="flex-shrink-0 relative"
        style={{
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-subtle)',
        }}
      >
        {userMenuOpen && (
          <div
            className="absolute bottom-full left-2 right-2 mb-2 rounded-2xl border overflow-hidden"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border)',
              boxShadow: 'var(--shadow-xl)',
              animation: 'slideUp 0.2s cubic-bezier(0.16,1,0.3,1) forwards',
            }}
          >
            <div
              className="px-4 py-3 flex items-center gap-3"
              style={{
                background: roleConfig.gradient,
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="text-sm font-bold text-white truncate"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {userName}
                </p>
                <p className="text-xs text-white/80 capitalize truncate">
                  {roleLabel}
                </p>
              </div>
            </div>

            <div className="py-1.5">
  {role === 'admin' && !isExpired && (
    <Link
      href="/admin/settings"  // ✅ Keep as is
      onClick={() => { setUserMenuOpen(false); onNavClick?.() }}
      className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--bg-muted)]"
      style={{ color: 'var(--text-secondary)' }}
    >
      <Settings size={15} style={{ color: 'var(--text-muted)' }} />
      Settings
    </Link>
  )}

  {role === 'admin' && (
    <Link
      href={subscriptionHref}  // ← CHANGE: /admin/subscription → subscriptionHref
      onClick={() => { setUserMenuOpen(false); onNavClick?.() }}
      className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--bg-muted)]"
      style={{ color: 'var(--text-secondary)' }}
    >
      <Zap size={15} style={{ color: 'var(--text-muted)' }} />
      Subscription
      {isTrial && (
        <span
          className="ml-auto px-2 py-0.5 rounded-md text-[0.5625rem] font-bold"
          style={{ background: 'var(--warning-light)', color: 'var(--warning-dark)' }}
        >
          Trial
        </span>
      )}
    </Link>
  )}

  {!isExpired && (
    <Link
      href={securityHref}  // ✅ Already correct
      onClick={() => { setUserMenuOpen(false); onNavClick?.() }}
      className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--bg-muted)]"
      style={{ color: 'var(--text-secondary)' }}
    >
      <Shield size={15} style={{ color: 'var(--text-muted)' }} />
      Security
    </Link>
  )}
</div>

            <div className="border-t py-1.5" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: '/login' }) }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors hover:bg-[var(--danger-light)]"
                style={{ color: 'var(--danger)' }}
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setUserMenuOpen(prev => !prev)}
          className="w-full flex items-center gap-3 px-4 py-3.5 transition-all duration-200 hover:bg-[var(--bg-muted)] group"
        >
          <div className="relative flex-shrink-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white transition-transform group-hover:scale-105"
              style={{
                background: roleConfig.gradient,
                boxShadow: `0 4px 12px ${roleConfig.iconColor}30`,
              }}
            >
              {userInitial}
            </div>
            <div
              className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                background: `radial-gradient(circle, ${roleConfig.iconColor}15 0%, transparent 70%)`,
              }}
            />
          </div>

          <div className="flex-1 min-w-0 text-left">
            <p
              className="text-sm font-bold truncate leading-tight"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
            >
              {userName}
            </p>
            <p
              className="text-[0.6875rem] capitalize truncate mt-0.5"
              style={{ color: 'var(--text-muted)' }}
            >
              {roleLabel}
            </p>
          </div>

          <div
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[0.5625rem] font-bold flex-shrink-0"
            style={{
              background: typeof planBadge.bg === 'string' && planBadge.bg.startsWith('linear')
                ? planBadge.bg
                : planBadge.bg,
              color: planBadge.color,
              border: `1px solid ${planBadge.border}`,
              boxShadow: plan === 'enterprise' ? '0 2px 8px rgba(245,158,11,0.3)' : 'none',
            }}
          >
            <planBadge.icon size={9} />
            <span>{planBadge.text}</span>
          </div>

          <div
            className="transition-transform duration-200 flex-shrink-0"
            style={{
              transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              color: 'var(--text-muted)',
            }}
          >
            <ChevronUp size={14} />
          </div>
        </button>
      </div>
    </div>
  )

  /* ═══════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════ */
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--portal-bg)' }}
    >
      <aside
        className="hidden md:flex w-[var(--sidebar-width)] flex-col flex-shrink-0"
        style={{
          background: 'var(--portal-sidebar-bg)',
          borderRight: '1px solid var(--border)',
        }}
      >
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <>
          <div
            className={clsx('portal-overlay md:hidden', isClosing && 'closing')}
            onClick={closeMobile}
            aria-hidden="true"
          />
          <aside className={clsx('portal-mobile-sidebar md:hidden', isClosing && 'closing')}>
            <button
              onClick={closeMobile}
              className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center z-10 transition-colors"
              style={{
                background: 'var(--bg-muted)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
              }}
              aria-label="Close sidebar"
            >
              <X size={16} />
            </button>
            <SidebarContent onNavClick={closeMobile} />
          </aside>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {role === 'admin' && isTrial && <TrialBanner />}

        {role === 'admin' && isExpired && (
          <div
            className="px-4 py-3 flex items-center justify-between flex-shrink-0"
            style={{ background: 'linear-gradient(90deg, var(--danger), #b91c1c)' }}
          >
            <div className="flex items-center gap-2.5" style={{ color: 'rgba(255,255,255,0.95)' }}>
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.15)' }}
              >
                <X size={12} style={{ color: '#fff' }} />
              </div>
              <span className="text-sm font-medium">
                Subscription expired. All features are blocked.
              </span>
            </div>
            <Link
              href="/admin/subscription"
              className="px-4 py-2 rounded-lg text-sm font-bold transition-transform hover:scale-105"
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              Subscribe Now
            </Link>
          </div>
        )}

        <header
          className="flex items-center gap-4 px-5 md:px-6 flex-shrink-0"
          style={{
            background: 'var(--portal-header-bg)',
            borderBottom: '1px solid var(--border)',
            height: 'var(--header-height)',
          }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
            style={{
              background: 'var(--bg-muted)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
            aria-label="Open sidebar"
          >
            <Menu size={18} />
          </button>

          <div className="flex-1 min-w-0">
            <p
              className="text-lg font-bold truncate"
              style={{
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.015em',
              }}
            />
          </div>

          <div className="flex items-center gap-2.5">
            <button
              className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-[var(--bg-muted)]"
              style={{ color: 'var(--text-muted)' }}
              title="Notifications"
            >
              <Bell size={17} />
              <span
                className="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse"
                style={{
                  background: 'var(--danger)',
                  boxShadow: '0 0 4px var(--danger)',
                }}
              />
            </button>

            {(role === 'admin' || role === 'staff') && (
              <Link href={role === 'admin' ? '/admin/subscription' : '#'}>
                <div
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                  style={{
                    background: typeof planBadge.bg === 'string' && planBadge.bg.startsWith('linear')
                      ? planBadge.bg
                      : planBadge.bg,
                    color: planBadge.color,
                    border: `1px solid ${planBadge.border}`,
                    boxShadow: plan === 'enterprise' ? '0 2px 8px rgba(245,158,11,0.3)' : 'none',
                  }}
                >
                  <planBadge.icon size={11} />
                  <span className="text-[0.6875rem] font-bold">
                    {planBadge.text}
                  </span>
                </div>
              </Link>
            )}

            <div className="w-px h-6 hidden sm:block" style={{ background: 'var(--border)' }} />

            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(prev => !prev)}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl transition-all hover:bg-[var(--bg-muted)]"
                style={{
                  border: userDropdownOpen ? '1.5px solid var(--primary-200)' : '1.5px solid transparent',
                  background: userDropdownOpen ? 'var(--primary-50)' : undefined,
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{
                    background: roleConfig.gradient,
                    boxShadow: `0 2px 6px ${roleConfig.iconColor}30`,
                  }}
                >
                  {userInitial}
                </div>

                <div className="hidden lg:block text-left">
                  <p
                    className="text-sm font-bold leading-tight"
                    style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
                  >
                    {userName}
                  </p>
                  <p className="text-[0.6875rem] capitalize" style={{ color: 'var(--text-muted)' }}>
                    {roleLabel}
                  </p>
                </div>

                <div
                  className="hidden lg:block transition-transform duration-150"
                  style={{
                    transform: userDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <ChevronDown size={13} />
                </div>
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-56 rounded-2xl border overflow-hidden z-50"
                  style={{
                    background: 'var(--bg-card)',
                    borderColor: 'var(--border)',
                    boxShadow: 'var(--shadow-xl)',
                    animation: 'slideDown 0.18s cubic-bezier(0.16,1,0.3,1) forwards',
                  }}
                >
                  <div
                    className="px-4 py-3.5 flex items-center gap-3"
                    style={{ background: roleConfig.gradient }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: '2px solid rgba(255,255,255,0.3)',
                      }}
                    >
                      {userInitial}
                    </div>
                    <div className="min-w-0">
                      <p
                        className="text-sm font-bold text-white truncate"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {userName}
                      </p>
                      <p className="text-xs text-white/80 capitalize">
                        {roleLabel}
                      </p>
                    </div>
                  </div>

                  <div className="py-1.5">
  {role === 'admin' && !isExpired && (
    <Link
      href="/admin/settings"  // ✅ Keep as is
      onClick={() => setUserDropdownOpen(false)}
      className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--bg-muted)]"
      style={{ color: 'var(--text-secondary)' }}
    >
      <Settings size={15} style={{ color: 'var(--text-muted)' }} />
      Settings
    </Link>
  )}

  {role === 'admin' && (
    <Link
      href={subscriptionHref}  // ← CHANGE: /admin/subscription → subscriptionHref
      onClick={() => setUserDropdownOpen(false)}
      className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--bg-muted)]"
      style={{ color: 'var(--text-secondary)' }}
    >
      <Zap size={15} style={{ color: 'var(--text-muted)' }} />
      Subscription
      {isTrial && (
        <span
          className="ml-auto px-2 py-0.5 rounded-md text-[0.5625rem] font-bold"
          style={{ background: 'var(--warning-light)', color: 'var(--warning-dark)' }}
        >
          Trial
        </span>
      )}
    </Link>
  )}

  {!isExpired && (
    <Link
      href={securityHref}  // ✅ Already correct
      onClick={() => setUserDropdownOpen(false)}
      className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--bg-muted)]"
      style={{ color: 'var(--text-secondary)' }}
    >
      <Shield size={15} style={{ color: 'var(--text-muted)' }} />
      Security
    </Link>
  )}
</div>

                  <div className="border-t py-1.5" style={{ borderColor: 'var(--border)' }}>
                    <button
                      onClick={() => { setUserDropdownOpen(false); signOut({ callbackUrl: '/login' }) }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors hover:bg-[var(--danger-light)]"
                      style={{ color: 'var(--danger)' }}
                    >
                      <LogOut size={15} />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

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