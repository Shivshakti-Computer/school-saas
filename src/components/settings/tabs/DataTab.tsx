// FILE: src/components/settings/tabs/DataTab.tsx
// Audit logs viewer + data export

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Download, RefreshCw, Filter, Search,
    AlertTriangle, Info, CheckCircle,
    XCircle, Clock, ChevronLeft, ChevronRight,
    FileJson, FileText,
} from 'lucide-react'
import { SettingSection } from '../shared/SettingSection'
import type {
    AuditLogEntry,
    AuditLogFilters,
    ExportDataType,
    ExportFormat,
} from '@/types/settings'

// ── Risk badge colors ──
const RISK_COLORS: Record<string, string> = {
    LOW: 'badge-neutral',
    MEDIUM: 'badge-info',
    HIGH: 'badge-warning',
    CRITICAL: 'badge-danger',
}

const STATUS_ICONS: Record<string, React.ElementType> = {
    SUCCESS: CheckCircle,
    FAILURE: XCircle,
}

const ACTION_OPTIONS = [
    'LOGIN', 'LOGIN_FAILED', 'CREATE', 'UPDATE', 'DELETE',
    'SETTINGS_CHANGE', 'EXPORT', 'IMPORT', 'PERMISSION_CHANGE',
    'PASSWORD_CHANGE', '2FA_ENABLE', '2FA_DISABLE', 'MODULE_ACCESS_DENIED',
]

const RESOURCE_OPTIONS = [
    'Auth', 'School', 'Student', 'Staff', 'Fee', 'Exam',
    'Notice', 'Attendance', 'System',
]

