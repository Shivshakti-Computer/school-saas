// FILE: src/app/(dashboard)/teacher/page.tsx
// ✅ Production-ready Teacher Dashboard
// Shows: assigned classes, subjects, today's attendance summary, quick actions

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Attendance } from '@/models/Attendance'
import { Student } from '@/models/Student'
import '@/models/User'
import {
    CheckSquare, BookOpen, Users, FileText,
    Bell, Clock, GraduationCap, ChevronRight,
} from 'lucide-react'
import Link from 'next/link'

// ── Scoped Stats ──
async function getTeacherStats(
    tenantId: string,
    userId: string,
    teacherClasses: string[],
    teacherSections: string[]
) {
    const today = new Date().toISOString().split('T')[0]

    // Build student filter
    const studentFilter: any = {
        tenantId,
        status: 'active',
    }
    if (teacherClasses.length > 0) {
        studentFilter.class = { $in: teacherClasses }
    }
    if (teacherSections.length > 0) {
        studentFilter.section = { $in: teacherSections }
    }

    const [totalStudents, markedToday] = await Promise.all([
        teacherClasses.length > 0
            ? Student.countDocuments(studentFilter)
            : Promise.resolve(0),
        Attendance.countDocuments({
            tenantId,
            markedBy: userId,
            date: today,
        }),
    ])

    return { totalStudents, markedToday, today }
}

