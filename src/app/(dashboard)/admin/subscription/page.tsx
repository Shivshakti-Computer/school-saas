'use client'
// =============================================================
// FILE: src/app/(dashboard)/admin/subscription/page.tsx
// FIX: UpgradeModal visibility — z-index 9999, body scroll lock,
//      maxHeight + overflowY on card, backdrop click to close
// =============================================================

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Alert, PageHeader, Spinner } from '@/components/ui'
import {
    PLANS, GST_CONFIG,
    getPlan, getPrice, getPlanPriceBreakdown,
    getRazorpayBreakdown, getSavings,
    type PlanId, type BillingCycle,
} from '@/lib/plans'
import Link from 'next/link'
import { Portal } from '@/components/ui/Portal'

declare global { interface Window { Razorpay: any } }

const PLAN_ORDER: PlanId[] = ['starter', 'pro', 'enterprise']
function getPlanRank(planId: PlanId) { return PLAN_ORDER.indexOf(planId) }

// ─────────────────────────────────────────────────────────────
// Razorpay SDK — promise-based loader, safe to call multiple times
// ─────────────────────────────────────────────────────────────
function loadRazorpaySDK(): Promise<boolean> {
    return new Promise((resolve) => {
        if (typeof window === 'undefined') { resolve(false); return }
        if (window.Razorpay) { resolve(true); return }

        const existing = document.querySelector(
            'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
        )
        if (existing) {
            existing.addEventListener('load', () => resolve(true))
            existing.addEventListener('error', () => resolve(false))
            return
        }

        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.async = true
        script.onload = () => resolve(true)
        script.onerror = () => resolve(false)
        document.body.appendChild(script)
    })
}

