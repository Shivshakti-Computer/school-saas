// FILE: src/components/marketing/LegalPageLayout.tsx

'use client'

import { Container } from './Container'
import { useReveal } from '@/hooks/useReveal'

interface LegalPageLayoutProps {
  eyebrow: string
  title: string
  lastUpdated: string
  children: React.ReactNode
}

export function LegalPageLayout({ eyebrow, title, lastUpdated, children }: LegalPageLayoutProps) {
  const headerRef = useReveal<HTMLDivElement>()
  const contentRef = useReveal<HTMLDivElement>({ threshold: 0.05 })

  return (
    <>
      {/* Hero */}
      <section className="relative pt-24 pb-12 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/3 w-[500px] h-[300px] bg-blue-500/[0.06] blur-[120px] rounded-full" />
          <div className="absolute inset-0 dot-pattern opacity-30" />
        </div>

        <Container>
          <div ref={headerRef} className="reveal max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-sm font-semibold text-blue-700 mb-5">
              {eyebrow}
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              {title}
            </h1>
            <p className="mt-3 text-sm text-slate-500 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Last updated: {lastUpdated}
            </p>
          </div>
        </Container>
      </section>

      {/* Content */}
      <section className="pb-20 bg-white">
        <Container>
          <div ref={contentRef} className="reveal max-w-3xl space-y-10">
            {children}
          </div>
        </Container>
      </section>
    </>
  )
}

/* ─── Reusable Legal Section ─── */
export function LegalSection({
  number,
  title,
  children,
}: {
  number: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
        <span className="text-xs font-mono text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg font-bold">
          {number}
        </span>
        {title}
      </h2>
      <div className="mt-4 text-sm text-slate-600 leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  )
}

/* ─── Bullet List ─── */
export function LegalList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
          <div>{item}</div>
        </li>
      ))}
    </ul>
  )
}

/* ─── Contact Block ─── */
export function LegalContact() {
  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 mt-6">
      <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
        <span className="text-lg">📧</span>
        Contact Information
      </h3>
      <div className="text-sm text-slate-600 space-y-1.5">
        <p className="font-semibold text-slate-900">Shivshakti Computer Academy</p>
        <p>Ambikapur, Chhattisgarh, India</p>
        <p>
          Email:{' '}
          <a href="mailto:support@vidyaflow.in" className="text-blue-600 hover:underline font-medium">
            support@vidyaflow.in
          </a>
        </p>
        <p>Phone: +91-XXXXXXXXXX</p>
      </div>
    </div>
  )
}