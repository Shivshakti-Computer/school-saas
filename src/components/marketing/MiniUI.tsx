// FILE: src/components/marketing/MiniUI.tsx
// Shared UI primitives for marketing pages
// Uses globals.css design system classes

import Link from 'next/link'

/* ─── Primary Button ─── */
export function PrimaryButton({
  href,
  children,
  className = '',
}: {
  href: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link href={href} className={`btn-primary ${className}`}>
      {children}
    </Link>
  )
}

/* ─── Secondary Button ─── */
export function SecondaryButton({
  href,
  children,
  className = '',
}: {
  href: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link href={href} className={`btn-secondary ${className}`}>
      {children}
    </Link>
  )
}

/* ─── Pill / Badge ─── */
export function Pill({
  children,
  tone = 'brand',
}: {
  children: React.ReactNode
  tone?: 'brand' | 'emerald' | 'amber' | 'slate'
}) {
  const toneStyles: Record<string, string> = {
    brand:
      'text-[#818CF8] bg-[rgba(79,70,229,0.1)] border-[rgba(79,70,229,0.15)]',
    emerald:
      'text-emerald-400 bg-emerald-500/10 border-emerald-500/15',
    amber:
      'text-amber-400 bg-amber-500/10 border-amber-500/15',
    slate:
      'text-slate-400 bg-white/5 border-white/10',
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border
        px-3 py-1 text-xs font-semibold
        ${toneStyles[tone] || toneStyles.brand}
      `}
    >
      {children}
    </span>
  )
}

/* ─── Section Title ─── */
export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  center = true,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  center?: boolean
}) {
  return (
    <div className={`max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
      {eyebrow && (
        <div className={`badge-brand mb-4 ${center ? 'mx-auto' : ''}`}>
          {eyebrow}
        </div>
      )}
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base text-slate-400 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  )
}