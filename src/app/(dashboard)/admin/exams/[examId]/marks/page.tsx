// src/app/(dashboard)/admin/exams/[examId]/marks/page.tsx
// ✅ UPDATED: Live grade preview from settings gradeScale
// Sirf ye helper functions add karo — baki sab unchanged
// ═══════════════════════════════════════════════════════════

'use client'

import { useState, useEffect, use, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
    Button, Card, PageHeader, Alert, Spinner, EmptyState,
} from '@/components/ui'
import {
    BookOpen, Save, ArrowLeft, Users, CheckCircle,
    FileText, BarChart3, Trophy,
} from 'lucide-react'
import { useAcademicSettings } from '@/hooks/useAcademicSettings'
import type { IGradeScale } from '@/types/settings'

// ── Types — UNCHANGED ────────────────────────────────────────
// (sab same rakho — SubjectComponent, SubjectConfig,
//  ComponentMark, SubjectMark, StudentMark — kuch nahi badla)

interface SubjectComponent {
    name: string
    maxMarks: number
}

interface SubjectConfig {
    name: string
    totalMaxMarks: number
    minMarks: number
    date: string
    time: string
    duration: number
    components: SubjectComponent[]
    isGradeOnly: boolean
}

interface ComponentMark {
    name: string
    marksObtained: number
    maxMarks: number
}

interface SubjectMark {
    marksObtained: number
    isAbsent: boolean
    components: ComponentMark[]
    activityGrade: string
    remarks: string
}

interface StudentMark {
    studentId: string
    name: string
    admissionNo: string
    rollNo: string
    marks: Record<string, SubjectMark>
    savedResult?: {
        rank: number
        percentage: number
        grade: string
        isPassed: boolean
        totalObtained: number
        totalMarks: number
        resultId: string
    }
}

const ACTIVITY_GRADES = [
    'Outstanding',
    'Excellent',
    'Very Good',
    'Good',
    'Satisfactory',
    'Needs Improvement',
]

// ── Helpers — UNCHANGED ──────────────────────────────────────

function calcStudentTotal(
    marks: StudentMark['marks'],
    subjects: SubjectConfig[]
): { obtained: number; total: number; pct: number } {
    const total = subjects
        .filter(s => !s.isGradeOnly)
        .reduce((s, sub) => s + sub.totalMaxMarks, 0)

    const obtained = subjects
        .filter(s => !s.isGradeOnly)
        .reduce((s, sub) => {
            const m = marks[sub.name]
            if (!m || m.isAbsent) return s
            if (sub.components?.length > 0 && m.components?.length > 0) {
                return s + m.components.reduce(
                    (cs, c) => cs + (c.marksObtained || 0), 0
                )
            }
            return s + (m.marksObtained || 0)
        }, 0)

    const pct = total > 0
        ? Math.round((obtained / total) * 100)
        : 0
    return { obtained, total, pct }
}

function pctColor(pct: number): string {
    if (pct >= 75) return 'text-[var(--success-dark)]'
    if (pct >= 50) return 'text-[var(--warning-dark)]'
    return 'text-[var(--danger-dark)]'
}

function makeDefaultMark(sub: SubjectConfig): SubjectMark {
    return {
        marksObtained: 0,
        isAbsent: false,
        activityGrade: '',
        remarks: '',
        components: sub.components?.length > 0
            ? sub.components.map(c => ({
                name: c.name,
                marksObtained: 0,
                maxMarks: c.maxMarks,
            }))
            : [],
    }
}

// ── ✅ NEW: Settings-aware live grade calculator ──────────────

function getLiveGrade(
    pct: number,
    gradeScale: IGradeScale[],
    isAbsent: boolean
): string | null {
    if (isAbsent) return 'AB'
    if (pct <= 0) return null // Kuch fill nahi hua

    if (!gradeScale?.length) {
        // Fallback hardcoded
        if (pct >= 91) return 'A+'
        if (pct >= 81) return 'A'
        if (pct >= 71) return 'B+'
        if (pct >= 61) return 'B'
        if (pct >= 51) return 'C+'
        if (pct >= 41) return 'C'
        if (pct >= 33) return 'D'
        return 'F'
    }

    const sorted = [...gradeScale].sort((a, b) => b.minMarks - a.minMarks)
    for (const g of sorted) {
        if (pct >= g.minMarks && pct <= g.maxMarks) {
            return g.grade
        }
    }
    return sorted[sorted.length - 1]?.grade || 'F'
}

