'use client'

import Link from 'next/link'
import { PLANS } from '@/config/pricing'
import type { PlanId } from '@/config/pricing'
import {
  Users, UserCheck, CheckSquare, CreditCard,
  Bell, TrendingUp, Plus, Calendar, FileText,
  ArrowRight, Clock, AlertTriangle, Zap,
  BarChart2, BookOpen, ArrowUpRight, Activity,
  Wallet, GraduationCap, MessageSquare,
} from 'lucide-react'

// ── Types ──
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

// ── Color tokens aligned to design system ──
const STAT_META: Record<string, {
  iconBg: string
  iconColor: string
  barColor: string
  hoverBorder: string
  hoverShadow: string
  topBar: string
}> = {
  indigo: {
    iconBg: 'var(--color-primary-100)',
    iconColor: 'var(--color-primary-600)',
    barColor: 'var(--color-primary-500)',
    hoverBorder: 'rgba(99,102,241,0.25)',
    hoverShadow: 'var(--shadow-md)',
    topBar: 'var(--color-primary-500)',
  },
  blue: {
    iconBg: 'var(--color-info-100)',
    iconColor: 'var(--color-info-600)',
    barColor: 'var(--color-info-500)',
    hoverBorder: 'rgba(59,130,246,0.25)',
    hoverShadow: 'var(--shadow-md)',
    topBar: 'var(--color-info-500)',
  },
  emerald: {
    iconBg: 'var(--color-success-100)',
    iconColor: 'var(--color-success-600)',
    barColor: 'var(--color-success-500)',
    hoverBorder: 'rgba(16,185,129,0.25)',
    hoverShadow: 'var(--shadow-md)',
    topBar: 'var(--color-success-500)',
  },
  red: {
    iconBg: 'var(--color-danger-100)',
    iconColor: 'var(--color-danger-600)',
    barColor: 'var(--color-danger-500)',
    hoverBorder: 'rgba(239,68,68,0.25)',
    hoverShadow: 'var(--shadow-md)',
    topBar: 'var(--color-danger-500)',
  },
  amber: {
    iconBg: 'var(--color-warning-100)',
    iconColor: 'var(--color-warning-600)',
    barColor: 'var(--color-warning-500)',
    hoverBorder: 'rgba(245,158,11,0.25)',
    hoverShadow: 'var(--shadow-md)',
    topBar: 'var(--color-warning-500)',
  },
  purple: {
    iconBg: 'var(--color-violet-100)',
    iconColor: 'var(--color-violet-600)',
    barColor: 'var(--color-violet-500)',
    hoverBorder: 'rgba(139,92,246,0.25)',
    hoverShadow: 'var(--shadow-md)',
    topBar: 'var(--color-violet-500)',
  },
}

// ════════════════════════════════════════
// ATTENDANCE BAR CHART
// ════════════════════════════════════════
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
        const height = d.total > 0 ? Math.max((d.total / maxVal) * 100, 10) : 5
        const label = new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' })
        const barColor =
          pct >= 80 ? 'var(--color-success-500)'
            : pct >= 60 ? 'var(--color-warning-500)'
              : 'var(--color-danger-500)'

        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
            <span className="text-2xs font-semibold tabular-nums transition-colors"
              style={{ color: 'var(--text-muted)' }}>
              {d.total > 0 ? `${Math.round(pct)}%` : '—'}
            </span>
            <div
              className="w-full relative rounded-md overflow-hidden"
              style={{
                height: `${height}%`,
                backgroundColor: 'var(--color-surface-100)',
              }}
            >
              <div
                className="absolute bottom-0 left-0 right-0 rounded-md transition-all duration-700 ease-out"
                style={{
                  height: `${pct}%`,
                  backgroundColor: barColor,
                  transitionDelay: `${i * 60}ms`,
                }}
              />
            </div>
            <span className="text-2xs font-medium" style={{ color: 'var(--text-muted)' }}>
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ════════════════════════════════════════
// DONUT CHART
// ════════════════════════════════════════
function DonutChart({
  value, total, color, label,
}: {
  value: number
  total: number
  color: string
  label: string
}) {
  const pct = total > 0 ? (value / total) * 100 : 0
  const radius = 38
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="var(--color-surface-100)"
          strokeWidth="10"
        />
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          className="transition-all duration-1000 ease-out"
        />
        <text
          x="50" y="46"
          textAnchor="middle"
          fontSize="18"
          fontWeight="700"
          fill="var(--text-primary)"
        >
          {Math.round(pct)}%
        </text>
        <text
          x="50" y="60"
          textAnchor="middle"
          fontSize="10"
          fontWeight="500"
          fill="var(--text-muted)"
        >
          {label}
        </text>
      </svg>
    </div>
  )
}

