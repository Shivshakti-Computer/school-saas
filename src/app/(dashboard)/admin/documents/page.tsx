'use client'
import { useEffect, useState } from 'react'
import { PageHeader, Button, Card, Table, Tr, Td, Badge, Modal, Input, Select, Spinner, Alert, EmptyState } from '@/components/ui'
import { FileCheck, Plus, Copy, Trash2 } from 'lucide-react'

const DOC_TYPES = [
    { value: 'tc', label: 'Transfer Certificate (TC)' },
    { value: 'cc', label: 'Character Certificate (CC)' },
    { value: 'bonafide', label: 'Bonafide Certificate' },
    { value: 'custom', label: 'Custom Document' },
]

const DEFAULT_TEMPLATES: Record<string, string> = {
    tc: `This is to certify that {{studentName}}, S/D of {{fatherName}}, was a bonafide student of this school. He/She studied in Class {{class}} during the academic session {{session}}. His/Her date of birth is {{dob}}. His/Her conduct and character were {{character}}.`,
    cc: `This is to certify that {{studentName}}, S/D of {{fatherName}}, was a student of this institution from {{fromDate}} to {{toDate}}. During this period, his/her conduct was {{character}}.`,
    bonafide: `This is to certify that {{studentName}}, S/D of {{fatherName}}, is a bonafide student of Class {{class}} of this school for the academic session {{session}}.`,
    custom: `{{content}}`,
}

interface DocTemplate {
    _id: string
    name: string
    type: string
    content: string
    variables: string[]
    isDefault: boolean
    createdAt: string
}

export default function DocumentsPage() {
    const [templates, setTemplates] = useState<DocTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const [saving, setSaving] = useState(false)

    const [form, setForm] = useState({
        name: '', type: 'tc' as string, content: DEFAULT_TEMPLATES['tc'], variables: [] as string[],
    })

    const fetchTemplates = () => {
        fetch('/api/documents').then(r => r.json()).then(d => { setTemplates(Array.isArray(d) ? d : []); setLoading(false) })
    }

    useEffect(() => { fetchTemplates() }, [])

    const handleTypeChange = (type: string) => {
        setForm({
            ...form,
            type,
            content: DEFAULT_TEMPLATES[type] || '',
            name: DOC_TYPES.find(d => d.value === type)?.label || '',
        })
    }

    const handleCreate = async () => {
        if (!form.name.trim()) return
        setSaving(true)
        const variables = (form.content.match(/\{\{(\w+)\}\}/g) || []).map(v => v.replace(/\{\{|\}\}/g, ''))
        try {
            const res = await fetch('/api/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, variables }),
            })
            if (!res.ok) throw new Error('Failed')
            setAlert({ type: 'success', msg: 'Template created!' })
            setModalOpen(false)
            fetchTemplates()
        } catch (e: any) {
            setAlert({ type: 'error', msg: e.message })
        }
        setSaving(false)
    }

    if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

    return (
        <div>
            <PageHeader
                title="Document Templates"
                subtitle="TC, CC, Bonafide aur custom documents"
                action={<Button onClick={() => setModalOpen(true)}><Plus size={16} /> New Template</Button>}
            />

            {alert && <div className="mb-5"><Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} /></div>}

            {templates.length === 0 ? (
                <EmptyState
                    icon={<FileCheck size={24} />}
                    title="No templates"
                    description="Create document templates for TC, CC, Bonafide etc."
                    action={<Button onClick={() => setModalOpen(true)}><Plus size={14} /> Create Template</Button>}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map(t => (
                        <Card key={t._id}>
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-semibold text-sm text-slate-800">{t.name}</h3>
                                    <Badge variant={t.type === 'tc' ? 'info' : t.type === 'cc' ? 'success' : t.type === 'bonafide' ? 'warning' : 'purple'}>
                                        {t.type.toUpperCase()}
                                    </Badge>
                                </div>
                                <FileCheck size={20} className="text-slate-400" />
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-3 mb-3">{t.content}</p>
                            <div className="flex flex-wrap gap-1">
                                {t.variables?.map(v => (
                                    <span key={v} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{`{{${v}}}`}</span>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Document Template" size="lg">
                <div className="space-y-4">
                    <Select
                        label="Document Type"
                        value={form.type}
                        onChange={e => handleTypeChange(e.target.value)}
                        options={DOC_TYPES}
                    />
                    <Input label="Template Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">
                            Template Content <span className="text-slate-400">(Use {'{{variableName}}'} for dynamic fields)</span>
                        </label>
                        <textarea
                            value={form.content}
                            onChange={e => setForm({ ...form, content: e.target.value })}
                            className="w-full h-40 px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 font-mono"
                        />
                    </div>
                    <Button className="w-full" onClick={handleCreate} loading={saving}>Create Template</Button>
                </div>
            </Modal>
        </div>
    )
}