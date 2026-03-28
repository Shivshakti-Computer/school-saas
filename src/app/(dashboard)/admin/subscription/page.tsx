'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Alert, PageHeader, Spinner } from '@/components/ui'
import {
    PLANS, GST_CONFIG,
    getPlan, getPlanPriceBreakdown, getSavings,
    type PlanId, type BillingCycle,
} from '@/lib/plans'
import { clsx } from 'clsx'
import { Portal } from '@/components/ui/Portal'

declare global {
    interface Window { Razorpay: any }
}

const PLAN_ORDER: PlanId[] = ['starter', 'growth', 'pro', 'enterprise']
function getPlanRank(id: PlanId) { return PLAN_ORDER.indexOf(id) }

/* ─── Razorpay SDK Loader ─── */
function loadRazorpaySDK(): Promise<boolean> {
    return new Promise(resolve => {
        if (typeof window === 'undefined') return resolve(false)
        if (window.Razorpay) return resolve(true)
        const existing = document.querySelector(
            'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
        )
        if (existing) {
            existing.addEventListener('load', () => resolve(true))
            existing.addEventListener('error', () => resolve(false))
            return
        }
        const s = document.createElement('script')
        s.src = 'https://checkout.razorpay.com/v1/checkout.js'
        s.async = true
        s.onload = () => resolve(true)
        s.onerror = () => resolve(false)
        document.body.appendChild(s)
    })
}

/* ─── Date Formatter ─── */
function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
    })
}

