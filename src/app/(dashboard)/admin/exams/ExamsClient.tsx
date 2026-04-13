// src/app/(dashboard)/admin/exams/ExamsClient.tsx
// UPGRADED: Results view link + Admit card toggle + Composite marks in modal
// ═══════════════════════════════════════════════════════════

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    PageHeader, Button, Badge, Card, Table, Tr, Td,
    Modal, Input, Select, Alert, EmptyState, Spinner, StatCard,
} from '@/components/ui'
import {
    BookOpen, Plus, ClipboardList, CheckCircle,
    Clock, Trash2, Eye, EyeOff, ChevronRight,
    BarChart3, FileText, Minus,
    Pencil,
} from 'lucide-react'
import { Portal } from '@/components/ui/Portal'
import { getAcademicYears, getCurrentAcademicYear } from '@/lib/academicYear'

// ══════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════

interface SubjectComponent {
    name: string
    maxMarks: number
}

interface SubjectConfig {
    name: string
    date: string
    time: string
    duration: number
    totalMaxMarks: number
    minMarks: number
    components: SubjectComponent[]
    isGradeOnly: boolean
}

interface Exam {
    _id: string
    name: string
    class: string
    section?: string
    academicYear: string
    status: 'upcoming' | 'ongoing' | 'completed'
    resultPublished: boolean
    admitCardEnabled: boolean
    subjects: SubjectConfig[]
    createdAt: string
}

// ══════════════════════════════════════════════════════════
// Constants
// ══════════════════════════════════════════════════════════

const CLASSES = [
    'Nursery', 'LKG', 'UKG',
    '1', '2', '3', '4', '5', '6',
    '7', '8', '9', '10', '11', '12',
]
const SECTIONS = ['A', 'B', 'C', 'D', 'E']
const SUBJECTS_DEFAULT = [
    'Mathematics', 'English', 'Hindi', 'Science',
    'Social Science', 'Computer', 'Sanskrit',
    'Drawing', 'Physical Education',
]

// Composite component presets
const COMPONENT_PRESETS: Record<string, SubjectComponent[]> = {
    'Theory Only': [{ name: 'Theory', maxMarks: 100 }],
    'Theory + Assignment': [
        { name: 'Theory', maxMarks: 80 },
        { name: 'Assignment', maxMarks: 20 },
    ],
    'Theory + Practical': [
        { name: 'Theory', maxMarks: 70 },
        { name: 'Practical', maxMarks: 30 },
    ],
    'Theory + Practical + Internal': [
        { name: 'Theory', maxMarks: 70 },
        { name: 'Practical', maxMarks: 20 },
        { name: 'Internal', maxMarks: 10 },
    ],
    'Theory + Assignment + Viva': [
        { name: 'Theory', maxMarks: 70 },
        { name: 'Assignment', maxMarks: 20 },
        { name: 'Viva', maxMarks: 10 },
    ],
    'Full Composite': [
        { name: 'Theory', maxMarks: 60 },
        { name: 'Practical', maxMarks: 20 },
        { name: 'Assignment', maxMarks: 10 },
        { name: 'Viva', maxMarks: 10 },
    ],
}

const makeDefaultSubject = (): SubjectConfig => ({
    name: '',
    date: '',
    time: '10:00 AM',
    duration: 180,
    totalMaxMarks: 100,
    minMarks: 33,
    components: [],
    isGradeOnly: false,
})

const INITIAL_FORM = {
    name: '',
    class: '',
    section: '',
    academicYear: getCurrentAcademicYear(),
    subjects: [makeDefaultSubject()],
    admitCardEnabled: false,
    examCenter: '',
    instructions: [] as string[],
}

interface EditForm {
    name: string
    status: 'upcoming' | 'ongoing' | 'completed'
    resultPublished: boolean
    admitCardEnabled: boolean
    examCenter: string
    instructions: string[]
    subjects: Array<{
        name: string
        date: string
        time: string
        minMarks: number
        totalMaxMarks: number
        isGradeOnly: boolean
        components: Array<{ name: string; maxMarks: number }>
    }>
}

// ══════════════════════════════════════════════════════════
// Status config
// ══════════════════════════════════════════════════════════

function statusConfig(s: string) {
    const map: Record<string, { label: string }> = {
        upcoming: { label: 'Upcoming' },
        ongoing: { label: 'Ongoing' },
        completed: { label: 'Completed' },
    }
    return map[s] ?? { label: s }
}

// ══════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════