export function DataTab() {
    // ── Audit Logs State ──
    const [logs, setLogs] = useState<AuditLogEntry[]>([])
    const [total, setTotal] = useState(0)
    const [totalPages, setTotalPages] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [filters, setFilters] = useState<AuditLogFilters>({
        page: 1,
        limit: 20,
    })
    const [showFilters, setShowFilters] = useState(false)
    const [searchInput, setSearchInput] = useState('')

    // ── Export State ──
    const [exportType, setExportType] = useState<ExportDataType>('students')
    const [exportFormat, setExportFormat] = useState<ExportFormat>('csv')
    const [exportLoading, setExportLoading] = useState(false)
    const [exportError, setExportError] = useState<string | null>(null)
    const [exportSuccess, setExportSuccess] = useState<string | null>(null)

    // Fetch logs
    const fetchLogs = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const params = new URLSearchParams()
            Object.entries(filters).forEach(([k, v]) => {
                if (v !== undefined && v !== '') params.set(k, String(v))
            })

            const res = await fetch(`/api/settings/data/audit?${params}`)
            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Failed to load logs')

            setLogs(data.logs || [])
            setTotal(data.total || 0)
            setTotalPages(data.totalPages || 1)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [filters])

    useEffect(() => {
        fetchLogs()
    }, [fetchLogs])

    // Search debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters((prev) => ({ ...prev, search: searchInput || undefined, page: 1 }))
        }, 400)
        return () => clearTimeout(timer)
    }, [searchInput])

    const updateFilter = (
        key: keyof AuditLogFilters,
        val: any
    ) => {
        setFilters((prev) => ({
            ...prev,
            [key]: val || undefined,
            page: key !== 'page' ? 1 : val,
        }))
    }

    // ── Export ──
    const handleExport = async () => {
        setExportLoading(true)
        setExportError(null)
        setExportSuccess(null)

        try {
            const res = await fetch('/api/settings/data/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dataType: exportType,
                    format: exportFormat,
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Export failed')
            }

            // Get filename from header
            const disposition = res.headers.get('Content-Disposition') || ''
            const match = disposition.match(/filename="(.+)"/)
            const filename = match?.[1] || `${exportType}_export.${exportFormat}`
            const recordCount = res.headers.get('X-Record-Count')

            // Download
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            URL.revokeObjectURL(url)
            document.body.removeChild(a)

            setExportSuccess(
                `Exported ${recordCount || '?'} records as ${exportFormat.toUpperCase()}`
            )

        } catch (err: any) {
            setExportError(err.message)
        } finally {
            setExportLoading(false)
        }
    }

    // Format date
    const formatDate = (iso: string) => {
        return new Date(iso).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    return (
        <div className="space-y-5 portal-content-enter">

            {/* ── Data Export ── */}
            <SettingSection
                title="Export Data"
                description="Download school data as CSV or JSON"
            >
                {exportError && (
                    <div className="mb-3 p-3 bg-[var(--danger-light)] border border-[rgba(239,68,68,0.2)] rounded-[var(--radius-md)] text-sm text-[var(--danger-dark)]">
                        {exportError}
                    </div>
                )}
                {exportSuccess && (
                    <div className="mb-3 p-3 bg-[var(--success-light)] border border-[rgba(16,185,129,0.2)] rounded-[var(--radius-md)] text-sm text-[var(--success-dark)]">
                        ✓ {exportSuccess}
                    </div>
                )}

                <div className="flex flex-wrap items-end gap-4">
                    {/* Data type */}
                    <div className="flex-1 min-w-32">
                        <label className="input-label">Data Type</label>
                        <select
                            value={exportType}
                            onChange={(e) => setExportType(e.target.value as ExportDataType)}
                            className="input-clean"
                        >
                            {(
                                [
                                    { value: 'students', label: 'Students' },
                                    { value: 'staff', label: 'Staff' },
                                    { value: 'fees', label: 'Fees' },
                                    { value: 'attendance', label: 'Attendance' },
                                    { value: 'notices', label: 'Notices' },
                                ] as { value: ExportDataType; label: string }[]
                            ).map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Format */}
                    <div>
                        <label className="input-label">Format</label>
                        <div className="flex gap-2">
                            {(
                                [
                                    { value: 'csv', label: 'CSV', Icon: FileText },
                                    { value: 'json', label: 'JSON', Icon: FileJson },
                                ] as {
                                    value: ExportFormat
                                    label: string
                                    Icon: React.ElementType
                                }[]
                            ).map((fmt) => (
                                <button
                                    key={fmt.value}
                                    type="button"
                                    onClick={() => setExportFormat(fmt.value)}
                                    className={`
                    flex items-center gap-1.5 px-4 py-2.5
                    rounded-[var(--radius-md)] border text-sm font-600
                    transition-all
                    ${exportFormat === fmt.value
                                            ? 'bg-[var(--primary-50)] border-[var(--primary-300)] text-[var(--primary-600)]'
                                            : 'bg-[var(--bg-muted)] border-[var(--border)] text-[var(--text-secondary)]'
                                        }
                  `}
                                >
                                    <fmt.Icon size={14} />
                                    {fmt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Export button */}
                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={exportLoading}
                        className="btn-primary"
                    >
                        {exportLoading ? (
                            <RefreshCw size={15} className="animate-spin" />
                        ) : (
                            <Download size={15} />
                        )}
                        {exportLoading ? 'Exporting...' : 'Export'}
                    </button>
                </div>

                <div
                    className="
            mt-4 flex items-start gap-2 p-3
            bg-[var(--bg-muted)] rounded-[var(--radius-md)]
          "
                >
                    <Info size={13} className="text-[var(--text-muted)] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-[var(--text-muted)]">
                        Exports are generated in real-time. Large datasets may take a few seconds.
                        Sensitive data (passwords, keys) is never included in exports.
                    </p>
                </div>
            </SettingSection>

            {/* ── Audit Logs ── */}
            <SettingSection
                title="Audit Logs"
                description={`Activity log — ${total.toLocaleString()} total records`}
                headerAction={
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className={`btn-ghost btn-sm ${showFilters ? 'bg-[var(--bg-muted)]' : ''}`}
                        >
                            <Filter size={13} />
                            Filters
                        </button>
                        <button
                            type="button"
                            onClick={fetchLogs}
                            disabled={loading}
                            className="btn-icon btn-icon-sm"
                            title="Refresh"
                        >
                            <RefreshCw
                                size={13}
                                className={loading ? 'animate-spin' : ''}
                            />
                        </button>
                    </div>
                }
            >
                {/* Search */}
                <div className="portal-search mb-3">
                    <Search size={14} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by user, description..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                </div>

                {/* Filters panel */}
                {showFilters && (
                    <div
                        className="
              grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3
              p-3 bg-[var(--bg-muted)]
              rounded-[var(--radius-md)] border border-[var(--border)]
            "
                    >
                        <div>
                            <label className="input-label text-xs">Action</label>
                            <select
                                value={filters.action || ''}
                                onChange={(e) => updateFilter('action', e.target.value)}
                                className="input-clean text-xs py-1.5"
                            >
                                <option value="">All Actions</option>
                                {ACTION_OPTIONS.map((a) => (
                                    <option key={a} value={a}>{a}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="input-label text-xs">Resource</label>
                            <select
                                value={filters.resource || ''}
                                onChange={(e) => updateFilter('resource', e.target.value)}
                                className="input-clean text-xs py-1.5"
                            >
                                <option value="">All Resources</option>
                                {RESOURCE_OPTIONS.map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="input-label text-xs">Risk Level</label>
                            <select
                                value={filters.riskLevel || ''}
                                onChange={(e) => updateFilter('riskLevel', e.target.value)}
                                className="input-clean text-xs py-1.5"
                            >
                                <option value="">All Levels</option>
                                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="input-label text-xs">Status</label>
                            <select
                                value={filters.status || ''}
                                onChange={(e) => updateFilter('status', e.target.value)}
                                className="input-clean text-xs py-1.5"
                            >
                                <option value="">All</option>
                                <option value="SUCCESS">Success</option>
                                <option value="FAILURE">Failure</option>
                            </select>
                        </div>
                        <div>
                            <label className="input-label text-xs">From Date</label>
                            <input
                                type="date"
                                value={filters.dateFrom || ''}
                                onChange={(e) => updateFilter('dateFrom', e.target.value)}
                                className="input-clean text-xs py-1.5"
                            />
                        </div>
                        <div>
                            <label className="input-label text-xs">To Date</label>
                            <input
                                type="date"
                                value={filters.dateTo || ''}
                                onChange={(e) => updateFilter('dateTo', e.target.value)}
                                className="input-clean text-xs py-1.5"
                            />
                        </div>
                        <div className="col-span-2 flex items-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setFilters({ page: 1, limit: 20 })
                                    setSearchInput('')
                                }}
                                className="btn-ghost btn-sm text-xs"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="p-3 bg-[var(--danger-light)] rounded-[var(--radius-md)] text-sm text-[var(--danger-dark)] mb-3">
                        {error}
                    </div>
                )}

                {/* Logs table */}
                <div className="table-wrapper">
                    <table className="portal-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Action</th>
                                <th>Resource</th>
                                <th>User</th>
                                <th>Description</th>
                                <th>Risk</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={7} className="py-10 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <RefreshCw
                                                size={18}
                                                className="animate-spin text-[var(--text-muted)]"
                                            />
                                            <span className="text-xs text-[var(--text-muted)]">
                                                Loading logs...
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {!loading && logs.length === 0 && (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="portal-empty">
                                            <div className="portal-empty-icon">
                                                <Clock size={20} />
                                            </div>
                                            <p className="portal-empty-title">No logs found</p>
                                            <p className="portal-empty-text">
                                                Try adjusting your filters
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {!loading &&
                                logs.map((log) => {
                                    const StatusIcon =
                                        STATUS_ICONS[log.status] || Info

                                    return (
                                        <tr key={log.id}>
                                            <td className="whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                                                    <Clock size={11} />
                                                    {formatDate(log.createdAt)}
                                                </div>
                                            </td>

                                            <td>
                                                <span
                                                    className="
                            px-2 py-0.5 rounded-[var(--radius-xs)]
                            bg-[var(--bg-muted)]
                            text-xs font-600 font-mono
                            text-[var(--text-secondary)]
                          "
                                                >
                                                    {log.action}
                                                </span>
                                            </td>

                                            <td className="text-xs text-[var(--text-muted)]">
                                                {log.resource}
                                                {log.resourceId && (
                                                    <span className="font-mono ml-1 opacity-60">
                                                        #{log.resourceId.slice(-4)}
                                                    </span>
                                                )}
                                            </td>

                                            <td>
                                                <div>
                                                    <p className="text-xs font-600 text-[var(--text-primary)]">
                                                        {log.userName}
                                                    </p>
                                                    <p className="text-[11px] text-[var(--text-muted)] capitalize">
                                                        {log.userRole}
                                                    </p>
                                                </div>
                                            </td>

                                            <td className="max-w-xs">
                                                <p className="text-xs text-[var(--text-secondary)] truncate">
                                                    {log.description}
                                                </p>
                                            </td>

                                            <td>
                                                <span className={`badge ${RISK_COLORS[log.riskLevel] || 'badge-neutral'} text-[10px]`}>
                                                    {log.riskLevel}
                                                </span>
                                            </td>

                                            <td>
                                                <div
                                                    className={`
                            flex items-center gap-1 text-xs font-600
                            ${log.status === 'SUCCESS'
                                                            ? 'text-[var(--success)]'
                                                            : 'text-[var(--danger)]'
                                                        }
                          `}
                                                >
                                                    <StatusIcon size={12} />
                                                    {log.status}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div
                        className="
              flex items-center justify-between
              mt-4 pt-4 border-t border-[var(--border)]
            "
                    >
                        <p className="text-xs text-[var(--text-muted)]">
                            Showing {((filters.page || 1) - 1) * (filters.limit || 20) + 1}–
                            {Math.min(
                                (filters.page || 1) * (filters.limit || 20),
                                total
                            )}{' '}
                            of {total.toLocaleString()} logs
                        </p>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() =>
                                    updateFilter('page', Math.max(1, (filters.page || 1) - 1))
                                }
                                disabled={(filters.page || 1) <= 1 || loading}
                                className="btn-icon btn-icon-sm"
                            >
                                <ChevronLeft size={14} />
                            </button>

                            <span className="text-xs text-[var(--text-muted)] px-2">
                                {filters.page || 1} / {totalPages}
                            </span>

                            <button
                                type="button"
                                onClick={() =>
                                    updateFilter(
                                        'page',
                                        Math.min(totalPages, (filters.page || 1) + 1)
                                    )
                                }
                                disabled={(filters.page || 1) >= totalPages || loading}
                                className="btn-icon btn-icon-sm"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </SettingSection>
        </div>
    )
}