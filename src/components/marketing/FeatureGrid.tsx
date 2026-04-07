'use client'

import { Container }      from './Container'
import { SectionTitle }   from './MiniUI'
import { useRevealGroup } from '@/hooks/useReveal'
import { PLANS }          from '@/config/pricing'

/* ─────────────────────────────────────────────────────────────
   SVG ILLUSTRATIONS
   ───────────────────────────────────────────────────────────── */

function StudentIllustration() {
  return (
    <svg viewBox="0 0 200 120" fill="none" className="w-full h-auto">
      <rect x="20" y="10" width="160" height="100" rx="12"
        fill="var(--primary-50)" stroke="var(--primary-200)" strokeWidth="1" />
      <circle cx="60" cy="45" r="16" fill="var(--primary-100)" />
      <circle cx="60" cy="40" r="6"  fill="var(--primary-500)" />
      <path d="M46 58a14 14 0 0 1 28 0" fill="var(--primary-300)" />
      <rect x="90" y="32" width="70" height="6" rx="3"  fill="var(--border)"    />
      <rect x="90" y="44" width="50" height="5" rx="2.5" fill="var(--bg-muted)"  />
      <rect x="90" y="55" width="60" height="5" rx="2.5" fill="var(--bg-muted)"  />
      <rect x="30" y="72" width="60" height="28" rx="6"
        fill="var(--primary-50)" stroke="var(--primary-200)" strokeWidth="0.5" />
      <rect x="38" y="80" width="20" height="3" rx="1.5" fill="var(--primary-500)" />
      <rect x="38" y="87" width="40" height="2.5" rx="1.25" fill="var(--border)"  />
      <rect x="38" y="93" width="30" height="2.5" rx="1.25" fill="var(--bg-muted)" />
      <circle cx="165" cy="25" r="4" fill="var(--success)" />
      <rect x="105" y="78" width="30" height="18" rx="5" fill="var(--success-light)" />
      <rect x="140" y="78" width="30" height="18" rx="5" fill="var(--primary-100)" />
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
      <rect x="20" y="10" width="160" height="100" rx="12"
        fill="var(--success-light)" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
      <rect x="20" y="10" width="160" height="24" rx="12" fill="rgba(16,185,129,0.15)" />
      <rect x="65" y="18" width="70" height="5" rx="2.5" fill="var(--success)" />
      {pattern.map((row, rowIdx) =>
        row.map((isPresent, colIdx) => {
          const x = 30 + colIdx * 21
          const y = 42 + rowIdx * 17
          return (
            <g key={`${rowIdx}-${colIdx}`}>
              <rect x={x} y={y} width="16" height="12" rx="3"
                fill={isPresent ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)'} />
              {isPresent ? (
                <path d={`M${x+4} ${y+6}l3 3 5-5`}
                  stroke="var(--success)" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d={`M${x+5} ${y+4}l6 6M${x+11} ${y+4}l-6 6`}
                  stroke="var(--danger)" strokeWidth="1" strokeLinecap="round" />
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
      <rect x="30" y="8" width="140" height="104" rx="12"
        fill="var(--warning-light)" stroke="rgba(245,158,11,0.3)" strokeWidth="1" />
      <rect x="30" y="8" width="140" height="28" rx="12" fill="rgba(245,158,11,0.12)" />
      <rect x="55" y="16" width="90" height="5" rx="2.5" fill="var(--warning)"   />
      <rect x="70" y="25" width="60" height="3" rx="1.5" fill="rgba(245,158,11,0.3)" />
      <text x="100" y="58" textAnchor="middle"
        fill="var(--warning-dark)" fontSize="16" fontWeight="bold" fontFamily="monospace">
        ₹2,500
      </text>
      <rect x="45" y="68" width="50" height="3" rx="1.5" fill="var(--border)"   />
      <rect x="120" y="68" width="30" height="3" rx="1.5" fill="var(--bg-muted)" />
      <rect x="45" y="78" width="40" height="3" rx="1.5" fill="var(--border)"   />
      <rect x="120" y="78" width="30" height="3" rx="1.5" fill="var(--bg-muted)" />
      <line x1="45" y1="88" x2="155" y2="88"
        stroke="var(--border)" strokeWidth="1" strokeDasharray="4 2" />
      <rect x="45" y="93" width="30" height="4" rx="2" fill="rgba(245,158,11,0.25)" />
      <rect x="115" y="93" width="40" height="4" rx="2" fill="rgba(245,158,11,0.25)" />
      <rect x="65" y="102" width="70" height="7" rx="3.5" fill="var(--success-light)" />
      <rect x="75" y="104" width="50" height="3" rx="1.5" fill="var(--success)"  />
    </svg>
  )
}

function ExamsIllustration() {
  const subjects = [{ score: 85 }, { score: 72 }, { score: 91 }, { score: 68 }, { score: 78 }]
  return (
    <svg viewBox="0 0 200 120" fill="none" className="w-full h-auto">
      <rect x="25" y="8" width="150" height="104" rx="12"
        fill="rgba(239,68,68,0.05)" stroke="rgba(239,68,68,0.2)" strokeWidth="1" />
      <rect x="25" y="8" width="150" height="24" rx="12" fill="rgba(239,68,68,0.1)" />
      <rect x="60" y="15" width="80" height="5" rx="2.5" fill="var(--danger)" />
      {subjects.map((sub, i) => {
        const y        = 40 + i * 13
        const barWidth = sub.score * 0.7
        const fill     = sub.score > 80
          ? 'rgba(16,185,129,0.5)'
          : sub.score > 60
            ? 'rgba(245,158,11,0.5)'
            : 'rgba(239,68,68,0.4)'
        return (
          <g key={i}>
            <rect x="35" y={y}   width="35"      height="4" rx="2" fill="var(--border)" />
            <rect x="78" y={y-1} width={barWidth} height="6" rx="3" fill={fill}         />
            <text x="155" y={y+4} fill="var(--text-muted)"
              fontSize="6" fontFamily="monospace">{sub.score}%</text>
          </g>
        )
      })}
      <circle cx="155" cy="98" r="10" fill="var(--success-light)"
        stroke="var(--success)" strokeWidth="1" />
      <text x="155" y="101" textAnchor="middle"
        fill="var(--success-dark)" fontSize="8" fontWeight="bold">A+</text>
    </svg>
  )
}

function NoticesIllustration() {
  return (
    <svg viewBox="0 0 200 120" fill="none" className="w-full h-auto">
      <rect x="35" y="20" width="130" height="30" rx="8"
        fill="var(--info-light)" stroke="rgba(59,130,246,0.25)" strokeWidth="0.5"
        transform="rotate(-2 100 35)" />
      <rect x="30" y="35" width="140" height="35" rx="10"
        fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.25)" strokeWidth="1" />
      <rect x="25" y="50" width="150" height="55" rx="12"
        fill="var(--info-light)" stroke="rgba(59,130,246,0.2)" strokeWidth="1" />
      <circle cx="48" cy="72" r="10" fill="rgba(59,130,246,0.12)" />
      <path d="M44 72a4 4 0 0 1 8 0c0 4 2 5 2 5H42s2-1 2-5"
        stroke="var(--info)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <circle cx="48" cy="78.5" r="1" fill="var(--info)" />
      <rect x="65" y="66" width="90" height="4" rx="2" fill="var(--border)"   />
      <rect x="65" y="74" width="70" height="3" rx="1.5" fill="var(--bg-muted)" />
      <rect x="65" y="82" width="50" height="3" rx="1.5" fill="var(--bg-subtle)" />
      {/* Credit tag */}
      <rect x="115" y="88" width="50" height="12" rx="6"
        fill="var(--primary-50)" stroke="var(--primary-200)" strokeWidth="0.5" />
      <text x="140" y="96" textAnchor="middle"
        fill="var(--primary-600)" fontSize="5.5" fontWeight="600">1 SMS = 1 Credit</text>
      <circle cx="167" cy="58" r="4" fill="var(--danger)" />
      <text x="167" y="60" textAnchor="middle"
        fill="white" fontSize="5" fontWeight="bold">3</text>
    </svg>
  )
}

function WebsiteIllustration() {
  return (
    <svg viewBox="0 0 200 120" fill="none" className="w-full h-auto">
      <rect x="15" y="8" width="170" height="104" rx="10"
        fill="var(--success-light)" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
      <rect x="15" y="8" width="170" height="18" rx="10" fill="rgba(16,185,129,0.15)" />
      <circle cx="28" cy="17" r="2.5" fill="rgba(239,68,68,0.6)"  />
      <circle cx="36" cy="17" r="2.5" fill="rgba(245,158,11,0.6)" />
      <circle cx="44" cy="17" r="2.5" fill="rgba(16,185,129,0.6)" />
      <rect x="55" y="13" width="80" height="8" rx="4"
        fill="var(--bg-card)" />
      <rect x="22" y="30" width="156" height="30" rx="4"
        fill="rgba(59,130,246,0.12)" />
      <rect x="50" y="38" width="100" height="5" rx="2.5" fill="var(--info)"   />
      <rect x="65" y="47" width="70" height="3" rx="1.5" fill="rgba(59,130,246,0.3)" />
      {[22, 76, 130].map((x, i) => (
        <g key={i}>
          <rect x={x} y="65" width="48" height="38" rx="4"
            fill="var(--bg-card)" stroke="var(--border)" strokeWidth="0.5" />
          <rect x={x+6} y="72" width="36" height="14" rx="3"
            fill={['var(--primary-50)', 'var(--success-light)', 'var(--warning-light)'][i]} />
          <rect x={x+6} y="90" width="30" height="3" rx="1.5" fill="var(--border)" />
        </g>
      ))}
    </svg>
  )
}

function ReportsIllustration() {
  const barHeights = [40, 65, 45, 80, 55, 72, 90, 60, 75, 85]
  return (
    <svg viewBox="0 0 200 120" fill="none" className="w-full h-auto">
      <rect x="20" y="10" width="160" height="100" rx="12"
        fill="rgba(139,92,246,0.06)" stroke="rgba(139,92,246,0.2)" strokeWidth="1" />
      <rect x="30" y="25" width="140" height="60" rx="6" fill="rgba(139,92,246,0.06)" />
      {[0,1,2,3].map(i => (
        <line key={i} x1="30" y1={35+i*13} x2="170" y2={35+i*13}
          stroke="var(--border)" strokeWidth="0.5" />
      ))}
      {barHeights.map((h, i) => (
        <rect key={i}
          x={38 + i * 13} y={85 - h * 0.55} width="8" height={h * 0.55} rx="2"
          fill={`rgba(99,102,241,${0.3 + h / 200})`} />
      ))}
      <rect x="35" y="92" width="6" height="6" rx="1.5" fill="var(--primary-500)" />
      <rect x="45" y="93" width="30" height="3" rx="1.5" fill="var(--border)" />
      <rect x="85" y="92" width="6" height="6" rx="1.5" fill="var(--success)"  />
      <rect x="95" y="93" width="30" height="3" rx="1.5" fill="var(--border)" />
      <rect x="135" y="92" width="30" height="10" rx="5" fill="var(--primary-50)" />
      <text x="150" y="99" textAnchor="middle"
        fill="var(--primary-600)" fontSize="5" fontWeight="600">PDF ↓</text>
    </svg>
  )
}

function SecurityIllustration() {
  return (
    <svg viewBox="0 0 200 120" fill="none" className="w-full h-auto">
      <path d="M100 15l55 20v35c0 25-22 40-55 45-33-5-55-20-55-45V35l55-20z"
        fill="var(--bg-muted)" stroke="var(--border)" strokeWidth="1" />
      <path d="M100 28l38 14v24c0 17-15 28-38 32-23-4-38-15-38-32V42l38-14z"
        fill="var(--border)" />
      <rect x="90" y="52" width="20" height="16" rx="3" fill="var(--text-muted)"   />
      <path d="M95 52v-6a5 5 0 0 1 10 0v6"
        stroke="var(--text-secondary)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="100" cy="60" r="2" fill="var(--text-secondary)" />
      <line x1="100" y1="61" x2="100" y2="64"
        stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Role pills */}
      {[
        { x: 20,  label: 'Admin',   color: 'var(--primary-500)', bg: 'var(--primary-50)'   },
        { x: 64,  label: 'Teacher', color: 'var(--success)',      bg: 'var(--success-light)' },
        { x: 112, label: 'Student', color: 'var(--role-student)', bg: 'rgba(139,92,246,0.1)' },
        { x: 160, label: 'Parent',  color: 'var(--role-parent)',  bg: 'var(--warning-light)' },
      ].map((role, i) => (
        <g key={i}>
          <rect x={role.x} y="85" width="36" height="14" rx="7"
            fill={role.bg} />
          <text x={role.x + 18} y="94" textAnchor="middle"
            fill={role.color} fontSize="6" fontWeight="600">
            {role.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────
   CREDIT INFO BANNER
   ───────────────────────────────────────────────────────────── */

function CreditInfoBanner() {
  const plans = Object.values(PLANS)

  const creditTypes = [
    { icon: '📱', action: '1 SMS',       credits: '1 credit', cost: '≈ ₹1'         },
    { icon: '💬', action: '1 WhatsApp',  credits: '1 credit', cost: '≈ ₹1'         },
    { icon: '📧', action: '10 Emails',   credits: '1 credit', cost: '≈ ₹0.10/email' },
  ]

  return (
    <div
      className="mt-10 rounded-[var(--radius-xl)] overflow-hidden"
      style={{
        border:     '1px solid var(--primary-200)',
        background: 'var(--bg-card)',
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center gap-3"
        style={{
          background:   'linear-gradient(135deg, var(--primary-50), rgba(139,92,246,0.06))',
          borderBottom: '1px solid var(--primary-200)',
        }}
      >
        <div
          className="w-9 h-9 rounded-[var(--radius-md)] flex items-center
                     justify-center text-lg flex-shrink-0"
          style={{
            background: 'var(--primary-100)',
            border:     '1px solid var(--primary-200)',
          }}
        >
          💳
        </div>
        <div>
          <p
            className="text-sm font-bold font-display"
            style={{ color: 'var(--text-primary)' }}
          >
            Pay-as-you-go Credit System
          </p>
          <p
            className="text-xs font-body mt-0.5"
            style={{ color: 'var(--text-muted)' }}
          >
            Use only what you need · Credits rollover based on your plan
          </p>
        </div>
      </div>

      {/* Credit rates */}
      <div
        className="px-5 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="grid grid-cols-3 gap-3">
          {creditTypes.map(item => (
            <div
              key={item.action}
              className="text-center p-3.5 rounded-[var(--radius-md)]"
              style={{
                background: 'var(--bg-subtle)',
                border:     '1px solid var(--border)',
              }}
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <div
                className="text-xs font-semibold font-display"
                style={{ color: 'var(--text-primary)' }}
              >
                {item.action}
              </div>
              <div
                className="text-xs font-bold font-display mt-1"
                style={{ color: 'var(--primary-600)' }}
              >
                = {item.credits}
              </div>
              <div
                className="text-[10px] font-body mt-0.5"
                style={{ color: 'var(--text-muted)' }}
              >
                {item.cost}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-plan credits */}
      <div className="px-5 py-4">
        <p
          className="text-[11px] font-bold uppercase tracking-widest
                     font-display mb-3"
          style={{ color: 'var(--text-muted)' }}
        >
          Free credits included per plan
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {plans.map(plan => {
            const maxCarry =
              plan.creditRolloverMonths === -1
                ? null
                : plan.creditRolloverMonths === 0
                  ? 0
                  : plan.creditRolloverMonths * plan.freeCreditsPerMonth

            const rolloverText =
              plan.creditRolloverMonths === -1
                ? { label: '✨ Never expire',      color: 'var(--success)'      }
                : plan.creditRolloverMonths === 0
                  ? { label: '🔄 Monthly reset',   color: 'var(--text-muted)'   }
                  : { label: `♻️ ${plan.creditRolloverMonths}mo rollover`, color: 'var(--primary-600)' }

            return (
              <div
                key={plan.id}
                className="rounded-[var(--radius-md)] p-3 text-center"
                style={{
                  background: `${plan.color}08`,
                  border:     `1px solid ${plan.color}25`,
                }}
              >
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: plan.color }}
                  />
                  <span
                    className="text-[11px] font-bold font-display"
                    style={{ color: plan.color }}
                  >
                    {plan.name}
                  </span>
                </div>
                <p
                  className="text-lg font-extrabold font-display"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {plan.freeCreditsPerMonth.toLocaleString('en-IN')}
                </p>
                <p
                  className="text-[10px] font-body"
                  style={{ color: 'var(--text-muted)' }}
                >
                  credits/mo
                </p>
                <div
                  className="mt-2 pt-2 text-[10px] font-semibold font-display"
                  style={{
                    borderTop: '1px solid var(--border)',
                    color:     rolloverText.color,
                  }}
                >
                  {rolloverText.label}
                </div>
                {maxCarry !== null && maxCarry > 0 && (
                  <p
                    className="text-[9px] font-body mt-0.5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    max {maxCarry.toLocaleString('en-IN')} carry
                  </p>
                )}
              </div>
            )
          })}
        </div>

        <p
          className="text-[11px] font-body mt-4 text-center"
          style={{ color: 'var(--text-muted)' }}
        >
          Extra credits khatam ho to credit packs kharido —{' '}
          <span style={{ color: 'var(--primary-600)', fontWeight: 600 }}>
            ₹199 se shuru
          </span>{' '}
          · Koi subscription nahi
        </p>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   ADDON LIMITS BANNER
   ───────────────────────────────────────────────────────────── */

function AddonLimitsBanner() {
  const plans = Object.values(PLANS)

  return (
    <div
      className="mt-4 rounded-[var(--radius-xl)] px-5 py-5"
      style={{
        background: 'linear-gradient(135deg, var(--info-light), var(--bg-subtle))',
        border:     '1px solid rgba(59,130,246,0.2)',
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0 mt-0.5">👥</span>
        <div className="flex-1">
          <p
            className="text-sm font-bold font-display mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            Student &amp; Teacher Add-on Limits
          </p>
          <p
            className="text-xs font-body mb-4 leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            Plan limit ke upar extra students/teachers kharid sakte ho — plan cap tak.
            Cap full hone par plan upgrade karo.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {plans.map(plan => {
              const maxStudents =
                plan.maxStudents === -1
                  ? 'Unlimited'
                  : `${plan.maxStudents} + ${plan.maxAddonStudents === -1 ? '∞' : plan.maxAddonStudents}`

              const totalMax =
                plan.maxStudents === -1
                  ? 'Unlimited'
                  : plan.maxAddonStudents === -1
                    ? `${plan.maxStudents}+`
                    : (plan.maxStudents + plan.maxAddonStudents).toLocaleString('en-IN')

              return (
                <div
                  key={plan.id}
                  className="rounded-[var(--radius-md)] p-3 text-center"
                  style={{
                    background: 'var(--bg-card)',
                    border:     `1px solid ${plan.color}20`,
                  }}
                >
                  <div
                    className="text-[10px] font-bold font-display mb-1.5"
                    style={{ color: plan.color }}
                  >
                    {plan.name}
                  </div>
                  <div
                    className="text-[11px] font-medium font-body"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {maxStudents}
                  </div>
                  <div
                    className="text-[9px] font-body"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    base + add-on
                  </div>
                  <div
                    className="text-xs font-bold font-display mt-1.5"
                    style={{ color: 'var(--success)' }}
                  >
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

/* ─────────────────────────────────────────────────────────────
   FEATURES DATA
   ───────────────────────────────────────────────────────────── */

const features = [
  {
    illustration: <StudentIllustration />,
    title:  'Student & Staff Management',
    desc:   'Complete admission workflow, student profiles, ID card generation, bulk import via Excel & staff records. Plan-based limits with add-on flexibility.',
    points: ['Bulk import/export', 'ID cards PDF', 'Parent linking', 'Add-on slots available'],
    accent: 'var(--primary-500)',
    gradientFrom: 'rgba(99,102,241,0.8)',
    gradientTo:   'rgba(79,70,229,1)',
    bg:     'var(--primary-50)',
    border: 'rgba(99,102,241,0.15)',
    badge:  { text: '👤 Add-on available', bg: 'var(--primary-50)', color: 'var(--primary-600)' },
  },
  {
    illustration: <AttendanceIllustration />,
    title:  'Attendance Tracking',
    desc:   'Daily class-wise attendance with auto absent SMS to parents using credits. Visual reports & monthly analytics.',
    points: ['Auto SMS (1 credit/SMS)', 'Monthly reports', 'Class-wise view', 'Holiday calendar'],
    accent: 'var(--success)',
    gradientFrom: 'rgba(16,185,129,0.8)',
    gradientTo:   'rgba(5,150,105,1)',
    bg:     'var(--success-light)',
    border: 'rgba(16,185,129,0.2)',
    badge:  { text: '💳 Uses credits', bg: 'var(--success-light)', color: 'var(--success-dark)' },
  },
  {
    illustration: <FeesIllustration />,
    title:  'Online Fee Collection',
    desc:   'Collect fees via Razorpay. Auto late-fine, SMS reminders (credit-based), PDF receipts & detailed fee reports.',
    points: ['Razorpay payments', 'SMS reminders (credits)', 'Late fine rules', 'PDF receipts'],
    accent: 'var(--warning)',
    gradientFrom: 'rgba(245,158,11,0.8)',
    gradientTo:   'rgba(217,119,6,1)',
    bg:     'var(--warning-light)',
    border: 'rgba(245,158,11,0.2)',
    badge:  { text: '💳 SMS uses credits', bg: 'var(--warning-light)', color: 'var(--warning-dark)' },
  },
  {
    illustration: <ExamsIllustration />,
    title:  'Exams & Results',
    desc:   'Schedule exams, teacher marks entry, auto grade calculation, report cards & result SMS to parents.',
    points: ['Grade cards PDF', 'Result SMS (credits)', 'Subject analytics', 'Rank generation'],
    accent: 'var(--danger)',
    gradientFrom: 'rgba(239,68,68,0.8)',
    gradientTo:   'rgba(220,38,38,1)',
    bg:     'var(--danger-light)',
    border: 'rgba(239,68,68,0.15)',
    badge:  null,
  },
  {
    illustration: <NoticesIllustration />,
    title:  'Notices & Communication',
    desc:   'Publish circulars, send SMS blasts (1 credit/SMS), WhatsApp messages (1 credit/WA). Free credits included in every plan — extra packs available.',
    points: ['1 SMS = 1 Credit', '1 WhatsApp = 1 Credit', 'Class-wise targeting', 'Credits rollover (paid)'],
    accent: 'var(--info)',
    gradientFrom: 'rgba(59,130,246,0.8)',
    gradientTo:   'rgba(37,99,235,1)',
    bg:     'var(--info-light)',
    border: 'rgba(59,130,246,0.2)',
    badge:  { text: '💳 Credit-based messaging', bg: 'var(--primary-50)', color: 'var(--primary-600)' },
  },
  {
    illustration: <WebsiteIllustration />,
    title:  'School Website Builder',
    desc:   'Professional templates, drag-to-reorder sections, photo gallery, events, contact forms — no coding needed.',
    points: ['3 templates', 'Gallery & events', 'SEO optimized', 'Mobile responsive'],
    accent: 'var(--success)',
    gradientFrom: 'rgba(34,197,94,0.8)',
    gradientTo:   'rgba(16,185,129,1)',
    bg:     'var(--success-light)',
    border: 'rgba(34,197,94,0.2)',
    badge:  null,
  },
  {
    illustration: <ReportsIllustration />,
    title:  'Reports & Analytics',
    desc:   'Class-wise analytics, attendance trends, fee collection reports, credit usage stats. Export everything to PDF & Excel.',
    points: ['PDF & Excel export', 'Credit usage report', 'Trend analysis', 'Custom filters'],
    accent: 'var(--role-student)',
    gradientFrom: 'rgba(139,92,246,0.8)',
    gradientTo:   'rgba(109,40,217,1)',
    bg:     'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.2)',
    badge:  null,
  },
  {
    illustration: <SecurityIllustration />,
    title:  'Security & Access Control',
    desc:   'Role-based access (Admin, Teacher, Student, Parent). Plan-based module locks, addon limits & tenant data isolation.',
    points: ['4 user roles', 'Plan + addon limits', 'Data encryption', 'Tenant isolation'],
    accent: 'var(--text-secondary)',
    gradientFrom: 'rgba(76,73,128,0.8)',
    gradientTo:   'rgba(30,27,75,1)',
    bg:     'var(--bg-muted)',
    border: 'var(--border)',
    badge:  { text: '🔒 Plan-enforced limits', bg: 'var(--bg-muted)', color: 'var(--text-secondary)' },
  },
]

/* ─────────────────────────────────────────────────────────────
   FEATURE GRID COMPONENT
   ───────────────────────────────────────────────────────────── */

export function FeatureGrid() {
  const gridRef = useRevealGroup()

  return (
    <section
      id="features"
      className="section-padding relative"
      style={{ background: 'var(--bg-muted)' }}
    >
      {/* Background decoration */}
      <div aria-hidden="true">
        <div style={{
          position:     'absolute',
          top:          '50%',
          left:         '50%',
          transform:    'translate(-50%,-50%)',
          width:        '60%',
          height:       '50%',
          background:   'radial-gradient(ellipse, rgba(99,102,241,0.04) 0%, transparent 70%)',
          pointerEvents:'none',
        }} />
      </div>

      <Container>
        <SectionTitle
          eyebrow="✨ Core Features"
          title="Everything your school needs, in one connected system"
          subtitle="No more juggling multiple apps. One login, one subscription — a clean experience for admin, teachers, parents & students."
          center
        />

        {/* Feature Cards */}
        <div
          ref={gridRef}
          className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-5 reveal-stagger"
        >
          {features.map(feature => (
            <div
              key={feature.title}
              className="reveal group rounded-[var(--radius-xl)] overflow-hidden
                         transition-all duration-300"
              style={{
                background: 'var(--bg-card)',
                border:     `1px solid ${feature.border}`,
                boxShadow:  'var(--shadow-sm)',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.boxShadow   = 'var(--shadow-lg)'
                el.style.transform   = 'translateY(-3px)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.boxShadow   = 'var(--shadow-sm)'
                el.style.transform   = 'translateY(0)'
              }}
            >
              <div className="flex flex-col sm:flex-row">

                {/* Illustration panel */}
                <div
                  className="sm:w-[44%] p-5 flex items-center
                             justify-center flex-shrink-0"
                  style={{ background: feature.bg }}
                >
                  <div className="w-full max-w-[200px]">
                    {feature.illustration}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-5">
                  {/* Accent bar */}
                  <div
                    className="w-10 h-[3px] rounded-full mb-3"
                    style={{
                      background: `linear-gradient(90deg, ${feature.gradientFrom}, ${feature.gradientTo})`,
                    }}
                  />

                  {/* Title + badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3
                      className="text-[15px] font-bold font-display leading-tight"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {feature.title}
                    </h3>
                    {feature.badge && (
                      <span
                        className="text-[10px] font-semibold font-display px-2 py-0.5
                                   rounded-full flex-shrink-0 whitespace-nowrap"
                        style={{
                          background: feature.badge.bg,
                          color:      feature.badge.color,
                          border:     `1px solid ${feature.badge.color}30`,
                        }}
                      >
                        {feature.badge.text}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p
                    className="text-[13px] leading-relaxed font-body mb-3"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {feature.desc}
                  </p>

                  {/* Points */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                    {feature.points.map(point => (
                      <span
                        key={point}
                        className="flex items-center gap-1.5 text-[12px] font-body"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: feature.accent }}
                        />
                        {point}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom progress bar — grows on hover */}
              <div
                className="h-[2.5px]"
                style={{ background: 'var(--border)' }}
              >
                <div
                  className="h-full w-0 group-hover:w-full transition-all duration-700 ease-out"
                  style={{
                    background: `linear-gradient(90deg, ${feature.gradientFrom}, ${feature.gradientTo})`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Credit Banner */}
        <CreditInfoBanner />

        {/* Addon Banner */}
        <AddonLimitsBanner />
      </Container>
    </section>
  )
}