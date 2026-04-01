// FILE: src/app/(dashboard)/admin/fees/page.tsx
'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
    CreditCard, Plus, Edit2, Trash2, Users, RefreshCw,
    ChevronRight, X, AlertCircle, Search,
    TrendingUp, AlertTriangle, CheckSquare,
    IndianRupee, Receipt, Settings,
    Zap, Clock, BarChart2, Eye, Download,
    Sparkles, Info, Printer,
} from 'lucide-react'
import { Spinner, Alert } from '@/components/ui'
import { Portal } from '@/components/ui/Portal'

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

/* ═══ Constants ═══ */
const CLASSES = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
const SECTIONS = ['A', 'B', 'C', 'D', 'E']
const TERMS = ['Term 1', 'Term 2', 'Term 3', 'Annual', 'Monthly', 'Quarterly', 'Half Yearly']
const STREAMS = [
    { value: 'science', label: 'Science', color: '#2563EB', bg: '#EFF6FF' },
    { value: 'commerce', label: 'Commerce', color: '#059669', bg: '#ECFDF5' },
    { value: 'arts', label: 'Arts / Humanities', color: '#7C3AED', bg: '#F5F3FF' },
    { value: 'vocational', label: 'Vocational', color: '#D97706', bg: '#FFFBEB' },
]

function getAcademicYears(): string[] {
    const years: string[] = []
    const now = new Date()
    const yr = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
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
    type?: string; required?: boolean; placeholder?: string; helper?: string; disabled?: boolean
}) => (
    <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold" style={{ color: '#475569' }}>
            {label}{required && <span style={{ color: '#EF4444' }}> *</span>}
        </label>
        <input
            type={type}
            className="h-9 px-3 text-sm rounded-lg outline-none transition-all"
            style={{ border: '1.5px solid #E2E8F0', color: '#0F172A', backgroundColor: disabled ? '#F8FAFC' : '#FFFFFF' }}
            placeholder={placeholder}
            value={value}
            required={required}
            disabled={disabled}
            onChange={e => onChange(e.target.value)}
            onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)' }}
            onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none' }}
        />
        {helper && <p className="text-[0.625rem]" style={{ color: '#94A3B8' }}>{helper}</p>}
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
        <label className="text-xs font-semibold" style={{ color: '#475569' }}>
            {label}{required && <span style={{ color: '#EF4444' }}> *</span>}
        </label>
        <select
            className="h-9 px-3 text-sm rounded-lg outline-none cursor-pointer"
            style={{ border: '1.5px solid #E2E8F0', color: '#0F172A', backgroundColor: '#FFFFFF' }}
            value={value}
            required={required}
            onChange={e => onChange(e.target.value)}
        >
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {helper && <p className="text-[0.625rem]" style={{ color: '#94A3B8' }}>{helper}</p>}
    </div>
)

/* ═══ Status Badge ═══ */
function FeeBadge({ status, dueDate }: { status: string; dueDate: string }) {
    const isOverdue = status === 'pending' && new Date(dueDate) < new Date()
    const cfg: Record<string, { bg: string; color: string; label: string }> = {
        paid: { bg: '#ECFDF5', color: '#059669', label: 'Paid' },
        waived: { bg: '#F1F5F9', color: '#64748B', label: 'Waived' },
        partial: { bg: '#FFF7ED', color: '#EA580C', label: 'Partial' },
        pending: isOverdue
            ? { bg: '#FEF2F2', color: '#DC2626', label: 'Overdue' }
            : { bg: '#FFFBEB', color: '#D97706', label: 'Pending' },
    }
    const c = cfg[status] || cfg.pending
    return (
        <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6875rem] font-semibold"
            style={{ backgroundColor: c.bg, color: c.color }}
        >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
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
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.625rem] font-semibold"
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
        <div
            className="rounded-2xl p-4 transition-all duration-300"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 25px -5px rgba(0,0,0,0.08)'
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
            }}
        >
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: iconBg }}>
                    <span style={{ color: iconColor }}>{icon}</span>
                </div>
                <div>
                    <p className="text-xl font-extrabold tracking-tight leading-none tabular-nums" style={{ color: valueColor || '#0F172A' }}>
                        {value}
                    </p>
                    <p className="text-[0.6875rem] mt-0.5 font-medium" style={{ color: '#94A3B8' }}>{label}</p>
                </div>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════ */
