// FILE: src/app/(public)/about/page.tsx
// FULLY CONVERTED + AI LAUNCH UPDATES
// ═══════════════════════════════════════════════════════════

'use client'

import { Container } from '@/components/marketing/Container'
import { SectionTitle } from '@/components/marketing/MiniUI'
import { CTA } from '@/components/marketing/CTA'
import { useReveal, useRevealGroup } from '@/hooks/useReveal'

function Check({ size = 16, color = 'var(--success-600)' }: {
  size?: number
  color?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      className="flex-shrink-0"
    >
      <circle cx="10" cy="10" r="10" fill={color} fillOpacity="0.15" />
      <path
        d="M6 10l3 3 5-5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ─── DATA — All honest ──────────────────────────── */

const heroStats = [
  { value: '22+', label: 'Modules Built', icon: '📦' },
  { value: '4', label: 'User Roles', icon: '👥' },
  { value: '₹499', label: 'Starting/mo', icon: '💰' },
  { value: '🤖', label: 'AI Powered', icon: '✨' }, // NEW: AI badge
]

const values = [
  {
    icon: '🎯',
    title: 'Our Mission',
    desc: 'Make school management effortless for every school — big or small — across India. No complex setup, no expensive hardware.',
    color: 'var(--primary-600)',
    lightBg: 'var(--primary-50)',
    borderColor: 'rgba(99,102,241,0.2)',
    gradientFrom: '#6366f1',
    gradientTo: '#4f46e5',
  },
  {
    icon: '🤖', // NEW: AI icon
    title: 'AI-Powered Assistance',
    desc: 'Built-in AI assistant trained on your school data. Get instant answers, automate tasks, generate reports — all in plain language.',
    color: '#8b5cf6',
    lightBg: '#f5f3ff',
    borderColor: 'rgba(139,92,246,0.2)',
    gradientFrom: '#8b5cf6',
    gradientTo: '#7c3aed',
  },
  {
    icon: '⚡',
    title: 'Speed First',
    desc: 'Every screen loads in under 2 seconds. Works on ₹5,000 Android phones. Optimized for 2G/3G connections in India.',
    color: '#f59e0b',
    lightBg: 'var(--warning-50)',
    borderColor: 'rgba(245,158,11,0.2)',
    gradientFrom: '#f59e0b',
    gradientTo: '#ea580c',
  },
  {
    icon: '🔒',
    title: 'Data Security',
    desc: 'Each school gets completely isolated data. HTTPS encryption, role-based access, bcrypt password hashing. AI never shares data between schools.',
    color: 'var(--success-600)',
    lightBg: 'var(--success-50)',
    borderColor: 'rgba(16,185,129,0.2)',
    gradientFrom: '#10b981',
    gradientTo: '#059669',
  },
  {
    icon: '🇮🇳',
    title: 'Made for India',
    desc: 'Hindi/English SMS, Razorpay payments in ₹, CBSE/ICSE/State board structure, Indian date formats, GST-ready invoicing.',
    color: '#dc2626',
    lightBg: '#fef2f2',
    borderColor: 'rgba(239,68,68,0.2)',
    gradientFrom: '#f97316',
    gradientTo: '#dc2626',
  },
  {
    icon: '📱',
    title: 'Mobile First',
    desc: 'Installable PWA app. Teachers mark attendance from phone. Parents check results on the go. No app store needed.',
    color: '#0ea5e9',
    lightBg: '#f0f9ff',
    borderColor: 'rgba(14,165,233,0.2)',
    gradientFrom: '#0ea5e9',
    gradientTo: '#2563eb',
  },
]

// UPDATED TIMELINE with AI launch
const milestones = [
  {
    year: '2025 — June',
    text: 'Shivshakti Computer Academy founded in Ambikapur, Chhattisgarh. Computer education and training started.',
    icon: '🏫',
    color: 'var(--primary-600)',
    lightBg: 'var(--primary-50)',
  },
  {
    year: '2025 — Late',
    text: 'Observed real problems in local schools — paper registers, manual fees, no parent communication. Idea for Skolify born.',
    icon: '💡',
    color: '#8b5cf6',
    lightBg: '#f5f3ff',
  },
  {
    year: '2025–2026',
    text: 'Skolify development begins. Multi-tenant SaaS architecture designed. Core modules built — students, attendance, fees, website.',
    icon: '🏗️',
    color: 'var(--success-600)',
    lightBg: 'var(--success-50)',
  },
  {
    year: '2026 — Q1',
    text: 'Platform launched with 22+ modules, 4 user roles, Razorpay integration, SMS/WhatsApp gateway, and PWA support.',
    icon: '🚀',
    color: '#f59e0b',
    lightBg: 'var(--warning-50)',
  },
  {
    year: '2026 — Q2', // NEW: AI Launch
    text: 'AI Assistant launched! School-specific AI trained on your data. Automates tasks, answers questions, generates insights — all while keeping data private.',
    icon: '🤖',
    color: '#8b5cf6',
    lightBg: '#f5f3ff',
  },
]

const techStack = [
  { name: 'Next.js 16+', category: 'Frontend', color: '#0F172A' },
  { name: 'TypeScript', category: 'Language', color: '#2563EB' },
  { name: 'Tailwind CSS', category: 'Styling', color: '#06B6D4' },
  { name: 'MongoDB', category: 'Database', color: '#16A34A' },
  { name: 'Python + AI', category: 'AI Engine', color: '#8B5CF6' }, // NEW
  { name: 'Razorpay', category: 'Payments', color: '#2563EB' },
  { name: 'PWA', category: 'Mobile', color: '#7C3AED' },
  { name: 'Vercel', category: 'Hosting', color: '#0F172A' },
]

const whyChooseUs = [
  {
    title: 'No Setup Cost',
    desc: 'Zero installation. No hardware. No IT staff needed. Register and start using in 2 minutes.',
    icon: '🆓',
    stat: '₹0 setup',
    color: 'var(--primary-600)',
    lightBg: 'var(--primary-50)',
    borderColor: 'rgba(99,102,241,0.2)',
  },
  {
    title: 'AI-Powered Automation', // NEW
    desc: 'Built-in AI assistant that learns your school. Automates repetitive tasks, answers questions, generates reports instantly.',
    icon: '🤖',
    stat: 'AI Included',
    color: '#8b5cf6',
    lightBg: '#f5f3ff',
    borderColor: 'rgba(139,92,246,0.2)',
  },
  {
    title: 'Affordable Plans',
    desc: 'Start at ₹499/month. AI included in all plans. No hidden charges. Pay monthly or yearly. Cancel anytime.',
    icon: '💰',
    stat: 'From ₹499/mo',
    color: 'var(--success-600)',
    lightBg: 'var(--success-50)',
    borderColor: 'rgba(16,185,129,0.2)',
  },
  {
    title: 'Direct Founder Support',
    desc: 'You talk directly to the people who built this. No support tickets, no bots — real human help via WhatsApp or call.',
    icon: '🤝',
    stat: 'Founder access',
    color: '#f59e0b',
    lightBg: 'var(--warning-50)',
    borderColor: 'rgba(245,158,11,0.2)',
  },
]

/* ═══════════════════════════════════════════════════════
   ABOUT PAGE
   ═══════════════════════════════════════════════════════ */
export default function AboutPage() {
  const heroRef = useReveal<HTMLDivElement>()
  const storyRef = useReveal<HTMLDivElement>()
  const valuesRef = useRevealGroup()
  const timelineRef = useReveal<HTMLDivElement>()
  const teamRef = useReveal<HTMLDivElement>()
  const whyRef = useRevealGroup()

  return (
    <>
      {/* ════════════════════════════════════════
          HERO
      ════════════════════════════════════════ */}
      <section className="relative pt-24 pb-16 overflow-hidden section-hero">
        <div className="absolute inset-0 dot-pattern opacity-40 pointer-events-none" />
        <div className="blob-bg top-0 left-1/4 w-[600px] h-[400px]" style={{ background: 'var(--primary-500)' }} />

        <Container>
          <div ref={heroRef} className="reveal max-w-3xl mx-auto text-center">
            <div className="badge badge-brand inline-flex items-center gap-2 mb-6">
              <span className="text-lg">💡</span>
              About Skolify
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-primary mb-5">
              Built by educators,{' '}
              <span className="gradient-text-warm">powered by AI</span>
            </h1>

            <p className="text-base sm:text-lg leading-relaxed text-secondary max-w-2xl mx-auto mb-10">
              Skolify is a product of{' '}
              <a
                href="https://shivshakticomputer.in"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary-600 hover:underline"
              >
                Shivshakti Computer Academy
              </a>
              , Ambikapur — built to solve real school problems with modern technology and AI assistance.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mb-8">
              {heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className="card flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all hover:shadow-card-hover hover:-translate-y-1"
                >
                  <span className="text-2xl">{stat.icon}</span>
                  <span className="text-2xl font-display font-extrabold text-primary">
                    {stat.value}
                  </span>
                  <span className="text-xs text-muted">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* Info Pills */}
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { icon: '📍', label: 'Ambikapur, Chhattisgarh' },
                { icon: '📅', label: 'Started 2025' },
                { icon: '🤖', label: 'AI-Powered' }, // NEW
                { icon: '🇮🇳', label: 'Made in India' },
              ].map((item) => (
                <div key={item.label} className="badge badge-neutral flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ════════════════════════════════════════
          OUR STORY — Updated with AI
      ════════════════════════════════════════ */}
      <section className="py-20 bg-card">
        <Container>
          <div ref={storyRef} className="reveal">
            <div className="text-center mb-12">
              <div className="badge badge-brand inline-flex items-center gap-2 mb-4">
                📖 Our Story
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-primary">
                From a local academy to an AI-powered school platform
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Main story */}
              <div className="lg:col-span-3">
                <div className="card rounded-2xl border p-8 shadow-card">
                  <div className="space-y-5 text-sm sm:text-base leading-relaxed text-secondary">
                    <p>
                      In June 2025, we started{' '}
                      <strong className="text-primary">Shivshakti Computer Academy</strong>{' '}
                      in Ambikapur, Chhattisgarh — a computer training institute focused on practical skills. Working closely with local schools, we saw the same problems repeating every day.
                    </p>
                    <p>
                      Principals managing attendance in paper registers. Teachers sending fee reminders manually. Parents calling to check results. Most existing school software was either{' '}
                      <span className="font-semibold text-danger-600">too expensive</span>{' '}
                      (₹50,000+ setup),{' '}
                      <span className="font-semibold text-danger-600">too complex</span>{' '}
                      (needing dedicated IT staff), or simply{' '}
                      <span className="font-semibold text-danger-600">not built for how Indian schools actually work.</span>
                    </p>
                    <p>
                      So we decided to build{' '}
                      <strong className="text-primary-600">Skolify</strong> — a modern, cloud-based school management platform designed from the ground up for Indian schools. No installation, no hardware, no long contracts.
                    </p>
                    {/* NEW: AI paragraph */}
                    <p className="p-4 rounded-xl border-2 border-violet-200 bg-violet-50">
                      <span className="text-lg mr-2">🤖</span>
                      <strong className="text-violet-700">Q2 2026 — AI Launch:</strong>{' '}
                      We integrated a powerful AI assistant trained specifically on school workflows. Now schools can automate repetitive tasks, get instant answers, and generate insights — all in plain language, with complete data privacy.
                    </p>
                  </div>

                  {/* Problem → Solution */}
                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="card rounded-xl p-5 border-danger-300 bg-danger-50">
                      <p className="text-xs font-display font-bold uppercase tracking-wider text-danger-600 mb-3 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded flex items-center justify-center bg-danger-100">
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 2l6 6M8 2l-6 6" stroke="var(--danger-600)" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                        </span>
                        The Problem
                      </p>
                      <ul className="space-y-2">
                        {[
                          'Expensive legacy software (₹50K+ setup)',
                          'Complex — needs dedicated IT staff',
                          'Desktop-only, no mobile access',
                          'Not designed for Indian schools',
                          'No parent communication tools',
                        ].map((item) => (
                          <li key={item} className="flex items-start gap-2 text-sm text-danger-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-danger-600 flex-shrink-0 mt-1.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="card rounded-xl p-5 border-success-300 bg-success-50">
                      <p className="text-xs font-display font-bold uppercase tracking-wider text-success-700 mb-3 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded flex items-center justify-center bg-success-100">
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="var(--success-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        Skolify's Answer
                      </p>
                      <ul className="space-y-2">
                        {[
                          'Start at ₹499/month, ₹0 setup cost',
                          'AI assistant included — automates tasks',
                          'Mobile-first PWA — works everywhere',
                          'Built specifically for Indian schools',
                          'SMS + WhatsApp to parents built-in',
                        ].map((item) => (
                          <li key={item} className="flex items-start gap-2 text-sm text-success-800">
                            <Check size={14} color="var(--success-600)" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Side cards */}
              <div className="lg:col-span-2 space-y-4">
                {/* Academy card */}
                <div className="card rounded-2xl p-6 border-primary-200 bg-gradient-to-br from-primary-50 to-info-50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-primary flex-shrink-0 bg-gradient-to-br from-primary-600 to-primary-700">
                      <span className="text-white font-extrabold text-lg">SC</span>
                    </div>
                    <div>
                      <p className="font-display text-base font-bold text-primary">
                        Shivshakti Computer Academy
                      </p>
                      <p className="text-xs text-muted">Parent Organization · Est. June 2025</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-secondary mb-4">
                    A computer training institute in Ambikapur with hands-on experience working with local schools — the real foundation behind Skolify's design.
                  </p>
                  <a
                    href="https://shivshakticomputer.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-display font-semibold text-primary-600 hover:underline"
                  >
                    Visit Academy Website
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </div>

                {/* NEW: AI Privacy Card */}
                <div className="card rounded-2xl p-5 border-violet-200 bg-violet-50">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-2xl">🤖</span>
                    <span className="font-display text-sm font-bold text-primary">
                      AI with Complete Privacy
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-secondary">
                    Our AI is school-specific. Your school's data never mixes with other schools. Not even the AI model sees cross-school data. Complete isolation guaranteed.
                  </p>
                </div>

                {/* Other info cards */}
                {[
                  {
                    icon: '🏦',
                    title: 'Bootstrapped & Independent',
                    desc: 'No investors, no external funding. Built with our own resources. We answer only to our users.',
                    color: 'var(--success-600)',
                    lightBg: 'var(--success-50)',
                    borderColor: 'rgba(16,185,129,0.2)',
                  },
                  {
                    icon: '📍',
                    title: 'Ambikapur, Chhattisgarh',
                    desc: 'Proudly built from a Tier-3 city. Proving great software can be built from anywhere in India.',
                    color: '#f59e0b',
                    lightBg: 'var(--warning-50)',
                    borderColor: 'rgba(245,158,11,0.2)',
                  },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="card rounded-2xl p-5 border transition-all hover:shadow-card-hover"
                    style={{ background: card.lightBg, borderColor: card.borderColor }}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="text-2xl">{card.icon}</span>
                      <span className="font-display text-sm font-bold text-primary">
                        {card.title}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-secondary">{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ════════════════════════════════════════
          WHY CHOOSE US — Updated with AI
      ════════════════════════════════════════ */}
      <section className="py-20 bg-muted">
        <Container>
          <SectionTitle
            eyebrow="🏆 Why Skolify"
            title="What makes us different"
            subtitle="Modern tech stack + AI automation + direct founder support = school management made effortless."
          />

          <div ref={whyRef} className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 reveal-stagger">
            {whyChooseUs.map((item) => (
              <div
                key={item.title}
                className="reveal card-interactive rounded-2xl border p-6 text-center transition-all duration-300 hover:-translate-y-2 shadow-card"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110 border"
                  style={{ background: item.lightBg, borderColor: item.borderColor }}
                >
                  <span className="text-3xl">{item.icon}</span>
                </div>
                <div
                  className="badge inline-flex items-center px-3 py-1 text-xs font-bold mb-3"
                  style={{
                    background: item.lightBg,
                    borderColor: item.borderColor,
                    color: item.color,
                  }}
                >
                  {item.stat}
                </div>
                <h3 className="font-display text-base font-bold text-primary mb-2">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-secondary">{item.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ════════════════════════════════════════
          VALUES — Updated with AI
      ════════════════════════════════════════ */}
      <section className="py-20 bg-card relative overflow-hidden">
        <Container>
          <SectionTitle
            eyebrow="💎 Core Values"
            title="Principles that guide every decision"
            subtitle="From code architecture to AI training — these values shape everything we build."
          />

          <div ref={valuesRef} className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 reveal-stagger">
            {values.map((v) => (
              <div
                key={v.title}
                className="reveal card-interactive rounded-2xl border p-6 flex flex-col transition-all duration-300 hover:-translate-y-2 shadow-card"
                style={{ borderColor: v.borderColor }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 border"
                  style={{ background: v.lightBg, borderColor: v.borderColor }}
                >
                  <span className="text-2xl">{v.icon}</span>
                </div>
                <h3 className="font-display text-base font-bold text-primary mb-2">
                  {v.title}
                </h3>
                <p className="text-sm leading-relaxed text-secondary flex-1">{v.desc}</p>
                <div className="mt-5 h-[3px] rounded-full overflow-hidden bg-border">
                  <div
                    className="h-full w-0 group-hover:w-full transition-all duration-500 rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${v.gradientFrom}, ${v.gradientTo})`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ════════════════════════════════════════
          TIMELINE — Updated with AI launch
      ════════════════════════════════════════ */}
      <section className="py-20 bg-muted">
        <Container>
          <div className="text-center mb-12">
            <div className="badge badge-brand inline-flex items-center gap-2 mb-4">
              📅 Our Journey
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-primary">
              How Skolify came to be
            </h2>
            <p className="mt-3 text-base max-w-xl mx-auto text-secondary">
              From a local academy to an AI-powered school platform — our honest timeline.
            </p>
          </div>

          <div ref={timelineRef} className="reveal max-w-2xl mx-auto">
            <div className="relative">
              <div
                className="absolute left-6 top-0 bottom-0 w-0.5 rounded-full"
                style={{
                  background: 'linear-gradient(to bottom, var(--primary-600), #8b5cf6, var(--success-600), #f59e0b)',
                }}
              />

              <div className="space-y-5">
                {milestones.map((m, i) => (
                  <div key={i} className="relative pl-16 group">
                    <div
                      className="absolute left-0 top-2 w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all group-hover:shadow-card"
                      style={{ background: m.lightBg, borderColor: m.color }}
                    >
                      <span className="text-xl">{m.icon}</span>
                    </div>

                    <div className="card p-5 rounded-2xl border transition-all hover:shadow-card-hover">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className="badge text-xs font-bold uppercase tracking-wider px-2.5 py-1"
                          style={{
                            background: m.lightBg,
                            borderColor: `${m.color}30`,
                            color: m.color,
                          }}
                        >
                          {m.year}
                        </span>
                        <div className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                      </div>
                      <p className="text-sm font-medium leading-relaxed text-secondary">
                        {m.text}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Coming next */}
                <div className="relative pl-16">
                  <div className="absolute left-0 top-2 w-12 h-12 rounded-xl border-2 border-dashed flex items-center justify-center bg-subtle border-border-strong">
                    <span className="text-xl">🔮</span>
                  </div>
                  <div className="card p-5 rounded-2xl border-2 border-dashed bg-subtle border-border-strong">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted">
                      Coming Next
                    </span>
                    <p className="mt-2 text-sm font-medium text-muted">
                      Advanced AI analytics, transport GPS tracking, mobile apps, more regional language support...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ════════════════════════════════════════
          TEAM — Updated with AI
      ════════════════════════════════════════ */}
      <section className="py-20 bg-card">
        <Container>
          <div ref={teamRef} className="reveal">
            <div className="text-center mb-12">
              <div className="badge badge-brand inline-flex items-center gap-2 mb-4">
                👤 Who Builds Skolify
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-primary">
                A lean team with a focused vision
              </h2>
              <p className="mt-3 text-base max-w-xl mx-auto text-secondary">
                Skolify is built by a small, dedicated team — every line of code, every AI training session, every design decision made with Indian schools in mind.
              </p>
            </div>

            {/* Roles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
              {[
                {
                  area: 'Full-Stack Development',
                  icon: '💻',
                  desc: 'Next.js, MongoDB, TypeScript, API design',
                  color: 'var(--primary-600)',
                  lightBg: 'var(--primary-50)',
                },
                {
                  area: 'AI & Automation', // NEW
                  icon: '🤖',
                  desc: 'Python, LLM training, data isolation, AI workflows',
                  color: '#8b5cf6',
                  lightBg: '#f5f3ff',
                },
                {
                  area: 'UI/UX & Design',
                  icon: '🎨',
                  desc: 'Tailwind CSS, responsive design, user flows',
                  color: '#0ea5e9',
                  lightBg: '#f0f9ff',
                },
                {
                  area: 'School Domain Expertise',
                  icon: '🏫',
                  desc: 'Real school workflows, Indian education system',
                  color: 'var(--success-600)',
                  lightBg: 'var(--success-50)',
                },
              ].map((item) => (
                <div
                  key={item.area}
                  className="card rounded-2xl border p-6 text-center transition-all hover:-translate-y-1 hover:shadow-card-hover"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border"
                    style={{ background: item.lightBg, borderColor: `${item.color}20` }}
                  >
                    <span className="text-3xl">{item.icon}</span>
                  </div>
                  <h4 className="font-display text-sm font-bold text-primary mb-2">
                    {item.area}
                  </h4>
                  <p className="text-xs leading-relaxed text-muted">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Small team advantage */}
            <div className="card rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-50 to-violet-50 p-6 mb-8 flex flex-col sm:flex-row items-start gap-5 shadow-card">
              <div className="text-4xl flex-shrink-0">🚀</div>
              <div>
                <h3 className="font-display text-base font-bold text-primary mb-2">
                  Why a small team is actually a good thing for you
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  {[
                    {
                      icon: '⚡',
                      title: 'Fast decisions',
                      desc: 'No corporate bureaucracy. Feature requested today, shipped this week.',
                    },
                    {
                      icon: '🎯',
                      title: 'Direct access',
                      desc: 'You talk directly to the people who built the product — not a support agent.',
                    },
                    {
                      icon: '❤️',
                      title: 'We care deeply',
                      desc: 'Every school matters to us personally. You are not just a number.',
                    },
                  ].map((point) => (
                    <div
                      key={point.title}
                      className="card p-4 rounded-xl border border-primary-100"
                    >
                      <div className="text-xl mb-2">{point.icon}</div>
                      <p className="text-xs font-bold text-primary mb-1">{point.title}</p>
                      <p className="text-xs leading-relaxed text-secondary">{point.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tech Stack */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="card rounded-2xl border p-8 shadow-card">
                <h3 className="font-display text-base font-bold text-primary mb-1 flex items-center gap-2">
                  <span className="text-xl">🛠️</span>
                  Technology Stack
                </h3>
                <p className="text-sm text-secondary mb-5">
                  Modern, battle-tested technologies for speed, reliability & AI.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {techStack.map((tech) => (
                    <div
                      key={tech.name}
                      className="card flex items-center gap-3 p-3 rounded-xl border hover:shadow-card-hover transition-all"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: tech.color }}
                      />
                      <div>
                        <p className="text-sm font-semibold text-primary">{tech.name}</p>
                        <p className="text-2xs text-muted">{tech.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="card rounded-2xl p-6 border border-primary-200 bg-gradient-to-br from-primary-50 to-info-50">
                  <h3 className="font-display text-base font-bold text-primary mb-4 flex items-center gap-2">
                    <span className="text-xl">✨</span>
                    Platform Specs
                  </h3>
                  {[
                    { label: 'Average page load', value: '< 2 seconds', icon: '⚡' },
                    { label: 'Minimum device', value: '₹5,000 phone', icon: '📱' },
                    { label: 'Setup time', value: '2 minutes', icon: '⏱️' },
                    { label: 'AI response', value: '< 3 seconds', icon: '🤖' }, // NEW
                    { label: 'Data isolation', value: 'Per school', icon: '🔒' },
                    { label: 'Uptime target', value: '99.9%', icon: '🟢' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between py-2.5 border-b border-primary-100 last:border-0"
                    >
                      <span className="flex items-center gap-2 text-sm text-secondary">
                        {item.icon} {item.label}
                      </span>
                      <span className="text-sm font-bold text-primary">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="card p-5 rounded-2xl border border-success-300 bg-success-50">
                  <p className="text-sm leading-relaxed flex items-start gap-2 text-success-800">
                    <span className="text-lg flex-shrink-0">🌱</span>
                    <span>
                      <strong>Early adopters get the best deal.</strong> Schools that join early directly influence what we build next — and get the best pricing locked in.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <CTA />
    </>
  )
}