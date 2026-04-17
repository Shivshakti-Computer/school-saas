// FILE: src/components/layouts/SidebarLayout.tsx
'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  Shield, Search, Lock, ChevronUp, ChevronDown,
  ChevronsUpDown,
} from 'lucide-react'
import { clsx } from 'clsx'
import { TrialBanner } from '@/components/ui/TrialBanner'
import { PWAInstallPrompt } from '../pwa/PWAInstallPrompt'
import { ChatWidget } from '../marketing/ChatWidget'
import { usePortalTheme } from '@/hooks/usePortalTheme'

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Users, CheckSquare, CreditCard, BookOpen, Bell,
  Globe, Library, Briefcase, LayoutDashboard,
  UserCheck, User, Zap, BarChart2,
  Image: ImageIcon, Clock, FileText, FileCheck,
  MessageSquare, Award, PlayCircle, Bus, Building,
  Package, UserPlus, Heart, GraduationCap,
}

const DASH_PATHS: Record<string, string> = {
  superadmin: '/superadmin',
  admin: '/admin',
  teacher: '/teacher',
  staff: '/admin',
  student: '/student',
  parent: '/parent',
}

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

function NavItem({
  href, label, icon, active, onClick,
}: {
  href: string; label: string; icon: React.ReactNode
  active: boolean; onClick?: () => void
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

function NavSection({ label }: { label: string }) {
  return <div className="portal-nav-section-label">{label}</div>
}

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  const [systemOpen, setSystemOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const userDropdownRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(e.target as Node)
      ) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    const systemPaths = [
      '/admin/subscription', '/admin/settings', '/admin/security',
      '/teacher/security', '/student/security', '/parent/security',
    ]
    const isSystemPage = systemPaths.some((p) => pathname.startsWith(p))
    if (isSystemPage) setSystemOpen(true)
  }, [pathname])

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
  const subscriptionStatus =
    (session.user as any).subscriptionStatus as string || 'trial'
  const isExpired = subscriptionStatus === 'expired'
  const isTrial = subscriptionStatus === 'trial'
  const isActive = subscriptionStatus === 'active'
  const dashHref = DASH_PATHS[role] ?? '/admin'
  const roleConfig = getRoleConfig(role)

  const schoolLogo = session.user.schoolLogo
  const schoolName = session.user.schoolName || 'School'
  const schoolInitial = schoolName.charAt(0).toUpperCase()
  const allowedModules = (session.user as any).allowedModules as string[] || []

  // ✅ FIXED: Teacher ko hamesha 'teacher' role se nav milega
  // Staff ko allowedModules ke saath staff route milega
  const navItems = isExpired
    ? []
    : role === 'staff'
      ? getSidebarNav(modules, plan, 'staff', allowedModules)
      : getSidebarNav(modules, plan, role)

  // ✅ FIXED: Teacher ke liye allowedModules check relevant nahi
  // Teacher ka nav moduleRegistry ke 'teacher' role se aata hai
  const isTeacherRestricted = false
  const isStaffNoModules = role === 'staff' && allowedModules.length === 0

  const checkActive = (href: string) =>
    pathname === href ||
    (href !== dashHref && pathname.startsWith(href + '/'))

  const userName = session.user.name || 'User'
  const userInitial = userName.charAt(0).toUpperCase()

  const planBadge = isExpired
    ? {
      text: 'Expired',
      bg: 'var(--danger-light)',
      color: 'var(--danger-dark)',
      border: 'rgba(239,68,68,0.3)',
    }
    : isTrial
      ? {
        text: 'Trial',
        bg: 'var(--warning-light)',
        color: 'var(--warning-dark)',
        border: 'rgba(245,158,11,0.3)',
      }
      : plan === 'enterprise'
        ? {
          text: 'Enterprise',
          bg: 'var(--warning-light)',
          color: 'var(--warning-dark)',
          border: 'rgba(245,158,11,0.3)',
        }
        : plan === 'pro'
          ? {
            text: 'Pro',
            bg: 'var(--primary-50)',
            color: 'var(--primary-700)',
            border: 'var(--primary-200)',
          }
          : plan === 'growth'
            ? {
              text: 'Growth',
              bg: 'var(--info-light)',
              color: 'var(--info-dark)',
              border: 'rgba(59,130,246,0.3)',
            }
            : {
              text: 'Starter',
              bg: 'var(--bg-muted)',
              color: 'var(--text-muted)',
              border: 'var(--border)',
            }

  const roleLabel = role === 'staff'
    ? `Staff${(session.user as any).staffCategory
      ? ` • ${(session.user as any).staffCategory}`
      : ''}`
    : role

  const securityHref =
    role === 'admin' || role === 'staff' ? '/admin/security'
      : role === 'teacher' ? '/teacher/security'
        : role === 'student' ? '/student/security'
          : role === 'parent' ? '/parent/security'
            : '#'

  const isSecurityActive =
    pathname.startsWith('/admin/security') ||
    pathname.startsWith('/teacher/security') ||
    pathname.startsWith('/student/security') ||
    pathname.startsWith('/parent/security')

  const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <div className="flex flex-col h-full">

      {/* ── School Branding ── */}
      <div
        className="px-4 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
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
              <span className="text-sm font-bold text-white">{schoolInitial}</span>
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

        {navItems.length > 0 && (
          <>
            <NavSection label="Modules" />
            {navItems.map((item) => {
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

        {/* ✅ Staff ke liye — koi module assign nahi hua */}
        {isStaffNoModules && !isExpired && (
          <div
            className="mx-1 my-4 p-4 rounded-xl text-center"
            style={{
              background: 'var(--bg-muted)',
              border: '1px solid var(--border)',
            }}
          >
            <Lock
              size={18}
              className="mx-auto mb-2"
              style={{ color: 'var(--text-muted)' }}
            />
            <p
              className="text-xs font-semibold"
              style={{ color: 'var(--text-secondary)' }}
            >
              No Modules Assigned
            </p>
            <p
              className="text-[0.6875rem] mt-0.5"
              style={{ color: 'var(--text-muted)' }}
            >
              Contact your administrator.
            </p>
          </div>
        )}

        {/* ✅ isTeacherRestricted ab hamesha false hai — yeh block render nahi hoga
            Lekin agar future mein teacher-specific restriction chahiye toh
            yeh block ready hai */}
        {isTeacherRestricted && navItems.length === 0 && !isExpired && (
          <div
            className="mx-1 my-4 p-4 rounded-xl text-center"
            style={{
              background: 'var(--info-light)',
              border: '1px solid rgba(59,130,246,0.2)',
            }}
          >
            <Clock
              size={18}
              className="mx-auto mb-2"
              style={{ color: 'var(--info)' }}
            />
            <p
              className="text-xs font-semibold"
              style={{ color: 'var(--info-dark)' }}
            >
              Awaiting Module Access
            </p>
            <p
              className="text-[0.6875rem] mt-0.5"
              style={{ color: 'var(--info)' }}
            >
              Your admin will assign modules soon.
            </p>
          </div>
        )}

        {isExpired && role === 'admin' && (
          <div
            className="mx-1 my-4 p-4 rounded-xl text-center"
            style={{
              background: 'var(--danger-light)',
              border: '1px solid rgba(239,68,68,0.2)',
            }}
          >
            <Zap
              size={18}
              className="mx-auto mb-2"
              style={{ color: 'var(--danger)' }}
            />
            <p
              className="text-xs font-semibold"
              style={{ color: 'var(--danger-dark)' }}
            >
              Access Blocked
            </p>
            <p
              className="text-[0.6875rem] mt-0.5"
              style={{ color: 'var(--danger)' }}
            >
              Subscription expired.
            </p>
          </div>
        )}

        {isTrial && role === 'admin' && (
          <div
            className="mx-1 my-4 p-4 rounded-xl"
            style={{
              background: 'var(--warning-light)',
              border: '1px solid rgba(245,158,11,0.3)',
            }}
          >
            <p
              className="text-xs font-semibold mb-1"
              style={{ color: 'var(--warning-dark)' }}
            >
              Free Trial Active
            </p>
            <p
              className="text-[0.6875rem] mb-2"
              style={{ color: 'var(--warning)' }}
            >
              Upgrade for full access.
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

        <div className="mt-2">
          <button
            type="button"
            onClick={() => setSystemOpen((prev) => !prev)}
            className="
              w-full flex items-center gap-2 px-2 py-1.5
              rounded-[var(--radius-md)]
              transition-colors duration-150
              hover:bg-[var(--bg-muted)]
            "
            style={{ color: 'var(--text-muted)' }}
          >
            <span className="text-[0.6875rem] font-700 uppercase tracking-wider flex-1 text-left">
              System
            </span>
            {systemOpen
              ? <ChevronUp size={12} />
              : <ChevronDown size={12} />
            }
          </button>

          {systemOpen && (
            <div className="mt-0.5 space-y-0.5">

              {(role === 'admin' || isExpired) && (
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
                      style={{
                        background: 'var(--warning-light)',
                        color: 'var(--warning-dark)',
                      }}
                    >
                      Trial
                    </span>
                  )}
                  {isActive && (
                    <span
                      className="text-[0.625rem] px-1.5 py-0.5 rounded-md font-semibold"
                      style={{
                        background: 'var(--success-light)',
                        color: 'var(--success-dark)',
                      }}
                    >
                      Active
                    </span>
                  )}
                  {isExpired && (
                    <span
                      className="text-[0.625rem] px-1.5 py-0.5 rounded-md font-semibold animate-pulse"
                      style={{
                        background: 'var(--danger-light)',
                        color: 'var(--danger-dark)',
                      }}
                    >
                      Renew
                    </span>
                  )}
                </Link>
              )}

              {role === 'admin' && !isExpired && (
                <NavItem
                  href="/admin/settings"
                  label="Settings"
                  icon={<Settings size={16} />}
                  active={pathname.startsWith('/admin/settings')}
                  onClick={onNavClick}
                />
              )}

              {!isExpired && (
                <NavItem
                  href={securityHref}
                  label="Security"
                  icon={<Shield size={16} />}
                  active={isSecurityActive}
                  onClick={onNavClick}
                />
              )}
            </div>
          )}
        </div>
      </nav>

      {/* ── User Footer ── */}
      <div
        ref={userMenuRef}
        className="flex-shrink-0"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        {userMenuOpen && (
          <div
            className="
              mx-2 mb-1
              rounded-[var(--radius-lg)]
              border overflow-hidden
            "
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {role === 'admin' && !isExpired && (
              <Link
                href="/admin/settings"
                onClick={() => {
                  setUserMenuOpen(false)
                  onNavClick?.()
                }}
                className="
                  flex items-center gap-2.5 px-3 py-2
                  text-[0.8125rem] transition-colors
                  hover:bg-[var(--bg-muted)]
                "
                style={{ color: 'var(--text-secondary)' }}
              >
                <Settings size={14} />
                Settings
              </Link>
            )}

            {role === 'admin' && (
              <Link
                href="/admin/subscription"
                onClick={() => {
                  setUserMenuOpen(false)
                  onNavClick?.()
                }}
                className="
                  flex items-center gap-2.5 px-3 py-2
                  text-[0.8125rem] transition-colors
                  hover:bg-[var(--bg-muted)]
                "
                style={{ color: 'var(--text-secondary)' }}
              >
                <Zap size={14} />
                Subscription
                {isTrial && (
                  <span
                    className="ml-auto text-[0.625rem] px-1.5 py-0.5 rounded"
                    style={{
                      background: 'var(--warning-light)',
                      color: 'var(--warning-dark)',
                    }}
                  >
                    Trial
                  </span>
                )}
              </Link>
            )}

            {!isExpired && (
              <Link
                href={securityHref}
                onClick={() => {
                  setUserMenuOpen(false)
                  onNavClick?.()
                }}
                className="
                  flex items-center gap-2.5 px-3 py-2
                  text-[0.8125rem] transition-colors
                  hover:bg-[var(--bg-muted)]
                "
                style={{ color: 'var(--text-secondary)' }}
              >
                <Shield size={14} />
                Security
              </Link>
            )}

            <div
              className="border-t"
              style={{ borderColor: 'var(--border)' }}
            />

            <button
              onClick={() => {
                setUserMenuOpen(false)
                signOut({ callbackUrl: '/login' })
              }}
              className="
                flex items-center gap-2.5 w-full px-3 py-2
                text-[0.8125rem] transition-colors
                hover:bg-[var(--danger-light)]
              "
              style={{ color: 'var(--danger)' }}
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setUserMenuOpen((prev) => !prev)}
          className="
            w-full flex items-center gap-2.5 px-3 py-3
            transition-colors duration-150
            hover:bg-[var(--bg-muted)]
          "
          style={{ backgroundColor: 'var(--bg-subtle)' }}
          title={`${userName} — Click for options`}
        >
          <div
            className="
              w-8 h-8 rounded-full flex items-center justify-center
              text-xs font-bold flex-shrink-0 text-white
            "
            style={{
              background: `linear-gradient(135deg, var(--primary-500), var(--primary-700))`,
              boxShadow: `0 1px 3px rgba(var(--primary-rgb), 0.3)`,
            }}
          >
            {userInitial}
          </div>

          <div className="min-w-0 flex-1 text-left">
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

          <ChevronsUpDown
            size={14}
            style={{ color: 'var(--text-muted)', flexShrink: 0 }}
          />
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
            className={clsx(
              'portal-mobile-sidebar md:hidden',
              isClosing && 'closing'
            )}
          >
            <button
              onClick={closeMobile}
              className="
                absolute top-3.5 right-3.5 w-8 h-8 rounded-lg
                flex items-center justify-center z-10
              "
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

        {role === 'admin' && isTrial && <TrialBanner />}

        {role === 'admin' && isExpired && (
          <div
            className="px-4 py-2.5 flex items-center justify-between flex-shrink-0"
            style={{
              background: 'linear-gradient(90deg, var(--danger), #b91c1c)',
            }}
          >
            <div
              className="flex items-center gap-2 text-sm"
              style={{ color: 'rgba(255,255,255,0.95)' }}
            >
              <X size={10} style={{ color: '#FFFFFF' }} />
              <span className="text-[0.8125rem]">
                Subscription expired. All features are blocked.
              </span>
            </div>
            <Link
              href="/admin/subscription"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold"
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
            className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: 'var(--bg-muted)',
              color: 'var(--text-muted)',
            }}
            aria-label="Open sidebar"
          >
            <Menu size={18} />
          </button>

          <div className="hidden md:flex portal-search max-w-xs flex-1">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search modules..."
              readOnly
            />
            <kbd
              className="
                hidden lg:inline-flex items-center
                px-1.5 py-0.5 text-[0.625rem] font-mono rounded
              "
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

          <div className="flex items-center gap-2.5">

            <button
              className="relative w-9 h-9 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: 'var(--bg-muted)',
                color: 'var(--text-muted)',
              }}
            >
              <Bell size={16} />
            </button>

            {(role === 'admin' || role === 'staff') && (
              <Link href={role === 'admin' ? '/admin/subscription' : '#'}>
                <span
                  className="
                    hidden sm:inline-flex items-center
                    px-2.5 py-1 rounded-lg
                    text-[0.6875rem] font-semibold capitalize
                  "
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

            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setUserDropdownOpen((prev) => !prev)}
                className="
                  flex items-center gap-2 pl-2.5 rounded-lg py-1 pr-2
                  transition-colors hover:bg-[var(--bg-muted)]
                "
                style={{ borderLeft: '1px solid var(--border)' }}
              >
                <div
                  className="
                    w-8 h-8 rounded-full flex items-center justify-center
                    text-xs font-bold text-white
                  "
                  style={{
                    background: `linear-gradient(135deg, var(--primary-500), var(--primary-700))`,
                    boxShadow: `0 1px 3px rgba(var(--primary-rgb), 0.3)`,
                  }}
                >
                  {userInitial}
                </div>
                <div className="hidden lg:block text-left">
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
                <ChevronDown
                  size={12}
                  style={{ color: 'var(--text-muted)' }}
                  className="hidden lg:block"
                />
              </button>

              {userDropdownOpen && (
                <div
                  className="
                    absolute right-0 top-full mt-1.5
                    w-48 rounded-[var(--radius-lg)]
                    border shadow-lg z-50
                    py-1 overflow-hidden
                  "
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border)',
                    boxShadow: 'var(--shadow-md)',
                  }}
                >
                  <div
                    className="px-3 py-2.5 border-b"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <p
                      className="text-xs font-600 truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {userName}
                    </p>
                    <p
                      className="text-[0.6875rem] capitalize"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {roleLabel}
                    </p>
                  </div>

                  {role === 'admin' && !isExpired && (
                    <Link
                      href="/admin/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="
                        flex items-center gap-2.5 px-3 py-2
                        text-[0.8125rem] transition-colors
                        hover:bg-[var(--bg-muted)]
                      "
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <Settings size={14} />
                      Settings
                    </Link>
                  )}

                  {role === 'admin' && (
                    <Link
                      href="/admin/subscription"
                      onClick={() => setUserDropdownOpen(false)}
                      className="
                        flex items-center gap-2.5 px-3 py-2
                        text-[0.8125rem] transition-colors
                        hover:bg-[var(--bg-muted)]
                      "
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <Zap size={14} />
                      Subscription
                      {isTrial && (
                        <span
                          className="ml-auto text-[0.625rem] px-1.5 py-0.5 rounded"
                          style={{
                            background: 'var(--warning-light)',
                            color: 'var(--warning-dark)',
                          }}
                        >
                          Trial
                        </span>
                      )}
                    </Link>
                  )}

                  {!isExpired && (
                    <Link
                      href={securityHref}
                      onClick={() => setUserDropdownOpen(false)}
                      className="
                        flex items-center gap-2.5 px-3 py-2
                        text-[0.8125rem] transition-colors
                        hover:bg-[var(--bg-muted)]
                      "
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <Shield size={14} />
                      Security
                    </Link>
                  )}

                  <div
                    className="my-1 border-t"
                    style={{ borderColor: 'var(--border)' }}
                  />

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false)
                      signOut({ callbackUrl: '/login' })
                    }}
                    className="
                      flex items-center gap-2.5 w-full px-3 py-2
                      text-[0.8125rem] transition-colors
                      hover:bg-[var(--danger-light)]
                    "
                    style={{ color: 'var(--danger)' }}
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              )}
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