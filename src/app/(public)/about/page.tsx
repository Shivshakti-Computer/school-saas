// FILE: src/app/(public)/about/page.tsx
// HONEST VERSION: Real timeline, real team size, no fake claims

'use client'

import { Container } from '@/components/marketing/Container'
import { SectionTitle } from '@/components/marketing/MiniUI'
import { CTA } from '@/components/marketing/CTA'
import { useReveal, useRevealGroup } from '@/hooks/useReveal'

function Check({ size = 16, color = 'var(--success)' }: {
  size?: number
  color?: string
}) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 20 20"
      fill="none" className="flex-shrink-0"
    >
      <circle cx="10" cy="10" r="10" fill={color} fillOpacity="0.12" />
      <path
        d="M6 10l3 3 5-5"
        stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}

/* ─── DATA — All honest ──────────────────────────── */

const heroStats = [
  { value: '22+', label: 'Modules Built', icon: '📦' },
  { value: '4', label: 'User Roles', icon: '👥' },
  { value: '₹499', label: 'Starting/mo', icon: '💰' },
  { value: '2 min', label: 'Setup Time', icon: '⚡' },
]

const values = [
  {
    icon: '🎯',
    title: 'Our Mission',
    desc: 'Make school management effortless for every school — big or small — across India. No complex setup, no expensive hardware.',
    color: 'var(--brand)',
    lightBg: 'var(--brand-light)',
    borderColor: 'rgba(37,99,235,0.15)',
    gradientFrom: '#3B82F6',
    gradientTo: '#4F46E5',
  },
  {
    icon: '⚡',
    title: 'Speed First',
    desc: 'Every screen loads in under 2 seconds. Works on ₹5,000 Android phones. Optimized for 2G/3G connections in India.',
    color: '#D97706',
    lightBg: 'var(--warning-light)',
    borderColor: 'rgba(245,158,11,0.15)',
    gradientFrom: '#F59E0B',
    gradientTo: '#EA580C',
  },
  {
    icon: '🔒',
    title: 'Data Security',
    desc: 'Each school gets completely isolated data. HTTPS encryption, role-based access, bcrypt password hashing. No shared data ever.',
    color: 'var(--success)',
    lightBg: 'var(--success-light)',
    borderColor: 'rgba(16,185,129,0.15)',
    gradientFrom: '#10B981',
    gradientTo: '#0D9488',
  },
  {
    icon: '🇮🇳',
    title: 'Made for India',
    desc: 'Hindi/English SMS, Razorpay payments in ₹, CBSE/ICSE/State board structure, Indian date formats, GST-ready invoicing.',
    color: '#DC2626',
    lightBg: '#FEF2F2',
    borderColor: 'rgba(239,68,68,0.15)',
    gradientFrom: '#F97316',
    gradientTo: '#DC2626',
  },
  {
    icon: '📱',
    title: 'Mobile First',
    desc: 'Installable PWA app. Teachers mark attendance from phone. Parents check results on the go. No app store needed.',
    color: '#0EA5E9',
    lightBg: '#F0F9FF',
    borderColor: 'rgba(14,165,233,0.15)',
    gradientFrom: '#0EA5E9',
    gradientTo: '#2563EB',
  },
  {
    icon: '💡',
    title: 'Simple by Design',
    desc: 'No training needed. If you can use WhatsApp, you can use Skolify. Clean, intuitive interface built for everyone.',
    color: '#7C3AED',
    lightBg: '#F5F3FF',
    borderColor: 'rgba(124,58,237,0.15)',
    gradientFrom: '#8B5CF6',
    gradientTo: '#6D28D9',
  },
]

