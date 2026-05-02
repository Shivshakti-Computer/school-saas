// FILE: src/components/settings/tabs/NotificationsTab.tsx
// ✅ UPDATED: Multi-tenant support — School vs Academy vs Coaching
// Institution-aware notification labels and types
// Academy/Coaching: Student/Parent → Learner/Guardian terminology

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { MessageSquare, CheckCircle2, Info } from 'lucide-react'
import { SettingSection } from '../shared/SettingSection'
import { ToggleRow, SettingRow } from '../shared/SettingRow'
import { SaveBar } from '../shared/SaveButton'
import type { INotificationSettings } from '@/types/settings'
import type { InstitutionType } from '@/lib/institutionConfig'

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

type SMSSettings = NonNullable<INotificationSettings['sms']>
type EmailSettings = NonNullable<INotificationSettings['email']>
type WhatsAppSettings = NonNullable<INotificationSettings['whatsapp']>
type QuietHoursSettings = NonNullable<INotificationSettings['quietHours']>
type FieldValue<T, K extends keyof T> = T[K]

// ─────────────────────────────────────────────────────────
// Institution-aware notification config
// ─────────────────────────────────────────────────────────

interface NotificationItem {
    field: string
    label: string
    description: string
    defaultVal: boolean
}

function getSMSNotifications(instType: InstitutionType): NotificationItem[] {
    if (instType === 'school') {
        return [
            {
                field: 'onAbsent',
                label: 'Absent Alert',
                description: 'SMS to parent when student marked absent',
                defaultVal: true,
            },
            {
                field: 'onFeeReminder',
                label: 'Fee Reminder',
                description: 'Reminder SMS before fee due date',
                defaultVal: true,
            },
            {
                field: 'onFeeReceipt',
                label: 'Fee Receipt',
                description: 'Confirmation SMS when fee is paid',
                defaultVal: true,
            },
            {
                field: 'onLateFine',
                label: 'Late Fine Alert',
                description: 'SMS when late fine is applied',
                defaultVal: false,
            },
            {
                field: 'onExamResult',
                label: 'Exam Result',
                description: 'SMS when result is published',
                defaultVal: false,
            },
            {
                field: 'onNewNotice',
                label: 'New Notice',
                description: 'SMS when important notice is published',
                defaultVal: false,
            },
            {
                field: 'onAdmission',
                label: 'New Admission',
                description: 'Confirmation SMS on student admission',
                defaultVal: true,
            },
            {
                field: 'homeworkAlert',
                label: 'Homework Alert',
                description: 'SMS to students when new homework is assigned',
                defaultVal: false,
            },
        ]
    }

    if (instType === 'academy') {
        return [
            {
                field: 'onAdmission',
                label: 'Enrollment Confirmation',
                description: 'SMS when learner enrolls in a course',
                defaultVal: true,
            },
            {
                field: 'onFeeReminder',
                label: 'Course Fee Reminder',
                description: 'Reminder SMS before course fee due date',
                defaultVal: true,
            },
            {
                field: 'onFeeReceipt',
                label: 'Fee Receipt',
                description: 'Confirmation SMS when course fee is paid',
                defaultVal: true,
            },
            {
                field: 'onLateFine',
                label: 'Late Fine Alert',
                description: 'SMS when late fine is applied to course fee',
                defaultVal: false,
            },
            {
                field: 'onAbsent',
                label: 'Batch Absence Alert',
                description: 'SMS to learner when absent from batch',
                defaultVal: false,
            },
            {
                field: 'onExamResult',
                label: 'Assessment Result',
                description: 'SMS when assessment result is published',
                defaultVal: false,
            },
            {
                field: 'onNewNotice',
                label: 'Course Announcement',
                description: 'SMS for important course announcements',
                defaultVal: false,
            },
            {
                field: 'homeworkAlert',
                label: 'Assignment Alert',
                description: 'SMS to learners when new assignment is posted',
                defaultVal: false,
            },
        ]
    }

    // coaching
    return [
        {
            field: 'onAdmission',
            label: 'Batch Enrollment',
            description: 'SMS when student enrolls in a batch',
            defaultVal: true,
        },
        {
            field: 'onFeeReminder',
            label: 'Batch Fee Reminder',
            description: 'Reminder SMS before batch fee due date',
            defaultVal: true,
        },
        {
            field: 'onFeeReceipt',
            label: 'Fee Receipt',
            description: 'Confirmation SMS when batch fee is paid',
            defaultVal: true,
        },
        {
            field: 'onLateFine',
            label: 'Late Fine Alert',
            description: 'SMS when late fine is applied',
            defaultVal: false,
        },
        {
            field: 'onAbsent',
            label: 'Absence Alert',
            description: 'SMS to student/guardian when absent',
            defaultVal: false,
        },
        {
            field: 'onExamResult',
            label: 'Test Result',
            description: 'SMS when test result is published',
            defaultVal: false,
        },
        {
            field: 'onNewNotice',
            label: 'Batch Notice',
            description: 'SMS for important batch notices',
            defaultVal: false,
        },
        {
            field: 'homeworkAlert',
            label: 'Assignment Alert',
            description: 'SMS to students when new assignment is posted',
            defaultVal: false,
        },
    ]
}

