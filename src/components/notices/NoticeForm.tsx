// FILE: src/components/notices/NoticeForm.tsx
// FIXED:
//   Bug 1 → RecipientCount per-channel use karo
//   Bug 2 → estimatedCredits channel-specific count se calculate ho
//   Bug 3 → Nursery, LKG, UKG added
//   Bug 4 → Balance fetch (data.data.balance ?? data.balance)
//   Backward compatible — form submit same hai

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input, Select, Button, Alert } from '@/components/ui'
import { Loader2, Users, RefreshCw, Info } from 'lucide-react'
import { getAcademicYears, getCurrentAcademicYear } from '@/lib/academicYear'
import { CREDIT_COSTS } from '@/config/pricing'
import type { NoticeFormData, NoticeDetail } from '@/types/notice'

interface NoticeFormProps {
  initialData?: NoticeDetail
  onSubmit:     (data: NoticeFormData) => Promise<void>
  onCancel:     () => void
  isLoading?:   boolean
}

// ✅ Bug 3 Fix: Nursery, LKG, UKG added
const CLASS_OPTIONS = [
  { value: 'Nursery', label: 'Nursery'  },
  { value: 'LKG',     label: 'LKG'      },
  { value: 'UKG',     label: 'UKG'      },
  { value: '1',       label: 'Class 1'  },
  { value: '2',       label: 'Class 2'  },
  { value: '3',       label: 'Class 3'  },
  { value: '4',       label: 'Class 4'  },
  { value: '5',       label: 'Class 5'  },
  { value: '6',       label: 'Class 6'  },
  { value: '7',       label: 'Class 7'  },
  { value: '8',       label: 'Class 8'  },
  { value: '9',       label: 'Class 9'  },
  { value: '10',      label: 'Class 10' },
  { value: '11',      label: 'Class 11' },
  { value: '12',      label: 'Class 12' },
]

// ✅ Bug 1 Fix: Per-channel counts store karo
interface ChannelCount {
  validContacts: number
}

interface RecipientCount {
  total:    number
  loading:  boolean
  // Per channel
  channels: {
    sms:      ChannelCount
    whatsapp: ChannelCount
    email:    ChannelCount
  }
}

