/* ============================================================
   FILE: src/app/(dashboard)/admin/students/page.tsx
   Student list — search, filter, add, view
   ============================================================ */

'use client'
import { useState, useEffect, useCallback } from 'react'
import {
    Button, Badge, Card, Table, Tr, Td,
    PageHeader, EmptyState, Spinner, Modal, Input, Select, Alert,
} from '@/components/ui'
import { Users, Search, Download, Upload } from 'lucide-react'

interface Student {
    _id: string
    admissionNo: string
    rollNo: string
    class: string
    section: string
    fatherName: string
    parentPhone: string
    status: string
    userId: { name: string; phone: string }
}

const CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
const SECTIONS = ['A', 'B', 'C', 'D']

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [cls, setCls] = useState('')
    const [section, setSection] = useState('')
    const [showAdd, setShowAdd] = useState(false)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

    const fetchStudents = useCallback(async () => {
        setLoading(true)
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        if (cls) params.set('class', cls)
        if (section) params.set('section', section)

        const res = await fetch(`/api/students?${params}`)
        const data = await res.json()
        setStudents(data.students ?? [])
        setTotal(data.total ?? 0)
        setLoading(false)
    }, [search, cls, section])

    useEffect(() => { fetchStudents() }, [fetchStudents])

    // Open add modal if URL has ?action=add
    useEffect(() => {
        if (window.location.search.includes('action=add')) setShowAdd(true)
    }, [])

    return (
        <div>
            <PageHeader
                title="Students"
                subtitle={`${total} total students`}
                action={
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => document.getElementById('excel-upload')?.click()}
                        >
                            <Upload size={14} /> Import Excel
                        </Button>
                        <input
                            id="excel-upload"
                            type="file"
                            accept=".xlsx,.xls"
                            className="hidden"
                            onChange={async e => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                const fd = new FormData()
                                fd.append('file', file)
                                const res = await fetch('/api/students/bulk-import', { method: 'POST', body: fd })
                                const d = await res.json()
                                setAlert({ type: 'success', msg: `${d.success} imported, ${d.failed} failed` })
                                fetchStudents()
                            }}
                        />
                        <Button size="sm" onClick={() => setShowAdd(true)}>
                            + Add Student
                        </Button>
                    </div>
                }
            />

            {alert && (
                <Alert
                    type={alert.type}
                    message={alert.msg}
                    onClose={() => setAlert(null)}
                />
            )}

            {/* Filters */}
            <Card className="mb-4">
                <div className="flex flex-wrap gap-3">
                    <div className="flex-1 min-w-48 relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            className="w-full h-9 pl-8 pr-3 text-sm rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
                            placeholder="Search by name, admission no..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <Select
                        options={[{ value: '', label: 'All Classes' }, ...CLASSES.map(c => ({ value: c, label: `Class ${c}` }))]}
                        value={cls}
                        onChange={e => setCls(e.target.value)}
                        className="w-36"
                    />
                    <Select
                        options={[{ value: '', label: 'All Sections' }, ...SECTIONS.map(s => ({ value: s, label: `Section ${s}` }))]}
                        value={section}
                        onChange={e => setSection(e.target.value)}
                        className="w-36"
                    />
                </div>
            </Card>

            {/* Table */}
            <Card padding={false}>
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Spinner size="lg" />
                    </div>
                ) : students.length === 0 ? (
                    <EmptyState
                        icon={<Users size={24} />}
                        title="No students found"
                        description="Add your first student to get started"
                        action={<Button size="sm" onClick={() => setShowAdd(true)}>Add Student</Button>}
                    />
                ) : (
                    <Table headers={['Adm No', 'Name', 'Class', 'Father', 'Phone', 'Status', 'Actions']}>
                        {students.map(s => (
                            <Tr key={s._id}>
                                <Td>
                                    <span className="font-mono text-xs text-slate-500">{s.admissionNo}</span>
                                </Td>
                                <Td>
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-semibold flex-shrink-0">
                                            {s.userId?.name?.charAt(0) ?? '?'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-700">{s.userId?.name}</p>
                                            <p className="text-xs text-slate-400">{s.userId?.phone}</p>
                                        </div>
                                    </div>
                                </Td>
                                <Td>
                                    <Badge variant="purple">{s.class} - {s.section}</Badge>
                                </Td>
                                <Td className="text-slate-600 text-sm">{s.fatherName}</Td>
                                <Td className="text-slate-600 text-sm font-mono">{s.parentPhone}</Td>
                                <Td>
                                    <Badge variant={s.status === 'active' ? 'success' : 'default'}>
                                        {s.status}
                                    </Badge>
                                </Td>
                                <Td>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => window.open(`/api/pdf/idcard/${s._id}`, '_blank')}
                                            className="text-xs text-indigo-600 hover:underline px-2 py-1"
                                        >
                                            ID Card
                                        </button>
                                    </div>
                                </Td>
                            </Tr>
                        ))}
                    </Table>
                )}
            </Card>

            {/* Add Student Modal */}
            <AddStudentModal
                open={showAdd}
                onClose={() => setShowAdd(false)}
                onSuccess={() => {
                    setShowAdd(false)
                    fetchStudents()
                    setAlert({ type: 'success', msg: 'Student added successfully!' })
                }}
            />
        </div>
    )
}


