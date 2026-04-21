// FILE: src/app/(dashboard)/student/homework/page.tsx
// ═══════════════════════════════════════════════════════════
// Student Homework Portal
// ═══════════════════════════════════════════════════════════

'use client'

import { useState, useEffect } from 'react'
import { PageHeader, Button, Modal, Alert, StatCard, Card, Badge } from '@/components/ui'
import { Portal } from '@/components/ui/Portal'
import { BookOpen, Clock, CheckCircle2, AlertCircle, Upload, Download, ExternalLink } from 'lucide-react'
import type { StudentHomework, StudentHomeworkStats } from '@/types/homework'

export default function StudentHomeworkPage() {
    const [homework, setHomework] = useState<StudentHomework[]>([])
    const [stats, setStats] = useState<StudentHomeworkStats | null>(null)
    const [filter, setFilter] = useState<'pending' | 'submitted' | 'graded'>('pending')
    const [loading, setLoading] = useState(true)
    const [selectedHomework, setSelectedHomework] = useState<StudentHomework | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

    const fetchHomework = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/homework/student?status=${filter}`)
            const data = await res.json()

            if (res.ok) {
                setHomework(data.homework)
                if (data.stats) setStats(data.stats)
            } else {
                throw new Error(data.error)
            }
        } catch (err: any) {
            setAlert({ type: 'error', message: err.message })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchHomework()
    }, [filter])

    const handleSubmit = async (homeworkId: string, files: File[], remarks: string) => {
        try {
            setSubmitting(true)

            // Upload files first
            const uploadedFiles = []
            for (const file of files) {
                const formData = new FormData()
                formData.append('file', file)
                formData.append('folder', 'homework-submissions')  // ✅ Correct folder

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                })

                const uploadData = await uploadRes.json()

                if (!uploadRes.ok) throw new Error(uploadData.error)

                uploadedFiles.push({
                    name: file.name,
                    url: uploadData.url,
                    type: file.type.startsWith('image/') ? 'image' : file.name.endsWith('.pdf') ? 'pdf' : 'other',
                    size: file.size,
                })
            }

            // Submit homework
            const res = await fetch(`/api/homework/${homeworkId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    attachments: uploadedFiles,
                    remarks,
                }),
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error)

            setAlert({ type: 'success', message: data.message })
            setSelectedHomework(null)
            fetchHomework()
        } catch (err: any) {
            setAlert({ type: 'error', message: err.message })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="My Homework"
                subtitle="View pending homework, submit assignments, and check grades"
            />

            {alert && (
                <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
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

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b border-[var(--border)]">
                {(['pending', 'submitted', 'graded'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={[
                            'px-4 py-2 text-sm font-semibold transition-colors border-b-2',
                            filter === tab
                                ? 'text-[var(--primary-600)] border-[var(--primary-500)]'
                                : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-primary)]',
                        ].join(' ')}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

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
                    <p className="text-[var(--text-primary)] font-semibold">
                        No {filter} homework
                    </p>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                        {filter === 'pending' && "You're all caught up! 🎉"}
                    </p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {homework.map(hw => (
                        <StudentHomeworkCard
                            key={hw._id}
                            homework={hw}
                            onView={() => setSelectedHomework(hw)}
                        />
                    ))}
                </div>
            )}

            {/* Submit Modal */}
            {selectedHomework && (
                <Portal>
                    <StudentSubmitModal
                        homework={selectedHomework}
                        onClose={() => setSelectedHomework(null)}
                        onSubmit={handleSubmit}
                        isLoading={submitting}
                    />
                </Portal>
            )}
        </div>
    )
}

