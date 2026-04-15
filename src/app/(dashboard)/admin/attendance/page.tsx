// FILE: src/app/(dashboard)/admin/attendance/page.tsx
// ═══════════════════════════════════════════════════════════
// ✅ PRODUCTION READY - Attendance Module
// ✅ Dynamic classes/sections from academic settings
// ✅ Real-time sync with settings updates
// ✅ Cross-tab sync via BroadcastChannel
// ✅ Pagination, Stream support, SMS notifications
// ═══════════════════════════════════════════════════════════

'use client'

import {
    useState,
    useCallback,
    useMemo,
    useTransition,
    useEffect,
} from 'react'
import {
    CheckSquare,
    Save,
    Users,
    UserCheck,
    UserX,
    Clock,
    RefreshCw,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    TriangleAlert,
    MessageSquare,
    ChevronLeft,
    ChevronsLeft,
    ChevronsRight,
    AlertTriangle,
} from 'lucide-react'
import { useAcademicSettings } from '@/hooks/useAcademicSettings'

// ── Types ─────────────────────────────────────────────────────

type AttStatusUI = 'present' | 'absent' | 'late' | 'pending'

interface AttRow {
    studentId: string
    admissionNo: string
    rollNo: string
    name: string
    parentPhone: string
    class: string
    section: string
    status: AttStatusUI
    attendanceId: string | null
    smsSent: boolean
}

interface ApiMeta {
    class: string
    section: string | null
    present: number
    absent: number
    late: number
    pending: number
}

interface AlertState {
    type: 'success' | 'error' | 'warning'
    title: string
    message: string
}

// ── Constants ─────────────────────────────────────────────────

const STREAMS = ['Science', 'Commerce', 'Arts', 'Vocational']

// Classes eligible for stream selection
const STREAM_CLASSES = ['11', '12']

const TODAY = new Date().toISOString().split('T')[0]

const ITEMS_PER_PAGE_OPTIONS = [25, 50, 100, 200]
const DEFAULT_PAGE_SIZE = 50

const STATUS_CYCLE: Record<AttStatusUI, AttStatusUI> = {
    pending: 'present',
    present: 'absent',
    absent: 'late',
    late: 'present',
}

const STATUS_CONFIG: Record<
    AttStatusUI,
    { label: string; badgeClass: string; dotClass: string; nextLabel: string }
> = {
    present: {
        label: 'Present',
        badgeClass: 'badge badge-success',
        dotClass: 'bg-success-500',
        nextLabel: 'Mark Absent',
    },
    absent: {
        label: 'Absent',
        badgeClass: 'badge badge-danger',
        dotClass: 'bg-danger-500',
        nextLabel: 'Mark Late',
    },
    late: {
        label: 'Late',
        badgeClass: 'badge badge-warning',
        dotClass: 'bg-warning-500',
        nextLabel: 'Mark Present',
    },
    pending: {
        label: 'Pending',
        badgeClass: 'badge badge-neutral',
        dotClass: 'bg-text-light',
        nextLabel: 'Mark Present',
    },
}

// ── Spinner ───────────────────────────────────────────────────

function Spinner({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
    const cls =
        size === 'sm'
            ? 'w-3.5 h-3.5'
            : size === 'md'
                ? 'w-5 h-5'
                : 'w-8 h-8'
    return (
        <svg
            className={`${cls} animate-spin flex-shrink-0`}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
        </svg>
    )
}

// ── Alert Component ───────────────────────────────────────────

function AttAlert({
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
            Icon: AlertCircle,
            wrapClass: 'bg-danger-50 border-danger-200',
            iconClass: 'text-danger-600',
            titleClass: 'text-danger-800',
            msgClass: 'text-danger-700',
        },
        warning: {
            Icon: TriangleAlert,
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
            <Icon
                className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconClass}`}
                aria-hidden
            />
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${titleClass}`}>
                    {alert.title}
                </p>
                <p className={`text-sm mt-0.5 leading-relaxed ${msgClass}`}>
                    {alert.message}
                </p>
            </div>
            <button
                onClick={onClose}
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-text-secondary hover:bg-black/5 transition-colors"
                aria-label="Close alert"
            >
                <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M1 1l12 12M13 1L1 13" />
                </svg>
            </button>
        </div>
    )
}

