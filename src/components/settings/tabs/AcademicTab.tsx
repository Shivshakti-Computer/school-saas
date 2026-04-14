// FILE: src/components/settings/tabs/AcademicTab.tsx
// Classes, sections, subjects, grading system, timings

'use client'

import { useState } from 'react'
import {
    Plus, Trash2, GraduationCap,
    Clock, BookOpen, BarChart2, ChevronDown, ChevronUp,
} from 'lucide-react'
import { SettingSection } from '../shared/SettingSection'
import { SettingRow, ToggleRow } from '../shared/SettingRow'
import { SaveBar } from '../shared/SaveButton'
import {
    DEFAULT_CLASSES,
    DEFAULT_SECTIONS,
    DEFAULT_GRADE_SCALE,
} from '@/lib/academicDefaults'    // ← PURE DATA — SAFE
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

interface AcademicTabProps {
    academic: IAcademicConfig
    onSaved: (updated: IAcademicConfig) => void
}

export function AcademicTab({ academic, onSaved }: AcademicTabProps) {
    const [form, setForm] = useState<IAcademicConfig>({ ...academic })
    const [isDirty, setIsDirty] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // Expanded sections on UI
    const [expandedGroup, setExpandedGroup] = useState<ClassGroup | null>(null)

    const update = <K extends keyof IAcademicConfig>(
        field: K,
        val: IAcademicConfig[K]
    ) => {
        setForm((prev) => ({ ...prev, [field]: val }))
        setIsDirty(true)
        setError(null)
    }

    // ── Save ──
    const handleSave = async () => {
        setSaving(true)
        setError(null)
        setSuccess(null)

        try {
            const res = await fetch('/api/settings/academic', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to save')

            setIsDirty(false)
            setSuccess('Academic settings saved successfully')
            onSaved(form)

        } catch (err: any) {
            setError(err.message || 'Save failed')
            throw err
        } finally {
            setSaving(false)
        }
    }

    const handleDiscard = () => {
        setForm({ ...academic })
        setIsDirty(false)
        setError(null)
        setSuccess(null)
    }

    // ── Class helpers ──
    const toggleClass = (index: number) => {
        const updated = [...form.classes]
        updated[index] = { ...updated[index], isActive: !updated[index].isActive }
        update('classes', updated)
    }

    const resetClasses = () => {
        update('classes', DEFAULT_CLASSES)
    }

    // ── Section helpers ──
    const addSection = () => {
        const names = ['D', 'E', 'F', 'G', 'H']
        const existing = form.sections.map((s) => s.name.toUpperCase())
        const next = names.find((n) => !existing.includes(n))
        if (!next) return
        update('sections', [
            ...form.sections,
            { name: next, isActive: true },
        ])
    }

    const removeSection = (index: number) => {
        if (form.sections.length <= 1) {
            setError('At least one section is required')
            return
        }
        update(
            'sections',
            form.sections.filter((_, i) => i !== index)
        )
    }

    const toggleSection = (index: number) => {
        const updated = [...form.sections]
        updated[index] = {
            ...updated[index],
            isActive: !updated[index].isActive,
        }
        update('sections', updated)
    }

    // ── Subjects helpers ──
    const getSubjectsForGroup = (
        group: ClassGroup,
        stream?: string
    ): string[] => {
        const entry = form.subjects.find(
            (s) =>
                s.classGroup === group &&
                (stream ? s.stream === stream : !s.stream)
        )
        return entry?.subjectList || []
    }

    const updateSubjects = (
        group: ClassGroup,
        subjectList: string[],
        stream?: string
    ) => {
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
    }

    // ── Grade scale helpers ──
    const addGrade = () => {
        const newGrade: IGradeScale = {
            grade: '',
            minMarks: 0,
            maxMarks: 100,
            gradePoint: 0,
            description: '',
        }
        update('gradeScale', [...(form.gradeScale || []), newGrade])
    }

    const removeGrade = (index: number) => {
        update(
            'gradeScale',
            (form.gradeScale || []).filter((_, i) => i !== index)
        )
    }

    const updateGrade = (
        index: number,
        field: keyof IGradeScale,
        val: any
    ) => {
        const updated = [...(form.gradeScale || [])]
        updated[index] = { ...updated[index], [field]: val }
        update('gradeScale', updated)
    }

    const yearOptions = getAcademicYearOptions()

    return (
        <div className="space-y-5 portal-content-enter">

            {/* Alerts */}
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
                            onChange={(e) => update('currentAcademicYear', e.target.value)}
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
                                update('academicYearStartMonth', parseInt(e.target.value))
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

                    <SettingRow label="Lunch Start">
                        <input
                            type="time"
                            value={form.schoolTimings?.lunchBreak?.start || ''}
                            onChange={(e) =>
                                update('schoolTimings', {
                                    ...form.schoolTimings,
                                    lunchBreak: {
                                        start: e.target.value,
                                        end: form.schoolTimings?.lunchBreak?.end ?? '',  // ✅ fallback ''
                                    },
                                })
                            }
                            className="input-clean"
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
                                        start: form.schoolTimings?.lunchBreak?.start ?? '',  // ✅ fallback ''
                                        end: e.target.value,
                                    },
                                })
                            }
                            className="input-clean"
                        />
                    </SettingRow>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[var(--border)]">
                    <SettingRow
                        label="Working Days/Week"
                        description="5 or 6 days"
                    >
                        <div className="flex gap-2">
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
                                    update('attendanceThreshold', parseInt(e.target.value) || 75)
                                }
                                className="input-clean"
                            />
                            <span
                                className="
                  absolute right-3 top-1/2 -translate-y-1/2
                  text-sm text-[var(--text-muted)]
                "
                            >
                                %
                            </span>
                        </div>
                    </SettingRow>
                </div>
            </SettingSection>

            {/* ── Classes ── */}
            <SettingSection
                title="Classes & Sections"
                description="Enable/disable classes and manage sections"
                headerAction={
                    <button
                        type="button"
                        onClick={resetClasses}
                        className="btn-ghost btn-sm text-xs"
                    >
                        Reset to Default
                    </button>
                }
            >
                {/* Class Groups */}
                <div className="space-y-3">
                    {CLASS_GROUPS.map((group) => {
                        const groupClasses = form.classes.filter(
                            (c) => c.group === group.key
                        )
                        const isExpanded = expandedGroup === group.key

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
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div
                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                            style={{ background: group.color }}
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
                                            {groupClasses.filter((c) => c.isActive).length}/
                                            {groupClasses.length} active
                                        </span>
                                        {isExpanded
                                            ? <ChevronUp size={14} />
                                            : <ChevronDown size={14} />
                                        }
                                    </div>
                                </button>

                                {/* Class Toggles */}
                                {isExpanded && (
                                    <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                            disabled={form.sections.length >= 8}
                            className="btn-secondary btn-sm"
                        >
                            <Plus size={13} /> Add Section
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
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
                            >
                                <button
                                    type="button"
                                    onClick={() => toggleSection(idx)}
                                    className="hover:opacity-70 transition-opacity"
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
                                    >
                                        <X size={11} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <p className="input-hint mt-2">
                        Click section to toggle active/inactive. Max 8 sections.
                    </p>
                </div>
            </SettingSection>

            {/* ── Subjects ── */}
            <SettingSection
                title="Subjects"
                description="Configure subjects per class group. Sr. Secondary has stream-wise subjects."
            >
                <div className="space-y-4">
                    {CLASS_GROUPS.map((group) => {
                        if (group.key === 'sr_secondary') {
                            // Stream-wise subjects
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
                                                subjects={getSubjectsForGroup(group.key, stream)}
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
            >
                {/* System selector */}
                <div className="grid grid-cols-3 gap-3 mb-5">
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
                        ] as { key: GradingSystem; label: string; desc: string }[]
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
                            />
                            <span
                                className="
                  absolute right-3 top-1/2 -translate-y-1/2
                  text-sm text-[var(--text-muted)]
                "
                            >
                                %
                            </span>
                        </div>
                    </SettingRow>

                    {form.gradingSystem === 'cgpa' && (
                        <SettingRow label="CGPA Scale" description="e.g. 10 for 10-point scale">
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
                            />
                        </SettingRow>
                    )}
                </div>

                {/* Grade scale editor — only for grades system */}
                {form.gradingSystem === 'grades' && (
                    <div className="mt-5 pt-5 border-t border-[var(--border)]">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-600 text-[var(--text-primary)]">
                                Grade Scale
                            </p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => update('gradeScale', DEFAULT_GRADE_SCALE)}
                                    className="btn-ghost btn-sm text-xs"
                                >
                                    Reset Default
                                </button>
                                <button
                                    type="button"
                                    onClick={addGrade}
                                    className="btn-secondary btn-sm"
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
                                >
                                    <div className="col-span-2">
                                        <input
                                            type="text"
                                            value={grade.grade}
                                            onChange={(e) =>
                                                updateGrade(idx, 'grade', e.target.value.toUpperCase())
                                            }
                                            placeholder="A+"
                                            maxLength={3}
                                            className="input-clean text-center text-sm font-700 px-2 py-1"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={grade.minMarks}
                                            onChange={(e) =>
                                                updateGrade(idx, 'minMarks', parseInt(e.target.value) || 0)
                                            }
                                            className="input-clean text-sm px-2 py-1"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={grade.maxMarks}
                                            onChange={(e) =>
                                                updateGrade(idx, 'maxMarks', parseInt(e.target.value) || 0)
                                            }
                                            className="input-clean text-sm px-2 py-1"
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
                                                    idx, 'gradePoint',
                                                    parseFloat(e.target.value) || 0
                                                )
                                            }
                                            className="input-clean text-sm px-2 py-1"
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

            <SaveBar
                isDirty={isDirty}
                onSave={handleSave}
                onDiscard={handleDiscard}
                saving={saving}
            />
        </div>
    )
}

// ── Subject Editor — inline chip editor ──
interface SubjectEditorProps {
    label: string
    subjects: string[]
    onChange: (subjects: string[]) => void
}

function SubjectEditor({ label, subjects, onChange }: SubjectEditorProps) {
    const [input, setInput] = useState('')

    const addSubject = () => {
        const trimmed = input.trim()
        if (!trimmed || subjects.includes(trimmed)) {
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
            <div className="flex flex-wrap gap-1.5 mb-2">
                {subjects.map((sub, idx) => (
                    <span
                        key={idx}
                        className="
              inline-flex items-center gap-1
              bg-[var(--bg-card)] border border-[var(--border)]
              rounded-[var(--radius-full)]
              px-2.5 py-1 text-xs text-[var(--text-secondary)]
            "
                    >
                        {sub}
                        <button
                            type="button"
                            onClick={() => removeSubject(idx)}
                            className="
                text-[var(--text-muted)] hover:text-[var(--danger)]
                transition-colors
              "
                        >
                            <X size={10} />
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
                        if (e.key === 'Enter') { e.preventDefault(); addSubject() }
                    }}
                    placeholder="Add subject..."
                    className="input-clean text-xs py-1.5 flex-1"
                    maxLength={50}
                />
                <button
                    type="button"
                    onClick={addSubject}
                    disabled={!input.trim()}
                    className="btn-secondary btn-sm text-xs px-3"
                >
                    <Plus size={12} />
                </button>
            </div>
        </div>
    )
}

// X icon import fix
function X({ size, className }: { size: number; className?: string }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M18 6 6 18M6 6l12 12" />
        </svg>
    )
}