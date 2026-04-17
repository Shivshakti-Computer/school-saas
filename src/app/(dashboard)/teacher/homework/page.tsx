// FILE: src/app/(dashboard)/teacher/homework/page.tsx
// ✅ Production-ready Teacher Homework Page
// Scoped to teacher's assigned classes & subjects only

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
    PageHeader, Button, Modal, Alert, StatCard,
} from '@/components/ui'
import { Portal } from '@/components/ui/Portal'
import {
    Plus, BookOpen, Clock, CheckCircle2, AlertCircle,
} from 'lucide-react'
import type {
    HomeworkListItem,
    HomeworkFilters as IHomeworkFilters,
    HomeworkStats,
    HomeworkFormData,
    HomeworkDetail,
} from '@/types/homework'
import { TeacherHomeworkFilters } from '@/components/homework/TeacherHomeworkFilters'
import { TeacherHomeworkList } from '@/components/homework/TeacherHomeworkList'
import { TeacherHomeworkForm } from '@/components/homework/TeacherHomeworkForm'
import { TeacherHomeworkDetailModal } from '@/components/homework/TeacherHomeworkDetailModal'

export default function TeacherHomeworkPage() {
    const { data: session } = useSession()

    // ── Teacher's assigned scope from session ──
    const teacherClasses: string[] =
        (session?.user as any)?.teacherClasses || []
    const teacherSections: string[] =
        (session?.user as any)?.teacherSections || []
    const teacherSubjects: string[] =
        (session?.user as any)?.teacherSubjects || []

    const [homework, setHomework] = useState<HomeworkListItem[]>([])
    const [stats, setStats] = useState<HomeworkStats | null>(null)

    const [filters, setFilters] = useState<IHomeworkFilters>({
        page: 1,
        limit: 20,
        sortBy: 'dueDate',
        sortOrder: 'asc',
    })

    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [selectedHomework, setSelectedHomework] =
        useState<HomeworkDetail | null>(null)
    const [editingHomework, setEditingHomework] =
        useState<HomeworkDetail | null>(null)
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

    // ── Fetch homework — scoped to teacher's classes ──
    const fetchHomework = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()

            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== '') {
                    params.set(key, String(value))
                }
            })

            // ✅ API will filter by createdBy = teacher
            params.set('_t', Date.now().toString())

            const res = await fetch(`/api/homework?${params}`, {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' },
            })
            const data = await res.json()

            if (res.ok) {
                setHomework(data.homework || [])
                if (data.stats) setStats(data.stats)
            } else {
                throw new Error(data.error)
            }
        } catch (err: any) {
            setAlert({ type: 'error', message: err.message || 'Failed to load' })
        }
        setLoading(false)
    }, [filters])

    useEffect(() => {
        fetchHomework()
    }, [fetchHomework])

    // ── Create homework ──
    const handleCreate = async (formData: HomeworkFormData) => {
        setSubmitting(true)
        try {
            const res = await fetch('/api/homework', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error)

            setAlert({ type: 'success', message: 'Homework assigned successfully!' })
            setShowCreateModal(false)
            fetchHomework()
        } catch (err: any) {
            setAlert({ type: 'error', message: err.message })
        }
        setSubmitting(false)
    }

    // ── Update homework ──
    const handleUpdate = async (formData: HomeworkFormData) => {
        if (!editingHomework) return
        setSubmitting(true)
        try {
            const res = await fetch(`/api/homework/${editingHomework._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            setAlert({ type: 'success', message: 'Homework updated!' })
            setEditingHomework(null)
            fetchHomework()
        } catch (err: any) {
            setAlert({ type: 'error', message: err.message })
        }
        setSubmitting(false)
    }

    // ── Delete homework ──
    const handleDelete = async (id: string) => {
        if (!confirm('Delete this homework? This cannot be undone.')) return
        try {
            const res = await fetch(`/api/homework/${id}`, {
                method: 'DELETE',
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setAlert({ type: 'success', message: 'Homework deleted!' })
            fetchHomework()
        } catch (err: any) {
            setAlert({ type: 'error', message: err.message })
        }
    }

    // ── View detail ──
    const handleView = async (hw: HomeworkListItem) => {
        try {
            const res = await fetch(`/api/homework/${hw._id}`)
            const data = await res.json()
            if (res.ok) setSelectedHomework(data.homework)
        } catch (err) {
            console.error('Failed to fetch homework detail:', err)
        }
    }

    // ── Edit ──
    const handleEdit = async (hw: HomeworkListItem) => {
        try {
            const res = await fetch(`/api/homework/${hw._id}`)
            const data = await res.json()
            if (res.ok) setEditingHomework(data.homework)
        } catch (err) {
            console.error('Failed to fetch homework:', err)
        }
    }

    // ── After grading ──
    const handleHomeworkGraded = async () => {
        await fetchHomework()
        if (selectedHomework) {
            try {
                const res = await fetch(`/api/homework/${selectedHomework._id}`, {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache' },
                })
                const data = await res.json()
                if (res.ok) setSelectedHomework(data.homework)
            } catch (err) {
                console.error('Failed to refresh detail:', err)
            }
        }
        setAlert({ type: 'success', message: 'Grade submitted!' })
    }

    // ── No classes assigned ──
    if (!loading && teacherClasses.length === 0) {
        return (
            <div className="portal-content-enter space-y-4">
                <PageHeader
                    title="Homework"
                    subtitle="Assign and grade homework for your classes"
                />
                <div
                    className="portal-card rounded-[var(--radius-lg)] p-10 text-center"
                >
                    <div
                        className="w-14 h-14 rounded-[var(--radius-xl)] flex items-center justify-center mx-auto mb-4"
                        style={{
                            backgroundColor: 'var(--warning-light)',
                            color: 'var(--warning)',
                        }}
                    >
                        <AlertCircle size={24} />
                    </div>
                    <p
                        className="text-sm font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        No Classes Assigned
                    </p>
                    <p
                        className="text-xs mt-1 max-w-xs mx-auto"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        Contact your administrator to assign classes and subjects
                        to your account before assigning homework.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="portal-content-enter space-y-4">
            <PageHeader
                title="Homework"
                subtitle={`Manage assignments for Class ${teacherClasses.join(', ')}`}
                action={
                    <Button size="sm" onClick={() => setShowCreateModal(true)}>
                        <Plus size={14} />
                        Assign Homework
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

            {/* ── Stats ── */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard
                        label="Total Assigned"
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
                </div>
            )}

            {/* ── Filters — scoped to teacher's classes/subjects ── */}
            <TeacherHomeworkFilters
                filters={filters}
                onChange={setFilters}
                onReset={() =>
                    setFilters({ page: 1, limit: 20, sortBy: 'dueDate', sortOrder: 'asc' })
                }
                allowedClasses={teacherClasses}
                allowedSubjects={teacherSubjects}
            />

            {/* ── List ── */}
            <TeacherHomeworkList
                homework={homework}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isLoading={loading}
            />

            {/* ── Modals ── */}
            <Portal>
                {/* Create */}
                <Modal
                    open={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    title="Assign New Homework"
                    size="lg"
                >
                    <TeacherHomeworkForm
                        onSubmit={handleCreate}
                        onCancel={() => setShowCreateModal(false)}
                        isLoading={submitting}
                        allowedClasses={teacherClasses}
                        allowedSections={teacherSections}
                        allowedSubjects={teacherSubjects}
                    />
                </Modal>

                {/* Edit */}
                <Modal
                    open={!!editingHomework}
                    onClose={() => setEditingHomework(null)}
                    title="Edit Homework"
                    size="lg"
                >
                    {editingHomework && (
                        <TeacherHomeworkForm
                            initialData={editingHomework}
                            onSubmit={handleUpdate}
                            onCancel={() => setEditingHomework(null)}
                            isLoading={submitting}
                            allowedClasses={teacherClasses}
                            allowedSections={teacherSections}
                            allowedSubjects={teacherSubjects}
                        />
                    )}
                </Modal>

                {/* Detail / Grade */}
                <Modal
                    open={!!selectedHomework}
                    onClose={() => setSelectedHomework(null)}
                    title="Homework Details"
                    size="lg"
                >
                    {selectedHomework && (
                        <TeacherHomeworkDetailModal
                            homework={selectedHomework}
                            onClose={() => setSelectedHomework(null)}
                            onGraded={handleHomeworkGraded}
                        />
                    )}
                </Modal>
            </Portal>
        </div>
    )
}