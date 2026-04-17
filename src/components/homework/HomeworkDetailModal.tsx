// FILE: src/components/homework/HomeworkDetailModal.tsx

'use client'

import { useState } from 'react'
import { Button, Badge, Alert, Table, Tr, Td, Input, Modal } from '@/components/ui'
import { Download, ExternalLink, CheckCircle2, Clock, AlertCircle, GraduationCap } from 'lucide-react'
import { Portal } from '@/components/ui/Portal'
import { HomeworkDetail, HomeworkSubmission } from '@/types/homework'

interface HomeworkDetailModalProps {
    homework: HomeworkDetail
    onClose: () => void
    onGraded: () => void
}

export function HomeworkDetailModal({
    homework: initialHomework,  // ✅ Rename to initial
    onClose,
    onGraded,
}: HomeworkDetailModalProps) {
    const [homework, setHomework] = useState<HomeworkDetail>(initialHomework)  // ✅ State
    const [gradingSubmission, setGradingSubmission] = useState<HomeworkSubmission | null>(null)
    const [refreshing, setRefreshing] = useState(false)

    // ✅ Refresh homework data
    const refreshHomework = async () => {
        try {
            setRefreshing(true)
            const res = await fetch(`/api/homework/${homework._id}`)
            const data = await res.json()
            if (res.ok) {
                setHomework(data.homework)
            }
        } catch (err) {
            console.error('Failed to refresh:', err)
        } finally {
            setRefreshing(false)
        }
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const getStatusBadge = (submission: HomeworkSubmission) => {
        if (submission.status === 'graded') {
            return <Badge variant="success">Graded</Badge>
        }
        if (submission.status === 'late') {
            return <Badge variant="warning">Late</Badge>
        }
        if (submission.status === 'submitted') {
            return <Badge variant="info">Submitted</Badge>
        }
        return <Badge variant="default">Pending</Badge>
    }

    return (
        <div className="space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Homework Info */}
            <div className="space-y-3">
                <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">
                        {homework.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant="primary">{homework.subject}</Badge>
                        <Badge variant="default">
                            Class {homework.class}
                            {homework.section && `-${homework.section}`}
                        </Badge>
                    </div>
                </div>

                <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-muted)]">
                    <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                        {homework.description}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
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
                    <div>
                        <span className="text-[var(--text-muted)]">Created by:</span>{' '}
                        <span className="text-[var(--text-primary)]">
                            {homework.createdByName}
                        </span>
                    </div>
                    <div>
                        <span className="text-[var(--text-muted)]">Late submission:</span>{' '}
                        <span className="text-[var(--text-primary)]">
                            {homework.allowLateSubmission ? 'Allowed' : 'Not allowed'}
                        </span>
                    </div>
                </div>

                {/* Attachments */}
                {homework.attachments.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-[var(--text-primary)]">
                            Attachments:
                        </p>
                        {homework.attachments.map((file, i) => (
                            <a
                                key={i}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-muted)] transition-colors text-sm"
                            >
                                <Download size={14} className="text-[var(--primary-500)]" />
                                <span className="flex-1 text-[var(--text-primary)] truncate">
                                    {file.name}
                                </span>
                                <ExternalLink size={12} className="text-[var(--text-muted)]" />
                            </a>
                        ))}
                    </div>
                )}
            </div>

            <div className="divider" />

            {/* Submission Stats — ✅ Now showing updated homework data */}
            <div className="grid grid-cols-4 gap-3">
                <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)]">
                    <p className="text-xs text-[var(--text-muted)]">Total</p>
                    <p className="text-lg font-bold text-[var(--text-primary)]">
                        {homework.totalStudents}
                    </p>
                </div>
                <div className="p-3 rounded-[var(--radius-md)] bg-[var(--success-light)]">
                    <p className="text-xs text-[var(--success-dark)]">Submitted</p>
                    <p className="text-lg font-bold text-[var(--success-dark)]">
                        {homework.submittedCount}
                    </p>
                </div>
                <div className="p-3 rounded-[var(--radius-md)] bg-[var(--warning-light)]">
                    <p className="text-xs text-[var(--warning-dark)]">Pending</p>
                    <p className="text-lg font-bold text-[var(--warning-dark)]">
                        {homework.pendingCount}
                    </p>
                </div>
                <div className="p-3 rounded-[var(--radius-md)] bg-[var(--info-light)]">
                    <p className="text-xs text-[var(--info-dark)]">Graded</p>
                    <p className="text-lg font-bold text-[var(--info-dark)]">
                        {homework.gradedCount}
                    </p>
                </div>
            </div>

            {/* Submissions Table */}
            <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3">
                    Student Submissions
                </h4>

                <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)]">
                    <Table
                        headers={[
                            'Student',
                            'Roll No.',
                            'Status',
                            'Submitted At',
                            'Grade',
                            'Actions',
                        ]}
                    >
                        {homework.submissions.map(submission => (
                            <Tr key={submission.studentId}>
                                <Td>{submission.studentName}</Td>
                                <Td>{submission.rollNumber || '-'}</Td>
                                <Td>{getStatusBadge(submission)}</Td>
                                <Td>
                                    {submission.submittedAt
                                        ? formatDate(submission.submittedAt)
                                        : '-'}
                                </Td>
                                <Td>
                                    {submission.grade ? (
                                        <span className="font-semibold text-[var(--success)]">
                                            {submission.grade.marks !== undefined
                                                ? `${submission.grade.marks}/${submission.grade.maxMarks}`
                                                : submission.grade.grade}
                                        </span>
                                    ) : (
                                        '-'
                                    )}
                                </Td>
                                <Td>
                                    {submission.status === 'submitted' ||
                                        submission.status === 'late' ? (
                                        <Button
                                            size="sm"
                                            variant="primary"
                                            onClick={() => setGradingSubmission(submission)}
                                        >
                                            <GraduationCap size={14} />
                                            Grade
                                        </Button>
                                    ) : submission.status === 'graded' ? (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setGradingSubmission(submission)}
                                        >
                                            View
                                        </Button>
                                    ) : (
                                        <span className="text-xs text-[var(--text-muted)]">
                                            Not submitted
                                        </span>
                                    )}
                                </Td>
                            </Tr>
                        ))}
                    </Table>
                </div>
            </div>

            {/* Grading Modal */}
            {gradingSubmission && (
                <Portal>
                    <GradingModal
                        homework={homework}
                        submission={gradingSubmission}
                        onClose={() => setGradingSubmission(null)}
                        onSuccess={async () => {
                            setGradingSubmission(null)
                            await refreshHomework()  // ✅ Refresh homework data
                            onGraded()                // ✅ Then call parent's callback
                        }}
                    />
                </Portal>
            )}
        </div>
    )
}

