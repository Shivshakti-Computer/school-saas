// FILE: src/app/(dashboard)/parent/homework/page.tsx
// ═══════════════════════════════════════════════════════════
// Parent Homework Portal — View Child's Homework
// ═══════════════════════════════════════════════════════════

'use client'

import { useState, useEffect } from 'react'
import { PageHeader, Select, Alert, StatCard, Card, Badge, Button, Modal } from '@/components/ui'
import { Portal } from '@/components/ui/Portal'
import { BookOpen, Clock, CheckCircle2, AlertCircle, Download, ExternalLink } from 'lucide-react'
import type { ParentHomework, ParentHomeworkStats, ChildInfo } from '@/types/homework'

export default function ParentHomeworkPage() {
    const [children, setChildren] = useState<ChildInfo[]>([])
    const [selectedChild, setSelectedChild] = useState<string>('')
    const [homework, setHomework] = useState<ParentHomework[]>([])
    const [stats, setStats] = useState<ParentHomeworkStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedHomework, setSelectedHomework] = useState<ParentHomework | null>(null)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

    // Fetch children list
    useEffect(() => {
        const fetchChildren = async () => {
            try {
                const res = await fetch('/api/students/list') // Get children linked to parent
                const data = await res.json()

                if (res.ok) {
                    setChildren(data.students || [])
                    if (data.students.length > 0) {
                        setSelectedChild(data.students[0]._id)
                    }
                }
            } catch (err) {
                console.error('Failed to fetch children:', err)
            }
        }

        fetchChildren()
    }, [])

    // Fetch homework for selected child
    useEffect(() => {
        if (!selectedChild) return

        const fetchHomework = async () => {
            try {
                setLoading(true)
                const res = await fetch(`/api/homework/parent?childId=${selectedChild}`)
                const data = await res.json()

                if (res.ok) {
                    setHomework(data.homework)
                    setStats(data.stats)
                } else {
                    throw new Error(data.error)
                }
            } catch (err: any) {
                setAlert({ type: 'error', message: err.message })
            } finally {
                setLoading(false)
            }
        }

        fetchHomework()
    }, [selectedChild])

    const currentChild = children.find(c => c._id === selectedChild)

    return (
        <div className="space-y-6">
            <PageHeader
                title="Child's Homework"
                subtitle="Track your child's homework progress and grades"
            />

            {alert && (
                <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
            )}

            {/* Child Selector */}
            {children.length > 1 && (
                <div className="max-w-xs">
                    <Select
                        label="Select Child"
                        value={selectedChild}
                        onChange={e => setSelectedChild(e.target.value)}
                        options={children.map(child => ({
                            value: child._id,
                            label: `${child.name} - Class ${child.class}${child.section ? `-${child.section}` : ''}`,
                        }))}
                    />
                </div>
            )}

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        label="Pending"
                        value={stats.pending}
                        icon={<Clock size={18} />}
                        color="warning"
                    />
                    <StatCard
                        label="Submitted"
                        value={stats.submitted}
                        icon={<CheckCircle2 size={18} />}
                        color="info"
                    />
                    <StatCard
                        label="Graded"
                        value={stats.graded}
                        icon={<BookOpen size={18} />}
                        color="success"
                    />
                    <StatCard
                        label="Overdue"
                        value={stats.overdue}
                        icon={<AlertCircle size={18} />}
                        color="danger"
                    />
                </div>
            )}

            {/* Homework List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton h-32" />
                    ))}
                </div>
            ) : homework.length === 0 ? (
                <Card className="text-center py-12">
                    <BookOpen size={48} className="mx-auto mb-4 text-[var(--text-muted)]" />
                    <p className="text-[var(--text-primary)] font-semibold">No homework found</p>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                        {currentChild?.name} has no active homework
                    </p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {homework.map(hw => (
                        <ParentHomeworkCard
                            key={hw._id}
                            homework={hw}
                            onView={() => setSelectedHomework(hw)}
                        />
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {selectedHomework && (
                <Portal>
                    <ParentHomeworkModal
                        homework={selectedHomework}
                        onClose={() => setSelectedHomework(null)}
                    />
                </Portal>
            )}
        </div>
    )
}

// ── Parent Homework Card ──
function ParentHomeworkCard({
    homework,
    onView,
}: {
    homework: ParentHomework
    onView: () => void
}) {
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
        })
    }

    const submission = homework.submission

    const getDaysRemaining = () => {
        const now = new Date()
        const due = new Date(homework.dueDate)
        const diff = due.getTime() - now.getTime()
        return Math.ceil(diff / (1000 * 60 * 60 * 24))
    }

    const daysRemaining = getDaysRemaining()
    const isOverdue = daysRemaining < 0 && submission?.status === 'pending'

    return (
        <Card
            className="hover:shadow-[var(--shadow-md)] transition-shadow cursor-pointer"
            onClick={onView}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge variant="primary">{homework.subject}</Badge>
                        {submission?.status === 'pending' && (
                            <>
                                {isOverdue && <Badge variant="danger">Overdue</Badge>}
                                {!isOverdue && daysRemaining <= 2 && (
                                    <Badge variant="warning">Due Soon</Badge>
                                )}
                            </>
                        )}
                        {submission?.status === 'submitted' && <Badge variant="info">Submitted</Badge>}
                        {submission?.status === 'late' && <Badge variant="warning">Late</Badge>}
                        {submission?.status === 'graded' && <Badge variant="success">Graded</Badge>}
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">
                        {homework.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-2">
                        {homework.description}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                        <span>Due: {formatDate(homework.dueDate)}</span>
                        <span>Teacher: {homework.createdByName}</span>
                        {submission?.status === 'graded' && submission.grade && (
                            <span className="font-semibold text-[var(--success)]">
                                Grade:{' '}
                                {submission.grade.marks !== undefined
                                    ? `${submission.grade.marks}/${submission.grade.maxMarks}`
                                    : submission.grade.grade}
                            </span>
                        )}
                    </div>
                </div>

                {/* Status Indicator */}
                <div className="flex-shrink-0">
                    {submission?.status === 'pending' ? (
                        <div className="px-3 py-1.5 rounded-full bg-[var(--warning-light)] text-[var(--warning-dark)] text-xs font-semibold">
                            Not Submitted
                        </div>
                    ) : submission?.status === 'graded' ? (
                        <div className="px-3 py-1.5 rounded-full bg-[var(--success-light)] text-[var(--success-dark)] text-xs font-semibold">
                            Graded
                        </div>
                    ) : (
                        <div className="px-3 py-1.5 rounded-full bg-[var(--info-light)] text-[var(--info-dark)] text-xs font-semibold">
                            Submitted
                        </div>
                    )}
                </div>
            </div>
        </Card>
    )
}

