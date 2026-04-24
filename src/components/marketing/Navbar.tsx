'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Container } from './Container'
import { useState, useEffect, useCallback } from 'react'
import { clsx } from 'clsx'

/* ─────────────────────────────────────────────────────────────
   TYPES
   ───────────────────────────────────────────────────────────── */

type NavItem = {
  href:         string
  label:        string
  description?: string
  icon?:        React.ReactNode
}

/* ─────────────────────────────────────────────────────────────
   NAV DATA
   ───────────────────────────────────────────────────────────── */

const primaryNav: NavItem[] = [
  { href: '/features', label: 'Features' },
  { href: '/pricing',  label: 'Pricing'  },
  { href: '/about',    label: 'About'    },
]

const productMenu: NavItem[] = [
  {
    href: '/features',
    label: 'Platform Overview',
    description: 'See everything Skolify offers',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: '/modules',
    label: 'All Modules',
    description: '20+ powerful school modules',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    href: '/verify', 
    label: 'Verify Certificate',
    description: 'Check certificate authenticity',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    href: '/security',
    label: 'Security',
    description: 'Enterprise-grade data protection',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    href: '/faq',
    label: 'FAQ',
    description: 'Common questions answered',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
    description: 'What schools say about us',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    href: '/updates',
    label: 'Updates',
    description: 'Latest features & changelog',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    href: '/enquiry',
    label: 'Enquiry',
    description: 'Send us your query',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: '/privacy',
    label: 'Privacy Policy',
    description: 'How we handle your data',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
      </svg>
    ),
  },
  {
    href: '/refund',
    label: 'Refund Policy',
    description: 'Our refund process',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="23,4 23,10 17,10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </svg>
    ),
  },
]

/* ─────────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────────── */

function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
}

/* ─────────────────────────────────────────────────────────────
   LOGO
   ───────────────────────────────────────────────────────────── */

function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 group flex-shrink-0"
      aria-label="Skolify — Home"
    >
      {/* Icon mark */}
      <div
        className="w-8 h-8 rounded-[10px] flex items-center justify-center
                   transition-transform duration-200 group-hover:scale-105"
        style={{
          background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%)',
          boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
        }}
      >
        {/* Graduation cap mark */}
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3L2 8.5l10 5.5 10-5.5L12 3z"
            fill="white" fillOpacity="0.95" />
          <path d="M7 11.5v4.5c0 2 2.2 3.5 5 3.5s5-1.5 5-3.5v-4.5"
            stroke="white" strokeWidth="1.8"
            strokeLinecap="round" fill="none" />
          <line x1="22" y1="8.5" x2="22" y2="14"
            stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="22" cy="14.5" r="1" fill="white" />
        </svg>
      </div>

      {/* Wordmark */}
      <div className="leading-none">
        <div
          className="text-[15px] font-bold tracking-tight font-display"
          style={{ color: 'var(--text-primary)' }}
        >
          Skolify
        </div>
        <div
          className="text-[9px] font-medium mt-0.5 tracking-wide"
          style={{ color: 'var(--text-muted)' }}
        >
          by Shivshakti Computer Academy
        </div>
      </div>
    </Link>
  )
}

/* ─────────────────────────────────────────────────────────────
   NAV LINK
   ───────────────────────────────────────────────────────────── */

