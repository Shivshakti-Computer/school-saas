// FILE: src/components/settings/tabs/NotificationsTab.tsx

'use client'

import { useState, useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import { SettingSection } from '../shared/SettingSection'
import { ToggleRow, SettingRow } from '../shared/SettingRow'
import { SaveBar } from '../shared/SaveButton'
import type { INotificationSettings } from '@/types/settings'

interface NotificationsTabProps {
    notifications: INotificationSettings
    onSaved: (updated: INotificationSettings) => void
}

type SMSSettings = NonNullable<INotificationSettings['sms']>
type EmailSettings = NonNullable<INotificationSettings['email']>
type WhatsAppSettings = NonNullable<INotificationSettings['whatsapp']>
type QuietHoursSettings = NonNullable<INotificationSettings['quietHours']>

type FieldValue<T, K extends keyof T> = T[K]

export function NotificationsTab({
    notifications,
    onSaved,
}: NotificationsTabProps) {
    const [form, setForm] = useState<INotificationSettings>({ ...notifications })
    const [originalData, setOriginalData] = useState<INotificationSettings>({ 
        ...notifications 
    })
    const [isDirty, setIsDirty] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // ✅ FIX 1: Sync both form AND originalData when prop changes
    useEffect(() => {
        setForm({ ...notifications })
        setOriginalData({ ...notifications })
        setIsDirty(false)
        setError(null)
        setSuccess(null)
    }, [notifications])

    // ── Typed update functions ─────────────────────────────────────────────

    function updateSMS<K extends keyof SMSSettings>(
        field: K,
        val: FieldValue<SMSSettings, K>
    ): void {
        setForm((prev) => ({
            ...prev,
            sms: { ...prev.sms, [field]: val } as SMSSettings,
        }))
        setIsDirty(true)
    }

    function updateEmail<K extends keyof EmailSettings>(
        field: K,
        val: FieldValue<EmailSettings, K>
    ): void {
        setForm((prev) => ({
            ...prev,
            email: { ...prev.email, [field]: val } as EmailSettings,
        }))
        setIsDirty(true)
    }

    function updateWhatsApp<K extends keyof WhatsAppSettings>(
        field: K,
        val: FieldValue<WhatsAppSettings, K>
    ): void {
        setForm((prev) => ({
            ...prev,
            whatsapp: { ...prev.whatsapp, [field]: val } as WhatsAppSettings,
        }))
        setIsDirty(true)
    }

    function updateQuiet<K extends keyof QuietHoursSettings>(
        field: K,
        val: FieldValue<QuietHoursSettings, K>
    ): void {
        setForm((prev) => ({
            ...prev,
            quietHours: { ...prev.quietHours, [field]: val } as QuietHoursSettings,
        }))
        setIsDirty(true)
    }

    // ✅ FIX 2: Save logic — same pattern as AcademicTab
    const handleSave = async (): Promise<void> => {
        setSaving(true)
        setError(null)
        setSuccess(null)

        // ✅ Optimistic update — backup pehle banao
        const backup = { ...originalData }
        setOriginalData({ ...form })
        onSaved(form)

        try {
            const res = await fetch('/api/settings/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })

            const data = (await res.json()) as { error?: string }
            if (!res.ok) throw new Error(data.error ?? 'Save failed')

            // ✅ Success — originalData already updated above
            setIsDirty(false)
            setSuccess('Notification settings saved')

        } catch (err) {
            // ✅ Rollback on error
            const message = err instanceof Error ? err.message : 'Unknown error'
            setError(message)
            
            setOriginalData(backup)
            onSaved(backup)
            setForm(backup)
            
            throw err
        } finally {
            setSaving(false)
        }
    }

    const handleDiscard = (): void => {
        setForm({ ...originalData })
        setIsDirty(false)
        setError(null)
        setSuccess(null)
    }

    // ── Render (rest of your JSX — unchanged) ─────────────────────────────

    return (
        <div className="space-y-5 portal-content-enter">
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

            {/* Info banner */}
            <div className="flex items-start gap-3 p-3.5 bg-[var(--info-light)] border border-[rgba(59,130,246,0.2)] rounded-[var(--radius-md)] text-sm text-[var(--info-dark)]">
                <MessageSquare size={15} className="flex-shrink-0 mt-0.5" />
                <p>
                    Auto-notifications use your SMS/Email credits.
                    Enable only what you need to manage costs.
                </p>
            </div>

            {/* ── SMS ─────────────────────────────────────────────────────── */}
            <SettingSection
                title="SMS Notifications"
                description="Automatic SMS alerts to parents and students"
                badge={{ label: 'Uses Credits', color: 'warning' }}
            >
                <ToggleRow
                    label="Absent Alert"
                    description="SMS to parent when student marked absent"
                    checked={form.sms?.onAbsent ?? true}
                    onChange={(v) => updateSMS('onAbsent', v)}
                />
                <ToggleRow
                    label="Fee Reminder"
                    description="Reminder SMS before fee due date"
                    checked={form.sms?.onFeeReminder ?? true}
                    onChange={(v) => updateSMS('onFeeReminder', v)}
                />
                <ToggleRow
                    label="Fee Receipt"
                    description="Confirmation SMS when fee is paid"
                    checked={form.sms?.onFeeReceipt ?? true}
                    onChange={(v) => updateSMS('onFeeReceipt', v)}
                />
                <ToggleRow
                    label="Late Fine Alert"
                    description="SMS when late fine is applied"
                    checked={form.sms?.onLateFine ?? false}
                    onChange={(v) => updateSMS('onLateFine', v)}
                />
                <ToggleRow
                    label="Exam Result"
                    description="SMS when result is published"
                    checked={form.sms?.onExamResult ?? false}
                    onChange={(v) => updateSMS('onExamResult', v)}
                />
                <ToggleRow
                    label="New Notice"
                    description="SMS when important notice is published"
                    checked={form.sms?.onNewNotice ?? false}
                    onChange={(v) => updateSMS('onNewNotice', v)}
                />
                <ToggleRow
                    label="New Admission"
                    description="Confirmation SMS on student admission"
                    checked={form.sms?.onAdmission ?? true}
                    onChange={(v) => updateSMS('onAdmission', v)}
                />
                <ToggleRow
                    label="Homework Alert"
                    description="SMS to students when new homework is assigned"
                    checked={form.sms?.homeworkAlert ?? false}
                    onChange={(v) => updateSMS('homeworkAlert', v)}
                />

                {/* Fee reminder days */}
                {form.sms?.onFeeReminder && (
                    <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center gap-3">
                        <p className="text-sm text-[var(--text-secondary)] flex-1">
                            Send fee reminder
                        </p>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={1}
                                max={30}
                                value={form.sms?.feeReminderDaysBefore ?? 3}
                                onChange={(e) =>
                                    updateSMS(
                                        'feeReminderDaysBefore',
                                        parseInt(e.target.value, 10) || 3
                                    )
                                }
                                className="input-clean w-16 text-center text-sm"
                            />
                            <span className="text-sm text-[var(--text-muted)] whitespace-nowrap">
                                days before due date
                            </span>
                        </div>
                    </div>
                )}
            </SettingSection>

            {/* ── Email ────────────────────────────────────────────────────── */}
            <SettingSection
                title="Email Notifications"
                description="Automatic email alerts (lower credit cost than SMS)"
                badge={{ label: '0.1 Credits', color: 'primary' }}
            >
                <ToggleRow
                    label="Admission Welcome"
                    description="Welcome email when student is admitted"
                    checked={form.email?.onAdmission ?? true}
                    onChange={(v) => updateEmail('onAdmission', v)}
                />
                <ToggleRow
                    label="Fee Receipt"
                    description="Email receipt after fee payment"
                    checked={form.email?.onFeeReceipt ?? true}
                    onChange={(v) => updateEmail('onFeeReceipt', v)}
                />
                <ToggleRow
                    label="Exam Result"
                    description="Email when result is published"
                    checked={form.email?.onExamResult ?? false}
                    onChange={(v) => updateEmail('onExamResult', v)}
                />
                <ToggleRow
                    label="New Notice"
                    description="Email for important notices"
                    checked={form.email?.onNewNotice ?? false}
                    onChange={(v) => updateEmail('onNewNotice', v)}
                />
                <ToggleRow
                    label="Homework Alert"
                    description="Email to students when new homework is assigned"
                    checked={form.email?.homeworkAlert ?? false}
                    onChange={(v) => updateEmail('homeworkAlert', v)}
                />

                {form.email?.onFeeReceipt && (
                    <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center gap-3">
                        <p className="text-sm text-[var(--text-secondary)] flex-1">
                            Email fee reminder
                        </p>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={1}
                                max={30}
                                value={form.email?.feeReminderDaysBefore ?? 3}
                                onChange={(e) =>
                                    updateEmail(
                                        'feeReminderDaysBefore',
                                        parseInt(e.target.value, 10) || 3
                                    )
                                }
                                className="input-clean w-16 text-center text-sm"
                            />
                            <span className="text-sm text-[var(--text-muted)] whitespace-nowrap">
                                days before due date
                            </span>
                        </div>
                    </div>
                )}
            </SettingSection>

            {/* ── WhatsApp ─────────────────────────────────────────────────── */}
            <SettingSection
                title="WhatsApp Notifications"
                description="WhatsApp messages via integrated provider"
                badge={{ label: 'Uses Credits', color: 'warning' }}
            >
                <ToggleRow
                    label="Absent Alert"
                    description="WhatsApp to parent on absence"
                    checked={form.whatsapp?.onAbsent ?? false}
                    onChange={(v) => updateWhatsApp('onAbsent', v)}
                />
                <ToggleRow
                    label="Fee Reminder"
                    description="WhatsApp fee reminder before due date"
                    checked={form.whatsapp?.onFeeReminder ?? false}
                    onChange={(v) => updateWhatsApp('onFeeReminder', v)}
                />
                <ToggleRow
                    label="Fee Receipt"
                    description="WhatsApp confirmation after payment"
                    checked={form.whatsapp?.onFeeReceipt ?? false}
                    onChange={(v) => updateWhatsApp('onFeeReceipt', v)}
                />
                <ToggleRow
                    label="Exam Result"
                    description="WhatsApp when result is published"
                    checked={form.whatsapp?.onExamResult ?? false}
                    onChange={(v) => updateWhatsApp('onExamResult', v)}
                />
                <ToggleRow
                    label="Homework Alert"
                    description="WhatsApp to students when new homework is assigned"
                    checked={form.whatsapp?.homeworkAlert ?? false}
                    onChange={(v) => updateWhatsApp('homeworkAlert', v)}
                />
            </SettingSection>

            {/* ── Quiet Hours ──────────────────────────────────────────────── */}
            <SettingSection
                title="Quiet Hours"
                description="No notifications will be sent during this period"
            >
                <ToggleRow
                    label="Enable Quiet Hours"
                    description="Pause all auto-notifications at night"
                    checked={form.quietHours?.enabled ?? true}
                    onChange={(v) => updateQuiet('enabled', v)}
                />

                {form.quietHours?.enabled && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <SettingRow
                            label="Quiet From"
                            description="Start of quiet period"
                        >
                            <input
                                type="time"
                                value={form.quietHours?.start ?? '21:00'}
                                onChange={(e) => updateQuiet('start', e.target.value)}
                                className="input-clean"
                            />
                        </SettingRow>
                        <SettingRow
                            label="Quiet Until"
                            description="End of quiet period"
                        >
                            <input
                                type="time"
                                value={form.quietHours?.end ?? '07:00'}
                                onChange={(e) => updateQuiet('end', e.target.value)}
                                className="input-clean"
                            />
                        </SettingRow>
                    </div>
                )}
            </SettingSection>

            <SaveBar
                isDirty={isDirty}
                onSave={handleSave}
                onDiscard={handleDiscard}
                saving={saving}
            />
        </div>
    )
}