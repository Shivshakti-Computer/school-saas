// -------------------------------------------------------------
// FILE: src/app/(dashboard)/parent/attendance/page.tsx
// Parent — bachche ki attendance dekho
// -------------------------------------------------------------
'use client'
import { useState, useEffect } from 'react'
import { Card, PageHeader, Select, Spinner } from '@/components/ui'

export default function ParentAttendancePage() {
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
    const [records, setRecords] = useState<any[]>([])
    const [summary, setSummary] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        // Parent role ke liye same API hai — server automatically parent's child detect karta hai
        fetch(`/api/students/attendance?month=${month}`)
            .then(r => r.json())
            .then(d => {
                setRecords(d.records ?? [])
                setSummary(d.summary)
                setLoading(false)
            })
    }, [month])

    const statusColor: Record<string, string> = {
        present: 'bg-emerald-100 text-emerald-700',
        absent: 'bg-red-100 text-red-700',
        late: 'bg-amber-100 text-amber-700',
    }

    return (
        <div className="space-y-4">
            <PageHeader title="Attendance" subtitle="Bachche ki monthly attendance" />

            <Select
                options={months}
                value={month}
                onChange={e => setMonth(e.target.value)}
                className="w-52"
            />

            {summary && (
                <div className="grid grid-cols-4 gap-3">
                    {[
                        { label: 'Total', val: summary.total, bg: 'bg-slate-50 text-slate-700' },
                        { label: 'Present', val: summary.present, bg: 'bg-emerald-50 text-emerald-700' },
                        { label: 'Absent', val: summary.absent, bg: 'bg-red-50 text-red-700' },
                        {
                            label: '%',
                            val: `${summary.percentage}%`,
                            bg: summary.percentage >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700',
                        },
                    ].map(s => (
                        <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                            <p className="text-xl font-bold">{s.val}</p>
                            <p className="text-xs opacity-70">{s.label}</p>
                        </div>
                    ))}
                </div>
            )}

            <Card padding={false}>
                {loading ? (
                    <div className="flex justify-center py-12"><Spinner size="lg" /></div>
                ) : records.length === 0 ? (
                    <p className="text-center py-10 text-slate-400 text-sm">Is mahine ka record nahi mila</p>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {records.map((r: any) => (
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