// ─────────────────────────────────────────────────────────────
// PriceDisplay
// ─────────────────────────────────────────────────────────────
function PriceDisplay({ planId, cycle }: { planId: PlanId; cycle: BillingCycle }) {
    const [showBreakdown, setShowBreakdown] = useState(false)
    const breakdown = getPlanPriceBreakdown(planId, cycle)
    const plan = getPlan(planId)
    const savings = getSavings(planId)

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1px', color: 'var(--color-text-primary)' }}>
                    ₹{breakdown.totalAmount.toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
                    /{cycle === 'monthly' ? 'mo' : 'yr'}
                </span>
            </div>

            {GST_CONFIG.enabled && (
                <div style={{ marginBottom: 6 }}>
                    <button
                        onClick={() => setShowBreakdown(!showBreakdown)}
                        style={{ fontSize: 12, color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                        Base ₹{breakdown.baseAmount.toLocaleString('en-IN')} + ₹{breakdown.gstAmount.toLocaleString('en-IN')} GST
                        <span style={{ fontSize: 10 }}>{showBreakdown ? '▲' : '▼'}</span>
                    </button>
                    {showBreakdown && (
                        <div style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 8, padding: '10px 14px', fontSize: 12, marginTop: 6, color: 'var(--color-text-secondary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Base price</span><span>₹{breakdown.baseAmount.toLocaleString('en-IN')}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span>GST (18%)</span><span>₹{breakdown.gstAmount.toLocaleString('en-IN')}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 13, borderTop: '1px solid var(--color-border-tertiary)', paddingTop: 6, color: 'var(--color-text-primary)' }}>
                                <span>Total payable</span><span>₹{breakdown.totalAmount.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {cycle === 'yearly' && savings > 0 && (
                <p style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>
                    ₹{(plan.monthlyPrice * 12).toLocaleString('en-IN')} ki jagah —{' '}
                    <strong>₹{savings.toLocaleString('en-IN')} bachao</strong>
                </p>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// UpgradeModal
// KEY FIXES:
//   1. z-index: 9999 (was 50 — dashboard layout was on top)
//   2. Body scroll locked while open
//   3. maxHeight: '90vh' + overflowY: 'auto' on card
//   4. Backdrop click closes modal
//   5. ✕ close button added
//   6. Separate handlers for free vs paid upgrade
// ─────────────────────────────────────────────────────────────
function UpgradeModal({
    planId,
    currentPlan,
    cycle,
    onPay,
    onFreeUpgrade,
    onCancel,
    paying,
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

    // Lock body scroll
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
            .catch(() => { setError('Server error. Please refresh and try again.'); setLoading(false) })
    }, [planId, cycle])

    const plan = getPlan(planId)
    const isbusy = paying || applyingFree

    return (
        // Backdrop — click outside to close
        <div
            onMouseDown={(e) => { if (e.target === e.currentTarget && !isbusy) onCancel() }}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,                   // ← KEY FIX: was z-index:50
                background: 'rgba(0,0,0,0.55)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                overflowY: 'auto',
            }}
        >
            {/* Modal card */}
            <div
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                    background: 'var(--color-background-primary)',
                    borderRadius: 16,
                    padding: '28px',
                    width: '100%',
                    maxWidth: 460,
                    border: '1px solid var(--color-border-primary)',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
                    position: 'relative',
                    maxHeight: '90vh',          // ← KEY FIX: cap height
                    overflowY: 'auto',          // ← KEY FIX: scroll inside if needed
                    margin: 'auto',             // ← ensures centering even when overflowing
                }}
            >
                {/* Close button */}
                <button
                    onClick={() => { if (!isbusy) onCancel() }}
                    style={{
                        position: 'absolute', top: 14, right: 14,
                        width: 30, height: 30, borderRadius: '50%',
                        border: '1px solid var(--color-border-tertiary)',
                        background: 'var(--color-background-secondary)',
                        cursor: isbusy ? 'not-allowed' : 'pointer',
                        fontSize: 13, color: 'var(--color-text-secondary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: isbusy ? 0.4 : 1,
                    }}
                >✕</button>

                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, paddingRight: 36 }}>
                    Upgrade to {plan.name}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
                    Aapke current plan ke remaining days ka credit automatically milega
                </p>

                {/* Loading state */}
                {loading && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: 12 }}>
                        <Spinner />
                        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Amount calculate ho raha hai...</p>
                    </div>
                )}

                {/* Error state */}
                {error && !loading && (
                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                        <p style={{ color: '#DC2626', fontSize: 14 }}>⚠️ {error}</p>
                    </div>
                )}

                {/* Breakdown content */}
                {breakdown && !loading && (
                    <>
                        {breakdown.noPayment ? (
                            /* Free upgrade */
                            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
                                <p style={{ fontWeight: 600, color: '#065F46', fontSize: 14, marginBottom: 4 }}>✅ Credit enough hai!</p>
                                <p style={{ fontSize: 13, color: '#047857' }}>{breakdown.explanation}</p>
                            </div>
                        ) : (
                            /* Paid breakdown table */
                            <div style={{ background: 'var(--color-background-secondary)', borderRadius: 10, padding: '16px', marginBottom: 16, fontSize: 13 }}>

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, color: 'var(--color-text-secondary)' }}>
                                    <span>{plan.name} plan ({cycle})</span>
                                    <span style={{ fontWeight: 500 }}>₹{breakdown.breakdown?.newPlanPrice?.toLocaleString('en-IN')}</span>
                                </div>

                                {breakdown.breakdown?.creditAmount > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, color: '#059669' }}>
                                        <span style={{ lineHeight: 1.5 }}>
                                            Credit — {breakdown.breakdown?.daysRemaining} din bache
                                            <br />
                                            <span style={{ fontSize: 11, opacity: 0.8 }}>
                                                ₹{breakdown.breakdown?.dailyRate}/day × {breakdown.breakdown?.daysRemaining} days
                                            </span>
                                        </span>
                                        <span style={{ fontWeight: 500, marginLeft: 12, whiteSpace: 'nowrap' }}>
                                            − ₹{breakdown.breakdown?.creditAmount?.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                )}

                                <div style={{ borderTop: '1px solid var(--color-border-tertiary)', paddingTop: 10, marginTop: 4 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: 'var(--color-text-secondary)' }}>
                                        <span>Subtotal</span>
                                        <span>₹{breakdown.breakdown?.subtotal?.toLocaleString('en-IN')}</span>
                                    </div>

                                    {GST_CONFIG.enabled && breakdown.breakdown?.gstAmount > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: 'var(--color-text-secondary)' }}>
                                            <span>GST (18%)</span>
                                            <span>₹{breakdown.breakdown?.gstAmount?.toLocaleString('en-IN')}</span>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, color: 'var(--color-text-primary)', paddingTop: 4 }}>
                                        <span>Total payable</span>
                                        <span style={{ color: plan.color }}>
                                            ₹{breakdown.breakdown?.totalPayable?.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Explanation pill */}
                        {breakdown.breakdown?.explanation && (
                            <div style={{ background: '#EFF6FF', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#1E40AF', lineHeight: 1.6 }}>
                                💡 {breakdown.breakdown.explanation}
                            </div>
                        )}

                        {/* Razorpay net income */}
                        {!breakdown.noPayment && breakdown.breakdown?.totalPayable > 0 && (
                            <div style={{ background: 'var(--color-background-secondary)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.7, border: '1px solid var(--color-border-tertiary)' }}>
                                <p style={{ fontWeight: 600, marginBottom: 4, color: 'var(--color-text-primary)', fontSize: 12 }}>
                                    Net income (after Razorpay deduction):
                                </p>
                                {(() => {
                                    const rzp = getRazorpayBreakdown(breakdown.breakdown?.totalPayable ?? 0)
                                    return (
                                        <>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>School pays</span><span>₹{rzp.schoolPays.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626' }}>
                                                <span>Razorpay (2% + GST)</span><span>− ₹{rzp.totalDeduction.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#059669', borderTop: '1px solid var(--color-border-tertiary)', paddingTop: 4, marginTop: 4 }}>
                                                <span>Net to account</span><span>₹{rzp.netToAccount.toLocaleString('en-IN')}</span>
                                            </div>
                                        </>
                                    )
                                })()}
                            </div>
                        )}

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                onClick={() => { if (!isbusy) onCancel() }}
                                disabled={isbusy}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: 8,
                                    border: '1.5px solid var(--color-border-primary)',
                                    background: 'transparent', cursor: isbusy ? 'not-allowed' : 'pointer',
                                    fontSize: 14, color: 'var(--color-text-secondary)',
                                    opacity: isbusy ? 0.5 : 1,
                                }}
                            >
                                Cancel
                            </button>

                            {breakdown.noPayment ? (
                                <button
                                    onClick={() => { setApplyingFree(true); onFreeUpgrade() }}
                                    disabled={applyingFree}
                                    style={{
                                        flex: 2, padding: '12px', borderRadius: 8,
                                        background: '#059669', color: '#fff', border: 'none',
                                        cursor: applyingFree ? 'not-allowed' : 'pointer',
                                        fontSize: 14, fontWeight: 600,
                                        opacity: applyingFree ? 0.7 : 1,
                                    }}
                                >
                                    {applyingFree ? 'Upgrading...' : 'Upgrade for free →'}
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        if (!breakdown.orderId || paying) return
                                        onPay(breakdown.orderId, breakdown.amount)
                                    }}
                                    disabled={paying || !breakdown.orderId}
                                    style={{
                                        flex: 2, padding: '12px', borderRadius: 8,
                                        background: plan.color, color: '#fff', border: 'none',
                                        cursor: (paying || !breakdown.orderId) ? 'not-allowed' : 'pointer',
                                        fontSize: 14, fontWeight: 600,
                                        opacity: paying ? 0.7 : 1,
                                    }}
                                >
                                    {paying
                                        ? 'Opening payment...'
                                        : `Pay ₹${breakdown.breakdown?.totalPayable?.toLocaleString('en-IN')} →`
                                    }
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
function SubscriptionPageInner() {
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

    useEffect(() => {
        fetch('/api/subscription/status')
            .then(r => r.json())
            .then(d => { setStatus(d); setLoading(false) })

        // Pre-load SDK on mount so it's ready when needed
        loadRazorpaySDK()
    }, [])

    const openRazorpay = async (
        planId: PlanId,
        orderId: string,
        amount: number,   // paise
        isUpgrade = false,
    ) => {
        const loaded = await loadRazorpaySDK()
        if (!loaded) {
            setAlert({ type: 'error', msg: 'Payment system load nahi hua. Please page refresh karein.' })
            setPaying(null)
            return
        }

        const plan = getPlan(planId)

        const rzpInstance = new window.Razorpay({
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount,
            currency: 'INR',
            name: 'Shivshakti School Suite',
            description: isUpgrade ? `Upgrade to ${plan.name}` : `${plan.name} Plan — ${cycle}`,
            order_id: orderId,

            handler: async (response: any) => {
                try {
                    const endpoint = isUpgrade
                        ? '/api/subscription/upgrade/verify'
                        : '/api/subscription/verify'

                    const vRes = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            planId,
                            billingCycle: cycle,
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
            modal: {
                ondismiss: () => { setPaying(null) },
            },
        })

        rzpInstance.open()
    }

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

    const handleSubscribe = (planId: PlanId) => {
        const currentPlanId = status?.plan as PlanId | undefined
        if (status?.isPaid && currentPlanId) {
            const diff = getPlanRank(planId) - getPlanRank(currentPlanId)
            if (diff > 0) {
                setUpgradeModal(planId)
            } else if (diff < 0) {
                setAlert({ type: 'error', msg: 'Downgrade ke liye support se contact karein. Current plan period end hone ke baad change hoga.' })
            }
        } else {
            handleFreshSubscribe(planId)
        }
    }

    const handleFreeUpgrade = (planId: PlanId) => {
        setUpgradeModal(null)
        setSuccess({ planName: getPlan(planId).name })
    }

    // Success screen
    if (success) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 20px', textAlign: 'center', maxWidth: 440, margin: '0 auto' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#ECFDF5', fontSize: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>🎉</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Payment Successful!</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 15, marginBottom: 24 }}>
                    <strong>{success.planName} Plan</strong> active ho gaya hai.
                </p>
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '14px 18px', marginBottom: 24, textAlign: 'left', width: '100%' }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: '#92400E', marginBottom: 4 }}>⚠️ Re-login Required</p>
                    <p style={{ fontSize: 13, color: '#B45309', lineHeight: 1.5 }}>Naye plan ki services activate hone ke liye ek baar logout karein aur login karein.</p>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    style={{ width: '100%', padding: '13px', borderRadius: 10, background: '#4F46E5', color: '#fff', fontWeight: 600, fontSize: 15, border: 'none', cursor: 'pointer' }}
                >
                    Logout & Login Again →
                </button>
            </div>
        )
    }

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}><Spinner size="lg" /></div>
    }

    const plans = Object.values(PLANS)
    const currentPlanId = status?.plan as PlanId | undefined

    return (
        <div>
            <PageHeader title="Subscription Plans" subtitle="Apne school ke liye sahi plan chunein" />

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

            {blockedModule && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ fontSize: 22 }}>🔒</span>
                    <div>
                        <p style={{ fontWeight: 600, fontSize: 14, color: '#92400E', marginBottom: 2 }}>
                            {blockedModule.charAt(0).toUpperCase() + blockedModule.slice(1)} module locked hai
                        </p>
                        <p style={{ fontSize: 13, color: '#B45309', lineHeight: 1.5 }}>
                            Yeh feature aapke current plan mein nahi hai. Neeche se upgrade plan chunein.
                        </p>
                    </div>
                </div>
            )}

            {alert && (
                <div style={{ marginBottom: 20 }}>
                    <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
                </div>
            )}

            {status && (
                <div style={{
                    borderRadius: 12, padding: '14px 18px', marginBottom: 28,
                    display: 'flex', alignItems: 'center', gap: 14, border: '1px solid',
                    ...(status.isPaid
                        ? { background: '#ECFDF5', borderColor: '#A7F3D0' }
                        : status.isInTrial
                            ? { background: '#EFF6FF', borderColor: '#BFDBFE' }
                            : { background: '#FEF2F2', borderColor: '#FECACA' }),
                }}>
                    <span style={{ fontSize: 24 }}>{status.isPaid ? '✅' : status.isInTrial ? '⏱️' : '❌'}</span>
                    <div style={{ flex: 1 }}>
                        {status.isPaid && (
                            <>
                                <p style={{ fontWeight: 600, fontSize: 14, color: '#065F46', marginBottom: 2 }}>
                                    {PLANS[status.plan as PlanId]?.name} Plan — Active
                                </p>
                                <p style={{ fontSize: 13, color: '#047857' }}>Valid till: {status.validTill}</p>
                            </>
                        )}
                        {status.isInTrial && (
                            <>
                                <p style={{ fontWeight: 600, fontSize: 14, color: '#1E40AF', marginBottom: 2 }}>
                                    Free Trial — {status.daysLeft} days remaining
                                </p>
                                <p style={{ fontSize: 13, color: '#2563EB' }}>Subscribe karein to continue after trial</p>
                            </>
                        )}
                        {status.isExpired && (
                            <>
                                <p style={{ fontWeight: 600, fontSize: 14, color: '#991B1B', marginBottom: 2 }}>Access Blocked</p>
                                <p style={{ fontSize: 13, color: '#DC2626' }}>Trial expired — neeche plan choose karein</p>
                            </>
                        )}
                    </div>
                    {status.isPaid && currentPlanId && (
                        <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: `${PLANS[currentPlanId]?.color}20`, color: PLANS[currentPlanId]?.color, border: `1px solid ${PLANS[currentPlanId]?.color}30` }}>
                            {PLANS[currentPlanId]?.name}
                        </span>
                    )}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
                <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 10, padding: 4, gap: 4 }}>
                    {(['monthly', 'yearly'] as BillingCycle[]).map(c => (
                        <button
                            key={c}
                            onClick={() => setCycle(c)}
                            style={{
                                padding: '8px 20px', borderRadius: 8, border: 'none',
                                cursor: 'pointer', fontSize: 14, fontWeight: 500, transition: 'all 0.15s',
                                ...(cycle === c
                                    ? { background: '#fff', color: '#1E293B', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }
                                    : { background: 'transparent', color: '#64748B' }),
                            }}
                        >
                            {c === 'monthly' ? 'Monthly' : (
                                <span>Yearly <span style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>2 months free</span></span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
                {plans.map(plan => {
                    const isCurrent = currentPlanId === plan.id && status?.isPaid
                    const isHighlighted = highlightPlan === plan.id
                    const isPopular = plan.highlighted && !isHighlighted
                    const currentRank = currentPlanId ? getPlanRank(currentPlanId) : -1
                    const thisRank = getPlanRank(plan.id)
                    const isUpgrade = status?.isPaid && thisRank > currentRank
                    const isDowngrade = status?.isPaid && thisRank < currentRank

                    return (
                        <div
                            key={plan.id}
                            style={{
                                background: 'var(--color-background-primary)',
                                borderRadius: 18,
                                border: isHighlighted ? `2px solid ${plan.color}` : isPopular ? '1.5px solid #818CF8' : '1px solid var(--color-border-tertiary)',
                                boxShadow: isHighlighted ? `0 0 0 5px ${plan.color}18, 0 8px 32px ${plan.color}18` : isPopular ? '0 8px 24px rgba(99,102,241,0.1)' : 'none',
                                padding: '28px 24px',
                                display: 'flex', flexDirection: 'column',
                                position: 'relative', transition: 'all 0.2s',
                                opacity: isDowngrade ? 0.65 : 1,
                            }}
                        >
                            {(isHighlighted || isPopular) && (
                                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: isHighlighted ? plan.color : '#4F46E5', color: '#fff', fontSize: 12, fontWeight: 600, padding: '4px 16px', borderRadius: 99, whiteSpace: 'nowrap' }}>
                                    {isHighlighted ? '⭐ Aapke liye recommended' : '🔥 Most Popular'}
                                </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                <h3 style={{ fontSize: 18, fontWeight: 700 }}>{plan.name}</h3>
                                {isCurrent && (
                                    <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }}>Current</span>
                                )}
                            </div>

                            <p style={{ fontSize: 12, color: plan.color, fontWeight: 500, marginBottom: 16 }}>{plan.tagline}</p>

                            <div style={{ marginBottom: 8 }}>
                                <PriceDisplay planId={plan.id} cycle={cycle} />
                            </div>

                            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>{plan.description}</p>

                            <div style={{ background: 'var(--color-background-secondary)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', gap: 16 }}>
                                <span>👤 {plan.maxStudents === -1 ? 'Unlimited' : `Max ${plan.maxStudents}`} students</span>
                                <span>👨‍🏫 {plan.maxTeachers === -1 ? 'Unlimited' : `Max ${plan.maxTeachers}`} teachers</span>
                            </div>

                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', flex: 1 }}>
                                {plan.features.map(f => (
                                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, fontSize: 13, lineHeight: 1.4 }}>
                                        <span style={{ color: '#10B981', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                                        {f.replace('✓ ', '')}
                                    </li>
                                ))}
                                {plan.notIncluded?.map(f => (
                                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, fontSize: 13, lineHeight: 1.4, opacity: 0.45 }}>
                                        <span style={{ flexShrink: 0, marginTop: 1 }}>✕</span>
                                        {f.replace('✗ ', '')}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => !isCurrent && !isDowngrade && handleSubscribe(plan.id)}
                                disabled={isCurrent || paying === plan.id || isDowngrade}
                                style={{
                                    width: '100%', padding: '12px', borderRadius: 10,
                                    border: 'none', fontSize: 15, fontWeight: 600,
                                    cursor: (isCurrent || isDowngrade) ? 'default' : 'pointer',
                                    transition: 'all 0.15s',
                                    ...(isCurrent || isDowngrade
                                        ? { background: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)' }
                                        : isHighlighted || isPopular
                                            ? { background: plan.color, color: '#fff' }
                                            : { background: 'transparent', color: plan.color, border: `1.5px solid ${plan.color}` }),
                                }}
                            >
                                {paying === plan.id ? 'Processing...'
                                    : isCurrent ? '✓ Current Plan'
                                        : isDowngrade ? 'Contact Support'
                                            : isUpgrade ? `Upgrade to ${plan.name} →`
                                                : `Get ${plan.name} →`}
                            </button>

                            {isUpgrade && !isCurrent && (
                                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: 8 }}>
                                    Proration credit milega · Double charge nahi hoga
                                </p>
                            )}
                        </div>
                    )
                })}
            </div>

            <div style={{ textAlign: 'center', marginTop: 28, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                <p>Secure payment by Razorpay · Cancel anytime</p>
                {GST_CONFIG.enabled && (
                    <p style={{ marginTop: 4 }}>GST invoice aapke email pe milegi · GSTIN: {GST_CONFIG.gstin}</p>
                )}
            </div>
        </div>
    )
}

export default function SubscriptionPage() {
    return (
        <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}><Spinner size="lg" /></div>}>
            <SubscriptionPageInner />
        </Suspense>
    )
}