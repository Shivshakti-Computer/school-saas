/* ============================================================
   FILE: src/app/(dashboard)/admin/attendance/reports/student/page.tsx
   Student-wise detailed attendance report with calendar view
   ============================================================ */

'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import {
    Calendar,
    Download,
    Search,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    User,
    FileText,
    FileSpreadsheet,
    Loader2,
    ChevronLeft,
    type LucideIcon,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────

type ReportFormat = 'pdf' | 'excel'
type AttStatus = 'present' | 'absent' | 'late' | 'holiday' | 'pending'

interface Student {
    _id: string
    name: string
    admissionNo: string
    rollNo: string
    class: string
    section: string
    stream?: string
    parentPhone: string
}

interface DayRecord {
    date: string
    status: AttStatus
    day: string  // Monday, Tuesday, etc.
}

interface MonthlyData {
    student: Student
    month: string
    records: DayRecord[]
    stats: {
        present: number
        absent: number
        late: number
        holiday: number
        total: number
        percentage: number
    }
}

interface AlertState {
    type: 'success' | 'error' | 'warning'
    title: string
    message: string
}

// ── Constants ─────────────────────────────────────────────────

const CLASSES = [
    'Nursery', 'LKG', 'UKG',
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
]

const SECTIONS = ['A', 'B', 'C', 'D', 'E']
const STREAMS = ['Science', 'Commerce', 'Arts', 'Vocational']
const STREAM_CLASSES = ['11', '12']

const STATUS_CONFIG: Record<AttStatus, {
    label: string
    icon: LucideIcon
    bgClass: string
    textClass: string
    borderClass: string
}> = {
    present: {
        label: 'Present',
        icon: CheckCircle2,
        bgClass: 'bg-success-50',
        textClass: 'text-success-700',
        borderClass: 'border-success-200',
    },
    absent: {
        label: 'Absent',
        icon: XCircle,
        bgClass: 'bg-danger-50',
        textClass: 'text-danger-700',
        borderClass: 'border-danger-200',
    },
    late: {
        label: 'Late',
        icon: Clock,
        bgClass: 'bg-warning-50',
        textClass: 'text-warning-700',
        borderClass: 'border-warning-200',
    },
    holiday: {
        label: 'Holiday',
        icon: Calendar,
        bgClass: 'bg-primary-50',
        textClass: 'text-primary-700',
        borderClass: 'border-primary-200',
    },
    pending: {
        label: 'Not Marked',
        icon: AlertCircle,
        bgClass: 'bg-bg-muted',
        textClass: 'text-text-muted',
        borderClass: 'border-border',
    },
}

// ── Helper Functions ──────────────────────────────────────────

function getMonthOptions() {
    return Array.from({ length: 12 }, (_, i) => {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const value = d.toISOString().slice(0, 7)
        const label = d.toLocaleDateString('en-IN', {
            month: 'long',
            year: 'numeric',
        })
        return { value, label }
    })
}

function getDaysInMonth(year: number, month: number): Date[] {
    const days: Date[] = []
    const lastDay = new Date(year, month + 1, 0).getDate()

    for (let day = 1; day <= lastDay; day++) {
        days.push(new Date(year, month, day))
    }

    return days
}

// ── Spinner ───────────────────────────────────────────────────

function Spinner({ size = 'sm' }: { size?: 'sm' | 'md' }) {
    const cls = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'
    return <Loader2 className={`${cls} animate-spin flex-shrink-0`} aria-hidden />
}

// ── Alert Component ───────────────────────────────────────────

function ReportAlert({
    alert,
    onClose,
}: {
    alert: AlertState
    onClose: () => void
}) {
    const cfg = {
        success: {
            Icon: CheckCircle2,
            wrapClass: 'bg-success-50 border-success-200',
            iconClass: 'text-success-600',
            titleClass: 'text-success-800',
            msgClass: 'text-success-700',
        },
        error: {
            Icon: XCircle,
            wrapClass: 'bg-danger-50 border-danger-200',
            iconClass: 'text-danger-600',
            titleClass: 'text-danger-800',
            msgClass: 'text-danger-700',
        },
        warning: {
            Icon: AlertCircle,
            wrapClass: 'bg-warning-50 border-warning-200',
            iconClass: 'text-warning-600',
            titleClass: 'text-warning-800',
            msgClass: 'text-warning-700',
        },
    }[alert.type]

    const { Icon, wrapClass, iconClass, titleClass, msgClass } = cfg

    return (
        <div
            className={`flex items-start gap-3 p-4 rounded-lg border animate-slide-down ${wrapClass}`}
            role="alert"
            aria-live="polite"
        >
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconClass}`} aria-hidden />
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${titleClass}`}>{alert.title}</p>
                <p className={`text-sm mt-0.5 leading-relaxed ${msgClass}`}>{alert.message}</p>
            </div>
            <button
                onClick={onClose}
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-text-secondary hover:bg-black/5 transition-colors"
                aria-label="Close alert"
            >
                <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 1l12 12M13 1L1 13" />
                </svg>
            </button>
        </div>
    )
}

