// FILE: src/app/(dashboard)/teacher/attendance/page.tsx
// ✅ Production-ready — Scoped to teacher's assigned classes/sections
// Teacher sirf apni classes ki attendance mark kar sakta hai

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
    CheckSquare, X, Clock, Users, ChevronDown,
    Save, RotateCcw, AlertCircle, Check,
    MessageSquare, Filter,
} from 'lucide-react'
import { PageHeader, Spinner, Alert, Button } from '@/components/ui'

// ── Types ──
interface AttendanceRecord {
    studentId: string
    admissionNo: string
    rollNo: string
    name: string
    status: 'present' | 'absent' | 'late' | 'pending'
    attendanceId: string | null
    smsSent: boolean
}

interface AttendanceMeta {
    class: string
    section: string | null
    present: number
    absent: number
    late: number
    pending: number
}

type AttendanceStatus = 'present' | 'absent' | 'late'

const STATUS_CONFIG: Record<
    AttendanceStatus,
    {
        label: string
        short: string
        bg: string
        text: string
        border: string
        icon: React.ReactNode
    }
> = {
    present: {
        label: 'Present',
        short: 'P',
        bg: 'var(--success-light)',
        text: 'var(--success-dark)',
        border: 'rgba(16,185,129,0.3)',
        icon: <Check size={14} />,
    },
    absent: {
        label: 'Absent',
        short: 'A',
        bg: 'var(--danger-light)',
        text: 'var(--danger-dark)',
        border: 'rgba(239,68,68,0.3)',
        icon: <X size={14} />,
    },
    late: {
        label: 'Late',
        short: 'L',
        bg: 'var(--warning-light)',
        text: 'var(--warning-dark)',
        border: 'rgba(245,158,11,0.3)',
        icon: <Clock size={14} />,
    },
}