function getEmailNotifications(instType: InstitutionType): NotificationItem[] {
    if (instType === 'school') {
        return [
            {
                field: 'onAdmission',
                label: 'Admission Welcome',
                description: 'Welcome email when student is admitted',
                defaultVal: true,
            },
            {
                field: 'onFeeReceipt',
                label: 'Fee Receipt',
                description: 'Email receipt after fee payment',
                defaultVal: true,
            },
            {
                field: 'onExamResult',
                label: 'Exam Result',
                description: 'Email when result is published',
                defaultVal: false,
            },
            {
                field: 'onNewNotice',
                label: 'New Notice',
                description: 'Email for important notices',
                defaultVal: false,
            },
            {
                field: 'homeworkAlert',
                label: 'Homework Alert',
                description: 'Email to students when new homework is assigned',
                defaultVal: false,
            },
        ]
    }

    if (instType === 'academy') {
        return [
            {
                field: 'onAdmission',
                label: 'Enrollment Welcome',
                description: 'Welcome email when learner enrolls in course',
                defaultVal: true,
            },
            {
                field: 'onFeeReceipt',
                label: 'Course Fee Receipt',
                description: 'Email receipt after course fee payment',
                defaultVal: true,
            },
            {
                field: 'onExamResult',
                label: 'Assessment Result',
                description: 'Email when assessment result is published',
                defaultVal: false,
            },
            {
                field: 'onNewNotice',
                label: 'Course Announcement',
                description: 'Email for course announcements',
                defaultVal: false,
            },
            {
                field: 'homeworkAlert',
                label: 'Assignment Alert',
                description: 'Email when new assignment is posted',
                defaultVal: false,
            },
        ]
    }

    // coaching
    return [
        {
            field: 'onAdmission',
            label: 'Batch Enrollment Welcome',
            description: 'Welcome email when student joins a batch',
            defaultVal: true,
        },
        {
            field: 'onFeeReceipt',
            label: 'Fee Receipt',
            description: 'Email receipt after batch fee payment',
            defaultVal: true,
        },
        {
            field: 'onExamResult',
            label: 'Test Result',
            description: 'Email when test result is published',
            defaultVal: false,
        },
        {
            field: 'onNewNotice',
            label: 'Batch Notice',
            description: 'Email for important batch notices',
            defaultVal: false,
        },
        {
            field: 'homeworkAlert',
            label: 'Assignment Alert',
            description: 'Email when new assignment is posted',
            defaultVal: false,
        },
    ]
}

