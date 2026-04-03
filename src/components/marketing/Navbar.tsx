// FILE: src/components/marketing/Navbar.tsx

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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    href: '/security',
    label: 'Security',
    description: 'Enterprise-grade data protection',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    href: '/faq',
    label: 'FAQ',
    description: 'Common questions answered',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    description: 'See what schools say about us',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    href: '/updates',
    label: 'Updates',
    description: 'Latest features and announcements',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    href: '/enquiry',
    label: 'Enquiry',
    description: 'Send us your query',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
]

const companyMenu: NavItem[] = [
  {
    href: '/contact',
    label: 'Contact Us',
    description: 'Get in touch with our team',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: '/privacy',
    label: 'Privacy Policy',
    description: 'How we handle your data',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    href: '/terms',
    label: 'Terms of Service',
    description: 'Terms & conditions',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    href: '/refund',
    label: 'Refund Policy',
    description: 'Our refund process',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

/* ─── Logo ─── */
function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-brand">
        <span className="text-white font-extrabold text-sm tracking-tight">SF</span>
      </div>
      <div className="leading-tight">
        <div className="text-sm font-extrabold text-slate-900 tracking-tight">
          Skolify
        </div>
        <div className="text-[10px] text-slate-400 font-medium">
          by Shivshakti Computer Academy
        </div>
      </div>
    </Link>
  )
}

/* ─── Nav Link ─── */
function NavLink({
  href,
  label,
  isActive,
}: {
  href: string
  label: string
  isActive: boolean
}) {
  return (
    <Link
      href={href}
      className={clsx(
        'relative text-[13.5px] font-semibold py-1 transition-colors duration-200',
        isActive
          ? 'text-brand-600'
          : 'text-slate-500 hover:text-slate-900'
      )}
    >
      {label}
      {isActive && (
        <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] rounded-full bg-brand-600" />
      )}
    </Link>
  )
}

/* ─── Hamburger Icon ─── */
function MenuIcon({ open }: { open: boolean }) {
  return (
    <div className="w-5 h-4 relative flex flex-col justify-between">
      <span
        className={clsx(
          'block h-[2px] w-5 bg-slate-600 rounded-full transition-all duration-300 origin-center',
          open && 'rotate-45 translate-y-[7px]'
        )}
      />
      <span
        className={clsx(
          'block h-[2px] w-5 bg-slate-600 rounded-full transition-all duration-300',
          open && 'opacity-0 scale-0'
        )}
      />
      <span
        className={clsx(
          'block h-[2px] w-5 bg-slate-600 rounded-full transition-all duration-300 origin-center',
          open && '-rotate-45 -translate-y-[7px]'
        )}
      />
    </div>
  )
}

