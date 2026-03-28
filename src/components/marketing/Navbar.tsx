'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Container } from './Container'
import { useState, useEffect, useCallback } from 'react'
import { clsx } from 'clsx'

type NavItem = {
  href: string
  label: string
}

const primaryNav: NavItem[] = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
]

const productMenu: NavItem[] = [
  { href: '/features', label: 'Platform Overview' },
  { href: '/modules', label: 'All Modules' },
  { href: '/security', label: 'Security' },
  { href: '/faq', label: 'FAQ' },
]

const companyMenu: NavItem[] = [
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms' },
  { href: '/refund', label: 'Refund Policy' },
]

function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-purple-500 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
        <span className="text-white font-extrabold text-sm tracking-tight">VF</span>
        <div className="absolute inset-0 rounded-xl bg-brand/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-extrabold text-white tracking-tight">
          VidyaFlow
        </div>
        <div className="text-[10px] text-slate-400 font-medium">
          by Shivshakti Computer Academy
        </div>
      </div>
    </Link>
  )
}

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
        'relative text-[13px] font-semibold py-1 transition-colors duration-200',
        isActive ? 'text-white' : 'text-slate-400 hover:text-white'
      )}
    >
      {label}
      {isActive && (
        <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] rounded-full bg-brand" />
      )}
    </Link>
  )
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <div className="w-5 h-4 relative flex flex-col justify-between">
      <span
        className={clsx(
          'block h-[2px] w-5 bg-slate-300 rounded-full transition-all duration-300 origin-center',
          open && 'rotate-45 translate-y-[7px]'
        )}
      />
      <span
        className={clsx(
          'block h-[2px] w-5 bg-slate-300 rounded-full transition-all duration-300',
          open && 'opacity-0 scale-0'
        )}
      />
      <span
        className={clsx(
          'block h-[2px] w-5 bg-slate-300 rounded-full transition-all duration-300 origin-center',
          open && '-rotate-45 -translate-y-[7px]'
        )}
      />
    </div>
  )
}

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
          'relative text-[13px] font-semibold py-1 transition-colors duration-200 inline-flex items-center gap-1',
          hasActive ? 'text-white' : 'text-slate-400 hover:text-white'
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
          <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] rounded-full bg-brand" />
        )}
      </button>

      {/* SAME DOM always */}
      <div
        className={clsx(
          'absolute left-0 top-full w-56 pt-2 transition-all duration-200',
          open
            ? 'opacity-100 visible translate-y-0'
            : 'opacity-0 invisible -translate-y-1 pointer-events-none'
        )}
      >
        <div className="rounded-2xl border border-white/[0.08] bg-[var(--surface-1)]/95 backdrop-blur-xl shadow-2xl shadow-black/30 p-2">
          {items.map(item => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={clsx(
                'flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors',
                isActivePath(pathname, item.href)
                  ? 'bg-brand/10 text-brand-400'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              )}
            >
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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

  return (
    <>
      <header
        className={clsx(
          'sticky top-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-[var(--surface-0)]/80 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_1px_12px_rgba(0,0,0,0.3)]'
            : 'bg-transparent border-b border-transparent'
        )}
      >
        <Container>
          <div className="h-16 flex items-center justify-between gap-6">
            <Logo />

            {/* Desktop Nav */}
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
              <Dropdown label="More" items={companyMenu} pathname={pathname} />
            </nav>

            {/* CTA */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/login"
                className="text-[13px] font-semibold text-slate-400 hover:text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="btn-primary !text-[13px] !px-5 !py-2.5 !rounded-lg"
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
              className="lg:hidden p-2 -mr-2 rounded-lg hover:bg-white/5 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              <MenuIcon open={mobileOpen} />
            </button>
          </div>
        </Container>
      </header>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={closeMobile}
          />

          <div
            className="absolute top-0 right-0 h-full w-[88%] max-w-sm bg-[var(--surface-1)] border-l border-white/[0.06] flex flex-col"
          >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-white/[0.06]">
              <Logo />
              <button
                onClick={closeMobile}
                className="p-2 -mr-2 rounded-lg hover:bg-white/5 transition-colors"
                aria-label="Close menu"
              >
                <MenuIcon open={true} />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-1">
                <Link
                  href="/"
                  onClick={closeMobile}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                    pathname === '/'
                      ? 'bg-brand/10 text-brand-400'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  )}
                >
                  Home
                </Link>

                {[...primaryNav, ...productMenu, ...companyMenu].map(item => (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    onClick={closeMobile}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                      isActivePath(pathname, item.href)
                        ? 'bg-brand/10 text-brand-400'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>

            {/* CTA */}
            <div className="p-4 border-t border-white/[0.06] space-y-2.5">
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

            <div className="px-5 py-3 border-t border-white/[0.06]">
              <p className="text-[11px] text-slate-500 text-center">
                A unit of Shivshakti Computer Academy
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}