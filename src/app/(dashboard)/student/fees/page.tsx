// FILE: src/app/(dashboard)/student/fees/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    CreditCard, CheckCircle, Clock, AlertTriangle,
    Receipt, ChevronDown, ChevronUp, RefreshCw,
    IndianRupee, Calendar, Tag, Sparkles,
} from 'lucide-react'

// ─── Types ───
interface FeeItem {
    _id: string
    structureId: {
        name: string
        items: Array<{ label: string; amount: number; isOptional?: boolean }>
    }
    amount: number
    finalAmount: number
    discount: number
    lateFine: number
    dueDate: string
    status: 'pending' | 'paid' | 'partial' | 'waived'
    paidAmount: number
    paidAt?: string
    receiptNumber?: string
    paymentMode?: string
    payments?: Array<{
        amount: number
        paymentMode: string
        receiptNumber: string
        paidAt: string
    }>
}

declare global {
    interface Window { Razorpay: any }
}

// ─── Status Badge ───
function StatusBadge({ status, dueDate }: { status: string; dueDate: string }) {
    const isOverdue = ['pending', 'partial'].includes(status) && new Date(dueDate) < new Date()

    const config = {
        paid:    { label: 'Paid',    bg: '#DCFCE7', color: '#166534', icon: '✓' },
        partial: { label: 'Partial', bg: '#FEF9C3', color: '#854D0E', icon: '◑' },
        waived:  { label: 'Waived',  bg: '#F1F5F9', color: '#475569', icon: '—' },
        pending: isOverdue
            ? { label: 'Overdue', bg: '#FEE2E2', color: '#991B1B', icon: '!' }
            : { label: 'Pending', bg: '#FFF7ED', color: '#9A3412', icon: '○' },
    }

    const c = config[status as keyof typeof config] || config.pending

    return (
        <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
            style={{ backgroundColor: c.bg, color: c.color }}
        >
            <span>{c.icon}</span>
            {c.label}
        </span>
    )
}

