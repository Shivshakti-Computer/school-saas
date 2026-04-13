// FILE: src/components/notices/NoticeList.tsx
'use client'

import { useState } from 'react'
import { Card, Badge, Button, EmptyState } from '@/components/ui'
import { Bell, Pin, Calendar, Users, Eye } from 'lucide-react'
import type { NoticeListItem } from '@/types/notice'
import { NoticeModal } from './NoticeModal'
import { NoticePriorityBadge } from './NoticePriorityBadge'

interface NoticeListProps {
    notices: NoticeListItem[]
    onEdit?: (notice: NoticeListItem) => void
    onDelete?: (id: string) => void
    showActions?: boolean
    isLoading?: boolean
}

export function NoticeList({
    notices,
    onEdit,
    onDelete,
    showActions = false,
    isLoading = false,
}: NoticeListProps) {
    const [selectedNotice, setSelectedNotice] = useState<NoticeListItem | null>(null)

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton h-32 rounded-[var(--radius-lg)]" />
                ))}
            </div>
        )
    }

    if (notices.length === 0) {
        return (
            <EmptyState
                icon={<Bell size={24} />}
                title="No notices found"
                description="No notices match your current filters"
            />
        )
    }

    // Sort: Pinned first, then by date
    const sortedNotices = [...notices].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        return new Date(b.publishedAt || b.createdAt).getTime() -
            new Date(a.publishedAt || a.createdAt).getTime()
    })

    return (
        <>
            <div className="space-y-3">
                {sortedNotices.map(notice => (
                    <NoticeCard
                        key={notice._id}
                        notice={notice}
                        onView={() => setSelectedNotice(notice)}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        showActions={showActions}
                    />
                ))}
            </div>

            {selectedNotice && (
                <NoticeModal
                    notice={selectedNotice}
                    open={!!selectedNotice}
                    onClose={() => setSelectedNotice(null)}
                />
            )}
        </>
    )
}

// ── Single Notice Card ──
function NoticeCard({
    notice,
    onView,
    onEdit,
    onDelete,
    showActions,
}: {
    notice: NoticeListItem
    onView: () => void
    onEdit?: (notice: NoticeListItem) => void
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

    const roleColor: Record<string, any> = {
        all: 'info',
        student: 'success',
        teacher: 'primary',
        parent: 'warning',
        staff: 'default',
    }

    return (
        <Card
            className="transition-all duration-200 hover:shadow-[var(--shadow-md)] cursor-pointer"
            onClick={onView}
        >
            <div className="flex items-start justify-between gap-4">
                {/* Left: Content */}
                <div className="flex-1 min-w-0">
                    {/* Badges Row */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                        {notice.isPinned && (
                            <Badge variant="primary" className="gap-1">
                                <Pin size={10} className="fill-current" />
                                Pinned
                            </Badge>
                        )}
                        <NoticePriorityBadge priority={notice.priority} />
                        <Badge variant={roleColor[notice.targetRole] || 'default'}>
                            {notice.targetRole === 'all' ? 'Everyone' : notice.targetRole}
                        </Badge>
                        {notice.status === 'draft' && (
                            <Badge variant="default">Draft</Badge>
                        )}
                        {notice.isExpired && (
                            <Badge variant="danger">Expired</Badge>
                        )}
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold font-display text-[var(--text-primary)] mb-1 line-clamp-1">
                        {notice.title}
                    </h3>

                    {/* Content Preview */}
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-2">
                        {notice.content}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center gap-3 flex-wrap text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(notice.publishedAt || notice.createdAt)}
                        </span>

                        {notice.targetClasses.length > 0 && (
                            <span className="flex items-center gap-1">
                                <Users size={12} />
                                {notice.targetClasses.join(', ')}
                            </span>
                        )}

                        {notice.readCount > 0 && (
                            <span className="flex items-center gap-1">
                                <Eye size={12} />
                                {notice.readCount} reads
                            </span>
                        )}

                        {notice.attachments.length > 0 && (
                            <Badge variant="default" className="text-[10px] px-1.5 py-0">
                                📎 {notice.attachments.length}
                            </Badge>
                        )}
                    </div>

                    {/* Notification Status */}
                    {(notice.smsSent || notice.emailSent || notice.pushSent) && (
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-[var(--success)]">
                            {notice.smsSent && <span>✓ SMS ({notice.notificationCount})</span>}
                            {notice.emailSent && <span>✓ Email</span>}
                            {notice.pushSent && <span>✓ Push</span>}
                        </div>
                    )}
                </div>

                {/* Right: Actions */}
                {showActions && onEdit && onDelete && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                                e.stopPropagation()
                                onEdit(notice)
                            }}
                        >
                            Edit
                        </Button>
                        <Button
                            size="sm"
                            variant="danger"
                            onClick={(e) => {
                                e.stopPropagation()
                                if (confirm('Delete this notice?')) {
                                    onDelete(notice._id)
                                }
                            }}
                        >
                            Delete
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    )
}