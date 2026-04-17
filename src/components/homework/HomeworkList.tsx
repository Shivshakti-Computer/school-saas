// FILE: src/components/homework/HomeworkList.tsx
// ═══════════════════════════════════════════════════════════
// Homework List with Cards
// ═══════════════════════════════════════════════════════════

'use client'

import { Card, Badge, Button, EmptyState } from '@/components/ui'
import { BookOpen, Calendar, Clock, FileText, Eye, Edit, Trash2 } from 'lucide-react'
import type { HomeworkListItem } from '@/types/homework'

interface HomeworkListProps {
    homework: HomeworkListItem[]
    onView?: (hw: HomeworkListItem) => void
    onEdit?: (hw: HomeworkListItem) => void
    onDelete?: (id: string) => void
    showActions?: boolean
    isLoading?: boolean
}

export function HomeworkList({
    homework,
    onView,
    onEdit,
    onDelete,
    showActions = false,
    isLoading = false,
}: HomeworkListProps) {
    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton h-32 rounded-[var(--radius-lg)]" />
                ))}
            </div>
        )
    }

    if (homework.length === 0) {
        return (
            <EmptyState
                icon={<BookOpen size={24} />}
                title="No homework found"
                description="No homework matches your current filters"
            />
        )
    }

    return (
        <div className="space-y-3">
            {homework.map(hw => (
                <HomeworkCard
                    key={hw._id}
                    homework={hw}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    showActions={showActions}
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
    showActions,
}: {
    homework: HomeworkListItem
    onView?: (hw: HomeworkListItem) => void
    onEdit?: (hw: HomeworkListItem) => void
    onDelete?: (id: string) => void
    showActions: boolean
}) {
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
    }

    const getDaysRemaining = () => {
        const now = new Date()
        const due = new Date(homework.dueDate)
        const diff = due.getTime() - now.getTime()
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
        return days
    }

    const daysRemaining = getDaysRemaining()
    const isOverdue = daysRemaining < 0
    const isDueSoon = daysRemaining >= 0 && daysRemaining <= 2

    return (
        <Card
            className="transition-all duration-200 hover:shadow-[var(--shadow-md)] cursor-pointer"
            onClick={() => onView?.(homework)}
        >
            <div className="flex items-start justify-between gap-4">
                {/* Left: Content */}
                <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge variant="primary">{homework.subject}</Badge>
                        <Badge variant="default">
                            Class {homework.class}
                            {homework.section && `-${homework.section}`}
                        </Badge>
                        {isOverdue && <Badge variant="danger">Overdue</Badge>}
                        {isDueSoon && !isOverdue && <Badge variant="warning">Due Soon</Badge>}
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold font-display text-[var(--text-primary)] mb-1 line-clamp-1">
                        {homework.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-2">
                        {homework.description}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 flex-wrap text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            Due: {formatDate(homework.dueDate)}
                        </span>

                        {isOverdue ? (
                            <span className="text-[var(--danger)] font-semibold">
                                {Math.abs(daysRemaining)} days overdue
                            </span>
                        ) : (
                            <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {daysRemaining === 0
                                    ? 'Due today'
                                    : `${daysRemaining} day${daysRemaining > 1 ? 's' : ''} left`}
                            </span>
                        )}

                        {homework.attachments.length > 0 && (
                            <Badge variant="default" className="text-[10px] px-1.5 py-0">
                                📎 {homework.attachments.length}
                            </Badge>
                        )}
                    </div>

                    {/* Submission Stats */}
                    {showActions && (
                        <div className="flex items-center gap-3 mt-3 text-xs">
                            <span className="text-[var(--success)]">
                                ✓ {homework.submittedCount} submitted
                            </span>
                            <span className="text-[var(--warning)]">
                                ⏳ {homework.pendingCount} pending
                            </span>
                            {homework.lateCount > 0 && (
                                <span className="text-[var(--danger)]">
                                    ⚠️ {homework.lateCount} late
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: Actions */}
                {showActions && onEdit && onDelete && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={e => {
                                e.stopPropagation()
                                onView?.(homework)
                            }}
                            title="View Submissions"
                        >
                            <Eye size={14} />
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={e => {
                                e.stopPropagation()
                                onEdit(homework)
                            }}
                        >
                            <Edit size={14} />
                        </Button>
                        <Button
                            size="sm"
                            variant="danger"
                            onClick={e => {
                                e.stopPropagation()
                                if (confirm('Delete this homework?')) {
                                    onDelete(homework._id)
                                }
                            }}
                        >
                            <Trash2 size={14} />
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    )
}