// ── Grading Modal Component (same as before) ──
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
    const [marks, setMarks] = useState(submission.grade?.marks?.toString() || '')
    const [maxMarks, setMaxMarks] = useState(submission.grade?.maxMarks?.toString() || '10')
    const [grade, setGrade] = useState(submission.grade?.grade || '')
    const [feedback, setFeedback] = useState(submission.grade?.feedback || '')
    const [grading, setGrading] = useState(false)
    const [error, setError] = useState('')

    const isGraded = submission.status === 'graded'

    const handleGrade = async () => {
        if (!marks && !grade) {
            setError('Please enter marks or grade')
            return
        }

        if (marks && !maxMarks) {
            setError('Please enter max marks')
            return
        }

        if (marks && maxMarks && parseFloat(marks) > parseFloat(maxMarks)) {
            setError('Marks cannot exceed max marks')
            return
        }

        try {
            setGrading(true)
            const res = await fetch(`/api/homework/${homework._id}/grade`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: submission.studentId,
                    marks: marks ? parseFloat(marks) : undefined,
                    maxMarks: maxMarks ? parseFloat(maxMarks) : undefined,
                    grade: grade || undefined,
                    feedback: feedback || undefined,
                }),
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error)

            onSuccess()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setGrading(false)
        }
    }

    return (
        <Modal
            open={true}
            onClose={onClose}
            title={isGraded ? 'View Grade' : 'Grade Submission'}
            size="md"
        >
            <div className="space-y-4">
                {/* Student Info */}
                <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-muted)]">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {submission.studentName}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                        Roll No: {submission.rollNumber || 'N/A'}
                    </p>
                </div>

                {/* Submitted Files */}
                {submission.attachments.length > 0 && (
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
                                className="flex items-center gap-2 p-2 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-muted)] transition-colors text-sm"
                            >
                                <Download size={14} className="text-[var(--primary-500)]" />
                                <span className="flex-1 text-[var(--text-primary)] truncate">
                                    {file.name}
                                </span>
                                <ExternalLink size={12} className="text-[var(--text-muted)]" />
                            </a>
                        ))}
                    </div>
                )}

                {/* Student Remarks */}
                {submission.remarks && (
                    <div>
                        <p className="text-xs font-semibold text-[var(--text-primary)] mb-1">
                            Student Remarks:
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] p-2 bg-[var(--bg-muted)] rounded-[var(--radius-sm)]">
                            {submission.remarks}
                        </p>
                    </div>
                )}

                {!isGraded && <div className="divider" />}

                {/* Grading Form */}
                {!isGraded ? (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label="Marks Obtained"
                                type="number"
                                placeholder="e.g., 8"
                                value={marks}
                                onChange={e => setMarks(e.target.value)}
                                min="0"
                                step="0.5"
                            />
                            <Input
                                label="Max Marks"
                                type="number"
                                placeholder="e.g., 10"
                                value={maxMarks}
                                onChange={e => setMaxMarks(e.target.value)}
                                min="0"
                            />
                        </div>

                        <Input
                            label="Grade (Optional)"
                            placeholder="e.g., A+, Excellent"
                            value={grade}
                            onChange={e => setGrade(e.target.value)}
                            maxLength={10}
                        />

                        <div>
                            <label className="text-xs font-semibold text-[var(--text-primary)] mb-1 block">
                                Feedback (Optional)
                            </label>
                            <textarea
                                className="input-clean resize-none"
                                rows={3}
                                placeholder="Teacher's feedback..."
                                value={feedback}
                                onChange={e => setFeedback(e.target.value)}
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
                        <div className="p-3 rounded-[var(--radius-md)] bg-[var(--success-light)]">
                            <p className="text-xs text-[var(--success-dark)]">Grade</p>
                            <p className="text-lg font-bold text-[var(--success-dark)]">
                                {submission.grade?.marks !== undefined
                                    ? `${submission.grade.marks}/${submission.grade.maxMarks}`
                                    : submission.grade?.grade}
                            </p>
                        </div>

                        {submission.grade?.feedback && (
                            <div>
                                <p className="text-xs font-semibold text-[var(--text-primary)] mb-1">
                                    Teacher Feedback:
                                </p>
                                <p className="text-sm text-[var(--text-secondary)] p-2 bg-[var(--bg-muted)] rounded-[var(--radius-sm)]">
                                    {submission.grade.feedback}
                                </p>
                            </div>
                        )}

                        {submission.grade?.gradedByName && (
                            <p className="text-xs text-[var(--text-muted)]">
                                Graded by {submission.grade.gradedByName} on{' '}
                                {new Date(submission.grade.gradedAt!).toLocaleDateString('en-IN')}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    )
}