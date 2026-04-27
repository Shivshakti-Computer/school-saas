// FILE: src/components/courses/CourseForm.tsx
// Add/Edit Course Modal — Production Ready
// ═══════════════════════════════════════════════════════════

'use client'

import { useState, useEffect } from 'react'
import { Modal, Button, Spinner, Alert } from '@/components/ui'
import { X, Plus, Trash2, Info } from 'lucide-react'
import { Portal } from '../ui/Portal'

interface CourseFormProps {
    open: boolean
    onClose: () => void
    onSuccess: (message: string) => void
    editCourse?: any
    institutionType: 'academy' | 'coaching'
}

const DURATION_TYPES = [
    { value: 'days', label: 'Days' },
    { value: 'weeks', label: 'Weeks' },
    { value: 'months', label: 'Months' },
    { value: 'custom', label: 'Custom' },
]

const FEE_TYPES = [
    { value: 'one-time', label: 'One-time Payment' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'installment', label: 'Installments' },
]

export function CourseForm({
    open,
    onClose,
    onSuccess,
    editCourse,
    institutionType,
}: CourseFormProps) {
    const [form, setForm] = useState({
        name: '',
        code: '',
        category: '',
        durationType: 'months',
        durationValue: 3,
        customDurationText: '',
        feeAmount: 0,
        feeType: 'one-time',
        installments: {
            number: 2,
            dueDay: 5,
        },
        description: '',
        syllabus: [] as string[],
        prerequisites: [] as string[],
        learningOutcomes: [] as string[],
        maxStudents: 30,
        minStudents: 5,
        isActive: true,
        certificateEligible: true,
    })

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [syllabusInput, setSyllabusInput] = useState('')
    const [prerequisiteInput, setPrerequisiteInput] = useState('')
    const [outcomeInput, setOutcomeInput] = useState('')

    useEffect(() => {
        if (editCourse) {
            setForm({
                name: editCourse.name || '',
                code: editCourse.code || '',
                category: editCourse.category || '',
                durationType: editCourse.durationType || 'months',
                durationValue: editCourse.durationValue || 3,
                customDurationText: editCourse.customDurationText || '',
                feeAmount: editCourse.feeAmount || 0,
                feeType: editCourse.feeType || 'one-time',
                installments: editCourse.installments || { number: 2, dueDay: 5 },
                description: editCourse.description || '',
                syllabus: editCourse.syllabus || [],
                prerequisites: editCourse.prerequisites || [],
                learningOutcomes: editCourse.learningOutcomes || [],
                maxStudents: editCourse.maxStudents || 30,
                minStudents: editCourse.minStudents || 5,
                isActive: editCourse.isActive !== false,
                certificateEligible: editCourse.certificateEligible !== false,
            })
        }
    }, [editCourse])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Validation
        if (!form.name.trim()) {
            setError('Course name is required')
            return
        }
        if (!form.code.trim()) {
            setError('Course code is required')
            return
        }
        if (!form.category.trim()) {
            setError('Category is required')
            return
        }
        if (form.feeAmount < 0) {
            setError('Fee amount must be positive')
            return
        }
        if (form.durationValue < 1) {
            setError('Duration must be at least 1')
            return
        }

        if (form.feeType === 'installment') {
            if (form.installments.number < 2) {
                setError('Installments must be at least 2')
                return
            }
            if (form.installments.dueDay < 1 || form.installments.dueDay > 28) {
                setError('Due day must be between 1 and 28')
                return
            }
        }

        setLoading(true)

        try {
            const url = editCourse
                ? `/api/courses/${editCourse._id}`
                : '/api/courses'

            const res = await fetch(url, {
                method: editCourse ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Failed to save course')
                return
            }

            onSuccess(data.message || 'Course saved successfully')
            onClose()
        } catch (err: any) {
            setError(err.message || 'Network error')
        } finally {
            setLoading(false)
        }
    }

    const addToList = (list: string[], value: string, setter: (val: string[]) => void, inputSetter: (val: string) => void) => {
        const trimmed = value.trim()
        if (trimmed && !list.includes(trimmed)) {
            setter([...list, trimmed])
            inputSetter('')
        }
    }

    const removeFromList = (list: string[], index: number, setter: (val: string[]) => void) => {
        setter(list.filter((_, i) => i !== index))
    }

    return (
        <Portal>
            <Modal open={open} onClose={onClose} title={editCourse ? 'Edit Course' : 'Add New Course'} size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="modal-body max-h-[70vh] overflow-y-auto portal-scrollbar">
                        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="input-label">Course Name <span style={{ color: 'var(--color-danger-500)' }}>*</span></label>
                                <input
                                    className="input-clean"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g., Tally with GST"
                                    required
                                />
                            </div>

                            <div>
                                <label className="input-label">Course Code <span style={{ color: 'var(--color-danger-500)' }}>*</span></label>
                                <input
                                    className="input-clean"
                                    value={form.code}
                                    onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                    placeholder="e.g., TALLY-GST"
                                    required
                                />
                                <p className="input-hint">Unique identifier for this course</p>
                            </div>

                            <div>
                                <label className="input-label">Category <span style={{ color: 'var(--color-danger-500)' }}>*</span></label>
                                <input
                                    className="input-clean"
                                    value={form.category}
                                    onChange={e => setForm({ ...form, category: e.target.value })}
                                    placeholder="e.g., Accounting Software"
                                    required
                                />
                            </div>
                        </div>

                        {/* Duration */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="input-label">Duration Type</label>
                                <select
                                    className="input-clean"
                                    value={form.durationType}
                                    onChange={e => setForm({ ...form, durationType: e.target.value })}
                                >
                                    {DURATION_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>

                            {form.durationType !== 'custom' ? (
                                <div>
                                    <label className="input-label">Duration Value</label>
                                    <input
                                        type="number"
                                        className="input-clean"
                                        value={form.durationValue}
                                        onChange={e => setForm({ ...form, durationValue: parseInt(e.target.value) || 1 })}
                                        min="1"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="input-label">Custom Duration Text</label>
                                    <input
                                        className="input-clean"
                                        value={form.customDurationText}
                                        onChange={e => setForm({ ...form, customDurationText: e.target.value })}
                                        placeholder="e.g., 6 weeks intensive"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Fee Settings */}
                        <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-info-50)', border: '1px solid var(--color-info-200)' }}>
                            <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--color-info-800)' }}>Fee Structure</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="input-label">Fee Type</label>
                                    <select
                                        className="input-clean"
                                        value={form.feeType}
                                        onChange={e => setForm({ ...form, feeType: e.target.value })}
                                    >
                                        {FEE_TYPES.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="input-label">Total Fee Amount <span style={{ color: 'var(--color-danger-500)' }}>*</span></label>
                                    <input
                                        type="number"
                                        className="input-clean"
                                        value={form.feeAmount}
                                        onChange={e => setForm({ ...form, feeAmount: parseFloat(e.target.value) || 0 })}
                                        min="0"
                                        required
                                    />
                                </div>

                                {form.feeType === 'installment' && (
                                    <>
                                        <div>
                                            <label className="input-label">Number of Installments</label>
                                            <input
                                                type="number"
                                                className="input-clean"
                                                value={form.installments.number}
                                                onChange={e => setForm({
                                                    ...form,
                                                    installments: { ...form.installments, number: parseInt(e.target.value) || 2 }
                                                })}
                                                min="2"
                                            />
                                        </div>
                                        <div>
                                            <label className="input-label">Due Day of Month</label>
                                            <input
                                                type="number"
                                                className="input-clean"
                                                value={form.installments.dueDay}
                                                onChange={e => setForm({
                                                    ...form,
                                                    installments: { ...form.installments, dueDay: parseInt(e.target.value) || 5 }
                                                })}
                                                min="1"
                                                max="28"
                                            />
                                            <p className="input-hint">Day of month (1-28)</p>
                                        </div>

                                        <div className="col-span-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-success-50)' }}>
                                            <p className="text-xs" style={{ color: 'var(--color-success-700)' }}>
                                                ₹{Math.ceil(form.feeAmount / form.installments.number).toLocaleString('en-IN')} per installment
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="input-label">Description</label>
                            <textarea
                                className="input-clean"
                                rows={3}
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                placeholder="Course overview and details..."
                            />
                        </div>

                        {/* Syllabus */}
                        <div>
                            <label className="input-label">Syllabus Topics</label>
                            <div className="flex gap-2">
                                <input
                                    className="input-clean flex-1"
                                    value={syllabusInput}
                                    onChange={e => setSyllabusInput(e.target.value)}
                                    placeholder="Add topic and press Enter"
                                    onKeyPress={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            addToList(form.syllabus, syllabusInput, (val) => setForm({ ...form, syllabus: val }), setSyllabusInput)
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => addToList(form.syllabus, syllabusInput, (val) => setForm({ ...form, syllabus: val }), setSyllabusInput)}
                                >
                                    <Plus size={14} />
                                </Button>
                            </div>
                            {form.syllabus.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {form.syllabus.map((item, i) => (
                                        <span
                                            key={i}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                                            style={{ backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-700)' }}
                                        >
                                            {item}
                                            <button
                                                type="button"
                                                onClick={() => removeFromList(form.syllabus, i, (val) => setForm({ ...form, syllabus: val }))}
                                                className="hover:opacity-70"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Prerequisites */}
                        <div>
                            <label className="input-label">Prerequisites</label>
                            <div className="flex gap-2">
                                <input
                                    className="input-clean flex-1"
                                    value={prerequisiteInput}
                                    onChange={e => setPrerequisiteInput(e.target.value)}
                                    placeholder="Add prerequisite"
                                    onKeyPress={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            addToList(form.prerequisites, prerequisiteInput, (val) => setForm({ ...form, prerequisites: val }), setPrerequisiteInput)
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => addToList(form.prerequisites, prerequisiteInput, (val) => setForm({ ...form, prerequisites: val }), setPrerequisiteInput)}
                                >
                                    <Plus size={14} />
                                </Button>
                            </div>
                            {form.prerequisites.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {form.prerequisites.map((item, i) => (
                                        <span
                                            key={i}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                                            style={{ backgroundColor: 'var(--color-warning-50)', color: 'var(--color-warning-700)' }}
                                        >
                                            {item}
                                            <button
                                                type="button"
                                                onClick={() => removeFromList(form.prerequisites, i, (val) => setForm({ ...form, prerequisites: val }))}
                                                className="hover:opacity-70"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Learning Outcomes */}
                        <div>
                            <label className="input-label">Learning Outcomes</label>
                            <div className="flex gap-2">
                                <input
                                    className="input-clean flex-1"
                                    value={outcomeInput}
                                    onChange={e => setOutcomeInput(e.target.value)}
                                    placeholder="Add learning outcome"
                                    onKeyPress={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            addToList(form.learningOutcomes, outcomeInput, (val) => setForm({ ...form, learningOutcomes: val }), setOutcomeInput)
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => addToList(form.learningOutcomes, outcomeInput, (val) => setForm({ ...form, learningOutcomes: val }), setOutcomeInput)}
                                >
                                    <Plus size={14} />
                                </Button>
                            </div>
                            {form.learningOutcomes.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {form.learningOutcomes.map((item, i) => (
                                        <span
                                            key={i}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                                            style={{ backgroundColor: 'var(--color-success-50)', color: 'var(--color-success-700)' }}
                                        >
                                            {item}
                                            <button
                                                type="button"
                                                onClick={() => removeFromList(form.learningOutcomes, i, (val) => setForm({ ...form, learningOutcomes: val }))}
                                                className="hover:opacity-70"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Capacity */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="input-label">Max Students</label>
                                <input
                                    type="number"
                                    className="input-clean"
                                    value={form.maxStudents}
                                    onChange={e => setForm({ ...form, maxStudents: parseInt(e.target.value) || 30 })}
                                    min="1"
                                />
                            </div>
                            <div>
                                <label className="input-label">Min Students</label>
                                <input
                                    type="number"
                                    className="input-clean"
                                    value={form.minStudents}
                                    onChange={e => setForm({ ...form, minStudents: parseInt(e.target.value) || 5 })}
                                    min="1"
                                />
                            </div>
                        </div>

                        {/* Toggles */}
                        <div className="grid grid-cols-2 gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.isActive}
                                    onChange={e => setForm({ ...form, isActive: e.target.checked })}
                                    className="rounded"
                                />
                                <span className="text-sm font-medium">Active Course</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.certificateEligible}
                                    onChange={e => setForm({ ...form, certificateEligible: e.target.checked })}
                                    className="rounded"
                                />
                                <span className="text-sm font-medium">Certificate Eligible</span>
                            </label>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Spinner size="sm" /> : null}
                            {loading ? 'Saving...' : editCourse ? 'Update Course' : 'Create Course'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </Portal>
    )
}