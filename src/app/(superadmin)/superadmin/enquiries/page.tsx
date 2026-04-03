// FILE: src/app/(superadmin)/superadmin/enquiries/page.tsx
'use client'

import { useState, useEffect } from 'react'

const STATUS_COLORS: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-amber-100 text-amber-700',
    resolved: 'bg-emerald-100 text-emerald-700',
    closed: 'bg-slate-100 text-slate-600',
}

const PLAN_LABELS: Record<string, string> = {
    starter: '🔵 Starter',
    growth: '🟣 Growth',
    pro: '🟡 Pro',
    enterprise: '🟤 Enterprise',
    not_sure: 'Not sure',
    '': '—',
}

export default function EnquiriesPage() {
    const [enquiries, setEnquiries] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState('new')
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [noteValues, setNoteValues] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState<string | null>(null)

    const fetchData = () => {
        setLoading(true)
        const q = filterStatus ? `?status=${filterStatus}&limit=50` : '?limit=50'
        fetch(`/api/superadmin/enquiries${q}`)
            .then(r => r.json())
            .then(d => { setEnquiries(d.enquiries || []); setLoading(false) })
            .catch(() => setLoading(false))
    }

    useEffect(() => { fetchData() }, [filterStatus])

    const updateEnquiry = async (id: string, update: any) => {
        setSaving(id)
        await fetch(`/api/superadmin/enquiries/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(update),
        })
        setSaving(null)
        fetchData()
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this enquiry?')) return
        await fetch(`/api/superadmin/enquiries/${id}`, { method: 'DELETE' })
        fetchData()
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-slate-900">📬 Enquiries</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                    Manage contact form submissions and chatbot forwards
                </p>
            </div>

            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
                {['new', 'in_progress', 'resolved', 'closed', ''].map(s => (
                    <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors
              ${filterStatus === s
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-slate-600 border-slate-200'}`}
                    >
                        {s === '' ? 'All' : s.replace('_', ' ')
                            .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-400">Loading...</div>
            ) : enquiries.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                    No {filterStatus || ''} enquiries
                </div>
            ) : (
                <div className="space-y-3">
                    {enquiries.map(e => (
                        <div
                            key={e._id}
                            className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                        >
                            {/* Summary row */}
                            <div
                                className="flex items-center gap-4 px-5 py-4 cursor-pointer
                  hover:bg-slate-50 transition-colors"
                                onClick={() => setExpandedId(expandedId === e._id ? null : e._id)}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold
                      ${STATUS_COLORS[e.status] || 'bg-slate-100 text-slate-600'}`}>
                                            {e.status.replace('_', ' ')}
                                        </span>
                                        {e.source === 'chatbot_forward' && (
                                            <span className="text-[11px] text-purple-600 font-medium">
                                                🤖 Chatbot
                                            </span>
                                        )}
                                        {e.interestedPlan && e.interestedPlan !== 'not_sure' && (
                                            <span className="text-[11px] text-slate-500">
                                                {PLAN_LABELS[e.interestedPlan]}
                                            </span>
                                        )}
                                        <span className="text-xs text-slate-400 ml-auto">
                                            {new Date(e.createdAt).toLocaleDateString('en-IN', {
                                                day: 'numeric', month: 'short', year: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                    <p className="font-bold text-slate-900 text-sm truncate">
                                        {e.subject}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {e.name} · {e.phone}
                                        {e.schoolName && ` · ${e.schoolName}`}
                                    </p>
                                </div>
                                <span className="text-slate-400 text-sm flex-shrink-0">
                                    {expandedId === e._id ? '▲' : '▼'}
                                </span>
                            </div>

                            {/* Expanded detail */}
                            {expandedId === e._id && (
                                <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
                                    {/* Contact info */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {[
                                            { label: 'Name', value: e.name },
                                            { label: 'Phone', value: e.phone },
                                            { label: 'Email', value: e.email || '—' },
                                            { label: 'Location', value: e.schoolLocation || '—' },
                                            { label: 'School', value: e.schoolName || '—' },
                                            { label: 'School Size', value: e.schoolSize || '—' },
                                            { label: 'Interested Plan', value: PLAN_LABELS[e.interestedPlan] || '—' },
                                            { label: 'Source', value: e.source },
                                        ].map(item => (
                                            <div key={item.label}>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">
                                                    {item.label}
                                                </p>
                                                <p className="text-sm text-slate-700 font-medium mt-0.5">
                                                    {item.value}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Message */}
                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                        <p className="text-xs font-bold text-slate-500 mb-2">Message</p>
                                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                            {e.message}
                                        </p>
                                    </div>

                                    {/* Note + Actions */}
                                    <div className="flex gap-3 flex-col sm:flex-row">
                                        <textarea
                                            className="flex-1 border border-slate-200 rounded-xl px-3 py-2
                        text-sm resize-none outline-none focus:border-indigo-500"
                                            rows={2}
                                            placeholder="Internal note..."
                                            value={noteValues[e._id] ?? (e.superadminNote || '')}
                                            onChange={ev => setNoteValues(n => ({ ...n, [e._id]: ev.target.value }))}
                                        />
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => updateEnquiry(e._id, {
                                                    superadminNote: noteValues[e._id] ?? e.superadminNote,
                                                })}
                                                disabled={saving === e._id}
                                                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs
                          font-semibold rounded-xl hover:bg-slate-200 disabled:opacity-60"
                                            >
                                                Save Note
                                            </button>
                                            {e.status !== 'in_progress' && (
                                                <button
                                                    onClick={() => updateEnquiry(e._id, { status: 'in_progress' })}
                                                    className="px-4 py-2 bg-amber-100 text-amber-700 text-xs
                            font-semibold rounded-xl hover:bg-amber-200"
                                                >
                                                    In Progress
                                                </button>
                                            )}
                                            {e.status !== 'resolved' && (
                                                <button
                                                    onClick={() => updateEnquiry(e._id, { status: 'resolved' })}
                                                    className="px-4 py-2 bg-emerald-600 text-white text-xs
                            font-semibold rounded-xl hover:bg-emerald-700"
                                                >
                                                    ✓ Resolved
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(e._id)}
                                                className="px-4 py-2 bg-red-50 text-red-600 text-xs
                          font-semibold rounded-xl hover:bg-red-100"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}