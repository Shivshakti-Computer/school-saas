// FILE: src/components/homework/TeacherHomeworkForm.tsx
// ✅ Teacher-scoped homework form
// - Only shows teacher's assigned classes/subjects
// - No credit/notification complexity
// - Simple push notification only

'use client'

import { useState, useEffect } from 'react'
import { Input, Select, Button, Alert } from '@/components/ui'
import { Upload, X, Loader2 } from 'lucide-react'
import { getCurrentAcademicYear } from '@/lib/academicYear'
import type {
  HomeworkFormData,
  HomeworkDetail,
  HomeworkAttachment,
} from '@/types/homework'

interface TeacherHomeworkFormProps {
  initialData?: HomeworkDetail
  onSubmit: (data: HomeworkFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  allowedClasses: string[]
  allowedSections: string[]
  allowedSubjects: string[]
}

function getFileType(
  filename: string
): 'pdf' | 'image' | 'doc' | 'other' {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'pdf'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || ''))
    return 'image'
  if (['doc', 'docx'].includes(ext || '')) return 'doc'
  return 'other'
}

export function TeacherHomeworkForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  allowedClasses,
  allowedSections,
  allowedSubjects,
}: TeacherHomeworkFormProps) {
  const isEdit = !!initialData

  const [form, setForm] = useState<HomeworkFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    subject: initialData?.subject || '',
    class: initialData?.class || allowedClasses[0] || '',
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
      push: true,  // only push for teacher
    },
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)

  // ── Auto-select first class/subject if only one ──
  useEffect(() => {
    if (allowedClasses.length === 1 && !form.class) {
      setForm((f) => ({ ...f, class: allowedClasses[0] }))
    }
    if (allowedSubjects.length === 1 && !form.subject) {
      setForm((f) => ({ ...f, subject: allowedSubjects[0] }))
    }
  }, [allowedClasses, allowedSubjects]) // eslint-disable-line

  const updateField = (key: keyof HomeworkFormData, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key as string]) {
      setErrors((prev) => ({ ...prev, [key as string]: '' }))
    }
  }

  // ── File upload ──
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const uploaded: HomeworkAttachment[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        if (file.size > 10 * 1024 * 1024) {
          setErrors((prev) => ({
            ...prev,
            attachments: `${file.name} exceeds 10MB limit`,
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
          uploaded.push({
            name: file.name,
            url: data.url,
            type: getFileType(file.name),
            size: file.size,
            uploadedAt: new Date().toISOString(),
          })
        } else {
          throw new Error(data.error || 'Upload failed')
        }
      }

      setForm((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...uploaded],
      }))
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        attachments: err.message || 'Upload failed',
      }))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const removeAttachment = (index: number) => {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }))
  }

  // ── Validation ──
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!form.title.trim())
      newErrors.title = 'Title is required'
    else if (form.title.length < 3)
      newErrors.title = 'Title must be at least 3 characters'

    if (!form.description.trim())
      newErrors.description = 'Instructions are required'
    else if (form.description.length < 10)
      newErrors.description = 'Instructions must be at least 10 characters'

    if (!form.subject) newErrors.subject = 'Subject is required'
    if (!form.class) newErrors.class = 'Class is required'

    if (!form.dueDate) {
      newErrors.dueDate = 'Due date is required'
    } else if (new Date(form.dueDate) <= new Date()) {
      newErrors.dueDate = 'Due date must be in the future'
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
    } as any)
  }

  const charCount = form.description.length

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-h-[78vh] overflow-y-auto pr-1"
    >
      {/* ── Title ── */}
      <Input
        label="Homework Title"
        placeholder="e.g., Chapter 5 — Questions 1 to 10"
        value={form.title}
        onChange={(e) => updateField('title', e.target.value)}
        error={errors.title}
        required
        maxLength={200}
      />

      {/* ── Description ── */}
      <div className="space-y-1">
        <label
          className="text-xs font-semibold block"
          style={{ color: 'var(--text-primary)' }}
        >
          Instructions{' '}
          <span style={{ color: 'var(--danger)' }}>*</span>
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
          onChange={(e) => updateField('description', e.target.value)}
          maxLength={2000}
        />
        <div className="flex items-center justify-between">
          {errors.description && (
            <span
              className="text-xs"
              style={{ color: 'var(--danger)' }}
            >
              {errors.description}
            </span>
          )}
          <span
            className={`ml-auto text-xs ${
              charCount > 1800
                ? 'text-[var(--warning)]'
                : 'text-[var(--text-muted)]'
            }`}
          >
            {charCount}/2000
          </span>
        </div>
      </div>

      {/* ── Class + Section + Subject ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Class — scoped */}
        <div>
          <label
            className="text-xs font-semibold block mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            Class <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <select
            value={form.class}
            onChange={(e) => updateField('class', e.target.value)}
            className={`input-clean text-sm ${
              errors.class ? 'input-error' : ''
            }`}
          >
            {allowedClasses.length === 0 ? (
              <option value="">No classes assigned</option>
            ) : (
              <>
                {allowedClasses.length > 1 && (
                  <option value="">Select Class</option>
                )}
                {allowedClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    Class {cls}
                  </option>
                ))}
              </>
            )}
          </select>
          {errors.class && (
            <p
              className="text-xs mt-1"
              style={{ color: 'var(--danger)' }}
            >
              {errors.class}
            </p>
          )}
        </div>

        {/* Section — scoped */}
        <div>
          <label
            className="text-xs font-semibold block mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            Section
          </label>
          <select
            value={form.section || ''}
            onChange={(e) => updateField('section', e.target.value)}
            className="input-clean text-sm"
          >
            <option value="">All Sections</option>
            {allowedSections.map((sec) => (
              <option key={sec} value={sec}>
                Section {sec}
              </option>
            ))}
          </select>
        </div>

        {/* Subject — scoped */}
        <div>
          <label
            className="text-xs font-semibold block mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            Subject <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <select
            value={form.subject}
            onChange={(e) => updateField('subject', e.target.value)}
            className={`input-clean text-sm ${
              errors.subject ? 'input-error' : ''
            }`}
          >
            {allowedSubjects.length === 0 ? (
              <option value="">No subjects assigned</option>
            ) : (
              <>
                {allowedSubjects.length > 1 && (
                  <option value="">Select Subject</option>
                )}
                {allowedSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </>
            )}
          </select>
          {errors.subject && (
            <p
              className="text-xs mt-1"
              style={{ color: 'var(--danger)' }}
            >
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
        onChange={(e) => updateField('dueDate', e.target.value)}
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
          onChange={(e) =>
            updateField('allowLateSubmission', e.target.checked)
          }
          className="w-4 h-4 rounded"
          style={{ accentColor: 'var(--primary-500)' }}
        />
        <div>
          <p
            className="text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Allow Late Submission
          </p>
          <p
            className="text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            Students can submit after deadline (marked as late)
          </p>
        </div>
      </label>

      {/* ── Attachments ── */}
      <div className="space-y-2">
        <label
          className="text-xs font-semibold block"
          style={{ color: 'var(--text-primary)' }}
        >
          Attachments{' '}
          <span
            className="font-normal"
            style={{ color: 'var(--text-muted)' }}
          >
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

        <p
          className="text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
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
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {file.name}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
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

      {/* ── Push Notification (always on, free) ── */}
      <div
        className="p-3 rounded-[var(--radius-md)]"
        style={{
          backgroundColor: 'var(--primary-50)',
          border: '1px solid var(--primary-200)',
        }}
      >
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.notificationChannels?.push ?? true}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                notificationChannels: {
                  ...f.notificationChannels,
                  sms: false,
                  whatsapp: false,
                  email: false,
                  push: e.target.checked,
                },
              }))
            }
            className="w-4 h-4 rounded"
            style={{ accentColor: 'var(--primary-500)' }}
          />
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: 'var(--primary-700)' }}
            >
              🔔 Send Push Notification
            </p>
            <p
              className="text-xs"
              style={{ color: 'var(--primary-600)' }}
            >
              Free — instant notification to students & parents
            </p>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div
        className="flex items-center justify-end gap-3 pt-4 sticky bottom-0 pb-1"
        style={{
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
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
          disabled={isLoading}
        >
          {isEdit ? 'Update Homework' : 'Assign Homework'}
        </Button>
      </div>
    </form>
  )
}