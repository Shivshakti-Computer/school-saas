// FILE: src/app/(public)/features/page.tsx

import { FeatureGrid } from '@/components/marketing/FeatureGrid'
import { ModulesShowcase } from '@/components/marketing/ModulesShowcase'
import { CTA } from '@/components/marketing/CTA'
import { Container } from '@/components/marketing/Container'
import type { Metadata } from 'next'
import { PlatformFeatures } from '@/components/marketing/PlatformFeatures'

export const metadata: Metadata = {
  title: 'Features — All-in-One School Management Platform',
  description:
    'Explore 22+ modules — student management, attendance, online fees, exams, website builder, PWA app, parent portal & more. Built for Indian schools by Shivshakti Computer Academy.',
  alternates: {
    canonical: '/features',
  },
}

export default function FeaturesPage() {
  return (
    <>
      {/* ─── Page Hero ─── */}
      <section className="relative pt-24 pb-12 overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-blue-500/[0.08] blur-[120px] rounded-full" />
          <div className="absolute top-20 right-1/4 w-[400px] h-[300px] bg-purple-500/[0.05] blur-[100px] rounded-full" />
          <div className="absolute inset-0 dot-pattern opacity-40" />
        </div>

        <Container>
          <div className="relative text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-soft mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-sm font-semibold text-slate-700">Complete Platform Overview</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Built for{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                real school workflows
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Fast admin operations, clean teacher tools, simple parent & student
              experience. 22+ modules, 4 user roles, one connected platform.
            </p>

            {/* Quick stats */}
            <div className="mt-8 flex flex-wrap justify-center gap-6">
              {[
                { value: '22+', label: 'Modules', icon: '📦' },
                { value: '4', label: 'User Roles', icon: '👥' },
                { value: '₹499', label: 'Starting/mo', icon: '💰' },
                { value: '0', label: 'Coding Needed', icon: '🎯' },
              ].map(stat => (
                <div 
                  key={stat.label} 
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-slate-200 shadow-soft"
                >
                  <span className="text-xl">{stat.icon}</span>
                  <div className="text-left">
                    <span className="text-lg font-extrabold text-slate-900">{stat.value}</span>
                    <span className="text-sm text-slate-500 ml-1">{stat.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Core Features ─── */}
      <FeatureGrid />

      {/* ─── All Modules ─── */}
      <ModulesShowcase />

      {/* ─── Website Builder + PWA + Roles ─── */}
      <PlatformFeatures />

      {/* ─── CTA ─── */}
      <CTA />
    </>
  )
}