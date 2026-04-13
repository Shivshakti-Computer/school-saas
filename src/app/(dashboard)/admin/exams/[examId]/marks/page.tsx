// FILE: src/app/(dashboard)/admin/exams/[examId]/marks/page.tsx
// FIX: academicYear filter added in student fetch
// Exam ke academicYear se hi students fetch honge

'use client'

import { useState, useEffect, use, useCallback } from 'react'
import {
    Button, Card, PageHeader, Alert, Spinner, EmptyState,
} from '@/components/ui'
import { BookOpen, Save, ArrowLeft, Users, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface SubjectConfig {
    name: string
    maxMarks: number
    minMarks: number
    date: string
    time: string
}

interface StudentMark {
    studentId: string
    name: string
    admissionNo: string
    rollNo: string
    marks: Record<string, {
        marksObtained: number
        isAbsent: boolean
    }>
}

function calcTotal(
    marks: StudentMark['marks'],
    subjects: SubjectConfig[]
): { obtained: number; total: number; pct: number } {
    const total = subjects.reduce((s, sub) => s + sub.maxMarks, 0)
    const obtained = subjects.reduce((s, sub) => {
        const m = marks[sub.name]
        return s + (m?.isAbsent ? 0 : (m?.marksObtained || 0))
    }, 0)
    const pct = total > 0 ? Math.round((obtained / total) * 100) : 0
    return { obtained, total, pct }
}

function gradeColor(pct: number): string {
    if (pct >= 75) return 'text-[var(--success-dark)]'
    if (pct >= 50) return 'text-[var(--warning-dark)]'
    return 'text-[var(--danger-dark)]'
}

export default function MarksEntryPage({
    params,
}: {
    params: Promise<{ examId: string }>
}) {
    const { examId } = use(params)

    const [exam, setExam] = useState<any>(null)
    const [students, setStudents] = useState<StudentMark[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [alert, setAlert] = useState<{
        type: 'success' | 'error'; msg: string
    } | null>(null)

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            // ── Step 1: Exam fetch ──────────────────────────────
            const examRes = await fetch(`/api/exams/${examId}`)
            const examData = await examRes.json()
            if (!examRes.ok) throw new Error(examData.error || 'Exam not found')
            setExam(examData.exam)

            const exam = examData.exam

            // ── Step 2: Students fetch ──────────────────────────
            // ✅ BUG FIX: academicYear ab exam se aayega
            // Pehle academicYear nahi tha → sab years ke students aate the
            const stuParams = new URLSearchParams({
                class: exam.class,
                academicYear: exam.academicYear,  // ← YE MISSING THA
                status: 'active',
                limit: '500',
            })

            // Section optional hai — sirf tab add karo jab ho
            if (exam.section) {
                stuParams.set('section', exam.section)
            }

            // ── Step 3: Students + Existing results parallel fetch ──
            const [stuRes, resRes] = await Promise.all([
                fetch(`/api/students?${stuParams}`),
                fetch(`/api/exams/results?examId=${examId}`),
            ])

            if (!stuRes.ok) {
                const err = await stuRes.json()
                throw new Error(err.error || 'Failed to fetch students')
            }

            const [stuData, resData] = await Promise.all([
                stuRes.json(),
                resRes.json(),
            ])

            // ── Step 4: Existing results map ───────────────────
            const existingMap: Record<string, any> = {}
            for (const r of resData.results ?? []) {
                const sid = r.studentId?._id ?? r.studentId
                existingMap[String(sid)] = r
            }

            // ── Step 5: Build marks grid ────────────────────────
            const grid: StudentMark[] = (stuData.students ?? [])
                .sort((a: any, b: any) => {
                    // Roll number se sort karo
                    const rollA = parseInt(a.rollNo) || 0
                    const rollB = parseInt(b.rollNo) || 0
                    return rollA - rollB
                })
                .map((s: any) => {
                    const existing = existingMap[String(s._id)]
                    const marks: StudentMark['marks'] = {}

                    for (const sub of exam.subjects ?? []) {
                        const em = existing?.marks?.find(
                            (m: any) => m.subject === sub.name
                        )
                        marks[sub.name] = {
                            marksObtained: em?.marksObtained ?? 0,
                            isAbsent: em?.isAbsent ?? false,
                        }
                    }

                    return {
                        studentId: String(s._id),
                        name: s.userId?.name ?? 'Unknown',
                        admissionNo: s.admissionNo,
                        rollNo: s.rollNo,
                        marks,
                    }
                })

            setStudents(grid)

        } catch (err: any) {
            console.error('[MARKS ENTRY]', err)
            setAlert({ type: 'error', msg: err.message })
        } finally {
            setLoading(false)
        }
    }, [examId])

    useEffect(() => { loadData() }, [loadData])

    const updateMark = (
        studentId: string,
        subject: string,
        field: 'marksObtained' | 'isAbsent',
        value: any
    ) => {
        setSaved(false)
        setStudents(prev =>
            prev.map(s => {
                if (s.studentId !== studentId) return s
                return {
                    ...s,
                    marks: {
                        ...s.marks,
                        [subject]: {
                            ...s.marks[subject],
                            [field]: field === 'marksObtained' ? Number(value) : value,
                            ...(field === 'isAbsent' && value
                                ? { marksObtained: 0 }
                                : {}),
                        },
                    },
                }
            })
        )
    }

    const saveMarks = async () => {
        setSaving(true)
        setAlert(null)

        try {
            const results = students.map(s => ({
                studentId: s.studentId,
                marks: Object.entries(s.marks).map(([subject, m]) => ({
                    subject,
                    marksObtained: m.marksObtained,
                    isAbsent: m.isAbsent,
                })),
            }))

            const res = await fetch('/api/exams/results', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ examId, results }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to save')

            setSaved(true)
            setAlert({
                type: 'success',
                msg: `✅ Marks saved for ${data.saved} students! Ranks calculated.`,
            })
        } catch (err: any) {
            setAlert({ type: 'error', msg: err.message })
        } finally {
            setSaving(false)
        }
    }

    // ── Loading ──────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
            </div>
        )
    }

    if (!exam) {
        return (
            <EmptyState
                icon={<BookOpen size={24} />}
                title="Exam not found"
                action={
                    <Link href="/admin/exams">
                        <Button variant="ghost" size="sm">← Back to Exams</Button>
                    </Link>
                }
            />
        )
    }

    const subjects: SubjectConfig[] = exam.subjects ?? []
    const totalStudents = students.length
    const filledCount = students.filter(s =>
        Object.values(s.marks).some(m => m.isAbsent || m.marksObtained > 0)
    ).length

    return (
        <div className="portal-content-enter">

            {/* Back */}
            <div className="mb-3">
                <Link href="/admin/exams">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft size={14} /> Back to Exams
                    </Button>
                </Link>
            </div>

            {/* Header */}
            <PageHeader
                title={`Marks Entry — ${exam.name}`}
                subtitle={`Class ${exam.class}${exam.section ? ` - ${exam.section}` : ''} · ${exam.academicYear}`}
                action={
                    <div className="flex items-center gap-3">
                        {saved && (
                            <span className="flex items-center gap-1.5 text-sm text-[var(--success-dark)] font-medium">
                                <CheckCircle size={15} /> Saved
                            </span>
                        )}
                        <Button onClick={saveMarks} loading={saving}>
                            <Save size={14} /> Save All Marks
                        </Button>
                    </div>
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

            {/* ✅ Academic Year Info Banner */}
            <div className="flex items-center gap-3 mb-5 px-3 py-2.5 rounded-[var(--radius-md)] bg-[var(--info-light)] border border-[rgba(59,130,246,0.2)]">
                <span className="text-xs text-[var(--info-dark)]">
                    📚 Showing students of{' '}
                    <strong>Class {exam.class}{exam.section ? ` - ${exam.section}` : ''}</strong>
                    {' '}for academic year{' '}
                    <strong>{exam.academicYear}</strong>
                    {' '}only
                </span>
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-4 mb-5 p-3 bg-[var(--bg-muted)] rounded-[var(--radius-md)] border border-[var(--border)]">
                <Users size={16} className="text-[var(--text-muted)]" />
                <span className="text-sm text-[var(--text-secondary)]">
                    <span className="font-semibold text-[var(--primary-600)]">
                        {filledCount}
                    </span>
                    {' '}/ {totalStudents} students filled
                </span>
                <div className="flex-1 bg-[var(--border)] rounded-full h-1.5">
                    <div
                        className="bg-[var(--primary-500)] h-1.5 rounded-full transition-all duration-300"
                        style={{
                            width: totalStudents > 0
                                ? `${(filledCount / totalStudents) * 100}%`
                                : '0%',
                        }}
                    />
                </div>
                <span className="text-xs text-[var(--text-muted)]">
                    {totalStudents > 0
                        ? Math.round((filledCount / totalStudents) * 100)
                        : 0}%
                </span>
            </div>

            {/* Subject Info Cards */}
            <div className="flex gap-2 flex-wrap mb-5">
                {subjects.map(sub => (
                    <div
                        key={sub.name}
                        className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-md)] px-3 py-2"
                    >
                        <p className="text-xs font-semibold text-[var(--text-primary)]">
                            {sub.name}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                            Max: {sub.maxMarks} · Pass: {sub.minMarks}
                            {sub.date && ` · ${new Date(sub.date).toLocaleDateString(
                                'en-IN', { day: '2-digit', month: 'short' }
                            )}`}
                        </p>
                    </div>
                ))}
            </div>

            {/* Marks Grid */}
            {students.length === 0 ? (
                <EmptyState
                    icon={<Users size={24} />}
                    title="No students found"
                    description={`No active students in Class ${exam.class}${exam.section ? ` - ${exam.section}` : ''} for ${exam.academicYear}`}
                    action={
                        <Link href="/admin/students">
                            <Button variant="ghost" size="sm">
                                Go to Students →
                            </Button>
                        </Link>
                    }
                />
            ) : (
                <Card padding={false}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[var(--border)] bg-[var(--bg-muted)]">
                                    {/* Student col */}
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide sticky left-0 bg-[var(--bg-muted)] min-w-[200px] z-10">
                                        Student
                                    </th>

                                    {/* Subject cols */}
                                    {subjects.map(sub => (
                                        <th
                                            key={sub.name}
                                            className="text-center px-3 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide min-w-[130px]"
                                        >
                                            <div className="text-[var(--text-primary)]">
                                                {sub.name}
                                            </div>
                                            <div className="font-normal normal-case text-[10px] text-[var(--text-muted)] mt-0.5">
                                                /{sub.maxMarks} · pass {sub.minMarks}
                                            </div>
                                        </th>
                                    ))}

                                    {/* Total col */}
                                    <th className="text-center px-3 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide min-w-[100px]">
                                        Total
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-[var(--border)]">
                                {students.map((s, rowIdx) => {
                                    const { obtained, total, pct } = calcTotal(s.marks, subjects)
                                    const hasAnyMark = Object.values(s.marks).some(
                                        m => m.isAbsent || m.marksObtained > 0
                                    )

                                    return (
                                        <tr
                                            key={s.studentId}
                                            className={[
                                                'transition-colors',
                                                rowIdx % 2 === 0
                                                    ? 'bg-[var(--bg-card)]'
                                                    : 'bg-[var(--bg-subtle)]',
                                                'hover:bg-[var(--bg-muted)]',
                                            ].join(' ')}
                                        >
                                            {/* Student info */}
                                            <td className="px-4 py-2.5 sticky left-0 bg-inherit z-10 border-r border-[var(--border)]">
                                                <p className="text-sm font-semibold text-[var(--text-primary)]">
                                                    {s.name}
                                                </p>
                                                <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                                                    {s.admissionNo} · Roll {s.rollNo}
                                                </p>
                                            </td>

                                            {/* Subject marks */}
                                            {subjects.map(sub => {
                                                const mark = s.marks[sub.name] ?? {
                                                    marksObtained: 0,
                                                    isAbsent: false,
                                                }
                                                const isFail =
                                                    !mark.isAbsent &&
                                                    mark.marksObtained > 0 &&
                                                    mark.marksObtained < sub.minMarks

                                                const isPass =
                                                    !mark.isAbsent &&
                                                    mark.marksObtained >= sub.minMarks &&
                                                    mark.marksObtained > 0

                                                return (
                                                    <td
                                                        key={sub.name}
                                                        className="px-3 py-2 text-center"
                                                    >
                                                        <div className="flex flex-col items-center gap-1">
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                max={sub.maxMarks}
                                                                value={
                                                                    mark.isAbsent
                                                                        ? ''
                                                                        : mark.marksObtained || ''
                                                                }
                                                                disabled={mark.isAbsent}
                                                                placeholder={mark.isAbsent ? 'AB' : '—'}
                                                                onChange={e =>
                                                                    updateMark(
                                                                        s.studentId, sub.name,
                                                                        'marksObtained', e.target.value
                                                                    )
                                                                }
                                                                className={[
                                                                    'w-20 h-8 text-center text-sm',
                                                                    'rounded-[var(--radius-sm)] border transition-all',
                                                                    'focus:outline-none',
                                                                    mark.isAbsent
                                                                        ? 'bg-[var(--bg-muted)] border-[var(--border)] text-[var(--text-muted)] cursor-not-allowed'
                                                                        : isFail
                                                                            ? 'border-[var(--danger)] bg-red-50 text-[var(--danger-dark)] focus:ring-2 focus:ring-red-100'
                                                                            : isPass
                                                                                ? 'border-[var(--success)] bg-green-50 text-[var(--success-dark)] focus:ring-2 focus:ring-green-100'
                                                                                : 'border-[var(--border)] bg-[var(--bg-card)] focus:border-[var(--primary-500)] focus:ring-2 focus:ring-[rgba(99,102,241,0.1)]',
                                                                ].join(' ')}
                                                            />
                                                            <label className="flex items-center gap-1 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={mark.isAbsent}
                                                                    onChange={e =>
                                                                        updateMark(
                                                                            s.studentId, sub.name,
                                                                            'isAbsent', e.target.checked
                                                                        )
                                                                    }
                                                                    className="w-3 h-3 rounded accent-[var(--danger)]"
                                                                />
                                                                <span className="text-[10px] text-[var(--text-muted)]">
                                                                    Absent
                                                                </span>
                                                            </label>
                                                        </div>
                                                    </td>
                                                )
                                            })}

                                            {/* Total */}
                                            <td className="px-3 py-2 text-center">
                                                {hasAnyMark ? (
                                                    <div>
                                                        <p className={`text-sm font-bold ${gradeColor(pct)}`}>
                                                            {obtained}/{total}
                                                        </p>
                                                        <p className={`text-[10px] ${gradeColor(pct)}`}>
                                                            {pct}%
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-[var(--text-muted)] text-xs">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Bottom save button (long list ke liye) */}
            {students.length > 8 && (
                <div className="flex justify-end mt-4">
                    <Button onClick={saveMarks} loading={saving}>
                        <Save size={14} /> Save All Marks
                    </Button>
                </div>
            )}

        </div>
    )
}