function getWhatsAppNotifications(instType: InstitutionType): NotificationItem[] {
    if (instType === 'school') {
        return [
            {
                field: 'onAbsent',
                label: 'Absent Alert',
                description: 'WhatsApp to parent on absence',
                defaultVal: false,
            },
            {
                field: 'onFeeReminder',
                label: 'Fee Reminder',
                description: 'WhatsApp fee reminder before due date',
                defaultVal: false,
            },
            {
                field: 'onFeeReceipt',
                label: 'Fee Receipt',
                description: 'WhatsApp confirmation after payment',
                defaultVal: false,
            },
            {
                field: 'onExamResult',
                label: 'Exam Result',
                description: 'WhatsApp when result is published',
                defaultVal: false,
            },
            {
                field: 'homeworkAlert',
                label: 'Homework Alert',
                description: 'WhatsApp to students when new homework is assigned',
                defaultVal: false,
            },
        ]
    }

    if (instType === 'academy') {
        return [
            {
                field: 'onAbsent',
                label: 'Batch Absence Alert',
                description: 'WhatsApp to learner on batch absence',
                defaultVal: false,
            },
            {
                field: 'onFeeReminder',
                label: 'Course Fee Reminder',
                description: 'WhatsApp course fee reminder before due date',
                defaultVal: false,
            },
            {
                field: 'onFeeReceipt',
                label: 'Fee Receipt',
                description: 'WhatsApp confirmation after course fee payment',
                defaultVal: false,
            },
            {
                field: 'onExamResult',
                label: 'Assessment Result',
                description: 'WhatsApp when assessment result is published',
                defaultVal: false,
            },
            {
                field: 'homeworkAlert',
                label: 'Assignment Alert',
                description: 'WhatsApp when new assignment is posted',
                defaultVal: false,
            },
        ]
    }

    // coaching
    return [
        {
            field: 'onAbsent',
            label: 'Absence Alert',
            description: 'WhatsApp to student/guardian on absence',
            defaultVal: false,
        },
        {
            field: 'onFeeReminder',
            label: 'Fee Reminder',
            description: 'WhatsApp batch fee reminder before due date',
            defaultVal: false,
        },
        {
            field: 'onFeeReceipt',
            label: 'Fee Receipt',
            description: 'WhatsApp confirmation after batch fee payment',
            defaultVal: false,
        },
        {
            field: 'onExamResult',
            label: 'Test Result',
            description: 'WhatsApp when test result is published',
            defaultVal: false,
        },
        {
            field: 'homeworkAlert',
            label: 'Assignment Alert',
            description: 'WhatsApp when new assignment is posted',
            defaultVal: false,
        },
    ]
}

// ─────────────────────────────────────────────────────────
// Institution label helpers
// ─────────────────────────────────────────────────────────

function getInstLabel(instType: InstitutionType) {
    return {
        school: {
            smsDesc: 'Automatic SMS alerts to parents and students',
            emailDesc: 'Automatic email alerts (lower credit cost than SMS)',
            whatsappDesc: 'WhatsApp messages via integrated provider',
            quietDesc: 'No notifications will be sent during this period',
            infoBanner:
                'Auto-notifications use your SMS/Email credits. Enable only what you need to manage costs.',
            feeReminderLabel: 'Send fee reminder',
            emailReminderLabel: 'Email fee reminder',
        },
        academy: {
            smsDesc: 'Automatic SMS alerts to learners for course updates',
            emailDesc: 'Automatic email alerts for course and fee updates',
            whatsappDesc: 'WhatsApp messages for course announcements',
            quietDesc: 'No notifications during quiet hours',
            infoBanner:
                'Auto-notifications use your SMS/Email credits. Enable relevant alerts for learner engagement.',
            feeReminderLabel: 'Send course fee reminder',
            emailReminderLabel: 'Email course fee reminder',
        },
        coaching: {
            smsDesc: 'Automatic SMS alerts to students and guardians',
            emailDesc: 'Automatic email alerts for batch and fee updates',
            whatsappDesc: 'WhatsApp messages for batch announcements',
            quietDesc: 'No notifications during quiet hours',
            infoBanner:
                'Auto-notifications use your SMS/Email credits. Enable relevant alerts for student updates.',
            feeReminderLabel: 'Send batch fee reminder',
            emailReminderLabel: 'Email batch fee reminder',
        },
    }[instType] || {
        smsDesc: 'Automatic SMS alerts',
        emailDesc: 'Automatic email alerts',
        whatsappDesc: 'WhatsApp messages',
        quietDesc: 'No notifications during quiet hours',
        infoBanner: 'Auto-notifications use your SMS/Email credits.',
        feeReminderLabel: 'Send fee reminder',
        emailReminderLabel: 'Email fee reminder',
    }
}

