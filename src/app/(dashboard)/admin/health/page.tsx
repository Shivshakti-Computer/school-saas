'use client'
import { useEffect, useState } from 'react'
import { PageHeader, Button, Card, Table, Tr, Td, Badge, Modal, Input, Select, Spinner, Alert, EmptyState } from '@/components/ui'
import { Heart, Search, Plus, FileText } from 'lucide-react'

interface HealthItem {
    _id: string
    studentId: any
    height?: number
    weight?: number
    bloodGroup?: string
    allergies?: string[]
    medicalConditions?: string[]
    checkups: Array<{ date: string; type: string; notes?: string; doctor?: string }>
}

export default function HealthPage() {
    const [records, setRecords] = useState<HealthItem[]>([])
    const [students, setStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [checkupModal, setCheckupModal] = useState<string | null>(null)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState('')

    const [form, setForm] = useState({
        studentId: '', height: '', weight: '', bloodGroup: '', allergies: '', medicalConditions: '',
    })

    const [checkupForm, setCheckupForm] = useState({
        date: new Date().toISOString().split('T')[0], type: 'General Checkup', notes: '', doctor: '',
    })

    const fetchData = async () => {
        const [healthRes, studentRes] = await Promise.all([
            fetch('/api/health'),
            fetch('/api/students'),
        ])
        const healthData = await healthRes.json()
        const studentData = await studentRes.json()
        setRecords(Array.isArray(healthData) ? healthData : [])
        setStudents(Array.isArray(studentData) ? studentData : studentData.students || [])
        setLoading(false)
    }

    useEffect(() => { fetchData() }, [])

    const handleSave = async () => {
        if (!form.studentId) return
        setSaving(true)
        try {
            const res = await fetch('/api/health', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: form.studentId,
                    height: form.height ? Number(form.height) : undefined,
                    weight: form.weight ? Number(form.weight) : undefined,
                    bloodGroup: form.bloodGroup || undefined,
                    allergies: form.allergies ? form.allergies.split(',').map(a => a.trim()) : [],
                    medicalConditions: form.medicalConditions ? form.medicalConditions.split(',').map(c => c.trim()) : [],
                }),
            })
            if (!res.ok) throw new Error('Failed')
            setAlert({ type: 'success', msg: 'Health record saved!' })
            setModalOpen(false)
            fetchData()
        } catch (e: any) {
            setAlert({ type: 'error', msg: e.message })
        }
        setSaving(false)
    }

    const handleAddCheckup = async () => {
        if (!checkupModal) return
        setSaving(true)
        try {
            const record = records.find(r => r._id === checkupModal)
            if (!record) throw new Error('Record not found')
            const res = await fetch('/api/health', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: record.studentId,
                    checkups: [...(record.checkups || []), checkupForm],
                }),
            })
            if (!res.ok) throw new Error('Failed')
            setAlert({ type: 'success', msg: 'Checkup added!' })
            setCheckupModal(null)
            fetchData()
        } catch (e: any) {
            setAlert({ type: 'error', msg: e.message })
        }
        setSaving(false)
    }

    if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

    return (
        <div>
            <PageHeader
                title="Student Health Records"
                subtitle={`${records.length} records`}
                action={<Button onClick={() => setModalOpen(true)}><Plus size={16} /> Add Record</Button>}
            />

            {alert && <div className="mb-5"><Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} /></div>}

            {records.length === 0 ? (
                <EmptyState icon={<Heart size={24} />} title="No health records" description="Add student health information" action={<Button onClick={() => setModalOpen(true)}><Plus size={14} /> Add Record</Button>} />
            ) : (
                <Card padding={false}>
                    <Table headers={['Student', 'Height', 'Weight', 'Blood Group', 'Allergies', 'Checkups', 'Action']}>
                        {records.map(r => (
                            <Tr key={r._id}>
                                <Td className="font-medium">{typeof r.studentId === 'object' ? r.studentId?.name || 'Unknown' : r.studentId}</Td>
                                <Td>{r.height ? `${r.height} cm` : '—'}</Td>
                                <Td>{r.weight ? `${r.weight} kg` : '—'}</Td>
                                <Td>{r.bloodGroup ? <Badge variant="danger">{r.bloodGroup}</Badge> : '—'}</Td>
                                <Td>
                                    <div className="flex flex-wrap gap-1">
                                        {r.allergies?.map((a, i) => <Badge key={i} variant="warning">{a}</Badge>)}
                                        {(!r.allergies || r.allergies.length === 0) && <span className="text-slate-400">None</span>}
                                    </div>
                                </Td>
                                <Td>{r.checkups?.length || 0}</Td>
                                <Td>
                                    <button onClick={() => setCheckupModal(r._id)} className="text-indigo-600 hover:underline text-sm">+ Checkup</button>
                                </Td>
                            </Tr>
                        ))}
                    </Table>
                </Card>
            )}

            {/* Add Record Modal */}
            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Health Record">
                <div className="space-y-4">
                    <Select
                        label="Student"
                        value={form.studentId}
                        onChange={e => setForm({ ...form, studentId: e.target.value })}
                        options={[{ value: '', label: 'Select Student' }, ...students.map((s: any) => ({ value: s._id, label: `${s.userId?.name || s.name || 'Unknown'} — ${s.class}` }))]}
                    />
                    <div className="grid grid-cols-3 gap-3">
                        <Input label="Height (cm)" type="number" value={form.height} onChange={e => setForm({ ...form, height: e.target.value })} />
                        <Input label="Weight (kg)" type="number" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} />
                        <Select label="Blood Group" value={form.bloodGroup} onChange={e => setForm({ ...form, bloodGroup: e.target.value })} options={[
                            { value: '', label: 'Select' }, { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' }, { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
                            { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' }, { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
                        ]} />
                    </div>
                    <Input label="Allergies (comma separated)" value={form.allergies} onChange={e => setForm({ ...form, allergies: e.target.value })} placeholder="e.g. Dust, Peanuts" />
                    <Input label="Medical Conditions (comma separated)" value={form.medicalConditions} onChange={e => setForm({ ...form, medicalConditions: e.target.value })} placeholder="e.g. Asthma" />
                    <Button className="w-full" onClick={handleSave} loading={saving}>Save Record</Button>
                </div>
            </Modal>

            {/* Add Checkup Modal */}
            <Modal open={!!checkupModal} onClose={() => setCheckupModal(null)} title="Add Checkup">
                <div className="space-y-4">
                    <Input label="Date" type="date" value={checkupForm.date} onChange={e => setCheckupForm({ ...checkupForm, date: e.target.value })} />
                    <Input label="Checkup Type" value={checkupForm.type} onChange={e => setCheckupForm({ ...checkupForm, type: e.target.value })} placeholder="e.g. Eye Checkup" />
                    <Input label="Doctor Name" value={checkupForm.doctor} onChange={e => setCheckupForm({ ...checkupForm, doctor: e.target.value })} />
                    <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">Notes</label>
                        <textarea
                            value={checkupForm.notes}
                            onChange={e => setCheckupForm({ ...checkupForm, notes: e.target.value })}
                            className="w-full h-20 px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-indigo-400"
                            placeholder="Findings, recommendations..."
                        />
                    </div>
                    <Button className="w-full" onClick={handleAddCheckup} loading={saving}>Add Checkup</Button>
                </div>
            </Modal>
        </div>
    )
}