// ── Stat Mini Card ────────────────────────────────────────────

function StatMini({
    icon: Icon,
    value,
    label,
    iconBgClass,
    iconColorClass,
}: {
    icon: React.ElementType
    value: number
    label: string
    iconBgClass: string
    iconColorClass: string
}) {
    return (
        <div className="portal-stat-card flex items-center gap-3">
            <div className={`stat-icon ${iconBgClass}`}>
                <Icon className={`w-5 h-5 ${iconColorClass}`} aria-hidden />
            </div>
            <div>
                <p className="stat-value tabular-nums">{value}</p>
                <p className="stat-label">{label}</p>
            </div>
        </div>
    )
}

// ── Student Row ───────────────────────────────────────────────

function StudentRow({
    row,
    index,
    onToggle,
}: {
    row: AttRow
    index: number
    onToggle: (id: string) => void
}) {
    const cfg = STATUS_CONFIG[row.status]

    return (
        <tr className="group">
            <td className="portal-table-cell w-16 text-center">
                <span className="font-mono text-xs text-text-muted tabular-nums">
                    {row.rollNo || String(index + 1).padStart(2, '0')}
                </span>
            </td>

            <td className="portal-table-cell">
                <div className="flex items-center gap-2.5">
                    <div className="avatar avatar-sm flex-shrink-0">
                        {row.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">
                            {row.name}
                        </p>
                        <p className="text-xs text-text-muted font-mono">
                            {row.admissionNo}
                        </p>
                    </div>
                </div>
            </td>

            <td className="portal-table-cell hidden md:table-cell">
                <span className="text-xs text-text-muted font-mono">
                    {row.parentPhone || '—'}
                </span>
                {row.smsSent && row.status === 'absent' && (
                    <span
                        className="ml-1.5 inline-flex items-center gap-0.5 text-xs text-info-600"
                        title="SMS sent to parent"
                    >
                        <MessageSquare className="w-3 h-3" aria-hidden />
                    </span>
                )}
            </td>

            <td className="portal-table-cell w-28">
                <span className={cfg.badgeClass}>
                    <span
                        className={`w-1.5 h-1.5 rounded-full inline-block flex-shrink-0 ${cfg.dotClass}`}
                        aria-hidden
                    />
                    {cfg.label}
                </span>
            </td>

            <td className="portal-table-cell w-36 text-right">
                <button
                    onClick={() => onToggle(row.studentId)}
                    className="
            inline-flex items-center gap-1
            px-3 py-1.5
            text-xs font-medium
            rounded-md
            text-text-secondary
            bg-bg-muted
            border border-border
            hover:bg-primary-50
            hover:text-primary-600
            hover:border-primary-200
            transition-all duration-150
          "
                    title={cfg.nextLabel}
                    aria-label={`${cfg.nextLabel} for ${row.name}`}
                >
                    {cfg.nextLabel}
                    <ChevronRight className="w-3 h-3" aria-hidden />
                </button>
            </td>
        </tr>
    )
}

// ── Skeleton Rows ─────────────────────────────────────────────

function SkeletonRows({ count = 8 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <tr key={i} aria-hidden>
                    <td className="portal-table-cell">
                        <div className="skeleton h-4 w-8 mx-auto" />
                    </td>
                    <td className="portal-table-cell">
                        <div className="flex items-center gap-2.5">
                            <div className="skeleton skeleton-avatar w-7 h-7 flex-shrink-0" />
                            <div className="flex-1 space-y-1">
                                <div className="skeleton skeleton-text w-32" />
                                <div className="skeleton skeleton-text w-20" />
                            </div>
                        </div>
                    </td>
                    <td className="portal-table-cell hidden md:table-cell">
                        <div className="skeleton skeleton-text w-24" />
                    </td>
                    <td className="portal-table-cell">
                        <div className="skeleton h-5 w-16 rounded-full" />
                    </td>
                    <td className="portal-table-cell text-right">
                        <div className="skeleton h-7 w-28 rounded-md ml-auto" />
                    </td>
                </tr>
            ))}
        </>
    )
}

// ── Progress Bar ──────────────────────────────────────────────