// HONEST TIMELINE — 2025 se start, real milestones
const milestones = [
  {
    year: '2025 — June',
    text: 'Shivshakti Computer Academy founded in Ambikapur, Chhattisgarh. Computer education and training started.',
    icon: '🏫',
    color: 'var(--brand)',
    lightBg: 'var(--brand-light)',
  },
  {
    year: '2025 — Late',
    text: 'Observed real problems in local schools — paper registers, manual fees, no parent communication. Idea for Skolify born.',
    icon: '💡',
    color: '#7C3AED',
    lightBg: '#F5F3FF',
  },
  {
    year: '2025–2026',
    text: 'Skolify development begins. Multi-tenant SaaS architecture designed. Core modules built — students, attendance, fees, website.',
    icon: '🏗️',
    color: 'var(--success)',
    lightBg: 'var(--success-light)',
  },
  {
    year: '2026',
    text: 'Platform launched with 22+ modules, 4 user roles, Razorpay integration, SMS/WhatsApp gateway, and PWA support.',
    icon: '🚀',
    color: '#D97706',
    lightBg: 'var(--warning-light)',
  },
]

//  HONEST TECH — no fake team counts
const techStack = [
  { name: 'Next.js 16+', category: 'Frontend', color: '#0F172A' },
  { name: 'TypeScript', category: 'Language', color: '#2563EB' },
  { name: 'Tailwind CSS', category: 'Styling', color: '#06B6D4' },
  { name: 'MongoDB', category: 'Database', color: '#16A34A' },
  { name: 'Razorpay', category: 'Payments', color: '#2563EB' },
  { name: 'PWA', category: 'Mobile', color: '#7C3AED' },
  { name: 'Vercel', category: 'Hosting', color: '#0F172A' },
  { name: 'Cloudinary', category: 'Media', color: '#D97706' },
]

