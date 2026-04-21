// FILE: src/components/settings/tabs/DataTab.tsx
// ═══════════════════════════════════════════════════════════
// ✅ COMPLETE: Storage Usage + Credits Balance + Audit Logs
// ═══════════════════════════════════════════════════════════

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Download, RefreshCw, Filter, Search,
    AlertTriangle, Info, CheckCircle,
    XCircle, Clock, ChevronLeft, ChevronRight,
    FileJson, FileText, HardDrive, CreditCard,
    MessageSquare, Mail, Smartphone, TrendingUp,
    Package, Zap, Calendar, AlertCircle,
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

// ── Storage & Credits Types ──
interface StorageStats {
    planBaseGB: number
    addonGB: number
    totalLimitGB: number
    usedBytes: number
    usedGB: number
    usedPercent: number
    freeBytes: number | -1
    freeGB: number
    isUnlimited: boolean
    isNearLimit: boolean
    isFull: boolean
    addonCap: number
    remainingAddonGB: number
    canPurchaseMore: boolean
    addonValidUntil?: Date
    addonExpired: boolean
    daysUntilRenewal?: number
    breakdown?: Array<{
        folder: string
        size: number
        sizeGB: number
        sizeMB: number
        fileCount: number
    }>
}

interface CreditStats {
    balance: number
    totalEarned: number
    totalUsed: number
    totalExpired: number
    extraStudents: number
    extraTeachers: number
    effectiveMaxStudents: number
    effectiveMaxTeachers: number
    freeCreditsPerMonth: number
    rolloverMonths: number
    lowCreditWarning: boolean
    last30DaysUsage: Array<{
        _id: string
        totalCredits: number
        count: number
    }>
}

