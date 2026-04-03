// FILE: src/app/(public)/features/page.tsx
// UPDATED: Credit system + addon info added

import { FeatureGrid } from '@/components/marketing/FeatureGrid'
import { ModulesShowcase } from '@/components/marketing/ModulesShowcase'
import { CTA } from '@/components/marketing/CTA'
import { Container } from '@/components/marketing/Container'
import type { Metadata } from 'next'
import { PlatformFeatures } from '@/components/marketing/PlatformFeatures'
import { PLANS, TRIAL_CONFIG, CREDIT_COSTS } from '@/config/pricing'

export const metadata: Metadata = {
  title: 'Features — All-in-One School Management Platform',
  description:
    'Explore 22+ modules — student management, attendance, online fees, exams, website builder, PWA app, parent portal & more. Built for Indian schools by Shivshakti Computer Academy.',
  alternates: {
    canonical: '/features',
  },
}

export default function FeaturesPage() {
  const starterPlan = PLANS.starter
  const growthPlan = PLANS.growth

  return (
    <>
      {/* ─── Page Hero ─── */}
      <section className="relative pt-24 pb-12 overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white">
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

            {/* Quick stats — UPDATED */}
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {[
                { value: '22+', label: 'Modules', icon: '📦' },
                { value: '4', label: 'User Roles', icon: '👥' },
                { value: '₹499', label: 'Starting/mo', icon: '💰' },
                { value: `${TRIAL_CONFIG.durationDays}-Day`, label: 'Free Trial', icon: '🎁' },
                { value: '1 Credit', label: '= 1 SMS/WhatsApp', icon: '💳' },
              ].map(stat => (
                <div
                  key={stat.label}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-slate-200 shadow-soft"
                >
                  <span className="text-xl">{stat.icon}</span>
                  <div className="text-left">
                    <span className="text-base font-extrabold text-slate-900">{stat.value}</span>
                    <span className="text-xs text-slate-500 ml-1">{stat.label}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Credit system mini callout — NEW */}
            <div className="mt-6 inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-indigo-50 border border-indigo-100">
              <span className="text-lg">💳</span>
              <div className="text-left">
                <p className="text-xs font-bold text-indigo-900">Pay-as-you-go Messaging</p>
                <p className="text-[11px] text-indigo-700 mt-0.5">
                  {starterPlan.freeCreditsPerMonth} free credits/mo (Starter) ·
                  {' '}{growthPlan.freeCreditsPerMonth} (Growth) · Credits rollover in paid plans
                </p>
              </div>
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