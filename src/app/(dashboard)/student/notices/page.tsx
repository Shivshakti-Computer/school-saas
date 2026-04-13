// FILE: src/app/(dashboard)/student/notices/page.tsx
// Same for parent: src/app/(dashboard)/parent/notices/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { PageHeader, Alert } from '@/components/ui'
import { NoticeList } from '@/components/notices/NoticeList'
import { NoticeFiltersComponent } from '@/components/notices/NoticeFilters'
import { NoticeStatsComponent } from '@/components/notices/NoticeStats'
import type { NoticeListItem, NoticeFilters, NoticeStats } from '@/types/notice'

export default function StudentNoticesPage() {
    const [notices, setNotices] = useState<NoticeListItem[]>([])
    const [stats, setStats] = useState<NoticeStats | null>(null)
    const [filters, setFilters] = useState<NoticeFilters>({
        page: 1,
        limit: 20,
        sortBy: 'publishedAt',
        sortOrder: 'desc',
    })
    const [loading, setLoading] = useState(true)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

    const fetchNotices = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== '') {
                    params.set(key, String(value))
                }
            })

            const res = await fetch(`/api/notices?${params}`)
            const data = await res.json()

            if (res.ok) {
                setNotices(data.notices)
            } else {
                throw new Error(data.error)
            }
        } catch (err: any) {
            setAlert({ type: 'error', message: err.message })
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/notices/stats')
            const data = await res.json()
            if (res.ok) setStats(data.stats)
        } catch (err) {
            console.error('Failed to fetch stats:', err)
        }
    }

    useEffect(() => {
        fetchNotices()
    }, [filters])

    useEffect(() => {
        fetchStats()
    }, [])

    return (
        <div className="space-y-6">
            <PageHeader
                title="📢 Notice Board"
                subtitle="Important notices and announcements from school"
            />

            {alert && (
                <Alert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                />
            )}

            {stats && <NoticeStatsComponent stats={stats} />}

            <NoticeFiltersComponent
                filters={filters}
                onChange={setFilters}
                onReset={() => setFilters({
                    page: 1,
                    limit: 20,
                    sortBy: 'publishedAt',
                    sortOrder: 'desc',
                })}
            />

            <NoticeList
                notices={notices}
                isLoading={loading}
            />
        </div>
    )
}