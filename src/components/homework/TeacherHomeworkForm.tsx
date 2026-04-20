// FILE: src/components/homework/TeacherHomeworkForm.tsx
// ✅ FIXED: Class value normalization + Academic year sync
// ✅ Teacher-scoped homework form with Credit System for Messaging

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input, Select, Button, Alert } from '@/components/ui'
import { Upload, X, Loader2, Users, RefreshCw, Info } from 'lucide-react'
import { useAcademicSettings } from '@/hooks/useAcademicSettings'
import { getAcademicYears, getCurrentAcademicYear } from '@/lib/academicYear'
import { CREDIT_COSTS } from '@/config/pricing'
import type {
  HomeworkFormData,
  HomeworkDetail,
  HomeworkAttachment,
} from '@/types/homework'

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

interface TeacherHomeworkFormProps {
  initialData?: HomeworkDetail
  onSubmit: (data: HomeworkFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  allowedClasses: string[]
  allowedSections: string[]
  allowedSubjects: string[]
}

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

type NotifTargetRole = 'all' | 'student' | 'parent'

type HomeworkFormPayload = HomeworkFormData & {
  notifTargetRole: NonNullable<HomeworkFormData['notifTargetRole']>
  academicYear: string
  notifAcademicYear?: string
}

type NotificationChannel = keyof NonNullable<HomeworkFormData['notificationChannels']>

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function getFileType(filename: string): 'pdf' | 'image' | 'doc' | 'other' {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'pdf'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext ?? '')) return 'image'
  if (['doc', 'docx'].includes(ext ?? '')) return 'doc'
  return 'other'
}

function formatCredits(value: number): string {
  if (Number.isInteger(value)) return value.toLocaleString('en-IN')
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function safeAcademicYear(value: string | null | undefined): string {
  return value || getCurrentAcademicYear()
}

// ✅ Normalize class value - removes "Class " prefix and stream info
function normalizeClassValue(classValue: string): string {
  if (!classValue) return ''
  
  // Remove "Class " prefix (case insensitive)
  let normalized = classValue.replace(/^Class\s+/i, '')
  
  // Remove stream/specialization in parentheses: "12 (Science)" → "12"
  normalized = normalized.replace(/\s*\([^)]*\)\s*/g, '')
  
  // Trim whitespace
  normalized = normalized.trim()
  
  console.log('[NORMALIZE CLASS]', { original: classValue, normalized })
  
  return normalized
}

// ✅ Format class for display - "12" → "Class 12"
function formatClassDisplay(classValue: string): string {
  const normalized = normalizeClassValue(classValue)
  return normalized ? `Class ${normalized}` : classValue
}

const NOTIFICATION_TARGET_OPTIONS = [
  { value: 'all', label: 'Students + Parents (Both)' },
  { value: 'student', label: 'Students Only' },
  { value: 'parent', label: 'Parents Only' },
]

const EMPTY_RECIPIENT_COUNT: RecipientCount = {
  total: 0,
  loading: false,
  channels: {
    sms: { validContacts: 0 },
    whatsapp: { validContacts: 0 },
    email: { validContacts: 0 },
  },
}

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────

