'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Container } from './Container'
import { useState, useEffect, useCallback } from 'react'
import { clsx } from 'clsx'

type NavItem = {
  href: string
  label: string
  description?: string
  icon?: React.ReactNode
}

const primaryNav: NavItem[] = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
]

const productMenu: NavItem[] = [
  {
    href: '/features',
    label: 'Platform Overview',
    description: 'See everything Skolify offers',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: '/modules',
    label: 'All Modules',
    description: '20+ powerful school modules',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    href: '/security',
    label: 'Security',
    description: 'Enterprise-grade protection',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    href: '/faq',
    label: 'FAQ',
    description: 'Common questions',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
]

const communityMenu: NavItem[] = [
  {
    href: '/reviews',
    label: 'Reviews',
    description: 'What schools say',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    href: '/updates',
    label: 'Updates',
    description: 'Latest features',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    href: '/enquiry',
    label: 'Enquiry',
    description: 'Send us a query',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
]

const companyMenu: NavItem[] = [
  {
    href: '/contact',
    label: 'Contact Us',
    description: 'Get in touch',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: '/privacy',
    label: 'Privacy Policy',
    description: 'Data handling',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    href: '/terms',
    label: 'Terms of Service',
    description: 'Terms & conditions',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
      </svg>
    ),
  },
  {
    href: '/refund',
    label: 'Refund Policy',
    description: 'Refund process',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="23,4 23,10 17,10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </svg>
    ),
  },
]

function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
}

/* ─── Logo — Minimal ─── */
function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center transition-transform group-hover:scale-105">
        <span className="text-white font-bold text-sm">SF</span>
      </div>
      <div className="leading-tight">
        <div className="text-sm font-bold text-slate-900">Skolify</div>
        <div className="text-[9px] text-slate-500 font-medium">by Shivshakti CA</div>
      </div>
    </Link>
  )
}

/* ─── Nav Link — Minimal ─── */
function NavLink({ href, label, isActive }: { href: string; label: string; isActive: boolean }) {
  return (
    <Link
      href={href}
      className={clsx(
        'relative text-sm font-medium py-1 transition-colors',
        isActive ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
      )}
    >
      {label}
      {isActive && (
        <span className="absolute -bottom-px left-0 right-0 h-0.5 rounded-full bg-blue-600" />
      )}
    </Link>
  )
}

/* ─── Hamburger Icon — Minimal ─── */
function MenuIcon({ open }: { open: boolean }) {
  return (
    <div className="w-5 h-4 relative flex flex-col justify-between">
      <span
        className={clsx(
          'block h-0.5 w-5 bg-slate-700 rounded-full transition-all duration-200',
          open && 'rotate-45 translate-y-[7px]'
        )}
      />
      <span
        className={clsx(
          'block h-0.5 w-5 bg-slate-700 rounded-full transition-all duration-200',
          open && 'opacity-0'
        )}
      />
      <span
        className={clsx(
          'block h-0.5 w-5 bg-slate-700 rounded-full transition-all duration-200',
          open && '-rotate-45 -translate-y-[7px]'
        )}
      />
    </div>
  )
}