// ── Student Homework Card ──
function StudentHomeworkCard({
    homework,
    onView,
}: {
    homework: StudentHomework
    onView: () => void
}) {
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const getDaysRemaining = () => {
        const now = new Date()
        const due = new Date(homework.dueDate)
        const diff = due.getTime() - now.getTime()
        return Math.ceil(diff / (1000 * 60 * 60 * 24))
    }

    const daysRemaining = getDaysRemaining()
    const isOverdue = daysRemaining < 0
    const isDueSoon = daysRemaining >= 0 && daysRemaining <= 2
    const submission = homework.mySubmission

    return (
        <Card className="hover:shadow-[var(--shadow-md)] transition-shadow cursor-pointer" onClick={onView}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge variant="primary">{homework.subject}</Badge>
                        {submission?.status === 'pending' && (
                            <>
                                {isOverdue && <Badge variant="danger">Overdue</Badge>}
                                {isDueSoon && !isOverdue && <Badge variant="warning">Due Soon</Badge>}
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

                {/* Action Button */}
                <div className="flex-shrink-0">
                    {submission?.status === 'pending' && (
                        <Button size="sm" variant="primary">
                            Submit
                        </Button>
                    )}
                    {(submission?.status === 'submitted' || submission?.status === 'late') && (
                        <Button size="sm" variant="ghost">
                            View
                        </Button>
                    )}
                    {submission?.status === 'graded' && (
                        <Button size="sm" variant="secondary">
                            View Grade
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    )
}

// ── Student Submit Modal ──
function StudentSubmitModal({
    homework,
    onClose,
    onSubmit,
    isLoading,
}: {
    homework: StudentHomework
    onClose: () => void
    onSubmit: (homeworkId: string, files: File[], remarks: string) => Promise<void>
    isLoading: boolean
}) {
    const [files, setFiles] = useState<File[]>([])
    const [remarks, setRemarks] = useState('')
    const [error, setError] = useState('')

    const submission = homework.mySubmission

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || [])
        const validFiles = selectedFiles.filter(f => f.size <= 10 * 1024 * 1024)

        if (validFiles.length !== selectedFiles.length) {
            setError('Some files exceed 10MB limit and were ignored')
        }

        setFiles(prev => [...prev, ...validFiles])
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = () => {
        if (submission?.status === 'pending' && files.length === 0) {
            setError('Please upload at least one file')
            return
        }

        onSubmit(homework._id, files, remarks)
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString('en-IN')
    }

    return (
        <Modal open={true} onClose={onClose} title={homework.title} size="md">
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Homework Info */}
                <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-muted)]">
                    <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                        {homework.description}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <span className="text-[var(--text-muted)]">Subject:</span>{' '}
                        <span className="text-[var(--text-primary)] font-semibold">
                            {homework.subject}
                        </span>
                    </div>
                    <div>
                        <span className="text-[var(--text-muted)]">Due:</span>{' '}
                        <span className="text-[var(--text-primary)] font-semibold">
                            {formatDate(homework.dueDate)}
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

                {/* If already submitted/graded - show submission */}
                {submission && submission.status !== 'pending' ? (
                    <div className="space-y-3">
                        <div className="divider" />

                        <div className="p-3 rounded-[var(--radius-md)] bg-[var(--success-light)]">
                            <p className="text-xs text-[var(--success-dark)]">Status</p>
                            <p className="text-sm font-bold text-[var(--success-dark)]">
                                {submission.status === 'graded'
                                    ? 'Graded'
                                    : submission.status === 'late'
                                        ? 'Submitted Late'
                                        : 'Submitted'}
                            </p>
                            {submission.submittedAt && (
                                <p className="text-xs text-[var(--success-dark)] mt-1">
                                    on {formatDate(submission.submittedAt)}
                                </p>
                            )}
                        </div>

                        {submission.attachments.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-[var(--text-primary)]">
                                    Your Submitted Files:
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

                        {submission.grade && (
                            <div className="p-4 rounded-[var(--radius-md)] bg-[var(--primary-50)] border border-[var(--primary-200)]">
                                <p className="text-xs text-[var(--primary-600)] mb-2">Your Grade</p>
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
                            </div>
                        )}
                    </div>
                ) : (
                    /* Submission Form */
                    <>
                        <div className="divider" />

                        {/* File Upload */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-[var(--text-primary)]">
                                Upload Files <span className="text-[var(--danger)]">*</span>
                            </label>

                            <label className="btn-secondary cursor-pointer w-full justify-center">
                                <Upload size={14} />
                                Choose Files
                                <input
                                    type="file"
                                    multiple
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>

                            <p className="text-xs text-[var(--text-muted)]">
                                Max 10MB per file. Accepted: PDF, JPG, PNG, DOCX
                            </p>

                            {files.length > 0 && (
                                <div className="space-y-2 mt-3">
                                    {files.map((file, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between p-2 bg-[var(--bg-muted)] rounded-[var(--radius-sm)]"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm truncate">{file.name}</p>
                                                <p className="text-xs text-[var(--text-muted)]">
                                                    {(file.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(i)}
                                                className="text-[var(--danger)] hover:bg-[var(--danger-light)] p-1 rounded"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Remarks */}
                        <div>
                            <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                                Remarks (Optional)
                            </label>
                            <textarea
                                className="input-clean resize-none"
                                rows={3}
                                placeholder="Any notes for your teacher..."
                                value={remarks}
                                onChange={e => setRemarks(e.target.value)}
                                maxLength={500}
                            />
                        </div>

                        {error && <Alert type="error" message={error} />}

                        <div className="flex gap-3 justify-end">
                            <Button variant="ghost" onClick={onClose} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button onClick={handleSubmit} loading={isLoading}>
                                Submit Homework
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    )
}