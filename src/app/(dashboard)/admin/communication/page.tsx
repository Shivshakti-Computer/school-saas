'use client'
import { useEffect, useState } from 'react'
import { PageHeader, Button, Card, Table, Tr, Td, Badge, Modal, Input, Select, Spinner, Alert, EmptyState } from '@/components/ui'
import { MessageSquare, Send, Clock } from 'lucide-react'

const CLASSES = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

interface CommunicationItem {
    _id: string
    type: string
    title: string
    content: string
    recipients: string
    targetClass?: string
    totalSent: number
    totalFailed: number
    sentAt: string
}

export default function CommunicationPage() {
    const [history, setHistory] = useState<CommunicationItem[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const [sending, setSending] = useState(false)

    const [form, setForm] = useState({
        type: 'sms', title: '', content: '', recipients: 'all' as string, targetClass: '',
    })

    const fetchHistory = () => {
        fetch('/api/communication').then(r => r.json()).then(d => { setHistory(Array.isArray(d) ? d : []); setLoading(false) })
    }

    useEffect(() => { fetchHistory() }, [])

    const handleSend = async () => {
        if (!form.title.trim() || !form.content.trim()) return
        setSending(true)
        try {
            const res = await fetch('/api/communication', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed')
            setAlert({ type: 'success', msg: `Sent to ${data.sent} recipients (${data.failed} failed)` })
            setModalOpen(false)
            setForm({ type: 'sms', title: '', content: '', recipients: 'all', targetClass: '' })
            fetchHistory()
        } catch (e: any) {
            setAlert({ type: 'error', msg: e.message })
        }
        setSending(false)
    }

    if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

    return (
        <div>
            <PageHeader
                title="Communication"
                subtitle="SMS, WhatsApp, Email campaigns"
                action={<Button onClick={() => setModalOpen(true)}><Send size={16} /> New Message</Button>}
            />

            {alert && <div className="mb-5"><Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} /></div>}

            {history.length === 0 ? (
                <EmptyState
                    icon={<MessageSquare size={24} />}
                    title="No messages sent"
                    description="Send bulk SMS or emails to parents"
                    action={<Button onClick={() => setModalOpen(true)}><Send size={14} /> Send Message</Button>}
                />
            ) : (
                <Card padding={false}>
                    <Table headers={['Date', 'Type', 'Title', 'Recipients', 'Sent', 'Failed']}>
                        {history.map(msg => (
                            <Tr key={msg._id}>
                                <Td className="text-xs text-slate-500">
                                    {new Date(msg.sentAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </Td>
                                <Td><Badge variant={msg.type === 'sms' ? 'info' : msg.type === 'whatsapp' ? 'success' : 'purple'}>{msg.type.toUpperCase()}</Badge></Td>
                                <Td className="font-medium">{msg.title}</Td>
                                <Td className="capitalize">{msg.recipients}{msg.targetClass ? ` — Class ${msg.targetClass}` : ''}</Td>
                                <Td><span className="text-emerald-600 font-medium">{msg.totalSent}</span></Td>
                                <Td><span className={msg.totalFailed > 0 ? 'text-red-600 font-medium' : 'text-slate-400'}>{msg.totalFailed}</span></Td>
                            </Tr>
                        ))}
                    </Table>
                </Card>
            )}

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Send Message" size="lg">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <Select
                            label="Channel"
                            value={form.type}
                            onChange={e => setForm({ ...form, type: e.target.value })}
                            options={[
                                { value: 'sms', label: 'SMS' },
                                { value: 'whatsapp', label: 'WhatsApp' },
                                { value: 'email', label: 'Email' },
                            ]}
                        />
                        <Select
                            label="Recipients"
                            value={form.recipients}
                            onChange={e => setForm({ ...form, recipients: e.target.value })}
                            options={[
                                { value: 'all', label: 'All Parents' },
                                { value: 'class', label: 'Specific Class' },
                            ]}
                        />
                    </div>
                    {form.recipients === 'class' && (
                        <Select
                            label="Select Class"
                            value={form.targetClass}
                            onChange={e => setForm({ ...form, targetClass: e.target.value })}
                            options={[{ value: '', label: 'Choose class' }, ...CLASSES.map(c => ({ value: c, label: `Class ${c}` }))]}
                        />
                    )}
                    <Input label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Message subject" />
                    <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">Message Content</label>
                        <textarea
                            value={form.content}
                            onChange={e => setForm({ ...form, content: e.target.value })}
                            className="w-full h-28 px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
                            placeholder="Type your message..."
                        />
                        <p className="text-[11px] text-slate-400 mt-1">{form.content.length} characters</p>
                    </div>
                    <Button className="w-full" onClick={handleSend} loading={sending}>
                        <Send size={14} /> Send Message
                    </Button>
                </div>
            </Modal>
        </div>
    )
}