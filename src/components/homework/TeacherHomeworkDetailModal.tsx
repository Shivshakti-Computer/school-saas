// FILE: src/components/homework/TeacherHomeworkDetailModal.tsx
// ✅ Teacher homework detail & grading
// Same as admin HomeworkDetailModal but teacher-focused

'use client'

import { useState } from 'react'
import { Button, Alert } from '@/components/ui'
import {
    Download, ExternalLink, GraduationCap,
    CheckCircle2, Clock, AlertCircle, X,
} from 'lucide-react'
import { Portal } from '@/components/ui/Portal'
import { Modal, Input } from '@/components/ui'
import type { HomeworkDetail, HomeworkSubmission } from '@/types/homework'

interface TeacherHomeworkDetailModalProps {
    homework: HomeworkDetail
    onClose: () => void
    onGraded: () => void
}

type SubmissionStatus = HomeworkSubmission['status']

const STATUS_CONFIG: Record<
    SubmissionStatus,
    { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
    pending: {
        label: 'Pending',
        color: 'var(--text-muted)',
        bg: 'var(--bg-muted)',
        icon: <Clock size={12} />,
    },
    submitted: {
        label: 'Submitted',
        color: 'var(--info-dark)',
        bg: 'var(--info-light)',
        icon: <CheckCircle2 size={12} />,
    },
    late: {
        label: 'Late',
        color: 'var(--warning-dark)',
        bg: 'var(--warning-light)',
        icon: <AlertCircle size={12} />,
    },
    graded: {
        label: 'Graded',
        color: 'var(--success-dark)',
        bg: 'var(--success-light)',
        icon: <GraduationCap size={12} />,
    },
}

