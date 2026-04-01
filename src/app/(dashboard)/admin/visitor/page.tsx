'use client'
import { useEffect, useState } from 'react'
import { PageHeader, Button, Card, Table, Tr, Td, Badge, Modal, Input, Spinner, Alert, EmptyState } from '@/components/ui'
import { UserPlus, Plus, LogOut, Clock } from 'lucide-react'
import { Portal } from '@/components/ui/Portal'

interface VisitorItem {
    _id: string
    name: string
    phone: string
    purpose: string
    toMeet: string
    inTime: string
    outTime?: string
    status: string
    gatePassNo: string
}

export default function VisitorPage() {
    const [visitors, setVisitors] = useState<VisitorItem[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const [saving, setSaving] = useState(false)
    const [filter, setFilter] = useState('')

    const [form, setForm] = useState({ name: '', phone: '', purpose: '', toMeet: '' })

    const fetchVisitors = () => {
        const url = filter ? `/api/visitor?status=${filter}` : '/api/visitor'
        fetch(url).then(r => r.json()).then(d => { setVisitors(Array.isArray(d) ? d : []); setLoading(false) })
    }

    useEffect(() => { fetchVisitors() }, [filter])

    const handleCreate = async () => {
        if (!form.name.trim() || !form.phone.trim()) return
        setSaving(true)
        try {
            const res = await fetch('/api/visitor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            if (!res.ok) throw new Error('Failed')
            setAlert({ type: 'success', msg: 'Visitor checked in!' })
            setModalOpen(false)
            setForm({ name: '', phone: '', purpose: '', toMeet: '' })
            fetchVisitors()
        } catch (e: any) {
            setAlert({ type: 'error', msg: e.message })
        }
        setSaving(false)
    }

    const handleCheckout = async (id: string) => {
        try {
            await fetch('/api/visitor', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action: 'checkout' }),
            })
            setAlert({ type: 'success', msg: 'Visitor checked out' })
            fetchVisitors()
        } catch (e: any) {
            setAlert({ type: 'error', msg: e.message })
        }
    }

    const insideCount = visitors.filter(v => v.status !== 'completed').length

    if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

    return (
        <div>
            <PageHeader
                title="Visitor Management"
                subtitle={`${insideCount} visitors inside · ${visitors.length} total today`}
                action={<Button onClick={() => setModalOpen(true)}><Plus size={16} /> Check In</Button>}
            />

            {alert && <div className="mb-5"><Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} /></div>}

            <div className="flex gap-2 mb-5">
                {[
                    { value: '', label: 'All' },
                    { value: 'waiting', label: 'Waiting' },
                    { value: 'inside', label: 'Inside' },
                    { value: 'completed', label: 'Completed' },
                ].map(f => (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f.value ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {visitors.length === 0 ? (
                <EmptyState icon={<UserPlus size={24} />} title="No visitors" description="Check in visitors at the gate" />
            ) : (
                <Card padding={false}>
                    <Table headers={['Gate Pass', 'Name', 'Phone', 'Purpose', 'To Meet', 'In Time', 'Status', 'Action']}>
                        {visitors.map(v => (
                            <Tr key={v._id}>
                                <Td className="font-mono text-xs">{v.gatePassNo}</Td>
                                <Td className="font-medium">{v.name}</Td>
                                <Td className="text-sm">{v.phone}</Td>
                                <Td className="text-sm">{v.purpose}</Td>
                                <Td className="text-sm">{v.toMeet}</Td>
                                <Td className="text-xs text-slate-500">
                                    {new Date(v.inTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </Td>
                                <Td>
                                    <Badge variant={v.status === 'completed' ? 'success' : v.status === 'inside' ? 'info' : 'warning'}>
                                        {v.status}
                                    </Badge>
                                </Td>
                                <Td>
                                    {v.status !== 'completed' && (
                                        <Button size="sm" variant="secondary" onClick={() => handleCheckout(v._id)}>
                                            <LogOut size={12} /> Out
                                        </Button>
                                    )}
                                </Td>
                            </Tr>
                        ))}
                    </Table>
                </Card>
            )}

            <Portal>
                <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Visitor Check In">
                    <div className="space-y-4">
                        <Input label="Visitor Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
                        <Input label="Phone Number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="10-digit mobile" />
                        <Input label="Purpose of Visit" value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} placeholder="e.g. Parent meeting" />
                        <Input label="To Meet" value={form.toMeet} onChange={e => setForm({ ...form, toMeet: e.target.value })} placeholder="e.g. Principal, Class Teacher" />
                        <Button className="w-full" onClick={handleCreate} loading={saving}>Check In Visitor</Button>
                    </div>
                </Modal>
            </Portal>
        </div>
    )
}