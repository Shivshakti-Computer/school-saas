// FILE: src/app/(dashboard)/teacher/marks/page.tsx
// ✅ Production-ready — Teacher marks entry
// Teacher sirf apni assigned classes ke exams ke marks enter kar sakta hai

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
    BookOpen, Save, Search, ChevronDown,
    AlertCircle, Check, X,
} from 'lucide-react'
import { PageHeader, Spinner, Alert, Button } from '@/components/ui'

interface Exam {
    _id: string
    title: string
    subject: string
    class: string
    section?: string
    totalMarks: number
    date: string
    status: 'upcoming' | 'ongoing' | 'completed'
}

interface StudentResult {
    studentId: string
    studentName: string
    rollNo: string
    admissionNo: string
    marksObtained: number | null
    isAbsent: boolean
    resultId?: string
}

export default function TeacherMarksPage() {
    const { data: session } = useSession()

    const teacherClasses: string[] =
        (session?.user as any)?.teacherClasses || []
    const teacherSubjects: string[] =
        (session?.user as any)?.teacherSubjects || []

    const [exams, setExams] = useState<Exam[]>([])
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
    const [results, setResults] = useState<StudentResult[]>([])
    const [loadingExams, setLoadingExams] = useState(true)
    const [loadingResults, setLoadingResults] = useState(false)
    const [saving, setSaving] = useState(false)
    const [isDirty, setIsDirty] = useState(false)
    const [alert, setAlert] = useState<{
        type: 'success' | 'error'
        msg: string
    } | null>(null)

    // Auto-clear alert
    useEffect(() => {
        if (alert) {
            const t = setTimeout(() => setAlert(null), 5000)
            return () => clearTimeout(t)
        }
    }, [alert])

    // ── Fetch exams scoped to teacher's classes ──
    useEffect(() => {
        const fetchExams = async () => {
            setLoadingExams(true)
            try {
                const params = new URLSearchParams()
                if (teacherClasses.length > 0) {
                    params.set('classes', teacherClasses.join(','))
                }
                if (teacherSubjects.length > 0) {
                    params.set('subjects', teacherSubjects.join(','))
                }

                const res = await fetch(`/api/exams?${params}`)
                const data = await res.json()
                if (res.ok) {
                    setExams(data.exams || [])
                }
            } catch {
                setAlert({ type: 'error', msg: 'Failed to load exams' })
            }
            setLoadingExams(false)
        }

        if (teacherClasses.length > 0) {
            fetchExams()
        } else {
            setLoadingExams(false)
        }
    }, [teacherClasses.join(','), teacherSubjects.join(',')]) // eslint-disable-line

    // ── Fetch results for selected exam ──
    useEffect(() => {
        if (!selectedExam) return

        const fetchResults = async () => {
            setLoadingResults(true)
            setIsDirty(false)
            try {
                const res = await fetch(
                    `/api/exams/results?examId=${selectedExam._id}`
                )
                const data = await res.json()
                if (res.ok) {
                    setResults(data.results || [])
                }
            } catch {
                setAlert({ type: 'error', msg: 'Failed to load results' })
            }
            setLoadingResults(false)
        }

        fetchResults()
    }, [selectedExam?._id]) // eslint-disable-line

    // ── Update marks ──
    const updateMarks = (
        studentId: string,
        value: string,
        isAbsent?: boolean
    ) => {
        setResults((prev) =>
            prev.map((r) => {
                if (r.studentId !== studentId) return r
                if (isAbsent !== undefined) {
                    return { ...r, isAbsent, marksObtained: isAbsent ? null : r.marksObtained }
                }
                const num = value === '' ? null : parseInt(value)
                return { ...r, marksObtained: num }
            })
        )
        setIsDirty(true)
    }

    // ── Save marks ──
    const handleSave = async () => {
        if (!selectedExam) return

        const invalid = results.find(
            (r) =>
                !r.isAbsent &&
                r.marksObtained !== null &&
                r.marksObtained > selectedExam.totalMarks
        )
        if (invalid) {
            setAlert({
                type: 'error',
                msg: `Marks cannot exceed ${selectedExam.totalMarks} (${invalid.studentName})`,
            })
            return
        }

        setSaving(true)
        try {
            const payload = results.map((r) => ({
                studentId: r.studentId,
                marksObtained: r.isAbsent ? null : r.marksObtained,
                isAbsent: r.isAbsent,
                resultId: r.resultId,
            }))

            const res = await fetch(`/api/exams/${selectedExam._id}/marks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ results: payload }),
            })

            const data = await res.json()
            if (res.ok) {
                setIsDirty(false)
                setAlert({ type: 'success', msg: 'Marks saved successfully!' })
            } else {
                setAlert({ type: 'error', msg: data.error || 'Failed to save' })
            }
        } catch {
            setAlert({ type: 'error', msg: 'Network error' })
        }
        setSaving(false)
    }

    const completedCount = results.filter(
        (r) => r.marksObtained !== null || r.isAbsent
    ).length

    // ── No classes ──
    if (!loadingExams && teacherClasses.length === 0) {
        return (
            <div className="portal-content-enter">
                <PageHeader title="Enter Marks" subtitle="Exam results entry" />
                <div
                    className="portal-card rounded-[var(--radius-lg)] p-10 text-center mt-4"
                >
                    <div
                        className="w-14 h-14 rounded-[var(--radius-xl)] flex items-center justify-center mx-auto mb-4"
                        style={{
                            backgroundColor: 'var(--warning-light)',
                            color: 'var(--warning)',
                        }}
                    >
                        <AlertCircle size={24} />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        No Classes Assigned
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Contact your administrator to assign classes to your account.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="portal-content-enter space-y-4">
            <PageHeader
                title="Enter Marks"
                subtitle="Submit exam results for your classes"
                action={
                    isDirty && selectedExam && (
                        <Button size="sm" onClick={handleSave} disabled={saving}>
                            {saving ? <Spinner size="sm" /> : <Save size={14} />}
                            {saving ? 'Saving...' : 'Save Marks'}
                        </Button>
                    )
                }
            />

            {alert && (
                <Alert
                    type={alert.type}
                    message={alert.msg}
                    onClose={() => setAlert(null)}
                />
            )}

            {/* ── Exam Selector ── */}
            <div className="portal-card rounded-[var(--radius-lg)] p-4">
                <p
                    className="text-xs font-semibold uppercase tracking-wider mb-3"
                    style={{ color: 'var(--text-muted)' }}
                >
                    Select Exam
                </p>

                {loadingExams ? (
                    <div className="flex justify-center py-6">
                        <Spinner size="md" />
                    </div>
                ) : exams.length === 0 ? (
                    <div
                        className="text-center py-6 rounded-[var(--radius-md)]"
                        style={{ backgroundColor: 'var(--bg-muted)' }}
                    >
                        <BookOpen
                            size={24}
                            className="mx-auto mb-2"
                            style={{ color: 'var(--text-muted)' }}
                        />
                        <p
                            className="text-sm"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            No exams found for your classes
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {exams.map((exam) => {
                            const isSelected = selectedExam?._id === exam._id
                            return (
                                <button
                                    key={exam._id}
                                    onClick={() => setSelectedExam(exam)}
                                    className="
                    text-left p-3 rounded-[var(--radius-md)]
                    border transition-all
                  "
                                    style={
                                        isSelected
                                            ? {
                                                borderColor: 'var(--primary-400)',
                                                backgroundColor: 'var(--primary-50)',
                                            }
                                            : {
                                                borderColor: 'var(--border)',
                                                backgroundColor: 'var(--bg-muted)',
                                            }
                                    }
                                >
                                    <p
                                        className="text-sm font-semibold truncate"
                                        style={{
                                            color: isSelected
                                                ? 'var(--primary-700)'
                                                : 'var(--text-primary)',
                                        }}
                                    >
                                        {exam.title}
                                    </p>
                                    <p
                                        className="text-xs mt-0.5"
                                        style={{ color: 'var(--text-muted)' }}
                                    >
                                        {exam.subject} • Class {exam.class}
                                        {exam.section ? `-${exam.section}` : ''} •{' '}
                                        {exam.totalMarks} marks
                                    </p>
                                    <p
                                        className="text-xs mt-0.5"
                                        style={{ color: 'var(--text-muted)' }}
                                    >
                                        {new Date(exam.date).toLocaleDateString('en-IN')}
                                    </p>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* ── Results Entry ── */}
            {selectedExam && (
                <div className="portal-card rounded-[var(--radius-lg)] overflow-hidden">
                    <div className="portal-card-header">
                        <div>
                            <p className="portal-card-title">{selectedExam.title}</p>
                            <p className="portal-card-subtitle">
                                {selectedExam.subject} • Class {selectedExam.class} •
                                Max: {selectedExam.totalMarks} marks
                            </p>
                        </div>
                        {results.length > 0 && (
                            <span
                                className="
                  text-xs font-semibold px-2.5 py-1
                  rounded-[var(--radius-full)]
                "
                                style={{
                                    backgroundColor: 'var(--primary-50)',
                                    color: 'var(--primary-600)',
                                }}
                            >
                                {completedCount}/{results.length} filled
                            </span>
                        )}
                    </div>

                    {loadingResults ? (
                        <div className="flex justify-center py-12">
                            <Spinner size="lg" />
                        </div>
                    ) : results.length === 0 ? (
                        <div className="portal-empty">
                            <div className="portal-empty-icon">
                                <BookOpen size={22} />
                            </div>
                            <p className="portal-empty-title">No Students</p>
                            <p className="portal-empty-text">
                                No students found for this exam
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div
                                className="grid grid-cols-12 gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider"
                                style={{
                                    backgroundColor: 'var(--bg-muted)',
                                    color: 'var(--text-muted)',
                                    borderBottom: '1px solid var(--border)',
                                }}
                            >
                                <div className="col-span-1">#</div>
                                <div className="col-span-2">Roll</div>
                                <div className="col-span-4">Name</div>
                                <div className="col-span-3">
                                    Marks/{selectedExam.totalMarks}
                                </div>
                                <div className="col-span-2">Absent</div>
                            </div>

                            <div className="divide-y divide-[var(--border)]">
                                {results.map((student, idx) => (
                                    <div
                                        key={student.studentId}
                                        className="
                      grid grid-cols-12 gap-2 px-4 py-2.5
                      items-center hover:bg-[rgba(99,102,241,0.03)]
                    "
                                        style={
                                            student.isAbsent
                                                ? { backgroundColor: 'rgba(239,68,68,0.03)' }
                                                : {}
                                        }
                                    >
                                        <div
                                            className="col-span-1 text-xs tabular-nums"
                                            style={{ color: 'var(--text-muted)' }}
                                        >
                                            {idx + 1}
                                        </div>
                                        <div
                                            className="col-span-2 text-xs font-mono font-semibold"
                                            style={{ color: 'var(--text-secondary)' }}
                                        >
                                            {student.rollNo}
                                        </div>
                                        <div className="col-span-4">
                                            <p
                                                className="text-sm font-medium truncate"
                                                style={{
                                                    color: student.isAbsent
                                                        ? 'var(--text-muted)'
                                                        : 'var(--text-primary)',
                                                    textDecoration: student.isAbsent
                                                        ? 'line-through'
                                                        : 'none',
                                                }}
                                            >
                                                {student.studentName}
                                            </p>
                                        </div>
                                        <div className="col-span-3">
                                            <input
                                                type="number"
                                                min={0}
                                                max={selectedExam.totalMarks}
                                                value={
                                                    student.marksObtained === null
                                                        ? ''
                                                        : student.marksObtained
                                                }
                                                disabled={student.isAbsent}
                                                onChange={(e) =>
                                                    updateMarks(student.studentId, e.target.value)
                                                }
                                                placeholder="--"
                                                className="
                          input-clean text-sm h-8 px-2
                          w-full tabular-nums
                        "
                                                style={
                                                    student.isAbsent
                                                        ? { opacity: 0.4, cursor: 'not-allowed' }
                                                        : student.marksObtained !== null &&
                                                            student.marksObtained > selectedExam.totalMarks
                                                            ? {
                                                                borderColor: 'var(--danger)',
                                                                backgroundColor: 'var(--danger-light)',
                                                            }
                                                            : {}
                                                }
                                            />
                                        </div>
                                        <div className="col-span-2 flex justify-center">
                                            <button
                                                onClick={() =>
                                                    updateMarks(
                                                        student.studentId,
                                                        '',
                                                        !student.isAbsent
                                                    )
                                                }
                                                className="
                          w-7 h-7 rounded-[var(--radius-sm)]
                          border transition-all flex items-center
                          justify-center
                        "
                                                style={
                                                    student.isAbsent
                                                        ? {
                                                            backgroundColor: 'var(--danger-light)',
                                                            borderColor: 'rgba(239,68,68,0.3)',
                                                            color: 'var(--danger)',
                                                        }
                                                        : {
                                                            backgroundColor: 'var(--bg-muted)',
                                                            borderColor: 'var(--border)',
                                                            color: 'var(--text-muted)',
                                                        }
                                                }
                                                title={
                                                    student.isAbsent
                                                        ? 'Mark present'
                                                        : 'Mark absent'
                                                }
                                            >
                                                {student.isAbsent ? (
                                                    <X size={12} />
                                                ) : (
                                                    <Check size={12} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div
                                className="px-4 py-3 flex items-center justify-between flex-wrap gap-3"
                                style={{
                                    borderTop: '1px solid var(--border)',
                                    backgroundColor: 'var(--bg-subtle)',
                                }}
                            >
                                <p
                                    className="text-xs"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    {results.length} students •{' '}
                                    {results.filter((r) => r.isAbsent).length} absent
                                </p>
                                <Button
                                    size="sm"
                                    onClick={handleSave}
                                    loading={saving}
                                    disabled={!isDirty || saving}
                                >
                                    <Save size={14} />
                                    Save Marks
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}