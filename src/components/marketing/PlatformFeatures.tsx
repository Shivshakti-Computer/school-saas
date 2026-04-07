'use client'

import { Container }             from './Container'
import { SectionTitle }          from './MiniUI'
import { useReveal, useRevealGroup } from '@/hooks/useReveal'

/* ─────────────────────────────────────────────────────────────
   WEBSITE PLAN DATA
   ───────────────────────────────────────────────────────────── */

const websiteFeatures = [
  {
    plan:       'Starter',
    templates:  1,
    pages:      4,
    photos:     10,
    customPages:0,
    features:   ['Hero Banner', 'About Section', 'Stats', 'Facilities', 'Contact', 'CTA'],
    accent:     'var(--text-secondary)',
    bg:         'var(--bg-muted)',
    border:     'var(--border)',
    popular:    false,
  },
  {
    plan:       'Growth',
    templates:  3,
    pages:      7,
    photos:     50,
    customPages:2,
    features:   ['All Starter +', 'Faculty Section', 'Testimonials', 'Events', 'Principal Message', 'Video Tour', 'Announcements', 'Login Button', 'WhatsApp Button'],
    accent:     'var(--primary-600)',
    bg:         'var(--primary-50)',
    border:     'var(--primary-200)',
    popular:    true,
  },
  {
    plan:       'Pro',
    templates:  3,
    pages:      15,
    photos:     200,
    customPages:5,
    features:   ['All Growth +', 'Gallery Albums', 'Achievements', 'Downloads', 'Infrastructure', 'Fee Structure', 'Live Notice Board', 'Custom Domain', 'Scroll Animations'],
    accent:     'var(--role-student)',
    bg:         'rgba(139,92,246,0.07)',
    border:     'rgba(139,92,246,0.2)',
    popular:    false,
  },
  {
    plan:       'Enterprise',
    templates:  3,
    pages:      '∞',
    photos:     '∞',
    customPages:'∞',
    features:   ['All Pro +', 'Academic Calendar', 'Transport Routes', 'Alumni Section', 'Mandatory Disclosure', 'Remove Branding', 'Custom Everything'],
    accent:     'var(--warning-dark)',
    bg:         'var(--warning-light)',
    border:     'rgba(245,158,11,0.2)',
    popular:    false,
  },
]

/* ─────────────────────────────────────────────────────────────
   PLATFORM HIGHLIGHT DATA
   ───────────────────────────────────────────────────────────── */

const platformHighlights = [
  {
    title:   'Installable App (PWA)',
    desc:    'Students, parents & teachers install the app directly from browser. Works offline, loads fast even on 2G. No app store needed.',
    features:['Home screen install', 'Offline capable', 'Push notifications ready', 'Works on all devices', 'Auto updates'],
    visual:  'pwa',
    gradFrom:'var(--info)',
    gradTo:  'var(--primary-600)',
    bg:      'var(--info-light)',
  },
  {
    title:   'Multi-Role Portal',
    desc:    'One platform, 4 different experiences. Admin sees everything, teachers manage classes, students check results, parents track progress.',
    features:['Admin dashboard', 'Teacher panel', 'Student portal', 'Parent app', 'SuperAdmin (you)'],
    visual:  'roles',
    gradFrom:'var(--primary-500)',
    gradTo:  'var(--primary-700)',
    bg:      'var(--primary-50)',
  },
  {
    title:   'Indian School Optimized',
    desc:    'Built specifically for Indian education. Hindi + English, CBSE/ICSE/State board support, Indian payment gateway, SMS & WhatsApp via credit system.',
    features:['Razorpay payments (₹)', 'SMS via Credits', 'WhatsApp via Credits', 'Indian date formats', 'Board-wise structure', 'GST invoicing ready'],
    visual:  'india',
    gradFrom:'var(--accent-400)',
    gradTo:  'var(--accent-600)',
    bg:      'var(--warning-light)',
  },
]

/* ─────────────────────────────────────────────────────────────
   SVG VISUALS
   ───────────────────────────────────────────────────────────── */

