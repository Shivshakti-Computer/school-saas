// FILE: src/components/subscription/CancelSubscriptionFlow.tsx
// Multi-step cancel: Feedback → What you'll lose → Refund info → Confirm

'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { Button, Alert, Badge, Modal } from '@/components/ui'
import { AlertTriangle, X, MessageSquare, ArrowLeft, Undo2 } from 'lucide-react'
import { PLANS } from '@/lib/plans'
import { MODULE_REGISTRY, type ModuleKey } from '@/lib/moduleRegistry'
import type { PlanId } from '@/lib/plans'

const CANCEL_CATEGORIES = [
    { value: 'too_expensive', label: '💰 Too expensive', emoji: '💰' },
    { value: 'not_enough_features', label: '❌ Missing features I need', emoji: '❌' },
    { value: 'too_complex', label: '😵 Too complex / hard to use', emoji: '😵' },
    { value: 'switching_competitor', label: '🔄 Switching to another tool', emoji: '🔄' },
    { value: 'school_closed', label: '🏫 School closed / vacation', emoji: '🏫' },
    { value: 'temporary_pause', label: '⏸️ Just want a temporary break', emoji: '⏸️' },
    { value: 'bad_support', label: '😤 Poor customer support', emoji: '😤' },
    { value: 'other', label: '📝 Other reason', emoji: '📝' },
]

interface CancelInfo {
    subscription: {
        plan: string
        billingCycle: string
        amount: number
        status: string
        periodEnd: string
        daysUsed: number
        daysRemaining: number
        isScheduledCancel: boolean
    }
    refund: {
        eligible: boolean
        amount: number
        reason: string
        deadline: string | null
    }
}

