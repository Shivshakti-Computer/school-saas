'use client'

import { useState } from 'react'
import { Container } from './Container'
import { useReveal, useRevealGroup } from '@/hooks/useReveal'
import {
  IconSparkles,
  IconSend,
  IconUsers,
  IconChartBar,
  IconRobot,
  IconCheckCircle,
} from '../ui/icons'

/* ─────────────────────────────────────────────────────────────
   DATA
   ───────────────────────────────────────────────────────────── */

const AI_FEATURES = [
  {
    icon:        IconSend,
    title:       'Automated Fee Reminders',
    description: 'AI generates personalized fee reminders and sends them via SMS, WhatsApp & email — to every overdue parent, automatically.',
    status:      'Live' as const,
    accent:      'var(--success)',
    bg:          'var(--success-light)',
    border:      'rgba(16,185,129,0.25)',
    demo: [
      '📱 "Rahul ke fee ₹2400 baki hai — please pay by Friday"',
      '✅ Sent to 48 parents · 2 min ago',
      '📊 82% opened · 34% paid within 24hrs',
    ],
  },
  {
    icon:        IconSparkles,
    title:       'Message Template Generator',
    description: 'Instantly create polished templates for events, exam schedules, holidays, fee notices — in any language your school uses.',
    status:      'Live' as const,
    accent:      'var(--primary-500)',
    bg:          'var(--primary-50)',
    border:      'var(--primary-200)',
    demo: [
      '📝 Annual Day notice generated in Hindi',
      '📢 Exam schedule SMS — ready in 3 seconds',
      '🎉 Diwali wishes sent to all parents',
    ],
  },
  {
    icon:        IconUsers,
    title:       'Student Promotion System',
    description: 'AI reviews attendance, grades and eligibility — then promotes eligible students to next class in bulk. One click, done.',
    status:      'Live' as const,
    accent:      'var(--role-student)',
    bg:          'rgba(139,92,246,0.08)',
    border:      'rgba(139,92,246,0.25)',
    demo: [
      '🎓 342 students ready for promotion',
      '⚠️  8 flagged — low attendance',
      '✅ Promoted to next class in 1 click',
    ],
  },
  {
    icon:        IconChartBar,
    title:       'School Stats & Analytics',
    description: 'Ask AI anything about your school — "fee collection this month", "absent students today" — get instant plain-language answers.',
    status:      'Live' as const,
    accent:      'var(--info)',
    bg:          'var(--info-light)',
    border:      'rgba(59,130,246,0.25)',
    demo: [
      '📊 Fee collected: ₹4.2L (↑18% vs last month)',
      '👥 Avg attendance: 92.4% this week',
      '💡 "Class 8B has lowest attendance"',
    ],
  },
  {
    icon:        IconRobot,
    title:       'Contextual Conversations',
    description: 'Portal-specific AI guidance — admins get admin help, teachers get teaching help, parents get parent help. Fully isolated.',
    status:      'Live' as const,
    accent:      'var(--role-teacher)',
    bg:          'var(--success-light)',
    border:      'rgba(16,185,129,0.25)',
    demo: [
      '🔐 Each school\'s data is fully private',
      '👨‍💼 Admin AI ≠ Teacher AI ≠ Parent AI',
      '🌐 Replies in user\'s preferred language',
    ],
  },
  {
    icon:        IconCheckCircle,
    title:       'Continuous Improvement',
    description: 'AI is actively being trained on new school tasks — more automations, better accuracy, new language support added regularly.',
    status:      'Training' as const,
    accent:      'var(--warning)',
    bg:          'var(--warning-light)',
    border:      'rgba(245,158,11,0.25)',
    demo: [
      '🔄 New: Timetable generation (coming soon)',
      '🔄 New: Library late-fee notices',
      '🔄 New: Parent-teacher meeting scheduler',
    ],
  },
]

/* ─────────────────────────────────────────────────────────────
   COMPONENT
   ───────────────────────────────────────────────────────────── */

