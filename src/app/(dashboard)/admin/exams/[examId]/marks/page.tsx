// FILE: src/app/(dashboard)/admin/exams/[examId]/marks/page.tsx
// Marks entry page — teacher/admin marks bharta hai

'use client'
import { useState, useEffect, use } from 'react'
import {
    Button, Badge, Card, PageHeader, Alert, Spinner, EmptyState,
} from '@/components/ui'
import { BookOpen, Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface SubjectConfig {
    name: string
    maxMarks: number
    minMarks: number
    date: string
}

interface StudentMark {
    studentId: string
    name: string
    admissionNo: string
    rollNo: string
    marks: Record<string, { marksObtained: number; isAbsent: boolean }>
}

export default function MarksEntryPage({
    params,
}: {
    params: Promise<{ examId: string }>
}) {
    // Next.js 15+ — params is a Promise
    const { examId } = use(params)

    const [exam, setExam] = useState<any>(null)
    const [students, setStudents] = useState<StudentMark[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

    useEffect(() => {
        loadData()
    }, [examId])

    const loadData = async () => {
        setLoading(true)
        try {
            // Exam details
            const examRes = await fetch(`/api/exams/${examId}`)
            const examData = await examRes.json()
            if (!examRes.ok) throw new Error(examData.error)
            setExam(examData.exam)

            // Students in that class
            const stuRes = await fetch(
                `/api/students?class=${examData.exam.class}&section=${examData.exam.section ?? ''}&limit=200`
            )
            const stuData = await stuRes.json()

            // Existing results
            const resRes = await fetch(`/api/exams/results?examId=${examId}`)
            const resData = await resRes.json()

            // Map existing results
            const existingMap: Record<string, any> = {}
            for (const r of resData.results ?? []) {
                existingMap[r.studentId._id ?? r.studentId] = r
            }

            // Build student marks grid
            const grid: StudentMark[] = (stuData.students ?? []).map((s: any) => {
                const existing = existingMap[s._id]
                const marks: Record<string, { marksObtained: number; isAbsent: boolean }> = {}

                for (const sub of examData.exam.subjects ?? []) {
                    const existingMark = existing?.marks?.find((m: any) => m.subject === sub.name)
                    marks[sub.name] = {
                        marksObtained: existingMark?.marksObtained ?? 0,
                        isAbsent: existingMark?.isAbsent ?? false,
                    }
                }

                return {
                    studentId: s._id,
                    name: s.userId?.name ?? '',
                    admissionNo: s.admissionNo,
                    rollNo: s.rollNo,
                    marks,
                }
            })

            setStudents(grid)
        } catch (err: any) {
            setAlert({ type: 'error', msg: err.message })
        }
        setLoading(false)
    }

    const updateMark = (
        studentId: string,
        subject: string,
        field: 'marksObtained' | 'isAbsent',
        value: any
    ) => {
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
                            // If marking absent, clear marks
                            ...(field === 'isAbsent' && value ? { marksObtained: 0 } : {}),
                        },
                    },
                }
            })
        )
    }

    const saveMarks = async () => {
        setSaving(true)
        setAlert(null)

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

        setSaving(false)

        if (res.ok) {
            setAlert({ type: 'success', msg: `Marks saved for ${students.length} students!` })
        } else {
            const d = await res.json()
            setAlert({ type: 'error', msg: d.error ?? 'Failed to save marks' })
        }
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
                action={<Link href="/admin/exams"><Button variant="secondary" size="sm">Back to Exams</Button></Link>}
            />
        )
    }

    const subjects: SubjectConfig[] = exam.subjects ?? []

    return (
        <div>
            <div className="flex items-center gap-3 mb-1">
                <Link href="/admin/exams">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft size={14} /> Back
                    </Button>
                </Link>
            </div>

            <PageHeader
                title={`Enter Marks — ${exam.name}`}
                subtitle={`Class ${exam.class}${exam.section ? ` - ${exam.section}` : ''} · ${students.length} students`}
                action={
                    <Button onClick={saveMarks} loading={saving}>
                        <Save size={14} /> Save All Marks
                    </Button>
                }
            />

            {alert && (
                <div className="mb-4">
                    <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
                </div>
            )}

            {/* Subject headers info */}
            <div className="flex gap-2 flex-wrap mb-4">
                {subjects.map(sub => (
                    <div key={sub.name} className="bg-white border border-slate-200 rounded-lg px-3 py-2">
                        <p className="text-xs font-semibold text-slate-700">{sub.name}</p>
                        <p className="text-xs text-slate-400">Max: {sub.maxMarks} · Pass: {sub.minMarks}</p>
                    </div>
                ))}
            </div>

            {/* Marks grid */}
            <Card padding={false}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide sticky left-0 bg-white min-w-[200px]">
                                    Student
                                </th>
                                {subjects.map(sub => (
                                    <th
                                        key={sub.name}
                                        className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide min-w-[140px]"
                                    >
                                        <div>{sub.name}</div>
                                        <div className="text-slate-400 font-normal normal-case">/{sub.maxMarks}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {students.map(s => (
                                <tr key={s.studentId} className="hover:bg-slate-50/60">
                                    <td className="px-4 py-3 sticky left-0 bg-white">
                                        <p className="text-sm font-medium text-slate-700">{s.name}</p>
                                        <p className="text-xs text-slate-400 font-mono">{s.admissionNo} · Roll {s.rollNo}</p>
                                    </td>
                                    {subjects.map(sub => {
                                        const mark = s.marks[sub.name] ?? { marksObtained: 0, isAbsent: false }
                                        return (
                                            <td key={sub.name} className="px-3 py-2 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={sub.maxMarks}
                                                        value={mark.isAbsent ? '' : mark.marksObtained || ''}
                                                        disabled={mark.isAbsent}
                                                        placeholder={mark.isAbsent ? 'AB' : '0'}
                                                        onChange={e =>
                                                            updateMark(s.studentId, sub.name, 'marksObtained', e.target.value)
                                                        }
                                                        className={`w-20 h-8 text-center text-sm rounded-lg border transition-colors
                              ${mark.isAbsent
                                                                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                                                : Number(mark.marksObtained) < sub.minMarks && mark.marksObtained > 0
                                                                    ? 'border-red-300 bg-red-50 text-red-700 focus:border-red-400'
                                                                    : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'
                                                            }`}
                                                    />
                                                    <label className="flex items-center gap-1 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={mark.isAbsent}
                                                            onChange={e =>
                                                                updateMark(s.studentId, sub.name, 'isAbsent', e.target.checked)
                                                            }
                                                            className="w-3 h-3 rounded"
                                                        />
                                                        <span className="text-xs text-slate-400">Absent</span>
                                                    </label>
                                                </div>
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {students.length > 10 && (
                <div className="flex justify-end mt-4">
                    <Button onClick={saveMarks} loading={saving}>
                        <Save size={14} /> Save All Marks
                    </Button>
                </div>
            )}
        </div>
    )
}