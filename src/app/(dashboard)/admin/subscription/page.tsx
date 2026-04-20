// FILE: src/app/(admin)/admin/subscription/page.tsx
// UPDATED: Credit system UI + Add-on modals
// New sections: Credit balance, Buy packs, Add-on students/teachers
// ═══════════════════════════════════════════════════════════

'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Alert, PageHeader, Spinner } from '@/components/ui'
import {
    PLANS,
    GST_CONFIG,
    CREDIT_PACKS,
    ADDON_PRICING,
    getPlan,
    getPriceBreakdown,
    getSavings,
    type PlanId,
    type BillingCycle,
    type CreditPackId,
    type ExtraStudentPackId,
    type ExtraTeacherPackId,
} from '@/config/pricing'

// ← getPlanPriceBreakdown sirf plans.ts mein hai, wahan se lo
import { getPlanPriceBreakdown } from '@/lib/plans'

import { MODULE_REGISTRY, type ModuleKey } from '@/lib/moduleRegistry'
import { clsx } from 'clsx'
import { Portal } from '@/components/ui/Portal'
import { CancelSubscriptionFlow } from '@/components/subscription/CancelSubscriptionFlow'
import { Check } from 'lucide-react'

declare global {
    interface Window { Razorpay: any }
}

const PLAN_ORDER: PlanId[] = ['starter', 'growth', 'pro', 'enterprise']
function getPlanRank(id: PlanId) { return PLAN_ORDER.indexOf(id) }

// ── Razorpay SDK ──
function loadRazorpaySDK(): Promise<boolean> {
    return new Promise(resolve => {
        if (typeof window === 'undefined') return resolve(false)
        if (window.Razorpay) return resolve(true)
        const s = document.createElement('script')
        s.src = 'https://checkout.razorpay.com/v1/checkout.js'
        s.async = true
        s.onload = () => resolve(true)
        s.onerror = () => resolve(false)
        document.body.appendChild(s)
    })
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
    })
}

function getModuleLabel(moduleKey: string): string {
    const mod = MODULE_REGISTRY[moduleKey as ModuleKey]
    return mod?.label ?? moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1)
}