// ════════════════════════════════════════
// STAT CARD
// ════════════════════════════════════════
function StatCard({
  label, value, icon, color, subtext, href,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  color: string
  subtext?: string
  href?: string
}) {
  const c = STAT_META[color] ?? STAT_META.indigo

  const content = (
    <div
      className="portal-stat-card group cursor-pointer"
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = c.hoverBorder
        e.currentTarget.style.boxShadow = c.hoverShadow
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = 'var(--shadow-xs)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ backgroundColor: c.topBar }}
      />

      {/* Icon + arrow */}
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: c.iconBg }}
        >
          <span style={{ color: c.iconColor }}>{icon}</span>
        </div>
        {href && (
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
            style={{ backgroundColor: 'var(--bg-muted)' }}
          >
            <ArrowUpRight size={13} style={{ color: 'var(--text-muted)' }} />
          </div>
        )}
      </div>

      {/* Value */}
      <p className="stat-value">{value}</p>

      {/* Label */}
      <p className="stat-label">{label}</p>

      {/* Subtext */}
      {subtext && (
        <p
          className="text-2xs mt-1.5 flex items-center gap-1"
          style={{ color: 'var(--text-light)' }}
        >
          <Activity size={9} />
          {subtext}
        </p>
      )}
    </div>
  )

  return href
    ? <Link href={href} className="block">{content}</Link>
    : content
}

// ════════════════════════════════════════
// SECTION HEADER
// ════════════════════════════════════════
function SectionHeader({
  title, subtitle, href, linkText,
}: {
  title: string
  subtitle?: string
  href?: string
  linkText?: string
}) {
  return (
    <div className="flex items-center justify-between w-full">
      <div>
        <h3 className="portal-card-title">{title}</h3>
        {subtitle && (
          <p className="portal-card-subtitle">{subtitle}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs font-medium transition-colors"
          style={{ color: 'var(--color-info-600)' }}
        >
          {linkText || 'View all'}
          <ArrowRight size={11} />
        </Link>
      )}
    </div>
  )
}