function getGradeColor(grade: string | null): string {
    if (!grade || grade === 'AB') return 'text-[var(--text-muted)]'
    if (['A+', 'A'].includes(grade)) return 'text-[var(--success-dark)]'
    if (['B+', 'B'].includes(grade)) return 'text-[var(--info-dark)]'
    if (['C+', 'C', 'D'].includes(grade)) return 'text-[var(--warning-dark)]'
    return 'text-[var(--danger-dark)]'
}

// ── Main Page ────────────────────────────────────────────────

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
    const [expanded, setExpanded] = useState<Set<string>>(new Set())

    // ✅ Academic settings
    const { settings: academicSettings } = useAcademicSettings()
    const gradeScale = academicSettings?.gradeScale ?? []
    const passPercentage = academicSettings?.passPercentage ?? 33

    // ── Load Data — UNCHANGED ────────────────────────────────

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const examRes = await fetch(`/api/exams/${examId}`)
            const examData = await examRes.json()
            if (!examRes.ok) throw new Error(examData.error || 'Exam not found')
            const examDoc = examData.exam
            setExam(examDoc)

            const stuParams = new URLSearchParams({
                class: examDoc.class,
                academicYear: examDoc.academicYear,
                status: 'active',
                limit: '500',
            })
            if (examDoc.section) stuParams.set('section', examDoc.section)

            const [stuRes, resRes] = await Promise.all([
                fetch(`/api/students?${stuParams}`),
                fetch(`/api/exams/results?examId=${examId}`),
            ])

            if (!stuRes.ok) {
                const e = await stuRes.json()
                throw new Error(e.error || 'Failed to fetch students')
            }

            const [stuData, resData] = await Promise.all([
                stuRes.json(),
                resRes.json(),
            ])

            const existingResultMap: Record<string, any> = {}
            const resultIdMap: Record<string, string> = {}

            for (const r of resData.results ?? []) {
                const sid = String(r.studentId?._id ?? r.studentId)
                existingResultMap[sid] = r
                resultIdMap[sid] = String(r._id)
            }

            const grid: StudentMark[] = (stuData.students ?? [])
                .sort((a: any, b: any) => {
                    const rA = parseInt(a.rollNo) || 0
                    const rB = parseInt(b.rollNo) || 0
                    return rA - rB
                })
                .map((s: any) => {
                    const sid = String(s._id)
                    const existing = existingResultMap[sid]
                    const marks: Record<string, SubjectMark> = {}

                    for (const sub of examDoc.subjects ?? []) {
                        const existingMark = existing?.marks?.find(
                            (m: any) => m.subject === sub.name
                        )

                        if (sub.isGradeOnly) {
                            marks[sub.name] = {
                                marksObtained: 0,
                                isAbsent: existingMark?.isAbsent ?? false,
                                activityGrade: existingMark?.activityGrade ?? '',
                                remarks: existingMark?.remarks ?? '',
                                components: [],
                            }
                        } else if (sub.components?.length > 0) {
                            marks[sub.name] = {
                                marksObtained: existingMark?.marksObtained ?? 0,
                                isAbsent: existingMark?.isAbsent ?? false,
                                activityGrade: '',
                                remarks: existingMark?.remarks ?? '',
                                components: sub.components.map((c: SubjectComponent) => {
                                    const ec = existingMark?.components?.find(
                                        (ec: any) => ec.name === c.name
                                    )
                                    return {
                                        name: c.name,
                                        marksObtained: ec?.marksObtained ?? 0,
                                        maxMarks: c.maxMarks,
                                    }
                                }),
                            }
                        } else {
                            marks[sub.name] = {
                                marksObtained: existingMark?.marksObtained ?? 0,
                                isAbsent: existingMark?.isAbsent ?? false,
                                activityGrade: '',
                                remarks: existingMark?.remarks ?? '',
                                components: [],
                            }
                        }
                    }

                    const savedResult = existing
                        ? {
                            rank: existing.rank ?? 0,
                            percentage: existing.percentage ?? 0,
                            grade: existing.grade ?? '',
                            isPassed: existing.isPassed ?? false,
                            totalObtained: existing.totalObtained ?? 0,
                            totalMarks: existing.totalMarks ?? 0,
                            resultId: resultIdMap[sid] ?? '',
                        }
                        : undefined

                    return {
                        studentId: sid,
                        name: s.userId?.name ?? 'Unknown',
                        admissionNo: s.admissionNo,
                        rollNo: s.rollNo,
                        marks,
                        savedResult,
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

    // ── Update helpers — UNCHANGED ───────────────────────────

    const updateSimpleMark = (
        studentId: string,
        subject: string,
        field: keyof SubjectMark,
        value: any
    ) => {
        setSaved(false)
        setStudents(prev => prev.map(s => {
            if (s.studentId !== studentId) return s
            const existing = s.marks[subject] ?? makeDefaultMark(
                exam?.subjects?.find((sub: any) => sub.name === subject)
            )
            const updated: SubjectMark = {
                ...existing,
                [field]: field === 'marksObtained' ? Number(value) : value,
            }
            if (field === 'isAbsent' && value === true) {
                updated.marksObtained = 0
                updated.components = updated.components.map(c => ({
                    ...c, marksObtained: 0,
                }))
            }
            return { ...s, marks: { ...s.marks, [subject]: updated } }
        }))
    }

    const updateComponentMark = (
        studentId: string,
        subject: string,
        compIdx: number,
        obtained: number
    ) => {
        setSaved(false)
        setStudents(prev => prev.map(s => {
            if (s.studentId !== studentId) return s
            const existing = s.marks[subject]
            if (!existing) return s

            const newComps = existing.components.map((c, i) =>
                i === compIdx
                    ? { ...c, marksObtained: Math.min(obtained, c.maxMarks) }
                    : c
            )
            const total = newComps.reduce(
                (sum, c) => sum + (c.marksObtained || 0), 0
            )
            return {
                ...s,
                marks: {
                    ...s.marks,
                    [subject]: {
                        ...existing,
                        components: newComps,
                        marksObtained: total,
                    },
                },
            }
        }))
    }

    // ── Save — UNCHANGED ─────────────────────────────────────

    const saveMarks = async () => {
        if (!exam) return
        setSaving(true)
        setAlert(null)

        try {
            const results = students.map(s => ({
                studentId: s.studentId,
                marks: exam.subjects.map((sub: SubjectConfig) => {
                    const m = s.marks[sub.name] ?? makeDefaultMark(sub)
                    return {
                        subject: sub.name,
                        marksObtained: m.isAbsent ? 0 : m.marksObtained,
                        isAbsent: m.isAbsent,
                        activityGrade: m.activityGrade,
                        remarks: m.remarks,
                        components: m.components,
                    }
                }),
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
            await loadData()
        } catch (err: any) {
            setAlert({ type: 'error', msg: err.message })
        } finally {
            setSaving(false)
        }
    }

    const toggleExpand = (sid: string) => {
        setExpanded(prev => {
            const next = new Set(prev)
            next.has(sid) ? next.delete(sid) : next.add(sid)
            return next
        })
    }

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
    const hasGradeOnly = subjects.some((s: SubjectConfig) => s.isGradeOnly)
    const hasComposite = subjects.some(
        (s: SubjectConfig) => !s.isGradeOnly && s.components?.length > 0
    )
    const totalStudents = students.length
    const filledCount = students.filter(s =>
        Object.values(s.marks).some(
            m => m.isAbsent || m.marksObtained > 0 || m.activityGrade
        )
    ).length

    return (
        <div className="portal-content-enter space-y-5">

            {/* Back */}
            <div>
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
                        <Link href={`/admin/exams/${examId}/results`}>
                            <Button variant="ghost" size="sm">
                                <BarChart3 size={14} /> View Results
                            </Button>
                        </Link>
                        {saved && (
                            <span className="
                flex items-center gap-1.5 text-sm
                text-[var(--success-dark)] font-medium
              ">
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
                <Alert
                    type={alert.type}
                    message={alert.msg}
                    onClose={() => setAlert(null)}
                />
            )}

            {/* Info banner */}
            <div className="
        flex items-center gap-3 px-3 py-2.5
        rounded-[var(--radius-md)] bg-[var(--info-light)]
        border border-[rgba(59,130,246,0.2)]
      ">
                <span className="text-xs text-[var(--info-dark)]">
                    📚 Class{' '}
                    <strong>
                        {exam.class}{exam.section ? ` - ${exam.section}` : ''}
                    </strong>{' '}
                    · <strong>{exam.academicYear}</strong>
                    {' '}· Pass: <strong>{passPercentage}%</strong>
                    {hasComposite && (
                        <span className="ml-2">📊 Composite marks active.</span>
                    )}
                    {hasGradeOnly && (
                        <span className="ml-2">🎨 Activity grading active.</span>
                    )}
                </span>
            </div>

            {/* Progress bar — UNCHANGED */}
            <div className="
        flex items-center gap-4 p-3
        bg-[var(--bg-muted)] rounded-[var(--radius-md)]
        border border-[var(--border)]
      ">
                <Users size={16} className="text-[var(--text-muted)] flex-shrink-0" />
                <span className="text-sm text-[var(--text-secondary)]">
                    <span className="font-semibold text-[var(--primary-600)]">
                        {filledCount}
                    </span>
                    {' '}/ {totalStudents} students filled
                </span>
                <div className="flex-1 bg-[var(--border)] rounded-full h-1.5">
                    <div
                        className="
              bg-[var(--primary-500)] h-1.5 rounded-full
              transition-all duration-500
            "
                        style={{
                            width: totalStudents > 0
                                ? `${Math.round((filledCount / totalStudents) * 100)}%`
                                : '0%',
                        }}
                    />
                </div>
                <span className="
          text-xs text-[var(--text-muted)] tabular-nums flex-shrink-0
        ">
                    {totalStudents > 0
                        ? Math.round((filledCount / totalStudents) * 100)
                        : 0}%
                </span>
            </div>

            {/* Subject chips — UNCHANGED */}
            <div className="flex gap-2 flex-wrap">
                {subjects.map(sub => (
                    <div
                        key={sub.name}
                        className="
              bg-[var(--bg-card)] border border-[var(--border)]
              rounded-[var(--radius-md)] px-3 py-2
            "
                    >
                        <p className="text-xs font-semibold text-[var(--text-primary)]">
                            {sub.name}
                            {sub.isGradeOnly && (
                                <span className="
                  ml-1.5 text-[10px] text-[var(--primary-500)] font-normal
                ">
                                    (Grade only)
                                </span>
                            )}
                        </p>
                        {!sub.isGradeOnly && (
                            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                                {sub.components?.length > 0
                                    ? sub.components.map(
                                        c => `${c.name}:${c.maxMarks}`
                                    ).join(' + ')
                                    : `Max: ${sub.totalMaxMarks}`}
                                {' '}· Pass: {sub.minMarks}
                                {sub.date && ` · ${new Date(sub.date).toLocaleDateString(
                                    'en-IN', { day: '2-digit', month: 'short' }
                                )}`}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {students.length === 0 ? (
                <EmptyState
                    icon={<Users size={24} />}
                    title="No students found"
                    description={`No active students in Class ${exam.class}${exam.section ? ` - ${exam.section}` : ''} for ${exam.academicYear}`}
                    action={
                        <Link href="/admin/students">
                            <Button variant="ghost" size="sm">Go to Students →</Button>
                        </Link>
                    }
                />
            ) : (
                <>
                    <Card padding={false}>
                        <div className="overflow-x-auto portal-main-scroll">
                            <table className="w-full text-sm border-collapse">

                                {/* ── Table Head ── */}
                                <thead>
                                    <tr className="
                    border-b border-[var(--border)] bg-[var(--bg-muted)]
                  ">
                                        <th className="
                      text-left px-4 py-3
                      text-xs font-semibold text-[var(--text-muted)]
                      uppercase tracking-wide
                      sticky left-0 bg-[var(--bg-muted)] z-10
                      min-w-[200px] border-r border-[var(--border)]
                    ">
                                            Student
                                        </th>

                                        {subjects.map(sub => (
                                            <th
                                                key={sub.name}
                                                className="
                          text-center px-2 py-3
                          text-xs font-semibold text-[var(--text-muted)]
                          uppercase tracking-wide
                        "
                                                style={{
                                                    minWidth: sub.isGradeOnly
                                                        ? '160px'
                                                        : sub.components?.length > 0
                                                            ? `${sub.components.length * 80 + 20}px`
                                                            : '110px',
                                                }}
                                            >
                                                <div className="text-[var(--text-primary)]">
                                                    {sub.name}
                                                </div>
                                                {!sub.isGradeOnly && (
                                                    <div className="
                            font-normal normal-case text-[10px]
                            text-[var(--text-muted)] mt-0.5
                          ">
                                                        {sub.components?.length > 0
                                                            ? sub.components.map(
                                                                c => `${c.name}(${c.maxMarks})`
                                                            ).join(' · ')
                                                            : `/${sub.totalMaxMarks} · pass ${sub.minMarks}`}
                                                    </div>
                                                )}
                                            </th>
                                        ))}

                                        <th className="
                      text-center px-3 py-3
                      text-xs font-semibold text-[var(--text-muted)]
                      uppercase tracking-wide min-w-[140px]
                    ">
                                            Total / Grade
                                        </th>
                                    </tr>
                                </thead>

                                {/* ── Table Body ── */}
                                <tbody className="divide-y divide-[var(--border)]">
                                    {students.map((s, rowIdx) => {
                                        const { obtained, total, pct } = calcStudentTotal(
                                            s.marks, subjects
                                        )
                                        const hasAnyEntry = Object.values(s.marks).some(
                                            m => m.isAbsent || m.marksObtained > 0 || m.activityGrade
                                        )
                                        const rowBg = rowIdx % 2 === 0
                                            ? 'bg-[var(--bg-card)]'
                                            : 'bg-[var(--bg-subtle)]'

                                        // ✅ Live grade from settings
                                        const liveGrade = getLiveGrade(
                                            pct, gradeScale,
                                            Object.values(s.marks).every(m => m.isAbsent)
                                        )

                                        return (
                                            <tr
                                                key={s.studentId}
                                                className={`
                          ${rowBg} hover:bg-[var(--bg-muted)]
                          transition-colors
                        `}
                                            >
                                                {/* Student Info — UNCHANGED */}
                                                <td className="
                          px-4 py-3
                          sticky left-0 bg-inherit z-10
                          border-r border-[var(--border)]
                        ">
                                                    <div className="
                            flex items-start justify-between gap-2
                          ">
                                                        <div className="min-w-0">
                                                            <p className="
                                text-sm font-semibold
                                text-[var(--text-primary)] truncate
                              ">
                                                                {s.name}
                                                            </p>
                                                            <p className="
                                text-[10px] text-[var(--text-muted)]
                                font-mono mt-0.5
                              ">
                                                                {s.admissionNo} · Roll {s.rollNo}
                                                            </p>
                                                        </div>
                                                        {s.savedResult && (
                                                            <div className="flex-shrink-0">
                                                                <span className={[
                                                                    'inline-flex items-center gap-1',
                                                                    'text-[10px] font-bold px-1.5 py-0.5',
                                                                    'rounded-[var(--radius-xs)]',
                                                                    s.savedResult.isPassed
                                                                        ? 'bg-[var(--success-light)] text-[var(--success-dark)]'
                                                                        : 'bg-[var(--danger-light)] text-[var(--danger-dark)]',
                                                                ].join(' ')}>
                                                                    {s.savedResult.isPassed ? '✓ P' : '✗ F'}
                                                                    {s.savedResult.rank
                                                                        ? ` · #${s.savedResult.rank}`
                                                                        : ''}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Subject cells — UNCHANGED */}
                                                {subjects.map(sub => {
                                                    const mark = s.marks[sub.name]
                                                        ?? makeDefaultMark(sub)

                                                    if (sub.isGradeOnly) {
                                                        return (
                                                            <td
                                                                key={sub.name}
                                                                className="px-2 py-2 text-center"
                                                            >
                                                                <div className="
                                  flex flex-col gap-1 items-center
                                ">
                                                                    <select
                                                                        value={mark.activityGrade}
                                                                        disabled={mark.isAbsent}
                                                                        onChange={e => updateSimpleMark(
                                                                            s.studentId, sub.name,
                                                                            'activityGrade', e.target.value
                                                                        )}
                                                                        className={[
                                                                            'text-xs rounded-[var(--radius-sm)]',
                                                                            'border px-1.5 py-1',
                                                                            'bg-[var(--bg-card)] text-[var(--text-primary)]',
                                                                            'focus:border-[var(--primary-500)] focus:outline-none',
                                                                            'transition-colors w-full max-w-[140px]',
                                                                            mark.isAbsent
                                                                                ? 'opacity-50 cursor-not-allowed border-[var(--border)]'
                                                                                : 'border-[var(--border)] cursor-pointer',
                                                                        ].join(' ')}
                                                                    >
                                                                        <option value="">— Select —</option>
                                                                        {ACTIVITY_GRADES.map(g => (
                                                                            <option key={g} value={g}>{g}</option>
                                                                        ))}
                                                                    </select>
                                                                    <label className="
                                    flex items-center gap-1 cursor-pointer
                                  ">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={mark.isAbsent}
                                                                            onChange={e => updateSimpleMark(
                                                                                s.studentId, sub.name,
                                                                                'isAbsent', e.target.checked
                                                                            )}
                                                                            className="
                                        w-3 h-3 rounded accent-[var(--danger)]
                                      "
                                                                        />
                                                                        <span className="
                                      text-[10px] text-[var(--text-muted)]
                                    ">
                                                                            Absent
                                                                        </span>
                                                                    </label>
                                                                </div>
                                                            </td>
                                                        )
                                                    }

                                                    if (sub.components?.length > 0) {
                                                        const compTotal = mark.isAbsent
                                                            ? 0
                                                            : (mark.components?.reduce(
                                                                (sum, c) => sum + (c.marksObtained || 0), 0
                                                            ) ?? 0)
                                                        const subMax = sub.totalMaxMarks
                                                        const isFail = !mark.isAbsent
                                                            && compTotal > 0
                                                            && compTotal < sub.minMarks

                                                        return (
                                                            <td
                                                                key={sub.name}
                                                                className="px-2 py-2"
                                                            >
                                                                <div className="
                                  flex flex-col gap-1 items-center
                                ">
                                                                    <div className="
                                    flex gap-1 flex-wrap justify-center
                                  ">
                                                                        {sub.components.map((comp, ci) => {
                                                                            const compMark = mark.components?.[ci]
                                                                                ?? {
                                                                                marksObtained: 0,
                                                                                maxMarks: comp.maxMarks,
                                                                            }
                                                                            return (
                                                                                <div
                                                                                    key={comp.name}
                                                                                    className="flex flex-col items-center"
                                                                                >
                                                                                    <span className="
                                            text-[9px] text-[var(--text-muted)]
                                            mb-0.5 whitespace-nowrap
                                          ">
                                                                                        {comp.name}
                                                                                    </span>
                                                                                    <input
                                                                                        type="number"
                                                                                        min={0}
                                                                                        max={comp.maxMarks}
                                                                                        disabled={mark.isAbsent}
                                                                                        value={
                                                                                            mark.isAbsent
                                                                                                ? ''
                                                                                                : compMark.marksObtained || ''
                                                                                        }
                                                                                        placeholder={
                                                                                            mark.isAbsent
                                                                                                ? 'AB'
                                                                                                : `/${comp.maxMarks}`
                                                                                        }
                                                                                        onChange={e => updateComponentMark(
                                                                                            s.studentId, sub.name,
                                                                                            ci, Number(e.target.value)
                                                                                        )}
                                                                                        className={[
                                                                                            'w-14 h-7 text-center text-xs',
                                                                                            'rounded-[var(--radius-sm)] border',
                                                                                            'focus:outline-none transition-all',
                                                                                            mark.isAbsent
                                                                                                ? 'bg-[var(--bg-muted)] border-[var(--border)] text-[var(--text-muted)] cursor-not-allowed'
                                                                                                : 'border-[var(--border)] bg-[var(--bg-card)] focus:border-[var(--primary-500)] focus:ring-1 focus:ring-[rgba(99,102,241,0.1)]',
                                                                                        ].join(' ')}
                                                                                    />
                                                                                </div>
                                                                            )
                                                                        })}
                                                                    </div>

                                                                    {!mark.isAbsent && compTotal > 0 && (
                                                                        <span className={[
                                                                            'text-[10px] font-bold',
                                                                            isFail
                                                                                ? 'text-[var(--danger)]'
                                                                                : 'text-[var(--success-dark)]',
                                                                        ].join(' ')}>
                                                                            Total: {compTotal}/{subMax}
                                                                        </span>
                                                                    )}

                                                                    <label className="
                                    flex items-center gap-1
                                    cursor-pointer mt-0.5
                                  ">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={mark.isAbsent}
                                                                            onChange={e => updateSimpleMark(
                                                                                s.studentId, sub.name,
                                                                                'isAbsent', e.target.checked
                                                                            )}
                                                                            className="
                                        w-3 h-3 rounded accent-[var(--danger)]
                                      "
                                                                        />
                                                                        <span className="
                                      text-[10px] text-[var(--text-muted)]
                                    ">
                                                                            Absent
                                                                        </span>
                                                                    </label>
                                                                </div>
                                                            </td>
                                                        )
                                                    }

                                                    // Simple mode
                                                    const isFail = !mark.isAbsent
                                                        && mark.marksObtained > 0
                                                        && mark.marksObtained < sub.minMarks
                                                    const isPass = !mark.isAbsent
                                                        && mark.marksObtained >= sub.minMarks
                                                        && mark.marksObtained > 0

                                                    return (
                                                        <td
                                                            key={sub.name}
                                                            className="px-2 py-2 text-center"
                                                        >
                                                            <div className="
                                flex flex-col items-center gap-1
                              ">
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    max={sub.totalMaxMarks}
                                                                    disabled={mark.isAbsent}
                                                                    value={
                                                                        mark.isAbsent
                                                                            ? ''
                                                                            : mark.marksObtained || ''
                                                                    }
                                                                    placeholder={mark.isAbsent ? 'AB' : '—'}
                                                                    onChange={e => updateSimpleMark(
                                                                        s.studentId, sub.name,
                                                                        'marksObtained', e.target.value
                                                                    )}
                                                                    className={[
                                                                        'w-20 h-8 text-center text-sm',
                                                                        'rounded-[var(--radius-sm)] border',
                                                                        'transition-all focus:outline-none',
                                                                        mark.isAbsent
                                                                            ? 'bg-[var(--bg-muted)] border-[var(--border)] text-[var(--text-muted)] cursor-not-allowed'
                                                                            : isFail
                                                                                ? 'border-[var(--danger)] bg-red-50 text-[var(--danger-dark)] focus:ring-2 focus:ring-[rgba(239,68,68,0.1)]'
                                                                                : isPass
                                                                                    ? 'border-[var(--success)] bg-green-50 text-[var(--success-dark)] focus:ring-2 focus:ring-[rgba(16,185,129,0.1)]'
                                                                                    : 'border-[var(--border)] bg-[var(--bg-card)] focus:border-[var(--primary-500)] focus:ring-2 focus:ring-[rgba(99,102,241,0.1)]',
                                                                    ].join(' ')}
                                                                />
                                                                <label className="
                                  flex items-center gap-1 cursor-pointer
                                ">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={mark.isAbsent}
                                                                        onChange={e => updateSimpleMark(
                                                                            s.studentId, sub.name,
                                                                            'isAbsent', e.target.checked
                                                                        )}
                                                                        className="
                                      w-3 h-3 rounded accent-[var(--danger)]
                                    "
                                                                    />
                                                                    <span className="
                                    text-[10px] text-[var(--text-muted)]
                                  ">
                                                                        Absent
                                                                    </span>
                                                                </label>
                                                            </div>
                                                        </td>
                                                    )
                                                })}

                                                {/* ✅ Total + Live Grade column */}
                                                <td className="px-3 py-2 text-center">
                                                    {hasAnyEntry ? (
                                                        <div className="flex flex-col items-center gap-1">
                                                            {/* Live total */}
                                                            {total > 0 && (
                                                                <p className={`text-sm font-bold ${pctColor(pct)}`}>
                                                                    {obtained}/{total}
                                                                </p>
                                                            )}
                                                            {total > 0 && (
                                                                <p className={`text-[10px] ${pctColor(pct)}`}>
                                                                    {pct}%
                                                                </p>
                                                            )}

                                                            {/* ✅ Live grade preview — settings se */}
                                                            {liveGrade && total > 0 && (
                                                                <span className={[
                                                                    'text-xs font-black',
                                                                    getGradeColor(liveGrade),
                                                                ].join(' ')}>
                                                                    {liveGrade}
                                                                </span>
                                                            )}

                                                            {/* Saved result */}
                                                            {s.savedResult && (
                                                                <>
                                                                    <span className={[
                                                                        'text-[10px] font-bold px-1.5 py-0.5',
                                                                        'rounded-[var(--radius-xs)]',
                                                                        s.savedResult.isPassed
                                                                            ? 'bg-[var(--success-light)] text-[var(--success-dark)]'
                                                                            : 'bg-[var(--danger-light)] text-[var(--danger-dark)]',
                                                                    ].join(' ')}>
                                                                        {s.savedResult.isPassed ? 'PASS' : 'FAIL'}
                                                                    </span>
                                                                    {s.savedResult.rank > 0 && (
                                                                        <span className="
                                      flex items-center gap-0.5
                                      text-[10px] text-amber-600 font-semibold
                                    ">
                                                                            <Trophy size={9} />
                                                                            Rank #{s.savedResult.rank}
                                                                        </span>
                                                                    )}
                                                                    {s.savedResult.resultId && (
                                                                        <a
                                                                            href={`/api/pdf/reportcard/${s.savedResult.resultId}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="
                                        flex items-center gap-0.5 text-[10px]
                                        text-[var(--primary-600)]
                                        hover:text-[var(--primary-700)]
                                        font-medium
                                      "
                                                                        >
                                                                            <FileText size={9} /> Report Card
                                                                        </a>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[var(--text-muted)] text-xs">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Remarks — UNCHANGED */}
                    <Card>
                        <div className="portal-card-header">
                            <p className="portal-card-title">
                                Student Remarks (Optional)
                            </p>
                            <p className="portal-card-subtitle">
                                Per-student overall remark — report card pe show hoga
                            </p>
                        </div>
                        <div className="portal-card-body">
                            <div className="
                grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3
              ">
                                {students.map(s => (
                                    <div key={s.studentId} className="space-y-1">
                                        <label className="
                      text-xs font-semibold text-[var(--text-secondary)]
                    ">
                                            {s.name}
                                            <span className="font-normal text-[var(--text-muted)] ml-1">
                                                (Roll {s.rollNo})
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            className="input-clean text-xs h-8 w-full"
                                            placeholder="e.g. Good performance..."
                                            value={
                                                subjects.length > 0
                                                    ? (s.marks[subjects[0].name]?.remarks ?? '')
                                                    : ''
                                            }
                                            onChange={e => {
                                                if (subjects.length > 0) {
                                                    updateSimpleMark(
                                                        s.studentId,
                                                        subjects[0].name,
                                                        'remarks',
                                                        e.target.value
                                                    )
                                                }
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Bottom Save */}
                    {students.length > 8 && (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-[var(--text-muted)]">
                                {filledCount} / {totalStudents} students filled
                            </p>
                            <Button onClick={saveMarks} loading={saving}>
                                <Save size={14} /> Save All Marks
                            </Button>
                        </div>
                    )}

                    {/* Admit Cards — UNCHANGED */}
                    {exam.admitCardEnabled && (
                        <Card>
                            <div className="portal-card-header">
                                <div>
                                    <p className="portal-card-title">Admit Cards</p>
                                    <p className="portal-card-subtitle">
                                        Download individual student admit cards
                                    </p>
                                </div>
                            </div>
                            <div className="portal-card-body">
                                <div className="
                  grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2
                ">
                                    {students.map(s => (
                                        <a
                                            key={s.studentId}
                                            href={`/api/pdf/admitcard/${examId}?studentId=${s.studentId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="
                        flex items-center gap-2 p-2.5
                        border border-[var(--border)]
                        rounded-[var(--radius-md)]
                        hover:border-[var(--primary-300)]
                        hover:bg-[var(--primary-50)]
                        transition-all group
                      "
                                        >
                                            <FileText
                                                size={14}
                                                className="
                          text-[var(--text-muted)]
                          group-hover:text-[var(--primary-500)]
                          flex-shrink-0
                        "
                                            />
                                            <div className="min-w-0">
                                                <p className="
                          text-xs font-semibold
                          text-[var(--text-primary)] truncate
                        ">
                                                    {s.name}
                                                </p>
                                                <p className="text-[10px] text-[var(--text-muted)]">
                                                    Roll {s.rollNo}
                                                </p>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    )}
                </>
            )}
        </div>
    )
}