export function TeacherHomeworkForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  allowedClasses,
  allowedSections,
  allowedSubjects,
}: TeacherHomeworkFormProps) {
  const { settings: academicSettings } = useAcademicSettings()

  const isEdit = !!initialData
  const academicYears = getAcademicYears()

  // ✅ Notification target role
  const [notifTargetRole, setNotifTargetRole] = useState<NotifTargetRole>('all')

  // ✅ Get initial academic year
  const getInitialAcademicYear = () => {
    if (initialData?.academicYear) return initialData.academicYear
    if (academicSettings?.currentAcademicYear) return academicSettings.currentAcademicYear
    return getCurrentAcademicYear()
  }

  // ✅ Normalize allowed classes on mount
  const normalizedAllowedClasses = allowedClasses.map(normalizeClassValue)

  console.log('[TEACHER FORM] Allowed Classes:', {
    original: allowedClasses,
    normalized: normalizedAllowedClasses,
  })

  // ✅ Form state with proper academic year initialization
  const [form, setForm] = useState<HomeworkFormData>({
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    subject: initialData?.subject ?? allowedSubjects[0] ?? '',
    class: initialData?.class 
      ? normalizeClassValue(initialData.class)
      : normalizedAllowedClasses[0] ?? '',
    section: initialData?.section ?? '',
    targetStudents: initialData?.targetStudents ?? [],
    dueDate: initialData?.dueDate
      ? new Date(initialData.dueDate).toISOString().slice(0, 16)
      : '',
    allowLateSubmission: initialData?.allowLateSubmission ?? true,
    attachments: initialData?.attachments ?? [],
    sendNotification: true,
    notificationChannels: {
      sms: false,
      whatsapp: false,
      email: false,
      push: true,
    },
    academicYear: getInitialAcademicYear(),
  })

  // ✅ Separate academic year for notifications
  const [notifAcademicYear, setNotifAcademicYear] = useState(getInitialAcademicYear())

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [creditBalance, setCreditBalance] = useState(0)
  const [balanceLoaded, setBalanceLoaded] = useState(false)
  const [recipientCount, setRecipientCount] = useState<RecipientCount>(EMPTY_RECIPIENT_COUNT)

  const [notifSettings, setNotifSettings] = useState<{
    sms: { enabled: boolean; homeworkAlert: boolean }
    email: { enabled: boolean; homeworkAlert: boolean }
    whatsapp: { enabled: boolean; homeworkAlert: boolean }
  } | null>(null)

  // ────────────────────────────────────────────────────────
  // Effects
  // ────────────────────────────────────────────────────────

  // ✅ Sync academic years when settings load
  useEffect(() => {
    if (academicSettings?.currentAcademicYear) {
      const currentYear = academicSettings.currentAcademicYear
      
      // Only update if not in edit mode
      if (!isEdit) {
        setForm(f => ({
          ...f,
          academicYear: currentYear,
        }))
      }
      
      // Always update notification year to current
      setNotifAcademicYear(currentYear)
    }
  }, [academicSettings?.currentAcademicYear, isEdit])

  // Auto-select first class/subject when only one option
  useEffect(() => {
    setForm(f => {
      const patch: Partial<HomeworkFormData> = {}
      if (normalizedAllowedClasses.length === 1 && !f.class) {
        patch.class = normalizedAllowedClasses[0]
      }
      if (allowedSubjects.length === 1 && !f.subject) {
        patch.subject = allowedSubjects[0]
      }
      return Object.keys(patch).length ? { ...f, ...patch } : f
    })
  }, [normalizedAllowedClasses, allowedSubjects])

  // Fetch notification settings
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
        console.error('[TeacherHomeworkForm] Notif settings fetch failed:', err)
      }
    }
    fetchNotifSettings()
  }, [])

  // Fetch credit balance
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await fetch('/api/credits/balance')
        const data = await res.json()
        setCreditBalance(data?.data?.balance ?? data?.balance ?? 0)
      } catch (err) {
        console.error('[TeacherHomeworkForm] Balance fetch failed:', err)
      } finally {
        setBalanceLoaded(true)
      }
    }
    fetchBalance()
  }, [])

  // ✅ FIXED: Fetch recipient count with proper types
  const fetchRecipientCount = useCallback(async () => {
    const needsCount =
      form.sendNotification &&
      (form.notificationChannels?.sms ||
        form.notificationChannels?.email ||
        form.notificationChannels?.whatsapp)

    if (!needsCount || !form.class) {
      setRecipientCount(EMPTY_RECIPIENT_COUNT)
      return
    }

    setRecipientCount(prev => ({ ...prev, loading: true }))

    try {
      // ✅ Build params object with guaranteed string values
      const paramsObject: Record<string, string> = {
        targetRole: notifTargetRole,
        academicYear: form.academicYear || getCurrentAcademicYear(),
        classes: form.class, // Already normalized
      }

      // ✅ Conditionally add section
      if (form.section && form.section.trim() !== '') {
        paramsObject.sections = form.section
      }

      const params = new URLSearchParams(paramsObject)

      console.log('[RECIPIENT COUNT] Query:', paramsObject)

      const res = await fetch(`/api/notices/recipient-count?${params.toString()}`)
      const data = await res.json()

      console.log('[RECIPIENT COUNT] Response:', data)

      if (data.success) {
        setRecipientCount({
          total: data.total ?? 0,
          loading: false,
          channels: {
            sms: { validContacts: data.channels?.sms?.validContacts ?? data.validContacts ?? 0 },
            whatsapp: { validContacts: data.channels?.whatsapp?.validContacts ?? data.validContacts ?? 0 },
            email: { validContacts: data.channels?.email?.validContacts ?? 0 },
          },
        })
      } else {
        setRecipientCount(prev => ({ ...prev, loading: false }))
      }
    } catch (err) {
      console.error('[TeacherHomeworkForm] Count fetch failed:', err)
      setRecipientCount(prev => ({ ...prev, loading: false }))
    }
  }, [
    form.class,
    form.section,
    form.academicYear,
    form.sendNotification,
    form.notificationChannels?.sms,
    form.notificationChannels?.email,
    form.notificationChannels?.whatsapp,
    notifTargetRole,
  ])

  useEffect(() => {
    fetchRecipientCount()
  }, [fetchRecipientCount])

  // ────────────────────────────────────────────────────────
  // Derived values
  // ────────────────────────────────────────────────────────

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
    Math.round((creditBreakdown.sms + creditBreakdown.whatsapp + creditBreakdown.email) * 100) / 100

  const willSendMessages =
    form.sendNotification &&
    (form.notificationChannels?.sms ||
      form.notificationChannels?.email ||
      form.notificationChannels?.whatsapp)

  const hasInsufficientCredits =
    willSendMessages && balanceLoaded && estimatedCredits > 0 && estimatedCredits > creditBalance

  // ────────────────────────────────────────────────────────
  // Handlers
  // ────────────────────────────────────────────────────────

  const updateField = <K extends keyof HomeworkFormData>(key: K, value: HomeworkFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => {
      if (!prev[key as string]) return prev
      const next = { ...prev }
      delete next[key as string]
      return next
    })
  }

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const uploaded: HomeworkAttachment[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        if (file.size > 10 * 1024 * 1024) {
          setErrors(prev => ({
            ...prev,
            attachments: `${file.name} exceeds 10MB limit`,
          }))
          continue
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'homework')

        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const data = await res.json()

        if (res.ok) {
          uploaded.push({
            name: file.name,
            url: data.url,
            type: getFileType(file.name),
            size: file.size,
            uploadedAt: new Date().toISOString(),
          })
        } else {
          throw new Error((data.error as string | undefined) ?? 'Upload failed')
        }
      }

      setForm(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...uploaded],
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setErrors(prev => ({ ...prev, attachments: message }))
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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!form.title.trim()) newErrors.title = 'Title is required'
    else if (form.title.length < 3) newErrors.title = 'Title must be at least 3 characters'

    if (!form.description.trim()) newErrors.description = 'Instructions are required'
    else if (form.description.length < 10)
      newErrors.description = 'Instructions must be at least 10 characters'

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
        `Available: ${formatCredits(creditBalance)}. Please contact admin.`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ✅ FIXED: Submit handler with normalized class value
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    // ✅ Ensure academic year is properly set
    const finalAcademicYear = form.academicYear || 
                              academicSettings?.currentAcademicYear || 
                              getCurrentAcademicYear()

    console.log('[HOMEWORK SUBMIT] Final Data:', {
      academicYear: finalAcademicYear,
      class: form.class, // Already normalized
      section: form.section || 'All Sections',
      subject: form.subject,
      notifTargetRole: notifTargetRole,
      sendNotification: form.sendNotification,
    })

    const payload: HomeworkFormPayload = {
      ...form,
      academicYear: finalAcademicYear,
      notifTargetRole: notifTargetRole,
      notifAcademicYear: finalAcademicYear,
    }

    await onSubmit(payload as any)
  }

  const getChannelDisabledReason = (channel: 'sms' | 'email' | 'whatsapp'): string | null => {
    if (!notifSettings) return null
    const s = notifSettings[channel]
    if (!s.enabled) return `${channel.toUpperCase()} notifications disabled in settings`
    if (!s.homeworkAlert)
      return `Homework alerts disabled for ${channel.toUpperCase()} in Notification Settings`
    return null
  }

  const charCount = form.description.length

  // ────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[78vh] overflow-y-auto pr-1">
      {/* ── Academic Year (Visible for debugging) ── */}
      {!isEdit && (
        <Select
          label="Academic Year"
          value={form.academicYear}
          onChange={e => {
            const newYear = e.target.value
            setForm(f => ({ ...f, academicYear: newYear }))
            console.log('[ACADEMIC YEAR CHANGED]', newYear)
          }}
          options={academicYears.map(year => ({
            value: year,
            label: year,
          }))}
        />
      )}

      {/* ── Title ── */}
      <Input
        label="Homework Title"
        placeholder="e.g., Chapter 5 — Questions 1 to 10"
        value={form.title}
        onChange={e => updateField('title', e.target.value)}
        error={errors.title}
        required
        maxLength={200}
      />

      {/* ── Description ── */}
      <div className="space-y-1">
        <label className="text-xs font-semibold block" style={{ color: 'var(--text-primary)' }}>
          Instructions <span style={{ color: 'var(--danger)' }}>*</span>
        </label>
        <textarea
          className={[
            'w-full px-3 py-2.5 text-sm rounded-[var(--radius-md)]',
            'border-[1.5px] transition-all resize-none',
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
            <span className="text-xs" style={{ color: 'var(--danger)' }}>
              {errors.description}
            </span>
          )}
          <span
            className={`ml-auto text-xs ${
              charCount > 1800 ? 'text-[var(--warning)]' : 'text-[var(--text-muted)]'
            }`}
          >
            {charCount}/2000
          </span>
        </div>
      </div>

      {/* ── Class + Section + Subject ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* ✅ Class - with normalization */}
        <div>
          <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-primary)' }}>
            Class <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <select
            value={form.class}
            onChange={e => {
              const normalizedValue = normalizeClassValue(e.target.value)
              console.log('[CLASS CHANGE]', {
                selected: e.target.value,
                normalized: normalizedValue,
              })
              updateField('class', normalizedValue)
            }}
            className={`input-clean text-sm ${errors.class ? 'input-error' : ''}`}
          >
            {normalizedAllowedClasses.length === 0 ? (
              <option value="">No classes assigned</option>
            ) : (
              <>
                {normalizedAllowedClasses.length > 1 && <option value="">Select Class</option>}
                {normalizedAllowedClasses.map(cls => (
                  <option key={cls} value={cls}>
                    {formatClassDisplay(cls)}
                  </option>
                ))}
              </>
            )}
          </select>
          {errors.class && (
            <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>
              {errors.class}
            </p>
          )}
          {/* ✅ Debug info */}
          {form.class && (
            <p className="text-[10px] mt-1 opacity-60" style={{ color: 'var(--text-muted)' }}>
              Query value: "{form.class}"
            </p>
          )}
        </div>

        {/* Section */}
        <div>
          <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-primary)' }}>
            Section
          </label>
          <select
            value={form.section ?? ''}
            onChange={e => updateField('section', e.target.value)}
            className="input-clean text-sm"
          >
            <option value="">All Sections</option>
            {allowedSections.map(sec => (
              <option key={sec} value={sec}>
                Section {sec}
              </option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-primary)' }}>
            Subject <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <select
            value={form.subject}
            onChange={e => updateField('subject', e.target.value)}
            className={`input-clean text-sm ${errors.subject ? 'input-error' : ''}`}
          >
            {allowedSubjects.length === 0 ? (
              <option value="">No subjects assigned</option>
            ) : (
              <>
                {allowedSubjects.length > 1 && <option value="">Select Subject</option>}
                {allowedSubjects.map(sub => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </>
            )}
          </select>
          {errors.subject && (
            <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>
              {errors.subject}
            </p>
          )}
        </div>
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
      <label
        className="flex items-center gap-3 cursor-pointer p-3 rounded-[var(--radius-md)] transition-colors"
        style={{ backgroundColor: 'var(--bg-subtle)' }}
      >
        <input
          type="checkbox"
          checked={form.allowLateSubmission}
          onChange={e => updateField('allowLateSubmission', e.target.checked)}
          className="w-4 h-4 rounded"
          style={{ accentColor: 'var(--primary-500)' }}
        />
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Allow Late Submission
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Students can submit after deadline (marked as late)
          </p>
        </div>
      </label>

      {/* ── Attachments ── */}
      <div className="space-y-2">
        <label className="text-xs font-semibold block" style={{ color: 'var(--text-primary)' }}>
          Attachments{' '}
          <span className="font-normal" style={{ color: 'var(--text-muted)' }}>
            (optional)
          </span>
        </label>

        <label className="btn-secondary btn-sm w-fit cursor-pointer flex items-center gap-2">
          <Upload size={13} />
          {uploading ? (
            <span className="flex items-center gap-1">
              <Loader2 size={11} className="animate-spin" />
              Uploading...
            </span>
          ) : (
            'Upload Files'
          )}
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>

        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Max 10MB per file · PDF, JPG, PNG, DOCX
        </p>

        {errors.attachments && (
          <p className="text-xs" style={{ color: 'var(--danger)' }}>
            {errors.attachments}
          </p>
        )}

        {form.attachments.length > 0 && (
          <div className="space-y-1.5 mt-2">
            {form.attachments.map((file, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-[var(--radius-sm)]"
                style={{
                  backgroundColor: 'var(--bg-muted)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {file.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="p-1 rounded transition-colors"
                  style={{ color: 'var(--danger)' }}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Notifications (create only) ── */}
      {!isEdit && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
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
            onChange={e => setNotifTargetRole(e.target.value as NotifTargetRole)}
            options={NOTIFICATION_TARGET_OPTIONS}
          />

          {/* ── SMS ── */}
          {(() => {
            const reason = getChannelDisabledReason('sms')
            const isDisabled = !!reason
            return (
              <label
                className={[
                  'flex items-center gap-3 p-3 rounded-[var(--radius-md)] transition-colors',
                  isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
                ].join(' ')}
                style={{ backgroundColor: 'var(--bg-subtle)' }}
              >
                <input
                  type="checkbox"
                  checked={form.notificationChannels?.sms ?? false}
                  onChange={e => updateChannel('sms', e.target.checked)}
                  disabled={isDisabled}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: 'var(--primary-500)' }}
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    📱 Send SMS Alert
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {isDisabled ? reason : `${CREDIT_COSTS.sms} credit per recipient`}
                    {!isDisabled &&
                      form.notificationChannels?.sms &&
                      recipientCount.channels.sms.validContacts > 0 && (
                        <span className="ml-2 font-medium" style={{ color: 'var(--primary-600)' }}>
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
              <label
                className={[
                  'flex items-center gap-3 p-3 rounded-[var(--radius-md)] transition-colors',
                  isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
                ].join(' ')}
                style={{ backgroundColor: 'var(--bg-subtle)' }}
              >
                <input
                  type="checkbox"
                  checked={form.notificationChannels?.whatsapp ?? false}
                  onChange={e => updateChannel('whatsapp', e.target.checked)}
                  disabled={isDisabled}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: 'var(--primary-500)' }}
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    💬 Send WhatsApp Message
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {isDisabled ? reason : `${CREDIT_COSTS.whatsapp} credit per recipient`}
                    {!isDisabled &&
                      form.notificationChannels?.whatsapp &&
                      recipientCount.channels.whatsapp.validContacts > 0 && (
                        <span className="ml-2 font-medium" style={{ color: 'var(--primary-600)' }}>
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
              <label
                className={[
                  'flex items-center gap-3 p-3 rounded-[var(--radius-md)] transition-colors',
                  isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
                ].join(' ')}
                style={{ backgroundColor: 'var(--bg-subtle)' }}
              >
                <input
                  type="checkbox"
                  checked={form.notificationChannels?.email ?? false}
                  onChange={e => updateChannel('email', e.target.checked)}
                  disabled={isDisabled}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: 'var(--primary-500)' }}
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    📧 Send Email Notification
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {isDisabled ? reason : `${CREDIT_COSTS.email} credit per recipient`}
                    {!isDisabled &&
                      form.notificationChannels?.email &&
                      recipientCount.channels.email.validContacts > 0 && (
                        <span className="ml-2 font-medium" style={{ color: 'var(--primary-600)' }}>
                          ({recipientCount.channels.email.validContacts} with email)
                        </span>
                      )}
                    {!isDisabled &&
                      form.notificationChannels?.email &&
                      recipientCount.channels.email.validContacts === 0 &&
                      !recipientCount.loading && (
                        <span className="ml-2 font-medium" style={{ color: 'var(--warning)' }}>
                          ⚠️ No email addresses found
                        </span>
                      )}
                  </p>
                </div>
              </label>
            )
          })()}

          {/* ── Push ── */}
          <label
            className="flex items-center gap-3 cursor-pointer p-3 rounded-[var(--radius-md)] transition-colors"
            style={{ backgroundColor: 'var(--bg-subtle)' }}
          >
            <input
              type="checkbox"
              checked={form.notificationChannels?.push ?? true}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  notificationChannels: {
                    sms: f.notificationChannels?.sms ?? false,
                    whatsapp: f.notificationChannels?.whatsapp ?? false,
                    email: f.notificationChannels?.email ?? false,
                    push: e.target.checked,
                  },
                }))
              }
              className="w-4 h-4 rounded"
              style={{ accentColor: 'var(--primary-500)' }}
            />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                🔔 Send Push Notification
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Free — instant notification to students & parents
              </p>
            </div>
          </label>

          {/* ── Recipient Count Row ── */}
          {willSendMessages && form.class && (
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-md)]"
              style={{
                backgroundColor: 'var(--bg-muted)',
                border: '1px solid var(--border)',
              }}
            >
              <Users size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

              {recipientCount.loading ? (
                <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  <Loader2 size={12} className="animate-spin" />
                  Counting recipients...
                </span>
              ) : (
                <div className="flex items-center gap-3 flex-wrap text-xs flex-1">
                  <span className="text-[10px] w-full mb-0.5" style={{ color: 'var(--text-muted)' }}>
                    {form.academicYear} • Class {form.class}
                    {form.section && ` • Section ${form.section}`} •{' '}
                    {notifTargetRole === 'all'
                      ? 'Students + Parents'
                      : notifTargetRole === 'student'
                      ? 'Students Only'
                      : 'Parents Only'}
                  </span>

                  {form.notificationChannels?.sms && (
                    <span style={{ color: 'var(--text-secondary)' }}>
                      📱{' '}
                      <span className="font-semibold" style={{ color: 'var(--primary-600)' }}>
                        {recipientCount.channels.sms.validContacts}
                      </span>{' '}
                      SMS
                    </span>
                  )}
                  {form.notificationChannels?.whatsapp && (
                    <span style={{ color: 'var(--text-secondary)' }}>
                      💬{' '}
                      <span className="font-semibold" style={{ color: 'var(--primary-600)' }}>
                        {recipientCount.channels.whatsapp.validContacts}
                      </span>{' '}
                      WhatsApp
                    </span>
                  )}
                  {form.notificationChannels?.email && (
                    <span style={{ color: 'var(--text-secondary)' }}>
                      📧{' '}
                      <span className="font-semibold" style={{ color: 'var(--primary-600)' }}>
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
                style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}
                title="Refresh"
              >
                <RefreshCw size={12} />
              </button>
            </div>
          )}

          {/* ── Credit Estimate ── */}
          {willSendMessages && estimatedCredits > 0 && (
            <div
              className="p-3 rounded-[var(--radius-md)] text-xs border"
              style={
                hasInsufficientCredits
                  ? {
                      backgroundColor: 'var(--danger-light)',
                      borderColor: 'rgba(239,68,68,0.3)',
                    }
                  : {
                      backgroundColor: 'var(--info-light)',
                      borderColor: 'rgba(59,130,246,0.2)',
                    }
              }
            >
              <div className="flex items-start gap-2">
                <Info size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} />
                <div className="flex-1 space-y-1">
                  <p className="font-semibold">
                    Estimated Cost:{' '}
                    <span className="font-bold">~{formatCredits(estimatedCredits)} credits</span>
                  </p>
                  <div className="text-[10px] opacity-80 space-y-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {form.notificationChannels?.sms && recipientCount.channels.sms.validContacts > 0 && (
                      <p>
                        SMS: {recipientCount.channels.sms.validContacts} × {CREDIT_COSTS.sms} ={' '}
                        {formatCredits(creditBreakdown.sms)} CR
                      </p>
                    )}
                    {form.notificationChannels?.whatsapp &&
                      recipientCount.channels.whatsapp.validContacts > 0 && (
                        <p>
                          WhatsApp: {recipientCount.channels.whatsapp.validContacts} ×{' '}
                          {CREDIT_COSTS.whatsapp} = {formatCredits(creditBreakdown.whatsapp)} CR
                        </p>
                      )}
                    {form.notificationChannels?.email && recipientCount.channels.email.validContacts > 0 && (
                      <p>
                        Email: {recipientCount.channels.email.validContacts} × {CREDIT_COSTS.email} ={' '}
                        {formatCredits(creditBreakdown.email)} CR
                      </p>
                    )}
                  </div>
                  <p className="mt-1">
                    Available Balance:{' '}
                    <span
                      className={`font-semibold ${
                        hasInsufficientCredits ? 'text-[var(--danger-dark)]' : 'text-[var(--success-dark)]'
                      }`}
                    >
                      {formatCredits(creditBalance)} credits
                    </span>
                  </p>
                  {hasInsufficientCredits && (
                    <p className="font-semibold mt-1" style={{ color: 'var(--danger-dark)' }}>
                      ⚠️ Need {formatCredits(estimatedCredits - creditBalance)} more credits. Contact admin to
                      purchase.
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
      <div
        className="flex items-center justify-end gap-3 pt-4 sticky bottom-0 pb-1"
        style={{
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" loading={isLoading} disabled={isLoading || hasInsufficientCredits}>
          {isEdit ? 'Update Homework' : 'Assign Homework'}
        </Button>
      </div>
    </form>
  )
}