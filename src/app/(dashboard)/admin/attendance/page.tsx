/* ============================================================
   FILE: src/app/(dashboard)/admin/attendance/page.tsx
   Attendance marking — class select, bulk mark, save
   ============================================================ */

'use client'
import { useState, useEffect } from 'react'
import {
    Button, Badge, Card, Table, Tr, Td,
    PageHeader, Select, Alert, Spinner, EmptyState,
} from '@/components/ui'
import { CheckSquare, Save } from 'lucide-react'

type AttStatus = 'present' | 'absent' | 'late' | 'pending'

interface AttRow {
    studentId: string
    admissionNo: string
    rollNo: string
    name: string
    status: AttStatus
    attendanceId: string | null
}

const CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
const SECTIONS = ['A', 'B', 'C', 'D']

export default function AttendancePage() {
    const [cls, setCls] = useState('')
    const [section, setSection] = useState('A')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [list, setList] = useState<AttRow[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const [fetched, setFetched] = useState(false)

    const fetchAttendance = async () => {
        if (!cls) return
        setLoading(true)
        setFetched(false)
        const res = await fetch(`/api/attendance?class=${cls}&section=${section}&date=${date}`)
        const data = await res.json()
        setList(data.list ?? [])
        setLoading(false)
        setFetched(true)
    }

    // Toggle status cycling: pending → present → absent → late → present
    const toggle = (studentId: string) => {
        setList(prev => prev.map(r => {
            if (r.studentId !== studentId) return r
            const next: Record<AttStatus, AttStatus> = {
                pending: 'present',
                present: 'absent',
                absent: 'late',
                late: 'present',
            }
            return { ...r, status: next[r.status] }
        }))
    }

    // Mark all present
    const markAll = (status: AttStatus) => {
        setList(prev => prev.map(r => ({ ...r, status })))
    }

    const saveAttendance = async () => {
        const unmarked = list.filter(r => r.status === 'pending')
        if (unmarked.length > 0) {
            setAlert({ type: 'error', msg: `${unmarked.length} students still pending. Mark them first.` })
            return
        }

        setSaving(true)
        const res = await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date,
                records: list.map(r => ({ studentId: r.studentId, status: r.status })),
            }),
        })
        setSaving(false)

        if (res.ok) {
            setAlert({ type: 'success', msg: `Attendance saved! Absent students' parents will get SMS.` })
        } else {
            setAlert({ type: 'error', msg: 'Failed to save attendance' })
        }
    }

    const presentCount = list.filter(r => r.status === 'present').length
    const absentCount = list.filter(r => r.status === 'absent').length
    const lateCount = list.filter(r => r.status === 'late').length

    const statusStyle: Record<AttStatus, string> = {
        present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        absent: 'bg-red-50 text-red-700 border-red-200',
        late: 'bg-amber-50 text-amber-700 border-amber-200',
        pending: 'bg-slate-50 text-slate-500 border-slate-200',
    }

    return (
        <div>
            <PageHeader
                title="Attendance"
                subtitle="Mark daily attendance for your class"
            />

            {alert && (
                <div className="mb-4">
                    <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
                </div>
            )}

            {/* Filter bar */}
            <Card className="mb-4">
                <div className="flex flex-wrap gap-3 items-end">
                    <Select
                        label="Class"
                        options={[{ value: '', label: 'Select Class' }, ...CLASSES.map(c => ({ value: c, label: `Class ${c}` }))]}
                        value={cls}
                        onChange={e => setCls(e.target.value)}
                        className="w-36"
                    />
                    <Select
                        label="Section"
                        options={SECTIONS.map(s => ({ value: s, label: `Section ${s}` }))}
                        value={section}
                        onChange={e => setSection(e.target.value)}
                        className="w-32"
                    />
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-600">Date</label>
                        <input
                            type="date"
                            value={date}
                            max={new Date().toISOString().split('T')[0]}
                            onChange={e => setDate(e.target.value)}
                            className="h-9 px-3 text-sm rounded-lg border border-slate-200 focus:border-indigo-400"
                        />
                    </div>
                    <Button onClick={fetchAttendance} disabled={!cls} loading={loading}>
                        Load Students
                    </Button>
                </div>
            </Card>

            {/* Stats row */}
            {fetched && list.length > 0 && (
                <div className="grid grid-cols-4 gap-3 mb-4">
                    {[
                        { label: 'Total', val: list.length, color: 'bg-slate-100 text-slate-700' },
                        { label: 'Present', val: presentCount, color: 'bg-emerald-50 text-emerald-700' },
                        { label: 'Absent', val: absentCount, color: 'bg-red-50 text-red-700' },
                        { label: 'Late', val: lateCount, color: 'bg-amber-50 text-amber-700' },
                    ].map(s => (
                        <div key={s.label} className={`rounded-xl px-4 py-3 ${s.color}`}>
                            <p className="text-2xl font-bold">{s.val}</p>
                            <p className="text-xs opacity-70">{s.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Mark all buttons + Save */}
            {fetched && list.length > 0 && (
                <Card className="mb-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex gap-2">
                            <span className="text-xs text-slate-500 self-center">Mark All:</span>
                            <Button variant="secondary" size="sm" onClick={() => markAll('present')}>
                                All Present
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => markAll('absent')}>
                                All Absent
                            </Button>
                        </div>
                        <Button onClick={saveAttendance} loading={saving} size="md">
                            <Save size={14} />
                            Save Attendance
                        </Button>
                    </div>
                </Card>
            )}

            {/* Student list */}
            {loading ? (
                <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : fetched && list.length === 0 ? (
                <EmptyState
                    icon={<CheckSquare size={24} />}
                    title="No students found"
                    description="Select a class and section to load students"
                />
            ) : fetched ? (
                <Card padding={false}>
                    <Table headers={['Roll No', 'Name', 'Adm No', 'Status', 'Toggle']}>
                        {list.map(row => (
                            <Tr key={row.studentId}>
                                <Td>
                                    <span className="font-mono text-xs text-slate-500">
                                        {row.rollNo}
                                    </span>
                                </Td>
                                <Td>
                                    <p className="text-sm font-medium text-slate-700">{row.name}</p>
                                </Td>
                                <Td>
                                    <span className="font-mono text-xs text-slate-400">
                                        {row.admissionNo}
                                    </span>
                                </Td>
                                <Td>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border capitalize ${statusStyle[row.status]}`}>
                                        {row.status}
                                    </span>
                                </Td>
                                <Td>
                                    <button
                                        onClick={() => toggle(row.studentId)}
                                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 transition-colors"
                                    >
                                        Change →
                                    </button>
                                </Td>
                            </Tr>
                        ))}
                    </Table>
                </Card>
            ) : (
                <EmptyState
                    icon={<CheckSquare size={24} />}
                    title="Select class and click Load Students"
                    description="Attendance will appear here"
                />
            )}
        </div>
    )
}