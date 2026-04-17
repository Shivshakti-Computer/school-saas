// FILE: src/components/homework/HomeworkForm.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input, Select, Button, Alert } from '@/components/ui'
import { Upload, X, Loader2, Users, RefreshCw, Info } from 'lucide-react'
import { useAcademicSettings } from '@/hooks/useAcademicSettings'
import { getAcademicYears, getCurrentAcademicYear } from '@/lib/academicYear'
import { CREDIT_COSTS } from '@/config/pricing'
import type { HomeworkFormData, HomeworkDetail, HomeworkAttachment } from '@/types/homework'

interface HomeworkFormProps {
    initialData?: HomeworkDetail
    onSubmit: (data: HomeworkFormData) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
}

const SUBJECT_OPTIONS = [
    'Mathematics', 'Science', 'English', 'Hindi',
    'Social Science', 'Computer', 'Physics', 'Chemistry',
    'Biology', 'Accountancy', 'Business Studies', 'Economics',
    'History', 'Geography', 'Political Science', 'Sanskrit',
    'Physical Education', 'Drawing', 'Moral Science',
]

// ✅ Notification target options
const NOTIFICATION_TARGET_OPTIONS = [
    { value: 'all', label: 'Students + Parents (Both)' },
    { value: 'student', label: 'Students Only' },
    { value: 'parent', label: 'Parents Only' },
]

interface ChannelCount {
    validContacts: number
}

interface RecipientCount {
    total: number
    loading: boolean
    channels: {
        sms: ChannelCount
        whatsapp: ChannelCount
        email: ChannelCount
    }
}

function formatCredits(value: number): string {
    if (Number.isInteger(value)) return value.toLocaleString('en-IN')
    return value.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
}

function getFileType(filename: string): 'pdf' | 'image' | 'doc' | 'other' {
    const ext = filename.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return 'pdf'
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image'
    if (['doc', 'docx'].includes(ext || '')) return 'doc'
    return 'other'
}