// ─── Main Page ───
export default function StudentFeesPage() {
    const [fees, setFees] = useState<FeeItem[]>([])
    const [summary, setSummary] = useState({ totalDue: 0, totalPaid: 0 })
    const [loading, setLoading] = useState(true)
    const [paying, setPaying] = useState<string | null>(null)
    const [expandedFee, setExpandedFee] = useState<string | null>(null)
    const [alert, setAlert] = useState<{
        type: 'success' | 'error'
        msg: string
    } | null>(null)
    const [successFeeId, setSuccessFeeId] = useState<string | null>(null)

    // ─── Load Razorpay script ───
    useEffect(() => {
        if (document.getElementById('rzp-script')) return
        const s = document.createElement('script')
        s.id = 'rzp-script'
        s.src = 'https://checkout.razorpay.com/v1/checkout.js'
        s.async = true
        document.body.appendChild(s)
    }, [])

    // ─── Fetch fees ───
    const fetchFees = useCallback(async () => {
        setLoading(true)
        try {
            // ✅ Correct API path
            const res = await fetch('/api/students/fees')
            const data = await res.json()
            setFees(data.fees ?? [])
            setSummary(data.summary ?? { totalDue: 0, totalPaid: 0 })
        } catch {
            setAlert({ type: 'error', msg: 'Fees load nahi hui. Refresh karein.' })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchFees() }, [fetchFees])

    // ─── Pay online ───
    const payOnline = async (fee: FeeItem) => {
        setPaying(fee._id)
        setAlert(null)

        try {
            // Step 1: Create order
            const res = await fetch('/api/students/fees/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feeId: fee._id }),
            })

            let orderData: any = {}
            const text = await res.text()
            if (text) orderData = JSON.parse(text)

            if (!res.ok) {
                setAlert({ type: 'error', msg: orderData.error || 'Payment start nahi hua' })
                setPaying(null)
                return
            }

            // Step 2: Open Razorpay
            if (!window.Razorpay) {
                setAlert({ type: 'error', msg: 'Payment gateway load nahi hua. Page refresh karein.' })
                setPaying(null)
                return
            }

            const rzp = new window.Razorpay({
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency || 'INR',
                name: orderData.name || 'School Fee',
                description: `Fee: ${fee.structureId?.name || 'Payment'}`,
                order_id: orderData.orderId,
                theme: { color: '#4F46E5' },

                // ✅ Step 3: Verify on success
                handler: async (response: {
                    razorpay_payment_id: string
                    razorpay_order_id: string
                    razorpay_signature: string
                }) => {
                    try {
                        const verifyRes = await fetch('/api/students/fees/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                feeId: fee._id,
                                amount: fee.finalAmount - fee.paidAmount,
                            }),
                        })

                        let verifyData: any = {}
                        const vText = await verifyRes.text()
                        if (vText) verifyData = JSON.parse(vText)

                        if (verifyRes.ok && verifyData.success) {
                            setSuccessFeeId(fee._id)
                            setAlert({
                                type: 'success',
                                msg: `✅ Payment successful! Receipt: ${verifyData.receiptNumber}`,
                            })
                            fetchFees()
                        } else {
                            setAlert({
                                type: 'error',
                                msg: `Payment verify nahi hua: ${verifyData.error || 'Unknown error'}`,
                            })
                        }
                    } catch {
                        // Webhook fallback
                        setAlert({
                            type: 'success',
                            msg: '✅ Payment ho gayi! Kuch seconds mein update hoga.',
                        })
                        setTimeout(fetchFees, 3000)
                    } finally {
                        setPaying(null)
                    }
                },

                modal: {
                    ondismiss: () => setPaying(null),
                    escape: true,
                },
            })

            rzp.on('payment.failed', (r: any) => {
                setAlert({ type: 'error', msg: `Payment failed: ${r.error.description}` })
                setPaying(null)
            })

            rzp.open()

        } catch (err: any) {
            setAlert({ type: 'error', msg: err.message || 'Kuch galat hua' })
            setPaying(null)
        }
    }

    const isOverdue = (f: FeeItem) =>
        ['pending', 'partial'].includes(f.status) && new Date(f.dueDate) < new Date()

    const daysOverdue = (dueDate: string) =>
        Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000)

    const remaining = (f: FeeItem) => f.finalAmount - f.paidAmount

    // ─── Stats ───
    const pendingCount = fees.filter(f => ['pending', 'partial'].includes(f.status)).length
    const overdueCount = fees.filter(f => isOverdue(f)).length

    return (
        <div className="space-y-5 pb-8 max-w-2xl mx-auto">

            {/* ─── Header ─── */}
            <div>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>
                            Fee Payments
                        </h1>
                        <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>
                            Apni fees dekho aur online pay karo
                        </p>
                    </div>
                    <button
                        onClick={fetchFees}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                        style={{ border: '1.5px solid #E2E8F0', color: '#94A3B8' }}
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* ─── Alert ─── */}
            {alert && (
                <div
                    className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
                    style={{
                        backgroundColor: alert.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                        border: `1px solid ${alert.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
                        color: alert.type === 'success' ? '#065F46' : '#991B1B',
                    }}
                >
                    <span>{alert.type === 'success' ? '✅' : '❌'}</span>
                    <p className="flex-1">{alert.msg}</p>
                    <button
                        onClick={() => setAlert(null)}
                        className="text-xs opacity-60 hover:opacity-100"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* ─── Summary Cards ─── */}
            {!loading && (
                <div className="grid grid-cols-2 gap-3">
                    <div
                        className="rounded-2xl p-4"
                        style={{
                            background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
                            border: '1px solid #FECACA',
                        }}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle size={14} style={{ color: '#DC2626' }} />
                            <span className="text-xs font-semibold" style={{ color: '#DC2626' }}>
                                Total Due
                            </span>
                        </div>
                        <p className="text-2xl font-extrabold" style={{ color: '#991B1B' }}>
                            ₹{summary.totalDue.toLocaleString('en-IN')}
                        </p>
                        {overdueCount > 0 && (
                            <p className="text-[11px] mt-1" style={{ color: '#DC2626' }}>
                                {overdueCount} overdue
                            </p>
                        )}
                    </div>
                    <div
                        className="rounded-2xl p-4"
                        style={{
                            background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
                            border: '1px solid #A7F3D0',
                        }}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle size={14} style={{ color: '#059669' }} />
                            <span className="text-xs font-semibold" style={{ color: '#059669' }}>
                                Total Paid
                            </span>
                        </div>
                        <p className="text-2xl font-extrabold" style={{ color: '#065F46' }}>
                            ₹{summary.totalPaid.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[11px] mt-1" style={{ color: '#059669' }}>
                            {fees.filter(f => f.status === 'paid').length} fees cleared
                        </p>
                    </div>
                </div>
            )}

            {/* ─── Fees List ─── */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div
                        className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                        style={{ borderColor: '#E2E8F0', borderTopColor: '#4F46E5' }}
                    />
                    <p className="text-sm" style={{ color: '#94A3B8' }}>Loading fees...</p>
                </div>
            ) : fees.length === 0 ? (
                <div
                    className="text-center py-16 rounded-2xl"
                    style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                >
                    <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                        style={{ backgroundColor: '#EEF2FF' }}
                    >
                        <CreditCard size={24} style={{ color: '#6366F1' }} />
                    </div>
                    <p className="font-semibold" style={{ color: '#0F172A' }}>
                        Koi fee nahi
                    </p>
                    <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
                        Abhi koi fee assign nahi ki gayi
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {fees.map(fee => {
                        const overdue = isOverdue(fee)
                        const isExpanded = expandedFee === fee._id
                        const isSuccess = successFeeId === fee._id
                        const rem = remaining(fee)
                        const isPaying = paying === fee._id
                        const canPay = ['pending', 'partial'].includes(fee.status)

                        return (
                            <div
                                key={fee._id}
                                className="rounded-2xl overflow-hidden transition-all"
                                style={{
                                    border: isSuccess
                                        ? '2px solid #10B981'
                                        : overdue
                                            ? '1.5px solid #FCA5A5'
                                            : '1.5px solid #E2E8F0',
                                    backgroundColor: '#FFFFFF',
                                    boxShadow: isSuccess
                                        ? '0 4px 20px rgba(16,185,129,0.15)'
                                        : '0 1px 4px rgba(0,0,0,0.04)',
                                }}
                            >
                                {/* ── Success top bar ── */}
                                {isSuccess && (
                                    <div
                                        className="h-1"
                                        style={{ background: 'linear-gradient(90deg, #059669, #10B981)' }}
                                    />
                                )}

                                {/* ── Overdue top bar ── */}
                                {overdue && !isSuccess && (
                                    <div className="h-1" style={{ backgroundColor: '#EF4444' }} />
                                )}

                                {/* ── Main content ── */}
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            {/* Status + Name */}
                                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                                <StatusBadge
                                                    status={fee.status}
                                                    dueDate={fee.dueDate}
                                                />
                                                {overdue && (
                                                    <span
                                                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                                        style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
                                                    >
                                                        {daysOverdue(fee.dueDate)}d overdue
                                                    </span>
                                                )}
                                            </div>

                                            <p
                                                className="font-bold text-base truncate"
                                                style={{ color: '#0F172A' }}
                                            >
                                                {fee.structureId?.name ?? 'Fee'}
                                            </p>

                                            {/* Due date */}
                                            <div
                                                className="flex items-center gap-1.5 mt-1"
                                                style={{ color: overdue ? '#DC2626' : '#94A3B8' }}
                                            >
                                                <Calendar size={11} />
                                                <span className="text-xs">
                                                    Due:{' '}
                                                    {new Date(fee.dueDate).toLocaleDateString('en-IN', {
                                                        day: 'numeric', month: 'short', year: 'numeric',
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Amount + Pay button */}
                                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                            <div className="text-right">
                                                <p
                                                    className="text-xl font-black tabular-nums"
                                                    style={{ color: canPay ? '#DC2626' : '#059669' }}
                                                >
                                                    ₹{(canPay ? rem : fee.paidAmount).toLocaleString('en-IN')}
                                                </p>
                                                <p className="text-[10px]" style={{ color: '#94A3B8' }}>
                                                    {canPay ? 'remaining' : 'paid'}
                                                </p>
                                            </div>

                                            {canPay && (
                                                <button
                                                    onClick={() => payOnline(fee)}
                                                    disabled={isPaying}
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.97] disabled:opacity-60"
                                                    style={{
                                                        background: isPaying
                                                            ? '#E0E7FF'
                                                            : 'linear-gradient(135deg, #4F46E5, #6366F1)',
                                                        color: '#FFFFFF',
                                                        boxShadow: isPaying ? 'none' : '0 2px 8px rgba(79,70,229,0.4)',
                                                    }}
                                                >
                                                    {isPaying ? (
                                                        <>
                                                            <div
                                                                className="w-3 h-3 rounded-full border border-t-transparent animate-spin"
                                                                style={{ borderColor: '#6366F1', borderTopColor: 'transparent' }}
                                                            />
                                                            <span style={{ color: '#4F46E5' }}>Opening...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CreditCard size={11} />
                                                            Pay Now
                                                        </>
                                                    )}
                                                </button>
                                            )}

                                            {/* Receipt number */}
                                            {fee.receiptNumber && (
                                                <div
                                                    className="flex items-center gap-1 px-2 py-1 rounded-lg"
                                                    style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                                                >
                                                    <Receipt size={10} style={{ color: '#94A3B8' }} />
                                                    <span className="text-[10px] font-mono" style={{ color: '#64748B' }}>
                                                        {fee.receiptNumber}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* ── Partial progress bar ── */}
                                    {fee.status === 'partial' && (
                                        <div className="mt-3">
                                            <div className="flex justify-between text-[11px] mb-1">
                                                <span style={{ color: '#059669' }}>
                                                    Paid: ₹{fee.paidAmount.toLocaleString('en-IN')}
                                                </span>
                                                <span style={{ color: '#DC2626' }}>
                                                    Remaining: ₹{rem.toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                            <div
                                                className="h-2 rounded-full overflow-hidden"
                                                style={{ backgroundColor: '#E2E8F0' }}
                                            >
                                                <div
                                                    className="h-full rounded-full transition-all"
                                                    style={{
                                                        width: `${Math.min(100, (fee.paidAmount / fee.finalAmount) * 100)}%`,
                                                        background: 'linear-gradient(90deg, #059669, #10B981)',
                                                    }}
                                                />
                                            </div>
                                            <p className="text-[10px] mt-0.5 text-right" style={{ color: '#94A3B8' }}>
                                                {Math.round((fee.paidAmount / fee.finalAmount) * 100)}% paid
                                            </p>
                                        </div>
                                    )}

                                    {/* ── Expand toggle ── */}
                                    <button
                                        onClick={() => setExpandedFee(isExpanded ? null : fee._id)}
                                        className="flex items-center gap-1 mt-3 text-[11px] font-medium transition-colors"
                                        style={{ color: '#94A3B8' }}
                                    >
                                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                        {isExpanded ? 'Less details' : 'View details'}
                                    </button>
                                </div>

                                {/* ── Expanded details ── */}
                                {isExpanded && (
                                    <div
                                        className="px-4 pb-4"
                                        style={{ borderTop: '1px solid #F1F5F9' }}
                                    >
                                        {/* Fee breakdown */}
                                        <p
                                            className="text-[9px] font-bold uppercase tracking-wider mt-3 mb-2"
                                            style={{ color: '#94A3B8' }}
                                        >
                                            Fee Breakdown
                                        </p>
                                        <div className="space-y-1.5">
                                            {(fee.structureId?.items ?? []).map((item, i) => (
                                                <div
                                                    key={i}
                                                    className="flex justify-between items-center px-3 py-1.5 rounded-lg"
                                                    style={{ backgroundColor: '#F8FAFC' }}
                                                >
                                                    <div className="flex items-center gap-1.5">
                                                        <Tag size={10} style={{ color: '#94A3B8' }} />
                                                        <span className="text-xs" style={{ color: '#475569' }}>
                                                            {item.label}
                                                        </span>
                                                        {item.isOptional && (
                                                            <span
                                                                className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                                                                style={{ backgroundColor: '#FEF9C3', color: '#854D0E' }}
                                                            >
                                                                Optional
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs font-semibold font-mono" style={{ color: '#1E293B' }}>
                                                        ₹{Number(item.amount).toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                            ))}

                                            {fee.discount > 0 && (
                                                <div className="flex justify-between px-3 py-1.5 text-xs">
                                                    <span style={{ color: '#059669' }}>Discount</span>
                                                    <span className="font-semibold font-mono" style={{ color: '#059669' }}>
                                                        -₹{fee.discount.toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                            )}

                                            {fee.lateFine > 0 && (
                                                <div className="flex justify-between px-3 py-1.5 text-xs">
                                                    <span style={{ color: '#DC2626' }}>Late Fine</span>
                                                    <span className="font-semibold font-mono" style={{ color: '#DC2626' }}>
                                                        +₹{fee.lateFine.toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                            )}

                                            <div
                                                className="flex justify-between px-3 py-2 rounded-lg text-sm font-bold"
                                                style={{ backgroundColor: '#F1F5F9' }}
                                            >
                                                <span style={{ color: '#0F172A' }}>Total</span>
                                                <span className="font-mono" style={{ color: '#0F172A' }}>
                                                    ₹{fee.finalAmount.toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Payment history */}
                                        {fee.payments && fee.payments.length > 0 && (
                                            <>
                                                <p
                                                    className="text-[9px] font-bold uppercase tracking-wider mt-4 mb-2"
                                                    style={{ color: '#94A3B8' }}
                                                >
                                                    Payment History
                                                </p>
                                                <div className="space-y-1.5">
                                                    {fee.payments.map((p, i) => (
                                                        <div
                                                            key={i}
                                                            className="flex justify-between items-center px-3 py-2 rounded-lg text-xs"
                                                            style={{
                                                                backgroundColor: '#ECFDF5',
                                                                border: '1px solid #D1FAE5',
                                                            }}
                                                        >
                                                            <div>
                                                                <span
                                                                    className="font-mono font-semibold"
                                                                    style={{ color: '#065F46' }}
                                                                >
                                                                    {p.receiptNumber}
                                                                </span>
                                                                <span className="ml-2" style={{ color: '#94A3B8' }}>
                                                                    {new Date(p.paidAt).toLocaleDateString('en-IN', {
                                                                        day: '2-digit', month: 'short', year: 'numeric',
                                                                    })}
                                                                </span>
                                                                <span
                                                                    className="ml-2 capitalize"
                                                                    style={{ color: '#94A3B8' }}
                                                                >
                                                                    · {p.paymentMode}
                                                                </span>
                                                            </div>
                                                            <span
                                                                className="font-bold font-mono"
                                                                style={{ color: '#059669' }}
                                                            >
                                                                ₹{p.amount.toLocaleString('en-IN')}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}

                                        {/* Paid info */}
                                        {fee.status === 'paid' && fee.paidAt && (
                                            <div
                                                className="flex items-center gap-2 mt-3 px-3 py-2.5 rounded-xl text-xs"
                                                style={{
                                                    backgroundColor: '#ECFDF5',
                                                    border: '1px solid #A7F3D0',
                                                }}
                                            >
                                                <CheckCircle size={14} style={{ color: '#059669' }} />
                                                <div>
                                                    <span className="font-semibold" style={{ color: '#065F46' }}>
                                                        Paid on{' '}
                                                        {new Date(fee.paidAt).toLocaleDateString('en-IN', {
                                                            day: 'numeric', month: 'long', year: 'numeric',
                                                        })}
                                                    </span>
                                                    {fee.paymentMode && (
                                                        <span style={{ color: '#059669' }}>
                                                            {' '}via <span className="capitalize">{fee.paymentMode}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}