export function AIFeatureShowcase() {
  const [activeIdx, setActiveIdx] = useState(0)
  const headerRef  = useReveal<HTMLDivElement>()
  const gridRef    = useRevealGroup()

  const active = AI_FEATURES[activeIdx]

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: `
          linear-gradient(180deg,
            var(--primary-50) 0%,
            var(--bg-base)   100%
          )
        `,
      }}
    >
      {/* Decoration — top shimmer line */}
      <div
        aria-hidden="true"
        style={{
          position:   'absolute',
          top:        0,
          left:       '20%',
          right:      '20%',
          height:     '1px',
          background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* Decoration — center glow */}
      <div
        aria-hidden="true"
        style={{
          position:     'absolute',
          top:          '30%',
          left:         '50%',
          transform:    'translateX(-50%)',
          width:        '60%',
          height:       '40%',
          background:   'radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 70%)',
          pointerEvents:'none',
        }}
      />

      <Container className="section-padding">

        {/* ── Header ── */}
        <div
          ref={headerRef}
          className="reveal text-center max-w-2xl mx-auto mb-14"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                       text-xs font-bold font-display tracking-wide mb-5"
            style={{
              background: 'var(--bg-card)',
              border:     '1px solid var(--primary-200)',
              color:      'var(--primary-600)',
              boxShadow:  'var(--shadow-sm)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: 'var(--primary-500)' }}
            />
            <IconSparkles className="w-3.5 h-3.5" />
            All Features Are Live & Working
          </div>

          <h2
            id="ai-features-heading"
            className="font-display font-extrabold tracking-tight mb-4"
            style={{
              fontSize: 'clamp(1.875rem, 4vw, 2.75rem)',
              color:    'var(--text-primary)',
              lineHeight: 1.15,
            }}
          >
            Your AI Assistant is{' '}
            <span
              style={{
                background:           'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 50%, var(--accent-500) 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip:       'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Always Working
            </span>
          </h2>

          <p
            className="text-[1.0625rem] leading-relaxed font-body"
            style={{ color: 'var(--text-secondary)' }}
          >
            Built-in intelligence that automates tasks, generates content, and
            provides instant guidance across all portals — 24/7, for every user.
          </p>
        </div>

        {/* ── Main: Grid + Active Panel ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

          {/* Left — Feature list cards */}
          <div
            ref={gridRef}
            className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2
                       gap-3.5 reveal-stagger"
          >
            {AI_FEATURES.map((feature, i) => {
              const Icon     = feature.icon
              const isActive = activeIdx === i

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className="reveal text-left p-5 rounded-[var(--radius-lg)]
                             transition-all duration-200 group relative
                             overflow-hidden"
                  style={{
                    background:  isActive ? 'var(--bg-card)' : 'var(--bg-card)',
                    border:      isActive
                      ? `1.5px solid ${feature.accent}`
                      : '1.5px solid var(--border)',
                    boxShadow:   isActive
                      ? `var(--shadow-md), 0 0 0 3px ${feature.bg}`
                      : 'var(--shadow-xs)',
                    transform:   isActive ? 'translateY(-1px)' : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      const el = e.currentTarget as HTMLElement
                      el.style.borderColor = feature.border
                      el.style.transform   = 'translateY(-2px)'
                      el.style.boxShadow   = 'var(--shadow-sm)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      const el = e.currentTarget as HTMLElement
                      el.style.borderColor = 'var(--border)'
                      el.style.transform   = 'none'
                      el.style.boxShadow   = 'var(--shadow-xs)'
                    }
                  }}
                  aria-pressed={isActive}
                  aria-label={`View details: ${feature.title}`}
                >
                  {/* Active left bar */}
                  {isActive && (
                    <div
                      className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full"
                      style={{ background: feature.accent }}
                    />
                  )}

                  {/* Icon + Status */}
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-[var(--radius-md)] flex items-center
                                 justify-center transition-transform duration-200
                                 group-hover:scale-105"
                      style={{
                        background: feature.bg,
                        color:      feature.accent,
                        border:     `1px solid ${feature.border}`,
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Status badge */}
                    <span
                      className="text-[10px] font-bold font-display px-2 py-0.5
                                 rounded-full flex-shrink-0"
                      style={
                        feature.status === 'Live'
                          ? {
                              background: 'var(--success-light)',
                              color:      'var(--success-dark)',
                              border:     '1px solid rgba(16,185,129,0.2)',
                            }
                          : {
                              background: 'var(--warning-light)',
                              color:      'var(--warning-dark)',
                              border:     '1px solid rgba(245,158,11,0.2)',
                            }
                      }
                    >
                      {feature.status === 'Live' ? '● Live' : '◌ Training'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    className="text-sm font-bold font-display mb-1.5 text-left"
                    style={{
                      color: isActive ? 'var(--text-primary)' : 'var(--text-primary)',
                    }}
                  >
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p
                    className="text-xs leading-relaxed font-body text-left"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {feature.description}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Right — Active Feature Detail Panel */}
          <div className="lg:col-span-2 lg:sticky lg:top-24">
            <div
              className="rounded-[var(--radius-xl)] overflow-hidden
                         transition-all duration-300"
              style={{
                background: 'var(--bg-card)',
                border:     `1px solid ${active.border}`,
                boxShadow:  `var(--shadow-lg), 0 0 0 4px ${active.bg}`,
              }}
            >
              {/* Panel header */}
              <div
                className="px-5 py-4"
                style={{
                  background:   active.bg,
                  borderBottom: `1px solid ${active.border}`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-[var(--radius-md)] flex items-center
                               justify-center flex-shrink-0"
                    style={{
                      background: 'var(--bg-card)',
                      color:      active.accent,
                      boxShadow:  'var(--shadow-sm)',
                    }}
                  >
                    <active.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-sm font-bold font-display leading-tight"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {active.title}
                    </p>
                    <p
                      className="text-[10px] font-body mt-0.5"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      AI Feature Preview
                    </p>
                  </div>
                </div>
              </div>

              {/* Panel body — Live demo output */}
              <div className="p-5">
                <p
                  className="text-[11px] font-bold uppercase tracking-widest
                             font-display mb-3"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Live Example
                </p>

                <div className="space-y-2.5">
                  {active.demo.map((line, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 px-3.5 py-2.5
                                 rounded-[var(--radius-md)]"
                      style={{
                        background:   'var(--bg-subtle)',
                        border:       '1px solid var(--border)',
                        animationDelay: `${i * 80}ms`,
                      }}
                    >
                      <p
                        className="text-xs font-body leading-relaxed"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {line}
                      </p>
                    </div>
                  ))}
                </div>

                {/* AI indicator */}
                <div
                  className="mt-4 flex items-center gap-2 px-3 py-2
                             rounded-[var(--radius-md)]"
                  style={{
                    background: active.bg,
                    border:     `1px solid ${active.border}`,
                  }}
                >
                  <span className="relative flex h-2 w-2 flex-shrink-0">
                    <span
                      className="absolute inline-flex h-full w-full
                                 rounded-full animate-ping opacity-60"
                      style={{ background: active.accent }}
                    />
                    <span
                      className="relative inline-flex h-2 w-2 rounded-full"
                      style={{ background: active.accent }}
                    />
                  </span>
                  <p
                    className="text-[11px] font-semibold font-display"
                    style={{ color: active.accent }}
                  >
                    AI is handling this automatically
                  </p>
                </div>

                {/* Navigation dots */}
                <div className="flex items-center justify-center gap-1.5 mt-5">
                  {AI_FEATURES.map((f, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveIdx(i)}
                      aria-label={`View ${f.title}`}
                      className="transition-all duration-200 rounded-full"
                      style={{
                        width:      activeIdx === i ? '20px' : '6px',
                        height:     '6px',
                        background: activeIdx === i
                          ? active.accent
                          : 'var(--border)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Below panel — CTA */}
            <div
              className="mt-4 p-4 rounded-[var(--radius-lg)] text-center"
              style={{
                background: 'var(--bg-muted)',
                border:     '1px solid var(--border)',
              }}
            >
              <p
                className="text-xs font-body mb-3"
                style={{ color: 'var(--text-muted)' }}
              >
                All AI features included in every plan
              </p>
              <a
                href="/register"
                className="inline-flex items-center justify-center gap-2
                           w-full py-2.5 rounded-[var(--radius-md)]
                           text-sm font-bold font-display text-white
                           transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                  boxShadow:  '0 2px 8px rgba(99,102,241,0.3)',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'linear-gradient(135deg, var(--primary-600), var(--primary-700))'
                  el.style.boxShadow  = '0 4px 16px rgba(99,102,241,0.4)'
                  el.style.transform  = 'translateY(-1px)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'linear-gradient(135deg, var(--primary-500), var(--primary-600))'
                  el.style.boxShadow  = '0 2px 8px rgba(99,102,241,0.3)'
                  el.style.transform  = 'translateY(0)'
                }}
              >
                <IconSparkles className="w-4 h-4" />
                Try AI Assistant Free
              </a>
            </div>
          </div>
        </div>

      </Container>
    </section>
  )
}