export function HomeworkForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
}: HomeworkFormProps) {
    const { settings: academicSettings, loading: settingsLoading } = useAcademicSettings()

    // ✅ Notification target role state (alag se — form ka part nahi)
    const [notifTargetRole, setNotifTargetRole] = useState<'all' | 'student' | 'parent'>('all')

    // ✅ Academic year state — NoticeForm ki tarah
    const [notifAcademicYear, setNotifAcademicYear] = useState(
        academicSettings?.currentAcademicYear || getCurrentAcademicYear()
    )

    // ✅ Sync when academicSettings loads
    useEffect(() => {
        if (academicSettings?.currentAcademicYear) {
            setNotifAcademicYear(academicSettings.currentAcademicYear)
        }
    }, [academicSettings?.currentAcademicYear])

    const academicYears = getAcademicYears()

    const [form, setForm] = useState<HomeworkFormData>({
        title: initialData?.title || '',
        description: initialData?.description || '',
        subject: initialData?.subject || '',
        class: initialData?.class || '',
        section: initialData?.section || '',
        targetStudents: initialData?.targetStudents || [],
        dueDate: initialData?.dueDate
            ? new Date(initialData.dueDate).toISOString().slice(0, 16)
            : '',
        allowLateSubmission: initialData?.allowLateSubmission ?? true,
        attachments: initialData?.attachments || [],
        sendNotification: true,
        notificationChannels: {
            sms: false,
            whatsapp: false,
            email: false,
            push: true,
        },
    })

    const [errors, setErrors] = useState<Record<string, string>>({})
    const [uploading, setUploading] = useState(false)
    const isEdit = !!initialData

    const [notifSettings, setNotifSettings] = useState<{
        sms: { enabled: boolean; homeworkAlert: boolean }
        email: { enabled: boolean; homeworkAlert: boolean }
        whatsapp: { enabled: boolean; homeworkAlert: boolean }
    } | null>(null)

    const [creditBalance, setCreditBalance] = useState(0)
    const [balanceLoaded, setBalanceLoaded] = useState(false)

    const [recipientCount, setRecipientCount] = useState<RecipientCount>({
        total: 0,
        loading: false,
        channels: {
            sms: { validContacts: 0 },
            whatsapp: { validContacts: 0 },
            email: { validContacts: 0 },
        },
    })

    // ── Class/Section options ──
    const CLASS_OPTIONS = academicSettings
        ? academicSettings.classes
            .filter(c => c.isActive)
            .sort((a, b) => a.order - b.order)
            .reduce<Array<{ value: string; label: string }>>((acc, c) => {
                if (!acc.find(item => item.value === c.name)) {
                    acc.push({
                        value: c.name,
                        label: c.displayName || `Class ${c.name}`,
                    })
                }
                return acc
            }, [])
        : []

    const SECTION_OPTIONS = academicSettings
        ? academicSettings.sections
            .filter(s => s.isActive)
            .map(s => ({ value: s.name, label: s.name }))
        : []

    // ── Fetch notification settings ──
    useEffect(() => {
        const fetchNotifSettings = async () => {
            try {
                const res = await fetch('/api/settings')
                const data = await res.json()
                if (res.ok && data.notifications) {
                    setNotifSettings({
                        sms: {
                            enabled: data.notifications.sms?.enabled ?? true,
                            homeworkAlert: data.notifications.sms?.homeworkAlert ?? false,
                        },
                        email: {
                            enabled: data.notifications.email?.enabled ?? true,
                            homeworkAlert: data.notifications.email?.homeworkAlert ?? false,
                        },
                        whatsapp: {
                            enabled: data.notifications.whatsapp?.enabled ?? false,
                            homeworkAlert: data.notifications.whatsapp?.homeworkAlert ?? false,
                        },
                    })
                }
            } catch (err) {
                console.error('[HomeworkForm] Notif settings fetch failed:', err)
            }
        }
        fetchNotifSettings()
    }, [])

    // ── Fetch credit balance ──
    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const res = await fetch('/api/credits/balance')
                const data = await res.json()
                const balance = data?.data?.balance ?? data?.balance ?? 0
                setCreditBalance(balance)
            } catch (err) {
                console.error('[HomeworkForm] Balance fetch failed:', err)
            } finally {
                setBalanceLoaded(true)
            }
        }
        fetchBalance()
    }, [])

    // ── Fetch recipient count ──
    // ✅ notifTargetRole change hone pe bhi refetch ho
    const fetchRecipientCount = useCallback(async () => {
        const needsCount =
            form.sendNotification &&
            (form.notificationChannels?.sms ||
                form.notificationChannels?.email ||
                form.notificationChannels?.whatsapp)

        if (!needsCount || !form.class) {
            setRecipientCount({
                total: 0,
                loading: false,
                channels: {
                    sms: { validContacts: 0 },
                    whatsapp: { validContacts: 0 },
                    email: { validContacts: 0 },
                },
            })
            return
        }

        setRecipientCount(prev => ({ ...prev, loading: true }))

        try {
            const params = new URLSearchParams({
                targetRole: notifTargetRole,
                academicYear: notifAcademicYear,  // ✅ Dynamic academic year
            })

            if (form.class) params.set('classes', form.class)

            const res = await fetch(`/api/notices/recipient-count?${params}`)
            const data = await res.json()

            if (data.success) {
                setRecipientCount({
                    total: data.total || 0,
                    loading: false,
                    channels: {
                        sms: {
                            validContacts:
                                data.channels?.sms?.validContacts ?? data.validContacts ?? 0,
                        },
                        whatsapp: {
                            validContacts:
                                data.channels?.whatsapp?.validContacts ?? data.validContacts ?? 0,
                        },
                        email: {
                            validContacts:
                                data.channels?.email?.validContacts ?? 0,
                        },
                    },
                })
            } else {
                setRecipientCount(prev => ({ ...prev, loading: false }))
            }
        } catch (err) {
            console.error('[HomeworkForm] Count fetch failed:', err)
            setRecipientCount(prev => ({ ...prev, loading: false }))
        }
    }, [
        form.class,
        form.sendNotification,
        form.notificationChannels?.sms,
        form.notificationChannels?.email,
        form.notificationChannels?.whatsapp,
        notifTargetRole,
        notifAcademicYear,  // ✅ dependency add kiya
    ])

    useEffect(() => {
        fetchRecipientCount()
    }, [fetchRecipientCount])

    // ── Credit breakdown ──
    const creditBreakdown = {
        sms: form.notificationChannels?.sms
            ? recipientCount.channels.sms.validContacts * CREDIT_COSTS.sms
            : 0,
        whatsapp: form.notificationChannels?.whatsapp
            ? recipientCount.channels.whatsapp.validContacts * CREDIT_COSTS.whatsapp
            : 0,
        email: form.notificationChannels?.email
            ? recipientCount.channels.email.validContacts * CREDIT_COSTS.email
            : 0,
    }

    const estimatedCredits =
        Math.round(
            (creditBreakdown.sms + creditBreakdown.whatsapp + creditBreakdown.email) * 100
        ) / 100

    const willSendMessages =
        form.sendNotification &&
        (form.notificationChannels?.sms ||
            form.notificationChannels?.email ||
            form.notificationChannels?.whatsapp)

    const hasInsufficientCredits =
        willSendMessages &&
        balanceLoaded &&
        estimatedCredits > 0 &&
        estimatedCredits > creditBalance

    // ── Field helpers ──
    const updateField = (key: keyof HomeworkFormData, value: unknown) => {
        setForm(prev => ({ ...prev, [key]: value }))
        if (errors[key as string]) setErrors(prev => ({ ...prev, [key as string]: '' }))
    }

    type NotificationChannel = keyof NonNullable<HomeworkFormData['notificationChannels']>

    const updateChannel = (channel: NotificationChannel, value: boolean) => {
        setForm(prev => ({
            ...prev,
            notificationChannels: {
                sms: false,
                whatsapp: false,
                email: false,
                push: false,
                ...prev.notificationChannels,
                [channel]: value,
            },
        }))
    }

    // ── File upload ──
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setUploading(true)
        try {
            // ✅ FIX: Explicit type from imported interface
            const uploadedFiles: HomeworkAttachment[] = []

            for (let i = 0; i < files.length; i++) {
                const file = files[i]

                if (file.size > 10 * 1024 * 1024) {
                    setErrors(prev => ({
                        ...prev,
                        attachments: `File ${file.name} exceeds 10MB limit`,
                    }))
                    continue
                }

                const formData = new FormData()
                formData.append('file', file)
                formData.append('folder', 'homework')

                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                })

                const data = await res.json()

                if (res.ok) {
                    uploadedFiles.push({
                        name: file.name,
                        url: data.url,
                        type: getFileType(file.name),
                        size: file.size,
                        uploadedAt: new Date().toISOString(), // ✅ Optional field
                    })
                } else {
                    throw new Error(data.error)
                }
            }

            setForm(prev => ({
                ...prev,
                attachments: [...prev.attachments, ...uploadedFiles],
            }))

        } catch (err) {
            const message = err instanceof Error ? err.message : 'Upload failed'
            setErrors(prev => ({
                ...prev,
                attachments: message,
            }))
        } finally {
            setUploading(false)
            e.target.value = ''
        }
    }

    const removeAttachment = (index: number) => {
        setForm(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index),
        }))
    }

    // ── Validation ──
    const validate = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (!form.title.trim()) newErrors.title = 'Title is required'
        else if (form.title.length < 3) newErrors.title = 'Title must be at least 3 characters'

        if (!form.description.trim()) newErrors.description = 'Description is required'
        else if (form.description.length < 10) newErrors.description = 'Description must be at least 10 characters'

        if (!form.subject) newErrors.subject = 'Subject is required'
        if (!form.class) newErrors.class = 'Class is required'

        if (!form.dueDate) {
            newErrors.dueDate = 'Due date is required'
        } else if (new Date(form.dueDate) <= new Date()) {
            newErrors.dueDate = 'Due date must be in the future'
        }

        if (balanceLoaded && willSendMessages && estimatedCredits > creditBalance) {
            newErrors.credits =
                `Insufficient credits. Required: ~${formatCredits(estimatedCredits)}, ` +
                `Available: ${formatCredits(creditBalance)}. Please purchase credits.`
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return
        await onSubmit({
            ...form,
            academicYear: getCurrentAcademicYear(),
            // ✅ Pass notifTargetRole to backend
            notifTargetRole,
            notifAcademicYear,  // ✅ notification ka academic year alag pass karo
        } as any)
    }

    const getChannelDisabledReason = (channel: 'sms' | 'email' | 'whatsapp'): string | null => {
        if (!notifSettings) return null
        const s = notifSettings[channel]
        if (!s.enabled) return `${channel.toUpperCase()} notifications disabled in settings`
        if (!s.homeworkAlert) return `Homework alerts disabled for ${channel.toUpperCase()} in Notification Settings`
        return null
    }

    const charCount = form.description.length

    return (
        <form onSubmit={handleSubmit} className="space-y-5 max-h-[78vh] overflow-y-auto pr-2">

            {/* ── Title ── */}
            <Input
                label="Homework Title"
                placeholder="e.g., Chapter 5 Exercise — Q1 to Q10"
                value={form.title}
                onChange={e => updateField('title', e.target.value)}
                error={errors.title}
                required
                maxLength={200}
            />

            {/* ── Description ── */}
            <div className="space-y-1">
                <label className="text-xs font-semibold font-display text-[var(--text-primary)]">
                    Instructions <span className="text-[var(--danger)]">*</span>
                </label>
                <textarea
                    className={[
                        'w-full px-3 py-2.5 text-sm rounded-[var(--radius-md)]',
                        'border-[1.5px] transition-all duration-150 resize-none font-body',
                        'bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none',
                        errors.description
                            ? 'border-[var(--danger)] shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
                            : 'border-[var(--border)] focus:border-[var(--primary-500)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]',
                    ].join(' ')}
                    rows={4}
                    placeholder="Detailed instructions for students..."
                    value={form.description}
                    onChange={e => updateField('description', e.target.value)}
                    maxLength={2000}
                />
                <div className="flex items-center justify-between">
                    {errors.description && (
                        <span className="text-xs text-[var(--danger)]">{errors.description}</span>
                    )}
                    <span className={`ml-auto text-xs ${charCount > 1800 ? 'text-[var(--warning)]' : 'text-[var(--text-muted)]'}`}>
                        {charCount}/2000
                    </span>
                </div>
            </div>

            {/* ── Subject + Class + Section ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                    label="Subject"
                    value={form.subject}
                    onChange={e => updateField('subject', e.target.value)}
                    error={errors.subject}
                    options={[
                        { value: '', label: 'Select Subject' },
                        ...SUBJECT_OPTIONS.map(s => ({ value: s, label: s })),
                    ]}
                />

                {settingsLoading ? (
                    <div className="col-span-2 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        <Loader2 size={12} className="animate-spin" />
                        Loading classes...
                    </div>
                ) : (
                    <>
                        <Select
                            label="Class"
                            value={form.class}
                            onChange={e => updateField('class', e.target.value)}
                            error={errors.class}
                            options={[
                                { value: '', label: 'Select Class' },
                                ...CLASS_OPTIONS,
                            ]}
                        />
                        <Select
                            label="Section (Optional)"
                            value={form.section || ''}
                            onChange={e => updateField('section', e.target.value)}
                            options={[
                                { value: '', label: 'All Sections' },
                                ...SECTION_OPTIONS,
                            ]}
                        />
                    </>
                )}
            </div>

            {/* ── Due Date ── */}
            <Input
                label="Due Date & Time"
                type="datetime-local"
                value={form.dueDate}
                onChange={e => updateField('dueDate', e.target.value)}
                error={errors.dueDate}
                required
            />

            {/* ── Late Submission ── */}
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-muted)] transition-colors">
                <input
                    type="checkbox"
                    checked={form.allowLateSubmission}
                    onChange={e => updateField('allowLateSubmission', e.target.checked)}
                    className="w-4 h-4 rounded accent-[var(--primary-500)]"
                />
                <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                        Allow Late Submission
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                        Students can submit after deadline (marked as late)
                    </p>
                </div>
            </label>

            {/* ── Attachments ── */}
            <div className="space-y-2">
                <label className="text-xs font-semibold font-display text-[var(--text-primary)]">
                    Attachments
                    <span className="font-normal text-[var(--text-muted)] ml-1">(optional)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer btn-secondary w-fit">
                    <Upload size={14} />
                    {uploading ? (
                        <span className="flex items-center gap-1">
                            <Loader2 size={12} className="animate-spin" />
                            Uploading...
                        </span>
                    ) : 'Upload Files'}
                    <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                    />
                </label>

                <p className="text-xs text-[var(--text-muted)]">
                    Max 10MB per file · PDF, JPG, PNG, DOCX
                </p>

                {errors.attachments && (
                    <p className="text-xs text-[var(--danger)]">{errors.attachments}</p>
                )}

                {form.attachments.length > 0 && (
                    <div className="space-y-2 mt-2">
                        {form.attachments.map((file, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between p-2 rounded-[var(--radius-sm)] bg-[var(--bg-muted)] border border-[var(--border)]"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeAttachment(i)}
                                    className="p-1 rounded text-[var(--danger)] hover:bg-[var(--danger-light)] transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Notifications (only for create) ── */}
            {!isEdit && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold font-display text-[var(--text-primary)]">
                            Notifications
                        </label>
                        {notifSettings === null && (
                            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                                <Loader2 size={10} className="animate-spin" />
                                Loading settings...
                            </span>
                        )}
                    </div>

                    {/* ✅ Notify Whom */}
                    <Select
                        label="Notify Whom"
                        value={notifTargetRole}
                        onChange={e =>
                            setNotifTargetRole(
                                e.target.value as 'all' | 'student' | 'parent'
                            )
                        }
                        options={NOTIFICATION_TARGET_OPTIONS}
                    />

                    {/* ✅ Academic Year — NoticeForm ki tarah */}
                    <Select
                        label="Academic Year"
                        value={notifAcademicYear}
                        onChange={e => setNotifAcademicYear(e.target.value)}
                        options={academicYears.map(year => ({
                            value: year,
                            label: year,
                        }))}
                    />

                    {/* ── SMS ── */}
                    {(() => {
                        const reason = getChannelDisabledReason('sms')
                        const isDisabled = !!reason
                        return (
                            <label className={[
                                'flex items-center gap-3 p-3 rounded-[var(--radius-md)]',
                                'bg-[var(--bg-subtle)] transition-colors',
                                isDisabled
                                    ? 'opacity-60 cursor-not-allowed'
                                    : 'hover:bg-[var(--bg-muted)] cursor-pointer',
                            ].join(' ')}>
                                <input
                                    type="checkbox"
                                    checked={form.notificationChannels?.sms ?? false}
                                    onChange={e => updateChannel('sms', e.target.checked)}
                                    disabled={isDisabled}
                                    className="w-4 h-4 rounded accent-[var(--primary-500)]"
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                                        📱 Send SMS Alert
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        {isDisabled
                                            ? reason
                                            : `${CREDIT_COSTS.sms} credit per recipient`
                                        }
                                        {!isDisabled && form.notificationChannels?.sms &&
                                            recipientCount.channels.sms.validContacts > 0 && (
                                                <span className="ml-2 text-[var(--primary-600)] font-medium">
                                                    ({recipientCount.channels.sms.validContacts} recipients)
                                                </span>
                                            )}
                                    </p>
                                </div>
                            </label>
                        )
                    })()}

                    {/* ── WhatsApp ── */}
                    {(() => {
                        const reason = getChannelDisabledReason('whatsapp')
                        const isDisabled = !!reason
                        return (
                            <label className={[
                                'flex items-center gap-3 p-3 rounded-[var(--radius-md)]',
                                'bg-[var(--bg-subtle)] transition-colors',
                                isDisabled
                                    ? 'opacity-60 cursor-not-allowed'
                                    : 'hover:bg-[var(--bg-muted)] cursor-pointer',
                            ].join(' ')}>
                                <input
                                    type="checkbox"
                                    checked={form.notificationChannels?.whatsapp ?? false}
                                    onChange={e => updateChannel('whatsapp', e.target.checked)}
                                    disabled={isDisabled}
                                    className="w-4 h-4 rounded accent-[var(--primary-500)]"
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                                        💬 Send WhatsApp Message
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        {isDisabled
                                            ? reason
                                            : `${CREDIT_COSTS.whatsapp} credit per recipient`
                                        }
                                        {!isDisabled && form.notificationChannels?.whatsapp &&
                                            recipientCount.channels.whatsapp.validContacts > 0 && (
                                                <span className="ml-2 text-[var(--primary-600)] font-medium">
                                                    ({recipientCount.channels.whatsapp.validContacts} recipients)
                                                </span>
                                            )}
                                    </p>
                                </div>
                            </label>
                        )
                    })()}

                    {/* ── Email ── */}
                    {(() => {
                        const reason = getChannelDisabledReason('email')
                        const isDisabled = !!reason
                        return (
                            <label className={[
                                'flex items-center gap-3 p-3 rounded-[var(--radius-md)]',
                                'bg-[var(--bg-subtle)] transition-colors',
                                isDisabled
                                    ? 'opacity-60 cursor-not-allowed'
                                    : 'hover:bg-[var(--bg-muted)] cursor-pointer',
                            ].join(' ')}>
                                <input
                                    type="checkbox"
                                    checked={form.notificationChannels?.email ?? false}
                                    onChange={e => updateChannel('email', e.target.checked)}
                                    disabled={isDisabled}
                                    className="w-4 h-4 rounded accent-[var(--primary-500)]"
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                                        📧 Send Email Notification
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        {isDisabled
                                            ? reason
                                            : `${CREDIT_COSTS.email} credit per recipient`
                                        }
                                        {!isDisabled && form.notificationChannels?.email &&
                                            recipientCount.channels.email.validContacts > 0 && (
                                                <span className="ml-2 text-[var(--primary-600)] font-medium">
                                                    ({recipientCount.channels.email.validContacts} with email)
                                                </span>
                                            )}
                                        {!isDisabled && form.notificationChannels?.email &&
                                            recipientCount.channels.email.validContacts === 0 &&
                                            !recipientCount.loading && (
                                                <span className="ml-2 text-[var(--warning)] font-medium">
                                                    ⚠️ No email addresses found
                                                </span>
                                            )}
                                    </p>
                                </div>
                            </label>
                        )
                    })()}

                    {/* ── Push ── */}
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-muted)] transition-colors">
                        <input
                            type="checkbox"
                            checked={form.notificationChannels?.push ?? true}
                            onChange={e => updateChannel('push', e.target.checked)}
                            className="w-4 h-4 rounded accent-[var(--primary-500)]"
                        />
                        <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                                🔔 Send Push Notification
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                                Free — instant in-app notification
                            </p>
                        </div>
                    </label>

                    {/* ── Recipient Count Row ── */}
                    {willSendMessages && form.class && (
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-md)] bg-[var(--bg-muted)] border border-[var(--border)]">
                            <Users size={14} className="text-[var(--text-muted)] flex-shrink-0" />
                            {recipientCount.loading ? (
                                <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                                    <Loader2 size={12} className="animate-spin" />
                                    Counting recipients...
                                </span>
                            ) : (
                                <div className="flex items-center gap-3 flex-wrap text-xs flex-1">
                                    {/* ✅ Academic year bhi dikhao — clarity ke liye */}
                                    <span className="text-[var(--text-muted)] text-[10px] w-full mb-0.5">
                                        {notifAcademicYear} •{' '}
                                        {notifTargetRole === 'all'
                                            ? 'Students + Parents'
                                            : notifTargetRole === 'student'
                                                ? 'Students Only'
                                                : 'Parents Only'
                                        }
                                    </span>

                                    {form.notificationChannels?.sms && (
                                        <span className="text-[var(--text-secondary)]">
                                            📱{' '}
                                            <span className="font-semibold text-[var(--primary-600)]">
                                                {recipientCount.channels.sms.validContacts}
                                            </span>{' '}
                                            SMS
                                        </span>
                                    )}
                                    {form.notificationChannels?.whatsapp && (
                                        <span className="text-[var(--text-secondary)]">
                                            💬{' '}
                                            <span className="font-semibold text-[var(--primary-600)]">
                                                {recipientCount.channels.whatsapp.validContacts}
                                            </span>{' '}
                                            WhatsApp
                                        </span>
                                    )}
                                    {form.notificationChannels?.email && (
                                        <span className="text-[var(--text-secondary)]">
                                            📧{' '}
                                            <span className="font-semibold text-[var(--primary-600)]">
                                                {recipientCount.channels.email.validContacts}
                                            </span>{' '}
                                            Email
                                        </span>
                                    )}
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={fetchRecipientCount}
                                className="ml-auto text-[var(--text-muted)] hover:text-[var(--primary-500)] transition-colors"
                                title="Refresh"
                            >
                                <RefreshCw size={12} />
                            </button>
                        </div>
                    )}

                    {/* ── Credit Estimate ── */}
                    {willSendMessages && estimatedCredits > 0 && (
                        <div className={[
                            'p-3 rounded-[var(--radius-md)] text-xs border',
                            hasInsufficientCredits
                                ? 'bg-[var(--danger-light)] border-[rgba(239,68,68,0.3)]'
                                : 'bg-[var(--info-light)] border-[rgba(59,130,246,0.2)]',
                        ].join(' ')}>
                            <div className="flex items-start gap-2">
                                <Info size={14} className="flex-shrink-0 mt-0.5" />
                                <div className="flex-1 space-y-1">
                                    <p className="font-semibold">
                                        Estimated Cost:{' '}
                                        <span className="font-bold">
                                            ~{formatCredits(estimatedCredits)} credits
                                        </span>
                                    </p>
                                    <div className="text-[10px] opacity-80 space-y-0.5">
                                        {form.notificationChannels?.sms &&
                                            recipientCount.channels.sms.validContacts > 0 && (
                                                <p>
                                                    SMS: {recipientCount.channels.sms.validContacts} ×{' '}
                                                    {CREDIT_COSTS.sms} = {formatCredits(creditBreakdown.sms)} CR
                                                </p>
                                            )}
                                        {form.notificationChannels?.whatsapp &&
                                            recipientCount.channels.whatsapp.validContacts > 0 && (
                                                <p>
                                                    WhatsApp: {recipientCount.channels.whatsapp.validContacts} ×{' '}
                                                    {CREDIT_COSTS.whatsapp} = {formatCredits(creditBreakdown.whatsapp)} CR
                                                </p>
                                            )}
                                        {form.notificationChannels?.email &&
                                            recipientCount.channels.email.validContacts > 0 && (
                                                <p>
                                                    Email: {recipientCount.channels.email.validContacts} ×{' '}
                                                    {CREDIT_COSTS.email} = {formatCredits(creditBreakdown.email)} CR
                                                </p>
                                            )}
                                    </div>
                                    <p className="mt-1">
                                        Available Balance:{' '}
                                        <span className={`font-semibold ${hasInsufficientCredits
                                            ? 'text-[var(--danger-dark)]'
                                            : 'text-[var(--success-dark)]'
                                            }`}>
                                            {formatCredits(creditBalance)} credits
                                        </span>
                                    </p>
                                    {hasInsufficientCredits && (
                                        <p className="font-semibold text-[var(--danger-dark)] mt-1">
                                            ⚠️ Need {formatCredits(estimatedCredits - creditBalance)} more credits.{' '}
                                            <a href="/admin/subscription" className="underline">
                                                Purchase credits →
                                            </a>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {errors.credits && <Alert type="error" message={errors.credits} />}
                </div>
            )}

            {/* ── Footer ── */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)] sticky bottom-0 bg-[var(--bg-card)] pb-1">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    loading={isLoading}
                    disabled={isLoading || hasInsufficientCredits}
                >
                    {isEdit ? 'Update Homework' : 'Create Homework'}
                </Button>
            </div>
        </form>
    )
}