'use client'
import { useEffect, useState } from 'react'
import { PageHeader, Button, Card, Table, Tr, Td, Badge, Modal, Input, Select, Spinner, Alert, EmptyState } from '@/components/ui'
import { FileText, Plus, Eye, CheckCircle } from 'lucide-react'
import { Portal } from '@/components/ui/Portal'

const CLASSES = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
const SUBJECTS = ['Hindi', 'English', 'Mathematics', 'Science', 'Social Studies', 'Computer', 'Sanskrit', 'Drawing', 'Physical Education']

interface HomeworkItem {
    _id: string
    class: string
    section?: string
    subject: string
    title: string
    description: string
    dueDate: string
    assignedBy: { name: string }
    submissions: Array<{ studentId: string; status: string }>
    createdAt: string
}

export default function HomeworkPage() {
    const [homework, setHomework] = useState<HomeworkItem[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [viewHw, setViewHw] = useState<HomeworkItem | null>(null)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const [saving, setSaving] = useState(false)
    const [filterClass, setFilterClass] = useState('')

    // Form
    const [form, setForm] = useState({
        class: '1', section: '', subject: 'Hindi', title: '', description: '', dueDate: '',
    })

    const fetchHomework = () => {
        const url = filterClass ? `/api/homework?class=${filterClass}` : '/api/homework'
        fetch(url).then(r => r.json()).then(d => { setHomework(Array.isArray(d) ? d : []); setLoading(false) })
    }

    useEffect(() => { fetchHomework() }, [filterClass])

    const handleCreate = async () => {
        if (!form.title.trim() || !form.dueDate) return
        setSaving(true)
        try {
            const res = await fetch('/api/homework', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            if (!res.ok) throw new Error('Failed to create')
            setAlert({ type: 'success', msg: 'Homework assigned!' })
            setModalOpen(false)
            setForm({ class: '1', section: '', subject: 'Hindi', title: '', description: '', dueDate: '' })
            fetchHomework()
        } catch (e: any) {
            setAlert({ type: 'error', msg: e.message })
        }
        setSaving(false)
    }

    const isOverdue = (date: string) => new Date(date) < new Date()

    if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

    return (
        <div>
            <PageHeader
                title="Homework & Assignments"
                subtitle={`${homework.length} assignments`}
                action={
                    <Button onClick={() => setModalOpen(true)}>
                        <Plus size={16} /> Assign Homework
                    </Button>
                }
            />

            {alert && <div className="mb-5"><Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} /></div>}

            <div className="flex gap-3 mb-5">
                <Select
                    label="Filter by Class"
                    value={filterClass}
                    onChange={e => setFilterClass(e.target.value)}
                    options={[{ value: '', label: 'All Classes' }, ...CLASSES.map(c => ({ value: c, label: `Class ${c}` }))]}
                />
            </div>

            {homework.length === 0 ? (
                <EmptyState
                    icon={<FileText size={24} />}
                    title="No homework assigned"
                    description="Assign homework to students"
                    action={<Button onClick={() => setModalOpen(true)}><Plus size={14} /> Assign</Button>}
                />
            ) : (
                <Card padding={false}>
                    <Table headers={['Subject', 'Title', 'Class', 'Due Date', 'Submissions', 'Status', 'Action']}>
                        {homework.map(hw => {
                            const submitted = hw.submissions?.filter(s => s.status !== 'pending').length || 0
                            const total = hw.submissions?.length || 0
                            const overdue = isOverdue(hw.dueDate)
                            return (
                                <Tr key={hw._id}>
                                    <Td><Badge variant="purple">{hw.subject}</Badge></Td>
                                    <Td className="font-medium">{hw.title}</Td>
                                    <Td>Class {hw.class}{hw.section ? `-${hw.section}` : ''}</Td>
                                    <Td>
                                        <span className={overdue ? 'text-red-600 font-medium' : ''}>
                                            {new Date(hw.dueDate).toLocaleDateString('en-IN')}
                                        </span>
                                    </Td>
                                    <Td>{submitted}/{total}</Td>
                                    <Td>
                                        <Badge variant={overdue ? 'danger' : 'success'}>
                                            {overdue ? 'Overdue' : 'Active'}
                                        </Badge>
                                    </Td>
                                    <Td>
                                        <button onClick={() => setViewHw(hw)} className="text-indigo-600 hover:underline text-sm">
                                            View
                                        </button>
                                    </Td>
                                </Tr>
                            )
                        })}
                    </Table>
                </Card>
            )}

            <Portal>
                {/* Create Modal */}
                <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Assign Homework">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Select label="Class" value={form.class} onChange={e => setForm({ ...form, class: e.target.value })} options={CLASSES.map(c => ({ value: c, label: `Class ${c}` }))} />
                            <Select label="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} options={SUBJECTS.map(s => ({ value: s, label: s }))} />
                        </div>
                        <Input label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Chapter 5 Exercise" />
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">Description</label>
                            <textarea
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                className="w-full h-24 px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
                                placeholder="Instructions for students..."
                            />
                        </div>
                        <Input label="Due Date" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                        <Button className="w-full" onClick={handleCreate} loading={saving}>Assign Homework</Button>
                    </div>
                </Modal>

                {/* View Modal */}
                <Modal open={!!viewHw} onClose={() => setViewHw(null)} title={viewHw?.title || 'Homework'} size="lg">
                    {viewHw && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-3 text-sm">
                                <div><span className="text-slate-500">Class:</span> <strong>{viewHw.class}</strong></div>
                                <div><span className="text-slate-500">Subject:</span> <strong>{viewHw.subject}</strong></div>
                                <div><span className="text-slate-500">Due:</span> <strong>{new Date(viewHw.dueDate).toLocaleDateString('en-IN')}</strong></div>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700">
                                {viewHw.description || 'No description'}
                            </div>
                            <p className="text-sm text-slate-500">
                                Assigned by: {viewHw.assignedBy?.name || 'Unknown'} · {new Date(viewHw.createdAt).toLocaleDateString('en-IN')}
                            </p>
                        </div>
                    )}
                </Modal>
            </Portal>
        </div>
    )
}