// FILE: src/app/(dashboard)/admin/DashboardClient.tsx
// UPDATED: Credit widget + Limit bars added
// All existing components kept — only additions
// ═══════════════════════════════════════════════════════════

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
  // ── NEW ──
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

const STAT_COLORS: Record<string, {
  iconBg: string; iconColor: string; accent: string
}> = {
  indigo:  { iconBg: '#EEF2FF', iconColor: '#4F46E5', accent: '#4F46E5' },
  emerald: { iconBg: '#ECFDF5', iconColor: '#059669', accent: '#059669' },
  amber:   { iconBg: '#FFFBEB', iconColor: '#D97706', accent: '#D97706' },
  red:     { iconBg: '#FEF2F2', iconColor: '#DC2626', accent: '#DC2626' },
  blue:    { iconBg: '#EFF6FF', iconColor: '#2563EB', accent: '#2563EB' },
  purple:  { iconBg: '#F5F3FF', iconColor: '#7C3AED', accent: '#7C3AED' },
}

// ════════════════════════════════════════
// EXISTING COMPONENTS (kept same)
// ════════════════════════════════════════

function AttendanceBarChart({ data }: {
  data: Array<{ date: string; present: number; total: number }>
}) {
  const maxVal = Math.max(...data.map(d => d.total), 1)
  return (
    <div className="flex items-end gap-2 h-32 px-1">
      {data.map((d, i) => {
        const pct = d.total > 0 ? (d.present / d.total) * 100 : 0
        const height = d.total > 0 ? Math.max((d.total / maxVal) * 100, 10) : 5
        const dayLabel = new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' })
        const barColor = pct >= 80 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444'
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
            <span className="text-[0.625rem] font-semibold text-slate-400 group-hover:text-slate-600 transition-colors tabular-nums">
              {d.total > 0 ? `${Math.round(pct)}%` : '—'}
            </span>
            <div
              className="w-full relative rounded-lg overflow-hidden"
              style={{ height: `${height}%`, backgroundColor: '#F1F5F9' }}
            >
              <div
                className="absolute bottom-0 left-0 right-0 rounded-lg transition-all duration-700 ease-out"
                style={{
                  height: `${pct}%`,
                  backgroundColor: barColor,
                  transitionDelay: `${i * 60}ms`,
                }}
              />
            </div>
            <span className="text-[0.625rem] text-slate-400 font-medium">{dayLabel}</span>
          </div>
        )
      })}
    </div>
  )
}

function DonutChart({
  value, total, color, label,
}: {
  value: number; total: number; color: string; label: string
}) {
  const pct = total > 0 ? (value / total) * 100 : 0
  const radius = 38
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference
  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#F1F5F9" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          className="transition-all duration-1000 ease-out"
        />
        <text x="50" y="46" textAnchor="middle" fontSize="18" fontWeight="700" fill="#0F172A">
          {Math.round(pct)}%
        </text>
        <text x="50" y="60" textAnchor="middle" fontSize="10" fontWeight="500" fill="#94A3B8">
          {label}
        </text>
      </svg>
    </div>
  )
}

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
  const c = STAT_COLORS[color] || STAT_COLORS.indigo
  const content = (
    <div
      className="relative rounded-2xl p-4 sm:p-5 transition-all duration-300 group cursor-pointer overflow-hidden"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 25px -5px rgba(0,0,0,0.08)'
        e.currentTarget.style.borderColor = `${c.accent}30`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = '#E2E8F0'
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ backgroundColor: c.accent }}
      />
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: c.iconBg }}
        >
          <span style={{ color: c.iconColor }}>{icon}</span>
        </div>
        {href && (
          <div className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all" style={{ backgroundColor: '#F8FAFC' }}>
            <ArrowUpRight size={13} style={{ color: '#94A3B8' }} />
          </div>
        )}
      </div>
      <p className="text-2xl sm:text-[1.75rem] font-extrabold tracking-tight leading-none" style={{ color: '#0F172A' }}>
        {value}
      </p>
      <p className="text-xs font-medium mt-1" style={{ color: '#94A3B8' }}>{label}</p>
      {subtext && (
        <p className="text-[0.625rem] mt-1.5 flex items-center gap-1" style={{ color: '#CBD5E1' }}>
          <Activity size={9} />{subtext}
        </p>
      )}
    </div>
  )
  return href ? <Link href={href} className="block">{content}</Link> : content
}

