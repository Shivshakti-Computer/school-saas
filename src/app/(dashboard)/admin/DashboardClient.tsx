// FILE: src/app/(dashboard)/admin/DashboardClient.tsx
'use client'

import Link from 'next/link'
import { PLANS } from '@/lib/plans'
import type { PlanId } from '@/lib/plans'
import {
    Users, UserCheck, CheckSquare, CreditCard,
    Bell, TrendingUp, Plus, Calendar, FileText,
    ArrowRight, Clock, AlertTriangle, Zap,
    BarChart2, BookOpen, ArrowUpRight, Activity,
    Wallet, GraduationCap,
} from 'lucide-react'

/* ── Types ── */
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
    }
    schoolName: string
    schoolCreatedAt: string
}

/* ═══════════════════════════════════════════
   COLOR CONFIG (inline styles to avoid Tailwind v4 issues)
   ═══════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════
   MINI COMPONENTS
   ═══════════════════════════════════════════ */

/* ── Animated Bar Chart ── */
function AttendanceBarChart({ data }: { data: Array<{ date: string; present: number; total: number }> }) {
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
                            className="w-full relative rounded-lg overflow-hidden group-hover:opacity-90 transition-opacity"
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

                        <span className="text-[0.625rem] text-slate-400 group-hover:text-slate-500 transition-colors font-medium">
                            {dayLabel}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}

/* ── SVG Donut Chart ── */
function DonutChart({ value, total, color, label }: { value: number; total: number; color: string; label: string }) {
    const pct = total > 0 ? (value / total) * 100 : 0
    const radius = 38
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (pct / 100) * circumference

    return (
        <div className="flex flex-col items-center group">
            <div className="relative">
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
        </div>
    )
}

/* ── Stat Card (FIXED - inline styles) ── */
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
            style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 25px -5px rgba(0,0,0,0.08)'
                e.currentTarget.style.borderColor = `${c.accent}30`
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = '#E2E8F0'
            }}
        >
            {/* Top accent line */}
            <div
                className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ backgroundColor: c.accent }}
            />

            <div className="flex items-start justify-between mb-3">
                {/* Icon */}
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300"
                    style={{ backgroundColor: c.iconBg }}
                >
                    <span style={{ color: c.iconColor }}>{icon}</span>
                </div>

                {href && (
                    <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                        style={{ backgroundColor: '#F8FAFC' }}
                    >
                        <ArrowUpRight size={13} style={{ color: '#94A3B8' }} />
                    </div>
                )}
            </div>

            {/* Value */}
            <p className="text-2xl sm:text-[1.75rem] font-extrabold tracking-tight leading-none" style={{ color: '#0F172A' }}>
                {value}
            </p>

            {/* Label */}
            <p className="text-xs font-medium mt-1" style={{ color: '#94A3B8' }}>{label}</p>

            {/* Subtext */}
            {subtext && (
                <p className="text-[0.625rem] mt-1.5 flex items-center gap-1" style={{ color: '#CBD5E1' }}>
                    <Activity size={9} />
                    {subtext}
                </p>
            )}
        </div>
    )

    return href ? <Link href={href} className="block">{content}</Link> : content
}

/* ── Section Header ── */
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
                <Link
                    href={href}
                    className="inline-flex items-center gap-1 text-[0.6875rem] font-medium transition-colors group"
                    style={{ color: '#2563EB' }}
                >
                    {linkText || 'View all'}
                    <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
            )}
        </div>
    )
}

