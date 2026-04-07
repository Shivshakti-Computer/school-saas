// NO 'use client' here — Server Component
import { FeatureGrid }       from '@/components/marketing/FeatureGrid'
import { ModulesShowcase }   from '@/components/marketing/ModulesShowcase'
import { CTA }               from '@/components/marketing/CTA'
import { Container }         from '@/components/marketing/Container'
import { PlatformFeatures }  from '@/components/marketing/PlatformFeatures'
import { PLANS, TRIAL_CONFIG } from '@/config/pricing'
import type { Metadata }     from 'next'

/* ─────────────────────────────────────────────────────────────
   METADATA — Server only, no 'use client'
   ───────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title:      'Features — All-in-One School Management Platform',
  description:
    'Explore 22+ modules — student management, attendance, online fees, exams, website builder, PWA app, parent portal & more. Built for Indian schools by Shivshakti Computer Academy.',
  alternates: { canonical: '/features' },
}

/* ─────────────────────────────────────────────────────────────
   PAGE — Server Component
   ───────────────────────────────────────────────────────────── */

export default function FeaturesPage() {
  const starterPlan = PLANS.starter
  const growthPlan  = PLANS.growth

  const quickStats = [
    { value: '22+',                              label: 'Modules',          icon: '📦' },
    { value: '4',                                label: 'User Roles',       icon: '👥' },
    { value: '₹499',                             label: 'Starting/mo',      icon: '💰' },
    { value: `${TRIAL_CONFIG.durationDays}-Day`, label: 'Free Trial',       icon: '🎁' },
    { value: '1 Credit',                         label: '= 1 SMS/WhatsApp', icon: '💳' },
  ]

  return (
    <>
      {/* ════════════════════════════════════════════
          PAGE HERO
          ════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'var(--bg-base)' }}
      >
        {/* Background decorations */}
        <div aria-hidden="true" style={{ pointerEvents: 'none' }}>
          <div style={{
            position:   'absolute', top: '-10%', left: '-5%',
            width: '45%', height: '70%',
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%)',
          }} />
          <div style={{
            position:   'absolute', top: '0%', right: '-5%',
            width: '35%', height: '60%',
            background: 'radial-gradient(ellipse, rgba(139,92,246,0.07) 0%, transparent 70%)',
          }} />
          <div style={{
            position:           'absolute', inset: 0,
            backgroundImage:    'radial-gradient(circle, rgba(99,102,241,0.07) 1px, transparent 1px)',
            backgroundSize:     '28px 28px',
            maskImage:          'radial-gradient(ellipse 70% 70% at 50% 40%, black 20%, transparent 100%)',
            WebkitMaskImage:    'radial-gradient(ellipse 70% 70% at 50% 40%, black 20%, transparent 100%)',
          }} />
          <div style={{
            position:   'absolute', bottom: 0, left: 0, right: 0,
            height:     '80px',
            background: 'linear-gradient(to bottom, transparent, var(--bg-base))',
          }} />
        </div>

        <Container>
          <div
            className="relative text-center max-w-3xl mx-auto pt-20 pb-14"
            style={{ zIndex: 2 }}
          >
            {/* Live badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2
                         rounded-full text-xs font-bold font-display
                         tracking-wide mb-6"
              style={{
                background: 'var(--bg-card)',
                border:     '1px solid var(--border)',
                color:      'var(--text-secondary)',
                boxShadow:  'var(--shadow-sm)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: 'var(--primary-500)' }}
              />
              Complete Platform Overview
            </div>

            {/* Heading */}
            <h1
              className="font-display font-extrabold tracking-tight
                         leading-[1.12] mb-5"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', color: 'var(--text-primary)' }}
            >
              Built for{' '}
              <span style={{
                background:           'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 50%, var(--accent-500) 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip:       'text',
                WebkitTextFillColor: 'transparent',
              }}>
                real school workflows
              </span>
            </h1>

            {/* Subtext */}
            <p
              className="text-[1.0625rem] leading-relaxed font-body mb-10"
              style={{ color: 'var(--text-secondary)' }}
            >
              Fast admin operations, clean teacher tools, simple parent &amp; student
              experience. 22+ modules, 4 user roles, one connected platform.
            </p>

            {/* Quick stats */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {quickStats.map(stat => (
                <div
                  key={stat.label}
                  className="flex items-center gap-2.5 px-4 py-2.5
                             rounded-[var(--radius-md)]"
                  style={{
                    background: 'var(--bg-card)',
                    border:     '1px solid var(--border)',
                    boxShadow:  'var(--shadow-xs)',
                  }}
                >
                  <span className="text-lg">{stat.icon}</span>
                  <div className="text-left">
                    <span
                      className="text-sm font-extrabold font-display"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {stat.value}
                    </span>
                    <span
                      className="text-xs font-body ml-1.5"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {stat.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Credit callout */}
            <div
              className="inline-flex items-center gap-3 px-5 py-3.5
                         rounded-[var(--radius-lg)] text-left"
              style={{
                background: 'linear-gradient(135deg, var(--primary-50), rgba(139,92,246,0.06))',
                border:     '1px solid var(--primary-200)',
              }}
            >
              <span className="text-xl flex-shrink-0">💳</span>
              <div>
                <p className="text-xs font-bold font-display"
                  style={{ color: 'var(--text-primary)' }}>
                  Pay-as-you-go Messaging
                </p>
                <p className="text-[11px] font-body mt-0.5 leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}>
                  {starterPlan.freeCreditsPerMonth} free credits/mo (Starter) ·{' '}
                  {growthPlan.freeCreditsPerMonth} (Growth) · Credits rollover in paid plans
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <FeatureGrid />
      <ModulesShowcase />
      <PlatformFeatures />
      <CTA />
    </>
  )
}