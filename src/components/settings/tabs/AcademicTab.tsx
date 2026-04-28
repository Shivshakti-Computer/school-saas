// FILE: src/components/settings/tabs/AcademicTab.tsx
// ✅ UPDATED: Multi-tenant support — School vs Academy/Coaching
// School: Classes, Sections, Subjects, Grading
// Academy/Coaching: Course Structure placeholder (separate management)

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import {
  Plus, Trash2, GraduationCap, Clock, BookOpen,
  BarChart2, ChevronDown, ChevronUp,
  RotateCcw, Sparkles, AlertTriangle, Check,
  X as XIcon, Info,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SettingSection } from '../shared/SettingSection'
import { SettingRow } from '../shared/SettingRow'
import { SaveBar } from '../shared/SaveButton'
import {
  DEFAULT_CLASSES,
  DEFAULT_SECTIONS,
  DEFAULT_GRADE_SCALE,
  DEFAULT_SUBJECTS,
} from '@/lib/academicDefaults'
import {
  CLASS_GROUPS,
  STREAMS,
  getAcademicYearOptions,
} from '@/types/settings'
import type {
  IAcademicConfig,
  IClassConfig,
  ISectionConfig,
  IGradeScale,
  ClassGroup,
  GradingSystem,
} from '@/types/settings'
import type { InstitutionType } from '@/lib/institutionConfig'