export function DataTab() {
    // ── Storage Stats State ──
    const [storageStats, setStorageStats] = useState<StorageStats | null>(null)
    const [storageLoading, setStorageLoading] = useState(false)
    const [storageError, setStorageError] = useState<string | null>(null)

    // ── Credits Stats State ──
    const [creditStats, setCreditStats] = useState<CreditStats | null>(null)
    const [creditsLoading, setCreditsLoading] = useState(false)
    const [creditsError, setCreditsError] = useState<string | null>(null)

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

    // ── Fetch Storage Stats ──
    const fetchStorageStats = useCallback(async () => {
        setStorageLoading(true)
        setStorageError(null)

        try {
            const res = await fetch('/api/storage/usage')
            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Failed to load storage stats')

            setStorageStats(data.data)
        } catch (err: any) {
            setStorageError(err.message)
        } finally {
            setStorageLoading(false)
        }
    }, [])

    // ── Fetch Credits Stats ──
    const fetchCreditStats = useCallback(async () => {
        setCreditsLoading(true)
        setCreditsError(null)

        try {
            const res = await fetch('/api/credits/balance')
            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Failed to load credits')

            setCreditStats(data.data)
        } catch (err: any) {
            setCreditsError(err.message)
        } finally {
            setCreditsLoading(false)
        }
    }, [])

    // ── Load all data on mount ──
    useEffect(() => {
        fetchStorageStats()
        fetchCreditStats()
    }, [fetchStorageStats, fetchCreditStats])

    // ── Fetch logs ──
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

    const updateFilter = (key: keyof AuditLogFilters, val: any) => {
        setFilters((prev) => ({
            ...prev,
            [key]: val || undefined,
            page: key !== 'page' ? 1 : val,
        }))
    }

    // ── Format helpers ──
    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const formatDate = (iso: string) => {
        return new Date(iso).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
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

            const disposition = res.headers.get('Content-Disposition') || ''
            const match = disposition.match(/filename="(.+)"/)
            const filename = match?.[1] || `${exportType}_export.${exportFormat}`
            const recordCount = res.headers.get('X-Record-Count')

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

    return (
        <div className="space-y-5 portal-content-enter">

            {/* ═══════════════════════════════════════════════════
                STORAGE USAGE
            ═══════════════════════════════════════════════════ */}
            <SettingSection
                title="Storage Usage"
                description="Cloud storage for photos, documents, and files"
                headerAction={
                    <button
                        type="button"
                        onClick={fetchStorageStats}
                        disabled={storageLoading}
                        className="btn-icon btn-icon-sm"
                        title="Refresh"
                    >
                        <RefreshCw
                            size={13}
                            className={storageLoading ? 'animate-spin' : ''}
                        />
                    </button>
                }
            >
                {storageLoading && (
                    <div className="flex items-center justify-center py-10">
                        <RefreshCw size={20} className="animate-spin text-[var(--text-muted)]" />
                        <span className="ml-2 text-sm text-[var(--text-muted)]">Loading storage stats...</span>
                    </div>
                )}

                {storageError && (
                    <div className="p-3 bg-[var(--danger-light)] border border-[rgba(239,68,68,0.2)] rounded-[var(--radius-md)] text-sm text-[var(--danger-dark)]">
                        {storageError}
                    </div>
                )}

                {storageStats && !storageLoading && (
                    <div className="space-y-4">
                        {/* Progress Bar */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-600 text-[var(--text-secondary)]">
                                    {storageStats.isUnlimited ? (
                                        <span className="flex items-center gap-1">
                                            <Zap size={14} />
                                            Unlimited Storage
                                        </span>
                                    ) : (
                                        `${storageStats.usedPercent}% Used`
                                    )}
                                </span>
                                <span className="text-xs text-[var(--text-muted)]">
                                    {storageStats.isUnlimited ? (
                                        'No limits'
                                    ) : (
                                        `${storageStats.usedGB} GB / ${storageStats.totalLimitGB} GB`
                                    )}
                                </span>
                            </div>

                            {!storageStats.isUnlimited && (
                                <div className="h-3 bg-[var(--bg-muted)] rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                            storageStats.usedPercent >= 95
                                                ? 'bg-[var(--danger)]'
                                                : storageStats.usedPercent >= 80
                                                ? 'bg-[var(--warning)]'
                                                : 'bg-[var(--primary-500)]'
                                        }`}
                                        style={{ width: `${storageStats.usedPercent}%` }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-[var(--bg-muted)] rounded-[var(--radius-md)] p-3 border border-[var(--border)]">
                                <p className="text-xs text-[var(--text-muted)] mb-1">Used</p>
                                <p className="text-lg font-700 text-[var(--text-primary)]">
                                    {storageStats.usedGB} GB
                                </p>
                            </div>

                            <div className="bg-[var(--bg-muted)] rounded-[var(--radius-md)] p-3 border border-[var(--border)]">
                                <p className="text-xs text-[var(--text-muted)] mb-1">
                                    {storageStats.isUnlimited ? 'Storage' : 'Total Limit'}
                                </p>
                                <p className="text-lg font-700 text-[var(--text-primary)]">
                                    {storageStats.isUnlimited ? '∞' : `${storageStats.totalLimitGB} GB`}
                                </p>
                            </div>

                            <div className="bg-[var(--bg-muted)] rounded-[var(--radius-md)] p-3 border border-[var(--border)]">
                                <p className="text-xs text-[var(--text-muted)] mb-1">
                                    {storageStats.isUnlimited ? 'Available' : 'Free'}
                                </p>
                                <p className={`text-lg font-700 ${
                                    storageStats.isUnlimited
                                        ? 'text-[var(--success)]'
                                        : storageStats.freeGB < 1
                                        ? 'text-[var(--danger)]'
                                        : 'text-[var(--success)]'
                                }`}>
                                    {storageStats.isUnlimited ? '∞' : `${storageStats.freeGB} GB`}
                                </p>
                            </div>

                            <div className="bg-[var(--bg-muted)] rounded-[var(--radius-md)] p-3 border border-[var(--border)]">
                                <p className="text-xs text-[var(--text-muted)] mb-1">Addon</p>
                                <p className="text-lg font-700 text-[var(--primary-600)]">
                                    +{storageStats.addonGB} GB
                                </p>
                            </div>
                        </div>

                        {/* Storage Breakdown */}
                        {storageStats.breakdown && storageStats.breakdown.length > 0 && (
                            <div>
                                <p className="text-xs font-600 text-[var(--text-secondary)] mb-2">
                                    <HardDrive size={12} className="inline mr-1" />
                                    Storage Breakdown
                                </p>
                                <div className="space-y-2">
                                    {storageStats.breakdown.map((item) => (
                                        <div
                                            key={item.folder}
                                            className="flex items-center justify-between p-2 bg-[var(--bg-subtle)] rounded-[var(--radius-sm)]"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Package size={14} className="text-[var(--text-muted)]" />
                                                <span className="text-sm capitalize text-[var(--text-secondary)]">
                                                    {item.folder}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-600 text-[var(--text-primary)]">
                                                    {item.sizeMB} MB
                                                </p>
                                                <p className="text-[10px] text-[var(--text-muted)]">
                                                    {item.fileCount} files
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Addon Expiry Warning */}
                        {storageStats.addonGB > 0 && storageStats.daysUntilRenewal && (
                            <div className={`flex items-start gap-2 p-3 rounded-[var(--radius-md)] ${
                                storageStats.addonExpired
                                    ? 'bg-[var(--danger-light)] border border-[rgba(239,68,68,0.2)]'
                                    : storageStats.daysUntilRenewal <= 7
                                    ? 'bg-[var(--warning-light)] border border-[rgba(245,158,11,0.2)]'
                                    : 'bg-[var(--info-light)] border border-[rgba(59,130,246,0.2)]'
                            }`}>
                                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                                <div className="flex-1 text-sm">
                                    <p className={`font-600 ${
                                        storageStats.addonExpired
                                            ? 'text-[var(--danger-dark)]'
                                            : storageStats.daysUntilRenewal <= 7
                                            ? 'text-[var(--warning-dark)]'
                                            : 'text-[var(--info-dark)]'
                                    }`}>
                                        {storageStats.addonExpired
                                            ? 'Storage addon expired!'
                                            : `Storage addon expires in ${storageStats.daysUntilRenewal} days`}
                                    </p>
                                    <p className={`text-xs ${
                                        storageStats.addonExpired
                                            ? 'text-[var(--danger)]'
                                            : storageStats.daysUntilRenewal <= 7
                                            ? 'text-[var(--warning)]'
                                            : 'text-[var(--info)]'
                                    }`}>
                                        {storageStats.addonExpired
                                            ? 'Renew now to avoid losing extra storage.'
                                            : 'Renew before expiry to keep your extra storage.'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2 pt-2">
                            <a
                                href="/admin/subscription"
                                className="btn-primary btn-sm"
                            >
                                <Package size={14} />
                                Purchase Storage
                            </a>

                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        const res = await fetch('/api/storage/export', { method: 'POST' })
                                        const data = await res.json()
                                        if (res.ok) {
                                            alert(data.message || 'Export initiated! Check your email.')
                                        } else {
                                            alert(data.error || 'Export failed')
                                        }
                                    } catch (err: any) {
                                        alert('Export failed: ' + err.message)
                                    }
                                }}
                                className="btn-secondary btn-sm"
                            >
                                <Download size={14} />
                                Export Data
                            </button>

                            {storageStats.canPurchaseMore && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        window.location.href = '/admin/subscription'
                                    }}
                                    className="btn-ghost btn-sm"
                                >
                                    <TrendingUp size={14} />
                                    Upgrade Plan
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </SettingSection>

            {/* ═══════════════════════════════════════════════════
                CREDITS BALANCE
            ═══════════════════════════════════════════════════ */}
            <SettingSection
                title="Credits Balance"
                description="SMS, WhatsApp & Email messaging credits"
                headerAction={
                    <button
                        type="button"
                        onClick={fetchCreditStats}
                        disabled={creditsLoading}
                        className="btn-icon btn-icon-sm"
                        title="Refresh"
                    >
                        <RefreshCw
                            size={13}
                            className={creditsLoading ? 'animate-spin' : ''}
                        />
                    </button>
                }
            >
                {creditsLoading && (
                    <div className="flex items-center justify-center py-10">
                        <RefreshCw size={20} className="animate-spin text-[var(--text-muted)]" />
                        <span className="ml-2 text-sm text-[var(--text-muted)]">Loading credits...</span>
                    </div>
                )}

                {creditsError && (
                    <div className="p-3 bg-[var(--danger-light)] border border-[rgba(239,68,68,0.2)] rounded-[var(--radius-md)] text-sm text-[var(--danger-dark)]">
                        {creditsError}
                    </div>
                )}

                {creditStats && !creditsLoading && (
                    <div className="space-y-4">
                        {/* Main Balance */}
                        <div className={`p-4 rounded-[var(--radius-lg)] border ${
                            creditStats.lowCreditWarning
                                ? 'bg-[var(--warning-light)] border-[rgba(245,158,11,0.3)]'
                                : 'bg-gradient-to-br from-[var(--primary-50)] to-[var(--primary-100)] border-[var(--primary-200)]'
                        }`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-[var(--text-muted)] mb-1">Total Balance</p>
                                    <p className={`text-3xl font-black ${
                                        creditStats.lowCreditWarning
                                            ? 'text-[var(--warning-dark)]'
                                            : 'text-[var(--primary-700)]'
                                    }`}>
                                        {creditStats.balance.toLocaleString('en-IN')}
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)] mt-1">
                                        Credits (₹1 = 1 Credit)
                                    </p>
                                </div>
                                <CreditCard
                                    size={48}
                                    className={
                                        creditStats.lowCreditWarning
                                            ? 'text-[var(--warning)]'
                                            : 'text-[var(--primary-400)]'
                                    }
                                />
                            </div>

                            {creditStats.lowCreditWarning && (
                                <div className="mt-3 flex items-center gap-2 text-xs text-[var(--warning-dark)]">
                                    <AlertTriangle size={12} />
                                    <span>Low balance! Purchase credits to continue messaging.</span>
                                </div>
                            )}
                        </div>

                        {/* Credits Breakdown */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-[var(--bg-muted)] rounded-[var(--radius-md)] p-3 border border-[var(--border)] text-center">
                                <Smartphone size={20} className="mx-auto mb-1 text-[var(--primary-500)]" />
                                <p className="text-[10px] text-[var(--text-muted)] mb-1">SMS</p>
                                <p className="text-lg font-700 text-[var(--text-primary)]">
                                    ~{Math.floor(creditStats.balance)} msgs
                                </p>
                            </div>

                            <div className="bg-[var(--bg-muted)] rounded-[var(--radius-md)] p-3 border border-[var(--border)] text-center">
                                <MessageSquare size={20} className="mx-auto mb-1 text-[var(--success-500)]" />
                                <p className="text-[10px] text-[var(--text-muted)] mb-1">WhatsApp</p>
                                <p className="text-lg font-700 text-[var(--text-primary)]">
                                    ~{Math.floor(creditStats.balance)} msgs
                                </p>
                            </div>

                            <div className="bg-[var(--bg-muted)] rounded-[var(--radius-md)] p-3 border border-[var(--border)] text-center">
                                <Mail size={20} className="mx-auto mb-1 text-[var(--info-500)]" />
                                <p className="text-[10px] text-[var(--text-muted)] mb-1">Email</p>
                                <p className="text-lg font-700 text-[var(--text-primary)]">
                                    ~{Math.floor(creditStats.balance * 10)} msgs
                                </p>
                            </div>
                        </div>

                        {/* Monthly Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-[var(--bg-subtle)] rounded-[var(--radius-md)] p-3 border border-[var(--border)]">
                                <p className="text-xs text-[var(--text-muted)] mb-1">Free Credits/Month</p>
                                <p className="text-lg font-700 text-[var(--success-600)]">
                                    {creditStats.freeCreditsPerMonth.toLocaleString('en-IN')}
                                </p>
                                {creditStats.rolloverMonths > 0 && (
                                    <p className="text-[10px] text-[var(--text-muted)] mt-1">
                                        {creditStats.rolloverMonths} months rollover
                                    </p>
                                )}
                                {creditStats.rolloverMonths === 0 && (
                                    <p className="text-[10px] text-[var(--text-muted)] mt-1">
                                        No rollover
                                    </p>
                                )}
                                {creditStats.rolloverMonths === -1 && (
                                    <p className="text-[10px] text-[var(--text-muted)] mt-1">
                                        Never expire
                                    </p>
                                )}
                            </div>

                            <div className="bg-[var(--bg-subtle)] rounded-[var(--radius-md)] p-3 border border-[var(--border)]">
                                <p className="text-xs text-[var(--text-muted)] mb-1">Last 30 Days Used</p>
                                <p className="text-lg font-700 text-[var(--text-primary)]">
                                    {creditStats.last30DaysUsage.reduce((sum, u) => sum + u.totalCredits, 0).toLocaleString('en-IN')}
                                </p>
                            </div>
                        </div>

                        {/* Usage Breakdown */}
                        {creditStats.last30DaysUsage.length > 0 && (
                            <div>
                                <p className="text-xs font-600 text-[var(--text-secondary)] mb-2">
                                    <TrendingUp size={12} className="inline mr-1" />
                                    Last 30 Days Usage
                                </p>
                                <div className="space-y-2">
                                    {creditStats.last30DaysUsage.map((usage) => (
                                        <div
                                            key={usage._id}
                                            className="flex items-center justify-between p-2 bg-[var(--bg-subtle)] rounded-[var(--radius-sm)]"
                                        >
                                            <div className="flex items-center gap-2">
                                                {usage._id === 'sms' && <Smartphone size={14} className="text-[var(--primary-500)]" />}
                                                {usage._id === 'whatsapp' && <MessageSquare size={14} className="text-[var(--success-500)]" />}
                                                {usage._id === 'email' && <Mail size={14} className="text-[var(--info-500)]" />}
                                                <span className="text-sm capitalize text-[var(--text-secondary)]">
                                                    {usage._id}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-600 text-[var(--text-primary)]">
                                                    {usage.totalCredits.toLocaleString('en-IN')} credits
                                                </p>
                                                <p className="text-[10px] text-[var(--text-muted)]">
                                                    {usage.count} messages
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2 pt-2">
                            <a
                                href="/admin/subscription"
                                className="btn-primary btn-sm"
                            >
                                <CreditCard size={14} />
                                Purchase Credits
                            </a>

                            <a
                                href="/admin/subscription"
                                className="btn-secondary btn-sm"
                            >
                                <Calendar size={14} />
                                View Transactions
                            </a>
                        </div>
                    </div>
                )}
            </SettingSection>

            {/* ═══════════════════════════════════════════════════
                DATA EXPORT (Existing)
            ═══════════════════════════════════════════════════ */}
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

                <div className="mt-4 flex items-start gap-2 p-3 bg-[var(--bg-muted)] rounded-[var(--radius-md)]">
                    <Info size={13} className="text-[var(--text-muted)] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-[var(--text-muted)]">
                        Exports are generated in real-time. Large datasets may take a few seconds.
                        Sensitive data (passwords, keys) is never included in exports.
                    </p>
                </div>
            </SettingSection>

            {/* ═══════════════════════════════════════════════════
                AUDIT LOGS (Existing)
            ═══════════════════════════════════════════════════ */}
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
                <div className="portal-search mb-3">
                    <Search size={14} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by user, description..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                </div>

                {showFilters && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 p-3 bg-[var(--bg-muted)] rounded-[var(--radius-md)] border border-[var(--border)]">
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

                {error && (
                    <div className="p-3 bg-[var(--danger-light)] rounded-[var(--radius-md)] text-sm text-[var(--danger-dark)] mb-3">
                        {error}
                    </div>
                )}

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
                                            <RefreshCw size={18} className="animate-spin text-[var(--text-muted)]" />
                                            <span className="text-xs text-[var(--text-muted)]">Loading logs...</span>
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
                                            <p className="portal-empty-text">Try adjusting your filters</p>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {!loading &&
                                logs.map((log) => {
                                    const StatusIcon = STATUS_ICONS[log.status] || Info

                                    return (
                                        <tr key={log.id}>
                                            <td className="whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                                                    <Clock size={11} />
                                                    {formatDate(log.createdAt)}
                                                </div>
                                            </td>

                                            <td>
                                                <span className="px-2 py-0.5 rounded-[var(--radius-xs)] bg-[var(--bg-muted)] text-xs font-600 font-mono text-[var(--text-secondary)]">
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
                                                <div className={`flex items-center gap-1 text-xs font-600 ${
                                                    log.status === 'SUCCESS'
                                                        ? 'text-[var(--success)]'
                                                        : 'text-[var(--danger)]'
                                                }`}>
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

                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)]">
                        <p className="text-xs text-[var(--text-muted)]">
                            Showing {((filters.page || 1) - 1) * (filters.limit || 20) + 1}–
                            {Math.min((filters.page || 1) * (filters.limit || 20), total)} of {total.toLocaleString()} logs
                        </p>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => updateFilter('page', Math.max(1, (filters.page || 1) - 1))}
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
                                onClick={() => updateFilter('page', Math.min(totalPages, (filters.page || 1) + 1))}
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