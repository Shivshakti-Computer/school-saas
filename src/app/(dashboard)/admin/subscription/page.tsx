// FILE: src/app/(admin)/admin/subscription/page.tsx
// UPDATED: Complete code with all features | Compact design | Badge fixed
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
    STORAGE_PACKS,
    type StoragePackId,
} from '@/config/pricing'

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
        <div className="card p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-[var(--text-primary)]">Message Credits</h3>
                <button
                    onClick={onBuyCredits}
                    className="btn-primary btn-sm"
                >
                    Buy Credits
                </button>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
                <span className={clsx(
                    'text-3xl font-bold',
                    credits.lowCreditWarning ? 'text-[var(--color-danger-600)]' : 'text-[var(--color-primary-600)]'
                )}>
                    {credits.balance?.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-[var(--text-muted)]">credits</span>
                {credits.lowCreditWarning && (
                    <span className="badge badge-danger">Low</span>
                )}
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                    { icon: '📱', label: 'SMS', credits: '1 credit' },
                    { icon: '💬', label: 'WhatsApp', credits: '1 credit' },
                    { icon: '📧', label: 'Email', credits: '10 credits' },
                ].map(item => (
                    <div key={item.label} className="bg-[var(--bg-subtle)] rounded-lg p-2 text-center">
                        <div className="text-lg mb-1">{item.icon}</div>
                        <div className="text-[11px] font-medium text-[var(--text-secondary)]">{item.label}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{item.credits}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs border-t border-[var(--border)] pt-3">
                <div>
                    <div className="font-semibold text-[var(--text-secondary)]">
                        {credits.totalEarned?.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">Total Earned</div>
                </div>
                <div>
                    <div className="font-semibold text-[var(--text-secondary)]">
                        {credits.totalUsed?.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">Total Used</div>
                </div>
                <div>
                    <div className="font-semibold text-[var(--text-secondary)]">
                        {credits.freeCreditsPerMonth?.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">Free/Month</div>
                </div>
            </div>

            {credits.last30DaysUsage?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--border)]">
                    <p className="text-[11px] text-[var(--text-muted)] mb-2">Last 30 days usage:</p>
                    <div className="flex gap-2 flex-wrap">
                        {credits.last30DaysUsage.map((u: any) => (
                            <div key={u._id} className="text-[11px]">
                                <span className="font-medium text-[var(--text-secondary)] capitalize">{u._id}:</span>{' '}
                                <span className="text-[var(--text-muted)]">{u.count} msgs</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// ═══════════════════════════════════════
// STORAGE CARD
// ═══════════════════════════════════════
function StorageCard({
    storage,
    onManageStorage,
}: {
    storage: any
    onManageStorage: () => void
}) {
    if (!storage) return null

    const isUnlimited = storage.totalLimitGB === -1
    const usedGB: number = storage.usedGB ?? 0
    const totalGB: number = storage.totalLimitGB ?? 0
    const addonGB: number = storage.addonGB ?? 0
    const baseGB: number = storage.baseGB ?? 0

    const pct = isUnlimited ? 0 : Math.min(100, Math.round((usedGB / totalGB) * 100))
    const isHigh = !isUnlimited && pct >= 90
    const isMid = !isUnlimited && pct >= 70

    return (
        <div className="card p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-[var(--text-primary)]">Storage</h3>
                <button
                    onClick={onManageStorage}
                    className={clsx(
                        'btn-sm',
                        isHigh
                            ? 'btn-danger-solid'
                            : 'btn-primary'
                    )}
                >
                    {addonGB > 0 ? 'Manage' : 'Buy'}
                </button>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
                <span className={clsx(
                    'text-3xl font-bold',
                    isHigh ? 'text-[var(--color-danger-600)]' : isMid ? 'text-[var(--color-warning-600)]' : 'text-[var(--color-violet-600)]'
                )}>
                    {isUnlimited ? '∞' : `${usedGB.toFixed(1)}`}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                    {isUnlimited ? 'Unlimited' : `GB of ${totalGB} GB`}
                </span>
                {isHigh && (
                    <span className="badge badge-danger">Almost Full</span>
                )}
            </div>

            {!isUnlimited && (
                <div className="mb-3">
                    <div className="h-2 bg-[var(--bg-muted)] rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all"
                            style={{
                                width: `${pct}%`,
                                background: isHigh
                                    ? 'var(--color-danger-500)'
                                    : isMid
                                        ? 'var(--color-warning-500)'
                                        : 'var(--color-violet-500)',
                            }}
                        />
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-[var(--text-muted)]">
                        <span>{pct}% used</span>
                        <span>{(totalGB - usedGB).toFixed(1)} GB free</span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-[var(--bg-subtle)] rounded-lg p-2">
                    <div className="text-[10px] text-[var(--text-muted)] mb-1">Plan Storage</div>
                    <div className="font-semibold text-sm text-[var(--text-secondary)]">
                        {baseGB === -1 ? 'Unlimited' : `${baseGB} GB`}
                    </div>
                    <div className="text-[9px] text-[var(--text-muted)] mt-0.5">included in plan</div>
                </div>
                <div className={clsx(
                    'rounded-lg p-2',
                    addonGB > 0 ? 'bg-[var(--color-violet-50)]' : 'bg-[var(--bg-subtle)]'
                )}>
                    <div className="text-[10px] text-[var(--text-muted)] mb-1">Add-on Storage</div>
                    <div className={clsx(
                        'font-semibold text-sm',
                        addonGB > 0 ? 'text-[var(--color-violet-700)]' : 'text-[var(--text-muted)]'
                    )}>
                        {addonGB > 0 ? `+${addonGB} GB` : 'None'}
                    </div>
                    <div className="text-[9px] text-[var(--text-muted)] mt-0.5">
                        {addonGB > 0
                            ? storage.autoRenew
                                ? `auto-renews${storage.addonExpiresAt ? ` · ${formatDate(storage.addonExpiresAt)}` : ''}`
                                : storage.addonExpiresAt
                                    ? `expires ${formatDate(storage.addonExpiresAt)}`
                                    : 'active'
                            : 'not purchased'}
                    </div>
                </div>
            </div>

            {storage.addonExpired && (
                <div className="bg-[var(--color-danger-50)] border border-[var(--color-danger-200)] rounded-lg p-2 mb-3">
                    <p className="text-[11px] font-semibold text-[var(--color-danger-700)] mb-0.5">
                        ⚠️ Storage Addon Expired
                    </p>
                    <p className="text-[10px] text-[var(--color-danger-600)]">
                        Your storage addon has expired. Please renew or download files.
                    </p>
                </div>
            )}

            {isHigh && !storage.addonExpired && (
                <div className="bg-[var(--color-danger-50)] border border-[var(--color-danger-200)] rounded-lg p-2 mb-3">
                    <p className="text-[11px] font-semibold text-[var(--color-danger-700)] mb-0.5">
                        Storage Almost Full!
                    </p>
                    <p className="text-[10px] text-[var(--color-danger-600)]">
                        Only {(totalGB - usedGB).toFixed(1)} GB remaining. Purchase add-on to prevent upload failures.
                    </p>
                </div>
            )}

            {!isUnlimited && (
                <div className="pt-3 border-t border-[var(--border)]">
                    <p className="text-[10px] text-[var(--text-muted)] mb-2">Available packs:</p>
                    <div className="flex gap-2 flex-wrap">
                        {STORAGE_PACKS.map(pack => (
                            <button
                                key={pack.id}
                                onClick={onManageStorage}
                                className="text-[10px] font-medium px-2 py-1 bg-[var(--color-violet-50)] text-[var(--color-violet-700)] border border-[var(--color-violet-200)] rounded hover:bg-[var(--color-violet-100)] transition-colors"
                            >
                                +{pack.storageGB} GB · ₹{pack.monthlyPrice}/mo
                            </button>
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
            const res = await fetch('/api/credits/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'credit_pack', packId: selectedPack }),
            })
            const order = await res.json()
            if (!res.ok) throw new Error(order.error)

            const loaded = await loadRazorpaySDK()
            if (!loaded) throw new Error('Payment system failed to load')

            const rzp = new window.Razorpay({
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount * 100,
                currency: 'INR',
                name: 'Skolify Credits',
                description: order.description,
                order_id: order.orderId,
                handler: async (res: any) => {
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
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div className="modal-panel modal-sm" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">💳 Buy Message Credits</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <p className="text-sm text-[var(--text-muted)] mb-4">
                        1 Credit = ₹1 · SMS/WhatsApp = 1 credit · 10 Emails = 1 credit
                    </p>

                    {error && (
                        <div className="bg-[var(--color-danger-50)] border border-[var(--color-danger-200)] rounded-lg p-3 mb-4">
                            <p className="text-sm text-[var(--color-danger-600)]">{error}</p>
                        </div>
                    )}

                    <div className="flex flex-col gap-2 mb-4">
                        {CREDIT_PACKS.map(pack => (
                            <button
                                key={pack.id}
                                onClick={() => setSelectedPack(pack.id as CreditPackId)}
                                className={clsx(
                                    'flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer text-left transition-all',
                                    selectedPack === pack.id
                                        ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]'
                                        : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--color-primary-300)]'
                                )}
                            >
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm text-[var(--text-primary)]">
                                            {pack.name}
                                        </span>
                                        {pack.popular && (
                                            <span className="badge badge-brand">Popular</span>
                                        )}
                                        {pack.savingsPercent > 0 && (
                                            <span className="badge badge-success">{pack.savingsPercent}% off</span>
                                        )}
                                    </div>
                                    <div className="text-xs text-[var(--text-muted)] mt-0.5">
                                        {pack.description}
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0 ml-3">
                                    <div className="font-bold text-[var(--color-primary-600)]">
                                        ₹{pack.price}
                                    </div>
                                    <div className="text-[10px] text-[var(--text-muted)]">
                                        {pack.credits} credits
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="modal-footer">
                    <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
                    <button
                        onClick={handleBuy}
                        disabled={buying}
                        className="btn-primary flex-[2]"
                    >
                        {buying
                            ? 'Processing…'
                            : `Pay ₹${CREDIT_PACKS.find(p => p.id === selectedPack)?.price}`}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════
// STORAGE ADDON MODAL
// ═══════════════════════════════════════
function StorageAddonModal({
    currentStorage,
    onClose,
    onSuccess,
}: {
    currentStorage: any
    onClose: () => void
    onSuccess: () => void
}) {
    const [view, setView] = useState<'buy' | 'cancel'>('buy')
    const [selectedPack, setSelectedPack] = useState<StoragePackId>('storage_20gb')
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
    const [buying, setBuying] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [canceling, setCanceling] = useState(false)
    const [error, setError] = useState('')

    const hasAddon = (currentStorage?.addonGB ?? 0) > 0
    const isExpired = currentStorage?.addonExpired ?? false
    const canCancel = hasAddon && !isExpired && currentStorage?.autoRenew

    const handleBuy = async () => {
        setBuying(true)
        setError('')
        try {
            const res = await fetch('/api/credits/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'storage_pack', packId: selectedPack, billingCycle }),
            })
            const order = await res.json()
            if (!res.ok) throw new Error(order.error)

            const loaded = await loadRazorpaySDK()
            if (!loaded) throw new Error('Payment system failed to load')

            const rzp = new window.Razorpay({
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount * 100,
                currency: 'INR',
                name: 'Skolify Storage',
                description: order.description,
                order_id: order.orderId,
                handler: async (res: any) => {
                    const vRes = await fetch('/api/credits/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpayOrderId: res.razorpay_order_id,
                            razorpayPaymentId: res.razorpay_payment_id,
                            razorpaySignature: res.razorpay_signature,
                            type: 'storage_pack',
                            packId: selectedPack,
                            billingCycle,
                        }),
                    })
                    const vData = await vRes.json()
                    if (!vRes.ok) throw new Error(vData.error)
                    const pack = STORAGE_PACKS.find(p => p.id === selectedPack)
                    alert(`${pack?.storageGB} GB storage added successfully!`)
                    onSuccess()
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

    const handleExport = async () => {
        setExporting(true)
        setError('')
        try {
            const res = await fetch('/api/storage/export', { method: 'POST' })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            alert(
                `Download links sent to your email!\n\nFiles: ${data.fileCount}\nSize: ${data.totalSizeMB} MB\nExpires: ${new Date(data.expiresAt).toLocaleDateString('en-IN')}`
            )
        } catch (err: any) {
            setError(err.message)
        } finally {
            setExporting(false)
        }
    }

    const handleCancel = async (downloadCompleted: boolean) => {
        if (!confirm(
            downloadCompleted
                ? 'Are you sure you want to cancel? Files will be deleted after 30 days.'
                : 'We recommend downloading your files first. Cancel anyway?'
        )) return

        setCanceling(true)
        setError('')
        try {
            const res = await fetch('/api/storage/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ downloadCompleted }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            alert(
                `Storage addon canceled.\n\nYour files are safe till ${new Date(data.gracePeriodEndsAt).toLocaleDateString('en-IN')}\n(30 days grace period)`
            )
            onSuccess()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setCanceling(false)
        }
    }

    return (
        <Portal>
            <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
                <div className="modal-panel modal-lg" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3 className="modal-title">📦 Storage Add-on</h3>
                        <button className="modal-close" onClick={onClose}>✕</button>
                    </div>
                    <div className="modal-body">
                        {canCancel && (
                            <div className="flex gap-2 mb-4 bg-[var(--bg-muted)] p-1 rounded-lg">
                                {(['buy', 'cancel'] as const).map(v => (
                                    <button
                                        key={v}
                                        onClick={() => setView(v)}
                                        className={clsx(
                                            'flex-1 py-2 rounded-md text-sm font-medium transition-all',
                                            view === v
                                                ? 'bg-[var(--bg-card)] text-[var(--text-primary)]'
                                                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                        )}
                                    >
                                        {v === 'buy' ? 'Buy More' : 'Cancel Addon'}
                                    </button>
                                ))}
                            </div>
                        )}

                        {error && (
                            <div className="bg-[var(--color-danger-50)] border border-[var(--color-danger-200)] rounded-lg p-3 mb-4">
                                <p className="text-sm text-[var(--color-danger-600)]">{error}</p>
                            </div>
                        )}

                        {view === 'buy' && (
                            <>
                                <div className="bg-[var(--bg-subtle)] rounded-lg p-3 mb-4">
                                    <div className="text-xs text-[var(--text-muted)] mb-1">Current Storage</div>
                                    <div className="text-lg font-bold text-[var(--text-primary)]">
                                        {currentStorage?.totalLimitGB === -1
                                            ? 'Unlimited'
                                            : `${currentStorage?.totalLimitGB ?? 0} GB total`}
                                    </div>
                                    <div className="text-xs text-[var(--text-muted)] mt-0.5">
                                        {(currentStorage?.usedGB ?? 0).toFixed(1)} GB used
                                        {(currentStorage?.addonGB ?? 0) > 0 && (
                                            <> · {currentStorage.addonGB} GB addon active</>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2 mb-4 bg-[var(--bg-muted)] p-1 rounded-lg">
                                    {(['monthly', 'yearly'] as const).map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setBillingCycle(c)}
                                            className={clsx(
                                                'flex-1 py-2 rounded-md text-sm font-medium transition-all',
                                                billingCycle === c
                                                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)]'
                                                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                            )}
                                        >
                                            {c === 'monthly' ? 'Monthly' : (
                                                <>Yearly <span className="text-[var(--color-success-600)] ml-1">2 months free</span></>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex flex-col gap-2 mb-4">
                                    {STORAGE_PACKS.map(pack => {
                                        const price = billingCycle === 'monthly'
                                            ? pack.monthlyPrice
                                            : pack.yearlyPrice
                                        const isSelected = selectedPack === pack.id

                                        return (
                                            <button
                                                key={pack.id}
                                                onClick={() => setSelectedPack(pack.id as StoragePackId)}
                                                className={clsx(
                                                    'flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer text-left transition-all',
                                                    isSelected
                                                        ? 'border-[var(--color-violet-500)] bg-[var(--color-violet-50)]'
                                                        : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--color-violet-300)]'
                                                )}
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-sm text-[var(--text-primary)]">
                                                            {pack.name}
                                                        </span>
                                                        {pack.popular && (
                                                            <span className="badge badge-brand">Popular</span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-[var(--text-muted)] mt-0.5">
                                                        {pack.description} · ₹{pack.pricePerDay}/day
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0 ml-3">
                                                    <div className="font-bold text-[var(--color-violet-600)]">
                                                        ₹{price}
                                                    </div>
                                                    <div className="text-[10px] text-[var(--text-muted)]">
                                                        /{billingCycle === 'monthly' ? 'month' : 'year'}
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </>
                        )}

                        {view === 'cancel' && (
                            <>
                                <div className="bg-[var(--color-warning-50)] border border-[var(--color-warning-200)] rounded-lg p-3 mb-4">
                                    <p className="text-sm font-semibold text-[var(--color-warning-800)] mb-2">
                                        ⚠️ Before Canceling
                                    </p>
                                    <p className="text-xs text-[var(--color-warning-700)] mb-3">
                                        We recommend downloading all your files first. Your data will be safe for 30 days after cancellation.
                                    </p>
                                    <button
                                        onClick={handleExport}
                                        disabled={exporting}
                                        className="w-full py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--color-warning-600)] text-[var(--color-warning-700)] text-sm font-medium hover:bg-[var(--color-warning-50)] transition-colors"
                                    >
                                        {exporting ? 'Preparing download…' : '📥 Download All Files (Email)'}
                                    </button>
                                </div>

                                <div className="bg-[var(--bg-subtle)] rounded-lg p-3 mb-4">
                                    <h4 className="text-sm font-semibold mb-2 text-[var(--text-secondary)]">
                                        What happens after cancellation?
                                    </h4>
                                    <ul className="text-xs text-[var(--text-muted)] space-y-1.5 pl-4 list-disc">
                                        <li>No more charges from next billing cycle</li>
                                        <li>Upload blocked immediately</li>
                                        <li>Files safe for 30 days (grace period)</li>
                                        <li>Download anytime during grace period</li>
                                        <li>Auto-delete after grace period ends</li>
                                    </ul>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button onClick={onClose} className="btn-ghost flex-1">
                            {view === 'cancel' ? 'Keep Addon' : 'Cancel'}
                        </button>
                        {view === 'buy' ? (
                            <button
                                onClick={handleBuy}
                                disabled={buying}
                                className="btn-primary flex-[2]"
                            >
                                {buying ? 'Processing…' : 'Purchase'}
                            </button>
                        ) : (
                            <button
                                onClick={() => handleCancel(false)}
                                disabled={canceling}
                                className="btn-danger-solid flex-1"
                            >
                                {canceling ? 'Canceling…' : 'Cancel Addon'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </Portal>
    )
}

// ═══════════════════════════════════════
// ADD-ON MODAL
// ═══════════════════════════════════════
function AddonModal({
    type,
    currentLimit,
    currentUsed,
    addonInfo,
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

    const remainingSlots = addonInfo?.remainingSlots ?? -1

    const availablePacks = allPacks.filter(([, pack]) => {
        if (remainingSlots === -1) return true
        const count = (pack as any).students ?? (pack as any).teachers
        return count <= remainingSlots
    })

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

            const res = await fetch('/api/credits/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: purchaseType, packId: selectedPack }),
            })
            const order = await res.json()
            if (!res.ok) throw new Error(order.error)

            const loaded = await loadRazorpaySDK()
            if (!loaded) throw new Error('Payment system failed to load')

            const rzp = new window.Razorpay({
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount * 100,
                currency: 'INR',
                name: `Skolify — Extra ${type === 'students' ? 'Students' : 'Teachers'}`,
                description: order.description,
                order_id: order.orderId,
                handler: async (res: any) => {
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
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div className="modal-panel modal-lg" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">
                        {type === 'students' ? '👤' : '👨‍🏫'} Add Extra{' '}
                        {type === 'students' ? 'Students' : 'Teachers/Staff'}
                    </h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <p className="text-sm text-[var(--text-muted)] mb-3">
                        Current: {currentUsed}/{currentLimit} {type}
                    </p>

                    {addonInfo && addonInfo.maxAddon !== -1 && (
                        <div className={clsx(
                            'border rounded-lg p-3 mb-3 text-xs',
                            addonInfo.remainingSlots === 0
                                ? 'bg-[var(--color-danger-50)] border-[var(--color-danger-200)] text-[var(--color-danger-700)]'
                                : 'bg-[var(--color-info-50)] border-[var(--color-info-200)] text-[var(--color-info-800)]'
                        )}>
                            {addonInfo.remainingSlots === 0
                                ? `⚠️ Addon limit full (${addonInfo.currentExtra}/${addonInfo.maxAddon}). Please upgrade your plan.`
                                : `📊 ${addonInfo.currentExtra}/${addonInfo.maxAddon} addon used — ${addonInfo.remainingSlots} slots remaining`
                            }
                        </div>
                    )}

                    <div className="bg-[var(--color-warning-50)] border border-[var(--color-warning-200)] rounded-lg p-3 mb-4">
                        <p className="text-xs text-[var(--color-warning-800)]">
                            💡 Add-on permanently increases your limit. Plan upgrade provides more capacity.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-[var(--color-danger-50)] border border-[var(--color-danger-200)] rounded-lg p-3 mb-4">
                            <p className="text-sm text-[var(--color-danger-600)]">{error}</p>
                        </div>
                    )}

                    {noPackAvailable ? (
                        <div className="bg-[var(--bg-subtle)] rounded-lg p-5 text-center mb-4">
                            <div className="text-3xl mb-2">🚫</div>
                            <p className="font-semibold text-sm text-[var(--text-primary)] mb-1">
                                Addon limit reached
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                                No more {type} can be added in this plan. Please upgrade for more capacity.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            {packsToShow.map(([id, pack]) => {
                                const count = (pack as any).students ?? (pack as any).teachers
                                const fitsInSlots = remainingSlots === -1 || count <= remainingSlots
                                const isSelected = selectedPack === id

                                return (
                                    <button
                                        key={id}
                                        onClick={() => fitsInSlots && setSelectedPack(id)}
                                        disabled={!fitsInSlots}
                                        className={clsx(
                                            'flex items-center justify-between p-3 rounded-lg border-2 text-left transition-all',
                                            isSelected && fitsInSlots
                                                ? 'border-[var(--color-violet-500)] bg-[var(--color-violet-50)]'
                                                : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--color-violet-300)]',
                                            !fitsInSlots && 'opacity-50 cursor-not-allowed bg-[var(--bg-muted)]'
                                        )}
                                    >
                                        <div>
                                            <div className={clsx(
                                                'font-semibold text-sm',
                                                fitsInSlots ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                                            )}>
                                                +{count}{' '}
                                                {type === 'students' ? 'Students' : 'Staff'}
                                                {!fitsInSlots && (
                                                    <span className="text-[10px] text-[var(--color-danger-500)] ml-1">
                                                        (limit exceed)
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-[var(--text-muted)] mt-0.5">
                                                ₹{(pack as any).pricePerStudent ?? (pack as any).pricePerTeacher} per{' '}
                                                {type === 'students' ? 'student' : 'staff'}
                                            </div>
                                        </div>
                                        <div className={clsx(
                                            'font-bold',
                                            fitsInSlots ? 'text-[var(--color-violet-600)]' : 'text-[var(--text-muted)]'
                                        )}>
                                            ₹{(pack as any).price}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button onClick={onClose} className="btn-ghost flex-1">
                        {noPackAvailable ? 'Close' : 'Cancel'}
                    </button>
                    {!noPackAvailable && (
                        <button
                            onClick={handleBuy}
                            disabled={buying}
                            className="btn-primary flex-[2]"
                        >
                            {buying ? 'Processing…' : 'Buy Add-on'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════
// REAL CLOCK COUNTDOWN
// ═══════════════════════════════════════
function RealClockCountdown({ targetDate, type }: { targetDate: string; type: 'trial' | 'subscription' }) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false })

    useEffect(() => {
        const calc = () => {
            const diff = new Date(targetDate).getTime() - Date.now()
            if (diff <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true })
                return
            }
            setTimeLeft({
                days: Math.floor(diff / 86400000),
                hours: Math.floor((diff % 86400000) / 3600000),
                minutes: Math.floor((diff % 3600000) / 60000),
                seconds: Math.floor((diff % 60000) / 1000),
                isExpired: false,
            })
        }
        calc()
        const t = setInterval(calc, 1000)
        return () => clearInterval(t)
    }, [targetDate])

    if (timeLeft.isExpired) {
        return (
            <span className="badge badge-danger">Expired</span>
        )
    }

    const theme = type === 'trial'
        ? { bg: 'var(--color-warning-50)', border: 'var(--color-warning-200)', digitBg: 'var(--color-warning-600)', labelColor: 'var(--color-warning-700)' }
        : { bg: 'var(--color-success-50)', border: 'var(--color-success-200)', digitBg: 'var(--color-success-600)', labelColor: 'var(--color-success-700)' }

    const parts = []
    if (timeLeft.days > 0) parts.push({ value: timeLeft.days, label: 'd' })
    parts.push(
        { value: timeLeft.hours, label: 'h' },
        { value: timeLeft.minutes, label: 'm' },
        { value: timeLeft.seconds, label: 's' }
    )

    return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border"
            style={{ background: theme.bg, borderColor: theme.border }}>
            <span style={{ color: theme.labelColor }}>🕐</span>
            <div className="flex items-center gap-0.5">
                {parts.map((part, idx) => (
                    <div key={part.label} className="flex items-center gap-0.5">
                        <div className="flex items-center justify-center px-1.5 py-0.5 rounded"
                            style={{ background: theme.digitBg }}>
                            <span className="text-[10px] font-bold tabular-nums text-white" style={{ lineHeight: 1 }}>
                                {String(part.value).padStart(2, '0')}
                            </span>
                        </div>
                        <span className="text-[9px] font-semibold" style={{ color: theme.labelColor }}>
                            {part.label}
                        </span>
                        {idx < parts.length - 1 && (
                            <span className="text-[10px] font-bold mx-0.5" style={{ color: theme.labelColor }}>:</span>
                        )}
                    </div>
                ))}
            </div>
        </span>
    )
}

// ═══════════════════════════════════════
// LIMIT BAR
// ═══════════════════════════════════════
function LimitBar({
    label, used, limit, color = '#4F46E5', onAddMore, addMoreLabel,
}: {
    label: string; used: number; limit: number; color?: string
    onAddMore?: () => void; addMoreLabel?: string
}) {
    if (limit === -1) {
        return (
            <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-[var(--text-secondary)]">{label}</span>
                <span className="font-semibold text-[var(--color-success-600)]">
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
                <span className="text-sm text-[var(--text-secondary)]">{label}</span>
                <div className="flex items-center gap-2">
                    <span className={clsx(
                        'text-sm font-semibold',
                        isHigh ? 'text-[var(--color-danger-600)]' : isMid ? 'text-[var(--color-warning-600)]' : 'text-[var(--text-secondary)]'
                    )}>
                        {used.toLocaleString('en-IN')} / {limit.toLocaleString('en-IN')}
                    </span>
                    {onAddMore && (
                        <button
                            onClick={onAddMore}
                            className={clsx(
                                'px-2 py-0.5 text-xs font-medium rounded transition-colors',
                                isHigh ? 'btn-danger-solid btn-sm'
                                    : isMid ? 'bg-[var(--color-warning-500)] text-white hover:bg-[var(--color-warning-600)] btn-sm'
                                        : 'btn-secondary btn-sm'
                            )}
                        >
                            {addMoreLabel || '+ Add'}
                        </button>
                    )}
                </div>
            </div>
            <div className="h-2 bg-[var(--bg-muted)] rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: isHigh ? 'var(--color-danger-500)' : isMid ? 'var(--color-warning-500)' : color }}
                />
            </div>
            {isHigh && (
                <p className="text-xs text-[var(--color-danger-600)] mt-1">
                    {limit - used <= 0
                        ? `Limit full! ${addMoreLabel || 'Add more'} to continue.`
                        : `Only ${limit - used} remaining!`}
                </p>
            )}
        </div>
    )
}

// ═══════════════════════════════════════
// PRICE DISPLAY
// ═══════════════════════════════════════
function PriceDisplay({ planId, cycle }: { planId: PlanId; cycle: BillingCycle }) {
    const bd = getPlanPriceBreakdown(planId, cycle)
    const plan = getPlan(planId)
    const saved = getSavings(planId)

    return (
        <div className="mb-3">
            <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold text-[var(--text-primary)]">
                    ₹{bd.totalAmount.toLocaleString('en-IN')}
                </span>
                <span className="text-sm text-[var(--text-muted)]">/{cycle === 'monthly' ? 'mo' : 'yr'}</span>
            </div>
            {cycle === 'yearly' && saved > 0 && (
                <p className="text-xs text-[var(--color-success-600)]">
                    Save ₹{saved.toLocaleString('en-IN')} vs monthly
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
        <div className="bg-[var(--bg-subtle)] rounded-lg px-3 py-2 mb-3 text-xs text-[var(--text-secondary)]">
            <div className="flex gap-3 flex-wrap">
                <span>👤 {plan.maxStudents === -1 ? '∞' : plan.maxStudents} students</span>
                <span>👨‍🏫 {plan.maxTeachers === -1 ? '∞' : plan.maxTeachers} teachers</span>
            </div>
            <div className="flex gap-3 flex-wrap mt-1">
                <span>💳 {plan.freeCreditsPerMonth.toLocaleString('en-IN')} credits/mo</span>
                <span>📦 {plan.modules.length} modules</span>
            </div>
            {plan.creditRolloverMonths === -1 && (
                <div className="text-[var(--color-success-600)] font-medium mt-1">♻️ Credits never expire</div>
            )}
            {plan.creditRolloverMonths > 0 && (
                <div className="text-[var(--color-info-600)] mt-1">♻️ Credits rollover {plan.creditRolloverMonths} months</div>
            )}
        </div>
    )
}

// ═══════════════════════════════════════
// UPGRADE MODAL
// ═══════════════════════════════════════
function UpgradeModal({
    planId, currentPlan, cycle, onPay, onFreeUpgrade, onCancel, paying,
}: {
    planId: PlanId; currentPlan: PlanId; cycle: BillingCycle
    onPay: (orderId: string, amount: number) => void
    onFreeUpgrade: () => void; onCancel: () => void; paying: boolean
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
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget && !busy) onCancel() }}>
            <div className="modal-panel modal-sm" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">
                        {isCycleChange ? 'Switch Billing Cycle' : `Upgrade to ${plan.name}`}
                    </h3>
                    <button className="modal-close" onClick={() => { if (!busy) onCancel() }}>✕</button>
                </div>
                <div className="modal-body">
                    <p className="text-sm text-[var(--text-muted)] mb-4">
                        Free credits: {plan.freeCreditsPerMonth.toLocaleString('en-IN')}/month included
                    </p>

                    {loading && (
                        <div className="flex justify-center py-8">
                            <Spinner size="lg" />
                        </div>
                    )}

                    {error && !loading && (
                        <div className="bg-[var(--color-danger-50)] border border-[var(--color-danger-200)] rounded-lg p-3 mb-4">
                            <p className="text-sm text-[var(--color-danger-600)]">⚠️ {error}</p>
                        </div>
                    )}

                    {breakdown && !loading && (
                        <>
                            {breakdown.noPayment ? (
                                <div className="bg-[var(--color-success-50)] border border-[var(--color-success-200)] rounded-lg p-3 mb-4">
                                    <p className="font-semibold text-sm text-[var(--color-success-800)] mb-1">
                                        ✅ Sufficient credits available!
                                    </p>
                                    <p className="text-xs text-[var(--color-success-700)]">{breakdown.explanation}</p>
                                </div>
                            ) : (
                                <div className="bg-[var(--bg-subtle)] rounded-lg p-3 mb-4 text-sm">
                                    <div className="flex justify-between mb-2 text-[var(--text-muted)]">
                                        <span>{plan.name} ({cycle})</span>
                                        <span className="font-medium">
                                            ₹{breakdown.breakdown?.newPlanPrice?.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                    {breakdown.breakdown?.creditAmount > 0 && (
                                        <div className="flex justify-between text-[var(--color-success-600)] mb-2">
                                            <span>Credit ({breakdown.breakdown?.daysRemaining} days)</span>
                                            <span>− ₹{breakdown.breakdown?.creditAmount?.toLocaleString('en-IN')}</span>
                                        </div>
                                    )}
                                    <div className="border-t border-[var(--border)] pt-2">
                                        <div className="flex justify-between font-bold">
                                            <span className="text-[var(--text-secondary)]">Total payable</span>
                                            <span style={{ color: plan.color }}>
                                                ₹{breakdown.breakdown?.totalPayable?.toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
                <div className="modal-footer">
                    <button onClick={() => { if (!busy) onCancel() }} disabled={busy} className="btn-ghost flex-1">
                        Cancel
                    </button>
                    {breakdown && !loading && (
                        breakdown.noPayment ? (
                            <button
                                onClick={handleFreeUpgradeClick}
                                disabled={applyingFree}
                                className="btn-success flex-[2]"
                                style={{ background: 'var(--color-success-600)', color: 'white' }}
                            >
                                {applyingFree ? 'Upgrading…' : 'Upgrade for free'}
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    if (!breakdown.orderId || paying) return
                                    onPay(breakdown.orderId, breakdown.amount)
                                }}
                                disabled={paying || !breakdown.orderId}
                                className="btn-primary flex-[2]"
                                style={{ background: plan.color }}
                            >
                                {paying
                                    ? 'Processing…'
                                    : `Pay ₹${breakdown.breakdown?.totalPayable?.toLocaleString('en-IN')}`}
                            </button>
                        )
                    )}
                </div>
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

    const [showBuyCredits, setShowBuyCredits] = useState(false)
    const [showAddon, setShowAddon] = useState<'students' | 'teachers' | null>(null)
    const [showStorageModal, setShowStorageModal] = useState(false)

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
            setAlert({ type: 'error', msg: 'Payment system failed to load. Please refresh.' })
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
                else setAlert({ type: 'error', msg: 'Cannot switch from Yearly to Monthly.' })
            } else {
                setAlert({ type: 'error', msg: 'Contact support for downgrade.' })
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

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-[var(--color-success-50)] text-3xl flex items-center justify-center mb-4">🎉</div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Payment Successful!</h2>
                <p className="text-[var(--text-muted)] text-sm mb-4">
                    <strong>{success.planName} Plan</strong> is now active.
                </p>
                <div className="bg-[var(--color-warning-50)] border border-[var(--color-warning-200)] rounded-lg p-3 mb-4 text-left w-full">
                    <p className="font-semibold text-sm text-[var(--color-warning-800)] mb-1">⚠️ Re-login Required</p>
                    <p className="text-xs text-[var(--color-warning-700)]">
                        Please logout and login again to activate new plan features.
                    </p>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full py-3 rounded-lg btn-primary"
                >
                    Logout & Login Again →
                </button>
            </div>
        )
    }

    if (loading) {
        return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
    }

    const plans = Object.values(PLANS)
    const currentPlanId = status?.plan as PlanId | undefined
    const currentCycle = status?.billingCycle as BillingCycle | null

    return (
        <div className="portal-content-enter">
            <PageHeader title="Subscription & Credits" subtitle="Manage your plan, credits, and add-ons" />

            {/* ── Modals ── */}
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
                            setAlert({ type: 'success', msg: `${added} extra ${showAddon} successfully added!` })
                            fetchStatus()
                        }}
                    />
                </Portal>
            )}

            {showStorageModal && (
                <StorageAddonModal
                    currentStorage={status?.storage}
                    onClose={() => setShowStorageModal(false)}
                    onSuccess={() => {
                        setShowStorageModal(false)
                        setAlert({ type: 'success', msg: 'Storage addon added successfully!' })
                        fetchStatus()
                    }}
                />
            )}

            {/* Alert */}
            {alert && (
                <div className="mb-4">
                    <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
                </div>
            )}

            {/* Blocked module warning */}
            {blockedModule && (
                <div className="bg-[var(--color-warning-50)] border border-[var(--color-warning-200)] rounded-lg p-3 mb-4 flex items-start gap-3">
                    <span className="text-xl">🔒</span>
                    <div>
                        <p className="font-semibold text-sm text-[var(--color-warning-800)] mb-0.5">
                            {getModuleLabel(blockedModule)} module is locked
                        </p>
                        <p className="text-xs text-[var(--color-warning-700)]">
                            This feature is not available in your current plan.
                        </p>
                    </div>
                </div>
            )}

            {/* Status banner */}
            {status && (
                <div className={clsx(
                    'rounded-lg p-4 mb-4 border',
                    status.isPaid ? 'bg-[var(--color-success-50)] border-[var(--color-success-200)]'
                        : status.isInTrial ? 'bg-[var(--color-info-50)] border-[var(--color-info-200)]'
                            : 'bg-[var(--color-danger-50)] border-[var(--color-danger-200)]'
                )}>
                    <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0">
                            {status.isPaid
                                ? <Check size={16} className="text-[var(--color-success-600)]" />
                                : status.isInTrial ? '⏱️' : '❌'}
                        </span>
                        <div className="flex-1">
                            {status.isPaid && (
                                <>
                                    <p className="font-semibold text-sm text-[var(--color-success-800)] mb-1">
                                        {status.planName} Plan — Active
                                        {currentCycle && (
                                            <span className="font-normal text-[var(--color-success-600)]">
                                                {' '}({currentCycle === 'monthly' ? 'Monthly' : 'Yearly'})
                                            </span>
                                        )}
                                    </p>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <p className="text-xs text-[var(--color-success-700)]">
                                            Valid till: {formatDate(status.validTill)}
                                        </p>
                                        <RealClockCountdown targetDate={status.validTill} type="subscription" />
                                    </div>
                                </>
                            )}
                            {status.isInTrial && (
                                <>
                                    <p className="font-semibold text-sm text-[var(--color-info-800)] mb-1">
                                        Free Trial — {status.daysLeft} days remaining
                                    </p>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <p className="text-xs text-[var(--color-info-700)]">
                                            Subscribe to continue after trial
                                        </p>
                                        <RealClockCountdown
                                            targetDate={status.trialEndsAt || status.validTill}
                                            type="trial"
                                        />
                                    </div>
                                </>
                            )}
                            {status.isExpired && (
                                <>
                                    <p className="font-semibold text-sm text-[var(--color-danger-800)] mb-0.5">Access Blocked</p>
                                    <p className="text-xs text-[var(--color-danger-700)]">Please choose a plan below</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Credit & Storage Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {status?.credits && (
                    <CreditBalanceCard
                        credits={status.credits}
                        onBuyCredits={() => setShowBuyCredits(true)}
                    />
                )}
                {status && (
                    <StorageCard
                        storage={status.storage ?? null}
                        onManageStorage={() => setShowStorageModal(true)}
                    />
                )}
            </div>

            {/* ── Usage Limits ── */}
            {status?.limits && (
                <div className="card p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-sm text-[var(--text-primary)]">Usage & Limits</h3>
                        <div className="flex items-center gap-2">
                            {status.addons?.canPurchaseStudents && (
                                <button
                                    onClick={() => setShowAddon('students')}
                                    className="btn-secondary btn-sm"
                                >
                                    👤 +Students
                                </button>
                            )}
                            {status.addons?.canPurchaseTeachers && (
                                <button
                                    onClick={() => setShowAddon('teachers')}
                                    className="btn-secondary btn-sm"
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
                        color="var(--color-primary-500)"
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
                        color="var(--color-violet-600)"
                        onAddMore={
                            status.addons?.canPurchaseTeachers
                                ? () => setShowAddon('teachers')
                                : undefined
                        }
                        addMoreLabel="+ Add-on"
                    />

                    {((Number(status.addons?.extraStudents) > 0)
                        || (Number(status.addons?.extraTeachers) > 0)) && (
                            <div className="mt-3 pt-3 border-t border-[var(--border)]">
                                <p className="text-[11px] font-medium text-[var(--text-muted)] mb-2">Active Add-ons:</p>
                                <div className="flex gap-2 flex-wrap">
                                    {Number(status.addons?.extraStudents) > 0 && (
                                        <span className="text-xs text-[var(--color-success-700)] bg-[var(--color-success-50)] px-2 py-1 rounded">
                                            ✅ +{status.addons.extraStudents} students
                                        </span>
                                    )}
                                    {Number(status.addons?.extraTeachers) > 0 && (
                                        <span className="text-xs text-[var(--color-success-700)] bg-[var(--color-success-50)] px-2 py-1 rounded">
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
                            <div className="mt-3 pt-3 border-t border-[var(--border)]">
                                <p className="text-xs text-[var(--text-muted)] mb-2">
                                    💡 <strong>{nextPlan.name}</strong> plan for more limits
                                </p>
                                <button
                                    onClick={() => setUpgradeModal(nextPlan.id)}
                                    className="text-xs font-semibold text-[var(--color-primary-600)] hover:underline"
                                >
                                    Upgrade to {nextPlan.name} →
                                </button>
                            </div>
                        )
                    })()}
                </div>
            )}

            {/* Billing toggle */}
            <div className="flex justify-center mb-6">
                <div className="flex bg-[var(--bg-muted)] rounded-lg p-1 gap-1">
                    {(['monthly', 'yearly'] as BillingCycle[]).map(c => (
                        <button
                            key={c}
                            onClick={() => setCycle(c)}
                            className={clsx(
                                'px-4 py-2 rounded-md text-sm font-medium transition-all',
                                cycle === c
                                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)]'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                            )}
                        >
                            {c === 'monthly' ? 'Monthly' : (
                                <span>Yearly{' '}
                                    <span className="text-[10px] text-[var(--color-success-600)] font-medium ml-1">2 months free</span>
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Plan cards */}
            {/* Plan cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
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
                                'card flex flex-col transition-all relative',
                                isDisabled && 'opacity-60'
                            )}
                            style={{
                                border: isHL ? `2px solid ${plan.color}`
                                    : isPop ? '1.5px solid var(--color-primary-400)'
                                        : '1px solid var(--border)',
                                boxShadow: isHL
                                    ? `0 0 0 5px ${plan.color}15, 0 8px 24px ${plan.color}18`
                                    : isPop ? '0 8px 24px rgba(99,102,241,0.1)'
                                        : 'var(--shadow-sm)',
                            }}
                        >
                            {/* Badge - Inside card, not cut off */}
                            {(isHL || isPop) && (
                                <div
                                    className="text-center text-white text-[10px] font-semibold px-3 py-1.5 rounded-t-lg whitespace-nowrap"
                                    style={{
                                        background: isHL
                                            ? `linear-gradient(135deg, ${plan.color}, ${plan.color}dd)`
                                            : 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700))',
                                        marginBottom: '1px'
                                    }}
                                >
                                    {isHL ? '⭐ Recommended' : '🔥 Most Popular'}
                                </div>
                            )}

                            <div className="p-4 flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold text-[var(--text-primary)]">{plan.name}</h3>
                                    {isExactlyCurrent && (
                                        <span className="badge badge-success">Current</span>
                                    )}
                                </div>

                                <p className="text-xs font-medium mb-2" style={{ color: plan.color }}>
                                    {plan.tagline}
                                </p>

                                <PriceDisplay planId={plan.id} cycle={cycle} />

                                <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-3">
                                    {plan.description}
                                </p>

                                <PlanQuickStats planId={plan.id} />

                                <ul className="space-y-1.5 mb-4 flex-1">
                                    {plan.features.map(f => (
                                        <li key={f} className="flex items-start gap-2 text-xs">
                                            <span className="text-[var(--color-success-500)] font-bold flex-shrink-0 mt-0.5">✓</span>
                                            <span className="text-[var(--text-secondary)]">{f}</span>
                                        </li>
                                    ))}
                                    {plan.notIncluded?.map(f => (
                                        <li key={f} className="flex items-start gap-2 text-xs opacity-40">
                                            <span className="flex-shrink-0 mt-0.5">✕</span>
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="p-4 pt-0">
                                <button
                                    onClick={() => !isDisabled && handleSubscribe(plan.id)}
                                    disabled={isDisabled || paying === plan.id}
                                    className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
                                    style={
                                        isDisabled
                                            ? { background: 'var(--bg-muted)', color: 'var(--text-muted)', cursor: 'default', border: 'none' }
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
                        </div>
                    )
                })}
            </div>

            <div className="text-center text-xs text-[var(--text-muted)] mb-6">
                <p>Secure payment by Razorpay · Cancel anytime</p>
            </div>

            {/* Scheduled cancel banner */}
            {status?.isScheduledCancel && (
                <div className="bg-[var(--color-warning-50)] border border-[var(--color-warning-200)] rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                        <span className="text-xl">⏳</span>
                        <div className="flex-1">
                            <p className="font-semibold text-sm text-[var(--color-warning-800)] mb-1">
                                Cancellation Scheduled
                            </p>
                            <p className="text-xs text-[var(--color-warning-700)]">
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
                            className="px-3 py-2 bg-[var(--color-warning-600)] text-white text-xs font-semibold rounded-lg hover:bg-[var(--color-warning-700)] transition-colors"
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
        <Suspense fallback={<div className="flex justify-center py-12"><Spinner size="lg" /></div>}>
            <SubscriptionInner />
        </Suspense>
    )
}