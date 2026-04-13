// FILE: src/app/(dashboard)/parent/results/page.tsx
// Parent portal — bachhe ke results dekho
// ═══════════════════════════════════════════════════════════

'use client'

import { useState, useEffect } from 'react'
import {
    PageHeader, Badge, Card, Spinner, EmptyState, StatCard,
} from '@/components/ui'
import {
    BookOpen, Trophy, TrendingUp, CheckCircle,
    Download, ChevronDown, ChevronUp,
} from 'lucide-react'

interface Mark {
    subject: string
    marksObtained: number
    maxMarks: number
    grade: string
    isAbsent: boolean
}

interface ResultItem {
    _id: string
    examId: {
        name: string
        class: string
        section: string
        academicYear: string
        resultPublished: boolean
    }
    studentId: {
        admissionNo: string
        rollNo: string
        class: string
        userId: { name: string }
    }
    marks: Mark[]
    totalMarks: number
    totalObtained: number
    percentage: number
    grade: string
    rank?: number
    isPassed: boolean
}

function gradeColor(grade: string): string {
    const map: Record<string, string> = {
        'A+': 'text-emerald-600', 'A': 'text-green-600',
        'B+': 'text-blue-600', 'B': 'text-indigo-600',
        'C+': 'text-amber-600', 'C': 'text-orange-600',
        'D': 'text-red-500', 'F': 'text-red-700',
    }
    return map[grade] ?? 'text-slate-600'
}

export default function ParentResultsPage() {
    const [results, setResults] = useState<ResultItem[]>([])
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState<string | null>(null)

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const res = await fetch('/api/students/results')
                const data = await res.json()
                setResults(data.results ?? [])
            } catch (err) {
                console.error('[PARENT RESULTS]', err)
            } finally {
                setLoading(false)
            }
        }
        fetchResults()
    }, [])

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <Spinner size="lg" />
            </div>
        )
    }

    return (
        <div className="portal-content-enter">

            <PageHeader
                title="Results"
                subtitle="View your child's exam results and report cards"
            />

            {results.length === 0 ? (
                <EmptyState
                    icon={<BookOpen size={24} />}
                    title="No results published"
                    description="Results will appear here once your school publishes them"
                />
            ) : (
                <div className="space-y-4">
                    {results.map(result => (
                        <Card key={result._id}>
                            <div
                                className="flex items-center justify-between cursor-pointer"
                                onClick={() =>
                                    setExpanded(expanded === result._id ? null : result._id)
                                }
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h3 className="font-semibold text-[var(--text-primary)]">
                                            {result.examId?.name}
                                        </h3>
                                        <Badge variant={result.isPassed ? 'success' : 'danger'}>
                                            {result.isPassed ? '✅ Pass' : '❌ Fail'}
                                        </Badge>
                                        {result.rank && (
                                            <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
                                                <Trophy size={12} />
                                                Rank #{result.rank}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)] mt-1">
                                        {result.studentId?.userId?.name} ·
                                        {result.examId?.academicYear} ·
                                        Class {result.examId?.class}
                                        {result.examId?.section ? ` - ${result.examId.section}` : ''}
                                    </p>
                                </div>

                                <div className="flex items-center gap-6 mr-4">
                                    <div className="text-center">
                                        <p className="text-xs text-[var(--text-muted)]">Marks</p>
                                        <p className="font-bold text-[var(--text-primary)]">
                                            {result.totalObtained}/{result.totalMarks}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-[var(--text-muted)]">%</p>
                                        <p className={`font-bold ${result.percentage >= 60
                                                ? 'text-[var(--success-dark)]'
                                                : 'text-[var(--danger-dark)]'
                                            }`}>
                                            {result.percentage}%
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-[var(--text-muted)]">Grade</p>
                                        <p className={`text-lg font-black ${gradeColor(result.grade)}`}>
                                            {result.grade}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <a
                                        href={`/api/pdf/reportcard/${result._id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={e => e.stopPropagation()}
                                        className="flex items-center gap-1 text-xs text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium px-2.5 py-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] hover:bg-[var(--bg-muted)] transition-all"
                                    >
                                        <Download size={12} /> Report Card
                                    </a>
                                    {expanded === result._id
                                        ? <ChevronUp size={16} className="text-[var(--text-muted)]" />
                                        : <ChevronDown size={16} className="text-[var(--text-muted)]" />
                                    }
                                </div>
                            </div>

                            {/* Breakdown */}
                            {expanded === result._id && (
                                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                                    <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">
                                        Subject-wise Marks
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {result.marks.map(m => (
                                            <div
                                                key={m.subject}
                                                className="flex items-center justify-between p-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-muted)] border border-[var(--border)]"
                                            >
                                                <span className="text-sm text-[var(--text-primary)] font-medium">
                                                    {m.subject}
                                                </span>
                                                <div className="flex items-center gap-3">
                                                    {m.isAbsent ? (
                                                        <span className="text-xs text-[var(--text-muted)]">Absent</span>
                                                    ) : (
                                                        <span className="text-sm font-semibold text-[var(--text-primary)]">
                                                            {m.marksObtained}/{m.maxMarks}
                                                        </span>
                                                    )}
                                                    <span className={`text-sm font-bold ${gradeColor(m.grade)}`}>
                                                        {m.grade}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}

        </div>
    )
}