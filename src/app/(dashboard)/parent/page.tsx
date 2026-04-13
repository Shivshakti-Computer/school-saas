// -------------------------------------------------------------
// FILE: src/app/(dashboard)/parent/page.tsx  — COMPLETE REWRITE
// -------------------------------------------------------------
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { Student } from '@/models/Student'
import { Fee } from '@/models/Fee'
import { Attendance } from '@/models/Attendance'
import { Notice } from '@/models/Notice'
import { Result } from '@/models/Exam'
import Link from 'next/link'

export default async function ParentDashboard() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'parent') redirect('/login')

    await connectDB()

    const parentUser = await User.findById(session.user.id).lean() as any
    const student = parentUser?.studentRef
        ? await Student.findOne({
            _id: parentUser.studentRef,
            tenantId: session.user.tenantId,
        }).populate('userId', 'name phone').lean() as any
        : null

    const today = new Date().toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })

    if (!student) {
        return (
            <div className="space-y-5">
                <div>
                    <h1 className="text-xl font-semibold text-slate-800">
                        Namaste, {session.user.name?.split(' ')[0]} 👋
                    </h1>
                    <p className="text-sm text-slate-400 mt-0.5">{today}</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
                    <p className="text-amber-700 font-medium">Aapka account kisi student se link nahi hai</p>
                    <p className="text-amber-600 text-sm mt-1">School admin se contact karein</p>
                </div>
            </div>
        )
    }

    const thisMonth = new Date().toISOString().slice(0, 7)
    const [year, mon] = thisMonth.split('-')
    const studentId = student._id

    const [pendingFees, monthAttendance, latestResult, notices, todayAttendance] =
        await Promise.all([
            Fee.find({
                tenantId: session.user.tenantId,
                studentId,
                status: 'pending',
            }).populate('structureId', 'name').lean(),

            Attendance.find({
                tenantId: session.user.tenantId,
                studentId,
                date: { $gte: `${year}-${mon}-01`, $lte: `${year}-${mon}-31` },
            }).sort({ date: -1 }).lean(),

            Result.findOne({
                tenantId: session.user.tenantId,
                studentId,
            }).populate('examId', 'name').sort({ createdAt: -1 }).lean() as any,

            Notice.find({
                tenantId: session.user.tenantId,
                isActive: true,
                $or: [{ targetRole: 'all' }, { targetRole: 'parent' }],
            }).sort({ publishedAt: -1 }).limit(3).lean(),

            Attendance.findOne({
                tenantId: session.user.tenantId,
                studentId,
                date: new Date().toISOString().split('T')[0],
            }).lean(),
        ])

    const presentDays = monthAttendance.filter(a => a.status === 'present').length
    const attPct = monthAttendance.length > 0
        ? Math.round((presentDays / monthAttendance.length) * 100) : 0

    const totalDue = (pendingFees as any[]).reduce((s, f) => s + f.finalAmount, 0)

    return (
        <div className="space-y-5">
            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold text-slate-800">
                    Namaste, {session.user.name?.split(' ')[0]} 👋
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">{today}</p>
            </div>

            {/* Child info card */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-white">
                <p className="text-amber-100 text-xs mb-2 uppercase tracking-wide">Aapke Bachche Ki Jaankari</p>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                        {(student.userId as any)?.name?.charAt(0)}
                    </div>
                    <div>
                        <p className="text-lg font-semibold">{(student.userId as any)?.name}</p>
                        <p className="text-orange-100 text-sm">
                            Class {student.class} - {student.section} · Roll {student.rollNo}
                        </p>
                        <p className="text-orange-200 text-xs mt-0.5">Adm: {student.admissionNo}</p>
                    </div>
                </div>

                {/* Today's attendance badge */}
                {todayAttendance && (
                    <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${(todayAttendance as any).status === 'present'
                            ? 'bg-white/20 text-white'
                            : 'bg-red-900/30 text-red-100'
                        }`}>
                        <span>{(todayAttendance as any).status === 'present' ? '✓' : '✗'}</span>
                        Aaj: {(todayAttendance as any).status === 'present' ? 'School mein hai' : 'Absent'}
                    </div>
                )}
            </div>

            {/* Pending fee alert */}
            {(pendingFees as any[]).length > 0 && (
                <Link href="/parent/fees">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 hover:bg-red-100 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-red-800">
                                    ₹{totalDue.toLocaleString('en-IN')} pending
                                </p>
                                <p className="text-xs text-red-600 mt-0.5">
                                    {(pendingFees as any[]).length} fee(s) — abhi pay karein
                                </p>
                            </div>
                            <span className="text-red-600 font-medium text-sm">Pay Now →</span>
                        </div>
                    </div>
                </Link>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                <div className={`rounded-xl p-4 border ${attPct >= 75 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                    <p className={`text-2xl font-bold ${attPct >= 75 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {attPct}%
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Attendance</p>
                    <p className="text-xs text-slate-400">{presentDays}/{monthAttendance.length}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-2xl font-bold text-indigo-600">
                        {latestResult ? latestResult.grade : 'N/A'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Latest Grade</p>
                    <p className="text-xs text-slate-400 truncate">
                        {(latestResult?.examId as any)?.name ?? 'No exam'}
                    </p>
                </div>
                <div className={`rounded-xl p-4 border ${(pendingFees as any[]).length > 0 ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
                    <p className={`text-2xl font-bold ${(pendingFees as any[]).length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {(pendingFees as any[]).length}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Due Fees</p>
                </div>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-3">
                {[
                    { href: '/parent/attendance', label: "Bachche ki Attendance", icon: '✓', color: 'bg-emerald-50 text-emerald-700' },
                    { href: '/parent/fees', label: 'Fee Payment', icon: '₹', color: 'bg-amber-50 text-amber-700' },
                    { href: '/parent/results', label: 'Exam Results', icon: '📋', color: 'bg-blue-50 text-blue-700' },
                    { href: '/parent/notices', label: 'School Notices', icon: '🔔', color: 'bg-purple-50 text-purple-700' },
                    { href: '/parent/exams', label: 'Exam Schedule', icon: '🎫', color: 'bg-indigo-50 text-indigo-700' },
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
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">School Notices</p>
                        <Link href="/parent/notices" className="text-xs text-indigo-600 hover:underline">View all</Link>
                    </div>
                    <div className="space-y-3">
                        {notices.map((n: any) => (
                            <div key={n._id.toString()} className="flex gap-3">
                                <div className={`w-1.5 rounded-full flex-shrink-0 ${n.priority === 'urgent' ? 'bg-red-400' : 'bg-amber-300'}`} />
                                <div>
                                    <p className="text-sm font-medium text-slate-700">{n.title}</p>
                                    <p className="text-xs text-slate-400 line-clamp-1">{n.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}