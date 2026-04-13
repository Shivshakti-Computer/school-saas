// src/app/(dashboard)/admin/exams/[examId]/results/page.tsx
// NEW: Admin results view
// Shows: pass/fail stats, rank list, subject-wise analysis
// ═══════════════════════════════════════════════════════════

'use client'

import { useState, useEffect, use, useCallback } from 'react'
import Link from 'next/link'
import {
    Button, Card, PageHeader, Spinner, EmptyState, Badge,
} from '@/components/ui'
import {
    ArrowLeft, Trophy, Users, CheckCircle, XCircle,
    TrendingUp, Download, FileText, BarChart3,
} from 'lucide-react'

interface SubjectResult {
    subject: string
    marksObtained: number
    maxMarks: number
    grade: string
    activityGrade: string
    isAbsent: boolean
    components: Array<{ name: string; marksObtained: number; maxMarks: number }>
}

interface StudentResult {
    _id: string
    rank: number
    percentage: number
    grade: string
    isPassed: boolean
    totalMarks: number
    totalObtained: number
    marks: SubjectResult[]
    studentId: {
        admissionNo: string
        rollNo: string
        class: string
        section: string
        userId: { name: string }
    }
}

interface ExamData {
    _id: string
    name: string
    class: string
    section?: string
    academicYear: string
    subjects: any[]
    resultPublished: boolean
    admitCardEnabled: boolean
}

