import Link      from 'next/link'
import { Container } from './Container'

/* ─────────────────────────────────────────────────────────────
   CTA SECTION — Server Component (no 'use client' needed)
   ───────────────────────────────────────────────────────────── */

const trustPoints = [
  'Free to start',
  'No credit card',
  'Cancel anytime',
  'Personal onboarding',
]

const quickStats = [
  { value: '22+',   label: 'Modules',    icon: '📦' },
  { value: '₹499',  label: 'Starting/mo',icon: '💰' },
  { value: '4',     label: 'User Roles', icon: '👥' },
  { value: '2 min', label: 'Setup Time', icon: '⚡' },
]

const miniCards = [
  {
    icon:  '📱',
    title: 'Works on any device',
    desc:  'Phone, tablet & desktop — even on ₹5K phones',
    bg:    'var(--success-light)',
    border:'rgba(16,185,129,0.2)',
  },
  {
    icon:  '🔒',
    title: 'Bank-grade security',
    desc:  'Encrypted data, role-based access, isolated per school',
    bg:    'var(--warning-light)',
    border:'rgba(245,158,11,0.2)',
  },
]

export function CTA() {
  return (
    <section
      className="py-20"
      style={{ background: 'var(--bg-card)' }}
    >
      <Container>
        <div className="relative">

          {/* Background glows */}
          <div aria-hidden="true">
            <div style={{
              position: 'absolute', top: '-40px', left: '-40px',
              width: '280px', height: '280px',
              background: 'radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%)',
              filter:     'blur(40px)', pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', bottom: '-40px', right: '-40px',
              width: '320px', height: '320px',
              background: 'radial-gradient(ellipse, rgba(249,115,22,0.08) 0%, transparent 70%)',
              filter:     'blur(40px)', pointerEvents: 'none',
            }} />
          </div>

          {/* Main card */}
          <div
            className="relative rounded-[var(--radius-2xl)] overflow-hidden"
            style={{
              background: 'var(--bg-card)',
              border:     '1.5px solid var(--border)',
              boxShadow:  'var(--shadow-xl)',
            }}
          >
            {/* Top gradient strip */}
            <div
              className="h-[3px]"
              style={{
                background: 'linear-gradient(90deg, var(--primary-500), var(--primary-700), var(--role-student))',
              }}
            />

            <div className="px-6 sm:px-10 lg:px-14 py-14 sm:py-18">
              <div className="flex flex-col lg:flex-row lg:items-center gap-12 lg:gap-16">

                {/* ── LEFT ── */}
                <div className="flex-1 max-w-xl">

                  {/* Badge */}
                  <div
                    className="inline-flex items-center gap-2 px-4 py-2
                               rounded-full text-xs font-bold font-display
                               tracking-wide mb-6"
                    style={{
                      background: 'var(--success-light)',
                      border:     '1px solid rgba(16,185,129,0.2)',
                      color:      'var(--success-dark)',
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ background: 'var(--success)' }}
                    />
                    Early Access Open
                  </div>

                  {/* Heading */}
                  <h2
                    className="font-display font-extrabold tracking-tight
                               leading-[1.12] mb-5"
                    style={{ fontSize: 'clamp(1.875rem, 4vw, 2.75rem)', color: 'var(--text-primary)' }}
                  >
                    Ready to simplify your{' '}
                    <span style={{
                      background:           'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 50%, var(--accent-500) 100%)',
                      WebkitBackgroundClip: 'text',
                      backgroundClip:       'text',
                      WebkitTextFillColor: 'transparent',
                    }}>
                      school operations?
                    </span>
                  </h2>

                  {/* Desc */}
                  <p
                    className="text-[1.0625rem] leading-relaxed font-body mb-8"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Set up your school in minutes — no installation, no credit card.
                    We&apos;ll personally help you get started.
                  </p>

                  {/* CTAs */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-8">
                    <Link
                      href="/register"
                      className="group relative inline-flex items-center
                                 justify-center gap-2.5 px-8 py-4
                                 rounded-[var(--radius-lg)] text-white
                                 font-bold font-display text-[15px]
                                 overflow-hidden transition-all duration-200"
                      style={{
                        background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                        boxShadow:  '0 4px 16px rgba(99,102,241,0.35)',
                      }}
                    >
                      {/* Shimmer */}
                      <span
                        className="absolute inset-0 opacity-0 group-hover:opacity-100
                                   transition-opacity duration-300"
                        style={{
                          background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)',
                        }}
                      />
                      <span className="relative">Get Early Access — Free</span>
                      <svg
                        width="18" height="18" viewBox="0 0 16 16" fill="none"
                        className="relative transition-transform duration-150
                                   group-hover:translate-x-1"
                      >
                        <path d="M3 8h10M9 4l4 4-4 4"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </Link>

                    <Link
                      href="/contact"
                      className="inline-flex items-center justify-center gap-2.5
                                 px-8 py-4 rounded-[var(--radius-lg)]
                                 font-semibold font-display text-[15px]
                                 transition-all duration-200"
                      style={{
                        background: 'var(--bg-muted)',
                        color:      'var(--text-secondary)',
                        border:     '1.5px solid var(--border)',
                      }}
                      onMouseEnter={undefined}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ color: 'var(--text-muted)' }}>
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      Talk to Us
                    </Link>
                  </div>

                  {/* Trust points */}
                  <div className="flex flex-wrap gap-4">
                    {trustPoints.map(item => (
                      <span
                        key={item}
                        className="flex items-center gap-2 text-sm font-body"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <span
                          className="flex-shrink-0 w-4 h-4 rounded-full
                                     flex items-center justify-center"
                          style={{ background: 'var(--success-light)' }}
                        >
                          <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                            <path d="M4 8l3 3 5-5"
                              stroke="var(--success)" strokeWidth="2"
                              strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {item}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* ── RIGHT ── */}
                <div className="lg:w-[340px] flex-shrink-0 space-y-4">

                  {/* Main info card */}
                  <div
                    className="rounded-[var(--radius-xl)] p-6"
                    style={{
                      background: 'linear-gradient(135deg, var(--primary-50), rgba(139,92,246,0.06))',
                      border:     '1px solid var(--primary-200)',
                    }}
                  >
                    {/* Logo row */}
                    <div className="flex items-center gap-3 mb-5">
                      <div
                        className="w-11 h-11 rounded-[var(--radius-md)] flex items-center
                                   justify-center text-white font-extrabold text-sm
                                   font-display flex-shrink-0"
                        style={{
                          background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                          boxShadow:  '0 4px 12px rgba(99,102,241,0.3)',
                        }}
                      >
                        SF
                      </div>
                      <div>
                        <p
                          className="text-sm font-bold font-display"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Skolify
                        </p>
                        <p
                          className="text-[10px] font-body"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          by Shivshakti Computer Academy
                        </p>
                      </div>
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-2 gap-3">
                      {quickStats.map(stat => (
                        <div
                          key={stat.label}
                          className="rounded-[var(--radius-md)] p-3 text-center"
                          style={{
                            background: 'var(--bg-card)',
                            border:     '1px solid var(--primary-100)',
                          }}
                        >
                          <span className="text-lg">{stat.icon}</span>
                          <p
                            className="text-lg font-extrabold font-display mt-1"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {stat.value}
                          </p>
                          <p
                            className="text-[10px] font-body"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {stat.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mini feature cards */}
                  {miniCards.map(card => (
                    <div
                      key={card.title}
                      className="flex items-start gap-3.5 p-4
                                 rounded-[var(--radius-lg)]"
                      style={{
                        background: card.bg,
                        border:     `1px solid ${card.border}`,
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-[var(--radius-md)] flex items-center
                                   justify-center flex-shrink-0"
                        style={{
                          background: 'var(--bg-card)',
                          border:     '1px solid var(--border)',
                          boxShadow:  'var(--shadow-xs)',
                        }}
                      >
                        <span className="text-xl">{card.icon}</span>
                      </div>
                      <div>
                        <p
                          className="text-sm font-bold font-display"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {card.title}
                        </p>
                        <p
                          className="text-xs font-body mt-0.5"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {card.desc}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Founding school perks */}
                  <div
                    className="flex items-center gap-3 p-4 rounded-[var(--radius-lg)]"
                    style={{
                      background: 'rgba(139,92,246,0.08)',
                      border:     '1px solid rgba(139,92,246,0.2)',
                    }}
                  >
                    <span className="text-2xl">🎁</span>
                    <div>
                      <p
                        className="text-sm font-bold font-display"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Founding School Perks
                      </p>
                      <p
                        className="text-xs font-body mt-0.5"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Extended free access + priority support
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}