// ── Calendar Grid Component ───────────────────────────────────

function CalendarGrid({ monthlyData }: { monthlyData: MonthlyData | null }) {
    if (!monthlyData) return null

    const [year, monthNum] = monthlyData.month.split('-').map(Number)
    const days = getDaysInMonth(year, monthNum - 1)

    // Create lookup map: date string → status
    const statusMap = new Map(
        monthlyData.records.map(r => [r.date, r.status])
    )

    // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = days[0].getDay()

    // Weekday headers
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
        <div className="portal-card">
            <div className="portal-card-header">
                <div>
                    <p className="portal-card-title">Daily Attendance Calendar</p>
                    <p className="portal-card-subtitle">
                        {new Date(year, monthNum - 1).toLocaleDateString('en-IN', {
                            month: 'long',
                            year: 'numeric',
                        })}
                    </p>
                </div>
            </div>
            <div className="portal-card-body">

                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {weekDays.map(day => (
                        <div
                            key={day}
                            className="text-center text-xs font-semibold text-text-muted py-2"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-2">
                    {/* Empty cells for days before month starts */}
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square" />
                    ))}

                    {/* Day cells */}
                    {days.map(day => {
                        const dateStr = day.toISOString().split('T')[0]
                        const status = statusMap.get(dateStr) ?? 'pending'
                        const config = STATUS_CONFIG[status]
                        const Icon = config.icon

                        const isToday = dateStr === new Date().toISOString().split('T')[0]
                        const isSunday = day.getDay() === 0

                        return (
                            <div
                                key={dateStr}
                                className={`
                  aspect-square
                  rounded-md
                  border
                  flex flex-col items-center justify-center
                  gap-1
                  transition-all duration-150
                  ${config.bgClass}
                  ${config.borderClass}
                  ${isToday ? 'ring-2 ring-primary-500 ring-offset-2' : ''}
                  ${isSunday && status === 'pending' ? 'opacity-40' : ''}
                `}
                            >
                                <span
                                    className={`
                    text-xs font-semibold
                    ${config.textClass}
                  `}
                                >
                                    {day.getDate()}
                                </span>
                                <Icon className={`w-3 h-3 ${config.textClass}`} aria-hidden />
                            </div>
                        )
                    })}
                </div>

                {/* Legend */}
                <div className="mt-6 pt-4 border-t border-border">
                    <p className="text-xs font-semibold text-text-primary mb-3">Legend:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                            const Icon = cfg.icon
                            return (
                                <div
                                    key={key}
                                    className="flex items-center gap-2"
                                >
                                    <div className={`w-6 h-6 rounded flex items-center justify-center ${cfg.bgClass} border ${cfg.borderClass}`}>
                                        <Icon className={`w-3 h-3 ${cfg.textClass}`} aria-hidden />
                                    </div>
                                    <span className="text-xs text-text-secondary">{cfg.label}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── Student Card Component ────────────────────────────────────

function StudentCard({ student }: { student: Student }) {
    return (
        <div className="portal-card">
            <div className="portal-card-body">
                <div className="flex items-start gap-4">

                    {/* Avatar */}
                    <div className="avatar avatar-xl flex-shrink-0">
                        {student.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-text-primary mb-1">
                            {student.name}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                            <div>
                                <span className="text-text-muted">Admission No:</span>
                                <p className="font-mono font-semibold text-text-secondary">
                                    {student.admissionNo}
                                </p>
                            </div>
                            <div>
                                <span className="text-text-muted">Roll No:</span>
                                <p className="font-mono font-semibold text-text-secondary">
                                    {student.rollNo}
                                </p>
                            </div>
                            <div>
                                <span className="text-text-muted">Class:</span>
                                <p className="font-semibold text-text-secondary">
                                    {['Nursery', 'LKG', 'UKG'].includes(student.class)
                                        ? student.class
                                        : `Class ${student.class}`
                                    } - {student.section}
                                    {student.stream && ` (${student.stream})`}
                                </p>
                            </div>
                            <div>
                                <span className="text-text-muted">Parent Phone:</span>
                                <p className="font-mono font-semibold text-text-secondary">
                                    {student.parentPhone || '—'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── Stats Summary Component ───────────────────────────────────

function StatsSummary({ stats }: { stats: MonthlyData['stats'] }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="portal-stat-card">
                <div className="stat-icon bg-primary-50">
                    <Calendar className="w-5 h-5 text-primary-600" aria-hidden />
                </div>
                <div>
                    <p className="stat-value">{stats.total}</p>
                    <p className="stat-label">Total Days</p>
                </div>
            </div>

            <div className="portal-stat-card">
                <div className="stat-icon bg-success-50">
                    <CheckCircle2 className="w-5 h-5 text-success-600" aria-hidden />
                </div>
                <div>
                    <p className="stat-value">{stats.present}</p>
                    <p className="stat-label">Present</p>
                </div>
            </div>

            <div className="portal-stat-card">
                <div className="stat-icon bg-danger-50">
                    <XCircle className="w-5 h-5 text-danger-600" aria-hidden />
                </div>
                <div>
                    <p className="stat-value">{stats.absent}</p>
                    <p className="stat-label">Absent</p>
                </div>
            </div>

            <div className="portal-stat-card">
                <div className="stat-icon bg-warning-50">
                    <Clock className="w-5 h-5 text-warning-600" aria-hidden />
                </div>
                <div>
                    <p className="stat-value">{stats.late}</p>
                    <p className="stat-label">Late</p>
                </div>
            </div>

            <div className="portal-stat-card">
                <div className="stat-icon bg-info-50">
                    <Calendar className="w-5 h-5 text-info-600" aria-hidden />
                </div>
                <div>
                    <p className="stat-value">{stats.holiday}</p>
                    <p className="stat-label">Holidays</p>
                </div>
            </div>

            <div className="portal-stat-card">
                <div className={`stat-icon ${stats.percentage >= 90
                    ? 'bg-success-50'
                    : stats.percentage >= 75
                        ? 'bg-warning-50'
                        : 'bg-danger-50'
                    }`}>
                    <User className={`w-5 h-5 ${stats.percentage >= 90
                        ? 'text-success-600'
                        : stats.percentage >= 75
                            ? 'text-warning-600'
                            : 'text-danger-600'
                        }`} aria-hidden />
                </div>
                <div>
                    <p className={`stat-value ${stats.percentage >= 90
                        ? 'text-success-600'
                        : stats.percentage >= 75
                            ? 'text-warning-600'
                            : 'text-danger-600'
                        }`}>
                        {stats.percentage}%
                    </p>
                    <p className="stat-label">Attendance</p>
                </div>
            </div>
        </div>
    )
}

// ── Main Page ─────────────────────────────────────────────────

export default function StudentAttendanceReportPage() {

    // State
    const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
    const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null)
    const [loading, setLoading] = useState(false)
    const [downloading, setDownloading] = useState<'pdf' | 'excel' | null>(null)
    const [alert, setAlert] = useState<AlertState | null>(null)

    // Students list (you'll fetch from API)
    const [students, setStudents] = useState<Student[]>([])
    const [loadingStudents, setLoadingStudents] = useState(false)

    const monthOptions = useMemo(() => getMonthOptions(), [])

    // Filter students
    const filteredStudents = useMemo(() => {
        if (!searchTerm.trim()) return students

        const term = searchTerm.toLowerCase()
        return students.filter(s =>
            s.name.toLowerCase().includes(term) ||
            s.admissionNo.toLowerCase().includes(term) ||
            s.rollNo.toLowerCase().includes(term)
        )
    }, [students, searchTerm])

    // Fetch student list
    // Fetch student list
    const fetchStudents = useCallback(async () => {
        setLoadingStudents(true)
        try {
            const res = await fetch('/api/students/list?status=active')
            if (!res.ok) throw new Error('Failed to fetch students')

            const data = await res.json()

            // ✅ FIX: userId.name ko name me map karo
            const mapped = (data.students || []).map((s: any) => ({
                _id: s._id,
                name: s.userId?.name || 'Unknown',  // ✅ userId.name
                admissionNo: s.admissionNo,
                rollNo: s.rollNo,
                class: s.class,
                section: s.section,
                stream: s.stream,
                parentPhone: s.parentPhone,
            }))

            setStudents(mapped)
        } catch (err) {
            setAlert({
                type: 'error',
                title: 'Failed to load students',
                message: err instanceof Error ? err.message : 'Unknown error',
            })
        } finally {
            setLoadingStudents(false)
        }
    }, [])

    // Fetch on mount
    useEffect(() => {
        fetchStudents()
    }, [fetchStudents])

    // Fetch monthly data for selected student
    // Fetch monthly data for selected student
    const fetchMonthlyData = useCallback(async (studentId: string) => {
        setLoading(true)
        setAlert(null)

        try {
            const res = await fetch(
                `/api/attendance/report?studentId=${studentId}&month=${month}`
            )

            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.error || 'Failed to fetch data')
            }

            const data = await res.json()

            // ✅ FIX: API response ko frontend format me transform karo
            const reportItem = data.report?.[0]

            if (!reportItem) {
                // Koi data nahi - empty state set karo
                setMonthlyData({
                    student: selectedStudent!,
                    month,
                    records: [],
                    stats: {
                        present: 0,
                        absent: 0,
                        late: 0,
                        holiday: 0,
                        total: 0,
                        percentage: 0,
                    },
                })
                return
            }

            // ✅ Transform to MonthlyData format
            setMonthlyData({
                student: {
                    _id: reportItem.student?._id || studentId,
                    name: reportItem.student?.name || selectedStudent?.name || 'Unknown',
                    admissionNo: reportItem.student?.admissionNo || selectedStudent?.admissionNo || '',
                    rollNo: reportItem.student?.rollNo || selectedStudent?.rollNo || '',
                    class: reportItem.student?.class || selectedStudent?.class || '',
                    section: reportItem.student?.section || selectedStudent?.section || '',
                    parentPhone: reportItem.student?.parentPhone || selectedStudent?.parentPhone || '',
                },
                month,
                records: data.records || [],
                stats: {
                    present: reportItem.present ?? 0,
                    absent: reportItem.absent ?? 0,
                    late: reportItem.late ?? 0,
                    holiday: reportItem.holiday ?? 0,
                    total: reportItem.total ?? 0,
                    percentage: reportItem.percentage ?? 0,
                },
            })

        } catch (err) {
            setAlert({
                type: 'error',
                title: 'Failed to load attendance data',
                message: err instanceof Error ? err.message : 'Unknown error',
            })
        } finally {
            setLoading(false)
        }
    }, [month, selectedStudent])

    // Handle student selection
    const handleStudentSelect = useCallback((student: Student) => {
        setSelectedStudent(student)
        fetchMonthlyData(student._id)
    }, [fetchMonthlyData])

    // Download report
    const handleDownload = useCallback(async (format: 'pdf' | 'excel') => {
        if (!selectedStudent) return

        setDownloading(format)
        setAlert(null)

        try {
            const params = new URLSearchParams({
                studentId: selectedStudent._id,
                month,
                format,
            })

            const res = await fetch(`/api/reports/attendance/student?${params}`)

            if (!res.ok) {
                throw new Error('Download failed')
            }

            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `attendance-${selectedStudent.admissionNo}-${month}.${format === 'excel' ? 'xlsx' : 'pdf'}`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            setAlert({
                type: 'success',
                title: 'Download successful!',
                message: `${format.toUpperCase()} file has been downloaded.`,
            })
        } catch (err) {
            setAlert({
                type: 'error',
                title: 'Download failed',
                message: err instanceof Error ? err.message : 'Unknown error',
            })
        } finally {
            setDownloading(null)
        }
    }, [selectedStudent, month])

    // Render
    return (
        <div className="portal-content-enter">

            {/* Page Header */}
            <div className="portal-page-header">
                <div>
                    <nav className="portal-breadcrumb" aria-label="Breadcrumb">
                        <a href="/admin/reports" className="hover:text-primary-500 transition-colors">
                            Reports
                        </a>
                        <span className="bc-sep" aria-hidden>/</span>
                        <a href="/admin/attendance/reports" className="hover:text-primary-500 transition-colors">
                            Attendance Reports
                        </a>
                        <span className="bc-sep" aria-hidden>/</span>
                        <span className="bc-current">Student Detail</span>
                    </nav>
                    <h1 className="portal-page-title">Student Attendance Detail</h1>
                    <p className="portal-page-subtitle">
                        View detailed day-by-day attendance report for individual students
                    </p>
                </div>
            </div>

            {/* Alert */}
            {alert && (
                <div className="mb-5">
                    <ReportAlert alert={alert} onClose={() => setAlert(null)} />
                </div>
            )}

            {/* Student Selection (if none selected) */}
            {!selectedStudent && (
                <div className="portal-card mb-5">
                    <div className="portal-card-header">
                        <div>
                            <p className="portal-card-title">Select Student</p>
                            <p className="portal-card-subtitle">
                                Search and select a student to view detailed attendance
                            </p>
                        </div>
                    </div>
                    <div className="portal-card-body">

                        {/* Search */}
                        <div className="portal-search max-w-md mb-4">
                            <Search className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search by name, admission no, or roll no..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        {/* Student List */}
                        {loadingStudents ? (
                            <div className="flex justify-center py-12">
                                <Spinner size="md" />
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="portal-empty py-8">
                                <div className="portal-empty-icon">
                                    <User className="w-7 h-7" aria-hidden />
                                </div>
                                <p className="portal-empty-title">No students found</p>
                                <p className="portal-empty-text">
                                    {searchTerm
                                        ? 'Try adjusting your search'
                                        : 'No active students in the system'
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                                {filteredStudents.map(student => (
                                    <button
                                        key={student._id}
                                        onClick={() => handleStudentSelect(student)}
                                        className="card-interactive p-4 text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="avatar avatar-md flex-shrink-0">
                                                {student.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-text-primary truncate">
                                                    {student.name}
                                                </p>
                                                <p className="text-xs text-text-muted font-mono">
                                                    {student.admissionNo} • Roll {student.rollNo}
                                                </p>
                                                <p className="text-xs text-text-muted mt-0.5">
                                                    {student.class} - {student.section}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Selected Student View */}
            {selectedStudent && (
                <>
                    {/* Back button + Month + Download */}
                    <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
                        <button
                            onClick={() => {
                                setSelectedStudent(null)
                                setMonthlyData(null)
                            }}
                            className="btn-ghost btn-sm"
                        >
                            <ChevronLeft className="w-4 h-4" aria-hidden />
                            Back to Student List
                        </button>

                        <div className="flex items-center gap-3">
                            {/* Month selector */}
                            <select
                                value={month}
                                onChange={e => {
                                    setMonth(e.target.value)
                                    if (selectedStudent) {
                                        fetchMonthlyData(selectedStudent._id)
                                    }
                                }}
                                className="input-clean w-48"
                            >
                                {monthOptions.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>

                            {/* Download buttons */}
                            {monthlyData && (
                                <>
                                    <button
                                        onClick={() => handleDownload('pdf')}
                                        disabled={downloading !== null}
                                        className="btn-secondary btn-sm"
                                    >
                                        {downloading === 'pdf' ? (
                                            <Spinner size="sm" />
                                        ) : (
                                            <FileText className="w-3.5 h-3.5" aria-hidden />
                                        )}
                                        PDF
                                    </button>

                                    <button
                                        onClick={() => handleDownload('excel')}
                                        disabled={downloading !== null}
                                        className="btn-secondary btn-sm"
                                    >
                                        {downloading === 'excel' ? (
                                            <Spinner size="sm" />
                                        ) : (
                                            <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden />
                                        )}
                                        Excel
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Student card */}
                    <StudentCard student={selectedStudent} />

                    {/* Loading / Data */}
                    {loading ? (
                        <div className="flex justify-center py-16">
                            <Spinner size="md" />
                        </div>
                    ) : monthlyData ? (
                        <>
                            {/* Stats */}
                            <div className="my-5">
                                <StatsSummary stats={monthlyData.stats} />
                            </div>

                            {/* Calendar Grid */}
                            <CalendarGrid monthlyData={monthlyData} />
                        </>
                    ) : null}
                </>
            )}

        </div>
    )
}