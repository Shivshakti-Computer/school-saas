// FILE: src/app/(dashboard)/admin/fees/FeesClient.tsx
'use client'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
    CreditCard, Plus, Edit2, Trash2, Users, RefreshCw,
    ChevronRight, X, AlertCircle, Search,
    TrendingUp, AlertTriangle, CheckSquare,
    IndianRupee, Receipt, Settings,
    Zap, Clock, BarChart2,
    Sparkles, Info, Printer,
} from 'lucide-react'
import { Spinner, Alert } from '@/components/ui'
import { Portal } from '@/components/ui/Portal'
import { useAcademicSettings } from '@/hooks/useAcademicSettings'
import { useSession } from 'next-auth/react' // ✅ ADD
import { getTerm } from '@/lib/institutionConfig' // ✅ ADD

/* ═══ Types ═══ */
interface FeeStructure {
    _id: string
    name: string
    class: string
    section: string
    stream?: string
    academicYear: string
    term: string
    totalAmount: number
    dueDate: string
    lateFinePerDay: number
    lateFineType: string
    maxLateFine: number
    isActive: boolean
    autoAssign: boolean
    assignedCount: number
    items: Array<{ label: string; amount: number; isOptional: boolean }>
}

interface FeePaymentRecord {
    amount: number
    paymentMode: string
    receiptNumber: string
    paidAt: string
    razorpayPaymentId?: string
}

interface Fee {
    _id: string
    studentId: {
        _id: string
        admissionNo: string
        class: string
        section: string
        userId: { name: string; phone: string }
    }
    structureId: { _id: string; name: string; term?: string }
    finalAmount: number
    paidAmount: number
    discount: number
    lateFine: number
    dueDate: string
    status: 'pending' | 'paid' | 'partial' | 'waived'
    receiptUrl?: string
    receiptNumber?: string
    paidAt?: string
    paymentMode?: string
    payments?: FeePaymentRecord[]
}

interface PaymentSettings {
    razorpayKeyId?: string
    enableOnlinePayment: boolean
    hasKey?: boolean
}

interface AcademicDerivedConfig {
    classes: string[]
    sections: string[]
    currentAcademicYear: string
    academicYears: string[]
}

/* ═══ Fees-specific constants ═══ */
const TERMS = ['Term 1', 'Term 2', 'Term 3', 'Annual', 'Monthly', 'Quarterly', 'Half Yearly']
const STREAMS = [
    { value: 'science', label: 'Science', color: '#2563EB', bg: '#EFF6FF' },
    { value: 'commerce', label: 'Commerce', color: '#059669', bg: '#ECFDF5' },
    { value: 'arts', label: 'Arts / Humanities', color: '#7C3AED', bg: '#F5F3FF' },
    { value: 'vocational', label: 'Vocational', color: '#D97706', bg: '#FFFBEB' },
]

/* ═══ Fallback constants ═══ */
const FALLBACK_CLASSES = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
const FALLBACK_SECTIONS = ['A', 'B', 'C', 'D', 'E']

/* ═══ Academic Year Helpers ═══ */
function getAcademicYears(): string[] {
    const now = new Date()
    const yr = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
    const years: string[] = []
    for (let y = yr + 1; y >= yr - 2; y--) {
        years.push(`${y}-${String(y + 1).slice(-2)}`)
    }
    return years
}

function getCurrentAcademicYear(): string {
    const now = new Date()
    const yr = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
    return `${yr}-${String(yr + 1).slice(-2)}`
}

/* ═══ Reusable Form Components ═══ */
const FormInput = ({
    label, value, onChange, type = 'text',
    required = false, placeholder = '', helper, disabled = false,
}: {
    label: string; value: string | number; onChange: (val: string) => void
    type?: string; required?: boolean; placeholder?: string
    helper?: string; disabled?: boolean
}) => (
    <div className="flex flex-col gap-1">
        <label className="input-label">
            {label}{required && <span className="text-[var(--danger)]"> *</span>}
        </label>
        <input
            type={type}
            className="input-clean"
            placeholder={placeholder}
            value={value}
            required={required}
            disabled={disabled}
            onChange={e => onChange(e.target.value)}
        />
        {helper && <p className="input-hint">{helper}</p>}
    </div>
)

const FormSelect = ({
    label, value, onChange, options, required = false, helper,
}: {
    label: string; value: string; onChange: (val: string) => void
    options: { value: string; label: string }[]
    required?: boolean; helper?: string
}) => (
    <div className="flex flex-col gap-1">
        <label className="input-label">
            {label}{required && <span className="text-[var(--danger)]"> *</span>}
        </label>
        <select
            className="input-clean"
            value={value}
            required={required}
            onChange={e => onChange(e.target.value)}
        >
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {helper && <p className="input-hint">{helper}</p>}
    </div>
)

