// -------------------------------------------------------------
// FILE: src/app/(dashboard)/student/results/page.tsx
// -------------------------------------------------------------
'use client'
import { useState, useEffect } from 'react'
import { Card, PageHeader, Badge, Spinner, EmptyState } from '@/components/ui'
import { BookOpen } from 'lucide-react'

interface ResultItem {
    _id: string
    examId: { name: string; class: string }
    totalMarks: number
    totalObtained: number
    percentage: number
    grade: string
    isPassed: boolean
    marks: Array<{
        subject: string
        marksObtained: number
        maxMarks: number
        grade: string
        isAbsent: boolean
    }>
}

export default function StudentResultsPage() {
    const [results, setResults] = useState<ResultItem[]>([])
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState<string | null>(null)

    useEffect(() => {
        fetch('/api/students/results')
            .then(r => r.json())
            .then(d => { setResults(d.results ?? []); setLoading(false) })
    }, [])

    const gradeColor = (g: string) => {
        if (['A+', 'A'].includes(g)) return 'success'
        if (['B+', 'B'].includes(g)) return 'info'
        if (['C+', 'C'].includes(g)) return 'warning'
        return 'danger'
    }

    return (
        <div className="space-y-4">
            <PageHeader title="Exam Results" subtitle="Apne saare exam results dekho" />

            {loading ? (
                <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : results.length === 0 ? (
                <EmptyState
                    icon={<BookOpen size={24} />}
                    title="Koi result nahi mila"
                    description="Abhi tak koi exam result publish nahi hua hai"
                />
            ) : (
                <div className="space-y-3">
                    {results.map(r => (
                        <Card key={r._id} padding={false}>
                            {/* Result header — click to expand */}
                            <button
                                className="w-full text-left px-5 py-4 flex items-center gap-4"
                                onClick={() => setExpanded(expanded === r._id ? null : r._id)}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 ${r.isPassed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                                    }`}>
                                    {r.grade}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-800">
                                        {(r.examId as any)?.name ?? 'Exam'}
                                    </p>
                                    <p className="text-sm text-slate-500 mt-0.5">
                                        {r.totalObtained}/{r.totalMarks} marks · {r.percentage}%
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={r.isPassed ? 'success' : 'danger'}>
                                        {r.isPassed ? 'PASS' : 'FAIL'}
                                    </Badge>
                                    <span className="text-slate-400 text-sm">
                                        {expanded === r._id ? '▲' : '▼'}
                                    </span>
                                </div>
                            </button>

                            {/* Subject-wise marks — expanded */}
                            {expanded === r._id && (
                                <div className="border-t border-slate-100">
                                    <div className="divide-y divide-slate-50">
                                        {r.marks.map(m => (
                                            <div key={m.subject} className="flex items-center justify-between px-5 py-3">
                                                <p className="text-sm text-slate-700">{m.subject}</p>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-sm text-slate-500">
                                                        {m.isAbsent ? 'Absent' : `${m.marksObtained}/${m.maxMarks}`}
                                                    </p>
                                                    <Badge variant={gradeColor(m.grade) as any}>
                                                        {m.isAbsent ? 'AB' : m.grade}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Download report card */}
                                    <div className="px-5 py-3 border-t border-slate-50">
                                        <button
                                            onClick={() => window.open(`/api/pdf/reportcard/${r._id}`, '_blank')}
                                            className="text-xs text-indigo-600 hover:underline"
                                        >
                                            📄 Download Report Card PDF
                                        </button>
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