export default function ResultsDashboardPage({
    params,
}: {
    params: Promise<{ examId: string }>
}) {
    const { examId } = use(params)

    const [exam, setExam] = useState<ExamData | null>(null)
    const [results, setResults] = useState<StudentResult[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'overview' | 'ranklist' | 'subjects'>('overview')

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const [examRes, resRes] = await Promise.all([
                fetch(`/api/exams/${examId}`),
                fetch(`/api/exams/results?examId=${examId}`),
            ])
            const [examData, resData] = await Promise.all([
                examRes.json(), resRes.json(),
            ])
            setExam(examData.exam)
            setResults(resData.results ?? [])
        } catch (err) {
            console.error('[RESULTS DASHBOARD]', err)
        } finally {
            setLoading(false)
        }
    }, [examId])

    useEffect(() => { load() }, [load])

    // ── Stats ────────────────────────────────────────────────
    const total = results.length
    const passed = results.filter(r => r.isPassed).length
    const failed = total - passed
    const avgPct = total > 0
        ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / total)
        : 0
    const topScore = results.length > 0
        ? Math.max(...results.map(r => r.percentage))
        : 0

    // Subject-wise pass analysis
    const subjectStats = exam?.subjects.map((sub: any) => {
        const subResults = results.map(r =>
            r.marks.find(m => m.subject === sub.name)
        ).filter(Boolean) as SubjectResult[]

        const subPassed = subResults.filter(
            m => !m.isAbsent && m.marksObtained >= sub.minMarks
        ).length
        const subAbsent = subResults.filter(m => m.isAbsent).length
        const subAvg = subResults.length > 0
            ? Math.round(
                subResults.reduce((s, m) => s + (m.isAbsent ? 0 : m.marksObtained), 0)
                / subResults.length
            )
            : 0

        return {
            name: sub.name,
            maxMarks: sub.totalMaxMarks,
            passed: subPassed,
            failed: subResults.length - subPassed - subAbsent,
            absent: subAbsent,
            total: subResults.length,
            avg: subAvg,
            passRate: subResults.length > 0
                ? Math.round((subPassed / subResults.length) * 100)
                : 0,
        }
    }) ?? []

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
                icon={<BarChart3 size={24} />}
                title="Exam not found"
                action={
                    <Link href="/admin/exams">
                        <Button variant="ghost" size="sm">← Back to Exams</Button>
                    </Link>
                }
            />
        )
    }

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
                title={`Results — ${exam.name}`}
                subtitle={`Class ${exam.class}${exam.section ? ` - ${exam.section}` : ''} · ${exam.academicYear}`}
                action={
                    <div className="flex gap-2">
                        <Link href={`/admin/exams/${examId}/marks`}>
                            <Button variant="ghost" size="sm">
                                <FileText size={14} /> Edit Marks
                            </Button>
                        </Link>
                    </div>
                }
            />

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">

                <div className="portal-stat-card">
                    <div className="flex items-center justify-between mb-2">
                        <span className="stat-label">Total Students</span>
                        <div className="stat-icon bg-[var(--primary-50)]">
                            <Users size={16} className="text-[var(--primary-500)]" />
                        </div>
                    </div>
                    <p className="stat-value">{total}</p>
                </div>

                <div className="portal-stat-card">
                    <div className="flex items-center justify-between mb-2">
                        <span className="stat-label">Passed</span>
                        <div className="stat-icon bg-[var(--success-light)]">
                            <CheckCircle size={16} className="text-[var(--success)]" />
                        </div>
                    </div>
                    <p className="stat-value text-[var(--success)]">{passed}</p>
                    <p className="stat-change stat-change-up">
                        {total > 0 ? Math.round((passed / total) * 100) : 0}% pass rate
                    </p>
                </div>

                <div className="portal-stat-card">
                    <div className="flex items-center justify-between mb-2">
                        <span className="stat-label">Failed</span>
                        <div className="stat-icon bg-[var(--danger-light)]">
                            <XCircle size={16} className="text-[var(--danger)]" />
                        </div>
                    </div>
                    <p className="stat-value text-[var(--danger)]">{failed}</p>
                    <p className="stat-change stat-change-down">
                        {total > 0 ? Math.round((failed / total) * 100) : 0}% fail rate
                    </p>
                </div>

                <div className="portal-stat-card">
                    <div className="flex items-center justify-between mb-2">
                        <span className="stat-label">Class Average</span>
                        <div className="stat-icon bg-[var(--info-light)]">
                            <TrendingUp size={16} className="text-[var(--info)]" />
                        </div>
                    </div>
                    <p className="stat-value">{avgPct}%</p>
                </div>

                <div className="portal-stat-card">
                    <div className="flex items-center justify-between mb-2">
                        <span className="stat-label">Top Score</span>
                        <div className="stat-icon bg-amber-50">
                            <Trophy size={16} className="text-amber-500" />
                        </div>
                    </div>
                    <p className="stat-value">{topScore}%</p>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 mb-5 p-1 bg-[var(--bg-muted)] rounded-[var(--radius-md)] w-fit">
                {[
                    { key: 'overview', label: 'Overview' },
                    { key: 'ranklist', label: 'Rank List' },
                    { key: 'subjects', label: 'Subject Analysis' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className={[
                            'px-4 py-1.5 rounded-[var(--radius-sm)] text-sm font-medium transition-all',
                            activeTab === tab.key
                                ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                        ].join(' ')}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Overview Tab ── */}
            {activeTab === 'overview' && (
                <div className="space-y-4">

                    {/* Pass/Fail bar */}
                    <div className="portal-card">
                        <div className="portal-card-header">
                            <div>
                                <p className="portal-card-title">Pass / Fail Distribution</p>
                                <p className="portal-card-subtitle">
                                    {total} students attempted
                                </p>
                            </div>
                        </div>
                        <div className="portal-card-body">
                            <div className="flex rounded-full overflow-hidden h-6 mb-3">
                                <div
                                    className="bg-[var(--success)] flex items-center justify-center text-white text-xs font-bold transition-all"
                                    style={{ width: `${total > 0 ? (passed / total) * 100 : 0}%` }}
                                >
                                    {total > 0 && passed > 0
                                        ? `${Math.round((passed / total) * 100)}%`
                                        : ''}
                                </div>
                                <div
                                    className="bg-[var(--danger)] flex items-center justify-center text-white text-xs font-bold transition-all"
                                    style={{ width: `${total > 0 ? (failed / total) * 100 : 0}%` }}
                                >
                                    {total > 0 && failed > 0
                                        ? `${Math.round((failed / total) * 100)}%`
                                        : ''}
                                </div>
                            </div>
                            <div className="flex gap-4 text-xs">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--success)]" />
                                    <span className="text-[var(--text-secondary)]">
                                        Passed ({passed})
                                    </span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--danger)]" />
                                    <span className="text-[var(--text-secondary)]">
                                        Failed ({failed})
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Grade distribution */}
                    <div className="portal-card">
                        <div className="portal-card-header">
                            <p className="portal-card-title">Grade Distribution</p>
                        </div>
                        <div className="portal-card-body">
                            <div className="flex flex-wrap gap-3">
                                {['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'].map(g => {
                                    const count = results.filter(r => r.grade === g).length
                                    if (count === 0) return null
                                    return (
                                        <div
                                            key={g}
                                            className="flex flex-col items-center p-3 bg-[var(--bg-muted)] rounded-[var(--radius-md)] min-w-[60px]"
                                        >
                                            <span className="text-lg font-black text-[var(--primary-600)]">
                                                {g}
                                            </span>
                                            <span className="text-xl font-bold text-[var(--text-primary)]">
                                                {count}
                                            </span>
                                            <span className="text-[10px] text-[var(--text-muted)]">
                                                students
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Rank List Tab ── */}
            {activeTab === 'ranklist' && (
                <div className="portal-card">
                    <div className="portal-card-header">
                        <p className="portal-card-title">
                            Rank List — {exam.name}
                        </p>
                        <span className="text-xs text-[var(--text-muted)]">
                            {total} students
                        </span>
                    </div>
                    <div className="table-wrapper">
                        <table className="portal-table">
                            <thead>
                                <tr>
                                    {['Rank', 'Student', 'Adm No', 'Roll No',
                                        'Obtained', 'Total', '%', 'Grade', 'Result',
                                        'Report Card'].map(h => (
                                            <th key={h}>{h}</th>
                                        ))}
                                </tr>
                            </thead>
                            <tbody>
                                {results.map(r => (
                                    <tr key={r._id}>
                                        {/* Rank */}
                                        <td>
                                            <div className={[
                                                'inline-flex items-center justify-center',
                                                'w-7 h-7 rounded-full text-xs font-black',
                                                r.rank === 1
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : r.rank === 2
                                                        ? 'bg-slate-100 text-slate-600'
                                                        : r.rank === 3
                                                            ? 'bg-orange-100 text-orange-700'
                                                            : 'bg-[var(--bg-muted)] text-[var(--text-secondary)]',
                                            ].join(' ')}>
                                                {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank}
                                            </div>
                                        </td>

                                        {/* Student */}
                                        <td>
                                            <p className="font-semibold text-sm text-[var(--text-primary)]">
                                                {r.studentId?.userId?.name || '—'}
                                            </p>
                                        </td>

                                        <td className="font-mono text-xs text-[var(--text-muted)]">
                                            {r.studentId?.admissionNo}
                                        </td>

                                        <td className="text-sm text-[var(--text-secondary)]">
                                            {r.studentId?.rollNo}
                                        </td>

                                        <td className="text-sm font-semibold text-[var(--text-primary)]">
                                            {r.totalObtained}
                                        </td>

                                        <td className="text-sm text-[var(--text-muted)]">
                                            {r.totalMarks}
                                        </td>

                                        <td>
                                            <span className={[
                                                'text-sm font-bold',
                                                r.percentage >= 75
                                                    ? 'text-[var(--success)]'
                                                    : r.percentage >= 50
                                                        ? 'text-[var(--warning)]'
                                                        : 'text-[var(--danger)]',
                                            ].join(' ')}>
                                                {r.percentage}%
                                            </span>
                                        </td>

                                        <td>
                                            <span className="font-black text-[var(--primary-600)] text-sm">
                                                {r.grade}
                                            </span>
                                        </td>

                                        <td>
                                            <span className={[
                                                'status-pill',
                                                r.isPassed ? 'status-active' : 'status-error',
                                            ].join(' ')}>
                                                {r.isPassed ? 'Pass' : 'Fail'}
                                            </span>
                                        </td>

                                        {/* Report Card Download */}
                                        <td>
                                            <a
                                                href={`/api/pdf/reportcard/${r._id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-xs text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium transition-colors"
                                            >
                                                <Download size={12} /> View PDF
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {results.length === 0 && (
                        <div className="portal-empty">
                            <div className="portal-empty-icon">
                                <Trophy size={20} />
                            </div>
                            <p className="portal-empty-title">No results yet</p>
                            <p className="portal-empty-text">
                                Enter marks first to see the rank list
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* ── Subject Analysis Tab ── */}
            {activeTab === 'subjects' && (
                <div className="portal-card">
                    <div className="portal-card-header">
                        <p className="portal-card-title">Subject-wise Analysis</p>
                    </div>
                    <div className="table-wrapper">
                        <table className="portal-table">
                            <thead>
                                <tr>
                                    {['Subject', 'Max Marks', 'Avg Score',
                                        'Pass', 'Fail', 'Absent', 'Pass Rate'].map(h => (
                                            <th key={h}>{h}</th>
                                        ))}
                                </tr>
                            </thead>
                            <tbody>
                                {subjectStats.map(sub => (
                                    <tr key={sub.name}>
                                        <td className="font-semibold text-[var(--text-primary)]">
                                            {sub.name}
                                        </td>
                                        <td className="text-[var(--text-muted)] text-sm">
                                            {sub.maxMarks}
                                        </td>
                                        <td className="font-semibold text-sm">
                                            {sub.avg}
                                        </td>
                                        <td>
                                            <span className="text-[var(--success)] font-bold text-sm">
                                                {sub.passed}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="text-[var(--danger)] font-bold text-sm">
                                                {sub.failed}
                                            </span>
                                        </td>
                                        <td className="text-[var(--text-muted)] text-sm">
                                            {sub.absent}
                                        </td>
                                        <td>
                                            {/* Pass rate bar */}
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-[var(--border)] rounded-full h-1.5 min-w-[60px]">
                                                    <div
                                                        className="h-1.5 rounded-full bg-[var(--success)] transition-all"
                                                        style={{ width: `${sub.passRate}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-semibold text-[var(--text-secondary)] w-8">
                                                    {sub.passRate}%
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

        </div>
    )
}