// ─────────────────────────────────────────────────────────
// Toast Hook (same as before)
// ─────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
}

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [...prev, { id, type, title, message }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 5000)
    },
    []
  )

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, show, dismiss }
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[]
  onDismiss: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          role="alert"
        >
          <div className="toast-icon">
            {toast.type === 'success' && <Check size={18} />}
            {toast.type === 'error' && <XIcon size={18} />}
            {toast.type === 'warning' && <AlertTriangle size={18} />}
            {toast.type === 'info' && <Sparkles size={18} />}
          </div>
          <div className="toast-content">
            <p className="toast-title">{toast.title}</p>
            {toast.message && (
              <p className="toast-message">{toast.message}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="toast-close"
            aria-label="Close notification"
          >
            <XIcon size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────

function validateAcademicForm(form: IAcademicConfig): string | null {
  if (!form.classes || form.classes.length === 0) {
    return 'At least one class is required'
  }

  const activeClasses = form.classes.filter((c) => c.isActive)
  if (activeClasses.length === 0) {
    return 'At least one active class is required'
  }

  if (!form.sections || form.sections.length === 0) {
    return 'At least one section is required'
  }

  const activeSections = form.sections.filter((s) => s.isActive)
  if (activeSections.length === 0) {
    return 'At least one active section is required'
  }

  if (form.schoolTimings) {
    const { start, end } = form.schoolTimings
    if (start >= end) {
      return 'Start time must be before end time'
    }
  }

  if (form.gradingSystem === 'grades') {
    if (!form.gradeScale || form.gradeScale.length < 2) {
      return 'Grade scale must have at least 2 grades'
    }

    for (const grade of form.gradeScale) {
      if (!grade.grade.trim()) {
        return 'Grade label cannot be empty'
      }
      if (grade.minMarks > grade.maxMarks) {
        return `Invalid range for grade ${grade.grade}`
      }
    }
  }

  if (form.passPercentage < 0 || form.passPercentage > 100) {
    return 'Pass percentage must be between 0 and 100'
  }

  if (form.attendanceThreshold < 0 || form.attendanceThreshold > 100) {
    return 'Attendance threshold must be between 0 and 100'
  }

  return null
}

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────

interface AcademicTabProps {
  academic: IAcademicConfig
  onSaved: (updated: IAcademicConfig) => void
  institutionType?: InstitutionType  // ✅ ADD
}

export function AcademicTab({ 
  academic, 
  onSaved,
  institutionType,
}: AcademicTabProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { toasts, show: showToast, dismiss: dismissToast } = useToast()

  // ✅ Fallback to session if not passed
  const instType = institutionType || ((session?.user as any)?.institutionType as InstitutionType) || 'school'
  
  // ✅ Academy/Coaching — different UI
  const isAcademyCoaching = instType === 'academy' || instType === 'coaching'

  const [form, setForm] = useState<IAcademicConfig>({ ...academic })
  const [originalData, setOriginalData] = useState<IAcademicConfig>({
    ...academic,
  })
  const [isDirty, setIsDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expandedGroup, setExpandedGroup] = useState<ClassGroup | null>(null)

  const autoSaveTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Auto-save draft
  useEffect(() => {
    if (isDirty) {
      clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = setTimeout(() => {
        try {
          localStorage.setItem(
            'academic-settings-draft',
            JSON.stringify(form)
          )
        } catch (err) {
          console.error('[AcademicTab] Draft save failed', err)
        }
      }, 2000)
    }

    return () => clearTimeout(autoSaveTimerRef.current)
  }, [form, isDirty])

  // Load draft on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem('academic-settings-draft')
      if (draft) {
        const parsed = JSON.parse(draft)
        const isDraftNewer =
          JSON.stringify(parsed) !== JSON.stringify(academic)
        if (isDraftNewer) {
          const restore = window.confirm(
            'Found unsaved changes. Do you want to restore them?'
          )
          if (restore) {
            setForm(parsed)
            setIsDirty(true)
            showToast(
              'info',
              'Draft restored',
              'Your unsaved changes have been restored'
            )
          } else {
            localStorage.removeItem('academic-settings-draft')
          }
        }
      }
    } catch (err) {
      console.error('[AcademicTab] Draft restore failed', err)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const update = useCallback(
    <K extends keyof IAcademicConfig>(
      field: K,
      val: IAcademicConfig[K]
    ) => {
      setForm((prev) => ({ ...prev, [field]: val }))
      setIsDirty(true)
    },
    []
  )

  const handleSave = async () => {
    const validationError = validateAcademicForm(form)
    if (validationError) {
      showToast('error', 'Validation Error', validationError)
      return
    }

    setSaving(true)

    const backup = { ...originalData }
    setOriginalData({ ...form })
    onSaved(form)

    try {
      const res = await fetch('/api/settings/academic', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(
          data.error || 'Failed to save academic settings'
        )
      }

      setIsDirty(false)
      localStorage.removeItem('academic-settings-draft')

      showToast(
        'success',
        'Settings Saved',
        'Academic settings updated successfully'
      )

      const cache = {
        data: form,
        timestamp: Date.now(),
      }
      localStorage.setItem(
        'academic-settings-cache',
        JSON.stringify(cache)
      )

      try {
        const channel = new BroadcastChannel('settings-update')
        channel.postMessage({
          type: 'academic-updated',
          data: form,
          affectedModules: data.affectedModules || [],
        })
        channel.close()
      } catch (err) {
        console.error('[AcademicTab] Broadcast failed', err)
      }

      router.refresh()

      if (data.affectedModules && data.affectedModules.length > 0) {
        setTimeout(() => {
          const modules = data.affectedModules.join(', ')
          showToast(
            'info',
            'Modules Updated',
            `Changes will reflect in: ${modules}`
          )
        }, 2000)
      }
    } catch (err: any) {
      setOriginalData(backup)
      onSaved(backup)
      setForm(backup)

      showToast(
        'error',
        'Save Failed',
        err.message || 'Could not update academic settings'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDiscard = useCallback(() => {
    if (isDirty) {
      const confirm = window.confirm(
        'Discard all unsaved changes? This cannot be undone.'
      )
      if (!confirm) return
    }

    setForm({ ...originalData })
    setIsDirty(false)
    localStorage.removeItem('academic-settings-draft')
    showToast('info', 'Changes Discarded', 'Form reset to last saved state')
  }, [isDirty, originalData, showToast])

  const toggleClass = useCallback(
    (index: number) => {
      const updated = [...form.classes]
      updated[index] = {
        ...updated[index],
        isActive: !updated[index].isActive,
      }
      update('classes', updated)
    },
    [form.classes, update]
  )

  const resetClasses = useCallback(() => {
    update('classes', DEFAULT_CLASSES)
    showToast('info', 'Classes Reset', 'Default class structure restored')
  }, [update, showToast])

  const addSection = useCallback(() => {
    const names = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']
    const existing = form.sections.map((s) => s.name.toUpperCase())
    const next = names.find((n) => !existing.includes(n))

    if (!next) {
      showToast(
        'warning',
        'Maximum Reached',
        'Cannot add more than 11 sections'
      )
      return
    }

    update('sections', [...form.sections, { name: next, isActive: true }])
  }, [form.sections, update, showToast])

  const removeSection = useCallback(
    (index: number) => {
      if (form.sections.length <= 1) {
        showToast(
          'error',
          'Cannot Remove',
          'At least one section is required'
        )
        return
      }

      update(
        'sections',
        form.sections.filter((_, i) => i !== index)
      )
    },
    [form.sections, update, showToast]
  )

  const toggleSection = useCallback(
    (index: number) => {
      const updated = [...form.sections]
      updated[index] = {
        ...updated[index],
        isActive: !updated[index].isActive,
      }
      update('sections', updated)
    },
    [form.sections, update]
  )

  const getSubjectsForGroup = useCallback(
    (group: ClassGroup, stream?: string): string[] => {
      const entry = form.subjects.find(
        (s) =>
          s.classGroup === group &&
          (stream ? s.stream === stream : !s.stream)
      )
      return entry?.subjectList || []
    },
    [form.subjects]
  )

  const updateSubjects = useCallback(
    (group: ClassGroup, subjectList: string[], stream?: string) => {
      const updated = [...form.subjects]
      const idx = updated.findIndex(
        (s) =>
          s.classGroup === group &&
          (stream ? s.stream === stream : !s.stream)
      )

      if (idx >= 0) {
        updated[idx] = { classGroup: group, stream, subjectList }
      } else {
        updated.push({ classGroup: group, stream, subjectList })
      }

      update('subjects', updated)
    },
    [form.subjects, update]
  )

  const addGrade = useCallback(() => {
    const newGrade: IGradeScale = {
      grade: '',
      minMarks: 0,
      maxMarks: 100,
      gradePoint: 0,
      description: '',
    }
    update('gradeScale', [...(form.gradeScale || []), newGrade])
  }, [form.gradeScale, update])

  const removeGrade = useCallback(
    (index: number) => {
      if ((form.gradeScale || []).length <= 2) {
        showToast(
          'warning',
          'Minimum Required',
          'Grade scale must have at least 2 grades'
        )
        return
      }
      update(
        'gradeScale',
        (form.gradeScale || []).filter((_, i) => i !== index)
      )
    },
    [form.gradeScale, update, showToast]
  )

  const updateGrade = useCallback(
    (index: number, field: keyof IGradeScale, val: any) => {
      const updated = [...(form.gradeScale || [])]
      updated[index] = { ...updated[index], [field]: val }
      update('gradeScale', updated)
    },
    [form.gradeScale, update]
  )

  const resetGradeScale = useCallback(() => {
    update('gradeScale', DEFAULT_GRADE_SCALE)
    showToast('info', 'Grade Scale Reset', 'Default grading system restored')
  }, [update, showToast])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (isDirty && !saving) {
          handleSave()
        }
      }

      if (e.key === 'Escape' && isDirty && !saving) {
        handleDiscard()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDirty, saving, handleSave, handleDiscard])

  const yearOptions = getAcademicYearOptions()

  // ✅ Academy/Coaching — redirect to separate management
  if (isAcademyCoaching) {
    return (
      <div className="space-y-5 portal-content-enter">
        <div
          className="p-6 rounded-[var(--radius-lg)] border text-center"
          style={{
            background: 'var(--info-light)',
            borderColor: 'rgba(59,130,246,0.2)',
          }}
        >
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{
              background: 'var(--primary-100)',
              border: '2px solid var(--primary-200)',
            }}
          >
            <BookOpen size={28} style={{ color: 'var(--primary-600)' }} />
          </div>

          <h3 className="text-lg font-700 mb-2" style={{ color: 'var(--primary-700)' }}>
            {instType === 'academy' ? 'Course Structure' : 'Batch Structure'}
          </h3>
          
          <p className="text-sm mb-4" style={{ color: 'var(--info-dark)' }}>
            {instType === 'academy'
              ? 'Courses and batches are managed separately from here'
              : 'Batches and courses are managed from their dedicated modules'
            }
          </p>

          <div className="flex gap-3 justify-center">
            <a
              href="/admin/courses"
              className="btn-primary btn-md"
            >
              <BookOpen size={15} />
              Manage Courses
            </a>
            <a
              href="/admin/batches"
              className="btn-secondary btn-md"
            >
              <GraduationCap size={15} />
              Manage Batches
            </a>
          </div>
        </div>

        {/* Common settings — timing, grading etc. */}
        <SettingSection
          title={instType === 'academy' ? 'Academy Timings' : 'Institute Timings'}
          description="Daily schedule and working hours"
          icon={Clock}
        >
          <div className="grid grid-cols-2 gap-4">
            <SettingRow label="Start Time" required>
              <input
                type="time"
                value={form.schoolTimings?.start || '08:00'}
                onChange={(e) =>
                  update('schoolTimings', {
                    ...form.schoolTimings,
                    start: e.target.value,
                  })
                }
                className="input-clean"
              />
            </SettingRow>

            <SettingRow label="End Time" required>
              <input
                type="time"
                value={form.schoolTimings?.end || '14:00'}
                onChange={(e) =>
                  update('schoolTimings', {
                    ...form.schoolTimings,
                    end: e.target.value,
                  })
                }
                className="input-clean"
              />
            </SettingRow>

            <SettingRow label="Working Days/Week">
              <div className="flex gap-2">
                {[5, 6, 7].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => update('workingDaysPerWeek', d)}
                    className={`
                      flex-1 py-2 rounded-[var(--radius-md)]
                      text-sm font-600 border transition-all
                      ${form.workingDaysPerWeek === d
                        ? 'bg-[var(--primary-50)] border-[var(--primary-300)] text-[var(--primary-600)]'
                        : 'bg-[var(--bg-muted)] border-[var(--border)] text-[var(--text-secondary)]'
                      }
                    `}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </SettingRow>

            <SettingRow label="Attendance Threshold">
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.attendanceThreshold}
                  onChange={(e) =>
                    update('attendanceThreshold', parseInt(e.target.value) || 75)
                  }
                  className="input-clean pr-8"
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]"
                >
                  %
                </span>
              </div>
            </SettingRow>
          </div>
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

  return (
    <>
      <div className="space-y-5 portal-content-enter">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-lg font-700 text-[var(--text-primary)]">
              Academic Configuration
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Classes, subjects, grading system, and school timings
            </p>
          </div>
        </div>

        {/* ── Academic Year ── */}
        <SettingSection
          title="Academic Year"
          description="Current academic session configuration"
          icon={GraduationCap}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SettingRow label="Current Academic Year" required>
              <select
                value={form.currentAcademicYear}
                onChange={(e) =>
                  update('currentAcademicYear', e.target.value)
                }
                className="input-clean"
              >
                {yearOptions.map((y) => (
                  <option key={y.value} value={y.value}>
                    {y.label}
                  </option>
                ))}
              </select>
            </SettingRow>

            <SettingRow
              label="Year Start Month"
              description="Month when new academic year begins"
            >
              <select
                value={form.academicYearStartMonth}
                onChange={(e) =>
                  update(
                    'academicYearStartMonth',
                    parseInt(e.target.value)
                  )
                }
                className="input-clean"
              >
                {[
                  { value: 1, label: 'January' },
                  { value: 2, label: 'February' },
                  { value: 3, label: 'March' },
                  { value: 4, label: 'April (Recommended)' },
                  { value: 6, label: 'June' },
                  { value: 7, label: 'July' },
                ].map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </SettingRow>
          </div>
        </SettingSection>

        {/* ── School Timings ── */}
        <SettingSection
          title="School Timings"
          description="Daily schedule — used in timetable and reports"
          icon={Clock}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SettingRow label="Start Time" required>
              <input
                type="time"
                value={form.schoolTimings?.start || '08:00'}
                onChange={(e) =>
                  update('schoolTimings', {
                    ...form.schoolTimings,
                    start: e.target.value,
                  })
                }
                className="input-clean"
                aria-label="School start time"
              />
            </SettingRow>

            <SettingRow label="End Time" required>
              <input
                type="time"
                value={form.schoolTimings?.end || '14:00'}
                onChange={(e) =>
                  update('schoolTimings', {
                    ...form.schoolTimings,
                    end: e.target.value,
                  })
                }
                className="input-clean"
                aria-label="School end time"
              />
            </SettingRow>

            <SettingRow label="Lunch Start">
              <input
                type="time"
                value={form.schoolTimings?.lunchBreak?.start || ''}
                onChange={(e) =>
                  update('schoolTimings', {
                    ...form.schoolTimings,
                    lunchBreak: {
                      start: e.target.value,
                      end: form.schoolTimings?.lunchBreak?.end ?? '',
                    },
                  })
                }
                className="input-clean"
                aria-label="Lunch break start time"
              />
            </SettingRow>

            <SettingRow label="Lunch End">
              <input
                type="time"
                value={form.schoolTimings?.lunchBreak?.end || ''}
                onChange={(e) =>
                  update('schoolTimings', {
                    ...form.schoolTimings,
                    lunchBreak: {
                      start: form.schoolTimings?.lunchBreak?.start ?? '',
                      end: e.target.value,
                    },
                  })
                }
                className="input-clean"
                aria-label="Lunch break end time"
              />
            </SettingRow>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[var(--border)]">
            <SettingRow
              label="Working Days/Week"
              description="5 or 6 days"
            >
              <div
                className="flex gap-2"
                role="group"
                aria-label="Working days per week"
              >
                {[5, 6].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => update('workingDaysPerWeek', d)}
                    className={`
                      flex-1 py-2 rounded-[var(--radius-md)]
                      text-sm font-600 border transition-all
                      ${form.workingDaysPerWeek === d
                        ? 'bg-[var(--primary-50)] border-[var(--primary-300)] text-[var(--primary-600)]'
                        : 'bg-[var(--bg-muted)] border-[var(--border)] text-[var(--text-secondary)]'
                      }
                    `}
                    aria-pressed={form.workingDaysPerWeek === d}
                  >
                    {d} Days
                  </button>
                ))}
              </div>
            </SettingRow>

            <SettingRow
              label="Attendance Threshold"
              description="Minimum % required"
            >
              <div className="input-group">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.attendanceThreshold}
                  onChange={(e) =>
                    update(
                      'attendanceThreshold',
                      parseInt(e.target.value) || 75
                    )
                  }
                  className="input-clean"
                  aria-label="Minimum attendance percentage"
                />
                <span
                  className="
                    absolute right-3 top-1/2 -translate-y-1/2
                    text-sm text-[var(--text-muted)]
                  "
                  aria-hidden="true"
                >
                  %
                </span>
              </div>
            </SettingRow>
          </div>
        </SettingSection>

        {/* ── Classes & Sections ── */}
        <SettingSection
          title="Classes & Sections"
          description="Enable/disable classes and manage sections"
          icon={GraduationCap}
          headerAction={
            <button
              type="button"
              onClick={resetClasses}
              className="btn-ghost btn-sm text-xs"
              aria-label="Reset classes to default"
            >
              <RotateCcw size={12} />
              Reset Default
            </button>
          }
        >
          {/* Class Groups */}
          <div
            className="space-y-3"
            role="region"
            aria-label="Class groups"
          >
            {CLASS_GROUPS.map((group) => {
              const groupClasses = form.classes.filter(
                (c) => c.group === group.key
              )
              const isExpanded = expandedGroup === group.key
              const activeCount = groupClasses.filter(
                (c) => c.isActive
              ).length

              return (
                <div
                  key={group.key}
                  className="
                    border border-[var(--border)]
                    rounded-[var(--radius-md)] overflow-hidden
                  "
                >
                  {/* Group Header */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedGroup(isExpanded ? null : group.key)
                    }
                    className="
                      w-full flex items-center justify-between
                      px-4 py-3 bg-[var(--bg-muted)]
                      hover:bg-[var(--border)]
                      transition-colors text-left
                    "
                    aria-expanded={isExpanded}
                    aria-controls={`group-${group.key}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: group.color }}
                        aria-hidden="true"
                      />
                      <div>
                        <span className="text-sm font-600 text-[var(--text-primary)]">
                          {group.label}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] ml-2">
                          {group.range}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--text-muted)]">
                        {activeCount}/{groupClasses.length} active
                      </span>
                      {isExpanded ? (
                        <ChevronUp size={14} aria-hidden="true" />
                      ) : (
                        <ChevronDown size={14} aria-hidden="true" />
                      )}
                    </div>
                  </button>

                  {/* Class Toggles */}
                  {isExpanded && (
                    <div
                      id={`group-${group.key}`}
                      className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2"
                      role="group"
                      aria-label={`${group.label} classes`}
                    >
                      {groupClasses.map((cls) => {
                        const idx = form.classes.findIndex(
                          (c) =>
                            c.name === cls.name &&
                            c.group === cls.group &&
                            c.stream === cls.stream
                        )
                        return (
                          <button
                            key={`${cls.name}-${cls.stream || ''}`}
                            type="button"
                            onClick={() => toggleClass(idx)}
                            className={`
                              px-3 py-2 rounded-[var(--radius-sm)]
                              text-xs font-500 border text-left
                              transition-all duration-150
                              ${cls.isActive
                                ? 'bg-[var(--primary-50)] border-[var(--primary-200)] text-[var(--primary-700)]'
                                : 'bg-[var(--bg-muted)] border-[var(--border)] text-[var(--text-muted)] line-through'
                              }
                            `}
                            aria-pressed={cls.isActive}
                          >
                            {cls.displayName}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ── Sections ── */}
          <div className="mt-5 pt-5 border-t border-[var(--border)]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-600 text-[var(--text-primary)]">
                  Sections
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Sections available across all classes
                </p>
              </div>
              <button
                type="button"
                onClick={addSection}
                disabled={form.sections.length >= 11}
                className="btn-secondary btn-sm"
                aria-label="Add new section"
              >
                <Plus size={13} /> Add Section
              </button>
            </div>

            <div
              className="flex flex-wrap gap-2"
              role="list"
              aria-label="Sections"
            >
              {form.sections.map((sec, idx) => (
                <div
                  key={idx}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5
                    rounded-[var(--radius-full)]
                    border text-sm font-600
                    ${sec.isActive
                      ? 'bg-[var(--primary-50)] border-[var(--primary-200)] text-[var(--primary-700)]'
                      : 'bg-[var(--bg-muted)] border-[var(--border)] text-[var(--text-muted)]'
                    }
                  `}
                  role="listitem"
                >
                  <button
                    type="button"
                    onClick={() => toggleSection(idx)}
                    className="hover:opacity-70 transition-opacity"
                    aria-label={`Toggle section ${sec.name}`}
                    aria-pressed={sec.isActive}
                  >
                    {sec.name}
                  </button>
                  {form.sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSection(idx)}
                      className="
                        text-[var(--text-muted)] hover:text-[var(--danger)]
                        transition-colors ml-0.5
                      "
                      aria-label={`Remove section ${sec.name}`}
                    >
                      <XIcon size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="input-hint mt-2">
              Click section to toggle active/inactive. Max 11 sections.
            </p>
          </div>
        </SettingSection>

        {/* ── Subjects ── */}
        <SettingSection
          title="Subjects"
          description="Configure subjects per class group. Sr. Secondary has stream-wise subjects."
          icon={BookOpen}
        >
          <div className="space-y-4">
            {CLASS_GROUPS.map((group) => {
              if (group.key === 'sr_secondary') {
                return (
                  <div key={group.key}>
                    <p
                      className="text-xs font-700 uppercase tracking-wider
                        text-[var(--text-muted)] mb-2"
                    >
                      {group.label}
                    </p>
                    <div className="space-y-3">
                      {STREAMS.map((stream) => (
                        <SubjectEditor
                          key={stream}
                          label={`${stream} Stream`}
                          subjects={getSubjectsForGroup(
                            group.key,
                            stream
                          )}
                          onChange={(subjects) =>
                            updateSubjects(group.key, subjects, stream)
                          }
                        />
                      ))}
                    </div>
                  </div>
                )
              }

              return (
                <div key={group.key}>
                  <p
                    className="text-xs font-700 uppercase tracking-wider
                      text-[var(--text-muted)] mb-2"
                  >
                    {group.label}
                  </p>
                  <SubjectEditor
                    label={group.label}
                    subjects={getSubjectsForGroup(group.key)}
                    onChange={(subjects) =>
                      updateSubjects(group.key, subjects)
                    }
                  />
                </div>
              )
            })}
          </div>
        </SettingSection>

        {/* ── Grading System ── */}
        <SettingSection
          title="Grading System"
          description="How student performance is evaluated"
          icon={BarChart2}
        >
          {/* System selector */}
          <div
            className="grid grid-cols-3 gap-3 mb-5"
            role="group"
            aria-label="Grading system"
          >
            {(
              [
                {
                  key: 'marks',
                  label: 'Marks',
                  desc: 'e.g. 85/100',
                },
                {
                  key: 'grades',
                  label: 'Grades',
                  desc: 'e.g. A+, B, C',
                },
                {
                  key: 'cgpa',
                  label: 'CGPA',
                  desc: 'e.g. 9.2/10',
                },
              ] as {
                key: GradingSystem
                label: string
                desc: string
              }[]
            ).map((sys) => (
              <button
                key={sys.key}
                type="button"
                onClick={() => update('gradingSystem', sys.key)}
                className={`
                  p-3 rounded-[var(--radius-md)] border text-left
                  transition-all duration-150
                  ${form.gradingSystem === sys.key
                    ? 'bg-[var(--primary-50)] border-[var(--primary-300)] shadow-sm'
                    : 'bg-[var(--bg-muted)] border-[var(--border)] hover:border-[var(--border-strong)]'
                  }
                `}
                aria-pressed={form.gradingSystem === sys.key}
              >
                <p
                  className={`text-sm font-700 ${form.gradingSystem === sys.key
                      ? 'text-[var(--primary-600)]'
                      : 'text-[var(--text-primary)]'
                    }`}
                >
                  {sys.label}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {sys.desc}
                </p>
              </button>
            ))}
          </div>

          {/* Pass percentage */}
          <div className="grid grid-cols-2 gap-4">
            <SettingRow
              label="Pass Percentage"
              description="Minimum marks to pass"
            >
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.passPercentage}
                  onChange={(e) =>
                    update('passPercentage', parseInt(e.target.value) || 33)
                  }
                  className="input-clean pr-8"
                  aria-label="Pass percentage"
                />
                <span
                  className="
                    absolute right-3 top-1/2 -translate-y-1/2
                    text-sm text-[var(--text-muted)]
                  "
                  aria-hidden="true"
                >
                  %
                </span>
              </div>
            </SettingRow>

            {form.gradingSystem === 'cgpa' && (
              <SettingRow
                label="CGPA Scale"
                description="e.g. 10 for 10-point scale"
              >
                <input
                  type="number"
                  min={4}
                  max={10}
                  step={0.5}
                  value={form.cgpaScale || 10}
                  onChange={(e) =>
                    update('cgpaScale', parseFloat(e.target.value) || 10)
                  }
                  className="input-clean"
                  aria-label="CGPA scale"
                />
              </SettingRow>
            )}
          </div>

          {/* Grade scale editor */}
          {form.gradingSystem === 'grades' && (
            <div className="mt-5 pt-5 border-t border-[var(--border)]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-600 text-[var(--text-primary)]">
                  Grade Scale
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={resetGradeScale}
                    className="btn-ghost btn-sm text-xs"
                    aria-label="Reset grade scale to default"
                  >
                    <RotateCcw size={12} />
                    Reset Default
                  </button>
                  <button
                    type="button"
                    onClick={addGrade}
                    className="btn-secondary btn-sm"
                    aria-label="Add new grade"
                  >
                    <Plus size={13} /> Add Grade
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {/* Header */}
                <div
                  className="
                    grid grid-cols-12 gap-2 px-3 py-1.5
                    text-xs font-700 uppercase tracking-wider
                    text-[var(--text-muted)]
                  "
                  role="row"
                >
                  <div className="col-span-2">Grade</div>
                  <div className="col-span-2">Min %</div>
                  <div className="col-span-2">Max %</div>
                  <div className="col-span-2">GP</div>
                  <div className="col-span-3">Description</div>
                  <div className="col-span-1" />
                </div>

                {(form.gradeScale || []).map((grade, idx) => (
                  <div
                    key={idx}
                    className="
                      grid grid-cols-12 gap-2 items-center
                      bg-[var(--bg-muted)] rounded-[var(--radius-sm)]
                      px-3 py-2
                    "
                    role="row"
                  >
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={grade.grade}
                        onChange={(e) =>
                          updateGrade(
                            idx,
                            'grade',
                            e.target.value.toUpperCase()
                          )
                        }
                        placeholder="A+"
                        maxLength={3}
                        className="input-clean text-center text-sm font-700 px-2 py-1"
                        aria-label="Grade label"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={grade.minMarks}
                        onChange={(e) =>
                          updateGrade(
                            idx,
                            'minMarks',
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="input-clean text-sm px-2 py-1"
                        aria-label="Minimum marks"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={grade.maxMarks}
                        onChange={(e) =>
                          updateGrade(
                            idx,
                            'maxMarks',
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="input-clean text-sm px-2 py-1"
                        aria-label="Maximum marks"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min={0}
                        max={10}
                        step={0.5}
                        value={grade.gradePoint}
                        onChange={(e) =>
                          updateGrade(
                            idx,
                            'gradePoint',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="input-clean text-sm px-2 py-1"
                        aria-label="Grade point"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={grade.description}
                        onChange={(e) =>
                          updateGrade(idx, 'description', e.target.value)
                        }
                        placeholder="Outstanding"
                        className="input-clean text-sm px-2 py-1"
                        aria-label="Grade description"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => removeGrade(idx)}
                        className="
                          text-[var(--text-muted)] hover:text-[var(--danger)]
                          transition-colors p-1
                        "
                        aria-label={`Remove grade ${grade.grade}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SettingSection>

        {/* Save Bar */}
        <SaveBar
          isDirty={isDirty}
          onSave={handleSave}
          onDiscard={handleDiscard}
          saving={saving}
        />
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  )
}

// ─────────────────────────────────────────────────────────
// Subject Editor Component
// ─────────────────────────────────────────────────────────

interface SubjectEditorProps {
  label: string
  subjects: string[]
  onChange: (subjects: string[]) => void
}

function SubjectEditor({ label, subjects, onChange }: SubjectEditorProps) {
  const [input, setInput] = useState('')

  const addSubject = () => {
    const trimmed = input.trim()
    if (!trimmed) {
      setInput('')
      return
    }

    if (subjects.includes(trimmed)) {
      alert(`Subject "${trimmed}" already exists`)
      setInput('')
      return
    }

    onChange([...subjects, trimmed])
    setInput('')
  }

  const removeSubject = (idx: number) => {
    onChange(subjects.filter((_, i) => i !== idx))
  }

  return (
    <div
      className="
        border border-[var(--border)]
        rounded-[var(--radius-md)] p-3
        bg-[var(--bg-subtle)]
      "
    >
      <p className="text-xs font-600 text-[var(--text-secondary)] mb-2">
        {label}
      </p>

      {/* Chips */}
      <div
        className="flex flex-wrap gap-1.5 mb-2"
        role="list"
        aria-label={`${label} subjects`}
      >
        {subjects.map((sub, idx) => (
          <span
            key={idx}
            className="
              inline-flex items-center gap-1
              bg-[var(--bg-card)] border border-[var(--border)]
              rounded-[var(--radius-full)]
              px-2.5 py-1 text-xs text-[var(--text-secondary)]
            "
            role="listitem"
          >
            {sub}
            <button
              type="button"
              onClick={() => removeSubject(idx)}
              className="
                text-[var(--text-muted)] hover:text-[var(--danger)]
                transition-colors
              "
              aria-label={`Remove ${sub}`}
            >
              <XIcon size={10} />
            </button>
          </span>
        ))}
      </div>

      {/* Add input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addSubject()
            }
          }}
          placeholder="Add subject..."
          className="input-clean text-xs py-1.5 flex-1"
          maxLength={50}
          aria-label={`Add subject to ${label}`}
        />
        <button
          type="button"
          onClick={addSubject}
          disabled={!input.trim()}
          className="btn-secondary btn-sm text-xs px-3"
          aria-label="Add subject"
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  )
}