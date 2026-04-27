// FILE: src/components/enrollments/EnrollmentList.tsx
// Production-ready enrollment listing with progress tracking
// ═══════════════════════════════════════════════════════════

'use client'

import { useState, useEffect } from 'react'
import { Table, Tr, Td, Badge, Button, Spinner, EmptyState } from '@/components/ui'
import { UserPlus, Plus, Search, Award, TrendingUp } from 'lucide-react'
import { EnrollmentForm } from './EnrollmentForm'

interface EnrollmentListProps {
  institutionType: 'academy' | 'coaching'
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

export function EnrollmentList({ institutionType, onSuccess, onError }: EnrollmentListProps) {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [batchId, setBatchId] = useState('')
  const [status, setStatus] = useState('')

  const [formOpen, setFormOpen] = useState(false)

  const [batches, setBatches] = useState<any[]>([])

  useEffect(() => {
    fetchBatches()
  }, [])

  useEffect(() => {
    fetchEnrollments()
  }, [search, batchId, status])

  const fetchBatches = async () => {
    try {
      const res = await fetch('/api/batches')
      const data = await res.json()
      if (res.ok) setBatches(data.batches || [])
    } catch (err) {
      console.error('Failed to load batches', err)
    }
  }

  const fetchEnrollments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (batchId) params.set('batchId', batchId)
      if (status) params.set('status', status)

      const res = await fetch(`/api/enrollments?${params}`)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      setEnrollments(data.enrollments || [])
    } catch (err: any) {
      onError(err.message || 'Failed to load enrollments')
    } finally {
      setLoading(false)
    }
  }

  const handleFormSuccess = (message: string) => {
    onSuccess(message)
    setFormOpen(false)
    fetchEnrollments()
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
      active: 'success',
      completed: 'info',
      dropout: 'warning',
      transferred: 'default',
    }
    return map[status] || 'default'
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return 'var(--success)'
    if (percentage >= 50) return 'var(--info)'
    if (percentage >= 25) return 'var(--warning)'
    return 'var(--danger)'
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="portal-page-title">Enrollments</h2>
          <p className="portal-page-subtitle">Track student enrollments and progress</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus size={16} />
          Enroll Student
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
              placeholder="Search by enrollment no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Batch */}
          <select className="input-clean" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
            <option value="">All Batches</option>
            {batches.map((batch) => (
              <option key={batch._id} value={batch._id}>
                {batch.batchName}
              </option>
            ))}
          </select>

          {/* Status */}
          <select className="input-clean" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="dropout">Dropout</option>
            <option value="transferred">Transferred</option>
          </select>

          {/* Reset */}
          <Button variant="ghost" onClick={() => { setSearch(''); setBatchId(''); setStatus('') }}>
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : enrollments.length === 0 ? (
        <EmptyState
          icon={<UserPlus size={40} />}
          title="No enrollments found"
          description="Enroll students to courses and batches"
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus size={16} />
              Enroll Student
            </Button>
          }
        />
      ) : (
        <div className="portal-card p-0 overflow-hidden">
          <Table
            headers={[
              'Student',
              'Enrollment No',
              'Course',
              'Batch',
              'Progress',
              'Attendance',
              'Fees',
              'Status',
            ]}
          >
            {enrollments.map((enrollment) => (
              <Tr key={enrollment._id}>
                <Td>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {enrollment.studentId?.userId?.name || 'N/A'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {enrollment.studentId?.admissionNo}
                    </p>
                  </div>
                </Td>
                <Td>
                  <code
                    className="text-xs font-mono px-1.5 py-0.5 rounded"
                    style={{ background: 'var(--bg-muted)' }}
                  >
                    {enrollment.enrollmentNo}
                  </code>
                </Td>
                <Td>
                  <p className="text-sm font-medium">{enrollment.courseId?.name || 'N/A'}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {enrollment.courseId?.code}
                  </p>
                </Td>
                <Td>
                  <p className="text-sm">{enrollment.batchId?.batchName || 'N/A'}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {enrollment.batchId?.batchCode}
                  </p>
                </Td>
                <Td>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex-1 h-1.5 rounded-full overflow-hidden"
                        style={{ background: 'var(--bg-muted)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${enrollment.completionPercentage}%`,
                            background: getProgressColor(enrollment.completionPercentage),
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold tabular-nums" style={{ minWidth: '35px' }}>
                        {enrollment.completionPercentage}%
                      </span>
                    </div>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={12} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-sm font-medium tabular-nums">
                      {enrollment.attendancePercentage}%
                    </span>
                  </div>
                </Td>
                <Td>
                  <div>
                    <p className="text-sm font-semibold tabular-nums">
                      ₹{enrollment.paidAmount.toLocaleString('en-IN')} /{' '}
                      {enrollment.totalFee.toLocaleString('en-IN')}
                    </p>
                    {enrollment.feesPaid ? (
                      <Badge variant="success" className="mt-1">
                        Paid
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="mt-1">
                        Due: ₹{enrollment.dueAmount.toLocaleString('en-IN')}
                      </Badge>
                    )}
                  </div>
                </Td>
                <Td>
                  <Badge variant={getStatusBadge(enrollment.status)}>
                    {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                  </Badge>
                  {enrollment.certificateIssued && (
                    <div className="flex items-center gap-1 mt-1">
                      <Award size={12} style={{ color: 'var(--warning)' }} />
                      <span className="text-xs" style={{ color: 'var(--warning-dark)' }}>
                        Certified
                      </span>
                    </div>
                  )}
                </Td>
              </Tr>
            ))}
          </Table>
        </div>
      )}

      {/* Form Modal */}
      {formOpen && (
        <EnrollmentForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSuccess={handleFormSuccess}
          institutionType={institutionType}
        />
      )}
    </div>
  )
}