/* ── List Item ── */
function ListItem({
    avatar, avatarBg, avatarColor,
    title, subtitle,
    right, rightSub,
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
        <div className="flex items-center gap-3 py-2 px-1 rounded-lg hover:bg-slate-50 transition-colors -mx-1 group">
            <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 group-hover:scale-105 transition-transform duration-200"
                style={{ backgroundColor: avatarBg, color: avatarColor }}
            >
                {avatar}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[0.8125rem] font-medium text-slate-700 truncate leading-tight">
                    {title}
                </p>
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


/* ═══════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
   ═══════════════════════════════════════════ */

export function AdminDashboardClient({ data, userName }: { data: DashboardData; userName: string }) {
    const { stats, recentStudents, recentFees, recentNotices, attendanceChart, classWise, subscription } = data

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
                        <Calendar size={12} />
                        {today}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link
                        href="/admin/students?action=add"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[0.8125rem] font-semibold rounded-xl active:scale-[0.98] transition-all"
                        style={{
                            backgroundColor: '#2563EB',
                            color: '#FFFFFF',
                            boxShadow: '0 1px 3px rgba(37,99,235,0.3)',
                        }}
                    >
                        <Plus size={15} strokeWidth={2.5} />
                        <span className="hidden sm:inline">Add Student</span>
                        <span className="sm:hidden">Add</span>
                    </Link>
                    <Link
                        href="/admin/attendance"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[0.8125rem] font-semibold rounded-xl active:scale-[0.98] transition-all"
                        style={{
                            backgroundColor: '#FFFFFF',
                            color: '#475569',
                            border: '1px solid #E2E8F0',
                        }}
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
                />
                <StatCard
                    label="Teachers"
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

                {/* Attendance Chart */}
                <div className="lg:col-span-2 portal-card">
                    <div className="p-5 pb-0">
                        <SectionHeader
                            title="Attendance Trend"
                            subtitle="Last 7 days performance"
                            href="/admin/attendance"
                            linkText="Details"
                        />
                    </div>
                    <div className="p-5 pt-4">
                        {attendanceChart.some(d => d.total > 0) ? (
                            <AttendanceBarChart data={attendanceChart} />
                        ) : (
                            <div className="portal-empty">
                                <div className="portal-empty-icon">
                                    <BarChart2 size={20} />
                                </div>
                                <p className="portal-empty-title">No attendance data</p>
                                <p className="portal-empty-text">Start marking attendance to see trends here</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Today's Snapshot */}
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
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#10B981', boxShadow: '0 0 4px rgba(16,185,129,0.4)' }} />
                                <span className="text-[0.6875rem] text-slate-500">
                                    Present: <strong className="text-slate-700">{stats.todayPresent}</strong>
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#E2E8F0' }} />
                                <span className="text-[0.6875rem] text-slate-500">
                                    Absent: <strong className="text-slate-700">{stats.todayAbsent}</strong>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* ═══ CLASS DISTRIBUTION + FEE SUMMARY ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">

                {/* Class-wise */}
                <div className="portal-card">
                    <div className="p-5 pb-0">
                        <SectionHeader title="Class-wise Students" subtitle="Distribution across classes" />
                    </div>
                    <div className="p-5 pt-4">
                        {classWise.length === 0 ? (
                            <div className="portal-empty">
                                <div className="portal-empty-icon"><GraduationCap size={20} /></div>
                                <p className="portal-empty-title">No class data</p>
                                <p className="portal-empty-text">Add students to see class distribution</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {classWise.map((c, idx) => {
                                    const pct = stats.totalStudents > 0
                                        ? Math.round((c.count / stats.totalStudents) * 100) : 0
                                    return (
                                        <div key={c._id} className="group">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[0.75rem] font-medium text-slate-600">
                                                    Class {c._id}
                                                </span>
                                                <span className="text-[0.6875rem] font-semibold text-slate-500 tabular-nums">
                                                    {c.count} <span className="text-slate-300 font-normal">({pct}%)</span>
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

                {/* Fee Summary */}
                <div className="portal-card">
                    <div className="p-5 pb-0">
                        <SectionHeader title="Fee Summary" subtitle="Collection overview" href="/admin/fees" linkText="Manage Fees" />
                    </div>
                    <div className="p-5 pt-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl p-4 text-center group" style={{ background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)', border: '1px solid #A7F3D0' }}>
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform" style={{ backgroundColor: '#A7F3D0' }}>
                                    <TrendingUp size={14} style={{ color: '#059669' }} />
                                </div>
                                <p className="text-lg font-bold tabular-nums" style={{ color: '#047857' }}>
                                    ₹{stats.feeThisMonth.toLocaleString('en-IN')}
                                </p>
                                <p className="text-[0.625rem] font-medium mt-0.5" style={{ color: '#059669' }}>This Month</p>
                            </div>

                            <div className="rounded-xl p-4 text-center group" style={{ background: 'linear-gradient(135deg, #F8FAFC, #F1F5F9)', border: '1px solid #E2E8F0' }}>
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform" style={{ backgroundColor: '#E2E8F0' }}>
                                    <Wallet size={14} style={{ color: '#475569' }} />
                                </div>
                                <p className="text-lg font-bold tabular-nums" style={{ color: '#334155' }}>
                                    ₹{stats.feeTotal.toLocaleString('en-IN')}
                                </p>
                                <p className="text-[0.625rem] font-medium mt-0.5" style={{ color: '#64748B' }}>Total Collected</p>
                            </div>

                            <div className="col-span-2 rounded-xl p-4 group" style={{ background: 'linear-gradient(135deg, #FEF2F2, #FFF1F2)', border: '1px solid #FECACA' }}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: '#FEE2E2' }}>
                                            <AlertTriangle size={16} style={{ color: '#EF4444' }} />
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold tabular-nums" style={{ color: '#DC2626' }}>{stats.pendingFees}</p>
                                            <p className="text-[0.625rem] font-medium" style={{ color: '#F87171' }}>Pending Fee Records</p>
                                        </div>
                                    </div>
                                    <Link href="/admin/fees" className="text-[0.6875rem] font-medium flex items-center gap-1 transition-colors" style={{ color: '#DC2626' }}>
                                        View <ArrowRight size={10} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* ═══ RECENT ACTIVITY ROW ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">

                {/* Recent Admissions */}
                <div className="portal-card">
                    <div className="p-5 pb-0">
                        <SectionHeader title="Recent Admissions" href="/admin/students" />
                    </div>
                    <div className="p-5 pt-3">
                        {recentStudents.length === 0 ? (
                            <div className="portal-empty">
                                <div className="portal-empty-icon"><Users size={20} /></div>
                                <p className="portal-empty-title">No students yet</p>
                                <p className="portal-empty-text">Add your first student to get started</p>
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
                                        right={
                                            <span style={{ color: '#059669' }}>
                                                ₹{f.amount?.toLocaleString('en-IN')}
                                            </span>
                                        }
                                        rightSub={
                                            f.paidAt
                                                ? new Date(f.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                                                : ''
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions + Subscription + Notices */}
                <div className="space-y-3 sm:space-y-4">

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
                                                        ? 'Free Trial'
                                                        : `${planConfig?.name || subscription.plan} Plan`}
                                            </p>
                                            {subscription.validTill && (
                                                <p className="text-[0.625rem]" style={{ color: subColors.subColor }}>
                                                    {subscription.isExpired ? 'Please renew to continue' : `Valid till: ${subscription.validTill}`}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Trial Progress */}
                                    {subscription.isInTrial && subscription.daysLeft !== null && (
                                        <div className="mb-3">
                                            <div className="flex justify-between text-[0.625rem] mb-1">
                                                <span style={{ color: '#D97706' }} className="font-medium">{subscription.daysLeft} days left</span>
                                                <span style={{ color: '#F59E0B' }}>14 days total</span>
                                            </div>
                                            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#FEF3C7' }}>
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${Math.max(5, ((14 - (subscription.daysLeft || 0)) / 14) * 100)}%`,
                                                        background: 'linear-gradient(90deg, #FBBF24, #F59E0B)',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <Link
                                        href="/admin/subscription"
                                        className="inline-flex items-center gap-1.5 text-[0.75rem] font-semibold px-3.5 py-1.5 rounded-lg transition-all active:scale-[0.98]"
                                        style={
                                            subscription.isExpired
                                                ? { backgroundColor: '#DC2626', color: '#FFFFFF', boxShadow: '0 1px 3px rgba(220,38,38,0.3)' }
                                                : subscription.isInTrial
                                                    ? { backgroundColor: '#D97706', color: '#FFFFFF', boxShadow: '0 1px 3px rgba(217,119,6,0.3)' }
                                                    : { backgroundColor: 'rgba(255,255,255,0.7)', color: '#065F46', border: '1px solid #A7F3D0' }
                                        }
                                    >
                                        {subscription.isExpired ? 'Subscribe Now' : subscription.isInTrial ? 'Upgrade Plan' : 'Manage'}
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
                                ].map(a => (
                                    <Link
                                        key={a.label}
                                        href={a.href}
                                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[0.8125rem] text-slate-600 hover:text-slate-800 transition-all group"
                                        style={{ }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = a.hoverBg }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                                    >
                                        <div
                                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all group-hover:shadow-sm"
                                            style={{ backgroundColor: '#F8FAFC' }}
                                        >
                                            <a.icon size={13} style={{ color: a.iconColor, opacity: 0.8 }} />
                                        </div>
                                        <span className="flex-1 font-medium">{a.label}</span>
                                        <ArrowRight size={11} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
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
                                    <Link href="/admin/notices" className="text-[0.625rem] font-medium transition-colors" style={{ color: '#2563EB' }}>
                                        All
                                    </Link>
                                </div>
                                <div className="space-y-2.5">
                                    {recentNotices.map((n: any, idx: number) => (
                                        <div key={n._id} className="flex items-start gap-2.5 group">
                                            <div className="flex flex-col items-center mt-1 flex-shrink-0">
                                                <div
                                                    className="w-2 h-2 rounded-full group-hover:scale-125 transition-transform"
                                                    style={{ backgroundColor: '#60A5FA', boxShadow: '0 0 4px rgba(96,165,250,0.4)' }}
                                                />
                                                {idx < recentNotices.length - 1 && (
                                                    <div className="w-px h-full mt-1" style={{ backgroundColor: '#F1F5F9' }} />
                                                )}
                                            </div>
                                            <div className="pb-2">
                                                <p className="text-[0.8125rem] text-slate-700 font-medium line-clamp-1 leading-tight group-hover:text-blue-700 transition-colors">
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