const whyChooseUs = [
  {
    title: 'No Setup Cost',
    desc: 'Zero installation. No hardware. No IT staff needed. Register and start using in 2 minutes.',
    icon: '🆓',
    stat: '₹0 setup',
    color: 'var(--brand)',
    lightBg: 'var(--brand-light)',
    borderColor: 'rgba(37,99,235,0.15)',
  },
  {
    title: 'Affordable Plans',
    desc: 'Start at ₹499/month. No hidden charges. Pay monthly or yearly. Cancel anytime.',
    icon: '💰',
    stat: 'From ₹499/mo',
    color: 'var(--success)',
    lightBg: 'var(--success-light)',
    borderColor: 'rgba(16,185,129,0.15)',
  },
  {
    title: 'All-in-One Platform',
    desc: '22+ modules in one platform. Attendance, fees, exams, website, parent portal — everything connected.',
    icon: '📦',
    stat: '22+ modules',
    color: '#7C3AED',
    lightBg: '#F5F3FF',
    borderColor: 'rgba(124,58,237,0.15)',
  },
  {
    title: 'Direct Founder Support',
    desc: 'You talk directly to the people who built this. No support tickets, no bots — real human help via WhatsApp or call.',
    icon: '🤝',
    stat: 'Founder access',
    color: '#D97706',
    lightBg: 'var(--warning-light)',
    borderColor: 'rgba(245,158,11,0.15)',
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
      <section className="relative pt-24 pb-16 overflow-hidden section-brand-light">
        <div className="absolute inset-0 dot-pattern opacity-50 pointer-events-none" />
        <div
          className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full
            pointer-events-none blur-[120px] opacity-15"
          style={{ background: 'var(--brand)' }}
        />

        <Container>
          <div ref={heroRef} className="reveal max-w-3xl mx-auto text-center">

            <div className="badge-brand inline-flex mb-6">
              <span className="text-lg">💡</span>
              About Skolify
            </div>

            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold
                tracking-tight leading-[1.12] mb-5"
              style={{ color: 'var(--text-primary)' }}
            >
              Built by educators,{' '}
              <span className="gradient-text">for educators</span>
            </h1>

            <p
              className="text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-10"
              style={{ color: 'var(--text-secondary)' }}
            >
              Skolify is a product of{' '}
              <a
                href="https://shivshakticomputer.in"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold hover:underline"
                style={{ color: 'var(--brand)' }}
              >
                Shivshakti Computer Academy
              </a>
              , Ambikapur — built to solve the real problems we saw Indian
              schools face every single day.
            </p>

            {/* Stats — only verifiable claims */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mb-8">
              {heroStats.map(stat => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl
                    border transition-all hover:shadow-soft"
                  style={{
                    background: 'var(--surface-0)',
                    borderColor: 'var(--surface-200)',
                  }}
                >
                  <span className="text-2xl">{stat.icon}</span>
                  <span
                    className="text-2xl font-extrabold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {stat.value}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Info Pills */}
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { icon: '📍', label: 'Ambikapur, Chhattisgarh' },
                // HONEST: 2025 not 2024
                { icon: '📅', label: 'Started 2025' },
                { icon: '🏫', label: 'Education Technology' },
                { icon: '🇮🇳', label: 'Made in India' },
              ].map(item => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-full
                    border text-sm"
                  style={{
                    background: 'rgba(255,255,255,0.8)',
                    borderColor: 'var(--surface-200)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span>{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ════════════════════════════════════════
          OUR STORY — Honest version
      ════════════════════════════════════════ */}
      <section className="py-20 section-white">
        <Container>
          <div ref={storyRef} className="reveal">
            <div className="text-center mb-12">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                  border text-xs font-bold uppercase tracking-wider mb-4"
                style={{
                  background: 'var(--brand-light)',
                  borderColor: 'rgba(37,99,235,0.15)',
                  color: 'var(--brand)',
                }}
              >
                📖 Our Story
              </div>
              <h2
                className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                From a local academy to a school SaaS product
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

              {/* Main story */}
              <div className="lg:col-span-3">
                <div
                  className="rounded-2xl border p-8 shadow-soft"
                  style={{
                    background: 'linear-gradient(135deg, var(--surface-50) 0%, var(--surface-0) 100%)',
                    borderColor: 'var(--surface-200)',
                  }}
                >
                  <div
                    className="space-y-5 text-[15px] leading-relaxed"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {/*  HONEST: Academy started June 2025 */}
                    <p>
                      In June 2025, we started{' '}
                      <strong style={{ color: 'var(--text-primary)' }}>
                        Shivshakti Computer Academy
                      </strong>{' '}
                      in Ambikapur, Chhattisgarh — a computer training institute
                      focused on practical skills. Working closely with local schools
                      and their staff, we saw the same problems repeating every day.
                    </p>
                    <p>
                      Principals managing attendance in paper registers. Teachers
                      sending fee reminders manually. Parents calling to check results.
                      Most existing school software was either{' '}
                      <span className="font-semibold" style={{ color: 'var(--danger)' }}>
                        too expensive
                      </span>{' '}
                      (₹50,000+ setup),{' '}
                      <span className="font-semibold" style={{ color: 'var(--danger)' }}>
                        too complex
                      </span>{' '}
                      (needing dedicated IT staff), or simply{' '}
                      <span className="font-semibold" style={{ color: 'var(--danger)' }}>
                        not built for how Indian schools actually work.
                      </span>
                    </p>
                    {/*  HONEST: "recent months" not fake 2024 date */}
                    <p>
                      So we decided to build{' '}
                      <strong style={{ color: 'var(--brand)' }}>Skolify</strong> — a
                      modern, cloud-based school management platform designed from the
                      ground up for Indian schools. No installation, no hardware, no long
                      contracts. Just register, log in, and start managing your school
                      in minutes.
                    </p>
                  </div>

                  {/* Problem → Solution */}
                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      className="p-5 rounded-xl border"
                      style={{
                        background: 'var(--danger-light)',
                        borderColor: 'rgba(239,68,68,0.2)',
                      }}
                    >
                      <p
                        className="text-xs font-bold uppercase tracking-wider mb-3
                          flex items-center gap-1.5"
                        style={{ color: 'var(--danger)' }}
                      >
                        <span
                          className="w-5 h-5 rounded flex items-center justify-center"
                          style={{ background: 'rgba(239,68,68,0.15)' }}
                        >
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path
                              d="M2 2l6 6M8 2l-6 6"
                              stroke="var(--danger)" strokeWidth="1.8"
                              strokeLinecap="round"
                            />
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
                        ].map(item => (
                          <li
                            key={item}
                            className="flex items-start gap-2 text-sm"
                            style={{ color: 'var(--danger)' }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                              style={{ background: 'var(--danger)' }}
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div
                      className="p-5 rounded-xl border"
                      style={{
                        background: 'var(--success-light)',
                        borderColor: 'rgba(16,185,129,0.2)',
                      }}
                    >
                      <p
                        className="text-xs font-bold uppercase tracking-wider mb-3
                          flex items-center gap-1.5"
                        style={{ color: 'var(--success)' }}
                      >
                        <span
                          className="w-5 h-5 rounded flex items-center justify-center"
                          style={{ background: 'rgba(16,185,129,0.15)' }}
                        >
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M2 6l3 3 5-5"
                              stroke="var(--success)" strokeWidth="2"
                              strokeLinecap="round" strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        Skolify's Answer
                      </p>
                      <ul className="space-y-2">
                        {[
                          'Start at ₹499/month, ₹0 setup cost',
                          'Zero installation, instant start',
                          'Mobile-first PWA — works everywhere',
                          'Built specifically for Indian schools',
                          'SMS + WhatsApp to parents built-in',
                        ].map(item => (
                          <li
                            key={item}
                            className="flex items-start gap-2 text-sm"
                            style={{ color: '#059669' }}
                          >
                            <Check size={14} color="var(--success)" />
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
                <div
                  className="p-6 rounded-2xl border"
                  style={{
                    background: 'linear-gradient(135deg, var(--brand-light) 0%, #F0F9FF 100%)',
                    borderColor: 'rgba(37,99,235,0.2)',
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center
                        shadow-brand flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, var(--brand) 0%, #4F46E5 100%)',
                      }}
                    >
                      <span className="text-white font-extrabold text-lg">SC</span>
                    </div>
                    <div>
                      <p
                        className="text-base font-bold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Shivshakti Computer Academy
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Parent Organization · Est. June 2025
                      </p>
                    </div>
                  </div>
                  <p
                    className="text-sm leading-relaxed mb-4"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    A computer training institute in Ambikapur with hands-on
                    experience working with local schools — the real foundation
                    behind Skolify's design.
                  </p>
                  <a
                    href="https://shivshakticomputer.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold
                      hover:underline"
                    style={{ color: 'var(--brand)' }}
                  >
                    Visit Academy Website
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 8h10M9 4l4 4-4 4"
                        stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                </div>

                {/* Honest info cards */}
                {[
                  {
                    icon: '🏦',
                    // HONEST: bootstrapped
                    title: 'Bootstrapped & Independent',
                    desc: 'No investors, no external funding. Built with our own resources. This means we answer only to our users — not to VCs.',
                    color: 'var(--success)',
                    lightBg: 'var(--success-light)',
                    borderColor: 'rgba(16,185,129,0.2)',
                  },
                  {
                    icon: '📍',
                    title: 'Ambikapur, Chhattisgarh',
                    desc: 'Proudly built from a Tier-3 city. Proving great software can be built from anywhere in India.',
                    color: '#D97706',
                    lightBg: 'var(--warning-light)',
                    borderColor: 'rgba(245,158,11,0.2)',
                  },
                  {
                    icon: '🔍',
                    title: 'Honest & Transparent',
                    desc: 'We are a new product. No fake testimonials, no inflated user counts. Real features, real pricing, growing every week.',
                    color: '#7C3AED',
                    lightBg: '#F5F3FF',
                    borderColor: 'rgba(124,58,237,0.2)',
                  },
                ].map(card => (
                  <div
                    key={card.title}
                    className="p-5 rounded-2xl border transition-all hover:shadow-soft"
                    style={{ background: card.lightBg, borderColor: card.borderColor }}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="text-2xl">{card.icon}</span>
                      <span
                        className="text-sm font-bold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {card.title}
                      </span>
                    </div>
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {card.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ════════════════════════════════════════
          WHY CHOOSE US
      ════════════════════════════════════════ */}
      <section className="py-20 section-light">
        <Container>
          <SectionTitle
            eyebrow="🏆 Why Skolify"
            title="What makes us different"
            subtitle="We're a new product — but that's exactly our advantage. Fresh build, modern tech, direct support."
            center
          />

          <div
            ref={whyRef}
            className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
              gap-5 reveal-stagger"
          >
            {whyChooseUs.map(item => (
              <div
                key={item.title}
                className="reveal group rounded-2xl border p-6 text-center
                  transition-all duration-300 hover:-translate-y-1 hover:shadow-medium"
                style={{
                  background: 'var(--surface-0)',
                  borderColor: 'var(--surface-200)',
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center
                    mx-auto mb-4 transition-transform group-hover:scale-110 border"
                  style={{ background: item.lightBg, borderColor: item.borderColor }}
                >
                  <span className="text-3xl">{item.icon}</span>
                </div>
                <div
                  className="inline-flex items-center px-3 py-1 rounded-full
                    border text-xs font-bold mb-3"
                  style={{
                    background: item.lightBg,
                    borderColor: item.borderColor,
                    color: item.color,
                  }}
                >
                  {item.stat}
                </div>
                <h3
                  className="text-base font-bold mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ════════════════════════════════════════
          VALUES
      ════════════════════════════════════════ */}
      <section className="py-20 section-white relative">
        <Container>
          <SectionTitle
            eyebrow="💎 Core Values"
            title="Principles that guide every decision"
            subtitle="From code architecture to pricing — these values shape everything we build."
            center
          />

          <div
            ref={valuesRef}
            className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
              gap-5 reveal-stagger"
          >
            {values.map(v => (
              <div
                key={v.title}
                className="reveal group rounded-2xl border p-6 flex flex-col
                  transition-all duration-300 hover:-translate-y-1 hover:shadow-medium"
                style={{
                  background: 'var(--surface-0)',
                  borderColor: v.borderColor,
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center
                    mb-4 transition-transform group-hover:scale-110 border"
                  style={{ background: v.lightBg, borderColor: v.borderColor }}
                >
                  <span className="text-2xl">{v.icon}</span>
                </div>
                <h3
                  className="text-base font-bold mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {v.title}
                </h3>
                <p
                  className="text-sm leading-relaxed flex-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {v.desc}
                </p>
                <div
                  className="mt-5 h-[3px] rounded-full overflow-hidden"
                  style={{ background: 'var(--surface-100)' }}
                >
                  <div
                    className="h-full w-0 group-hover:w-full transition-all
                      duration-500 rounded-full"
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
          TIMELINE — Honest 2025 start
      ════════════════════════════════════════ */}
      <section className="py-20 section-light">
        <Container>
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                border text-xs font-bold uppercase tracking-wider mb-4"
              style={{
                background: '#F5F3FF',
                borderColor: 'rgba(124,58,237,0.15)',
                color: '#7C3AED',
              }}
            >
              📅 Our Journey
            </div>
            <h2
              className="text-2xl sm:text-3xl font-extrabold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              How Skolify came to be
            </h2>
            <p
              className="mt-3 text-base max-w-xl mx-auto"
              style={{ color: 'var(--text-secondary)' }}
            >
              A honest account of how we went from a local academy
              to a full school management platform.
            </p>
          </div>

          <div ref={timelineRef} className="reveal max-w-2xl mx-auto">
            <div className="relative">
              <div
                className="absolute left-6 top-0 bottom-0 w-0.5 rounded-full"
                style={{
                  background: 'linear-gradient(to bottom, var(--brand), #7C3AED, var(--success), #D97706)',
                }}
              />

              <div className="space-y-5">
                {milestones.map((m, i) => (
                  <div key={i} className="relative pl-16 group">
                    <div
                      className="absolute left-0 top-2 w-12 h-12 rounded-xl
                        flex items-center justify-center border-2 transition-all
                        group-hover:shadow-soft"
                      style={{ background: m.lightBg, borderColor: m.color }}
                    >
                      <span className="text-xl">{m.icon}</span>
                    </div>

                    <div
                      className="p-5 rounded-2xl border transition-all hover:shadow-soft"
                      style={{
                        background: 'var(--surface-0)',
                        borderColor: 'var(--surface-200)',
                      }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className="text-xs font-bold uppercase tracking-wider
                            px-2.5 py-1 rounded-full border"
                          style={{
                            background: m.lightBg,
                            borderColor: `${m.color}30`,
                            color: m.color,
                          }}
                        >
                          {m.year}
                        </span>
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: m.color }}
                        />
                      </div>
                      <p
                        className="text-sm font-medium leading-relaxed"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {m.text}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Coming next */}
                <div className="relative pl-16">
                  <div
                    className="absolute left-0 top-2 w-12 h-12 rounded-xl
                      border-2 border-dashed flex items-center justify-center"
                    style={{
                      background: 'var(--surface-50)',
                      borderColor: 'var(--surface-300)',
                    }}
                  >
                    <span className="text-xl">🔮</span>
                  </div>
                  <div
                    className="p-5 rounded-2xl border-2 border-dashed"
                    style={{
                      background: 'var(--surface-50)',
                      borderColor: 'var(--surface-300)',
                    }}
                  >
                    <span
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Coming Next
                    </span>
                    <p
                      className="mt-2 text-sm font-medium"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      AI-powered analytics, transport GPS tracking, advanced
                      reporting, more regional language support, mobile apps...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ════════════════════════════════════════
          TEAM — Honest, no fake counts
      ════════════════════════════════════════ */}
      <section className="py-20 section-white">
        <Container>
          <div ref={teamRef} className="reveal">
            <div className="text-center mb-12">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                  border text-xs font-bold uppercase tracking-wider mb-4"
                style={{
                  background: 'var(--brand-light)',
                  borderColor: 'rgba(37,99,235,0.15)',
                  color: 'var(--brand)',
                }}
              >
                👤 Who Builds Skolify
              </div>
              <h2
                className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {/* HONEST: Small team, no fake numbers */}
                A lean team with a focused vision
              </h2>
              <p
                className="mt-3 text-base max-w-xl mx-auto"
                style={{ color: 'var(--text-secondary)' }}
              >
                Skolify is built by a small, dedicated team — every line of code,
                every design decision made with Indian schools in mind.
              </p>
            </div>

            {/* HONEST: Roles without fake member counts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
              {[
                {
                  area: 'Full-Stack Development',
                  icon: '💻',
                  desc: 'Next.js, MongoDB, TypeScript, API design',
                  color: 'var(--brand)',
                  lightBg: 'var(--brand-light)',
                },
                {
                  area: 'UI/UX & Design',
                  icon: '🎨',
                  desc: 'Tailwind CSS, responsive design, user flows',
                  color: '#7C3AED',
                  lightBg: '#F5F3FF',
                },
                {
                  area: 'School Domain Expertise',
                  icon: '🏫',
                  desc: 'Real school workflows, Indian education system',
                  color: 'var(--success)',
                  lightBg: 'var(--success-light)',
                },
                {
                  area: 'Customer Support',
                  icon: '🤝',
                  desc: 'WhatsApp, call, screen-sharing support',
                  color: '#D97706',
                  lightBg: 'var(--warning-light)',
                },
              ].map(item => (
                <div
                  key={item.area}
                  className="rounded-2xl border p-6 text-center transition-all
                    hover:-translate-y-1 hover:shadow-medium"
                  style={{
                    background: 'var(--surface-0)',
                    borderColor: 'var(--surface-200)',
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center
                      justify-center mx-auto mb-4 border"
                    style={{
                      background: item.lightBg,
                      borderColor: `${item.color}20`,
                    }}
                  >
                    <span className="text-3xl">{item.icon}</span>
                  </div>
                  <h4
                    className="text-sm font-bold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {item.area}
                  </h4>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* NEW: Honest "small team advantage" callout */}
            <div
              className="rounded-2xl border p-6 mb-8 flex flex-col sm:flex-row
                items-start gap-5"
              style={{
                background: 'linear-gradient(135deg, var(--brand-light) 0%, #F0F9FF 100%)',
                borderColor: 'rgba(37,99,235,0.15)',
              }}
            >
              <div className="text-4xl flex-shrink-0">🚀</div>
              <div>
                <h3
                  className="text-base font-bold mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
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
                      desc: 'Every school that uses Skolify matters to us personally. You are not just a number.',
                    },
                  ].map(point => (
                    <div
                      key={point.title}
                      className="p-4 rounded-xl border"
                      style={{
                        background: 'var(--surface-0)',
                        borderColor: 'rgba(37,99,235,0.1)',
                      }}
                    >
                      <div className="text-xl mb-2">{point.icon}</div>
                      <p
                        className="text-xs font-bold mb-1"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {point.title}
                      </p>
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {point.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tech Stack + Highlights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div
                className="rounded-2xl border p-8 shadow-soft"
                style={{
                  background: 'linear-gradient(135deg, var(--surface-50) 0%, var(--surface-0) 100%)',
                  borderColor: 'var(--surface-200)',
                }}
              >
                <h3
                  className="text-base font-bold mb-1 flex items-center gap-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <span className="text-xl">🛠️</span>
                  Technology Stack
                </h3>
                <p
                  className="text-sm mb-5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Modern, battle-tested technologies for speed and reliability.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {techStack.map(tech => (
                    <div
                      key={tech.name}
                      className="flex items-center gap-3 p-3 rounded-xl border
                        hover:shadow-soft transition-all"
                      style={{
                        background: 'var(--surface-0)',
                        borderColor: 'var(--surface-200)',
                      }}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: tech.color }}
                      />
                      <div>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {tech.name}
                        </p>
                        <p
                          className="text-[10px]"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {tech.category}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div
                  className="p-6 rounded-2xl border"
                  style={{
                    background: 'linear-gradient(135deg, var(--brand-light) 0%, #F0F9FF 100%)',
                    borderColor: 'rgba(37,99,235,0.15)',
                  }}
                >
                  <h3
                    className="text-base font-bold mb-4 flex items-center gap-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <span className="text-xl">✨</span>
                    Platform Specs
                  </h3>
                  {[
                    { label: 'Average page load', value: '< 2 seconds', icon: '⚡' },
                    { label: 'Minimum device', value: '₹5,000 phone', icon: '📱' },
                    { label: 'Setup time', value: '2 minutes', icon: '⏱️' },
                    { label: 'Data isolation', value: 'Per school', icon: '🔒' },
                    { label: 'Uptime target', value: '99.9%', icon: '🟢' },
                  ].map(item => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between py-2.5
                        border-b last:border-0"
                      style={{ borderColor: 'rgba(37,99,235,0.08)' }}
                    >
                      <span
                        className="flex items-center gap-2 text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {item.icon} {item.label}
                      </span>
                      <span
                        className="text-sm font-bold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div
                  className="p-5 rounded-2xl border"
                  style={{
                    background: 'var(--success-light)',
                    borderColor: 'rgba(16,185,129,0.2)',
                  }}
                >
                  <p
                    className="text-sm leading-relaxed flex items-start gap-2"
                    style={{ color: '#059669' }}
                  >
                    <span className="text-lg flex-shrink-0">🌱</span>
                    <span>
                      <strong>Early adopters get the best deal.</strong>{' '}
                      Skolify is actively growing. Schools that join early
                      directly influence what we build next — and get the
                      best pricing locked in.
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