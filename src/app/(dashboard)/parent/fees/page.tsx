// -------------------------------------------------------------
// FILE: src/app/(dashboard)/student/fees/page.tsx — COMPLETE REWRITE
// Full fee payment flow with Razorpay
// Parent page bhi exactly same hogi — copy karke src/app/(dashboard)/parent/fees/page.tsx
// -------------------------------------------------------------

'use client'
import { useState, useEffect, useCallback } from 'react'
import {
    Card, PageHeader, Badge, Button, Spinner, EmptyState, Alert,
} from '@/components/ui'
import { CreditCard, ExternalLink } from 'lucide-react'

interface FeeItem {
    _id: string
    structureId: { name: string; items: Array<{ label: string; amount: number }> }
    amount: number
    finalAmount: number
    discount: number
    lateFine: number
    dueDate: string
    status: 'pending' | 'paid' | 'partial' | 'waived'
    paidAmount: number
    paidAt?: string
    receiptUrl?: string
    receiptNumber?: string
    paymentMode?: string
    razorpayPaymentId?: string
}

declare global { interface Window { Razorpay: any } }

export default function StudentFeesPage() {
    const [fees, setFees] = useState<FeeItem[]>([])
    const [summary, setSummary] = useState({ totalDue: 0, totalPaid: 0 })
    const [loading, setLoading] = useState(true)
    const [paying, setPaying] = useState<string | null>(null)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

    const fetchFees = useCallback(async () => {
        setLoading(true)
        const res = await fetch('/api/students/fees')
        const data = await res.json()
        setFees(data.fees ?? [])
        setSummary(data.summary ?? { totalDue: 0, totalPaid: 0 })
        setLoading(false)
    }, [])

    useEffect(() => {
        fetchFees()
        // Load Razorpay script
        if (!document.getElementById('rzp-script')) {
            const s = document.createElement('script')
            s.id = 'rzp-script'
            s.src = 'https://checkout.razorpay.com/v1/checkout.js'
            s.async = true
            document.body.appendChild(s)
        }
    }, [fetchFees])

    const payOnline = async (feeId: string, amount: number) => {
        setPaying(feeId)
        setAlert(null)

        try {
            // Create order
            const res = await fetch('/api/student/fees/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feeId }),
            })
            const order = await res.json()
            if (!res.ok) throw new Error(order.error)

            // Open Razorpay checkout
            const rzp = new window.Razorpay({
                key: order.keyId,
                amount: order.amount,
                currency: order.currency,
                name: order.name ?? 'School Fee',
                description: 'Fee Payment',
                order_id: order.orderId,

                handler: async (response: any) => {
                    // Webhook automatically handles backend update
                    // But show success immediately (optimistic)
                    setAlert({
                        type: 'success',
                        msg: '✅ Payment successful! Receipt SMS pe bheja jayega. Page refresh ho raha hai...',
                    })
                    // Wait 3 seconds for webhook to process, then refresh
                    setTimeout(() => {
                        fetchFees()
                        setPaying(null)
                    }, 3000)
                },

                prefill: {},
                theme: { color: '#4F46E5' },
                modal: {
                    ondismiss: () => setPaying(null),
                },
            })

            rzp.open()

        } catch (err: any) {
            setAlert({ type: 'error', msg: err.message })
            setPaying(null)
        }
    }

    const isOverdue = (dueDate: string) => new Date(dueDate) < new Date()

    const overdayCount = (dueDate: string) =>
        Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000)

    return (
        <div className="space-y-4">
            <PageHeader title="Fee Payments" subtitle="Apni fees dekho aur online pay karo" />

            {alert && (
                <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
            )}

            {/* Summary */}
            {!loading && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                        <p className="text-2xl font-bold text-red-700">
                            ₹{summary.totalDue.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-red-500 mt-1">Total Due</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                        <p className="text-2xl font-bold text-emerald-700">
                            ₹{summary.totalPaid.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-emerald-500 mt-1">Total Paid</p>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-12"><Spinner size="lg" /></div>
            ) : fees.length === 0 ? (
                <EmptyState
                    icon={<CreditCard size={24} />}
                    title="Koi fee nahi"
                    description="Abhi koi fee assign nahi ki gayi"
                />
            ) : (
                <div className="space-y-3">
                    {fees.map(fee => {
                        const overdue = isOverdue(fee.dueDate) && fee.status === 'pending'
                        const days = overdue ? overdayCount(fee.dueDate) : 0

                        return (
                            <Card key={fee._id}>
                                <div className="flex items-start gap-4">
                                    {/* Fee info */}
                                    <div className="flex-1">
                                        {/* Status + overdue badge */}
                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                            {fee.status === 'paid' && <Badge variant="success">✓ Paid</Badge>}
                                            {fee.status === 'waived' && <Badge variant="default">Waived</Badge>}
                                            {fee.status === 'pending' && !overdue && <Badge variant="warning">Pending</Badge>}
                                            {overdue && <Badge variant="danger">Overdue ({days} days)</Badge>}
                                        </div>

                                        <p className="font-semibold text-slate-800 mb-2">
                                            {(fee.structureId as any)?.name ?? 'Fee'}
                                        </p>

                                        {/* Items breakdown */}
                                        <div className="space-y-0.5">
                                            {((fee.structureId as any)?.items ?? []).map((item: any, i: number) => (
                                                <div key={i} className="flex justify-between text-xs text-slate-500">
                                                    <span>{item.label}</span>
                                                    <span>₹{Number(item.amount).toLocaleString('en-IN')}</span>
                                                </div>
                                            ))}
                                            {fee.discount > 0 && (
                                                <div className="flex justify-between text-xs text-emerald-600">
                                                    <span>Discount</span>
                                                    <span>-₹{fee.discount.toLocaleString('en-IN')}</span>
                                                </div>
                                            )}
                                            {fee.lateFine > 0 && (
                                                <div className="flex justify-between text-xs text-red-500">
                                                    <span>Late fine</span>
                                                    <span>+₹{fee.lateFine.toLocaleString('en-IN')}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-sm font-semibold text-slate-700 pt-1 border-t border-slate-100 mt-1">
                                                <span>Total</span>
                                                <span>₹{fee.finalAmount.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>

                                        {/* Due date */}
                                        <p className={`text-xs mt-2 ${overdue ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                                            Due: {new Date(fee.dueDate).toLocaleDateString('en-IN', {
                                                day: 'numeric', month: 'short', year: 'numeric',
                                            })}
                                        </p>

                                        {/* Paid info */}
                                        {fee.status === 'paid' && (
                                            <div className="mt-2 space-y-0.5">
                                                {fee.paidAt && (
                                                    <p className="text-xs text-emerald-600">
                                                        Paid: {new Date(fee.paidAt).toLocaleDateString('en-IN')}
                                                        {fee.paymentMode && ` via ${fee.paymentMode}`}
                                                    </p>
                                                )}
                                                {fee.receiptNumber && (
                                                    <p className="text-xs text-slate-400">
                                                        Receipt: {fee.receiptNumber}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2 items-end flex-shrink-0">
                                        {fee.status === 'pending' && (
                                            <Button
                                                size="sm"
                                                onClick={() => payOnline(fee._id, fee.finalAmount)}
                                                loading={paying === fee._id}
                                            >
                                                <CreditCard size={12} />
                                                Pay ₹{fee.finalAmount.toLocaleString('en-IN')}
                                            </Button>
                                        )}
                                        {fee.receiptUrl && (
                                            <a
                                                href={fee.receiptUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                                            >
                                                <ExternalLink size={11} />
                                                Receipt
                                            </a>
                                        )}
                                        {!fee.receiptUrl && fee.status === 'paid' && (
                                            <button
                                                onClick={async () => {
                                                    const res = await fetch(`/api/pdf/receipt/${fee._id}`)
                                                    if (res.ok) {
                                                        const d = await res.json()
                                                        if (d.url) window.open(d.url, '_blank')
                                                    }
                                                }}
                                                className="text-xs text-slate-500 hover:text-indigo-600"
                                            >
                                                Gen Receipt
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}