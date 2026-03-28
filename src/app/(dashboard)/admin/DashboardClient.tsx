'use client'

import Link from 'next/link'
import { PLANS } from '@/lib/plans'
import type { PlanId } from '@/lib/plans'
import {
    Users, UserCheck, CheckSquare, CreditCard,
    Bell, TrendingUp, Plus, Calendar, FileText,
    ArrowRight, Clock, AlertTriangle, Zap,
    BarChart2, BookOpen,
} from 'lucide-react'

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

/* ── Mini Bar Chart (Pure CSS) ── */
function MiniBarChart({ data }: { data: Array<{ date: string; present: number; total: number }> }) {
    const maxVal = Math.max(...data.map(d => d.total), 1)

    return (
        <div className="flex items-end gap-1.5 h-28">
            {data.map((d, i) => {
                const pct = d.total > 0 ? (d.present / d.total) * 100 : 0
                const height = d.total > 0 ? Math.max((d.total / maxVal) * 100, 8) : 4
                const dayLabel = new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' })

                return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] text-slate-400 font-medium">
                            {d.total > 0 ? `${Math.round(pct)}%` : '—'}
                        </span>
                        <div className="w-full relative rounded-t-md overflow-hidden bg-slate-100" style={{ height: `${height}%` }}>
                            <div
                                className="absolute bottom-0 left-0 right-0 rounded-t-md transition-all duration-500"
                                style={{
                                    height: `${pct}%`,
                                    background: pct >= 80 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444',
                                }}
                            />
                        </div>
                        <span className="text-[9px] text-slate-400">{dayLabel}</span>
                    </div>
                )
            })}
        </div>
    )
}

/* ── Donut Chart (SVG) ── */
function DonutChart({ value, total, color, label }: { value: number; total: number; color: string; label: string }) {
    const pct = total > 0 ? (value / total) * 100 : 0
    const radius = 36
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (pct / 100) * circumference

    return (
        <div className="flex flex-col items-center">
            <svg width="88" height="88" viewBox="0 0 88 88">
                <circle cx="44" cy="44" r={radius} fill="none" stroke="#F1F5F9" strokeWidth="8" />
                <circle
                    cx="44" cy="44" r={radius} fill="none"
                    stroke={color} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    transform="rotate(-90 44 44)"
                    className="transition-all duration-700"
                />
                <text x="44" y="40" textAnchor="middle" className="text-lg font-bold" fill="#0F172A">
                    {Math.round(pct)}%
                </text>
                <text x="44" y="54" textAnchor="middle" className="text-[10px]" fill="#94A3B8">
                    {label}
                </text>
            </svg>
        </div>
    )
}

