// -------------------------------------------------------------
// FILE: src/app/(dashboard)/student/notices/page.tsx
// -------------------------------------------------------------
'use client'
import { useState, useEffect } from 'react'
import { Card, PageHeader, Badge, Spinner, EmptyState } from '@/components/ui'
import { Bell } from 'lucide-react'

export default function ParentNoticesPage() {
    const [notices, setNotices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState<string | null>(null)

    useEffect(() => {
        fetch('/api/students/notices')
            .then(r => r.json())
            .then(d => { setNotices(d.notices ?? []); setLoading(false) })
    }, [])

    return (
        <div className="space-y-4">
            <PageHeader title="Notices" subtitle={`${notices.length} active notices`} />

            {loading ? (
                <div className="flex justify-center py-12"><Spinner size="lg" /></div>
            ) : notices.length === 0 ? (
                <EmptyState
                    icon={<Bell size={24} />}
                    title="Koi notice nahi"
                    description="Abhi koi active notice nahi hai"
                />
            ) : (
                <div className="space-y-2">
                    {notices.map(n => (
                        <Card key={n._id} padding={false}>
                            <button
                                className="w-full text-left px-5 py-4"
                                onClick={() => setExpanded(expanded === n._id ? null : n._id)}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.priority === 'urgent' ? 'bg-red-500' : 'bg-indigo-400'}`} />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                                            {n.priority === 'urgent' && <Badge variant="danger">Urgent</Badge>}
                                        </div>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {new Date(n.publishedAt).toLocaleDateString('en-IN', {
                                                day: 'numeric', month: 'short', year: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                    <span className="text-slate-400 text-xs">{expanded === n._id ? '▲' : '▼'}</span>
                                </div>
                            </button>
                            {expanded === n._id && (
                                <div className="px-5 pb-4 border-t border-slate-50">
                                    <p className="text-sm text-slate-600 mt-3 leading-relaxed">{n.content}</p>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}