function NavLink({
  href,
  label,
  isActive,
}: {
  href:     string
  label:    string
  isActive: boolean
}) {
  return (
    <Link
      href={href}
      className={clsx(
        'relative text-sm font-medium py-1 transition-colors duration-150 font-body',
        'whitespace-nowrap'
      )}
      style={{
        color: isActive ? 'var(--primary-600)' : 'var(--text-secondary)',
      }}
      onMouseEnter={e => {
        if (!isActive)
          (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'
      }}
      onMouseLeave={e => {
        if (!isActive)
          (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
      }}
    >
      {label}

      {/* Active underline */}
      {isActive && (
        <span
          className="absolute -bottom-px left-0 right-0 h-[2px] rounded-full"
          style={{ background: 'var(--primary-500)' }}
        />
      )}
    </Link>
  )
}

/* ─────────────────────────────────────────────────────────────
   HAMBURGER ICON
   ───────────────────────────────────────────────────────────── */

function MenuIcon({ open }: { open: boolean }) {
  return (
    <div className="w-5 h-[14px] relative flex flex-col justify-between">
      <span
        className="block h-[2px] rounded-full transition-all duration-200"
        style={{
          background:  'var(--text-primary)',
          transform:    open ? 'rotate(45deg) translateY(6px)' : 'none',
          width:        '20px',
        }}
      />
      <span
        className="block h-[2px] rounded-full transition-all duration-200"
        style={{
          background: 'var(--text-primary)',
          opacity:     open ? 0 : 1,
          width:       '20px',
        }}
      />
      <span
        className="block h-[2px] rounded-full transition-all duration-200"
        style={{
          background: 'var(--text-primary)',
          transform:   open ? 'rotate(-45deg) translateY(-6px)' : 'none',
          width:       '20px',
        }}
      />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   DROPDOWN
   ───────────────────────────────────────────────────────────── */

function Dropdown({
  label,
  items,
  pathname,
}: {
  label:    string
  items:    NavItem[]
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
      {/* Trigger */}
      <button
        type="button"
        className="relative inline-flex items-center gap-1 text-sm font-medium
                   py-1 transition-colors duration-150 font-body whitespace-nowrap"
        style={{ color: hasActive ? 'var(--primary-600)' : 'var(--text-secondary)' }}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {label}

        {/* Chevron */}
        <svg
          width="11" height="11" viewBox="0 0 16 16" fill="none"
          className="transition-transform duration-150"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        {/* Active underline */}
        {hasActive && (
          <span
            className="absolute -bottom-px left-0 right-0 h-[2px] rounded-full"
            style={{ background: 'var(--primary-500)' }}
          />
        )}
      </button>

      {/* Panel */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-full pt-3 w-60"
        style={{
          pointerEvents: open ? 'auto' : 'none',
          opacity:       open ? 1 : 0,
          transform:     `translateX(-50%) translateY(${open ? '0px' : '-6px'})`,
          transition:    'opacity 150ms ease, transform 150ms ease',
          visibility:    open ? 'visible' : 'hidden',
        }}
      >
        {/* Arrow */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-[6px] w-3 h-3 rotate-45"
          style={{
            background:  'var(--bg-card)',
            border:      '1px solid var(--border)',
            borderBottom:'none',
            borderRight: 'none',
          }}
        />

        {/* Menu box */}
        <div
          className="rounded-[var(--radius-lg)] overflow-hidden"
          style={{
            background: 'var(--bg-card)',
            border:     '1px solid var(--border)',
            boxShadow:  'var(--shadow-lg)',
          }}
        >
          <div className="p-1.5">
            {items.map(item => {
              const active = isActivePath(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-start gap-2.5 rounded-[var(--radius-md)]
                             px-3 py-2.5 transition-colors duration-150 group"
                  style={{
                    background: active ? 'var(--primary-50)' : 'transparent',
                    color:      active ? 'var(--primary-700)' : 'var(--text-primary)',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = 'var(--bg-muted)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = 'transparent'
                    }
                  }}
                >
                  {/* Icon */}
                  {item.icon && (
                    <span
                      className="mt-0.5 flex-shrink-0 transition-colors duration-150"
                      style={{
                        color: active
                          ? 'var(--primary-500)'
                          : 'var(--text-muted)',
                      }}
                    >
                      {item.icon}
                    </span>
                  )}

                  {/* Text */}
                  <div className="min-w-0">
                    <span
                      className="text-sm font-medium block font-body"
                      style={{ color: 'inherit' }}
                    >
                      {item.label}
                    </span>
                    {item.description && (
                      <span
                        className="text-xs mt-0.5 block leading-relaxed"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {item.description}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   MOBILE NAV SECTION
   ───────────────────────────────────────────────────────────── */

function MobileSection({
  title,
  items,
  pathname,
  onClose,
}: {
  title:    string
  items:    NavItem[]
  pathname: string
  onClose:  () => void
}) {
  return (
    <div>
      {/* Section label */}
      <p
        className="text-[10px] font-bold uppercase tracking-widest px-3 pt-4 pb-1.5"
        style={{ color: 'var(--text-muted)' }}
      >
        {title}
      </p>

      {items.map(item => {
        const active = isActivePath(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)]
                       text-sm font-medium transition-colors duration-150 font-body mx-1"
            style={{
              background: active ? 'var(--primary-50)'  : 'transparent',
              color:      active ? 'var(--primary-700)' : 'var(--text-secondary)',
            }}
          >
            {item.icon && (
              <span style={{ color: active ? 'var(--primary-500)' : 'var(--text-muted)' }}>
                {item.icon}
              </span>
            )}
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   NAVBAR — Main
   ───────────────────────────────────────────────────────────── */

export function Navbar() {
  const pathname = usePathname()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled,   setScrolled]   = useState(false)
  const [mounted,    setMounted]     = useState(false)

  /* Mount guard — SSR safe */
  useEffect(() => { setMounted(true) }, [])

  /* Scroll detection */
  useEffect(() => {
    if (!mounted) return
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [mounted])

  /* Body scroll lock when mobile open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  /* Close on Escape */
  const closeMobile = useCallback(() => setMobileOpen(false), [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMobile() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeMobile])

  return (
    <>
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50 transition-all duration-200"
        style={{
          background:   mounted && scrolled
            ? 'rgba(248,247,255,0.92)'
            : 'rgba(248,247,255,0.75)',
          backdropFilter:         'blur(20px) saturate(180%)',
          WebkitBackdropFilter:   'blur(20px) saturate(180%)',
          borderBottom:  mounted && scrolled
            ? '1px solid var(--border)'
            : '1px solid transparent',
          boxShadow: mounted && scrolled
            ? '0 2px 12px rgba(99,102,241,0.07)'
            : 'none',
        }}
      >
        <Container>
          <div className="h-[60px] flex items-center justify-between gap-6">

            {/* Logo */}
            <Logo />

            {/* Desktop Nav */}
            <nav
              className="hidden lg:flex items-center gap-6"
              aria-label="Main navigation"
            >
              <NavLink
                href="/"
                label="Home"
                isActive={pathname === '/'}
              />

              {primaryNav.map(item => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  isActive={isActivePath(pathname, item.href)}
                />
              ))}

              <Dropdown label="Product"   items={productMenu}   pathname={pathname} />
              <Dropdown label="Community" items={communityMenu} pathname={pathname} />
              <Dropdown label="More"      items={companyMenu}   pathname={pathname} />
            </nav>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
              <Link
                href="/login"
                className="text-sm font-medium px-3.5 py-2 rounded-[var(--radius-md)]
                           transition-colors duration-150 font-body"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e =>
                  (e.currentTarget.style.background = 'var(--bg-muted)')
                }
                onMouseLeave={e =>
                  (e.currentTarget.style.background = 'transparent')
                }
              >
                Log in
              </Link>

              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 text-sm font-semibold
                           text-white px-4 py-2 rounded-[var(--radius-md)]
                           transition-all duration-150 font-display"
                style={{
                  background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                  boxShadow:  '0 1px 3px rgba(99,102,241,0.25)',
                  color: 'white'
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background  = 'linear-gradient(135deg, var(--primary-600), var(--primary-700))'
                  el.style.boxShadow   = '0 4px 12px rgba(99,102,241,0.35)'
                  el.style.transform   = 'translateY(-1px)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background  = 'linear-gradient(135deg, var(--primary-500), var(--primary-600))'
                  el.style.boxShadow   = '0 1px 3px rgba(99,102,241,0.25)'
                  el.style.transform   = 'translateY(0)'
                }}
              >
                Start Free Trial
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 -mr-2 rounded-[var(--radius-md)]
                         transition-colors duration-150"
              onClick={() => setMobileOpen(prev => !prev)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              style={{ background: mobileOpen ? 'var(--bg-muted)' : 'transparent' }}
            >
              <MenuIcon open={mobileOpen} />
            </button>

          </div>
        </Container>
      </header>

      {/* ── Mobile Menu ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">

          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{
              background:           'rgba(30,27,75,0.4)',
              backdropFilter:       'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              animation:            'overlayIn 0.25s ease forwards',
            }}
            onClick={closeMobile}
            aria-hidden="true"
          />

          {/* Slide-in panel — from right */}
          <div
            className="absolute top-0 right-0 h-full flex flex-col"
            style={{
              width:      'min(85vw, 320px)',
              background: 'var(--bg-card)',
              borderLeft: '1px solid var(--border)',
              boxShadow:  '-4px 0 32px rgba(30,27,75,0.15)',
              animation:  'mobileMenuIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards',
            }}
          >
            {/* Mobile header */}
            <div
              className="h-[60px] flex items-center justify-between px-4 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <Logo />
              <button
                onClick={closeMobile}
                className="p-2 -mr-2 rounded-[var(--radius-md)]
                           transition-colors duration-150"
                aria-label="Close menu"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e =>
                  (e.currentTarget.style.background = 'var(--bg-muted)')
                }
                onMouseLeave={e =>
                  (e.currentTarget.style.background = 'transparent')
                }
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Nav links */}
            <nav
              className="flex-1 overflow-y-auto py-3 portal-scrollbar"
              aria-label="Mobile navigation"
            >
              <div className="px-1 space-y-0.5">

                {/* Home */}
                <Link
                  href="/"
                  onClick={closeMobile}
                  className="flex items-center gap-2.5 px-3 py-2
                             rounded-[var(--radius-md)] text-sm font-medium
                             transition-colors duration-150 font-body mx-1"
                  style={{
                    background: pathname === '/' ? 'var(--primary-50)'  : 'transparent',
                    color:      pathname === '/' ? 'var(--primary-700)' : 'var(--text-secondary)',
                  }}
                >
                  Home
                </Link>

                {/* Primary */}
                {primaryNav.map(item => {
                  const active = isActivePath(pathname, item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobile}
                      className="flex items-center gap-2.5 px-3 py-2
                                 rounded-[var(--radius-md)] text-sm font-medium
                                 transition-colors duration-150 font-body mx-1"
                      style={{
                        background: active ? 'var(--primary-50)'  : 'transparent',
                        color:      active ? 'var(--primary-700)' : 'var(--text-secondary)',
                      }}
                    >
                      {item.label}
                    </Link>
                  )
                })}

                {/* Sections */}
                <MobileSection
                  title="Product"
                  items={productMenu}
                  pathname={pathname}
                  onClose={closeMobile}
                />
                <MobileSection
                  title="Community"
                  items={communityMenu}
                  pathname={pathname}
                  onClose={closeMobile}
                />
                <MobileSection
                  title="Company"
                  items={companyMenu}
                  pathname={pathname}
                  onClose={closeMobile}
                />
              </div>
            </nav>

            {/* CTA footer */}
            <div
              className="p-3 space-y-2 flex-shrink-0"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <Link
                href="/login"
                onClick={closeMobile}
                className="block w-full text-center py-2.5 text-sm font-semibold
                           rounded-[var(--radius-md)] transition-colors duration-150
                           font-display"
                style={{
                  background: 'var(--bg-muted)',
                  color:      'var(--text-primary)',
                  border:     '1px solid var(--border)',
                }}
              >
                Log in
              </Link>
              <Link
                href="/register"
                onClick={closeMobile}
                className="block w-full text-center py-2.5 text-sm font-semibold
                           text-white rounded-[var(--radius-md)] transition-all
                           duration-150 font-display"
                style={{
                  background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                  boxShadow:  '0 2px 8px rgba(99,102,241,0.3)',
                }}
              >
                Start Free Trial →
              </Link>
            </div>

            {/* Footer brand */}
            <div
              className="px-4 py-2.5 text-center flex-shrink-0"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <p
                className="text-[10px] tracking-wide"
                style={{ color: 'var(--text-muted)' }}
              >
                A unit of Shivshakti Computer Academy
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu animation */}
      <style>{`
        @keyframes mobileMenuIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  )
}