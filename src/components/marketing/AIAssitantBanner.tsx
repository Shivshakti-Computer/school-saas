'use client'

import { Container }   from './Container'
import { useReveal, useRevealGroup }  from '@/hooks/useReveal'
import { IconSparkles, IconLanguage, IconRobot, IconUsers, IconShield } from '../ui/icons'

/* ─────────────────────────────────────────────────────────────
   DATA
   ───────────────────────────────────────────────────────────── */

const aiFeatures = [
  {
    icon:        <IconSparkles className="w-5 h-5" />,
    title:       'Smart Fee Reminders',
    description: 'AI automatically sends personalized fee reminders to parents in their preferred language — no manual work needed.',
    accent:      'var(--primary-500)',
    bg:          'var(--primary-50)',
    border:      'var(--primary-200)',
  },
  {
    icon:        <IconRobot className="w-5 h-5" />,
    title:       'Full Task Automation',
    description: 'Student promotion, report generation, notice drafts, message templates — AI handles it all in seconds.',
    accent:      'var(--role-teacher)',
    bg:          'var(--success-light)',
    border:      'rgba(16,185,129,0.2)',
  },
  {
    icon:        <IconLanguage className="w-5 h-5" />,
    title:       'Truly Multilingual',
    description: 'Hindi, English, Marathi, Tamil, Telugu, Gujarati, Bengali & 6 more. AI understands and responds in any language.',
    accent:      'var(--accent-500)',
    bg:          'rgba(249,115,22,0.08)',
    border:      'rgba(249,115,22,0.2)',
  },
]

const userRoles = [
  {
    role:   'Admin',
    letter: 'A',
    color:  'var(--primary-500)',
    bg:     'var(--primary-50)',
    tasks:  ['Fee reminders', 'Student promotion', 'Reports', 'Templates', 'Analytics'],
  },
  {
    role:   'Teacher',
    letter: 'T',
    color:  'var(--role-teacher)',
    bg:     'var(--success-light)',
    tasks:  ['Attendance insights', 'Performance', 'Notice drafts', 'Parent comms'],
  },
  {
    role:   'Parent',
    letter: 'P',
    color:  'var(--role-parent)',
    bg:     'var(--warning-light)',
    tasks:  ['Fee queries', "Child's progress", 'Exam schedule', 'School updates'],
  },
  {
    role:   'Student',
    letter: 'S',
    color:  'var(--role-student)',
    bg:     'rgba(139,92,246,0.08)',
    tasks:  ['Homework help', 'Exam prep', 'Timetable', 'Doubt clearing'],
  },
]

const languages = [
  'English', 'हिंदी', 'मराठी', 'தமிழ்', 'తెలుగు',
  'ગુજરાતી', 'বাংলা', 'ಕನ್ನಡ', 'മലയാളം', 'ਪੰਜਾਬੀ',
]

/* ─────────────────────────────────────────────────────────────
   COMPONENT
   ───────────────────────────────────────────────────────────── */

