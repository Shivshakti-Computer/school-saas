'use client'

import { useState, useCallback, useRef } from 'react'
import {
    Clock, Plus, Save, Trash2, X,
    ChevronDown, Copy, Printer,
    AlertTriangle, CheckCircle2,
    Coffee, BookOpen,
} from 'lucide-react'
import { PageHeader, Button, Spinner, EmptyState } from '@/components/ui'
import { getCurrentAcademicYear } from '@/lib/academicYear'
import { Portal } from '@/components/ui/Portal'

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const DAYS = [
    'monday', 'tuesday', 'wednesday',
    'thursday', 'friday', 'saturday',
] as const

const DAY_LABELS: Record<string, string> = {
    monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
    thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday',
}

// Indian school standard classes
const CLASSES = [
    'Nursery', 'LKG', 'UKG',
    '1', '2', '3', '4', '5', '6',
    '7', '8', '9', '10', '11', '12',
]
const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F']

// Common subjects
const COMMON_SUBJECTS = [
    'Mathematics', 'English', 'Hindi', 'Science',
    'Social Studies', 'Computer', 'Physical Education',
    'Art & Craft', 'Music', 'Sanskrit', 'Moral Science',
    'EVS', 'Biology', 'Physics', 'Chemistry',
    'Accountancy', 'Economics', 'History', 'Geography',
    'Lunch Break', 'Recess', 'Assembly',
]

type Day = typeof DAYS[number]

interface IPeriod {
    periodNo: number
    startTime: string
    endTime: string
    subject: string
    teacherId?: string
    teacherName?: string
    isBreak?: boolean
    breakLabel?: string
}

interface IDaySchedule {
    day: Day
    periods: IPeriod[]
}

interface ITimetableDoc {
    _id: string
    class: string
    section: string
    academicYear: string
    days: IDaySchedule[]
}

