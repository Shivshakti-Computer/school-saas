/* ============================================================
   FILE: src/app/(dashboard)/admin/page.tsx
   Admin Dashboard — stats + quick actions
   ============================================================ */

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Student } from '@/models/Student'
import { User } from '@/models/User'
import { Fee } from '@/models/Fee'
import { Attendance } from '@/models/Attendance'
import { Notice } from '@/models/Notice'
import { StatCard } from '@/components/ui'
import {
    Users, CheckSquare, CreditCard,
    Bell, TrendingUp,
} from 'lucide-react'

async function getStats(tenantId: string) {
    await connectDB()
    const today = new Date().toISOString().split('T')[0]

    const [students, teachers, todayPresent, pendingFees, unreadNotices] =
        await Promise.all([
            Student.countDocuments({ tenantId, status: 'active' }),
            User.countDocuments({ tenantId, role: 'teacher', isActive: true }),
            Attendance.countDocuments({ tenantId, date: today, status: 'present' }),
            Fee.countDocuments({ tenantId, status: 'pending' }),
            Notice.countDocuments({ tenantId, isActive: true }),
        ])

    return { students, teachers, todayPresent, pendingFees, unreadNotices }
}

export default async function AdminDashboard() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') redirect('/login')

    const stats = await getStats(session.user.tenantId)
    const attendancePct = stats.students
        ? Math.round((stats.todayPresent / stats.students) * 100)
        : 0
    const today = new Date().toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-slate-800">
                    Namaste, {session.user.name?.split(' ')[0]} 👋
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">{today}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                    label="Total Students"
                    value={stats.students}
                    icon={<Users size={20} />}
                    color="indigo"
                />
                <StatCard
                    label="Teachers"
                    value={stats.teachers}
                    icon={<Users size={20} />}
                    color="blue"
                />
                <StatCard
                    label={`Today Present (${attendancePct}%)`}
                    value={stats.todayPresent}
                    icon={<CheckSquare size={20} />}
                    color="emerald"
                />
                <StatCard
                    label="Pending Fees"
                    value={stats.pendingFees}
                    icon={<CreditCard size={20} />}
                    color="amber"
                />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    Quick Actions
                </p>
                <div className="flex flex-wrap gap-2">
                    {[
                        { label: '+ Add Student', href: '/admin/students?action=add' },
                        { label: 'Mark Attendance', href: '/admin/attendance' },
                        { label: 'Post Notice', href: '/admin/notices?action=add' },
                        { label: 'Record Fee', href: '/admin/fees' },
                        { label: 'Schedule Exam', href: '/admin/exams?action=add' },
                    ].map(a => (
                        <a
                            key={a.label}
                            href={a.href}
                            className="px-3 py-1.5 text-sm bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-lg border border-slate-200 hover:border-indigo-200 transition-colors"
                        >
                            {a.label}
                        </a>
                    ))}
                </div>
            </div>

            {/* Notice count */}
            {stats.unreadNotices > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
                    <Bell size={18} className="text-blue-500 flex-shrink-0" />
                    <p className="text-sm text-blue-700">
                        <strong>{stats.unreadNotices}</strong> active notice(s) published
                    </p>
                    <a href="/admin/notices" className="ml-auto text-xs text-blue-600 underline">
                        View
                    </a>
                </div>
            )}
        </div>
    )
}