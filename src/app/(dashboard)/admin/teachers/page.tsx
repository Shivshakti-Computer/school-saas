// ─────────────────────────────────────────────────────────────
// FILE: src/app/(dashboard)/admin/teachers/page.tsx
// Teacher + Staff management — list, add, edit
// ─────────────────────────────────────────────────────────── */

'use client'
import { useState, useEffect, useCallback } from 'react'
import {
    Button, Badge, Card, Table, Tr, Td,
    PageHeader, Modal, Input, Select, Alert,
    EmptyState, Spinner,
} from '@/components/ui'
import { Users } from 'lucide-react'
import { Portal } from '@/components/ui/Portal'

interface Teacher {
    _id: string
    name: string
    phone: string
    email?: string
    role: string
    class?: string
    section?: string
    subjects?: string[]
    isActive: boolean
}

const SUBJECTS = [
    'Mathematics', 'Science', 'English', 'Hindi', 'Social Science',
    'Computer', 'Physics', 'Chemistry', 'Biology', 'History',
    'Geography', 'Economics', 'Accountancy', 'Physical Education',
]

export default function TeachersPage() {
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [loading, setLoading] = useState(true)
    const [showAdd, setShowAdd] = useState(false)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

    const fetchTeachers = useCallback(async () => {
        setLoading(true)
        const res = await fetch('/api/users?role=teacher')
        const data = await res.json()
        setTeachers(data.users ?? [])
        setLoading(false)
    }, [])

    useEffect(() => { fetchTeachers() }, [fetchTeachers])

    const toggleStatus = async (id: string, current: boolean) => {
        await fetch(`/api/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: !current }),
        })
        fetchTeachers()
    }

    return (
        <div>
            <PageHeader
                title="Teachers & Staff"
                subtitle={`${teachers.length} staff members`}
                action={
                    <Button size="sm" onClick={() => setShowAdd(true)}>
                        + Add Teacher
                    </Button>
                }
            />

            {alert && (
                <div className="mb-4">
                    <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
                </div>
            )}

            <Card padding={false}>
                {loading ? (
                    <div className="flex justify-center py-16"><Spinner size="lg" /></div>
                ) : teachers.length === 0 ? (
                    <EmptyState
                        icon={<Users size={24} />}
                        title="No teachers added yet"
                        description="Add teachers so they can login and mark attendance"
                        action={<Button size="sm" onClick={() => setShowAdd(true)}>Add Teacher</Button>}
                    />
                ) : (
                    <Table headers={['Name', 'Phone', 'Class', 'Subjects', 'Status', 'Actions']}>
                        {teachers.map(t => (
                            <Tr key={t._id}>
                                <Td>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-semibold flex-shrink-0">
                                            {t.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-700">{t.name}</p>
                                            {t.email && (
                                                <p className="text-xs text-slate-400">{t.email}</p>
                                            )}
                                        </div>
                                    </div>
                                </Td>
                                <Td className="font-mono text-sm text-slate-600">{t.phone}</Td>
                                <Td>
                                    {t.class
                                        ? <Badge variant="purple">Class {t.class}{t.section ? `-${t.section}` : ''}</Badge>
                                        : <span className="text-slate-400 text-xs">Not assigned</span>
                                    }
                                </Td>
                                <Td>
                                    <div className="flex gap-1 flex-wrap max-w-xs">
                                        {(t.subjects ?? []).slice(0, 3).map(sub => (
                                            <Badge key={sub} variant="info">{sub}</Badge>
                                        ))}
                                        {(t.subjects?.length ?? 0) > 3 && (
                                            <Badge variant="default">+{(t.subjects?.length ?? 0) - 3}</Badge>
                                        )}
                                        {!t.subjects?.length && (
                                            <span className="text-slate-400 text-xs">None</span>
                                        )}
                                    </div>
                                </Td>
                                <Td>
                                    <Badge variant={t.isActive ? 'success' : 'danger'}>
                                        {t.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </Td>
                                <Td>
                                    <button
                                        onClick={() => toggleStatus(t._id, t.isActive)}
                                        className={`text-xs px-2 py-1 rounded-lg transition-colors ${t.isActive
                                            ? 'text-red-600 hover:bg-red-50'
                                            : 'text-emerald-600 hover:bg-emerald-50'
                                            }`}
                                    >
                                        {t.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                </Td>
                            </Tr>
                        ))}
                    </Table>
                )}
            </Card>

            <Portal>
                <AddTeacherModal
                    open={showAdd}
                    onClose={() => setShowAdd(false)}
                    onSuccess={() => {
                        setShowAdd(false)
                        fetchTeachers()
                        setAlert({ type: 'success', msg: 'Teacher added! They can login with their phone number.' })
                    }}
                />
            </Portal>
        </div>
    )
}


function AddTeacherModal({
    open, onClose, onSuccess,
}: {
    open: boolean; onClose: () => void; onSuccess: () => void
}) {
    const emptyForm = {
        name: '',
        phone: '',
        email: '',
        password: '',
        class: '',
        section: '',
        role: 'teacher',
        subjects: [] as string[],
    }
    const [form, setForm] = useState(emptyForm)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

    const toggleSubject = (sub: string) => {
        setForm(f => ({
            ...f,
            subjects: f.subjects.includes(sub)
                ? f.subjects.filter(s => s !== sub)
                : [...f.subjects, sub],
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const payload = {
            ...form,
            // Default password = phone number agar blank ho
            password: form.password || form.phone,
        }

        const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
        const data = await res.json()

        setLoading(false)
        if (!res.ok) {
            setError(data.error ?? 'Something went wrong')
            return
        }
        setForm(emptyForm)
        onSuccess()
    }

    return (
        <Modal open={open} onClose={onClose} title="Add Teacher / Staff" size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Full Name *"
                        placeholder="Sunita Devi"
                        value={form.name}
                        onChange={e => set('name', e.target.value)}
                        required
                    />
                    <Input
                        label="Phone Number *"
                        placeholder="9222222222"
                        value={form.phone}
                        onChange={e => set('phone', e.target.value)}
                        required
                    />
                    <Input
                        label="Email (optional)"
                        type="email"
                        placeholder="teacher@school.com"
                        value={form.email}
                        onChange={e => set('email', e.target.value)}
                    />
                    <Input
                        label="Password"
                        type="password"
                        placeholder="Default: phone number"
                        value={form.password}
                        onChange={e => set('password', e.target.value)}
                        helper="Blank chhodo to phone number hi password hoga"
                    />
                    <Select
                        label="Role *"
                        options={[
                            { value: 'teacher', label: 'Teacher' },
                            { value: 'admin', label: 'Admin Staff' },
                        ]}
                        value={form.role}
                        onChange={e => set('role', e.target.value)}
                    />
                    <Select
                        label="Class Teacher Of"
                        options={[
                            { value: '', label: 'Not a class teacher' },
                            ...['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
                                .map(c => ({ value: c, label: `Class ${c}` })),
                        ]}
                        value={form.class}
                        onChange={e => set('class', e.target.value)}
                    />
                </div>

                {/* Subjects */}
                <div>
                    <label className="text-xs font-medium text-slate-600 block mb-2">
                        Subjects Taught
                    </label>
                    <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        {SUBJECTS.map(sub => (
                            <button
                                key={sub}
                                type="button"
                                onClick={() => toggleSubject(sub)}
                                className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${form.subjects.includes(sub)
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                                    }`}
                            >
                                {sub}
                            </button>
                        ))}
                    </div>
                    {form.subjects.length > 0 && (
                        <p className="text-xs text-slate-400 mt-1">
                            Selected: {form.subjects.join(', ')}
                        </p>
                    )}
                </div>

                {error && <Alert type="error" message={error} />}

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <Button variant="secondary" type="button" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" loading={loading}>
                        Add Teacher
                    </Button>
                </div>
            </form>
        </Modal>
    )
}