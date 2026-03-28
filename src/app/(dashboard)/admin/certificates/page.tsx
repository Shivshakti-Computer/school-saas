'use client'
import { useEffect, useState } from 'react'
import { PageHeader, Button, Card, Badge, Modal, Input, Select, Spinner, Alert, EmptyState } from '@/components/ui'
import { Award, Plus, Eye } from 'lucide-react'

const CERT_TYPES = [
    { value: 'merit', label: 'Merit Certificate' },
    { value: 'participation', label: 'Participation Certificate' },
    { value: 'achievement', label: 'Achievement Award' },
    { value: 'custom', label: 'Custom Certificate' },
]

interface CertificateItem {
    _id: string
    name: string
    type: string
    template: string
    fields: Array<{ name: string; type: string }>
    createdAt: string
}

export default function CertificatesPage() {
    const [certificates, setCertificates] = useState<CertificateItem[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const [saving, setSaving] = useState(false)

    const [form, setForm] = useState({
        name: '', type: 'merit', template: '', fields: [{ name: 'studentName', type: 'text' }] as Array<{ name: string; type: string }>,
    })

    const fetchCertificates = () => {
        fetch('/api/certificates').then(r => r.json()).then(d => { setCertificates(Array.isArray(d) ? d : []); setLoading(false) })
    }

    useEffect(() => { fetchCertificates() }, [])

    const addField = () => {
        setForm({ ...form, fields: [...form.fields, { name: '', type: 'text' }] })
    }

    const removeField = (index: number) => {
        setForm({ ...form, fields: form.fields.filter((_, i) => i !== index) })
    }

    const handleCreate = async () => {
        if (!form.name.trim() || !form.template.trim()) return
        setSaving(true)
        try {
            const res = await fetch('/api/certificates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            if (!res.ok) throw new Error('Failed')
            setAlert({ type: 'success', msg: 'Certificate template created!' })
            setModalOpen(false)
            fetchCertificates()
        } catch (e: any) {
            setAlert({ type: 'error', msg: e.message })
        }
        setSaving(false)
    }

    if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

    return (
        <div>
            <PageHeader
                title="Certificate Templates"
                subtitle="Merit certificates, awards, custom designs"
                action={<Button onClick={() => setModalOpen(true)}><Plus size={16} /> New Certificate</Button>}
            />

            {alert && <div className="mb-5"><Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} /></div>}

            {certificates.length === 0 ? (
                <EmptyState
                    icon={<Award size={24} />}
                    title="No certificate templates"
                    description="Create certificate templates for students"
                    action={<Button onClick={() => setModalOpen(true)}><Plus size={14} /> Create</Button>}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {certificates.map(cert => (
                        <Card key={cert._id} className="relative">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                                    <Award size={20} className="text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm text-slate-800">{cert.name}</h3>
                                    <Badge variant={cert.type === 'merit' ? 'success' : cert.type === 'achievement' ? 'warning' : 'info'}>
                                        {cert.type}
                                    </Badge>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2 mb-3">{cert.template}</p>
                            <div className="flex flex-wrap gap-1">
                                {cert.fields?.map((f, i) => (
                                    <span key={i} className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">{f.name}</span>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Certificate Template" size="lg">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Certificate Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Merit Award 2026" />
                        <Select label="Type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} options={CERT_TYPES} />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">Template Text</label>
                        <textarea
                            value={form.template}
                            onChange={e => setForm({ ...form, template: e.target.value })}
                            className="w-full h-32 px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
                            placeholder="This is to certify that {{studentName}} has been awarded..."
                        />
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-medium text-slate-600">Dynamic Fields</label>
                            <button onClick={addField} className="text-xs text-indigo-600 hover:underline">+ Add Field</button>
                        </div>
                        {form.fields.map((f, i) => (
                            <div key={i} className="flex gap-2 mb-2">
                                <Input placeholder="Field name" value={f.name} onChange={e => {
                                    const fields = [...form.fields]
                                    fields[i] = { ...f, name: e.target.value }
                                    setForm({ ...form, fields })
                                }} />
                                <Select
                                    value={f.type}
                                    onChange={e => {
                                        const fields = [...form.fields]
                                        fields[i] = { ...f, type: e.target.value }
                                        setForm({ ...form, fields })
                                    }}
                                    options={[{ value: 'text', label: 'Text' }, { value: 'date', label: 'Date' }, { value: 'number', label: 'Number' }]}
                                />
                                {form.fields.length > 1 && (
                                    <button onClick={() => removeField(i)} className="text-red-500 hover:text-red-700 text-xs px-2">✕</button>
                                )}
                            </div>
                        ))}
                    </div>
                    <Button className="w-full" onClick={handleCreate} loading={saving}>Create Certificate</Button>
                </div>
            </Modal>
        </div>
    )
}