// FILE: src/components/settings/tabs/PaymentTab.tsx
// ✅ UPDATED: Multi-tenant support + Trial mein tab enabled
// School/Academy/Coaching aware labels
// Trial users ko full access — plan gate sirf paid users ke liye

'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import {
    Eye, EyeOff, ShieldCheck, ShieldOff,
    AlertTriangle, CheckCircle2, Info,
    CreditCard, Receipt, Lock,
} from 'lucide-react'
import { SettingSection } from '../shared/SettingSection'
import { SettingRow, ToggleRow } from '../shared/SettingRow'
import { SaveBar } from '../shared/SaveButton'
import type { IPaymentConfig, UpdatePaymentBody } from '@/types/settings'
import type { InstitutionType } from '@/lib/institutionConfig'

// ─────────────────────────────────────────────────────────
// Institution-aware labels
// ─────────────────────────────────────────────────────────

const INSTITUTION_PAYMENT_CONFIG = {
    school: {
        label: 'School',
        receiptLogoLabel: 'Show School Logo on Receipt',
        receiptLogoDesc: 'Print school logo at top of fee receipt',
        razorpayDesc: 'Connect Razorpay to collect fees online from parents',
        connectedDesc: 'Your school can collect fees online via UPI, cards, and netbanking',
        notConnectedDesc: 'Enter your Razorpay keys to enable online fee collection',
        receiptPrefixHint: 'e.g. RCP → Receipt no: RCP-2025-0001',
        onlinePaymentLabel: 'Enable Online Fee Payment',
        onlinePaymentDesc: 'Allow parents to pay fees online',
        upgradeMsg: 'Payment settings require Growth plan or above. Upgrade to configure online payments.',
    },
    academy: {
        label: 'Academy',
        receiptLogoLabel: 'Show Academy Logo on Receipt',
        receiptLogoDesc: 'Print academy logo at top of fee receipt',
        razorpayDesc: 'Connect Razorpay to collect course fees online from students',
        connectedDesc: 'Your academy can collect course fees online via UPI, cards, and netbanking',
        notConnectedDesc: 'Enter your Razorpay keys to enable online course fee collection',
        receiptPrefixHint: 'e.g. ACR → Receipt no: ACR-2025-0001',
        onlinePaymentLabel: 'Enable Online Course Fee Payment',
        onlinePaymentDesc: 'Allow students to pay course fees online',
        upgradeMsg: 'Payment settings require Growth plan or above. Upgrade to configure online payments.',
    },
    coaching: {
        label: 'Institute',
        receiptLogoLabel: 'Show Institute Logo on Receipt',
        receiptLogoDesc: 'Print institute logo at top of fee receipt',
        razorpayDesc: 'Connect Razorpay to collect batch fees online from students',
        connectedDesc: 'Your institute can collect batch fees online via UPI, cards, and netbanking',
        notConnectedDesc: 'Enter your Razorpay keys to enable online batch fee collection',
        receiptPrefixHint: 'e.g. INR → Receipt no: INR-2025-0001',
        onlinePaymentLabel: 'Enable Online Batch Fee Payment',
        onlinePaymentDesc: 'Allow students to pay batch fees online',
        upgradeMsg: 'Payment settings require Growth plan or above. Upgrade to configure online payments.',
    },
} as const

// ─────────────────────────────────────────────────────────
// Locked Feature Overlay
// ─────────────────────────────────────────────────────────

