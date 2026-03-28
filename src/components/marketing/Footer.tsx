// FILE: src/components/marketing/Footer.tsx

import Link from 'next/link'
import { Container } from './Container'

/* ─── Footer Link Columns ─── */
const footerLinks = {
  product: {
    title: 'Product',
    links: [
      { href: '/#features', label: 'Features' },
      { href: '/#modules', label: 'Modules' },
      { href: '/#pricing', label: 'Pricing' },
      { href: '/security', label: 'Security' },
      { href: '/#faq', label: 'FAQ' },
    ],
  },
  company: {
    title: 'Company',
    links: [
      { href: '/about', label: 'About Us' },
      { href: '/contact', label: 'Contact' },
      { href: 'https://shivshakticomputer.in', label: 'Shivshakti Academy', external: true },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms of Service' },
      { href: '/refund', label: 'Refund Policy' },
    ],
  },
}

/* ─── Social Icons (SVG inline — no library needed) ─── */
const socials = [
  {
    label: 'WhatsApp',
    href: 'https://wa.me/91XXXXXXXXXX', // → TODO: Add your number
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
  {
    label: 'Email',
    href: 'mailto:contact@vidyaflow.in', // → TODO: Update email
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
  {
    label: 'Phone',
    href: 'tel:+91XXXXXXXXXX', // → TODO: Add your number
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
]

/* ─── Footer Column Component ─── */
function FooterColumn({ title, links }: {
  title: string
  links: Array<{ href: string; label: string; external?: boolean }>
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
        {title}
      </h4>
      <ul className="space-y-2.5">
        {links.map(link => (
          <li key={link.href}>
            {link.external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-500 hover:text-white transition-colors duration-200 flex items-center gap-1"
              >
                {link.label}
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="opacity-40">
                  <path d="M3.5 1h7.5v7.5M11 1L4 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            ) : (
              <Link
                href={link.href}
                className="text-sm text-slate-500 hover:text-white transition-colors duration-200"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   FOOTER COMPONENT
   ═══════════════════════════════════════════════════════ */
export function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06] bg-[var(--surface-0)]">
      {/* Subtle top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" />

      <Container>
        {/* ─── Main Footer Grid ─── */}
        <div className="py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand Column — Takes more space */}
          <div className="sm:col-span-2">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-purple-500 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                <span className="text-white font-extrabold text-sm">VF</span>
              </div>
              <div className="leading-tight">
                <div className="text-sm font-extrabold text-white tracking-tight">VidyaFlow</div>
                <div className="text-[10px] text-slate-500">School Operations, Streamlined</div>
              </div>
            </Link>

            <p className="text-sm text-slate-500 leading-relaxed max-w-xs mb-5">
              Complete school management platform — admissions, attendance, fees, exams, website builder,
              parent portals & 20+ modules. Built for Indian schools.
            </p>

            {/* Social / Contact Icons */}
            <div className="flex items-center gap-2">
              {socials.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  target={s.href.startsWith('http') ? '_blank' : undefined}
                  rel={s.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  aria-label={s.label}
                  className="
                    w-9 h-9 rounded-lg flex items-center justify-center
                    text-slate-500 hover:text-white
                    bg-white/[0.03] hover:bg-brand/20
                    border border-white/[0.06] hover:border-brand/30
                    transition-all duration-200
                  "
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          <FooterColumn {...footerLinks.product} />
          <FooterColumn {...footerLinks.company} />
          <FooterColumn {...footerLinks.legal} />
        </div>

        {/* ─── Bottom Bar ─── */}
        <div className="py-6 border-t border-white/[0.06] flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} VidyaFlow — A unit of{' '}
            <a
              href="https://shivshakticomputer.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-brand transition-colors"
            >
              Shivshakti Computer Academy
            </a>
            . All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            {/* Status indicator */}
            <span className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              All systems operational
            </span>
          </div>
        </div>
      </Container>
    </footer>
  )
}