function ProgressBar({ marked, total }: { marked: number; total: number }) {
    const pct = total > 0 ? Math.round((marked / total) * 100) : 0
    return (
        <div className="flex items-center gap-2 text-xs text-text-muted">
            <div
                className="w-24 h-1.5 bg-bg-muted rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={marked}
                aria-valuemin={0}
                aria-valuemax={total}
                aria-label="Marking progress"
            >
                <div
                    className="h-full bg-success-500 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="tabular-nums">
                {marked}/{total} marked
            </span>
        </div>
    )
}

// ── Pagination Component ──────────────────────────────────────

function Pagination({
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    onPageChange,
    onPageSizeChange,
}: {
    currentPage: number
    totalPages: number
    pageSize: number
    totalItems: number
    onPageChange: (page: number) => void
    onPageSizeChange: (size: number) => void
}) {
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
    const endItem = Math.min(currentPage * pageSize, totalItems)

    const getPageNumbers = () => {
        const pages: (number | string)[] = []
        const delta = 2

        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 ||
                i === totalPages ||
                (i >= currentPage - delta && i <= currentPage + delta)
            ) {
                pages.push(i)
            } else if (pages[pages.length - 1] !== '...') {
                pages.push('...')
            }
        }
        return pages
    }

    const pageNumbers = getPageNumbers()

    return (
        <div className="portal-card-footer">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-text-muted">
                    Showing{' '}
                    <strong className="text-text-primary tabular-nums">
                        {startItem}
                    </strong>{' '}
                    to{' '}
                    <strong className="text-text-primary tabular-nums">
                        {endItem}
                    </strong>{' '}
                    of{' '}
                    <strong className="text-text-primary tabular-nums">
                        {totalItems}
                    </strong>{' '}
                    students
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted">Show:</span>
                        <select
                            value={pageSize}
                            onChange={(e) =>
                                onPageSizeChange(Number(e.target.value))
                            }
                            className="input-clean text-xs py-1 px-2 w-16"
                        >
                            {ITEMS_PER_PAGE_OPTIONS.map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onPageChange(1)}
                            disabled={currentPage === 1}
                            className="
                w-8 h-8 flex items-center justify-center
                rounded-md
                text-text-secondary
                hover:bg-bg-muted
                disabled:opacity-40
                disabled:cursor-not-allowed
                transition-colors
              "
                            aria-label="First page"
                        >
                            <ChevronsLeft className="w-4 h-4" aria-hidden />
                        </button>

                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="
                w-8 h-8 flex items-center justify-center
                rounded-md
                text-text-secondary
                hover:bg-bg-muted
                disabled:opacity-40
                disabled:cursor-not-allowed
                transition-colors
              "
                            aria-label="Previous page"
                        >
                            <ChevronLeft className="w-4 h-4" aria-hidden />
                        </button>

                        {pageNumbers.map((page, idx) =>
                            typeof page === 'number' ? (
                                <button
                                    key={idx}
                                    onClick={() => onPageChange(page)}
                                    className={`
                    min-w-[2rem] h-8 px-2
                    flex items-center justify-center
                    rounded-md
                    text-xs font-medium
                    transition-all duration-150
                    ${page === currentPage
                                            ? 'bg-primary-500 text-white'
                                            : 'text-text-secondary hover:bg-bg-muted'
                                        }
                  `}
                                    aria-label={`Page ${page}`}
                                    aria-current={
                                        page === currentPage ? 'page' : undefined
                                    }
                                >
                                    {page}
                                </button>
                            ) : (
                                <span
                                    key={idx}
                                    className="min-w-[2rem] h-8 flex items-center justify-center text-xs text-text-muted"
                                    aria-hidden
                                >
                                    {page}
                                </span>
                            )
                        )}

                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="
                w-8 h-8 flex items-center justify-center
                rounded-md
                text-text-secondary
                hover:bg-bg-muted
                disabled:opacity-40
                disabled:cursor-not-allowed
                transition-colors
              "
                            aria-label="Next page"
                        >
                            <ChevronRight className="w-4 h-4" aria-hidden />
                        </button>

                        <button
                            onClick={() => onPageChange(totalPages)}
                            disabled={currentPage === totalPages}
                            className="
                w-8 h-8 flex items-center justify-center
                rounded-md
                text-text-secondary
                hover:bg-bg-muted
                disabled:opacity-40
                disabled:cursor-not-allowed
                transition-colors
              "
                            aria-label="Last page"
                        >
                            <ChevronsRight className="w-4 h-4" aria-hidden />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── Main Page ─────────────────────────────────────────────────

export default function AttendancePage() {
    const { settings: academicSettings, loading: settingsLoading } =
        useAcademicSettings()

    // ✅ FIX: Derive UNIQUE classes
    const CLASSES = useMemo(() => {
        if (!academicSettings?.classes) return []

        const activeClasses = academicSettings.classes.filter((c) => c.isActive)

        // Unique names only
        const uniqueNames = Array.from(
            new Set(activeClasses.map((c) => c.name))
        )

        // Sort: Nursery, LKG, UKG, 1, 2, ... 12
        return uniqueNames.sort((a, b) => {
            const prePrimary = ['Nursery', 'LKG', 'UKG']
            const aIdx = prePrimary.indexOf(a)
            const bIdx = prePrimary.indexOf(b)

            if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
            if (aIdx !== -1) return -1
            if (bIdx !== -1) return 1

            const aNum = parseInt(a)
            const bNum = parseInt(b)
            if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum

            return a.localeCompare(b)
        })
    }, [academicSettings?.classes])

    const SECTIONS =
        academicSettings?.sections
            ?.filter((s) => s.isActive)
            .map((s) => s.name) || []

    // ✅ Default values
    const defaultClass = CLASSES[0] || ''
    const defaultSection = SECTIONS[0] || 'A'

    // ── Filter state ──
    const [cls, setCls] = useState(defaultClass)
    const [section, setSection] = useState(defaultSection)
    const [stream, setStream] = useState('')
    const [date, setDate] = useState(TODAY)

    // ── Data state ──
    const [fullList, setFullList] = useState<AttRow[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [fetched, setFetched] = useState(false)
    const [alert, setAlert] = useState<AlertState | null>(null)
    const [apiMeta, setApiMeta] = useState<ApiMeta | null>(null)

    // ── Pagination state ──
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

    const [, startTransition] = useTransition()

    // ── Derived: Show stream selector? ──
    const showStreamSelector = STREAM_CLASSES.includes(cls)

    // ── Paginated list ──
    const { paginatedList, totalPages } = useMemo(() => {
        const startIdx = (currentPage - 1) * pageSize
        const endIdx = startIdx + pageSize
        return {
            paginatedList: fullList.slice(startIdx, endIdx),
            totalPages: Math.max(1, Math.ceil(fullList.length / pageSize)),
        }
    }, [fullList, currentPage, pageSize])

    // ── Stats ──
    const stats = useMemo(() => {
        const present = fullList.filter((r) => r.status === 'present').length
        const absent = fullList.filter((r) => r.status === 'absent').length
        const late = fullList.filter((r) => r.status === 'late').length
        const pending = fullList.filter((r) => r.status === 'pending').length
        return { total: fullList.length, present, absent, late, pending }
    }, [fullList])

    const markedCount = stats.total - stats.pending

    // ✅ Update default class/section when settings load
    useEffect(() => {
        if (CLASSES.length > 0 && !cls) {
            setCls(CLASSES[0])
        }
    }, [CLASSES, cls])

    useEffect(() => {
        if (SECTIONS.length > 0 && !section) {
            setSection(SECTIONS[0])
        }
    }, [SECTIONS, section])

    // ✅ Listen to settings updates (real-time sync)
    useEffect(() => {
        const channel = new BroadcastChannel('settings-update')

        channel.onmessage = (event) => {
            if (event.data.type === 'academic-updated') {
                const { affectedModules } = event.data

                if (
                    affectedModules.includes('attendance') ||
                    affectedModules.includes('all')
                ) {
                    console.log(
                        '[Attendance] Academic settings updated, UI will refresh automatically'
                    )
                    // Hook automatically updates CLASSES/SECTIONS
                }
            }
        }

        return () => channel.close()
    }, [])

    // ── Reset to page 1 on page size change ──
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1)
        }
    }, [currentPage, totalPages])

    // ── Fetch ──────────────────────────────────────────────────

    const fetchAttendance = useCallback(async () => {
        if (!cls) return
        setLoading(true)
        setFetched(false)
        setAlert(null)
        setFullList([])
        setApiMeta(null)
        setCurrentPage(1)

        try {
            const params = new URLSearchParams({
                class: cls,
                section,
                date,
            })

            if (showStreamSelector && stream) {
                params.set('stream', stream)
            }

            const res = await fetch(`/api/attendance?${params}`)

            if (!res.ok) {
                const err = await res
                    .json()
                    .catch(() => ({ error: 'Network error' }))
                throw new Error(err.error ?? `HTTP ${res.status}`)
            }

            const data = await res.json()

            startTransition(() => {
                setFullList(data.list ?? [])
                setApiMeta(data.meta ?? null)
                setFetched(true)
            })
        } catch (err) {
            setAlert({
                type: 'error',
                title: 'Failed to load students',
                message: err instanceof Error ? err.message : 'Something went wrong',
            })
            setFetched(true)
        } finally {
            setLoading(false)
        }
    }, [cls, section, stream, date, showStreamSelector])

    // ── Toggle ─────────────────────────────────────────────────

    const toggle = useCallback((studentId: string) => {
        setFullList((prev) =>
            prev.map((r) =>
                r.studentId !== studentId
                    ? r
                    : { ...r, status: STATUS_CYCLE[r.status] }
            )
        )
    }, [])

    // ── Bulk mark ──────────────────────────────────────────────

    const markAll = useCallback((status: Exclude<AttStatusUI, 'pending'>) => {
        setFullList((prev) => prev.map((r) => ({ ...r, status })))
    }, [])

    // ── Save ───────────────────────────────────────────────────

    const saveAttendance = useCallback(async () => {
        if (stats.pending > 0) {
            setAlert({
                type: 'error',
                title: 'Incomplete marking',
                message: `${stats.pending} student${stats.pending > 1 ? 's are' : ' is'
                    } still pending. Please mark all students first.`,
            })
            return
        }

        setSaving(true)
        setAlert(null)

        try {
            const res = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date,
                    records: fullList.map((r) => ({
                        studentId: r.studentId,
                        status: r.status,
                    })),
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error ?? 'Save failed')
            }

            let successMsg = `Attendance saved for ${data.saved} students.`

            if (data.absent > 0 && data.sms) {
                if (data.sms.sent > 0) {
                    successMsg += ` SMS sent to ${data.sms.sent} absent student parent${data.sms.sent > 1 ? 's' : ''
                        }.`
                } else if (data.sms.skipped > 0 && !data.sms.creditWarning) {
                    successMsg += ` ${data.absent} absent — SMS not sent (no phone number).`
                }
            }

            setAlert({
                type: 'success',
                title: 'Attendance saved successfully!',
                message: successMsg,
            })

            if (data.sms?.creditWarning) {
                setTimeout(() => {
                    setAlert({
                        type: 'warning',
                        title: 'SMS Credit Warning',
                        message: data.sms.creditWarning,
                    })
                }, 4000)
            }

            fetchAttendance()
        } catch (err) {
            setAlert({
                type: 'error',
                title: 'Failed to save attendance',
                message: err instanceof Error ? err.message : 'Something went wrong',
            })
        } finally {
            setSaving(false)
        }
    }, [fullList, stats.pending, date, fetchAttendance])

    // ── Filter change handlers ─────────────────────────────────

    const handleClassChange = useCallback((val: string) => {
        setCls(val)
        setStream('')
        setFetched(false)
        setFullList([])
        setApiMeta(null)
        setAlert(null)
        setCurrentPage(1)
    }, [])

    const handleSectionChange = useCallback((val: string) => {
        setSection(val)
        setFetched(false)
        setFullList([])
        setApiMeta(null)
        setCurrentPage(1)
    }, [])

    const handleStreamChange = useCallback((val: string) => {
        setStream(val)
        setFetched(false)
        setFullList([])
        setCurrentPage(1)
    }, [])

    const handleDateChange = useCallback((val: string) => {
        setDate(val)
        setFetched(false)
        setFullList([])
        setApiMeta(null)
        setCurrentPage(1)
    }, [])

    const handlePageSizeChange = useCallback((size: number) => {
        setPageSize(size)
        setCurrentPage(1)
    }, [])

    // ✅ Show loading if settings not loaded
    if (settingsLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Spinner size="lg" />
                <p className="text-sm text-text-muted ml-3">
                    Loading attendance settings...
                </p>
            </div>
        )
    }

    // ✅ Show warning if no classes configured
    if (CLASSES.length === 0) {
        return (
            <div className="portal-content-enter">
                <div className="portal-page-header">
                    <div>
                        <nav className="portal-breadcrumb" aria-label="Breadcrumb">
                            <span>Dashboard</span>
                            <span className="bc-sep" aria-hidden>
                                /
                            </span>
                            <span className="bc-current">Attendance</span>
                        </nav>
                        <h1 className="portal-page-title">Attendance</h1>
                        <p className="portal-page-subtitle">
                            Mark daily attendance for students
                        </p>
                    </div>
                </div>

                <div className="portal-card">
                    <div className="portal-empty">
                        <div className="portal-empty-icon">
                            <AlertTriangle
                                size={28}
                                className="text-warning-500"
                                aria-hidden
                            />
                        </div>
                        <p className="portal-empty-title">
                            No Classes Configured
                        </p>
                        <p className="portal-empty-text">
                            Please configure classes in Settings → Academic before marking
                            attendance.
                        </p>
                        <a
                            href="/admin/settings?tab=academic"
                            className="btn-primary mt-4"
                        >
                            Go to Settings
                        </a>
                    </div>
                </div>
            </div>
        )
    }

    // ── Render ─────────────────────────────────────────────────

    return (
        <div className="portal-content-enter">
            {/* ── Page Header ── */}
            <div className="portal-page-header">
                <div>
                    <nav className="portal-breadcrumb" aria-label="Breadcrumb">
                        <span>Dashboard</span>
                        <span className="bc-sep" aria-hidden>
                            /
                        </span>
                        <span className="bc-current">Attendance</span>
                    </nav>
                    <h1 className="portal-page-title">Attendance</h1>
                    <p className="portal-page-subtitle">
                        Mark daily attendance — parents of absent students will receive
                        automatic SMS notifications
                    </p>
                </div>
            </div>

            {/* ── Alert ── */}
            {alert && (
                <div className="mb-5">
                    <AttAlert alert={alert} onClose={() => setAlert(null)} />
                </div>
            )}

            {/* ── Filter Card ── */}
            <div className="portal-card mb-5">
                <div className="portal-card-header">
                    <div>
                        <p className="portal-card-title">Select Class &amp; Date</p>
                        <p className="portal-card-subtitle">
                            Choose class, section
                            {showStreamSelector && ', stream'}, and date to load students
                        </p>
                    </div>
                </div>
                <div className="portal-card-body">
                    <div className="flex flex-wrap gap-4 items-end">
                        {/* Class */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="att-class" className="input-label">
                                Class <span className="text-danger-500">*</span>
                            </label>
                            <select
                                id="att-class"
                                value={cls}
                                onChange={(e) => handleClassChange(e.target.value)}
                                className="input-clean w-36"
                                disabled={CLASSES.length === 0}
                            >
                                <option value="">Select Class</option>
                                {CLASSES.map((c) => (
                                    <option key={c} value={c}>
                                        {['Nursery', 'LKG', 'UKG'].includes(c)
                                            ? c
                                            : `Class ${c}`}
                                    </option>
                                ))}
                            </select>
                            {CLASSES.length === 0 && (
                                <p className="text-xs text-danger-500 mt-1">
                                    No active classes configured in settings
                                </p>
                            )}
                        </div>

                        {/* Section */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="att-section" className="input-label">
                                Section
                            </label>
                            <select
                                id="att-section"
                                value={section}
                                onChange={(e) => handleSectionChange(e.target.value)}
                                className="input-clean w-28"
                                disabled={SECTIONS.length === 0}
                            >
                                {SECTIONS.map((s) => (
                                    <option key={s} value={s}>
                                        Section {s}
                                    </option>
                                ))}
                            </select>
                            {SECTIONS.length === 0 && (
                                <p className="text-xs text-danger-500 mt-1">
                                    No active sections configured
                                </p>
                            )}
                        </div>

                        {/* Stream — only for Class 11, 12 */}
                        {showStreamSelector && (
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="att-stream" className="input-label">
                                    Stream
                                </label>
                                <select
                                    id="att-stream"
                                    value={stream}
                                    onChange={(e) => handleStreamChange(e.target.value)}
                                    className="input-clean w-36"
                                >
                                    <option value="">All Streams</option>
                                    {STREAMS.map((st) => (
                                        <option key={st} value={st.toLowerCase()}>
                                            {st}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Date */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="att-date" className="input-label">
                                Date
                            </label>
                            <input
                                id="att-date"
                                type="date"
                                value={date}
                                max={TODAY}
                                onChange={(e) => handleDateChange(e.target.value)}
                                className="input-clean w-44"
                            />
                        </div>

                        {/* Load Button */}
                        <button
                            onClick={fetchAttendance}
                            disabled={!cls || loading}
                            className="btn-primary self-end"
                            aria-busy={loading}
                        >
                            {loading ? (
                                <>
                                    <Spinner size="sm" />
                                    Loading...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4" aria-hidden />
                                    Load Students
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Stats Row ── */}
            {fetched && fullList.length > 0 && (
                <div
                    className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 animate-slide-up"
                    role="status"
                    aria-label="Attendance summary"
                    aria-live="polite"
                >
                    <StatMini
                        icon={Users}
                        value={stats.total}
                        label="Total Students"
                        iconBgClass="bg-primary-50"
                        iconColorClass="text-primary-600"
                    />
                    <StatMini
                        icon={UserCheck}
                        value={stats.present}
                        label="Present"
                        iconBgClass="bg-success-50"
                        iconColorClass="text-success-600"
                    />
                    <StatMini
                        icon={UserX}
                        value={stats.absent}
                        label="Absent"
                        iconBgClass="bg-danger-50"
                        iconColorClass="text-danger-600"
                    />
                    <StatMini
                        icon={Clock}
                        value={stats.late}
                        label="Late"
                        iconBgClass="bg-warning-50"
                        iconColorClass="text-warning-600"
                    />
                </div>
            )}

            {/* ── Action Bar ── */}
            {fetched && fullList.length > 0 && (
                <div className="portal-card mb-5 animate-slide-up">
                    <div className="portal-card-body-sm">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            {/* Bulk mark */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-medium text-text-muted select-none">
                                    Bulk Actions:
                                </span>

                                <button
                                    onClick={() => markAll('present')}
                                    className="
                    inline-flex items-center gap-1.5
                    px-3 py-1.5 rounded-md
                    text-xs font-semibold
                    text-success-700 bg-success-50
                    border border-success-200
                    hover:bg-success-100
                    transition-colors duration-150
                  "
                                >
                                    <UserCheck className="w-3.5 h-3.5" aria-hidden />
                                    Mark All Present
                                </button>

                                <button
                                    onClick={() => markAll('absent')}
                                    className="
                    inline-flex items-center gap-1.5
                    px-3 py-1.5 rounded-md
                    text-xs font-semibold
                    text-danger-700 bg-danger-50
                    border border-danger-200
                    hover:bg-danger-100
                    transition-colors duration-150
                  "
                                >
                                    <UserX className="w-3.5 h-3.5" aria-hidden />
                                    Mark All Absent
                                </button>

                                {stats.pending > 0 && (
                                    <span className="badge badge-warning" role="status">
                                        {stats.pending} pending
                                    </span>
                                )}
                            </div>

                            {/* Save */}
                            <button
                                onClick={saveAttendance}
                                disabled={saving || stats.total === 0}
                                className="btn-primary"
                                aria-busy={saving}
                                title={
                                    stats.pending > 0
                                        ? `${stats.pending} students are still pending`
                                        : 'Save attendance'
                                }
                            >
                                {saving ? (
                                    <>
                                        <Spinner size="sm" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" aria-hidden />
                                        Save Attendance
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Main Table Card ── */}
            <div
                className="portal-card"
                role="region"
                aria-label="Student attendance list"
            >
                {/* ── Loading ── */}
                {loading && (
                    <>
                        <div className="portal-card-header">
                            <div className="skeleton skeleton-title w-48" aria-hidden />
                            <div className="skeleton h-4 w-32" aria-hidden />
                        </div>
                        <div className="table-wrapper">
                            <table className="portal-table" aria-label="Loading students">
                                <thead>
                                    <tr>
                                        {['Roll', 'Student', 'Phone', 'Status', 'Action'].map(
                                            (h) => (
                                                <th key={h} scope="col">
                                                    {h}
                                                </th>
                                            )
                                        )}
                                    </tr>
                                </thead>
                                <tbody aria-busy>
                                    <SkeletonRows count={pageSize > 50 ? 10 : 8} />
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ── Data ── */}
                {!loading && fetched && fullList.length > 0 && (
                    <>
                        <div className="portal-card-header">
                            <div>
                                <p className="portal-card-title">
                                    {['Nursery', 'LKG', 'UKG'].includes(cls) ? cls : `Class ${cls}`}{' '}
                                    — Section {section}
                                    {showStreamSelector &&
                                        stream &&
                                        ` — ${STREAMS.find((s) => s.toLowerCase() === stream) ?? stream
                                        }`}
                                </p>
                                <p className="portal-card-subtitle">
                                    {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                            <ProgressBar marked={markedCount} total={stats.total} />
                        </div>

                        <div className="table-wrapper">
                            <table className="portal-table" aria-label="Student attendance">
                                <thead>
                                    <tr>
                                        <th scope="col" className="w-16 text-center">
                                            Roll
                                        </th>
                                        <th scope="col">Student</th>
                                        <th scope="col" className="hidden md:table-cell">
                                            Parent Phone
                                        </th>
                                        <th scope="col" className="w-28">
                                            Status
                                        </th>
                                        <th scope="col" className="w-36 text-right">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedList.map((row, idx) => (
                                        <StudentRow
                                            key={row.studentId}
                                            row={row}
                                            index={(currentPage - 1) * pageSize + idx}
                                            onToggle={toggle}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* ── Pagination ── */}
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            pageSize={pageSize}
                            totalItems={stats.total}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={handlePageSizeChange}
                        />

                        {/* Footer legend */}
                        <div className="portal-card-footer border-t-0 pt-0">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <p className="text-xs text-text-muted">
                                    Click <strong>Action</strong> button to cycle: Pending →
                                    Present → Absent → Late → Present
                                </p>
                                <div className="flex items-center gap-4 text-xs text-text-muted">
                                    <span className="flex items-center gap-1.5">
                                        <span
                                            className="w-2 h-2 rounded-full bg-success-500 inline-block"
                                            aria-hidden
                                        />
                                        Present:{' '}
                                        <strong className="tabular-nums">{stats.present}</strong>
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span
                                            className="w-2 h-2 rounded-full bg-danger-500 inline-block"
                                            aria-hidden
                                        />
                                        Absent:{' '}
                                        <strong className="tabular-nums">{stats.absent}</strong>
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span
                                            className="w-2 h-2 rounded-full bg-warning-500 inline-block"
                                            aria-hidden
                                        />
                                        Late:{' '}
                                        <strong className="tabular-nums">{stats.late}</strong>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ── Empty — fetched but no students ── */}
                {!loading && fetched && fullList.length === 0 && cls && (
                    <div className="portal-empty">
                        <div className="portal-empty-icon">
                            <Users className="w-7 h-7" aria-hidden />
                        </div>
                        <p className="portal-empty-title">No students found</p>
                        <p className="portal-empty-text">
                            No active students found in{' '}
                            {['Nursery', 'LKG', 'UKG'].includes(cls) ? cls : `Class ${cls}`}{' '}
                            Section {section}
                            {showStreamSelector &&
                                stream &&
                                ` (${STREAMS.find((s) => s.toLowerCase() === stream) ?? stream
                                } stream)`}
                            . Check Student Management.
                        </p>
                    </div>
                )}

                {/* ── Initial state ── */}
                {!loading && !fetched && (
                    <div className="portal-empty">
                        <div className="portal-empty-icon">
                            <CheckSquare className="w-7 h-7" aria-hidden />
                        </div>
                        <p className="portal-empty-title">Mark attendance</p>
                        <p className="portal-empty-text">
                            Select a class, section, and date above, then click{' '}
                            <strong>Load Students</strong> to begin marking attendance
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}