/* ─── Price Display ─── */
function PriceDisplay({ planId, cycle }: { planId: PlanId; cycle: BillingCycle }) {
    const [open, setOpen] = useState(false)
    const bd = getPlanPriceBreakdown(planId, cycle)
    const plan = getPlan(planId)
    const saved = getSavings(planId)

    return (
        <div>
            <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                    ₹{bd.totalAmount.toLocaleString('en-IN')}
                </span>
                <span className="text-sm text-slate-500">
                    /{cycle === 'monthly' ? 'mo' : 'yr'}
                </span>
            </div>

            {GST_CONFIG.enabled && (
                <div className="mb-1.5">
                    <button
                        onClick={() => setOpen(!open)}
                        className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                    >
                        Base ₹{bd.baseAmount.toLocaleString('en-IN')} + ₹{bd.gstAmount.toLocaleString('en-IN')} GST
                        <span className="text-[10px]">{open ? '▲' : '▼'}</span>
                    </button>
                    {open && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 mt-1.5 space-y-1">
                            <div className="flex justify-between"><span>Base price</span><span>₹{bd.baseAmount.toLocaleString('en-IN')}</span></div>
                            <div className="flex justify-between"><span>GST (18%)</span><span>₹{bd.gstAmount.toLocaleString('en-IN')}</span></div>
                            <div className="flex justify-between font-semibold text-slate-800 border-t border-slate-200 pt-1.5 mt-1.5">
                                <span>Total payable</span><span>₹{bd.totalAmount.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {cycle === 'yearly' && saved > 0 && (
                <p className="text-xs text-emerald-600 mt-1">
                    ₹{(plan.monthlyPrice * 12).toLocaleString('en-IN')} ki jagah —{' '}
                    <strong>₹{saved.toLocaleString('en-IN')} bachao</strong>
                </p>
            )}
        </div>
    )
}

/* ─── Upgrade Modal ─── */
function UpgradeModal({
    planId, currentPlan, cycle, onPay, onFreeUpgrade, onCancel, paying,
}: {
    planId: PlanId
    currentPlan: PlanId
    cycle: BillingCycle
    onPay: (orderId: string, amount: number) => void
    onFreeUpgrade: () => void
    onCancel: () => void
    paying: boolean
}) {
    const [breakdown, setBreakdown] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [applyingFree, setApplyingFree] = useState(false)
    const busy = paying || applyingFree
    const plan = getPlan(planId)
    const isCycleChange = planId === currentPlan

    useEffect(() => {
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = prev }
    }, [])

    useEffect(() => {
        fetch('/api/subscription/upgrade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPlanId: planId, billingCycle: cycle }),
        })
            .then(r => r.json())
            .then(data => {
                if (data.error) { setError(data.error); setLoading(false); return }
                setBreakdown(data)
                setLoading(false)
            })
            .catch(() => {
                setError('Server error. Please refresh and try again.')
                setLoading(false)
            })
    }, [planId, cycle])

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !busy) onCancel()
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [busy, onCancel])

    return (
        <div
            onClick={e => { if (e.target === e.currentTarget && !busy) onCancel() }}
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 16,
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#fff', borderRadius: 20, padding: 28,
                    width: '100%', maxWidth: 480, maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
                    position: 'relative',
                }}
            >
                <button
                    onClick={() => { if (!busy) onCancel() }}
                    disabled={busy}
                    style={{
                        position: 'absolute', top: 16, right: 16,
                        width: 32, height: 32, borderRadius: '50%',
                        border: '1px solid #E2E8F0', background: '#F8FAFC',
                        cursor: busy ? 'not-allowed' : 'pointer',
                        fontSize: 14, color: '#64748B',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >✕</button>

                {/* ← FIX: Dynamic title for cycle change vs plan upgrade */}
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, paddingRight: 40 }}>
                    {isCycleChange
                        ? `Switch to ${cycle === 'yearly' ? 'Yearly' : 'Monthly'} Billing`
                        : `Upgrade to ${plan.name}`}
                </h3>
                <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>
                    {isCycleChange
                        ? cycle === 'yearly'
                            ? 'Monthly se yearly switch karein — 2 months free!'
                            : 'Billing cycle change ho raha hai'
                        : 'Aapke current plan ke remaining days ka credit automatically milega'}
                </p>

                {loading && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 12 }}>
                        <Spinner size="lg" />
                        <p style={{ fontSize: 13, color: '#94A3B8' }}>Calculating amount...</p>
                    </div>
                )}

                {error && !loading && (
                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
                        <p style={{ color: '#DC2626', fontSize: 14 }}>⚠️ {error}</p>
                    </div>
                )}

                {breakdown && !loading && (
                    <>
                        {breakdown.noPayment ? (
                            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 12, padding: '16px 18px', marginBottom: 24 }}>
                                <p style={{ fontWeight: 600, color: '#065F46', fontSize: 15, marginBottom: 4 }}>✅ Credit enough hai!</p>
                                <p style={{ fontSize: 13, color: '#047857' }}>{breakdown.explanation}</p>
                            </div>
                        ) : (
                            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 18, marginBottom: 20, fontSize: 13 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: '#64748B' }}>
                                    <span>{plan.name} plan ({cycle})</span>
                                    <span style={{ fontWeight: 500, color: '#334155' }}>
                                        ₹{breakdown.breakdown?.newPlanPrice?.toLocaleString('en-IN')}
                                    </span>
                                </div>

                                {breakdown.breakdown?.creditAmount > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, color: '#059669' }}>
                                        <span style={{ lineHeight: 1.6 }}>
                                            Credit — {breakdown.breakdown?.daysRemaining} din bache
                                            <br />
                                            <span style={{ fontSize: 11, opacity: 0.75 }}>
                                                ₹{breakdown.breakdown?.dailyRate}/day × {breakdown.breakdown?.daysRemaining} days
                                            </span>
                                        </span>
                                        <span style={{ fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 12 }}>
                                            − ₹{breakdown.breakdown?.creditAmount?.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                )}

                                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 12, marginTop: 4 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#64748B' }}>
                                        <span>Subtotal</span>
                                        <span>₹{breakdown.breakdown?.subtotal?.toLocaleString('en-IN')}</span>
                                    </div>
                                    {GST_CONFIG.enabled && breakdown.breakdown?.gstAmount > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#64748B' }}>
                                            <span>GST (18%)</span>
                                            <span>₹{breakdown.breakdown?.gstAmount?.toLocaleString('en-IN')}</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18, color: '#0F172A', paddingTop: 6 }}>
                                        <span>Total payable</span>
                                        <span style={{ color: plan.color }}>
                                            ₹{breakdown.breakdown?.totalPayable?.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {breakdown.breakdown?.explanation && (
                            <div style={{ background: '#EFF6FF', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 12, color: '#1E40AF', lineHeight: 1.7, overflowWrap: 'anywhere' }}>
                                💡 {breakdown.breakdown.explanation}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => { if (!busy) onCancel() }}
                                disabled={busy}
                                style={{
                                    flex: 1, padding: 14, borderRadius: 12,
                                    border: '1.5px solid #E2E8F0', background: '#fff',
                                    cursor: busy ? 'not-allowed' : 'pointer',
                                    fontSize: 14, fontWeight: 500, color: '#64748B',
                                    opacity: busy ? 0.5 : 1,
                                }}
                            >Cancel</button>

                            {breakdown.noPayment ? (
                                <button
                                    onClick={() => { setApplyingFree(true); onFreeUpgrade() }}
                                    disabled={applyingFree}
                                    style={{
                                        flex: 2, padding: 14, borderRadius: 12,
                                        background: '#059669', color: '#fff', border: 'none',
                                        cursor: applyingFree ? 'not-allowed' : 'pointer',
                                        fontSize: 15, fontWeight: 600,
                                        opacity: applyingFree ? 0.7 : 1,
                                    }}
                                >{applyingFree ? 'Upgrading…' : isCycleChange ? 'Switch for free →' : 'Upgrade for free →'}</button>
                            ) : (
                                <button
                                    onClick={() => {
                                        if (!breakdown.orderId || paying) return
                                        onPay(breakdown.orderId, breakdown.amount)
                                    }}
                                    disabled={paying || !breakdown.orderId}
                                    style={{
                                        flex: 2, padding: 14, borderRadius: 12,
                                        background: plan.color, color: '#fff', border: 'none',
                                        cursor: paying || !breakdown.orderId ? 'not-allowed' : 'pointer',
                                        fontSize: 15, fontWeight: 600,
                                        opacity: paying ? 0.7 : 1,
                                    }}
                                >
                                    {paying
                                        ? 'Opening payment…'
                                        : `Pay ₹${breakdown.breakdown?.totalPayable?.toLocaleString('en-IN')} →`}
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */
function SubscriptionInner() {
    const searchParams = useSearchParams()
    const highlightPlan = searchParams.get('highlight') as PlanId | null
    const blockedModule = searchParams.get('blocked')

    const [status, setStatus] = useState<any>(null)
    const [cycle, setCycle] = useState<BillingCycle>('monthly')
    const [loading, setLoading] = useState(true)
    const [paying, setPaying] = useState<PlanId | null>(null)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const [success, setSuccess] = useState<{ planName: string } | null>(null)
    const [upgradeModal, setUpgradeModal] = useState<PlanId | null>(null)
    const [cancelConfirm, setCancelConfirm] = useState(false)
    const [cancelling, setCancelling] = useState(false)

    useEffect(() => {
        fetch('/api/subscription/status')
            .then(r => r.json())
            .then(d => { setStatus(d); setLoading(false) })
        loadRazorpaySDK()
    }, [])

    /* ── Razorpay checkout ── */
    const openRazorpay = useCallback(async (
        planId: PlanId, orderId: string, amount: number, isUpgrade = false,
    ) => {
        const loaded = await loadRazorpaySDK()
        if (!loaded) {
            setAlert({ type: 'error', msg: 'Payment system load nahi hua. Please refresh karein.' })
            setPaying(null)
            return
        }
        const plan = getPlan(planId)
        const rzp = new window.Razorpay({
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount, currency: 'INR',
            name: 'Shivshakti School Suite',
            description: isUpgrade ? `Upgrade to ${plan.name}` : `${plan.name} Plan — ${cycle}`,
            order_id: orderId,
            handler: async (res: any) => {
                try {
                    const endpoint = isUpgrade ? '/api/subscription/upgrade/verify' : '/api/subscription/verify'
                    const vRes = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: res.razorpay_order_id,
                            razorpay_payment_id: res.razorpay_payment_id,
                            razorpay_signature: res.razorpay_signature,
                            planId, billingCycle: cycle,
                        }),
                    })
                    const vData = await vRes.json()
                    if (!vRes.ok) throw new Error(vData.error)
                    setUpgradeModal(null)
                    setSuccess({ planName: vData.planName ?? plan.name })
                } catch (err: any) {
                    setAlert({ type: 'error', msg: err.message ?? 'Verification failed' })
                }
                setPaying(null)
            },
            prefill: {},
            theme: { color: plan.color },
            modal: { ondismiss: () => setPaying(null) },
        })
        rzp.open()
    }, [cycle])

    /* ── Fresh subscribe ── */
    const handleFreshSubscribe = async (planId: PlanId) => {
        setPaying(planId)
        setAlert(null)
        try {
            const res = await fetch('/api/subscription/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId, billingCycle: cycle }),
            })
            const order = await res.json()
            if (!res.ok) throw new Error(order.error)
            await openRazorpay(planId, order.orderId, order.amount, false)
        } catch (err: any) {
            setAlert({ type: 'error', msg: err.message })
            setPaying(null)
        }
    }

    /* ── Subscribe handler — handles plan upgrade AND cycle change ── */
    const handleSubscribe = (planId: PlanId) => {
        const cur = status?.plan as PlanId | undefined
        if (status?.isPaid && cur) {
            const diff = getPlanRank(planId) - getPlanRank(cur)
            const curCycle = status?.billingCycle as BillingCycle | null

            if (diff > 0) {
                // Higher plan → upgrade modal
                setUpgradeModal(planId)
            } else if (diff === 0) {
                // Same plan → check cycle
                if (curCycle === cycle) {
                    return // same plan same cycle, do nothing
                }
                if (cycle === 'yearly' && curCycle === 'monthly') {
                    // Monthly → Yearly: allowed
                    setUpgradeModal(planId)
                } else {
                    // Yearly → Monthly: not allowed
                    setAlert({
                        type: 'error',
                        msg: 'Yearly se monthly switch nahi ho sakta. Current period end hone ke baad monthly select karein.',
                    })
                }
            } else {
                // Lower plan
                setAlert({
                    type: 'error',
                    msg: 'Downgrade ke liye support se contact karein. Current plan period end hone ke baad change hoga.',
                })
            }
        } else {
            handleFreshSubscribe(planId)
        }
    }

    /* ── Free upgrade ── */
    const handleFreeUpgrade = (planId: PlanId) => {
        setUpgradeModal(null)
        setSuccess({ planName: getPlan(planId).name })
    }

    /* ── Cancel subscription ── */
    const handleCancel = async () => {
        setCancelling(true)
        setAlert(null)
        try {
            const res = await fetch('/api/subscription/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'User cancelled from dashboard' }),
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Cancel failed')
            }
            // Force re-login to reflect changes
            signOut({ callbackUrl: '/login' })
        } catch (err: any) {
            setAlert({ type: 'error', msg: err.message })
            setCancelling(false)
        }
    }

    /* ═══ SUCCESS SCREEN ═══ */
    if (success) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-5 text-center max-w-md mx-auto">
                <div className="w-20 h-20 rounded-full bg-emerald-50 text-4xl flex items-center justify-center mb-5">🎉</div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h2>
                <p className="text-slate-500 text-[15px] mb-6">
                    <strong>{success.planName} Plan</strong> active ho gaya hai.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left w-full">
                    <p className="font-semibold text-sm text-amber-900 mb-1">⚠️ Re-login Required</p>
                    <p className="text-[13px] text-amber-700 leading-relaxed">
                        Naye plan ki services activate hone ke liye ek baar logout karein aur login karein.
                    </p>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-[15px] hover:bg-indigo-700 transition-colors"
                >
                    Logout &amp; Login Again →
                </button>
            </div>
        )
    }

    if (loading) {
        return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
    }

    const plans = Object.values(PLANS)
    const currentPlanId = status?.plan as PlanId | undefined
    const currentCycle = status?.billingCycle as BillingCycle | null

    return (
        <div>
            <PageHeader title="Subscription Plans" subtitle="Apne school ke liye sahi plan chunein" />

            {/* Upgrade modal */}
            {upgradeModal && (
                <Portal>
                    <UpgradeModal
                        planId={upgradeModal}
                        currentPlan={currentPlanId ?? 'starter'}
                        cycle={cycle}
                        paying={paying === upgradeModal}
                        onPay={(orderId, amount) => {
                            setPaying(upgradeModal)
                            openRazorpay(upgradeModal, orderId, amount, true)
                        }}
                        onFreeUpgrade={() => handleFreeUpgrade(upgradeModal)}
                        onCancel={() => { if (!paying) setUpgradeModal(null) }}
                    />
                </Portal>
            )}

            {/* Blocked module warning */}
            {blockedModule && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3">
                    <span className="text-xl">🔒</span>
                    <div>
                        <p className="font-semibold text-sm text-amber-900 mb-0.5">
                            {blockedModule.charAt(0).toUpperCase() + blockedModule.slice(1)} module locked hai
                        </p>
                        <p className="text-[13px] text-amber-700 leading-relaxed">
                            Yeh feature aapke current plan mein nahi hai. Neeche se upgrade plan chunein.
                        </p>
                    </div>
                </div>
            )}

            {alert && (
                <div className="mb-5">
                    <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
                </div>
            )}

            {/* Status banner */}
            {status && (
                <div className={clsx(
                    'rounded-xl p-4 mb-7 flex items-center gap-3.5 border',
                    status.isPaid ? 'bg-emerald-50 border-emerald-200'
                        : status.isInTrial ? 'bg-blue-50 border-blue-200'
                            : 'bg-red-50 border-red-200'
                )}>
                    <span className="text-2xl">
                        {status.isPaid ? '✅' : status.isInTrial ? '⏱️' : '❌'}
                    </span>
                    <div className="flex-1">
                        {status.isPaid && (
                            <>
                                <p className="font-semibold text-sm text-emerald-800 mb-0.5">
                                    {PLANS[status.plan as PlanId]?.name} Plan — Active
                                    {/* ← NEW: Show billing cycle */}
                                    {currentCycle && (
                                        <span className="font-normal text-emerald-600">
                                            {' '}({currentCycle === 'monthly' ? 'Monthly' : 'Yearly'})
                                        </span>
                                    )}
                                </p>
                                <p className="text-[13px] text-emerald-700">
                                    Valid till: {formatDate(status.validTill)}
                                </p>
                            </>
                        )}
                        {status.isInTrial && (
                            <>
                                <p className="font-semibold text-sm text-blue-800 mb-0.5">
                                    Free Trial — {status.daysLeft} days remaining
                                </p>
                                <p className="text-[13px] text-blue-700">
                                    Subscribe karein to continue after trial
                                </p>
                            </>
                        )}
                        {status.isExpired && (
                            <>
                                <p className="font-semibold text-sm text-red-800 mb-0.5">Access Blocked</p>
                                <p className="text-[13px] text-red-700">Trial expired — neeche plan choose karein</p>
                            </>
                        )}
                    </div>
                    {status.isPaid && currentPlanId && (
                        <span
                            className="px-3 py-1 rounded-full text-xs font-semibold"
                            style={{
                                background: `${PLANS[currentPlanId]?.color}18`,
                                color: PLANS[currentPlanId]?.color,
                                border: `1px solid ${PLANS[currentPlanId]?.color}30`,
                            }}
                        >
                            {PLANS[currentPlanId]?.name}
                        </span>
                    )}
                </div>
            )}

            {/* Billing cycle toggle */}
            <div className="flex justify-center mb-9">
                <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                    {(['monthly', 'yearly'] as BillingCycle[]).map(c => (
                        <button
                            key={c}
                            onClick={() => setCycle(c)}
                            className={clsx(
                                'px-5 py-2 rounded-lg text-sm font-medium transition-all',
                                cycle === c
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                            )}
                        >
                            {c === 'monthly' ? 'Monthly' : (
                                <span>Yearly <span className="text-[11px] text-emerald-600 font-semibold">2 months free</span></span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Plan cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {plans.map(plan => {
                    const curRank = currentPlanId ? getPlanRank(currentPlanId) : -1
                    const thisRank = getPlanRank(plan.id)
                    const isHL = highlightPlan === plan.id
                    const isPop = plan.highlighted && !isHL

                    // ← FIX: Proper current/upgrade/cycle checks
                    const isExactlyCurrent =
                        currentPlanId === plan.id && status?.isPaid && currentCycle === cycle
                    const isCycleUpgrade =
                        currentPlanId === plan.id && status?.isPaid &&
                        currentCycle === 'monthly' && cycle === 'yearly'
                    const isCycleDowngrade =
                        currentPlanId === plan.id && status?.isPaid &&
                        currentCycle === 'yearly' && cycle === 'monthly'
                    const isUpgrade = status?.isPaid && thisRank > curRank
                    const isDown = status?.isPaid && thisRank < curRank
                    const isDisabled = isExactlyCurrent || isDown || isCycleDowngrade

                    return (
                        <div
                            key={plan.id}
                            className={clsx(
                                'bg-white rounded-2xl flex flex-col transition-all relative',
                                isDisabled && 'opacity-60'
                            )}
                            style={{
                                border: isHL ? `2px solid ${plan.color}`
                                    : isPop ? '1.5px solid #818CF8'
                                        : '1px solid #E2E8F0',
                                boxShadow: isHL ? `0 0 0 5px ${plan.color}15, 0 8px 32px ${plan.color}18`
                                    : isPop ? '0 8px 24px rgba(99,102,241,0.1)'
                                        : 'none',
                                padding: '28px 24px',
                            }}
                        >
                            {(isHL || isPop) && (
                                <div
                                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-white text-xs font-semibold px-4 py-1 rounded-full whitespace-nowrap"
                                    style={{ background: isHL ? plan.color : '#4F46E5' }}
                                >
                                    {isHL ? '⭐ Recommended' : '🔥 Most Popular'}
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                                {isExactlyCurrent && (
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        Current
                                    </span>
                                )}
                            </div>

                            <p className="text-xs font-medium mb-4" style={{ color: plan.color }}>
                                {plan.tagline}
                            </p>

                            <div className="mb-2">
                                <PriceDisplay planId={plan.id} cycle={cycle} />
                            </div>

                            <p className="text-[13px] text-slate-500 leading-relaxed mb-4">
                                {plan.description}
                            </p>

                            <div className="bg-slate-50 rounded-lg px-3.5 py-2.5 mb-5 text-xs text-slate-600 flex gap-4">
                                <span>👤 {plan.maxStudents === -1 ? 'Unlimited' : `Max ${plan.maxStudents}`} students</span>
                                <span>👨‍🏫 {plan.maxTeachers === -1 ? 'Unlimited' : `Max ${plan.maxTeachers}`} teachers</span>
                            </div>

                            <ul className="space-y-2 mb-6 flex-1">
                                {plan.features.map(f => (
                                    <li key={f} className="flex items-start gap-2 text-[13px] leading-snug">
                                        <span className="text-emerald-500 font-bold flex-shrink-0 mt-0.5">✓</span>
                                        <span className="text-slate-700">{f.replace('✓ ', '')}</span>
                                    </li>
                                ))}
                                {plan.notIncluded?.map(f => (
                                    <li key={f} className="flex items-start gap-2 text-[13px] leading-snug opacity-40">
                                        <span className="flex-shrink-0 mt-0.5">✕</span>
                                        <span>{f.replace('✗ ', '')}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* ← FIX: Smart button text */}
                            <button
                                onClick={() => !isDisabled && handleSubscribe(plan.id)}
                                disabled={isDisabled || paying === plan.id}
                                className="w-full py-3 rounded-xl text-[15px] font-semibold transition-all"
                                style={
                                    isDisabled
                                        ? { background: '#F1F5F9', color: '#94A3B8', cursor: 'default', border: 'none' }
                                        : isHL || isPop
                                            ? { background: plan.color, color: '#fff', border: 'none', cursor: 'pointer' }
                                            : { background: 'transparent', color: plan.color, border: `1.5px solid ${plan.color}`, cursor: 'pointer' }
                                }
                            >
                                {paying === plan.id
                                    ? 'Processing…'
                                    : isExactlyCurrent
                                        ? '✓ Current Plan'
                                        : isCycleDowngrade
                                            ? 'Not Available'
                                            : isCycleUpgrade
                                                ? 'Switch to Yearly →'
                                                : isDown
                                                    ? 'Contact Support'
                                                    : isUpgrade
                                                        ? `Upgrade to ${plan.name} →`
                                                        : `Get ${plan.name} →`}
                            </button>

                            {(isUpgrade || isCycleUpgrade) && !isExactlyCurrent && (
                                <p className="text-[11px] text-slate-400 text-center mt-2">
                                    {isCycleUpgrade
                                        ? 'Remaining days ka credit milega'
                                        : 'Proration credit milega · Double charge nahi hoga'}
                                </p>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="text-center mt-7 text-[13px] text-slate-400 space-y-1">
                <p>Secure payment by Razorpay · Cancel anytime</p>
                {GST_CONFIG.enabled && (
                    <p>GST invoice aapke email pe milegi · GSTIN: {GST_CONFIG.gstin}</p>
                )}
            </div>

            {/* ─── CANCEL SECTION ─── */}
            {status?.isPaid && !cancelConfirm && (
                <div className="mt-10 pt-6 border-t border-slate-200 text-center">
                    <button
                        onClick={() => setCancelConfirm(true)}
                        className="text-sm text-slate-400 hover:text-red-500 transition-colors underline underline-offset-2"
                    >
                        Cancel Subscription
                    </button>
                </div>
            )}

            {status?.isPaid && cancelConfirm && (
                <div className="mt-10 pt-6 border-t border-slate-200">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-lg mx-auto">
                        <h3 className="font-bold text-red-900 text-base mb-2">
                            ⚠️ Cancel Subscription?
                        </h3>
                        <p className="text-sm text-red-700 mb-2 leading-relaxed">
                            Aapka plan <strong>immediately Starter</strong> pe downgrade ho jayega.
                        </p>
                        <p className="text-sm text-red-700 mb-4 leading-relaxed">
                            Aap in features ka access kho denge:
                        </p>
                        <ul className="text-sm text-red-600 mb-5 space-y-1 pl-4">
                            {currentPlanId && PLANS[currentPlanId]?.modules
                                .filter(m => !PLANS.starter.modules.includes(m))
                                .map(m => (
                                    <li key={m} className="list-disc">
                                        {m.charAt(0).toUpperCase() + m.slice(1)}
                                    </li>
                                ))}
                        </ul>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setCancelConfirm(false)}
                                className="flex-1 py-3 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                Keep My Plan
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={cancelling}
                                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function SubscriptionPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-16"><Spinner size="lg" /></div>}>
            <SubscriptionInner />
        </Suspense>
    )
}