/* ═══ Status Badge ═══ */
function FeeBadge({ status, dueDate }: { status: string; dueDate: string }) {
    const isOverdue = status === 'pending' && new Date(dueDate) < new Date()
    const cfg: Record<string, { cls: string; label: string }> = {
        paid: { cls: 'badge-success', label: 'Paid' },
        waived: { cls: 'badge-neutral', label: 'Waived' },
        partial: { cls: 'badge-warning', label: 'Partial' },
        pending: isOverdue
            ? { cls: 'badge-danger', label: 'Overdue' }
            : { cls: 'badge-warning', label: 'Pending' },
    }
    const c = cfg[status] || cfg.pending
    return (
        <span className={`badge ${c.cls}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {c.label}
        </span>
    )
}

/* ═══ Stream Badge ═══ */
function StreamBadge({ stream }: { stream?: string }) {
    if (!stream) return null
    const cfg = STREAMS.find(s => s.value === stream)
    if (!cfg) return null
    return (
        <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-sm)] text-[0.625rem] font-semibold"
            style={{ backgroundColor: cfg.bg, color: cfg.color }}
        >
            <Sparkles size={9} />
            {cfg.label}
        </span>
    )
}

/* ═══ Mini Stat Card ═══ */
function MiniStatCard({
    label, value, icon, iconBg, iconColor, valueColor,
}: {
    label: string; value: string | number
    icon: React.ReactNode; iconBg: string; iconColor: string; valueColor?: string
}) {
    return (
        <div className="portal-stat-card">
            <div className="flex items-center gap-3">
                <div
                    className="stat-icon"
                    style={{ backgroundColor: iconBg }}
                >
                    <span style={{ color: iconColor }}>{icon}</span>
                </div>
                <div>
                    <p
                        className="stat-value"
                        style={{ color: valueColor || 'var(--text-primary)' }}
                    >
                        {value}
                    </p>
                    <p className="stat-label">{label}</p>
                </div>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════
   MAIN CLIENT COMPONENT
   ═══════════════════════════════════════════ */
export default function FeesClient() {

    // Tab type
    type TabId = 'fees' | 'structures' | 'settings'

    // Session + institution
    const { data: session } = useSession()
    const institutionType = session?.user?.institutionType || 'school'
    const isSchool = institutionType === 'school'

    // Dynamic labels
    const studentLabel = getTerm(institutionType, 'student')

    // Tab state
    const [tab, setTab] = useState<TabId>('fees')

    // Tabs config — typed array
    const TABS: Array<{ id: TabId; label: string; icon: React.ReactNode }> = useMemo(() => [
        {
            id: 'fees',
            label: `${studentLabel} Fees`,
            icon: <CreditCard size={14} />,
        },
        {
            id: 'structures',
            label: 'Fee Structures',
            icon: <BarChart2 size={14} />,
        },
        {
            id: 'settings',
            label: 'Payment Settings',
            icon: <Settings size={14} />,
        },
    ], [studentLabel])
    const [selectedCourseId, setSelectedCourseId] = useState('')
    // const [tab, setTab] = useState<'fees' | 'structures' | 'settings'>('fees')
    const [fees, setFees] = useState<Fee[]>([])
    const [structures, setStructures] = useState<FeeStructure[]>([])
    const [loading, setLoading] = useState(true)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const [onlinePayEnabled, setOnlinePayEnabled] = useState(false)

    /* ── Academic settings hook ── */
    const { settings: academicSettings } = useAcademicSettings()

    /* ── Derived academic config ── */
    const academicConfig = useMemo((): AcademicDerivedConfig => {
        if (!academicSettings) {
            return {
                classes: FALLBACK_CLASSES,
                sections: FALLBACK_SECTIONS,
                currentAcademicYear: getCurrentAcademicYear(),
                academicYears: getAcademicYears(),
            }
        }

        const uniqueClasses = [
            ...new Set(
                academicSettings.classes
                    .filter(c => c.isActive)
                    .sort((a, b) => a.order - b.order)
                    .map(c => c.name)
            ),
        ]

        const activeSections = academicSettings.sections
            .filter(s => s.isActive)
            .map(s => s.name)

        const currentYear = academicSettings.currentAcademicYear || getCurrentAcademicYear()
        const years = getAcademicYears()
        if (!years.includes(currentYear)) years.unshift(currentYear)

        return {
            classes: uniqueClasses.length > 0 ? uniqueClasses : FALLBACK_CLASSES,
            sections: activeSections.length > 0 ? activeSections : FALLBACK_SECTIONS,
            currentAcademicYear: currentYear,
            academicYears: years,
        }
    }, [academicSettings])

    /* ── Filters ── */
    const [filterStatus, setFilterStatus] = useState('')
    const [filterClass, setFilterClass] = useState('')
    const [filterSearch, setFilterSearch] = useState('')
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [structureClass, setStructureClass] = useState('')

    /* ── Modals ── */
    const [showStructureModal, setShowStructureModal] = useState(false)
    const [editStructure, setEditStructure] = useState<FeeStructure | null>(null)
    const [showPayModal, setShowPayModal] = useState(false)
    const [selectedFee, setSelectedFee] = useState<Fee | null>(null)
    const [showReceiptModal, setShowReceiptModal] = useState(false)
    const [receiptData, setReceiptData] = useState<any>(null)
    const [showOptionalModal, setShowOptionalModal] = useState(false)
    const [selectedStructure, setSelectedStructure] = useState<FeeStructure | null>(null)

    /* ── Stats ── */
    const totalDue = fees
        .filter(f => ['pending', 'partial'].includes(f.status))
        .reduce((s, f) => s + (f.finalAmount - f.paidAmount), 0)
    const totalPaid = fees
        .filter(f => ['paid', 'partial'].includes(f.status))
        .reduce((s, f) => s + f.paidAmount, 0)
    const overdueCount = fees
        .filter(f => ['pending', 'partial'].includes(f.status) && new Date(f.dueDate) < new Date())
        .length
    const partialCount = fees.filter(f => f.status === 'partial').length

    /* ── Payment settings check ── */
    useEffect(() => {
        fetch('/api/payment-settings')
            .then(r => r.json())
            .then(d => setOnlinePayEnabled(d.settings?.enableOnlinePayment && d.settings?.hasKey))
            .catch(() => { })
    }, [])

    /* ── Fetch fees ── */
    const fetchFees = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (filterStatus) params.set('status', filterStatus)
            if (filterClass) params.set('class', filterClass)
            if (filterSearch) params.set('search', filterSearch)
            const res = await fetch(`/api/fees?${params}`)
            const data = await res.json()
            setFees(data.fees ?? [])
        } finally {
            setLoading(false)
        }
    }, [filterStatus, filterClass, filterSearch])

    // ✅ Update fetchStructures to accept optional courseId
    const fetchStructures = useCallback(async (courseIdOverride?: string) => {
        setLoading(true)
        try {
            const params = new URLSearchParams()

            // School filter
            if (isSchool && structureClass) {
                params.set('class', structureClass)
            }

            // Academy/Coaching filter
            const cid = courseIdOverride ?? selectedCourseId
            if (!isSchool && cid) {
                params.set('courseId', cid)
            }

            const res = await fetch(`/api/fees/structure?${params}`)
            const data = await res.json()
            setStructures(data.structures ?? [])
        } finally {
            setLoading(false)
        }
    }, [isSchool, structureClass, selectedCourseId])

    useEffect(() => {
        if (tab === 'fees') fetchFees()
        else if (tab === 'structures') fetchStructures()
        else setLoading(false)
    }, [tab, fetchFees, fetchStructures])

    /* ── Debounced search ── */
    useEffect(() => {
        if (tab !== 'fees') return
        if (searchTimeout.current) clearTimeout(searchTimeout.current)
        searchTimeout.current = setTimeout(() => fetchFees(), 300)
        return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current) }
    }, [filterSearch, fetchFees, tab])

    /* ── BroadcastChannel — academic settings update ── */
    useEffect(() => {
        const channel = new BroadcastChannel('settings-update')
        channel.onmessage = (event) => {
            if (event.data.type === 'academic-updated') {
                const affected: string[] = event.data.affectedModules || []
                if (affected.includes('all') || affected.includes('students')) {
                    if (tab === 'fees') fetchFees()
                    if (tab === 'structures') fetchStructures()
                }
            }
        }
        return () => channel.close()
    }, [tab, fetchFees, fetchStructures])

    const showSuccess = (msg: string) => {
        setAlert({ type: 'success', msg })
        setTimeout(() => setAlert(null), 4000)
    }
    const showError = (msg: string) => setAlert({ type: 'error', msg })

    /* ── Actions ── */
    const deleteStructure = async (id: string) => {
        if (!confirm('Is fee structure ko deactivate karna chahte hain?')) return
        const res = await fetch(`/api/fees/structure/${id}`, { method: 'DELETE' })
        if (res.ok) { showSuccess('Structure deactivated'); fetchStructures() }
        else showError('Failed to deactivate')
    }

    const applyLateFine = async (id: string, name: string) => {
        if (!confirm(`"${name}" ke liye late fine apply karna chahte hain?`)) return
        const res = await fetch(`/api/fees/structure/${id}/late-fine`, { method: 'POST' })
        const data = await res.json()
        if (res.ok) showSuccess(`Late fine applied to ${data.updated} fees`)
        else showError('Failed to apply late fine')
    }

    const assignToAll = async (id: string, name: string) => {
        if (!confirm(`"${name}" ko is class ke saare students ko assign karna chahte hain?`)) return
        const res = await fetch(`/api/fees/structure/${id}/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assignAll: true }),
        })
        const data = await res.json()
        if (res.ok) {
            showSuccess(`${data.created} new fees assigned (${data.skipped} already had it)`)
            fetchStructures()
        } else showError('Failed to assign fees')
    }

    /* ── Record payment ── */
    const recordPayment = async (
        feeId: string, paymentMode: string, amount: number, notes?: string
    ) => {
        const res = await fetch(`/api/fees/${feeId}/mark-paid`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentMode, amount, notes }),
        })
        const data = await res.json()
        if (res.ok) {
            showSuccess(`Payment of ₹${amount.toLocaleString('en-IN')} recorded. Receipt: ${data.receiptNumber}`)
            setShowPayModal(false)
            setSelectedFee(null)
            fetchFees()
            if (data.receipt) {
                setReceiptData(data.receipt)
                setShowReceiptModal(true)
            }
        } else {
            showError(data.error || 'Failed to record payment')
        }
    }

    /* ── View receipt ── */
    const viewReceipt = async (feeId: string, paymentIndex?: number) => {
        try {
            const params = paymentIndex !== undefined ? `?paymentIndex=${paymentIndex}` : ''
            const res = await fetch(`/api/fees/${feeId}/receipt${params}`)
            const data = await res.json()
            if (res.ok) { setReceiptData(data.receipt); setShowReceiptModal(true) }
            else showError('Failed to load receipt')
        } catch { showError('Failed to load receipt') }
    }

    return (
        <div className="space-y-5 pb-8">

            {/* ═══ PAGE HEADER — small update ═══ */}
            <div className="portal-page-header">
                <div>
                    <div className="portal-breadcrumb mb-1.5">
                        <span>Dashboard</span>
                        <ChevronRight size={12} />
                        <span className="bc-current">Fee Management</span>
                    </div>
                    <h1 className="portal-page-title">Fee Management</h1>
                    <p className="portal-page-subtitle">
                        {isSchool
                            ? 'School fees manage karein · Structures, collection aur payments'
                            : 'Course fees manage karein · Structures, collection aur payments'
                        }
                    </p>
                </div>
                <div className="flex gap-2">
                    {tab === 'structures' && (
                        <button
                            onClick={() => { setEditStructure(null); setShowStructureModal(true) }}
                            className="btn-primary btn-sm"
                        >
                            <Plus size={14} strokeWidth={2.5} />
                            {isSchool ? 'New Structure' : 'New Course Fee Structure'}
                        </button>
                    )}
                    {tab === 'fees' && (
                        <button
                            onClick={() => fetchFees()}
                            className="btn-icon"
                            aria-label="Refresh fees"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        </button>
                    )}
                </div>
            </div>

            {alert && (
                <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
            )}

            {/* ═══ TABS ═══ */}
            <div
                className="flex gap-1 p-1 rounded-[var(--radius-md)] w-fit"
                style={{ backgroundColor: 'var(--bg-muted)' }}
            >
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}  // ✅ Now works — t.id is TabId
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-sm)] text-[0.8125rem] font-medium transition-all"
                        style={{
                            backgroundColor: tab === t.id ? 'var(--bg-card)' : 'transparent',
                            color: tab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
                            boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',
                        }}
                    >
                        <span style={{ color: tab === t.id ? 'var(--primary-500)' : 'var(--text-light)' }}>
                            {t.icon}
                        </span>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ═══ TAB: STUDENT FEES ═══ */}
            {tab === 'fees' && (
                <div className="space-y-4">

                    {/* Stats */}
                    {!loading && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <MiniStatCard
                                label="Total Due"
                                value={`₹${totalDue.toLocaleString('en-IN')}`}
                                icon={<AlertTriangle size={18} />}
                                iconBg="var(--danger-50)"
                                iconColor="var(--danger)"
                                valueColor="var(--danger)"
                            />
                            <MiniStatCard
                                label="Total Collected"
                                value={`₹${totalPaid.toLocaleString('en-IN')}`}
                                icon={<TrendingUp size={18} />}
                                iconBg="var(--success-50)"
                                iconColor="var(--success)"
                                valueColor="var(--success)"
                            />
                            <MiniStatCard
                                label="Overdue"
                                value={overdueCount}
                                icon={<Clock size={18} />}
                                iconBg="var(--warning-50)"
                                iconColor="var(--warning)"
                                valueColor="var(--warning)"
                            />
                            <MiniStatCard
                                label="Partial Paid"
                                value={partialCount}
                                icon={<IndianRupee size={18} />}
                                iconBg="var(--info-50)"
                                iconColor="var(--info)"
                            />
                        </div>
                    )}

                    {/* Filters */}
                    <div className="portal-card">
                        <div className="portal-card-body-sm">
                            <div className="flex flex-wrap gap-3">
                                <div className="portal-search flex-1 min-w-[200px]">
                                    <Search size={14} className="search-icon" />
                                    <input
                                        placeholder="Search student name, admission no..."
                                        value={filterSearch}
                                        onChange={e => setFilterSearch(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="input-clean"
                                    style={{ minWidth: '120px' }}
                                    value={filterStatus}
                                    onChange={e => setFilterStatus(e.target.value)}
                                >
                                    <option value="">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                    <option value="partial">Partial</option>
                                    <option value="waived">Waived</option>
                                </select>
                                <select
                                    className="input-clean"
                                    style={{ minWidth: '120px' }}
                                    value={filterClass}
                                    onChange={e => setFilterClass(e.target.value)}
                                >
                                    <option value="">All Classes</option>
                                    {academicConfig.classes.map(c => (
                                        <option key={c} value={c}>Class {c}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Fees Table */}
                    <div className="portal-card overflow-hidden">
                        {loading ? (
                            <div className="portal-empty py-20">
                                <Spinner size="lg" />
                                <p className="portal-empty-text mt-3">Loading fees...</p>
                            </div>
                        ) : fees.length === 0 ? (
                            <div className="portal-empty py-20">
                                <div className="portal-empty-icon"><CreditCard size={24} /></div>
                                <p className="portal-empty-title">No fee records found</p>
                                <p className="portal-empty-text">
                                    {filterStatus || filterClass || filterSearch
                                        ? 'Try adjusting your filters'
                                        : 'Pehle fee structure banao, phir students ko assign hoga'}
                                </p>
                                {!filterStatus && !filterClass && !filterSearch && (
                                    <button
                                        onClick={() => setTab('structures')}
                                        className="btn-primary btn-sm mt-4"
                                    >
                                        <Plus size={14} /> Create Fee Structure
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="table-wrapper">
                                <table className="portal-table">
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>Fee Structure</th>
                                            <th>Amount</th>
                                            <th>Paid</th>
                                            <th>Due Date</th>
                                            <th>Status</th>
                                            <th className="text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fees.map(f => {
                                            const student = f.studentId
                                            const structure = f.structureId
                                            const remaining = f.finalAmount - f.paidAmount
                                            const isOverdue = ['pending', 'partial'].includes(f.status)
                                                && new Date(f.dueDate) < new Date()
                                            const daysOverdue = isOverdue
                                                ? Math.floor((Date.now() - new Date(f.dueDate).getTime()) / 86400000)
                                                : 0

                                            return (
                                                <tr key={f._id}>
                                                    <td>
                                                        <div className="flex items-center gap-3">
                                                            <div className="avatar avatar-sm"
                                                                style={{
                                                                    background: 'var(--primary-100)',
                                                                    color: 'var(--primary-700)',
                                                                }}
                                                            >
                                                                {student?.userId?.name?.charAt(0) ?? '?'}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold text-[var(--text-primary)]">
                                                                    {student?.userId?.name ?? 'N/A'}
                                                                </p>
                                                                <p className="text-[0.6875rem] font-mono text-[var(--text-muted)]">
                                                                    {student?.admissionNo} · Class {student?.class}-{student?.section}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <p className="text-sm font-medium text-[var(--text-secondary)]">
                                                            {structure?.name ?? '—'}
                                                        </p>
                                                    </td>
                                                    <td>
                                                        <p className="text-sm font-bold tabular-nums text-[var(--text-primary)]">
                                                            ₹{f.finalAmount.toLocaleString('en-IN')}
                                                        </p>
                                                        {f.discount > 0 && (
                                                            <p className="text-[0.6875rem] text-[var(--success)]">
                                                                Discount: ₹{f.discount}
                                                            </p>
                                                        )}
                                                        {f.lateFine > 0 && (
                                                            <p className="text-[0.6875rem] text-[var(--danger)]">
                                                                Fine: +₹{f.lateFine}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <p className={`text-sm font-bold tabular-nums ${f.paidAmount > 0 ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`}>
                                                            ₹{f.paidAmount.toLocaleString('en-IN')}
                                                        </p>
                                                        {remaining > 0 && f.status !== 'waived' && (
                                                            <p className="text-[0.6875rem] text-[var(--danger)]">
                                                                Due: ₹{remaining.toLocaleString('en-IN')}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <p className="text-sm text-[var(--text-secondary)]">
                                                            {new Date(f.dueDate).toLocaleDateString('en-IN', {
                                                                day: 'numeric', month: 'short', year: '2-digit',
                                                            })}
                                                        </p>
                                                        {isOverdue && (
                                                            <p className="text-[0.6875rem] font-semibold text-[var(--danger)]">
                                                                {daysOverdue}d overdue
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <FeeBadge status={f.status} dueDate={f.dueDate} />
                                                        {f.paidAt && (
                                                            <p className="text-[0.625rem] mt-0.5 text-[var(--text-muted)]">
                                                                Paid: {new Date(f.paidAt).toLocaleDateString('en-IN', {
                                                                    day: 'numeric', month: 'short',
                                                                })}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="flex items-center gap-1 justify-end">
                                                            {['pending', 'partial'].includes(f.status) && (
                                                                <button
                                                                    onClick={() => { setSelectedFee(f); setShowPayModal(true) }}
                                                                    className="badge badge-success cursor-pointer hover:opacity-80 transition-opacity"
                                                                >
                                                                    <CheckSquare size={11} />
                                                                    {f.status === 'partial' ? 'Pay More' : 'Record Payment'}
                                                                </button>
                                                            )}
                                                            {(f.status === 'paid' || f.status === 'partial') && (
                                                                <button
                                                                    onClick={() => viewReceipt(f._id)}
                                                                    className="btn-icon btn-icon-sm"
                                                                    title="View Receipt"
                                                                >
                                                                    <Receipt size={13} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══ TAB: FEE STRUCTURES ═══ */}
            {tab === 'structures' && (
                <div className="space-y-4">

                    {/* ✅ CONDITIONAL FILTERS */}
                    <div className="portal-card">
                        <div className="portal-card-body-sm flex flex-wrap gap-3">

                            {/* SCHOOL: Class filter */}
                            {institutionType === 'school' && (
                                <select
                                    className="input-clean"
                                    style={{ minWidth: '140px' }}
                                    value={structureClass}
                                    onChange={e => setStructureClass(e.target.value)}
                                >
                                    <option value="">All Classes</option>
                                    <option value="all">Global (All Classes)</option>
                                    {academicConfig.classes.map(c => (
                                        <option key={c} value={c}>Class {c}</option>
                                    ))}
                                </select>
                            )}

                            {/* ACADEMY/COACHING: Course filter */}
                            {(institutionType === 'academy' || institutionType === 'coaching') && (
                                <CourseFilterDropdown
                                    value={selectedCourseId}
                                    onChange={val => {
                                        setSelectedCourseId(val)
                                        // ✅ Trigger structure refetch with courseId
                                        fetchStructures(val)
                                    }}
                                />
                            )}

                            <button
                                onClick={() => fetchStructures()}
                                className="btn-icon"
                                aria-label="Refresh structures"
                            >
                                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>

                    {/* Structures Table */}
                    <div className="portal-card overflow-hidden">
                        {loading ? (
                            <div className="portal-empty py-20">
                                <Spinner size="lg" />
                                <p className="portal-empty-text mt-3">Loading structures...</p>
                            </div>
                        ) : structures.length === 0 ? (
                            <div className="portal-empty py-20">
                                <div className="portal-empty-icon"><BarChart2 size={24} /></div>
                                <p className="portal-empty-title">No fee structures</p>
                                <p className="portal-empty-text">
                                    {institutionType === 'school'
                                        ? 'Fee structure banao — class-wise fees define karein'
                                        : 'Course-wise fee structure banao — course select karke fees set karein'
                                    }
                                </p>
                                <button
                                    onClick={() => { setEditStructure(null); setShowStructureModal(true) }}
                                    className="btn-primary btn-sm mt-4"
                                >
                                    <Plus size={14} />
                                    {institutionType === 'school' ? 'Create Structure' : 'Create Course Fee Structure'}
                                </button>
                            </div>
                        ) : (
                            <div className="table-wrapper">
                                <table className="portal-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            {/* ✅ CONDITIONAL column header */}
                                            {institutionType === 'school'
                                                ? <th>Class</th>
                                                : <th>Course</th>
                                            }
                                            <th>Term</th>
                                            <th>Amount</th>
                                            <th>Due Date</th>
                                            <th>Assigned</th>
                                            <th>Status</th>
                                            <th className="text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {structures.map(s => (
                                            <tr key={s._id}>

                                                {/* Name + Academic Year */}
                                                <td>
                                                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                                                        {s.name}
                                                    </p>
                                                    <p className="text-[0.6875rem] text-[var(--text-muted)]">
                                                        {s.academicYear}
                                                    </p>
                                                </td>

                                                {/* ✅ CONDITIONAL: Class OR Course */}
                                                <td>
                                                    {institutionType === 'school' ? (
                                                        /* School: Class + Section + Stream badges */
                                                        <div className="flex flex-col gap-1">
                                                            <span className="badge badge-brand">
                                                                {s.class === 'all'
                                                                    ? 'All Classes'
                                                                    : `Class ${s.class}`
                                                                }
                                                                {s.section && s.section !== 'all'
                                                                    ? `-${s.section}`
                                                                    : ''
                                                                }
                                                            </span>
                                                            {s.stream && <StreamBadge stream={s.stream} />}
                                                        </div>
                                                    ) : (
                                                        /* Academy/Coaching: Course name + code */
                                                        <div className="flex flex-col gap-1">
                                                            <span className="badge badge-brand">
                                                                {(s as any).courseId?.name || '—'}
                                                            </span>
                                                            {(s as any).courseId?.code && (
                                                                <p className="text-[0.625rem] font-mono text-[var(--text-muted)]">
                                                                    {(s as any).courseId.code}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Term */}
                                                <td>
                                                    <span
                                                        className="text-xs font-medium px-2 py-1 rounded-[var(--radius-sm)]"
                                                        style={{
                                                            backgroundColor: 'var(--bg-subtle)',
                                                            color: 'var(--text-secondary)',
                                                        }}
                                                    >
                                                        {s.term}
                                                    </span>
                                                </td>

                                                {/* Amount + Late Fine */}
                                                <td>
                                                    <p className="text-sm font-bold tabular-nums text-[var(--text-primary)]">
                                                        ₹{s.totalAmount.toLocaleString('en-IN')}
                                                    </p>
                                                    {s.lateFinePerDay > 0 && (
                                                        <p className="text-[0.625rem] text-[var(--warning)]">
                                                            +₹{s.lateFinePerDay}/
                                                            {s.lateFineType === 'percent' ? '%' : 'day'} late
                                                        </p>
                                                    )}
                                                </td>

                                                {/* Due Date */}
                                                <td>
                                                    <p className="text-sm text-[var(--text-secondary)]">
                                                        {new Date(s.dueDate).toLocaleDateString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: '2-digit',
                                                        })}
                                                    </p>
                                                </td>

                                                {/* Assigned count */}
                                                <td>
                                                    <span className={`badge ${s.assignedCount > 0 ? 'badge-success' : 'badge-neutral'}`}>
                                                        <Users size={10} />
                                                        {s.assignedCount}{' '}
                                                        {institutionType === 'school' ? 'students' : 'enrolled'}
                                                    </span>
                                                </td>

                                                {/* Status */}
                                                <td>
                                                    <span className={`status-pill ${s.isActive ? 'status-active' : 'status-inactive'}`}>
                                                        {s.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td>
                                                    <div className="flex items-center gap-1 justify-end">

                                                        {/* Edit */}
                                                        <button
                                                            onClick={() => {
                                                                setEditStructure(s)
                                                                setShowStructureModal(true)
                                                            }}
                                                            className="btn-icon btn-icon-sm"
                                                            title="Edit Structure"
                                                        >
                                                            <Edit2 size={13} />
                                                        </button>

                                                        {/* Assign to all */}
                                                        <button
                                                            onClick={() => assignToAll(s._id, s.name)}
                                                            className="btn-icon btn-icon-sm"
                                                            title={
                                                                institutionType === 'school'
                                                                    ? 'Assign to all students in class'
                                                                    : 'Assign to all enrolled students'
                                                            }
                                                        >
                                                            <Users size={13} />
                                                        </button>

                                                        {/* Late fine — only if configured */}
                                                        {s.lateFinePerDay > 0 && (
                                                            <button
                                                                onClick={() => applyLateFine(s._id, s.name)}
                                                                className="btn-icon btn-icon-sm"
                                                                title="Apply late fine to overdue fees"
                                                            >
                                                                <Clock size={13} />
                                                            </button>
                                                        )}

                                                        {/* Optional fees — only if structure has optional items */}
                                                        {s.items.some((i: any) => i.isOptional) && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedStructure(s)
                                                                    setShowOptionalModal(true)
                                                                }}
                                                                className="btn-icon btn-icon-sm"
                                                                title="Assign optional fees to students"
                                                            >
                                                                <Sparkles size={13} />
                                                            </button>
                                                        )}

                                                        {/* Deactivate */}
                                                        <button
                                                            onClick={() => deleteStructure(s._id)}
                                                            className="btn-icon btn-icon-sm"
                                                            title="Deactivate structure"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══ TAB: PAYMENT SETTINGS ═══ */}
            {tab === 'settings' && (
                <PaymentSettingsPanel onAlert={a => setAlert(a)} />
            )}

            {/* ═══ MODALS ═══ */}
            <Portal>
                <FeeStructureModal
                    open={showStructureModal}
                    editItem={editStructure}
                    academicConfig={academicConfig}
                    onClose={() => { setShowStructureModal(false); setEditStructure(null) }}
                    onSuccess={msg => {
                        setShowStructureModal(false)
                        setEditStructure(null)
                        fetchStructures()
                        showSuccess(msg)
                    }}
                />

                {selectedFee && (
                    <RecordPaymentModal
                        open={showPayModal}
                        fee={selectedFee}
                        onlinePayEnabled={onlinePayEnabled}
                        onClose={() => { setShowPayModal(false); setSelectedFee(null) }}
                        onPaid={recordPayment}
                        // ✅ NEW prop — online payment complete
                        onPaymentComplete={(feeId: string) => {
                            setShowPayModal(false)
                            setSelectedFee(null)
                            fetchFees()
                        }}
                    />
                )}
                {receiptData && (
                    <ReceiptModal
                        open={showReceiptModal}
                        data={receiptData}
                        onClose={() => { setShowReceiptModal(false); setReceiptData(null) }}
                    />
                )}
                {selectedStructure && (
                    <OptionalFeeModal
                        open={showOptionalModal}
                        structure={selectedStructure}
                        onClose={() => { setShowOptionalModal(false); setSelectedStructure(null) }}
                        onSuccess={msg => {
                            setShowOptionalModal(false)
                            setSelectedStructure(null)
                            showSuccess(msg)
                        }}
                    />
                )}
            </Portal>
        </div>
    )
}



/* ════════════════════════════════════════════
   RECORD PAYMENT MODAL
   ════════════════════════════════════════════ */
function RecordPaymentModal({
    open, fee, onlinePayEnabled, onClose, onPaid, onPaymentComplete,
}: {
    open: boolean
    fee: Fee
    onlinePayEnabled: boolean
    onClose: () => void
    onPaid: (feeId: string, mode: string, amount: number, notes?: string) => void
    onPaymentComplete: (feeId: string) => void  // ✅ NEW — online only
}) {
    const remaining = fee.finalAmount - fee.paidAmount
    const [mode, setMode] = useState('cash')
    const [payType, setPayType] = useState<'full' | 'partial'>('full')
    const [partialAmount, setPartialAmount] = useState('')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [rzpLoading, setRzpLoading] = useState(false)
    const [paymentSuccess, setPaymentSuccess] = useState<{
        amount: number
        mode: string
        receiptNumber: string
        paidAt: string
    } | null>(null)
    const [successPaperSize, setSuccessPaperSize] = useState<'A4' | 'A5'>('A4')

    const MODES = useMemo(() => {
        const base = [
            { value: 'cash', label: 'Cash', icon: '💵', color: 'var(--success)', bg: 'var(--success-50)' },
            { value: 'cheque', label: 'Cheque', icon: '📝', color: 'var(--color-violet)', bg: 'var(--color-violet-50)' },
            { value: 'dd', label: 'DD', icon: '🏛️', color: 'var(--warning)', bg: 'var(--warning-50)' },
        ]
        if (onlinePayEnabled) {
            return [
                { value: 'online', label: 'Online (Razorpay)', icon: '💳', color: 'var(--info)', bg: 'var(--info-50)' },
                ...base,
            ]
        }
        return base
    }, [onlinePayEnabled])

    const effectiveAmount = payType === 'full'
        ? remaining
        : Math.min(Number(partialAmount) || 0, remaining)

    const handleClose = () => {
        setPaymentSuccess(null)
        setPayType('full')
        setPartialAmount('')
        setNotes('')
        setMode('cash')
        setLoading(false)
        setRzpLoading(false)
        onClose()
    }

    const loadRazorpayScript = (): Promise<boolean> => {
        return new Promise(resolve => {
            const rzpWindow = window as any
            if (rzpWindow.Razorpay) { resolve(true); return }
            const existing = document.querySelector(
                'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
            )
            if (existing) { existing.addEventListener('load', () => resolve(true)); return }
            const script = document.createElement('script')
            script.src = 'https://checkout.razorpay.com/v1/checkout.js'
            script.onload = () => resolve(true)
            script.onerror = () => resolve(false)
            document.body.appendChild(script)
        })
    }

    // ✅ FIXED — onPaid call removed from online handler
    const handleOnlinePayment = async () => {
        if (effectiveAmount <= 0) return
        setRzpLoading(true)
        try {
            const orderRes = await fetch('/api/fees/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feeId: fee._id, amount: effectiveAmount }),
            })
            const orderData = await orderRes.json()
            if (!orderRes.ok) {
                alert(orderData.needsSetup
                    ? '❌ Online payment is not configured. Please add Razorpay keys in Payment Settings.'
                    : orderData.error || 'Failed to create payment order'
                )
                setRzpLoading(false)
                return
            }

            const scriptLoaded = await loadRazorpayScript()
            if (!scriptLoaded) {
                alert('Failed to load Razorpay. Please check your internet connection.')
                setRzpLoading(false)
                return
            }

            const studentName = (fee.studentId as any)?.userId?.name || 'Student'
            const studentPhone = (fee.studentId as any)?.userId?.phone || ''
            const rzpWindow = window as any

            const rzp = new rzpWindow.Razorpay({
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency || 'INR',
                name: 'Fee Payment',
                description: `Fee payment — ${studentName}`,
                order_id: orderData.orderId,
                prefill: { name: studentName, contact: studentPhone },
                theme: { color: 'var(--primary-600)' },

                handler: async function (response: {
                    razorpay_payment_id: string
                    razorpay_order_id: string
                    razorpay_signature: string
                }) {
                    try {
                        const verifyRes = await fetch('/api/fees/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                feeId: fee._id,
                                amount: effectiveAmount,
                            }),
                        })
                        const verifyData = await verifyRes.json()

                        if (verifyRes.ok && verifyData.success) {
                            // ✅ FIX — Only set success UI
                            // verify route already updated DB
                            // onPaid (mark-paid) NOT called — prevents double payment
                            setPaymentSuccess({
                                amount: effectiveAmount,
                                mode: 'online',
                                receiptNumber: verifyData.receiptNumber,
                                paidAt: new Date().toISOString(),
                            })
                            // ✅ Sirf fees list refresh karo
                            onPaymentComplete(fee._id)
                        } else {
                            alert(
                                'Payment verification failed: ' +
                                (verifyData.error || 'Unknown error. Please contact support.')
                            )
                        }
                    } catch (err) {
                        console.error('Verify error:', err)
                        // ✅ Fallback — show success with payment ID as receipt
                        // DB already updated by verify route (if it succeeded before network error)
                        setPaymentSuccess({
                            amount: effectiveAmount,
                            mode: 'online',
                            receiptNumber: response.razorpay_payment_id,
                            paidAt: new Date().toISOString(),
                        })
                        onPaymentComplete(fee._id)
                    } finally {
                        setRzpLoading(false)
                    }
                },

                modal: {
                    ondismiss: () => setRzpLoading(false),
                    escape: true,
                    backdropclose: false,
                },
            })

            rzp.on('payment.failed', (response: any) => {
                alert(`Payment failed: ${response.error.description}`)
                setRzpLoading(false)
            })
            rzp.open()

        } catch (err) {
            console.error('Online payment error:', err)
            alert('Could not initiate payment. Please try again.')
            setRzpLoading(false)
        }
    }

    // ✅ Offline — onPaid call karo (mark-paid API)
    const handleOfflinePayment = async () => {
        if (effectiveAmount <= 0) return
        setLoading(true)
        try {
            await onPaid(fee._id, mode, effectiveAmount, notes)
            setPaymentSuccess({
                amount: effectiveAmount,
                mode,
                receiptNumber: `RCP-${Date.now().toString(36).toUpperCase()}`,
                paidAt: new Date().toISOString(),
            })
        } catch {
            alert('Failed to record payment. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = () => {
        if (effectiveAmount <= 0) return
        if (mode === 'online') handleOnlinePayment()
        else handleOfflinePayment()
    }

    const handlePrintSuccessReceipt = () => {
        if (!paymentSuccess) return
        const school = (fee as any).school || {}
        const student = fee.studentId as any
        const newRemaining = Math.max(0, remaining - paymentSuccess.amount)
        const totalPaidSoFar = fee.paidAmount + paymentSuccess.amount
        const status = newRemaining <= 0 ? 'paid' : 'partial'
        printSingleReceipt({
            school,
            student: {
                name: student?.userId?.name || 'N/A',
                admissionNo: student?.admissionNo || 'N/A',
                class: student?.class || (fee as any).class || 'N/A',
                section: student?.section || (fee as any).section || '',
                fatherName: student?.fatherName || '',
            },
            payment: {
                receiptNumber: paymentSuccess.receiptNumber,
                amount: paymentSuccess.amount,
                mode: paymentSuccess.mode,
                paidAt: paymentSuccess.paidAt,
            },
            fee: {
                totalAmount: fee.finalAmount,
                totalPaidSoFar,
                remaining: newRemaining,
                status,
                feeType: (fee as any).feeType || (fee.structureId as any)?.name || 'Tuition Fee',
            },
            academicYear: (fee as any).academicYear || (fee.structureId as any)?.academicYear || '',
            paperSize: successPaperSize,
        })
    }

    if (!open) return null

    /* ── Success Screen ── */
    if (paymentSuccess) {
        const isOnline = paymentSuccess.mode === 'online'
        return (
            <div className="modal-backdrop">
                <div
                    className="modal-panel"
                    style={{ maxWidth: 'var(--width-modal-sm)' }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Top accent bar */}
                    <div
                        className="h-1.5 rounded-t-[var(--radius-2xl)]"
                        style={{ background: 'var(--bg-gradient-success)' }}
                    />

                    {/* Success header */}
                    <div className="text-center pt-7 pb-4 px-5">
                        <div
                            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                            style={{
                                background: 'var(--bg-gradient-success)',
                                boxShadow: '0 8px 24px rgba(16,185,129,0.3)',
                            }}
                        >
                            <CheckSquare size={28} className="text-white" />
                        </div>
                        <h3 className="text-xl font-extrabold text-[var(--success-dark)]">
                            Payment Successful! 🎉
                        </h3>
                        <p className="text-sm mt-1 text-[var(--text-secondary)]">
                            ₹{paymentSuccess.amount.toLocaleString('en-IN')} received via{' '}
                            <span className="font-semibold capitalize">{paymentSuccess.mode}</span>
                        </p>
                        {isOnline && (
                            <div className="badge badge-brand mt-2 mx-auto">
                                💳 Verified via Razorpay
                            </div>
                        )}
                    </div>

                    {/* Receipt summary */}
                    <div
                        className="mx-5 mb-4 rounded-[var(--radius-lg)] overflow-hidden"
                        style={{ border: '1.5px solid var(--border)' }}
                    >
                        <div
                            className="px-4 py-2.5"
                            style={{
                                background: 'linear-gradient(135deg, var(--info-50), var(--info-100))',
                                borderBottom: '1px solid var(--border)',
                            }}
                        >
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--info-dark)]">
                                Receipt Summary
                            </span>
                        </div>
                        <div className="px-4 py-3 space-y-2.5 bg-[var(--bg-card)]">
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--text-muted)]">Receipt No.</span>
                                <span className="font-bold font-mono text-xs text-[var(--text-primary)]">
                                    {paymentSuccess.receiptNumber}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--text-muted)]">Student</span>
                                <span className="font-semibold text-[var(--text-primary)]">
                                    {(fee.studentId as any)?.userId?.name || 'N/A'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--text-muted)]">Date & Time</span>
                                <span className="font-semibold text-[var(--text-primary)]">
                                    {new Date(paymentSuccess.paidAt).toLocaleString('en-IN', {
                                        day: '2-digit', month: 'short', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit',
                                    })}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--text-muted)]">Payment Mode</span>
                                <span className="font-semibold capitalize text-[var(--text-primary)]">
                                    {paymentSuccess.mode === 'online' ? 'Online (Razorpay)' : paymentSuccess.mode}
                                </span>
                            </div>
                            <div
                                className="flex justify-between items-center pt-2"
                                style={{ borderTop: '1px dashed var(--border)' }}
                            >
                                <span className="text-sm font-semibold text-[var(--success)]">
                                    Amount Paid
                                </span>
                                <span className="text-2xl font-black font-mono text-[var(--success)]">
                                    ₹{paymentSuccess.amount.toLocaleString('en-IN')}
                                </span>
                            </div>
                            {remaining - paymentSuccess.amount > 0 && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[var(--danger)]">Still Remaining</span>
                                    <span className="font-bold font-mono text-[var(--danger)]">
                                        ₹{(remaining - paymentSuccess.amount).toLocaleString('en-IN')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Print section */}
                    <div className="mx-5 mb-4">
                        <p className="text-[10px] font-semibold mb-2 uppercase tracking-wider text-[var(--text-muted)]">
                            Print Receipt
                        </p>
                        <div className="flex gap-2">
                            <div
                                className="flex items-center rounded-[var(--radius-md)] overflow-hidden flex-shrink-0"
                                style={{ border: '1px solid var(--border)' }}
                            >
                                {(['A4', 'A5'] as const).map((size, i) => (
                                    <button
                                        key={size}
                                        onClick={() => setSuccessPaperSize(size)}
                                        className="px-3 py-2 text-xs font-bold transition-colors"
                                        style={{
                                            backgroundColor: successPaperSize === size
                                                ? 'var(--primary-600)'
                                                : 'var(--bg-subtle)',
                                            color: successPaperSize === size
                                                ? '#ffffff'
                                                : 'var(--text-secondary)',
                                            borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
                                        }}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={handlePrintSuccessReceipt}
                                className="btn-primary flex-1"
                            >
                                <Printer size={14} />
                                Print Receipt ({successPaperSize})
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div
                        className="px-5 py-4"
                        style={{ borderTop: '1px solid var(--border)' }}
                    >
                        <button
                            onClick={handleClose}
                            className="btn-primary btn-block"
                            style={{ background: 'var(--bg-gradient-success)' }}
                        >
                            ✓ Done
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    /* ── Payment Form ── */
    const isOnlineMode = mode === 'online'
    const isSubmitDisabled = loading || rzpLoading || effectiveAmount <= 0

    return (
        <div className="modal-backdrop">
            <div
                className="modal-panel"
                style={{ maxWidth: 'var(--width-modal-sm)' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center"
                            style={{ backgroundColor: 'var(--success-50)' }}
                        >
                            <IndianRupee size={16} style={{ color: 'var(--success)' }} />
                        </div>
                        <div>
                            <h3 className="modal-title">Record Payment</h3>
                            <p className="text-xs text-[var(--text-muted)]">
                                {(fee.studentId as any)?.userId?.name || 'Student'}
                            </p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="modal-close">
                        <X size={14} />
                    </button>
                </div>

                {/* Body */}
                <div className="modal-body space-y-4">

                    {/* Fee summary */}
                    <div
                        className="rounded-[var(--radius-lg)] p-4"
                        style={{
                            background: 'linear-gradient(135deg, var(--bg-muted), var(--surface-100))',
                            border: '1px solid var(--border)',
                        }}
                    >
                        <div className="flex justify-between mb-2">
                            <span className="text-xs text-[var(--text-muted)]">Total Fee</span>
                            <span className="text-sm font-bold text-[var(--text-primary)]">
                                ₹{fee.finalAmount.toLocaleString('en-IN')}
                            </span>
                        </div>
                        {fee.paidAmount > 0 && (
                            <div className="flex justify-between mb-2">
                                <span className="text-xs text-[var(--success)]">Already Paid</span>
                                <span className="text-sm font-bold text-[var(--success)]">
                                    ₹{fee.paidAmount.toLocaleString('en-IN')}
                                </span>
                            </div>
                        )}
                        <div
                            className="flex justify-between pt-2"
                            style={{ borderTop: '1px dashed var(--border-strong)' }}
                        >
                            <span className="text-xs font-semibold text-[var(--danger)]">Remaining</span>
                            <span className="text-lg font-extrabold tabular-nums text-[var(--danger)]">
                                ₹{remaining.toLocaleString('en-IN')}
                            </span>
                        </div>
                    </div>

                    {/* Payment type */}
                    <div>
                        <p className="text-xs font-semibold mb-2 text-[var(--text-secondary)]">
                            Payment Type
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                {
                                    val: 'full' as const,
                                    label: 'Full Payment',
                                    sub: `₹${remaining.toLocaleString('en-IN')}`,
                                    activeColor: 'var(--success)',
                                    activeBg: 'var(--success-50)',
                                },
                                {
                                    val: 'partial' as const,
                                    label: 'Partial Payment',
                                    sub: 'Custom amount',
                                    activeColor: 'var(--warning)',
                                    activeBg: 'var(--warning-50)',
                                },
                            ].map(opt => (
                                <button
                                    key={opt.val}
                                    onClick={() => setPayType(opt.val)}
                                    className="px-3 py-2.5 rounded-[var(--radius-lg)] text-sm font-semibold transition-all text-center"
                                    style={{
                                        border: `2px solid ${payType === opt.val ? opt.activeColor : 'var(--border)'}`,
                                        backgroundColor: payType === opt.val ? opt.activeBg : 'var(--bg-card)',
                                        color: payType === opt.val ? opt.activeColor : 'var(--text-secondary)',
                                    }}
                                >
                                    {opt.label}
                                    <br />
                                    <span className="text-xs font-normal">{opt.sub}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Partial amount input */}
                    {payType === 'partial' && (
                        <FormInput
                            label="Enter Amount (₹)"
                            value={partialAmount}
                            onChange={setPartialAmount}
                            type="number"
                            required
                            placeholder={`Max ₹${remaining.toLocaleString('en-IN')}`}
                            helper={`Maximum payable: ₹${remaining.toLocaleString('en-IN')}`}
                        />
                    )}

                    {/* Payment mode */}
                    <div>
                        <p className="text-xs font-semibold mb-2 text-[var(--text-secondary)]">
                            Payment Mode
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {MODES.map(m => (
                                <button
                                    key={m.value}
                                    onClick={() => setMode(m.value)}
                                    className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-lg)] text-sm font-semibold transition-all"
                                    style={{
                                        border: `2px solid ${mode === m.value ? m.color : 'var(--border)'}`,
                                        backgroundColor: mode === m.value ? m.bg : 'var(--bg-card)',
                                        color: mode === m.value ? m.color : 'var(--text-secondary)',
                                    }}
                                >
                                    <span>{m.icon}</span>
                                    {m.label}
                                </button>
                            ))}
                        </div>

                        {/* Online mode info banner */}
                        {isOnlineMode && (
                            <div
                                className="mt-2 px-3 py-2.5 rounded-[var(--radius-lg)] text-xs"
                                style={{
                                    backgroundColor: 'var(--info-50)',
                                    border: '1px solid var(--info-200)',
                                    color: 'var(--info-dark)',
                                }}
                            >
                                <div className="flex items-start gap-2">
                                    <span className="text-base leading-none mt-0.5">💳</span>
                                    <div>
                                        <p className="font-semibold mb-0.5">Razorpay Payment Gateway</p>
                                        <p className="leading-relaxed text-[var(--info-600)]">
                                            Student can pay via UPI, Card, or Net Banking through
                                            the Razorpay checkout window. Receipt will be generated
                                            automatically after payment confirmation.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Notes — offline only */}
                    {!isOnlineMode && (
                        <FormInput
                            label="Notes (optional)"
                            value={notes}
                            onChange={setNotes}
                            placeholder="e.g. Cheque no. 123456, Ref: IMPS..."
                        />
                    )}

                    {/* Amount preview */}
                    {effectiveAmount > 0 && (
                        <div
                            className="rounded-[var(--radius-lg)] p-3 text-center"
                            style={{
                                backgroundColor: isOnlineMode ? 'var(--info-50)' : 'var(--success-50)',
                                border: `1px solid ${isOnlineMode ? 'var(--info-200)' : 'var(--success-200)'}`,
                            }}
                        >
                            <p className="text-xs" style={{ color: isOnlineMode ? 'var(--info)' : 'var(--success)' }}>
                                {isOnlineMode ? 'Will be collected via Razorpay' : 'You are collecting'}
                            </p>
                            <p
                                className="text-2xl font-extrabold tabular-nums"
                                style={{ color: isOnlineMode ? 'var(--info-dark)' : 'var(--success-dark)' }}
                            >
                                ₹{effectiveAmount.toLocaleString('en-IN')}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button onClick={handleClose} className="btn-ghost flex-1">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitDisabled}
                        className="flex-1 btn-primary"
                        style={isOnlineMode
                            ? {}
                            : { background: 'var(--bg-gradient-success)' }
                        }
                    >
                        {(loading || rzpLoading) ? (
                            <Spinner size="sm" />
                        ) : isOnlineMode ? (
                            <span>💳</span>
                        ) : (
                            <CheckSquare size={14} />
                        )}
                        {loading || rzpLoading
                            ? (isOnlineMode ? 'Opening Razorpay...' : 'Processing...')
                            : isOnlineMode
                                ? 'Pay via Razorpay'
                                : 'Confirm Payment'
                        }
                    </button>
                </div>
            </div>
        </div>
    )
}


/* ════════════════════════════════════════════
   SHARED PRINT FUNCTION
   ════════════════════════════════════════════ */
function printSingleReceipt({
    school, student, payment, fee, academicYear, paperSize, allPayments, feeBreakdown,
}: {
    school: any
    student: { name: string; admissionNo: string; class: string; section: string; fatherName?: string }
    payment: { receiptNumber: string; amount: number; mode: string; paidAt: string }
    fee: {
        totalAmount: number; totalPaidSoFar?: number; remaining?: number
        status: string; feeType?: string; discount?: number
    }
    academicYear?: string
    paperSize: 'A4' | 'A5'
    allPayments?: any[]
    feeBreakdown?: any[]
}) {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const isA5 = paperSize === 'A5'
    const statusClass = (fee.status || 'paid').toLowerCase()

    printWindow.document.write(`
    <html>
      <head>
        <title>Fee Receipt - ${payment.receiptNumber || 'N/A'}</title>
        <style>
          @page {
            size: ${isA5 ? '148mm 210mm' : '210mm 297mm'};
            margin: ${isA5 ? '8mm' : '15mm'};
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
            color: #1E293B;
            background: #FFFFFF;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .receipt-wrapper {
            max-width: ${isA5 ? '130mm' : '180mm'};
            margin: 0 auto;
            padding: ${isA5 ? '12px' : '24px'};
          }
          .receipt-top-bar {
            height: 4px;
            background: linear-gradient(90deg, #4338CA, #6366F1, #818CF8, #6366F1, #4338CA);
            border-radius: 2px 2px 0 0;
            margin-bottom: ${isA5 ? '12px' : '20px'};
          }
          .school-header {
            text-align: center;
            padding-bottom: ${isA5 ? '10px' : '16px'};
            border-bottom: 2px solid #4338CA;
            margin-bottom: ${isA5 ? '10px' : '16px'};
          }
          .school-logo-circle {
            width: ${isA5 ? '44px' : '56px'};
            height: ${isA5 ? '44px' : '56px'};
            border-radius: 50%;
            background: linear-gradient(135deg, #4338CA, #6366F1);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 8px;
          }
          .school-logo-circle span {
            color: #FFFFFF;
            font-weight: 800;
            font-size: ${isA5 ? '16px' : '20px'};
            letter-spacing: 1px;
          }
          .school-name {
            font-size: ${isA5 ? '16px' : '22px'};
            font-weight: 800;
            color: #0F172A;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            margin-bottom: 2px;
          }
          .school-address {
            font-size: ${isA5 ? '9px' : '11px'};
            color: #64748B;
            margin-bottom: 4px;
            line-height: 1.4;
          }
          .school-contact {
            font-size: ${isA5 ? '8px' : '10px'};
            color: #94A3B8;
          }
          .receipt-title-badge {
            display: inline-block;
            background: linear-gradient(135deg, #4338CA, #6366F1);
            color: #FFFFFF;
            font-size: ${isA5 ? '10px' : '12px'};
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            padding: ${isA5 ? '4px 16px' : '6px 24px'};
            border-radius: 20px;
            margin-top: 8px;
          }
          .receipt-meta {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: ${isA5 ? '10px' : '14px'};
            padding: ${isA5 ? '8px 10px' : '10px 14px'};
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
          }
          .meta-label {
            font-size: ${isA5 ? '8px' : '9px'};
            color: #94A3B8;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            font-weight: 600;
          }
          .meta-value {
            font-size: ${isA5 ? '11px' : '13px'};
            font-weight: 700;
            color: #0F172A;
            font-family: 'Courier New', monospace;
            margin-top: 2px;
          }
          .student-info-card {
            border: 1.5px solid #E2E8F0;
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: ${isA5 ? '10px' : '16px'};
          }
          .student-info-header {
            background: linear-gradient(135deg, #EEF2FF, #E0E7FF);
            padding: ${isA5 ? '6px 10px' : '8px 14px'};
            border-bottom: 1px solid #C7D2FE;
          }
          .student-info-header span {
            font-size: ${isA5 ? '8px' : '10px'};
            font-weight: 700;
            color: #3730A3;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .student-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0;
          }
          .student-info-cell {
            padding: ${isA5 ? '6px 10px' : '8px 14px'};
            border-bottom: 1px solid #F1F5F9;
            border-right: 1px solid #F1F5F9;
          }
          .student-info-cell:nth-child(even)      { border-right: none; }
          .student-info-cell:nth-last-child(-n+2)  { border-bottom: none; }
          .cell-label {
            font-size: ${isA5 ? '7px' : '9px'};
            color: #94A3B8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
            margin-bottom: 2px;
          }
          .cell-value {
            font-size: ${isA5 ? '10px' : '12px'};
            font-weight: 700;
            color: #1E293B;
          }
          .fee-table-wrapper {
            margin-bottom: ${isA5 ? '10px' : '16px'};
            border: 1.5px solid #E2E8F0;
            border-radius: 10px;
            overflow: hidden;
          }
          .fee-table { width: 100%; border-collapse: collapse; }
          .fee-table thead th {
            background: linear-gradient(135deg, #1E1B4B, #312E81);
            color: #FFFFFF;
            font-size: ${isA5 ? '8px' : '10px'};
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            padding: ${isA5 ? '8px 10px' : '10px 14px'};
            text-align: left;
          }
          .fee-table thead th:last-child { text-align: right; }
          .fee-table tbody td {
            padding: ${isA5 ? '7px 10px' : '9px 14px'};
            font-size: ${isA5 ? '10px' : '12px'};
            color: #334155;
            border-bottom: 1px solid #F1F5F9;
          }
          .fee-table tbody td:last-child {
            text-align: right;
            font-family: 'Courier New', monospace;
            font-weight: 600;
          }
          .fee-table tbody tr:last-child td        { border-bottom: none; }
          .fee-table tbody tr:nth-child(even)       { background: #FAFBFC; }
          .amount-summary {
            border: 2px solid #E2E8F0;
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: ${isA5 ? '10px' : '16px'};
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: ${isA5 ? '7px 12px' : '9px 16px'};
            border-bottom: 1px solid #F1F5F9;
          }
          .summary-row:last-child  { border-bottom: none; }
          .summary-row .sr-label   { font-size: ${isA5 ? '10px' : '12px'}; color: #475569; font-weight: 500; }
          .summary-row .sr-value   { font-size: ${isA5 ? '10px' : '12px'}; font-weight: 700; color: #1E293B; font-family: 'Courier New', monospace; }
          .summary-row.total-row {
            background: linear-gradient(135deg, #F0FDF4, #DCFCE7);
            border-bottom: none;
            padding: ${isA5 ? '10px 12px' : '12px 16px'};
          }
          .summary-row.total-row .sr-label {
            font-size: ${isA5 ? '11px' : '13px'};
            font-weight: 800;
            color: #166534;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .summary-row.total-row .sr-value {
            font-size: ${isA5 ? '14px' : '18px'};
            font-weight: 900;
            color: #15803D;
          }
          .summary-row.remaining-row { background: #FEF2F2; }
          .summary-row.remaining-row .sr-label { color: #DC2626; font-weight: 600; }
          .summary-row.remaining-row .sr-value { color: #DC2626; font-weight: 700; }
          .amount-words {
            font-size: ${isA5 ? '9px' : '11px'};
            color: #475569;
            font-style: italic;
            padding: ${isA5 ? '6px 10px' : '8px 14px'};
            background: #FFFBEB;
            border: 1px dashed #FCD34D;
            border-radius: 6px;
            margin-bottom: ${isA5 ? '10px' : '14px'};
            text-align: center;
          }
          .status-badge {
            display: inline-block;
            padding: ${isA5 ? '3px 12px' : '4px 16px'};
            border-radius: 20px;
            font-size: ${isA5 ? '9px' : '11px'};
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .status-paid    { background: #DCFCE7; color: #166534; border: 1px solid #BBF7D0; }
          .status-partial { background: #FEF9C3; color: #854D0E; border: 1px solid #FDE68A; }
          .status-unpaid,
          .status-overdue { background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA; }
          .payment-history { margin-bottom: ${isA5 ? '10px' : '16px'}; }
          .payment-history-title {
            font-size: ${isA5 ? '8px' : '10px'};
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 6px;
          }
          .history-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #E2E8F0;
            border-radius: 6px;
            overflow: hidden;
          }
          .history-table th {
            background: #F1F5F9;
            font-size: ${isA5 ? '7px' : '9px'};
            color: #64748B;
            padding: ${isA5 ? '4px 8px' : '6px 10px'};
            text-align: left;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .history-table th:last-child { text-align: right; }
          .history-table td {
            font-size: ${isA5 ? '9px' : '10px'};
            padding: ${isA5 ? '4px 8px' : '5px 10px'};
            border-top: 1px solid #F1F5F9;
            color: #334155;
          }
          .history-table td:last-child {
            text-align: right;
            font-family: 'Courier New', monospace;
            font-weight: 600;
            color: #15803D;
          }
          .history-table tr.current-receipt { background: #ECFDF5; }
          .history-table tr.current-receipt td { font-weight: 700; color: #059669; }
          .signature-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: ${isA5 ? '20px' : '36px'};
            padding-top: ${isA5 ? '10px' : '16px'};
          }
          .signature-box       { text-align: center; width: 40%; }
          .signature-line      { border-top: 1.5px solid #94A3B8; margin-bottom: 4px; }
          .signature-label     { font-size: ${isA5 ? '8px' : '10px'}; color: #64748B; font-weight: 600; }
          .seal-area {
            width: ${isA5 ? '50px' : '70px'};
            height: ${isA5 ? '50px' : '70px'};
            border: 2px dashed #CBD5E1;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .seal-area span {
            font-size: ${isA5 ? '7px' : '8px'};
            color: #CBD5E1;
            text-transform: uppercase;
            font-weight: 600;
          }
          .receipt-footer {
            margin-top: ${isA5 ? '12px' : '20px'};
            padding-top: ${isA5 ? '8px' : '12px'};
            border-top: 1.5px solid #E2E8F0;
            text-align: center;
          }
          .footer-note {
            font-size: ${isA5 ? '7px' : '9px'};
            color: #94A3B8;
            line-height: 1.6;
          }
          .footer-note strong { color: #64748B; }
          .receipt-bottom-bar {
            height: 4px;
            background: linear-gradient(90deg, #4338CA, #6366F1, #818CF8, #6366F1, #4338CA);
            border-radius: 0 0 2px 2px;
            margin-top: ${isA5 ? '12px' : '20px'};
          }
          .watermark {
            position: fixed;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: ${isA5 ? '60px' : '80px'};
            font-weight: 900;
            color: rgba(0,0,0,0.03);
            text-transform: uppercase;
            letter-spacing: 10px;
            pointer-events: none;
            z-index: 0;
            white-space: nowrap;
          }
          @media print {
            body { padding: 0; background: #FFFFFF; }
            .receipt-wrapper { max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="watermark">${statusClass === 'paid' ? 'PAID' : ''}</div>
        <div class="receipt-wrapper">
          <div class="receipt-top-bar"></div>

          <!-- School Header -->
          <div class="school-header">
            <div class="school-logo-circle">
              <span>${(school.name || student.name || 'S').charAt(0).toUpperCase()}</span>
            </div>
            <div class="school-name">${school.name || 'School Name'}</div>
            ${school.address
            ? `<div class="school-address">${school.address}</div>`
            : ''}
            ${school.phone || school.email
            ? `<div class="school-contact">
                    ${school.phone ? 'Ph: ' + school.phone : ''}
                    ${school.phone && school.email ? ' | ' : ''}
                    ${school.email ? 'Email: ' + school.email : ''}
                   </div>`
            : ''}
            <div class="receipt-title-badge">Fee Receipt</div>
          </div>

          <!-- Receipt Meta -->
          <div class="receipt-meta">
            <div>
              <div class="meta-label">Receipt No.</div>
              <div class="meta-value">${payment.receiptNumber || 'N/A'}</div>
            </div>
            <div>
              <div class="meta-label">Academic Year</div>
              <div class="meta-value">${academicYear || ''}</div>
            </div>
            <div style="text-align:right">
              <div class="meta-label">Date</div>
              <div class="meta-value">
                ${payment.paidAt
            ? new Date(payment.paidAt).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
            })
            : 'N/A'}
              </div>
            </div>
          </div>

          <!-- Student Info -->
          <div class="student-info-card">
            <div class="student-info-header"><span>Student Details</span></div>
            <div class="student-info-grid">
              <div class="student-info-cell">
                <div class="cell-label">Student Name</div>
                <div class="cell-value">${student.name || 'N/A'}</div>
              </div>
              <div class="student-info-cell">
                <div class="cell-label">Admission No.</div>
                <div class="cell-value" style="font-family:'Courier New',monospace">
                  ${student.admissionNo || 'N/A'}
                </div>
              </div>
              <div class="student-info-cell">
                <div class="cell-label">Class & Section</div>
                <div class="cell-value">
                  ${student.class || 'N/A'}${student.section ? ' - ' + student.section : ''}
                </div>
              </div>
              <div class="student-info-cell">
                <div class="cell-label">Payment Mode</div>
                <div class="cell-value" style="text-transform:capitalize">
                  ${payment.mode || 'N/A'}
                </div>
              </div>
              ${student.fatherName
            ? `<div class="student-info-cell" style="grid-column:span 2;border-bottom:none">
                       <div class="cell-label">Father's Name</div>
                       <div class="cell-value">${student.fatherName}</div>
                     </div>`
            : ''}
            </div>
          </div>

          <!-- Fee Table -->
          <div class="fee-table-wrapper">
            <table class="fee-table">
              <thead>
                <tr>
                  <th style="width:40px">#</th>
                  <th>Description</th>
                  <th style="text-align:right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${feeBreakdown && feeBreakdown.length > 0
            ? feeBreakdown.map((item: any, i: number) => `
                        <tr>
                          <td>${i + 1}</td>
                          <td>${item.name || item.description || 'Fee'}</td>
                          <td style="text-align:right">₹${(item.amount || 0).toLocaleString('en-IN')}</td>
                        </tr>`).join('')
            : `<tr>
                         <td>1</td>
                         <td>${fee.feeType || 'Tuition Fee'}</td>
                         <td style="text-align:right">₹${(fee.totalAmount || 0).toLocaleString('en-IN')}</td>
                       </tr>`
        }
              </tbody>
            </table>
          </div>

          <!-- Amount Summary -->
          <div class="amount-summary">
            <div class="summary-row">
              <span class="sr-label">Total Fee Amount</span>
              <span class="sr-value">₹${(fee.totalAmount || 0).toLocaleString('en-IN')}</span>
            </div>
            ${fee.discount
            ? `<div class="summary-row">
                     <span class="sr-label">Discount</span>
                     <span class="sr-value" style="color:#6366F1">
                       - ₹${(fee.discount || 0).toLocaleString('en-IN')}
                     </span>
                   </div>`
            : ''}
            ${fee.totalPaidSoFar
            ? `<div class="summary-row">
                     <span class="sr-label">Total Paid So Far</span>
                     <span class="sr-value">₹${(fee.totalPaidSoFar || 0).toLocaleString('en-IN')}</span>
                   </div>`
            : ''}
            <div class="summary-row total-row">
              <span class="sr-label">💰 Amount Paid (This Receipt)</span>
              <span class="sr-value">₹${(payment.amount || 0).toLocaleString('en-IN')}</span>
            </div>
            ${(fee.remaining || 0) > 0
            ? `<div class="summary-row remaining-row">
                     <span class="sr-label">Balance Remaining</span>
                     <span class="sr-value">₹${(fee.remaining || 0).toLocaleString('en-IN')}</span>
                   </div>`
            : ''}
          </div>

          <!-- Amount in Words -->
          <div class="amount-words">
            <strong>Amount in words:</strong>
            ${numberToWords(payment.amount || 0)} Rupees Only
          </div>

          <!-- Status Badge -->
          <div style="text-align:center;margin-bottom:${isA5 ? '10px' : '14px'}">
            <span class="status-badge status-${statusClass}">
              ${(fee.status || 'paid').toUpperCase()}
            </span>
          </div>

          <!-- Payment History -->
          ${allPayments && allPayments.length > 1
            ? `<div class="payment-history">
                   <div class="payment-history-title">📋 Payment History</div>
                   <table class="history-table">
                     <thead>
                       <tr>
                         <th>Receipt No.</th>
                         <th>Date</th>
                         <th>Mode</th>
                         <th>Amount</th>
                       </tr>
                     </thead>
                     <tbody>
                       ${allPayments.map((p: any) => `
                         <tr class="${p.receiptNumber === payment.receiptNumber ? 'current-receipt' : ''}">
                           <td style="font-family:'Courier New',monospace">
                             ${p.receiptNumber || '-'}
                             ${p.receiptNumber === payment.receiptNumber ? ' ◄' : ''}
                           </td>
                           <td>${new Date(p.paidAt).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
            })}</td>
                           <td style="text-transform:capitalize">
                             ${p.mode || p.paymentMode || '-'}
                           </td>
                           <td>₹${(p.amount || 0).toLocaleString('en-IN')}</td>
                         </tr>`).join('')}
                     </tbody>
                   </table>
                 </div>`
            : ''}

          <!-- Signature Section -->
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">Received By</div>
            </div>
            <div class="seal-area"><span>Seal</span></div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">Authorized Signatory</div>
            </div>
          </div>

          <!-- Footer -->
          <div class="receipt-footer">
            <div class="footer-note">
              <strong>Note:</strong> This is a computer-generated receipt and does not
              require a physical signature.<br/>
              Fee once paid is non-refundable. Please retain this receipt for future reference.<br/>
              <span style="color:#CBD5E1">
                Printed on: ${new Date().toLocaleString('en-IN', {
                dateStyle: 'full', timeStyle: 'short',
            })}
              </span>
            </div>
          </div>

          <div class="receipt-bottom-bar"></div>
        </div>
      </body>
    </html>
  `)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 300)
}


/* ════════════════════════════════════════════
   NUMBER TO WORDS (Indian)
   ════════════════════════════════════════════ */
function numberToWords(num: number): string {
    if (num === 0) return 'Zero'

    const ones = [
        '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
        'Seventeen', 'Eighteen', 'Nineteen',
    ]
    const tens = [
        '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
        'Sixty', 'Seventy', 'Eighty', 'Ninety',
    ]

    function convertLessThanThousand(n: number): string {
        if (n === 0) return ''
        if (n < 20) return ones[n]
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
        return ones[Math.floor(n / 100)] + ' Hundred' +
            (n % 100 ? ' and ' + convertLessThanThousand(n % 100) : '')
    }

    const absNum = Math.abs(Math.floor(num))
    if (absNum < 1000) return convertLessThanThousand(absNum)

    const crore = Math.floor(absNum / 10000000)
    const lakh = Math.floor((absNum % 10000000) / 100000)
    const thousand = Math.floor((absNum % 100000) / 1000)
    const remainder = absNum % 1000

    let result = ''
    if (crore) result += convertLessThanThousand(crore) + ' Crore '
    if (lakh) result += convertLessThanThousand(lakh) + ' Lakh '
    if (thousand) result += convertLessThanThousand(thousand) + ' Thousand '
    if (remainder) result += convertLessThanThousand(remainder)
    return result.trim()
}


/* ════════════════════════════════════════════
   RECEIPT MODAL
   ════════════════════════════════════════════ */
function ReceiptModal({
    open, data, onClose,
}: {
    open: boolean
    data: any
    onClose: () => void
}) {
    if (!open || !data) return null

    const [paperSize, setPaperSize] = useState<'A4' | 'A5'>('A4')

    const school = data.school || {}
    const student = data.student || data
    const feeInfo = data.fee || data
    const payment = data.payment || data

    const buildPrintParams = (paymentData: any) => ({
        school,
        student: {
            name: student.studentName || student.name || 'N/A',
            admissionNo: student.admissionNo || 'N/A',
            class: student.class || 'N/A',
            section: student.section || '',
            fatherName: student.fatherName || '',
        },
        payment: {
            receiptNumber: paymentData.receiptNumber || 'N/A',
            amount: paymentData.amount || 0,
            mode: paymentData.mode || paymentData.paymentMode || 'N/A',
            paidAt: paymentData.paidAt || new Date().toISOString(),
        },
        fee: {
            totalAmount: feeInfo.totalAmount || data.totalAmount || 0,
            totalPaidSoFar: feeInfo.totalPaidSoFar || data.totalPaidSoFar || 0,
            remaining: feeInfo.remaining || data.remainingAmount || 0,
            status: feeInfo.status || data.status || 'paid',
            feeType: feeInfo.feeType || data.feeType || 'Tuition Fee',
            discount: feeInfo.discount || data.discount || 0,
        },
        academicYear: data.academicYear || school.academicYear || '',
        paperSize,
        allPayments: data.allPayments,
        feeBreakdown: data.feeBreakdown,
    })

    const handlePrint = () => printSingleReceipt(buildPrintParams(payment))

    const handlePrintSpecificPayment = (paymentItem: any) => {
        const allPayments = data.allPayments || []
        const paymentIndex = allPayments.findIndex(
            (p: any) => p.receiptNumber === paymentItem.receiptNumber
        )
        let cumulativePaid = 0
        for (let i = 0; i <= paymentIndex; i++) {
            cumulativePaid += allPayments[i]?.amount || 0
        }
        const totalAmount = feeInfo.totalAmount || data.totalAmount || 0
        const remainingAtThatPoint = totalAmount - cumulativePaid
        const statusAtThatPoint = remainingAtThatPoint <= 0 ? 'paid' : 'partial'

        printSingleReceipt({
            school,
            student: {
                name: student.studentName || student.name || 'N/A',
                admissionNo: student.admissionNo || 'N/A',
                class: student.class || 'N/A',
                section: student.section || '',
                fatherName: student.fatherName || '',
            },
            payment: {
                receiptNumber: paymentItem.receiptNumber || 'N/A',
                amount: paymentItem.amount || 0,
                mode: paymentItem.mode || paymentItem.paymentMode || 'N/A',
                paidAt: paymentItem.paidAt || new Date().toISOString(),
            },
            fee: {
                totalAmount,
                totalPaidSoFar: cumulativePaid,
                remaining: Math.max(0, remainingAtThatPoint),
                status: statusAtThatPoint,
                feeType: feeInfo.feeType || data.feeType || 'Tuition Fee',
                discount: feeInfo.discount || data.discount || 0,
            },
            academicYear: data.academicYear || school.academicYear || '',
            paperSize,
            allPayments: data.allPayments,
            feeBreakdown: data.feeBreakdown,
        })
    }

    return (
        <div className="modal-backdrop">
            <div
                className="modal-panel"
                style={{ maxWidth: 'var(--width-modal-md)' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center"
                            style={{ backgroundColor: 'var(--info-50)' }}
                        >
                            <Receipt size={16} style={{ color: 'var(--info)' }} />
                        </div>
                        <div>
                            <h3 className="modal-title">Fee Receipt</h3>
                            <p className="text-xs text-[var(--text-muted)]">
                                {payment.receiptNumber || 'N/A'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Paper size toggle */}
                        <div
                            className="flex items-center rounded-[var(--radius-md)] overflow-hidden"
                            style={{ border: '1px solid var(--border)' }}
                        >
                            {(['A4', 'A5'] as const).map((size, i) => (
                                <button
                                    key={size}
                                    onClick={() => setPaperSize(size)}
                                    className="px-2.5 py-1.5 text-[10px] font-bold transition-colors"
                                    style={{
                                        backgroundColor: paperSize === size
                                            ? 'var(--primary-600)'
                                            : 'var(--bg-subtle)',
                                        color: paperSize === size
                                            ? '#ffffff'
                                            : 'var(--text-secondary)',
                                        borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
                                    }}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handlePrint}
                            className="btn-icon btn-icon-sm"
                            title="Print Receipt"
                            style={{ color: 'var(--info)', backgroundColor: 'var(--info-50)' }}
                        >
                            <Printer size={14} />
                        </button>
                        <button onClick={onClose} className="modal-close">
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="modal-body">

                    {/* School header */}
                    <div
                        className="text-center mb-4 pb-4"
                        style={{ borderBottom: '2px solid var(--primary-700)' }}
                    >
                        <div
                            className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center"
                            style={{ background: 'var(--bg-gradient-primary)' }}
                        >
                            <span className="text-white font-extrabold text-base">
                                {(school.name || student.schoolName || 'S').charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <h2 className="text-lg font-extrabold uppercase tracking-wide text-[var(--text-primary)]">
                            {school.name || student.schoolName || 'School Name'}
                        </h2>
                        {school.address && (
                            <p className="text-[11px] mt-1 text-[var(--text-secondary)]">
                                {school.address}
                            </p>
                        )}
                        <div
                            className="inline-block mt-2 px-4 py-1 rounded-full text-[10px] font-bold tracking-widest text-white uppercase"
                            style={{ background: 'var(--bg-gradient-primary)' }}
                        >
                            Fee Receipt
                        </div>
                    </div>

                    {/* Receipt info */}
                    <div
                        className="flex justify-between items-start mb-3 p-3 rounded-[var(--radius-md)]"
                        style={{
                            backgroundColor: 'var(--bg-subtle)',
                            border: '1px solid var(--border)',
                        }}
                    >
                        <div>
                            <span className="text-[8px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                Receipt No.
                            </span>
                            <p className="font-bold font-mono text-sm text-[var(--text-primary)]">
                                {payment.receiptNumber || 'N/A'}
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="text-[8px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                Date
                            </span>
                            <p className="font-bold text-sm text-[var(--text-primary)]">
                                {payment.paidAt
                                    ? new Date(payment.paidAt).toLocaleDateString('en-IN', {
                                        day: '2-digit', month: 'short', year: 'numeric',
                                    })
                                    : 'N/A'}
                            </p>
                        </div>
                    </div>

                    {/* Student info */}
                    <div
                        className="rounded-[var(--radius-lg)] mb-3 overflow-hidden"
                        style={{ border: '1.5px solid var(--border)' }}
                    >
                        <div
                            className="px-3 py-2"
                            style={{
                                background: 'linear-gradient(135deg, var(--primary-50), var(--primary-100))',
                                borderBottom: '1px solid var(--primary-200)',
                            }}
                        >
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--primary-900)]">
                                Student Details
                            </span>
                        </div>
                        <div className="grid grid-cols-2 bg-[var(--bg-card)]">
                            <div
                                className="px-3 py-2"
                                style={{ borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}
                            >
                                <span className="text-[8px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                                    Student Name
                                </span>
                                <p className="text-xs font-bold text-[var(--text-primary)]">
                                    {student.studentName || student.name || 'N/A'}
                                </p>
                            </div>
                            <div
                                className="px-3 py-2"
                                style={{ borderBottom: '1px solid var(--border)' }}
                            >
                                <span className="text-[8px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                                    Admission No.
                                </span>
                                <p className="text-xs font-bold font-mono text-[var(--text-primary)]">
                                    {student.admissionNo || 'N/A'}
                                </p>
                            </div>
                            <div
                                className="px-3 py-2"
                                style={{ borderRight: '1px solid var(--border)' }}
                            >
                                <span className="text-[8px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                                    Class & Section
                                </span>
                                <p className="text-xs font-bold text-[var(--text-primary)]">
                                    {student.class}{student.section ? ' - ' + student.section : ''}
                                </p>
                            </div>
                            <div className="px-3 py-2">
                                <span className="text-[8px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                                    Payment Mode
                                </span>
                                <p className="text-xs font-bold capitalize text-[var(--text-primary)]">
                                    {payment.mode || payment.paymentMode || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Amount summary */}
                    <div
                        className="rounded-[var(--radius-lg)] mb-3 overflow-hidden"
                        style={{ border: '2px solid var(--border)' }}
                    >
                        <div
                            className="flex justify-between items-center px-4 py-2.5"
                            style={{ borderBottom: '1px solid var(--border)' }}
                        >
                            <span className="text-xs text-[var(--text-secondary)]">Total Fee Amount</span>
                            <span className="text-xs font-bold font-mono text-[var(--text-primary)]">
                                ₹{(feeInfo.totalAmount || data.totalAmount || 0).toLocaleString('en-IN')}
                            </span>
                        </div>
                        <div
                            className="flex justify-between items-center px-4 py-3"
                            style={{ background: 'linear-gradient(135deg, var(--success-50), var(--success-100))' }}
                        >
                            <span className="text-sm font-extrabold uppercase tracking-wide text-[var(--success-dark)]">
                                Amount Paid
                            </span>
                            <span className="text-xl font-black font-mono text-[var(--success-dark)]">
                                ₹{(payment.amount || data.paidAmount || 0).toLocaleString('en-IN')}
                            </span>
                        </div>
                        {(feeInfo.totalPaidSoFar || data.totalPaidSoFar) && (
                            <div
                                className="flex justify-between items-center px-4 py-2"
                                style={{ borderTop: '1px solid var(--border)' }}
                            >
                                <span className="text-xs text-[var(--text-secondary)]">Total Paid So Far</span>
                                <span className="text-xs font-bold font-mono text-[var(--text-primary)]">
                                    ₹{(feeInfo.totalPaidSoFar || data.totalPaidSoFar || 0).toLocaleString('en-IN')}
                                </span>
                            </div>
                        )}
                        {(feeInfo.remaining || data.remainingAmount) > 0 && (
                            <div
                                className="flex justify-between items-center px-4 py-2"
                                style={{
                                    backgroundColor: 'var(--danger-50)',
                                    borderTop: '1px solid var(--danger-200)',
                                }}
                            >
                                <span className="text-xs font-semibold text-[var(--danger)]">
                                    Balance Remaining
                                </span>
                                <span className="text-xs font-bold font-mono text-[var(--danger)]">
                                    ₹{(feeInfo.remaining || data.remainingAmount || 0).toLocaleString('en-IN')}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Status */}
                    <div className="text-center mb-3">
                        <FeeBadge
                            status={feeInfo.status || data.status || 'paid'}
                            dueDate={new Date().toISOString()}
                        />
                    </div>

                    {/* Payment history */}
                    {data.allPayments && data.allPayments.length > 1 && (
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                                    📋 Payment History
                                </p>
                                <p className="text-[8px] text-[var(--text-muted)]">
                                    Click 🖨️ to print individual receipt
                                </p>
                            </div>
                            <div className="space-y-1.5">
                                {data.allPayments.map((p: any, i: number) => {
                                    const isCurrentReceipt = p.receiptNumber === payment.receiptNumber
                                    return (
                                        <div
                                            key={i}
                                            className="flex justify-between items-center px-3 py-2.5 rounded-[var(--radius-lg)] text-xs transition-all"
                                            style={{
                                                backgroundColor: isCurrentReceipt
                                                    ? 'var(--success-50)'
                                                    : 'var(--bg-subtle)',
                                                border: isCurrentReceipt
                                                    ? '1.5px solid var(--success-200)'
                                                    : '1px solid var(--border)',
                                            }}
                                        >
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <div
                                                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                                                    style={{
                                                        backgroundColor: isCurrentReceipt
                                                            ? 'var(--success)'
                                                            : 'var(--border)',
                                                        color: isCurrentReceipt
                                                            ? '#ffffff'
                                                            : 'var(--text-secondary)',
                                                    }}
                                                >
                                                    {i + 1}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span
                                                            className="font-mono font-semibold truncate"
                                                            style={{
                                                                color: isCurrentReceipt
                                                                    ? 'var(--success)'
                                                                    : 'var(--text-primary)',
                                                            }}
                                                        >
                                                            {p.receiptNumber}
                                                        </span>
                                                        {isCurrentReceipt && (
                                                            <span className="badge badge-success text-[7px]">
                                                                Current
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5 text-[var(--text-muted)]">
                                                        <span>
                                                            {new Date(p.paidAt).toLocaleDateString('en-IN', {
                                                                day: '2-digit', month: 'short', year: 'numeric',
                                                            })}
                                                        </span>
                                                        <span className="capitalize">
                                                            • {p.mode || p.paymentMode || '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span className="font-bold font-mono text-[var(--success-dark)]">
                                                    ₹{p.amount.toLocaleString('en-IN')}
                                                </span>
                                                <button
                                                    onClick={e => {
                                                        e.stopPropagation()
                                                        handlePrintSpecificPayment(p)
                                                    }}
                                                    className="btn-icon btn-icon-sm"
                                                    title={`Print receipt ${p.receiptNumber}`}
                                                    style={{
                                                        backgroundColor: 'var(--info-50)',
                                                        color: 'var(--info)',
                                                        border: '1px solid var(--info-200)',
                                                    }}
                                                >
                                                    <Printer size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Print all button */}
                            <button
                                onClick={() => {
                                    data.allPayments.forEach((p: any, i: number) => {
                                        setTimeout(() => handlePrintSpecificPayment(p), i * 500)
                                    })
                                }}
                                className="w-full mt-2 py-2 rounded-[var(--radius-lg)] text-[11px] font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                                style={{
                                    backgroundColor: 'var(--bg-subtle)',
                                    color: 'var(--text-secondary)',
                                    border: '1px dashed var(--border-strong)',
                                }}
                            >
                                <Printer size={12} />
                                Print All {data.allPayments.length} Receipts
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button onClick={onClose} className="btn-ghost flex-1">
                        Close
                    </button>
                    <button onClick={handlePrint} className="btn-primary flex-1">
                        <Printer size={14} />
                        Print {paperSize}
                    </button>
                </div>
            </div>
        </div>
    )
}



/* ═══════════════════════════════════════════════════════════════
   FEE STRUCTURE MODAL — MULTI-TENANT UPDATED
   ═══════════════════════════════════════════════════════════════ */
function FeeStructureModal({
    open, editItem, academicConfig, onClose, onSuccess,
}: {
    open: boolean
    editItem: FeeStructure | null
    academicConfig: AcademicDerivedConfig
    onClose: () => void
    onSuccess: (msg: string) => void
}) {
    // ✅ Institution type from session
    const { data: session } = useSession()
    const institutionType = session?.user?.institutionType || 'school'
    const isSchool = institutionType === 'school'

    // ✅ Courses list for academy/coaching
    const [courses, setCourses] = useState<Array<{
        _id: string
        name: string
        code: string
        category: string
        feeAmount: number
        feeType: string
    }>>([])

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // ─────────────────────────────────────────────────────────
    // Form initial state — conditional by institution type
    // ─────────────────────────────────────────────────────────
    const initForm = useCallback(() => {
        const base = {
            name: '',
            academicYear: academicConfig.currentAcademicYear,
            term: 'Term 1',
            dueDate: '',
            lateFinePerDay: 0,
            lateFineType: 'fixed',
            maxLateFine: 0,
            autoAssign: true,
            items: [{ label: 'Tuition Fee', amount: 0, isOptional: false }],
        }

        if (isSchool) {
            return { ...base, class: '', section: 'all', stream: '', courseId: '' }
        } else {
            return { ...base, class: '', section: 'all', stream: '', courseId: '' }
        }
    }, [academicConfig.currentAcademicYear, isSchool])

    const [form, setForm] = useState(initForm)

    // ─────────────────────────────────────────────────────────
    // Computed values
    // ─────────────────────────────────────────────────────────
    const isHigherSecondary = isSchool && ['11', '12'].includes(form.class)

    const mandatoryTotal = form.items
        .filter(i => !i.isOptional)
        .reduce((s, i) => s + Number(i.amount), 0)

    const optionalTotal = form.items
        .filter(i => i.isOptional)
        .reduce((s, i) => s + Number(i.amount), 0)

    // ─────────────────────────────────────────────────────────
    // Effects
    // ─────────────────────────────────────────────────────────

    // Fetch courses for academy/coaching
    useEffect(() => {
        if (!isSchool && open) {
            fetch('/api/courses')
                .then(r => r.json())
                .then(d => setCourses(d.courses ?? []))
                .catch(() => { })
        }
    }, [isSchool, open])

    // Pre-fill items from selected course (only when creating new, not editing)
    useEffect(() => {
        if (!form.courseId || courses.length === 0 || editItem) return

        const course = courses.find(c => c._id === form.courseId)
        if (!course) return

        // ✅ Pre-fill name and amount from course (adjustable)
        setForm(f => ({
            ...f,
            name: f.name || `${course.name} Fee - ${f.academicYear}`,
            items: [{
                label: `${course.name} Course Fee`,
                amount: course.feeAmount || 0,
                isOptional: false,
            }],
        }))
    }, [form.courseId, courses, editItem])

    // Populate form when editing
    useEffect(() => {
        if (!open) return

        if (editItem) {
            setForm({
                name: editItem.name,
                class: editItem.class ?? '',
                section: editItem.section ?? 'all',
                stream: editItem.stream ?? '',
                courseId: (editItem as any).courseId?._id ?? (editItem as any).courseId ?? '',
                academicYear: editItem.academicYear,
                term: editItem.term,
                dueDate: new Date(editItem.dueDate).toISOString().split('T')[0],
                lateFinePerDay: editItem.lateFinePerDay,
                lateFineType: editItem.lateFineType,
                maxLateFine: editItem.maxLateFine,
                autoAssign: editItem.autoAssign,
                items: editItem.items,
            })
        } else {
            setForm(initForm())
        }
        setError('')
    }, [editItem, open, initForm])

    // ─────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────
    const setField = (key: string, val: any) => {
        setForm(f => {
            const updated = { ...f, [key]: val }
            // Reset stream when class changes away from 11/12
            if (key === 'class' && !['11', '12'].includes(val)) {
                updated.stream = ''
            }
            // Reset items when course changes (only for new structures)
            if (key === 'courseId' && !editItem) {
                updated.items = [{ label: 'Tuition Fee', amount: 0, isOptional: false }]
                updated.name = ''
            }
            return updated
        })
    }

    const addItem = () =>
        setField('items', [...form.items, { label: '', amount: 0, isOptional: false }])

    const updateItem = (idx: number, key: string, val: any) =>
        setField('items', form.items.map((item, i) =>
            i === idx ? { ...item, [key]: val } : item
        ))

    const removeItem = (idx: number) =>
        setField('items', form.items.filter((_, i) => i !== idx))

    // ─────────────────────────────────────────────────────────
    // Submit
    // ─────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // ── Validation ──
        if (!form.name.trim()) {
            setError('Fee name required hai')
            return
        }
        if (!form.dueDate) {
            setError('Due date set karo')
            return
        }

        // School-specific validation
        if (isSchool && !form.class) {
            setError('Class select karo')
            return
        }

        // Academy/Coaching-specific validation
        if (!isSchool && !form.courseId) {
            setError('Course select karo')
            return
        }

        if (form.items.some(i => !i.label.trim() || Number(i.amount) <= 0)) {
            setError('Saare fee items ka label aur amount fill karo')
            return
        }

        const mTotal = form.items
            .filter(i => !i.isOptional)
            .reduce((s, i) => s + Number(i.amount), 0)
        const oTotal = form.items
            .filter(i => i.isOptional)
            .reduce((s, i) => s + Number(i.amount), 0)

        if (mTotal <= 0) {
            setError('Kam se kam ek mandatory fee item hona chahiye')
            return
        }

        setLoading(true)
        try {
            const url = editItem
                ? `/api/fees/structure/${editItem._id}`
                : '/api/fees/structure'
            const method = editItem ? 'PUT' : 'POST'

            const payload: any = {
                name: form.name.trim(),
                academicYear: form.academicYear,
                term: form.term,
                dueDate: form.dueDate,
                items: form.items,
                totalAmount: mTotal,
                optionalTotal: oTotal,
                lateFinePerDay: form.lateFinePerDay,
                lateFineType: form.lateFineType,
                maxLateFine: form.maxLateFine,
                autoAssign: form.autoAssign,
            }

            // ✅ Conditional payload fields
            if (isSchool) {
                payload.class = form.class
                payload.section = form.section
                payload.stream = isHigherSecondary ? form.stream : undefined
            } else {
                payload.courseId = form.courseId
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const data = await res.json()

            if (!res.ok) {
                setError(data.error ?? 'Something went wrong')
                return
            }

            // ✅ Success message — institution-aware
            let successMsg = editItem
                ? 'Fee structure updated successfully!'
                : buildSuccessMsg({
                    institutionType,
                    isSchool,
                    form,
                    isHigherSecondary,
                    mTotal,
                    oTotal,
                    feesCreated: data.feesCreated ?? 0,
                })

            onSuccess(successMsg)

        } finally {
            setLoading(false)
        }
    }

    if (!open) return null

    // ─────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────
    return (
        <div className="modal-backdrop">
            <div
                className="modal-panel"
                style={{ maxWidth: 'var(--width-modal-lg)' }}
                onClick={e => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div className="modal-header">
                    <div>
                        <h3 className="modal-title">
                            {editItem ? `Edit: ${editItem.name}` : 'Create Fee Structure'}
                        </h3>
                        <p className="text-xs mt-0.5 text-[var(--text-muted)]">
                            {editItem
                                ? 'Fee structure update karein'
                                : isSchool
                                    ? 'Class-wise fees define karein'
                                    : 'Course-wise fees define karein'
                            }
                        </p>
                    </div>
                    <button onClick={onClose} className="modal-close">
                        <X size={16} />
                    </button>
                </div>

                {/* ── Form ── */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="modal-body space-y-5">

                        {/* ══ SECTION: Basic Info ══ */}
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider mb-3 text-[var(--text-muted)]">
                                Basic Info
                            </p>
                            <div className="grid grid-cols-2 gap-4">

                                {/* Name — full width */}
                                <div className="col-span-2">
                                    <FormInput
                                        label="Fee Structure Name"
                                        value={form.name}
                                        onChange={val => setField('name', val)}
                                        required
                                        placeholder={
                                            isSchool
                                                ? 'e.g. Term 1 Fee 2025-26'
                                                : 'e.g. Python Course Fee - Jan 2025'
                                        }
                                    />
                                </div>

                                {/* Academic Year */}
                                <FormSelect
                                    label="Academic Year"
                                    value={form.academicYear}
                                    onChange={val => setField('academicYear', val)}
                                    required
                                    options={academicConfig.academicYears.map(y => ({
                                        value: y, label: y,
                                    }))}
                                />

                                {/* Term */}
                                <FormSelect
                                    label="Term / Period"
                                    value={form.term}
                                    onChange={val => setField('term', val)}
                                    required
                                    options={TERMS.map(t => ({ value: t, label: t }))}
                                />

                                {/* ✅ CONDITIONAL: Class selector (School) OR Course selector (Academy/Coaching) */}
                                {isSchool ? (
                                    <>
                                        {/* SCHOOL: Class */}
                                        <FormSelect
                                            label="For Class"
                                            value={form.class}
                                            onChange={val => setField('class', val)}
                                            required
                                            options={[
                                                { value: '', label: 'Select Class' },
                                                { value: 'all', label: 'All Classes' },
                                                ...academicConfig.classes.map(c => ({
                                                    value: c, label: `Class ${c}`,
                                                })),
                                            ]}
                                        />

                                        {/* SCHOOL: Section */}
                                        <FormSelect
                                            label="Section"
                                            value={form.section}
                                            onChange={val => setField('section', val)}
                                            options={[
                                                { value: 'all', label: 'All Sections' },
                                                ...academicConfig.sections.map(s => ({
                                                    value: s, label: `Section ${s}`,
                                                })),
                                            ]}
                                        />
                                    </>
                                ) : (
                                    /* ACADEMY/COACHING: Course selector — full width */
                                    <div className="col-span-2">
                                        <div className="flex flex-col gap-1">
                                            <label className="input-label">
                                                Select Course
                                                <span className="text-[var(--danger)]"> *</span>
                                            </label>

                                            {courses.length === 0 ? (
                                                <div
                                                    className="input-clean flex items-center gap-2"
                                                    style={{ color: 'var(--text-muted)' }}
                                                >
                                                    <Spinner size="sm" />
                                                    <span className="text-sm">Loading courses...</span>
                                                </div>
                                            ) : (
                                                <select
                                                    className="input-clean"
                                                    value={form.courseId}
                                                    onChange={e => setField('courseId', e.target.value)}
                                                    required={!isSchool}
                                                >
                                                    <option value="">— Choose a course —</option>
                                                    {courses.map(c => (
                                                        <option key={c._id} value={c._id}>
                                                            {c.name} ({c.code}) — ₹{(c.feeAmount || 0).toLocaleString('en-IN')}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}

                                            <p className="input-hint">
                                                Course select karne par amount auto-fill hoga (aap change kar sakte hain)
                                            </p>
                                        </div>

                                        {/* ✅ Selected course info card */}
                                        {form.courseId && (() => {
                                            const selectedCourse = courses.find(c => c._id === form.courseId)
                                            if (!selectedCourse) return null
                                            return (
                                                <div
                                                    className="mt-2 px-3 py-2.5 rounded-[var(--radius-lg)] flex items-center gap-3"
                                                    style={{
                                                        backgroundColor: 'var(--primary-50)',
                                                        border: '1px solid var(--primary-200)',
                                                    }}
                                                >
                                                    <div
                                                        className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0"
                                                        style={{ backgroundColor: 'var(--primary-100)' }}
                                                    >
                                                        <span className="text-xs font-bold text-[var(--primary-700)]">
                                                            {selectedCourse.code?.slice(0, 2).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-semibold text-[var(--primary-700)] truncate">
                                                            {selectedCourse.name}
                                                        </p>
                                                        <p className="text-[0.625rem] text-[var(--primary-500)]">
                                                            {selectedCourse.category} · Base fee: ₹{(selectedCourse.feeAmount || 0).toLocaleString('en-IN')}
                                                        </p>
                                                    </div>
                                                    <span className="badge badge-brand flex-shrink-0">
                                                        {selectedCourse.feeType}
                                                    </span>
                                                </div>
                                            )
                                        })()}
                                    </div>
                                )}

                                {/* Due Date — always */}
                                <FormInput
                                    label="Due Date"
                                    value={form.dueDate}
                                    onChange={val => setField('dueDate', val)}
                                    type="date"
                                    required
                                />
                            </div>

                            {/* ✅ Stream selector — School only, Class 11/12 only */}
                            {isSchool && isHigherSecondary && (
                                <div className="mt-4">
                                    <label className="input-label mb-2 block">
                                        Stream / Faculty
                                        <span className="ml-1 font-normal text-[var(--text-muted)]">
                                            — blank rakho to apply to all streams
                                        </span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">

                                        {/* All Streams option */}
                                        <button
                                            type="button"
                                            onClick={() => setField('stream', '')}
                                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-lg)] text-left transition-all"
                                            style={{
                                                border: `2px solid ${!form.stream
                                                    ? 'var(--text-secondary)'
                                                    : 'var(--border)'
                                                    }`,
                                                backgroundColor: !form.stream
                                                    ? 'var(--bg-subtle)'
                                                    : 'var(--bg-card)',
                                            }}
                                        >
                                            <div
                                                className="w-7 h-7 rounded-[var(--radius-md)] flex items-center justify-center text-xs font-bold flex-shrink-0"
                                                style={{
                                                    backgroundColor: !form.stream
                                                        ? 'var(--text-secondary)'
                                                        : 'var(--bg-muted)',
                                                    color: !form.stream
                                                        ? '#ffffff'
                                                        : 'var(--text-muted)',
                                                }}
                                            >
                                                *
                                            </div>
                                            <p
                                                className="text-xs font-semibold"
                                                style={{
                                                    color: !form.stream
                                                        ? 'var(--text-primary)'
                                                        : 'var(--text-secondary)',
                                                }}
                                            >
                                                All Streams
                                            </p>
                                            {!form.stream && (
                                                <div
                                                    className="w-4 h-4 rounded-full flex items-center justify-center ml-auto flex-shrink-0"
                                                    style={{ backgroundColor: 'var(--text-secondary)' }}
                                                >
                                                    <span className="text-white text-[0.5rem]">✓</span>
                                                </div>
                                            )}
                                        </button>

                                        {/* Individual stream buttons */}
                                        {STREAMS.map(s => (
                                            <button
                                                key={s.value}
                                                type="button"
                                                onClick={() => setField('stream', s.value)}
                                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-lg)] text-left transition-all"
                                                style={{
                                                    border: `2px solid ${form.stream === s.value
                                                        ? s.color
                                                        : 'var(--border)'
                                                        }`,
                                                    backgroundColor: form.stream === s.value
                                                        ? s.bg
                                                        : 'var(--bg-card)',
                                                }}
                                            >
                                                <div
                                                    className="w-7 h-7 rounded-[var(--radius-md)] flex items-center justify-center text-xs font-bold flex-shrink-0"
                                                    style={{
                                                        backgroundColor: form.stream === s.value
                                                            ? s.color
                                                            : 'var(--bg-muted)',
                                                        color: form.stream === s.value
                                                            ? '#ffffff'
                                                            : 'var(--text-muted)',
                                                    }}
                                                >
                                                    {s.label.charAt(0)}
                                                </div>
                                                <p
                                                    className="text-xs font-semibold"
                                                    style={{
                                                        color: form.stream === s.value
                                                            ? s.color
                                                            : 'var(--text-primary)',
                                                    }}
                                                >
                                                    {s.label}
                                                </p>
                                                {form.stream === s.value && (
                                                    <div
                                                        className="w-4 h-4 rounded-full flex items-center justify-center ml-auto flex-shrink-0"
                                                        style={{ backgroundColor: s.color }}
                                                    >
                                                        <span className="text-white text-[0.5rem]">✓</span>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ══ SECTION: Late Fine Settings ══ */}
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider mb-3 text-[var(--text-muted)]">
                                Late Fine Settings
                            </p>
                            <div
                                className="rounded-[var(--radius-lg)] p-4"
                                style={{
                                    backgroundColor: 'var(--warning-50)',
                                    border: '1px solid var(--warning-200)',
                                }}
                            >
                                <div className="grid grid-cols-3 gap-3">
                                    <FormInput
                                        label="Fine per day"
                                        value={form.lateFinePerDay || ''}
                                        onChange={val => setField('lateFinePerDay', Number(val))}
                                        type="number"
                                        placeholder="10"
                                        helper="0 = no late fine"
                                    />
                                    <FormSelect
                                        label="Fine type"
                                        value={form.lateFineType}
                                        onChange={val => setField('lateFineType', val)}
                                        options={[
                                            { value: 'fixed', label: '₹ Fixed amount' },
                                            { value: 'percent', label: '% Percentage' },
                                        ]}
                                    />
                                    <FormInput
                                        label="Max fine cap (₹)"
                                        value={form.maxLateFine || ''}
                                        onChange={val => setField('maxLateFine', Number(val))}
                                        type="number"
                                        placeholder="500"
                                        helper="0 = no cap"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ══ SECTION: Fee Items ══ */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                        Fee Items
                                    </p>
                                    {!isSchool && (
                                        <p className="text-[0.625rem] text-[var(--text-muted)] mt-0.5">
                                            Course se pre-filled hai — aap adjust kar sakte hain
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary-500)] hover:text-[var(--primary-700)] transition-colors"
                                >
                                    <Plus size={12} /> Add Item
                                </button>
                            </div>

                            <div className="space-y-2">
                                {form.items.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex gap-2 items-center p-3 rounded-[var(--radius-lg)]"
                                        style={{
                                            backgroundColor: item.isOptional
                                                ? 'var(--warning-50)'
                                                : 'var(--bg-subtle)',
                                            border: `1px solid ${item.isOptional
                                                ? 'var(--warning-200)'
                                                : 'var(--border)'
                                                }`,
                                        }}
                                    >
                                        <input
                                            className="input-clean flex-1"
                                            placeholder="Fee label (e.g., Tuition Fee)"
                                            value={item.label}
                                            onChange={e => updateItem(idx, 'label', e.target.value)}
                                            required
                                        />
                                        <input
                                            className="input-clean w-28 tabular-nums"
                                            type="number"
                                            placeholder="Amount ₹"
                                            value={item.amount || ''}
                                            min={0}
                                            onChange={e => updateItem(idx, 'amount', Number(e.target.value))}
                                            required
                                        />
                                        <label className="flex items-center gap-1.5 text-xs cursor-pointer whitespace-nowrap text-[var(--text-secondary)]">
                                            <input
                                                type="checkbox"
                                                className="rounded"
                                                checked={item.isOptional}
                                                onChange={e => updateItem(idx, 'isOptional', e.target.checked)}
                                            />
                                            Optional
                                        </label>
                                        {form.items.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeItem(idx)}
                                                className="btn-icon btn-icon-sm flex-shrink-0 hover:bg-[var(--danger-50)] hover:text-[var(--danger)] hover:border-[var(--danger-200)]"
                                            >
                                                <X size={13} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="mt-3 space-y-2">

                                {/* Mandatory total */}
                                <div
                                    className="flex items-center justify-between px-4 py-3 rounded-[var(--radius-lg)]"
                                    style={{
                                        backgroundColor: 'var(--info-50)',
                                        border: '1px solid var(--info-200)',
                                    }}
                                >
                                    <div>
                                        <span className="text-xs font-semibold text-[var(--info-dark)]">
                                            Mandatory Total
                                        </span>
                                        <p className="text-[0.625rem] mt-0.5 text-[var(--info-500)]">
                                            {isSchool
                                                ? 'Yeh amount sabhi class students ko assign hogi'
                                                : 'Yeh amount sabhi enrolled students ko assign hogi'
                                            }
                                        </p>
                                    </div>
                                    <span className="text-lg font-extrabold tabular-nums text-[var(--info-dark)]">
                                        ₹{mandatoryTotal.toLocaleString('en-IN')}
                                    </span>
                                </div>

                                {/* Optional total */}
                                {optionalTotal > 0 && (
                                    <>
                                        <div
                                            className="flex items-center justify-between px-4 py-3 rounded-[var(--radius-lg)]"
                                            style={{
                                                backgroundColor: 'var(--warning-50)',
                                                border: '1px solid var(--warning-200)',
                                            }}
                                        >
                                            <div>
                                                <span className="text-xs font-semibold text-[var(--warning-dark)]">
                                                    Optional Fees
                                                </span>
                                                <p className="text-[0.625rem] mt-0.5 text-[var(--warning-500)]">
                                                    Manually assign karni padegi selected students ko
                                                </p>
                                            </div>
                                            <span className="text-lg font-extrabold tabular-nums text-[var(--warning-dark)]">
                                                ₹{optionalTotal.toLocaleString('en-IN')}
                                            </span>
                                        </div>

                                        <div
                                            className="flex items-center justify-between px-3 py-2 rounded-[var(--radius-md)]"
                                            style={{ backgroundColor: 'var(--bg-subtle)' }}
                                        >
                                            <span className="text-xs text-[var(--text-muted)]">
                                                Grand Total (if all applicable)
                                            </span>
                                            <span className="text-sm font-bold tabular-nums text-[var(--text-secondary)]">
                                                ₹{(mandatoryTotal + optionalTotal).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* ══ SECTION: Auto Assign Toggle — create only ══ */}
                        {!editItem && (
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider mb-3 text-[var(--text-muted)]">
                                    Assignment
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setField('autoAssign', !form.autoAssign)}
                                    className="w-full flex items-center gap-3 p-4 rounded-[var(--radius-lg)] text-left transition-all"
                                    style={{
                                        backgroundColor: form.autoAssign
                                            ? 'var(--info-50)'
                                            : 'var(--bg-subtle)',
                                        border: `1.5px solid ${form.autoAssign
                                            ? 'var(--info-200)'
                                            : 'var(--border)'
                                            }`,
                                    }}
                                >
                                    {/* Toggle pill */}
                                    <div
                                        className="w-10 h-5 rounded-full relative flex-shrink-0 transition-colors"
                                        style={{
                                            backgroundColor: form.autoAssign
                                                ? 'var(--primary-500)'
                                                : 'var(--border-strong)',
                                        }}
                                    >
                                        <div
                                            className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                                            style={{
                                                transform: form.autoAssign
                                                    ? 'translateX(1.25rem)'
                                                    : 'translateX(0.125rem)',
                                            }}
                                        />
                                    </div>

                                    <div className="flex-1">
                                        <p
                                            className="text-sm font-semibold"
                                            style={{
                                                color: form.autoAssign
                                                    ? 'var(--info-dark)'
                                                    : 'var(--text-secondary)',
                                            }}
                                        >
                                            Auto-assign to existing{' '}
                                            {isSchool ? 'students' : 'enrolled students'}
                                        </p>
                                        <p className="text-[0.6875rem] mt-0.5 text-[var(--text-muted)]">
                                            {isSchool
                                                ? 'Is class ke saare active students ko yeh fee automatically assign hogi'
                                                : 'Is course ke saare active enrollments ko yeh fee automatically assign hogi'
                                            }
                                        </p>
                                    </div>

                                    <Zap
                                        size={16}
                                        style={{
                                            color: form.autoAssign
                                                ? 'var(--primary-500)'
                                                : 'var(--border-strong)',
                                        }}
                                    />
                                </button>
                            </div>
                        )}

                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mx-6 mb-2">
                            <div
                                className="flex items-center gap-2 px-4 py-3 rounded-[var(--radius-md)] text-sm"
                                style={{
                                    backgroundColor: 'var(--danger-50)',
                                    color: 'var(--danger)',
                                    border: '1px solid var(--danger-200)',
                                }}
                            >
                                <AlertCircle size={15} />
                                {error}
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn-ghost">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                        >
                            {loading
                                ? <Spinner size="sm" />
                                : editItem ? <Edit2 size={14} /> : <Plus size={14} />
                            }
                            {loading
                                ? 'Saving...'
                                : editItem ? 'Update Structure' : 'Create & Assign'
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

/* ─── Helper: Build success message ─── */
function buildSuccessMsg({
    institutionType, isSchool, form, isHigherSecondary,
    mTotal, oTotal, feesCreated,
}: {
    institutionType: string
    isSchool: boolean
    form: any
    isHigherSecondary: boolean
    mTotal: number
    oTotal: number
    feesCreated: number
}): string {
    let msg = 'Fee structure created'

    if (isSchool) {
        const streamLabel = !isHigherSecondary
            ? ''
            : !form.stream
                ? ' (All Streams)'
                : ` (${form.stream})`
        msg += streamLabel
    } else {
        msg += ' for course'
    }

    msg += '!'

    if (feesCreated > 0) {
        msg += ` ${feesCreated} ${isSchool ? 'students' : 'enrollments'} assigned ₹${mTotal.toLocaleString('en-IN')}`
    }

    if (oTotal > 0) {
        msg += ` | ₹${oTotal.toLocaleString('en-IN')} optional fees need manual assignment`
    }

    return msg
}


/* ─── Helper Component: Course Filter Dropdown ─── */
function CourseFilterDropdown({
    value, onChange,
}: {
    value: string
    onChange: (val: string) => void
}) {
    const [courses, setCourses] = useState<Array<{
        _id: string
        name: string
        code: string
        category: string
    }>>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setLoading(true)
        fetch('/api/courses')
            .then(r => r.json())
            .then(d => setCourses(d.courses ?? []))
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    return (
        <select
            className="input-clean"
            style={{ minWidth: '220px' }}
            value={value}
            onChange={e => onChange(e.target.value)}
            disabled={loading}
        >
            <option value="">
                {loading ? 'Loading courses...' : 'All Courses'}
            </option>
            {courses.map(c => (
                <option key={c._id} value={c._id}>
                    {c.name} ({c.code})
                </option>
            ))}
        </select>
    )
}


/* ════════════════════════════════════════════
   OPTIONAL FEE MODAL
   ════════════════════════════════════════════ */
function OptionalFeeModal({
    open, structure, onClose, onSuccess,
}: {
    open: boolean
    structure: FeeStructure | null
    onClose: () => void
    onSuccess: (msg: string) => void
}) {
    const [students, setStudents] = useState<any[]>([])
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [selectedItems, setSelectedItems] = useState<string[]>([]) // ✅ array
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(false)

    const optionalItems = structure?.items.filter(i => i.isOptional) ?? []

    useEffect(() => {
        if (!open || !structure) return
        setFetching(true)
        setSelectedIds([])
        setSelectedItems([])  // ✅ reset array

        const params = new URLSearchParams()
        if (structure.class !== 'all') params.set('class', structure.class)
        if (structure.section && structure.section !== 'all') {
            params.set('section', structure.section)
        }
        params.set('status', 'active')
        params.set('limit', '200')

        fetch(`/api/students?${params}`)
            .then(r => r.json())
            .then(d => setStudents(d.students ?? []))
            .finally(() => setFetching(false))
    }, [open, structure])

    // ✅ Selected items ka data array
    const selectedItemsData = optionalItems.filter(i =>
        selectedItems.includes(i.label)
    )

    // ✅ Selected items ka total amount
    const selectedOptionalTotal = selectedItemsData.reduce(
        (sum, i) => sum + i.amount, 0
    )

    // ✅ Toggle item selection
    const toggleItem = (label: string) => {
        setSelectedItems(prev =>
            prev.includes(label)
                ? prev.filter(l => l !== label)
                : [...prev, label]
        )
    }

    const handleAssign = async () => {
        if (!structure || !selectedIds.length || !selectedItemsData.length) return
        setLoading(true)
        try {
            const res = await fetch('/api/fees/optional-assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    structureId: structure._id,
                    studentIds: selectedIds,
                    items: selectedItemsData,  // ✅ array of items
                    dueDate: structure.dueDate,
                    academicYear: structure.academicYear,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            onSuccess(
                `${data.assigned} students ko ${selectedItemsData.map(i => i.label).join(', ')} assign ho gaya`
            )
            onClose()
        } catch (err: any) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    if (!open || !structure) return null

    return (
        <div className="modal-backdrop">
            <div
                className="modal-panel"
                style={{ maxWidth: 'var(--width-modal-md)' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center"
                            style={{ backgroundColor: 'var(--warning-50)' }}
                        >
                            <Sparkles size={16} style={{ color: 'var(--warning)' }} />
                        </div>
                        <div>
                            <h3 className="modal-title">Assign Optional Fee</h3>
                            <p className="text-xs text-[var(--text-muted)]">
                                {structure.name} · Class {structure.class}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="modal-close">
                        <X size={14} />
                    </button>
                </div>

                {/* Body */}
                <div className="modal-body space-y-4">

                    {/* ✅ Multi-select optional items */}
                    <div>
                        <label className="input-label mb-2 block">
                            Kaunsi optional fees assign karni hain?{' '}
                            <span className="font-normal text-[var(--text-muted)]">
                                (multiple select kar sakte ho)
                            </span>
                        </label>
                        <div className="space-y-2">
                            {optionalItems.map(item => {
                                const isSelected = selectedItems.includes(item.label)
                                return (
                                    <button
                                        key={item.label}
                                        onClick={() => toggleItem(item.label)}
                                        className="w-full flex items-center justify-between px-4 py-3 rounded-[var(--radius-lg)] text-left transition-all"
                                        style={{
                                            border: `2px solid ${isSelected
                                                ? 'var(--warning)'
                                                : 'var(--border)'
                                                }`,
                                            backgroundColor: isSelected
                                                ? 'var(--warning-50)'
                                                : 'var(--bg-card)',
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            {/* ✅ Checkbox visual — not radio */}
                                            <div
                                                className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                                                style={{
                                                    backgroundColor: isSelected
                                                        ? 'var(--warning)'
                                                        : 'transparent',
                                                    border: `2px solid ${isSelected
                                                        ? 'var(--warning)'
                                                        : 'var(--border-strong)'
                                                        }`,
                                                }}
                                            >
                                                {isSelected && (
                                                    <span className="text-white text-[0.5rem] font-bold">
                                                        ✓
                                                    </span>
                                                )}
                                            </div>
                                            <span
                                                className="text-sm font-medium"
                                                style={{
                                                    color: isSelected
                                                        ? 'var(--warning-dark)'
                                                        : 'var(--text-secondary)',
                                                }}
                                            >
                                                {item.label}
                                            </span>
                                        </div>
                                        <span
                                            className="text-sm font-bold tabular-nums"
                                            style={{
                                                color: isSelected
                                                    ? 'var(--warning)'
                                                    : 'var(--text-secondary)',
                                            }}
                                        >
                                            ₹{item.amount.toLocaleString('en-IN')}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Students select */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="input-label">
                                Students select karo ({selectedIds.length} selected)
                            </label>
                            <button
                                onClick={() => {
                                    if (selectedIds.length === students.length)
                                        setSelectedIds([])
                                    else
                                        setSelectedIds(students.map(s => s._id))
                                }}
                                className="text-xs font-medium text-[var(--primary-500)]
                                           hover:text-[var(--primary-700)] transition-colors"
                            >
                                {selectedIds.length === students.length
                                    ? 'Deselect All'
                                    : 'Select All'}
                            </button>
                        </div>

                        {fetching ? (
                            <div className="portal-empty py-8">
                                <Spinner size="lg" />
                            </div>
                        ) : students.length === 0 ? (
                            <div className="portal-empty py-8">
                                <p className="portal-empty-title">No students found</p>
                            </div>
                        ) : (
                            <div
                                className="rounded-[var(--radius-lg)] overflow-hidden"
                                style={{
                                    border: '1px solid var(--border)',
                                    maxHeight: '240px',
                                    overflowY: 'auto',
                                }}
                            >
                                {students.map((s, idx) => (
                                    <label
                                        key={s._id}
                                        className="flex items-center gap-3 px-4 py-2.5
                                                   cursor-pointer transition-colors
                                                   hover:bg-[var(--bg-muted)]"
                                        style={{
                                            borderBottom: idx < students.length - 1
                                                ? '1px solid var(--border)'
                                                : 'none',
                                            backgroundColor: selectedIds.includes(s._id)
                                                ? 'var(--primary-50)'
                                                : undefined,
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            className="rounded"
                                            checked={selectedIds.includes(s._id)}
                                            onChange={() => {
                                                setSelectedIds(prev =>
                                                    prev.includes(s._id)
                                                        ? prev.filter(id => id !== s._id)
                                                        : [...prev, s._id]
                                                )
                                            }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate
                                                          text-[var(--text-primary)]">
                                                {s.userId?.name}
                                            </p>
                                            <p className="text-xs font-mono
                                                          text-[var(--text-muted)]">
                                                {s.admissionNo} · Roll #{s.rollNo}
                                            </p>
                                        </div>
                                        <span className="badge badge-brand flex-shrink-0">
                                            {s.class}-{s.section}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ✅ Assignment summary — multi-item */}
                    {selectedIds.length > 0 && selectedItemsData.length > 0 && (
                        <div
                            className="rounded-[var(--radius-lg)] p-4 space-y-2"
                            style={{
                                backgroundColor: 'var(--warning-50)',
                                border: '1px solid var(--warning-200)',
                            }}
                        >
                            <p className="text-xs font-semibold text-[var(--warning-dark)]">
                                Assignment Summary
                            </p>

                            {/* Per-item breakdown */}
                            {selectedItemsData.map(item => (
                                <div
                                    key={item.label}
                                    className="flex items-center justify-between text-xs"
                                >
                                    <span className="text-[var(--warning-600)]">
                                        {item.label} × {selectedIds.length} students
                                    </span>
                                    <span className="font-semibold tabular-nums
                                                      text-[var(--warning-dark)]">
                                        ₹{(selectedIds.length * item.amount)
                                            .toLocaleString('en-IN')}
                                    </span>
                                </div>
                            ))}

                            {/* Grand total */}
                            {selectedItemsData.length > 1 && (
                                <div
                                    className="flex items-center justify-between pt-2"
                                    style={{ borderTop: '1px dashed var(--warning-300)' }}
                                >
                                    <span className="text-sm font-semibold
                                                      text-[var(--warning-dark)]">
                                        Total
                                    </span>
                                    <span className="text-base font-bold tabular-nums
                                                      text-[var(--warning)]">
                                        ₹{(selectedIds.length * selectedOptionalTotal)
                                            .toLocaleString('en-IN')}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button onClick={onClose} className="btn-ghost flex-1">
                        Cancel
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={
                            loading ||
                            !selectedIds.length ||
                            !selectedItems.length  // ✅ array check
                        }
                        className="btn-accent flex-1"
                        style={{ backgroundColor: 'var(--warning)', color: '#ffffff' }}
                    >
                        {loading ? <Spinner size="sm" /> : <Sparkles size={14} />}
                        {loading
                            ? 'Assigning...'
                            : `Assign to ${selectedIds.length} Students`}
                    </button>
                </div>
            </div>
        </div>
    )
}


/* ═══════════════════════════════════════════════════════════════
   PAYMENT SETTINGS PANEL
   ═══════════════════════════════════════════════════════════════ */
function PaymentSettingsPanel({
    onAlert,
}: {
    onAlert: (a: { type: 'success' | 'error'; msg: string }) => void
}) {
    const [settings, setSettings] = useState<PaymentSettings | null>(null)
    const [form, setForm] = useState({
        razorpayKeyId: '',
        razorpayKeySecret: '',
        enableOnlinePayment: false,
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [allowPartial, setAllowPartial] = useState(false)
    const [minPartialAmt, setMinPartialAmt] = useState('')

    useEffect(() => {
        fetch('/api/payment-settings')
            .then(r => r.json())
            .then(d => {
                setSettings(d.settings)
                setForm({
                    razorpayKeyId: d.settings?.razorpayKeyId ?? '',
                    razorpayKeySecret: d.settings?.hasKey ? '••••••••' : '',
                    enableOnlinePayment: d.settings?.enableOnlinePayment ?? false,
                })
                setAllowPartial(d.settings?.allowStudentPartialPayment ?? false)
                setMinPartialAmt(String(d.settings?.minPartialPaymentAmount ?? '0'))
            })
            .catch(() => {
                onAlert({ type: 'error', msg: 'Failed to load payment settings' })
            })
            .finally(() => setLoading(false))
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            const body: any = {
                razorpayKeyId: form.razorpayKeyId,
                enableOnlinePayment: form.enableOnlinePayment,
            }
            if (!form.razorpayKeySecret.includes('•')) {
                body.razorpayKeySecret = form.razorpayKeySecret
            }
            const res = await fetch('/api/payment-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            if (res.ok) onAlert({ type: 'success', msg: 'Payment settings saved successfully!' })
            else onAlert({ type: 'error', msg: 'Failed to save settings' })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="portal-empty py-12">
                <Spinner size="lg" />
            </div>
        )
    }

    return (
        <div className="max-w-2xl space-y-4">

            {/* Online payment card */}
            <div className="portal-card">
                <div className="portal-card-body">

                    {/* Toggle row */}
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="portal-card-title">Online Payment</h3>
                            <p className="portal-card-subtitle">
                                Students/Parents apne phone se fee pay kar sakein
                            </p>
                        </div>
                        <button
                            onClick={() => setForm(f => ({
                                ...f, enableOnlinePayment: !f.enableOnlinePayment,
                            }))}
                            className="flex items-center gap-2"
                            aria-pressed={form.enableOnlinePayment}
                        >
                            <div
                                className="w-12 h-6 rounded-full relative transition-colors"
                                style={{
                                    backgroundColor: form.enableOnlinePayment
                                        ? 'var(--primary-500)'
                                        : 'var(--border-strong)',
                                }}
                            >
                                <div
                                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform"
                                    style={{
                                        transform: form.enableOnlinePayment
                                            ? 'translateX(1.625rem)'
                                            : 'translateX(0.25rem)',
                                    }}
                                />
                            </div>
                            <span
                                className="text-sm font-semibold"
                                style={{
                                    color: form.enableOnlinePayment
                                        ? 'var(--primary-500)'
                                        : 'var(--text-muted)',
                                }}
                            >
                                {form.enableOnlinePayment ? 'Enabled' : 'Disabled'}
                            </span>
                        </button>
                    </div>

                    {/* Razorpay config */}
                    {form.enableOnlinePayment && (
                        <div
                            className="space-y-4 mt-4 pt-4"
                            style={{ borderTop: '1px solid var(--border)' }}
                        >
                            <FormInput
                                label="Razorpay Key ID"
                                value={form.razorpayKeyId}
                                onChange={val => setForm(f => ({ ...f, razorpayKeyId: val }))}
                                placeholder="rzp_live_xxxxxxxxxx"
                                helper="Razorpay dashboard → Settings → API Keys"
                            />
                            <FormInput
                                label="Razorpay Key Secret"
                                value={form.razorpayKeySecret.includes('•') ? '' : form.razorpayKeySecret}
                                onChange={val => setForm(f => ({ ...f, razorpayKeySecret: val }))}
                                type="password"
                                placeholder={
                                    settings?.hasKey
                                        ? 'Current key saved (change karne ke liye type karein)'
                                        : 'rzp_secret_xxxxxxxxxx'
                                }
                                helper="Secret key encrypted store hoti hai"
                            />

                            {/* Setup guide */}
                            <div
                                className="rounded-[var(--radius-lg)] p-4"
                                style={{
                                    backgroundColor: 'var(--info-50)',
                                    border: '1px solid var(--info-200)',
                                }}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Info size={13} style={{ color: 'var(--info)' }} />
                                    <p className="text-xs font-semibold text-[var(--info-dark)]">
                                        Razorpay account setup guide
                                    </p>
                                </div>
                                <ol
                                    className="text-[0.6875rem] space-y-1 list-decimal list-inside text-[var(--info-600)]"
                                >
                                    <li>razorpay.com pe jaayein → Sign Up karein</li>
                                    <li>KYC complete karein (business verification)</li>
                                    <li>Settings → API Keys → Live Keys copy karein</li>
                                    <li>Yahan paste karein → Save karein</li>
                                </ol>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Student partial payment card */}
            <div
                className="portal-card"
            >
                <div className="portal-card-body">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="portal-card-title">Student Partial Payment</h3>
                            <p className="portal-card-subtitle">
                                Students ko apni marzi se partial amount pay karne do
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setAllowPartial(p => !p)}
                            className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
                            style={{
                                backgroundColor: allowPartial
                                    ? 'var(--success)'
                                    : 'var(--border-strong)',
                            }}
                            aria-pressed={allowPartial}
                        >
                            <span
                                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform"
                                style={{
                                    transform: allowPartial
                                        ? 'translateX(20px)'
                                        : 'translateX(0)',
                                }}
                            />
                        </button>
                    </div>

                    {allowPartial && (
                        <div
                            className="mt-3 pt-3"
                            style={{ borderTop: '1px dashed var(--border)' }}
                        >
                            <label className="input-label mb-1.5 block">
                                Minimum Partial Amount (₹)
                            </label>
                            <input
                                type="number"
                                value={minPartialAmt}
                                onChange={e => setMinPartialAmt(e.target.value)}
                                placeholder="0 = koi minimum nahi"
                                min={0}
                                className="input-clean w-full"
                            />
                            <p className="input-hint mt-1.5">
                                Example: ₹500 set karo → student kam se kam ₹500 dega.
                                0 rakho → koi limit nahi.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Save button */}
            <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary"
            >
                {saving ? <Spinner size="sm" /> : <Settings size={14} />}
                {saving ? 'Saving...' : 'Save Settings'}
            </button>
        </div>
    )
}