function SectionHeader({
  title, subtitle, href, linkText,
}: {
  title: string; subtitle?: string; href?: string; linkText?: string
}) {
  return (
    <div className="flex items-center justify-between w-full">
      <div>
        <h3 className="text-sm font-semibold" style={{ color: '#0F172A' }}>{title}</h3>
        {subtitle && <p className="text-[0.6875rem] mt-0.5" style={{ color: '#94A3B8' }}>{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="inline-flex items-center gap-1 text-[0.6875rem] font-medium" style={{ color: '#2563EB' }}>
          {linkText || 'View all'}<ArrowRight size={11} />
        </Link>
      )}
    </div>
  )
}

function ListItem({
  avatar, avatarBg, avatarColor, title, subtitle, right, rightSub,
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
    <div className="flex items-center gap-3 py-2 px-1 rounded-lg hover:bg-slate-50 transition-colors -mx-1">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{ backgroundColor: avatarBg, color: avatarColor }}
      >
        {avatar}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[0.8125rem] font-medium text-slate-700 truncate">{title}</p>
        <p className="text-[0.6875rem] text-slate-400 mt-0.5 truncate">{subtitle}</p>
      </div>
      {right && (
        <div className="text-right flex-shrink-0">
          <p className="text-[0.8125rem] font-semibold">{right}</p>
          {rightSub && <p className="text-[0.625rem] text-slate-400 mt-0.5">{rightSub}</p>}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════
// NEW: CREDIT MINI WIDGET
// ════════════════════════════════════════
function CreditMiniWidget({
  credits,
}: {
  credits: DashboardData['credits']
}) {
  const pct = credits.totalEarned > 0
    ? Math.min(100, Math.round((credits.totalUsed / credits.totalEarned) * 100))
    : 0

  // Channel usage map
  const channelMap = credits.last30Days.reduce((acc: any, c) => {
    acc[c._id] = c
    return acc
  }, {})

  return (
    <div
      className="rounded-2xl p-4 overflow-hidden"
      style={{
        background: credits.lowWarning
          ? 'linear-gradient(135deg, #FEF2F2, #FFF1F2)'
          : 'linear-gradient(135deg, #EEF2FF, #F0F9FF)',
        border: credits.lowWarning ? '1px solid #FECACA' : '1px solid #C7D2FE',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: credits.lowWarning ? '#FEE2E2' : '#E0E7FF',
            }}
          >
            <MessageSquare
              size={15}
              style={{ color: credits.lowWarning ? '#EF4444' : '#4F46E5' }}
            />
          </div>
          <div>
            <p
              className="text-[0.8125rem] font-semibold"
              style={{ color: credits.lowWarning ? '#991B1B' : '#1E1B4B' }}
            >
              Message Credits
            </p>
            {credits.lowWarning && (
              <p className="text-[0.625rem] text-red-500 font-medium">
                ⚠️ Low balance!
              </p>
            )}
          </div>
        </div>
        <Link
          href="/admin/subscription"
          className="text-[0.6875rem] font-semibold px-2.5 py-1 rounded-lg transition-colors"
          style={{
            backgroundColor: credits.lowWarning ? '#DC2626' : '#4F46E5',
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
          style={{ color: credits.lowWarning ? '#DC2626' : '#4F46E5' }}
        >
          {credits.balance.toLocaleString('en-IN')}
        </span>
        <span className="text-[0.75rem] text-slate-500">credits left</span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#E2E8F0' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${100 - pct}%`,
              background: credits.lowWarning
                ? 'linear-gradient(90deg, #FCA5A5, #EF4444)'
                : 'linear-gradient(90deg, #818CF8, #4F46E5)',
            }}
          />
        </div>
      </div>

      {/* Credit guide */}
      <div className="flex gap-2 text-[0.625rem] text-slate-500 mb-3">
        <span>📱 1cr = 1 SMS</span>
        <span>·</span>
        <span>💬 1cr = 1 WA</span>
        <span>·</span>
        <span>📧 1cr = 10 Email</span>
      </div>

      {/* Last 30 days usage */}
      {credits.last30Days.length > 0 && (
        <div className="flex gap-3 pt-2.5 border-t border-white/50">
          {['sms', 'whatsapp', 'email'].map(channel => {
            const usage = channelMap[channel]
            if (!usage) return null
            const icons: Record<string, string> = {
              sms: '📱', whatsapp: '💬', email: '📧',
            }
            return (
              <div key={channel} className="text-center">
                <div className="text-[0.625rem] text-slate-500 capitalize">
                  {icons[channel]} {usage.count}
                </div>
                <div className="text-[0.5625rem] text-slate-400">
                  {usage.credits}cr used
                </div>
              </div>
            )
          })}
        </div>
      )}

      {credits.freePerMonth > 0 && (
        <p className="text-[0.5625rem] text-slate-400 mt-2">
          🎁 {credits.freePerMonth.toLocaleString('en-IN')} free credits/month included in your plan
        </p>
      )}
    </div>
  )
}

// ════════════════════════════════════════
// NEW: LIMIT BAR
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
      <div className="flex items-center justify-between text-[0.6875rem] mb-2">
        <span className="text-slate-500">{label}</span>
        <span className="font-semibold text-emerald-600">
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
        <span className="text-[0.6875rem] text-slate-500">
          {label}
          {addon > 0 && (
            <span className="ml-1 text-[0.5625rem] text-indigo-500">
              (+{addon} addon)
            </span>
          )}
        </span>
        <span
          className="text-[0.6875rem] font-semibold"
          style={{
            color: isHigh ? '#DC2626' : isMid ? '#D97706' : '#475569',
          }}
        >
          {used}/{limit}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#F1F5F9' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            backgroundColor: isHigh ? '#EF4444' : isMid ? '#F59E0B' : color,
          }}
        />
      </div>
      {isHigh && (
        <p className="text-[0.5625rem] text-red-500 mt-0.5">
          {limit - used <= 0 ? 'Limit full! ' : `Only ${limit - used} left! `}
          <Link href="/admin/subscription" className="underline">
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
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  })()

  const planConfig = PLANS[subscription.plan as PlanId]

  return (
    <div className="space-y-6 pb-8 max-w-[1400px] mx-auto">

      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="portal-breadcrumb mb-1.5">
            <span className="current">Dashboard</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: '#0F172A' }}>
            {greeting}, {userName} 👋
          </h1>
          <p className="text-[0.8125rem] mt-0.5 flex items-center gap-1.5" style={{ color: '#94A3B8' }}>
            <Calendar size={12} />{today}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/students?action=add"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[0.8125rem] font-semibold rounded-xl"
            style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
          >
            <Plus size={15} strokeWidth={2.5} />
            <span className="hidden sm:inline">Add Student</span>
            <span className="sm:hidden">Add</span>
          </Link>
          <Link
            href="/admin/attendance"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[0.8125rem] font-semibold rounded-xl"
            style={{ backgroundColor: '#FFFFFF', color: '#475569', border: '1px solid #E2E8F0' }}
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
        <div className="lg:col-span-2 portal-card">
          <div className="p-5 pb-0">
            <SectionHeader
              title="Attendance Trend"
              subtitle="Last 7 days"
              href="/admin/attendance"
              linkText="Details"
            />
          </div>
          <div className="p-5 pt-4">
            {attendanceChart.some(d => d.total > 0) ? (
              <AttendanceBarChart data={attendanceChart} />
            ) : (
              <div className="portal-empty">
                <div className="portal-empty-icon"><BarChart2 size={20} /></div>
                <p className="portal-empty-title">No attendance data</p>
                <p className="portal-empty-text">Start marking attendance to see trends</p>
              </div>
            )}
          </div>
        </div>

        <div className="portal-card">
          <div className="p-5 pb-0">
            <SectionHeader title="Today's Snapshot" />
          </div>
          <div className="p-5 pt-4 flex flex-col items-center justify-center">
            <DonutChart
              value={stats.todayPresent}
              total={stats.todayPresent + stats.todayAbsent}
              color="#10B981"
              label="Present"
            />
            <div className="flex gap-5 mt-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#10B981' }} />
                <span className="text-[0.6875rem] text-slate-500">
                  Present: <strong>{stats.todayPresent}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#E2E8F0' }} />
                <span className="text-[0.6875rem] text-slate-500">
                  Absent: <strong>{stats.todayAbsent}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ CLASS + FEE ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <div className="portal-card">
          <div className="p-5 pb-0">
            <SectionHeader title="Class-wise Students" subtitle="Distribution" />
          </div>
          <div className="p-5 pt-4">
            {classWise.length === 0 ? (
              <div className="portal-empty">
                <div className="portal-empty-icon"><GraduationCap size={20} /></div>
                <p className="portal-empty-title">No class data</p>
                <p className="portal-empty-text">Add students to see distribution</p>
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
                        <span className="text-[0.75rem] font-medium text-slate-600">Class {c._id}</span>
                        <span className="text-[0.6875rem] font-semibold text-slate-500">
                          {c.count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full rounded-full h-2 overflow-hidden" style={{ backgroundColor: '#F1F5F9' }}>
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${pct}%`,
                            background: 'linear-gradient(90deg, #60A5FA, #2563EB)',
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

        <div className="portal-card">
          <div className="p-5 pb-0">
            <SectionHeader title="Fee Summary" href="/admin/fees" linkText="Manage" />
          </div>
          <div className="p-5 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-4 text-center" style={{ background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)', border: '1px solid #A7F3D0' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: '#A7F3D0' }}>
                  <TrendingUp size={14} style={{ color: '#059669' }} />
                </div>
                <p className="text-lg font-bold tabular-nums" style={{ color: '#047857' }}>
                  ₹{stats.feeThisMonth.toLocaleString('en-IN')}
                </p>
                <p className="text-[0.625rem] font-medium mt-0.5" style={{ color: '#059669' }}>This Month</p>
              </div>
              <div className="rounded-xl p-4 text-center" style={{ background: 'linear-gradient(135deg, #F8FAFC, #F1F5F9)', border: '1px solid #E2E8F0' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: '#E2E8F0' }}>
                  <Wallet size={14} style={{ color: '#475569' }} />
                </div>
                <p className="text-lg font-bold tabular-nums" style={{ color: '#334155' }}>
                  ₹{stats.feeTotal.toLocaleString('en-IN')}
                </p>
                <p className="text-[0.625rem] font-medium mt-0.5" style={{ color: '#64748B' }}>Total</p>
              </div>
              <div className="col-span-2 rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #FEF2F2, #FFF1F2)', border: '1px solid #FECACA' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FEE2E2' }}>
                      <AlertTriangle size={16} style={{ color: '#EF4444' }} />
                    </div>
                    <div>
                      <p className="text-lg font-bold tabular-nums" style={{ color: '#DC2626' }}>
                        {stats.pendingFees}
                      </p>
                      <p className="text-[0.625rem] font-medium" style={{ color: '#F87171' }}>
                        Pending Fee Records
                      </p>
                    </div>
                  </div>
                  <Link href="/admin/fees" className="text-[0.6875rem] font-medium flex items-center gap-1" style={{ color: '#DC2626' }}>
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
          <div className="p-5 pb-0">
            <SectionHeader title="Recent Admissions" href="/admin/students" />
          </div>
          <div className="p-5 pt-3">
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
                    avatarBg="#EEF2FF"
                    avatarColor="#4F46E5"
                    title={s.userId?.name || 'Unknown'}
                    subtitle={`Class ${s.class}${s.section ? `-${s.section}` : ''} · ${s.admissionNo}`}
                    right={new Date(s.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="portal-card">
          <div className="p-5 pb-0">
            <SectionHeader title="Recent Payments" href="/admin/fees" />
          </div>
          <div className="p-5 pt-3">
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
                    avatarBg="#ECFDF5"
                    avatarColor="#059669"
                    title={f.studentId?.userId?.name || 'Unknown'}
                    subtitle={f.studentId?.admissionNo || ''}
                    right={<span style={{ color: '#059669' }}>₹{f.amount?.toLocaleString('en-IN')}</span>}
                    rightSub={f.paidAt ? new Date(f.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-3 sm:space-y-4">

          {/* ── NEW: Credit Widget ── */}
          <CreditMiniWidget credits={credits} />

          {/* ── NEW: Limit Bars ── */}
          <div className="portal-card">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[0.6875rem] font-semibold uppercase tracking-wider" style={{ color: '#94A3B8' }}>
                  Usage Limits
                </h3>
                <Link href="/admin/subscription" className="text-[0.625rem] font-medium" style={{ color: '#4F46E5' }}>
                  Manage →
                </Link>
              </div>
              <MiniLimitBar
                label="Students"
                used={limits.students.used}
                limit={limits.students.limit}
                addon={limits.students.addon}
                color="#4F46E5"
              />
              <MiniLimitBar
                label="Teachers & Staff"
                used={limits.teachers.used}
                limit={limits.teachers.limit}
                addon={limits.teachers.addon}
                color="#7C3AED"
              />
            </div>
          </div>

          {/* Subscription Card */}
          {(() => {
            const subColors = subscription.isExpired
              ? { bg: 'linear-gradient(135deg, #FEF2F2, #FFF1F2)', border: '#FECACA', iconBg: '#FEE2E2', iconColor: '#EF4444', textColor: '#991B1B', subColor: '#DC2626' }
              : subscription.isInTrial
                ? { bg: 'linear-gradient(135deg, #FFFBEB, #FFF7ED)', border: '#FDE68A', iconBg: '#FEF3C7', iconColor: '#D97706', textColor: '#92400E', subColor: '#B45309' }
                : { bg: 'linear-gradient(135deg, #ECFDF5, #F0FDF4)', border: '#A7F3D0', iconBg: '#D1FAE5', iconColor: '#059669', textColor: '#065F46', subColor: '#047857' }

            return (
              <div className="rounded-2xl overflow-hidden" style={{ background: subColors.bg, border: `1px solid ${subColors.border}` }}>
                <div className="p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: subColors.iconBg }}>
                      <Zap size={15} style={{ color: subColors.iconColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.8125rem] font-semibold" style={{ color: subColors.textColor }}>
                        {subscription.isExpired
                          ? 'Subscription Expired'
                          : subscription.isInTrial
                            ? `Free Trial — ${subscription.daysLeft} days left`
                            : `${planConfig?.name || subscription.plan} Plan`}
                      </p>
                      {subscription.validTill && (
                        <p className="text-[0.625rem]" style={{ color: subColors.subColor }}>
                          {subscription.isExpired
                            ? 'Please renew to continue'
                            : `Valid till: ${subscription.validTill}`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Trial progress */}
                  {subscription.isInTrial && subscription.daysLeft !== null && (
                    <div className="mb-3">
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#FEF3C7' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.max(5, ((60 - subscription.daysLeft) / 60) * 100)}%`,
                            background: 'linear-gradient(90deg, #FBBF24, #F59E0B)',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <Link
                    href="/admin/subscription"
                    className="inline-flex items-center gap-1.5 text-[0.75rem] font-semibold px-3.5 py-1.5 rounded-lg"
                    style={
                      subscription.isExpired
                        ? { backgroundColor: '#DC2626', color: '#fff' }
                        : subscription.isInTrial
                          ? { backgroundColor: '#D97706', color: '#fff' }
                          : { backgroundColor: 'rgba(255,255,255,0.7)', color: '#065F46', border: '1px solid #A7F3D0' }
                    }
                  >
                    {subscription.isExpired
                      ? 'Subscribe Now'
                      : subscription.isInTrial
                        ? 'Upgrade Plan'
                        : 'Manage'}
                    <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            )
          })()}

          {/* Quick Actions */}
          <div className="portal-card">
            <div className="p-4">
              <h3 className="text-[0.6875rem] font-semibold uppercase tracking-wider mb-2.5" style={{ color: '#94A3B8' }}>
                Quick Actions
              </h3>
              <div className="space-y-0.5">
                {[
                  { label: 'Add Student', href: '/admin/students?action=add', icon: Plus, iconColor: '#4F46E5', hoverBg: '#EEF2FF' },
                  { label: 'Post Notice', href: '/admin/notices?action=add', icon: Bell, iconColor: '#2563EB', hoverBg: '#EFF6FF' },
                  { label: 'Schedule Exam', href: '/admin/exams?action=add', icon: BookOpen, iconColor: '#EA580C', hoverBg: '#FFF7ED' },
                  { label: 'View Reports', href: '/admin/reports', icon: BarChart2, iconColor: '#059669', hoverBg: '#ECFDF5' },
                  { label: 'Send Message', href: '/admin/communication', icon: MessageSquare, iconColor: '#7C3AED', hoverBg: '#F5F3FF' },
                ].map(a => (
                  <Link
                    key={a.label}
                    href={a.href}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[0.8125rem] text-slate-600 hover:text-slate-800 transition-all group"
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = a.hoverBg }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F8FAFC' }}>
                      <a.icon size={13} style={{ color: a.iconColor }} />
                    </div>
                    <span className="flex-1 font-medium">{a.label}</span>
                    <ArrowRight size={11} className="text-slate-300 group-hover:text-slate-500 transition-all" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Notices */}
          {recentNotices.length > 0 && (
            <div className="portal-card">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[0.6875rem] font-semibold uppercase tracking-wider" style={{ color: '#94A3B8' }}>
                    Notices
                  </h3>
                  <Link href="/admin/notices" className="text-[0.625rem] font-medium" style={{ color: '#2563EB' }}>
                    All
                  </Link>
                </div>
                <div className="space-y-2.5">
                  {recentNotices.map((n: any, idx: number) => (
                    <div key={n._id} className="flex items-start gap-2.5">
                      <div className="flex flex-col items-center mt-1 flex-shrink-0">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#60A5FA' }} />
                        {idx < recentNotices.length - 1 && (
                          <div className="w-px h-full mt-1" style={{ backgroundColor: '#F1F5F9' }} />
                        )}
                      </div>
                      <div className="pb-2">
                        <p className="text-[0.8125rem] text-slate-700 font-medium line-clamp-1">
                          {n.title}
                        </p>
                        <p className="text-[0.625rem] text-slate-400 mt-0.5 flex items-center gap-1">
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
  )
}