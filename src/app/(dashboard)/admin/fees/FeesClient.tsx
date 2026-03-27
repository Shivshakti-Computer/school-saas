// =============================================================
// COMPLETE FEE MANAGEMENT UI
// FILE: src/app/(dashboard)/admin/fees/page.tsx — FULL REWRITE
// =============================================================

'use client'
import { useState, useEffect, useCallback } from 'react'
import {
    Button, Badge, Card, Table, Tr, Td,
    PageHeader, Modal, Input, Select, Alert,
    EmptyState, Spinner,
} from '@/components/ui'
import { CreditCard, Plus, Edit2, Trash2, Users, RefreshCw } from 'lucide-react'

const CLASSES = ['all', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
const TERMS = ['Term 1', 'Term 2', 'Term 3', 'Annual', 'Monthly', 'Quarterly', 'Half Yearly']
const YEARS = ['2024-25', '2025-26', '2026-27']

// ── Types ──────────────────────────────────────────────────
interface FeeStructure {
    _id: string
    name: string
    class: string
    section: string
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
    studentId: any
    structureId: any
    finalAmount: number
    paidAmount: number
    discount: number
    lateFine: number
    dueDate: string
    status: string
    receiptUrl?: string
    receiptNumber?: string
    paidAt?: string
    paymentMode?: string
}

// ── Main Component ─────────────────────────────────────────
export default function FeesClient() {
    const [tab, setTab] = useState<'fees' | 'structures' | 'settings'>('fees')
    const [fees, setFees] = useState<Fee[]>([])
    const [structures, setStructures] = useState<FeeStructure[]>([])
    const [loading, setLoading] = useState(true)
    const [showAdd, setShowAdd] = useState(false)
    const [editItem, setEditItem] = useState<FeeStructure | null>(null)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const [filterStatus, setFilterStatus] = useState('')
    const [filterClass, setFilterClass] = useState('')

    // Fee summary stats
    const totalDue = fees.filter(f => f.status === 'pending').reduce((s, f) => s + f.finalAmount, 0)
    const totalPaid = fees.filter(f => f.status === 'paid').reduce((s, f) => s + f.paidAmount, 0)
    const overdueCount = fees.filter(f => f.status === 'pending' && new Date(f.dueDate) < new Date()).length

    const fetchFees = useCallback(async () => {
        setLoading(true)
        const params = new URLSearchParams()
        if (filterStatus) params.set('status', filterStatus)
        if (filterClass) params.set('class', filterClass)
        const res = await fetch(`/api/fees?${params}`)
        const data = await res.json()
        setFees(data.fees ?? [])
        setLoading(false)
    }, [filterStatus, filterClass])

    const fetchStructures = useCallback(async () => {
        setLoading(true)
        const res = await fetch('/api/fees/structure')
        const data = await res.json()
        setStructures(data.structures ?? [])
        setLoading(false)
    }, [])

    useEffect(() => {
        if (tab === 'fees') fetchFees()
        if (tab === 'structures') fetchStructures()
        if (tab === 'settings') setLoading(false)
    }, [tab, fetchFees, fetchStructures])

    const deleteStructure = async (id: string) => {
        if (!confirm('Yeh fee structure deactivate karna chahte hain?')) return
        await fetch(`/api/fees/structure/${id}`, { method: 'DELETE' })
        setAlert({ type: 'success', msg: 'Structure deactivated' })
        fetchStructures()
    }

    const applyLateFine = async (id: string) => {
        const res = await fetch(`/api/fees/structure/${id}/late-fine`, { method: 'POST' })
        const data = await res.json()
        setAlert({ type: 'success', msg: `Late fine applied to ${data.updated} fees` })
        fetchFees()
    }

    const assignToAll = async (id: string) => {
        const res = await fetch(`/api/fees/structure/${id}/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assignAll: true }),
        })
        const data = await res.json()
        setAlert({ type: 'success', msg: `${data.created} new fees assigned (${data.skipped} already had it)` })
        fetchStructures()
    }

    const markPaid = async (feeId: string) => {
        await fetch(`/api/fees/${feeId}/mark-paid`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentMode: 'cash' }),
        })
        setAlert({ type: 'success', msg: 'Fee marked as paid (Cash)' })
        fetchFees()
    }

    const statusBadge = (fee: Fee) => {
        if (fee.status === 'paid') return <Badge variant="success">Paid</Badge>
        if (fee.status === 'waived') return <Badge variant="default">Waived</Badge>
        if (new Date(fee.dueDate) < new Date()) return <Badge variant="danger">Overdue</Badge>
        return <Badge variant="warning">Pending</Badge>
    }

    return (
        <div>
            <PageHeader
                title="Fee Management"
                subtitle="School fees manage karein"
                action={
                    <div className="flex gap-2">
                        {tab === 'structures' && (
                            <Button size="sm" onClick={() => { setEditItem(null); setShowAdd(true) }}>
                                <Plus size={14} /> New Structure
                            </Button>
                        )}
                    </div>
                }
            />

            {alert && (
                <div className="mb-4">
                    <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
                </div>
            )}

            {/* Summary stats — top */}
            {tab === 'fees' && !loading && (
                <div className="grid grid-cols-4 gap-3 mb-4">
                    {[
                        { label: 'Total Due', val: `₹${totalDue.toLocaleString('en-IN')}`, color: 'bg-red-50 text-red-700' },
                        { label: 'Total Paid', val: `₹${totalPaid.toLocaleString('en-IN')}`, color: 'bg-emerald-50 text-emerald-700' },
                        { label: 'Overdue', val: overdueCount, color: 'bg-amber-50 text-amber-700' },
                        { label: 'Total Records', val: fees.length, color: 'bg-slate-50 text-slate-700' },
                    ].map(s => (
                        <div key={s.label} className={`${s.color} rounded-xl p-4`}>
                            <p className="text-xl font-bold">{s.val}</p>
                            <p className="text-xs opacity-70 mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit mb-4">
                {(['fees', 'structures', 'settings'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-1.5 text-sm rounded-md transition-colors capitalize ${tab === t ? 'bg-white text-slate-800 font-medium shadow-sm' : 'text-slate-500'
                            }`}
                    >
                        {t === 'fees' ? '💰 Student Fees' : t === 'structures' ? '📋 Fee Structures' : '⚙️ Payment Settings'}
                    </button>
                ))}
            </div>

            {/* ── STUDENT FEES TAB ── */}
            {tab === 'fees' && (
                <>
                    <Card className="mb-4">
                        <div className="flex flex-wrap gap-3">
                            <Select
                                options={[
                                    { value: '', label: 'All Status' },
                                    { value: 'pending', label: 'Pending' },
                                    { value: 'paid', label: 'Paid' },
                                    { value: 'partial', label: 'Partial' },
                                ]}
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                                className="w-40"
                            />
                            <Select
                                options={[
                                    { value: '', label: 'All Classes' },
                                    ...['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(c => ({ value: c, label: `Class ${c}` })),
                                ]}
                                value={filterClass}
                                onChange={e => setFilterClass(e.target.value)}
                                className="w-40"
                            />
                        </div>
                    </Card>

                    <Card padding={false}>
                        {loading ? (
                            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
                        ) : fees.length === 0 ? (
                            <EmptyState
                                icon={<CreditCard size={24} />}
                                title="Koi fee record nahi"
                                description="Pehle fee structure banao, phir students ko assign hoga"
                                action={<Button size="sm" onClick={() => setTab('structures')}>Create Fee Structure</Button>}
                            />
                        ) : (
                            <Table headers={['Student', 'Fee', 'Amount', 'Due Date', 'Status', 'Actions']}>
                                {fees.map(f => {
                                    const student = f.studentId as any
                                    const structure = f.structureId as any
                                    const isOverdue = f.status === 'pending' && new Date(f.dueDate) < new Date()
                                    const daysOverdue = isOverdue
                                        ? Math.floor((Date.now() - new Date(f.dueDate).getTime()) / 86400000)
                                        : 0

                                    return (
                                        <Tr key={f._id}>
                                            <Td>
                                                <p className="text-sm font-medium text-slate-700">
                                                    {student?.userId?.name ?? 'N/A'}
                                                </p>
                                                <p className="text-xs text-slate-400 font-mono">
                                                    {student?.admissionNo} · Class {student?.class}-{student?.section}
                                                </p>
                                            </Td>
                                            <Td className="text-sm text-slate-600">{structure?.name}</Td>
                                            <Td>
                                                <p className="text-sm font-semibold text-slate-700">
                                                    ₹{f.finalAmount.toLocaleString('en-IN')}
                                                </p>
                                                {f.discount > 0 && (
                                                    <p className="text-xs text-emerald-600">Discount: ₹{f.discount}</p>
                                                )}
                                                {f.lateFine > 0 && (
                                                    <p className="text-xs text-red-500">Fine: +₹{f.lateFine}</p>
                                                )}
                                            </Td>
                                            <Td>
                                                <p className="text-sm text-slate-600">
                                                    {new Date(f.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                </p>
                                                {isOverdue && (
                                                    <p className="text-xs text-red-500">{daysOverdue}d overdue</p>
                                                )}
                                            </Td>
                                            <Td>{statusBadge(f)}</Td>
                                            <Td>
                                                <div className="flex gap-1 flex-wrap">
                                                    {f.status === 'pending' && (
                                                        <Button size="sm" variant="secondary" onClick={() => markPaid(f._id)}>
                                                            Cash Paid
                                                        </Button>
                                                    )}
                                                    {f.receiptUrl && (
                                                        <a href={f.receiptUrl} target="_blank" rel="noreferrer"
                                                            className="text-xs text-indigo-600 hover:underline px-2 py-1">
                                                            Receipt
                                                        </a>
                                                    )}
                                                </div>
                                            </Td>
                                        </Tr>
                                    )
                                })}
                            </Table>
                        )}
                    </Card>
                </>
            )}

            {/* ── FEE STRUCTURES TAB ── */}
            {tab === 'structures' && (
                <Card padding={false}>
                    {loading ? (
                        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
                    ) : structures.length === 0 ? (
                        <EmptyState
                            icon={<CreditCard size={24} />}
                            title="Koi fee structure nahi"
                            description="Fee structure banao — class-wise fees define karein"
                            action={
                                <Button size="sm" onClick={() => { setEditItem(null); setShowAdd(true) }}>
                                    Create First Structure
                                </Button>
                            }
                        />
                    ) : (
                        <Table headers={['Name', 'Class', 'Term', 'Amount', 'Due Date', 'Assigned', 'Actions']}>
                            {structures.map(s => (
                                <Tr key={s._id}>
                                    <Td>
                                        <p className="font-medium text-slate-700">{s.name}</p>
                                        <p className="text-xs text-slate-400">{s.academicYear}</p>
                                    </Td>
                                    <Td>
                                        <Badge variant="purple">
                                            {s.class === 'all' ? 'All Classes' : `Class ${s.class}`}
                                            {s.section && s.section !== 'all' ? ` - ${s.section}` : ''}
                                        </Badge>
                                    </Td>
                                    <Td className="text-sm text-slate-600">{s.term}</Td>
                                    <Td>
                                        <p className="font-semibold text-slate-700">
                                            ₹{s.totalAmount.toLocaleString('en-IN')}
                                        </p>
                                        {s.lateFinePerDay > 0 && (
                                            <p className="text-xs text-amber-600">
                                                +₹{s.lateFinePerDay}/{s.lateFineType === 'percent' ? '%' : 'day'} late
                                            </p>
                                        )}
                                    </Td>
                                    <Td className="text-sm text-slate-500">
                                        {new Date(s.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                                    </Td>
                                    <Td>
                                        <div className="flex items-center gap-1">
                                            <Badge variant={s.assignedCount > 0 ? 'success' : 'default'}>
                                                {s.assignedCount} students
                                            </Badge>
                                        </div>
                                    </Td>
                                    <Td>
                                        <div className="flex gap-1 flex-wrap">
                                            <button
                                                onClick={() => { setEditItem(s); setShowAdd(true) }}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => assignToAll(s._id)}
                                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                                title="Assign to all students in class"
                                            >
                                                <Users size={14} />
                                            </button>
                                            {s.lateFinePerDay > 0 && (
                                                <button
                                                    onClick={() => applyLateFine(s._id)}
                                                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                                    title="Apply late fine now"
                                                >
                                                    <RefreshCw size={14} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteStructure(s._id)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Deactivate"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </Td>
                                </Tr>
                            ))}
                        </Table>
                    )}
                </Card>
            )}

            {/* ── PAYMENT SETTINGS TAB ── */}
            {tab === 'settings' && (
                <PaymentSettingsPanel onAlert={setAlert} />
            )}

            {/* ── Add/Edit Modal ── */}
            <FeeStructureModal
                open={showAdd}
                editItem={editItem}
                onClose={() => { setShowAdd(false); setEditItem(null) }}
                onSuccess={() => {
                    setShowAdd(false)
                    setEditItem(null)
                    fetchStructures()
                    setAlert({ type: 'success', msg: editItem ? 'Structure updated!' : 'Structure created and fees assigned!' })
                }}
            />
        </div>
    )
}


// ── Fee Structure Modal ─────────────────────────────────────
function FeeStructureModal({ open, editItem, onClose, onSuccess }: {
    open: boolean; editItem: FeeStructure | null;
    onClose: () => void; onSuccess: () => void
}) {
    const defaultForm = {
        name: '', class: '', section: 'all',
        academicYear: '2025-26', term: 'Term 1',
        dueDate: '', lateFinePerDay: 0, lateFineType: 'fixed', maxLateFine: 0,
        autoAssign: true,
        items: [{ label: 'Tuition Fee', amount: 0, isOptional: false }],
    }

    const [form, setForm] = useState(defaultForm)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (editItem) {
            setForm({
                name: editItem.name,
                class: editItem.class,
                section: editItem.section || 'all',
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
            setForm(defaultForm)
        }
    }, [editItem])

    const totalAmount = form.items.reduce((s, i) => s + Number(i.amount), 0)

    const addItem = () =>
        setForm(f => ({ ...f, items: [...f.items, { label: '', amount: 0, isOptional: false }] }))

    const updateItem = (idx: number, k: string, v: any) =>
        setForm(f => ({
            ...f,
            items: f.items.map((item, i) => i === idx ? { ...item, [k]: v } : item),
        }))

    const removeItem = (idx: number) =>
        setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.class) { setError('Class select karo'); return }
        if (!form.dueDate) { setError('Due date set karo'); return }

        setLoading(true)
        setError('')

        const url = editItem ? `/api/fees/structure/${editItem._id}` : '/api/fees/structure'
        const method = editItem ? 'PUT' : 'POST'

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...form, totalAmount }),
        })
        const data = await res.json()
        setLoading(false)
        if (!res.ok) { setError(data.error ?? 'Error'); return }
        onSuccess()
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={editItem ? `Edit: ${editItem.name}` : 'Create Fee Structure'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Fee Name *"
                        placeholder="Term 1 Fee 2025-26"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        required
                    />
                    <Select
                        label="Academic Year *"
                        options={YEARS.map(y => ({ value: y, label: y }))}
                        value={form.academicYear}
                        onChange={e => setForm(f => ({ ...f, academicYear: e.target.value }))}
                    />
                    <Select
                        label="Term *"
                        options={TERMS.map(t => ({ value: t, label: t }))}
                        value={form.term}
                        onChange={e => setForm(f => ({ ...f, term: e.target.value }))}
                    />
                    <Select
                        label="For Class *"
                        options={CLASSES.map(c => ({ value: c, label: c === 'all' ? 'All Classes' : `Class ${c}` }))}
                        value={form.class}
                        onChange={e => setForm(f => ({ ...f, class: e.target.value }))}
                    />
                    <Select
                        label="Section"
                        options={[
                            { value: 'all', label: 'All Sections' },
                            ...['A', 'B', 'C', 'D'].map(s => ({ value: s, label: `Section ${s}` })),
                        ]}
                        value={form.section}
                        onChange={e => setForm(f => ({ ...f, section: e.target.value }))}
                    />
                    <Input
                        label="Due Date *"
                        type="date"
                        value={form.dueDate}
                        onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                        required
                    />
                </div>

                {/* Late fine settings */}
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <p className="text-sm font-semibold text-amber-800 mb-3">Late Fine Settings</p>
                    <div className="grid grid-cols-3 gap-3">
                        <Input
                            label="Fine per day"
                            type="number"
                            placeholder="10"
                            value={form.lateFinePerDay || ''}
                            onChange={e => setForm(f => ({ ...f, lateFinePerDay: Number(e.target.value) }))}
                            helper="0 = no late fine"
                        />
                        <Select
                            label="Fine type"
                            options={[
                                { value: 'fixed', label: '₹ Fixed amount' },
                                { value: 'percent', label: '% Percentage' },
                            ]}
                            value={form.lateFineType}
                            onChange={e => setForm(f => ({ ...f, lateFineType: e.target.value }))}
                        />
                        <Input
                            label="Max fine cap (₹)"
                            type="number"
                            placeholder="500"
                            value={form.maxLateFine || ''}
                            onChange={e => setForm(f => ({ ...f, maxLateFine: Number(e.target.value) }))}
                            helper="0 = no cap"
                        />
                    </div>
                </div>

                {/* Fee items */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-slate-600">Fee Items *</p>
                        <button type="button" onClick={addItem} className="text-xs text-indigo-600 hover:underline">
                            + Add Item
                        </button>
                    </div>
                    <div className="space-y-2">
                        {form.items.map((item, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                                <input
                                    className="flex-1 h-9 px-3 text-sm rounded-lg border border-slate-200"
                                    placeholder="Fee label (e.g., Tuition Fee)"
                                    value={item.label}
                                    onChange={e => updateItem(idx, 'label', e.target.value)}
                                    required
                                />
                                <input
                                    className="w-28 h-9 px-3 text-sm rounded-lg border border-slate-200"
                                    type="number"
                                    placeholder="Amount ₹"
                                    value={item.amount || ''}
                                    onChange={e => updateItem(idx, 'amount', Number(e.target.value))}
                                    required
                                />
                                <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={item.isOptional}
                                        onChange={e => updateItem(idx, 'isOptional', e.target.checked)}
                                        className="rounded"
                                    />
                                    Optional
                                </label>
                                {form.items.length > 1 && (
                                    <button type="button" onClick={() => removeItem(idx)}
                                        className="text-red-400 hover:text-red-600 text-lg leading-none flex-shrink-0">
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-500">Total:</span>
                        <span className="text-sm font-bold text-slate-700">
                            ₹{totalAmount.toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>

                {/* Auto assign toggle */}
                {!editItem && (
                    <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div
                            className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${form.autoAssign ? 'bg-indigo-600' : 'bg-slate-300'}`}
                            onClick={() => setForm(f => ({ ...f, autoAssign: !f.autoAssign }))}
                        >
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.autoAssign ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-700">Auto-assign to existing students</p>
                            <p className="text-xs text-slate-400">Is class ke saare active students ko yeh fee assign hogi</p>
                        </div>
                    </label>
                )}

                {error && <Alert type="error" message={error} />}

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                    <Button type="submit" loading={loading}>
                        {editItem ? 'Update Structure' : 'Create & Assign'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}


// ── Payment Settings Panel ──────────────────────────────────
function PaymentSettingsPanel({ onAlert }: { onAlert: (a: any) => void }) {
    const [settings, setSettings] = useState<any>(null)
    const [form, setForm] = useState({ razorpayKeyId: '', razorpayKeySecret: '', enableOnlinePayment: false })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetch('/api/payment-settings')
            .then(r => r.json())
            .then(d => {
                setSettings(d.settings)
                setForm({
                    razorpayKeyId: d.settings.razorpayKeyId ?? '',
                    razorpayKeySecret: d.settings.hasKey ? '••••••••' : '',
                    enableOnlinePayment: d.settings.enableOnlinePayment ?? false,
                })
                setLoading(false)
            })
    }, [])

    const handleSave = async () => {
        setSaving(true)
        const res = await fetch('/api/payment-settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })
        setSaving(false)
        onAlert(res.ok
            ? { type: 'success', msg: 'Payment settings saved!' }
            : { type: 'error', msg: 'Save failed' }
        )
    }

    if (loading) return <div className="flex justify-center py-8"><Spinner /></div>

    return (
        <Card className="max-w-xl">
            <p className="text-sm font-semibold text-slate-700 mb-1">Online Payment Setup</p>
            <p className="text-xs text-slate-400 mb-4">
                Apna Razorpay account set karo taaki students/parents online fee pay kar sakein.
                Payment aapke school ke Razorpay account mein directly aayegi.
            </p>

            <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                    <div
                        className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${form.enableOnlinePayment ? 'bg-indigo-600' : 'bg-slate-300'}`}
                        onClick={() => setForm(f => ({ ...f, enableOnlinePayment: !f.enableOnlinePayment }))}
                    >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.enableOnlinePayment ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-700">Enable online payment</p>
                        <p className="text-xs text-slate-400">Students/Parents "Pay Online" button dekhenge</p>
                    </div>
                </label>

                {form.enableOnlinePayment && (
                    <>
                        <Input
                            label="Razorpay Key ID"
                            placeholder="rzp_live_xxxxxxxxxx"
                            value={form.razorpayKeyId}
                            onChange={e => setForm(f => ({ ...f, razorpayKeyId: e.target.value }))}
                            helper="Razorpay dashboard → Settings → API Keys"
                        />
                        <Input
                            label="Razorpay Key Secret"
                            type="password"
                            placeholder={settings?.hasKey ? 'Current key saved (change karne ke liye type karein)' : 'rzp_secret_xxxxxxxxxx'}
                            value={form.razorpayKeySecret.includes('•') ? '' : form.razorpayKeySecret}
                            onChange={e => setForm(f => ({ ...f, razorpayKeySecret: e.target.value }))}
                            helper="Secret key encrypted store hoti hai"
                        />
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
                            <p className="font-medium mb-1">💡 Razorpay account kaise banayein:</p>
                            <ol className="list-decimal list-inside space-y-1 text-blue-600">
                                <li>razorpay.com pe jaayein → Sign Up</li>
                                <li>KYC complete karein (business verification)</li>
                                <li>Settings → API Keys → Live Keys copy karein</li>
                                <li>Yahan paste karein → Save</li>
                            </ol>
                        </div>
                    </>
                )}

                <Button onClick={handleSave} loading={saving}>
                    Save Settings
                </Button>
            </div>
        </Card>
    )
}