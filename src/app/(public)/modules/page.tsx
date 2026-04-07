// FILE: src/app/(public)/modules/page.tsx
// FULLY CONVERTED TO LOCKED DESIGN PATTERN
// ═══════════════════════════════════════════════════════════

import { ModulesShowcase } from '@/components/marketing/ModulesShowcase'
import { CTA } from '@/components/marketing/CTA'
import { Container } from '@/components/marketing/Container'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'All Modules — 22+ School Management Tools | Skolify',
  description:
    'See all Skolify modules — student management, attendance, fees, exams, AI assistant, website builder, library, HR & more. Plan-based access with multi-tenant isolation.',
  alternates: {
    canonical: '/modules',
  },
  openGraph: {
    title: 'All Modules — 22+ School Management Tools',
    description:
      'Complete school management suite. Turn on only what you need. Data isolated per school.',
    type: 'website',
  },
}

export default function ModulesPage() {
  return (
    <>
      {/* ════════════════════════════════════════
          PAGE HERO
      ════════════════════════════════════════ */}
      <section className="relative pt-24 pb-12 overflow-hidden section-hero">
        {/* Background Decorations */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="blob-bg top-0 left-1/3 w-[600px] h-[300px]"
            style={{ background: 'var(--primary-500)' }}
          />
          <div
            className="blob-bg top-20 right-1/4 w-[400px] h-[200px]"
            style={{ background: 'var(--violet-500)' }}
          />
          <div className="absolute inset-0 dot-pattern opacity-30" />
        </div>

        <Container>
          <div className="relative text-center max-w-3xl mx-auto animate-fade-in">
            {/* Badge */}
            <div className="badge badge-brand inline-flex items-center gap-2 mb-6">
              <span className="text-lg">📦</span>
              <span>Complete Module Library</span>
            </div>

            {/* Title */}
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-primary tracking-tight leading-tight">
              Turn on only what{' '}
              <span className="gradient-text-warm">your school needs</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-base sm:text-lg text-secondary leading-relaxed max-w-2xl mx-auto">
              Plans unlock modules. Your school data remains isolated per tenant.
              Start with 6 core modules, scale up to 22+ as you grow.
            </p>

            {/* Quick Stats */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {[
                { value: '22+', label: 'Modules', icon: '📦' },
                { value: '4', label: 'Plan Tiers', icon: '📊' },
                { value: '4', label: 'User Roles', icon: '👥' },
                { value: '100%', label: 'Data Isolated', icon: '🔒' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="card flex items-center gap-3 px-4 py-2.5 rounded-xl border shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5"
                >
                  <span className="text-xl flex-shrink-0">{stat.icon}</span>
                  <div className="text-left">
                    <span className="font-display text-lg font-extrabold text-primary">
                      {stat.value}
                    </span>
                    <span className="text-sm text-muted ml-1.5">{stat.label}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Info Pills */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {[
                { icon: '🎯', label: 'Pick what you need' },
                { icon: '🔓', label: 'Unlock with plans' },
                { icon: '🤖', label: 'AI included' },
                { icon: '📱', label: 'Mobile optimized' },
              ].map((pill) => (
                <div key={pill.label} className="badge badge-neutral text-xs">
                  <span>{pill.icon}</span>
                  <span>{pill.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ════════════════════════════════════════
          MODULES GRID
      ════════════════════════════════════════ */}
      <ModulesShowcase />

      {/* ════════════════════════════════════════
          CTA
      ════════════════════════════════════════ */}
      <CTA />
    </>
  )
}