export default function ExamsClient() {
    const [exams, setExams] = useState<Exam[]>([])
    const [loading, setLoading] = useState(true)
    const [showAdd, setShowAdd] = useState(false)
    const [alert, setAlert] = useState<{
        type: 'success' | 'error'; msg: string
    } | null>(null)

    const [filterClass, setFilterClass] = useState('')
    const [filterYear, setFilterYear] = useState(getCurrentAcademicYear())
    const [filterStatus, setFilterStatus] = useState('')
    const [editingExam, setEditingExam] = useState<Exam | null>(null)

    const academicYears = getAcademicYears()

    const stats = {
        total: exams.length,
        upcoming: exams.filter(e => e.status === 'upcoming').length,
        completed: exams.filter(e => e.status === 'completed').length,
        published: exams.filter(e => e.resultPublished).length,
    }

    const fetchExams = useCallback(async () => {
        setLoading(true)
        try {
            const p = new URLSearchParams()
            if (filterClass) p.set('class', filterClass)
            if (filterYear) p.set('academicYear', filterYear)
            if (filterStatus) p.set('status', filterStatus)

            const res = await fetch(`/api/exams?${p}`)
            const data = await res.json()
            setExams(data.exams ?? [])
        } catch (err) {
            console.error('[EXAMS]', err)
        } finally {
            setLoading(false)
        }
    }, [filterClass, filterYear, filterStatus])

    useEffect(() => { fetchExams() }, [fetchExams])

    const togglePublish = async (exam: Exam) => {
        try {
            const res = await fetch(`/api/exams/${exam._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resultPublished: !exam.resultPublished }),
            })
            if (!res.ok) throw new Error('Failed')
            setAlert({
                type: 'success',
                msg: `Results ${!exam.resultPublished ? 'published' : 'unpublished'}!`,
            })
            fetchExams()
        } catch {
            setAlert({ type: 'error', msg: 'Failed to update' })
        }
    }

    const toggleAdmitCard = async (exam: Exam) => {
        try {
            await fetch(`/api/exams/${exam._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admitCardEnabled: !exam.admitCardEnabled }),
            })
            fetchExams()
        } catch {
            setAlert({ type: 'error', msg: 'Failed to update admit card setting' })
        }
    }

    const updateStatus = async (exam: Exam, status: string) => {
        try {
            await fetch(`/api/exams/${exam._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            })
            fetchExams()
        } catch {
            setAlert({ type: 'error', msg: 'Failed to update status' })
        }
    }

    const deleteExam = async (exam: Exam) => {
        if (!confirm(`Delete "${exam.name}"? All marks will be deleted.`)) return
        try {
            const res = await fetch(`/api/exams/${exam._id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed')
            setAlert({ type: 'success', msg: 'Exam deleted!' })
            fetchExams()
        } catch {
            setAlert({ type: 'error', msg: 'Failed to delete exam' })
        }
    }

    return (
        <div className="portal-content-enter">

            <PageHeader
                title="Exams & Results"
                subtitle="Schedule exams, enter marks, publish results & admit cards"
                action={
                    <Button onClick={() => setShowAdd(true)}>
                        <Plus size={15} /> Schedule Exam
                    </Button>
                }
            />

            {alert && (
                <div className="mb-5">
                    <Alert
                        type={alert.type}
                        message={alert.msg}
                        onClose={() => setAlert(null)}
                    />
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total Exams" value={stats.total} icon={<BookOpen size={20} />} color="primary" />
                <StatCard label="Upcoming" value={stats.upcoming} icon={<Clock size={20} />} color="info" />
                <StatCard label="Completed" value={stats.completed} icon={<CheckCircle size={20} />} color="success" />
                <StatCard label="Results Published" value={stats.published} icon={<ClipboardList size={20} />} color="warning" />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-5">
                <Select
                    label="" value={filterClass}
                    onChange={e => setFilterClass(e.target.value)}
                    options={[
                        { value: '', label: 'All Classes' },
                        ...CLASSES.map(c => ({ value: c, label: `Class ${c}` })),
                    ]}
                />
                <Select
                    label="" value={filterYear}
                    onChange={e => setFilterYear(e.target.value)}
                    options={academicYears.map(y => ({ value: y, label: y }))}
                />
                <Select
                    label="" value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    options={[
                        { value: '', label: 'All Status' },
                        { value: 'upcoming', label: 'Upcoming' },
                        { value: 'ongoing', label: 'Ongoing' },
                        { value: 'completed', label: 'Completed' },
                    ]}
                />
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <Spinner size="lg" />
                </div>
            ) : exams.length === 0 ? (
                <EmptyState
                    icon={<BookOpen size={24} />}
                    title="No exams scheduled"
                    description="Schedule your first exam to get started"
                    action={
                        <Button onClick={() => setShowAdd(true)}>
                            <Plus size={14} /> Schedule Exam
                        </Button>
                    }
                />
            ) : (
                <Card padding={false}>
                    <div className="table-wrapper">
                        <table className="portal-table">
                            <thead>
                                <tr>
                                    {['Exam Name', 'Class', 'Status', 'Results',
                                        'Admit Card', 'Actions'].map(h => (
                                            <th key={h}>{h}</th>
                                        ))}
                                </tr>
                            </thead>
                            <tbody>
                                {exams.map(ex => (
                                    <tr key={ex._id}>

                                        {/* Name */}
                                        <td>
                                            <p className="font-semibold text-[var(--text-primary)] text-sm">
                                                {ex.name}
                                            </p>
                                            <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                                {ex.subjects.length} subjects · {ex.academicYear}
                                            </p>
                                        </td>

                                        {/* Class */}
                                        <td>
                                            <span className="badge badge-brand">
                                                Class {ex.class}
                                                {ex.section ? ` - ${ex.section}` : ''}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td>
                                            <select
                                                value={ex.status}
                                                onChange={e => updateStatus(ex, e.target.value)}
                                                className="text-xs px-2 py-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] cursor-pointer"
                                            >
                                                <option value="upcoming">Upcoming</option>
                                                <option value="ongoing">Ongoing</option>
                                                <option value="completed">Completed</option>
                                            </select>
                                        </td>

                                        {/* Results Published */}
                                        <td>
                                            <button
                                                onClick={() => togglePublish(ex)}
                                                className={[
                                                    'flex items-center gap-1.5 text-xs px-2.5 py-1.5',
                                                    'rounded-[var(--radius-sm)] border transition-all font-medium',
                                                    ex.resultPublished
                                                        ? 'bg-[var(--success-light)] border-[var(--success)] text-[var(--success-dark)]'
                                                        : 'bg-[var(--bg-muted)] border-[var(--border)] text-[var(--text-muted)]',
                                                ].join(' ')}
                                            >
                                                {ex.resultPublished
                                                    ? <><Eye size={11} /> Published</>
                                                    : <><EyeOff size={11} /> Unpublished</>}
                                            </button>
                                        </td>

                                        {/* Admit Card */}
                                        <td>
                                            <button
                                                onClick={() => toggleAdmitCard(ex)}
                                                className={[
                                                    'flex items-center gap-1.5 text-xs px-2.5 py-1.5',
                                                    'rounded-[var(--radius-sm)] border transition-all font-medium',
                                                    ex.admitCardEnabled
                                                        ? 'bg-[var(--info-light)] border-[var(--info)] text-[var(--info-dark)]'
                                                        : 'bg-[var(--bg-muted)] border-[var(--border)] text-[var(--text-muted)]',
                                                ].join(' ')}
                                            >
                                                <FileText size={11} />
                                                {ex.admitCardEnabled ? 'Enabled' : 'Disabled'}
                                            </button>
                                        </td>

                                        {/* Actions */}
                                        {/* Actions column — existing code mein Edit button add karo */}
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={`/admin/exams/${ex._id}/marks`}
                                                    className="flex items-center gap-1 text-xs text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium transition-colors"
                                                >
                                                    Marks <ChevronRight size={12} />
                                                </a>
                                                <a
                                                    href={`/admin/exams/${ex._id}/results`}
                                                    className="flex items-center gap-1 text-xs text-[var(--info-dark)] hover:opacity-80 font-medium transition-colors"
                                                >
                                                    <BarChart3 size={12} /> Results
                                                </a>

                                                {/* ← NEW: Edit button */}
                                                <button
                                                    onClick={() => setEditingExam(ex)}
                                                    className="text-[var(--text-muted)] hover:text-[var(--primary-500)] transition-colors p-1"
                                                    title="Edit exam"
                                                >
                                                    <Pencil size={14} />
                                                </button>

                                                <button
                                                    onClick={() => deleteExam(ex)}
                                                    className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors p-1"
                                                    title="Delete exam"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <Portal>
                <AddExamModal
                    open={showAdd}
                    onClose={() => setShowAdd(false)}
                    onSuccess={() => {
                        setShowAdd(false)
                        fetchExams()
                        setAlert({ type: 'success', msg: 'Exam scheduled successfully!' })
                    }}
                />
                <EditExamModal
                    exam={editingExam}
                    onClose={() => setEditingExam(null)}
                    onSuccess={() => {
                        setEditingExam(null)
                        fetchExams()
                        setAlert({ type: 'success', msg: 'Exam updated successfully!' })
                    }}
                />
            </Portal>
        </div>
    )
}

// ══════════════════════════════════════════════════════════
// Add Exam Modal — Composite marks support
// ══════════════════════════════════════════════════════════

function AddExamModal({
    open, onClose, onSuccess,
}: {
    open: boolean
    onClose: () => void
    onSuccess: () => void
}) {
    const [form, setForm] = useState({ ...INITIAL_FORM })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [step, setStep] = useState<'basic' | 'subjects' | 'settings'>('basic')

    const academicYears = getAcademicYears()

    const reset = () => {
        setForm({ ...INITIAL_FORM })
        setStep('basic')
        setError('')
    }

    // Auto-set grade-only for nursery classes
    const handleClassChange = (cls: string) => {
        const isNursery = ['Nursery', 'LKG', 'UKG'].includes(cls)
        setForm(f => ({
            ...f,
            class: cls,
            subjects: f.subjects.map(s => ({ ...s, isGradeOnly: isNursery })),
        }))
    }

    const addSubject = () => {
        const isNursery = ['Nursery', 'LKG', 'UKG'].includes(form.class)
        setForm(f => ({
            ...f,
            subjects: [
                ...f.subjects,
                { ...makeDefaultSubject(), isGradeOnly: isNursery },
            ],
        }))
    }

    const removeSubject = (idx: number) => {
        setForm(f => ({
            ...f,
            subjects: f.subjects.filter((_, i) => i !== idx),
        }))
    }

    const updateSubject = (idx: number, key: string, val: any) => {
        setForm(f => ({
            ...f,
            subjects: f.subjects.map((s, i) =>
                i === idx ? { ...s, [key]: val } : s
            ),
        }))
    }

    const applyPreset = (idx: number, presetName: string) => {
        const components = COMPONENT_PRESETS[presetName] || []
        const total = components.reduce((s, c) => s + c.maxMarks, 0)
        setForm(f => ({
            ...f,
            subjects: f.subjects.map((s, i) =>
                i === idx
                    ? { ...s, components, totalMaxMarks: total || s.totalMaxMarks }
                    : s
            ),
        }))
    }

    const updateComponent = (
        subIdx: number,
        compIdx: number,
        key: string,
        val: any
    ) => {
        setForm(f => ({
            ...f,
            subjects: f.subjects.map((s, si) => {
                if (si !== subIdx) return s
                const newComps = s.components.map((c, ci) =>
                    ci === compIdx ? { ...c, [key]: val } : c
                )
                const total = newComps.reduce(
                    (sum, c) => sum + (Number(c.maxMarks) || 0), 0
                )
                return { ...s, components: newComps, totalMaxMarks: total }
            }),
        }))
    }

    // ── Step validation ──────────────────────────────────────
    const validateStep = (currentStep: typeof step): string => {
        if (currentStep === 'basic') {
            if (!form.name.trim()) return 'Exam name required'
            if (!form.class.trim()) return 'Class select karo'
            if (!form.academicYear) return 'Academic year select karo'
        }

        if (currentStep === 'subjects') {
            for (const sub of form.subjects) {
                if (!sub.name.trim()) return 'Subject name required'
                if (sub.isGradeOnly) continue

                const max = sub.components.length > 0
                    ? sub.components.reduce((s, c) => s + (Number(c.maxMarks) || 0), 0)
                    : Number(sub.totalMaxMarks) || 0

                if (max <= 0) {
                    return `"${sub.name || 'Subject'}" ke liye marks 0 se zyada hone chahiye`
                }
                if (!sub.date) {
                    return `"${sub.name}" ki date select karo`
                }
            }
        }

        return ''
    }

    const goNext = () => {
        const err = validateStep(step)
        if (err) { setError(err); return }
        setError('')
        setStep(step === 'basic' ? 'subjects' : 'settings')
    }

    const goBack = () => {
        setError('')
        setStep(step === 'settings' ? 'subjects' : 'basic')
    }

    // ── Final submit ─────────────────────────────────────────
    const handleSubmit = async () => {
        setLoading(true)
        setError('')

        try {
            const payload = {
                ...form,
                subjects: form.subjects.map(s => {
                    const computedMax = s.components.length > 0
                        ? s.components.reduce(
                            (sum, c) => sum + (Number(c.maxMarks) || 0), 0
                        )
                        : Number(s.totalMaxMarks) || 0

                    return {
                        ...s,
                        totalMaxMarks: computedMax,
                        date: s.isGradeOnly
                            ? new Date().toISOString().split('T')[0]
                            : s.date,
                    }
                }),
            }

            const res = await fetch('/api/exams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error ?? 'Failed to create exam')
                return
            }

            reset()
            onSuccess()
        } catch {
            setError('Network error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    // ── Render ───────────────────────────────────────────────
    return (
        <Modal
            open={open}
            onClose={() => { onClose(); reset() }}
            title="Schedule New Exam"
            size="lg"
        >
            {/* 
        KEY FIX: <form> tag NAHI hai yahan
        Sirf div hai — submit button manually handleSubmit call karega
        Isse accidental form submission nahi hogi
      */}
            <div className="space-y-5">

                {/* Step tabs */}
                <div className="flex gap-1 p-1 bg-[var(--bg-muted)] rounded-[var(--radius-md)]">
                    {[
                        { key: 'basic', label: '1. Basic Info' },
                        { key: 'subjects', label: '2. Subjects' },
                        { key: 'settings', label: '3. Settings' },
                    ].map(t => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => {
                                // Sirf peeche ja sakte hain click se
                                // Aage sirf "Next" button se
                                if (
                                    (t.key === 'basic') ||
                                    (t.key === 'subjects' && step === 'settings')
                                ) {
                                    setError('')
                                    setStep(t.key as any)
                                }
                            }}
                            className={[
                                'flex-1 py-1.5 text-xs font-semibold rounded-[var(--radius-sm)] transition-all',
                                step === t.key
                                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                            ].join(' ')}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ── Step 1: Basic ── */}
                {step === 'basic' && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label="Exam Name *"
                                placeholder="e.g. Half Yearly 2025-26"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            />
                            <Select
                                label="Academic Year *"
                                value={form.academicYear}
                                onChange={e => setForm(f => ({
                                    ...f, academicYear: e.target.value,
                                }))}
                                options={academicYears.map(y => ({ value: y, label: y }))}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Select
                                label="Class *"
                                value={form.class}
                                onChange={e => handleClassChange(e.target.value)}
                                options={[
                                    { value: '', label: 'Select Class' },
                                    ...CLASSES.map(c => ({ value: c, label: `Class ${c}` })),
                                ]}
                            />
                            <Select
                                label="Section (optional)"
                                value={form.section}
                                onChange={e => setForm(f => ({ ...f, section: e.target.value }))}
                                options={[
                                    { value: '', label: 'All Sections' },
                                    ...SECTIONS.map(s => ({ value: s, label: `Section ${s}` })),
                                ]}
                            />
                        </div>

                        {['Nursery', 'LKG', 'UKG'].includes(form.class) && (
                            <div className="px-3 py-2.5 rounded-[var(--radius-md)] bg-[var(--info-light)] border border-[rgba(59,130,246,0.2)]">
                                <p className="text-xs text-[var(--info-dark)]">
                                    ℹ️ Nursery/KG ke liye{' '}
                                    <strong>activity-based grade</strong> system use hoga
                                    (Outstanding, Excellent, Good…). Number marks nahi honge.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Step 2: Subjects ── */}
                {step === 'subjects' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="input-label">Subjects *</p>
                            <button
                                type="button"
                                onClick={addSubject}
                                className="text-xs text-[var(--primary-600)] hover:text-[var(--primary-700)] font-semibold"
                            >
                                + Add Subject
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                            {form.subjects.map((sub, idx) => (
                                <div
                                    key={idx}
                                    className="border border-[var(--border)] rounded-[var(--radius-md)] p-3 bg-[var(--bg-subtle)]"
                                >
                                    {/* Subject header */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="flex-1">
                                            <input
                                                list="subject-suggestions"
                                                className="input-clean w-full text-sm h-8"
                                                placeholder="Subject name *"
                                                value={sub.name}
                                                onChange={e => updateSubject(idx, 'name', e.target.value)}
                                                // Enter key se submit prevent
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') e.preventDefault()
                                                }}
                                            />
                                            <datalist id="subject-suggestions">
                                                {SUBJECTS_DEFAULT.map(s => (
                                                    <option key={s} value={s} />
                                                ))}
                                            </datalist>
                                        </div>

                                        <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={sub.isGradeOnly}
                                                onChange={e =>
                                                    updateSubject(idx, 'isGradeOnly', e.target.checked)
                                                }
                                                className="w-3.5 h-3.5 rounded accent-[var(--primary-500)]"
                                            />
                                            <span className="text-xs text-[var(--text-muted)]">
                                                Grade only
                                            </span>
                                        </label>

                                        {form.subjects.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeSubject(idx)}
                                                className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors flex-shrink-0"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                    </div>

                                    {!sub.isGradeOnly && (
                                        <>
                                            {/* Date, Time, Pass marks, Total */}
                                            <div className="grid grid-cols-4 gap-2 mb-3">
                                                <div>
                                                    <label className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">
                                                        Date *
                                                    </label>
                                                    <input
                                                        type="date"
                                                        className="input-clean w-full h-7 text-xs mt-0.5"
                                                        value={sub.date}
                                                        onChange={e =>
                                                            updateSubject(idx, 'date', e.target.value)
                                                        }
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">
                                                        Time
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="input-clean w-full h-7 text-xs mt-0.5"
                                                        placeholder="10:00 AM"
                                                        value={sub.time}
                                                        onChange={e =>
                                                            updateSubject(idx, 'time', e.target.value)
                                                        }
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') e.preventDefault()
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">
                                                        Pass Marks
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        className="input-clean w-full h-7 text-xs text-center mt-0.5"
                                                        placeholder="33"
                                                        value={sub.minMarks || ''}
                                                        onChange={e =>
                                                            updateSubject(idx, 'minMarks', Number(e.target.value))
                                                        }
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">
                                                        Total Marks
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        className="input-clean w-full h-7 text-xs text-center mt-0.5 bg-[var(--bg-muted)]"
                                                        value={
                                                            // Components hain → auto-calculated show karo
                                                            sub.components.length > 0
                                                                ? sub.components.reduce(
                                                                    (s, c) => s + (Number(c.maxMarks) || 0), 0
                                                                )
                                                                : sub.totalMaxMarks || ''
                                                        }
                                                        readOnly={sub.components.length > 0}
                                                        onChange={e => {
                                                            if (sub.components.length === 0) {
                                                                updateSubject(
                                                                    idx, 'totalMaxMarks', Number(e.target.value)
                                                                )
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Component Preset */}
                                            <div className="mb-2">
                                                <label className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">
                                                    Marks Distribution
                                                </label>
                                                <select
                                                    className="input-clean w-full h-10 text-xs mt-0.5"
                                                    value={
                                                        sub.components.length === 0
                                                            ? ''
                                                            : Object.keys(COMPONENT_PRESETS).find(k => {
                                                                const preset = COMPONENT_PRESETS[k]
                                                                return (
                                                                    preset.length === sub.components.length &&
                                                                    preset.every(
                                                                        (p, i) => p.name === sub.components[i]?.name
                                                                    )
                                                                )
                                                            }) ?? 'custom'
                                                    }
                                                    onChange={e => {
                                                        if (e.target.value === '') {
                                                            // Simple mode → components clear
                                                            setForm(f => ({
                                                                ...f,
                                                                subjects: f.subjects.map((s, si) =>
                                                                    si === idx
                                                                        ? { ...s, components: [] }
                                                                        : s
                                                                ),
                                                            }))
                                                        } else {
                                                            applyPreset(idx, e.target.value)
                                                        }
                                                    }}
                                                >
                                                    <option value="">
                                                        Simple (Single marks field)
                                                    </option>
                                                    {Object.keys(COMPONENT_PRESETS).map(p => (
                                                        <option key={p} value={p}>{p}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Component breakdown */}
                                            {sub.components.length > 0 && (
                                                <div className="space-y-1.5 mt-2 pl-2 border-l-2 border-[var(--primary-200)]">
                                                    {sub.components.map((comp, ci) => (
                                                        <div key={ci} className="flex items-center gap-2">
                                                            <input
                                                                className="input-clean h-6 text-xs flex-1"
                                                                value={comp.name}
                                                                onChange={e =>
                                                                    updateComponent(idx, ci, 'name', e.target.value)
                                                                }
                                                                placeholder="Component name"
                                                                onKeyDown={e => {
                                                                    if (e.key === 'Enter') e.preventDefault()
                                                                }}
                                                            />
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                className="input-clean h-6 text-xs w-16 text-center"
                                                                value={comp.maxMarks || ''}
                                                                onChange={e =>
                                                                    updateComponent(
                                                                        idx, ci, 'maxMarks', Number(e.target.value)
                                                                    )
                                                                }
                                                            />
                                                            <span className="text-[10px] text-[var(--text-muted)]">
                                                                marks
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newComps = sub.components.filter(
                                                                        (_, i) => i !== ci
                                                                    )
                                                                    const total = newComps.reduce(
                                                                        (s, c) => s + Number(c.maxMarks), 0
                                                                    )
                                                                    setForm(f => ({
                                                                        ...f,
                                                                        subjects: f.subjects.map((s, si) =>
                                                                            si === idx
                                                                                ? {
                                                                                    ...s,
                                                                                    components: newComps,
                                                                                    totalMaxMarks: total || s.totalMaxMarks,
                                                                                }
                                                                                : s
                                                                        ),
                                                                    }))
                                                                }}
                                                                className="text-[var(--text-muted)] hover:text-[var(--danger)] flex-shrink-0"
                                                            >
                                                                <Minus size={11} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <p className="text-[10px] text-[var(--primary-600)] font-semibold">
                                                        Total:{' '}
                                                        {sub.components.reduce(
                                                            (s, c) => s + (Number(c.maxMarks) || 0), 0
                                                        )}{' '}
                                                        marks
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Step 3: Settings ── */}
                {step === 'settings' && (
                    <div className="space-y-4">
                        {/* Admit Card toggle */}
                        <div className="flex items-center justify-between p-3 bg-[var(--bg-muted)] rounded-[var(--radius-md)]">
                            <div>
                                <p className="text-sm font-semibold text-[var(--text-primary)]">
                                    Admit Card
                                </p>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                    Students admit card generate kar sakenge
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.admitCardEnabled}
                                    onChange={e =>
                                        setForm(f => ({ ...f, admitCardEnabled: e.target.checked }))
                                    }
                                    className="sr-only"
                                />
                                <div className={[
                                    'w-10 h-6 rounded-full transition-colors',
                                    form.admitCardEnabled
                                        ? 'bg-[var(--primary-500)]'
                                        : 'bg-[var(--border-strong)]',
                                ].join(' ')}>
                                    <div className={[
                                        'absolute top-0.5 left-0.5 w-5 h-5 bg-white',
                                        'rounded-full shadow-sm transition-transform',
                                        form.admitCardEnabled ? 'translate-x-4' : '',
                                    ].join(' ')} />
                                </div>
                            </label>
                        </div>

                        <Input
                            label="Exam Center (optional)"
                            placeholder="e.g. Main Hall, Block A"
                            value={form.examCenter}
                            onChange={e =>
                                setForm(f => ({ ...f, examCenter: e.target.value }))
                            }
                        />

                        <div>
                            <label className="input-label">
                                Custom Instructions (optional)
                            </label>
                            <textarea
                                className="input-clean w-full mt-1 text-sm"
                                rows={4}
                                placeholder="Enter each instruction on a new line..."
                                value={form.instructions.join('\n')}
                                onChange={e =>
                                    setForm(f => ({
                                        ...f,
                                        instructions: e.target.value
                                            .split('\n')
                                            .map(l => l.trim())
                                            .filter(Boolean),
                                    }))
                                }
                            />
                            <p className="input-hint">
                                Blank rahne par default instructions use honge.
                            </p>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && <Alert type="error" message={error} />}

                {/* ── Navigation buttons ── */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                    <div>
                        {step !== 'basic' && (
                            <button
                                type="button"
                                onClick={goBack}
                                className="btn-ghost btn-sm"
                            >
                                ← Back
                            </button>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => { onClose(); reset() }}
                            disabled={loading}
                            className="btn-ghost"
                        >
                            Cancel
                        </button>

                        {step !== 'settings' ? (
                            /* Next button — type="button" explicitly */
                            <button
                                type="button"
                                onClick={goNext}
                                className="btn-primary"
                            >
                                Next →
                            </button>
                        ) : (
                            /* Submit button — sirf Step 3 pe */
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="btn-primary"
                            >
                                {loading ? 'Scheduling...' : 'Schedule Exam'}
                            </button>
                        )}
                    </div>
                </div>

            </div>
            {/* No </form> tag — intentional */}
        </Modal>
    )
}



// EditExamModal — ExamsClient.tsx ke end mein add karo
// ═══════════════════════════════════════════════════════════

function EditExamModal({
    exam,
    onClose,
    onSuccess,
}: {
    exam: Exam | null
    onClose: () => void
    onSuccess: () => void
}) {
    const [form, setForm] = useState<EditForm | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [tab, setTab] = useState<'info' | 'subjects' | 'settings'>('info')

    // Exam change hone par form reset karo
    useEffect(() => {
        if (!exam) { setForm(null); setTab('info'); setError(''); return }

        setForm({
            name: exam.name,
            status: exam.status,
            resultPublished: exam.resultPublished,
            admitCardEnabled: exam.admitCardEnabled ?? false,
            examCenter: (exam as any).examCenter ?? '',
            instructions: (exam as any).instructions ?? [],
            subjects: exam.subjects.map(s => ({
                name: s.name,
                date: s.date
                    ? new Date(s.date).toISOString().split('T')[0]
                    : '',
                time: s.time || '10:00 AM',
                minMarks: s.minMarks ?? 33,
                totalMaxMarks: s.totalMaxMarks ?? (s as any).maxMarks ?? 100,
                isGradeOnly: s.isGradeOnly ?? false,
                components: (s.components ?? []).map(c => ({
                    name: c.name,
                    maxMarks: c.maxMarks,
                })),
            })),
        })
        setTab('info')
        setError('')
    }, [exam])

    if (!exam || !form) return null

    // ── Subject update helpers ─────────────────────────────

    const updateSubject = (idx: number, key: string, val: any) => {
        setForm(f => {
            if (!f) return f
            return {
                ...f,
                subjects: f.subjects.map((s, i) =>
                    i === idx ? { ...s, [key]: val } : s
                ),
            }
        })
    }

    const updateComponent = (
        subIdx: number,
        compIdx: number,
        key: string,
        val: any
    ) => {
        setForm(f => {
            if (!f) return f
            return {
                ...f,
                subjects: f.subjects.map((s, si) => {
                    if (si !== subIdx) return s
                    const newComps = s.components.map((c, ci) =>
                        ci === compIdx ? { ...c, [key]: val } : c
                    )
                    const total = newComps.reduce(
                        (sum, c) => sum + (Number(c.maxMarks) || 0), 0
                    )
                    return { ...s, components: newComps, totalMaxMarks: total }
                }),
            }
        })
    }

    // ── Submit ─────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!form) return
        setLoading(true)
        setError('')

        try {
            // Build subjects with computed totalMaxMarks
            const subjects = form.subjects.map(s => ({
                ...s,
                totalMaxMarks: s.components.length > 0
                    ? s.components.reduce(
                        (sum, c) => sum + (Number(c.maxMarks) || 0), 0
                    )
                    : Number(s.totalMaxMarks) || 0,
                date: s.isGradeOnly
                    ? new Date().toISOString().split('T')[0]
                    : s.date,
            }))

            // Validate
            for (const sub of subjects) {
                if (sub.isGradeOnly) continue
                if (!sub.date) {
                    setError(`"${sub.name}" ki date select karo`)
                    setLoading(false)
                    return
                }
                if (sub.totalMaxMarks <= 0) {
                    setError(`"${sub.name}" ke liye marks 0 se zyada hone chahiye`)
                    setLoading(false)
                    return
                }
            }

            const res = await fetch(`/api/exams/${exam._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name.trim(),
                    status: form.status,
                    resultPublished: form.resultPublished,
                    admitCardEnabled: form.admitCardEnabled,
                    examCenter: form.examCenter,
                    instructions: form.instructions,
                    subjects,           // ← subjects bhi update honge
                }),
            })

            const data = await res.json()
            if (!res.ok) {
                setError(data.error ?? 'Failed to update exam')
                return
            }

            onSuccess()
        } catch {
            setError('Network error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            open={!!exam}
            onClose={onClose}
            title={`Edit — ${exam.name}`}
            size="lg"
        >
            <div className="space-y-5">

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-[var(--bg-muted)] rounded-[var(--radius-md)]">
                    {[
                        { key: 'info', label: 'Basic Info' },
                        { key: 'subjects', label: 'Subjects' },
                        { key: 'settings', label: 'Settings' },
                    ].map(t => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => { setTab(t.key as any); setError('') }}
                            className={[
                                'flex-1 py-1.5 text-xs font-semibold rounded-[var(--radius-sm)] transition-all',
                                tab === t.key
                                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                            ].join(' ')}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ── Tab 1: Basic Info ── */}
                {tab === 'info' && (
                    <div className="space-y-3">

                        <Input
                            label="Exam Name *"
                            value={form.name}
                            onChange={e => setForm(f => f ? { ...f, name: e.target.value } : f)}
                            placeholder="e.g. Half Yearly 2025-26"
                        />

                        {/* Class/Section/Year — readonly, sirf info ke liye */}
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="input-label">Class</label>
                                <div className="input-clean bg-[var(--bg-muted)] text-[var(--text-muted)] cursor-not-allowed">
                                    Class {exam.class}{exam.section ? ` - ${exam.section}` : ''}
                                </div>
                            </div>
                            <div>
                                <label className="input-label">Academic Year</label>
                                <div className="input-clean bg-[var(--bg-muted)] text-[var(--text-muted)] cursor-not-allowed">
                                    {exam.academicYear}
                                </div>
                            </div>
                            <div>
                                <label className="input-label">Subjects</label>
                                <div className="input-clean bg-[var(--bg-muted)] text-[var(--text-muted)] cursor-not-allowed">
                                    {exam.subjects.length} subjects
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-[var(--text-muted)] bg-[var(--bg-muted)] px-3 py-2 rounded-[var(--radius-sm)]">
                            ℹ️ Class, Section aur Academic Year edit nahi ho sakte — data integrity ke liye.
                            Subject dates, marks aur settings "Subjects" tab se change kar sakte hain.
                        </p>

                        <Select
                            label="Exam Status"
                            value={form.status}
                            onChange={e => setForm(f =>
                                f ? { ...f, status: e.target.value as any } : f
                            )}
                            options={[
                                { value: 'upcoming', label: 'Upcoming' },
                                { value: 'ongoing', label: 'Ongoing' },
                                { value: 'completed', label: 'Completed' },
                            ]}
                        />

                        {/* Toggles */}
                        <div className="space-y-2">
                            {/* Result Published */}
                            <div className="flex items-center justify-between p-3 bg-[var(--bg-muted)] rounded-[var(--radius-md)]">
                                <div>
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                                        Results Published
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                        Student aur parent portal pe dikhega
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.resultPublished}
                                        onChange={e => setForm(f =>
                                            f ? { ...f, resultPublished: e.target.checked } : f
                                        )}
                                        className="sr-only"
                                    />
                                    <div className={[
                                        'w-10 h-6 rounded-full transition-colors',
                                        form.resultPublished
                                            ? 'bg-[var(--success)]'
                                            : 'bg-[var(--border-strong)]',
                                    ].join(' ')}>
                                        <div className={[
                                            'absolute top-0.5 left-0.5 w-5 h-5 bg-white',
                                            'rounded-full shadow-sm transition-transform',
                                            form.resultPublished ? 'translate-x-4' : '',
                                        ].join(' ')} />
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Tab 2: Subjects ── */}
                {tab === 'subjects' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="input-label mb-0">
                                Subject Details
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                                Subject add/remove nahi hoga — sirf details update honge
                            </p>
                        </div>

                        <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                            {form.subjects.map((sub, idx) => (
                                <div
                                    key={idx}
                                    className="border border-[var(--border)] rounded-[var(--radius-md)] p-3 bg-[var(--bg-subtle)]"
                                >
                                    {/* Subject name — readonly */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                                                {sub.name}
                                                {sub.isGradeOnly && (
                                                    <span className="ml-2 text-xs text-[var(--primary-500)] font-normal">
                                                        (Grade only)
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        {/* Components total badge */}
                                        {sub.components.length > 0 && (
                                            <span className="text-xs bg-[var(--primary-50)] text-[var(--primary-600)] border border-[var(--primary-200)] px-2 py-0.5 rounded-full font-semibold">
                                                {sub.components.reduce(
                                                    (s, c) => s + (Number(c.maxMarks) || 0), 0
                                                )} marks
                                            </span>
                                        )}
                                    </div>

                                    {!sub.isGradeOnly && (
                                        <>
                                            {/* Date + Time + Pass marks */}
                                            <div className="grid grid-cols-3 gap-2 mb-3">
                                                <div>
                                                    <label className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">
                                                        Exam Date
                                                    </label>
                                                    <input
                                                        type="date"
                                                        className="input-clean w-full h-7 text-xs mt-0.5"
                                                        value={sub.date}
                                                        onChange={e =>
                                                            updateSubject(idx, 'date', e.target.value)
                                                        }
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">
                                                        Time
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="input-clean w-full h-7 text-xs mt-0.5"
                                                        placeholder="10:00 AM"
                                                        value={sub.time}
                                                        onChange={e =>
                                                            updateSubject(idx, 'time', e.target.value)
                                                        }
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">
                                                        Pass Marks
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        className="input-clean w-full h-7 text-xs text-center mt-0.5"
                                                        value={sub.minMarks || ''}
                                                        onChange={e =>
                                                            updateSubject(
                                                                idx, 'minMarks', Number(e.target.value)
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            {/* Simple mode — single marks field */}
                                            {sub.components.length === 0 && (
                                                <div>
                                                    <label className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">
                                                        Max Marks
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        className="input-clean w-24 h-7 text-xs text-center mt-0.5"
                                                        value={sub.totalMaxMarks || ''}
                                                        onChange={e =>
                                                            updateSubject(
                                                                idx, 'totalMaxMarks', Number(e.target.value)
                                                            )
                                                        }
                                                    />
                                                </div>
                                            )}

                                            {/* Composite components */}
                                            {sub.components.length > 0 && (
                                                <div className="space-y-1.5 pl-2 border-l-2 border-[var(--primary-200)]">
                                                    <p className="text-[10px] text-[var(--text-muted)] font-semibold uppercase mb-1">
                                                        Marks Breakdown
                                                    </p>
                                                    {sub.components.map((comp, ci) => (
                                                        <div
                                                            key={ci}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <span className="text-xs text-[var(--text-secondary)] flex-1 font-medium">
                                                                {comp.name}
                                                            </span>
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                className="input-clean h-6 text-xs w-16 text-center"
                                                                value={comp.maxMarks || ''}
                                                                onChange={e =>
                                                                    updateComponent(
                                                                        idx, ci,
                                                                        'maxMarks', Number(e.target.value)
                                                                    )
                                                                }
                                                            />
                                                            <span className="text-[10px] text-[var(--text-muted)]">
                                                                marks
                                                            </span>
                                                        </div>
                                                    ))}
                                                    <p className="text-[10px] text-[var(--primary-600)] font-bold mt-1">
                                                        Total:{' '}
                                                        {sub.components.reduce(
                                                            (s, c) => s + (Number(c.maxMarks) || 0), 0
                                                        )}{' '}
                                                        marks
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Tab 3: Settings ── */}
                {tab === 'settings' && (
                    <div className="space-y-4">

                        {/* Admit Card toggle */}
                        <div className="flex items-center justify-between p-3 bg-[var(--bg-muted)] rounded-[var(--radius-md)]">
                            <div>
                                <p className="text-sm font-semibold text-[var(--text-primary)]">
                                    Admit Card
                                </p>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                    Students admit card download kar sakenge
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.admitCardEnabled}
                                    onChange={e => setForm(f =>
                                        f ? { ...f, admitCardEnabled: e.target.checked } : f
                                    )}
                                    className="sr-only"
                                />
                                <div className={[
                                    'w-10 h-6 rounded-full transition-colors',
                                    form.admitCardEnabled
                                        ? 'bg-[var(--primary-500)]'
                                        : 'bg-[var(--border-strong)]',
                                ].join(' ')}>
                                    <div className={[
                                        'absolute top-0.5 left-0.5 w-5 h-5 bg-white',
                                        'rounded-full shadow-sm transition-transform',
                                        form.admitCardEnabled ? 'translate-x-4' : '',
                                    ].join(' ')} />
                                </div>
                            </label>
                        </div>

                        <Input
                            label="Exam Center (optional)"
                            placeholder="e.g. Main Hall, Block A"
                            value={form.examCenter}
                            onChange={e => setForm(f =>
                                f ? { ...f, examCenter: e.target.value } : f
                            )}
                        />

                        <div>
                            <label className="input-label">
                                Custom Instructions (optional)
                            </label>
                            <textarea
                                className="input-clean w-full mt-1 text-sm"
                                rows={5}
                                placeholder="Enter each instruction on a new line..."
                                value={form.instructions.join('\n')}
                                onChange={e => setForm(f =>
                                    f ? {
                                        ...f,
                                        instructions: e.target.value
                                            .split('\n')
                                            .map(l => l.trim())
                                            .filter(Boolean),
                                    } : f
                                )}
                            />
                            <p className="input-hint">
                                Blank rahne par default instructions use honge admit card mein.
                            </p>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && <Alert type="error" message={error} />}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="btn-ghost"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

            </div>
        </Modal>
    )
}