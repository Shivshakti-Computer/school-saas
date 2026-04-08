'use client'
import { useEffect, useState } from 'react'
import { PageHeader, Button, Card, Table, Tr, Td, Badge, Modal, Input, Spinner, Alert, EmptyState } from '@/components/ui'
import { GraduationCap, Plus, Search, MapPin, Briefcase } from 'lucide-react'
import { Portal } from '@/components/ui/Portal'

interface AlumniItem {
    _id: string
    name: string
    phone: string
    email?: string
    batch: number
    currentOccupation?: string
    currentLocation?: string
    linkedin?: string
    createdAt: string
}

export default function AlumniPage() {
    const [alumni, setAlumni] = useState<AlumniItem[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState('')
    const [filterBatch, setFilterBatch] = useState('')

    const [form, setForm] = useState({
        name: '', phone: '', email: '', batch: new Date().getFullYear(),
        currentOccupation: '', currentLocation: '', linkedin: '',
    })

    const fetchAlumni = () => {
        fetch('/api/alumni').then(r => r.json()).then(d => { setAlumni(Array.isArray(d) ? d : []); setLoading(false) })
    }

    useEffect(() => { fetchAlumni() }, [])

    const handleCreate = async () => {
        if (!form.name.trim() || !form.phone.trim()) return
        setSaving(true)
        try {
            const res = await fetch('/api/alumni', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            if (!res.ok) throw new Error('Failed')
            setAlert({ type: 'success', msg: 'Alumni added!' })
            setModalOpen(false)
            setForm({ name: '', phone: '', email: '', batch: new Date().getFullYear(), currentOccupation: '', currentLocation: '', linkedin: '' })
            fetchAlumni()
        } catch (e: any) {
            setAlert({ type: 'error', msg: e.message })
        }
        setSaving(false)
    }

    const batches = [...new Set(alumni.map(a => a.batch))].sort((a, b) => b - a)

    const filtered = alumni.filter(a => {
        const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.phone.includes(search)
        const matchBatch = !filterBatch || a.batch === Number(filterBatch)
        return matchSearch && matchBatch
    })

    if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

    return (
        <div>
            <PageHeader
                title="Alumni Network"
                subtitle={`${alumni.length} alumni registered`}
                action={<Button onClick={() => setModalOpen(true)}><Plus size={16} /> Add Alumni</Button>}
            />

            {alert && <div className="mb-5"><Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} /></div>}

            <div className="flex gap-3 mb-5">
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name or phone..."
                        className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
                    />
                </div>
                {batches.length > 0 && (
                    <select
                        value={filterBatch}
                        onChange={e => setFilterBatch(e.target.value)}
                        className="h-9 px-3 text-sm rounded-lg border border-slate-200"
                    >
                        <option value="">All Batches</option>
                        {batches.map(b => <option key={b} value={b}>Batch {b}</option>)}
                    </select>
                )}
            </div>

            {filtered.length === 0 ? (
                <EmptyState icon={<GraduationCap size={24} />} title="No alumni found" description="Add alumni to build your network" action={<Button onClick={() => setModalOpen(true)}><Plus size={14} /> Add Alumni</Button>} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(a => (
                        <Card key={a._id}>
                            <div className="flex items-start gap-3">
                                <div className="w-11 h-11 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-semibold text-sm flex-shrink-0">
                                    {a.name.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-sm text-slate-800 truncate">{a.name}</h3>
                                    <Badge variant="primary" className="mt-0.5">Batch {a.batch}</Badge>
                                </div>
                            </div>
                            <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                                <p>📱 {a.phone}</p>
                                {a.email && <p>✉️ {a.email}</p>}
                                {a.currentOccupation && (
                                    <p className="flex items-center gap-1"><Briefcase size={12} className="text-slate-400" /> {a.currentOccupation}</p>
                                )}
                                {a.currentLocation && (
                                    <p className="flex items-center gap-1"><MapPin size={12} className="text-slate-400" /> {a.currentLocation}</p>
                                )}
                                {a.linkedin && (
                                    <a href={a.linkedin} target="_blank" className="text-indigo-600 hover:underline">LinkedIn →</a>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Portal>
                <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Alumni">
                    <div className="space-y-4">
                        <Input label="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Alumni name" />
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="10-digit mobile" />
                            <Input label="Batch Year" type="number" value={String(form.batch)} onChange={e => setForm({ ...form, batch: Number(e.target.value) })} />
                        </div>
                        <Input label="Email (optional)" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Current Occupation" value={form.currentOccupation} onChange={e => setForm({ ...form, currentOccupation: e.target.value })} placeholder="e.g. Engineer" />
                            <Input label="Current Location" value={form.currentLocation} onChange={e => setForm({ ...form, currentLocation: e.target.value })} placeholder="e.g. Raipur" />
                        </div>
                        <Input label="LinkedIn URL (optional)" value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })} placeholder="https://linkedin.com/in/..." />
                        <Button className="w-full" onClick={handleCreate} loading={saving}>Add Alumni</Button>
                    </div>
                </Modal>
            </Portal>
        </div>
    )
}