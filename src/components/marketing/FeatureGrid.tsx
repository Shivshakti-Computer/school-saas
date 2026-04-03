// FILE: src/components/marketing/FeatureGrid.tsx
// UPDATED: Credit system + addon info in relevant features

'use client'

import { Container } from './Container'
import { SectionTitle } from './MiniUI'
import { useRevealGroup } from '@/hooks/useReveal'
import { PLANS, TRIAL_CONFIG } from '@/config/pricing'

/* ═══════════════════════════════════════════════════════
   SVG ILLUSTRATIONS — Same as before
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
              <rect x={x} y={y} width="16" height="12" rx="3" fill={isPresent ? '#D1FAE5' : '#FEE2E2'} />
              {isPresent ? (
                <path d={`M${x + 4} ${y + 6}l3 3 5-5`} stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d={`M${x + 5} ${y + 4}l6 6M${x + 11} ${y + 4}l-6 6`} stroke="#EF4444" strokeWidth="1" strokeLinecap="round" />
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
  const subjects = [{ score: 85 }, { score: 72 }, { score: 91 }, { score: 68 }, { score: 78 }]
  return (
    <svg viewBox="0 0 200 120" fill="none" className="w-full h-auto">
      <rect x="25" y="8" width="150" height="104" rx="12" fill="#FFF1F2" stroke="#FECDD3" strokeWidth="1" />
      <rect x="25" y="8" width="150" height="24" rx="12" fill="#FFE4E6" />
      <rect x="60" y="15" width="80" height="5" rx="2.5" fill="#F43F5E" />
      {subjects.map((sub, i) => {
        const y = 40 + i * 13
        const barWidth = sub.score * 0.7
        const fillColor = sub.score > 80 ? '#86EFAC' : sub.score > 60 ? '#FDE68A' : '#FECACA'
        return (
          <g key={i}>
            <rect x="35" y={y} width="35" height="4" rx="2" fill="#E2E8F0" />
            <rect x="78" y={y - 1} width={barWidth} height="6" rx="3" fill={fillColor} />
            <text x="155" y={y + 4} fill="#64748B" fontSize="6" fontFamily="monospace">{sub.score}%</text>
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
      {/* SMS = 1 credit tag */}
      <rect x="115" y="88" width="50" height="12" rx="6" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="0.5" />
      <text x="140" y="96" textAnchor="middle" fill="#4F46E5" fontSize="5.5" fontWeight="600">1 SMS = 1 Credit</text>
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
        <rect key={i} x={38 + i * 13} y={85 - h * 0.55} width="8" height={h * 0.55} rx="2" fill={`rgba(139,92,246,${0.4 + h / 200})`} />
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
      <path d="M100 15l55 20v35c0 25-22 40-55 45-33-5-55-20-55-45V35l55-20z" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1" />
      <path d="M100 28l38 14v24c0 17-15 28-38 32-23-4-38-15-38-32V42l38-14z" fill="#E2E8F0" />
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
   CREDIT INFO BANNER — NEW
   ═══════════════════════════════════════════════════════ */
