// FILE: src/components/enrollments/EnrollmentForm.tsx
// Enroll Student Modal — Production Ready
// ═══════════════════════════════════════════════════════════

'use client'

import { useState, useEffect } from 'react'
import { Modal, Button, Spinner, Alert } from '@/components/ui'
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react'
import { Portal } from '../ui/Portal'

interface EnrollmentFormProps {
  open: boolean
  onClose: () => void
  onSuccess: (message: string) => void
  institutionType: 'academy' | 'coaching'
}

export function EnrollmentForm({ open, onClose, onSuccess, institutionType }: EnrollmentFormProps) {
  const [form, setForm] = useState({
    studentId: '',
    courseId: '',
    batchId: '',
    enrollmentDate: new Date().toISOString().split('T')[0],
    franchiseId: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')

  const [students, setStudents] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [franchises, setFranchises] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const [selectedBatch, setSelectedBatch] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (form.courseId) {
      fetchBatches(form.courseId)
    } else {
      setBatches([])
      setForm({ ...form, batchId: '' })
    }
  }, [form.courseId])

  useEffect(() => {
    if (form.batchId) {
      const batch = batches.find((b) => b._id === form.batchId)
      setSelectedBatch(batch)

      // Check capacity
      if (batch && batch.isFull) {
        setWarning(`This batch is full (${batch.currentEnrollments}/${batch.maxStudents}). Enrollment may fail.`)
      } else {
        setWarning('')
      }
    } else {
      setSelectedBatch(null)
      setWarning('')
    }
  }, [form.batchId, batches])

  const fetchData = async () => {
    setLoadingData(true)
    try {
      const [studentsRes, coursesRes, franchisesRes] = await Promise.all([
        fetch('/api/students?status=active'),
        fetch('/api/courses?isActive=true'),
        fetch('/api/franchises'),
      ])

      const [studentsData, coursesData, franchisesData] = await Promise.all([
        studentsRes.json(),
        coursesRes.json(),
        franchisesRes.json(),
      ])

      if (studentsRes.ok) {
        const activeStudents = (studentsData.students || []).filter((s: any) => s.status === 'active')
        setStudents(activeStudents)
      }
      if (coursesRes.ok) setCourses(coursesData.courses || [])
      if (franchisesRes.ok) setFranchises(franchisesData.franchises || [])
    } catch (err) {
      console.error('Failed to load data', err)
    } finally {
      setLoadingData(false)
    }
  }

  const fetchBatches = async (courseId: string) => {
    try {
      const res = await fetch(`/api/batches?courseId=${courseId}&status=upcoming,ongoing`)
      const data = await res.json()

      if (res.ok) {
        setBatches(data.batches || [])
      }
    } catch (err) {
      console.error('Failed to load batches', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setWarning('')

    // Validation
    if (!form.studentId) {
      setError('Student is required')
      return
    }
    if (!form.courseId) {
      setError('Course is required')
      return
    }
    if (!form.batchId) {
      setError('Batch is required')
      return
    }
    if (!form.enrollmentDate) {
      setError('Enrollment date is required')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to enroll student')
        return
      }

      onSuccess(data.message || 'Student enrolled successfully')
      onClose()
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Portal>
      <Modal open={open} onClose={onClose} title="Enroll Student" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="modal-body max-h-[70vh] overflow-y-auto portal-scrollbar">
            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {warning && <Alert type="warning" message={warning} onClose={() => setWarning('')} />}

            {loadingData ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="md" />
              </div>
            ) : (
              <>
                {/* Student Selection */}
                <div>
                  <label className="input-label">
                    Student <span style={{ color: 'var(--color-danger-500)' }}>*</span>
                  </label>
                  <select
                    className="input-clean"
                    value={form.studentId}
                    onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                    required
                  >
                    <option value="">Select Student</option>
                    {students.map((student) => (
                      <option key={student._id} value={student._id}>
                        {student.userId?.name} ({student.admissionNo})
                      </option>
                    ))}
                  </select>
                  {students.length === 0 && (
                    <p className="input-hint text-warning">No active students available</p>
                  )}
                </div>

                {/* Course Selection */}
                <div>
                  <label className="input-label">
                    Course <span style={{ color: 'var(--color-danger-500)' }}>*</span>
                  </label>
                  <select
                    className="input-clean"
                    value={form.courseId}
                    onChange={(e) => setForm({ ...form, courseId: e.target.value, batchId: '' })}
                    required
                  >
                    <option value="">Select Course</option>
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.name} ({course.code}) - ₹{course.feeAmount.toLocaleString('en-IN')}
                      </option>
                    ))}
                  </select>
                  {courses.length === 0 && (
                    <p className="input-hint text-warning">No active courses available</p>
                  )}
                </div>

                {/* Batch Selection */}
                <div>
                  <label className="input-label">
                    Batch <span style={{ color: 'var(--color-danger-500)' }}>*</span>
                  </label>
                  <select
                    className="input-clean"
                    value={form.batchId}
                    onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                    required
                    disabled={!form.courseId}
                  >
                    <option value="">Select Batch</option>
                    {batches.map((batch) => (
                      <option key={batch._id} value={batch._id} disabled={batch.isFull}>
                        {batch.batchName} ({batch.batchCode}) - {batch.currentEnrollments}/{batch.maxStudents}
                        {batch.isFull ? ' [FULL]' : ''}
                      </option>
                    ))}
                  </select>
                  {form.courseId && batches.length === 0 && (
                    <p className="input-hint text-warning">No batches available for this course</p>
                  )}
                </div>

                {/* Batch Details */}
                {selectedBatch && (
                  <div
                    className="p-3 rounded-lg"
                    style={{
                      background: selectedBatch.isFull ? 'var(--danger-light)' : 'var(--success-light)',
                      border: `1px solid ${selectedBatch.isFull ? 'var(--danger)' : 'var(--success)'}`,
                    }}
                  >
                    <div className="flex items-start gap-2">
                      {selectedBatch.isFull ? (
                        <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                      ) : (
                        <CheckCircle size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
                      )}
                      <div className="flex-1">
                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                          Batch Details
                        </p>
                        <ul className="text-xs space-y-0.5" style={{ color: 'var(--text-secondary)' }}>
                          <li>
                            Instructor: {selectedBatch.instructorId?.fullName || 'N/A'}
                          </li>
                          <li>
                            Duration: {new Date(selectedBatch.startDate).toLocaleDateString()} -{' '}
                            {new Date(selectedBatch.endDate).toLocaleDateString()}
                          </li>
                          <li>
                            Available Seats: {selectedBatch.maxStudents - selectedBatch.currentEnrollments}
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enrollment Date */}
                <div>
                  <label className="input-label">
                    Enrollment Date <span style={{ color: 'var(--color-danger-500)' }}>*</span>
                  </label>
                  <input
                    type="date"
                    className="input-clean"
                    value={form.enrollmentDate}
                    onChange={(e) => setForm({ ...form, enrollmentDate: e.target.value })}
                    required
                  />
                </div>

                {/* Franchise (Optional) */}
                {franchises.length > 0 && (
                  <div>
                    <label className="input-label">Franchise (Optional)</label>
                    <select
                      className="input-clean"
                      value={form.franchiseId}
                      onChange={(e) => setForm({ ...form, franchiseId: e.target.value })}
                    >
                      <option value="">No Franchise</option>
                      {franchises.map((franchise) => (
                        <option key={franchise._id} value={franchise._id}>
                          {franchise.name} ({franchise.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Fee Info */}
                {form.courseId && (
                  <div
                    className="p-3 rounded-lg"
                    style={{ background: 'var(--info-light)', border: '1px solid var(--info)' }}
                  >
                    <p className="text-xs font-semibold mb-1" style={{ color: 'var(--info-dark)' }}>
                      Fee Information
                    </p>
                    <p className="text-xs" style={{ color: 'var(--info)' }}>
                      Course fee will be automatically assigned to the student after enrollment.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal-footer">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || loadingData}>
              {loading ? <Spinner size="sm" /> : null}
              {loading ? 'Enrolling...' : 'Enroll Student'}
            </Button>
          </div>
        </form>
      </Modal>
    </Portal>
  )
}