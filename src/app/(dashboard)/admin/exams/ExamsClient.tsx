// FILE: src/app/(dashboard)/admin/exams/ExamsClient.tsx
// PRODUCTION READY — Design system applied
// Features:
//   - Exam list with filters
//   - Create exam modal
//   - Status update
//   - Result publish toggle
//   - Delete exam
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
} from 'lucide-react'
import { Portal } from '@/components/ui/Portal'
import { getAcademicYears, getCurrentAcademicYear } from '@/lib/academicYear'

// ══════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════

interface SubjectConfig {
    name: string
    date: string
    time: string
    duration: number
    maxMarks: number
    minMarks: number
}

interface Exam {
    _id: string
    name: string
    class: string
    section?: string
    academicYear: string
    status: 'upcoming' | 'ongoing' | 'completed'
    resultPublished: boolean
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
]

const INITIAL_FORM = {
    name: '',
    class: '',
    section: '',
    academicYear: getCurrentAcademicYear(),
    subjects: [
        {
            name: 'Mathematics', date: '', time: '10:00 AM',
            duration: 180, maxMarks: 100, minMarks: 33,
        },
    ] as SubjectConfig[],
}

// ══════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════

function statusConfig(s: string) {
    const map: Record<string, { variant: any; label: string; icon: any }> = {
        upcoming: { variant: 'info', label: 'Upcoming', icon: Clock },
        ongoing: { variant: 'warning', label: 'Ongoing', icon: ClipboardList },
        completed: { variant: 'success', label: 'Completed', icon: CheckCircle },
    }
    return map[s] ?? { variant: 'default', label: s, icon: Clock }
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

    // Filters
    const [filterClass, setFilterClass] = useState('')
    const [filterYear, setFilterYear] = useState(getCurrentAcademicYear())
    const [filterStatus, setFilterStatus] = useState('')

    const academicYears = getAcademicYears()

    // ── Stats ──
    const stats = {
        total: exams.length,
        upcoming: exams.filter(e => e.status === 'upcoming').length,
        ongoing: exams.filter(e => e.status === 'ongoing').length,
        completed: exams.filter(e => e.status === 'completed').length,
        published: exams.filter(e => e.resultPublished).length,
    }

    // ── Fetch ──
    const fetchExams = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (filterClass) params.set('class', filterClass)
            if (filterYear) params.set('academicYear', filterYear)
            if (filterStatus) params.set('status', filterStatus)

            const res = await fetch(`/api/exams?${params}`)
            const data = await res.json()
            setExams(data.exams ?? [])
        } catch (err) {
            console.error('[EXAMS]', err)
        } finally {
            setLoading(false)
        }
    }, [filterClass, filterYear, filterStatus])

    useEffect(() => { fetchExams() }, [fetchExams])

    // ── Actions ──
    const togglePublish = async (exam: Exam) => {
        try {
            const res = await fetch(`/api/exams/${exam._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resultPublished: !exam.resultPublished,
                }),
            })
            if (!res.ok) throw new Error('Failed to update')
            setAlert({
                type: 'success',
                msg: `Results ${!exam.resultPublished ? 'published' : 'unpublished'}!`,
            })
            fetchExams()
        } catch {
            setAlert({ type: 'error', msg: 'Failed to update result status' })
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
            if (!res.ok) throw new Error('Failed to delete')
            setAlert({ type: 'success', msg: 'Exam deleted successfully!' })
            fetchExams()
        } catch {
            setAlert({ type: 'error', msg: 'Failed to delete exam' })
        }
    }

    // ── Render ──
    return (
        <div className="portal-content-enter">

            {/* Header */}
            <PageHeader
                title="Exams & Results"
                subtitle="Schedule exams, enter marks, and publish report cards"
                action={
                    <Button onClick={() => setShowAdd(true)}>
                        <Plus size={15} /> Schedule Exam
                    </Button>
                }
            />

            {/* Alert */}
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
                <StatCard
                    label="Total Exams"
                    value={stats.total}
                    icon={<BookOpen size={20} />}
                    color="primary"
                />
                <StatCard
                    label="Upcoming"
                    value={stats.upcoming}
                    icon={<Clock size={20} />}
                    color="info"
                />
                <StatCard
                    label="Completed"
                    value={stats.completed}
                    icon={<CheckCircle size={20} />}
                    color="success"
                />
                <StatCard
                    label="Results Published"
                    value={stats.published}
                    icon={<ClipboardList size={20} />}
                    color="warning"
                />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-5">
                <Select
                    label=""
                    value={filterClass}
                    onChange={e => setFilterClass(e.target.value)}
                    options={[
                        { value: '', label: 'All Classes' },
                        ...CLASSES.map(c => ({ value: c, label: `Class ${c}` })),
                    ]}
                />
                <Select
                    label=""
                    value={filterYear}
                    onChange={e => setFilterYear(e.target.value)}
                    options={academicYears.map(y => ({ value: y, label: y }))}
                />
                <Select
                    label=""
                    value={filterStatus}
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
                    description="Schedule your first exam to start entering marks and publishing results"
                    action={
                        <Button onClick={() => setShowAdd(true)}>
                            <Plus size={14} /> Schedule Exam
                        </Button>
                    }
                />
            ) : (
                <Card padding={false}>
                    <Table
                        headers={[
                            'Exam Name', 'Class', 'Year',
                            'Subjects', 'Status', 'Results', 'Actions',
                        ]}
                    >
                        {exams.map(ex => {
                            const sc = statusConfig(ex.status)
                            const Icon = sc.icon

                            return (
                                <Tr key={ex._id}>
                                    {/* Name */}
                                    <Td>
                                        <p className="font-semibold text-[var(--text-primary)] text-sm">
                                            {ex.name}
                                        </p>
                                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                            {ex.subjects.length} subjects
                                        </p>
                                    </Td>

                                    {/* Class */}
                                    <Td>
                                        <Badge variant="primary">
                                            Class {ex.class}
                                            {ex.section ? ` - ${ex.section}` : ''}
                                        </Badge>
                                    </Td>

                                    {/* Year */}
                                    <Td className="text-sm text-[var(--text-muted)]">
                                        {ex.academicYear}
                                    </Td>

                                    {/* Subjects */}
                                    <Td>
                                        <div className="flex flex-wrap gap-1 max-w-[160px]">
                                            {ex.subjects.slice(0, 3).map(s => (
                                                <span
                                                    key={s.name}
                                                    className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                                                >
                                                    {s.name}
                                                </span>
                                            ))}
                                            {ex.subjects.length > 3 && (
                                                <span className="text-[10px] text-[var(--text-muted)]">
                                                    +{ex.subjects.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </Td>

                                    {/* Status */}
                                    <Td>
                                        <select
                                            value={ex.status}
                                            onChange={e => updateStatus(ex, e.target.value)}
                                            className="text-xs px-2 py-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] cursor-pointer"
                                        >
                                            <option value="upcoming">Upcoming</option>
                                            <option value="ongoing">Ongoing</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </Td>

                                    {/* Results Published */}
                                    <Td>
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
                                                : <><EyeOff size={11} /> Unpublished</>
                                            }
                                        </button>
                                    </Td>

                                    {/* Actions */}
                                    <Td>
                                        <div className="flex items-center gap-2">
                                            <a
                                                href={`/admin/exams/${ex._id}/marks`}
                                                className="flex items-center gap-1 text-xs text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium transition-colors"
                                            >
                                                Enter Marks
                                                <ChevronRight size={12} />
                                            </a>
                                            <button
                                                onClick={() => deleteExam(ex)}
                                                className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors p-1"
                                                title="Delete exam"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </Td>
                                </Tr>
                            )
                        })}
                    </Table>
                </Card>
            )}

            {/* Add Exam Modal */}
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
            </Portal>

        </div>
    )
}

// ══════════════════════════════════════════════════════════
// Add Exam Modal
// ══════════════════════════════════════════════════════════

function AddExamModal({
    open, onClose, onSuccess,
}: {
    open: boolean
    onClose: () => void
    onSuccess: () => void
}) {
    const [form, setForm] = useState(INITIAL_FORM)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const academicYears = getAcademicYears()

    const resetForm = () => setForm(INITIAL_FORM)

    const addSubject = () => {
        setForm(f => ({
            ...f,
            subjects: [
                ...f.subjects,
                {
                    name: '', date: '', time: '10:00 AM',
                    duration: 180, maxMarks: 100, minMarks: 33,
                },
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/exams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const data = await res.json()

            if (!res.ok) {
                setError(data.error ?? 'Failed to create exam')
                return
            }

            resetForm()
            onSuccess()
        } catch {
            setError('Network error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            open={open}
            onClose={() => { onClose(); resetForm() }}
            title="Schedule New Exam"
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Row 1: Name + Year */}
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        label="Exam Name *"
                        placeholder="e.g. Half Yearly 2025-26"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        required
                    />
                    <Select
                        label="Academic Year *"
                        value={form.academicYear}
                        onChange={e => setForm(f => ({ ...f, academicYear: e.target.value }))}
                        options={academicYears.map(y => ({ value: y, label: y }))}
                    />
                </div>

                {/* Row 2: Class + Section */}
                <div className="grid grid-cols-2 gap-3">
                    <Select
                        label="Class *"
                        value={form.class}
                        onChange={e => setForm(f => ({ ...f, class: e.target.value }))}
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

                {/* Subjects */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="input-label">
                            Subjects *
                        </label>
                        <button
                            type="button"
                            onClick={addSubject}
                            className="text-xs text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium transition-colors"
                        >
                            + Add Subject
                        </button>
                    </div>

                    {/* Column headers */}
                    <div className="grid grid-cols-12 gap-2 mb-1 px-1">
                        {['Subject Name', 'Date', 'Time', 'Max Marks', 'Pass Marks', ''].map((h, i) => (
                            <span
                                key={i}
                                className={`text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide
                  ${i === 0 ? 'col-span-3' : i === 5 ? 'col-span-1' : 'col-span-2'}
                `}
                            >
                                {h}
                            </span>
                        ))}
                    </div>

                    <div className="space-y-2">
                        {form.subjects.map((sub, idx) => (
                            <div
                                key={idx}
                                className="grid grid-cols-12 gap-2 items-center p-2.5 bg-[var(--bg-muted)] rounded-[var(--radius-md)]"
                            >
                                {/* Subject name */}
                                <div className="col-span-3">
                                    <input
                                        list="subject-suggestions"
                                        className="input-base w-full h-8 px-2 text-xs"
                                        placeholder="Subject name"
                                        value={sub.name}
                                        onChange={e => updateSubject(idx, 'name', e.target.value)}
                                        required
                                    />
                                    <datalist id="subject-suggestions">
                                        {SUBJECTS_DEFAULT.map(s => (
                                            <option key={s} value={s} />
                                        ))}
                                    </datalist>
                                </div>

                                {/* Date */}
                                <div className="col-span-2">
                                    <input
                                        type="date"
                                        className="input-base w-full h-8 px-2 text-xs"
                                        value={sub.date}
                                        onChange={e => updateSubject(idx, 'date', e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Time */}
                                <div className="col-span-2">
                                    <input
                                        type="text"
                                        className="input-base w-full h-8 px-2 text-xs"
                                        placeholder="10:00 AM"
                                        value={sub.time}
                                        onChange={e => updateSubject(idx, 'time', e.target.value)}
                                    />
                                </div>

                                {/* Max Marks */}
                                <div className="col-span-2">
                                    <input
                                        type="number"
                                        min={1}
                                        className="input-base w-full h-8 px-2 text-xs text-center"
                                        placeholder="100"
                                        value={sub.maxMarks || ''}
                                        onChange={e => updateSubject(idx, 'maxMarks', Number(e.target.value))}
                                        required
                                    />
                                </div>

                                {/* Min Marks */}
                                <div className="col-span-2">
                                    <input
                                        type="number"
                                        min={0}
                                        max={sub.maxMarks}
                                        className="input-base w-full h-8 px-2 text-xs text-center"
                                        placeholder="33"
                                        value={sub.minMarks || ''}
                                        onChange={e => updateSubject(idx, 'minMarks', Number(e.target.value))}
                                        required
                                    />
                                </div>

                                {/* Remove */}
                                <div className="col-span-1 flex justify-center">
                                    {form.subjects.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeSubject(idx)}
                                            className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {error && <Alert type="error" message={error} />}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
                    <Button
                        variant="ghost"
                        type="button"
                        onClick={() => { onClose(); resetForm() }}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" loading={loading}>
                        Schedule Exam
                    </Button>
                </div>
            </form>
        </Modal>
    )
}