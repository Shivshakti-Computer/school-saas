// FILE: src/components/batches/BatchList.tsx
// Production-ready batch listing with filters
// ═══════════════════════════════════════════════════════════

'use client'

import { useState, useEffect } from 'react'
import { Table, Tr, Td, Badge, Button, Spinner, EmptyState } from '@/components/ui'
import { Edit2, Trash2, Users, Plus, Search, Calendar, User } from 'lucide-react'
import { BatchForm } from './BatchForm'

interface BatchListProps {
  institutionType: 'academy' | 'coaching'
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

export function BatchList({ institutionType, onSuccess, onError }: BatchListProps) {
  const [batches, setBatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [courseId, setCourseId] = useState('')
  const [status, setStatus] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editBatch, setEditBatch] = useState<any>(null)

  const [courses, setCourses] = useState<any[]>([])

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    fetchBatches()
  }, [search, courseId, status])

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses?isActive=true')
      const data = await res.json()
      if (res.ok) setCourses(data.courses || [])
    } catch (err) {
      console.error('Failed to load courses', err)
    }
  }

  const fetchBatches = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (courseId) params.set('courseId', courseId)
      if (status) params.set('status', status)

      const res = await fetch(`/api/batches?${params}`)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      setBatches(data.batches || [])
    } catch (err: any) {
      onError(err.message || 'Failed to load batches')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (batch: any) => {
    setEditBatch(batch)
    setFormOpen(true)
  }

  const handleDelete = async (batchId: string, batchName: string) => {
    if (!confirm(`Are you sure you want to cancel "${batchName}"?`)) return

    try {
      const res = await fetch(`/api/batches/${batchId}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      onSuccess(data.message || 'Batch cancelled')
      fetchBatches()
    } catch (err: any) {
      onError(err.message)
    }
  }

  const handleFormSuccess = (message: string) => {
    onSuccess(message)
    setFormOpen(false)
    setEditBatch(null)
    fetchBatches()
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
      upcoming: 'info',
      ongoing: 'success',
      completed: 'default',
      cancelled: 'warning',
    }
    return map[status] || 'default'
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="portal-page-title">Batches</h2>
          <p className="portal-page-subtitle">Manage course batches</p>
        </div>
        <Button onClick={() => { setEditBatch(null); setFormOpen(true) }}>
          <Plus size={16} />
          Add Batch
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
              placeholder="Search batches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Course */}
          <select className="input-clean" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">All Courses</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.name}
              </option>
            ))}
          </select>

          {/* Status */}
          <select className="input-clean" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Reset */}
          <Button variant="ghost" onClick={() => { setSearch(''); setCourseId(''); setStatus('') }}>
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : batches.length === 0 ? (
        <EmptyState
          icon={<Users size={40} />}
          title="No batches found"
          description="Create your first batch to get started"
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus size={16} />
              Add Batch
            </Button>
          }
        />
      ) : (
        <div className="portal-card p-0 overflow-hidden">
          <Table
            headers={['Batch', 'Course', 'Schedule', 'Instructor', 'Capacity', 'Status', 'Actions']}
          >
            {batches.map((batch) => (
              <Tr key={batch._id}>
                <Td>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {batch.batchName}
                    </p>
                    <code
                      className="text-xs font-mono px-1.5 py-0.5 rounded mt-1"
                      style={{ background: 'var(--bg-muted)' }}
                    >
                      {batch.batchCode}
                    </code>
                  </div>
                </Td>
                <Td>
                  <p className="text-sm font-medium">{batch.courseId?.name || 'N/A'}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {batch.courseId?.code}
                  </p>
                </Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-xs">
                      {new Date(batch.startDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}
                      {' - '}
                      {new Date(batch.endDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    <User size={12} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-sm">{batch.instructorId?.fullName || 'N/A'}</span>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    <Users size={12} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-sm font-medium tabular-nums">
                      {batch.currentEnrollments}/{batch.maxStudents}
                    </span>
                  </div>
                  {batch.isFull && (
                    <Badge variant="warning" className="mt-1">
                      Full
                    </Badge>
                  )}
                </Td>
                <Td>
                  <Badge variant={getStatusBadge(batch.status)}>
                    {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleEdit(batch)} className="btn-icon btn-icon-sm" title="Edit">
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(batch._id, batch.batchName)}
                      className="btn-icon btn-icon-sm"
                      title="Cancel"
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
        <BatchForm
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditBatch(null) }}
          onSuccess={handleFormSuccess}
          editBatch={editBatch}
          institutionType={institutionType}
        />
      )}
    </div>
  )
}