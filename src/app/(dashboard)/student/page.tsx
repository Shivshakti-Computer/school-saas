// -------------------------------------------------------------
// FILE: src/app/(dashboard)/student/page.tsx  — COMPLETE REWRITE
// Student Dashboard — summary cards + quick info
// -------------------------------------------------------------
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Student } from '@/models/Student'
import { Fee } from '@/models/Fee'
import { Notice } from '@/models/Notice'
import { Attendance } from '@/models/Attendance'
import { Result } from '@/models/Exam'
import Link from 'next/link'

export default async function StudentDashboard() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'student') redirect('/login')

    await connectDB()

    const student = await Student.findOne({
        userId: session.user.id,
        tenantId: session.user.tenantId,
    })
        .populate('userId', 'name phone email')
        .lean() as any

    if (!student) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-slate-500">Student profile not found. Contact admin.</p>
            </div>
        )
    }

    // This month attendance
    const thisMonth = new Date().toISOString().slice(0, 7)
    const [year, mon] = thisMonth.split('-')

    const [pendingFees, totalFees, monthAttendance, latestResult, notices] =
        await Promise.all([
            Fee.countDocuments({
                tenantId: session.user.tenantId,
                studentId: student._id,
                status: 'pending',
            }),
            Fee.countDocuments({
                tenantId: session.user.tenantId,
                studentId: student._id,
            }),
            Attendance.find({
                tenantId: session.user.tenantId,
                studentId: student._id,
                date: { $gte: `${year}-${mon}-01`, $lte: `${year}-${mon}-31` },
            }).lean(),
            Result.findOne({
                tenantId: session.user.tenantId,
                studentId: student._id,
            })
                .populate('examId', 'name')
                .sort({ createdAt: -1 })
                .lean() as any,
            Notice.find({
                tenantId: session.user.tenantId,
                isActive: true,
                $or: [{ targetRole: 'all' }, { targetRole: 'student' }],
            })
                .sort({ publishedAt: -1 })
                .limit(3)
                .lean(),
        ])

    const presentCount = monthAttendance.filter(a => a.status === 'present').length
    const attPct = monthAttendance.length > 0
        ? Math.round((presentCount / monthAttendance.length) * 100) : 0

    const today = new Date().toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })

    return (
        <div className="space-y-5">
            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold text-slate-800">
                    Namaste, {(student.userId as any)?.name?.split(' ')[0]} 👋
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">{today}</p>
            </div>

            {/* Student info card */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-5 text-white">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold flex-shrink-0">
                        {(student.userId as any)?.name?.charAt(0) ?? 'S'}
                    </div>
                    <div>
                        <p className="text-lg font-semibold">{(student.userId as any)?.name}</p>
                        <p className="text-indigo-200 text-sm">
                            Class {student.class} - {student.section} · Roll No. {student.rollNo}
                        </p>
                        <p className="text-indigo-300 text-xs mt-0.5">
                            Adm. No: {student.admissionNo}
                        </p>
                    </div>
                </div>
            </div>

            {/* Pending fee alert */}
            {pendingFees > 0 && (
                <Link href="/student/fees">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 hover:bg-amber-100 transition-colors cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-amber-600 text-sm">₹</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-amber-800">
                                {pendingFees} fee payment(s) pending
                            </p>
                            <p className="text-xs text-amber-600">Due date se pehle pay karo — late fine lagega</p>
                        </div>
                        <span className="text-amber-600 text-xs font-medium">Pay Now →</span>
                    </div>
                </Link>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                    <p className={`text-2xl font-bold ${attPct >= 75 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {attPct}%
                    </p>
                    <p className="text-xs text-slate-500 mt-1">This Month Att.</p>
                    <p className="text-xs text-slate-400">{presentCount}/{monthAttendance.length} days</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-indigo-600">
                        {latestResult ? latestResult.percentage + '%' : 'N/A'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Latest Result</p>
                    <p className="text-xs text-slate-400 truncate">
                        {(latestResult?.examId as any)?.name ?? 'No exam yet'}
                    </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                    <p className={`text-2xl font-bold ${pendingFees > 0 ? 'text-amber-500' : 'text-emerald-600'}`}>
                        {pendingFees}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Pending Fees</p>
                    <p className="text-xs text-slate-400">{totalFees} total</p>
                </div>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-3">
                {[
                    { href: '/student/attendance', label: 'Attendance', icon: '✓', color: 'bg-emerald-50 text-emerald-700' },
                    { href: '/student/results', label: 'Results', icon: '📋', color: 'bg-blue-50 text-blue-700' },
                    { href: '/student/fees', label: 'Fees', icon: '₹', color: 'bg-amber-50 text-amber-700' },
                    { href: '/student/notices', label: 'Notices', icon: '🔔', color: 'bg-purple-50 text-purple-700' },
                ].map(item => (
                    <Link key={item.href} href={item.href}>
                        <div className={`${item.color} rounded-xl p-4 flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer`}>
                            <span className="text-xl">{item.icon}</span>
                            <span className="font-medium text-sm">{item.label}</span>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Recent notices */}
            {notices.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notices</p>
                        <Link href="/student/notices" className="text-xs text-indigo-600 hover:underline">
                            View all
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {notices.map((n: any) => (
                            <div key={n._id.toString()} className="flex gap-3">
                                <div className={`w-1.5 rounded-full flex-shrink-0 ${n.priority === 'urgent' ? 'bg-red-400' : 'bg-indigo-200'}`} />
                                <div>
                                    <p className="text-sm font-medium text-slate-700">{n.title}</p>
                                    <p className="text-xs text-slate-400">
                                        {new Date(n.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}