export default async function TeacherDashboard() {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'teacher') {
        redirect('/login')
    }

    await connectDB()

    const {
        id: userId,
        tenantId,
        name,
        teacherClasses = [],
        teacherSections = [],
        teacherSubjects = [],
        isClassTeacher = false,
        classTeacherOf,
        allowedModules = [],
    } = session.user

    const { totalStudents, markedToday, today } = await getTeacherStats(
        tenantId,
        userId,
        teacherClasses,
        teacherSections
    )

    const firstName = name?.split(' ')[0] || 'Teacher'
    const dateStr = new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    })

    // Quick actions — only show allowed modules
    const quickActions = [
        {
            key: 'attendance',
            label: 'Mark Attendance',
            href: '/teacher/attendance',
            icon: CheckSquare,
            color: 'var(--success)',
            bg: 'var(--success-light)',
            desc: 'Mark today\'s class attendance',
        },
        {
            key: 'exams',
            label: 'Enter Marks',
            href: '/teacher/marks',
            icon: BookOpen,
            color: 'var(--info)',
            bg: 'var(--info-light)',
            desc: 'Submit exam results',
        },
        {
            key: 'homework',
            label: 'Homework',
            href: '/teacher/homework',
            icon: FileText,
            color: 'var(--primary-500)',
            bg: 'var(--primary-50)',
            desc: 'Assign & review homework',
        },
        {
            key: 'notices',
            label: 'Notices',
            href: '/teacher/notices',
            icon: Bell,
            color: 'var(--warning)',
            bg: 'var(--warning-light)',
            desc: 'View & create notices',
        },
    ].filter((a) => allowedModules.includes(a.key))

    return (
        <div className="portal-content-enter space-y-5">

            {/* ── Greeting ── */}
            <div
                className="rounded-[var(--radius-lg)] p-5"
                style={{
                    background:
                        'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-800) 100%)',
                    color: '#fff',
                }}
            >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-xl font-bold">
                            Namaste, {firstName} 👋
                        </h1>
                        <p
                            className="text-sm mt-1"
                            style={{ color: 'rgba(255,255,255,0.75)' }}
                        >
                            {dateStr}
                        </p>
                        {isClassTeacher && classTeacherOf && (
                            <div
                                className="
                  inline-flex items-center gap-1.5 mt-2
                  px-2.5 py-1 rounded-[var(--radius-full)]
                  text-xs font-semibold
                "
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.18)',
                                    color: '#fff',
                                }}
                            >
                                <GraduationCap size={12} />
                                Class Teacher — Class {classTeacherOf.class}-
                                {classTeacherOf.section}
                            </div>
                        )}
                    </div>
                    <div
                        className="
              w-12 h-12 rounded-full flex items-center justify-center
              text-lg font-bold flex-shrink-0
            "
                        style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                    >
                        {firstName.charAt(0)}
                    </div>
                </div>
            </div>

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                    label="My Students"
                    value={totalStudents}
                    icon={<Users size={18} />}
                    color="primary"
                    sub={
                        teacherClasses.length > 0
                            ? `Class ${teacherClasses.join(', ')}`
                            : 'No class assigned'
                    }
                />
                <StatCard
                    label="Marked Today"
                    value={markedToday}
                    icon={<CheckSquare size={18} />}
                    color="success"
                    sub={today}
                />
                <StatCard
                    label="Subjects"
                    value={teacherSubjects.length}
                    icon={<BookOpen size={18} />}
                    color="info"
                    sub={
                        teacherSubjects.length > 0
                            ? teacherSubjects.slice(0, 2).join(', ') +
                            (teacherSubjects.length > 2 ? '...' : '')
                            : 'None assigned'
                    }
                />
                <StatCard
                    label="Sections"
                    value={teacherSections.length}
                    icon={<Clock size={18} />}
                    color="warning"
                    sub={
                        teacherSections.length > 0
                            ? `Section ${teacherSections.join(', ')}`
                            : 'Not assigned'
                    }
                />
            </div>

            {/* ── Assignment Info ── */}
            {(teacherClasses.length > 0 ||
                teacherSubjects.length > 0) && (
                    <div
                        className="portal-card rounded-[var(--radius-lg)] overflow-hidden"
                    >
                        <div className="portal-card-header">
                            <div>
                                <p className="portal-card-title">My Assignments</p>
                                <p className="portal-card-subtitle">
                                    Classes, sections & subjects assigned to you
                                </p>
                            </div>
                        </div>
                        <div className="portal-card-body grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Classes */}
                            <div>
                                <p
                                    className="text-xs font-semibold uppercase tracking-wider mb-2"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    Classes
                                </p>
                                {teacherClasses.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {teacherClasses.map((cls) => (
                                            <span
                                                key={cls}
                                                className="
                        px-2.5 py-1 rounded-[var(--radius-full)]
                        text-xs font-semibold
                      "
                                                style={{
                                                    backgroundColor: 'var(--primary-50)',
                                                    color: 'var(--primary-700)',
                                                    border: '1px solid var(--primary-200)',
                                                }}
                                            >
                                                Class {cls}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p
                                        className="text-sm"
                                        style={{ color: 'var(--text-muted)' }}
                                    >
                                        Not assigned
                                    </p>
                                )}
                            </div>

                            {/* Sections */}
                            <div>
                                <p
                                    className="text-xs font-semibold uppercase tracking-wider mb-2"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    Sections
                                </p>
                                {teacherSections.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {teacherSections.map((sec) => (
                                            <span
                                                key={sec}
                                                className="
                        px-2.5 py-1 rounded-[var(--radius-full)]
                        text-xs font-semibold
                      "
                                                style={{
                                                    backgroundColor: 'var(--success-light)',
                                                    color: 'var(--success-dark)',
                                                    border: '1px solid rgba(16,185,129,0.2)',
                                                }}
                                            >
                                                Section {sec}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p
                                        className="text-sm"
                                        style={{ color: 'var(--text-muted)' }}
                                    >
                                        Not assigned
                                    </p>
                                )}
                            </div>

                            {/* Subjects */}
                            <div>
                                <p
                                    className="text-xs font-semibold uppercase tracking-wider mb-2"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    Subjects
                                </p>
                                {teacherSubjects.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {teacherSubjects.map((sub) => (
                                            <span
                                                key={sub}
                                                className="
                        px-2.5 py-1 rounded-[var(--radius-full)]
                        text-xs font-semibold
                      "
                                                style={{
                                                    backgroundColor: 'var(--info-light)',
                                                    color: 'var(--info-dark)',
                                                    border: '1px solid rgba(59,130,246,0.2)',
                                                }}
                                            >
                                                {sub}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p
                                        className="text-sm"
                                        style={{ color: 'var(--text-muted)' }}
                                    >
                                        Not assigned
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            {/* ── Quick Actions ── */}
            {quickActions.length > 0 && (
                <div>
                    <p
                        className="text-xs font-semibold uppercase tracking-wider mb-3"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        Quick Actions
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {quickActions.map((action) => {
                            const Icon = action.icon
                            return (
                                <Link
                                    key={action.key}
                                    href={action.href}
                                    className="
                    portal-card rounded-[var(--radius-lg)]
                    p-4 flex flex-col gap-3
                    hover:shadow-md transition-all duration-200
                    hover:-translate-y-0.5
                  "
                                >
                                    <div
                                        className="
                      w-10 h-10 rounded-[var(--radius-md)]
                      flex items-center justify-center flex-shrink-0
                    "
                                        style={{
                                            backgroundColor: action.bg,
                                            color: action.color,
                                        }}
                                    >
                                        <Icon size={18} />
                                    </div>
                                    <div>
                                        <p
                                            className="text-sm font-semibold"
                                            style={{ color: 'var(--text-primary)' }}
                                        >
                                            {action.label}
                                        </p>
                                        <p
                                            className="text-xs mt-0.5"
                                            style={{ color: 'var(--text-muted)' }}
                                        >
                                            {action.desc}
                                        </p>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* ── No modules assigned ── */}
            {allowedModules.length === 0 && (
                <div
                    className="
            portal-card rounded-[var(--radius-lg)] p-8
            text-center
          "
                >
                    <div
                        className="
              w-14 h-14 rounded-[var(--radius-xl)]
              flex items-center justify-center mx-auto mb-3
            "
                        style={{
                            backgroundColor: 'var(--bg-muted)',
                            color: 'var(--text-muted)',
                        }}
                    >
                        <Clock size={24} />
                    </div>
                    <p
                        className="text-sm font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        Awaiting Module Access
                    </p>
                    <p
                        className="text-xs mt-1 max-w-xs mx-auto"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        Your administrator will assign modules to your account
                        shortly.
                    </p>
                </div>
            )}
        </div>
    )
}

// ── Reusable Stat Card ──
function StatCard({
    label, value, icon, color, sub,
}: {
    label: string
    value: number
    icon: React.ReactNode
    color: 'primary' | 'success' | 'info' | 'warning'
    sub?: string
}) {
    const colorMap = {
        primary: {
            bg: 'var(--primary-50)',
            text: 'var(--primary-600)',
            icon: 'var(--primary-500)',
        },
        success: {
            bg: 'var(--success-light)',
            text: 'var(--success-dark)',
            icon: 'var(--success)',
        },
        info: {
            bg: 'var(--info-light)',
            text: 'var(--info-dark)',
            icon: 'var(--info)',
        },
        warning: {
            bg: 'var(--warning-light)',
            text: 'var(--warning-dark)',
            icon: 'var(--warning)',
        },
    }
    const c = colorMap[color]

    return (
        <div className="portal-stat-card">
            <div className="flex items-start justify-between gap-2 mb-3">
                <div
                    className="stat-icon"
                    style={{ backgroundColor: c.bg, color: c.icon }}
                >
                    {icon}
                </div>
            </div>
            <p
                className="stat-value"
                style={{ color: 'var(--text-primary)' }}
            >
                {value}
            </p>
            <p className="stat-label">{label}</p>
            {sub && (
                <p
                    className="text-[0.6875rem] mt-1 truncate"
                    style={{ color: 'var(--text-muted)' }}
                >
                    {sub}
                </p>
            )}
        </div>
    )
}