/* ── Stat Card ── */
function StatBox({
    label, value, icon, color, subtext, href,
}: {
    label: string; value: string | number; icon: React.ReactNode
    color: string; subtext?: string; href?: string
}) {
    const colorMap: Record<string, { bg: string; icon: string; border: string }> = {
        indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'border-indigo-100' },
        emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100' },
        amber: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-100' },
        red: { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-red-100' },
        blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100' },
        purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-100' },
    }
    const c = colorMap[color] || colorMap.indigo

    const content = (
        <div className={`bg-white rounded-2xl border ${c.border} p-4 hover:shadow-md transition-shadow group`}>
            <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${c.bg}`}>
                    <span className={c.icon}>{icon}</span>
                </div>
                {href && <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors mt-1" />}
            </div>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            {subtext && <p className="text-[10px] text-slate-400 mt-1">{subtext}</p>}
        </div>
    )

    return href ? <Link href={href}>{content}</Link> : content
}

/* ── Main Dashboard ── */
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
        <div className="space-y-6 pb-8">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">
                        {greeting}, {userName} 👋
                    </h1>
                    <p className="text-sm text-slate-400 mt-0.5">{today}</p>
                </div>
                <div className="flex gap-2">
                    <Link
                        href="/admin/students?action=add"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Plus size={14} /> Add Student
                    </Link>
                    <Link
                        href="/admin/attendance"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-700 text-sm font-medium rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                        <CheckSquare size={14} /> Attendance
                    </Link>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatBox
                    label="Total Students"
                    value={stats.totalStudents}
                    icon={<Users size={18} />}
                    color="indigo"
                    href="/admin/students"
                />
                <StatBox
                    label="Teachers"
                    value={stats.totalTeachers}
                    icon={<UserCheck size={18} />}
                    color="blue"
                    href="/admin/teachers"
                />
                <StatBox
                    label="Today's Attendance"
                    value={`${stats.attendancePct}%`}
                    icon={<CheckSquare size={18} />}
                    color="emerald"
                    subtext={`${stats.todayPresent} present · ${stats.todayAbsent} absent`}
                    href="/admin/attendance"
                />
                <StatBox
                    label="Pending Fees"
                    value={stats.pendingFees}
                    icon={<CreditCard size={18} />}
                    color={stats.pendingFees > 0 ? 'red' : 'emerald'}
                    subtext={`₹${stats.feeThisMonth.toLocaleString('en-IN')} collected this month`}
                    href="/admin/fees"
                />
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Attendance Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-800">Attendance — Last 7 Days</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Daily attendance percentage</p>
                        </div>
                        <Link href="/admin/attendance" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                            View all <ArrowRight size={10} />
                        </Link>
                    </div>
                    {attendanceChart.some(d => d.total > 0) ? (
                        <MiniBarChart data={attendanceChart} />
                    ) : (
                        <div className="h-28 flex items-center justify-center text-sm text-slate-400">
                            No attendance data yet
                        </div>
                    )}
                </div>

                {/* Today's Snapshot */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col items-center justify-center">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4 self-start">Today&apos;s Snapshot</h3>
                    <DonutChart
                        value={stats.todayPresent}
                        total={stats.todayPresent + stats.todayAbsent}
                        color="#10B981"
                        label="Present"
                    />
                    <div className="flex gap-6 mt-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Present: {stats.todayPresent}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-200" /> Absent: {stats.todayAbsent}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Middle Row — Class Distribution + Fee Summary ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Class-wise Students */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <h3 className="text-sm font-semibold text-slate-800 mb-3">Class-wise Students</h3>
                    {classWise.length === 0 ? (
                        <p className="text-sm text-slate-400 py-4 text-center">No data</p>
                    ) : (
                        <div className="space-y-2">
                            {classWise.map(c => {
                                const pct = stats.totalStudents > 0
                                    ? Math.round((c.count / stats.totalStudents) * 100)
                                    : 0
                                return (
                                    <div key={c._id} className="flex items-center gap-3">
                                        <span className="text-xs text-slate-500 w-16 flex-shrink-0">Class {c._id}</span>
                                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-medium text-slate-700 w-8 text-right">{c.count}</span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Fee Summary */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-slate-800">Fee Summary</h3>
                        <Link href="/admin/fees" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                            Manage <ArrowRight size={10} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-emerald-50 rounded-xl p-3.5 text-center">
                            <p className="text-lg font-bold text-emerald-700">₹{stats.feeThisMonth.toLocaleString('en-IN')}</p>
                            <p className="text-[10px] text-emerald-600 mt-0.5">This Month</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3.5 text-center">
                            <p className="text-lg font-bold text-slate-700">₹{stats.feeTotal.toLocaleString('en-IN')}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Total Collected</p>
                        </div>
                        <div className="bg-red-50 rounded-xl p-3.5 text-center col-span-2">
                            <p className="text-lg font-bold text-red-600">{stats.pendingFees}</p>
                            <p className="text-[10px] text-red-500 mt-0.5">Pending Fee Records</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Recent Activity Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Recent Admissions */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-slate-800">Recent Admissions</h3>
                        <Link href="/admin/students" className="text-xs text-indigo-600 hover:underline">View all</Link>
                    </div>
                    {recentStudents.length === 0 ? (
                        <p className="text-sm text-slate-400 py-6 text-center">No students yet</p>
                    ) : (
                        <div className="space-y-2.5">
                            {recentStudents.map((s: any) => (
                                <div key={s._id} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-semibold text-xs flex-shrink-0">
                                        {(s.userId?.name || 'S').charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-slate-700 truncate">{s.userId?.name || 'Unknown'}</p>
                                        <p className="text-[10px] text-slate-400">Class {s.class}{s.section ? `-${s.section}` : ''} · {s.admissionNo}</p>
                                    </div>
                                    <span className="text-[10px] text-slate-400 flex-shrink-0">
                                        {new Date(s.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Payments */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-slate-800">Recent Payments</h3>
                        <Link href="/admin/fees" className="text-xs text-indigo-600 hover:underline">View all</Link>
                    </div>
                    {recentFees.length === 0 ? (
                        <p className="text-sm text-slate-400 py-6 text-center">No payments yet</p>
                    ) : (
                        <div className="space-y-2.5">
                            {recentFees.map((f: any) => (
                                <div key={f._id} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
                                        <CreditCard size={14} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-slate-700 truncate">
                                            {f.studentId?.userId?.name || 'Unknown'}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                            {f.studentId?.admissionNo || ''}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-sm font-semibold text-emerald-600">₹{f.amount?.toLocaleString('en-IN')}</p>
                                        <p className="text-[10px] text-slate-400">
                                            {f.paidAt ? new Date(f.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions + Notices */}
                <div className="space-y-4">

                    {/* Subscription Card */}
                    <div className={`rounded-2xl border p-4 ${
                        subscription.isExpired ? 'bg-red-50 border-red-200'
                            : subscription.isInTrial ? 'bg-amber-50 border-amber-200'
                                : 'bg-emerald-50 border-emerald-200'
                    }`}>
                        <div className="flex items-center gap-2 mb-2">
                            <Zap size={14} className={
                                subscription.isExpired ? 'text-red-600'
                                    : subscription.isInTrial ? 'text-amber-600'
                                        : 'text-emerald-600'
                            } />
                            <span className="text-xs font-semibold" style={{
                                color: subscription.isExpired ? '#991B1B'
                                    : subscription.isInTrial ? '#92400E'
                                        : '#065F46'
                            }}>
                                {subscription.isExpired ? 'Subscription Expired'
                                    : subscription.isInTrial ? `Free Trial — ${subscription.daysLeft} days left`
                                        : `${planConfig?.name || subscription.plan} Plan — Active`}
                            </span>
                        </div>
                        {subscription.validTill && (
                            <p className="text-[10px] mb-2" style={{
                                color: subscription.isExpired ? '#DC2626' : subscription.isInTrial ? '#B45309' : '#047857'
                            }}>
                                {subscription.isExpired ? 'Renew to continue' : `Valid till: ${subscription.validTill}`}
                            </p>
                        )}
                        <Link
                            href="/admin/subscription"
                            className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                                subscription.isExpired ? 'bg-red-600 text-white hover:bg-red-700'
                                    : subscription.isInTrial ? 'bg-amber-600 text-white hover:bg-amber-700'
                                        : 'bg-white/60 text-emerald-800 hover:bg-white/80 border border-emerald-300'
                            }`}
                        >
                            {subscription.isExpired ? 'Subscribe Now' : subscription.isInTrial ? 'Upgrade' : 'Manage'}
                            <ArrowRight size={10} />
                        </Link>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-4">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</h3>
                        <div className="space-y-1.5">
                            {[
                                { label: 'Add Student', href: '/admin/students?action=add', icon: Plus, color: 'text-indigo-600' },
                                { label: 'Post Notice', href: '/admin/notices?action=add', icon: Bell, color: 'text-blue-600' },
                                { label: 'Schedule Exam', href: '/admin/exams?action=add', icon: BookOpen, color: 'text-orange-600' },
                                { label: 'View Reports', href: '/admin/reports', icon: BarChart2, color: 'text-emerald-600' },
                            ].map(a => (
                                <Link
                                    key={a.label}
                                    href={a.href}
                                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors group"
                                >
                                    <a.icon size={14} className={`${a.color} opacity-70 group-hover:opacity-100`} />
                                    <span className="flex-1">{a.label}</span>
                                    <ArrowRight size={10} className="text-slate-300 group-hover:text-slate-500" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Active Notices */}
                    {recentNotices.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-4">
                            <div className="flex items-center justify-between mb-2.5">
                                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notices</h3>
                                <Link href="/admin/notices" className="text-[10px] text-indigo-600 hover:underline">All</Link>
                            </div>
                            {recentNotices.map((n: any) => (
                                <div key={n._id} className="flex items-start gap-2 mb-2 last:mb-0">
                                    <Bell size={12} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-700 font-medium line-clamp-1">{n.title}</p>
                                        <p className="text-[10px] text-slate-400">
                                            {new Date(n.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}