/* ─── Dropdown Menu — Minimal ─── */
function Dropdown({ label, items, pathname }: { label: string; items: NavItem[]; pathname: string }) {
  const [open, setOpen] = useState(false)
  const hasActive = items.some(item => isActivePath(pathname, item.href))

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={clsx(
          'relative text-sm font-medium py-1 transition-colors inline-flex items-center gap-1',
          hasActive ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
        )}
      >
        {label}
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          className={clsx('transition-transform duration-150', open && 'rotate-180')}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {hasActive && (
          <span className="absolute -bottom-px left-0 right-0 h-0.5 rounded-full bg-blue-600" />
        )}
      </button>

      {/* Dropdown Panel — Minimal */}
      <div
        className={clsx(
          'absolute left-1/2 -translate-x-1/2 top-full w-64 pt-2 transition-all duration-150',
          open
            ? 'opacity-100 visible translate-y-0'
            : 'opacity-0 invisible -translate-y-1 pointer-events-none'
        )}
      >
        <div className="rounded-xl border border-slate-200 bg-white p-1.5">
          {items.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-start gap-2.5 rounded-lg px-3 py-2 transition-colors group',
                isActivePath(pathname, item.href)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-700 hover:bg-slate-50'
              )}
            >
              {item.icon && (
                <span
                  className={clsx(
                    'mt-0.5 shrink-0 transition-colors',
                    isActivePath(pathname, item.href)
                      ? 'text-blue-600'
                      : 'text-slate-400 group-hover:text-blue-500'
                  )}
                >
                  {item.icon}
                </span>
              )}
              <div>
                <span className="text-sm font-medium block">{item.label}</span>
                {item.description && (
                  <span className="text-xs text-slate-500 mt-0.5 block">{item.description}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   NAVBAR COMPONENT — Minimal
   ═══════════════════════════════════════════════════════ */
export function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [mounted])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobile()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeMobile])

  const headerClasses = clsx(
    'sticky top-0 z-50 transition-all duration-200',
    mounted && scrolled
      ? 'bg-white/95 backdrop-blur-sm border-b border-slate-200'
      : 'bg-white border-b border-transparent'
  )

  return (
    <>
      <header className={headerClasses}>
        <Container>
          <div className="h-14 flex items-center justify-between gap-6">
            <Logo />

            {/* Desktop Navigation — Minimal */}
            <nav className="hidden lg:flex items-center gap-6">
              <NavLink href="/" label="Home" isActive={pathname === '/'} />

              {primaryNav.map(item => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  isActive={isActivePath(pathname, item.href)}
                />
              ))}

              <Dropdown label="Product" items={productMenu} pathname={pathname} />
              <Dropdown label="Community" items={communityMenu} pathname={pathname} />
              <Dropdown label="More" items={companyMenu} pathname={pathname} />
            </nav>

            {/* Desktop CTA Buttons — Minimal */}
            <div className="hidden lg:flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-600 hover:text-blue-600 px-3 py-1.5 rounded-lg transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg transition-colors"
              >
                Start Free Trial
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 -mr-2 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              <MenuIcon open={mobileOpen} />
            </button>
          </div>
        </Container>
      </header>

      {/* ─── Mobile Menu — Minimal ─── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            style={{ animation: 'fadeIn 0.2s ease forwards' }}
            onClick={closeMobile}
          />

          {/* Slide Panel */}
          <div
            className="absolute top-0 right-0 h-full w-[85%] max-w-sm bg-white border-l border-slate-200 flex flex-col"
            style={{ animation: 'slideUp 0.3s ease-out forwards' }}
          >
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-slate-100">
              <Logo />
              <button
                onClick={closeMobile}
                className="p-2 -mr-2 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close menu"
              >
                <MenuIcon open={true} />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto px-3 py-3">
              <div className="space-y-0.5">
                {/* Home */}
                <Link
                  href="/"
                  onClick={closeMobile}
                  className={clsx(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    pathname === '/'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  Home
                </Link>

                {/* Primary Nav */}
                {primaryNav.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobile}
                    className={clsx(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActivePath(pathname, item.href)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    {item.label}
                  </Link>
                ))}

                {/* Product Section */}
                <div className="pt-3 pb-1.5 px-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Product
                  </p>
                </div>
                {productMenu.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobile}
                    className={clsx(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActivePath(pathname, item.href)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    {item.icon && (
                      <span
                        className={clsx(
                          'shrink-0',
                          isActivePath(pathname, item.href) ? 'text-blue-600' : 'text-slate-400'
                        )}
                      >
                        {item.icon}
                      </span>
                    )}
                    {item.label}
                  </Link>
                ))}

                {/* Community Section */}
                <div className="pt-3 pb-1.5 px-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Community
                  </p>
                </div>
                {communityMenu.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobile}
                    className={clsx(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActivePath(pathname, item.href)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    {item.icon && (
                      <span className="shrink-0 text-slate-400">{item.icon}</span>
                    )}
                    {item.label}
                  </Link>
                ))}

                {/* Company Section */}
                <div className="pt-3 pb-1.5 px-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Company
                  </p>
                </div>
                {companyMenu.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobile}
                    className={clsx(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActivePath(pathname, item.href)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    {item.icon && (
                      <span
                        className={clsx(
                          'shrink-0',
                          isActivePath(pathname, item.href) ? 'text-blue-600' : 'text-slate-400'
                        )}
                      >
                        {item.icon}
                      </span>
                    )}
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>

            {/* CTA Buttons */}
            <div className="p-3 border-t border-slate-100 space-y-2">
              <Link
                href="/login"
                onClick={closeMobile}
                className="block w-full text-center py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/register"
                onClick={closeMobile}
                className="block w-full text-center py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Free Trial →
              </Link>
            </div>

            {/* Branding */}
            <div className="px-4 py-2.5 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 text-center">
                A unit of Shivshakti Computer Academy
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}