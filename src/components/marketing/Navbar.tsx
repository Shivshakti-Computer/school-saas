'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Container } from './Container'
import { PrimaryButton, SecondaryButton } from './MiniUI'
import { clsx } from 'clsx'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

const nav = [
  { href: '/features', label: 'Features' },
  { href: '/modules', label: 'Modules' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/security', label: 'Security' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
]

export function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-100">
      <Container>
        <div className="h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-extrabold flex items-center justify-center text-sm">
              VF
            </div>
            <div className="leading-tight">
              <div className="text-sm font-extrabold text-slate-900 tracking-tight">VidyaFlow</div>
              <div className="text-[10px] text-slate-500">School Operations, Streamlined</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {nav.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "text-sm font-semibold transition-colors",
                  pathname === item.href ? "text-indigo-700" : "text-slate-600 hover:text-slate-900"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <SecondaryButton href="/login">Log in</SecondaryButton>
            <PrimaryButton href="/register">Start free trial</PrimaryButton>
          </div>

          <button className="md:hidden p-2 rounded-lg hover:bg-slate-50" onClick={() => setOpen(true)}>
            <Menu size={20} className="text-slate-700" />
          </button>
        </div>
      </Container>

      {/* Mobile */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden">
          <div className="absolute inset-0" onClick={() => setOpen(false)} />
          <div className="relative ml-auto w-[86%] max-w-sm h-full bg-white shadow-2xl border-l border-slate-100 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-extrabold flex items-center justify-center text-xs">
                  VF
                </div>
                <span className="text-sm font-extrabold text-slate-900">VidyaFlow</span>
              </div>
              <button className="p-2 rounded-lg hover:bg-slate-50" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-1">
              {nav.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={clsx(
                    "px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                    pathname === item.href
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-6 grid gap-2">
              <SecondaryButton href="/login" className="w-full">Log in</SecondaryButton>
              <PrimaryButton href="/register" className="w-full">Start free trial</PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}