// src/app/(dashboard)/parent/exams/page.tsx — NEW FILE
// Parent apne bachche ke exams dekhe + admit card download kare
// ═══════════════════════════════════════════════════════════

'use client'

import { useState, useEffect } from 'react'
import { PageHeader, Spinner, EmptyState, Card } from '@/components/ui'
import { BookOpen, Download, Calendar, Clock } from 'lucide-react'

// Same structure as StudentExamsPage
// Difference: admit card URL mein studentId nahi chahiye
// (Parent ka session server pe student link se resolve hoga)

export default function ParentExamsPage() {
    const [exams, setExams] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState<string | null>(null)

    useEffect(() => {
        fetch('/api/exams')
            .then(r => r.json())
            .then(d => { setExams(d.exams ?? []); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <Spinner size="lg" />
            </div>
        )
    }

    return (
        <div className="portal-content-enter space-y-5">

            <PageHeader
                title="Exam Schedule"
                subtitle="Bachche ke exams aur admit cards"
            />

            {exams.length === 0 ? (
                <EmptyState
                    icon={<BookOpen size={24} />}
                    title="No exams scheduled"
                    description="Exams yahan dikhenge jab school schedule karega"
                />
            ) : (
                <div className="space-y-4">
                    {exams.map(exam => (
                        <Card key={exam._id} padding={false}>
                            <div
                                className="flex items-center justify-between p-4 cursor-pointer"
                                onClick={() => setExpanded(expanded === exam._id ? null : exam._id)}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h3 className="font-bold text-[var(--text-primary)]">
                                            {exam.name}
                                        </h3>
                                        <span className={[
                                            'text-xs font-semibold px-2.5 py-1 rounded-full',
                                            exam.status === 'upcoming'
                                                ? 'bg-[var(--info-light)] text-[var(--info-dark)]'
                                                : exam.status === 'ongoing'
                                                    ? 'bg-[var(--warning-light)] text-[var(--warning-dark)]'
                                                    : 'bg-[var(--success-light)] text-[var(--success-dark)]',
                                        ].join(' ')}>
                                            {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)] mt-1">
                                        {exam.academicYear} · {exam.subjects?.length ?? 0} subjects
                                    </p>
                                </div>

                                {exam.admitCardEnabled && (
                                    <a
                                        href={`/api/pdf/admitcard/${exam._id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={e => e.stopPropagation()}
                                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 ml-3 rounded-[var(--radius-sm)] bg-[var(--primary-50)] text-[var(--primary-600)] border border-[var(--primary-200)] hover:bg-[var(--primary-100)] transition-all flex-shrink-0"
                                    >
                                        <Download size={12} />
                                        Admit Card
                                    </a>
                                )}
                            </div>

                            {expanded === exam._id && (
                                <div className="border-t border-[var(--border)] px-4 pb-4 pt-3">
                                    <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">
                                        Schedule
                                    </p>
                                    <div className="space-y-2">
                                        {(exam.subjects ?? [])
                                            .sort((a: any, b: any) =>
                                                new Date(a.date).getTime() - new Date(b.date).getTime()
                                            )
                                            .map((sub: any) => (
                                                <div
                                                    key={sub.name}
                                                    className="flex items-center justify-between p-2.5 rounded-[var(--radius-md)] bg-[var(--bg-muted)] border border-[var(--border)]"
                                                >
                                                    <div>
                                                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                                                            {sub.name}
                                                        </p>
                                                        <p className="text-xs text-[var(--text-muted)]">
                                                            {sub.components?.length > 0
                                                                ? sub.components.map((c: any) => `${c.name}(${c.maxMarks})`).join(' + ')
                                                                : `${sub.totalMaxMarks ?? sub.maxMarks ?? 0} marks`}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={11} />
                                                            {sub.date
                                                                ? new Date(sub.date).toLocaleDateString('en-IN', {
                                                                    weekday: 'short', day: '2-digit', month: 'short',
                                                                })
                                                                : '—'}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={11} />
                                                            {sub.time || '—'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}