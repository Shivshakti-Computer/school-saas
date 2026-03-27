/* ============================================================
   FILE: src/app/(dashboard)/admin/exams/page.tsx
   Exam schedule + marks entry
   ============================================================ */

'use client'
import { useState, useEffect } from 'react'
import {
    Button, Badge, Card, Table, Tr, Td,
    PageHeader, Modal, Input, Select, Alert,
    EmptyState, Spinner,
} from '@/components/ui'
import { BookOpen, Plus } from 'lucide-react'

interface Exam {
    _id: string
    name: string
    class: string
    section?: string
    academicYear: string
    status: 'upcoming' | 'ongoing' | 'completed'
    resultPublished: boolean
    subjects: Array<{ name: string; date: string; maxMarks: number; minMarks: number }>
}

export default function ExamsClient() {
    const [exams, setExams] = useState<Exam[]>([])
    const [loading, setLoading] = useState(true)
    const [showAdd, setShowAdd] = useState(false)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

    const fetchExams = async () => {
        setLoading(true)
        const res = await fetch('/api/exams')
        const data = await res.json()
        setExams(data.exams ?? [])
        setLoading(false)
    }

    useEffect(() => {
        fetchExams()
        if (window.location.search.includes('action=add')) setShowAdd(true)
    }, [])

    const statusBadge = (s: string) => {
        const map: Record<string, any> = {
            upcoming: 'info',
            ongoing: 'warning',
            completed: 'success',
        }
        return <Badge variant={map[s] ?? 'default'}>{s}</Badge>
    }

    return (
        <div>
            <PageHeader
                title="Exams & Results"
                subtitle="Schedule exams and manage marks"
                action={
                    <Button size="sm" onClick={() => setShowAdd(true)}>
                        <Plus size={14} /> Schedule Exam
                    </Button>
                }
            />

            {alert && (
                <div className="mb-4">
                    <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : exams.length === 0 ? (
                <EmptyState
                    icon={<BookOpen size={24} />}
                    title="No exams scheduled"
                    description="Schedule your first exam to start entering marks"
                    action={<Button size="sm" onClick={() => setShowAdd(true)}>Schedule Exam</Button>}
                />
            ) : (
                <Card padding={false}>
                    <Table headers={['Exam Name', 'Class', 'Year', 'Subjects', 'Status', 'Results', 'Actions']}>
                        {exams.map(ex => (
                            <Tr key={ex._id}>
                                <Td className="font-medium text-slate-700">{ex.name}</Td>
                                <Td>
                                    <Badge variant="purple">
                                        {ex.class}{ex.section ? ` - ${ex.section}` : ''}
                                    </Badge>
                                </Td>
                                <Td className="text-slate-500 text-sm">{ex.academicYear}</Td>
                                <Td className="text-slate-500 text-sm">{ex.subjects?.length ?? 0} subjects</Td>
                                <Td>{statusBadge(ex.status)}</Td>
                                <Td>
                                    <Badge variant={ex.resultPublished ? 'success' : 'default'}>
                                        {ex.resultPublished ? 'Published' : 'Not published'}
                                    </Badge>
                                </Td>
                                <Td>
                                    <a
                                        href={`/admin/exams/${ex._id}/marks`}
                                        className="text-xs text-indigo-600 hover:underline"
                                    >
                                        Enter Marks →
                                    </a>
                                </Td>
                            </Tr>
                        ))}
                    </Table>
                </Card>
            )}

            <AddExamModal
                open={showAdd}
                onClose={() => setShowAdd(false)}
                onSuccess={() => {
                    setShowAdd(false)
                    fetchExams()
                    setAlert({ type: 'success', msg: 'Exam scheduled successfully!' })
                }}
            />
        </div>
    )
}

function AddExamModal({ open, onClose, onSuccess }: {
    open: boolean; onClose: () => void; onSuccess: () => void
}) {
    const [form, setForm] = useState({
        name: '', class: '', section: '', academicYear: '2025-26',
        subjects: [{ name: 'Mathematics', date: '', time: '10:00 AM', duration: 180, maxMarks: 100, minMarks: 33 }],
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const addSubject = () => setForm(f => ({
        ...f,
        subjects: [...f.subjects, { name: '', date: '', time: '10:00 AM', duration: 180, maxMarks: 100, minMarks: 33 }],
    }))

    const updateSubject = (idx: number, k: string, v: any) =>
        setForm(f => ({
            ...f,
            subjects: f.subjects.map((s, i) => i === idx ? { ...s, [k]: v } : s),
        }))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        const res = await fetch('/api/exams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })
        const data = await res.json()
        setLoading(false)
        if (!res.ok) { setError(data.error ?? 'Error'); return }
        onSuccess()
    }

    return (
        <Modal open={open} onClose={onClose} title="Schedule New Exam" size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Exam Name *" placeholder="Half Yearly 2025" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                    <Input label="Academic Year *" value={form.academicYear} onChange={e => setForm(f => ({ ...f, academicYear: e.target.value }))} required />
                    <Select
                        label="Class *"
                        options={[{ value: '', label: 'Select' },
                        ...['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(c => ({ value: c, label: `Class ${c}` }))
                        ]}
                        value={form.class}
                        onChange={e => setForm(f => ({ ...f, class: e.target.value }))}
                    />
                    <Select
                        label="Section (optional)"
                        options={[{ value: '', label: 'All Sections' },
                        ...['A', 'B', 'C', 'D'].map(s => ({ value: s, label: `Section ${s}` }))
                        ]}
                        value={form.section}
                        onChange={e => setForm(f => ({ ...f, section: e.target.value }))}
                    />
                </div>

                {/* Subjects */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-slate-600">Subjects</label>
                        <button type="button" onClick={addSubject} className="text-xs text-indigo-600 hover:underline">+ Add Subject</button>
                    </div>
                    <div className="space-y-2">
                        {form.subjects.map((sub, idx) => (
                            <div key={idx} className="grid grid-cols-5 gap-2 items-center p-2 bg-slate-50 rounded-lg">
                                <input className="col-span-2 h-8 px-2 text-xs rounded border border-slate-200" placeholder="Subject name" value={sub.name} onChange={e => updateSubject(idx, 'name', e.target.value)} required />
                                <input className="h-8 px-2 text-xs rounded border border-slate-200" type="date" value={sub.date} onChange={e => updateSubject(idx, 'date', e.target.value)} required />
                                <input className="h-8 px-2 text-xs rounded border border-slate-200" type="number" placeholder="Max" value={sub.maxMarks} onChange={e => updateSubject(idx, 'maxMarks', Number(e.target.value))} />
                                <input className="h-8 px-2 text-xs rounded border border-slate-200" type="number" placeholder="Pass" value={sub.minMarks} onChange={e => updateSubject(idx, 'minMarks', Number(e.target.value))} />
                            </div>
                        ))}
                    </div>
                </div>

                {error && <Alert type="error" message={error} />}

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                    <Button type="submit" loading={loading}>Schedule Exam</Button>
                </div>
            </form>
        </Modal>
    )
}
