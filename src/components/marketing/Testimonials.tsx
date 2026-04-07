// FILE: src/components/marketing/Testimonials.tsx
// FULLY CONVERTED TO LOCKED DESIGN PATTERN
// ═══════════════════════════════════════════════════════════

"use client"

import { Container } from './Container'
import { SectionTitle } from './MiniUI'
import { useRevealGroup } from '@/hooks/useReveal'

/* 
  PRE-LAUNCH: Instead of fake testimonials, 
  show REAL value propositions as "What to Expect" cards
*/

const valueProps = [
  {
    persona: 'For Principals & Admins',
    icon: '👨‍💼',
    benefits: [
      'Complete school overview in one dashboard',
      'Fee collection tracking with auto reminders',
      'Staff & student management made paperless',
      'Generate reports in PDF & Excel instantly',
    ],
    color: '#3b82f6', // Blue
    bgColor: 'bg-info-50',
  },
  {
    persona: 'For Teachers',
    icon: '👩‍🏫',
    benefits: [
      'Mark attendance in 30 seconds flat',
      'Enter exam marks — grade cards auto-generated',
      'Assign homework from your phone',
      'Zero training needed — simple UI',
    ],
    color: '#10b981', // Emerald
    bgColor: 'bg-success-50',
  },
  {
    persona: 'For Parents',
    icon: '👨‍👩‍👧',
    benefits: [
      'Check attendance & results anytime',
      'Pay fees online via UPI/Card',
      'Get instant SMS & WhatsApp updates',
      'No school visits needed for basic info',
    ],
    color: '#f59e0b', // Amber
    bgColor: 'bg-warning-50',
  },
]

/* ─── What Makes Us Different ─── */
const differentiators = [
  {
    icon: '🇮🇳',
    title: 'Built for India',
    desc: 'Hindi/English SMS, Razorpay, Indian school structure',
  },
  {
    icon: '📱',
    title: 'Mobile First',
    desc: 'Works perfectly on ₹5,000 Android phones',
  },
  {
    icon: '⚡',
    title: 'Blazing Fast',
    desc: 'Loads in under 2 seconds, even on 2G',
  },
  {
    icon: '💰',
    title: 'Affordable',
    desc: 'Plans starting at just ₹499/month',
  },
]

export function Testimonials() {
  const cardsRef = useRevealGroup()
  const diffsRef = useRevealGroup()

  return (
    <section
      id="testimonials"
      className="section-padding relative bg-gradient-to-b from-primary-50/60 via-card to-card overflow-hidden"
    >
      {/* Background Decorations */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="blob-bg top-0 left-1/3 w-[500px] h-[300px]"
          style={{ background: 'var(--primary-500)' }}
        />
        <div
          className="blob-bg bottom-0 right-1/4 w-[400px] h-[200px]"
          style={{ background: 'var(--violet-500)' }}
        />
      </div>

      <Container>
        {/* Section Header */}
        <SectionTitle
          eyebrow="🎯 Why Skolify"
          title="Built for every person in your school"
          subtitle="One platform, three different experiences — each designed for real daily workflows."
        />

        {/* Value Proposition Cards */}
        <div
          ref={cardsRef}
          className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5 reveal-stagger"
        >
          {valueProps.map((vp) => (
            <div
              key={vp.persona}
              className="reveal card-interactive rounded-2xl border overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-2 transition-all duration-300"
            >
              {/* Top gradient accent */}
              <div
                className="h-1.5"
                style={{
                  background: `linear-gradient(90deg, ${vp.color} 0%, ${vp.color}99 100%)`,
                }}
              />

              <div className="p-6">
                {/* Icon + Persona Badge */}
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className={`w-12 h-12 rounded-xl ${vp.bgColor} flex items-center justify-center flex-shrink-0`}
                  >
                    <span className="text-2xl">{vp.icon}</span>
                  </div>
                  <div>
                    <span
                      className="badge text-2xs font-bold uppercase tracking-wide"
                      style={{
                        background: `${vp.color}10`,
                        color: vp.color,
                        borderColor: `${vp.color}30`,
                      }}
                    >
                      {vp.persona}
                    </span>
                  </div>
                </div>

                {/* Benefits List */}
                <div className="space-y-3">
                  {vp.benefits.map((benefit) => (
                    <div key={benefit} className="flex items-start gap-2.5">
                      {/* Check Icon */}
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                        className="flex-shrink-0 mt-0.5"
                      >
                        <circle cx="9" cy="9" r="9" fill="var(--success-light)" />
                        <path
                          d="M5.5 9l2.5 2.5 4.5-5"
                          stroke="var(--success-600)"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-sm text-secondary leading-relaxed">
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* What Makes Us Different */}
        <div className="mt-16">
          <h3 className="text-center font-display text-lg font-bold text-primary mb-8">
            What makes Skolify different?
          </h3>

          <div
            ref={diffsRef}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 reveal-stagger"
          >
            {differentiators.map((d) => (
              <div
                key={d.title}
                className="reveal card text-center p-5 rounded-2xl border shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
              >
                <div className="text-3xl mb-3">{d.icon}</div>
                <h4 className="font-display text-sm font-bold text-primary mb-1">
                  {d.title}
                </h4>
                <p className="text-xs text-muted leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Honest Bottom Message */}
        <div className="mt-12 text-center animate-fade-in">
          <div className="card inline-flex items-center gap-3 px-5 py-3 rounded-xl border-primary-200 bg-gradient-to-r from-primary-50 to-violet-50">
            <span className="text-xl">🚀</span>
            <p className="text-sm text-secondary">
              <span className="font-bold text-primary">We&apos;re launching soon!</span>{' '}
              Join our early access program and get special founding school benefits.
            </p>
          </div>
        </div>
      </Container>
    </section>
  )
}