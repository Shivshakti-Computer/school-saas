// FILE: src/app/(superadmin)/superadmin/announcements/page.tsx
'use client'

import { useState, useEffect } from 'react'

type AnnouncementType = 'feature' | 'update' | 'maintenance' | 'offer' | 'general'
type AnnouncementStatus = 'draft' | 'published' | 'archived'

const TYPE_OPTIONS: { value: AnnouncementType; label: string; icon: string }[] = [
    { value: 'feature', label: 'New Feature', icon: '✨' },
    { value: 'update', label: 'Update', icon: '🔄' },
    { value: 'maintenance', label: 'Maintenance', icon: '🔧' },
    { value: 'offer', label: 'Offer', icon: '🎁' },
    { value: 'general', label: 'General', icon: '📢' },
]

const STATUS_COLORS: Record<AnnouncementStatus, string> = {
    draft: 'bg-slate-100 text-slate-600',
    published: 'bg-emerald-100 text-emerald-700',
    archived: 'bg-amber-100 text-amber-700',
}

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editItem, setEditItem] = useState<any>(null)
    const [form, setForm] = useState({
        title: '', summary: '', content: '',
        type: 'general' as AnnouncementType,
        status: 'draft' as AnnouncementStatus,
        isPinned: false, isBanner: false,
        bannerText: '', bannerColor: '#2563EB',
        expiresAt: '', tags: '',
    })
    const [saving, setSaving] = useState(false)
    const [filterStatus, setFilterStatus] = useState('')

    const fetchData = () => {
        setLoading(true)
        const q = filterStatus ? `?status=${filterStatus}` : ''
        fetch(`/api/superadmin/announcements${q}`)
            .then(r => r.json())
            .then(d => { setAnnouncements(d.announcements || []); setLoading(false) })
            .catch(() => setLoading(false))
    }

    useEffect(() => { fetchData() }, [filterStatus])

    const resetForm = () => {
        setForm({
            title: '', summary: '', content: '',
            type: 'general', status: 'draft',
            isPinned: false, isBanner: false,
            bannerText: '', bannerColor: '#2563EB',
            expiresAt: '', tags: '',
        })
        setEditItem(null)
    }

    const openEdit = (item: any) => {
        setForm({
            title: item.title,
            summary: item.summary,
            content: item.content,
            type: item.type,
            status: item.status,
            isPinned: item.isPinned,
            isBanner: item.isBanner,
            bannerText: item.bannerText || '',
            bannerColor: item.bannerColor || '#2563EB',
            expiresAt: item.expiresAt
                ? new Date(item.expiresAt).toISOString().split('T')[0]
                : '',
            tags: item.tags?.join(', ') || '',
        })
        setEditItem(item)
        setShowForm(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        const payload = {
            ...form,
            tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            expiresAt: form.expiresAt || null,
        }

        try {
            if (editItem) {
                await fetch(`/api/superadmin/announcements/${editItem._id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
            } else {
                await fetch('/api/superadmin/announcements', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
            }
            resetForm()
            setShowForm(false)
            fetchData()
        } catch (err) {
            alert('Save failed')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this announcement?')) return
        await fetch(`/api/superadmin/announcements/${id}`, { method: 'DELETE' })
        fetchData()
    }

    const quickStatusChange = async (id: string, status: AnnouncementStatus) => {
        await fetch(`/api/superadmin/announcements/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        })
        fetchData()
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">📢 Announcements</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Create and manage public announcements
                    </p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(true) }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl
            text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                    + New Announcement
                </button>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
                {['', 'draft', 'published', 'archived'].map(s => (
                    <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors
              ${filterStatus === s
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-slate-600 border-slate-200'}`}
                    >
                        {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-start justify-center
          overflow-y-auto bg-black/40 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h2 className="font-bold text-slate-900">
                                {editItem ? 'Edit Announcement' : 'New Announcement'}
                            </h2>
                            <button onClick={() => { setShowForm(false); resetForm() }}
                                className="text-slate-400 hover:text-slate-600 text-xl">×</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Title *
                                </label>
                                <input
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5
                    text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                                    value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Summary * (shown on cards/banner)
                                </label>
                                <textarea
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5
                    text-sm resize-none focus:border-indigo-500 outline-none"
                                    rows={2}
                                    value={form.summary}
                                    onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Full Content
                                </label>
                                <textarea
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5
                    text-sm resize-none focus:border-indigo-500 outline-none"
                                    rows={4}
                                    value={form.content}
                                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                        Type
                                    </label>
                                    <select
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5
                      text-sm focus:border-indigo-500 outline-none"
                                        value={form.type}
                                        onChange={e => setForm(f => ({ ...f, type: e.target.value as AnnouncementType }))}
                                    >
                                        {TYPE_OPTIONS.map(t => (
                                            <option key={t.value} value={t.value}>
                                                {t.icon} {t.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                        Status
                                    </label>
                                    <select
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5
                      text-sm focus:border-indigo-500 outline-none"
                                        value={form.status}
                                        onChange={e => setForm(f => ({ ...f, status: e.target.value as AnnouncementStatus }))}
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                        Expires At (optional)
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5
                      text-sm focus:border-indigo-500 outline-none"
                                        value={form.expiresAt}
                                        onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                        Tags (comma separated)
                                    </label>
                                    <input
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5
                      text-sm focus:border-indigo-500 outline-none"
                                        placeholder="feature, update, v2.0"
                                        value={form.tags}
                                        onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Banner options */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                                <p className="text-xs font-bold text-slate-700">Banner Options</p>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="isBanner"
                                        checked={form.isBanner}
                                        onChange={e => setForm(f => ({ ...f, isBanner: e.target.checked }))}
                                        className="w-4 h-4"
                                    />
                                    <label htmlFor="isBanner" className="text-sm text-slate-600 cursor-pointer">
                                        Show as sitewide top banner
                                    </label>
                                </div>
                                {form.isBanner && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                                            placeholder="Short banner text..."
                                            value={form.bannerText}
                                            onChange={e => setForm(f => ({ ...f, bannerText: e.target.value }))}
                                        />
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={form.bannerColor}
                                                onChange={e => setForm(f => ({ ...f, bannerColor: e.target.value }))}
                                                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                                            />
                                            <span className="text-xs text-slate-500">Banner color</span>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="isPinned"
                                        checked={form.isPinned}
                                        onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))}
                                        className="w-4 h-4"
                                    />
                                    <label htmlFor="isPinned" className="text-sm text-slate-600 cursor-pointer">
                                        Pin at top of updates page
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); resetForm() }}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-200
                    text-slate-600 text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-2 px-8 py-2.5 rounded-xl bg-indigo-600
                    text-white text-sm font-semibold disabled:opacity-60"
                                >
                                    {saving ? 'Saving...' : editItem ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="text-center py-20 text-slate-400">Loading...</div>
            ) : announcements.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                    No announcements. Create your first one!
                </div>
            ) : (
                <div className="space-y-3">
                    {announcements.map(a => (
                        <div
                            key={a._id}
                            className="bg-white rounded-xl border border-slate-200 p-5
                flex items-start gap-4"
                        >
                            <div className="text-2xl flex-shrink-0">
                                {TYPE_OPTIONS.find(t => t.value === a.type)?.icon || '📢'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold
                    ${STATUS_COLORS[a.status as AnnouncementStatus]}`}>
                                        {a.status}
                                    </span>
                                    {a.isPinned && (
                                        <span className="text-xs text-amber-600">📌 Pinned</span>
                                    )}
                                    {a.isBanner && (
                                        <span className="text-xs text-blue-600">🔔 Banner</span>
                                    )}
                                    <span className="text-xs text-slate-400 ml-auto">
                                        {new Date(a.createdAt).toLocaleDateString('en-IN')}
                                    </span>
                                </div>
                                <h3 className="font-bold text-slate-900 text-sm">{a.title}</h3>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{a.summary}</p>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                {a.status === 'draft' && (
                                    <button
                                        onClick={() => quickStatusChange(a._id, 'published')}
                                        className="px-3 py-1 bg-emerald-100 text-emerald-700
                      text-xs font-semibold rounded-lg hover:bg-emerald-200"
                                    >
                                        Publish
                                    </button>
                                )}
                                {a.status === 'published' && (
                                    <button
                                        onClick={() => quickStatusChange(a._id, 'archived')}
                                        className="px-3 py-1 bg-slate-100 text-slate-600
                      text-xs font-semibold rounded-lg hover:bg-slate-200"
                                    >
                                        Archive
                                    </button>
                                )}
                                <button
                                    onClick={() => openEdit(a)}
                                    className="px-3 py-1 bg-indigo-50 text-indigo-600
                    text-xs font-semibold rounded-lg hover:bg-indigo-100"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(a._id)}
                                    className="px-3 py-1 bg-red-50 text-red-600
                    text-xs font-semibold rounded-lg hover:bg-red-100"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}