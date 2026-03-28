// FILE: src/app/(public)/modules/page.tsx

import { ModulesShowcase } from '@/components/marketing/ModulesShowcase'
import { CTA } from '@/components/marketing/CTA'
import { Container } from '@/components/marketing/Container'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'All Modules — 22+ School Management Tools',
  description:
    'See all VidyaFlow modules — student management, attendance, fees, exams, website builder, library, HR & more. Plan-based access with multi-tenant isolation.',
  alternates: {
    canonical: '/modules',
  },
}

export default function ModulesPage() {
  return (
    <>
      {/* Page Hero */}
      <section className="relative pt-24 pb-8 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/3 w-[600px] h-[300px] bg-brand/[0.05] blur-[120px] rounded-full" />
          <div className="absolute inset-0 dot-pattern opacity-25" />
        </div>

        <Container>
          <div className="relative text-center max-w-3xl mx-auto">
            <div className="badge-brand mx-auto mb-5">✦ Complete Module Library</div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Turn on only what{' '}
              <span className="gradient-text">your school needs</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed">
              Plans unlock modules. Your school data remains isolated per tenant.
              Start with 6 core modules, scale up to 22+ as you grow.
            </p>

            {/* Quick info */}
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm">
              {[
                { value: '22+', label: 'Modules' },
                { value: '4', label: 'Plan Tiers' },
                { value: '4', label: 'User Roles' },
                { value: '100%', label: 'Data Isolated' },
              ].map(stat => (
                <div key={stat.label} className="flex items-center gap-2">
                  <span className="text-lg font-extrabold text-white">{stat.value}</span>
                  <span className="text-slate-500">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Modules Grid with Filter */}
      <ModulesShowcase />

      <CTA />
    </>
  )
}