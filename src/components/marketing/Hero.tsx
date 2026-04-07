'use client'

import Link from 'next/link'
import { Container } from './Container'
import { useReveal, useRevealGroup } from '@/hooks/useReveal'
import { IconSparkles, IconLanguage } from '../ui/icons'

/* ─────────────────────────────────────────────────────────────
   DATA
   ───────────────────────────────────────────────────────────── */

const aiCapabilities = [
  { icon: '💸', label: 'Fee Reminders',      desc: 'Auto-sends to all parents'   },
  { icon: '📋', label: 'Notice Generator',   desc: 'Draft in seconds with AI'    },
  { icon: '🎓', label: 'Student Promotion',  desc: 'Bulk promote with one click' },
  { icon: '📊', label: 'School Analytics',   desc: 'Stats in plain language'     },
]

const trustBadges = [
  { icon: '🔒', text: 'Data stays private'       },
  { icon: '🌐', text: '10+ Indian languages'     },
  { icon: '⚡', text: 'Works on any device'      },
  { icon: '🤖', text: 'AI included in all plans' },
]

const dashboardStats = [
  { label: 'Students',      value: '1,248', delta: '+12 this week',  color: 'var(--primary-500)'  },
  { label: 'Fee Collected', value: '₹4.2L', delta: '+18% this month', color: 'var(--success)'      },
  { label: 'Attendance',    value: '94.2%', delta: '3% above avg',    color: 'var(--accent-500)'   },
  { label: 'AI Tasks Done', value: '340',   delta: 'Today',           color: 'var(--role-teacher)' },
]

const chartBars = [
  { h: 35, month: 'J' }, { h: 52, month: 'F' }, { h: 41, month: 'M' },
  { h: 63, month: 'A' }, { h: 48, month: 'M' }, { h: 70, month: 'J' },
  { h: 58, month: 'J' }, { h: 79, month: 'A' }, { h: 65, month: 'S' },
  { h: 72, month: 'O' }, { h: 85, month: 'N' }, { h: 91, month: 'D' },
]

const schoolTypes = [
  'CBSE', 'ICSE', 'State Board',
  'Play School', 'Coaching Center', 'Tuition Classes',
]

/* ─────────────────────────────────────────────────────────────
   HERO
   ───────────────────────────────────────────────────────────── */

