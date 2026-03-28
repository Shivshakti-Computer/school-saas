// FILE: src/components/marketing/LegalPageLayout.tsx
// Shared layout for Privacy, Terms, Refund — dark themed legal pages

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
            <section className="relative pt-24 pb-10 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                    <div className="absolute top-0 left-1/3 w-[500px] h-[300px] bg-brand/[0.04] blur-[120px] rounded-full" />
                    <div className="absolute inset-0 dot-pattern opacity-15" />
                </div>

                <Container>
                    <div ref={headerRef} className="reveal max-w-3xl">
                        <div className="badge-brand mb-5">{eyebrow}</div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                            {title}
                        </h1>
                        <p className="mt-3 text-sm text-slate-500">
                            Last updated: {lastUpdated}
                        </p>
                    </div>
                </Container>
            </section>

            {/* Content */}
            <section className="pb-20">
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
            <h2 className="text-base font-bold text-white flex items-center gap-2.5">
                <span className="text-xs font-mono text-brand-400 bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-md">
                    {number}
                </span>
                {title}
            </h2>
            <div className="mt-3 text-sm text-slate-400 leading-relaxed space-y-3">
                {children}
            </div>
        </section>
    )
}

/* ─── Bullet List ─── */
export function LegalList({ items }: { items: React.ReactNode[] }) {
    return (
        <ul className="space-y-2">
            {items.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand/50 mt-2 flex-shrink-0" />
                    <div>{item}</div>
                </li>
            ))}
        </ul>
    )
}
/* ─── Contact Block ─── */
export function LegalContact() {
    return (
        <div className="card-dark p-5 mt-4">
            <p className="text-sm text-slate-300">
                <strong className="text-white">Shivshakti Computer Academy</strong>
                <br />
                Ambikapur, Chhattisgarh, India
                <br />
                Email:{' '}
                <a href="mailto:support@vidyaflow.in" className="text-brand-400 hover:underline">
                    support@vidyaflow.in
                </a>
                <br />
                Phone: +91-XXXXXXXXXX
            </p>
        </div>
    )
}