// ═══════════════════════════════════════
// CREDIT BALANCE CARD
// ═══════════════════════════════════════
function CreditBalanceCard({
    credits,
    onBuyCredits,
}: {
    credits: any
    onBuyCredits: () => void
}) {
    if (!credits) return null

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-base">💳 Message Credits</h3>
                <button
                    onClick={onBuyCredits}
                    className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Buy Credits
                </button>
            </div>

            {/* Balance */}
            <div className="flex items-baseline gap-2 mb-3">
                <span
                    className={clsx(
                        'text-4xl font-extrabold',
                        credits.lowCreditWarning ? 'text-red-600' : 'text-indigo-600'
                    )}
                >
                    {credits.balance?.toLocaleString('en-IN')}
                </span>
                <span className="text-slate-500 text-sm">credits remaining</span>
                {credits.lowCreditWarning && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                        ⚠️ Low
                    </span>
                )}
            </div>

            {/* Credit guide */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                    { icon: '📱', label: '1 SMS', credits: '1 credit' },
                    { icon: '💬', label: '1 WhatsApp', credits: '1 credit' },
                    { icon: '📧', label: '10 Emails', credits: '1 credit' },
                ].map(item => (
                    <div
                        key={item.label}
                        className="bg-slate-50 rounded-xl p-3 text-center"
                    >
                        <div className="text-xl mb-1">{item.icon}</div>
                        <div className="text-xs font-medium text-slate-700">{item.label}</div>
                        <div className="text-[11px] text-slate-500">{item.credits}</div>
                    </div>
                ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div>
                    <div className="font-bold text-slate-800">
                        {credits.totalEarned?.toLocaleString('en-IN')}
                    </div>
                    <div className="text-slate-500">Total Earned</div>
                </div>
                <div>
                    <div className="font-bold text-slate-800">
                        {credits.totalUsed?.toLocaleString('en-IN')}
                    </div>
                    <div className="text-slate-500">Total Used</div>
                </div>
                <div>
                    <div className="font-bold text-slate-800">
                        {credits.freeCreditsPerMonth?.toLocaleString('en-IN')}
                    </div>
                    <div className="text-slate-500">Free/Month</div>
                </div>
            </div>

            {/* Last 30 days usage */}
            {credits.last30DaysUsage?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500 mb-2">Last 30 days usage:</p>
                    <div className="flex gap-3">
                        {credits.last30DaysUsage.map((u: any) => (
                            <div key={u._id} className="text-xs">
                                <span className="font-medium text-slate-700 capitalize">
                                    {u._id}:
                                </span>{' '}
                                <span className="text-slate-500">{u.count} msgs</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// ═══════════════════════════════════════
// BUY CREDITS MODAL
// ═══════════════════════════════════════
function BuyCreditsModal({
    onClose,
    onSuccess,
}: {
    onClose: () => void
    onSuccess: (credits: number) => void
}) {
    const [selectedPack, setSelectedPack] = useState<CreditPackId>('medium')
    const [buying, setBuying] = useState(false)
    const [error, setError] = useState('')

    const handleBuy = async () => {
        setBuying(true)
        setError('')

        try {
            // Step 1: Create order
            const res = await fetch('/api/credits/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'credit_pack', packId: selectedPack }),
            })
            const order = await res.json()
            if (!res.ok) throw new Error(order.error)

            // Step 2: Open Razorpay
            const loaded = await loadRazorpaySDK()
            if (!loaded) throw new Error('Payment system load nahi hua')

            const rzp = new window.Razorpay({
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount * 100,
                currency: 'INR',
                name: 'Skolify Credits',
                description: order.description,
                order_id: order.orderId,
                handler: async (res: any) => {
                    // Step 3: Verify
                    const vRes = await fetch('/api/credits/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpayOrderId: res.razorpay_order_id,
                            razorpayPaymentId: res.razorpay_payment_id,
                            razorpaySignature: res.razorpay_signature,
                            type: 'credit_pack',
                            packId: selectedPack,
                        }),
                    })
                    const vData = await vRes.json()
                    if (!vRes.ok) throw new Error(vData.error)

                    const pack = CREDIT_PACKS.find(p => p.id === selectedPack)
                    onSuccess(pack?.credits ?? 0)
                },
                modal: { ondismiss: () => setBuying(false) },
                theme: { color: '#4F46E5' },
            })
            rzp.open()
        } catch (err: any) {
            setError(err.message)
            setBuying(false)
        }
    }

    return (
        <div
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 16, zIndex: 9999,
            }}
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            <div
                style={{
                    background: '#fff', borderRadius: 20, padding: 28,
                    width: '100%', maxWidth: 480,
                    boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
                }}
                onClick={e => e.stopPropagation()}
            >
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                    💳 Buy Message Credits
                </h3>
                <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>
                    1 Credit = ₹1 · SMS/WhatsApp = 1cr · 10 Emails = 1cr
                </p>

                {error && (
                    <div style={{
                        background: '#FEF2F2', border: '1px solid #FECACA',
                        borderRadius: 12, padding: '12px 16px', marginBottom: 16,
                    }}>
                        <p style={{ color: '#DC2626', fontSize: 13 }}>{error}</p>
                    </div>
                )}

                {/* Pack selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                    {CREDIT_PACKS.map(pack => (
                        <button
                            key={pack.id}
                            onClick={() => setSelectedPack(pack.id as CreditPackId)}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                                border: selectedPack === pack.id ? '2px solid #4F46E5' : '1.5px solid #E2E8F0',
                                background: selectedPack === pack.id ? '#EEF2FF' : '#fff',
                                textAlign: 'left',
                            }}
                        >
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontWeight: 600, fontSize: 14, color: '#0F172A' }}>
                                        {pack.name}
                                    </span>
                                    {pack.popular && (
                                        <span style={{
                                            background: '#4F46E5', color: '#fff',
                                            fontSize: 10, fontWeight: 700,
                                            padding: '2px 8px', borderRadius: 20,
                                        }}>Popular</span>
                                    )}
                                    {pack.savingsPercent > 0 && (
                                        <span style={{
                                            background: '#ECFDF5', color: '#059669',
                                            fontSize: 10, fontWeight: 600,
                                            padding: '2px 8px', borderRadius: 20,
                                        }}>{pack.savingsPercent}% off</span>
                                    )}
                                </div>
                                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                                    {pack.description}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                                <div style={{ fontWeight: 700, fontSize: 18, color: '#4F46E5' }}>
                                    ₹{pack.price}
                                </div>
                                <div style={{ fontSize: 11, color: '#94A3B8' }}>
                                    {pack.credits} credits
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1, padding: 14, borderRadius: 12,
                            border: '1.5px solid #E2E8F0', background: '#fff',
                            cursor: 'pointer', fontSize: 14, color: '#64748B',
                        }}
                    >Cancel</button>
                    <button
                        onClick={handleBuy}
                        disabled={buying}
                        style={{
                            flex: 2, padding: 14, borderRadius: 12,
                            background: '#4F46E5', color: '#fff', border: 'none',
                            cursor: buying ? 'not-allowed' : 'pointer',
                            fontSize: 15, fontWeight: 600,
                            opacity: buying ? 0.7 : 1,
                        }}
                    >
                        {buying
                            ? 'Processing…'
                            : `Pay ₹${CREDIT_PACKS.find(p => p.id === selectedPack)?.price} →`}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════
// ADD-ON MODAL — FIXED
// Available packs filter + clear remaining slots info
// ═══════════════════════════════════════
function AddonModal({
    type,
    currentLimit,
    currentUsed,
    addonInfo,       // ← NEW: status.addons se pass karo
    onClose,
    onSuccess,
}: {
    type: 'students' | 'teachers'
    currentLimit: number
    currentUsed: number
    addonInfo?: {
        currentExtra: number
        maxAddon: number
        remainingSlots: number
    }
    onClose: () => void
    onSuccess: (added: number) => void
}) {
    const allPacks = type === 'students'
        ? Object.entries(ADDON_PRICING.extraStudents)
        : Object.entries(ADDON_PRICING.extraTeachers)

    // ── Filter packs based on remaining slots ──
    const remainingSlots = addonInfo?.remainingSlots ?? -1

    const availablePacks = allPacks.filter(([, pack]) => {
        if (remainingSlots === -1) return true  // unlimited
        const count = (pack as any).students ?? (pack as any).teachers
        return count <= remainingSlots
    })

    // Agar koi pack fit nahi hoti — sab dikhao but disabled
    const packsToShow = availablePacks.length > 0 ? availablePacks : allPacks
    const noPackAvailable = availablePacks.length === 0

    const [selectedPack, setSelectedPack] = useState(
        availablePacks.length > 0 ? availablePacks[0][0] : allPacks[0][0]
    )
    const [buying, setBuying] = useState(false)
    const [error, setError] = useState('')

    const handleBuy = async () => {
        if (noPackAvailable) return
        setBuying(true)
        setError('')

        try {
            const purchaseType = type === 'students' ? 'extra_students' : 'extra_teachers'

            // Step 1: Create order (cap check happens HERE now)
            const res = await fetch('/api/credits/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: purchaseType, packId: selectedPack }),
            })
            const order = await res.json()
            if (!res.ok) throw new Error(order.error)

            // Step 2: Razorpay
            const loaded = await loadRazorpaySDK()
            if (!loaded) throw new Error('Payment system load nahi hua')

            const rzp = new window.Razorpay({
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount * 100,
                currency: 'INR',
                name: `Skolify — Extra ${type === 'students' ? 'Students' : 'Teachers'}`,
                description: order.description,
                order_id: order.orderId,
                handler: async (res: any) => {
                    // Step 3: Verify
                    const vRes = await fetch('/api/credits/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpayOrderId: res.razorpay_order_id,
                            razorpayPaymentId: res.razorpay_payment_id,
                            razorpaySignature: res.razorpay_signature,
                            type: purchaseType,
                            packId: selectedPack,
                        }),
                    })
                    const vData = await vRes.json()
                    if (!vRes.ok) throw new Error(vData.error)

                    const count = type === 'students'
                        ? (ADDON_PRICING.extraStudents as any)[selectedPack]?.students
                        : (ADDON_PRICING.extraTeachers as any)[selectedPack]?.teachers
                    onSuccess(count ?? 0)
                },
                modal: { ondismiss: () => setBuying(false) },
                theme: { color: '#7C3AED' },
            })
            rzp.open()
        } catch (err: any) {
            setError(err.message)
            setBuying(false)
        }
    }

    return (
        <div
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 16, zIndex: 9999,
            }}
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            <div
                style={{
                    background: '#fff', borderRadius: 20, padding: 28,
                    width: '100%', maxWidth: 460,
                    boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
                }}
                onClick={e => e.stopPropagation()}
            >
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                    {type === 'students' ? '👤' : '👨‍🏫'} Add Extra{' '}
                    {type === 'students' ? 'Students' : 'Teachers/Staff'}
                </h3>

                <p style={{ fontSize: 13, color: '#64748B', marginBottom: 8 }}>
                    Current: {currentUsed}/{currentLimit} {type}
                </p>

                {/* Addon info bar */}
                {addonInfo && addonInfo.maxAddon !== -1 && (
                    <div style={{
                        background: addonInfo.remainingSlots === 0 ? '#FEF2F2' : '#EFF6FF',
                        border: `1px solid ${addonInfo.remainingSlots === 0 ? '#FECACA' : '#BFDBFE'}`,
                        borderRadius: 10,
                        padding: '10px 14px',
                        marginBottom: 12,
                        fontSize: 12,
                        color: addonInfo.remainingSlots === 0 ? '#DC2626' : '#1E40AF',
                    }}>
                        {addonInfo.remainingSlots === 0
                            ? `⚠️ Addon limit full (${addonInfo.currentExtra}/${addonInfo.maxAddon}). Plan upgrade karein.`
                            : `📊 ${addonInfo.currentExtra}/${addonInfo.maxAddon} addon used — ${addonInfo.remainingSlots} slots remaining`
                        }
                    </div>
                )}

                <div style={{
                    background: '#FEF3C7', borderRadius: 10,
                    padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#92400E',
                }}>
                    💡 Add-on permanently increases your limit. Plan upgrade se aur zyada milega.
                </div>

                {error && (
                    <div style={{
                        background: '#FEF2F2', border: '1px solid #FECACA',
                        borderRadius: 12, padding: '12px 16px', marginBottom: 16,
                    }}>
                        <p style={{ color: '#DC2626', fontSize: 13 }}>{error}</p>
                    </div>
                )}

                {noPackAvailable ? (
                    // Limit full — upgrade nudge
                    <div style={{
                        background: '#F8FAFC', borderRadius: 14,
                        padding: 20, textAlign: 'center', marginBottom: 24,
                    }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🚫</div>
                        <p style={{ fontWeight: 600, fontSize: 14, color: '#0F172A', marginBottom: 4 }}>
                            Addon limit reached
                        </p>
                        <p style={{ fontSize: 12, color: '#64748B' }}>
                            Is plan mein aur {type} add nahi ho sakte.
                            Plan upgrade karo for more capacity.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                        {packsToShow.map(([id, pack]) => {
                            const count = (pack as any).students ?? (pack as any).teachers
                            const fitsInSlots = remainingSlots === -1 || count <= remainingSlots
                            const isSelected = selectedPack === id

                            return (
                                <button
                                    key={id}
                                    onClick={() => fitsInSlots && setSelectedPack(id)}
                                    disabled={!fitsInSlots}
                                    style={{
                                        display: 'flex', alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '14px 16px', borderRadius: 14,
                                        cursor: fitsInSlots ? 'pointer' : 'not-allowed',
                                        border: isSelected && fitsInSlots
                                            ? '2px solid #7C3AED'
                                            : '1.5px solid #E2E8F0',
                                        background: isSelected && fitsInSlots
                                            ? '#F5F3FF'
                                            : !fitsInSlots ? '#F8FAFC' : '#fff',
                                        opacity: fitsInSlots ? 1 : 0.45,
                                        textAlign: 'left',
                                    }}
                                >
                                    <div>
                                        <div style={{
                                            fontWeight: 600, fontSize: 14,
                                            color: fitsInSlots ? '#0F172A' : '#94A3B8',
                                        }}>
                                            +{count}{' '}
                                            {type === 'students' ? 'Students' : 'Staff'}
                                            {!fitsInSlots && (
                                                <span style={{
                                                    fontSize: 11, color: '#EF4444',
                                                    marginLeft: 6,
                                                }}>
                                                    (limit exceed)
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                                            ₹{(pack as any).pricePerStudent ?? (pack as any).pricePerTeacher} per{' '}
                                            {type === 'students' ? 'student' : 'staff'}
                                        </div>
                                    </div>
                                    <div style={{
                                        fontWeight: 700, fontSize: 18,
                                        color: fitsInSlots ? '#7C3AED' : '#CBD5E1',
                                    }}>
                                        ₹{(pack as any).price}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}

                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1, padding: 14, borderRadius: 12,
                            border: '1.5px solid #E2E8F0', background: '#fff',
                            cursor: 'pointer', fontSize: 14, color: '#64748B',
                        }}
                    >
                        {noPackAvailable ? 'Close' : 'Cancel'}
                    </button>

                    {!noPackAvailable && (
                        <button
                            onClick={handleBuy}
                            disabled={buying}
                            style={{
                                flex: 2, padding: 14, borderRadius: 12,
                                background: '#7C3AED', color: '#fff', border: 'none',
                                cursor: buying ? 'not-allowed' : 'pointer',
                                fontSize: 15, fontWeight: 600,
                                opacity: buying ? 0.7 : 1,
                            }}
                        >
                            {buying ? 'Processing…' : `Buy Add-on →`}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}


// Real Clock-Style Countdown Component
function RealClockCountdown({ 
  targetDate, 
  type 
}: { 
  targetDate: string
  type: 'trial' | 'subscription' 
}) {
  const [timeLeft, setTimeLeft] = useState({ 
    days: 0, 
    hours: 0, 
    minutes: 0, 
    seconds: 0, 
    isExpired: false 
  })

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate).getTime() - new Date().getTime()
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true })
        return
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        isExpired: false,
      })
    }
    calc()
    const timer = setInterval(calc, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  // Expired state
  if (timeLeft.isExpired) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
        style={{
          background: 'var(--color-danger-light)',
          border: '1px solid var(--color-danger-200)',
        }}
      >
        <span
          className="text-xs font-bold"
          style={{ color: 'var(--color-danger-700)' }}
        >
          ⚡ Expired
        </span>
      </div>
    )
  }

  // Theme
  const theme = type === 'trial'
    ? {
        bg: 'var(--color-warning-50)',
        border: 'var(--color-warning-200)',
        digitBg: 'var(--color-warning-600)',
        labelColor: 'var(--color-warning-600)',
      }
    : {
        bg: 'var(--color-success-50)',
        border: 'var(--color-success-200)',
        digitBg: 'var(--color-success-600)',
        labelColor: 'var(--color-success-600)',
      }

  // Build parts (skip days if 0)
  const parts = []
  if (timeLeft.days > 0) {
    parts.push({ value: timeLeft.days, label: 'd' })
  }
  parts.push(
    { value: timeLeft.hours, label: 'h' },
    { value: timeLeft.minutes, label: 'm' },
    { value: timeLeft.seconds, label: 's' }
  )

  return (
    <div
      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg"
      style={{
        background: theme.bg,
        border: `1px solid ${theme.border}`,
      }}
    >
      <span
        className="text-xs"
        style={{ color: theme.labelColor }}
      >
        🕐
      </span>
      
      <div className="flex items-center gap-1">
        {parts.map((part, idx) => (
          <div key={part.label} className="flex items-center gap-0.5">
            {/* Digit box */}
            <div
              className="flex items-center justify-center px-1.5 py-0.5 rounded min-w-[1.75rem]"
              style={{ background: theme.digitBg }}
            >
              <span
                className="text-xs font-bold tabular-nums text-white"
                style={{ lineHeight: 1 }}
              >
                {String(part.value).padStart(2, '0')}
              </span>
            </div>

            {/* Label */}
            <span
              className="text-[0.625rem] font-semibold"
              style={{ color: theme.labelColor }}
            >
              {part.label}
            </span>

            {/* Colon separator */}
            {idx < parts.length - 1 && (
              <span
                className="text-xs font-bold mx-0.5"
                style={{ color: theme.labelColor }}
              >
                :
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
// LIMIT USAGE BAR
// ═══════════════════════════════════════
function LimitBar({
    label, used, limit, color = '#4F46E5',
    onAddMore,
    addMoreLabel,
}: {
    label: string
    used: number
    limit: number
    color?: string
    onAddMore?: () => void
    addMoreLabel?: string
}) {
    if (limit === -1) {
        return (
            <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-slate-600">{label}</span>
                <span className="font-semibold text-emerald-600">
                    {used.toLocaleString('en-IN')} / Unlimited
                </span>
            </div>
        )
    }

    const pct = Math.min(100, Math.round((used / limit) * 100))
    const isHigh = pct >= 90
    const isMid = pct >= 70

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-600">{label}</span>
                <div className="flex items-center gap-2">
                    <span
                        className={clsx(
                            'text-sm font-semibold',
                            isHigh ? 'text-red-600'
                                : isMid ? 'text-amber-600'
                                    : 'text-slate-700'
                        )}
                    >
                        {used.toLocaleString('en-IN')} / {limit.toLocaleString('en-IN')}
                    </span>

                    {/* ✅ FIX: Always show button if onAddMore exists */}
                    {onAddMore && (
                        <button
                            onClick={onAddMore}
                            className={clsx(
                                'px-2 py-0.5 text-xs font-semibold rounded-lg',
                                'transition-colors whitespace-nowrap',
                                // Color changes based on urgency
                                isHigh
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : isMid
                                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            )}
                        >
                            {addMoreLabel || '+ Add More'}
                        </button>
                    )}
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all"
                    style={{
                        width: `${pct}%`,
                        background: isHigh
                            ? '#EF4444'
                            : isMid
                                ? '#F59E0B'
                                : color,
                    }}
                />
            </div>

            {/* Warning text — only on high */}
            {isHigh && (
                <p className="text-xs text-red-600 mt-1">
                    {limit - used <= 0
                        ? `Limit full! ${addMoreLabel || 'Add more'} to continue.`
                        : `Only ${limit - used} remaining!`}
                </p>
            )}
        </div>
    )
}

// ═══════════════════════════════════════
// PRICE DISPLAY (same as before)
// ═══════════════════════════════════════
function PriceDisplay({
    planId, cycle,
}: {
    planId: PlanId; cycle: BillingCycle
}) {
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
            {cycle === 'yearly' && saved > 0 && (
                <p className="text-xs text-emerald-600 mt-1">
                    ₹{(plan.monthlyPrice * 12).toLocaleString('en-IN')} ki jagah —{' '}
                    <strong>₹{saved.toLocaleString('en-IN')} bachao</strong>
                </p>
            )}
        </div>
    )
}

// ═══════════════════════════════════════
// PLAN QUICK STATS
// ═══════════════════════════════════════
function PlanQuickStats({ planId }: { planId: PlanId }) {
    const plan = getPlan(planId)
    return (
        <div className="bg-slate-50 rounded-lg px-3.5 py-3 mb-4 text-xs text-slate-600 space-y-2">
            <div className="flex gap-3 flex-wrap">
                <span>👤 {plan.maxStudents === -1 ? 'Unlimited' : plan.maxStudents} students</span>
                <span>👨‍🏫 {plan.maxTeachers === -1 ? 'Unlimited' : plan.maxTeachers} teachers</span>
            </div>
            <div className="flex gap-3 flex-wrap">
                <span>💳 {plan.freeCreditsPerMonth.toLocaleString('en-IN')} free credits/mo</span>
                <span>📦 {plan.modules.length} modules</span>
            </div>
            {plan.creditRolloverMonths === -1 && (
                <div className="text-emerald-600 font-medium">♻️ Credits never expire</div>
            )}
            {plan.creditRolloverMonths > 0 && (
                <div className="text-blue-600">
                    ♻️ Credits rollover {plan.creditRolloverMonths} months
                </div>
            )}
        </div>
    )
}

// ═══════════════════════════════════════
// UPGRADE MODAL (same as before, kept intact)
// ═══════════════════════════════════════
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
            .catch(() => { setError('Server error. Please refresh.'); setLoading(false) })
    }, [planId, cycle])

    const handleFreeUpgradeClick = async () => {
        setApplyingFree(true)
        try {
            const res = await fetch('/api/subscription/upgrade/free', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPlanId: planId, billingCycle: cycle }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Free upgrade failed')
            onFreeUpgrade()
        } catch (err: any) {
            setError(err.message)
            setApplyingFree(false)
        }
    }

    return (
        <div
            onClick={e => { if (e.target === e.currentTarget && !busy) onCancel() }}
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 16, zIndex: 9999,
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#fff', borderRadius: 20, padding: 28,
                    width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.4)', position: 'relative',
                }}
            >
                <button
                    onClick={() => { if (!busy) onCancel() }}
                    disabled={busy}
                    style={{
                        position: 'absolute', top: 16, right: 16,
                        width: 32, height: 32, borderRadius: '50%',
                        border: '1px solid #E2E8F0', background: '#F8FAFC',
                        cursor: busy ? 'not-allowed' : 'pointer', fontSize: 14, color: '#64748B',
                    }}
                >✕</button>

                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, paddingRight: 40 }}>
                    {isCycleChange ? 'Switch Billing Cycle' : `Upgrade to ${plan.name}`}
                </h3>
                <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>
                    Free credits: {plan.freeCreditsPerMonth.toLocaleString('en-IN')}/month included
                </p>

                {loading && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                        <Spinner size="lg" />
                    </div>
                )}

                {error && !loading && (
                    <div style={{
                        background: '#FEF2F2', border: '1px solid #FECACA',
                        borderRadius: 12, padding: '14px 18px', marginBottom: 20,
                    }}>
                        <p style={{ color: '#DC2626', fontSize: 14 }}>⚠️ {error}</p>
                    </div>
                )}

                {breakdown && !loading && (
                    <>
                        {breakdown.noPayment ? (
                            <div style={{
                                background: '#ECFDF5', border: '1px solid #A7F3D0',
                                borderRadius: 12, padding: '16px 18px', marginBottom: 24,
                            }}>
                                <p style={{ fontWeight: 600, color: '#065F46', fontSize: 15, marginBottom: 4 }}>
                                    ✅ Credit enough hai!
                                </p>
                                <p style={{ fontSize: 13, color: '#047857' }}>{breakdown.explanation}</p>
                            </div>
                        ) : (
                            <div style={{
                                background: '#F8FAFC', borderRadius: 12,
                                padding: 18, marginBottom: 20, fontSize: 13,
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: '#64748B' }}>
                                    <span>{plan.name} ({cycle})</span>
                                    <span style={{ fontWeight: 500 }}>
                                        ₹{breakdown.breakdown?.newPlanPrice?.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                {breakdown.breakdown?.creditAmount > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', marginBottom: 12 }}>
                                        <span>Credit ({breakdown.breakdown?.daysRemaining} days)</span>
                                        <span>− ₹{breakdown.breakdown?.creditAmount?.toLocaleString('en-IN')}</span>
                                    </div>
                                )}
                                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18 }}>
                                        <span>Total payable</span>
                                        <span style={{ color: plan.color }}>
                                            ₹{breakdown.breakdown?.totalPayable?.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => { if (!busy) onCancel() }}
                                disabled={busy}
                                style={{
                                    flex: 1, padding: 14, borderRadius: 12,
                                    border: '1.5px solid #E2E8F0', background: '#fff',
                                    cursor: busy ? 'not-allowed' : 'pointer', fontSize: 14, color: '#64748B',
                                }}
                            >Cancel</button>

                            {breakdown.noPayment ? (
                                <button
                                    onClick={handleFreeUpgradeClick}
                                    disabled={applyingFree}
                                    style={{
                                        flex: 2, padding: 14, borderRadius: 12,
                                        background: '#059669', color: '#fff', border: 'none',
                                        cursor: applyingFree ? 'not-allowed' : 'pointer',
                                        fontSize: 15, fontWeight: 600, opacity: applyingFree ? 0.7 : 1,
                                    }}
                                >{applyingFree ? 'Upgrading…' : 'Upgrade for free →'}</button>
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
                                        cursor: paying ? 'not-allowed' : 'pointer',
                                        fontSize: 15, fontWeight: 600, opacity: paying ? 0.7 : 1,
                                    }}
                                >
                                    {paying ? 'Opening…' : `Pay ₹${breakdown.breakdown?.totalPayable?.toLocaleString('en-IN')} →`}
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════
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

    // ── NEW modals ──
    const [showBuyCredits, setShowBuyCredits] = useState(false)
    const [showAddon, setShowAddon] = useState<'students' | 'teachers' | null>(null)

    const fetchStatus = useCallback(() => {
        fetch('/api/subscription/status')
            .then(r => r.json())
            .then(d => { setStatus(d); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    useEffect(() => {
        fetchStatus()
        loadRazorpaySDK()
    }, [fetchStatus])

    const openRazorpay = useCallback(async (
        planId: PlanId, orderId: string, amount: number, isUpgrade = false,
    ) => {
        const loaded = await loadRazorpaySDK()
        if (!loaded) {
            setAlert({ type: 'error', msg: 'Payment system load nahi hua. Please refresh.' })
            setPaying(null)
            return
        }
        const plan = getPlan(planId)
        const rzp = new window.Razorpay({
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount, currency: 'INR',
            name: 'Skolify',
            description: isUpgrade ? `Upgrade to ${plan.name}` : `${plan.name} Plan — ${cycle}`,
            order_id: orderId,
            handler: async (res: any) => {
                try {
                    const endpoint = isUpgrade
                        ? '/api/subscription/upgrade/verify'
                        : '/api/subscription/verify'
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
                    fetchStatus()
                } catch (err: any) {
                    setAlert({ type: 'error', msg: err.message ?? 'Verification failed' })
                }
                setPaying(null)
            },
            theme: { color: plan.color },
            modal: { ondismiss: () => setPaying(null) },
        })
        rzp.open()
    }, [cycle, fetchStatus])

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
        const cur = status?.plan as PlanId | undefined
        if (status?.isPaid && cur) {
            const diff = getPlanRank(planId) - getPlanRank(cur)
            const curCycle = status?.billingCycle as BillingCycle | null
            if (diff > 0) {
                setUpgradeModal(planId)
            } else if (diff === 0) {
                if (curCycle === cycle) return
                if (cycle === 'yearly' && curCycle === 'monthly') setUpgradeModal(planId)
                else setAlert({ type: 'error', msg: 'Yearly se monthly switch nahi ho sakta.' })
            } else {
                setAlert({ type: 'error', msg: 'Downgrade ke liye support se contact karein.' })
            }
        } else {
            handleFreshSubscribe(planId)
        }
    }

    const handleFreeUpgrade = (planId: PlanId) => {
        setUpgradeModal(null)
        setSuccess({ planName: getPlan(planId).name })
        fetchStatus()
    }

    // ── Success screen ──
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
                    <p className="text-[13px] text-amber-700">
                        Naye plan ki features activate hone ke liye logout karein aur dobara login karein.
                    </p>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-[15px]"
                >
                    Logout & Login Again →
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
            <PageHeader title="Subscription & Credits" subtitle="Plan, credits aur add-ons manage karein" />

            {/* Modals */}
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

            {showBuyCredits && (
                <Portal>
                    <BuyCreditsModal
                        onClose={() => setShowBuyCredits(false)}
                        onSuccess={(credits) => {
                            setShowBuyCredits(false)
                            setAlert({ type: 'success', msg: `${credits} credits successfully added!` })
                            fetchStatus()
                        }}
                    />
                </Portal>
            )}

            {showAddon && (
                <Portal>
                    <AddonModal
                        type={showAddon}
                        currentLimit={
                            showAddon === 'students'
                                ? status?.limits?.students?.limit ?? 0
                                : status?.limits?.teachers?.limit ?? 0
                        }
                        currentUsed={
                            showAddon === 'students'
                                ? status?.limits?.students?.used ?? 0
                                : status?.limits?.teachers?.used ?? 0
                        }
                        // ── NEW: addonInfo pass karo ──
                        addonInfo={
                            showAddon === 'students'
                                ? {
                                    currentExtra: status?.addons?.extraStudents ?? 0,
                                    maxAddon: status?.addons?.maxAddonStudents ?? -1,
                                    remainingSlots: status?.addons?.remainingAddonStudents ?? -1,
                                }
                                : {
                                    currentExtra: status?.addons?.extraTeachers ?? 0,
                                    maxAddon: status?.addons?.maxAddonTeachers ?? -1,
                                    remainingSlots: status?.addons?.remainingAddonTeachers ?? -1,
                                }
                        }
                        onClose={() => setShowAddon(null)}
                        onSuccess={(added) => {
                            setShowAddon(null)
                            setAlert({
                                type: 'success',
                                msg: `${added} extra ${showAddon} successfully added!`,
                            })
                            fetchStatus()
                        }}
                    />
                </Portal>
            )}

            {/* Alert */}
            {alert && (
                <div className="mb-5">
                    <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
                </div>
            )}

            {/* Blocked module warning */}
            {blockedModule && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3">
                    <span className="text-xl">🔒</span>
                    <div>
                        <p className="font-semibold text-sm text-amber-900 mb-0.5">
                            {getModuleLabel(blockedModule)} module locked hai
                        </p>
                        <p className="text-[13px] text-amber-700">
                            Yeh feature aapke current plan mein nahi hai.
                        </p>
                    </div>
                </div>
            )}

            {/* Status banner */}
            {status && (
                <div className={clsx(
                    'rounded-xl p-4 mb-6 border',
                    status.isPaid ? 'bg-emerald-50 border-emerald-200'
                        : status.isInTrial ? 'bg-blue-50 border-blue-200'
                            : 'bg-red-50 border-red-200'
                )}>
                    <div className="flex items-start gap-3.5">
                        <span className="text-2xl flex-shrink-0">
                            {status.isPaid ? <Check size={14} className="text-green-600" /> : status.isInTrial ? '⏱️' : '❌'}
                        </span>
                        <div className="flex-1">
                            {status.isPaid && (
                                <>
                                    <p className="font-semibold text-sm text-emerald-800 mb-2">
                                        {status.planName} Plan — Active
                                        {currentCycle && (
                                            <span className="font-normal text-emerald-600">
                                                {' '}({currentCycle === 'monthly' ? 'Monthly' : 'Yearly'})
                                            </span>
                                        )}
                                    </p>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <p className="text-[13px] text-emerald-700">
                                            Valid till: {formatDate(status.validTill)}
                                        </p>
                                        <RealClockCountdown targetDate={status.validTill} type="subscription" />
                                    </div>
                                </>
                            )}
                            {status.isInTrial && (
                                <>
                                    <p className="font-semibold text-sm text-blue-800 mb-2">
                                        Free Trial — {status.daysLeft} days remaining
                                    </p>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <p className="text-[13px] text-blue-700">
                                            Subscribe and continue after trial
                                        </p>
                                        <RealClockCountdown targetDate={status.trialEndsAt || status.validTill} type="trial" />
                                    </div>
                                </>
                            )}
                            {status.isExpired && (
                                <>
                                    <p className="font-semibold text-sm text-red-800 mb-0.5">Access Blocked</p>
                                    <p className="text-[13px] text-red-700">Neeche plan choose karein</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Credit Balance Card ── */}
            {status?.credits && (
                <CreditBalanceCard
                    credits={status.credits}
                    onBuyCredits={() => setShowBuyCredits(true)}
                />
            )}

            {/* ── Usage Limits ── */}
            {status?.limits && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-900 text-base">
                            📊 Usage & Limits
                        </h3>

                        {/* Add-on buttons — top right, always visible */}
                        <div className="flex items-center gap-2">
                            {status.addons?.canPurchaseStudents && (
                                <button
                                    onClick={() => setShowAddon('students')}
                                    className={clsx(
                                        'flex items-center gap-1.5 px-3 py-1.5',
                                        'bg-indigo-50 border border-indigo-200',
                                        'text-indigo-700 text-xs font-semibold',
                                        'rounded-lg hover:bg-indigo-100 transition-colors'
                                    )}
                                >
                                    👤 +Students
                                </button>
                            )}
                            {status.addons?.canPurchaseTeachers && (
                                <button
                                    onClick={() => setShowAddon('teachers')}
                                    className={clsx(
                                        'flex items-center gap-1.5 px-3 py-1.5',
                                        'bg-violet-50 border border-violet-200',
                                        'text-violet-700 text-xs font-semibold',
                                        'rounded-lg hover:bg-violet-100 transition-colors'
                                    )}
                                >
                                    👨‍🏫 +Teachers
                                </button>
                            )}
                        </div>
                    </div>

                    <LimitBar
                        label="Students"
                        used={status.limits.students?.used ?? 0}
                        limit={status.limits.students?.limit ?? 0}
                        color="#4F46E5"
                        onAddMore={
                            status.addons?.canPurchaseStudents
                                ? () => setShowAddon('students')
                                : undefined
                        }
                        addMoreLabel="+ Add-on"
                    />

                    <LimitBar
                        label="Teachers & Staff"
                        used={status.limits.teachers?.used ?? 0}
                        limit={status.limits.teachers?.limit ?? 0}
                        color="#7C3AED"
                        onAddMore={
                            status.addons?.canPurchaseTeachers
                                ? () => setShowAddon('teachers')
                                : undefined
                        }
                        addMoreLabel="+ Add-on"
                    />

                    {((Number(status.addons?.extraStudents) > 0)
                        || (Number(status.addons?.extraTeachers) > 0)) && (
                            <div className="mt-3 pt-3 border-t border-slate-100">
                                <p className="text-xs font-medium text-slate-500 mb-1">
                                    Active Add-ons:
                                </p>
                                <div className="flex gap-3 flex-wrap">
                                    {Number(status.addons?.extraStudents) > 0 && (
                                        <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                                            ✅ +{status.addons.extraStudents} students
                                        </span>
                                    )}
                                    {Number(status.addons?.extraTeachers) > 0 && (
                                        <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                                            ✅ +{status.addons.extraTeachers} teachers
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                    {(() => {
                        const nextPlan = status.nextPlan
                        if (!nextPlan) return null
                        return (
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <p className="text-xs text-slate-500 mb-2">
                                    💡 <strong>{nextPlan.name}</strong> plan mein
                                    upgrade karein for more limits
                                </p>
                                <button
                                    onClick={() => setUpgradeModal(nextPlan.id)}
                                    className="text-xs font-semibold text-indigo-600 hover:underline"
                                >
                                    Upgrade to {nextPlan.name} →
                                </button>
                            </div>
                        )
                    })()}
                </div>
            )}

            {/* Billing toggle */}
            <div className="flex justify-center mb-8">
                <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                    {(['monthly', 'yearly'] as BillingCycle[]).map(c => (
                        <button
                            key={c}
                            onClick={() => setCycle(c)}
                            className={clsx(
                                'px-5 py-2 rounded-lg text-sm font-medium transition-all',
                                cycle === c ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            )}
                        >
                            {c === 'monthly' ? 'Monthly' : (
                                <span>Yearly{' '}
                                    <span className="text-[11px] text-emerald-600 font-semibold">2 months free</span>
                                </span>
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
                                boxShadow: isHL
                                    ? `0 0 0 5px ${plan.color}15, 0 8px 32px ${plan.color}18`
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

                            <PlanQuickStats planId={plan.id} />

                            <ul className="space-y-2 mb-6 flex-1">
                                {plan.features.map(f => (
                                    <li key={f} className="flex items-start gap-2 text-[13px] leading-snug">
                                        <span className="text-emerald-500 font-bold flex-shrink-0 mt-0.5">✓</span>
                                        <span className="text-slate-700">{f}</span>
                                    </li>
                                ))}
                                {plan.notIncluded?.map(f => (
                                    <li key={f} className="flex items-start gap-2 text-[13px] leading-snug opacity-40">
                                        <span className="flex-shrink-0 mt-0.5">✕</span>
                                        <span>{f}</span>
                                    </li>
                                ))}
                            </ul>

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
                                {paying === plan.id ? 'Processing…'
                                    : isExactlyCurrent ? '✓ Current Plan'
                                        : isCycleDowngrade ? 'Not Available'
                                            : isCycleUpgrade ? 'Switch to Yearly →'
                                                : isDown ? 'Contact Support'
                                                    : isUpgrade ? `Upgrade to ${plan.name} →`
                                                        : `Get ${plan.name} →`}
                            </button>
                        </div>
                    )
                })}
            </div>

            <div className="text-center mt-7 text-[13px] text-slate-400 space-y-1">
                <p>Secure payment by Razorpay · Cancel anytime</p>
            </div>

            {/* Scheduled cancel banner */}
            {status?.isScheduledCancel && (
                <div className="mt-7 bg-amber-50 border border-amber-200 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                        <span className="text-xl">⏳</span>
                        <div className="flex-1">
                            <p className="font-semibold text-sm text-amber-900 mb-1">
                                Cancellation Scheduled
                            </p>
                            <p className="text-[13px] text-amber-700">
                                Your {status.planName} plan will end on{' '}
                                <strong>{formatDate(status.scheduledCancelAt!)}</strong>.
                            </p>
                        </div>
                        <button
                            onClick={async () => {
                                const res = await fetch('/api/subscription/cancel', { method: 'DELETE' })
                                const data = await res.json()
                                if (data.success) {
                                    setAlert({ type: 'success', msg: 'Cancellation reversed!' })
                                    fetchStatus()
                                }
                            }}
                            className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-xl"
                        >
                            Undo Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Cancel flow */}
            {status?.isPaid && !status?.isScheduledCancel && currentPlanId && (
                <CancelSubscriptionFlow
                    currentPlan={currentPlanId}
                    onCancelled={fetchStatus}
                />
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