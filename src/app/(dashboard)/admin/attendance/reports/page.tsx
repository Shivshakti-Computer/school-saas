/* ============================================================
   FILE: src/app/(dashboard)/admin/attendance/reports/page.tsx
   Attendance-specific reports with filters and downloads
   ============================================================ */

'use client'

import { useState, useCallback, useMemo } from 'react'
import {
    FileText,
    FileSpreadsheet,
    Download,
    Calendar,
    Users,
    TrendingDown,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2,
    type LucideIcon,
    User,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────

type ReportFormat = 'pdf' | 'excel'
type LoadingKey = `${string}-${ReportFormat}` | null

interface ReportCard {
    key: string
    title: string
    description: string
    icon: LucideIcon
    iconBg: string
    iconColor: string
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

const REPORTS: ReportCard[] = [
    {
        key: 'attendance',
        title: 'Monthly Attendance Report',
        description: 'Class-wise attendance summary with present, absent, late breakdown and attendance percentage for each student',
        icon: CheckCircle2,
        iconBg: 'bg-primary-50',
        iconColor: 'text-primary-600',
    },
]

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

// ── Spinner ───────────────────────────────────────────────────

function Spinner({ size = 'sm' }: { size?: 'sm' | 'md' }) {
    const cls = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'
    return (
        <Loader2 className={`${cls} animate-spin flex-shrink-0`} aria-hidden />
    )
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
            Icon: AlertTriangle,
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

// ── Report Card Component ─────────────────────────────────────

function ReportCardItem({
    report,
    loading,
    onDownload,
}: {
    report: ReportCard
    loading: LoadingKey
    onDownload: (key: string, format: ReportFormat) => void
}) {
    const Icon = report.icon

    const isPdfLoading = loading === `${report.key}-pdf`
    const isExcelLoading = loading === `${report.key}-excel`
    const isDisabled = loading !== null

    return (
        <div className="portal-card">
            <div className="portal-card-body">
                <div className="flex items-start gap-4">

                    {/* Icon */}
                    <div className={`w-12 h-12 flex items-center justify-center rounded-lg flex-shrink-0 ${report.iconBg}`}>
                        <Icon className={`w-6 h-6 ${report.iconColor}`} aria-hidden />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h3 className="portal-card-title mb-1">
                            {report.title}
                        </h3>
                        <p className="text-sm text-text-muted leading-relaxed mb-4">
                            {report.description}
                        </p>

                        {/* Download buttons */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => onDownload(report.key, 'pdf')}
                                disabled={isDisabled}
                                className="
                  inline-flex items-center gap-2
                  px-3 py-1.5
                  text-xs font-semibold
                  rounded-md
                  text-danger-700 bg-danger-50
                  border border-danger-200
                  hover:bg-danger-100
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  transition-colors duration-150
                "
                                aria-busy={isPdfLoading}
                            >
                                {isPdfLoading ? (
                                    <Spinner size="sm" />
                                ) : (
                                    <FileText className="w-3.5 h-3.5" aria-hidden />
                                )}
                                Download PDF
                            </button>

                            <button
                                onClick={() => onDownload(report.key, 'excel')}
                                disabled={isDisabled}
                                className="
                  inline-flex items-center gap-2
                  px-3 py-1.5
                  text-xs font-semibold
                  rounded-md
                  text-success-700 bg-success-50
                  border border-success-200
                  hover:bg-success-100
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  transition-colors duration-150
                "
                                aria-busy={isExcelLoading}
                            >
                                {isExcelLoading ? (
                                    <Spinner size="sm" />
                                ) : (
                                    <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden />
                                )}
                                Download Excel
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

// ── Main Page ─────────────────────────────────────────────────

export default function AttendanceReportsPage() {

    // ── State ──
    const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
    const [cls, setCls] = useState('')
    const [section, setSection] = useState('')
    const [stream, setStream] = useState('')
    const [loading, setLoading] = useState<LoadingKey>(null)
    const [alert, setAlert] = useState<AlertState | null>(null)

    const monthOptions = useMemo(() => getMonthOptions(), [])

    const showStreamSelector = STREAM_CLASSES.includes(cls)

    // ── Download handler ──────────────────────────────────────

    const handleDownload = useCallback(async (
        reportKey: string,
        format: ReportFormat
    ) => {
        const key = `${reportKey}-${format}` as LoadingKey
        setLoading(key)
        setAlert(null)

        try {
            const params = new URLSearchParams({ month, format })
            if (cls) params.set('class', cls)
            if (section) params.set('section', section)
            if (stream && showStreamSelector) params.set('stream', stream)

            const res = await fetch(`/api/reports/${reportKey}?${params}`)

            if (!res.ok) {
                let errMsg = 'Export failed. Please try again.'
                try {
                    const body = await res.json()
                    if (body?.error) errMsg = body.error
                } catch { /* ignore parse error */ }
                throw new Error(errMsg)
            }

            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')

            a.href = url
            a.download = `${reportKey}-${month}${cls ? `-class${cls}` : ''}.${format === 'excel' ? 'xlsx' : 'pdf'}`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            setAlert({
                type: 'success',
                title: 'Download successful!',
                message: `${format.toUpperCase()} file has been downloaded to your device.`,
            })
        } catch (err) {
            setAlert({
                type: 'error',
                title: 'Download failed',
                message: err instanceof Error ? err.message : 'An unknown error occurred.',
            })
        } finally {
            setLoading(null)
        }
    }, [month, cls, section, stream, showStreamSelector])

    // ── Reset filters ─────────────────────────────────────────

    const handleClassChange = useCallback((val: string) => {
        setCls(val)
        setStream('')  // Reset stream when class changes
    }, [])

    const clearFilters = useCallback(() => {
        setCls('')
        setSection('')
        setStream('')
    }, [])

    // ── Render ────────────────────────────────────────────────

    return (
        <div className="portal-content-enter">

            {/* ── Page Header ── */}
            <div className="portal-page-header">
                <div>
                    <nav className="portal-breadcrumb" aria-label="Breadcrumb">
                        <a
                            href="/admin/reports"
                            className="hover:text-primary-500 transition-colors"
                        >
                            Reports
                        </a>
                        <span className="bc-sep" aria-hidden>/</span>
                        <span className="bc-current">Attendance Reports</span>
                    </nav>
                    <h1 className="portal-page-title">Attendance Reports</h1>
                    <p className="portal-page-subtitle">
                        Download monthly attendance reports in PDF or Excel format with customizable filters
                    </p>
                </div>
                <div>
                    <a
                        href="/admin/attendance/reports/student"
                        className="btn-secondary"
                    >
                        <User className="w-4 h-4" aria-hidden />
                        Student Detail Report
                    </a>
                </div>
            </div>

            {/* ── Alert ── */}
            {alert && (
                <div className="mb-5">
                    <ReportAlert alert={alert} onClose={() => setAlert(null)} />
                </div>
            )}

            {/* ── Filters Card ── */}
            <div className="portal-card mb-5">
                <div className="portal-card-header">
                    <div>
                        <p className="portal-card-title">Report Filters</p>
                        <p className="portal-card-subtitle">
                            Select month and optional class/section filters
                        </p>
                    </div>
                </div>
                <div className="portal-card-body">
                    <div className="flex flex-wrap gap-4">

                        {/* Month */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="report-month" className="input-label">
                                Month <span className="text-danger-500">*</span>
                            </label>
                            <select
                                id="report-month"
                                value={month}
                                onChange={e => setMonth(e.target.value)}
                                className="input-clean w-52"
                            >
                                {monthOptions.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Class */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="report-class" className="input-label">
                                Class <span className="text-text-muted text-xs">(optional)</span>
                            </label>
                            <select
                                id="report-class"
                                value={cls}
                                onChange={e => handleClassChange(e.target.value)}
                                className="input-clean w-36"
                            >
                                <option value="">All Classes</option>
                                {CLASSES.map(c => (
                                    <option key={c} value={c}>
                                        {['Nursery', 'LKG', 'UKG'].includes(c) ? c : `Class ${c}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Section */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="report-section" className="input-label">
                                Section <span className="text-text-muted text-xs">(optional)</span>
                            </label>
                            <select
                                id="report-section"
                                value={section}
                                onChange={e => setSection(e.target.value)}
                                className="input-clean w-28"
                                disabled={!cls}
                            >
                                <option value="">All Sections</option>
                                {SECTIONS.map(s => (
                                    <option key={s} value={s}>Section {s}</option>
                                ))}
                            </select>
                        </div>

                        {/* Stream — only for Class 11, 12 */}
                        {showStreamSelector && (
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="report-stream" className="input-label">
                                    Stream <span className="text-text-muted text-xs">(optional)</span>
                                </label>
                                <select
                                    id="report-stream"
                                    value={stream}
                                    onChange={e => setStream(e.target.value)}
                                    className="input-clean w-36"
                                >
                                    <option value="">All Streams</option>
                                    {STREAMS.map(st => (
                                        <option key={st} value={st.toLowerCase()}>{st}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Clear filters */}
                        {(cls || section || stream) && (
                            <div className="flex flex-col justify-end">
                                <button
                                    onClick={clearFilters}
                                    className="btn-ghost btn-sm"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* ── Report Card ── */}
            <div className="mb-6">
                {REPORTS.map(report => (
                    <ReportCardItem
                        key={report.key}
                        report={report}
                        loading={loading}
                        onDownload={handleDownload}
                    />
                ))}
            </div>

            {/* ── Info Footer ── */}
            <div className="portal-card">
                <div className="portal-card-body">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" aria-hidden />
                        <div>
                            <p className="text-sm font-semibold text-text-primary mb-2">
                                Report Generation Tips
                            </p>
                            <ul className="text-xs text-text-muted space-y-1.5 leading-relaxed">
                                <li className="flex items-start gap-2">
                                    <span className="text-warning-600 flex-shrink-0 mt-0.5">•</span>
                                    <span><strong>PDF reports</strong> are best for printing and official records with formatted layouts</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-warning-600 flex-shrink-0 mt-0.5">•</span>
                                    <span><strong>Excel files</strong> allow further data analysis, custom formatting, and pivot tables</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-warning-600 flex-shrink-0 mt-0.5">•</span>
                                    <span>Use <strong>class and section filters</strong> to generate targeted reports for specific groups</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-warning-600 flex-shrink-0 mt-0.5">•</span>
                                    <span>Students with <strong className="text-danger-600">attendance below 75%</strong> are automatically highlighted in red</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-warning-600 flex-shrink-0 mt-0.5">•</span>
                                    <span>Students with <strong className="text-success-600">attendance above 90%</strong> are highlighted in green</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}