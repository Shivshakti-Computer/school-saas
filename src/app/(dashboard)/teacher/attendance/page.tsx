'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, PageHeader, Select, Button, Alert, Spinner } from '@/components/ui'

type AttStatus = 'present' | 'absent' | 'late' | 'pending'

interface AttRow {
    studentId: string
    name: string
    admissionNo: string
    rollNo: string
    status: AttStatus
}

export default function TeacherAttendancePage() {
    const { data: session } = useSession()
    
    // FIX 1 & 2: Casting session.user as 'any' to allow 'class' and 'section' properties
    const [cls, setCls] = useState((session?.user as any)?.class ?? '')
    const [section, setSection] = useState((session?.user as any)?.section ?? 'A')
    
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [list, setList] = useState<AttRow[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const [fetched, setFetched] = useState(false)

    const fetchAttendance = async () => {
        if (!cls) return
        setLoading(true)
        const params = new URLSearchParams()
        if (cls) params.set('class', cls)
        if (section) params.set('section', section)
        if (date) params.set('date', date)

        const res = await fetch(`/api/attendance?${params}`)
        const data = await res.json()
        setList(data.list ?? [])
        setLoading(false)
        setFetched(true)
    }

    const toggle = (studentId: string) => {
        const cycle: Record<AttStatus, AttStatus> = { pending: 'present', present: 'absent', absent: 'late', late: 'present' }
        setList(prev => prev.map(r => r.studentId === studentId ? { ...r, status: cycle[r.status] } : r))
    }

    const markAll = (s: AttStatus) => setList(prev => prev.map(r => ({ ...r, status: s })))

    const save = async () => {
        const unmarked = list.filter(r => r.status === 'pending')
        if (unmarked.length) { setAlert({ type: 'error', msg: `${unmarked.length} students still pending` }); return }
        setSaving(true)
        const res = await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, records: list.map(r => ({ studentId: r.studentId, status: r.status })) }),
        })
        setSaving(false)
        setAlert(res.ok ? { type: 'success', msg: 'Attendance saved!' } : { type: 'error', msg: 'Save failed' })
    }

    const statusStyle: Record<AttStatus, string> = {
        present: 'bg-emerald-100 text-emerald-700',
        absent: 'bg-red-100 text-red-700',
        late: 'bg-amber-100 text-amber-700',
        pending: 'bg-slate-100 text-slate-500',
    }

    return (
        <div>
            <PageHeader title="Mark Attendance" subtitle="Your class attendance" />
            
            {/* FIX 3: Wrapped Alert in a div because Alert doesn't support className */}
            {alert && (
                <div className="mb-4">
                    <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
                </div>
            )}

            <Card className="mb-4">
                <div className="flex flex-wrap gap-3 items-end">
                    <Select label="Class" options={[{ value: '', label: 'Select' }, ...['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(c => ({ value: c, label: `Class ${c}` }))]}
                        value={cls} onChange={e => setCls(e.target.value)} className="w-32" />
                    <Select label="Section" options={['A', 'B', 'C', 'D'].map(s => ({ value: s, label: `Section ${s}` }))}
                        value={section} onChange={e => setSection(e.target.value)} className="w-32" />
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-600">Date</label>
                        <input type="date" value={date} max={new Date().toISOString().split('T')[0]}
                            onChange={e => setDate(e.target.value)}
                            className="h-9 px-3 text-sm rounded-lg border border-slate-200" />
                    </div>
                    <Button onClick={fetchAttendance} disabled={!cls} loading={loading}>Load Students</Button>
                </div>
            </Card>

            {fetched && list.length > 0 && (
                <Card className="mb-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex gap-2">
                            <span className="text-xs text-slate-500 self-center">Mark All:</span>
                            <Button variant="secondary" size="sm" onClick={() => markAll('present')}>All Present</Button>
                            <Button variant="secondary" size="sm" onClick={() => markAll('absent')}>All Absent</Button>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex gap-3 text-xs">
                                <span className="text-emerald-600">{list.filter(r => r.status === 'present').length} Present</span>
                                <span className="text-red-500">{list.filter(r => r.status === 'absent').length} Absent</span>
                                <span className="text-amber-600">{list.filter(r => r.status === 'late').length} Late</span>
                            </div>
                            <Button onClick={save} loading={saving}>Save Attendance</Button>
                        </div>
                    </div>
                </Card>
            )}

            {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div>
                : fetched && list.length > 0 ? (
                    <Card padding={false}>
                        <div className="divide-y divide-slate-50">
                            {list.map(row => (
                                <div key={row.studentId} className="flex items-center justify-between px-5 py-3">
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">{row.name}</p>
                                        <p className="text-xs text-slate-400 font-mono">Roll {row.rollNo} · {row.admissionNo}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusStyle[row.status]}`}>{row.status}</span>
                                        <button onClick={() => toggle(row.studentId)}
                                            className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 transition-colors">
                                            Change →
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                ) : fetched && (
                    <Card><p className="text-center text-slate-400 text-sm py-8">No students found for this class</p></Card>
                )}
        </div>
    )
}