function LockedFeature({
    message,
    children,
}: {
    message: string
    children: React.ReactNode
}) {
    return (
        <div className="relative">
            <div className="pointer-events-none select-none opacity-40 blur-[1px]">
                {children}
            </div>
            <div
                className="absolute inset-0 flex flex-col items-center justify-center rounded-[var(--radius-md)] z-10"
                style={{
                    background: 'rgba(var(--bg-card-rgb, 255,255,255), 0.9)',
                    backdropFilter: 'blur(2px)',
                }}
            >
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
                    style={{
                        background: 'var(--bg-muted)',
                        border: '1px solid var(--border)',
                    }}
                >
                    <Lock size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
                <p
                    className="text-xs font-700 mb-0.5 text-center px-4"
                    style={{ color: 'var(--text-primary)' }}
                >
                    Growth Plan Required
                </p>
                <a
                    href="/admin/subscription"
                    className="text-xs font-600 underline"
                    style={{ color: 'var(--primary-500)' }}
                >
                    Upgrade →
                </a>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────

interface PaymentTabProps {
    payment: IPaymentConfig
    plan: string
    onSaved: (updated: Partial<IPaymentConfig>) => void
    // ✅ ADD — multi-tenant
    subscriptionStatus?: string
    institutionType?: InstitutionType
}

// ─────────────────────────────────────────────────────────
// Payment Methods
// ─────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
    { key: 'upi', label: 'UPI' },
    { key: 'card', label: 'Card' },
    { key: 'netbanking', label: 'Net Banking' },
    { key: 'wallet', label: 'Wallet' },
] as const

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────

export function PaymentTab({
    payment,
    plan,
    onSaved,
    subscriptionStatus,
    institutionType,
}: PaymentTabProps) {
    const { data: session } = useSession()

    // ✅ institutionType — prop > school.institutionType > session > default
    const instType: InstitutionType =
        institutionType ||
        ((session?.user as any)?.institutionType as InstitutionType) ||
        'school'

    const config = INSTITUTION_PAYMENT_CONFIG[instType] || INSTITUTION_PAYMENT_CONFIG.school

    // ✅ Trial check — trial mein FULL access, paid mein plan gate
    const subStatus =
        subscriptionStatus ||
        (session?.user as any)?.subscriptionStatus ||
        'trial'

    const isTrial = subStatus === 'trial'

    // ✅ FIX: Trial mein always allowed, paid mein plan check
    const isPlanAllowed = isTrial || ['growth', 'pro', 'enterprise'].includes(plan)

    // ─────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────

    const [form, setForm] = useState<IPaymentConfig>({ ...payment })
    const [isDirty, setIsDirty] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // Razorpay fields — separate state (security: DB se keys nahi aati)
    const [rzpKeyId, setRzpKeyId] = useState('')
    const [rzpKeySecret, setRzpKeySecret] = useState('')
    const [showSecret, setShowSecret] = useState(false)
    const [rzpDirty, setRzpDirty] = useState(false)
    const [clearKeys, setClearKeys] = useState(false)

    // ─────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────

    const update = <K extends keyof IPaymentConfig>(
        field: K,
        val: IPaymentConfig[K]
    ) => {
        setForm((prev) => ({ ...prev, [field]: val }))
        setIsDirty(true)
        setError(null)
    }

    const isAnythingDirty = isDirty || rzpDirty || clearKeys

    // ─────────────────────────────────────────────────────
    // Save
    // ─────────────────────────────────────────────────────

    const handleSave = async () => {
        setSaving(true)
        setError(null)
        setSuccess(null)

        try {
            const body: UpdatePaymentBody = {}

            // Basic payment settings — only changed fields
            if (form.receiptPrefix !== payment.receiptPrefix)
                body.receiptPrefix = form.receiptPrefix
            if (form.showSchoolLogoOnReceipt !== payment.showSchoolLogoOnReceipt)
                body.showSchoolLogoOnReceipt = form.showSchoolLogoOnReceipt
            if (form.receiptFooterText !== payment.receiptFooterText)
                body.receiptFooterText = form.receiptFooterText
            if (form.gstEnabled !== payment.gstEnabled)
                body.gstEnabled = form.gstEnabled
            if (form.gstNumber !== payment.gstNumber)
                body.gstNumber = form.gstNumber
            if (form.gstPercentage !== payment.gstPercentage)
                body.gstPercentage = form.gstPercentage
            if (form.lateFineEnabled !== payment.lateFineEnabled)
                body.lateFineEnabled = form.lateFineEnabled
            if (form.lateFineType !== payment.lateFineType)
                body.lateFineType = form.lateFineType
            if (form.lateFineAmount !== payment.lateFineAmount)
                body.lateFineAmount = form.lateFineAmount
            if (form.lateFineGraceDays !== payment.lateFineGraceDays)
                body.lateFineGraceDays = form.lateFineGraceDays
            if (form.enableOnlinePayment !== payment.enableOnlinePayment)
                body.enableOnlinePayment = form.enableOnlinePayment
            if (
                JSON.stringify(form.paymentMethods) !==
                JSON.stringify(payment.paymentMethods)
            )
                body.paymentMethods = form.paymentMethods

            // Razorpay keys
            if (clearKeys) {
                body.clearRazorpayKeys = true
            } else if (rzpDirty && rzpKeyId && rzpKeySecret) {
                body.razorpayKeyId = rzpKeyId
                body.razorpayKeySecret = rzpKeySecret
            } else if (rzpDirty && rzpKeyId) {
                body.razorpayKeyId = rzpKeyId
            }

            const res = await fetch('/api/settings/payment', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Save failed')

            setIsDirty(false)
            setRzpDirty(false)
            setRzpKeyId('')
            setRzpKeySecret('')
            setClearKeys(false)
            setSuccess('Payment settings saved successfully')

            if (data.razorpayConfigured !== undefined) {
                onSaved({ ...form, razorpayConfigured: data.razorpayConfigured })
            } else {
                onSaved(form)
            }

        } catch (err: any) {
            setError(err.message)
            throw err
        } finally {
            setSaving(false)
        }
    }

    const handleDiscard = () => {
        setForm({ ...payment })
        setRzpKeyId('')
        setRzpKeySecret('')
        setRzpDirty(false)
        setClearKeys(false)
        setIsDirty(false)
        setError(null)
        setSuccess(null)
    }

    // ─────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────

    return (
        <div className="space-y-5 portal-content-enter">

            {/* ── Plan Gate Banner — sirf paid users jo starter pe hain ── */}
            {!isPlanAllowed && (
                <div
                    className="flex items-start gap-3 p-4 rounded-[var(--radius-md)] border text-sm"
                    style={{
                        background: 'var(--warning-light)',
                        borderColor: 'rgba(245,158,11,0.2)',
                        color: 'var(--warning-dark)',
                    }}
                >
                    <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                    <p>{config.upgradeMsg}</p>
                </div>
            )}

            {/* ── Trial Info Banner ── */}
            {isTrial && (
                <div
                    className="flex items-start gap-3 p-3.5 rounded-[var(--radius-md)] border text-sm"
                    style={{
                        background: 'var(--info-light)',
                        borderColor: 'rgba(59,130,246,0.2)',
                        color: 'var(--info-dark)',
                    }}
                >
                    <Info size={15} className="flex-shrink-0 mt-0.5" />
                    <p>
                        <strong>Trial Mode:</strong> All payment settings are
                        accessible. Configure Razorpay to test online collections.
                        Settings will carry forward after upgrade.
                    </p>
                </div>
            )}

            {/* ── Alerts ── */}
            {error && (
                <div
                    className="p-3.5 rounded-[var(--radius-md)] border text-sm"
                    style={{
                        background: 'var(--danger-light)',
                        borderColor: 'rgba(239,68,68,0.2)',
                        color: 'var(--danger-dark)',
                    }}
                >
                    {error}
                </div>
            )}
            {success && (
                <div
                    className="flex items-center gap-2 p-3.5 rounded-[var(--radius-md)] border text-sm"
                    style={{
                        background: 'var(--success-light)',
                        borderColor: 'rgba(16,185,129,0.2)',
                        color: 'var(--success-dark)',
                    }}
                >
                    <CheckCircle2 size={15} />
                    {success}
                </div>
            )}

            {/* ══════════════════════════════════════════════
                Razorpay Configuration
            ══════════════════════════════════════════════ */}
            <SettingSection
                title="Razorpay Configuration"
                description={config.razorpayDesc}
                icon={CreditCard}
                badge={
                    payment.razorpayConfigured
                        ? { label: 'Connected', color: 'success' }
                        : { label: 'Not Connected', color: 'warning' }
                }
            >
                {!isPlanAllowed ? (
                    <LockedFeature message={config.upgradeMsg}>
                        {/* Dummy locked UI */}
                        <div className="space-y-3">
                            <div
                                className="h-14 rounded-[var(--radius-md)]"
                                style={{ background: 'var(--bg-muted)' }}
                            />
                            <div
                                className="h-10 rounded-[var(--radius-md)]"
                                style={{ background: 'var(--bg-muted)' }}
                            />
                            <div
                                className="h-10 rounded-[var(--radius-md)]"
                                style={{ background: 'var(--bg-muted)' }}
                            />
                        </div>
                    </LockedFeature>
                ) : (
                    <>
                        {/* Connection Status */}
                        <div
                            className="flex items-center gap-3 p-3.5 rounded-[var(--radius-md)] border mb-4"
                            style={{
                                background: payment.razorpayConfigured
                                    ? 'var(--success-light)'
                                    : 'var(--bg-muted)',
                                borderColor: payment.razorpayConfigured
                                    ? 'rgba(16,185,129,0.2)'
                                    : 'var(--border)',
                            }}
                        >
                            {payment.razorpayConfigured ? (
                                <ShieldCheck
                                    size={18}
                                    className="flex-shrink-0"
                                    style={{ color: 'var(--success)' }}
                                />
                            ) : (
                                <ShieldOff
                                    size={18}
                                    className="flex-shrink-0"
                                    style={{ color: 'var(--text-muted)' }}
                                />
                            )}
                            <div className="flex-1">
                                <p
                                    className="text-sm font-600"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    {payment.razorpayConfigured
                                        ? 'Razorpay is connected'
                                        : 'Razorpay not configured'}
                                </p>
                                <p
                                    className="text-xs"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    {payment.razorpayConfigured
                                        ? config.connectedDesc
                                        : config.notConnectedDesc}
                                </p>
                            </div>
                        </div>

                        {/* Keys Input */}
                        <div className="space-y-4">
                            <SettingRow
                                horizontal
                                label="Razorpay Key ID"
                                description="Starts with rzp_live_ or rzp_test_"
                            >
                                <input
                                    type="text"
                                    value={rzpKeyId}
                                    onChange={(e) => {
                                        setRzpKeyId(e.target.value)
                                        setRzpDirty(true)
                                        setClearKeys(false)
                                    }}
                                    placeholder={
                                        payment.razorpayConfigured
                                            ? 'Enter new Key ID to update'
                                            : 'rzp_live_xxxxxxxxxxxx'
                                    }
                                    className="input-clean font-mono text-sm"
                                    aria-label="Razorpay Key ID"
                                />
                            </SettingRow>

                            <SettingRow
                                horizontal
                                label="Razorpay Key Secret"
                                description="Will be encrypted and stored securely"
                            >
                                <div className="input-group">
                                    <input
                                        type={showSecret ? 'text' : 'password'}
                                        value={rzpKeySecret}
                                        onChange={(e) => {
                                            setRzpKeySecret(e.target.value)
                                            setRzpDirty(true)
                                            setClearKeys(false)
                                        }}
                                        placeholder={
                                            payment.razorpayConfigured
                                                ? '••••••••••••••••'
                                                : 'Enter Razorpay Key Secret'
                                        }
                                        className="input-clean has-icon-right font-mono text-sm"
                                        aria-label="Razorpay Key Secret"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSecret(!showSecret)}
                                        className="input-icon-right cursor-pointer hover:text-[var(--text-primary)]"
                                        aria-label={showSecret ? 'Hide secret' : 'Show secret'}
                                    >
                                        {showSecret
                                            ? <EyeOff size={15} />
                                            : <Eye size={15} />
                                        }
                                    </button>
                                </div>
                            </SettingRow>
                        </div>

                        {/* Disconnect Button */}
                        {payment.razorpayConfigured && !clearKeys && (
                            <div
                                className="mt-4 pt-4"
                                style={{ borderTop: '1px solid var(--border)' }}
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        setClearKeys(true)
                                        setIsDirty(true)
                                    }}
                                    className="btn-danger btn-sm text-xs"
                                >
                                    <ShieldOff size={13} />
                                    Disconnect Razorpay
                                </button>
                            </div>
                        )}

                        {/* Disconnect Confirm */}
                        {clearKeys && (
                            <div
                                className="mt-3 p-3 rounded-[var(--radius-md)] flex items-center justify-between gap-3"
                                style={{
                                    background: 'var(--danger-light)',
                                    border: '1px solid rgba(239,68,68,0.2)',
                                }}
                            >
                                <p
                                    className="text-xs"
                                    style={{ color: 'var(--danger-dark)' }}
                                >
                                    Razorpay keys will be removed. Online payments will
                                    be disabled.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setClearKeys(false)
                                        setIsDirty(false)
                                    }}
                                    className="text-xs flex-shrink-0 hover:underline"
                                    style={{ color: 'var(--danger)' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        {/* Online Payment Toggle + Methods */}
                        <div
                            className="mt-4 pt-4"
                            style={{ borderTop: '1px solid var(--border)' }}
                        >
                            <ToggleRow
                                label={config.onlinePaymentLabel}
                                description={config.onlinePaymentDesc}
                                checked={form.enableOnlinePayment ?? false}
                                onChange={(v) => update('enableOnlinePayment', v)}
                                disabled={!payment.razorpayConfigured && !rzpKeyId}
                            />

                            {/* Disabled hint */}
                            {!payment.razorpayConfigured && !rzpKeyId && (
                                <p
                                    className="text-xs mt-1.5"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    Configure Razorpay keys first to enable online
                                    payments
                                </p>
                            )}

                            {form.enableOnlinePayment && (
                                <div className="mt-3">
                                    <p
                                        className="text-xs font-600 mb-2"
                                        style={{ color: 'var(--text-secondary)' }}
                                    >
                                        Accepted Payment Methods
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {PAYMENT_METHODS.map((method) => {
                                            const isSelected = (
                                                form.paymentMethods || []
                                            ).includes(method.key as any)

                                            return (
                                                <button
                                                    key={method.key}
                                                    type="button"
                                                    onClick={() => {
                                                        const current =
                                                            form.paymentMethods || []
                                                        const updated = isSelected
                                                            ? current.filter(
                                                                (m) => m !== method.key
                                                            )
                                                            : [
                                                                ...current,
                                                                method.key as any,
                                                            ]
                                                        update('paymentMethods', updated)
                                                    }}
                                                    className={`
                                                        px-3 py-1.5 rounded-[var(--radius-full)]
                                                        text-xs font-600 border transition-all
                                                        ${isSelected
                                                            ? 'bg-[var(--primary-50)] border-[var(--primary-300)] text-[var(--primary-700)]'
                                                            : 'bg-[var(--bg-muted)] border-[var(--border)] text-[var(--text-secondary)]'
                                                        }
                                                    `}
                                                    aria-pressed={isSelected}
                                                >
                                                    {isSelected && (
                                                        <CheckCircle2
                                                            size={11}
                                                            className="inline mr-1"
                                                            style={{
                                                                color: 'var(--primary-500)',
                                                            }}
                                                        />
                                                    )}
                                                    {method.label}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </SettingSection>

            {/* ══════════════════════════════════════════════
                Receipt Settings
            ══════════════════════════════════════════════ */}
            <SettingSection
                title="Receipt Settings"
                description="Configure fee receipt format and branding"
                icon={Receipt}
            >
                <div className="space-y-0">

                    {/* Receipt Prefix */}
                    <SettingRow
                        horizontal
                        label="Receipt Prefix"
                        description={config.receiptPrefixHint}
                    >
                        <input
                            type="text"
                            value={form.receiptPrefix || 'RCP'}
                            onChange={(e) =>
                                update(
                                    'receiptPrefix',
                                    e.target.value.toUpperCase()
                                )
                            }
                            placeholder="RCP"
                            className="input-clean uppercase font-mono tracking-wider"
                            maxLength={6}
                            aria-label="Receipt prefix"
                        />
                        <p className="input-hint">
                            Preview:{' '}
                            <span className="font-600 font-mono"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {form.receiptPrefix || 'RCP'}-2025-0001
                            </span>
                        </p>
                    </SettingRow>

                    {/* ✅ Institution-aware logo label */}
                    <ToggleRow
                        label={config.receiptLogoLabel}
                        description={config.receiptLogoDesc}
                        checked={form.showSchoolLogoOnReceipt ?? true}
                        onChange={(v) => update('showSchoolLogoOnReceipt', v)}
                    />

                    {/* Receipt Footer */}
                    <SettingRow
                        horizontal
                        label="Receipt Footer"
                        description="Text at bottom of printed receipt"
                    >
                        <input
                            type="text"
                            value={form.receiptFooterText || ''}
                            onChange={(e) =>
                                update('receiptFooterText', e.target.value)
                            }
                            placeholder={
                                instType === 'school'
                                    ? 'Thank you for your payment.'
                                    : instType === 'academy'
                                        ? 'Thank you for enrolling with us!'
                                        : 'Thank you for your trust in us.'
                            }
                            className="input-clean"
                            maxLength={200}
                            aria-label="Receipt footer text"
                        />
                        <p className="input-hint text-right">
                            {(form.receiptFooterText || '').length}/200
                        </p>
                    </SettingRow>

                </div>
            </SettingSection>

            {/* ══════════════════════════════════════════════
                GST Configuration
            ══════════════════════════════════════════════ */}
            <SettingSection
                title="GST Configuration"
                description={`For ${config.label.toLowerCase()}s registered under GST`}
            >
                <ToggleRow
                    label="Enable GST"
                    description="Add GST to fee amounts on receipts"
                    checked={form.gstEnabled ?? false}
                    onChange={(v) => update('gstEnabled', v)}
                />

                {form.gstEnabled && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <SettingRow
                            label="GST Number"
                            description="15-character GSTIN"
                        >
                            <input
                                type="text"
                                value={form.gstNumber || ''}
                                onChange={(e) =>
                                    update(
                                        'gstNumber',
                                        e.target.value.toUpperCase()
                                    )
                                }
                                placeholder="27AAAAA0000A1Z5"
                                className="input-clean uppercase font-mono tracking-wider"
                                maxLength={15}
                                aria-label="GST number"
                            />
                        </SettingRow>

                        <SettingRow
                            label="GST Percentage"
                            description="Standard rates: 5%, 12%, 18%, 28%"
                        >
                            <select
                                value={form.gstPercentage || 18}
                                onChange={(e) =>
                                    update(
                                        'gstPercentage',
                                        parseInt(e.target.value)
                                    )
                                }
                                className="input-clean"
                                aria-label="GST percentage"
                            >
                                {[5, 12, 18, 28].map((rate) => (
                                    <option key={rate} value={rate}>
                                        {rate}%
                                    </option>
                                ))}
                            </select>
                        </SettingRow>
                    </div>
                )}
            </SettingSection>

            {/* ══════════════════════════════════════════════
                Late Fine Policy
            ══════════════════════════════════════════════ */}
            <SettingSection
                title="Late Fine Policy"
                description={`Default late fine for overdue ${instType === 'school' ? 'fee' : 'course fee'} payments`}
            >
                <ToggleRow
                    label="Enable Late Fine"
                    description="Apply fine after grace period"
                    checked={form.lateFineEnabled ?? false}
                    onChange={(v) => update('lateFineEnabled', v)}
                />

                {form.lateFineEnabled && (
                    <>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">

                            {/* Fine Type */}
                            <SettingRow label="Fine Type">
                                <select
                                    value={form.lateFineType || 'flat'}
                                    onChange={(e) =>
                                        update(
                                            'lateFineType',
                                            e.target.value as IPaymentConfig['lateFineType']
                                        )
                                    }
                                    className="input-clean"
                                    aria-label="Fine type"
                                >
                                    <option value="flat">Flat Amount (₹)</option>
                                    <option value="percentage">
                                        Percentage (%)
                                    </option>
                                    <option value="per_day">Per Day (₹/day)</option>
                                </select>
                            </SettingRow>

                            {/* Fine Amount */}
                            <SettingRow
                                label="Fine Amount"
                                description={
                                    form.lateFineType === 'percentage'
                                        ? 'Percentage of due amount'
                                        : form.lateFineType === 'per_day'
                                            ? 'Amount per day'
                                            : 'Fixed fine amount'
                                }
                            >
                                <div className="input-group">
                                    {form.lateFineType !== 'percentage' && (
                                        <span
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                                            style={{ color: 'var(--text-muted)' }}
                                            aria-hidden="true"
                                        >
                                            ₹
                                        </span>
                                    )}
                                    <input
                                        type="number"
                                        min={0}
                                        value={form.lateFineAmount || 0}
                                        onChange={(e) =>
                                            update(
                                                'lateFineAmount',
                                                parseFloat(e.target.value) || 0
                                            )
                                        }
                                        className={`input-clean ${form.lateFineType !== 'percentage' ? 'pl-7' : ''}`}
                                        aria-label="Fine amount"
                                    />
                                    {form.lateFineType === 'percentage' && (
                                        <span
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                                            style={{ color: 'var(--text-muted)' }}
                                            aria-hidden="true"
                                        >
                                            %
                                        </span>
                                    )}
                                </div>
                            </SettingRow>

                            {/* Grace Days */}
                            <SettingRow
                                label="Grace Days"
                                description="Days after due date before fine applies"
                            >
                                <div className="input-group">
                                    <input
                                        type="number"
                                        min={0}
                                        max={30}
                                        value={form.lateFineGraceDays || 0}
                                        onChange={(e) =>
                                            update(
                                                'lateFineGraceDays',
                                                parseInt(e.target.value) || 0
                                            )
                                        }
                                        className="input-clean"
                                        aria-label="Grace days"
                                    />
                                    <span
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                                        style={{ color: 'var(--text-muted)' }}
                                        aria-hidden="true"
                                    >
                                        days
                                    </span>
                                </div>
                            </SettingRow>

                        </div>

                        {/* Info note */}
                        <div
                            className="mt-3 flex items-start gap-2 p-3 rounded-[var(--radius-md)]"
                            style={{
                                background: 'var(--info-light)',
                                border: '1px solid rgba(59,130,246,0.15)',
                            }}
                        >
                            <Info
                                size={13}
                                className="flex-shrink-0 mt-0.5"
                                style={{ color: 'var(--info)' }}
                            />
                            <p
                                className="text-xs"
                                style={{ color: 'var(--info-dark)' }}
                            >
                                This is the default policy. Individual fee structures
                                can override this setting.
                            </p>
                        </div>
                    </>
                )}
            </SettingSection>

            <SaveBar
                isDirty={isAnythingDirty}
                onSave={handleSave}
                onDiscard={handleDiscard}
                saving={saving}
            />
        </div>
    )
}