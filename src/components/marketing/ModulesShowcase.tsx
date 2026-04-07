'use client'

import { useState }       from 'react'
import { Container }      from './Container'
import { SectionTitle }   from './MiniUI'
import { useRevealGroup } from '@/hooks/useReveal'
import { PLANS }          from '@/config/pricing'

/* ─────────────────────────────────────────────────────────────
   TYPES & TIERS
   ───────────────────────────────────────────────────────────── */

type Tier = 'all' | 'starter' | 'growth' | 'pro' | 'enterprise'

const tierOrder: Tier[] = ['starter', 'growth', 'pro', 'enterprise']

const tiers: { id: Tier; label: string }[] = [
  { id: 'all',        label: 'All Modules' },
  { id: 'starter',    label: 'Starter'     },
  { id: 'growth',     label: 'Growth'      },
  { id: 'pro',        label: 'Pro'         },
  { id: 'enterprise', label: 'Enterprise'  },
]

/* ─────────────────────────────────────────────────────────────
   PLAN BADGE STYLES — CSS vars
   ───────────────────────────────────────────────────────────── */

const planBadgeStyles: Record<Tier, { bg: string; color: string; border: string }> = {
  all: {
    bg:     'var(--bg-muted)',
    color:  'var(--text-secondary)',
    border: 'var(--border)',
  },
  starter: {
    bg:     'var(--bg-muted)',
    color:  'var(--text-secondary)',
    border: 'var(--border)',
  },
  growth: {
    bg:     'var(--primary-50)',
    color:  'var(--primary-600)',
    border: 'var(--primary-200)',
  },
  pro: {
    bg:     'rgba(139,92,246,0.08)',
    color:  'var(--role-student)',
    border: 'rgba(139,92,246,0.2)',
  },
  enterprise: {
    bg:     'var(--warning-light)',
    color:  'var(--warning-dark)',
    border: 'rgba(245,158,11,0.2)',
  },
}

function PlanBadge({ plan }: { plan: Tier }) {
  const s = planBadgeStyles[plan] || planBadgeStyles.starter
  return (
    <span
      className="text-[10px] font-bold font-display px-2 py-0.5
                 rounded-full uppercase tracking-wide whitespace-nowrap"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {plan === 'starter' ? 'All Plans' : `${plan}+`}
    </span>
  )
}

/* ─────────────────────────────────────────────────────────────
   MODULE DATA
   ───────────────────────────────────────────────────────────── */

interface ModuleItem {
  key:     string
  label:   string
  desc:    string
  accent:  string
  bg:      string
  minPlan: Tier
  icon:    React.ReactNode
}

/* SVG icon helper — avoids repetition */
function Ico({ d, children, viewBox = '0 0 24 24' }: {
  d?: string; children?: React.ReactNode; viewBox?: string
}) {
  return (
    <svg width="19" height="19" viewBox={viewBox} fill="none"
      stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      {d ? <path d={d} /> : children}
    </svg>
  )
}