export function CancelSubscriptionFlow({
    currentPlan,
    onCancelled,
}: {
    currentPlan: PlanId
    onCancelled: () => void
}) {
    const [showFlow, setShowFlow] = useState(false)
    const [step, setStep] = useState(1) // 1=feedback, 2=what you lose, 3=refund, 4=confirm
    const [loading, setLoading] = useState(false)
    const [fetchingInfo, setFetchingInfo] = useState(false)
    const [cancelInfo, setCancelInfo] = useState<CancelInfo | null>(null)
    const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'warning'; msg: string } | null>(null)

    // Form
    const [category, setCategory] = useState('')
    const [feedback, setFeedback] = useState('')
    const [requestRefund, setRequestRefund] = useState(false)
    const [confirmed, setConfirmed] = useState(false)

    // Result
    const [result, setResult] = useState<any>(null)

    // Fetch cancel info when flow starts
    useEffect(() => {
        if (showFlow && !cancelInfo) {
            fetchCancelInfo()
        }
    }, [showFlow])

    const fetchCancelInfo = async () => {
        setFetchingInfo(true)
        try {
            const res = await fetch('/api/subscription/cancel')
            const data = await res.json()
            if (res.ok) {
                setCancelInfo(data)
            }
        } catch { }
        setFetchingInfo(false)
    }

    const handleCancel = async () => {
        if (!confirmed) return
        setLoading(true)
        setAlert(null)

        try {
            const res = await fetch('/api/subscription/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reason: CANCEL_CATEGORIES.find(c => c.value === category)?.label || category,
                    category,
                    feedback,
                    requestRefund,
                }),
            })
            const data = await res.json()
            setLoading(false)

            if (data.success) {
                setResult(data)
                setStep(5) // success step
            } else {
                setAlert({ type: 'error', msg: data.error || 'Cancel failed' })
            }
        } catch {
            setLoading(false)
            setAlert({ type: 'error', msg: 'Something went wrong' })
        }
    }

    const plan = PLANS[currentPlan]
    const lostModules = plan?.modules.filter(m => !PLANS.starter.modules.includes(m)) || []

    if (!showFlow) {
        return (
            <div className="mt-10 pt-6 border-t border-slate-200 text-center">
                <button
                    onClick={() => setShowFlow(true)}
                    className="text-sm text-slate-400 hover:text-red-500 transition-colors underline underline-offset-2"
                >
                    Cancel Subscription
                </button>
            </div>
        )
    }

    return (
        <div className="mt-10 pt-6 border-t border-slate-200">
            <div className="max-w-lg mx-auto">

                {/* ═══ STEP 1: Feedback ═══ */}
                {step === 1 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-bold text-slate-800">We&apos;re sorry to see you go 😢</h3>
                            <button onClick={() => setShowFlow(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>

                        <p className="text-sm text-slate-500 mb-5">
                            Help us understand why you&apos;re cancelling so we can improve:
                        </p>

                        {/* Category Selection */}
                        <div className="space-y-2 mb-5">
                            {CANCEL_CATEGORIES.map(cat => (
                                <label
                                    key={cat.value}
                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${category === cat.value
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="cancel-reason"
                                        value={cat.value}
                                        checked={category === cat.value}
                                        onChange={() => setCategory(cat.value)}
                                        className="sr-only"
                                    />
                                    <span className="text-lg">{cat.emoji}</span>
                                    <span className={`text-sm ${category === cat.value ? 'font-semibold text-red-700' : 'text-slate-600'}`}>
                                        {cat.label.replace(/^[^ ]+ /, '')}
                                    </span>
                                    {category === cat.value && (
                                        <div className="ml-auto w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                        </div>
                                    )}
                                </label>
                            ))}
                        </div>

                        {/* Additional Feedback */}
                        <div className="mb-5">
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">
                                Anything else you&apos;d like to share? <span className="text-slate-400">(optional)</span>
                            </label>
                            <textarea
                                value={feedback}
                                onChange={e => setFeedback(e.target.value)}
                                className="w-full h-20 px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 resize-none placeholder:text-slate-400"
                                placeholder="Tell us what we can do better..."
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button variant="secondary" className="flex-1" onClick={() => setShowFlow(false)}>
                                Keep My Plan
                            </Button>
                            <Button
                                variant="danger"
                                className="flex-1"
                                onClick={() => setStep(2)}
                                disabled={!category}
                            >
                                Continue →
                            </Button>
                        </div>
                    </div>
                )}

                {/* ═══ STEP 2: What You'll Lose ═══ */}
                {step === 2 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-4">
                            <ArrowLeft size={12} /> Back
                        </button>

                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle size={20} className="text-amber-500" />
                            <h3 className="text-base font-bold text-slate-800">You&apos;ll lose access to:</h3>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
                            <ul className="space-y-2">
                                {lostModules.map(moduleKey => {
                                    const mod = MODULE_REGISTRY[moduleKey as ModuleKey]
                                    return (
                                        <li key={moduleKey} className="flex items-center gap-2 text-sm text-red-700">
                                            <span className="text-red-400">✕</span>
                                            <span>{mod?.label || moduleKey}</span>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>

                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
                            <p className="text-sm font-semibold text-emerald-800 mb-2">You&apos;ll keep (Starter):</p>
                            <ul className="space-y-1">
                                {PLANS.starter.modules.map(m => {
                                    const mod = MODULE_REGISTRY[m as ModuleKey]
                                    return (
                                        <li key={m} className="flex items-center gap-2 text-sm text-emerald-700">
                                            <span className="text-emerald-500">✓</span>
                                            <span>{mod?.label || m}</span>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>

                        {cancelInfo?.subscription.daysRemaining && cancelInfo.subscription.daysRemaining > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
                                <p className="text-sm text-blue-800">
                                    ℹ️ Your access will continue for <strong>{cancelInfo.subscription.daysRemaining} more days</strong> until{' '}
                                    <strong>{new Date(cancelInfo.subscription.periodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
                                </p>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button variant="secondary" className="flex-1" onClick={() => setShowFlow(false)}>
                                Keep My Plan
                            </Button>
                            <Button variant="danger" className="flex-1" onClick={() => setStep(3)}>
                                Continue →
                            </Button>
                        </div>
                    </div>
                )}

                {/* ═══ STEP 3: Refund Info ═══ */}
                {step === 3 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <button onClick={() => setStep(2)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-4">
                            <ArrowLeft size={12} /> Back
                        </button>

                        <h3 className="text-base font-bold text-slate-800 mb-4">Refund Information</h3>

                        {cancelInfo?.refund.eligible ? (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
                                <p className="text-sm font-semibold text-emerald-800 mb-1">✅ You&apos;re eligible for a refund!</p>
                                <p className="text-2xl font-bold text-emerald-700 my-2">
                                    ₹{cancelInfo.refund.amount.toLocaleString('en-IN')}
                                </p>
                                <p className="text-xs text-emerald-600">{cancelInfo.refund.reason}</p>
                                <p className="text-xs text-emerald-500 mt-1">Refund will reflect in 5-7 business days.</p>

                                <label className="flex items-center gap-3 mt-4 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={requestRefund}
                                        onChange={e => setRequestRefund(e.target.checked)}
                                        className="rounded border-emerald-400"
                                    />
                                    <span className="text-sm text-emerald-800 font-medium">
                                        Yes, process my refund of ₹{cancelInfo.refund.amount.toLocaleString('en-IN')}
                                    </span>
                                </label>

                                {requestRefund && (
                                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                        <p className="text-xs text-amber-700">
                                            ⚠️ With refund, your access will be <strong>immediately cancelled</strong>. Without refund, access continues until period end.
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
                                <p className="text-sm font-semibold text-slate-700 mb-1">No Refund Available</p>
                                <p className="text-xs text-slate-500">{cancelInfo?.refund.reason}</p>
                                <p className="text-xs text-slate-400 mt-2">
                                    Your access will continue until the current period ends.
                                </p>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button variant="secondary" className="flex-1" onClick={() => setShowFlow(false)}>
                                Keep My Plan
                            </Button>
                            <Button variant="danger" className="flex-1" onClick={() => setStep(4)}>
                                Final Step →
                            </Button>
                        </div>
                    </div>
                )}

                {/* ═══ STEP 4: Final Confirm ═══ */}
                {step === 4 && (
                    <div className="bg-white border border-red-200 rounded-2xl p-6 shadow-sm">
                        <button onClick={() => setStep(3)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-4">
                            <ArrowLeft size={12} /> Back
                        </button>

                        <div className="text-center mb-5">
                            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
                                <AlertTriangle size={28} className="text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Final Confirmation</h3>
                            <p className="text-sm text-slate-500 mt-1">This action cannot be undone easily.</p>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-sm text-red-700 space-y-2">
                            {requestRefund && cancelInfo?.refund.eligible ? (
                                <>
                                    <p>• Your subscription will be <strong>cancelled immediately</strong></p>
                                    <p>• Refund of <strong>₹{cancelInfo.refund.amount.toLocaleString('en-IN')}</strong> will be processed</p>
                                    <p>• All premium features will be disabled</p>
                                </>
                            ) : (
                                <>
                                    <p>• Access continues until <strong>{cancelInfo?.subscription.periodEnd ? new Date(cancelInfo.subscription.periodEnd).toLocaleDateString('en-IN') : 'period end'}</strong></p>
                                    <p>• After that, plan downgrades to <strong>Starter</strong></p>
                                    <p>• No refund will be issued</p>
                                </>
                            )}
                        </div>

                        {alert && (
                            <div className="mb-4">
                                <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
                            </div>
                        )}

                        <label className="flex items-start gap-3 mb-5 cursor-pointer p-3 border border-red-200 rounded-xl bg-red-50/50">
                            <input
                                type="checkbox"
                                checked={confirmed}
                                onChange={e => setConfirmed(e.target.checked)}
                                className="mt-0.5 rounded border-red-400"
                            />
                            <span className="text-sm text-red-800">
                                I understand that I will lose access to premium features and confirm cancellation.
                            </span>
                        </label>

                        <div className="flex gap-2">
                            <Button variant="secondary" className="flex-1" onClick={() => setShowFlow(false)}>
                                Keep My Plan 🙏
                            </Button>
                            <Button
                                variant="danger"
                                className="flex-1"
                                onClick={handleCancel}
                                loading={loading}
                                disabled={!confirmed}
                            >
                                Cancel Subscription
                            </Button>
                        </div>
                    </div>
                )}

                {/* ═══ STEP 5: Success ═══ */}
                {step === 5 && result && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center">
                        {result.type === 'immediate_cancel' ? (
                            <>
                                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
                                    <X size={28} className="text-red-500" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Subscription Cancelled</h3>
                                {result.refund && (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                                        <p className="text-sm text-emerald-800">{result.refund.message}</p>
                                    </div>
                                )}
                                <Button
                                    variant="primary"
                                    className="w-full"
                                    onClick={() => signOut({ callbackUrl: '/login' })}
                                >
                                    Logout & Continue
                                </Button>
                            </>
                        ) : (
                            <>
                                <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
                                    <AlertTriangle size={28} className="text-amber-500" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Cancellation Scheduled</h3>
                                <p className="text-sm text-slate-500 mb-4">{result.message}</p>

                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                                    <p className="text-sm text-blue-700">
                                        Changed your mind? You can reverse this anytime before{' '}
                                        <strong>{result.scheduledAt ? new Date(result.scheduledAt).toLocaleDateString('en-IN') : ''}</strong>
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="primary"
                                        className="flex-1"
                                        onClick={async () => {
                                            const res = await fetch('/api/subscription/cancel', { method: 'DELETE' })
                                            const data = await res.json()
                                            if (data.success) {
                                                setShowFlow(false)
                                                setStep(1)
                                                setResult(null)
                                                onCancelled()
                                            }
                                        }}
                                    >
                                        <Undo2 size={14} /> Undo Cancel
                                    </Button>
                                    <Button variant="secondary" className="flex-1" onClick={() => { setShowFlow(false); onCancelled() }}>
                                        OK, Got It
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}