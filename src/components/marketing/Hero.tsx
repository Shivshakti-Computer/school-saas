// FILE: src/components/marketing/Hero.tsx

'use client'

import Link from 'next/link'
import { Container } from './Container'
import { useReveal, useRevealGroup } from '@/hooks/useReveal'

/* ─── Trust Points ─── */
const trustPoints = [
  'Works on mobile, tablet & desktop',
  'Installable app experience (PWA)',
  'Plan-wise access control & security',
  'Fast support & onboarding',
]

/* ─── Animated Stats for Dashboard Preview ─── */
const dashboardStats = [
  { label: 'Students', value: '1,248', color: 'from-brand to-purple-500', bar: 78 },
  { label: 'Attendance', value: '94.2%', color: 'from-emerald-500 to-teal-500', bar: 88 },
  { label: 'Fee Collected', value: '₹4.2L', color: 'from-amber-500 to-orange-500', bar: 65 },
  { label: 'SMS Sent', value: '2,340', color: 'from-sky-500 to-blue-500', bar: 72 },
]
/* ─── Bar Chart Data ─── */
const chartBars = [30, 45, 28, 60, 42, 75, 55, 82, 68, 58, 72, 88]

/* ─── Checkmark Icon ─── */
function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
      <circle cx="8" cy="8" r="8" fill="rgba(16,185,129,0.15)" />
      <path d="M5 8l2 2 4-4" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════
   HERO SECTION
   ═══════════════════════════════════════════════════════ */
export function Hero() {
  const headingRef = useReveal<HTMLDivElement>()
  const dashboardRef = useReveal<HTMLDivElement>({ threshold: 0.1 })
  const trustRef = useRevealGroup()

  return (
    <section className="relative overflow-hidden">
      {/* ─── Background Effects ─── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Dot pattern */}
        <div className="absolute inset-0 dot-pattern opacity-40" />

        {/* Gradient orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-brand/[0.07] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/[0.05] blur-[120px]" />

        {/* Top gradient fade from navbar */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[var(--surface-0)] to-transparent" />
      </div>

      <Container>
        <div className="relative pt-20 sm:pt-28 pb-16 sm:pb-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ─── LEFT: Content ─── */}
          <div ref={headingRef} className="reveal">
            {/* Eyebrow pill */}
            <div className="badge-brand mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              School ERP + Website + App — All in One
            </div>

            {/* Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] font-extrabold leading-[1.15] tracking-tight text-white">
              Run your entire school on{' '}
              <span className="gradient-text">
                one modern platform
              </span>
            </h1>

            {/* Subheading */}
            <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed max-w-lg">
              Admissions, attendance, fees, exams, notices, website builder,
              parent portal, teacher tools & 20+ modules.
              Fast, simple, and built for Indian schools.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/register" className="btn-primary">
                Start Free Trial
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href="/#pricing" className="btn-secondary">
                View Pricing
              </Link>
            </div>

            {/* Trust Points */}
            <div ref={trustRef} className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2.5 reveal-stagger">
              {trustPoints.map(point => (
                <div key={point} className="reveal flex items-start gap-2.5 text-sm text-slate-400">
                  <CheckIcon />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ─── RIGHT: Dashboard Preview ─── */}
          <div ref={dashboardRef} className="reveal relative">
            {/* Glow behind dashboard */}
            <div className="absolute -inset-6 bg-brand/[0.08] blur-3xl rounded-[40px] pointer-events-none" aria-hidden="true" />

            {/* Dashboard Card */}
            <div className="relative card-dark overflow-hidden">
              {/* Browser Chrome */}
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
                </div>

                {/* URL Bar */}
                <div className="flex-1 mx-3">
                  <div className="bg-white/[0.04] rounded-md px-3 py-1 text-[11px] text-slate-500 flex items-center gap-1.5">
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                      <rect x="1" y="1" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M5 8h6M8 5v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    app.vidyaflow.in/admin/dashboard
                  </div>
                </div>

                {/* VF Logo */}
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-gradient-to-br from-brand to-purple-500 flex items-center justify-center">
                    <span className="text-white text-[7px] font-bold">VF</span>
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-4 sm:p-5">
                {/* Welcome Header */}
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">Welcome back</p>
                    <p className="text-sm font-bold text-white">Delhi Public School</p>
                  </div>
                  <div className="badge-brand !text-[10px] !py-1 !px-2.5">
                    Growth Plan
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  {dashboardStats.map(stat => (
                    <div
                      key={stat.label}
                      className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 hover:bg-white/[0.05] transition-colors"
                    >
                      <p className="text-[11px] text-slate-500 font-medium">{stat.label}</p>
                      <p className="text-xl font-extrabold text-white mt-1 tracking-tight">
                        {stat.value}
                      </p>
                      {/* Mini indicator bar */}
                      <div className="mt-2 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${stat.color}`}
                          style={{ width: `${stat.bar}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chart */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] text-slate-500 font-medium">Fee Collection — This Month</p>
                    <p className="text-[11px] text-emerald-400 font-semibold">↑ 12%</p>
                  </div>
                  <div className="h-20 flex items-end gap-[3px]">
                    {chartBars.map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm bg-gradient-to-t from-brand to-purple-400 transition-all duration-500"
                        style={{
                          height: `${h}%`,
                          opacity: 0.5 + (h / 200),
                          animationDelay: `${i * 60}ms`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Bottom Info */}
                <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live data · Loads fast on 2G networks
                </div>
              </div>
            </div>

            {/* Floating Badge — Bottom Right */}
            <div className="absolute -bottom-3 -right-3 sm:bottom-4 sm:right-4 glass rounded-xl px-3 py-2 flex items-center gap-2 animate-float">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8.5l4 4 8-9" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Just now</p>
                <p className="text-xs font-semibold text-white">Fee ₹2,500 collected</p>
              </div>
            </div>

            {/* Floating Badge — Top Left */}
            <div
              className="absolute -top-2 -left-2 sm:top-6 sm:-left-4 glass rounded-xl px-3 py-2 flex items-center gap-2 animate-float"
              style={{ animationDelay: '2s' }}
            >
              <div className="w-7 h-7 rounded-lg bg-brand/20 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2v12M2 8h12" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">New admission</p>
                <p className="text-xs font-semibold text-white">Rahul Sharma — Class 5</p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Trusted By Strip ─── */}
        <div className="relative pb-16 sm:pb-20">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-6">
              Trusted by schools across India
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4">
              {[
                'Delhi Public School',
                'Greenwood Academy',
                'St. Mary\'s Convent',
                'Sunrise International',
                'Vidya Niketan',
              ].map(name => (
                <span
                  key={name}
                  className="text-sm font-semibold text-slate-600/50 hover:text-slate-400 transition-colors cursor-default"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}