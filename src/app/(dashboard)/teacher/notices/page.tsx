// FILE: src/app/(dashboard)/teacher/notices/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { PageHeader, Button, Modal, Alert } from '@/components/ui'
import { NoticeList } from '@/components/notices/NoticeList'
import { NoticeForm } from '@/components/notices/NoticeForm'
import { NoticeFiltersComponent } from '@/components/notices/NoticeFilters'
import { Portal } from '@/components/ui/Portal'
import { Plus } from 'lucide-react'
import type { NoticeListItem, NoticeFilters, NoticeFormData } from '@/types/notice'

export default function TeacherNoticesPage() {
    const [notices, setNotices] = useState<NoticeListItem[]>([])
    const [filters, setFilters] = useState<NoticeFilters>({
        page: 1,
        limit: 20,
        sortBy: 'publishedAt',
        sortOrder: 'desc',
    })
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [submitting, setSubmitting] = useState(false)
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

    useEffect(() => {
        fetchNotices()
    }, [filters])

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
        <div className="space-y-6">
            <PageHeader
                title="Notices"
                subtitle="View and create notices"
                action={
                    <Button onClick={() => setShowCreateModal(true)}>
                        <Plus size={16} />
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