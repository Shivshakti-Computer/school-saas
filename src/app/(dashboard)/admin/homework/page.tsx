// FILE: src/app/(dashboard)/admin/homework/page.tsx
// ═══════════════════════════════════════════════════════════

'use client'

import { useState, useEffect } from 'react'
import { PageHeader, Button, Modal, Alert, StatCard } from '@/components/ui'
import { HomeworkList } from '@/components/homework/HomeworkList'
import { HomeworkForm } from '@/components/homework/HomeworkForm'
import { HomeworkFilters } from '@/components/homework/HomeworkFilters'
import { HomeworkDetailModal } from '@/components/homework/HomeworkDetailModal'
import { Portal } from '@/components/ui/Portal'
import {
    Plus, BookOpen, Clock, CheckCircle2,
    AlertCircle, Coins, Wallet,
} from 'lucide-react'
import type {
    HomeworkListItem,
    HomeworkFilters as IHomeworkFilters,
    HomeworkStats,
    HomeworkFormData,
    HomeworkDetail,
} from '@/types/homework'

export default function AdminHomeworkPage() {
    const [homework, setHomework] = useState<HomeworkListItem[]>([])
    const [stats, setStats] = useState<HomeworkStats | null>(null)
    const [creditBalance, setCreditBalance] = useState(0)
    const [totalCreditsUsed, setTotalCreditsUsed] = useState(0)
    const [creditsLoaded, setCreditsLoaded] = useState(false)

    const [filters, setFilters] = useState<IHomeworkFilters>({
        page: 1,
        limit: 20,
        sortBy: 'dueDate',
        sortOrder: 'asc',
    })

    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [selectedHomework, setSelectedHomework] = useState<HomeworkDetail | null>(null)
    const [editingHomework, setEditingHomework] = useState<HomeworkDetail | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [alert, setAlert] = useState<{
        type: 'success' | 'error'
        message: string
    } | null>(null)

    const formatCredits = (value: number): string => {
        if (Number.isInteger(value)) return value.toLocaleString('en-IN')
        return value.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    }

    const fetchCreditBalance = async () => {
        try {
            const res = await fetch('/api/credits/balance')
            const data = await res.json()
            const balance = data?.data?.balance ?? data?.balance ?? 0
            setCreditBalance(balance)
        } catch (err) {
            console.error('Failed to fetch balance:', err)
        } finally {
            setCreditsLoaded(true)
        }
    }

    const calculateCreditsUsed = (list: HomeworkListItem[]) => {
        const total = list.reduce((sum, hw) => {
            return sum + ((hw as any).creditsUsed || 0)
        }, 0)
        setTotalCreditsUsed(Math.round(total * 100) / 100)
    }

    const fetchHomework = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== '') {
                    params.set(key, String(value))
                }
            })

            params.set('_t', Date.now().toString())
            const res = await fetch(`/api/homework?${params}`, {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' },
            })
            const data = await res.json()

            if (res.ok) {
                setHomework(data.homework)
                if (data.stats) setStats(data.stats)
                calculateCreditsUsed(data.homework)
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
        fetchHomework()
    }, [filters])

    useEffect(() => {
        fetchCreditBalance()
    }, [])

    const handleCreate = async (formData: HomeworkFormData) => {
        try {
            setSubmitting(true)
            const res = await fetch('/api/homework', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await res.json()

            if (!res.ok) {
                if (res.status === 402) {
                    setAlert({
                        type: 'error',
                        message: `Insufficient credits. ${data.error}. Please purchase credits.`,
                    })
                } else {
                    throw new Error(data.error)
                }
            } else {
                let successMsg = 'Homework created successfully!'
                const notifs = data.notifications
                if (notifs) {
                    const parts = []
                    if (notifs.sms?.sent > 0) parts.push(`${notifs.sms.sent} SMS`)
                    if (notifs.whatsapp?.sent > 0) parts.push(`${notifs.whatsapp.sent} WhatsApp`)
                    if (notifs.email?.sent > 0) parts.push(`${notifs.email.sent} Email`)
                    if (notifs.push?.sent) parts.push('Push')
                    if (parts.length > 0) {
                        successMsg += ` Notifications sent: ${parts.join(', ')}.`
                    }
                }

                setAlert({ type: 'success', message: successMsg })
                setShowCreateModal(false)
                fetchHomework()
                fetchCreditBalance()
            }
        } catch (err: any) {
            setAlert({ type: 'error', message: err.message })
        } finally {
            setSubmitting(false)
        }
    }

    const handleUpdate = async (formData: HomeworkFormData) => {
        if (!editingHomework) return

        try {
            setSubmitting(true)
            const res = await fetch(`/api/homework/${editingHomework._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            setAlert({ type: 'success', message: 'Homework updated successfully!' })
            setEditingHomework(null)
            fetchHomework()
        } catch (err: any) {
            setAlert({ type: 'error', message: err.message })
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this homework?')) return

        try {
            const res = await fetch(`/api/homework/${id}`, {
                method: 'DELETE',
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            setAlert({ type: 'success', message: 'Homework deleted successfully!' })
            fetchHomework()
        } catch (err: any) {
            setAlert({ type: 'error', message: err.message })
        }
    }

    const handleView = async (hw: HomeworkListItem) => {
        try {
            const res = await fetch(`/api/homework/${hw._id}`)
            const data = await res.json()
            if (res.ok) setSelectedHomework(data.homework)
        } catch (err) {
            console.error('Failed to fetch homework:', err)
        }
    }

    const handleEdit = async (hw: HomeworkListItem) => {
        try {
            const res = await fetch(`/api/homework/${hw._id}`)
            const data = await res.json()
            if (res.ok) setEditingHomework(data.homework)
        } catch (err) {
            console.error('Failed to fetch homework:', err)
        }
    }

    // ✅ FIX: Proper callback after grading
    const handleHomeworkGraded = async () => {
        try {
            await new Promise(r => setTimeout(r, 300))
            await fetchHomework()
            if (selectedHomework) {
                const res = await fetch(`/api/homework/${selectedHomework._id}`, {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache' },
                })
                const data = await res.json()
                if (res.ok) setSelectedHomework(data.homework)
            }
            setAlert({ type: 'success', message: '✅ Grade submitted! Stats updated.' })
        } catch (err) {
            console.error('Failed to refresh:', err)
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Homework & Assignments"
                subtitle="Assign, track, and grade homework for your students"
                action={
                    <Button onClick={() => setShowCreateModal(true)}>
                        <Plus size={16} />
                        Create Homework
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

            {/* ── Stats Grid ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                {stats && (
                    <>
                        <StatCard
                            label="Total Homework"
                            value={stats.total}
                            icon={<BookOpen size={18} />}
                            color="primary"
                        />
                        <StatCard
                            label="Active"
                            value={stats.active}
                            icon={<Clock size={18} />}
                            color="info"
                        />
                        <StatCard
                            label="Overdue"
                            value={stats.overdue}
                            icon={<AlertCircle size={18} />}
                            color="danger"
                        />
                        <StatCard
                            label="Submitted"
                            value={stats.totalSubmitted}
                            icon={<CheckCircle2 size={18} />}
                            color="success"
                            trend={`${stats.totalPending} pending`}
                        />
                    </>
                )}

                <StatCard
                    label="Credits Used"
                    value={formatCredits(totalCreditsUsed)}
                    icon={<Coins size={18} />}
                    color="warning"
                />
                <StatCard
                    label="Credit Balance"
                    value={creditsLoaded ? formatCredits(creditBalance) : '...'}
                    icon={<Wallet size={18} />}
                    color="primary"
                    trend={
                        creditBalance < 100
                            ? '⚠️ Low balance'
                            : creditBalance < 500
                                ? '💡 Running low'
                                : undefined
                    }
                />
            </div>

            {/* ── Filters ── */}
            <HomeworkFilters
                filters={filters}
                onChange={setFilters}
                onReset={() =>
                    setFilters({
                        page: 1,
                        limit: 20,
                        sortBy: 'dueDate',
                        sortOrder: 'asc',
                    })
                }
            />

            {/* ── Homework List ── */}
            <HomeworkList
                homework={homework}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isLoading={loading}
                showActions
            />

            {/* ── Create Modal ── */}
            <Portal>
                <Modal
                    open={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    title="Create New Homework"
                    size="lg"
                >
                    <HomeworkForm
                        onSubmit={handleCreate}
                        onCancel={() => setShowCreateModal(false)}
                        isLoading={submitting}
                    />
                </Modal>
            </Portal>

            {/* ── Edit Modal ── */}
            <Portal>
                <Modal
                    open={!!editingHomework}
                    onClose={() => setEditingHomework(null)}
                    title="Edit Homework"
                    size="lg"
                >
                    {editingHomework && (
                        <HomeworkForm
                            initialData={editingHomework}
                            onSubmit={handleUpdate}
                            onCancel={() => setEditingHomework(null)}
                            isLoading={submitting}
                        />
                    )}
                </Modal>
            </Portal>

            {/* ── Detail Modal ── */}
            <Portal>
                <Modal
                    open={!!selectedHomework}
                    onClose={() => setSelectedHomework(null)}
                    title="Homework Details"
                    size="lg"
                >
                    {selectedHomework && (
                        <HomeworkDetailModal
                            homework={selectedHomework}
                            onClose={() => setSelectedHomework(null)}
                            onGraded={handleHomeworkGraded}  // ✅ Use fixed callback
                        />
                    )}
                </Modal>
            </Portal>
        </div>
    )
}