interface Teacher {
    _id: string
    name: string
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function timeToMins(t: string): number {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
}

function calcDuration(start: string, end: string): string {
    const diff = timeToMins(end) - timeToMins(start)
    if (diff <= 0) return ''
    return `${diff}min`
}

// Subject → color mapping
const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    Mathematics: { bg: '#EEF2FF', text: '#3730A3', border: '#C7D2FE' },
    English: { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
    Hindi: { bg: '#FFF7ED', text: '#9A3412', border: '#FED7AA' },
    Science: { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
    Physics: { bg: '#F0FDF4', text: '#14532D', border: '#BBF7D0' },
    Chemistry: { bg: '#FDF4FF', text: '#6B21A8', border: '#E9D5FF' },
    Biology: { bg: '#ECFDF5', text: '#065F46', border: '#6EE7B7' },
    'Social Studies': { bg: '#FFFBEB', text: '#78350F', border: '#FDE68A' },
    Computer: { bg: '#F0F9FF', text: '#0C4A6E', border: '#BAE6FD' },
    'Physical Education': { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
    'Lunch Break': { bg: '#FEF9C3', text: '#713F12', border: '#FDE047' },
    Recess: { bg: '#FEF9C3', text: '#713F12', border: '#FDE047' },
    Assembly: { bg: '#F5F3FF', text: '#4C1D95', border: '#DDD6FE' },
}

function getSubjectColor(subject: string) {
    return SUBJECT_COLORS[subject] ?? { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0' }
}

const isBreakSubject = (subject: string) =>
    ['Lunch Break', 'Recess', 'Assembly', 'Break'].includes(subject)

// ─────────────────────────────────────────────
// Period Card
// ─────────────────────────────────────────────
function PeriodCard({
    period,
    onRemove,
    canEdit,
}: {
    period: IPeriod
    onRemove: () => void
    canEdit: boolean
}) {
    const color = getSubjectColor(period.subject)
    const duration = calcDuration(period.startTime, period.endTime)
    const isBreak = period.isBreak || isBreakSubject(period.subject)

    return (
        <div
            className="relative group rounded-xl p-3 transition-all duration-150 border"
            style={{
                background: color.bg,
                borderColor: color.border,
                minHeight: '88px',
            }}
        >
            {/* Remove btn */}
            {canEdit && (
                <button
                    onClick={onRemove}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center
                     opacity-0 group-hover:opacity-100 transition-all duration-150 z-10"
                    style={{ backgroundColor: '#EF4444', color: '#fff' }}
                    title="Remove period"
                >
                    <X size={10} />
                </button>
            )}

            {/* Period number */}
            <div className="flex items-center justify-between mb-1.5">
                <span
                    className="text-[0.5625rem] font-bold uppercase tracking-wider"
                    style={{ color: color.text, opacity: 0.6 }}
                >
                    {isBreak ? (
                        <Coffee size={9} className="inline mr-0.5" />
                    ) : (
                        `P${period.periodNo}`
                    )}
                </span>
                {duration && (
                    <span
                        className="text-[0.5rem] font-medium"
                        style={{ color: color.text, opacity: 0.5 }}
                    >
                        {duration}
                    </span>
                )}
            </div>

            {/* Subject */}
            <p
                className="text-[0.8125rem] font-bold leading-tight mb-1 truncate"
                style={{ color: color.text }}
            >
                {period.subject}
            </p>

            {/* Time */}
            <p
                className="text-[0.625rem] font-medium flex items-center gap-1"
                style={{ color: color.text, opacity: 0.65 }}
            >
                <Clock size={9} />
                {period.startTime}–{period.endTime}
            </p>

            {/* Teacher */}
            {period.teacherName && !isBreak && (
                <p
                    className="text-[0.5625rem] mt-1 truncate"
                    style={{ color: color.text, opacity: 0.55 }}
                >
                    {period.teacherName}
                </p>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────
// Add Period Modal
// ─────────────────────────────────────────────
function AddPeriodModal({
    day,
    nextPeriodNo,
    teachers,
    onAdd,
    onClose,
}: {
    day: string
    nextPeriodNo: number
    teachers: Teacher[]
    onAdd: (p: IPeriod) => void
    onClose: () => void
}) {
    const [form, setForm] = useState<{
        subject: string
        customSubj: string
        startTime: string
        endTime: string
        teacherId: string
        isBreak: boolean
    }>({
        subject: '',
        customSubj: '',
        startTime: '09:00',
        endTime: '09:45',
        teacherId: '',
        isBreak: false,
    })
    const [error, setError] = useState('')

    const finalSubject = form.subject === '__custom__'
        ? form.customSubj.trim()
        : form.subject

    const handleAdd = () => {
        setError('')
        if (!finalSubject) {
            setError('Subject is required')
            return
        }
        if (!form.startTime || !form.endTime) {
            setError('Start and end time are required')
            return
        }
        if (timeToMins(form.endTime) <= timeToMins(form.startTime)) {
            setError('End time must be after start time')
            return
        }

        const isBreak = form.isBreak || isBreakSubject(finalSubject)
        const teacher = teachers.find(t => t._id === form.teacherId)

        onAdd({
            periodNo: nextPeriodNo,
            subject: finalSubject,
            startTime: form.startTime,
            endTime: form.endTime,
            teacherId: form.teacherId || undefined,
            teacherName: teacher?.name,
            isBreak,
            breakLabel: isBreak ? finalSubject : undefined,
        })
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(30,27,75,0.45)', backdropFilter: 'blur(6px)' }}
        >
            <div
                className="w-full max-w-md rounded-2xl overflow-hidden"
                style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-xl)',
                    animation: 'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1) forwards',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-5 py-4 border-b"
                    style={{ borderColor: 'var(--border)' }}
                >
                    <div>
                        <h3
                            className="text-base font-bold font-display"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            Add Period
                        </h3>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {DAY_LABELS[day]} · Period {nextPeriodNo}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                        style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-4">

                    {error && (
                        <div
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                            style={{ background: 'var(--danger-light)', color: 'var(--danger-dark)' }}
                        >
                            <AlertTriangle size={14} />
                            {error}
                        </div>
                    )}

                    {/* Subject */}
                    <div>
                        <label
                            className="block text-xs font-semibold mb-1.5 font-display"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            Subject
                        </label>
                        <div className="relative">
                            <select
                                value={form.subject}
                                onChange={e => {
                                    const v = e.target.value
                                    setForm(f => ({
                                        ...f,
                                        subject: v,
                                        isBreak: isBreakSubject(v),
                                    }))
                                }}
                                className="w-full h-10 px-3 pr-8 text-sm rounded-[var(--radius-md)] border-[1.5px]
                           focus:outline-none appearance-none"
                                style={{
                                    background: 'var(--bg-card)',
                                    borderColor: 'var(--border)',
                                    color: 'var(--text-primary)',
                                }}
                            >
                                <option value="">Select subject</option>
                                <optgroup label="Common Subjects">
                                    {COMMON_SUBJECTS.filter(s => !isBreakSubject(s)).map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Breaks">
                                    {COMMON_SUBJECTS.filter(s => isBreakSubject(s)).map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </optgroup>
                                <option value="__custom__">+ Custom Subject</option>
                            </select>
                            <ChevronDown
                                size={14}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                style={{ color: 'var(--text-muted)' }}
                            />
                        </div>

                        {/* Custom subject input */}
                        {form.subject === '__custom__' && (
                            <input
                                type="text"
                                placeholder="Enter subject name"
                                value={form.customSubj}
                                onChange={e => setForm(f => ({ ...f, customSubj: e.target.value }))}
                                className="mt-2 w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border-[1.5px]
                           focus:outline-none"
                                style={{
                                    background: 'var(--bg-card)',
                                    borderColor: 'var(--border)',
                                    color: 'var(--text-primary)',
                                }}
                                autoFocus
                            />
                        )}
                    </div>

                    {/* Time row */}
                    <div className="grid grid-cols-2 gap-3">
                        {(['startTime', 'endTime'] as const).map(field => (
                            <div key={field}>
                                <label
                                    className="block text-xs font-semibold mb-1.5 font-display"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    {field === 'startTime' ? 'Start Time' : 'End Time'}
                                </label>
                                <input
                                    type="time"
                                    value={form[field]}
                                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                                    className="w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border-[1.5px]
                             focus:outline-none"
                                    style={{
                                        background: 'var(--bg-card)',
                                        borderColor: 'var(--border)',
                                        color: 'var(--text-primary)',
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Duration preview */}
                    {form.startTime && form.endTime &&
                        timeToMins(form.endTime) > timeToMins(form.startTime) && (
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                Duration: <strong>{calcDuration(form.startTime, form.endTime)}</strong>
                            </p>
                        )}

                    {/* Teacher — only for non-break */}
                    {!form.isBreak && !isBreakSubject(finalSubject) && teachers.length > 0 && (
                        <div>
                            <label
                                className="block text-xs font-semibold mb-1.5 font-display"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                Teacher <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={form.teacherId}
                                    onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}
                                    className="w-full h-10 px-3 pr-8 text-sm rounded-[var(--radius-md)] border-[1.5px]
                             focus:outline-none appearance-none"
                                    style={{
                                        background: 'var(--bg-card)',
                                        borderColor: 'var(--border)',
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    <option value="">Select teacher</option>
                                    {teachers.map(t => (
                                        <option key={t._id} value={t._id}>{t.name}</option>
                                    ))}
                                </select>
                                <ChevronDown
                                    size={14}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                    style={{ color: 'var(--text-muted)' }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div
                    className="flex gap-2.5 px-5 py-4 border-t"
                    style={{
                        borderColor: 'var(--border)',
                        background: 'var(--bg-subtle)',
                    }}
                >
                    <button
                        onClick={onClose}
                        className="flex-1 h-10 rounded-[var(--radius-md)] text-sm font-semibold border-[1.5px] transition-all"
                        style={{
                            borderColor: 'var(--border)',
                            color: 'var(--text-secondary)',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAdd}
                        className="flex-1 h-10 rounded-[var(--radius-md)] text-sm font-semibold text-white transition-all"
                        style={{
                            background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                        }}
                    >
                        Add Period
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────
// Copy Timetable Modal
// ─────────────────────────────────────────────
function CopyModal({
    currentClass,
    currentSection,
    timetables,
    onCopy,
    onClose,
}: {
    currentClass: string
    currentSection: string
    timetables: ITimetableDoc[]
    onCopy: (days: IDaySchedule[]) => void
    onClose: () => void
}) {
    const [selected, setSelected] = useState('')

    const others = timetables.filter(
        t => !(t.class === currentClass && t.section === currentSection)
    )

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(30,27,75,0.45)', backdropFilter: 'blur(6px)' }}
        >
            <div
                className="w-full max-w-sm rounded-2xl overflow-hidden"
                style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-xl)',
                    animation: 'scaleIn 0.2s ease forwards',
                }}
            >
                <div
                    className="flex items-center justify-between px-5 py-4 border-b"
                    style={{ borderColor: 'var(--border)' }}
                >
                    <h3 className="text-base font-bold font-display" style={{ color: 'var(--text-primary)' }}>
                        Copy from Another Class
                    </h3>
                    <button onClick={onClose} className="p-1" style={{ color: 'var(--text-muted)' }}>
                        <X size={16} />
                    </button>
                </div>

                <div className="px-5 py-4 space-y-3">
                    {others.length === 0 ? (
                        <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
                            No other timetables found
                        </p>
                    ) : (
                        <>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                Select a class to copy its timetable structure:
                            </p>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                {others.map(t => (
                                    <label
                                        key={t._id}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
                                        style={{
                                            background: selected === t._id
                                                ? 'var(--primary-50)' : 'var(--bg-muted)',
                                            border: selected === t._id
                                                ? '1.5px solid var(--primary-300)'
                                                : '1.5px solid transparent',
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="copy-from"
                                            value={t._id}
                                            checked={selected === t._id}
                                            onChange={() => setSelected(t._id)}
                                            className="accent-[var(--primary-500)]"
                                        />
                                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                            Class {t.class}{t.section ? `-${t.section}` : ''}
                                        </span>
                                        <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
                                            {t.days.reduce((acc, d) => acc + d.periods.length, 0)} periods
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div
                    className="flex gap-2.5 px-5 py-3 border-t"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}
                >
                    <button
                        onClick={onClose}
                        className="flex-1 h-9 rounded-[var(--radius-md)] text-sm font-medium border-[1.5px]"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            const tt = timetables.find(t => t._id === selected)
                            if (tt) onCopy(tt.days)
                            onClose()
                        }}
                        disabled={!selected}
                        className="flex-1 h-9 rounded-[var(--radius-md)] text-sm font-semibold text-white disabled:opacity-50"
                        style={{
                            background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                        }}
                    >
                        Copy Timetable
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────
// MAIN CLIENT COMPONENT
// ─────────────────────────────────────────────
export function TimetableClient({
    initialTimetables,
    academicYear,
    userRole,
}: {
    initialTimetables: ITimetableDoc[]
    academicYear: string
    userRole: string
}) {
    const canEdit = userRole === 'admin' || userRole === 'staff'

    // ── State ──
    const [allTimetables, setAllTimetables] = useState<ITimetableDoc[]>(initialTimetables)
    const [selectedClass, setSelectedClass] = useState(CLASSES[3]) // default '1'
    const [selectedSection, setSelectedSection] = useState('A')
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [teachersLoaded, setTeachersLoaded] = useState(false)

    const [days, setDays] = useState<IDaySchedule[]>(() => initDays(initialTimetables, CLASSES[3], 'A'))
    const [dirty, setDirty] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

    const [addPeriodDay, setAddPeriodDay] = useState<string | null>(null)
    const [showCopy, setShowCopy] = useState(false)
    const [showDelete, setShowDelete] = useState(false)
    const [activeDay, setActiveDay] = useState<Day>('monday')

    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    // ── Init days helper ──
    function initDays(
        tts: ITimetableDoc[],
        cls: string,
        sec: string
    ): IDaySchedule[] {
        const found = tts.find(t => t.class === cls && t.section === sec)
        if (found) return found.days

        return DAYS.map(day => ({ day, periods: [] }))
    }

    // ── Show toast ──
    const showToast = useCallback(
        (type: 'success' | 'error', msg: string) => {
            setToast({ type, msg })
            if (toastTimer.current) clearTimeout(toastTimer.current)
            toastTimer.current = setTimeout(() => setToast(null), 3500)
        },
        []
    )

    // ── Load teachers (lazy — only when needed) ──
    const loadTeachers = useCallback(async () => {
        if (teachersLoaded) return
        try {
            const res = await fetch('/api/staff?role=teacher&limit=100')
            const data = await res.json()
            setTeachers(
                Array.isArray(data) ? data
                    : Array.isArray(data.data) ? data.data
                        : []
            )
        } catch {
            setTeachers([])
        }
        setTeachersLoaded(true)
    }, [teachersLoaded])

    // ── Class / Section change ──
    const handleClassChange = useCallback(
        (cls: string, sec: string) => {
            if (dirty) {
                const ok = confirm('You have unsaved changes. Discard them?')
                if (!ok) return
            }
            setSelectedClass(cls)
            setSelectedSection(sec)
            setDays(initDays(allTimetables, cls, sec))
            setDirty(false)
            setActiveDay('monday')
        },
        [dirty, allTimetables]
    )

    // ── Add period ──
    const handleAddPeriod = useCallback(
        (period: IPeriod) => {
            setDays(prev =>
                prev.map(d => {
                    if (d.day !== addPeriodDay) return d
                    const maxNo = d.periods.reduce((m, p) => Math.max(m, p.periodNo), 0)
                    return {
                        ...d,
                        periods: [...d.periods, { ...period, periodNo: maxNo + 1 }],
                    }
                })
            )
            setDirty(true)
            setAddPeriodDay(null)
        },
        [addPeriodDay]
    )

    // ── Remove period ──
    const handleRemovePeriod = useCallback(
        (day: Day, periodNo: number) => {
            setDays(prev =>
                prev.map(d => {
                    if (d.day !== day) return d
                    const filtered = d.periods.filter(p => p.periodNo !== periodNo)
                    return {
                        ...d,
                        periods: filtered.map((p, i) => ({ ...p, periodNo: i + 1 })),
                    }
                })
            )
            setDirty(true)
        },
        []
    )

    // ── Save ──
    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/timetable', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    class: selectedClass,
                    section: selectedSection,
                    academicYear,
                    days,
                }),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Save failed')

            // Update local cache
            setAllTimetables(prev => {
                const idx = prev.findIndex(
                    t => t.class === selectedClass && t.section === selectedSection
                )
                const updated = { ...json.data, class: selectedClass, section: selectedSection, days }
                if (idx >= 0) {
                    const next = [...prev]
                    next[idx] = updated
                    return next
                }
                return [...prev, updated]
            })

            setDirty(false)
            showToast('success', json.message || 'Timetable saved!')
        } catch (err: any) {
            showToast('error', err.message || 'Failed to save timetable')
        } finally {
            setSaving(false)
        }
    }

    // ── Delete ──
    const handleDelete = async () => {
        setDeleting(true)
        try {
            const params = new URLSearchParams({
                class: selectedClass,
                section: selectedSection,
                academicYear,
            })
            const res = await fetch(`/api/timetable?${params}`, { method: 'DELETE' })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Delete failed')

            setAllTimetables(prev =>
                prev.filter(
                    t => !(t.class === selectedClass && t.section === selectedSection)
                )
            )
            setDays(DAYS.map(day => ({ day, periods: [] })))
            setDirty(false)
            setShowDelete(false)
            showToast('success', 'Timetable deleted')
        } catch (err: any) {
            showToast('error', err.message)
        } finally {
            setDeleting(false)
        }
    }

    // ── Print ──
    const handlePrint = () => window.print()

    // ── Copy from another class ──
    const handleCopy = (sourceDays: IDaySchedule[]) => {
        setDays(sourceDays.map(d => ({ ...d })))
        setDirty(true)
        showToast('success', 'Timetable copied — remember to save!')
    }

    // ── Stats ──
    const currentDay = days.find(d => d.day === activeDay)
    const totalPeriods = days.reduce((s, d) => s + d.periods.length, 0)
    const hasTimetable = totalPeriods > 0

    // ── Existing timetable for current class ──
    const existingTT = allTimetables.find(
        t => t.class === selectedClass && t.section === selectedSection
    )

    return (
        <>
            {/* ── Print styles ── */}
            <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-area { padding: 0 !important; }
          body { background: white; }
        }
      `}</style>

            <div className="space-y-5 pb-8 max-w-[1280px] mx-auto">

                {/* ── PAGE HEADER ── */}
                <div className="portal-page-header no-print">
                    <div>
                        <div className="portal-breadcrumb mb-1">
                            <span style={{ color: 'var(--text-muted)' }}>Admin</span>
                            <span className="bc-sep">/</span>
                            <span className="bc-current">Timetable</span>
                        </div>
                        <h1 className="portal-page-title">Timetable Management</h1>
                        <p className="portal-page-subtitle">
                            Class-wise period scheduling · {academicYear}
                        </p>
                    </div>

                    {canEdit && (
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Copy */}
                            <button
                                onClick={() => setShowCopy(true)}
                                className="flex items-center gap-1.5 px-3 h-9 rounded-[var(--radius-md)]
                           text-sm font-semibold border-[1.5px] transition-all"
                                style={{
                                    borderColor: 'var(--border)',
                                    color: 'var(--text-secondary)',
                                    background: 'var(--bg-card)',
                                }}
                            >
                                <Copy size={14} /> Copy from
                            </button>

                            {/* Print */}
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-1.5 px-3 h-9 rounded-[var(--radius-md)]
                           text-sm font-semibold border-[1.5px] transition-all"
                                style={{
                                    borderColor: 'var(--border)',
                                    color: 'var(--text-secondary)',
                                    background: 'var(--bg-card)',
                                }}
                            >
                                <Printer size={14} /> Print
                            </button>

                            {/* Delete */}
                            {existingTT && (
                                <button
                                    onClick={() => setShowDelete(true)}
                                    className="flex items-center gap-1.5 px-3 h-9 rounded-[var(--radius-md)]
                             text-sm font-semibold transition-all"
                                    style={{
                                        background: 'var(--danger-light)',
                                        color: 'var(--danger-dark)',
                                        border: '1.5px solid rgba(239,68,68,0.2)',
                                    }}
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            )}

                            {/* Save */}
                            <button
                                onClick={handleSave}
                                disabled={saving || !dirty}
                                className="flex items-center gap-1.5 px-4 h-9 rounded-[var(--radius-md)]
                           text-sm font-semibold text-white transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    background: dirty
                                        ? 'linear-gradient(135deg, var(--primary-500), var(--primary-600))'
                                        : 'var(--bg-muted)',
                                    color: dirty ? '#fff' : 'var(--text-muted)',
                                }}
                            >
                                {saving ? (
                                    <>
                                        <Spinner size="sm" />
                                        Saving…
                                    </>
                                ) : (
                                    <>
                                        <Save size={14} />
                                        {dirty ? 'Save Changes' : 'Saved'}
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* ── FILTERS ── */}
                <div
                    className="portal-card no-print"
                    style={{ overflow: 'visible' }}
                >
                    <div className="portal-card-body-sm flex flex-wrap items-end gap-4">

                        {/* Class selector */}
                        <div>
                            <label
                                className="block text-xs font-semibold mb-1.5 font-display"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                Class
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {CLASSES.map(cls => (
                                    <button
                                        key={cls}
                                        onClick={() => handleClassChange(cls, selectedSection)}
                                        className="h-8 px-3 rounded-lg text-xs font-semibold transition-all border-[1.5px]"
                                        style={{
                                            background: selectedClass === cls
                                                ? 'var(--primary-500)' : 'var(--bg-muted)',
                                            color: selectedClass === cls
                                                ? '#fff' : 'var(--text-secondary)',
                                            borderColor: selectedClass === cls
                                                ? 'var(--primary-500)' : 'transparent',
                                        }}
                                    >
                                        {cls}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Section selector */}
                        <div>
                            <label
                                className="block text-xs font-semibold mb-1.5 font-display"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                Section
                            </label>
                            <div className="flex gap-1.5">
                                {SECTIONS.map(sec => (
                                    <button
                                        key={sec}
                                        onClick={() => handleClassChange(selectedClass, sec)}
                                        className="w-9 h-8 rounded-lg text-xs font-bold transition-all border-[1.5px]"
                                        style={{
                                            background: selectedSection === sec
                                                ? 'var(--primary-500)' : 'var(--bg-muted)',
                                            color: selectedSection === sec
                                                ? '#fff' : 'var(--text-secondary)',
                                            borderColor: selectedSection === sec
                                                ? 'var(--primary-500)' : 'transparent',
                                        }}
                                    >
                                        {sec}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="ml-auto flex items-center gap-3">
                            <div className="text-right">
                                <p
                                    className="text-lg font-extrabold tabular-nums"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    {totalPeriods}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    Total Periods
                                </p>
                            </div>
                            <div
                                className="w-px h-8 self-center"
                                style={{ background: 'var(--border)' }}
                            />
                            <div className="text-right">
                                <p
                                    className="text-lg font-extrabold tabular-nums"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    {days.filter(d => d.periods.length > 0).length}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    Days Scheduled
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── UNSAVED INDICATOR ── */}
                {dirty && (
                    <div
                        className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)]
                       text-sm border-[1.5px] no-print"
                        style={{
                            background: 'var(--warning-light)',
                            borderColor: 'rgba(245,158,11,0.3)',
                            color: 'var(--warning-dark)',
                        }}
                    >
                        <AlertTriangle size={14} />
                        You have unsaved changes. Click "Save Changes" to apply.
                    </div>
                )}

                {/* ── DAY TABS ── */}
                <div className="no-print">
                    <div
                        className="flex gap-1 p-1 rounded-[var(--radius-lg)] overflow-x-auto scrollbar-hide"
                        style={{ background: 'var(--bg-muted)' }}
                    >
                        {DAYS.map(day => {
                            const dayData = days.find(d => d.day === day)
                            const periodCount = dayData?.periods.length ?? 0
                            const isActive = activeDay === day
                            return (
                                <button
                                    key={day}
                                    onClick={() => setActiveDay(day)}
                                    className="flex-1 min-w-[80px] flex flex-col items-center gap-0.5 px-3 py-2
                             rounded-[var(--radius-md)] text-xs font-semibold transition-all
                             whitespace-nowrap"
                                    style={{
                                        background: isActive ? 'var(--bg-card)' : 'transparent',
                                        color: isActive ? 'var(--primary-600)' : 'var(--text-muted)',
                                        boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                                    }}
                                >
                                    <span>{DAY_LABELS[day].slice(0, 3)}</span>
                                    {periodCount > 0 && (
                                        <span
                                            className="text-[0.5rem] px-1.5 py-0.5 rounded-full font-bold"
                                            style={{
                                                background: isActive ? 'var(--primary-100)' : 'var(--border)',
                                                color: isActive ? 'var(--primary-600)' : 'var(--text-muted)',
                                            }}
                                        >
                                            {periodCount}
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* ── ACTIVE DAY CONTENT ── */}
                <div className="portal-card print-area">
                    {/* Card Header */}
                    <div className="portal-card-header">
                        <div>
                            <h2 className="portal-card-title">
                                {DAY_LABELS[activeDay]}
                            </h2>
                            <p className="portal-card-subtitle">
                                Class {selectedClass}
                                {selectedSection ? `-${selectedSection}` : ''} ·{' '}
                                {currentDay?.periods.length ?? 0} periods
                            </p>
                        </div>
                        {canEdit && (
                            <button
                                onClick={() => {
                                    loadTeachers()
                                    setAddPeriodDay(activeDay)
                                }}
                                className="flex items-center gap-1.5 px-3 h-8 rounded-[var(--radius-md)]
                           text-xs font-semibold text-white no-print"
                                style={{
                                    background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                                }}
                            >
                                <Plus size={13} /> Add Period
                            </button>
                        )}
                    </div>

                    {/* Periods Grid */}
                    <div className="portal-card-body">
                        {!currentDay || currentDay.periods.length === 0 ? (
                            <div className="portal-empty">
                                <div className="portal-empty-icon">
                                    <Clock size={22} style={{ color: 'var(--text-muted)' }} />
                                </div>
                                <p className="portal-empty-title">No periods for {DAY_LABELS[activeDay]}</p>
                                <p className="portal-empty-text">
                                    {canEdit
                                        ? 'Add periods to build the timetable for this day.'
                                        : 'No schedule set for this day.'}
                                </p>
                                {canEdit && (
                                    <button
                                        onClick={() => {
                                            loadTeachers()
                                            setAddPeriodDay(activeDay)
                                        }}
                                        className="mt-4 flex items-center gap-1.5 px-4 h-9
                               rounded-[var(--radius-md)] text-sm font-semibold text-white"
                                        style={{
                                            background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                                        }}
                                    >
                                        <Plus size={14} /> Add First Period
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                {[...currentDay.periods]
                                    .sort((a, b) => a.periodNo - b.periodNo)
                                    .map(period => (
                                        <PeriodCard
                                            key={period.periodNo}
                                            period={period}
                                            canEdit={canEdit}
                                            onRemove={() =>
                                                handleRemovePeriod(activeDay, period.periodNo)
                                            }
                                        />
                                    ))}

                                {/* Add period placeholder */}
                                {canEdit && (
                                    <button
                                        onClick={() => {
                                            loadTeachers()
                                            setAddPeriodDay(activeDay)
                                        }}
                                        className="rounded-xl border-2 border-dashed flex flex-col items-center
                               justify-center gap-1.5 py-6 transition-all no-print"
                                        style={{
                                            borderColor: 'var(--border)',
                                            color: 'var(--text-muted)',
                                            minHeight: '88px',
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.borderColor = 'var(--primary-300)'
                                            e.currentTarget.style.color = 'var(--primary-500)'
                                            e.currentTarget.style.background = 'var(--primary-50)'
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.borderColor = 'var(--border)'
                                            e.currentTarget.style.color = 'var(--text-muted)'
                                            e.currentTarget.style.background = 'transparent'
                                        }}
                                    >
                                        <Plus size={18} />
                                        <span className="text-xs font-medium">Add Period</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── ALL DAYS OVERVIEW (Print) ── */}
                <div className="hidden print:block">
                    <h2 className="text-lg font-bold mb-4">
                        Timetable — Class {selectedClass}
                        {selectedSection ? `-${selectedSection}` : ''} ({academicYear})
                    </h2>
                    {days.map(d => (
                        <div key={d.day} className="mb-6">
                            <h3 className="text-sm font-bold mb-2 uppercase">{DAY_LABELS[d.day]}</h3>
                            {d.periods.length === 0 ? (
                                <p className="text-xs text-gray-400">No periods</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {[...d.periods]
                                        .sort((a, b) => a.periodNo - b.periodNo)
                                        .map(p => (
                                            <div
                                                key={p.periodNo}
                                                className="border rounded-lg p-2 text-xs"
                                                style={{ minWidth: '100px' }}
                                            >
                                                <div className="font-bold">P{p.periodNo}</div>
                                                <div>{p.subject}</div>
                                                <div className="text-gray-500">{p.startTime}–{p.endTime}</div>
                                                {p.teacherName && (
                                                    <div className="text-gray-400">{p.teacherName}</div>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

            </div>

            <Portal>
                {/* ── MODALS ── */}

                {/* Add Period */}
                {addPeriodDay && (
                    <AddPeriodModal
                        day={addPeriodDay}
                        nextPeriodNo={(days.find(d => d.day === addPeriodDay)?.periods.length ?? 0) + 1}
                        teachers={teachers}
                        onAdd={handleAddPeriod}
                        onClose={() => setAddPeriodDay(null)}
                    />
                )}

                {/* Copy */}
                {showCopy && (
                    <CopyModal
                        currentClass={selectedClass}
                        currentSection={selectedSection}
                        timetables={allTimetables}
                        onCopy={handleCopy}
                        onClose={() => setShowCopy(false)}
                    />
                )}


                {/* Delete Confirm */}
                {showDelete && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: 'rgba(30,27,75,0.45)', backdropFilter: 'blur(6px)' }}
                    >
                        <div
                            className="w-full max-w-sm rounded-2xl overflow-hidden"
                            style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                boxShadow: 'var(--shadow-xl)',
                                animation: 'scaleIn 0.2s ease forwards',
                            }}
                        >
                            <div className="px-5 py-4">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                                    style={{ background: 'var(--danger-light)' }}
                                >
                                    <Trash2 size={22} style={{ color: 'var(--danger)' }} />
                                </div>
                                <h3
                                    className="text-base font-bold font-display mb-1.5"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    Delete Timetable?
                                </h3>
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    This will permanently delete the timetable for{' '}
                                    <strong>Class {selectedClass}-{selectedSection}</strong>.
                                    This action cannot be undone.
                                </p>
                            </div>
                            <div
                                className="flex gap-2.5 px-5 py-3 border-t"
                                style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}
                            >
                                <button
                                    onClick={() => setShowDelete(false)}
                                    className="flex-1 h-10 rounded-[var(--radius-md)] text-sm font-semibold
                           border-[1.5px]"
                                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex-1 h-10 rounded-[var(--radius-md)] text-sm font-semibold
                           text-white flex items-center justify-center gap-2"
                                    style={{
                                        background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                                    }}
                                >
                                    {deleting ? <Spinner size="sm" /> : <Trash2 size={14} />}
                                    {deleting ? 'Deleting…' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}


                {/* ── TOAST ── */}
                {toast && (
                    <div
                        className="fixed bottom-5 right-5 z-[70] flex items-center gap-3
                     px-4 py-3 rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)]
                     border max-w-xs no-print"
                        style={{
                            background: 'var(--bg-card)',
                            borderColor: 'var(--border)',
                            animation: 'toastIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
                        }}
                    >
                        {toast.type === 'success' ? (
                            <CheckCircle2 size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
                        ) : (
                            <AlertTriangle size={18} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                        )}
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {toast.msg}
                        </p>
                        <button
                            onClick={() => setToast(null)}
                            style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
            </Portal>
        </>
    )
}