const modules: ModuleItem[] = [
  /* ── STARTER ── */
  {
    key: 'students', label: 'Student Management',
    desc: 'Admission, profiles, ID cards, bulk import & parent linking.',
    accent: 'var(--primary-500)', bg: 'var(--primary-50)', minPlan: 'starter',
    icon: <Ico><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Ico>,
  },
  {
    key: 'teachers', label: 'Teachers & Staff',
    desc: 'Staff records, subject & class assignment, role management.',
    accent: 'var(--info)', bg: 'var(--info-light)', minPlan: 'starter',
    icon: <Ico><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></Ico>,
  },
  {
    key: 'attendance', label: 'Attendance',
    desc: 'Daily attendance, auto SMS via credits, reports & parent alerts.',
    accent: 'var(--success)', bg: 'var(--success-light)', minPlan: 'starter',
    icon: <Ico><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></Ico>,
  },
  {
    key: 'notices', label: 'Notice Board',
    desc: 'Circulars, announcements, SMS blast to parents & staff via credits.',
    accent: 'var(--info)', bg: 'var(--info-light)', minPlan: 'starter',
    icon: <Ico><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></Ico>,
  },
  {
    key: 'website', label: 'School Website',
    desc: 'Professional website with templates, gallery, SEO & contact forms.',
    accent: 'var(--success)', bg: 'var(--success-light)', minPlan: 'starter',
    icon: <Ico><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></Ico>,
  },
  {
    key: 'gallery', label: 'Gallery & Events',
    desc: 'Photo gallery, albums, event management & media uploads.',
    accent: '#db2777', bg: '#fdf2f8', minPlan: 'starter',
    icon: <Ico><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></Ico>,
  },

  /* ── GROWTH+ ── */
  {
    key: 'fees', label: 'Fee Management',
    desc: 'Razorpay payments, receipts, SMS reminders via credits, late fines & reports.',
    accent: 'var(--warning)', bg: 'var(--warning-light)', minPlan: 'growth',
    icon: <Ico><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></Ico>,
  },
  {
    key: 'exams', label: 'Exam & Results',
    desc: 'Scheduling, marks entry, grade cards, report cards & result SMS via credits.',
    accent: 'var(--danger)', bg: 'var(--danger-light)', minPlan: 'growth',
    icon: <Ico><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></Ico>,
  },
  {
    key: 'timetable', label: 'Timetable',
    desc: 'Class schedules, period management, teacher allocation & view.',
    accent: '#0891b2', bg: '#ecfeff', minPlan: 'growth',
    icon: <Ico><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Ico>,
  },
  {
    key: 'homework', label: 'Homework & Assignments',
    desc: 'Assign, submit & grade homework. Teacher & student workflows.',
    accent: 'var(--primary-500)', bg: 'var(--primary-50)', minPlan: 'growth',
    icon: <Ico><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></Ico>,
  },
  {
    key: 'documents', label: 'Documents',
    desc: 'TC, CC, Bonafide, character certificates & custom documents.',
    accent: 'var(--text-secondary)', bg: 'var(--bg-muted)', minPlan: 'growth',
    icon: <Ico><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></Ico>,
  },
  {
    key: 'reports', label: 'Reports & Analytics',
    desc: 'Class-wise, subject-wise reports. Attendance, fee & credit usage analytics.',
    accent: 'var(--success)', bg: 'var(--success-light)', minPlan: 'growth',
    icon: <Ico><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></Ico>,
  },
  {
    key: 'communication', label: 'Communication Hub',
    desc: 'Bulk SMS (1 credit/SMS), WhatsApp (1 credit/WA) & email campaigns to parents.',
    accent: 'var(--success)', bg: 'var(--success-light)', minPlan: 'growth',
    icon: <Ico><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Ico>,
  },

  /* ── PRO+ ── */
  {
    key: 'library', label: 'Library',
    desc: 'Book catalogue, issue/return tracking, fine calculation & reports.',
    accent: 'var(--accent-500)', bg: 'rgba(249,115,22,0.08)', minPlan: 'pro',
    icon: <Ico><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></Ico>,
  },
  {
    key: 'certificates', label: 'Certificates',
    desc: 'Custom certificates, merit awards, achievement templates.',
    accent: '#ca8a04', bg: '#fefce8', minPlan: 'pro',
    icon: <Ico><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></Ico>,
  },
  {
    key: 'lms', label: 'Online Learning (LMS)',
    desc: 'Video lessons, assignments, quizzes & student progress tracking.',
    accent: 'var(--role-student)', bg: 'rgba(139,92,246,0.08)', minPlan: 'pro',
    icon: <Ico><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></Ico>,
  },

  /* ── ENTERPRISE ── */
  {
    key: 'hr', label: 'HR & Payroll',
    desc: 'Staff salary, leave management, payslips & tax calculations.',
    accent: 'var(--danger)', bg: 'var(--danger-light)', minPlan: 'enterprise',
    icon: <Ico><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></Ico>,
  },
  {
    key: 'transport', label: 'Transport & GPS',
    desc: 'Bus routes, driver management, GPS tracking & parent alerts via credits.',
    accent: 'var(--info)', bg: 'var(--info-light)', minPlan: 'enterprise',
    icon: <Ico><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></Ico>,
  },
  {
    key: 'hostel', label: 'Hostel Management',
    desc: 'Room allotment, mess menu, warden portal & fee integration.',
    accent: '#78716c', bg: '#fafaf9', minPlan: 'enterprise',
    icon: <Ico><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></Ico>,
  },
  {
    key: 'inventory', label: 'Inventory Tracking',
    desc: 'School assets, supplies, purchase orders & stock management.',
    accent: 'var(--text-secondary)', bg: 'var(--bg-muted)', minPlan: 'enterprise',
    icon: <Ico><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></Ico>,
  },
  {
    key: 'visitor', label: 'Visitor Management',
    desc: 'Gate pass, visitor logs, approval workflows & safety records.',
    accent: '#0d9488', bg: '#f0fdfa', minPlan: 'enterprise',
    icon: <Ico><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></Ico>,
  },
  {
    key: 'health', label: 'Health Records',
    desc: 'Student medical history, health checkups & emergency contacts.',
    accent: '#e11d48', bg: '#fff1f2', minPlan: 'enterprise',
    icon: <Ico><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></Ico>,
  },
  {
    key: 'alumni', label: 'Alumni Network',
    desc: 'Alumni directory, events, donations & alumni communication.',
    accent: 'var(--role-student)', bg: 'rgba(139,92,246,0.08)', minPlan: 'enterprise',
    icon: <Ico><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 4 3 6 3s6-1 6-3v-5"/></Ico>,
  },
]

