// FILE: src/app/(dashboard)/admin/DashboardClient.tsx
'use client'

import Link from 'next/link'
import { PLANS } from '@/config/pricing'
import type { PlanId } from '@/config/pricing'
import {
  Users, UserCheck, CheckSquare, CreditCard,
  Bell, TrendingUp, Plus, Calendar,
  ArrowRight, Clock, AlertTriangle, Zap,
  BarChart2, BookOpen, ArrowUpRight, Activity,
  Wallet, GraduationCap, MessageSquare,
} from 'lucide-react'
import {
  t, tv, grad, cardGrad, iconGrad, solidIconGrad,
  glow, hoverShadow, statMeta, classBarGrad,
  barColor, headerGradient, headerGlowOrb,
  FEE_COLORS, subCardStyle, creditWidgetStyle,
  quickActionStyle,
} from '@/lib/theme'

/* ═══════════════════════════════════════════════════════════
   TYPES — unchanged
   ═══════════════════════════════════════════════════════════ */
interface DashboardData {
  stats: {
    totalStudents: number
    totalTeachers: number
    todayPresent: number
    todayAbsent: number
    attendancePct: number
    pendingFees: number
    feeThisMonth: number
    feeTotal: number
    activeNotices: number
  }
  recentStudents: any[]
  recentFees: any[]
  recentNotices: any[]
  attendanceChart: Array<{ date: string; present: number; absent: number; total: number }>
  classWise: Array<{ _id: string; count: number }>
  subscription: {
    plan: string
    isPaid: boolean
    isInTrial: boolean
    isExpired: boolean
    daysLeft: number | null
    validTill: string
    isScheduledCancel?: boolean
  }
  credits: {
    balance: number
    totalUsed: number
    totalEarned: number
    freePerMonth: number
    lowWarning: boolean
    last30Days: Array<{ _id: string; count: number; credits: number }>
  }
  limits: {
    students: { used: number; limit: number; planLimit: number; addon: number }
    teachers: { used: number; limit: number; planLimit: number; addon: number }
  }
  schoolName: string
  schoolCreatedAt: string
}

/* ═══════════════════════════════════════════════════════════
   KEYFRAMES — CSS variables use karte hain, hardcoded nahi
   ═══════════════════════════════════════════════════════════ */
const KEYFRAMES = `
  @keyframes dash-grow {
    from { stroke-dashoffset: 999; }
    to   { stroke-dashoffset: var(--dash-offset); }
  }
  @keyframes bar-rise {
    from { height: 0%; opacity: 0; }
    to   { height: var(--bar-h); opacity: 1; }
  }
  @keyframes card-in {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer-move {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes pulse-ring {
    0%, 100% { transform: scale(1);    opacity: 0.7; }
    50%       { transform: scale(1.12); opacity: 1;   }
  }
  @keyframes float-y {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-4px); }
  }
  @keyframes count-in {
    from { opacity: 0; transform: scale(0.85); }
    to   { opacity: 1; transform: scale(1); }
  }
`

/* ═══════════════════════════════════════════════════════════
   ATTENDANCE BAR CHART
   ═══════════════════════════════════════════════════════════ */
