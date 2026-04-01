// FILE: src/app/(dashboard)/admin/fees/page.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
    CreditCard, Plus, Edit2, Trash2, Users, RefreshCw,
    ChevronRight, ChevronLeft, X, AlertCircle, Search,
    Filter, TrendingUp, Wallet, AlertTriangle, CheckSquare,
    Calendar, IndianRupee, Receipt, Settings, Zap,
    ArrowUpRight, Clock, BarChart2, Eye, Download,
    Sparkles, Info, ToggleLeft, ToggleRight, Hash,
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

interface Fee {
    _id: string
    studentId: {
        _id: string
        admissionNo: string
        class: string
        section: string
        userId: { name: string; phone: string }
    }
    structureId: { _id: string; name: string }
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

/* ═══════════════════════════════════════════
   REUSABLE FORM COMPONENTS — Outside modals
   ═══════════════════════════════════════════ */
const FormInput = ({
    label, value, onChange, type = 'text',
    required = false, placeholder = '', helper,
}: {
    label: string; value: string | number; onChange: (val: string) => void
    type?: string; required?: boolean; placeholder?: string; helper?: string
}) => (
    <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold" style={{ color: '#475569' }}>
            {label}{required && <span style={{ color: '#EF4444' }}> *</span>}
        </label>
        <input
            type={type}
            className="h-9 px-3 text-sm rounded-lg outline-none transition-all"
            style={{ border: '1.5px solid #E2E8F0', color: '#0F172A', backgroundColor: '#FFFFFF' }}
            placeholder={placeholder}
            value={value}
            required={required}
            onChange={e => onChange(e.target.value)}
            onFocus={e => {
                e.target.style.borderColor = '#2563EB'
                e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'
            }}
            onBlur={e => {
                e.target.style.borderColor = '#E2E8F0'
                e.target.style.boxShadow = 'none'
            }}
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
            onFocus={e => { e.target.style.borderColor = '#2563EB' }}
            onBlur={e => { e.target.style.borderColor = '#E2E8F0' }}
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

/* ═══ Stat Card (mini) ═══ */
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
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: iconBg }}
                >
                    <span style={{ color: iconColor }}>{icon}</span>
                </div>
                <div>
                    <p
                        className="text-xl font-extrabold tracking-tight leading-none tabular-nums"
                        style={{ color: valueColor || '#0F172A' }}
                    >
                        {value}
                    </p>
                    <p className="text-[0.6875rem] mt-0.5 font-medium" style={{ color: '#94A3B8' }}>
                        {label}
                    </p>
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

    // Fee filters
    const [filterStatus, setFilterStatus] = useState('')
    const [filterClass, setFilterClass] = useState('')
    const [filterSearch, setFilterSearch] = useState('')
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Structure filters
    const [structureClass, setStructureClass] = useState('')

    // Modals
    const [showStructureModal, setShowStructureModal] = useState(false)
    const [editStructure, setEditStructure] = useState<FeeStructure | null>(null)
    const [showPayModal, setShowPayModal] = useState(false)
    const [selectedFee, setSelectedFee] = useState<Fee | null>(null)

    /* ── Stats ── */
    const totalDue = fees
        .filter(f => f.status === 'pending')
        .reduce((s, f) => s + f.finalAmount, 0)
    const totalPaid = fees
        .filter(f => f.status === 'paid')
        .reduce((s, f) => s + f.paidAmount, 0)
    const overdueCount = fees
        .filter(f => f.status === 'pending' && new Date(f.dueDate) < new Date())
        .length
    const pendingCount = fees.filter(f => f.status === 'pending').length

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
        return () => {
            if (searchTimeout.current) clearTimeout(searchTimeout.current)
        }
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
        if (res.ok) {
            showSuccess('Structure deactivated successfully')
            fetchStructures()
        } else showError('Failed to deactivate')
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

    const markPaid = async (feeId: string, paymentMode = 'cash') => {
        const res = await fetch(`/api/fees/${feeId}/mark-paid`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentMode }),
        })
        if (res.ok) {
            showSuccess('Fee marked as paid successfully')
            setShowPayModal(false)
            fetchFees()
        } else showError('Failed to mark as paid')
    }

    /* ── Tab Config ── */
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
                            style={{
                                backgroundColor: '#2563EB',
                                color: '#FFFFFF',
                                boxShadow: '0 1px 3px rgba(37,99,235,0.3)',
                            }}
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

            {/* Alert */}
            {alert && (
                <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
            )}

            {/* ═══ TABS ═══ */}
            <div
                className="flex gap-1 p-1 rounded-xl w-fit"
                style={{ backgroundColor: '#F1F5F9' }}
            >
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
                        <span style={{ color: tab === t.id ? '#2563EB' : '#94A3B8' }}>
                            {t.icon}
                        </span>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ═══════════════════════════════════════════
                TAB: STUDENT FEES
               ═══════════════════════════════════════════ */}
            {tab === 'fees' && (
                <div className="space-y-4">
                    {/* Stats Row */}
                    {!loading && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <MiniStatCard
                                label="Total Pending"
                                value={`₹${totalDue.toLocaleString('en-IN')}`}
                                icon={<AlertTriangle size={18} />}
                                iconBg="#FEF2F2"
                                iconColor="#DC2626"
                                valueColor="#DC2626"
                            />
                            <MiniStatCard
                                label="Total Collected"
                                value={`₹${totalPaid.toLocaleString('en-IN')}`}
                                icon={<TrendingUp size={18} />}
                                iconBg="#ECFDF5"
                                iconColor="#059669"
                                valueColor="#059669"
                            />
                            <MiniStatCard
                                label="Overdue"
                                value={overdueCount}
                                icon={<Clock size={18} />}
                                iconBg="#FFF7ED"
                                iconColor="#EA580C"
                                valueColor="#EA580C"
                            />
                            <MiniStatCard
                                label="Total Records"
                                value={fees.length}
                                icon={<Receipt size={18} />}
                                iconBg="#EFF6FF"
                                iconColor="#2563EB"
                            />
                        </div>
                    )}

                    {/* Filters */}
                    <div className="portal-card">
                        <div className="p-4">
                            <div className="flex flex-wrap gap-3">
                                {/* Search */}
                                <div className="flex-1 min-w-[200px] relative">
                                    <Search
                                        size={14}
                                        className="absolute left-3 top-1/2 -translate-y-1/2"
                                        style={{ color: '#94A3B8' }}
                                    />
                                    <input
                                        className="w-full h-9 pl-8 pr-3 text-sm rounded-lg outline-none transition-all"
                                        style={{
                                            border: '1.5px solid #E2E8F0',
                                            color: '#0F172A',
                                            backgroundColor: '#FFFFFF',
                                        }}
                                        placeholder="Search student name, admission no..."
                                        value={filterSearch}
                                        onChange={e => setFilterSearch(e.target.value)}
                                        onFocus={e => {
                                            e.target.style.borderColor = '#2563EB'
                                            e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'
                                        }}
                                        onBlur={e => {
                                            e.target.style.borderColor = '#E2E8F0'
                                            e.target.style.boxShadow = 'none'
                                        }}
                                    />
                                </div>

                                {/* Status */}
                                <select
                                    className="h-9 px-3 text-sm rounded-lg outline-none cursor-pointer"
                                    style={{
                                        border: '1.5px solid #E2E8F0',
                                        color: '#0F172A',
                                        minWidth: '120px',
                                    }}
                                    value={filterStatus}
                                    onChange={e => setFilterStatus(e.target.value)}
                                >
                                    <option value="">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                    <option value="partial">Partial</option>
                                    <option value="waived">Waived</option>
                                </select>

                                {/* Class */}
                                <select
                                    className="h-9 px-3 text-sm rounded-lg outline-none cursor-pointer"
                                    style={{
                                        border: '1.5px solid #E2E8F0',
                                        color: '#0F172A',
                                        minWidth: '120px',
                                    }}
                                    value={filterClass}
                                    onChange={e => setFilterClass(e.target.value)}
                                >
                                    <option value="">All Classes</option>
                                    {CLASSES.map(c => (
                                        <option key={c} value={c}>Class {c}</option>
                                    ))}
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
                                <div className="portal-empty-icon">
                                    <CreditCard size={24} />
                                </div>
                                <p className="portal-empty-title">No fee records found</p>
                                <p className="portal-empty-text">
                                    {filterStatus || filterClass || filterSearch
                                        ? 'Try adjusting your filters'
                                        : 'Pehle fee structure banao, phir students ko assign hoga'}
                                </p>
                                {!filterStatus && !filterClass && !filterSearch && (
                                    <button
                                        onClick={() => setTab('structures')}
                                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
                                        style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
                                    >
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
                                            <th>Due Date</th>
                                            <th>Status</th>
                                            <th className="text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fees.map(f => {
                                            const student = f.studentId
                                            const structure = f.structureId
                                            const isOverdue = f.status === 'pending' &&
                                                new Date(f.dueDate) < new Date()
                                            const daysOverdue = isOverdue
                                                ? Math.floor(
                                                    (Date.now() - new Date(f.dueDate).getTime()) / 86400000
                                                )
                                                : 0

                                            return (
                                                <tr key={f._id} className="group">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                                                                style={{
                                                                    backgroundColor: '#EEF2FF',
                                                                    color: '#4F46E5',
                                                                }}
                                                            >
                                                                {student?.userId?.name?.charAt(0) ?? '?'}
                                                            </div>
                                                            <div>
                                                                <p
                                                                    className="text-sm font-semibold"
                                                                    style={{ color: '#0F172A' }}
                                                                >
                                                                    {student?.userId?.name ?? 'N/A'}
                                                                </p>
                                                                <p
                                                                    className="text-[0.6875rem] font-mono"
                                                                    style={{ color: '#94A3B8' }}
                                                                >
                                                                    {student?.admissionNo} · Class{' '}
                                                                    {student?.class}-{student?.section}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p
                                                            className="text-sm font-medium"
                                                            style={{ color: '#475569' }}
                                                        >
                                                            {structure?.name ?? '—'}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p
                                                            className="text-sm font-bold tabular-nums"
                                                            style={{ color: '#0F172A' }}
                                                        >
                                                            ₹{f.finalAmount.toLocaleString('en-IN')}
                                                        </p>
                                                        {f.discount > 0 && (
                                                            <p
                                                                className="text-[0.6875rem]"
                                                                style={{ color: '#059669' }}
                                                            >
                                                                Discount: ₹{f.discount}
                                                            </p>
                                                        )}
                                                        {f.lateFine > 0 && (
                                                            <p
                                                                className="text-[0.6875rem]"
                                                                style={{ color: '#DC2626' }}
                                                            >
                                                                Fine: +₹{f.lateFine}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p
                                                            className="text-sm"
                                                            style={{ color: '#475569' }}
                                                        >
                                                            {new Date(f.dueDate).toLocaleDateString(
                                                                'en-IN',
                                                                { day: 'numeric', month: 'short', year: '2-digit' }
                                                            )}
                                                        </p>
                                                        {isOverdue && (
                                                            <p
                                                                className="text-[0.6875rem] font-semibold"
                                                                style={{ color: '#DC2626' }}
                                                            >
                                                                {daysOverdue}d overdue
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <FeeBadge
                                                            status={f.status}
                                                            dueDate={f.dueDate}
                                                        />
                                                        {f.paidAt && (
                                                            <p
                                                                className="text-[0.625rem] mt-0.5"
                                                                style={{ color: '#94A3B8' }}
                                                            >
                                                                Paid:{' '}
                                                                {new Date(f.paidAt).toLocaleDateString(
                                                                    'en-IN',
                                                                    { day: 'numeric', month: 'short' }
                                                                )}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-1 justify-end">
                                                            {/* Mark Paid */}
                                                            {f.status === 'pending' && (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedFee(f)
                                                                        setShowPayModal(true)
                                                                    }}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                                                    style={{
                                                                        backgroundColor: '#ECFDF5',
                                                                        color: '#059669',
                                                                        border: '1px solid #A7F3D0',
                                                                    }}
                                                                    onMouseEnter={e => {
                                                                        e.currentTarget.style.backgroundColor = '#059669'
                                                                        e.currentTarget.style.color = '#FFFFFF'
                                                                    }}
                                                                    onMouseLeave={e => {
                                                                        e.currentTarget.style.backgroundColor = '#ECFDF5'
                                                                        e.currentTarget.style.color = '#059669'
                                                                    }}
                                                                >
                                                                    <CheckSquare size={11} />
                                                                    Mark Paid
                                                                </button>
                                                            )}
                                                            {/* Receipt */}
                                                            {f.receiptUrl && (
                                                                <a
                                                                    href={f.receiptUrl}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                                                    style={{ color: '#94A3B8' }}
                                                                    title="View Receipt"
                                                                    onMouseEnter={e => {
                                                                        e.currentTarget.style.backgroundColor = '#EFF6FF'
                                                                        e.currentTarget.style.color = '#2563EB'
                                                                    }}
                                                                    onMouseLeave={e => {
                                                                        e.currentTarget.style.backgroundColor = 'transparent'
                                                                        e.currentTarget.style.color = '#94A3B8'
                                                                    }}
                                                                >
                                                                    <Receipt size={13} />
                                                                </a>
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

            {/* ═══════════════════════════════════════════
                TAB: PAYMENT SETTINGS
               ═══════════════════════════════════════════ */}
            {tab === 'settings' && (
                <PaymentSettingsPanel onAlert={a => setAlert(a)} />
            )}

            {/* ═══ MODALS ═══ */}
            <Portal>
                {/* Fee Structure Create/Edit Modal */}
                <FeeStructureModal
                    open={showStructureModal}
                    editItem={editStructure}
                    onClose={() => {
                        setShowStructureModal(false)
                        setEditStructure(null)
                    }}
                    onSuccess={msg => {
                        setShowStructureModal(false)
                        setEditStructure(null)
                        fetchStructures()
                        showSuccess(msg)
                    }}
                />

                {/* Mark Paid Modal */}
                {selectedFee && (
                    <MarkPaidModal
                        open={showPayModal}
                        fee={selectedFee}
                        onClose={() => {
                            setShowPayModal(false)
                            setSelectedFee(null)
                        }}
                        onPaid={mode => markPaid(selectedFee._id, mode)}
                    />
                )}
            </Portal>
        </div>
    )
}


/* ═══════════════════════════════════════════════════════════════
   MARK PAID MODAL
   ═══════════════════════════════════════════════════════════════ */
function MarkPaidModal({
    open, fee, onClose, onPaid,
}: {
    open: boolean
    fee: Fee
    onClose: () => void
    onPaid: (mode: string) => void
}) {
    const [mode, setMode] = useState('cash')
    const [loading, setLoading] = useState(false)

    const MODES = [
        { value: 'cash', label: 'Cash', icon: '💵', color: '#059669', bg: '#ECFDF5' },
        { value: 'online', label: 'Online', icon: '📱', color: '#2563EB', bg: '#EFF6FF' },
        { value: 'cheque', label: 'Cheque', icon: '📄', color: '#7C3AED', bg: '#F5F3FF' },
        { value: 'dd', label: 'DD', icon: '🏦', color: '#D97706', bg: '#FFFBEB' },
    ]

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm"
                style={{ border: '1px solid #E2E8F0' }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: '1px solid #F1F5F9' }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: '#ECFDF5' }}
                        >
                            <CheckSquare size={16} style={{ color: '#059669' }} />
                        </div>
                        <div>
                            <h3
                                className="text-sm font-bold"
                                style={{ color: '#0F172A' }}
                            >
                                Mark as Paid
                            </h3>
                            <p className="text-xs" style={{ color: '#94A3B8' }}>
                                {fee.studentId?.userId?.name}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ color: '#94A3B8', backgroundColor: '#F8FAFC' }}
                    >
                        <X size={14} />
                    </button>
                </div>

                <div className="px-5 py-4 space-y-4">
                    {/* Amount Info */}
                    <div
                        className="rounded-xl p-4 text-center"
                        style={{
                            background: 'linear-gradient(135deg, #ECFDF5, #F0FDF4)',
                            border: '1px solid #A7F3D0',
                        }}
                    >
                        <p className="text-2xl font-extrabold tabular-nums" style={{ color: '#047857' }}>
                            ₹{fee.finalAmount.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#059669' }}>
                            {fee.structureId?.name}
                        </p>
                    </div>

                    {/* Payment Mode */}
                    <div>
                        <p
                            className="text-xs font-semibold mb-2"
                            style={{ color: '#475569' }}
                        >
                            Payment Mode
                        </p>
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
                </div>

                {/* Footer */}
                <div
                    className="px-5 py-4 flex gap-2"
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
                        onClick={async () => {
                            setLoading(true)
                            await onPaid(mode)
                            setLoading(false)
                        }}
                        disabled={loading}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
                        style={{ backgroundColor: '#059669', color: '#FFFFFF' }}
                    >
                        {loading ? <Spinner size="sm" /> : <CheckSquare size={14} />}
                        {loading ? 'Processing...' : 'Confirm Payment'}
                    </button>
                </div>
            </div>
        </div>
    )
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

    const totalAmount = form.items.reduce((s, i) => s + Number(i.amount), 0)

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
                    totalAmount,
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
                    : `Fee structure created! ${data.feesCreated > 0
                        ? `${data.feesCreated} students ko auto-assign ho gaya`
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
                                <div
                                    className="flex items-center justify-between mt-3 px-4 py-3 rounded-xl"
                                    style={{
                                        backgroundColor: '#EFF6FF',
                                        border: '1px solid #BFDBFE',
                                    }}
                                >
                                    <span
                                        className="text-xs font-semibold"
                                        style={{ color: '#1D4ED8' }}
                                    >
                                        Total Fee Amount
                                    </span>
                                    <span
                                        className="text-lg font-extrabold tabular-nums"
                                        style={{ color: '#1D4ED8' }}
                                    >
                                        ₹{totalAmount.toLocaleString('en-IN')}
                                    </span>
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