export function Hero() {
  const leftRef      = useReveal<HTMLDivElement>()
  const rightRef     = useReveal<HTMLDivElement>({ threshold: 0.08 })
  const bottomRef    = useRevealGroup()

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: 'var(--bg-base)' }}
    >

      {/* ══════════════════════════════════════════════
          BACKGROUND LAYERS — pseudo-like decorations
          Pure CSS, no images, zero performance cost
          ══════════════════════════════════════════════ */}

      {/* Layer 1 — Large indigo radial glow top-left */}
      <div
        aria-hidden="true"
        style={{
          position:     'absolute',
          top:          '-10%',
          left:         '-8%',
          width:        '55%',
          height:       '70%',
          background:   'radial-gradient(ellipse at center, rgba(99,102,241,0.13) 0%, transparent 70%)',
          pointerEvents:'none',
        }}
      />

      {/* Layer 2 — Warm orange glow bottom-right */}
      <div
        aria-hidden="true"
        style={{
          position:     'absolute',
          bottom:       '-5%',
          right:        '-5%',
          width:        '45%',
          height:       '55%',
          background:   'radial-gradient(ellipse at center, rgba(249,115,22,0.09) 0%, transparent 70%)',
          pointerEvents:'none',
        }}
      />

      {/* Layer 3 — Soft violet mid-right (depth) */}
      <div
        aria-hidden="true"
        style={{
          position:     'absolute',
          top:          '20%',
          right:        '5%',
          width:        '30%',
          height:       '40%',
          background:   'radial-gradient(ellipse at center, rgba(139,92,246,0.07) 0%, transparent 65%)',
          pointerEvents:'none',
        }}
      />

      {/* Layer 4 — Dot grid pattern */}
      <div
        aria-hidden="true"
        style={{
          position:         'absolute',
          inset:            0,
          backgroundImage:  'radial-gradient(circle, rgba(99,102,241,0.08) 1px, transparent 1px)',
          backgroundSize:   '32px 32px',
          pointerEvents:    'none',
          maskImage:        'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
          WebkitMaskImage:  'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
        }}
      />

      {/* Layer 5 — Horizontal shimmer line (top accent) */}
      <div
        aria-hidden="true"
        style={{
          position:   'absolute',
          top:        0,
          left:       '10%',
          right:      '10%',
          height:     '1px',
          background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), rgba(249,115,22,0.3), transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* Layer 6 — Bottom fade into next section */}
      <div
        aria-hidden="true"
        style={{
          position:   'absolute',
          bottom:     0,
          left:       0,
          right:      0,
          height:     '120px',
          background: 'linear-gradient(to bottom, transparent, var(--bg-base))',
          pointerEvents: 'none',
          zIndex:     2,
        }}
      />

      {/* ══════════════════════════════════════════════
          MAIN CONTENT
          ══════════════════════════════════════════════ */}

      <Container>
        <div
          className="relative"
          style={{ zIndex: 3 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-10
                          pt-16 sm:pt-20 lg:pt-24 pb-10 items-center">

            {/* ────────────────────────────────────────
                LEFT — CONTENT
                ──────────────────────────────────────── */}
            <div ref={leftRef} className="reveal">

              {/* ── Top label strip ── */}
              <div className="flex flex-wrap items-center gap-2 mb-7">

                {/* Verified badge */}
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1.5
                             rounded-full text-[11px] font-bold font-display
                             tracking-wide"
                  style={{
                    background: 'linear-gradient(135deg, var(--primary-50), var(--primary-100))',
                    border:     '1px solid var(--primary-200)',
                    color:      'var(--primary-700)',
                  }}
                >
                  <IconSparkles className="w-3 h-3" />
                  AI-Powered School ERP
                </div>

                {/* Live indicator */}
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1.5
                             rounded-full text-[11px] font-semibold font-display"
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
              </div>

              {/* ── Main Heading ── */}
              <h1
                className="font-display font-extrabold leading-[1.12]
                           tracking-tight mb-5"
                style={{
                  fontSize: 'clamp(2.4rem, 5.5vw, 3.5rem)',
                  color:    'var(--text-primary)',
                }}
              >
                Manage Your School{' '}
                <br className="hidden sm:block" />
                <span
                  style={{
                    background:            'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 45%, var(--accent-500) 100%)',
                    WebkitBackgroundClip:  'text',
                    backgroundClip:        'text',
                    WebkitTextFillColor:  'transparent',
                  }}
                >
                  Smarter, Not Harder
                </span>
              </h1>

              {/* ── Subtext ── */}
              <p
                className="text-[1.0625rem] leading-[1.75] mb-7 font-body"
                style={{
                  color:    'var(--text-secondary)',
                  maxWidth: '32rem',
                }}
              >
                Skolify is India&apos;s first school management platform with a{' '}
                <span style={{ color: 'var(--primary-600)', fontWeight: 600 }}>
                  built-in AI assistant
                </span>{' '}
                — handles fee reminders, notices, reports & student promotion
                automatically, in Hindi, English & 10+ regional languages.
              </p>

              {/* ── AI Feature Pills ── */}
              <div className="grid grid-cols-2 gap-2.5 mb-8">
                {aiCapabilities.map((cap, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 px-3.5 py-2.5
                               rounded-[var(--radius-md)] transition-all duration-200"
                    style={{
                      background: 'var(--bg-card)',
                      border:     '1px solid var(--border)',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.borderColor = 'var(--primary-300)'
                      el.style.background  = 'var(--primary-50)'
                      el.style.transform   = 'translateY(-1px)'
                      el.style.boxShadow   = 'var(--shadow-sm)'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.borderColor = 'var(--border)'
                      el.style.background  = 'var(--bg-card)'
                      el.style.transform   = 'translateY(0)'
                      el.style.boxShadow   = 'none'
                    }}
                  >
                    <span className="text-xl flex-shrink-0">{cap.icon}</span>
                    <div className="min-w-0">
                      <p
                        className="text-xs font-semibold font-display truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {cap.label}
                      </p>
                      <p
                        className="text-[10px] font-body truncate mt-0.5"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {cap.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── CTA Buttons ── */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">

                {/* Primary CTA */}
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2
                             px-7 py-3.5 rounded-[var(--radius-md)] text-[15px]
                             font-bold font-display text-white
                             transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%)',
                    boxShadow:  '0 4px 16px rgba(99,102,241,0.3), 0 1px 3px rgba(99,102,241,0.2)',
                    color: 'white'
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = 'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-700) 100%)'
                    el.style.boxShadow  = '0 8px 24px rgba(99,102,241,0.4), 0 2px 6px rgba(99,102,241,0.2)'
                    el.style.transform  = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%)'
                    el.style.boxShadow  = '0 4px 16px rgba(99,102,241,0.3), 0 1px 3px rgba(99,102,241,0.2)'
                    el.style.transform  = 'translateY(0)'
                  }}
                >
                  <IconSparkles className="w-4 h-4" />
                  Start Free — No Card Needed
                </Link>

                {/* Secondary CTA */}
                <Link
                  href="#demo"
                  className="inline-flex items-center justify-center gap-2
                             px-7 py-3.5 rounded-[var(--radius-md)] text-[15px]
                             font-semibold font-display
                             transition-all duration-200"
                  style={{
                    background: 'var(--bg-card)',
                    border:     '1.5px solid var(--border)',
                    color:      'var(--text-secondary)',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'var(--primary-300)'
                    el.style.color       = 'var(--primary-600)'
                    el.style.background  = 'var(--primary-50)'
                    el.style.transform   = 'translateY(-1px)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'var(--border)'
                    el.style.color       = 'var(--text-secondary)'
                    el.style.background  = 'var(--bg-card)'
                    el.style.transform   = 'translateY(0)'
                  }}
                >
                  {/* Play icon */}
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--primary-100)' }}
                  >
                    <svg
                      className="w-3 h-3 ml-0.5"
                      viewBox="0 0 12 12"
                      fill="var(--primary-600)"
                    >
                      <path d="M3 2l7 4-7 4V2z" />
                    </svg>
                  </span>
                  Watch 2-min Demo
                </Link>
              </div>

              {/* ── Trust Badges ── */}
              <div className="flex flex-wrap gap-3">
                {trustBadges.map((b, i) => (
                  <div
                    key={i}
                    className="inline-flex items-center gap-1.5 text-xs
                               font-medium font-body"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <span className="text-sm">{b.icon}</span>
                    {b.text}
                  </div>
                ))}
              </div>

              {/* ── Built by badge ── */}
              <div
                className="mt-8 inline-flex items-center gap-3 px-4 py-3
                           rounded-[var(--radius-md)]"
                style={{
                  background: 'var(--bg-muted)',
                  border:     '1px solid var(--border)',
                }}
              >
                <div
                  className="w-9 h-9 rounded-[var(--radius-md)] flex items-center
                             justify-center text-white text-xs font-bold
                             font-display flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                  }}
                >
                  SC
                </div>
                <div>
                  <p
                    className="text-[13px] font-semibold font-display leading-tight"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Built by Shivshakti Computer Academy
                  </p>
                  <p
                    className="text-[11px] font-body mt-0.5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Trusted by schools across India
                  </p>
                </div>
              </div>
            </div>

            {/* ────────────────────────────────────────
                RIGHT — DASHBOARD CARD
                ──────────────────────────────────────── */}
            <div
              ref={rightRef}
              className="reveal relative"
            >

              {/* Glow behind card */}
              <div
                aria-hidden="true"
                style={{
                  position:     'absolute',
                  inset:        '-20px',
                  background:   'radial-gradient(ellipse at 60% 40%, rgba(99,102,241,0.12) 0%, transparent 65%)',
                  borderRadius: '50%',
                  pointerEvents:'none',
                  filter:       'blur(20px)',
                }}
              />

              {/* ── Dashboard Card ── */}
              <div
                className="relative rounded-[var(--radius-xl)] overflow-hidden"
                style={{
                  background: 'var(--bg-card)',
                  border:     '1px solid var(--border)',
                  boxShadow:  '0 24px 64px rgba(99,102,241,0.15), 0 8px 24px rgba(0,0,0,0.06)',
                }}
              >

                {/* Browser bar */}
                <div
                  className="flex items-center gap-2 px-4 py-3"
                  style={{
                    background:   'var(--bg-muted)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {/* Traffic lights */}
                  <div className="flex gap-1.5 flex-shrink-0">
                    {[
                      'rgba(239,68,68,0.5)',
                      'rgba(245,158,11,0.5)',
                      'rgba(16,185,129,0.5)',
                    ].map((bg, i) => (
                      <div
                        key={i}
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: bg }}
                      />
                    ))}
                  </div>

                  {/* URL */}
                  <div
                    className="flex-1 mx-2 flex items-center gap-2
                               px-3 py-1.5 rounded-[var(--radius-sm)]"
                    style={{
                      background: 'var(--bg-card)',
                      border:     '1px solid var(--border)',
                    }}
                  >
                    <svg
                      className="w-3 h-3 flex-shrink-0"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      style={{ color: 'var(--success)' }}
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0
                           01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span
                      className="text-[10px] font-medium font-mono"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      app.skolify.in/admin/dashboard
                    </span>
                  </div>

                  {/* Tag */}
                  <div
                    className="flex-shrink-0 px-2 py-1 rounded text-[9px]
                               font-bold font-display"
                    style={{
                      background: 'var(--primary-50)',
                      color:      'var(--primary-600)',
                      border:     '1px solid var(--primary-200)',
                    }}
                  >
                    DEMO
                  </div>
                </div>

                {/* Dashboard body */}
                <div className="p-5">

                  {/* Top row — greeting + plan */}
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <p
                        className="text-xs font-body mb-1"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Good Morning 👋
                      </p>
                      <p
                        className="text-base font-bold font-display leading-tight"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Demo Public School
                      </p>
                      <p
                        className="text-[11px] font-body mt-0.5"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Academic Year 2024–25
                      </p>
                    </div>

                    {/* AI status chip */}
                    <div
                      className="flex items-center gap-1.5 px-2.5 py-1.5
                                 rounded-[var(--radius-md)] flex-shrink-0"
                      style={{
                        background: 'var(--primary-50)',
                        border:     '1px solid var(--primary-200)',
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0"
                        style={{ background: 'var(--primary-500)' }}
                      />
                      <span
                        className="text-[10px] font-bold font-display"
                        style={{ color: 'var(--primary-600)' }}
                      >
                        AI Active
                      </span>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-2.5 mb-4">
                    {dashboardStats.map((stat, i) => (
                      <div
                        key={i}
                        className="rounded-[var(--radius-md)] p-3"
                        style={{
                          background: 'var(--bg-subtle)',
                          border:     '1px solid var(--border)',
                        }}
                      >
                        {/* Color top accent line */}
                        <div
                          className="w-6 h-[3px] rounded-full mb-2"
                          style={{ background: stat.color }}
                        />
                        <p
                          className="text-xl font-extrabold font-display leading-none"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {stat.value}
                        </p>
                        <p
                          className="text-[10px] font-semibold font-display mt-1"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {stat.label}
                        </p>
                        <p
                          className="text-[9px] font-body mt-0.5"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {stat.delta}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Chart section */}
                  <div
                    className="rounded-[var(--radius-md)] p-3.5"
                    style={{
                      background: 'var(--bg-subtle)',
                      border:     '1px solid var(--border)',
                    }}
                  >
                    {/* Chart header */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p
                          className="text-xs font-bold font-display"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Fee Collection
                        </p>
                        <p
                          className="text-[10px] font-body"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          2024–25 Monthly Trend
                        </p>
                      </div>
                      <span
                        className="text-[10px] font-bold font-display px-2 py-0.5
                                   rounded-full"
                        style={{
                          background: 'var(--success-light)',
                          color:      'var(--success-dark)',
                        }}
                      >
                        ↑ 24% YoY
                      </span>
                    </div>

                    {/* Bars */}
                    <div
                      className="flex items-end gap-[3px]"
                      style={{ height: '64px' }}
                    >
                      {chartBars.map((bar, i) => {
                        const isLast    = i === chartBars.length - 1
                        const isHigh    = bar.h >= 80
                        return (
                          <div
                            key={i}
                            className="flex-1 flex flex-col items-center gap-0.5"
                          >
                            <div
                              className="w-full rounded-t-[3px] transition-all duration-300"
                              style={{
                                height:     `${bar.h}%`,
                                background: isLast
                                  ? 'linear-gradient(180deg, var(--primary-400), var(--primary-600))'
                                  : isHigh
                                    ? 'rgba(99,102,241,0.55)'
                                    : 'rgba(99,102,241,0.3)',
                                boxShadow: isLast
                                  ? '0 -2px 8px rgba(99,102,241,0.4)'
                                  : 'none',
                              }}
                            />
                          </div>
                        )
                      })}
                    </div>

                    {/* Month labels */}
                    <div
                      className="flex gap-[3px] mt-1.5"
                    >
                      {chartBars.map((bar, i) => (
                        <div
                          key={i}
                          className="flex-1 text-center text-[8px] font-mono"
                          style={{ color: 'var(--text-light)' }}
                        >
                          {bar.month}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Activity strip */}
                  <div
                    className="mt-3.5 flex items-center justify-between px-3 py-2
                               rounded-[var(--radius-md)]"
                    style={{
                      background: 'linear-gradient(135deg, var(--primary-50), rgba(249,115,22,0.04))',
                      border:     '1px solid var(--primary-100)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span
                          className="absolute inline-flex h-full w-full
                                     rounded-full animate-ping"
                          style={{ background: 'var(--primary-400)', opacity: 0.6 }}
                        />
                        <span
                          className="relative inline-flex h-2 w-2 rounded-full"
                          style={{ background: 'var(--primary-500)' }}
                        />
                      </span>
                      <span
                        className="text-[10px] font-semibold font-display"
                        style={{ color: 'var(--primary-700)' }}
                      >
                        AI ran 12 tasks today
                      </span>
                    </div>
                    <span
                      className="text-[9px] font-body"
                      style={{ color: 'var(--primary-400)' }}
                    >
                      View log →
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Floating Card 1 — AI Reminder ── */}
              <div
                className="absolute -bottom-5 -left-5 sm:-bottom-4 sm:-left-8
                           rounded-[var(--radius-lg)] p-3 min-w-[190px]
                           animate-float"
                style={{
                  background:     'var(--bg-card)',
                  border:         '1px solid var(--border)',
                  boxShadow:      'var(--shadow-lg)',
                  animationDelay: '0.4s',
                  zIndex:         5,
                }}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className="w-8 h-8 rounded-[var(--radius-md)] flex items-center
                               justify-center flex-shrink-0"
                    style={{ background: 'var(--primary-50)' }}
                  >
                    <IconSparkles
                      className="w-4 h-4"
                      style={{ color: 'var(--primary-500)' } as React.CSSProperties}
                    />
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-[9px] font-bold uppercase tracking-wider
                                 font-display"
                      style={{ color: 'var(--primary-500)' }}
                    >
                      AI Just Did This
                    </p>
                    <p
                      className="text-xs font-semibold font-display mt-0.5"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      48 fee reminders sent
                    </p>
                    <p
                      className="text-[10px] font-body"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      To overdue parents · 2 min ago
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Floating Card 2 — Language ── */}
              <div
                className="absolute -top-5 -right-5 sm:-top-4 sm:-right-8
                           rounded-[var(--radius-lg)] p-3 min-w-[175px]
                           animate-float"
                style={{
                  background:     'var(--bg-card)',
                  border:         '1px solid var(--border)',
                  boxShadow:      'var(--shadow-lg)',
                  animationDelay: '1.8s',
                  zIndex:         5,
                }}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className="w-8 h-8 rounded-[var(--radius-md)] flex items-center
                               justify-center flex-shrink-0"
                    style={{ background: 'rgba(249,115,22,0.1)' }}
                  >
                    <IconLanguage
                      className="w-4 h-4"
                      style={{ color: 'var(--accent-500)' } as React.CSSProperties}
                    />
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-[9px] font-bold uppercase tracking-wider
                                 font-display"
                      style={{ color: 'var(--accent-500)' }}
                    >
                      Multilingual
                    </p>
                    <p
                      className="text-xs font-semibold font-display mt-0.5"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      हिंदी में जवाब दें
                    </p>
                    <p
                      className="text-[10px] font-body"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Hindi · Marathi · Tamil…
                    </p>
                  </div>
                </div>
              </div>

            </div>
            {/* end RIGHT */}
          </div>

          {/* ════════════════════════════════════════════
              BOTTOM — School Type Pills + Social Proof
              ════════════════════════════════════════════ */}
          <div
            className="pb-16 sm:pb-20"
            style={{ position: 'relative', zIndex: 3 }}
          >
            {/* Soft divider */}
            <div
              className="mb-10"
              style={{
                height:     '1px',
                background: 'linear-gradient(90deg, transparent, var(--border), transparent)',
              }}
              aria-hidden="true"
            />

            <div
              ref={bottomRef}
              className="flex flex-col sm:flex-row items-center
                         justify-between gap-6 reveal-stagger"
            >
              {/* Left — label + school types */}
              <div className="reveal flex flex-col sm:flex-row items-center gap-4">
                <p
                  className="text-xs font-bold uppercase tracking-widest
                             font-display whitespace-nowrap flex-shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Works for
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {schoolTypes.map((type, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-semibold font-display px-3 py-1.5
                                 rounded-full transition-all duration-150 cursor-default"
                      style={{
                        background: 'var(--bg-card)',
                        border:     '1px solid var(--border)',
                        color:      'var(--text-secondary)',
                      }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement
                        el.style.borderColor = 'var(--primary-300)'
                        el.style.color       = 'var(--primary-600)'
                        el.style.background  = 'var(--primary-50)'
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement
                        el.style.borderColor = 'var(--border)'
                        el.style.color       = 'var(--text-secondary)'
                        el.style.background  = 'var(--bg-card)'
                      }}
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right — social proof number */}
              <div
                className="reveal flex items-center gap-3 px-4 py-2.5
                           rounded-[var(--radius-md)] flex-shrink-0"
                style={{
                  background: 'var(--bg-card)',
                  border:     '1px solid var(--border)',
                }}
              >
                {/* Stacked avatars */}
                <div className="flex -space-x-2">
                  {[
                    { bg: 'var(--primary-500)',  letter: 'R' },
                    { bg: 'var(--success)',       letter: 'A' },
                    { bg: 'var(--accent-400)',    letter: 'S' },
                    { bg: 'var(--role-student)',  letter: 'P' },
                  ].map((av, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full flex items-center justify-center
                                 text-[10px] font-bold text-white font-display
                                 flex-shrink-0"
                      style={{
                        background: av.bg,
                        border:     '2px solid var(--bg-card)',
                        zIndex:     4 - i,
                      }}
                    >
                      {av.letter}
                    </div>
                  ))}
                </div>

                <div>
                  <p
                    className="text-xs font-bold font-display leading-tight"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Early access filling fast
                  </p>
                  <p
                    className="text-[10px] font-body"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Join schools across India
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </Container>
    </section>
  )
}