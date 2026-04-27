// FILE: src/components/batches/BatchForm.tsx
// Add/Edit Batch Modal — Production Ready
// ═══════════════════════════════════════════════════════════

'use client'

import { useState, useEffect } from 'react'
import { Modal, Button, Spinner, Alert } from '@/components/ui'
import { Calendar, Users, Clock } from 'lucide-react'
import { Portal } from '../ui/Portal'

interface BatchFormProps {
  open: boolean
  onClose: () => void
  onSuccess: (message: string) => void
  editBatch?: any
  institutionType: 'academy' | 'coaching'
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

const STATUS_OPTIONS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function BatchForm({ open, onClose, onSuccess, editBatch, institutionType }: BatchFormProps) {
  const [form, setForm] = useState({
    courseId: '',
    batchCode: '',
    batchName: '',
    startDate: '',
    endDate: '',
    maxStudents: 30,
    instructorId: '',
    status: 'upcoming',
    schedule: {} as Record<string, { startTime: string; endTime: string }>,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [courses, setCourses] = useState<any[]>([])
  const [instructors, setInstructors] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (editBatch) {
      setForm({
        courseId: editBatch.courseId?._id || editBatch.courseId || '',
        batchCode: editBatch.batchCode || '',
        batchName: editBatch.batchName || '',
        startDate: editBatch.startDate ? new Date(editBatch.startDate).toISOString().split('T')[0] : '',
        endDate: editBatch.endDate ? new Date(editBatch.endDate).toISOString().split('T')[0] : '',
        maxStudents: editBatch.maxStudents || 30,
        instructorId: editBatch.instructorId?._id || editBatch.instructorId || '',
        status: editBatch.status || 'upcoming',
        schedule: editBatch.schedule || {},
      })
    }
  }, [editBatch])

  const fetchData = async () => {
    setLoadingData(true)
    try {
      const [coursesRes, staffRes] = await Promise.all([
        fetch('/api/courses?isActive=true'),
        fetch('/api/staff'),
      ])

      const [coursesData, staffData] = await Promise.all([
        coursesRes.json(),
        staffRes.json(),
      ])

      if (coursesRes.ok) setCourses(coursesData.courses || [])
      if (staffRes.ok) {
        // Filter active staff only
        const activeStaff = (staffData.staff || []).filter((s: any) => s.status === 'active')
        setInstructors(activeStaff)
      }
    } catch (err) {
      console.error('Failed to load data', err)
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!form.courseId) {
      setError('Course is required')
      return
    }
    if (!form.batchCode.trim()) {
      setError('Batch code is required')
      return
    }
    if (!form.batchName.trim()) {
      setError('Batch name is required')
      return
    }
    if (!form.startDate) {
      setError('Start date is required')
      return
    }
    if (!form.endDate) {
      setError('End date is required')
      return
    }
    if (!form.instructorId) {
      setError('Instructor is required')
      return
    }
    if (form.maxStudents < 1) {
      setError('Maximum students must be at least 1')
      return
    }

    // Date validation
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      setError('End date must be after start date')
      return
    }

    setLoading(true)

    try {
      const url = editBatch ? `/api/batches/${editBatch._id}` : '/api/batches'

      const res = await fetch(url, {
        method: editBatch ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to save batch')
        return
      }

      onSuccess(data.message || 'Batch saved successfully')
      onClose()
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const toggleScheduleDay = (day: string) => {
    const newSchedule = { ...form.schedule }
    if (newSchedule[day]) {
      delete newSchedule[day]
    } else {
      newSchedule[day] = { startTime: '09:00', endTime: '11:00' }
    }
    setForm({ ...form, schedule: newSchedule })
  }

  const updateScheduleTime = (day: string, field: 'startTime' | 'endTime', value: string) => {
    setForm({
      ...form,
      schedule: {
        ...form.schedule,
        [day]: {
          ...form.schedule[day],
          [field]: value,
        },
      },
    })
  }

  return (
    <Portal>
      <Modal open={open} onClose={onClose} title={editBatch ? 'Edit Batch' : 'Add New Batch'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="modal-body max-h-[70vh] overflow-y-auto portal-scrollbar">
            {error && <Alert type="error" message={error} onClose={() => setError('')} />}

            {loadingData ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="md" />
              </div>
            ) : (
              <>
                {/* Course Selection */}
                <div>
                  <label className="input-label">
                    Course <span style={{ color: 'var(--color-danger-500)' }}>*</span>
                  </label>
                  <select
                    className="input-clean"
                    value={form.courseId}
                    onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                    required
                  >
                    <option value="">Select Course</option>
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.name} ({course.code})
                      </option>
                    ))}
                  </select>
                  {courses.length === 0 && (
                    <p className="input-hint text-warning">No active courses available. Create a course first.</p>
                  )}
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">
                      Batch Code <span style={{ color: 'var(--color-danger-500)' }}>*</span>
                    </label>
                    <input
                      className="input-clean"
                      value={form.batchCode}
                      onChange={(e) => setForm({ ...form, batchCode: e.target.value.toUpperCase() })}
                      placeholder="e.g., TALLY-B1"
                      required
                    />
                    <p className="input-hint">Unique identifier for this batch</p>
                  </div>

                  <div>
                    <label className="input-label">
                      Batch Name <span style={{ color: 'var(--color-danger-500)' }}>*</span>
                    </label>
                    <input
                      className="input-clean"
                      value={form.batchName}
                      onChange={(e) => setForm({ ...form, batchName: e.target.value })}
                      placeholder="e.g., Tally Morning Batch"
                      required
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">
                      Start Date <span style={{ color: 'var(--color-danger-500)' }}>*</span>
                    </label>
                    <input
                      type="date"
                      className="input-clean"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="input-label">
                      End Date <span style={{ color: 'var(--color-danger-500)' }}>*</span>
                    </label>
                    <input
                      type="date"
                      className="input-clean"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Instructor & Capacity */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">
                      Instructor <span style={{ color: 'var(--color-danger-500)' }}>*</span>
                    </label>
                    <select
                      className="input-clean"
                      value={form.instructorId}
                      onChange={(e) => setForm({ ...form, instructorId: e.target.value })}
                      required
                    >
                      <option value="">Select Instructor</option>
                      {instructors.map((staff) => (
                        <option key={staff._id} value={staff._id}>
                          {staff.fullName} ({staff.employeeId})
                        </option>
                      ))}
                    </select>
                    {instructors.length === 0 && (
                      <p className="input-hint text-warning">No active staff available</p>
                    )}
                  </div>

                  <div>
                    <label className="input-label">
                      Max Students <span style={{ color: 'var(--color-danger-500)' }}>*</span>
                    </label>
                    <input
                      type="number"
                      className="input-clean"
                      value={form.maxStudents}
                      onChange={(e) => setForm({ ...form, maxStudents: parseInt(e.target.value) || 1 })}
                      min="1"
                      required
                    />
                    <p className="input-hint">Batch capacity limit</p>
                  </div>
                </div>

                {/* Status */}
                {editBatch && (
                  <div>
                    <label className="input-label">Status</label>
                    <select
                      className="input-clean"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Schedule */}
                <div
                  className="p-4 rounded-xl"
                  style={{ backgroundColor: 'var(--color-primary-50)', border: '1px solid var(--color-primary-200)' }}
                >
                  <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--color-primary-800)' }}>
                    Weekly Schedule
                  </h4>
                  <div className="space-y-2">
                    {DAYS.map((day) => (
                      <div key={day} className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer min-w-[120px]">
                          <input
                            type="checkbox"
                            checked={!!form.schedule[day]}
                            onChange={() => toggleScheduleDay(day)}
                            className="rounded"
                          />
                          <span className="text-sm font-medium">{DAY_LABELS[day]}</span>
                        </label>

                        {form.schedule[day] && (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="time"
                              className="input-clean"
                              value={form.schedule[day].startTime}
                              onChange={(e) => updateScheduleTime(day, 'startTime', e.target.value)}
                            />
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>to</span>
                            <input
                              type="time"
                              className="input-clean"
                              value={form.schedule[day].endTime}
                              onChange={(e) => updateScheduleTime(day, 'endTime', e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || loadingData}>
              {loading ? <Spinner size="sm" /> : null}
              {loading ? 'Saving...' : editBatch ? 'Update Batch' : 'Create Batch'}
            </Button>
          </div>
        </form>
      </Modal>
    </Portal>
  )
}