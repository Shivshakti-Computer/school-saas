// FILE: src/app/(superadmin)/superadmin/feedback/page.tsx
'use client'

import { useState, useEffect } from 'react'

function StarDisplay({ rating }: { rating: number }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
                <span key={s} className={s <= rating ? 'text-amber-400' : 'text-slate-200'}>
                    ★
                </span>
            ))}
        </div>
    )
}

export default function FeedbackPage() {
    const [feedbacks, setFeedbacks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState('pending')
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const fetchData = () => {
        setLoading(true)
        const q = filterStatus ? `?status=${filterStatus}&limit=50` : '?limit=50'
        fetch(`/api/superadmin/feedback${q}`)
            .then(r => r.json())
            .then(d => { setFeedbacks(d.feedbacks || []); setLoading(false) })
            .catch(() => setLoading(false))
    }

    useEffect(() => { fetchData() }, [filterStatus])

    const updateStatus = async (id: string, status: string) => {
        setActionLoading(id)
        await fetch(`/api/superadmin/feedback/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        })
        setActionLoading(null)
        fetchData()
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this review?')) return
        await fetch(`/api/superadmin/feedback/${id}`, { method: 'DELETE' })
        fetchData()
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-slate-900">⭐ Reviews & Feedback</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                    Moderate school reviews before they go public
                </p>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
                {['pending', 'approved', 'rejected', ''].map(s => (
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

            {loading ? (
                <div className="text-center py-20 text-slate-400">Loading...</div>
            ) : feedbacks.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                    No {filterStatus} reviews
                </div>
            ) : (
                <div className="space-y-4">
                    {feedbacks.map(f => (
                        <div
                            key={f._id}
                            className="bg-white rounded-xl border border-slate-200 p-5"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <StarDisplay rating={f.rating} />
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${f.status === 'approved'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : f.status === 'rejected'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {f.status}
                                        </span>
                                        {f.wouldRecommend && (
                                            <span className="text-xs text-emerald-600 font-medium">
                                                ✓ Recommends
                                            </span>
                                        )}
                                        <span className="text-xs text-slate-400 ml-auto">
                                            {new Date(f.createdAt).toLocaleDateString('en-IN')}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-slate-900 text-sm mb-1">{f.title}</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed mb-3">
                                        {f.message}
                                    </p>

                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center
                      justify-center text-indigo-700 text-xs font-bold">
                                            {f.schoolName?.charAt(0) || 'S'}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">
                                                {f.contactName}
                                            </p>
                                            <p className="text-[11px] text-slate-400">
                                                {f.schoolName}
                                                {f.schoolLocation && ` · ${f.schoolLocation}`}
                                                {f.contactPhone && ` · ${f.contactPhone}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2 flex-shrink-0">
                                    {f.status !== 'approved' && (
                                        <button
                                            onClick={() => updateStatus(f._id, 'approved')}
                                            disabled={actionLoading === f._id}
                                            className="px-3 py-1.5 bg-emerald-600 text-white text-xs
                        font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-60"
                                        >
                                            ✓ Approve
                                        </button>
                                    )}
                                    {f.status !== 'rejected' && (
                                        <button
                                            onClick={() => updateStatus(f._id, 'rejected')}
                                            disabled={actionLoading === f._id}
                                            className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs
                        font-semibold rounded-lg hover:bg-slate-200 disabled:opacity-60"
                                        >
                                            ✕ Reject
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(f._id)}
                                        className="px-3 py-1.5 bg-red-50 text-red-600 text-xs
                      font-semibold rounded-lg hover:bg-red-100"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}