/* ── Add Student Modal ── */
function AddStudentModal({
    open, onClose, onSuccess,
}: {
    open: boolean
    onClose: () => void
    onSuccess: () => void
}) {
    const empty = {
        name: '', phone: '', class: '', section: 'A',
        fatherName: '', parentPhone: '', address: '',
        dateOfBirth: '', gender: 'male', admissionDate: new Date().toISOString().split('T')[0],
    }
    const [form, setForm] = useState(empty)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const res = await fetch('/api/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })
        const data = await res.json()

        setLoading(false)
        if (!res.ok) { setError(data.error ?? 'Something went wrong'); return }
        setForm(empty)
        onSuccess()
    }

    return (
        <Modal open={open} onClose={onClose} title="Add New Student" size="lg">
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Student Full Name *" placeholder="Rahul Kumar" value={form.name} onChange={e => set('name', e.target.value)} required />
                    <Input label="Student Phone *" placeholder="9999999999" value={form.phone} onChange={e => set('phone', e.target.value)} required />
                    <Select
                        label="Class *"
                        options={[{ value: '', label: 'Select Class' }, ...CLASSES.map(c => ({ value: c, label: `Class ${c}` }))]}
                        value={form.class}
                        onChange={e => set('class', e.target.value)}
                    />
                    <Select
                        label="Section *"
                        options={SECTIONS.map(s => ({ value: s, label: `Section ${s}` }))}
                        value={form.section}
                        onChange={e => set('section', e.target.value)}
                    />
                    <Input label="Father's Name *" placeholder="Ram Kumar" value={form.fatherName} onChange={e => set('fatherName', e.target.value)} required />
                    <Input label="Parent Phone *" placeholder="9888888888" value={form.parentPhone} onChange={e => set('parentPhone', e.target.value)} required />
                    <Input label="Date of Birth *" type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} required />
                    <Input label="Admission Date *" type="date" value={form.admissionDate} onChange={e => set('admissionDate', e.target.value)} required />
                    <Select
                        label="Gender *"
                        options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]}
                        value={form.gender}
                        onChange={e => set('gender', e.target.value)}
                    />
                    <Input label="Address *" placeholder="Village/City, District" value={form.address} onChange={e => set('address', e.target.value)} required />
                </div>

                {error && <Alert type="error" message={error} className="mt-3" />}

                <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                    <Button type="submit" loading={loading}>Add Student</Button>
                </div>
            </form>
        </Modal>
    )
}
