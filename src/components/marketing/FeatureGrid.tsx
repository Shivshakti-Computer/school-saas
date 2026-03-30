// FILE: src/components/marketing/FeatureGrid.tsx

'use client'

import { Container } from './Container'
import { SectionTitle } from './MiniUI'
import { useRevealGroup } from '@/hooks/useReveal'

/* ═══════════════════════════════════════════════════════
   SVG ILLUSTRATIONS — Light Theme Colors
   ═══════════════════════════════════════════════════════ */

function StudentIllustration() {
  return (
    <svg viewBox="0 0 200 120" fill="none" className="w-full h-auto">
      <rect x="20" y="10" width="160" height="100" rx="12" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1" />
      <circle cx="60" cy="45" r="16" fill="#DBEAFE" />
      <circle cx="60" cy="40" r="6" fill="#3B82F6" />
      <path d="M46 58a14 14 0 0 1 28 0" fill="#93C5FD" />
      <rect x="90" y="32" width="70" height="6" rx="3" fill="#E2E8F0" />
      <rect x="90" y="44" width="50" height="5" rx="2.5" fill="#F1F5F9" />
      <rect x="90" y="55" width="60" height="5" rx="2.5" fill="#F1F5F9" />
      <rect x="30" y="72" width="60" height="28" rx="6" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="0.5" />
      <rect x="38" y="80" width="20" height="3" rx="1.5" fill="#3B82F6" />
      <rect x="38" y="87" width="40" height="2.5" rx="1.25" fill="#CBD5E1" />
      <rect x="38" y="93" width="30" height="2.5" rx="1.25" fill="#E2E8F0" />
      <circle cx="165" cy="25" r="4" fill="#10B981" />
      <rect x="105" y="78" width="30" height="18" rx="5" fill="#D1FAE5" />
      <rect x="140" y="78" width="30" height="18" rx="5" fill="#DBEAFE" />
    </svg>
  )
}