function WebsitePreviewSVG() {
  return (
    <svg viewBox="0 0 320 200" fill="none" className="w-full h-auto">
      <rect width="320" height="70" fill="var(--primary-50)" />
      <rect x="20" y="15" width="140" height="8"  rx="4"   fill="var(--primary-500)" />
      <rect x="20" y="28" width="200" height="5"  rx="2.5" fill="var(--border)"      />
      <rect x="20" y="38" width="160" height="5"  rx="2.5" fill="var(--bg-muted)"    />
      <rect x="20" y="52" width="60"  height="12" rx="6"   fill="var(--primary-600)" />
      <rect x="240" y="10" width="60" height="50" rx="8"
        fill="var(--bg-card)" stroke="var(--border)" strokeWidth="1" />

      <g transform="translate(0,75)">
        {['500+', '25+', '10+', '20+'].map((v, i) => (
          <g key={i} transform={`translate(${20 + i * 75}, 0)`}>
            <rect width="65" height="30" rx="6"
              fill="var(--bg-card)" stroke="var(--border)" strokeWidth="1" />
            <text x="32" y="14" textAnchor="middle"
              fill="var(--primary-500)" fontSize="9" fontWeight="bold">{v}</text>
            <text x="32" y="24" textAnchor="middle"
              fill="var(--text-muted)" fontSize="5">
              {['Students','Teachers','Years','Activities'][i]}
            </text>
          </g>
        ))}
      </g>

      <g transform="translate(0,115)">
        <rect x="20" y="0" width="80" height="5" rx="2.5" fill="var(--border)" />
        {[0,1,2].map(i => (
          <rect key={i} x={20 + i*95} y="12" width="85" height="50" rx="6"
            fill="var(--bg-card)" stroke="var(--border)" strokeWidth="1" />
        ))}
      </g>

      <rect x="0" y="185" width="320" height="15" fill="var(--bg-muted)" />
      <rect x="20" y="190" width="100" height="3" rx="1.5" fill="var(--border)" />
    </svg>
  )
}

function PWADevicesSVG() {
  return (
    <svg viewBox="0 0 280 160" fill="none" className="w-full h-auto">
      {/* Desktop */}
      <g transform="translate(10,25)" opacity="0.6">
        <rect width="80" height="55" rx="6"
          fill="rgba(139,92,246,0.08)" stroke="rgba(139,92,246,0.3)" strokeWidth="1" />
        <rect x="5" y="5" width="70" height="4" rx="2" fill="var(--role-student)" />
        <rect x="5" y="14" width="50" height="3" rx="1.5" fill="var(--border)" />
      </g>
      {/* Phone */}
      <g transform="translate(90,10)">
        <rect width="60" height="110" rx="10"
          fill="var(--info-light)" stroke="rgba(59,130,246,0.3)" strokeWidth="1.5" />
        <rect x="5" y="15" width="50" height="80" rx="4" fill="var(--bg-card)" />
        <rect x="10" y="20" width="40" height="6" rx="3" fill="var(--info)" />
        <rect x="10" y="30" width="30" height="3" rx="1.5" fill="var(--border)" />
        <rect x="10" y="40" width="40" height="20" rx="3" fill="var(--info-light)" />
        <rect x="10" y="65" width="18" height="10" rx="3" fill="var(--info-light)" />
        <rect x="32" y="65" width="18" height="10" rx="3" fill="var(--success-light)" />
        <rect x="18" y="100" width="24" height="3" rx="1.5" fill="var(--border)" />
        <rect x="20" y="5"  width="20" height="6" rx="3"   fill="var(--border)" />
      </g>
      {/* Tablet */}
      <g transform="translate(170,20)" opacity="0.6">
        <rect width="70" height="90" rx="8"
          fill="var(--success-light)" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
        <rect x="5" y="8" width="60" height="4" rx="2" fill="var(--success)" />
        <rect x="5" y="16" width="40" height="3" rx="1.5" fill="var(--border)" />
        <rect x="5" y="24" width="60" height="30" rx="4" fill="rgba(16,185,129,0.15)" />
      </g>
      {/* Install button */}
      <g transform="translate(125,130)">
        <rect x="-30" y="-10" width="60" height="22" rx="11"
          fill="var(--primary-500)" />
        <text x="0" y="5" textAnchor="middle"
          fill="white" fontSize="7" fontWeight="600">Install ↓</text>
      </g>
    </svg>
  )
}

