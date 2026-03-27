// -------------------------------------------------------------
// FILE: src/app/(dashboard)/student/attendance/page.tsx
// -------------------------------------------------------------
'use client'
import { useState, useEffect } from 'react'
import { Card, PageHeader, Select, Spinner } from '@/components/ui'

interface AttRecord {
    _id: string
    date: string
    status: 'present' | 'absent' | 'late' | 'holiday' | 'half-day'
}

interface Summary {
    total: number; present: number; absent: number; late: number; percentage: number
}

export default function StudentAttendancePage() {
    const months = Array.from({ length: 12 }, (_, i) => {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const val = d.toISOString().slice(0, 7)
        return {
            value: val,
            label: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        }
    })

    const [month, setMonth] = useState(months[0].value)
    const [records, setRecords] = useState<AttRecord[]>([])
    const [summary, setSummary] = useState<Summary | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        fetch(`/api/students/attendance?month=${month}`)
            .then(r => r.json())
            .then(d => {
                setRecords(d.records ?? [])
                setSummary(d.summary ?? null)
                setLoading(false)
            })
    }, [month])

    const statusColor: Record<string, string> = {
        present: 'bg-emerald-100 text-emerald-700',
        absent: 'bg-red-100 text-red-700',
        late: 'bg-amber-100 text-amber-700',
        holiday: 'bg-blue-100 text-blue-700',
        'half-day': 'bg-purple-100 text-purple-700',
    }

    return (
        <div className="space-y-4">
            <PageHeader title="Attendance" subtitle="Apni attendance history dekho" />

            <div className="flex gap-3">
                <Select
                    options={months}
                    value={month}
                    onChange={e => setMonth(e.target.value)}
                    className="w-52"
                />
            </div>

            {/* Summary cards */}
            {summary && (
                <div className="grid grid-cols-4 gap-3">
                    {[
                        { label: 'Total Days', val: summary.total, color: 'bg-slate-50 text-slate-700' },
                        { label: 'Present', val: summary.present, color: 'bg-emerald-50 text-emerald-700' },
                        { label: 'Absent', val: summary.absent, color: 'bg-red-50 text-red-700' },
                        {
                            label: 'Percentage', val: `${summary.percentage}%`,
                            color: summary.percentage >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        },
                    ].map(s => (
                        <div key={s.label} className={`${s.color} rounded-xl p-4`}>
                            <p className="text-2xl font-bold">{s.val}</p>
                            <p className="text-xs opacity-70 mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Attendance list */}
            <Card padding={false}>
                {loading ? (
                    <div className="flex justify-center py-12"><Spinner size="lg" /></div>
                ) : records.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-sm">
                        Is mahine ka koi record nahi mila
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {records.map(r => (
                            <div key={r._id} className="flex items-center justify-between px-5 py-3">
                                <p className="text-sm text-slate-700">
                                    {new Date(r.date).toLocaleDateString('en-IN', {
                                        weekday: 'short', day: 'numeric', month: 'short',
                                    })}
                                </p>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColor[r.status] ?? 'bg-slate-100 text-slate-600'}`}>
                                    {r.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    )
}