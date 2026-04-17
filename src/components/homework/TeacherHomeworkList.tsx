// FILE: src/components/homework/TeacherHomeworkList.tsx
// ✅ Teacher homework list — same visual as admin
// Shows submission stats, grade actions

'use client'

import { Badge, Button } from '@/components/ui'
import {
    BookOpen, Calendar, Clock, Eye,
    Edit, Trash2, CheckCircle2, AlertCircle,
} from 'lucide-react'
import type { HomeworkListItem } from '@/types/homework'

interface TeacherHomeworkListProps {
    homework: HomeworkListItem[]
    onView?: (hw: HomeworkListItem) => void
    onEdit?: (hw: HomeworkListItem) => void
    onDelete?: (id: string) => void
    isLoading?: boolean
}

export function TeacherHomeworkList({
    homework,
    onView,
    onEdit,
    onDelete,
    isLoading = false,
}: TeacherHomeworkListProps) {
    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="skeleton h-32 rounded-[var(--radius-lg)]"
                    />
                ))}
            </div>
        )
    }

    if (homework.length === 0) {
        return (
            <div
                className="portal-card rounded-[var(--radius-lg)] p-10 text-center"
            >
                <div
                    className="w-14 h-14 rounded-[var(--radius-xl)] flex items-center justify-center mx-auto mb-4"
                    style={{
                        backgroundColor: 'var(--primary-50)',
                        color: 'var(--primary-400)',
                    }}
                >
                    <BookOpen size={24} />
                </div>
                <p
                    className="text-sm font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                >
                    No Homework Found
                </p>
                <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--text-muted)' }}
                >
                    You haven't assigned any homework yet, or no results match
                    your filters.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {homework.map((hw) => (
                <HomeworkCard
                    key={hw._id}
                    homework={hw}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </div>
    )
}

function HomeworkCard({
    homework,
    onView,
    onEdit,
    onDelete,
}: {
    homework: HomeworkListItem
    onView?: (hw: HomeworkListItem) => void
    onEdit?: (hw: HomeworkListItem) => void
    onDelete?: (id: string) => void
}) {
    const dueDate = new Date(homework.dueDate)
    const now = new Date()
    const diffMs = dueDate.getTime() - now.getTime()
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    const isOverdue = daysRemaining < 0
    const isDueSoon = daysRemaining >= 0 && daysRemaining <= 2

    const completionPct =
        homework.totalStudents > 0
            ? Math.round(
                (homework.submittedCount / homework.totalStudents) * 100
            )
            : 0

    return (
        <div
            className="portal-card rounded-[var(--radius-lg)] p-4 cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
            onClick={() => onView?.(homework)}
        >
            <div className="flex items-start justify-between gap-3">
                {/* ── Left ── */}
                <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                        <span
                            className="px-2 py-0.5 rounded-[var(--radius-full)] text-xs font-semibold"
                            style={{
                                backgroundColor: 'var(--primary-50)',
                                color: 'var(--primary-700)',
                                border: '1px solid var(--primary-200)',
                            }}
                        >
                            {homework.subject}
                        </span>
                        <span
                            className="px-2 py-0.5 rounded-[var(--radius-full)] text-xs font-semibold"
                            style={{
                                backgroundColor: 'var(--bg-muted)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border)',
                            }}
                        >
                            Class {homework.class}
                            {homework.section ? `-${homework.section}` : ''}
                        </span>
                        {isOverdue && (
                            <span
                                className="px-2 py-0.5 rounded-[var(--radius-full)] text-xs font-semibold"
                                style={{
                                    backgroundColor: 'var(--danger-light)',
                                    color: 'var(--danger-dark)',
                                }}
                            >
                                Overdue
                            </span>
                        )}
                        {isDueSoon && !isOverdue && (
                            <span
                                className="px-2 py-0.5 rounded-[var(--radius-full)] text-xs font-semibold"
                                style={{
                                    backgroundColor: 'var(--warning-light)',
                                    color: 'var(--warning-dark)',
                                }}
                            >
                                Due Soon
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h3
                        className="text-sm font-bold mb-1 truncate"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {homework.title}
                    </h3>

                    {/* Description */}
                    <p
                        className="text-xs mb-2 line-clamp-2"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {homework.description}
                    </p>

                    {/* Meta */}
                    <div
                        className="flex items-center gap-3 flex-wrap text-xs"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            Due:{' '}
                            {dueDate.toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                            })}
                        </span>
                        {isOverdue ? (
                            <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                                {Math.abs(daysRemaining)} day
                                {Math.abs(daysRemaining) !== 1 ? 's' : ''} overdue
                            </span>
                        ) : (
                            <span className="flex items-center gap-1">
                                <Clock size={11} />
                                {daysRemaining === 0
                                    ? 'Due today'
                                    : `${daysRemaining} day${daysRemaining > 1 ? 's' : ''} left`}
                            </span>
                        )}
                        {homework.attachments.length > 0 && (
                            <span>📎 {homework.attachments.length}</span>
                        )}
                    </div>

                    {/* ── Submission Progress ── */}
                    <div className="mt-3 space-y-1.5">
                        {/* Progress Bar */}
                        <div className="flex items-center gap-2">
                            <div
                                className="flex-1 h-1.5 rounded-full overflow-hidden"
                                style={{ backgroundColor: 'var(--bg-muted)' }}
                            >
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                        width: `${completionPct}%`,
                                        backgroundColor:
                                            completionPct === 100
                                                ? 'var(--success)'
                                                : completionPct > 50
                                                    ? 'var(--primary-500)'
                                                    : 'var(--warning)',
                                    }}
                                />
                            </div>
                            <span
                                className="text-xs font-semibold tabular-nums"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                {completionPct}%
                            </span>
                        </div>

                        {/* Counts */}
                        <div className="flex items-center gap-3 text-xs">
                            <span style={{ color: 'var(--success)' }}>
                                <CheckCircle2 size={11} className="inline mr-0.5" />
                                {homework.submittedCount} submitted
                            </span>
                            <span style={{ color: 'var(--warning)' }}>
                                ⏳ {homework.pendingCount} pending
                            </span>
                            {homework.gradedCount > 0 && (
                                <span style={{ color: 'var(--info)' }}>
                                    🏅 {homework.gradedCount} graded
                                </span>
                            )}
                            {homework.lateCount > 0 && (
                                <span style={{ color: 'var(--danger)' }}>
                                    <AlertCircle size={11} className="inline mr-0.5" />
                                    {homework.lateCount} late
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Right Actions ── */}
                <div
                    className="flex flex-col gap-1.5 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onView?.(homework)}
                        title="View & Grade"
                    >
                        <Eye size={13} />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit?.(homework)}
                        title="Edit"
                    >
                        <Edit size={13} />
                    </Button>
                    <button
                        onClick={() => {
                            if (confirm('Delete this homework?')) {
                                onDelete?.(homework._id)
                            }
                        }}
                        className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center transition-colors"
                        style={{ color: 'var(--danger)' }}
                        title="Delete"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>
        </div>
    )
}