/* ─── Dropdown Menu ─── */
function Dropdown({
  label,
  items,
  pathname,
}: {
  label: string
  items: NavItem[]
  pathname: string
}) {
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
          'relative text-[13.5px] font-semibold py-1 transition-colors duration-200 inline-flex items-center gap-1',
          hasActive
            ? 'text-brand-600'
            : 'text-slate-500 hover:text-slate-900'
        )}
      >
        {label}
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          className={clsx('transition-transform duration-200', open && 'rotate-180')}
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {hasActive && (
          <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] rounded-full bg-brand-600" />
        )}
      </button>

      {/* Dropdown Panel */}
      <div
        className={clsx(
          'absolute left-1/2 -translate-x-1/2 top-full w-72 pt-3 transition-all duration-200',
          open
            ? 'opacity-100 visible translate-y-0'
            : 'opacity-0 invisible -translate-y-2 pointer-events-none'
        )}
      >
        <div className="rounded-2xl border border-slate-200 bg-white shadow-elevated p-2">
          {items.map(item => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={clsx(
                'flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 group',
                isActivePath(pathname, item.href)
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              {item.icon && (
                <span
                  className={clsx(
                    'mt-0.5 shrink-0 transition-colors',
                    isActivePath(pathname, item.href)
                      ? 'text-brand-600'
                      : 'text-slate-400 group-hover:text-brand-500'
                  )}
                >
                  {item.icon}
                </span>
              )}
              <div>
                <span className="text-sm font-semibold block">{item.label}</span>
                {item.description && (
                  <span className="text-xs text-slate-400 mt-0.5 block leading-snug">
                    {item.description}
                  </span>
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
   NAVBAR COMPONENT
   ═══════════════════════════════════════════════════════ */
export function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // FIX: Initialize scrolled as false to match server render
  const [scrolled, setScrolled] = useState(false)
  // Track if component has mounted (client-side)
  const [mounted, setMounted] = useState(false)

  // Set mounted to true after hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle scroll - only runs on client after mount
  useEffect(() => {
    if (!mounted) return

    const onScroll = () => setScrolled(window.scrollY > 20)
    // Check initial scroll position
    onScroll()

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [mounted])

  // Handle body overflow for mobile menu
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  // Handle escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobile()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeMobile])

  // Determine header classes - use consistent initial state for SSR
  const headerClasses = clsx(
    'sticky top-0 z-50 transition-all duration-300',
    // Only apply scrolled styles after mount to avoid hydration mismatch
    mounted && scrolled
      ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-sm'
      : 'bg-transparent border-b border-transparent'
  )

  return (
    <>
      <header className={headerClasses}>
        <Container>
          <div className="h-16 flex items-center justify-between gap-6">
            <Logo />

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-7">
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

            {/* Desktop CTA Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/login"
                className="text-[13.5px] font-semibold text-slate-500 hover:text-brand-600 px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="btn-primary !text-[13px] !px-5 !py-2.5 !rounded-xl"
              >
                Start Free Trial
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="ml-1">
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 -mr-2 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              <MenuIcon open={mobileOpen} />
            </button>
          </div>
        </Container>
      </header>

      {/* ─── Mobile Menu ─── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm animate-fade-in"
            onClick={closeMobile}
          />

          {/* Slide Panel */}
          <div className="absolute top-0 right-0 h-full w-[88%] max-w-sm bg-white border-l border-slate-200 flex flex-col shadow-elevated animate-slide-down">
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
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
            <nav className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-1">
                {/* Home */}
                <Link
                  href="/"
                  onClick={closeMobile}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                    pathname === '/'
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                      isActivePath(pathname, item.href)
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    )}
                  >
                    {item.label}
                  </Link>
                ))}

                {/* Product Section */}
                <div className="pt-4 pb-2 px-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Product
                  </p>
                </div>
                {productMenu.map(item => (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    onClick={closeMobile}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                      isActivePath(pathname, item.href)
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    )}
                  >
                    {item.icon && (
                      <span className={clsx(
                        'shrink-0',
                        isActivePath(pathname, item.href)
                          ? 'text-brand-600'
                          : 'text-slate-400'
                      )}>
                        {item.icon}
                      </span>
                    )}
                    {item.label}
                  </Link>
                ))}

                {/* Community Section */}
                <div className="pt-4 pb-2 px-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Community</p>
                </div>
                {communityMenu.map(item => (
                  <Link key={item.href} href={item.href} onClick={closeMobile} className={clsx('flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold', isActivePath(pathname, item.href) ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')}>
                    {item.icon && <span className="shrink-0 text-slate-400">{item.icon}</span>}
                    {item.label}
                  </Link>
                ))}

                {/* Company Section */}
                <div className="pt-4 pb-2 px-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Company
                  </p>
                </div>
                {companyMenu.map(item => (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    onClick={closeMobile}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                      isActivePath(pathname, item.href)
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    )}
                  >
                    {item.icon && (
                      <span className={clsx(
                        'shrink-0',
                        isActivePath(pathname, item.href)
                          ? 'text-brand-600'
                          : 'text-slate-400'
                      )}>
                        {item.icon}
                      </span>
                    )}
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>

            {/* CTA Buttons */}
            <div className="p-4 border-t border-slate-100 space-y-2.5">
              <Link
                href="/login"
                onClick={closeMobile}
                className="btn-secondary w-full !justify-center"
              >
                Log in
              </Link>
              <Link
                href="/register"
                onClick={closeMobile}
                className="btn-primary w-full !justify-center"
              >
                Start Free Trial →
              </Link>
            </div>

            {/* Branding */}
            <div className="px-5 py-3 border-t border-slate-100">
              <p className="text-[11px] text-slate-400 text-center">
                A unit of Shivshakti Computer Academy
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}