function RolesSVG() {
  const roles = [
    { label: 'Admin',   color: 'var(--primary-500)', bg: 'var(--primary-50)'        },
    { label: 'Teacher', color: 'var(--success)',      bg: 'var(--success-light)'     },
    { label: 'Student', color: 'var(--role-student)', bg: 'rgba(139,92,246,0.08)'   },
    { label: 'Parent',  color: 'var(--role-parent)',  bg: 'var(--warning-light)'    },
  ]
  return (
    <svg viewBox="0 0 280 120" fill="none" className="w-full h-auto">
      {roles.map((role, i) => (
        <g key={role.label} transform={`translate(${15 + i * 67}, 20)`}>
          <rect width="58" height="80" rx="12"
            fill={role.bg} stroke={role.color}
            strokeWidth="1" strokeOpacity="0.35" />
          <circle cx="29" cy="30" r="12" fill="var(--bg-card)" />
          <circle cx="29" cy="27" r="5" fill={role.color} />
          <path d={`M21 38a8 8 0 0 1 16 0`} fill={role.color} opacity="0.25" />
          <text x="29" y="60" textAnchor="middle"
            fill={role.color} fontSize="7" fontWeight="700">{role.label}</text>
          <rect x="10" y="68" width="38" height="3" rx="1.5"
            fill={role.color} opacity="0.2" />
        </g>
      ))}
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────
   BROWSER MOCKUP
   ───────────────────────────────────────────────────────────── */

function BrowserMockup({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-[var(--radius-xl)] overflow-hidden"
      style={{
        background: 'var(--bg-card)',
        border:     '1px solid var(--border)',
        boxShadow:  'var(--shadow-lg)',
      }}
    >
      {/* Chrome bar */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{
          background:   'var(--bg-muted)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="flex gap-1.5">
          {['rgba(239,68,68,0.5)', 'rgba(245,158,11,0.5)', 'rgba(16,185,129,0.5)'].map(
            (bg, i) => (
              <div key={i} className="w-3 h-3 rounded-full" style={{ background: bg }} />
            )
          )}
        </div>
        <div
          className="flex-1 mx-2 px-3 py-1.5 rounded-[var(--radius-sm)]
                     text-[10px] font-mono"
          style={{
            background: 'var(--bg-card)',
            border:     '1px solid var(--border)',
            color:      'var(--text-muted)',
          }}
        >
          🔒 yourschool.skolify.in
        </div>
      </div>
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   PLATFORM FEATURES
   ───────────────────────────────────────────────────────────── */

export function PlatformFeatures() {
  const websiteRef    = useReveal<HTMLDivElement>()
  const highlightsRef = useRevealGroup()

  const visuals: Record<string, React.ReactNode> = {
    pwa:   <PWADevicesSVG />,
    roles: <RolesSVG />,
    india: (
      <div className="flex items-center justify-center py-10">
        <div className="relative">
          <span className="text-7xl">🇮🇳</span>
          <div
            className="absolute -bottom-3 left-1/2 -translate-x-1/2
                       px-3 py-1 rounded-full text-[10px] font-bold
                       font-display whitespace-nowrap"
            style={{
              background: 'var(--warning-light)',
              border:     '1px solid rgba(245,158,11,0.25)',
              color:      'var(--warning-dark)',
            }}
          >
            Made for India
          </div>
        </div>
      </div>
    ),
  }

  return (
    <section
      className="section-padding relative"
      style={{ background: 'var(--bg-muted)' }}
    >
      {/* Bg decorations */}
      <div aria-hidden="true" style={{ pointerEvents: 'none' }}>
        <div style={{
          position:   'absolute', top: 0, right: 0,
          width: '40%', height: '50%',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.05) 0%, transparent 70%)',
          filter:     'blur(40px)',
        }} />
        <div style={{
          position:   'absolute', bottom: 0, left: 0,
          width: '35%', height: '40%',
          background: 'radial-gradient(ellipse, rgba(139,92,246,0.04) 0%, transparent 70%)',
          filter:     'blur(40px)',
        }} />
      </div>

      <Container>
        {/* ═══ WEBSITE BUILDER ═══ */}
        <SectionTitle
          eyebrow="🌐 Website Builder"
          title="Professional school website — zero coding needed"
          subtitle="Choose a template, add your content, publish. Your school gets a beautiful, fast, mobile-responsive website with gallery, events, contact forms & more."
          center
        />

        {/* Preview */}
        <div ref={websiteRef} className="reveal mt-10 max-w-3xl mx-auto">
          <BrowserMockup>
            <div
              className="p-2"
              style={{ background: 'var(--bg-muted)' }}
            >
              <WebsitePreviewSVG />
            </div>
          </BrowserMockup>
        </div>

        {/* Website plan comparison */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {websiteFeatures.map(plan => (
            <div
              key={plan.plan}
              className="relative rounded-[var(--radius-xl)] p-5
                         transition-all duration-300"
              style={{
                background: 'var(--bg-card)',
                border:     plan.popular
                  ? `2px solid ${plan.accent}`
                  : `1px solid ${plan.border}`,
                boxShadow:  plan.popular ? 'var(--shadow-md)' : 'var(--shadow-xs)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = plan.popular
                  ? 'var(--shadow-md)' : 'var(--shadow-xs)'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
              }}
            >
              {/* Popular pill */}
              {plan.popular && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2
                             text-[10px] font-bold font-display text-white
                             px-3 py-1 rounded-full whitespace-nowrap"
                  style={{
                    background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                    boxShadow:  '0 2px 8px rgba(99,102,241,0.35)',
                  }}
                >
                  🔥 Popular
                </span>
              )}

              <h4
                className="text-base font-bold font-display mb-4"
                style={{ color: plan.accent }}
              >
                {plan.plan}
              </h4>

              {/* Spec rows */}
              <div className="space-y-2 mb-5">
                {[
                  { label: 'Templates',     val: plan.templates   },
                  { label: 'Pages',         val: plan.pages       },
                  { label: 'Gallery Photos',val: plan.photos      },
                  { label: 'Custom Pages',  val: plan.customPages },
                ].map(row => (
                  <div
                    key={row.label}
                    className="flex justify-between text-[13px]"
                  >
                    <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                    <span
                      className="font-semibold font-display"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {row.val}
                    </span>
                  </div>
                ))}
              </div>

              {/* Features list */}
              <div
                className="pt-4"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <p
                  className="text-[10px] font-bold uppercase tracking-widest
                             font-display mb-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Sections Included
                </p>
                <div className="space-y-1.5">
                  {plan.features.slice(0, 5).map(f => (
                    <p
                      key={f}
                      className="text-[11px] font-body flex items-center gap-2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: plan.accent }}
                      />
                      {f}
                    </p>
                  ))}
                  {plan.features.length > 5 && (
                    <p
                      className="text-[11px] font-medium font-body"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      +{plan.features.length - 5} more sections
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ PLATFORM HIGHLIGHTS ═══ */}
        <div className="mt-24">
          <SectionTitle
            eyebrow="⚡ Platform"
            title="Built different — designed for real schools"
            subtitle="Not just another ERP. Skolify is built ground-up for Indian schools with mobile-first design, offline support & credit-based messaging."
            center
          />
        </div>

        <div
          ref={highlightsRef}
          className="mt-12 space-y-5 reveal-stagger"
        >
          {platformHighlights.map((item, idx) => (
            <div
              key={item.title}
              className={`reveal rounded-[var(--radius-2xl)] overflow-hidden
                         transition-all duration-300 flex flex-col
                         ${idx % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
              style={{
                background: 'var(--bg-card)',
                border:     '1px solid var(--border)',
                boxShadow:  'var(--shadow-sm)',
              }}
              onMouseEnter={e =>
                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)'
              }
              onMouseLeave={e =>
                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'
              }
            >
              {/* Visual panel */}
              <div
                className="lg:w-[44%] p-8 flex items-center justify-center"
                style={{ background: item.bg }}
              >
                <div className="w-full max-w-[280px]">
                  {visuals[item.visual]}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-8 lg:p-10 flex flex-col justify-center">
                {/* Accent bar */}
                <div
                  className="w-14 h-[3px] rounded-full mb-5"
                  style={{
                    background: `linear-gradient(90deg, ${item.gradFrom}, ${item.gradTo})`,
                  }}
                />
                <h3
                  className="text-2xl font-extrabold font-display mb-3"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-[1.0625rem] leading-relaxed font-body mb-6"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {item.desc}
                </p>
                <div className="flex flex-wrap gap-2">
                  {item.features.map(f => (
                    <span
                      key={f}
                      className="text-xs font-medium font-body px-3 py-1.5
                                 rounded-[var(--radius-md)]"
                      style={{
                        background: 'var(--bg-muted)',
                        border:     '1px solid var(--border)',
                        color:      'var(--text-secondary)',
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}