/* ─────────────────────────────────────────────────────────────
   MODULES SHOWCASE
   ───────────────────────────────────────────────────────────── */

export function ModulesShowcase() {
  const [activeTier, setActiveTier] = useState<Tier>('all')
  const gridRef = useRevealGroup()

  const starterPrice = PLANS.starter.monthlyPrice

  const filteredModules = activeTier === 'all'
    ? modules
    : modules.filter(m =>
        tierOrder.indexOf(m.minPlan) <= tierOrder.indexOf(activeTier)
      )

  const countForTier = (tier: Tier) =>
    tier === 'all'
      ? modules.length
      : modules.filter(m => tierOrder.indexOf(m.minPlan) <= tierOrder.indexOf(tier)).length

  return (
    <section
      id="modules"
      className="section-padding relative"
      style={{ background: 'var(--bg-card)' }}
    >
      {/* Bg decorations */}
      <div aria-hidden="true" style={{ pointerEvents: 'none' }}>
        <div style={{
          position:   'absolute',
          inset:      0,
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.07) 0%, transparent 60%)',
        }} />
        <div style={{
          position:   'absolute',
          bottom:     0,
          left:       '25%',
          width:      '50%',
          height:     '40%',
          background: 'radial-gradient(ellipse, rgba(139,92,246,0.04) 0%, transparent 70%)',
          filter:     'blur(40px)',
        }} />
      </div>

      <Container>
        <SectionTitle
          eyebrow="📦 22+ Modules"
          title="One platform, every tool your school needs"
          subtitle="From basic attendance to HR & payroll — choose the plan that fits. Every module works together seamlessly."
          center
        />

        {/* Tier Filter Tabs */}
        <div className="mt-10 flex justify-center">
          <div
            className="inline-flex gap-1 p-1.5 rounded-[var(--radius-xl)]"
            style={{
              background: 'var(--bg-muted)',
              border:     '1px solid var(--border)',
            }}
          >
            {tiers.map(tier => {
              const isActive = activeTier === tier.id
              const s        = planBadgeStyles[tier.id]
              return (
                <button
                  key={tier.id}
                  onClick={() => setActiveTier(tier.id)}
                  className="px-3.5 py-2 rounded-[var(--radius-md)] text-xs
                             font-semibold font-display transition-all duration-200"
                  style={{
                    background: isActive ? 'var(--bg-card)'    : 'transparent',
                    color:      isActive ? s.color             : 'var(--text-muted)',
                    boxShadow:  isActive ? 'var(--shadow-sm)'  : 'none',
                    border:     isActive ? `1px solid ${s.border}` : '1px solid transparent',
                  }}
                >
                  {tier.label}
                  <span
                    className="ml-1.5 text-[9px]"
                    style={{ opacity: 0.65 }}
                  >
                    ({countForTier(tier.id)})
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Module Cards Grid */}
        <div
          ref={gridRef}
          className="mt-10 grid grid-cols-1 sm:grid-cols-2
                     lg:grid-cols-3 xl:grid-cols-4 gap-4 reveal-stagger"
        >
          {filteredModules.map(mod => (
            <div
              key={mod.key}
              className="reveal group flex flex-col gap-3 p-5
                         rounded-[var(--radius-lg)] transition-all duration-300"
              style={{
                background: 'var(--bg-card)',
                border:     '1px solid var(--border)',
                boxShadow:  'var(--shadow-xs)',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.boxShadow   = 'var(--shadow-md)'
                el.style.borderColor = `${mod.accent}40`
                el.style.transform   = 'translateY(-3px)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.boxShadow   = 'var(--shadow-xs)'
                el.style.borderColor = 'var(--border)'
                el.style.transform   = 'translateY(0)'
              }}
            >
              {/* Icon + Badge */}
              <div className="flex items-start justify-between">
                <div
                  className="w-11 h-11 rounded-[var(--radius-md)] flex items-center
                             justify-center transition-transform duration-200
                             group-hover:scale-110"
                  style={{ background: mod.bg, color: mod.accent }}
                >
                  {mod.icon}
                </div>
                <PlanBadge plan={mod.minPlan} />
              </div>

              {/* Title */}
              <h3
                className="text-sm font-bold font-display"
                style={{ color: 'var(--text-primary)' }}
              >
                {mod.label}
              </h3>

              {/* Desc */}
              <p
                className="text-[12px] leading-relaxed font-body flex-1"
                style={{ color: 'var(--text-muted)' }}
              >
                {mod.desc}
              </p>

              {/* Bottom hover bar */}
              <div
                className="h-[2px] rounded-full mt-auto overflow-hidden"
                style={{ background: 'var(--border)' }}
              >
                <div
                  className="h-full rounded-full w-0 group-hover:w-full
                             transition-all duration-500"
                  style={{ background: mod.accent }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Stats strip */}
        <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: '22+',              label: 'Modules',          icon: '📦', accent: 'var(--primary-500)', bg: 'var(--primary-50)',     border: 'var(--primary-200)'       },
            { value: '4',                label: 'User Roles',       icon: '👥', accent: 'var(--role-student)', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)'     },
            { value: `₹${starterPrice}`, label: 'Starting Price/mo',icon: '💰', accent: 'var(--warning)',      bg: 'var(--warning-light)',  border: 'rgba(245,158,11,0.2)'     },
            { value: '99.9%',            label: 'Uptime',           icon: '⚡', accent: 'var(--success)',      bg: 'var(--success-light)',  border: 'rgba(16,185,129,0.2)'     },
          ].map(stat => (
            <div
              key={stat.label}
              className="text-center p-5 rounded-[var(--radius-lg)]"
              style={{
                background: stat.bg,
                border:     `1px solid ${stat.border}`,
              }}
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <p
                className="text-2xl font-extrabold font-display"
                style={{ color: 'var(--text-primary)' }}
              >
                {stat.value}
              </p>
              <p
                className="text-xs font-body mt-1"
                style={{ color: 'var(--text-muted)' }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}