// ════════════════════════════════════════
// LIST ITEM
// ════════════════════════════════════════
function ListItem({
  avatar, avatarBg, avatarColor,
  title, subtitle, right, rightSub,
}: {
  avatar: string | React.ReactNode
  avatarBg: string
  avatarColor: string
  title: string
  subtitle: string
  right?: string | React.ReactNode
  rightSub?: string
}) {
  return (
    <div
      className="flex items-center gap-3 py-2 px-1 rounded-lg -mx-1 transition-colors"
      style={{ cursor: 'default' }}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = 'var(--bg-muted)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{ backgroundColor: avatarBg, color: avatarColor }}
      >
        {avatar}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="text-sm font-medium truncate"
          style={{ color: 'var(--text-secondary)' }}
        >
          {title}
        </p>
        <p
          className="text-xs mt-0.5 truncate"
          style={{ color: 'var(--text-muted)' }}
        >
          {subtitle}
        </p>
      </div>
      {right && (
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-semibold">{right}</p>
          {rightSub && (
            <p className="text-2xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {rightSub}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════
// CREDIT MINI WIDGET
// ════════════════════════════════════════
function CreditMiniWidget({
  credits,
}: {
  credits: DashboardData['credits']
}) {
  const pct = credits.totalEarned > 0
    ? Math.min(100, Math.round((credits.totalUsed / credits.totalEarned) * 100))
    : 0

  const channelMap = credits.last30Days.reduce((acc: any, c) => {
    acc[c._id] = c
    return acc
  }, {})

  const isLow = credits.lowWarning

  return (
    <div
      className="rounded-xl p-4 overflow-hidden"
      style={{
        background: isLow
          ? 'linear-gradient(135deg, var(--color-danger-50), #fff1f2)'
          : 'linear-gradient(135deg, var(--color-primary-50), var(--color-info-50))',
        border: isLow
          ? '1px solid var(--color-danger-200)'
          : '1px solid var(--color-primary-200)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: isLow
                ? 'var(--color-danger-100)'
                : 'var(--color-primary-100)',
            }}
          >
            <MessageSquare
              size={15}
              style={{
                color: isLow
                  ? 'var(--color-danger-600)'
                  : 'var(--color-primary-600)',
              }}
            />
          </div>
          <div>
            <p
              className="text-sm font-semibold"
              style={{
                color: isLow
                  ? 'var(--color-danger-800)'
                  : 'var(--color-primary-950)',
              }}
            >
              Message Credits
            </p>
            {isLow && (
              <p className="text-2xs font-medium" style={{ color: 'var(--color-danger-500)' }}>
                ⚠️ Low balance!
              </p>
            )}
          </div>
        </div>

        <Link
          href="/admin/subscription"
          className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
          style={{
            backgroundColor: isLow
              ? 'var(--color-danger-600)'
              : 'var(--color-primary-600)',
            color: '#fff',
          }}
        >
          Buy →
        </Link>
      </div>

      {/* Balance */}
      <div className="flex items-baseline gap-1.5 mb-3">
        <span
          className="text-3xl font-extrabold tabular-nums"
          style={{
            color: isLow
              ? 'var(--color-danger-600)'
              : 'var(--color-primary-600)',
          }}
        >
          {credits.balance.toLocaleString('en-IN')}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          credits left
        </span>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--color-surface-200)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${100 - pct}%`,
              background: isLow
                ? 'linear-gradient(90deg, var(--color-danger-300), var(--color-danger-500))'
                : 'linear-gradient(90deg, var(--color-primary-400), var(--color-primary-600))',
            }}
          />
        </div>
      </div>

      {/* Credit guide */}
      <div
        className="flex gap-2 text-2xs mb-3"
        style={{ color: 'var(--text-muted)' }}
      >
        <span>📱 1cr = 1 SMS</span>
        <span>·</span>
        <span>💬 1cr = 1 WA</span>
        <span>·</span>
        <span>📧 1cr = 10 Email</span>
      </div>

      {/* Last 30 days */}
      {credits.last30Days.length > 0 && (
        <div
          className="flex gap-3 pt-2.5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.5)' }}
        >
          {(['sms', 'whatsapp', 'email'] as const).map(channel => {
            const usage = channelMap[channel]
            if (!usage) return null
            const icons = { sms: '📱', whatsapp: '💬', email: '📧' }
            return (
              <div key={channel} className="text-center">
                <div className="text-2xs capitalize" style={{ color: 'var(--text-muted)' }}>
                  {icons[channel]} {usage.count}
                </div>
                <div className="text-2xs" style={{ color: 'var(--text-light)' }}>
                  {usage.credits}cr used
                </div>
              </div>
            )
          })}
        </div>
      )}

      {credits.freePerMonth > 0 && (
        <p className="text-2xs mt-2" style={{ color: 'var(--text-muted)' }}>
          🎁 {credits.freePerMonth.toLocaleString('en-IN')} free credits/month included
        </p>
      )}
    </div>
  )
}

// ════════════════════════════════════════
// MINI LIMIT BAR
// ════════════════════════════════════════
function MiniLimitBar({
  label, used, limit, addon, color,
}: {
  label: string
  used: number
  limit: number
  addon: number
  color: string
}) {
  if (limit === -1) {
    return (
      <div className="flex items-center justify-between text-xs mb-2">
        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span className="font-semibold" style={{ color: 'var(--color-success-600)' }}>
          {used.toLocaleString('en-IN')} / Unlimited
        </span>
      </div>
    )
  }

  const pct = Math.min(100, Math.round((used / limit) * 100))
  const isHigh = pct >= 90
  const isMid = pct >= 70

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {label}
          {addon > 0 && (
            <span className="ml-1 text-2xs" style={{ color: 'var(--color-primary-500)' }}>
              (+{addon} addon)
            </span>
          )}
        </span>
        <span
          className="text-xs font-semibold"
          style={{
            color: isHigh
              ? 'var(--color-danger-600)'
              : isMid
                ? 'var(--color-warning-600)'
                : 'var(--text-secondary)',
          }}
        >
          {used}/{limit}
        </span>
      </div>

      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface-100)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            backgroundColor: isHigh
              ? 'var(--color-danger-500)'
              : isMid
                ? 'var(--color-warning-500)'
                : color,
          }}
        />
      </div>

      {isHigh && (
        <p className="text-2xs mt-0.5" style={{ color: 'var(--color-danger-500)' }}>
          {limit - used <= 0 ? 'Limit full! ' : `Only ${limit - used} left! `}
          <Link
            href="/admin/subscription"
            className="underline"
          >
            Buy add-on
          </Link>
        </p>
      )}
    </div>
  )
}

// ════════════════════════════════════════
// MAIN DASHBOARD
// ════════════════════════════════════════
export function AdminDashboardClient({
  data, userName,
}: {
  data: DashboardData
  userName: string
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

  return (
    <div className="space-y-6 pb-8 max-w-[1400px] mx-auto portal-content-enter">

      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="portal-breadcrumb mb-1.5">
            <span className="bc-current">Dashboard</span>
          </div>
          <h1 className="portal-page-title">
            {greeting}, {userName} 👋
          </h1>
          <p
            className="text-sm mt-0.5 flex items-center gap-1.5"
            style={{ color: 'var(--text-muted)' }}
          >
            <Calendar size={12} />
            {today}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/students?action=add"
            className="btn-primary btn-sm inline-flex items-center gap-1.5"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span className="hidden sm:inline">Add Student</span>
            <span className="sm:hidden">Add</span>
          </Link>
          <Link
            href="/admin/attendance"
            className="btn-ghost btn-sm inline-flex items-center gap-1.5"
          >
            <CheckSquare size={15} />
            <span className="hidden sm:inline">Attendance</span>
          </Link>
        </div>
      </div>

      {/* ═══ STAT CARDS ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Students"
          value={stats.totalStudents}
          icon={<Users size={18} />}
          color="indigo"
          href="/admin/students"
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
          color="blue"
          href="/admin/teachers"
        />
        <StatCard
          label="Today's Attendance"
          value={`${stats.attendancePct}%`}
          icon={<CheckSquare size={18} />}
          color="emerald"
          subtext={`${stats.todayPresent} present · ${stats.todayAbsent} absent`}
          href="/admin/attendance"
        />
        <StatCard
          label="Pending Fees"
          value={stats.pendingFees}
          icon={<CreditCard size={18} />}
          color={stats.pendingFees > 0 ? 'red' : 'emerald'}
          subtext={`₹${stats.feeThisMonth.toLocaleString('en-IN')} this month`}
          href="/admin/fees"
        />
      </div>

      {/* ═══ CHARTS ROW ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">

        {/* Attendance Trend */}
        <div className="lg:col-span-2 portal-card">
          <div className="portal-card-header">
            <SectionHeader
              title="Attendance Trend"
              subtitle="Last 7 days"
              href="/admin/attendance"
              linkText="Details"
            />
          </div>
          <div className="portal-card-body">
            {attendanceChart.some(d => d.total > 0) ? (
              <AttendanceBarChart data={attendanceChart} />
            ) : (
              <div className="portal-empty">
                <div className="portal-empty-icon">
                  <BarChart2 size={20} />
                </div>
                <p className="portal-empty-title">No attendance data</p>
                <p className="portal-empty-text">
                  Start marking attendance to see trends
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Today's Snapshot */}
        <div className="portal-card">
          <div className="portal-card-header">
            <SectionHeader title="Today's Snapshot" />
          </div>
          <div className="portal-card-body flex flex-col items-center justify-center">
            <DonutChart
              value={stats.todayPresent}
              total={stats.todayPresent + stats.todayAbsent}
              color="var(--color-success-500)"
              label="Present"
            />
            <div className="flex gap-5 mt-4">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: 'var(--color-success-500)' }}
                />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Present: <strong>{stats.todayPresent}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: 'var(--color-surface-200)' }}
                />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Absent: <strong>{stats.todayAbsent}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ CLASS + FEE ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">

        {/* Class-wise */}
        <div className="portal-card">
          <div className="portal-card-header">
            <SectionHeader
              title="Class-wise Students"
              subtitle="Distribution"
            />
          </div>
          <div className="portal-card-body">
            {classWise.length === 0 ? (
              <div className="portal-empty">
                <div className="portal-empty-icon">
                  <GraduationCap size={20} />
                </div>
                <p className="portal-empty-title">No class data</p>
                <p className="portal-empty-text">
                  Add students to see distribution
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {classWise.map((c, idx) => {
                  const pct = stats.totalStudents > 0
                    ? Math.round((c.count / stats.totalStudents) * 100)
                    : 0
                  return (
                    <div key={c._id}>
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-xs font-medium"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          Class {c._id}
                        </span>
                        <span
                          className="text-xs font-semibold"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {c.count} ({pct}%)
                        </span>
                      </div>
                      <div
                        className="w-full rounded-full h-2 overflow-hidden"
                        style={{ backgroundColor: 'var(--color-surface-100)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${pct}%`,
                            background: 'linear-gradient(90deg, var(--color-info-300), var(--color-info-600))',
                            transitionDelay: `${idx * 50}ms`,
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
        <div className="portal-card">
          <div className="portal-card-header">
            <SectionHeader
              title="Fee Summary"
              href="/admin/fees"
              linkText="Manage"
            />
          </div>
          <div className="portal-card-body">
            <div className="grid grid-cols-2 gap-3">

              {/* This Month */}
              <div
                className="rounded-xl p-4 text-center"
                style={{
                  background: 'linear-gradient(135deg, var(--color-success-50), var(--color-success-100))',
                  border: '1px solid var(--color-success-200)',
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2"
                  style={{ backgroundColor: 'var(--color-success-200)' }}
                >
                  <TrendingUp size={14} style={{ color: 'var(--color-success-700)' }} />
                </div>
                <p
                  className="text-lg font-bold tabular-nums"
                  style={{ color: 'var(--color-success-700)' }}
                >
                  ₹{stats.feeThisMonth.toLocaleString('en-IN')}
                </p>
                <p
                  className="text-2xs font-medium mt-0.5"
                  style={{ color: 'var(--color-success-600)' }}
                >
                  This Month
                </p>
              </div>

              {/* Total */}
              <div
                className="rounded-xl p-4 text-center"
                style={{
                  background: 'linear-gradient(135deg, var(--color-surface-50), var(--color-surface-100))',
                  border: '1px solid var(--color-surface-200)',
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2"
                  style={{ backgroundColor: 'var(--color-surface-200)' }}
                >
                  <Wallet size={14} style={{ color: 'var(--text-secondary)' }} />
                </div>
                <p
                  className="text-lg font-bold tabular-nums"
                  style={{ color: 'var(--text-primary)' }}
                >
                  ₹{stats.feeTotal.toLocaleString('en-IN')}
                </p>
                <p
                  className="text-2xs font-medium mt-0.5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Total
                </p>
              </div>

              {/* Pending */}
              <div
                className="col-span-2 rounded-xl p-4"
                style={{
                  background: 'linear-gradient(135deg, var(--color-danger-50), #fff1f2)',
                  border: '1px solid var(--color-danger-200)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: 'var(--color-danger-100)' }}
                    >
                      <AlertTriangle
                        size={16}
                        style={{ color: 'var(--color-danger-500)' }}
                      />
                    </div>
                    <div>
                      <p
                        className="text-lg font-bold tabular-nums"
                        style={{ color: 'var(--color-danger-600)' }}
                      >
                        {stats.pendingFees}
                      </p>
                      <p
                        className="text-2xs font-medium"
                        style={{ color: 'var(--color-danger-400)' }}
                      >
                        Pending Fee Records
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/admin/fees"
                    className="text-xs font-medium flex items-center gap-1"
                    style={{ color: 'var(--color-danger-600)' }}
                  >
                    View <ArrowRight size={10} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ RECENT ACTIVITY ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">

        {/* Recent Students */}
        <div className="portal-card">
          <div className="portal-card-header">
            <SectionHeader
              title="Recent Admissions"
              href="/admin/students"
            />
          </div>
          <div className="portal-card-body pt-3">
            {recentStudents.length === 0 ? (
              <div className="portal-empty">
                <div className="portal-empty-icon"><Users size={20} /></div>
                <p className="portal-empty-title">No students yet</p>
                <p className="portal-empty-text">Add your first student</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {recentStudents.map((s: any) => (
                  <ListItem
                    key={s._id}
                    avatar={(s.userId?.name || 'S').charAt(0)}
                    avatarBg="var(--color-primary-100)"
                    avatarColor="var(--color-primary-600)"
                    title={s.userId?.name || 'Unknown'}
                    subtitle={`Class ${s.class}${s.section ? `-${s.section}` : ''} · ${s.admissionNo}`}
                    right={new Date(s.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short',
                    })}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="portal-card">
          <div className="portal-card-header">
            <SectionHeader
              title="Recent Payments"
              href="/admin/fees"
            />
          </div>
          <div className="portal-card-body pt-3">
            {recentFees.length === 0 ? (
              <div className="portal-empty">
                <div className="portal-empty-icon"><CreditCard size={20} /></div>
                <p className="portal-empty-title">No payments yet</p>
                <p className="portal-empty-text">Fee payments will appear here</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {recentFees.map((f: any) => (
                  <ListItem
                    key={f._id}
                    avatar={<CreditCard size={14} />}
                    avatarBg="var(--color-success-100)"
                    avatarColor="var(--color-success-700)"
                    title={f.studentId?.userId?.name || 'Unknown'}
                    subtitle={f.studentId?.admissionNo || ''}
                    right={
                      <span style={{ color: 'var(--color-success-600)' }}>
                        ₹{f.amount?.toLocaleString('en-IN')}
                      </span>
                    }
                    rightSub={
                      f.paidAt
                        ? new Date(f.paidAt).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short',
                        })
                        : ''
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-3 sm:space-y-4">

          {/* Credit Widget */}
          <CreditMiniWidget credits={credits} />

          {/* Usage Limits */}
          <div className="portal-card">
            <div className="portal-card-body">
              <div className="flex items-center justify-between mb-3">
                <h3
                  className="text-2xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Usage Limits
                </h3>
                <Link
                  href="/admin/subscription"
                  className="text-2xs font-medium"
                  style={{ color: 'var(--color-primary-600)' }}
                >
                  Manage →
                </Link>
              </div>
              <MiniLimitBar
                label="Students"
                used={limits.students.used}
                limit={limits.students.limit}
                addon={limits.students.addon}
                color="var(--color-primary-500)"
              />
              <MiniLimitBar
                label="Teachers & Staff"
                used={limits.teachers.used}
                limit={limits.teachers.limit}
                addon={limits.teachers.addon}
                color="var(--color-violet-500)"
              />
            </div>
          </div>

          {/* Subscription Card */}
          {(() => {
            // Color tokens per subscription state
            const subStyle = subscription.isExpired
              ? {
                bg: 'linear-gradient(135deg, var(--color-danger-50), #fff1f2)',
                border: 'var(--color-danger-200)',
                iconBg: 'var(--color-danger-100)',
                iconColor: 'var(--color-danger-500)',
                textColor: 'var(--color-danger-800)',
                subColor: 'var(--color-danger-600)',
                btnBg: 'var(--color-danger-600)',
                btnColor: '#fff',
                btnBorder: 'transparent',
                btnLabel: 'Subscribe Now',
              }
              : subscription.isInTrial
                ? {
                  bg: 'linear-gradient(135deg, var(--color-warning-50), #fff7ed)',
                  border: 'var(--color-warning-200)',
                  iconBg: 'var(--color-warning-100)',
                  iconColor: 'var(--color-warning-600)',
                  textColor: 'var(--color-warning-800)',
                  subColor: 'var(--color-warning-700)',
                  btnBg: 'var(--color-warning-600)',
                  btnColor: '#fff',
                  btnBorder: 'transparent',
                  btnLabel: 'Upgrade Plan',
                }
                : {
                  bg: 'linear-gradient(135deg, var(--color-success-50), #f0fdf4)',
                  border: 'var(--color-success-200)',
                  iconBg: 'var(--color-success-100)',
                  iconColor: 'var(--color-success-600)',
                  textColor: 'var(--color-success-800)',
                  subColor: 'var(--color-success-700)',
                  btnBg: 'rgba(255,255,255,0.7)',
                  btnColor: 'var(--color-success-800)',
                  btnBorder: 'var(--color-success-200)',
                  btnLabel: 'Manage',
                }

            return (
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  background: subStyle.bg,
                  border: `1px solid ${subStyle.border}`,
                }}
              >
                <div className="p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: subStyle.iconBg }}
                    >
                      <Zap size={15} style={{ color: subStyle.iconColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold"
                        style={{ color: subStyle.textColor }}
                      >
                        {subscription.isExpired
                          ? 'Subscription Expired'
                          : subscription.isInTrial
                            ? `Free Trial — ${subscription.daysLeft} days left`
                            : `${planConfig?.name || subscription.plan} Plan`}
                      </p>
                      {subscription.validTill && (
                        <p className="text-2xs" style={{ color: subStyle.subColor }}>
                          {subscription.isExpired
                            ? 'Please renew to continue'
                            : `Valid till: ${subscription.validTill}`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Trial progress bar */}
                  {subscription.isInTrial && subscription.daysLeft !== null && (
                    <div className="mb-3">
                      <div
                        className="w-full h-1.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'var(--color-warning-100)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.max(5, ((60 - subscription.daysLeft) / 60) * 100)}%`,
                            background: 'linear-gradient(90deg, var(--color-warning-400), var(--color-warning-500))',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <Link
                    href="/admin/subscription"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors"
                    style={{
                      backgroundColor: subStyle.btnBg,
                      color: subStyle.btnColor,
                      border: `1px solid ${subStyle.btnBorder}`,
                    }}
                  >
                    {subStyle.btnLabel}
                    <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            )
          })()}

          {/* Quick Actions */}
          <div className="portal-card">
            <div className="portal-card-body">
              <h3
                className="text-2xs font-semibold uppercase tracking-wider mb-2.5"
                style={{ color: 'var(--text-muted)' }}
              >
                Quick Actions
              </h3>
              <div className="space-y-0.5">
                {[
                  {
                    label: 'Add Student',
                    href: '/admin/students?action=add',
                    icon: Plus,
                    iconColor: 'var(--color-primary-600)',
                    hoverBg: 'var(--color-primary-50)',
                  },
                  {
                    label: 'Post Notice',
                    href: '/admin/notices?action=add',
                    icon: Bell,
                    iconColor: 'var(--color-info-600)',
                    hoverBg: 'var(--color-info-50)',
                  },
                  {
                    label: 'Schedule Exam',
                    href: '/admin/exams?action=add',
                    icon: BookOpen,
                    iconColor: 'var(--color-accent-600)',
                    hoverBg: 'var(--color-accent-50)',
                  },
                  {
                    label: 'View Reports',
                    href: '/admin/reports',
                    icon: BarChart2,
                    iconColor: 'var(--color-success-600)',
                    hoverBg: 'var(--color-success-50)',
                  },
                  {
                    label: 'Send Message',
                    href: '/admin/communication',
                    icon: MessageSquare,
                    iconColor: 'var(--color-violet-600)',
                    hoverBg: 'var(--color-violet-50)',
                  },
                ].map(a => (
                  <Link
                    key={a.label}
                    href={a.href}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all group"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = a.hoverBg
                      e.currentTarget.style.color = 'var(--text-primary)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = 'var(--text-secondary)'
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'var(--bg-muted)' }}
                    >
                      <a.icon size={13} style={{ color: a.iconColor }} />
                    </div>
                    <span className="flex-1">{a.label}</span>
                    <ArrowRight
                      size={11}
                      style={{ color: 'var(--text-light)' }}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Notices */}
          {recentNotices.length > 0 && (
            <div className="portal-card">
              <div className="portal-card-body">
                <div className="flex items-center justify-between mb-3">
                  <h3
                    className="text-2xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Notices
                  </h3>
                  <Link
                    href="/admin/notices"
                    className="text-2xs font-medium"
                    style={{ color: 'var(--color-info-600)' }}
                  >
                    All
                  </Link>
                </div>
                <div className="space-y-2.5">
                  {recentNotices.map((n: any, idx: number) => (
                    <div key={n._id} className="flex items-start gap-2.5">
                      <div className="flex flex-col items-center mt-1 flex-shrink-0">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: 'var(--color-info-400)' }}
                        />
                        {idx < recentNotices.length - 1 && (
                          <div
                            className="w-px h-full mt-1"
                            style={{ backgroundColor: 'var(--color-surface-100)' }}
                          />
                        )}
                      </div>
                      <div className="pb-2">
                        <p
                          className="text-sm font-medium line-clamp-1"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {n.title}
                        </p>
                        <p
                          className="text-2xs mt-0.5 flex items-center gap-1"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <Clock size={9} />
                          {new Date(n.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short',
                          })}
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
  )
}