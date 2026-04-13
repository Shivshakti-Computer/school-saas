// FILE: src/components/notices/NoticeStats.tsx
'use client'

import { StatCard } from '@/components/ui'
import { Bell, FileText, Pin, AlertTriangle, Archive, Eye } from 'lucide-react'
import type { NoticeStats } from '@/types/notice'

interface NoticeStatsProps {
    stats: NoticeStats
    isLoading?: boolean
}

export function NoticeStatsComponent({ stats, isLoading }: NoticeStatsProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="skeleton h-24 rounded-[var(--radius-lg)]" />
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard
                label="Total Notices"
                value={stats.total}
                icon={<Bell size={18} />}
                color="primary"
            />

            <StatCard
                label="Published"
                value={stats.published}
                icon={<FileText size={18} />}
                color="success"
            />

            <StatCard
                label="Drafts"
                value={stats.draft}
                icon={<FileText size={18} />}
                color="warning"
            />

            <StatCard
                label="Pinned"
                value={stats.pinned}
                icon={<Pin size={18} />}
                color="info"
            />

            <StatCard
                label="Urgent"
                value={stats.urgent}
                icon={<AlertTriangle size={18} />}
                color="danger"
            />

            {stats.unreadCount !== undefined && (
                <StatCard
                    label="Unread"
                    value={stats.unreadCount}
                    icon={<Eye size={18} />}
                    color="warning"
                />
            )}

            {stats.archived > 0 && (
                <StatCard
                    label="Archived"
                    value={stats.archived}
                    icon={<Archive size={18} />}
                    color="info"
                />
            )}
        </div>
    )
}