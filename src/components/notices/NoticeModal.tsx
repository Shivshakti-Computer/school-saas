// FILE: src/components/notices/NoticeModal.tsx
'use client'

import { Modal, Badge, Button } from '@/components/ui'
import { Download, Calendar, User, Users, Eye } from 'lucide-react'
import type { NoticeListItem } from '@/types/notice'
import { NoticePriorityBadge } from './NoticePriorityBadge'
import { useEffect } from 'react'

interface NoticeModalProps {
    notice: NoticeListItem
    open: boolean
    onClose: () => void
}

export function NoticeModal({ notice, open, onClose }: NoticeModalProps) {
    // Mark as read when opened
    useEffect(() => {
        if (open && notice._id) {
            fetch(`/api/notices/${notice._id}/mark-read`, {
                method: 'POST',
            }).catch(console.error)
        }
    }, [open, notice._id])

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    return (
        <Modal open={open} onClose={onClose} title="Notice Details" size="lg">
            <div className="space-y-4">
                {/* Header */}
                <div>
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                        <NoticePriorityBadge priority={notice.priority} />
                        <Badge variant="info">
                            {notice.targetRole === 'all' ? 'Everyone' : notice.targetRole}
                        </Badge>
                        {notice.isPinned && (
                            <Badge variant="primary">📌 Pinned</Badge>
                        )}
                    </div>
                    <h2 className="text-xl font-bold font-display text-[var(--text-primary)] mb-2">
                        {notice.title}
                    </h2>
                </div>

                {/* Content */}
                <div className="prose prose-sm max-w-none">
                    <p className="text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                        {notice.content}
                    </p>
                </div>

                {/* Attachments */}
                {notice.attachments.length > 0 && (
                    <div className="border-t border-[var(--border)] pt-4">
                        <h3 className="text-sm font-semibold font-display mb-2">
                            Attachments ({notice.attachments.length})
                        </h3>
                        <div className="space-y-2">
                            {notice.attachments.map((file, idx) => (
                                <a
                                    key={idx}
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-3 rounded-[var(--radius-md)] 
                           bg-[var(--bg-muted)] hover:bg-[var(--bg-subtle)] transition-colors"
                                >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <span className="text-lg">📎</span>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-[var(--text-muted)]">
                                                {(file.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                    </div>
                                    <Download size={16} className="flex-shrink-0 text-[var(--primary-500)]" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Meta Info */}
                <div className="border-t border-[var(--border)] pt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                        <User size={14} />
                        <span>Posted by {notice.createdByName} ({notice.createdByRole})</span>
                    </div>

                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                        <Calendar size={14} />
                        <span>{formatDate(notice.publishedAt || notice.createdAt)}</span>
                    </div>

                    {notice.targetClasses.length > 0 && (
                        <div className="flex items-center gap-2 text-[var(--text-muted)]">
                            <Users size={14} />
                            <span>Classes: {notice.targetClasses.join(', ')}</span>
                        </div>
                    )}

                    {notice.readCount > 0 && (
                        <div className="flex items-center gap-2 text-[var(--text-muted)]">
                            <Eye size={14} />
                            <span>{notice.readCount} people read this notice</span>
                        </div>
                    )}

                    {notice.expiresAt && (
                        <div className="flex items-center gap-2 text-[var(--warning-dark)]">
                            ⏰ Expires: {formatDate(notice.expiresAt)}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end pt-4 border-t border-[var(--border)]">
                    <Button variant="secondary" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </Modal>
    )
}