function CreditInfoBanner() {
  const plans = Object.values(PLANS)

  return (
    <div className="mt-10 rounded-2xl border border-indigo-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-5 py-4 border-b border-indigo-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-base">💳</div>
          <div>
            <p className="text-sm font-bold text-slate-900">Pay-as-you-go Credit System</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Messaging credits — use only what you need · Credits rollover (plan ke anusar)
            </p>
          </div>
        </div>
      </div>

      {/* Credit rates */}
      <div className="bg-white px-5 py-4 border-b border-slate-100">
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: '📱', action: '1 SMS', credits: '1 credit', cost: '≈ ₹1' },
            { icon: '💬', action: '1 WhatsApp', credits: '1 credit', cost: '≈ ₹1' },
            { icon: '📧', action: '10 Emails', credits: '1 credit', cost: '≈ ₹0.10/email' },
          ].map(item => (
            <div key={item.action} className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-xs font-semibold text-slate-700">{item.action}</div>
              <div className="text-xs font-bold text-indigo-600 mt-0.5">= {item.credits}</div>
              <div className="text-[10px] text-slate-400">{item.cost}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Per plan credits + rollover */}
      <div className="bg-white px-5 py-4">
        <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wide">
          Free credits included per plan
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {plans.map(plan => {
            const maxCarry = plan.creditRolloverMonths === -1
              ? null
              : plan.creditRolloverMonths === 0
                ? 0
                : plan.creditRolloverMonths * plan.freeCreditsPerMonth

            return (
              <div
                key={plan.id}
                className="rounded-xl p-3 border text-center"
                style={{ borderColor: `${plan.color}25`, background: `${plan.color}06` }}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: plan.color }} />
                  <span className="text-[11px] font-bold" style={{ color: plan.color }}>{plan.name}</span>
                </div>
                <div className="text-base font-extrabold text-slate-800">
                  {plan.freeCreditsPerMonth.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-400">credits/mo</div>

                {/* Rollover */}
                <div className="mt-1.5 pt-1.5 border-t border-slate-100">
                  <div
                    className="text-[10px] font-semibold"
                    style={{
                      color: plan.creditRolloverMonths === -1
                        ? '#10B981'
                        : plan.creditRolloverMonths === 0
                          ? '#94A3B8'
                          : '#4F46E5',
                    }}
                  >
                    {plan.creditRolloverMonths === -1
                      ? '✨ Never expire'
                      : plan.creditRolloverMonths === 0
                        ? '🔄 Monthly reset'
                        : `♻️ ${plan.creditRolloverMonths}mo rollover`}
                  </div>
                  {maxCarry !== null && maxCarry > 0 && (
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      max {maxCarry.toLocaleString('en-IN')} carry
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-[10px] text-slate-400 mt-3 text-center">
          Extra credits khatam ho to credit packs kharido — ₹199 se shuru · Koi subscription nahi
        </p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   ADDON LIMITS BANNER — NEW
   ═══════════════════════════════════════════════════════ */
function AddonLimitsBanner() {
  const plans = Object.values(PLANS)

  return (
    <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0 mt-0.5">👥</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-900 mb-1">
            Student & Teacher Add-on Limits
          </p>
          <p className="text-xs text-slate-600 mb-3">
            Plan limit ke upar extra students/teachers kharid sakte ho — plan cap tak.
            Cap full hone par plan upgrade karo.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {plans.map(plan => {
              const maxStudents = plan.maxStudents === -1
                ? 'Unlimited'
                : `${plan.maxStudents} + ${plan.maxAddonStudents === -1 ? '∞' : plan.maxAddonStudents}`
              const totalMax = plan.maxStudents === -1
                ? 'Unlimited'
                : plan.maxAddonStudents === -1
                  ? `${plan.maxStudents}+`
                  : (plan.maxStudents + plan.maxAddonStudents).toLocaleString('en-IN')

              return (
                <div
                  key={plan.id}
                  className="rounded-lg p-2.5 bg-white border text-center"
                  style={{ borderColor: `${plan.color}20` }}
                >
                  <div className="text-[10px] font-bold mb-1" style={{ color: plan.color }}>
                    {plan.name}
                  </div>
                  <div className="text-[11px] text-slate-600">{maxStudents}</div>
                  <div className="text-[9px] text-slate-400">base + add-on</div>
                  <div className="text-xs font-bold text-emerald-600 mt-1">
                    max {totalMax}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   FEATURES DATA — UPDATED with credit/addon context
   ═══════════════════════════════════════════════════════ */
const features = [
  {
    illustration: <StudentIllustration />,
    title: 'Student & Staff Management',
    desc: 'Complete admission workflow, student profiles, ID card generation, bulk import via Excel & staff records. Plan-based limits with add-on flexibility.',
    points: ['Bulk import/export', 'ID cards PDF', 'Parent linking', 'Add-on slots available'],
    gradient: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-100',
    accentColor: '#3B82F6',
    // NEW: addon context
    badge: '👤 Add-on available',
    badgeColor: '#EFF6FF',
    badgeTextColor: '#3B82F6',
  },
  {
    illustration: <AttendanceIllustration />,
    title: 'Attendance Tracking',
    desc: 'Daily class-wise attendance with auto absent SMS to parents using credits. Visual reports & monthly analytics.',
    points: ['Auto SMS (1 credit/SMS)', 'Monthly reports', 'Class-wise view', 'Holiday calendar'],
    gradient: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-100',
    accentColor: '#10B981',
    badge: '💳 Uses credits',
    badgeColor: '#ECFDF5',
    badgeTextColor: '#059669',
  },
  {
    illustration: <FeesIllustration />,
    title: 'Online Fee Collection',
    desc: 'Collect fees via Razorpay. Auto late-fine, SMS reminders (credit-based), PDF receipts & detailed fee reports.',
    points: ['Razorpay payments', 'SMS reminders (credits)', 'Late fine rules', 'PDF receipts'],
    gradient: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-100',
    accentColor: '#F59E0B',
    badge: '💳 SMS uses credits',
    badgeColor: '#FFFBEB',
    badgeTextColor: '#D97706',
  },
  {
    illustration: <ExamsIllustration />,
    title: 'Exams & Results',
    desc: 'Schedule exams, teacher marks entry, auto grade calculation, report cards & result SMS to parents.',
    points: ['Grade cards PDF', 'Result SMS (credits)', 'Subject analytics', 'Rank generation'],
    gradient: 'from-rose-500 to-pink-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-100',
    accentColor: '#F43F5E',
    badge: null,
    badgeColor: '',
    badgeTextColor: '',
  },
  {
    illustration: <NoticesIllustration />,
    title: 'Notices & Communication',
    desc: 'Publish circulars, send SMS blasts (1 credit/SMS), WhatsApp messages (1 credit/WA). Free credits included in every plan — extra packs available.',
    points: ['1 SMS = 1 Credit', '1 WhatsApp = 1 Credit', 'Class-wise targeting', 'Credits rollover (paid plans)'],
    gradient: 'from-sky-500 to-blue-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-100',
    accentColor: '#0EA5E9',
    badge: '💳 Credit-based messaging',
    badgeColor: '#EFF6FF',
    badgeTextColor: '#4F46E5',
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
    badge: null,
    badgeColor: '',
    badgeTextColor: '',
  },
  {
    illustration: <ReportsIllustration />,
    title: 'Reports & Analytics',
    desc: 'Class-wise analytics, attendance trends, fee collection reports, credit usage stats. Export everything to PDF & Excel.',
    points: ['PDF & Excel export', 'Credit usage report', 'Trend analysis', 'Custom filters'],
    gradient: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-100',
    accentColor: '#8B5CF6',
    badge: null,
    badgeColor: '',
    badgeTextColor: '',
  },
  {
    illustration: <SecurityIllustration />,
    title: 'Security & Access Control',
    desc: 'Role-based access (Admin, Teacher, Student, Parent). Plan-based module locks, addon limits & tenant data isolation.',
    points: ['4 user roles', 'Plan + addon limits', 'Data encryption', 'Tenant isolation'],
    gradient: 'from-slate-500 to-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    accentColor: '#64748B',
    badge: '🔒 Plan-enforced limits',
    badgeColor: '#F8FAFC',
    badgeTextColor: '#64748B',
  },
]

/* ═══════════════════════════════════════════════════════
   FEATURE GRID COMPONENT
   ═══════════════════════════════════════════════════════ */
export function FeatureGrid() {
  const gridRef = useRevealGroup()

  return (
    <section id="features" className="section-padding relative bg-slate-50">
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

        {/* Feature Cards */}
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

                  {/* Title + badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-base font-bold text-slate-900">{feature.title}</h3>
                    {feature.badge && (
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap"
                        style={{ background: feature.badgeColor, color: feature.badgeTextColor }}
                      >
                        {feature.badge}
                      </span>
                    )}
                  </div>

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

        {/* Credit System Banner — after feature cards */}
        <CreditInfoBanner />

        {/* Addon Limits Banner */}
        <AddonLimitsBanner />
      </Container>
    </section>
  )
}