function AttendanceBarChart({
  data,
}: {
  data: Array<{ date: string; present: number; total: number }>
}) {
  const maxVal = Math.max(...data.map(d => d.total), 1)

  return (
    <div className="flex items-end gap-2 h-32 px-1">
      {data.map((d, i) => {
        const pct = d.total > 0 ? (d.present / d.total) * 100 : 0
        const trackH = d.total > 0 ? Math.max((d.total / maxVal) * 100, 10) : 6
        const label = new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' })
        const bc = barColor(pct)

        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1.5"
            style={{ animation: `card-in 0.4s ease both`, animationDelay: `${i * 60}ms` }}
          >
            <span
              className="text-[0.6rem] font-bold tabular-nums"
              style={{ color: tv('text-muted'), minHeight: '14px' }}
            >
              {d.total > 0 ? `${Math.round(pct)}%` : '—'}
            </span>

            <div
              className="w-full relative rounded-lg overflow-hidden"
              style={{
                height: `${trackH}%`,
                minHeight: '8px',
                backgroundColor: glow('primary', 0.07),
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  bottom: 0, left: 0, right: 0,
                  height: `${pct}%`,
                  background: bc.gradient,
                  borderRadius: '6px',
                  boxShadow: d.total > 0 ? `0 -3px 10px ${bc.glow}` : 'none',
                  animation: `bar-rise 0.7s cubic-bezier(0.34,1.56,0.64,1) both`,
                  animationDelay: `${200 + i * 80}ms`,
                } as React.CSSProperties}
              />
            </div>

            <span
              className="text-[0.6rem] font-bold uppercase tracking-wider"
              style={{ color: tv('text-muted') }}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   DONUT CHART — CSS variables use karta hai
   ═══════════════════════════════════════════════════════════ */
function DonutChart({
  value, total,
}: {
  value: number
  total: number
}) {
  const pct = total > 0 ? (value / total) * 100 : 0
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (pct / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <svg
        width="108" height="108" viewBox="0 0 108 108"
        style={{ animation: 'card-in 0.6s ease both', animationDelay: '100ms' }}
      >
        <defs>
          <filter id="glow-ring">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* BG track */}
        <circle cx="54" cy="54" r={radius}
          fill="none"
          stroke={glow('success', 0.15)}
          strokeWidth="10"
        />

        {/* Progress arc — success color */}
        <circle
          cx="54" cy="54" r={radius}
          fill="none"
          stroke={t('success', 500)}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 54 54)"
          filter="url(#glow-ring)"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}
        />

        <text x="54" y="50" textAnchor="middle"
          fontSize="20" fontWeight="800"
          fill="var(--text-primary)"
          fontFamily="var(--font-display)"
          style={{ animation: 'count-in 0.5s ease both', animationDelay: '600ms' }}
        >
          {Math.round(pct)}%
        </text>
        <text x="54" y="65" textAnchor="middle"
          fontSize="9" fontWeight="600"
          fill="var(--text-muted)"
          fontFamily="var(--font-body)"
        >
          Present
        </text>
      </svg>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   STAT CARD — theme.ts se sabhi colors
   Fixed height — no layout shift
   ═══════════════════════════════════════════════════════════ */
import type { ThemeColor } from '@/lib/theme'

function StatCard({
  label, value, icon, color, subtext, href, delay = 0,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  color: ThemeColor
  subtext?: string
  href?: string
  delay?: number
}) {
  const c = statMeta(color)

  const inner = (
    <div
      className="relative overflow-hidden group"
      style={{
        height: '148px',
        borderRadius: 'var(--radius-lg)',
        background: c.cardGradient,
        border: `1px solid ${t(color, 100)}`,
        padding: '1.125rem',
        animation: `card-in 0.45s cubic-bezier(0.34,1.56,0.64,1) both`,
        animationDelay: `${delay}ms`,
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        cursor: href ? 'pointer' : 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.boxShadow = c.hoverShadow
        e.currentTarget.style.borderColor = c.hoverBorder
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
        e.currentTarget.style.borderColor = t(color, 100)
      }}
    >
      {/* Shimmer sweep on hover */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100"
        style={{
          background: `linear-gradient(105deg, transparent 40%, ${c.shimmerColor} 50%, transparent 60%)`,
          backgroundSize: '200% 100%',
          animation: 'shimmer-move 1.2s ease infinite',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Top animated accent bar */}
      <div
        className="absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100"
        style={{
          height: '3px',
          background: c.accentLine,
          backgroundSize: '200% 100%',
          animation: 'shimmer-move 2s linear infinite',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Arrow — absolute, no layout shift */}
      {href && (
        <div
          className="absolute top-3 right-3 w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100"
          style={{
            background: 'rgba(255,255,255,0.7)',
            transition: 'opacity 0.2s ease',
          }}
        >
          <ArrowUpRight size={12} style={{ color: c.iconColor }} />
        </div>
      )}

      {/* Content layout */}
      <div className="relative h-full flex flex-col justify-between">

        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: c.iconGradient,
            boxShadow: `0 4px 12px ${c.glowColor}`,
          }}
        >
          <span style={{ color: c.iconColor }}>{icon}</span>
        </div>

        {/* Value + label + subtext */}
        <div>
          <p
            className="tabular-nums leading-none mb-1"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.875rem',
              fontWeight: 800,
              color: c.valueColor,
              letterSpacing: '-0.035em',
              animation: `count-in 0.5s ease both`,
              animationDelay: `${delay + 150}ms`,
            }}
          >
            {value}
          </p>
          <p
            className="text-[0.8125rem] font-semibold leading-tight"
            style={{ color: c.iconColor, opacity: 0.85 }}
          >
            {label}
          </p>
          {/* Reserved height — cards same size */}
          <p
            className="text-[0.6875rem] mt-1.5 flex items-center gap-1 font-medium"
            style={{ color: c.iconColor, opacity: 0.6, minHeight: '16px' }}
          >
            {subtext ? <><Activity size={9} />{subtext}</> : null}
          </p>
        </div>
      </div>
    </div>
  )

  return href ? <Link href={href} className="block">{inner}</Link> : inner
}

/* ═══════════════════════════════════════════════════════════
   SECTION HEADER
   ═══════════════════════════════════════════════════════════ */
function SectionHeader({
  title, subtitle, href, linkText,
}: {
  title: string; subtitle?: string; href?: string; linkText?: string
}) {
  return (
    <div className="flex items-center justify-between w-full gap-2">
      <div className="min-w-0">
        <h3 className="portal-card-title">{title}</h3>
        {subtitle && <p className="portal-card-subtitle">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs font-bold flex-shrink-0 px-2.5 py-1 rounded-lg transition-colors"
          style={{ color: t('primary', 600), backgroundColor: t('primary', 50) }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = t('primary', 100) }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = t('primary', 50) }}
        >
          {linkText || 'View all'} <ArrowRight size={11} />
        </Link>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   LIST ITEM
   ═══════════════════════════════════════════════════════════ */
function ListItem({
  avatar, avatarBg, avatarColor,
  title, subtitle, right, rightSub,
}: {
  avatar: string | React.ReactNode
  avatarBg: string; avatarColor: string
  title: string; subtitle: string
  right?: string | React.ReactNode; rightSub?: string
}) {
  return (
    <div
      className="flex items-center gap-3 py-2 px-2 rounded-xl -mx-2 transition-colors duration-150"
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = glow('primary', 0.05) }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
        style={{ background: avatarBg, color: avatarColor }}
      >
        {avatar}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate" style={{ color: tv('text-primary') }}>{title}</p>
        <p className="text-[0.6875rem] mt-0.5 truncate font-medium" style={{ color: tv('text-muted') }}>{subtitle}</p>
      </div>
      {right && (
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold" style={{ color: tv('text-secondary') }}>{right}</p>
          {rightSub && (
            <p className="text-[0.6rem] mt-0.5 font-medium" style={{ color: tv('text-muted') }}>{rightSub}</p>
          )}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   CREDIT WIDGET — creditWidgetStyle() use karta hai
   ═══════════════════════════════════════════════════════════ */
function CreditMiniWidget({ credits }: { credits: DashboardData['credits'] }) {
  const pct = credits.totalEarned > 0
    ? Math.min(100, Math.round((credits.totalUsed / credits.totalEarned) * 100))
    : 0
  const isLow = credits.lowWarning
  const s = creditWidgetStyle(isLow)
  const channelMap = credits.last30Days.reduce((acc: any, c) => { acc[c._id] = c; return acc }, {})

  return (
    <div
      className="rounded-xl overflow-hidden relative"
      style={{ background: s.bg, border: `1px solid ${s.border}` }}
    >
      {/* Shimmer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.45) 50%,transparent 60%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer-move 3s ease infinite',
        }}
      />

      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: s.iconBg,
                boxShadow: s.iconShadow,
                animation: 'float-y 3s ease-in-out infinite',
              }}
            >
              <MessageSquare size={15} color="#fff" />
            </div>
            <div>
              <p
                className="text-sm font-bold"
                style={{ color: s.titleColor, fontFamily: 'var(--font-display)' }}
              >
                Message Credits
              </p>
              {isLow && (
                <p className="text-[0.6rem] font-bold" style={{ color: s.warnColor }}>
                  ⚠️ Balance low!
                </p>
              )}
            </div>
          </div>
          <Link
            href="/admin/subscription"
            className="text-xs font-bold px-3 py-1.5 rounded-lg"
            style={{ background: s.btnBg, color: '#fff', boxShadow: s.iconShadow }}
          >
            Buy →
          </Link>
        </div>

        {/* Balance */}
        <div className="flex items-baseline gap-1.5 mb-2.5">
          <span
            className="tabular-nums"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2rem',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              color: s.numColor,
              animation: 'count-in 0.5s ease both',
            }}
          >
            {credits.balance.toLocaleString('en-IN')}
          </span>
          <span className="text-xs font-semibold" style={{ color: tv('text-muted') }}>
            credits left
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: 'rgba(0,0,0,0.08)' }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.max(3, 100 - pct)}%`,
                borderRadius: '999px',
                background: s.barGrad,
                boxShadow: s.barGlow,
                transition: 'width 1s ease',
              }}
            />
          </div>
        </div>

        {/* Pill guide */}
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {['📱 1cr=SMS', '💬 1cr=WA', '📧 1cr=10 Email'].map(item => (
            <span
              key={item}
              className="text-[0.6rem] font-bold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: 'rgba(255,255,255,0.7)',
                color: tv('text-secondary'),
                border: '1px solid rgba(0,0,0,0.07)',
              }}
            >
              {item}
            </span>
          ))}
        </div>

        {/* Last 30 days */}
        {credits.last30Days.length > 0 && (
          <div className="flex gap-4 pt-2.5" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
            {(['sms', 'whatsapp', 'email'] as const).map(ch => {
              const u = channelMap[ch]
              if (!u) return null
              const icons = { sms: '📱', whatsapp: '💬', email: '📧' }
              return (
                <div key={ch} className="text-center">
                  <div className="text-[0.6rem] font-bold" style={{ color: tv('text-secondary') }}>
                    {icons[ch]} {u.count}
                  </div>
                  <div className="text-[0.6rem]" style={{ color: tv('text-muted') }}>
                    {u.credits}cr used
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {credits.freePerMonth > 0 && (
          <p className="text-[0.6rem] font-semibold mt-2" style={{ color: tv('text-muted') }}>
            🎁 {credits.freePerMonth.toLocaleString('en-IN')} free/month included
          </p>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   MINI LIMIT BAR
   ═══════════════════════════════════════════════════════════ */
function MiniLimitBar({ label, used, limit, addon, color }: {
  label: string; used: number; limit: number; addon: number; color: ThemeColor
}) {
  if (limit === -1) {
    return (
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold" style={{ color: tv('text-muted') }}>{label}</span>
        <span
          className="text-[0.6875rem] font-bold px-2 py-0.5 rounded-full"
          style={{ color: t('success', 700), backgroundColor: t('success', 100) }}
        >
          {used.toLocaleString('en-IN')} / ∞
        </span>
      </div>
    )
  }
  const pct = Math.min(100, Math.round((used / limit) * 100))
  const isHigh = pct >= 90
  const isMid = pct >= 70

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold" style={{ color: tv('text-secondary') }}>
          {label}
          {addon > 0 && (
            <span
              className="ml-1.5 text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full"
              style={{ color: t('primary', 600), backgroundColor: t('primary', 50) }}
            >
              +{addon}
            </span>
          )}
        </span>
        <span
          className="text-xs font-bold tabular-nums"
          style={{
            color: isHigh ? t('danger', 600) : isMid ? t('warning', 600) : tv('text-primary'),
          }}
        >
          {used}/{limit}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: '999px',
            background: isHigh
              ? grad('danger', 90, [400, 600])
              : isMid
                ? grad('warning', 90, [400, 600])
                : grad(color, 90, [400, 600]),
            boxShadow: isHigh
              ? `0 0 6px ${glow('danger', 0.4)}`
              : isMid
                ? `0 0 6px ${glow('warning', 0.35)}`
                : 'none',
            transition: 'width 1s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        />
      </div>
      {isHigh && (
        <p className="text-[0.625rem] mt-1 font-semibold" style={{ color: t('danger', 600) }}>
          {limit - used <= 0 ? 'Limit full! ' : `Only ${limit - used} left! `}
          <Link href="/admin/subscription" className="underline">Buy add-on →</Link>
        </p>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SHIMMER CARD WRAPPER — reusable for fee/sub cards
   ═══════════════════════════════════════════════════════════ */
function ShimmerCard({
  bg, border: borderColor, children, className = '', style = {},
}: {
  bg: string; border: string; children: React.ReactNode
  className?: string; style?: React.CSSProperties
}) {
  return (
    <div
      className={`rounded-xl overflow-hidden relative ${className}`}
      style={{ background: bg, border: `1px solid ${borderColor}`, ...style }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.38) 50%,transparent 60%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer-move 3s ease infinite',
        }}
      />
      <div className="relative">{children}</div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   MAIN DASHBOARD CLIENT
   ═══════════════════════════════════════════════════════════ */
export function AdminDashboardClient({ data, userName }: {
  data: DashboardData; userName: string
}) {
  const {
    stats, recentStudents, recentFees, recentNotices,
    attendanceChart, classWise, subscription, credits, limits,
  } = data

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const greeting = (() => {
    const h = new Date().getHours()
    return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening'
  })()
  const planConfig = PLANS[subscription.plan as PlanId]
  const subState = subscription.isExpired ? 'expired' : subscription.isInTrial ? 'trial' : 'paid'
  const subStyle = subCardStyle(subState)
  const feeC = FEE_COLORS

  /* Quick action definitions — color from ThemeColor */
  const quickActions = [
    { label: 'Add Student', href: '/admin/students?action=add', icon: Plus, color: 'primary' as ThemeColor },
    { label: 'Post Notice', href: '/admin/notices?action=add', icon: Bell, color: 'info' as ThemeColor },
    { label: 'Schedule Exam', href: '/admin/exams?action=add', icon: BookOpen, color: 'accent' as ThemeColor },
    { label: 'View Reports', href: '/admin/reports', icon: BarChart2, color: 'success' as ThemeColor },
    { label: 'Send Message', href: '/admin/communication', icon: MessageSquare, color: 'violet' as ThemeColor },
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />

      <div className="space-y-5 pb-8 max-w-[1400px] mx-auto portal-content-enter">

        {/* ═══ HEADER — headerGradient() CSS vars use karta hai ═══ */}
        <div
          className="rounded-xl px-5 py-4 relative overflow-hidden"
          style={{
            background: headerGradient(),
            boxShadow: `0 4px 24px ${glow('primary', 0.35)}`,
          }}
        >
          {/* Animated orbs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div style={{
              position: 'absolute', top: '-30%', right: '-5%',
              width: '220px', height: '220px', borderRadius: '50%',
              background: headerGlowOrb(0.15),
              animation: 'float-y 5s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute', bottom: '-40%', left: '20%',
              width: '160px', height: '160px', borderRadius: '50%',
              background: `radial-gradient(circle, ${glow('accent', 0.18)} 0%, transparent 70%)`,
              animation: 'float-y 4s ease-in-out infinite',
              animationDelay: '1s',
            }} />
            {/* Shimmer sweep */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.08) 50%,transparent 65%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer-move 4s ease infinite',
            }} />
          </div>

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="text-[0.6875rem] font-semibold"
                  style={{ color: 'rgba(255,255,255,0.65)' }}
                >
                  Dashboard
                </span>
              </div>
              <h1
                className="flex items-center gap-2 flex-wrap"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.25rem,2.5vw,1.5rem)',
                  fontWeight: 800,
                  color: '#fff',
                  letterSpacing: '-0.025em',
                }}
              >
                {greeting},{' '}
                <span style={{
                  background: `linear-gradient(135deg, ${t('warning', 200)}, ${t('warning', 400)})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  {userName}
                </span>
                {' '}👋
              </h1>
              <p
                className="text-sm mt-0.5 flex items-center gap-1.5 font-medium"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                <Calendar size={13} /> {today}
              </p>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <Link
                href="/admin/students?action=add"
                className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.95)',
                  color: t('primary', 600),
                  boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.15)'
                }}
              >
                <Plus size={15} strokeWidth={2.5} />
                <span className="hidden sm:inline">Add Student</span>
                <span className="sm:hidden">Add</span>
              </Link>
              <Link
                href="/admin/attendance"
                className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}
              >
                <CheckSquare size={15} />
                <span className="hidden sm:inline">Attendance</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ═══ STAT CARDS ═══ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total Students"
            value={stats.totalStudents}
            icon={<Users size={18} />}
            color="primary"
            href="/admin/students"
            delay={0}
            subtext={
              limits.students.limit !== -1
                ? `${limits.students.limit - limits.students.used} seats left`
                : undefined
            }
          />
          <StatCard
            label="Teachers & Staff"
            value={stats.totalTeachers}
            icon={<UserCheck size={18} />}
            color="info"
            href="/admin/teachers"
            delay={80}
          />
          <StatCard
            label="Today's Attendance"
            value={`${stats.attendancePct}%`}
            icon={<CheckSquare size={18} />}
            color="success"
            href="/admin/attendance"
            delay={160}
            subtext={`${stats.todayPresent} present · ${stats.todayAbsent} absent`}
          />
          <StatCard
            label="Pending Fees"
            value={stats.pendingFees}
            icon={<CreditCard size={18} />}
            color={stats.pendingFees > 0 ? 'danger' : 'success'}
            href="/admin/fees"
            delay={240}
            subtext={`₹${stats.feeThisMonth.toLocaleString('en-IN')} this month`}
          />
        </div>

        {/* ═══ CHARTS ROW ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

          {/* Attendance Trend */}
          <div
            className="lg:col-span-2 portal-card"
            style={{ animation: 'card-in 0.4s ease both', animationDelay: '100ms' }}
          >
            <div className="portal-card-header">
              <SectionHeader title="Attendance Trend" subtitle="Last 7 days" href="/admin/attendance" linkText="Details" />
            </div>
            <div className="portal-card-body">
              {attendanceChart.some(d => d.total > 0) ? (
                <AttendanceBarChart data={attendanceChart} />
              ) : (
                <div className="portal-empty">
                  <div
                    className="portal-empty-icon"
                    style={{ background: iconGrad('primary') }}
                  >
                    <BarChart2 size={20} style={{ color: t('primary', 600) }} />
                  </div>
                  <p className="portal-empty-title">No attendance data</p>
                  <p className="portal-empty-text">Start marking attendance to see trends</p>
                </div>
              )}
            </div>
            {/* Legend */}
            <div className="px-5 pb-4 flex items-center gap-5">
              {[
                { grad: grad('success', 90, [400, 600]), label: '≥80% Good' },
                { grad: grad('warning', 90, [400, 600]), label: '60–79% Avg' },
                { grad: grad('danger', 90, [400, 600]), label: '<60% Low' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <span className="w-3 h-2 rounded-full" style={{ background: item.grad }} />
                  <span className="text-[0.625rem] font-bold" style={{ color: tv('text-muted') }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Snapshot */}
          <div
            className="portal-card"
            style={{ animation: 'card-in 0.4s ease both', animationDelay: '180ms' }}
          >
            <div className="portal-card-header">
              <SectionHeader title="Today's Snapshot" />
            </div>
            <div className="portal-card-body flex flex-col items-center justify-center gap-3 pt-2">
              <DonutChart value={stats.todayPresent} total={stats.todayPresent + stats.todayAbsent} />
              <div className="flex gap-2">
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: cardGrad('success'), border: `1px solid ${t('success', 200)}` }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: grad('success', 135) }} />
                  <span className="text-[0.6875rem] font-bold" style={{ color: t('success', 700) }}>
                    {stats.todayPresent} Present
                  </span>
                </div>
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: cardGrad('danger'), border: `1px solid ${t('danger', 200)}` }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: grad('danger', 135) }} />
                  <span className="text-[0.6875rem] font-bold" style={{ color: t('danger', 700) }}>
                    {stats.todayAbsent} Absent
                  </span>
                </div>
              </div>
              <p className="text-[0.6875rem] font-semibold" style={{ color: tv('text-muted') }}>
                {stats.todayPresent + stats.todayAbsent} enrolled today
              </p>
            </div>
          </div>
        </div>

        {/* ═══ CLASS + FEE ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

          {/* Class-wise */}
          <div
            className="portal-card"
            style={{ animation: 'card-in 0.4s ease both', animationDelay: '120ms' }}
          >
            <div className="portal-card-header">
              <SectionHeader title="Class-wise Students" subtitle="Enrollment distribution" />
            </div>
            <div className="portal-card-body">
              {classWise.length === 0 ? (
                <div className="portal-empty">
                  <div className="portal-empty-icon" style={{ background: iconGrad('primary') }}>
                    <GraduationCap size={20} style={{ color: t('primary', 600) }} />
                  </div>
                  <p className="portal-empty-title">No class data</p>
                  <p className="portal-empty-text">Add students to see distribution</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {classWise.map((c, idx) => {
                    const pct = stats.totalStudents > 0
                      ? Math.round((c.count / stats.totalStudents) * 100) : 0
                    return (
                      <div
                        key={c._id}
                        style={{ animation: `card-in 0.4s ease both`, animationDelay: `${idx * 60}ms` }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold" style={{ color: tv('text-secondary') }}>
                            Class {c._id}
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[0.6875rem] font-bold tabular-nums"
                              style={{ color: tv('text-muted') }}
                            >
                              {c.count} students
                            </span>
                            <span
                              className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: t('primary', 50), color: t('primary', 600) }}
                            >
                              {pct}%
                            </span>
                          </div>
                        </div>
                        <div
                          className="h-2.5 rounded-full overflow-hidden"
                          style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${pct}%`,
                              borderRadius: '999px',
                              background: classBarGrad(idx),
                              boxShadow: `0 1px 6px ${glow('primary', 0.15)}`,
                              transition: `width 0.9s cubic-bezier(0.34,1.56,0.64,1) ${idx * 80}ms`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Fee Summary */}
          <div
            className="portal-card"
            style={{ animation: 'card-in 0.4s ease both', animationDelay: '160ms' }}
          >
            <div className="portal-card-header">
              <SectionHeader title="Fee Summary" href="/admin/fees" linkText="Manage" />
            </div>
            <div className="portal-card-body">
              <div className="grid grid-cols-2 gap-3">

                {/* This Month */}
                <ShimmerCard bg={feeC.thisMonth.bg} border={feeC.thisMonth.border}>
                  <div className="p-4 text-center">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2"
                      style={{ background: feeC.thisMonth.icon, boxShadow: feeC.thisMonth.iconShadow }}
                    >
                      <TrendingUp size={15} color="#fff" />
                    </div>
                    <p
                      className="text-lg font-extrabold tabular-nums"
                      style={{ color: feeC.thisMonth.text, fontFamily: 'var(--font-display)', letterSpacing: '-0.025em' }}
                    >
                      ₹{stats.feeThisMonth.toLocaleString('en-IN')}
                    </p>
                    <p
                      className="text-[0.625rem] font-bold uppercase tracking-wider mt-0.5"
                      style={{ color: feeC.thisMonth.label }}
                    >
                      This Month
                    </p>
                  </div>
                </ShimmerCard>

                {/* Total */}
                <ShimmerCard bg={feeC.total.bg} border={feeC.total.border}>
                  <div className="p-4 text-center">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2"
                      style={{ background: feeC.total.icon, boxShadow: feeC.total.iconShadow }}
                    >
                      <Wallet size={15} color="#fff" />
                    </div>
                    <p
                      className="text-lg font-extrabold tabular-nums"
                      style={{ color: feeC.total.text, fontFamily: 'var(--font-display)', letterSpacing: '-0.025em' }}
                    >
                      ₹{stats.feeTotal.toLocaleString('en-IN')}
                    </p>
                    <p
                      className="text-[0.625rem] font-bold uppercase tracking-wider mt-0.5"
                      style={{ color: feeC.total.label }}
                    >
                      Total
                    </p>
                  </div>
                </ShimmerCard>

                {/* Pending */}
                <ShimmerCard bg={feeC.pending.bg} border={feeC.pending.border} className="col-span-2">
                  <div className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: feeC.pending.icon, boxShadow: feeC.pending.iconShadow }}
                      >
                        <AlertTriangle size={16} color="#fff" />
                      </div>
                      <div>
                        <p
                          className="text-xl font-extrabold tabular-nums"
                          style={{ color: feeC.pending.text, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}
                        >
                          {stats.pendingFees}
                        </p>
                        <p className="text-[0.6875rem] font-bold" style={{ color: feeC.pending.label }}>
                          Pending Fee Records
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/admin/fees"
                      className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg"
                      style={{
                        color: feeC.pending.text,
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        border: `1px solid ${feeC.pending.border}`,
                      }}
                    >
                      View <ArrowRight size={11} />
                    </Link>
                  </div>
                </ShimmerCard>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ RECENT + SIDEBAR ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

          {/* Recent Students */}
          <div
            className="portal-card"
            style={{ animation: 'card-in 0.4s ease both', animationDelay: '80ms' }}
          >
            <div className="portal-card-header">
              <SectionHeader title="Recent Admissions" href="/admin/students" />
            </div>
            <div className="portal-card-body pt-2">
              {recentStudents.length === 0 ? (
                <div className="portal-empty">
                  <div className="portal-empty-icon" style={{ background: iconGrad('primary') }}>
                    <Users size={20} style={{ color: t('primary', 600) }} />
                  </div>
                  <p className="portal-empty-title">No students yet</p>
                  <p className="portal-empty-text">Add your first student to get started</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {recentStudents.map((s: any, i: number) => (
                    <div
                      key={s._id}
                      style={{ animation: `card-in 0.35s ease both`, animationDelay: `${i * 50}ms` }}
                    >
                      <ListItem
                        avatar={(s.userId?.name || 'S').charAt(0).toUpperCase()}
                        avatarBg={solidIconGrad('primary')}
                        avatarColor="#fff"
                        title={s.userId?.name || 'Unknown'}
                        subtitle={`Class ${s.class}${s.section ? `-${s.section}` : ''} · ${s.admissionNo}`}
                        right={new Date(s.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Payments */}
          <div
            className="portal-card"
            style={{ animation: 'card-in 0.4s ease both', animationDelay: '120ms' }}
          >
            <div className="portal-card-header">
              <SectionHeader title="Recent Payments" href="/admin/fees" />
            </div>
            <div className="portal-card-body pt-2">
              {recentFees.length === 0 ? (
                <div className="portal-empty">
                  <div className="portal-empty-icon" style={{ background: iconGrad('success') }}>
                    <CreditCard size={20} style={{ color: t('success', 600) }} />
                  </div>
                  <p className="portal-empty-title">No payments yet</p>
                  <p className="portal-empty-text">Fee payments will appear here</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {recentFees.map((f: any, i: number) => (
                    <div
                      key={f._id}
                      style={{ animation: `card-in 0.35s ease both`, animationDelay: `${i * 50}ms` }}
                    >
                      <ListItem
                        avatar={<CreditCard size={13} />}
                        avatarBg={solidIconGrad('success')}
                        avatarColor="#fff"
                        title={f.studentId?.userId?.name || 'Unknown'}
                        subtitle={f.studentId?.admissionNo || ''}
                        right={
                          <span className="font-bold" style={{ color: t('success', 600) }}>
                            ₹{f.amount?.toLocaleString('en-IN')}
                          </span>
                        }
                        rightSub={f.paidAt
                          ? new Date(f.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                          : ''}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-3">
            <CreditMiniWidget credits={credits} />

            {/* Usage Limits */}
            <div className="portal-card">
              <div className="portal-card-body">
                <div className="flex items-center justify-between mb-3">
                  <h3
                    className="text-[0.6875rem] font-bold uppercase tracking-wider"
                    style={{ color: tv('text-muted') }}
                  >
                    Usage Limits
                  </h3>
                  <Link
                    href="/admin/subscription"
                    className="text-[0.625rem] font-bold px-2 py-1 rounded-lg"
                    style={{ color: t('primary', 600), backgroundColor: t('primary', 50) }}
                  >
                    Manage →
                  </Link>
                </div>
                <MiniLimitBar label="Students" used={limits.students.used} limit={limits.students.limit} addon={limits.students.addon} color="primary" />
                <MiniLimitBar label="Teachers & Staff" used={limits.teachers.used} limit={limits.teachers.limit} addon={limits.teachers.addon} color="violet" />
              </div>
            </div>

            {/* Subscription Card */}
            <ShimmerCard bg={subStyle.bg} border={subStyle.border}>
              <div className="p-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: subStyle.iconBg,
                      boxShadow: subStyle.iconShadow,
                      animation: 'float-y 3s ease-in-out infinite',
                    }}
                  >
                    <Zap size={15} color="#fff" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-bold leading-tight"
                      style={{ color: subStyle.titleColor, fontFamily: 'var(--font-display)' }}
                    >
                      {subscription.isExpired
                        ? 'Subscription Expired'
                        : subscription.isInTrial
                          ? `Free Trial — ${subscription.daysLeft} days left`
                          : `${planConfig?.name || subscription.plan} Plan`}
                    </p>
                    {subscription.validTill && (
                      <p
                        className="text-[0.625rem] font-semibold mt-0.5"
                        style={{ color: subStyle.subColor }}
                      >
                        {subscription.isExpired
                          ? 'Please renew to continue'
                          : `Valid till ${subscription.validTill}`}
                      </p>
                    )}
                  </div>
                </div>

                {subscription.isInTrial && subscription.daysLeft !== null && (
                  <div className="mb-3">
                    <div
                      className="w-full h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'rgba(0,0,0,0.08)' }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.max(5, ((60 - subscription.daysLeft) / 60) * 100)}%`,
                          borderRadius: '999px',
                          background: grad('warning', 90, [400, 600]),
                          boxShadow: `0 0 8px ${glow('warning', 0.5)}`,
                          transition: 'width 1s ease',
                        }}
                      />
                    </div>
                    <p
                      className="text-[0.6rem] mt-1 font-semibold"
                      style={{ color: subStyle.subColor }}
                    >
                      {subscription.daysLeft} days remaining
                    </p>
                  </div>
                )}

                <Link
                  href="/admin/subscription"
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg"
                  style={{
                    background: subStyle.btnBg,
                    color: subStyle.btnColor,
                    border: `1px solid ${subStyle.border}`,
                    boxShadow: `0 3px 8px ${subStyle.btnShadow}`,
                  }}
                >
                  {subStyle.label} <ArrowRight size={11} />
                </Link>
              </div>
            </ShimmerCard>

            {/* Quick Actions */}
            <div className="portal-card">
              <div className="portal-card-body">
                <h3
                  className="text-[0.6875rem] font-bold uppercase tracking-wider mb-3"
                  style={{ color: tv('text-muted') }}
                >
                  Quick Actions
                </h3>
                <div className="space-y-0.5">
                  {quickActions.map(a => {
                    const qa = quickActionStyle(a.color)
                    return (
                      <Link
                        key={a.label}
                        href={a.href}
                        className="flex items-center gap-2.5 px-2 py-2 rounded-xl text-sm font-semibold group transition-colors"
                        style={{ color: tv('text-secondary') }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = qa.hoverBg
                          e.currentTarget.style.color = tv('text-primary')
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.color = tv('text-secondary')
                        }}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            background: qa.iconBg,
                            boxShadow: `0 2px 6px ${glow(a.color, 0.25)}`,
                          }}
                        >
                          <a.icon size={13} color="#fff" />
                        </div>
                        <span className="flex-1">{a.label}</span>
                        <ArrowRight
                          size={11}
                          className="group-hover:translate-x-0.5 transition-transform"
                          style={{ color: tv('text-light') }}
                        />
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Notices */}
            {recentNotices.length > 0 && (
              <div className="portal-card">
                <div className="portal-card-body">
                  <div className="flex items-center justify-between mb-3">
                    <h3
                      className="text-[0.6875rem] font-bold uppercase tracking-wider"
                      style={{ color: tv('text-muted') }}
                    >
                      Active Notices
                    </h3>
                    <Link
                      href="/admin/notices"
                      className="text-[0.625rem] font-bold px-2 py-1 rounded-lg"
                      style={{ color: t('info', 600), backgroundColor: t('info', 50) }}
                    >
                      View All
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {recentNotices.map((n: any, idx: number) => (
                      <div key={n._id} className="flex items-start gap-2.5">
                        <div className="flex flex-col items-center mt-1 flex-shrink-0">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{
                              background: grad('info', 135, [400, 600]),
                              boxShadow: `0 0 5px ${glow('info', 0.5)}`,
                              animation: `pulse-ring 2s ease-in-out infinite`,
                              animationDelay: `${idx * 300}ms`,
                            }}
                          />
                          {idx < recentNotices.length - 1 && (
                            <div
                              className="w-px mt-1"
                              style={{ backgroundColor: tv('border'), minHeight: '16px' }}
                            />
                          )}
                        </div>
                        <div className="pb-1 min-w-0 flex-1">
                          <p
                            className="text-xs font-semibold line-clamp-1"
                            style={{ color: tv('text-secondary') }}
                          >
                            {n.title}
                          </p>
                          <p
                            className="text-[0.6rem] mt-0.5 flex items-center gap-1 font-medium"
                            style={{ color: tv('text-muted') }}
                          >
                            <Clock size={9} />
                            {new Date(n.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}