export default function TeacherAttendancePage() {
    const { data: session } = useSession()

    // ── Teacher's assigned data from session ──
    const teacherClasses: string[] =
        (session?.user as any)?.teacherClasses || []
    const teacherSections: string[] =
        (session?.user as any)?.teacherSections || []

    // ── State ──
    const [selectedClass, setSelectedClass] = useState('')
    const [selectedSection, setSelectedSection] = useState('')
    const [date, setDate] = useState(
        new Date().toISOString().split('T')[0]
    )
    const [records, setRecords] = useState<AttendanceRecord[]>([])
    const [meta, setMeta] = useState<AttendanceMeta | null>(null)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [sendSms, setSendSms] = useState(false)
    const [alert, setAlert] = useState<{
        type: 'success' | 'error' | 'info'
        msg: string
    } | null>(null)
    const [isDirty, setIsDirty] = useState(false)

    // Auto-select first class on mount
    useEffect(() => {
        if (teacherClasses.length > 0 && !selectedClass) {
            setSelectedClass(teacherClasses[0])
        }
    }, [teacherClasses]) // eslint-disable-line

    // Auto-select first section when class changes
    useEffect(() => {
        if (teacherSections.length > 0 && !selectedSection) {
            setSelectedSection(teacherSections[0])
        }
    }, [teacherSections, selectedClass]) // eslint-disable-line

    // Auto-clear alert
    useEffect(() => {
        if (alert) {
            const t = setTimeout(() => setAlert(null), 5000)
            return () => clearTimeout(t)
        }
    }, [alert])

    // ── Fetch attendance ──
    const fetchAttendance = useCallback(async () => {
        if (!selectedClass) return
        setLoading(true)
        setIsDirty(false)

        try {
            const params = new URLSearchParams({
                class: selectedClass,
                date,
            })
            if (selectedSection) params.set('section', selectedSection)

            const res = await fetch(`/api/attendance?${params}`)
            const data = await res.json()

            if (res.ok) {
                setRecords(data.list || [])
                setMeta(data.meta || null)
            } else {
                setAlert({ type: 'error', msg: data.error || 'Failed to load' })
            }
        } catch {
            setAlert({ type: 'error', msg: 'Network error' })
        }
        setLoading(false)
    }, [selectedClass, selectedSection, date])

    useEffect(() => {
        if (selectedClass) fetchAttendance()
    }, [fetchAttendance])

    // ── Mark all ──
    const markAll = (status: AttendanceStatus) => {
        setRecords((prev) =>
            prev.map((r) => ({ ...r, status }))
        )
        setIsDirty(true)
    }

    // ── Toggle single student ──
    const toggleStatus = (studentId: string) => {
        setRecords((prev) =>
            prev.map((r) => {
                if (r.studentId !== studentId) return r
                const cycle: Record<string, AttendanceStatus> = {
                    pending: 'present',
                    present: 'absent',
                    absent: 'late',
                    late: 'present',
                }
                return { ...r, status: cycle[r.status] || 'present' }
            })
        )
        setIsDirty(true)
    }

    // ── Set specific status ──
    const setStatus = (studentId: string, status: AttendanceStatus) => {
        setRecords((prev) =>
            prev.map((r) =>
                r.studentId === studentId ? { ...r, status } : r
            )
        )
        setIsDirty(true)
    }

    // ── Save attendance ──
    const handleSave = async () => {
        const validRecords = records.filter(
            (r) => r.status !== 'pending'
        )
        if (validRecords.length === 0) {
            setAlert({
                type: 'info',
                msg: 'Please mark at least one student',
            })
            return
        }

        setSaving(true)
        try {
            const res = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date,
                    records: validRecords.map((r) => ({
                        studentId: r.studentId,
                        status: r.status,
                    })),
                    sendAbsentSms: sendSms,
                }),
            })

            const data = await res.json()

            if (res.ok) {
                setIsDirty(false)
                let msg = `Attendance saved for ${data.saved} students.`
                if (data.sms?.sent > 0) {
                    msg += ` ${data.sms.sent} SMS sent.`
                }
                if (data.sms?.creditWarning) {
                    msg += ` ⚠️ ${data.sms.creditWarning}`
                }
                setAlert({ type: 'success', msg })
                await fetchAttendance()
            } else {
                setAlert({
                    type: 'error',
                    msg: data.error || 'Failed to save',
                })
            }
        } catch {
            setAlert({ type: 'error', msg: 'Network error' })
        }
        setSaving(false)
    }

    // ── Summary counts ──
    const summary = records.reduce(
        (acc, r) => {
            if (r.status === 'present') acc.present++
            else if (r.status === 'absent') acc.absent++
            else if (r.status === 'late') acc.late++
            else acc.pending++
            return acc
        },
        { present: 0, absent: 0, late: 0, pending: 0 }
    )

    // ── No classes assigned ──
    if (teacherClasses.length === 0) {
        return (
            <div className="portal-content-enter">
                <PageHeader
                    title="Attendance"
                    subtitle="Mark daily class attendance"
                />
                <div
                    className="
            portal-card rounded-[var(--radius-lg)]
            p-10 text-center mt-4
          "
                >
                    <div
                        className="
              w-14 h-14 rounded-[var(--radius-xl)]
              flex items-center justify-center mx-auto mb-4
            "
                        style={{
                            backgroundColor: 'var(--warning-light)',
                            color: 'var(--warning)',
                        }}
                    >
                        <AlertCircle size={24} />
                    </div>
                    <p
                        className="text-sm font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        No Classes Assigned
                    </p>
                    <p
                        className="text-xs mt-1.5 max-w-xs mx-auto"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        Contact your administrator to assign classes and sections
                        to your account.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="portal-content-enter space-y-4">
            <PageHeader
                title="Attendance"
                subtitle={`Mark attendance for your assigned classes`}
                action={
                    isDirty && (
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <Spinner size="sm" />
                            ) : (
                                <Save size={14} />
                            )}
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                    )
                }
            />

            {/* ── Alert ── */}
            {alert && (
                <Alert
                    type={alert.type}
                    message={alert.msg}
                    onClose={() => setAlert(null)}
                />
            )}

            {/* ── Controls ── */}
            <div
                className="
          portal-card rounded-[var(--radius-lg)] p-4
          flex flex-wrap gap-3 items-end
        "
            >
                {/* Class selector — only teacher's classes */}
                <div className="flex flex-col gap-1">
                    <label
                        className="text-xs font-semibold"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        Class
                    </label>
                    <div className="relative">
                        <select
                            value={selectedClass}
                            onChange={(e) => {
                                setSelectedClass(e.target.value)
                                setSelectedSection('')
                            }}
                            className="
                input-clean pr-8 text-sm h-9 min-w-[100px]
              "
                        >
                            {teacherClasses.map((cls) => (
                                <option key={cls} value={cls}>
                                    Class {cls}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Section selector — only teacher's sections */}
                {teacherSections.length > 0 && (
                    <div className="flex flex-col gap-1">
                        <label
                            className="text-xs font-semibold"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            Section
                        </label>
                        <select
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                            className="input-clean text-sm h-9 min-w-[80px]"
                        >
                            <option value="">All</option>
                            {teacherSections.map((sec) => (
                                <option key={sec} value={sec}>
                                    Sec {sec}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Date */}
                <div className="flex flex-col gap-1">
                    <label
                        className="text-xs font-semibold"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        Date
                    </label>
                    <input
                        type="date"
                        value={date}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setDate(e.target.value)}
                        className="input-clean text-sm h-9"
                    />
                </div>

                {/* SMS toggle */}
                <label className="flex items-center gap-2 cursor-pointer pb-0.5">
                    <div
                        onClick={() => setSendSms((p) => !p)}
                        className="
              relative w-9 h-5 rounded-full transition-colors
              cursor-pointer flex-shrink-0
            "
                        style={{
                            backgroundColor: sendSms
                                ? 'var(--primary-500)'
                                : 'var(--border-strong)',
                        }}
                    >
                        <div
                            className="
                absolute top-0.5 w-4 h-4 rounded-full
                bg-white transition-all
              "
                            style={{
                                left: sendSms ? '18px' : '2px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            }}
                        />
                    </div>
                    <span
                        className="text-xs font-medium"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        SMS absent
                    </span>
                </label>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Bulk Mark */}
                <div className="flex gap-1.5">
                    {(
                        Object.keys(STATUS_CONFIG) as AttendanceStatus[]
                    ).map((s) => {
                        const conf = STATUS_CONFIG[s]
                        return (
                            <button
                                key={s}
                                onClick={() => markAll(s)}
                                disabled={records.length === 0}
                                className="
                  px-2.5 py-1.5 rounded-[var(--radius-sm)]
                  text-xs font-semibold border transition-all
                  disabled:opacity-40 disabled:cursor-not-allowed
                "
                                style={{
                                    backgroundColor: conf.bg,
                                    color: conf.text,
                                    borderColor: conf.border,
                                }}
                                title={`Mark all ${conf.label}`}
                            >
                                All {conf.short}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ── Summary Bar ── */}
            {records.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                    {[
                        {
                            label: 'Present',
                            count: summary.present,
                            color: 'var(--success)',
                            bg: 'var(--success-light)',
                        },
                        {
                            label: 'Absent',
                            count: summary.absent,
                            color: 'var(--danger)',
                            bg: 'var(--danger-light)',
                        },
                        {
                            label: 'Late',
                            count: summary.late,
                            color: 'var(--warning)',
                            bg: 'var(--warning-light)',
                        },
                        {
                            label: 'Pending',
                            count: summary.pending,
                            color: 'var(--text-muted)',
                            bg: 'var(--bg-muted)',
                        },
                    ].map((s) => (
                        <div
                            key={s.label}
                            className="
                portal-card rounded-[var(--radius-md)] p-3 text-center
              "
                            style={{ borderTopColor: s.color, borderTopWidth: 2 }}
                        >
                            <p
                                className="text-xl font-bold tabular-nums"
                                style={{ color: s.color }}
                            >
                                {s.count}
                            </p>
                            <p
                                className="text-xs font-medium"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                {s.label}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Student List ── */}
            <div className="portal-card rounded-[var(--radius-lg)] overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Spinner size="lg" />
                    </div>
                ) : records.length === 0 ? (
                    <div className="portal-empty">
                        <div className="portal-empty-icon">
                            <Users size={22} />
                        </div>
                        <p className="portal-empty-title">No Students Found</p>
                        <p className="portal-empty-text">
                            {selectedClass
                                ? `No active students in Class ${selectedClass}${selectedSection ? `-${selectedSection}` : ''}`
                                : 'Select a class to view students'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Table header */}
                        <div
                            className="
                grid grid-cols-12 gap-2 px-4 py-2.5
                text-xs font-bold uppercase tracking-wider
              "
                            style={{
                                backgroundColor: 'var(--bg-muted)',
                                color: 'var(--text-muted)',
                                borderBottom: '1px solid var(--border)',
                            }}
                        >
                            <div className="col-span-1">#</div>
                            <div className="col-span-1">Roll</div>
                            <div className="col-span-5 md:col-span-4">Name</div>
                            <div className="col-span-2 hidden md:block">
                                Adm. No
                            </div>
                            <div className="col-span-5 md:col-span-4">
                                Status
                            </div>
                        </div>

                        {/* Rows */}
                        <div className="divide-y divide-[var(--border)]">
                            {records.map((student, idx) => {
                                const isPending = student.status === 'pending'
                                const currentConf =
                                    STATUS_CONFIG[student.status as AttendanceStatus]

                                return (
                                    <div
                                        key={student.studentId}
                                        className="
                      grid grid-cols-12 gap-2 px-4 py-3
                      items-center transition-colors
                      hover:bg-[rgba(99,102,241,0.03)]
                    "
                                    >
                                        {/* Index */}
                                        <div
                                            className="col-span-1 text-xs tabular-nums"
                                            style={{ color: 'var(--text-muted)' }}
                                        >
                                            {idx + 1}
                                        </div>

                                        {/* Roll No */}
                                        <div
                                            className="
                        col-span-1 text-xs font-mono font-semibold
                      "
                                            style={{ color: 'var(--text-secondary)' }}
                                        >
                                            {student.rollNo || '-'}
                                        </div>

                                        {/* Name */}
                                        <div className="col-span-5 md:col-span-4">
                                            <p
                                                className="text-sm font-medium truncate"
                                                style={{ color: 'var(--text-primary)' }}
                                            >
                                                {student.name}
                                            </p>
                                            {student.smsSent && (
                                                <span
                                                    className="
                            inline-flex items-center gap-0.5
                            text-[0.625rem] font-medium mt-0.5
                          "
                                                    style={{ color: 'var(--success)' }}
                                                >
                                                    <MessageSquare size={9} />
                                                    SMS sent
                                                </span>
                                            )}
                                        </div>

                                        {/* Admission No */}
                                        <div
                                            className="
                        col-span-2 hidden md:block
                        text-xs font-mono
                      "
                                            style={{ color: 'var(--text-muted)' }}
                                        >
                                            {student.admissionNo}
                                        </div>

                                        {/* Status buttons */}
                                        <div className="col-span-5 md:col-span-4">
                                            <div className="flex gap-1">
                                                {(
                                                    Object.entries(
                                                        STATUS_CONFIG
                                                    ) as [AttendanceStatus, typeof STATUS_CONFIG[AttendanceStatus]][]
                                                ).map(([statusKey, conf]) => {
                                                    const isActive =
                                                        student.status === statusKey
                                                    return (
                                                        <button
                                                            key={statusKey}
                                                            onClick={() =>
                                                                setStatus(student.studentId, statusKey)
                                                            }
                                                            className="
                                flex-1 py-1.5 rounded-[var(--radius-sm)]
                                text-xs font-bold border transition-all
                                flex items-center justify-center gap-0.5
                              "
                                                            style={
                                                                isActive
                                                                    ? {
                                                                        backgroundColor: conf.bg,
                                                                        color: conf.text,
                                                                        borderColor: conf.border,
                                                                    }
                                                                    : {
                                                                        backgroundColor:
                                                                            'var(--bg-muted)',
                                                                        color: 'var(--text-muted)',
                                                                        borderColor: 'var(--border)',
                                                                    }
                                                            }
                                                            title={conf.label}
                                                        >
                                                            <span className="hidden sm:inline">
                                                                {conf.icon}
                                                            </span>
                                                            <span>{conf.short}</span>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* ── Footer — Save Button ── */}
                        <div
                            className="
                px-4 py-3 flex items-center justify-between
                flex-wrap gap-3
              "
                            style={{
                                borderTop: '1px solid var(--border)',
                                backgroundColor: 'var(--bg-subtle)',
                            }}
                        >
                            <p
                                className="text-xs"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                {records.length} students •{' '}
                                {summary.pending} pending
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={fetchAttendance}
                                    className="btn-ghost btn-sm text-xs"
                                >
                                    <RotateCcw size={12} />
                                    Reset
                                </button>
                                <Button
                                    size="sm"
                                    onClick={handleSave}
                                    loading={saving}
                                    disabled={!isDirty || saving}
                                >
                                    <Save size={14} />
                                    Save Attendance
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}