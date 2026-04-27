// FILE: src/components/courses/CourseList.tsx
// Production-ready course listing with filters
// ═══════════════════════════════════════════════════════════

'use client'

import { useState, useEffect } from 'react'
import { Table, Tr, Td, Badge, Button, Spinner, EmptyState } from '@/components/ui'
import { Edit2, Trash2, Users, BookOpen, Plus, Search, Filter, Calendar } from 'lucide-react'
import { CourseForm } from './CourseForm'

interface CourseListProps {
    institutionType: 'academy' | 'coaching'
    onSuccess: (message: string) => void
    onError: (message: string) => void
}

export function CourseList({ institutionType, onSuccess, onError }: CourseListProps) {
    const [courses, setCourses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('')
    const [isActive, setIsActive] = useState<string>('')

    const [formOpen, setFormOpen] = useState(false)
    const [editCourse, setEditCourse] = useState<any>(null)

    const [categories, setCategories] = useState<string[]>([])

    useEffect(() => {
        fetchCourses()
    }, [search, category, isActive])

    const fetchCourses = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (search) params.set('search', search)
            if (category) params.set('category', category)
            if (isActive) params.set('isActive', isActive)

            const res = await fetch(`/api/courses?${params}`)
            const data = await res.json()

            if (!res.ok) throw new Error(data.error)

            setCourses(data.courses || [])

            // Extract unique categories
            const cats = Array.from(new Set(data.courses.map((c: any) => c.category)))
            setCategories(cats as string[])
        } catch (err: any) {
            onError(err.message || 'Failed to load courses')
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (course: any) => {
        setEditCourse(course)
        setFormOpen(true)
    }

    const handleDelete = async (courseId: string, courseName: string) => {
        if (!confirm(`Are you sure you want to delete "${courseName}"?`)) return

        try {
            const res = await fetch(`/api/courses/${courseId}`, { method: 'DELETE' })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error)

            onSuccess(data.message || 'Course deleted')
            fetchCourses()
        } catch (err: any) {
            onError(err.message)
        }
    }

    const handleFormSuccess = (message: string) => {
        onSuccess(message)
        setFormOpen(false)
        setEditCourse(null)
        fetchCourses()
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="portal-page-title">Courses</h2>
                    <p className="portal-page-subtitle">Manage course catalog</p>
                </div>
                <Button onClick={() => { setEditCourse(null); setFormOpen(true) }}>
                    <Plus size={16} />
                    Add Course
                </Button>
            </div>

            {/* Filters */}
            <div className="portal-card p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {/* Search */}
                    <div className="portal-search">
                        <Search size={14} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Category */}
                    <select
                        className="input-clean"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>

                    {/* Status */}
                    <select
                        className="input-clean"
                        value={isActive}
                        onChange={(e) => setIsActive(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>

                    {/* Reset */}
                    <Button
                        variant="ghost"
                        onClick={() => { setSearch(''); setCategory(''); setIsActive('') }}
                    >
                        Clear Filters
                    </Button>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Spinner size="lg" />
                </div>
            ) : courses.length === 0 ? (
                <EmptyState
                    icon={<BookOpen size={40} />}
                    title="No courses found"
                    description="Create your first course to get started"
                    action={
                        <Button onClick={() => setFormOpen(true)}>
                            <Plus size={16} />
                            Add Course
                        </Button>
                    }
                />
            ) : (
                <div className="portal-card p-0 overflow-hidden">
                    <Table headers={['Course', 'Code', 'Category', 'Duration', 'Fee', 'Enrollments', 'Status', 'Actions']}>
                        {courses.map((course) => (
                            <Tr key={course._id}>
                                <Td>
                                    <div>
                                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                                            {course.name}
                                        </p>
                                        {course.description && (
                                            <p className="text-xs truncate-2 mt-0.5" style={{ color: 'var(--text-muted)', maxWidth: '300px' }}>
                                                {course.description}
                                            </p>
                                        )}
                                    </div>
                                </Td>
                                <Td>
                                    <code className="px-2 py-0.5 rounded text-xs font-mono" style={{ background: 'var(--bg-muted)' }}>
                                        {course.code}
                                    </code>
                                </Td>
                                <Td>
                                    <Badge variant="default">{course.category}</Badge>
                                </Td>
                                <Td>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                                        <span className="text-sm">
                                            {course.durationValue} {course.durationType}
                                        </span>
                                    </div>
                                </Td>
                                <Td>
                                    <span className="font-semibold tabular-nums">
                                        ₹{course.feeAmount.toLocaleString('en-IN')}
                                    </span>
                                    {course.feeType !== 'one-time' && (
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                            {course.feeType === 'monthly' ? 'Monthly' : `${course.installments?.number} installments`}
                                        </p>
                                    )}
                                </Td>
                                <Td>
                                    <div className="flex items-center gap-1.5">
                                        <Users size={12} style={{ color: 'var(--text-muted)' }} />
                                        <span className="text-sm font-medium tabular-nums">
                                            {course.enrollmentCount || 0}
                                        </span>
                                    </div>
                                </Td>
                                <Td>
                                    <Badge variant={course.isActive ? 'success' : 'default'}>
                                        {course.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </Td>
                                <Td>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => handleEdit(course)}
                                            className="btn-icon btn-icon-sm"
                                            title="Edit"
                                        >
                                            <Edit2 size={12} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(course._id, course.name)}
                                            className="btn-icon btn-icon-sm"
                                            title="Delete"
                                            style={{ color: 'var(--danger)' }}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </Td>
                            </Tr>
                        ))}
                    </Table>
                </div>
            )}

            {/* Form Modal */}
            {formOpen && (
                <CourseForm
                    open={formOpen}
                    onClose={() => { setFormOpen(false); setEditCourse(null) }}
                    onSuccess={handleFormSuccess}
                    editCourse={editCourse}
                    institutionType={institutionType}
                />
            )}
        </div>
    )
}