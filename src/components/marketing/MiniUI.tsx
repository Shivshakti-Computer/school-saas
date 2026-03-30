// FILE: src/components/marketing/MiniUI.tsx

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
    brand: 'text-brand-700 bg-brand-50 border-brand-200',
    emerald: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    amber: 'text-amber-700 bg-amber-50 border-amber-200',
    slate: 'text-slate-600 bg-slate-100 border-slate-200',
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
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-sm font-semibold text-brand-700 mb-4 ${center ? 'mx-auto' : ''}`}>
          {eyebrow}
        </div>
      )}
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base text-slate-600 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  )
}