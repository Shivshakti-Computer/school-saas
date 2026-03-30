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
      <section className="relative pt-24 pb-10 overflow-hidden bg-gradient-to-b from-blue-50 via-indigo-50/30 to-white">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/3 w-[600px] h-[300px] bg-blue-500/[0.08] blur-[120px] rounded-full" />
          <div className="absolute top-20 right-1/4 w-[400px] h-[200px] bg-purple-500/[0.05] blur-[100px] rounded-full" />
          <div className="absolute inset-0 dot-pattern opacity-40" />
        </div>

        <Container>
          <div className="relative text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-soft mb-6">
              <span className="text-lg">📦</span>
              <span className="text-sm font-semibold text-slate-700">Complete Module Library</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Turn on only what{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                your school needs
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Plans unlock modules. Your school data remains isolated per tenant.
              Start with 6 core modules, scale up to 22+ as you grow.
            </p>

            {/* Quick stats */}
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {[
                { value: '22+', label: 'Modules', icon: '📦' },
                { value: '4', label: 'Plan Tiers', icon: '📊' },
                { value: '4', label: 'User Roles', icon: '👥' },
                { value: '100%', label: 'Data Isolated', icon: '🔒' },
              ].map(stat => (
                <div key={stat.label} className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-200 shadow-soft">
                  <span className="text-xl">{stat.icon}</span>
                  <div className="text-left">
                    <span className="text-lg font-extrabold text-slate-900">{stat.value}</span>
                    <span className="text-sm text-slate-500 ml-1.5">{stat.label}</span>
                  </div>
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