/* ============================================================
   FILE: src/app/(dashboard)/admin/notices/page.tsx
   Notice board — list, create, send SMS
   ============================================================ */

'use client'
import { useState, useEffect } from 'react'
import {
    Button, Badge, Card, PageHeader, Modal,
    Input, Alert, EmptyState, Spinner,
} from '@/components/ui'
import { Bell, Send } from 'lucide-react'

interface Notice {
    _id: string
    title: string
    content: string
    targetRole: string
    priority: string
    publishedAt: string
    smsSent: boolean
    smsCount: number
    expiresAt?: string
}

const TARGET_OPTIONS = [
    { value: 'all', label: 'Everyone' },
    { value: 'parent', label: 'Parents only' },
    { value: 'teacher', label: 'Teachers only' },
    { value: 'student', label: 'Students only' },
]

export default function NoticesPage() {
    const [notices, setNotices] = useState<Notice[]>([])
    const [loading, setLoading] = useState(true)
    const [showAdd, setShowAdd] = useState(false)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

    const fetchNotices = async () => {
        setLoading(true)
        const res = await fetch('/api/notices')
        const data = await res.json()
        setNotices(data.notices ?? [])
        setLoading(false)
    }

    useEffect(() => {
        fetchNotices()
        if (window.location.search.includes('action=add')) setShowAdd(true)
    }, [])

    const priorityBadge = (p: string) =>
        p === 'urgent'
            ? <Badge variant="danger">Urgent</Badge>
            : <Badge variant="default">Normal</Badge>

    const roleBadge = (r: string) => {
        const map: Record<string, 'info' | 'purple' | 'warning' | 'success' | 'default'> = {
            all: 'info',
            parent: 'warning',
            teacher: 'purple',
            student: 'success',
        }
        return <Badge variant={map[r] ?? 'default'}>{r}</Badge>
    }

    return (
        <div>
            <PageHeader
                title="Notice Board"
                subtitle={`${notices.length} active notices`}
                action={
                    <Button size="sm" onClick={() => setShowAdd(true)}>
                        + Post Notice
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
            ) : notices.length === 0 ? (
                <EmptyState
                    icon={<Bell size={24} />}
                    title="No notices posted yet"
                    description="Post your first notice and notify parents, teachers, or students"
                    action={<Button size="sm" onClick={() => setShowAdd(true)}>Post Notice</Button>}
                />
            ) : (
                <div className="space-y-3">
                    {notices.map(n => (
                        <Card key={n._id}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        {priorityBadge(n.priority)}
                                        {roleBadge(n.targetRole)}
                                        <span className="text-xs text-slate-400">
                                            {new Date(n.publishedAt).toLocaleDateString('en-IN', {
                                                day: 'numeric', month: 'short', year: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-semibold text-slate-800 mb-1">{n.title}</h3>
                                    <p className="text-sm text-slate-500 line-clamp-2">{n.content}</p>
                                    {n.smsSent && (
                                        <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                                            <Send size={10} /> SMS sent to {n.smsCount} people
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <AddNoticeModal
                open={showAdd}
                onClose={() => setShowAdd(false)}
                onSuccess={() => {
                    setShowAdd(false)
                    fetchNotices()
                    setAlert({ type: 'success', msg: 'Notice posted successfully!' })
                }}
            />
        </div>
    )
}

function AddNoticeModal({
    open, onClose, onSuccess,
}: {
    open: boolean; onClose: () => void; onSuccess: () => void
}) {
    const [form, setForm] = useState({
        title: '', content: '', targetRole: 'all', priority: 'normal', sendSms: false,
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        const res = await fetch('/api/notices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })
        const data = await res.json()
        setLoading(false)
        if (!res.ok) { setError(data.error ?? 'Error'); return }
        setForm({ title: '', content: '', targetRole: 'all', priority: 'normal', sendSms: false })
        onSuccess()
    }

    return (
        <Modal open={open} onClose={onClose} title="Post New Notice">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Notice Title *"
                    placeholder="School closed on Monday"
                    value={form.title}
                    onChange={e => set('title', e.target.value)}
                    required
                />
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-600">Content *</label>
                    <textarea
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 resize-none"
                        rows={4}
                        placeholder="Write notice content here..."
                        value={form.content}
                        onChange={e => set('content', e.target.value)}
                        required
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-600">Send To</label>
                        <select
                            className="h-9 px-3 text-sm rounded-lg border border-slate-200"
                            value={form.targetRole}
                            onChange={e => set('targetRole', e.target.value)}
                        >
                            {TARGET_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-600">Priority</label>
                        <select
                            className="h-9 px-3 text-sm rounded-lg border border-slate-200"
                            value={form.priority}
                            onChange={e => set('priority', e.target.value)}
                        >
                            <option value="normal">Normal</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                </div>

                {/* SMS toggle */}
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div
                        className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${form.sendSms ? 'bg-indigo-600' : 'bg-slate-300'}`}
                        onClick={() => set('sendSms', !form.sendSms)}
                    >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.sendSms ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-700">Send SMS Alert</p>
                        <p className="text-xs text-slate-400">SMS will be sent to all selected users</p>
                    </div>
                </label>

                {error && <Alert type="error" message={error} />}

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                    <Button type="submit" loading={loading}>
                        <Bell size={14} /> Post Notice
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