export default function FeesPage() {
    const [tab, setTab] = useState<'fees' | 'structures' | 'settings'>('fees')
    const [fees, setFees] = useState<Fee[]>([])
    const [structures, setStructures] = useState<FeeStructure[]>([])
    const [loading, setLoading] = useState(true)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const [onlinePayEnabled, setOnlinePayEnabled] = useState(false)

    // Filters
    const [filterStatus, setFilterStatus] = useState('')
    const [filterClass, setFilterClass] = useState('')
    const [filterSearch, setFilterSearch] = useState('')
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [structureClass, setStructureClass] = useState('')

    // Modals
    const [showStructureModal, setShowStructureModal] = useState(false)
    const [editStructure, setEditStructure] = useState<FeeStructure | null>(null)
    const [showPayModal, setShowPayModal] = useState(false)
    const [selectedFee, setSelectedFee] = useState<Fee | null>(null)
    const [showReceiptModal, setShowReceiptModal] = useState(false)
    const [receiptData, setReceiptData] = useState<any>(null)
    const [showOptionalModal, setShowOptionalModal] = useState(false)
    const [selectedStructure, setSelectedStructure] = useState<FeeStructure | null>(null)

    /* ── Stats (include partial in calculations) ── */
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

    /* ── Check payment settings ── */
    useEffect(() => {
        fetch('/api/payment-settings')
            .then(r => r.json())
            .then(d => {
                setOnlinePayEnabled(d.settings?.enableOnlinePayment && d.settings?.hasKey)
            })
            .catch(() => { })
    }, [])

    /* ── Fetch Fees ── */
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

    /* ── Fetch Structures ── */
    const fetchStructures = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (structureClass) params.set('class', structureClass)
            const res = await fetch(`/api/fees/structure?${params}`)
            const data = await res.json()
            setStructures(data.structures ?? [])
        } finally {
            setLoading(false)
        }
    }, [structureClass])

    useEffect(() => {
        if (tab === 'fees') fetchFees()
        else if (tab === 'structures') fetchStructures()
        else setLoading(false)
    }, [tab, fetchFees, fetchStructures])

    // Debounced search
    useEffect(() => {
        if (tab !== 'fees') return
        if (searchTimeout.current) clearTimeout(searchTimeout.current)
        searchTimeout.current = setTimeout(() => fetchFees(), 300)
        return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current) }
    }, [filterSearch, fetchFees, tab])

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

    /* ── Record Payment (Partial/Full) ── */
    const recordPayment = async (feeId: string, paymentMode: string, amount: number, notes?: string) => {
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
            // Show receipt
            if (data.receipt) {
                setReceiptData(data.receipt)
                setShowReceiptModal(true)
            }
        } else {
            showError(data.error || 'Failed to record payment')
        }
    }

    /* ── View Receipt ── */
    const viewReceipt = async (feeId: string, paymentIndex?: number) => {
        try {
            const params = paymentIndex !== undefined ? `?paymentIndex=${paymentIndex}` : ''
            const res = await fetch(`/api/fees/${feeId}/receipt${params}`)
            const data = await res.json()
            if (res.ok) {
                setReceiptData(data.receipt)
                setShowReceiptModal(true)
            } else showError('Failed to load receipt')
        } catch {
            showError('Failed to load receipt')
        }
    }

    const TABS = [
        { id: 'fees', label: 'Student Fees', icon: <CreditCard size={14} /> },
        { id: 'structures', label: 'Fee Structures', icon: <BarChart2 size={14} /> },
        { id: 'settings', label: 'Payment Settings', icon: <Settings size={14} /> },
    ] as const

    return (
        <div className="space-y-5 pb-8">
            {/* ═══ PAGE HEADER ═══ */}
            <div className="portal-page-header">
                <div>
                    <div className="portal-breadcrumb mb-1.5">
                        <span>Dashboard</span>
                        <ChevronRight size={12} />
                        <span className="current">Fee Management</span>
                    </div>
                    <h1 className="portal-page-title">Fee Management</h1>
                    <p className="portal-page-subtitle">
                        School fees manage karein · Structures, collection aur payments
                    </p>
                </div>
                <div className="flex gap-2">
                    {tab === 'structures' && (
                        <button
                            onClick={() => { setEditStructure(null); setShowStructureModal(true) }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[0.8125rem] font-semibold transition-all active:scale-[0.98]"
                            style={{ backgroundColor: '#2563EB', color: '#FFFFFF', boxShadow: '0 1px 3px rgba(37,99,235,0.3)' }}
                        >
                            <Plus size={14} strokeWidth={2.5} />
                            New Structure
                        </button>
                    )}
                    {tab === 'fees' && (
                        <button
                            onClick={() => fetchFees()}
                            className="h-9 w-9 rounded-xl border flex items-center justify-center transition-colors"
                            style={{ border: '1.5px solid #E2E8F0', color: '#94A3B8' }}
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        </button>
                    )}
                </div>
            </div>

            {alert && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />}

            {/* ═══ TABS ═══ */}
            <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: '#F1F5F9' }}>
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[0.8125rem] font-medium transition-all"
                        style={{
                            backgroundColor: tab === t.id ? '#FFFFFF' : 'transparent',
                            color: tab === t.id ? '#0F172A' : '#64748B',
                            boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                        }}
                    >
                        <span style={{ color: tab === t.id ? '#2563EB' : '#94A3B8' }}>{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ═══ TAB: STUDENT FEES ═══ */}
            {tab === 'fees' && (
                <div className="space-y-4">
                    {!loading && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <MiniStatCard label="Total Due" value={`₹${totalDue.toLocaleString('en-IN')}`} icon={<AlertTriangle size={18} />} iconBg="#FEF2F2" iconColor="#DC2626" valueColor="#DC2626" />
                            <MiniStatCard label="Total Collected" value={`₹${totalPaid.toLocaleString('en-IN')}`} icon={<TrendingUp size={18} />} iconBg="#ECFDF5" iconColor="#059669" valueColor="#059669" />
                            <MiniStatCard label="Overdue" value={overdueCount} icon={<Clock size={18} />} iconBg="#FFF7ED" iconColor="#EA580C" valueColor="#EA580C" />
                            <MiniStatCard label="Partial Paid" value={partialCount} icon={<IndianRupee size={18} />} iconBg="#EFF6FF" iconColor="#2563EB" />
                        </div>
                    )}

                    {/* Filters */}
                    <div className="portal-card">
                        <div className="p-4">
                            <div className="flex flex-wrap gap-3">
                                <div className="flex-1 min-w-[200px] relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
                                    <input
                                        className="w-full h-9 pl-8 pr-3 text-sm rounded-lg outline-none transition-all"
                                        style={{ border: '1.5px solid #E2E8F0', color: '#0F172A', backgroundColor: '#FFFFFF' }}
                                        placeholder="Search student name, admission no..."
                                        value={filterSearch}
                                        onChange={e => setFilterSearch(e.target.value)}
                                        onFocus={e => { e.target.style.borderColor = '#2563EB' }}
                                        onBlur={e => { e.target.style.borderColor = '#E2E8F0' }}
                                    />
                                </div>
                                <select
                                    className="h-9 px-3 text-sm rounded-lg outline-none cursor-pointer"
                                    style={{ border: '1.5px solid #E2E8F0', color: '#0F172A', minWidth: '120px' }}
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
                                    className="h-9 px-3 text-sm rounded-lg outline-none cursor-pointer"
                                    style={{ border: '1.5px solid #E2E8F0', color: '#0F172A', minWidth: '120px' }}
                                    value={filterClass}
                                    onChange={e => setFilterClass(e.target.value)}
                                >
                                    <option value="">All Classes</option>
                                    {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Fees Table */}
                    <div className="portal-card overflow-hidden">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <Spinner size="lg" />
                                <p className="text-sm" style={{ color: '#94A3B8' }}>Loading fees...</p>
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
                                    <button onClick={() => setTab('structures')} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold" style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}>
                                        <Plus size={14} /> Create Fee Structure
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
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
                                            const isOverdue = ['pending', 'partial'].includes(f.status) && new Date(f.dueDate) < new Date()
                                            const daysOverdue = isOverdue ? Math.floor((Date.now() - new Date(f.dueDate).getTime()) / 86400000) : 0

                                            return (
                                                <tr key={f._id} className="group">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}>
                                                                {student?.userId?.name?.charAt(0) ?? '?'}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>{student?.userId?.name ?? 'N/A'}</p>
                                                                <p className="text-[0.6875rem] font-mono" style={{ color: '#94A3B8' }}>{student?.admissionNo} · Class {student?.class}-{student?.section}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-sm font-medium" style={{ color: '#475569' }}>{structure?.name ?? '—'}</p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-sm font-bold tabular-nums" style={{ color: '#0F172A' }}>₹{f.finalAmount.toLocaleString('en-IN')}</p>
                                                        {f.discount > 0 && <p className="text-[0.6875rem]" style={{ color: '#059669' }}>Discount: ₹{f.discount}</p>}
                                                        {f.lateFine > 0 && <p className="text-[0.6875rem]" style={{ color: '#DC2626' }}>Fine: +₹{f.lateFine}</p>}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-sm font-bold tabular-nums" style={{ color: f.paidAmount > 0 ? '#059669' : '#94A3B8' }}>₹{f.paidAmount.toLocaleString('en-IN')}</p>
                                                        {remaining > 0 && f.status !== 'waived' && (
                                                            <p className="text-[0.6875rem]" style={{ color: '#DC2626' }}>Due: ₹{remaining.toLocaleString('en-IN')}</p>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-sm" style={{ color: '#475569' }}>
                                                            {new Date(f.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                                                        </p>
                                                        {isOverdue && <p className="text-[0.6875rem] font-semibold" style={{ color: '#DC2626' }}>{daysOverdue}d overdue</p>}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <FeeBadge status={f.status} dueDate={f.dueDate} />
                                                        {f.paidAt && (
                                                            <p className="text-[0.625rem] mt-0.5" style={{ color: '#94A3B8' }}>
                                                                Paid: {new Date(f.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-1 justify-end">
                                                            {/* Record Payment — show for pending and partial */}
                                                            {['pending', 'partial'].includes(f.status) && (
                                                                <button
                                                                    onClick={() => { setSelectedFee(f); setShowPayModal(true) }}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                                                    style={{ backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}
                                                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#059669'; e.currentTarget.style.color = '#FFFFFF' }}
                                                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#ECFDF5'; e.currentTarget.style.color = '#059669' }}
                                                                >
                                                                    <CheckSquare size={11} />
                                                                    {f.status === 'partial' ? 'Pay More' : 'Record Payment'}
                                                                </button>
                                                            )}
                                                            {/* View Receipt */}
                                                            {(f.status === 'paid' || f.status === 'partial') && (
                                                                <button
                                                                    onClick={() => viewReceipt(f._id)}
                                                                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                                                    style={{ color: '#94A3B8' }}
                                                                    title="View Receipt"
                                                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#EFF6FF'; e.currentTarget.style.color = '#2563EB' }}
                                                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94A3B8' }}
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
            {/* ═══════════════════════════════════════════
                TAB: FEE STRUCTURES
               ═══════════════════════════════════════════ */}
            {tab === 'structures' && (
                <div className="space-y-4">
                    {/* Structure Filters */}
                    <div className="portal-card">
                        <div className="p-4 flex flex-wrap gap-3">
                            <select
                                className="h-9 px-3 text-sm rounded-lg outline-none cursor-pointer"
                                style={{
                                    border: '1.5px solid #E2E8F0',
                                    color: '#0F172A',
                                    minWidth: '140px',
                                }}
                                value={structureClass}
                                onChange={e => setStructureClass(e.target.value)}
                            >
                                <option value="">All Classes</option>
                                <option value="all">Global (All Classes)</option>
                                {CLASSES.map(c => (
                                    <option key={c} value={c}>Class {c}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => fetchStructures()}
                                className="h-9 w-9 rounded-lg border flex items-center justify-center transition-colors"
                                style={{ border: '1.5px solid #E2E8F0', color: '#94A3B8' }}
                            >
                                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>

                    {/* Structures Table */}
                    <div className="portal-card overflow-hidden">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <Spinner size="lg" />
                                <p className="text-sm" style={{ color: '#94A3B8' }}>
                                    Loading structures...
                                </p>
                            </div>
                        ) : structures.length === 0 ? (
                            <div className="portal-empty py-20">
                                <div className="portal-empty-icon">
                                    <BarChart2 size={24} />
                                </div>
                                <p className="portal-empty-title">No fee structures</p>
                                <p className="portal-empty-text">
                                    Fee structure banao — class-wise fees define karein
                                </p>
                                <button
                                    onClick={() => {
                                        setEditStructure(null)
                                        setShowStructureModal(true)
                                    }}
                                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
                                    style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
                                >
                                    <Plus size={14} /> Create First Structure
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="portal-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Class</th>
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
                                            <tr key={s._id} className="group">
                                                <td className="px-4 py-3">
                                                    <p
                                                        className="text-sm font-semibold"
                                                        style={{ color: '#0F172A' }}
                                                    >
                                                        {s.name}
                                                    </p>
                                                    <p
                                                        className="text-[0.6875rem]"
                                                        style={{ color: '#94A3B8' }}
                                                    >
                                                        {s.academicYear}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col gap-1">
                                                        <span
                                                            className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold w-fit"
                                                            style={{
                                                                backgroundColor: '#EEF2FF',
                                                                color: '#4F46E5',
                                                            }}
                                                        >
                                                            {s.class === 'all'
                                                                ? 'All Classes'
                                                                : `Class ${s.class}`}
                                                            {s.section && s.section !== 'all'
                                                                ? `-${s.section}`
                                                                : ''}
                                                        </span>
                                                        {s.stream && (
                                                            <StreamBadge stream={s.stream} />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className="text-xs font-medium px-2 py-1 rounded-lg"
                                                        style={{
                                                            backgroundColor: '#F8FAFC',
                                                            color: '#475569',
                                                        }}
                                                    >
                                                        {s.term}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p
                                                        className="text-sm font-bold tabular-nums"
                                                        style={{ color: '#0F172A' }}
                                                    >
                                                        ₹{s.totalAmount.toLocaleString('en-IN')}
                                                    </p>
                                                    {s.lateFinePerDay > 0 && (
                                                        <p
                                                            className="text-[0.625rem]"
                                                            style={{ color: '#D97706' }}
                                                        >
                                                            +₹{s.lateFinePerDay}/
                                                            {s.lateFineType === 'percent' ? '%' : 'day'} late
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p
                                                        className="text-sm"
                                                        style={{ color: '#475569' }}
                                                    >
                                                        {new Date(s.dueDate).toLocaleDateString(
                                                            'en-IN',
                                                            {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: '2-digit',
                                                            }
                                                        )}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                                                        style={{
                                                            backgroundColor:
                                                                s.assignedCount > 0 ? '#ECFDF5' : '#F8FAFC',
                                                            color:
                                                                s.assignedCount > 0 ? '#059669' : '#94A3B8',
                                                        }}
                                                    >
                                                        <Users size={10} />
                                                        {s.assignedCount} students
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6875rem] font-semibold"
                                                        style={{
                                                            backgroundColor: s.isActive
                                                                ? '#ECFDF5'
                                                                : '#F1F5F9',
                                                            color: s.isActive ? '#059669' : '#64748B',
                                                        }}
                                                    >
                                                        <span
                                                            className="w-1.5 h-1.5 rounded-full"
                                                            style={{
                                                                backgroundColor: s.isActive
                                                                    ? '#059669'
                                                                    : '#94A3B8',
                                                            }}
                                                        />
                                                        {s.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1 justify-end">
                                                        {/* Edit */}
                                                        <button
                                                            onClick={() => {
                                                                setEditStructure(s)
                                                                setShowStructureModal(true)
                                                            }}
                                                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                                            style={{ color: '#94A3B8' }}
                                                            title="Edit Structure"
                                                            onMouseEnter={e => {
                                                                e.currentTarget.style.backgroundColor = '#EFF6FF'
                                                                e.currentTarget.style.color = '#2563EB'
                                                            }}
                                                            onMouseLeave={e => {
                                                                e.currentTarget.style.backgroundColor = 'transparent'
                                                                e.currentTarget.style.color = '#94A3B8'
                                                            }}
                                                        >
                                                            <Edit2 size={13} />
                                                        </button>

                                                        {/* Assign to All */}
                                                        <button
                                                            onClick={() => assignToAll(s._id, s.name)}
                                                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                                            style={{ color: '#94A3B8' }}
                                                            title="Assign to all students in class"
                                                            onMouseEnter={e => {
                                                                e.currentTarget.style.backgroundColor = '#ECFDF5'
                                                                e.currentTarget.style.color = '#059669'
                                                            }}
                                                            onMouseLeave={e => {
                                                                e.currentTarget.style.backgroundColor = 'transparent'
                                                                e.currentTarget.style.color = '#94A3B8'
                                                            }}
                                                        >
                                                            <Users size={13} />
                                                        </button>

                                                        {/* Apply Late Fine */}
                                                        {s.lateFinePerDay > 0 && (
                                                            <button
                                                                onClick={() =>
                                                                    applyLateFine(s._id, s.name)
                                                                }
                                                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                                                style={{ color: '#94A3B8' }}
                                                                title="Apply late fine"
                                                                onMouseEnter={e => {
                                                                    e.currentTarget.style.backgroundColor = '#FFFBEB'
                                                                    e.currentTarget.style.color = '#D97706'
                                                                }}
                                                                onMouseLeave={e => {
                                                                    e.currentTarget.style.backgroundColor = 'transparent'
                                                                    e.currentTarget.style.color = '#94A3B8'
                                                                }}
                                                            >
                                                                <Clock size={13} />
                                                            </button>
                                                        )}

                                                        {/* Optional fees hain toh yeh button show karo */}
                                                        {s.items.some((i: any) => i.isOptional) && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedStructure(s)
                                                                    setShowOptionalModal(true)
                                                                }}
                                                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                                                style={{ color: '#94A3B8' }}
                                                                title="Assign optional fees"
                                                                onMouseEnter={e => {
                                                                    e.currentTarget.style.backgroundColor = '#FFFBEB'
                                                                    e.currentTarget.style.color = '#D97706'
                                                                }}
                                                                onMouseLeave={e => {
                                                                    e.currentTarget.style.backgroundColor = 'transparent'
                                                                    e.currentTarget.style.color = '#94A3B8'
                                                                }}
                                                            >
                                                                <Sparkles size={13} />
                                                            </button>
                                                        )}

                                                        {/* Deactivate */}
                                                        <button
                                                            onClick={() => deleteStructure(s._id)}
                                                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                                            style={{ color: '#94A3B8' }}
                                                            title="Deactivate"
                                                            onMouseEnter={e => {
                                                                e.currentTarget.style.backgroundColor = '#FEF2F2'
                                                                e.currentTarget.style.color = '#DC2626'
                                                            }}
                                                            onMouseLeave={e => {
                                                                e.currentTarget.style.backgroundColor = 'transparent'
                                                                e.currentTarget.style.color = '#94A3B8'
                                                            }}
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
                    onClose={() => { setShowStructureModal(false); setEditStructure(null) }}
                    onSuccess={msg => { setShowStructureModal(false); setEditStructure(null); fetchStructures(); showSuccess(msg) }}
                />

                {selectedFee && (
                    <RecordPaymentModal
                        open={showPayModal}
                        fee={selectedFee}
                        onlinePayEnabled={onlinePayEnabled}
                        onClose={() => { setShowPayModal(false); setSelectedFee(null) }}
                        onPaid={recordPayment}
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
                        onSuccess={msg => { setShowOptionalModal(false); setSelectedStructure(null); showSuccess(msg) }}
                    />
                )}
            </Portal>
        </div>
    )
}


/* ════════════════════════════════════════════
   RECORD PAYMENT MODAL 
   - Partial payment support
   - Payment mode selection
   - Online Razorpay option (if enabled)
   - Notes field
   - Print receipt after payment ✨ NEW
   ════════════════════════════════════════════ */
function RecordPaymentModal({
    open, fee, onlinePayEnabled, onClose, onPaid,
}: {
    open: boolean
    fee: Fee
    onlinePayEnabled: boolean
    onClose: () => void
    onPaid: (feeId: string, mode: string, amount: number, notes?: string) => void
}) {
    const remaining = fee.finalAmount - fee.paidAmount
    const [mode, setMode] = useState('cash')
    const [payType, setPayType] = useState<'full' | 'partial'>('full')
    const [partialAmount, setPartialAmount] = useState('')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [paymentSuccess, setPaymentSuccess] = useState<{
        amount: number
        mode: string
        receiptNumber: string
        paidAt: string
    } | null>(null)
    const [successPaperSize, setSuccessPaperSize] = useState<'A4' | 'A5'>('A4')

    const MODES = [
        { value: 'cash', label: 'Cash', icon: '💵', color: '#059669', bg: '#ECFDF5' },
        { value: 'cheque', label: 'Cheque', icon: '📝', color: '#7C3AED', bg: '#F5F3FF' },
        { value: 'dd', label: 'DD', icon: '🏛️', color: '#D97706', bg: '#FFFBEB' },
    ]

    // Add online option only if enabled
    if (onlinePayEnabled) {
        MODES.unshift({ value: 'online', label: 'Online (Razorpay)', icon: '💳', color: '#2563EB', bg: '#EFF6FF' })
    }

    const effectiveAmount = payType === 'full' ? remaining : Math.min(Number(partialAmount) || 0, remaining)

    // ─── Print individual receipt from success screen ───
        // ─── Print individual receipt from success screen ───
    const handlePrintSuccessReceipt = () => {
        if (!paymentSuccess) return

        const school = (fee as any).school || {}
        const student = fee.studentId || {} as any
        const isA5 = successPaperSize === 'A5'
        const newRemaining = remaining - paymentSuccess.amount
        const totalPaidSoFar = fee.paidAmount + paymentSuccess.amount
        const status = newRemaining <= 0 ? 'paid' : 'partial'

        printSingleReceipt({
            school,
            student: {
                name: student?.userId?.name || 'N/A',
                admissionNo: student?.admissionNo || 'N/A',
                class: student?.class || 'N/A',
                section: student?.section || '',
                fatherName: (student as any)?.fatherName || '',
            },
            payment: {
                receiptNumber: paymentSuccess.receiptNumber,
                amount: paymentSuccess.amount,
                mode: paymentSuccess.mode,
                paidAt: paymentSuccess.paidAt,
            },
            fee: {
                totalAmount: fee.finalAmount,
                totalPaidSoFar: totalPaidSoFar,
                remaining: Math.max(0, newRemaining),
                status: status,
                feeType: (fee as any).feeType || 'Tuition Fee',
            },
            academicYear: (fee as any).academicYear || '',
            paperSize: successPaperSize,
        })
    }

    const handleSubmit = async () => {
        if (effectiveAmount <= 0) return
        setLoading(true)

        if (mode === 'online') {
            // Trigger Razorpay payment flow
            try {
                const res = await fetch('/api/fees/pay', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ feeId: fee._id, amount: effectiveAmount }),
                })
                const data = await res.json()
                if (!res.ok) {
                    alert(data.error || 'Failed to create payment order')
                    setLoading(false)
                    return
                }

                // Open Razorpay checkout
                const options = {
                    key: data.keyId,
                    amount: data.amount,
                    currency: data.currency,
                    name: 'Fee Payment',
                    order_id: data.orderId,
                    handler: function () {
                        // Payment success — webhook will handle the rest
                        alert('Payment successful! Receipt will be generated automatically.')
                        onClose()
                        window.location.reload()
                    },
                    modal: {
                        ondismiss: function () {
                            setLoading(false)
                        }
                    },
                    theme: { color: '#2563EB' },
                }

                const rzpWindow = window as any
                if (rzpWindow.Razorpay) {
                    const rzp = new rzpWindow.Razorpay(options)
                    rzp.open()
                } else {
                    // Load Razorpay script
                    const script = document.createElement('script')
                    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
                    script.onload = () => {
                        const rzp2 = new rzpWindow.Razorpay(options)
                        rzp2.open()
                    }
                    document.body.appendChild(script)
                }
            } catch {
                alert('Failed to initiate online payment')
                setLoading(false)
            }
        } else {
            // Offline payment — record directly
            await onPaid(fee._id, mode, effectiveAmount, notes)

            // Show success screen with print option
            const now = new Date().toISOString()
            const receiptNum = `RCP-${Date.now().toString(36).toUpperCase()}`
            setPaymentSuccess({
                amount: effectiveAmount,
                mode: mode,
                receiptNumber: receiptNum,
                paidAt: now,
            })
            setLoading(false)
        }
    }

    // Reset state when modal closes
    const handleClose = () => {
        setPaymentSuccess(null)
        setPayType('full')
        setPartialAmount('')
        setNotes('')
        setMode('cash')
        onClose()
    }

    if (!open) return null

    // ─── SUCCESS SCREEN (after payment) ───
    if (paymentSuccess) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md" style={{ border: '1px solid #E2E8F0' }}>
                    {/* Success Header */}
                    <div className="text-center pt-8 pb-4 px-5">
                        {/* Animated Checkmark */}
                        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #059669, #10B981)', boxShadow: '0 8px 24px rgba(5, 150, 105, 0.3)' }}>
                            <CheckSquare size={28} style={{ color: '#FFFFFF' }} />
                        </div>
                        <h3 className="text-xl font-extrabold" style={{ color: '#059669' }}>Payment Successful!</h3>
                        <p className="text-sm mt-1" style={{ color: '#64748B' }}>
                            ₹{paymentSuccess.amount.toLocaleString('en-IN')} received via {paymentSuccess.mode}
                        </p>
                    </div>

                    {/* Receipt Summary Card */}
                    <div className="mx-5 mb-4 rounded-xl overflow-hidden" style={{ border: '1.5px solid #E2E8F0' }}>
                        <div className="px-4 py-2.5" style={{ background: 'linear-gradient(135deg, #F0F9FF, #E0F2FE)', borderBottom: '1px solid #BAE6FD' }}>
                            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#0369A1' }}>Receipt Summary</span>
                        </div>
                        <div className="px-4 py-3 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span style={{ color: '#64748B' }}>Receipt No.</span>
                                <span className="font-bold font-mono" style={{ color: '#0F172A' }}>{paymentSuccess.receiptNumber}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span style={{ color: '#64748B' }}>Student</span>
                                <span className="font-semibold" style={{ color: '#0F172A' }}>{(fee.studentId as any)?.userId?.name || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span style={{ color: '#64748B' }}>Date</span>
                                <span className="font-semibold" style={{ color: '#0F172A' }}>
                                    {new Date(paymentSuccess.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pt-2" style={{ borderTop: '1px dashed #E2E8F0' }}>
                                <span className="text-sm font-semibold" style={{ color: '#059669' }}>Amount Paid</span>
                                <span className="text-xl font-black font-mono" style={{ color: '#059669' }}>₹{paymentSuccess.amount.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Paper Size + Print */}
                    <div className="mx-5 mb-4">
                        <p className="text-[10px] font-semibold mb-2 uppercase tracking-wider" style={{ color: '#94A3B8' }}>Print Receipt</p>
                        <div className="flex gap-2">
                            {/* Paper Size Toggle */}
                            <div className="flex items-center rounded-lg overflow-hidden flex-shrink-0" style={{ border: '1px solid #E2E8F0' }}>
                                <button
                                    onClick={() => setSuccessPaperSize('A4')}
                                    className="px-3 py-2 text-xs font-bold transition-colors"
                                    style={{
                                        backgroundColor: successPaperSize === 'A4' ? '#2563EB' : '#F8FAFC',
                                        color: successPaperSize === 'A4' ? '#FFFFFF' : '#64748B',
                                    }}
                                >
                                    A4
                                </button>
                                <button
                                    onClick={() => setSuccessPaperSize('A5')}
                                    className="px-3 py-2 text-xs font-bold transition-colors"
                                    style={{
                                        backgroundColor: successPaperSize === 'A5' ? '#2563EB' : '#F8FAFC',
                                        color: successPaperSize === 'A5' ? '#FFFFFF' : '#64748B',
                                        borderLeft: '1px solid #E2E8F0',
                                    }}
                                >
                                    A5
                                </button>
                            </div>
                            <button
                                onClick={handlePrintSuccessReceipt}
                                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                                style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
                            >
                                <Printer size={14} />
                                Print Receipt ({successPaperSize})
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-4 flex gap-2" style={{ borderTop: '1px solid #F1F5F9' }}>
                        <button
                            onClick={handleClose}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                            style={{ backgroundColor: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0' }}
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // ─── NORMAL PAYMENT FORM ───
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md" style={{ border: '1px solid #E2E8F0' }}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#ECFDF5' }}>
                            <IndianRupee size={16} style={{ color: '#059669' }} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold" style={{ color: '#0F172A' }}>Record Payment</h3>
                            <p className="text-xs" style={{ color: '#94A3B8' }}>{fee.studentId?.userId?.name}</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: '#94A3B8', backgroundColor: '#F8FAFC' }}>
                        <X size={14} />
                    </button>
                </div>

                <div className="px-5 py-4 space-y-4">
                    {/* Fee Summary */}
                    <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #F8FAFC, #F1F5F9)', border: '1px solid #E2E8F0' }}>
                        <div className="flex justify-between mb-2">
                            <span className="text-xs" style={{ color: '#64748B' }}>Total Fee</span>
                            <span className="text-sm font-bold" style={{ color: '#0F172A' }}>₹{fee.finalAmount.toLocaleString('en-IN')}</span>
                        </div>
                        {fee.paidAmount > 0 && (
                            <div className="flex justify-between mb-2">
                                <span className="text-xs" style={{ color: '#059669' }}>Already Paid</span>
                                <span className="text-sm font-bold" style={{ color: '#059669' }}>₹{fee.paidAmount.toLocaleString('en-IN')}</span>
                            </div>
                        )}
                        <div className="flex justify-between pt-2" style={{ borderTop: '1px dashed #CBD5E1' }}>
                            <span className="text-xs font-semibold" style={{ color: '#DC2626' }}>Remaining</span>
                            <span className="text-lg font-extrabold tabular-nums" style={{ color: '#DC2626' }}>₹{remaining.toLocaleString('en-IN')}</span>
                        </div>
                    </div>

                    {/* Payment Type: Full or Partial */}
                    <div>
                        <p className="text-xs font-semibold mb-2" style={{ color: '#475569' }}>Payment Type</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setPayType('full')}
                                className="px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-center"
                                style={{
                                    border: `2px solid ${payType === 'full' ? '#059669' : '#E2E8F0'}`,
                                    backgroundColor: payType === 'full' ? '#ECFDF5' : '#FFFFFF',
                                    color: payType === 'full' ? '#059669' : '#64748B',
                                }}
                            >
                                Full Payment
                                <br />
                                <span className="text-xs font-normal">₹{remaining.toLocaleString('en-IN')}</span>
                            </button>
                            <button
                                onClick={() => setPayType('partial')}
                                className="px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-center"
                                style={{
                                    border: `2px solid ${payType === 'partial' ? '#D97706' : '#E2E8F0'}`,
                                    backgroundColor: payType === 'partial' ? '#FFFBEB' : '#FFFFFF',
                                    color: payType === 'partial' ? '#D97706' : '#64748B',
                                }}
                            >
                                Partial Payment
                                <br />
                                <span className="text-xs font-normal">Custom amount</span>
                            </button>
                        </div>
                    </div>

                    {/* Partial Amount Input */}
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

                    {/* Payment Mode */}
                    <div>
                        <p className="text-xs font-semibold mb-2" style={{ color: '#475569' }}>Payment Mode</p>
                        <div className="grid grid-cols-2 gap-2">
                            {MODES.map(m => (
                                <button
                                    key={m.value}
                                    onClick={() => setMode(m.value)}
                                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
                                    style={{
                                        border: `2px solid ${mode === m.value ? m.color : '#E2E8F0'}`,
                                        backgroundColor: mode === m.value ? m.bg : '#FFFFFF',
                                        color: mode === m.value ? m.color : '#64748B',
                                    }}
                                >
                                    <span>{m.icon}</span>
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    {mode !== 'online' && (
                        <FormInput
                            label="Notes (optional)"
                            value={notes}
                            onChange={setNotes}
                            placeholder="e.g. Cheque no, reference..."
                        />
                    )}

                    {/* Amount being paid */}
                    {effectiveAmount > 0 && (
                        <div className="rounded-xl p-3 text-center" style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                            <p className="text-xs" style={{ color: '#059669' }}>You are paying</p>
                            <p className="text-2xl font-extrabold tabular-nums" style={{ color: '#047857' }}>₹{effectiveAmount.toLocaleString('en-IN')}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 flex gap-2" style={{ borderTop: '1px solid #F1F5F9' }}>
                    <button onClick={handleClose} className="flex-1 py-2 rounded-xl text-sm font-medium" style={{ backgroundColor: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0' }}>
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || effectiveAmount <= 0}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
                        style={{ backgroundColor: mode === 'online' ? '#2563EB' : '#059669', color: '#FFFFFF' }}
                    >
                        {loading ? <Spinner size="sm" /> : <CheckSquare size={14} />}
                        {loading ? 'Processing...' : mode === 'online' ? 'Pay Online' : 'Confirm Payment'}
                    </button>
                </div>
            </div>
        </div>
    )
}


/* ════════════════════════════════════════════
   SHARED PRINT FUNCTION — Single Receipt
   Used by both ReceiptModal & RecordPaymentModal
   ════════════════════════════════════════════ */
function printSingleReceipt({
    school,
    student,
    payment,
    fee,
    academicYear,
    paperSize,
    allPayments,
    feeBreakdown,
}: {
    school: any
    student: { name: string; admissionNo: string; class: string; section: string; fatherName?: string }
    payment: { receiptNumber: string; amount: number; mode: string; paidAt: string }
    fee: { totalAmount: number; totalPaidSoFar?: number; remaining?: number; status: string; feeType?: string; discount?: number }
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
            background: linear-gradient(90deg, #1D4ED8, #3B82F6, #60A5FA, #3B82F6, #1D4ED8);
            border-radius: 2px 2px 0 0;
            margin-bottom: ${isA5 ? '12px' : '20px'};
          }

          .school-header {
            text-align: center;
            padding-bottom: ${isA5 ? '10px' : '16px'};
            border-bottom: 2px solid #1D4ED8;
            margin-bottom: ${isA5 ? '10px' : '16px'};
          }

          .school-logo-circle {
            width: ${isA5 ? '44px' : '56px'};
            height: ${isA5 ? '44px' : '56px'};
            border-radius: 50%;
            background: linear-gradient(135deg, #1D4ED8, #3B82F6);
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
            background: linear-gradient(135deg, #1D4ED8, #2563EB);
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

          .receipt-meta .meta-group { text-align: left; }
          .receipt-meta .meta-group:last-child { text-align: right; }

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
            background: linear-gradient(135deg, #F0F9FF, #E0F2FE);
            padding: ${isA5 ? '6px 10px' : '8px 14px'};
            border-bottom: 1px solid #BAE6FD;
          }

          .student-info-header span {
            font-size: ${isA5 ? '8px' : '10px'};
            font-weight: 700;
            color: #0369A1;
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

          .student-info-cell:nth-child(even) { border-right: none; }
          .student-info-cell:nth-last-child(-n+2) { border-bottom: none; }

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
            background: linear-gradient(135deg, #1E293B, #334155);
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

          .fee-table tbody tr:last-child td { border-bottom: none; }
          .fee-table tbody tr:nth-child(even) { background: #FAFBFC; }

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

          .summary-row:last-child { border-bottom: none; }
          .summary-row .sr-label { font-size: ${isA5 ? '10px' : '12px'}; color: #475569; font-weight: 500; }
          .summary-row .sr-value { font-size: ${isA5 ? '10px' : '12px'}; font-weight: 700; color: #1E293B; font-family: 'Courier New', monospace; }

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

          .status-paid { background: #DCFCE7; color: #166534; border: 1px solid #BBF7D0; }
          .status-partial { background: #FEF9C3; color: #854D0E; border: 1px solid #FDE68A; }
          .status-unpaid { background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA; }
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

          .history-table { width: 100%; border-collapse: collapse; border: 1px solid #E2E8F0; border-radius: 6px; overflow: hidden; }

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

          /* Highlight current receipt row */
          .history-table tr.current-receipt {
            background: #ECFDF5;
          }

          .history-table tr.current-receipt td {
            font-weight: 700;
            color: #059669;
          }

          .signature-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: ${isA5 ? '20px' : '36px'};
            padding-top: ${isA5 ? '10px' : '16px'};
          }

          .signature-box { text-align: center; width: 40%; }
          .signature-line { border-top: 1.5px solid #94A3B8; margin-bottom: 4px; }
          .signature-label { font-size: ${isA5 ? '8px' : '10px'}; color: #64748B; font-weight: 600; }

          .seal-area {
            width: ${isA5 ? '50px' : '70px'};
            height: ${isA5 ? '50px' : '70px'};
            border: 2px dashed #CBD5E1;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .seal-area span { font-size: ${isA5 ? '7px' : '8px'}; color: #CBD5E1; text-transform: uppercase; font-weight: 600; }

          .receipt-footer {
            margin-top: ${isA5 ? '12px' : '20px'};
            padding-top: ${isA5 ? '8px' : '12px'};
            border-top: 1.5px solid #E2E8F0;
            text-align: center;
          }

          .footer-note { font-size: ${isA5 ? '7px' : '9px'}; color: #94A3B8; line-height: 1.6; }
          .footer-note strong { color: #64748B; }

          .receipt-bottom-bar {
            height: 4px;
            background: linear-gradient(90deg, #1D4ED8, #3B82F6, #60A5FA, #3B82F6, #1D4ED8);
            border-radius: 0 0 2px 2px;
            margin-top: ${isA5 ? '12px' : '20px'};
          }

          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: ${isA5 ? '60px' : '80px'};
            font-weight: 900;
            color: rgba(0, 0, 0, 0.03);
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
            ${school.address ? `<div class="school-address">${school.address}</div>` : ''}
            ${school.phone || school.email ? `<div class="school-contact">${school.phone ? 'Ph: ' + school.phone : ''}${school.phone && school.email ? ' | ' : ''}${school.email ? 'Email: ' + school.email : ''}</div>` : ''}
            <div class="receipt-title-badge">Fee Receipt</div>
          </div>

          <!-- Receipt Meta -->
          <div class="receipt-meta">
            <div class="meta-group">
              <div class="meta-label">Receipt No.</div>
              <div class="meta-value">${payment.receiptNumber || 'N/A'}</div>
            </div>
            <div class="meta-group">
              <div class="meta-label">Academic Year</div>
              <div class="meta-value">${academicYear || school.academicYear || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1).toString().slice(-2)}</div>
            </div>
            <div class="meta-group" style="text-align: right;">
              <div class="meta-label">Date</div>
              <div class="meta-value">${payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</div>
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
                <div class="cell-value" style="font-family: 'Courier New', monospace;">${student.admissionNo || 'N/A'}</div>
              </div>
              <div class="student-info-cell">
                <div class="cell-label">Class & Section</div>
                <div class="cell-value">${student.class || 'N/A'}${student.section ? ' - ' + student.section : ''}</div>
              </div>
              <div class="student-info-cell">
                <div class="cell-label">Payment Mode</div>
                <div class="cell-value" style="text-transform: capitalize;">${payment.mode || 'N/A'}</div>
              </div>
              ${student.fatherName ? `
              <div class="student-info-cell" style="grid-column: span 2; border-bottom: none;">
                <div class="cell-label">Father's Name</div>
                <div class="cell-value">${student.fatherName}</div>
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Fee Table -->
          <div class="fee-table-wrapper">
            <table class="fee-table">
              <thead>
                <tr>
                  <th style="width: 40px;">#</th>
                  <th>Description</th>
                  <th style="text-align: right;">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${feeBreakdown && feeBreakdown.length > 0
            ? feeBreakdown.map((item: any, i: number) => `
                    <tr>
                      <td>${i + 1}</td>
                      <td>${item.name || item.description || 'Fee'}</td>
                      <td>₹${(item.amount || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  `).join('')
            : `
                    <tr>
                      <td>1</td>
                      <td>${fee.feeType || 'Tuition Fee'}</td>
                      <td>₹${(fee.totalAmount || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  `
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
            ${fee.discount ? `
            <div class="summary-row">
              <span class="sr-label">Discount</span>
              <span class="sr-value" style="color: #2563EB;">- ₹${(fee.discount || 0).toLocaleString('en-IN')}</span>
            </div>
            ` : ''}
            ${fee.totalPaidSoFar ? `
            <div class="summary-row">
              <span class="sr-label">Total Paid So Far</span>
              <span class="sr-value">₹${(fee.totalPaidSoFar || 0).toLocaleString('en-IN')}</span>
            </div>
            ` : ''}
            <div class="summary-row total-row">
              <span class="sr-label">💰 Amount Paid (This Receipt)</span>
              <span class="sr-value">₹${(payment.amount || 0).toLocaleString('en-IN')}</span>
            </div>
            ${(fee.remaining || 0) > 0 ? `
            <div class="summary-row remaining-row">
              <span class="sr-label">Balance Remaining</span>
              <span class="sr-value">₹${(fee.remaining || 0).toLocaleString('en-IN')}</span>
            </div>
            ` : ''}
          </div>

          <!-- Amount in Words -->
          <div class="amount-words">
            <strong>Amount in words:</strong> ${numberToWords(payment.amount || 0)} Rupees Only
          </div>

          <!-- Status Badge -->
          <div style="text-align: center; margin-bottom: ${isA5 ? '10px' : '14px'};">
            <span class="status-badge status-${statusClass}">
              ${(fee.status || 'paid').toUpperCase()}
            </span>
          </div>

          <!-- Payment History -->
          ${allPayments && allPayments.length > 1 ? `
          <div class="payment-history">
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
                    <td style="font-family: 'Courier New', monospace;">${p.receiptNumber || '-'}${p.receiptNumber === payment.receiptNumber ? ' ◄' : ''}</td>
                    <td>${new Date(p.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td style="text-transform: capitalize;">${p.mode || p.paymentMode || '-'}</td>
                    <td>₹${(p.amount || 0).toLocaleString('en-IN')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

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
              <strong>Note:</strong> This is a computer-generated receipt and does not require a physical signature.<br/>
              Fee once paid is non-refundable. Please retain this receipt for future reference.<br/>
              <span style="color: #CBD5E1;">Printed on: ${new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</span>
            </div>
          </div>

          <div class="receipt-bottom-bar"></div>
        </div>
      </body>
    </html>
  `)
    printWindow.document.close()
    setTimeout(() => {
        printWindow.print()
    }, 300)
}


/* ════════════════════════════════════════════
   RECEIPT MODAL — View & Print Receipt
   Now with per-payment print buttons ✨
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

    // Support both direct receipt data and API receipt data
    const school = data.school || {}
    const student = data.student || data
    const feeInfo = data.fee || data
    const payment = data.payment || data

    // ─── Build common params for printing ───
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

    // Print current/main receipt
    const handlePrint = () => {
        printSingleReceipt(buildPrintParams(payment))
    }

    // Print a specific payment from history
    const handlePrintSpecificPayment = (paymentItem: any) => {
        // Calculate cumulative paid up to this payment
        const allPayments = data.allPayments || []
        const paymentIndex = allPayments.findIndex((p: any) => p.receiptNumber === paymentItem.receiptNumber)
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
                totalAmount: totalAmount,
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" style={{ border: '1px solid #E2E8F0' }}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EFF6FF' }}>
                            <Receipt size={16} style={{ color: '#2563EB' }} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold" style={{ color: '#0F172A' }}>Fee Receipt</h3>
                            <p className="text-xs" style={{ color: '#94A3B8' }}>{payment.receiptNumber || 'N/A'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Paper Size Toggle */}
                        <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid #E2E8F0' }}>
                            <button
                                onClick={() => setPaperSize('A4')}
                                className="px-2.5 py-1.5 text-[10px] font-bold transition-colors"
                                style={{
                                    backgroundColor: paperSize === 'A4' ? '#2563EB' : '#F8FAFC',
                                    color: paperSize === 'A4' ? '#FFFFFF' : '#64748B',
                                }}
                            >
                                A4
                            </button>
                            <button
                                onClick={() => setPaperSize('A5')}
                                className="px-2.5 py-1.5 text-[10px] font-bold transition-colors"
                                style={{
                                    backgroundColor: paperSize === 'A5' ? '#2563EB' : '#F8FAFC',
                                    color: paperSize === 'A5' ? '#FFFFFF' : '#64748B',
                                    borderLeft: '1px solid #E2E8F0',
                                }}
                            >
                                A5
                            </button>
                        </div>
                        <button
                            onClick={handlePrint}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                            style={{ color: '#2563EB', backgroundColor: '#EFF6FF' }}
                            title="Print Receipt"
                        >
                            <Printer size={14} />
                        </button>
                        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: '#94A3B8', backgroundColor: '#F8FAFC' }}>
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {/* Receipt Content */}
                <div className="flex-1 overflow-y-auto px-5 py-4" id="receipt-content">
                    {/* School Header */}
                    <div className="text-center mb-4 pb-4" style={{ borderBottom: '2px solid #1D4ED8' }}>
                        <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)' }}>
                            <span className="text-white font-extrabold text-base">
                                {(school.name || student.schoolName || 'S').charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <h2 className="text-lg font-extrabold uppercase tracking-wide" style={{ color: '#0F172A' }}>
                            {school.name || student.schoolName || 'School Name'}
                        </h2>
                        {school.address && <p className="text-[11px] mt-1" style={{ color: '#64748B' }}>{school.address}</p>}
                        <div className="inline-block mt-2 px-4 py-1 rounded-full text-[10px] font-bold tracking-widest text-white uppercase" style={{ background: 'linear-gradient(135deg, #1D4ED8, #2563EB)' }}>
                            Fee Receipt
                        </div>
                    </div>

                    {/* Receipt Info */}
                    <div className="flex justify-between items-start mb-3 p-3 rounded-lg" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                        <div>
                            <span className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Receipt No.</span>
                            <p className="font-bold font-mono text-sm" style={{ color: '#0F172A' }}>{payment.receiptNumber || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Date</span>
                            <p className="font-bold text-sm" style={{ color: '#0F172A' }}>
                                {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                            </p>
                        </div>
                    </div>

                    {/* Student Info Card */}
                    <div className="rounded-xl mb-3 overflow-hidden" style={{ border: '1.5px solid #E2E8F0' }}>
                        <div className="px-3 py-2" style={{ background: 'linear-gradient(135deg, #F0F9FF, #E0F2FE)', borderBottom: '1px solid #BAE6FD' }}>
                            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#0369A1' }}>Student Details</span>
                        </div>
                        <div className="grid grid-cols-2">
                            <div className="px-3 py-2" style={{ borderBottom: '1px solid #F1F5F9', borderRight: '1px solid #F1F5F9' }}>
                                <span className="text-[8px] font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>Student Name</span>
                                <p className="text-xs font-bold" style={{ color: '#1E293B' }}>{student.studentName || student.name || 'N/A'}</p>
                            </div>
                            <div className="px-3 py-2" style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <span className="text-[8px] font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>Admission No.</span>
                                <p className="text-xs font-bold font-mono" style={{ color: '#1E293B' }}>{student.admissionNo || 'N/A'}</p>
                            </div>
                            <div className="px-3 py-2" style={{ borderRight: '1px solid #F1F5F9' }}>
                                <span className="text-[8px] font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>Class & Section</span>
                                <p className="text-xs font-bold" style={{ color: '#1E293B' }}>{student.class}{student.section ? ' - ' + student.section : ''}</p>
                            </div>
                            <div className="px-3 py-2">
                                <span className="text-[8px] font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>Payment Mode</span>
                                <p className="text-xs font-bold capitalize" style={{ color: '#1E293B' }}>{payment.mode || payment.paymentMode || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Amount Summary */}
                    <div className="rounded-xl mb-3 overflow-hidden" style={{ border: '2px solid #E2E8F0' }}>
                        <div className="flex justify-between items-center px-4 py-2.5" style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <span className="text-xs" style={{ color: '#475569' }}>Total Fee Amount</span>
                            <span className="text-xs font-bold font-mono" style={{ color: '#1E293B' }}>₹{(feeInfo.totalAmount || data.totalAmount || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-3" style={{ background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)' }}>
                            <span className="text-sm font-extrabold uppercase tracking-wide" style={{ color: '#166534' }}>Amount Paid</span>
                            <span className="text-xl font-black font-mono" style={{ color: '#15803D' }}>₹{(payment.amount || data.paidAmount || 0).toLocaleString('en-IN')}</span>
                        </div>
                        {(feeInfo.totalPaidSoFar || data.totalPaidSoFar) && (
                            <div className="flex justify-between items-center px-4 py-2" style={{ borderTop: '1px solid #E2E8F0' }}>
                                <span className="text-xs" style={{ color: '#475569' }}>Total Paid So Far</span>
                                <span className="text-xs font-bold font-mono" style={{ color: '#1E293B' }}>₹{(feeInfo.totalPaidSoFar || data.totalPaidSoFar || 0).toLocaleString('en-IN')}</span>
                            </div>
                        )}
                        {(feeInfo.remaining || data.remainingAmount) > 0 && (
                            <div className="flex justify-between items-center px-4 py-2" style={{ backgroundColor: '#FEF2F2', borderTop: '1px solid #FECACA' }}>
                                <span className="text-xs font-semibold" style={{ color: '#DC2626' }}>Balance Remaining</span>
                                <span className="text-xs font-bold font-mono" style={{ color: '#DC2626' }}>₹{(feeInfo.remaining || data.remainingAmount || 0).toLocaleString('en-IN')}</span>
                            </div>
                        )}
                    </div>

                    {/* Status */}
                    <div className="text-center mb-3">
                        <FeeBadge status={feeInfo.status || data.status || 'paid'} dueDate={new Date().toISOString()} />
                    </div>

                    {/* Payment History — with individual print buttons */}
                    {data.allPayments && data.allPayments.length > 1 && (
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#475569' }}>📋 Payment History</p>
                                <p className="text-[8px]" style={{ color: '#94A3B8' }}>Click 🖨️ to print individual receipt</p>
                            </div>
                            <div className="space-y-1.5">
                                {data.allPayments.map((p: any, i: number) => {
                                    const isCurrentReceipt = p.receiptNumber === payment.receiptNumber
                                    return (
                                        <div
                                            key={i}
                                            className="flex justify-between items-center px-3 py-2.5 rounded-xl text-xs transition-all"
                                            style={{
                                                backgroundColor: isCurrentReceipt ? '#ECFDF5' : '#F8FAFC',
                                                border: isCurrentReceipt ? '1.5px solid #A7F3D0' : '1px solid #F1F5F9',
                                            }}
                                        >
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                {/* Payment Index Circle */}
                                                <div
                                                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                                                    style={{
                                                        backgroundColor: isCurrentReceipt ? '#059669' : '#E2E8F0',
                                                        color: isCurrentReceipt ? '#FFFFFF' : '#64748B',
                                                    }}
                                                >
                                                    {i + 1}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-mono font-semibold truncate" style={{ color: isCurrentReceipt ? '#059669' : '#334155' }}>
                                                            {p.receiptNumber}
                                                        </span>
                                                        {isCurrentReceipt && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[7px] font-bold uppercase tracking-wider" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
                                                                Current
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span style={{ color: '#94A3B8' }}>
                                                            {new Date(p.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                        <span className="capitalize" style={{ color: '#94A3B8' }}>
                                                            • {p.mode || p.paymentMode || '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span className="font-bold font-mono" style={{ color: '#15803D' }}>
                                                    ₹{p.amount.toLocaleString('en-IN')}
                                                </span>
                                                {/* Individual Print Button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handlePrintSpecificPayment(p)
                                                    }}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                                                    style={{
                                                        backgroundColor: '#EFF6FF',
                                                        color: '#2563EB',
                                                        border: '1px solid #BFDBFE',
                                                    }}
                                                    title={`Print receipt ${p.receiptNumber}`}
                                                >
                                                    <Printer size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Print All Receipts Button */}
                            <button
                                onClick={() => {
                                    data.allPayments.forEach((p: any, i: number) => {
                                        setTimeout(() => handlePrintSpecificPayment(p), i * 500)
                                    })
                                }}
                                className="w-full mt-2 py-2 rounded-xl text-[11px] font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                                style={{
                                    backgroundColor: '#F8FAFC',
                                    color: '#475569',
                                    border: '1px dashed #CBD5E1',
                                }}
                            >
                                <Printer size={12} />
                                Print All {data.allPayments.length} Receipts
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 flex gap-2 flex-shrink-0" style={{ borderTop: '1px solid #F1F5F9' }}>
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors" style={{ backgroundColor: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0' }}>
                        Close
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                        style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
                    >
                        <Printer size={14} />
                        Print {paperSize}
                    </button>
                </div>
            </div>
        </div>
    )
}


/* ════════════════════════════════════════════
   HELPER — Convert Number to Words (Indian)
   ════════════════════════════════════════════ */
function numberToWords(num: number): string {
    if (num === 0) return 'Zero'

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
        'Seventeen', 'Eighteen', 'Nineteen']
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

    function convertLessThanThousand(n: number): string {
        if (n === 0) return ''
        if (n < 20) return ones[n]
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
        return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertLessThanThousand(n % 100) : '')
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

/* ═══════════════════════════════════════════════════════════════
   FEE STRUCTURE MODAL — Create / Edit
   ═══════════════════════════════════════════════════════════════ */
function FeeStructureModal({
    open, editItem, onClose, onSuccess,
}: {
    open: boolean
    editItem: FeeStructure | null
    onClose: () => void
    onSuccess: (msg: string) => void
}) {
    const initForm = () => ({
        name: '',
        class: '',
        section: 'all',
        stream: '',
        academicYear: getCurrentAcademicYear(),
        term: 'Term 1',
        dueDate: '',
        lateFinePerDay: 0,
        lateFineType: 'fixed',
        maxLateFine: 0,
        autoAssign: true,
        items: [{ label: 'Tuition Fee', amount: 0, isOptional: false }],
    })

    const [form, setForm] = useState(initForm())
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const isHigherSecondary = ['11', '12'].includes(form.class)

    useEffect(() => {
        if (editItem) {
            setForm({
                name: editItem.name,
                class: editItem.class,
                section: editItem.section || 'all',
                stream: editItem.stream || '',
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
    }, [editItem, open])

    const mandatoryTotal = form.items
        .filter(i => !i.isOptional)
        .reduce((s, i) => s + Number(i.amount), 0)

    const optionalTotal = form.items
        .filter(i => i.isOptional)
        .reduce((s, i) => s + Number(i.amount), 0)

    const setField = (key: string, val: any) => {
        setForm(f => {
            const updated = { ...f, [key]: val }
            // Clear stream if class changed to non-11/12
            if (key === 'class' && !['11', '12'].includes(val)) {
                updated.stream = ''
            }
            return updated
        })
    }

    const addItem = () =>
        setField('items', [
            ...form.items,
            { label: '', amount: 0, isOptional: false },
        ])

    const updateItem = (idx: number, key: string, val: any) =>
        setField(
            'items',
            form.items.map((item, i) =>
                i === idx ? { ...item, [key]: val } : item
            )
        )

    const removeItem = (idx: number) =>
        setField('items', form.items.filter((_, i) => i !== idx))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!form.class) { setError('Class select karo'); return }
        if (!form.dueDate) { setError('Due date set karo'); return }
        if (!form.name.trim()) { setError('Fee name required hai'); return }
        if (isHigherSecondary && !form.stream) {
            setError('Class 11/12 ke liye stream select karna zaroori hai')
            return
        }
        if (form.items.some(i => !i.label || Number(i.amount) <= 0)) {
            setError('Saare fee items ka label aur amount fill karo')
            return
        }

        // ✅ Mandatory aur optional alag calculate karo
        const mandatoryTotal = form.items
            .filter(i => !i.isOptional)
            .reduce((s, i) => s + Number(i.amount), 0)

        const optionalTotal = form.items
            .filter(i => i.isOptional)
            .reduce((s, i) => s + Number(i.amount), 0)

        if (mandatoryTotal <= 0) {
            setError('Kam se kam ek mandatory fee item hona chahiye')
            return
        }

        setLoading(true)
        try {
            const url = editItem
                ? `/api/fees/structure/${editItem._id}`
                : '/api/fees/structure'
            const method = editItem ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    totalAmount: mandatoryTotal,  // ✅ Sirf mandatory
                    optionalTotal,                  // ✅ Info ke liye send karo
                    stream: isHigherSecondary ? form.stream : undefined,
                }),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error ?? 'Something went wrong')
                return
            }
            onSuccess(
                editItem
                    ? 'Fee structure updated successfully!'
                    : `Fee structure created!${data.feesCreated > 0
                        ? ` ${data.feesCreated} students ko ₹${mandatoryTotal.toLocaleString('en-IN')} auto-assign ho gaya`
                        : ''
                    }${optionalTotal > 0
                        ? ` | ₹${optionalTotal.toLocaleString('en-IN')} optional fees manually assign karni hogi`
                        : ''
                    }`
            )
        } finally {
            setLoading(false)
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                style={{ border: '1px solid #E2E8F0' }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 py-4 flex-shrink-0"
                    style={{ borderBottom: '1px solid #F1F5F9' }}
                >
                    <div>
                        <h3 className="text-base font-bold" style={{ color: '#0F172A' }}>
                            {editItem ? `Edit: ${editItem.name}` : 'Create Fee Structure'}
                        </h3>
                        <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
                            {editItem
                                ? 'Fee structure update karein'
                                : 'Class-wise fees define karein'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ color: '#94A3B8', backgroundColor: '#F8FAFC' }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col flex-1 min-h-0"
                >
                    <div className="flex-1 overflow-y-auto portal-scrollbar px-6 py-5">
                        <div className="space-y-5">

                            {/* ── Basic Info ── */}
                            <div>
                                <h4
                                    className="text-xs font-bold uppercase tracking-wider mb-3"
                                    style={{ color: '#94A3B8' }}
                                >
                                    Basic Info
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <FormInput
                                            label="Fee Structure Name"
                                            value={form.name}
                                            onChange={val => setField('name', val)}
                                            required
                                            placeholder="e.g. Term 1 Fee 2025-26"
                                        />
                                    </div>
                                    <FormSelect
                                        label="Academic Year"
                                        value={form.academicYear}
                                        onChange={val => setField('academicYear', val)}
                                        required
                                        options={getAcademicYears().map(y => ({
                                            value: y,
                                            label: y,
                                        }))}
                                    />
                                    <FormSelect
                                        label="Term"
                                        value={form.term}
                                        onChange={val => setField('term', val)}
                                        required
                                        options={TERMS.map(t => ({ value: t, label: t }))}
                                    />
                                    <FormSelect
                                        label="For Class"
                                        value={form.class}
                                        onChange={val => setField('class', val)}
                                        required
                                        options={[
                                            { value: '', label: 'Select Class' },
                                            { value: 'all', label: 'All Classes' },
                                            ...CLASSES.map(c => ({
                                                value: c,
                                                label: `Class ${c}`,
                                            })),
                                        ]}
                                    />
                                    <FormSelect
                                        label="Section"
                                        value={form.section}
                                        onChange={val => setField('section', val)}
                                        options={[
                                            { value: 'all', label: 'All Sections' },
                                            ...SECTIONS.map(s => ({
                                                value: s,
                                                label: `Section ${s}`,
                                            })),
                                        ]}
                                    />
                                    <FormInput
                                        label="Due Date"
                                        value={form.dueDate}
                                        onChange={val => setField('dueDate', val)}
                                        type="date"
                                        required
                                    />
                                </div>

                                {/* ✅ Stream Selector — Only for 11/12 */}
                                {isHigherSecondary && (
                                    <div className="mt-4">
                                        <label
                                            className="text-xs font-semibold mb-2 block"
                                            style={{ color: '#475569' }}
                                        >
                                            Stream / Faculty{' '}
                                            <span style={{ color: '#EF4444' }}>*</span>
                                            <span
                                                className="ml-1 font-normal"
                                                style={{ color: '#94A3B8' }}
                                            >
                                                (optional — leave blank for all streams)
                                            </span>
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {/* "All Streams" option */}
                                            <button
                                                type="button"
                                                onClick={() => setField('stream', '')}
                                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all"
                                                style={{
                                                    border: `2px solid ${!form.stream ? '#475569' : '#E2E8F0'}`,
                                                    backgroundColor: !form.stream ? '#F8FAFC' : '#FFFFFF',
                                                }}
                                            >
                                                <div
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                                                    style={{
                                                        backgroundColor: !form.stream ? '#475569' : '#F1F5F9',
                                                        color: !form.stream ? '#FFFFFF' : '#94A3B8',
                                                    }}
                                                >
                                                    *
                                                </div>
                                                <p
                                                    className="text-xs font-semibold"
                                                    style={{
                                                        color: !form.stream ? '#0F172A' : '#64748B',
                                                    }}
                                                >
                                                    All Streams
                                                </p>
                                                {!form.stream && (
                                                    <div
                                                        className="w-4 h-4 rounded-full flex items-center justify-center ml-auto"
                                                        style={{ backgroundColor: '#475569' }}
                                                    >
                                                        <span className="text-white text-[0.5rem]">✓</span>
                                                    </div>
                                                )}
                                            </button>

                                            {STREAMS.map(s => (
                                                <button
                                                    key={s.value}
                                                    type="button"
                                                    onClick={() => setField('stream', s.value)}
                                                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all"
                                                    style={{
                                                        border: `2px solid ${form.stream === s.value ? s.color : '#E2E8F0'}`,
                                                        backgroundColor:
                                                            form.stream === s.value ? s.bg : '#FFFFFF',
                                                    }}
                                                >
                                                    <div
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                                                        style={{
                                                            backgroundColor:
                                                                form.stream === s.value
                                                                    ? s.color
                                                                    : '#F1F5F9',
                                                            color:
                                                                form.stream === s.value
                                                                    ? '#FFFFFF'
                                                                    : '#94A3B8',
                                                        }}
                                                    >
                                                        {s.label.charAt(0)}
                                                    </div>
                                                    <p
                                                        className="text-xs font-semibold"
                                                        style={{
                                                            color:
                                                                form.stream === s.value
                                                                    ? s.color
                                                                    : '#0F172A',
                                                        }}
                                                    >
                                                        {s.label}
                                                    </p>
                                                    {form.stream === s.value && (
                                                        <div
                                                            className="w-4 h-4 rounded-full flex items-center justify-center ml-auto"
                                                            style={{ backgroundColor: s.color }}
                                                        >
                                                            <span className="text-white text-[0.5rem]">
                                                                ✓
                                                            </span>
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── Late Fine Settings ── */}
                            <div>
                                <h4
                                    className="text-xs font-bold uppercase tracking-wider mb-3"
                                    style={{ color: '#94A3B8' }}
                                >
                                    Late Fine Settings
                                </h4>
                                <div
                                    className="rounded-xl p-4"
                                    style={{
                                        backgroundColor: '#FFFBEB',
                                        border: '1px solid #FDE68A',
                                    }}
                                >
                                    <div className="grid grid-cols-3 gap-3">
                                        <FormInput
                                            label="Fine per day"
                                            value={form.lateFinePerDay || ''}
                                            onChange={val =>
                                                setField('lateFinePerDay', Number(val))
                                            }
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
                                            onChange={val =>
                                                setField('maxLateFine', Number(val))
                                            }
                                            type="number"
                                            placeholder="500"
                                            helper="0 = no cap"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ── Fee Items ── */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4
                                        className="text-xs font-bold uppercase tracking-wider"
                                        style={{ color: '#94A3B8' }}
                                    >
                                        Fee Items
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="inline-flex items-center gap-1 text-xs font-semibold transition-colors"
                                        style={{ color: '#2563EB' }}
                                    >
                                        <Plus size={12} /> Add Item
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {form.items.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="flex gap-2 items-center p-3 rounded-xl"
                                            style={{
                                                backgroundColor: '#F8FAFC',
                                                border: '1px solid #F1F5F9',
                                            }}
                                        >
                                            <input
                                                className="flex-1 h-8 px-3 text-sm rounded-lg outline-none"
                                                style={{
                                                    border: '1.5px solid #E2E8F0',
                                                    color: '#0F172A',
                                                    backgroundColor: '#FFFFFF',
                                                }}
                                                placeholder="Fee label (e.g., Tuition Fee)"
                                                value={item.label}
                                                onChange={e =>
                                                    updateItem(idx, 'label', e.target.value)
                                                }
                                                onFocus={e => {
                                                    e.target.style.borderColor = '#2563EB'
                                                }}
                                                onBlur={e => {
                                                    e.target.style.borderColor = '#E2E8F0'
                                                }}
                                                required
                                            />
                                            <input
                                                className="w-28 h-8 px-3 text-sm rounded-lg outline-none tabular-nums"
                                                style={{
                                                    border: '1.5px solid #E2E8F0',
                                                    color: '#0F172A',
                                                    backgroundColor: '#FFFFFF',
                                                }}
                                                type="number"
                                                placeholder="Amount ₹"
                                                value={item.amount || ''}
                                                onChange={e =>
                                                    updateItem(idx, 'amount', Number(e.target.value))
                                                }
                                                onFocus={e => {
                                                    e.target.style.borderColor = '#2563EB'
                                                }}
                                                onBlur={e => {
                                                    e.target.style.borderColor = '#E2E8F0'
                                                }}
                                                required
                                            />
                                            <label
                                                className="flex items-center gap-1.5 text-xs cursor-pointer whitespace-nowrap"
                                                style={{ color: '#64748B' }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="rounded"
                                                    checked={item.isOptional}
                                                    onChange={e =>
                                                        updateItem(idx, 'isOptional', e.target.checked)
                                                    }
                                                />
                                                Optional
                                            </label>
                                            {form.items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(idx)}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
                                                    style={{ color: '#94A3B8' }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.backgroundColor = '#FEF2F2'
                                                        e.currentTarget.style.color = '#DC2626'
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.backgroundColor = 'transparent'
                                                        e.currentTarget.style.color = '#94A3B8'
                                                    }}
                                                >
                                                    <X size={13} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Total */}
                                <div className="mt-3 space-y-2">
                                    {/* Mandatory Total */}
                                    <div
                                        className="flex items-center justify-between px-4 py-3 rounded-xl"
                                        style={{
                                            backgroundColor: '#EFF6FF',
                                            border: '1px solid #BFDBFE',
                                        }}
                                    >
                                        <div>
                                            <span className="text-xs font-semibold" style={{ color: '#1D4ED8' }}>
                                                Mandatory Total
                                            </span>
                                            <p className="text-[0.625rem] mt-0.5" style={{ color: '#60A5FA' }}>
                                                Yeh amount sabhi students ko assign hogi
                                            </p>
                                        </div>
                                        <span className="text-lg font-extrabold tabular-nums" style={{ color: '#1D4ED8' }}>
                                            ₹{mandatoryTotal.toLocaleString('en-IN')}
                                        </span>
                                    </div>

                                    {/* Optional Total — sirf tab show karo jab optional items hon */}
                                    {optionalTotal > 0 && (
                                        <div
                                            className="flex items-center justify-between px-4 py-3 rounded-xl"
                                            style={{
                                                backgroundColor: '#FFFBEB',
                                                border: '1px solid #FDE68A',
                                            }}
                                        >
                                            <div>
                                                <span className="text-xs font-semibold" style={{ color: '#D97706' }}>
                                                    Optional Fees
                                                </span>
                                                <p className="text-[0.625rem] mt-0.5" style={{ color: '#F59E0B' }}>
                                                    Manually assign karni padegi selected students ko
                                                </p>
                                            </div>
                                            <span className="text-lg font-extrabold tabular-nums" style={{ color: '#D97706' }}>
                                                ₹{optionalTotal.toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    )}

                                    {/* Grand Total — sirf show karo context ke liye */}
                                    {optionalTotal > 0 && (
                                        <div
                                            className="flex items-center justify-between px-3 py-2 rounded-lg"
                                            style={{ backgroundColor: '#F8FAFC' }}
                                        >
                                            <span className="text-xs" style={{ color: '#94A3B8' }}>
                                                Grand Total (if all applicable)
                                            </span>
                                            <span className="text-sm font-bold tabular-nums" style={{ color: '#64748B' }}>
                                                ₹{(mandatoryTotal + optionalTotal).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── Auto Assign Toggle ── */}
                            {!editItem && (
                                <div>
                                    <h4
                                        className="text-xs font-bold uppercase tracking-wider mb-3"
                                        style={{ color: '#94A3B8' }}
                                    >
                                        Assignment
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setField('autoAssign', !form.autoAssign)
                                        }
                                        className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all"
                                        style={{
                                            backgroundColor: form.autoAssign
                                                ? '#EFF6FF'
                                                : '#F8FAFC',
                                            border: `1.5px solid ${form.autoAssign ? '#BFDBFE' : '#E2E8F0'}`,
                                        }}
                                    >
                                        {/* Toggle Switch */}
                                        <div
                                            className="w-10 h-5 rounded-full relative flex-shrink-0 transition-colors"
                                            style={{
                                                backgroundColor: form.autoAssign
                                                    ? '#2563EB'
                                                    : '#CBD5E1',
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
                                                        ? '#1D4ED8'
                                                        : '#475569',
                                                }}
                                            >
                                                Auto-assign to existing students
                                            </p>
                                            <p
                                                className="text-[0.6875rem] mt-0.5"
                                                style={{ color: '#94A3B8' }}
                                            >
                                                Is class ke saare active students ko yeh fee
                                                automatically assign hogi
                                            </p>
                                        </div>
                                        <Zap
                                            size={16}
                                            style={{
                                                color: form.autoAssign ? '#2563EB' : '#CBD5E1',
                                            }}
                                        />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mx-6 mb-2">
                            <div
                                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
                                style={{
                                    backgroundColor: '#FEF2F2',
                                    color: '#DC2626',
                                    border: '1px solid #FECACA',
                                }}
                            >
                                <AlertCircle size={15} />
                                {error}
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div
                        className="px-6 py-4 flex justify-end gap-2 flex-shrink-0"
                        style={{ borderTop: '1px solid #F1F5F9' }}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-sm font-medium"
                            style={{
                                backgroundColor: '#F8FAFC',
                                color: '#475569',
                                border: '1px solid #E2E8F0',
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-60 active:scale-[0.98] transition-all"
                            style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
                        >
                            {loading ? <Spinner size="sm" /> : editItem ? <Edit2 size={14} /> : <Plus size={14} />}
                            {loading
                                ? 'Saving...'
                                : editItem
                                    ? 'Update Structure'
                                    : 'Create & Assign'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}



// Optional Fee Assign Modal
function OptionalFeeModal({
    open,
    structure,
    onClose,
    onSuccess,
}: {
    open: boolean
    structure: FeeStructure | null
    onClose: () => void
    onSuccess: (msg: string) => void
}) {
    const [students, setStudents] = useState<any[]>([])
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [selectedItem, setSelectedItem] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(false)

    const optionalItems = structure?.items.filter(i => i.isOptional) ?? []

    useEffect(() => {
        if (!open || !structure) return
        setFetching(true)
        setSelectedIds([])
        setSelectedItem(optionalItems[0]?.label ?? '')

        // Is class ke students fetch karo
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

    const selectedItemData = optionalItems.find(i => i.label === selectedItem)

    const handleAssign = async () => {
        if (!structure || !selectedIds.length || !selectedItemData) return
        setLoading(true)
        try {
            // Ek naya fee structure create karo sirf is optional item ke liye
            // Ya existing structure pe additional fee add karo
            const res = await fetch('/api/fees/optional-assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    structureId: structure._id,
                    studentIds: selectedIds,
                    item: selectedItemData,
                    dueDate: structure.dueDate,
                    academicYear: structure.academicYear,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            onSuccess(`${data.assigned} students ko ${selectedItemData.label} assign ho gaya`)
            onClose()
        } catch (err: any) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    if (!open || !structure) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
                style={{ border: '1px solid #E2E8F0' }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                    style={{ borderBottom: '1px solid #F1F5F9' }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: '#FFFBEB' }}
                        >
                            <Sparkles size={16} style={{ color: '#D97706' }} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold" style={{ color: '#0F172A' }}>
                                Assign Optional Fee
                            </h3>
                            <p className="text-xs" style={{ color: '#94A3B8' }}>
                                {structure.name} · Class {structure.class}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ color: '#94A3B8' }}
                    >
                        <X size={14} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto portal-scrollbar px-5 py-4 space-y-4">
                    {/* Select Optional Item */}
                    <div>
                        <label
                            className="text-xs font-semibold mb-2 block"
                            style={{ color: '#475569' }}
                        >
                            Kaunsi optional fee assign karni hai?
                        </label>
                        <div className="space-y-2">
                            {optionalItems.map(item => (
                                <button
                                    key={item.label}
                                    onClick={() => setSelectedItem(item.label)}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all"
                                    style={{
                                        border: `2px solid ${selectedItem === item.label ? '#D97706' : '#E2E8F0'}`,
                                        backgroundColor: selectedItem === item.label
                                            ? '#FFFBEB'
                                            : '#FFFFFF',
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{
                                                backgroundColor: selectedItem === item.label
                                                    ? '#D97706'
                                                    : '#CBD5E1',
                                            }}
                                        />
                                        <span
                                            className="text-sm font-medium"
                                            style={{
                                                color: selectedItem === item.label
                                                    ? '#92400E'
                                                    : '#475569',
                                            }}
                                        >
                                            {item.label}
                                        </span>
                                    </div>
                                    <span
                                        className="text-sm font-bold tabular-nums"
                                        style={{
                                            color: selectedItem === item.label
                                                ? '#D97706'
                                                : '#64748B',
                                        }}
                                    >
                                        ₹{item.amount.toLocaleString('en-IN')}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Select Students */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label
                                className="text-xs font-semibold"
                                style={{ color: '#475569' }}
                            >
                                Students select karo ({selectedIds.length} selected)
                            </label>
                            <button
                                onClick={() => {
                                    if (selectedIds.length === students.length) {
                                        setSelectedIds([])
                                    } else {
                                        setSelectedIds(students.map(s => s._id))
                                    }
                                }}
                                className="text-xs font-medium"
                                style={{ color: '#2563EB' }}
                            >
                                {selectedIds.length === students.length
                                    ? 'Deselect All'
                                    : 'Select All'}
                            </button>
                        </div>

                        {fetching ? (
                            <div className="flex justify-center py-8">
                                <Spinner size="lg" />
                            </div>
                        ) : students.length === 0 ? (
                            <div className="portal-empty py-8">
                                <p className="portal-empty-title">No students found</p>
                            </div>
                        ) : (
                            <div
                                className="divide-y divide-slate-100"  // ← Tailwind class mein rakho
                                style={{
                                    border: '1px solid #E2E8F0',
                                    maxHeight: '280px',
                                    overflowY: 'auto',
                                }}
                            >
                                {students.map((s, idx) => (
                                    <label
                                        key={s._id}
                                        className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
                                        style={{
                                            // ✅ divideColor ki jagah borderBottom inline
                                            borderBottom: idx < students.length - 1
                                                ? '1px solid #F1F5F9'
                                                : 'none',
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
                                            <p
                                                className="text-sm font-medium truncate"
                                                style={{ color: '#0F172A' }}
                                            >
                                                {s.userId?.name}
                                            </p>
                                            <p
                                                className="text-xs font-mono"
                                                style={{ color: '#94A3B8' }}
                                            >
                                                {s.admissionNo} · Roll #{s.rollNo}
                                            </p>
                                        </div>
                                        <span
                                            className="text-xs font-semibold px-2 py-0.5 rounded-lg flex-shrink-0"
                                            style={{
                                                backgroundColor: '#EEF2FF',
                                                color: '#4F46E5',
                                            }}
                                        >
                                            {s.class}-{s.section}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Summary */}
                    {selectedIds.length > 0 && selectedItemData && (
                        <div
                            className="rounded-xl p-4"
                            style={{
                                backgroundColor: '#FFFBEB',
                                border: '1px solid #FDE68A',
                            }}
                        >
                            <p
                                className="text-xs font-semibold mb-1"
                                style={{ color: '#92400E' }}
                            >
                                Assignment Summary
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-sm" style={{ color: '#B45309' }}>
                                    {selectedIds.length} students ×
                                    ₹{selectedItemData.amount.toLocaleString('en-IN')}
                                </span>
                                <span
                                    className="text-base font-bold tabular-nums"
                                    style={{ color: '#D97706' }}
                                >
                                    ₹{(selectedIds.length * selectedItemData.amount)
                                        .toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div
                    className="px-5 py-4 flex gap-2 flex-shrink-0"
                    style={{ borderTop: '1px solid #F1F5F9' }}
                >
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 rounded-xl text-sm font-medium"
                        style={{
                            backgroundColor: '#F8FAFC',
                            color: '#475569',
                            border: '1px solid #E2E8F0',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={loading || !selectedIds.length || !selectedItem}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                        style={{ backgroundColor: '#D97706', color: '#FFFFFF' }}
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
            // Only send secret if it's not the masked value
            if (!form.razorpayKeySecret.includes('•')) {
                body.razorpayKeySecret = form.razorpayKeySecret
            }

            const res = await fetch('/api/payment-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            if (res.ok) {
                onAlert({ type: 'success', msg: 'Payment settings saved successfully!' })
            } else {
                onAlert({ type: 'error', msg: 'Failed to save settings' })
            }
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Spinner size="lg" />
            </div>
        )
    }

    return (
        <div className="max-w-2xl space-y-4">
            {/* Online Payment Toggle Card */}
            <div className="portal-card">
                <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3
                                className="text-sm font-bold"
                                style={{ color: '#0F172A' }}
                            >
                                Online Payment
                            </h3>
                            <p
                                className="text-xs mt-0.5"
                                style={{ color: '#94A3B8' }}
                            >
                                Students/Parents apne phone se fee pay kar sakein
                            </p>
                        </div>
                        <button
                            onClick={() =>
                                setForm(f => ({
                                    ...f,
                                    enableOnlinePayment: !f.enableOnlinePayment,
                                }))
                            }
                            className="flex items-center gap-2"
                        >
                            <div
                                className="w-12 h-6 rounded-full relative transition-colors"
                                style={{
                                    backgroundColor: form.enableOnlinePayment
                                        ? '#2563EB'
                                        : '#CBD5E1',
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
                                    color: form.enableOnlinePayment ? '#2563EB' : '#94A3B8',
                                }}
                            >
                                {form.enableOnlinePayment ? 'Enabled' : 'Disabled'}
                            </span>
                        </button>
                    </div>

                    {/* Razorpay Config */}
                    {form.enableOnlinePayment && (
                        <div className="space-y-4 mt-4 pt-4" style={{ borderTop: '1px solid #F1F5F9' }}>
                            <FormInput
                                label="Razorpay Key ID"
                                value={form.razorpayKeyId}
                                onChange={val =>
                                    setForm(f => ({ ...f, razorpayKeyId: val }))
                                }
                                placeholder="rzp_live_xxxxxxxxxx"
                                helper="Razorpay dashboard → Settings → API Keys"
                            />
                            <FormInput
                                label="Razorpay Key Secret"
                                value={
                                    form.razorpayKeySecret.includes('•')
                                        ? ''
                                        : form.razorpayKeySecret
                                }
                                onChange={val =>
                                    setForm(f => ({ ...f, razorpayKeySecret: val }))
                                }
                                type="password"
                                placeholder={
                                    settings?.hasKey
                                        ? 'Current key saved (change karne ke liye type karein)'
                                        : 'rzp_secret_xxxxxxxxxx'
                                }
                                helper="Secret key encrypted store hoti hai"
                            />

                            {/* Razorpay Setup Guide */}
                            <div
                                className="rounded-xl p-4"
                                style={{
                                    backgroundColor: '#EFF6FF',
                                    border: '1px solid #BFDBFE',
                                }}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Info size={13} style={{ color: '#2563EB' }} />
                                    <p
                                        className="text-xs font-semibold"
                                        style={{ color: '#1D4ED8' }}
                                    >
                                        Razorpay account setup guide
                                    </p>
                                </div>
                                <ol
                                    className="text-[0.6875rem] space-y-1 list-decimal list-inside"
                                    style={{ color: '#3B82F6' }}
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

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-all active:scale-[0.98]"
                style={{
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    boxShadow: '0 1px 3px rgba(37,99,235,0.3)',
                }}
            >
                {saving ? <Spinner size="sm" /> : <Settings size={14} />}
                {saving ? 'Saving...' : 'Save Settings'}
            </button>
        </div>
    )
}