// ─────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────

interface NotificationsTabProps {
    notifications: INotificationSettings
    onSaved: (updated: INotificationSettings) => void
    institutionType?: InstitutionType  // ✅ ADD
}

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────

export function NotificationsTab({
    notifications,
    onSaved,
    institutionType,
}: NotificationsTabProps) {
    const { data: session } = useSession()

    // ✅ institutionType — prop > session > default
    const instType: InstitutionType =
        institutionType ||
        ((session?.user as any)?.institutionType as InstitutionType) ||
        'school'

    const labels = getInstLabel(instType)
    const smsItems = getSMSNotifications(instType)
    const emailItems = getEmailNotifications(instType)
    const whatsappItems = getWhatsAppNotifications(instType)

    // ─────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────

    const [form, setForm] = useState<INotificationSettings>({
        ...notifications,
    })
    const [originalData, setOriginalData] = useState<INotificationSettings>({
        ...notifications,
    })
    const [isDirty, setIsDirty] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // Sync when prop changes
    useEffect(() => {
        setForm({ ...notifications })
        setOriginalData({ ...notifications })
        setIsDirty(false)
        setError(null)
        setSuccess(null)
    }, [notifications])

    // ─────────────────────────────────────────────────────
    // Typed update functions
    // ─────────────────────────────────────────────────────

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
            whatsapp: {
                ...prev.whatsapp,
                [field]: val,
            } as WhatsAppSettings,
        }))
        setIsDirty(true)
    }

    function updateQuiet<K extends keyof QuietHoursSettings>(
        field: K,
        val: FieldValue<QuietHoursSettings, K>
    ): void {
        setForm((prev) => ({
            ...prev,
            quietHours: {
                ...prev.quietHours,
                [field]: val,
            } as QuietHoursSettings,
        }))
        setIsDirty(true)
    }

    // ─────────────────────────────────────────────────────
    // Generic field reader — any nested object
    // ─────────────────────────────────────────────────────

    function getSMSVal(field: string, defaultVal: boolean): boolean {
        return (form.sms as any)?.[field] ?? defaultVal
    }

    function getEmailVal(field: string, defaultVal: boolean): boolean {
        return (form.email as any)?.[field] ?? defaultVal
    }

    function getWhatsAppVal(field: string, defaultVal: boolean): boolean {
        return (form.whatsapp as any)?.[field] ?? defaultVal
    }

    // ─────────────────────────────────────────────────────
    // Save
    // ─────────────────────────────────────────────────────

    const handleSave = async (): Promise<void> => {
        setSaving(true)
        setError(null)
        setSuccess(null)

        // Optimistic update
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

            setIsDirty(false)
            setSuccess('Notification settings saved successfully')

        } catch (err) {
            // Rollback
            const message =
                err instanceof Error ? err.message : 'Unknown error'
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

    // ─────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────

    return (
        <div className="space-y-5 portal-content-enter">

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

            {/* ── Info Banner ── */}
            <div
                className="flex items-start gap-3 p-3.5 rounded-[var(--radius-md)] border text-sm"
                style={{
                    background: 'var(--info-light)',
                    borderColor: 'rgba(59,130,246,0.2)',
                    color: 'var(--info-dark)',
                }}
            >
                <MessageSquare size={15} className="flex-shrink-0 mt-0.5" />
                <p>{labels.infoBanner}</p>
            </div>

            {/* ══════════════════════════════════════════════
                SMS Notifications
            ══════════════════════════════════════════════ */}
            <SettingSection
                title="SMS Notifications"
                description={labels.smsDesc}
                badge={{ label: 'Uses Credits', color: 'warning' }}
            >
                {smsItems.map((item) => (
                    <ToggleRow
                        key={item.field}
                        label={item.label}
                        description={item.description}
                        checked={getSMSVal(item.field, item.defaultVal)}
                        onChange={(v) =>
                            updateSMS(
                                item.field as keyof SMSSettings,
                                v as any
                            )
                        }
                    />
                ))}

                {/* Fee reminder days — show only if onFeeReminder enabled */}
                {getSMSVal('onFeeReminder', true) && (
                    <div
                        className="mt-3 pt-3 flex items-center gap-3"
                        style={{ borderTop: '1px solid var(--border)' }}
                    >
                        <p
                            className="text-sm flex-1"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            {labels.feeReminderLabel}
                        </p>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={1}
                                max={30}
                                value={
                                    form.sms?.feeReminderDaysBefore ?? 3
                                }
                                onChange={(e) =>
                                    updateSMS(
                                        'feeReminderDaysBefore',
                                        parseInt(e.target.value, 10) || 3
                                    )
                                }
                                className="input-clean w-16 text-center text-sm"
                                aria-label="Fee reminder days before"
                            />
                            <span
                                className="text-sm whitespace-nowrap"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                days before due date
                            </span>
                        </div>
                    </div>
                )}
            </SettingSection>

            {/* ══════════════════════════════════════════════
                Email Notifications
            ══════════════════════════════════════════════ */}
            <SettingSection
                title="Email Notifications"
                description={labels.emailDesc}
                badge={{ label: '0.1 Credits', color: 'primary' }}
            >
                {emailItems.map((item) => (
                    <ToggleRow
                        key={item.field}
                        label={item.label}
                        description={item.description}
                        checked={getEmailVal(item.field, item.defaultVal)}
                        onChange={(v) =>
                            updateEmail(
                                item.field as keyof EmailSettings,
                                v as any
                            )
                        }
                    />
                ))}

                {/* Email fee reminder days */}
                {getEmailVal('onFeeReceipt', true) && (
                    <div
                        className="mt-3 pt-3 flex items-center gap-3"
                        style={{ borderTop: '1px solid var(--border)' }}
                    >
                        <p
                            className="text-sm flex-1"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            {labels.emailReminderLabel}
                        </p>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={1}
                                max={30}
                                value={
                                    form.email?.feeReminderDaysBefore ?? 3
                                }
                                onChange={(e) =>
                                    updateEmail(
                                        'feeReminderDaysBefore',
                                        parseInt(e.target.value, 10) || 3
                                    )
                                }
                                className="input-clean w-16 text-center text-sm"
                                aria-label="Email fee reminder days before"
                            />
                            <span
                                className="text-sm whitespace-nowrap"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                days before due date
                            </span>
                        </div>
                    </div>
                )}
            </SettingSection>

            {/* ══════════════════════════════════════════════
                WhatsApp Notifications
            ══════════════════════════════════════════════ */}
            <SettingSection
                title="WhatsApp Notifications"
                description={labels.whatsappDesc}
                badge={{ label: 'Uses Credits', color: 'warning' }}
            >
                {whatsappItems.map((item) => (
                    <ToggleRow
                        key={item.field}
                        label={item.label}
                        description={item.description}
                        checked={getWhatsAppVal(item.field, item.defaultVal)}
                        onChange={(v) =>
                            updateWhatsApp(
                                item.field as keyof WhatsAppSettings,
                                v as any
                            )
                        }
                    />
                ))}
            </SettingSection>

            {/* ══════════════════════════════════════════════
                Quiet Hours
            ══════════════════════════════════════════════ */}
            <SettingSection
                title="Quiet Hours"
                description={labels.quietDesc}
            >
                <ToggleRow
                    label="Enable Quiet Hours"
                    description="Pause all auto-notifications during this period"
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
                                onChange={(e) =>
                                    updateQuiet('start', e.target.value)
                                }
                                className="input-clean"
                                aria-label="Quiet hours start time"
                            />
                        </SettingRow>
                        <SettingRow
                            label="Quiet Until"
                            description="End of quiet period"
                        >
                            <input
                                type="time"
                                value={form.quietHours?.end ?? '07:00'}
                                onChange={(e) =>
                                    updateQuiet('end', e.target.value)
                                }
                                className="input-clean"
                                aria-label="Quiet hours end time"
                            />
                        </SettingRow>
                    </div>
                )}

                {/* Info note */}
                {form.quietHours?.enabled && (
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
                            Notifications triggered during quiet hours will be
                            queued and sent after the period ends.
                        </p>
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