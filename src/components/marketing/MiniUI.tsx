import Link from 'next/link'
import { clsx } from 'clsx'

export function PrimaryButton({
  href,
  children,
  className,
}: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors",
        className
      )}
    >
      {children}
    </Link>
  )
}

export function SecondaryButton({
  href,
  children,
  className,
}: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors",
        className
      )}
    >
      {children}
    </Link>
  )
}

export function Pill({ children, tone = "indigo" }: { children: React.ReactNode; tone?: "indigo"|"emerald"|"amber"|"slate" }) {
  const toneClass =
    tone === "emerald" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : tone === "amber" ? "bg-amber-50 text-amber-700 border-amber-200"
    : tone === "slate" ? "bg-slate-50 text-slate-700 border-slate-200"
    : "bg-indigo-50 text-indigo-700 border-indigo-200"

  return (
    <span className={clsx(
      "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
      toneClass
    )}>
      {children}
    </span>
  )
}

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
}) {
  return (
    <div className="max-w-2xl">
      {eyebrow && (
        <p className="text-xs font-semibold tracking-wider uppercase text-indigo-600">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  )
}