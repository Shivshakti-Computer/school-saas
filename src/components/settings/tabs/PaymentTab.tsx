// FILE: src/components/settings/tabs/PaymentTab.tsx
// Razorpay config, receipt settings, GST, late fine

'use client'

import { useState } from 'react'
import {
    Eye, EyeOff, ShieldCheck, ShieldOff,
    AlertTriangle, CheckCircle2, Info,
} from 'lucide-react'
import { SettingSection } from '../shared/SettingSection'
import { SettingRow, ToggleRow } from '../shared/SettingRow'
import { SaveBar } from '../shared/SaveButton'
import type { IPaymentConfig, UpdatePaymentBody } from '@/types/settings'

interface PaymentTabProps {
    payment: IPaymentConfig
    plan: string
    onSaved: (updated: Partial<IPaymentConfig>) => void
}

export function PaymentTab({ payment, plan, onSaved }: PaymentTabProps) {
    const [form, setForm] = useState<IPaymentConfig>({ ...payment })
    const [isDirty, setIsDirty] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // Razorpay fields — separate state
    const [rzpKeyId, setRzpKeyId] = useState('')
    const [rzpKeySecret, setRzpKeySecret] = useState('')
    const [showSecret, setShowSecret] = useState(false)
    const [rzpDirty, setRzpDirty] = useState(false)
    const [clearKeys, setClearKeys] = useState(false)

    const update = <K extends keyof IPaymentConfig>(
        field: K,
        val: IPaymentConfig[K]
    ) => {
        setForm((prev) => ({ ...prev, [field]: val }))
        setIsDirty(true)
        setError(null)
    }

    const isPlanAllowed = ['growth', 'pro', 'enterprise'].includes(plan)

    const handleSave = async () => {
        setSaving(true)
        setError(null)
        setSuccess(null)

        try {
            const body: UpdatePaymentBody = {}

            // Basic payment settings
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
            if (JSON.stringify(form.paymentMethods) !==
                JSON.stringify(payment.paymentMethods))
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

    const isAnythingDirty = isDirty || rzpDirty || clearKeys

    const PAYMENT_METHODS = [
        { key: 'upi', label: 'UPI' },
        { key: 'card', label: 'Card' },
        { key: 'netbanking', label: 'Net Banking' },
        { key: 'wallet', label: 'Wallet' },
    ] as const

    return (
        <div className="space-y-5 portal-content-enter">

            {!isPlanAllowed && (
                <div
                    className="
            flex items-start gap-3 p-4
            bg-[var(--warning-light)] border border-[rgba(245,158,11,0.2)]
            rounded-[var(--radius-md)] text-sm text-[var(--warning-dark)]
          "
                >
                    <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                    <p>
                        Payment settings require <strong>Growth plan or above</strong>.
                        Upgrade to configure online payment and Razorpay.
                    </p>
                </div>
            )}

            {error && (
                <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--danger-light)] border border-[rgba(239,68,68,0.2)] text-sm text-[var(--danger-dark)]">
                    {error}
                </div>
            )}
            {success && (
                <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--success-light)] border border-[rgba(16,185,129,0.2)] text-sm text-[var(--success-dark)]">
                    {success}
                </div>
            )}

            {/* ── Razorpay Configuration ── */}
            <SettingSection
                title="Razorpay Configuration"
                description="Connect your Razorpay account for online fee collection"
                badge={
                    payment.razorpayConfigured
                        ? { label: 'Connected', color: 'success' }
                        : { label: 'Not Connected', color: 'warning' }
                }
            >
                {/* Status */}
                <div
                    className={`
            flex items-center gap-3 p-3.5 rounded-[var(--radius-md)]
            border mb-4
            ${payment.razorpayConfigured
                            ? 'bg-[var(--success-light)] border-[rgba(16,185,129,0.2)]'
                            : 'bg-[var(--bg-muted)] border-[var(--border)]'
                        }
          `}
                >
                    {payment.razorpayConfigured ? (
                        <ShieldCheck size={18} className="text-[var(--success)] flex-shrink-0" />
                    ) : (
                        <ShieldOff size={18} className="text-[var(--text-muted)] flex-shrink-0" />
                    )}
                    <div className="flex-1">
                        <p className="text-sm font-600 text-[var(--text-primary)]">
                            {payment.razorpayConfigured
                                ? 'Razorpay is connected'
                                : 'Razorpay not configured'
                            }
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                            {payment.razorpayConfigured
                                ? 'Your school can collect fees online via UPI, cards, and netbanking'
                                : 'Enter your Razorpay keys to enable online payments'
                            }
                        </p>
                    </div>
                </div>

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
                            disabled={!isPlanAllowed}
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
                                disabled={!isPlanAllowed}
                            />
                            <button
                                type="button"
                                onClick={() => setShowSecret(!showSecret)}
                                className="input-icon-right cursor-pointer hover:text-[var(--text-primary)]"
                            >
                                {showSecret
                                    ? <EyeOff size={15} />
                                    : <Eye size={15} />
                                }
                            </button>
                        </div>
                    </SettingRow>
                </div>

                {payment.razorpayConfigured && !clearKeys && (
                    <div className="mt-4 pt-4 border-t border-[var(--border)]">
                        <button
                            type="button"
                            onClick={() => {
                                setClearKeys(true)
                                setIsDirty(true)
                            }}
                            className="btn-danger btn-sm text-xs"
                            disabled={!isPlanAllowed}
                        >
                            <ShieldOff size={13} />
                            Disconnect Razorpay
                        </button>
                    </div>
                )}

                {clearKeys && (
                    <div
                        className="
              mt-3 p-3 bg-[var(--danger-light)]
              border border-[rgba(239,68,68,0.2)]
              rounded-[var(--radius-md)]
              flex items-center justify-between gap-3
            "
                    >
                        <p className="text-xs text-[var(--danger-dark)]">
                            Razorpay keys will be removed. Online payments will be disabled.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setClearKeys(false)
                                setIsDirty(false)
                            }}
                            className="text-xs text-[var(--danger)] hover:underline flex-shrink-0"
                        >
                            Cancel
                        </button>
                    </div>
                )}

                {/* Payment methods */}
                {isPlanAllowed && (
                    <div className="mt-4 pt-4 border-t border-[var(--border)]">
                        <ToggleRow
                            label="Enable Online Payment"
                            description="Allow parents to pay fees online"
                            checked={form.enableOnlinePayment}
                            onChange={(v) => update('enableOnlinePayment', v)}
                            disabled={!payment.razorpayConfigured && !rzpKeyId}
                        />

                        {form.enableOnlinePayment && (
                            <div className="mt-3">
                                <p className="text-xs font-600 text-[var(--text-secondary)] mb-2">
                                    Accepted Payment Methods
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {PAYMENT_METHODS.map((method) => {
                                        const isSelected = (form.paymentMethods || []).includes(
                                            method.key as any
                                        )
                                        return (
                                            <button
                                                key={method.key}
                                                type="button"
                                                onClick={() => {
                                                    const current = form.paymentMethods || []
                                                    const updated = isSelected
                                                        ? current.filter((m) => m !== method.key)
                                                        : [...current, method.key as any]
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
                                            >
                                                {isSelected && (
                                                    <CheckCircle2
                                                        size={11}
                                                        className="inline mr-1 text-[var(--primary-500)]"
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
                )}
            </SettingSection>

            {/* ── Receipt Settings ── */}
            <SettingSection
                title="Receipt Settings"
                description="Configure fee receipt format and branding"
            >
                <div className="space-y-0">
                    <SettingRow
                        horizontal
                        label="Receipt Prefix"
                        description="e.g. RCP → Receipt no: RCP-2025-0001"
                    >
                        <input
                            type="text"
                            value={form.receiptPrefix || 'RCP'}
                            onChange={(e) =>
                                update('receiptPrefix', e.target.value.toUpperCase())
                            }
                            placeholder="RCP"
                            className="input-clean uppercase font-mono tracking-wider"
                            maxLength={6}
                        />
                        <p className="input-hint">
                            Preview:{' '}
                            <span className="font-600 text-[var(--text-primary)] font-mono">
                                {form.receiptPrefix || 'RCP'}-2025-0001
                            </span>
                        </p>
                    </SettingRow>

                    <ToggleRow
                        label="Show School Logo on Receipt"
                        description="Print logo at top of fee receipt"
                        checked={form.showSchoolLogoOnReceipt ?? true}
                        onChange={(v) => update('showSchoolLogoOnReceipt', v)}
                    />

                    <SettingRow
                        horizontal
                        label="Receipt Footer"
                        description="Text at bottom of printed receipt"
                    >
                        <input
                            type="text"
                            value={form.receiptFooterText || ''}
                            onChange={(e) => update('receiptFooterText', e.target.value)}
                            placeholder="Thank you for your payment."
                            className="input-clean"
                            maxLength={200}
                        />
                        <p className="input-hint text-right">
                            {(form.receiptFooterText || '').length}/200
                        </p>
                    </SettingRow>
                </div>
            </SettingSection>

            {/* ── GST Settings ── */}
            <SettingSection
                title="GST Configuration"
                description="For schools registered under GST"
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
                                    update('gstNumber', e.target.value.toUpperCase())
                                }
                                placeholder="27AAAAA0000A1Z5"
                                className="input-clean uppercase font-mono tracking-wider"
                                maxLength={15}
                            />
                        </SettingRow>

                        <SettingRow
                            label="GST Percentage"
                            description="Standard rates: 5%, 12%, 18%, 28%"
                        >
                            <select
                                value={form.gstPercentage || 18}
                                onChange={(e) =>
                                    update('gstPercentage', parseInt(e.target.value))
                                }
                                className="input-clean"
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

            {/* ── Late Fine ── */}
            <SettingSection
                title="Late Fine Policy"
                description="Default late fine for overdue fee payments"
            >
                <ToggleRow
                    label="Enable Late Fine"
                    description="Apply fine after grace period"
                    checked={form.lateFineEnabled ?? false}
                    onChange={(v) => update('lateFineEnabled', v)}
                />

                {form.lateFineEnabled && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                            >
                                <option value="flat">Flat Amount (₹)</option>
                                <option value="percentage">Percentage (%)</option>
                                <option value="per_day">Per Day (₹/day)</option>
                            </select>
                        </SettingRow>

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
                                        className="
                      absolute left-3 top-1/2 -translate-y-1/2
                      text-sm text-[var(--text-muted)]
                    "
                                    >
                                        ₹
                                    </span>
                                )}
                                <input
                                    type="number"
                                    min={0}
                                    value={form.lateFineAmount || 0}
                                    onChange={(e) =>
                                        update('lateFineAmount', parseFloat(e.target.value) || 0)
                                    }
                                    className={`input-clean ${form.lateFineType !== 'percentage'
                                            ? 'pl-7'
                                            : ''
                                        }`}
                                />
                                {form.lateFineType === 'percentage' && (
                                    <span
                                        className="
                      absolute right-3 top-1/2 -translate-y-1/2
                      text-sm text-[var(--text-muted)]
                    "
                                    >
                                        %
                                    </span>
                                )}
                            </div>
                        </SettingRow>

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
                                />
                                <span
                                    className="
                    absolute right-3 top-1/2 -translate-y-1/2
                    text-xs text-[var(--text-muted)]
                  "
                                >
                                    days
                                </span>
                            </div>
                        </SettingRow>
                    </div>
                )}

                {form.lateFineEnabled && (
                    <div
                        className="
              mt-3 flex items-start gap-2 p-3
              bg-[var(--info-light)] border border-[rgba(59,130,246,0.15)]
              rounded-[var(--radius-md)]
            "
                    >
                        <Info size={13} className="text-[var(--info)] flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-[var(--info-dark)]">
                            This is the default policy. Individual fee structures can
                            override this setting.
                        </p>
                    </div>
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