function formatCredits(value: number): string {
  if (Number.isInteger(value)) return value.toLocaleString('en-IN')
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function NoticeForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: NoticeFormProps) {
  const [form, setForm] = useState<NoticeFormData>({
    title:         initialData?.title         || '',
    content:       initialData?.content       || '',
    status:        initialData?.status        || 'published',
    targetRole:    initialData?.targetRole    || 'all',
    targetClasses: initialData?.targetClasses || [],
    priority:      initialData?.priority      || 'normal',
    expiresAt:     initialData?.expiresAt     || '',
    isPinned:      initialData?.isPinned      || false,
    sendSms:       false,
    sendWhatsApp:  false,
    sendEmail:     false,
    sendPush:      true,
  })

  const [errors, setErrors]             = useState<Record<string, string>>({})
  const [academicYear, setAcademicYear] = useState(getCurrentAcademicYear())
  const academicYears                   = getAcademicYears()

  // ✅ Bug 1 Fix: Per-channel recipient count
  const [recipientCount, setRecipientCount] = useState<RecipientCount>({
    total:   0,
    loading: false,
    channels: {
      sms:      { validContacts: 0 },
      whatsapp: { validContacts: 0 },
      email:    { validContacts: 0 },
    },
  })

  // ✅ Bug 4 Fix: Balance fetch with nested structure support
  const [creditBalance, setCreditBalance] = useState(0)
  const [balanceLoaded, setBalanceLoaded] = useState(false)

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res  = await fetch('/api/credits/balance')
        const data = await res.json()
        // Handle: { success, data: { balance } } OR { balance }
        const balance = data?.data?.balance ?? data?.balance ?? 0
        setCreditBalance(balance)
      } catch (err) {
        console.error('[NoticeForm] Balance fetch failed:', err)
      } finally {
        setBalanceLoaded(true)
      }
    }
    fetchBalance()
  }, [])

  const isEdit = !!initialData

  // ✅ Bug 1 Fix: Fetch per-channel counts from API
  const fetchRecipientCount = useCallback(async () => {
    const needsCount =
      form.sendSms || form.sendEmail || form.sendWhatsApp

    if (!needsCount) {
      setRecipientCount({
        total:   0,
        loading: false,
        channels: {
          sms:      { validContacts: 0 },
          whatsapp: { validContacts: 0 },
          email:    { validContacts: 0 },
        },
      })
      return
    }

    setRecipientCount(prev => ({ ...prev, loading: true }))

    try {
      const params = new URLSearchParams({
        targetRole: form.targetRole,
        academicYear,
      })

      if (form.targetClasses.length > 0) {
        params.set('classes', form.targetClasses.join(','))
      }

      const res  = await fetch(`/api/notices/recipient-count?${params}`)
      const data = await res.json()

      if (data.success) {
        setRecipientCount({
          total:   data.total || 0,
          loading: false,
          // ✅ Use per-channel data from API
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
              // ✅ Bug Fix: Email ka alag count — sirf jinke paas email hai
              validContacts:
                data.channels?.email?.validContacts ?? 0,
            },
          },
        })
      } else {
        setRecipientCount(prev => ({ ...prev, loading: false }))
      }
    } catch (err) {
      console.error('[NoticeForm] Count fetch failed:', err)
      setRecipientCount(prev => ({ ...prev, loading: false }))
    }
  }, [
    form.targetRole,
    form.targetClasses,
    academicYear,
    form.sendSms,
    form.sendEmail,
    form.sendWhatsApp,
  ])

  useEffect(() => {
    fetchRecipientCount()
  }, [fetchRecipientCount])

  // ✅ Bug 2 Fix: Per-channel credit estimate
  // Sirf selected channels ka cost calculate karo
  // Sirf un logon ka jo us channel pe valid hain
  const creditBreakdown = {
    sms: form.sendSms
      ? recipientCount.channels.sms.validContacts * CREDIT_COSTS.sms
      : 0,
    whatsapp: form.sendWhatsApp
      ? recipientCount.channels.whatsapp.validContacts * CREDIT_COSTS.whatsapp
      : 0,
    email: form.sendEmail
      ? recipientCount.channels.email.validContacts * CREDIT_COSTS.email
      : 0,
  }

  const estimatedCredits =
    Math.round(
      (creditBreakdown.sms + creditBreakdown.whatsapp + creditBreakdown.email)
      * 100
    ) / 100

  // Total valid recipients across selected channels (unique estimate)
  const totalValidRecipients = Math.max(
    form.sendSms      ? recipientCount.channels.sms.validContacts      : 0,
    form.sendWhatsApp ? recipientCount.channels.whatsapp.validContacts : 0,
    form.sendEmail    ? recipientCount.channels.email.validContacts    : 0,
  )

  const willSendMessages =
    form.status === 'published' &&
    (form.sendSms || form.sendEmail || form.sendWhatsApp)

  const hasInsufficientCredits =
    willSendMessages        &&
    balanceLoaded           &&
    totalValidRecipients > 0 &&
    estimatedCredits > 0    &&
    estimatedCredits > creditBalance

  // ── Field helpers ──────────────────────────────────────
  const updateField = (key: keyof NoticeFormData, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }))
  }

  const toggleClass = (className: string) => {
    setForm(prev => ({
      ...prev,
      targetClasses: prev.targetClasses.includes(className)
        ? prev.targetClasses.filter(c => c !== className)
        : [...prev.targetClasses, className],
    }))
  }

  // ── Validation ──────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!form.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (form.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters'
    } else if (form.title.length > 200) {
      newErrors.title = 'Title is too long (max 200 characters)'
    }

    if (!form.content.trim()) {
      newErrors.content = 'Content is required'
    } else if (form.content.length < 10) {
      newErrors.content = 'Content must be at least 10 characters'
    } else if (form.content.length > 5000) {
      newErrors.content = 'Content is too long (max 5000 characters)'
    }

    if (form.expiresAt) {
      const expiryDate = new Date(form.expiresAt)
      if (isNaN(expiryDate.getTime())) {
        newErrors.expiresAt = 'Invalid date format'
      } else if (expiryDate <= new Date()) {
        newErrors.expiresAt = 'Expiry date must be in the future'
      }
    }

    // ✅ Credit check — per-channel accurate
    if (
      balanceLoaded          &&
      willSendMessages       &&
      totalValidRecipients > 0 &&
      estimatedCredits > 0   &&
      estimatedCredits > creditBalance
    ) {
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
    await onSubmit({ ...form, academicYear } as any)
  }

  const charCount   = form.content.length
  const charLimit   = 5000
  const charWarning = charCount > charLimit * 0.9

  // ── Render ─────────────────────────────────────────────
  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 max-h-[80vh] overflow-y-auto pr-2"
    >
      {/* Title */}
      <Input
        label="Notice Title"
        placeholder="e.g., School Holiday Announcement"
        value={form.title}
        onChange={e => updateField('title', e.target.value)}
        error={errors.title}
        required
        maxLength={200}
      />

      {/* Content */}
      <div className="space-y-1">
        <label className="text-xs font-semibold font-display text-[var(--text-primary)]">
          Notice Content{' '}
          <span className="text-[var(--danger)]">*</span>
        </label>
        <textarea
          className={[
            'w-full px-3 py-2.5 text-sm rounded-[var(--radius-md)]',
            'border-[1.5px] transition-all duration-150 resize-none font-body',
            'bg-[var(--bg-card)] text-[var(--text-primary)]',
            'focus:outline-none',
            errors.content
              ? 'border-[var(--danger)] shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
              : 'border-[var(--border)] focus:border-[var(--primary-500)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]',
          ].join(' ')}
          rows={6}
          placeholder="Write the notice content here..."
          value={form.content}
          onChange={e => updateField('content', e.target.value)}
          maxLength={charLimit}
        />
        <div className="flex items-center justify-between text-xs">
          {errors.content && (
            <span className="text-[var(--danger)]">{errors.content}</span>
          )}
          <span
            className={`ml-auto ${
              charWarning
                ? 'text-[var(--warning)]'
                : 'text-[var(--text-muted)]'
            }`}
          >
            {charCount} / {charLimit}
          </span>
        </div>
      </div>

      {/* Target / Priority / Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select
          label="Send To"
          value={form.targetRole}
          onChange={e => updateField('targetRole', e.target.value)}
          options={[
            { value: 'all',     label: 'Everyone'      },
            { value: 'student', label: 'Students Only' },
            { value: 'teacher', label: 'Teachers Only' },
            { value: 'parent',  label: 'Parents Only'  },
            { value: 'staff',   label: 'Staff Only'    },
          ]}
        />

        <Select
          label="Priority"
          value={form.priority}
          onChange={e => updateField('priority', e.target.value)}
          options={[
            { value: 'low',    label: 'Low'       },
            { value: 'normal', label: 'Normal'    },
            { value: 'high',   label: 'High'      },
            { value: 'urgent', label: '🚨 Urgent' },
          ]}
        />

        <Select
          label="Status"
          value={form.status}
          onChange={e => updateField('status', e.target.value)}
          options={[
            { value: 'draft',     label: 'Save as Draft' },
            { value: 'published', label: 'Publish Now'   },
          ]}
        />
      </div>

      {/* Academic Year */}
      {(
        form.targetRole === 'student' ||
        form.targetRole === 'parent'  ||
        form.targetRole === 'all'
      ) && (
        <Select
          label="Academic Year"
          value={academicYear}
          onChange={e => setAcademicYear(e.target.value)}
          options={academicYears.map(year => ({
            value: year,
            label: year,
          }))}
        />
      )}

      {/* Target Classes */}
      {(form.targetRole === 'student' || form.targetRole === 'parent') && (
        <div className="space-y-2">
          <label className="text-xs font-semibold font-display text-[var(--text-primary)]">
            Target Classes{' '}
            <span className="font-normal text-[var(--text-muted)]">
              (optional — leave empty for all)
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            {CLASS_OPTIONS.map(cls => (
              <button
                key={cls.value}
                type="button"
                onClick={() => toggleClass(cls.value)}
                className={[
                  'px-3 py-1.5 text-xs font-medium rounded-[var(--radius-md)]',
                  'transition-all duration-150 border-[1.5px]',
                  form.targetClasses.includes(cls.value)
                    ? 'bg-[var(--primary-50)] text-[var(--primary-600)] border-[var(--primary-300)]'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-strong)]',
                ].join(' ')}
              >
                {cls.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Expiry Date */}
      <Input
        label="Expiry Date (optional)"
        type="datetime-local"
        value={form.expiresAt}
        onChange={e => updateField('expiresAt', e.target.value)}
        error={errors.expiresAt}
        helper="Notice will be hidden after this date"
      />

      {/* Checkboxes */}
      <div className="space-y-3">
        {/* Pin */}
        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-muted)] transition-colors">
          <input
            type="checkbox"
            checked={form.isPinned}
            onChange={e => updateField('isPinned', e.target.checked)}
            className="w-4 h-4 rounded accent-[var(--primary-500)]"
          />
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              📌 Pin this notice
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Keep it at the top of the list
            </p>
          </div>
        </label>

        {/* Notification options */}
        {form.status === 'published' && (
          <>
            {/* SMS */}
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-muted)] transition-colors">
              <input
                type="checkbox"
                checked={form.sendSms}
                onChange={e => updateField('sendSms', e.target.checked)}
                className="w-4 h-4 rounded accent-[var(--primary-500)]"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  📱 Send SMS Alert
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {CREDIT_COSTS.sms} credit per recipient
                  {form.sendSms && recipientCount.channels.sms.validContacts > 0 && (
                    <span className="ml-2 text-[var(--primary-600)] font-medium">
                      ({recipientCount.channels.sms.validContacts} recipients)
                    </span>
                  )}
                </p>
              </div>
            </label>

            {/* WhatsApp */}
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-muted)] transition-colors">
              <input
                type="checkbox"
                checked={form.sendWhatsApp}
                onChange={e => updateField('sendWhatsApp', e.target.checked)}
                className="w-4 h-4 rounded accent-[var(--primary-500)]"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  💬 Send WhatsApp Message
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {CREDIT_COSTS.whatsapp} credit per recipient
                  {form.sendWhatsApp && recipientCount.channels.whatsapp.validContacts > 0 && (
                    <span className="ml-2 text-[var(--primary-600)] font-medium">
                      ({recipientCount.channels.whatsapp.validContacts} recipients)
                    </span>
                  )}
                </p>
              </div>
            </label>

            {/* Email */}
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-muted)] transition-colors">
              <input
                type="checkbox"
                checked={form.sendEmail}
                onChange={e => updateField('sendEmail', e.target.checked)}
                className="w-4 h-4 rounded accent-[var(--primary-500)]"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  📧 Send Email
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {CREDIT_COSTS.email} credit per recipient
                  {/* ✅ Email ka alag count dikhao */}
                  {form.sendEmail && recipientCount.channels.email.validContacts > 0 && (
                    <span className="ml-2 text-[var(--primary-600)] font-medium">
                      ({recipientCount.channels.email.validContacts} with email)
                    </span>
                  )}
                  {form.sendEmail && recipientCount.channels.email.validContacts === 0 && !recipientCount.loading && (
                    <span className="ml-2 text-[var(--warning)] font-medium">
                      ⚠️ No email addresses found
                    </span>
                  )}
                </p>
              </div>
            </label>

            {/* Push */}
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-muted)] transition-colors">
              <input
                type="checkbox"
                checked={form.sendPush}
                onChange={e => updateField('sendPush', e.target.checked)}
                className="w-4 h-4 rounded accent-[var(--primary-500)]"
              />
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  🔔 Send Push Notification
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Free — instant notification on mobile app
                </p>
              </div>
            </label>
          </>
        )}
      </div>

      {/* Recipient Count + Credit Estimate */}
      {willSendMessages && (
        <div className="space-y-3">
          {/* Count row */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-md)] bg-[var(--bg-muted)] border border-[var(--border)]">
            <Users size={14} className="text-[var(--text-muted)] flex-shrink-0" />
            {recipientCount.loading ? (
              <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                <Loader2 size={12} className="animate-spin" />
                Counting recipients...
              </span>
            ) : (
              <div className="flex items-center gap-3 flex-wrap text-xs flex-1">
                {/* ✅ Per-channel counts */}
                {form.sendSms && (
                  <span className="text-[var(--text-secondary)]">
                    📱{' '}
                    <span className="font-semibold text-[var(--primary-600)]">
                      {recipientCount.channels.sms.validContacts.toLocaleString('en-IN')}
                    </span>{' '}
                    SMS
                  </span>
                )}
                {form.sendWhatsApp && (
                  <span className="text-[var(--text-secondary)]">
                    💬{' '}
                    <span className="font-semibold text-[var(--primary-600)]">
                      {recipientCount.channels.whatsapp.validContacts.toLocaleString('en-IN')}
                    </span>{' '}
                    WhatsApp
                  </span>
                )}
                {form.sendEmail && (
                  <span className="text-[var(--text-secondary)]">
                    📧{' '}
                    <span className="font-semibold text-[var(--primary-600)]">
                      {recipientCount.channels.email.validContacts.toLocaleString('en-IN')}
                    </span>{' '}
                    Email
                  </span>
                )}
                {/* Missing contacts warning */}
                {form.sendEmail &&
                  recipientCount.channels.email.validContacts <
                    recipientCount.total && (
                  <span className="text-[var(--warning-dark)]">
                    ⚠️{' '}
                    {(
                      recipientCount.total -
                      recipientCount.channels.email.validContacts
                    ).toLocaleString('en-IN')}{' '}
                    without email
                  </span>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={fetchRecipientCount}
              className="ml-auto text-[var(--text-muted)] hover:text-[var(--primary-500)] transition-colors"
              title="Refresh count"
            >
              <RefreshCw size={12} />
            </button>
          </div>

          {/* Credit estimate */}
          {estimatedCredits > 0 && (
            <div
              className={[
                'p-3 rounded-[var(--radius-md)] text-xs border',
                hasInsufficientCredits
                  ? 'bg-[var(--danger-light)] border-[rgba(239,68,68,0.3)]'
                  : 'bg-[var(--info-light)] border-[rgba(59,130,246,0.2)]',
              ].join(' ')}
            >
              <div className="flex items-start gap-2">
                <Info size={14} className="flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="font-semibold">
                    Estimated Cost:{' '}
                    <span className="font-bold">
                      ~{formatCredits(estimatedCredits)} credits
                    </span>
                  </p>

                  {/* ✅ Per-channel breakdown */}
                  <div className="text-[10px] opacity-80 space-y-0.5">
                    {form.sendSms && recipientCount.channels.sms.validContacts > 0 && (
                      <p>
                        SMS: {recipientCount.channels.sms.validContacts} ×{' '}
                        {CREDIT_COSTS.sms} ={' '}
                        {formatCredits(creditBreakdown.sms)} CR
                      </p>
                    )}
                    {form.sendWhatsApp && recipientCount.channels.whatsapp.validContacts > 0 && (
                      <p>
                        WhatsApp: {recipientCount.channels.whatsapp.validContacts} ×{' '}
                        {CREDIT_COSTS.whatsapp} ={' '}
                        {formatCredits(creditBreakdown.whatsapp)} CR
                      </p>
                    )}
                    {form.sendEmail && recipientCount.channels.email.validContacts > 0 && (
                      <p>
                        Email: {recipientCount.channels.email.validContacts} ×{' '}
                        {CREDIT_COSTS.email} ={' '}
                        {formatCredits(creditBreakdown.email)} CR
                      </p>
                    )}
                    {form.sendEmail && recipientCount.channels.email.validContacts === 0 && (
                      <p className="text-[var(--warning)]">
                        ⚠️ Email: 0 valid email addresses found — no credits will be used
                      </p>
                    )}
                  </div>

                  <p className="mt-1">
                    Available Balance:{' '}
                    <span
                      className={`font-semibold ${
                        hasInsufficientCredits
                          ? 'text-[var(--danger-dark)]'
                          : 'text-[var(--success-dark)]'
                      }`}
                    >
                      {formatCredits(creditBalance)} credits
                    </span>
                  </p>

                  {hasInsufficientCredits && (
                    <p className="font-semibold text-[var(--danger-dark)] mt-1">
                      ⚠️ Need{' '}
                      {formatCredits(estimatedCredits - creditBalance)} more
                      credits.{' '}
                      <a
                        href="/admin/subscription"
                        className="underline"
                      >
                        Purchase credits →
                      </a>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {errors.credits && (
            <Alert type="error" message={errors.credits} />
          )}
        </div>
      )}

      {/* Footer */}
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
          {isEdit
            ? 'Update Notice'
            : form.status === 'draft'
            ? 'Save Draft'
            : 'Publish Notice'}
        </Button>
      </div>
    </form>
  )
}