export function AIAssistantBanner() {
  const sectionRef  = useReveal<HTMLDivElement>()
  const rolesRef    = useRevealGroup()

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: 'var(--bg-card)' }}
    >
      {/* ── Background decorations ── */}

      {/* Top-right indigo arc */}
      <div
        aria-hidden="true"
        style={{
          position:     'absolute',
          top:          '-15%',
          right:        '-10%',
          width:        '45%',
          height:       '60%',
          background:   'radial-gradient(ellipse, rgba(99,102,241,0.07) 0%, transparent 70%)',
          pointerEvents:'none',
        }}
      />

      {/* Bottom-left accent warm */}
      <div
        aria-hidden="true"
        style={{
          position:     'absolute',
          bottom:       '-10%',
          left:         '-8%',
          width:        '40%',
          height:       '50%',
          background:   'radial-gradient(ellipse, rgba(249,115,22,0.06) 0%, transparent 70%)',
          pointerEvents:'none',
        }}
      />

      {/* Subtle top border line */}
      <div
        aria-hidden="true"
        style={{
          position:   'absolute',
          top:        0,
          left:       '15%',
          right:      '15%',
          height:     '1px',
          background: 'linear-gradient(90deg, transparent, var(--border), transparent)',
          pointerEvents: 'none',
        }}
      />

      <Container className="section-padding">
        <div
          ref={sectionRef}
          className="reveal"
        >

          {/* ── Section Header ── */}
          <div className="text-center max-w-2xl mx-auto mb-14">

            {/* Pill badge */}
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5
                         rounded-full text-xs font-bold font-display
                         tracking-wide mb-5"
              style={{
                background: 'linear-gradient(135deg, var(--primary-50), rgba(139,92,246,0.08))',
                border:     '1px solid var(--primary-200)',
                color:      'var(--primary-600)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: 'var(--primary-500)' }}
              />
              <IconSparkles className="w-3 h-3" />
              Built-in AI — Works 24/7
            </div>

            <h2
              className="font-display font-extrabold tracking-tight mb-4"
              style={{
                fontSize: 'clamp(1.875rem, 4vw, 2.75rem)',
                color:    'var(--text-primary)',
                lineHeight: 1.15,
              }}
            >
              Your AI Assistant for{' '}
              <span
                style={{
                  background:           'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
                  WebkitBackgroundClip: 'text',
                  backgroundClip:       'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Every School Task
              </span>
            </h2>

            <p
              className="text-[1.0625rem] leading-relaxed font-body"
              style={{ color: 'var(--text-secondary)' }}
            >
              Built-in AI speaks all major Indian languages. Helps admins,
              teachers, parents and students — saving hours every single day.
            </p>
          </div>

          {/* ── AI Feature Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
            {aiFeatures.map((feature, i) => (
              <div
                key={i}
                className="group relative p-6 rounded-[var(--radius-lg)]
                           transition-all duration-200 overflow-hidden"
                style={{
                  background: 'var(--bg-base)',
                  border:     '1px solid var(--border)',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = feature.border
                  el.style.transform   = 'translateY(-3px)'
                  el.style.boxShadow   = 'var(--shadow-md)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = 'var(--border)'
                  el.style.transform   = 'translateY(0)'
                  el.style.boxShadow   = 'none'
                }}
              >
                {/* Top accent bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-[3px]
                             rounded-t-[var(--radius-lg)] transition-opacity
                             duration-200 opacity-0 group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(90deg, ${feature.accent}, transparent)`,
                  }}
                />

                {/* Icon */}
                <div
                  className="inline-flex items-center justify-center
                             w-11 h-11 rounded-[var(--radius-md)] mb-4
                             transition-transform duration-200
                             group-hover:scale-110"
                  style={{
                    background: feature.bg,
                    color:      feature.accent,
                    border:     `1px solid ${feature.border}`,
                  }}
                >
                  {feature.icon}
                </div>

                <h3
                  className="text-[15px] font-bold font-display mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {feature.title}
                </h3>
                <p
                  className="text-sm leading-relaxed font-body"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* ── Role-based AI Help ── */}
          <div
            className="relative rounded-[var(--radius-2xl)] p-7 sm:p-9
                       overflow-hidden"
            style={{
              background: 'var(--bg-base)',
              border:     '1px solid var(--border)',
            }}
          >
            {/* Inner bg glow */}
            <div
              aria-hidden="true"
              style={{
                position:     'absolute',
                top:          '-20%',
                right:        '-10%',
                width:        '40%',
                height:       '70%',
                background:   'radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 70%)',
                pointerEvents:'none',
              }}
            />

            {/* Section label */}
            <div className="flex flex-col sm:flex-row sm:items-center
                            justify-between gap-4 mb-8 relative">
              <div>
                <h3
                  className="text-xl sm:text-2xl font-extrabold font-display"
                  style={{ color: 'var(--text-primary)' }}
                >
                  AI Help for Everyone
                </h3>
                <p
                  className="text-sm font-body mt-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Role-specific capabilities for every user
                </p>
              </div>

              {/* Privacy note */}
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5
                           rounded-full text-[11px] font-semibold font-display
                           flex-shrink-0"
                style={{
                  background: 'var(--success-light)',
                  border:     '1px solid rgba(16,185,129,0.2)',
                  color:      'var(--success-dark)',
                }}
              >
                <IconShield className="w-3 h-3" />
                Data stays private per school
              </div>
            </div>

            {/* Role cards grid */}
            <div
              ref={rolesRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
                         gap-3.5 reveal-stagger relative"
            >
              {userRoles.map((item, i) => (
                <div
                  key={i}
                  className="reveal rounded-[var(--radius-lg)] p-4
                             transition-all duration-200"
                  style={{
                    background: 'var(--bg-card)',
                    border:     '1px solid var(--border)',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = item.color
                    el.style.boxShadow   = `0 4px 16px ${item.color}20`
                    el.style.transform   = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'var(--border)'
                    el.style.boxShadow   = 'none'
                    el.style.transform   = 'translateY(0)'
                  }}
                >
                  {/* Role header */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div
                      className="w-8 h-8 rounded-[var(--radius-md)] flex items-center
                                 justify-center text-xs font-bold font-display
                                 text-white flex-shrink-0"
                      style={{ background: item.color }}
                    >
                      {item.letter}
                    </div>
                    <p
                      className="text-sm font-bold font-display"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {item.role}
                    </p>
                  </div>

                  {/* Tasks as chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {item.tasks.map((task, j) => (
                      <span
                        key={j}
                        className="text-[10px] font-medium font-body px-2 py-0.5
                                   rounded-full"
                        style={{
                          background: item.bg,
                          color:      item.color,
                        }}
                      >
                        {task}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Languages ── */}
          <div className="mt-12 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div
                className="h-px flex-1 max-w-[80px]"
                style={{
                  background: 'linear-gradient(90deg, transparent, var(--border))',
                }}
              />
              <p
                className="text-[11px] font-bold uppercase tracking-widest font-display"
                style={{ color: 'var(--text-muted)' }}
              >
                Available in 10+ Indian Languages
              </p>
              <div
                className="h-px flex-1 max-w-[80px]"
                style={{
                  background: 'linear-gradient(90deg, var(--border), transparent)',
                }}
              />
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {languages.map((lang, i) => (
                <span
                  key={lang}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium
                             font-body transition-all duration-150 cursor-default"
                  style={{
                    background: 'var(--bg-base)',
                    border:     '1px solid var(--border)',
                    color:      'var(--text-secondary)',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background  = 'var(--primary-50)'
                    el.style.borderColor = 'var(--primary-300)'
                    el.style.color       = 'var(--primary-600)'
                    el.style.transform   = 'translateY(-1px)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background  = 'var(--bg-base)'
                    el.style.borderColor = 'var(--border)'
                    el.style.color       = 'var(--text-secondary)'
                    el.style.transform   = 'translateY(0)'
                  }}
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>

        </div>
      </Container>
    </section>
  )
}