// ── Parent Homework Detail Modal ──
function ParentHomeworkModal({
    homework,
    onClose,
}: {
    homework: ParentHomework
    onClose: () => void
}) {
    const formatDate = (date: string) => {
        return new Date(date).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const submission = homework.submission

    return (
        <Modal open={true} onClose={onClose} title={homework.title} size="md">
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Homework Info */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Badge variant="primary">{homework.subject}</Badge>
                        <Badge variant="default">
                            Class {homework.class}
                            {homework.section && `-${homework.section}`}
                        </Badge>
                    </div>

                    <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-muted)]">
                        <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                            {homework.description}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <span className="text-[var(--text-muted)]">Assigned:</span>{' '}
                            <span className="text-[var(--text-primary)] font-semibold">
                                {formatDate(homework.assignedDate)}
                            </span>
                        </div>
                        <div>
                            <span className="text-[var(--text-muted)]">Due:</span>{' '}
                            <span className="text-[var(--text-primary)] font-semibold">
                                {formatDate(homework.dueDate)}
                            </span>
                        </div>
                        <div className="col-span-2">
                            <span className="text-[var(--text-muted)]">Teacher:</span>{' '}
                            <span className="text-[var(--text-primary)]">
                                {homework.createdByName}
                            </span>
                        </div>
                    </div>

                    {/* Teacher Attachments */}
                    {homework.attachments.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-[var(--text-primary)]">
                                Teacher's Attachments:
                            </p>
                            {homework.attachments.map((file, i) => (
                                <a
                                    key={i}
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-2 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-muted)] transition-colors text-sm"
                                >
                                    <Download size={14} />
                                    <span className="flex-1 truncate">{file.name}</span>
                                    <ExternalLink size={12} />
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                <div className="divider" />

                {/* Submission Status */}
                {submission ? (
                    <div className="space-y-3">
                        <div
                            className={[
                                'p-3 rounded-[var(--radius-md)]',
                                submission.status === 'graded'
                                    ? 'bg-[var(--success-light)]'
                                    : submission.status === 'late'
                                    ? 'bg-[var(--warning-light)]'
                                    : submission.status === 'submitted'
                                    ? 'bg-[var(--info-light)]'
                                    : 'bg-[var(--danger-light)]',
                            ].join(' ')}
                        >
                            <p className="text-xs text-[var(--text-muted)]">Status</p>
                            <p className="text-sm font-bold text-[var(--text-primary)]">
                                {submission.status === 'graded'
                                    ? 'Graded'
                                    : submission.status === 'late'
                                    ? 'Submitted Late'
                                    : submission.status === 'submitted'
                                    ? 'Submitted'
                                    : 'Not Submitted'}
                            </p>
                            {submission.submittedAt && (
                                <p className="text-xs text-[var(--text-muted)] mt-1">
                                    on {formatDate(submission.submittedAt)}
                                </p>
                            )}
                        </div>

                        {/* Submitted Files */}
                        {submission.attachments && submission.attachments.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-[var(--text-primary)]">
                                    Submitted Files:
                                </p>
                                {submission.attachments.map((file, i) => (
                                    <a
                                        key={i}
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-2 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-muted)] text-sm"
                                    >
                                        <Download size={14} />
                                        <span className="flex-1 truncate">{file.name}</span>
                                        <ExternalLink size={12} />
                                    </a>
                                ))}
                            </div>
                        )}

                        {/* Student Remarks */}
                        {submission.remarks && (
                            <div>
                                <p className="text-xs font-semibold text-[var(--text-primary)] mb-1">
                                    Student's Note:
                                </p>
                                <p className="text-sm text-[var(--text-secondary)] p-2 bg-[var(--bg-muted)] rounded-[var(--radius-sm)]">
                                    {submission.remarks}
                                </p>
                            </div>
                        )}

                        {/* Grade */}
                        {submission.grade && (
                            <div className="p-4 rounded-[var(--radius-md)] bg-[var(--primary-50)] border border-[var(--primary-200)]">
                                <p className="text-xs text-[var(--primary-600)] mb-2">Grade</p>
                                <p className="text-2xl font-bold text-[var(--primary-600)]">
                                    {submission.grade.marks !== undefined
                                        ? `${submission.grade.marks}/${submission.grade.maxMarks}`
                                        : submission.grade.grade}
                                </p>
                                {submission.grade.feedback && (
                                    <div className="mt-3">
                                        <p className="text-xs text-[var(--primary-600)] mb-1">
                                            Teacher's Feedback:
                                        </p>
                                        <p className="text-sm text-[var(--text-secondary)]">
                                            {submission.grade.feedback}
                                        </p>
                                    </div>
                                )}
                                {submission.grade.gradedByName && (
                                    <p className="text-xs text-[var(--text-muted)] mt-2">
                                        Graded by {submission.grade.gradedByName}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-4 rounded-[var(--radius-md)] bg-[var(--danger-light)] text-center">
                        <AlertCircle size={32} className="mx-auto mb-2 text-[var(--danger)]" />
                        <p className="text-sm font-semibold text-[var(--danger-dark)]">
                            Not Submitted Yet
                        </p>
                        <p className="text-xs text-[var(--danger-dark)] mt-1">
                            Please remind your child to submit this homework
                        </p>
                    </div>
                )}
            </div>
        </Modal>
    )
}