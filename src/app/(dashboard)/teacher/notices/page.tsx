// FILE: src/app/(dashboard)/teacher/notices/page.tsx
// ✅ Production-ready — Teacher notices page
// Teacher apne school ke notices dekh sakta hai
// Aur notice create bhi kar sakta hai (agar allowed ho)

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { PageHeader, Button, Modal, Alert, Spinner } from '@/components/ui'
import { NoticeList } from '@/components/notices/NoticeList'
import { NoticeForm } from '@/components/notices/NoticeForm'
import { NoticeFiltersComponent } from '@/components/notices/NoticeFilters'
import { Portal } from '@/components/ui/Portal'
import { Plus, Bell } from 'lucide-react'
import type {
    NoticeListItem,
    NoticeFilters,
    NoticeFormData,
} from '@/types/notice'

export default function TeacherNoticesPage() {
    const { data: session } = useSession()
    const [notices, setNotices] = useState<NoticeListItem[]>([])
    const [total, setTotal] = useState(0)
    const [filters, setFilters] = useState<NoticeFilters>({
        page: 1,
        limit: 20,
        sortBy: 'publishedAt',
        sortOrder: 'desc',
    })
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [alert, setAlert] = useState<{
        type: 'success' | 'error'
        message: string
    } | null>(null)

    // Auto-clear alert
    useEffect(() => {
        if (alert) {
            const t = setTimeout(() => setAlert(null), 5000)
            return () => clearTimeout(t)
        }
    }, [alert])

    const fetchNotices = useCallback(async () => {
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
                setNotices(data.notices || [])
                setTotal(data.total || 0)
            } else {
                throw new Error(data.error)
            }
        } catch (err: any) {
            setAlert({ type: 'error', message: err.message || 'Failed to load' })
        } finally {
            setLoading(false)
        }
    }, [filters])

    useEffect(() => {
        fetchNotices()
    }, [fetchNotices])

    const handleCreate = async (formData: NoticeFormData) => {
        try {
            setSubmitting(true)
            const res = await fetch('/api/notices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            setAlert({ type: 'success', message: 'Notice created successfully!' })
            setShowCreateModal(false)
            fetchNotices()
        } catch (err: any) {
            setAlert({ type: 'error', message: err.message })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="portal-content-enter space-y-4">
            <PageHeader
                title="Notices"
                subtitle={`${total} notice${total !== 1 ? 's' : ''} in your school`}
                action={
                    <Button
                        size="sm"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <Plus size={14} />
                        Create Notice
                    </Button>
                }
            />

            {alert && (
                <Alert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                />
            )}

            <NoticeFiltersComponent
                filters={filters}
                onChange={(f) => {
                    setFilters(f)
                }}
                onReset={() =>
                    setFilters({
                        page: 1,
                        limit: 20,
                        sortBy: 'publishedAt',
                        sortOrder: 'desc',
                    })
                }
            />

            {loading ? (
                <div className="flex justify-center py-16">
                    <Spinner size="lg" />
                </div>
            ) : notices.length === 0 ? (
                <div
                    className="
            portal-card rounded-[var(--radius-lg)]
            p-10 text-center
          "
                >
                    <div
                        className="
              w-14 h-14 rounded-[var(--radius-xl)]
              flex items-center justify-center mx-auto mb-4
            "
                        style={{
                            backgroundColor: 'var(--primary-50)',
                            color: 'var(--primary-400)',
                        }}
                    >
                        <Bell size={24} />
                    </div>
                    <p
                        className="text-sm font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        No Notices Yet
                    </p>
                    <p
                        className="text-xs mt-1"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        No notices found. Create one to get started.
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-secondary btn-sm mt-4"
                    >
                        <Plus size={13} />
                        Create Notice
                    </button>
                </div>
            ) : (
                <NoticeList notices={notices} isLoading={false} />
            )}

            <Portal>
                <Modal
                    open={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    title="Create Notice"
                    size="lg"
                >
                    <NoticeForm
                        onSubmit={handleCreate}
                        onCancel={() => setShowCreateModal(false)}
                        isLoading={submitting}
                    />
                </Modal>
            </Portal>
        </div>
    )
}