export function TeacherHomeworkDetailModal({
    homework: initialHomework,
    onClose,
    onGraded,
}: TeacherHomeworkDetailModalProps) {
    const [homework, setHomework] =
        useState<HomeworkDetail>(initialHomework)
    const [gradingSubmission, setGradingSubmission] =
        useState<HomeworkSubmission | null>(null)
    const [activeTab, setActiveTab] = useState<
        'all' | 'pending' | 'submitted' | 'graded'
    >('all')

    const refreshHomework = async () => {
        try {
            const res = await fetch(`/api/homework/${homework._id}`, {
                cache: 'no-store',
            })
            const data = await res.json()
            if (res.ok) setHomework(data.homework)
        } catch (err) {
            console.error('Failed to refresh:', err)
        }
    }

    const filteredSubmissions = homework.submissions.filter((s) => {
        if (activeTab === 'all') return true
        if (activeTab === 'pending') return s.status === 'pending'
        if (activeTab === 'submitted')
            return s.status === 'submitted' || s.status === 'late'
        if (activeTab === 'graded') return s.status === 'graded'
        return true
    })

    const formatDate = (date: string) =>
        new Date(date).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        })

    return (
        <div className="space-y-4 max-h-[80vh] overflow-y-auto">
            {/* ── Homework Info ── */}
            <div
                className="p-4 rounded-[var(--radius-lg)]"
                style={{
                    background:
                        'linear-gradient(135deg, var(--primary-50) 0%, var(--bg-muted) 100%)',
                    border: '1px solid var(--primary-100)',
                }}
            >
                <h3
                    className="text-base font-bold mb-1"
                    style={{ color: 'var(--text-primary)' }}
                >
                    {homework.title}
                </h3>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                            backgroundColor: 'var(--primary-100)',
                            color: 'var(--primary-700)',
                        }}
                    >
                        {homework.subject}
                    </span>
                    <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                            backgroundColor: 'var(--bg-card)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border)',
                        }}
                    >
                        Class {homework.class}
                        {homework.section ? `-${homework.section}` : ''}
                    </span>
                </div>
                <p
                    className="text-xs"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    {homework.description}
                </p>
                <div
                    className="flex gap-4 mt-2 text-xs"
                    style={{ color: 'var(--text-muted)' }}
                >
                    <span>
                        Assigned:{' '}
                        {new Date(homework.assignedDate).toLocaleDateString(
                            'en-IN'
                        )}
                    </span>
                    <span>
                        Due:{' '}
                        {new Date(homework.dueDate).toLocaleDateString('en-IN')}
                    </span>
                    <span>
                        Late:{' '}
                        {homework.allowLateSubmission ? 'Allowed' : 'Not allowed'}
                    </span>
                </div>
            </div>

            {/* ── Teacher attachments ── */}
            {homework.attachments.length > 0 && (
                <div>
                    <p
                        className="text-xs font-semibold mb-2"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        Attached Files
                    </p>
                    <div className="space-y-1.5">
                        {homework.attachments.map((file, i) => (
                            <a
                                key={i}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 rounded-[var(--radius-sm)] transition-colors"
                                style={{
                                    backgroundColor: 'var(--bg-subtle)',
                                    border: '1px solid var(--border)',
                                }}
                            >
                                <Download
                                    size={13}
                                    style={{ color: 'var(--primary-500)' }}
                                />
                                <span
                                    className="flex-1 text-sm truncate"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    {file.name}
                                </span>
                                <ExternalLink
                                    size={11}
                                    style={{ color: 'var(--text-muted)' }}
                                />
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Stats ── */}
            <div className="grid grid-cols-4 gap-2">
                {[
                    {
                        label: 'Total',
                        value: homework.totalStudents,
                        color: 'var(--text-primary)',
                        bg: 'var(--bg-muted)',
                    },
                    {
                        label: 'Submitted',
                        value: homework.submittedCount,
                        color: 'var(--success-dark)',
                        bg: 'var(--success-light)',
                    },
                    {
                        label: 'Pending',
                        value: homework.pendingCount,
                        color: 'var(--warning-dark)',
                        bg: 'var(--warning-light)',
                    },
                    {
                        label: 'Graded',
                        value: homework.gradedCount,
                        color: 'var(--info-dark)',
                        bg: 'var(--info-light)',
                    },
                ].map((s) => (
                    <div
                        key={s.label}
                        className="p-3 rounded-[var(--radius-md)] text-center"
                        style={{ backgroundColor: s.bg }}
                    >
                        <p
                            className="text-lg font-bold tabular-nums"
                            style={{ color: s.color }}
                        >
                            {s.value}
                        </p>
                        <p
                            className="text-xs font-medium"
                            style={{ color: s.color, opacity: 0.8 }}
                        >
                            {s.label}
                        </p>
                    </div>
                ))}
            </div>

            {/* ── Submission Tabs ── */}
            <div>
                <div
                    className="flex gap-1 p-1 rounded-[var(--radius-md)] mb-3"
                    style={{ backgroundColor: 'var(--bg-muted)' }}
                >
                    {(
                        [
                            { key: 'all', label: `All (${homework.submissions.length})` },
                            {
                                key: 'pending',
                                label: `Pending (${homework.pendingCount})`,
                            },
                            {
                                key: 'submitted',
                                label: `Submitted (${homework.submittedCount})`,
                            },
                            {
                                key: 'graded',
                                label: `Graded (${homework.gradedCount})`,
                            },
                        ] as const
                    ).map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className="flex-1 py-1.5 px-2 rounded-[var(--radius-sm)] text-xs font-semibold transition-all"
                            style={
                                activeTab === tab.key
                                    ? {
                                        backgroundColor: 'var(--bg-card)',
                                        color: 'var(--primary-600)',
                                        boxShadow: 'var(--shadow-xs)',
                                    }
                                    : { color: 'var(--text-muted)' }
                            }
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Submission rows */}
                {filteredSubmissions.length === 0 ? (
                    <div
                        className="text-center py-8 rounded-[var(--radius-md)]"
                        style={{ backgroundColor: 'var(--bg-muted)' }}
                    >
                        <p
                            className="text-sm"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            No submissions in this category
                        </p>
                    </div>
                ) : (
                    <div
                        className="rounded-[var(--radius-md)] overflow-hidden"
                        style={{ border: '1px solid var(--border)' }}
                    >
                        {filteredSubmissions.map((submission, idx) => {
                            const conf = STATUS_CONFIG[submission.status]
                            const canGrade =
                                submission.status === 'submitted' ||
                                submission.status === 'late' ||
                                submission.status === 'graded'

                            return (
                                <div
                                    key={submission.studentId}
                                    className="flex items-center gap-3 px-4 py-3 transition-colors"
                                    style={{
                                        borderBottom:
                                            idx < filteredSubmissions.length - 1
                                                ? '1px solid var(--border)'
                                                : 'none',
                                        backgroundColor:
                                            submission.status === 'pending'
                                                ? 'transparent'
                                                : `${conf.bg}33`,
                                    }}
                                >
                                    {/* Student info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p
                                                className="text-sm font-medium truncate"
                                                style={{ color: 'var(--text-primary)' }}
                                            >
                                                {submission.studentName}
                                            </p>
                                            {submission.rollNumber && (
                                                <span
                                                    className="text-xs font-mono"
                                                    style={{ color: 'var(--text-muted)' }}
                                                >
                                                    #{submission.rollNumber}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                            {/* Status badge */}
                                            <span
                                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[0.625rem] font-semibold"
                                                style={{
                                                    backgroundColor: conf.bg,
                                                    color: conf.color,
                                                }}
                                            >
                                                {conf.icon}
                                                {conf.label}
                                            </span>

                                            {/* Submitted time */}
                                            {submission.submittedAt && (
                                                <span
                                                    className="text-xs"
                                                    style={{ color: 'var(--text-muted)' }}
                                                >
                                                    {formatDate(submission.submittedAt)}
                                                </span>
                                            )}

                                            {/* Attached files */}
                                            {submission.attachments.length > 0 && (
                                                <span
                                                    className="text-xs"
                                                    style={{ color: 'var(--primary-500)' }}
                                                >
                                                    📎 {submission.attachments.length} file
                                                    {submission.attachments.length > 1 ? 's' : ''}
                                                </span>
                                            )}

                                            {/* Grade */}
                                            {submission.grade && (
                                                <span
                                                    className="text-xs font-semibold"
                                                    style={{ color: 'var(--success)' }}
                                                >
                                                    {submission.grade.marks !== undefined
                                                        ? `${submission.grade.marks}/${submission.grade.maxMarks}`
                                                        : submission.grade.grade}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Grade button */}
                                    {canGrade && (
                                        <Button
                                            size="sm"
                                            variant={
                                                submission.status === 'graded'
                                                    ? 'ghost'
                                                    : 'primary'
                                            }
                                            onClick={() => setGradingSubmission(submission)}
                                        >
                                            <GraduationCap size={12} />
                                            {submission.status === 'graded' ? 'View' : 'Grade'}
                                        </Button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* ── Grading Modal ── */}
            {gradingSubmission && (
                <Portal>
                    <GradingModal
                        homework={homework}
                        submission={gradingSubmission}
                        onClose={() => setGradingSubmission(null)}
                        onSuccess={async () => {
                            setGradingSubmission(null)
                            await refreshHomework()
                            onGraded()
                        }}
                    />
                </Portal>
            )}
        </div>
    )
}

// ── Grading Modal ──
function GradingModal({
    homework,
    submission,
    onClose,
    onSuccess,
}: {
    homework: HomeworkDetail
    submission: HomeworkSubmission
    onClose: () => void
    onSuccess: () => void
}) {
    const [marks, setMarks] = useState(
        submission.grade?.marks?.toString() || ''
    )
    const [maxMarks, setMaxMarks] = useState(
        submission.grade?.maxMarks?.toString() || '10'
    )
    const [grade, setGrade] = useState(submission.grade?.grade || '')
    const [feedback, setFeedback] = useState(
        submission.grade?.feedback || ''
    )
    const [grading, setGrading] = useState(false)
    const [error, setError] = useState('')

    const isAlreadyGraded = submission.status === 'graded'

    const handleGrade = async () => {
        if (!marks && !grade) {
            setError('Please enter marks or grade')
            return
        }
        if (marks && !maxMarks) {
            setError('Please enter max marks')
            return
        }
        if (
            marks &&
            maxMarks &&
            parseFloat(marks) > parseFloat(maxMarks)
        ) {
            setError('Marks cannot exceed max marks')
            return
        }

        setGrading(true)
        try {
            const res = await fetch(
                `/api/homework/${homework._id}/grade`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        studentId: submission.studentId,
                        marks: marks ? parseFloat(marks) : undefined,
                        maxMarks: maxMarks ? parseFloat(maxMarks) : undefined,
                        grade: grade || undefined,
                        feedback: feedback || undefined,
                    }),
                }
            )
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            onSuccess()
        } catch (err: any) {
            setError(err.message)
        }
        setGrading(false)
    }

    return (
        <Modal
            open={true}
            onClose={onClose}
            title={isAlreadyGraded ? 'View Grade' : 'Grade Submission'}
            size="md"
        >
            <div className="space-y-4">
                {/* Student Info */}
                <div
                    className="p-3 rounded-[var(--radius-md)]"
                    style={{ backgroundColor: 'var(--bg-muted)' }}
                >
                    <p
                        className="text-sm font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {submission.studentName}
                    </p>
                    <p
                        className="text-xs mt-0.5"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        Roll No: {submission.rollNumber || 'N/A'} •{' '}
                        {submission.status === 'late' ? '⚠️ Late submission' : 'On time'}
                    </p>
                </div>

                {/* Submitted files */}
                {submission.attachments.length > 0 && (
                    <div>
                        <p
                            className="text-xs font-semibold mb-1.5"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            Submitted Files
                        </p>
                        <div className="space-y-1.5">
                            {submission.attachments.map((file, i) => (
                                <a
                                    key={i}
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-2 rounded-[var(--radius-sm)] transition-colors"
                                    style={{
                                        backgroundColor: 'var(--bg-subtle)',
                                        border: '1px solid var(--border)',
                                    }}
                                >
                                    <Download
                                        size={13}
                                        style={{ color: 'var(--primary-500)' }}
                                    />
                                    <span
                                        className="flex-1 text-sm truncate"
                                        style={{ color: 'var(--text-primary)' }}
                                    >
                                        {file.name}
                                    </span>
                                    <ExternalLink
                                        size={11}
                                        style={{ color: 'var(--text-muted)' }}
                                    />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Student remarks */}
                {submission.remarks && (
                    <div>
                        <p
                            className="text-xs font-semibold mb-1"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            Student Remarks
                        </p>
                        <p
                            className="text-sm p-2 rounded-[var(--radius-sm)]"
                            style={{
                                backgroundColor: 'var(--bg-muted)',
                                color: 'var(--text-secondary)',
                            }}
                        >
                            {submission.remarks}
                        </p>
                    </div>
                )}

                <div
                    className="border-t"
                    style={{ borderColor: 'var(--border)' }}
                />

                {/* Grade form or view */}
                {!isAlreadyGraded ? (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label="Marks Obtained"
                                type="number"
                                placeholder="e.g., 8"
                                value={marks}
                                onChange={(e) => setMarks(e.target.value)}
                                min="0"
                                step="0.5"
                            />
                            <Input
                                label="Max Marks"
                                type="number"
                                placeholder="e.g., 10"
                                value={maxMarks}
                                onChange={(e) => setMaxMarks(e.target.value)}
                                min="0"
                            />
                        </div>

                        <Input
                            label="Grade (Optional)"
                            placeholder="e.g., A+, Excellent"
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
                            maxLength={10}
                        />

                        <div>
                            <label
                                className="text-xs font-semibold block mb-1"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                Feedback (Optional)
                            </label>
                            <textarea
                                className="input-clean resize-none"
                                rows={3}
                                placeholder="Your feedback for the student..."
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                maxLength={1000}
                            />
                        </div>

                        {error && <Alert type="error" message={error} />}

                        <div className="flex gap-3 justify-end">
                            <Button variant="ghost" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button onClick={handleGrade} loading={grading}>
                                Submit Grade
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="space-y-3">
                        <div
                            className="p-3 rounded-[var(--radius-md)]"
                            style={{ backgroundColor: 'var(--success-light)' }}
                        >
                            <p
                                className="text-xs font-semibold"
                                style={{ color: 'var(--success-dark)' }}
                            >
                                Grade
                            </p>
                            <p
                                className="text-2xl font-bold"
                                style={{ color: 'var(--success-dark)' }}
                            >
                                {submission.grade?.marks !== undefined
                                    ? `${submission.grade.marks}/${submission.grade.maxMarks}`
                                    : submission.grade?.grade}
                            </p>
                        </div>

                        {submission.grade?.feedback && (
                            <div>
                                <p
                                    className="text-xs font-semibold mb-1"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    Your Feedback
                                </p>
                                <p
                                    className="text-sm p-2 rounded-[var(--radius-sm)]"
                                    style={{
                                        backgroundColor: 'var(--bg-muted)',
                                        color: 'var(--text-secondary)',
                                    }}
                                >
                                    {submission.grade.feedback}
                                </p>
                            </div>
                        )}

                        {submission.grade?.gradedAt && (
                            <p
                                className="text-xs"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                Graded on{' '}
                                {new Date(
                                    submission.grade.gradedAt
                                ).toLocaleDateString('en-IN')}
                            </p>
                        )}

                        <div className="flex justify-end">
                            <Button variant="ghost" onClick={onClose}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    )
}