function AttendanceIllustration() {
  const pattern = [
    [true, true, true, false, true, true, true],
    [true, true, true, true, true, false, true],
    [true, false, true, true, true, true, true],
    [true, true, true, true, false, true, true],
  ]

  return (
    <svg viewBox="0 0 200 120" fill="none" className="w-full h-auto">
      <rect x="20" y="10" width="160" height="100" rx="12" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1" />
      <rect x="20" y="10" width="160" height="24" rx="12" fill="#D1FAE5" />
      <rect x="65" y="18" width="70" height="5" rx="2.5" fill="#10B981" />
      {pattern.map((row, rowIdx) =>
        row.map((isPresent, colIdx) => {
          const x = 30 + colIdx * 21
          const y = 42 + rowIdx * 17
          return (
            <g key={`${rowIdx}-${colIdx}`}>
              <rect
                x={x}
                y={y}
                width="16"
                height="12"
                rx="3"
                fill={isPresent ? '#D1FAE5' : '#FEE2E2'}
              />
              {isPresent ? (
                <path
                  d={`M${x + 4} ${y + 6}l3 3 5-5`}
                  stroke="#10B981"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : (
                <path
                  d={`M${x + 5} ${y + 4}l6 6M${x + 11} ${y + 4}l-6 6`}
                  stroke="#EF4444"
                  strokeWidth="1"
                  strokeLinecap="round"
                />
              )}
            </g>
          )
        })
      )}
    </svg>
  )
}

function FeesIllustration() {
  return (
    <svg viewBox="0 0 200 120" fill="none" className="w-full h-auto">
      <rect x="30" y="8" width="140" height="104" rx="12" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="1" />
      <rect x="30" y="8" width="140" height="28" rx="12" fill="#FEF3C7" />
      <rect x="55" y="16" width="90" height="5" rx="2.5" fill="#F59E0B" />
      <rect x="70" y="25" width="60" height="3" rx="1.5" fill="#FDE68A" />
      <text x="100" y="58" textAnchor="middle" fill="#D97706" fontSize="16" fontWeight="bold" fontFamily="monospace">₹2,500</text>
      <rect x="45" y="68" width="50" height="3" rx="1.5" fill="#E2E8F0" />
      <rect x="120" y="68" width="30" height="3" rx="1.5" fill="#F1F5F9" />
      <rect x="45" y="78" width="40" height="3" rx="1.5" fill="#E2E8F0" />
      <rect x="120" y="78" width="30" height="3" rx="1.5" fill="#F1F5F9" />
      <line x1="45" y1="88" x2="155" y2="88" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 2" />
      <rect x="45" y="93" width="30" height="4" rx="2" fill="#FDE68A" />
      <rect x="115" y="93" width="40" height="4" rx="2" fill="#FDE68A" />
      <rect x="65" y="102" width="70" height="7" rx="3.5" fill="#D1FAE5" />
      <rect x="75" y="104" width="50" height="3" rx="1.5" fill="#10B981" />
    </svg>
  )
}

function ExamsIllustration() {
  const subjects = [
    { score: 85 },
    { score: 72 },
    { score: 91 },
    { score: 68 },
    { score: 78 },
  ]

  return (
    <svg viewBox="0 0 200 120" fill="none" className="w-full h-auto">
      <rect x="25" y="8" width="150" height="104" rx="12" fill="#FFF1F2" stroke="#FECDD3" strokeWidth="1" />
      <rect x="25" y="8" width="150" height="24" rx="12" fill="#FFE4E6" />
      <rect x="60" y="15" width="80" height="5" rx="2.5" fill="#F43F5E" />
      {subjects.map((sub, i) => {
        const y = 40 + i * 13
        const barWidth = sub.score * 0.7
        const fillColor =
          sub.score > 80 ? '#86EFAC' : sub.score > 60 ? '#FDE68A' : '#FECACA'
        return (
          <g key={i}>
            <rect x="35" y={y} width="35" height="4" rx="2" fill="#E2E8F0" />
            <rect x="78" y={y - 1} width={barWidth} height="6" rx="3" fill={fillColor} />
            <text x="155" y={y + 4} fill="#64748B" fontSize="6" fontFamily="monospace">
              {sub.score}%
            </text>
          </g>
        )
      })}
      <circle cx="155" cy="98" r="10" fill="#D1FAE5" stroke="#10B981" strokeWidth="1" />
      <text x="155" y="101" textAnchor="middle" fill="#059669" fontSize="8" fontWeight="bold">A+</text>
    </svg>
  )
}

function NoticesIllustration() {
  return (
    <svg viewBox="0 0 200 120" fill="none" className="w-full h-auto">
      <rect x="35" y="20" width="130" height="30" rx="8" fill="#F0F9FF" stroke="#BAE6FD" strokeWidth="0.5" transform="rotate(-2 100 35)" />
      <rect x="30" y="35" width="140" height="35" rx="10" fill="#E0F2FE" stroke="#7DD3FC" strokeWidth="1" />
      <rect x="25" y="50" width="150" height="55" rx="12" fill="#F0F9FF" stroke="#BAE6FD" strokeWidth="1" />
      <circle cx="48" cy="72" r="10" fill="#E0F2FE" />
      <path d="M44 72a4 4 0 0 1 8 0c0 4 2 5 2 5H42s2-1 2-5" stroke="#0EA5E9" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <circle cx="48" cy="78.5" r="1" fill="#0EA5E9" />
      <rect x="65" y="66" width="90" height="4" rx="2" fill="#E2E8F0" />
      <rect x="65" y="74" width="70" height="3" rx="1.5" fill="#F1F5F9" />
      <rect x="65" y="82" width="50" height="3" rx="1.5" fill="#F8FAFC" />
      <rect x="130" y="88" width="35" height="12" rx="6" fill="#D1FAE5" />
      <text x="147" y="96" textAnchor="middle" fill="#059669" fontSize="6" fontWeight="600">SMS ✓</text>
      <circle cx="167" cy="58" r="4" fill="#EF4444" />
      <text x="167" y="60" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold">3</text>
    </svg>
  )
}

function WebsiteIllustration() {
  return (
    <svg viewBox="0 0 200 120" fill="none" className="w-full h-auto">
      <rect x="15" y="8" width="170" height="104" rx="10" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1" />
      <rect x="15" y="8" width="170" height="18" rx="10" fill="#D1FAE5" />
      <circle cx="28" cy="17" r="2.5" fill="#F87171" />
      <circle cx="36" cy="17" r="2.5" fill="#FBBF24" />
      <circle cx="44" cy="17" r="2.5" fill="#34D399" />
      <rect x="55" y="13" width="80" height="8" rx="4" fill="white" />
      <rect x="22" y="30" width="156" height="30" rx="4" fill="#DBEAFE" />
      <rect x="50" y="38" width="100" height="5" rx="2.5" fill="#3B82F6" />
      <rect x="65" y="47" width="70" height="3" rx="1.5" fill="#93C5FD" />
      <rect x="22" y="65" width="48" height="38" rx="4" fill="white" stroke="#E2E8F0" strokeWidth="0.5" />
      <rect x="76" y="65" width="48" height="38" rx="4" fill="white" stroke="#E2E8F0" strokeWidth="0.5" />
      <rect x="130" y="65" width="48" height="38" rx="4" fill="white" stroke="#E2E8F0" strokeWidth="0.5" />
      <rect x="28" y="72" width="36" height="14" rx="3" fill="#EFF6FF" />
      <rect x="28" y="90" width="30" height="3" rx="1.5" fill="#CBD5E1" />
      <rect x="82" y="72" width="36" height="14" rx="3" fill="#ECFDF5" />
      <rect x="82" y="90" width="30" height="3" rx="1.5" fill="#CBD5E1" />
      <rect x="136" y="72" width="36" height="14" rx="3" fill="#FFFBEB" />
      <rect x="136" y="90" width="30" height="3" rx="1.5" fill="#CBD5E1" />
    </svg>
  )
}

function ReportsIllustration() {
  const barHeights = [40, 65, 45, 80, 55, 72, 90, 60, 75, 85]

  return (
    <svg viewBox="0 0 200 120" fill="none" className="w-full h-auto">
      <rect x="20" y="10" width="160" height="100" rx="12" fill="#F5F3FF" stroke="#DDD6FE" strokeWidth="1" />
      <rect x="30" y="25" width="140" height="60" rx="6" fill="#EDE9FE" />
      {[0, 1, 2, 3].map(i => (
        <line key={i} x1="30" y1={35 + i * 13} x2="170" y2={35 + i * 13} stroke="#DDD6FE" strokeWidth="0.5" />
      ))}
      {barHeights.map((h, i) => (
        <rect
          key={i}
          x={38 + i * 13}
          y={85 - h * 0.55}
          width="8"
          height={h * 0.55}
          rx="2"
          fill={`rgba(139,92,246,${0.4 + h / 200})`}
        />
      ))}
      <rect x="35" y="92" width="6" height="6" rx="1.5" fill="#8B5CF6" />
      <rect x="45" y="93" width="30" height="3" rx="1.5" fill="#CBD5E1" />
      <rect x="85" y="92" width="6" height="6" rx="1.5" fill="#10B981" />
      <rect x="95" y="93" width="30" height="3" rx="1.5" fill="#CBD5E1" />
      <rect x="135" y="92" width="30" height="10" rx="5" fill="#EDE9FE" />
      <text x="150" y="99" textAnchor="middle" fill="#7C3AED" fontSize="5" fontWeight="600">PDF ↓</text>
    </svg>
  )
}

function SecurityIllustration() {
  return (
    <svg viewBox="0 0 200 120" fill="none" className="w-full h-auto">
      <path
        d="M100 15l55 20v35c0 25-22 40-55 45-33-5-55-20-55-45V35l55-20z"
        fill="#F1F5F9"
        stroke="#CBD5E1"
        strokeWidth="1"
      />
      <path
        d="M100 28l38 14v24c0 17-15 28-38 32-23-4-38-15-38-32V42l38-14z"
        fill="#E2E8F0"
      />
      <rect x="90" y="52" width="20" height="16" rx="3" fill="#94A3B8" />
      <path d="M95 52v-6a5 5 0 0 1 10 0v6" stroke="#64748B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="100" cy="60" r="2" fill="#475569" />
      <line x1="100" y1="61" x2="100" y2="64" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="20" y="85" width="38" height="14" rx="7" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="0.5" />
      <text x="39" y="94" textAnchor="middle" fill="#3B82F6" fontSize="6" fontWeight="600">Admin</text>
      <rect x="64" y="85" width="42" height="14" rx="7" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="0.5" />
      <text x="85" y="94" textAnchor="middle" fill="#10B981" fontSize="6" fontWeight="600">Teacher</text>
      <rect x="112" y="85" width="42" height="14" rx="7" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="0.5" />
      <text x="133" y="94" textAnchor="middle" fill="#D97706" fontSize="6" fontWeight="600">Student</text>
      <rect x="160" y="85" width="30" height="14" rx="7" fill="#FFF1F2" stroke="#FECDD3" strokeWidth="0.5" />
      <text x="175" y="94" textAnchor="middle" fill="#E11D48" fontSize="6" fontWeight="600">Parent</text>
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════
   FEATURES DATA — Light Theme
   ═══════════════════════════════════════════════════════ */
const features = [
  {
    illustration: <StudentIllustration />,
    title: 'Student & Staff Management',
    desc: 'Complete admission workflow, student profiles, ID card generation, bulk import via Excel & staff records.',
    points: ['Bulk import/export', 'ID cards PDF', 'Parent linking', 'Profile photos'],
    gradient: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-100',
    accentColor: '#3B82F6',
  },
  {
    illustration: <AttendanceIllustration />,
    title: 'Attendance Tracking',
    desc: 'Daily class-wise attendance with auto absent SMS to parents. Visual reports & monthly analytics.',
    points: ['Auto SMS to parents', 'Monthly reports', 'Class-wise view', 'Holiday calendar'],
    gradient: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-100',
    accentColor: '#10B981',
  },
  {
    illustration: <FeesIllustration />,
    title: 'Online Fee Collection',
    desc: 'Collect fees via Razorpay. Auto late-fine, SMS reminders, PDF receipts & detailed fee reports.',
    points: ['Razorpay payments', 'Auto reminders', 'Late fine rules', 'PDF receipts'],
    gradient: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-100',
    accentColor: '#F59E0B',
  },
  {
    illustration: <ExamsIllustration />,
    title: 'Exams & Results',
    desc: 'Schedule exams, teacher marks entry, auto grade calculation, report cards & result SMS to parents.',
    points: ['Grade cards PDF', 'Result SMS', 'Subject analytics', 'Rank generation'],
    gradient: 'from-rose-500 to-pink-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-100',
    accentColor: '#F43F5E',
  },
  {
    illustration: <NoticesIllustration />,
    title: 'Notices & Communication',
    desc: 'Publish circulars, send SMS blasts, WhatsApp messages. Keep parents & students always informed.',
    points: ['SMS blast', 'WhatsApp ready', 'Class-wise targeting', 'Read receipts'],
    gradient: 'from-sky-500 to-blue-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-100',
    accentColor: '#0EA5E9',
  },
  {
    illustration: <WebsiteIllustration />,
    title: 'School Website Builder',
    desc: 'Professional templates, drag-to-reorder sections, photo gallery, events, contact forms — no coding needed.',
    points: ['3 templates', 'Gallery & events', 'SEO optimized', 'Mobile responsive'],
    gradient: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-100',
    accentColor: '#22C55E',
  },
  {
    illustration: <ReportsIllustration />,
    title: 'Reports & Analytics',
    desc: 'Class-wise analytics, attendance trends, fee collection reports. Export everything to PDF & Excel.',
    points: ['PDF & Excel export', 'Visual charts', 'Trend analysis', 'Custom filters'],
    gradient: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-100',
    accentColor: '#8B5CF6',
  },
  {
    illustration: <SecurityIllustration />,
    title: 'Security & Access Control',
    desc: 'Role-based access (Admin, Teacher, Student, Parent). Plan-based module locks & tenant data isolation.',
    points: ['4 user roles', 'Module locking', 'Data encryption', 'Tenant isolation'],
    gradient: 'from-slate-500 to-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    accentColor: '#64748B',
  },
]

/* ═══════════════════════════════════════════════════════
   FEATURE GRID COMPONENT — Light Theme
   ═══════════════════════════════════════════════════════ */
export function FeatureGrid() {
  const gridRef = useRevealGroup()

  return (
    <section id="features" className="section-padding relative bg-slate-50">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-blue-500/[0.03] blur-[150px] rounded-full" />
      </div>

      <Container>
        <SectionTitle
          eyebrow="✨ Core Features"
          title="Everything your school needs, in one connected system"
          subtitle="No more juggling multiple apps. One login, one subscription — a clean experience for admin, teachers, parents & students."
          center
        />

        <div ref={gridRef} className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-5 reveal-stagger">
          {features.map((feature) => (
            <div 
              key={feature.title} 
              className={`reveal group bg-white rounded-2xl border ${feature.borderColor} shadow-soft hover:shadow-medium transition-all duration-300 overflow-hidden`}
            >
              <div className="flex flex-col sm:flex-row">
                {/* Illustration */}
                <div className={`sm:w-[45%] p-4 flex items-center justify-center ${feature.bgColor}`}>
                  <div className="w-full max-w-[200px]">{feature.illustration}</div>
                </div>

                {/* Content */}
                <div className="flex-1 p-5">
                  <div className={`w-10 h-1 rounded-full bg-gradient-to-r ${feature.gradient} mb-3`} />
                  <h3 className="text-base font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-[13px] text-slate-600 leading-relaxed mb-3">{feature.desc}</p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                    {feature.points.map(point => (
                      <span key={point} className="flex items-center gap-1.5 text-[12px] text-slate-500">
                        <span 
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: feature.accentColor }}
                        />
                        {point}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom hover indicator */}
              <div className="h-[2px] bg-slate-100">
                <div className={`h-full bg-gradient-to-r ${feature.gradient} w-0 group-hover:w-full transition-all duration-700 ease-out`} />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}