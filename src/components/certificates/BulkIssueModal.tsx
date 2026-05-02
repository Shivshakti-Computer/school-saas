// FILE: src/components/certificates/BulkIssueModal.tsx
// UPDATED: Franchise selector + production-ready
// ═══════════════════════════════════════════════════════════

'use client'

import { useState, useEffect } from 'react'
import { Users, Info, Building2, ChevronDown, X } from 'lucide-react'
import { Button, Input, Select, Alert, Spinner } from '@/components/ui'

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

interface FranchiseOption {
    _id: string
    franchiseName: string
    franchiseCode: string
    city: string
    state: string
    logo?: string
}

interface BulkIssueModalProps {
    template: {
        _id: string
        name: string
        type: string
        applicableTo: string
    }
    institutionType: 'school' | 'academy' | 'coaching'
    classes?: Array<{ name: string; displayName: string }>
    sections?: Array<{ name: string }>
    onSuccess: (result: { count: number }) => void
    onCancel: () => void
    // ✅ NEW: Optional franchise context
    defaultFranchiseId?: string
    showFranchiseSelector?: boolean
}

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────

export function BulkIssueModal({
    template,
    institutionType,
    classes = [],
    sections = [],
    onSuccess,
    onCancel,
    defaultFranchiseId,
    showFranchiseSelector = false,
}: BulkIssueModalProps) {
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [previewing, setPreviewing] = useState(false)
    const [preview, setPreview] = useState<{
        count: number
        samples: string[]
    } | null>(null)

    // Form
    const [form, setForm] = useState({
        recipientType: template.applicableTo === 'staff' ? 'staff' : 'student',
        filterBy: 'class' as 'class' | 'all',
        class: '',
        section: '',
        titleTemplate: '',
        academicYear: '',
    })

    // Franchise
    const [franchises, setFranchises] = useState<FranchiseOption[]>([])
    const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>(
        defaultFranchiseId || ''
    )
    const [showFranchiseDropdown, setShowFranchiseDropdown] = useState(false)
    const [loadingFranchises, setLoadingFranchises] = useState(false)

    // ── Fetch Franchises ───────────────────────────────────────

    useEffect(() => {
        if (!showFranchiseSelector) return

        const fetchFranchises = async () => {
            setLoadingFranchises(true)
            try {
                const res = await fetch('/api/franchises?status=active&limit=100')
                const data = await res.json()
                setFranchises(data.franchises || [])
            } catch {
                setFranchises([])
            } finally {
                setLoadingFranchises(false)
            }
        }

        fetchFranchises()
    }, [showFranchiseSelector])

    // ── Selected Franchise Info ────────────────────────────────

    const selectedFranchise = franchises.find(f => f._id === selectedFranchiseId)

    // ── Preview Recipients ─────────────────────────────────────

    const handlePreview = async () => {
        if (!form.titleTemplate.trim()) {
            setError('Title template is required')
            return
        }

        setPreviewing(true)
        setError(null)

        try {
            const params = new URLSearchParams({
                search: '',
                limit: '3',
            })
            if (form.class) params.set('class', form.class)
            if (form.section) params.set('section', form.section)

            const res = await fetch(`/api/students/list?${params}`)
            const data = await res.json()

            const students = data.students || []
            const samples = students.map((s: any) => {
                const name = s.userId?.name || s.name || 'Student'
                return form.titleTemplate.replace(
                    /\{\{recipientName\}\}/g,
                    name
                )
            })

            setPreview({
                count: data.total || samples.length,
                samples,
            })
        } catch {
            setError('Failed to fetch preview')
        } finally {
            setPreviewing(false)
        }
    }

    // ── Submit ─────────────────────────────────────────────────

    const handleBulkIssue = async () => {
        setError(null)

        if (!form.titleTemplate.trim()) {
            setError('Title template is required')
            return
        }

        if (
            institutionType === 'school' &&
            form.recipientType === 'student' &&
            form.filterBy === 'class' &&
            !form.class
        ) {
            setError('Please select a class')
            return
        }

        setSaving(true)

        try {
            const payload: Record<string, any> = {
                action: 'bulk_issue',
                templateId: template._id,
                recipientType: form.recipientType,
                titleTemplate: form.titleTemplate,
                commonData: form.academicYear
                    ? { academicYear: form.academicYear }
                    : {},
            }

            if (form.filterBy === 'class') {
                if (form.class) payload.class = form.class
                if (form.section) payload.section = form.section
            }

            // ✅ NEW: Include franchiseId if selected
            if (selectedFranchiseId) {
                payload.franchiseId = selectedFranchiseId
            }

            const res = await fetch('/api/certificates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || 'Failed to issue certificates')
            }

            onSuccess({ count: data.count })
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    // ── Class/Section options ──────────────────────────────────

    const classOptions = [
        { value: '', label: 'All Classes' },
        ...classes.map(c => ({ value: c.name, label: c.displayName })),
    ]

    const sectionOptions = [
        { value: '', label: 'All Sections' },
        ...sections.map(s => ({ value: s.name, label: `Section ${s.name}` })),
    ]

    // ── Render ─────────────────────────────────────────────────

    return (
        <div className="space-y-5">
            {error && (
                <Alert
                    type="error"
                    message={error}
                    onClose={() => setError(null)}
                />
            )}

            {/* Info Banner */}
            <div
                className="flex gap-3 p-3 rounded-[var(--radius-md)] border"
                style={{
                    background: 'var(--info-light)',
                    borderColor: 'rgba(59,130,246,0.2)',
                }}
            >
                <Info
                    size={16}
                    style={{ color: 'var(--info)', flexShrink: 0, marginTop: 2 }}
                />
                <div>
                    <p
                        className="text-sm font-medium"
                        style={{ color: 'var(--info-dark)' }}
                    >
                        Bulk Issue: {template.name}
                    </p>
                    <p
                        className="text-xs mt-0.5"
                        style={{ color: 'var(--info-dark)' }}
                    >
                        Individual certificates will be created for all matching
                        recipients. Use{' '}
                        <code className="font-mono bg-white px-1 rounded">
                            {'{{recipientName}}'}
                        </code>{' '}
                        in the title — it will be replaced automatically.
                    </p>
                </div>
            </div>

            {/* ✅ NEW: Franchise Selector */}
            {showFranchiseSelector && (
                <div>
                    <label className="input-label">
                        Franchise Branch (Optional)
                    </label>
                    <p
                        className="text-xs mb-2"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        Leave empty to issue from main institution
                    </p>

                    {selectedFranchiseId && selectedFranchise ? (
                        <div
                            className="flex items-center gap-3 px-4 py-3
                                       rounded-[var(--radius-md)] border"
                            style={{
                                background: 'var(--primary-50)',
                                borderColor: 'var(--primary-200)',
                            }}
                        >
                            {selectedFranchise.logo && (
                                <img
                                    src={selectedFranchise.logo}
                                    alt={selectedFranchise.franchiseName}
                                    className="w-8 h-8 rounded-lg object-contain border"
                                    style={{ borderColor: 'var(--border)' }}
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <p
                                    className="text-sm font-semibold truncate"
                                    style={{ color: 'var(--primary-700)' }}
                                >
                                    {selectedFranchise.franchiseName}
                                </p>
                                <p
                                    className="text-xs"
                                    style={{ color: 'var(--primary-600)' }}
                                >
                                    {selectedFranchise.franchiseCode} •{' '}
                                    {selectedFranchise.city},{' '}
                                    {selectedFranchise.state}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedFranchiseId('')}
                                className="p-1 rounded-full hover:bg-[var(--primary-100)]
                                           transition-colors"
                            >
                                <X
                                    size={14}
                                    style={{ color: 'var(--primary-600)' }}
                                />
                            </button>
                        </div>
                    ) : (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowFranchiseDropdown(p => !p)}
                                disabled={loadingFranchises}
                                className="w-full flex items-center justify-between
                                           h-10 px-3 text-sm rounded-[var(--radius-md)]
                                           border border-[var(--border)] transition-colors
                                           hover:border-[var(--primary-400)]"
                                style={{
                                    background: 'var(--bg-card)',
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                <span className="flex items-center gap-2">
                                    <Building2
                                        size={15}
                                        style={{ color: 'var(--text-muted)' }}
                                    />
                                    {loadingFranchises
                                        ? 'Loading franchises...'
                                        : franchises.length === 0
                                            ? 'No franchises available'
                                            : 'Select franchise branch...'}
                                </span>
                                <ChevronDown
                                    size={15}
                                    style={{ color: 'var(--text-muted)' }}
                                    className={`transition-transform ${showFranchiseDropdown ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {showFranchiseDropdown && franchises.length > 0 && (
                                <div
                                    className="absolute z-20 top-full mt-1 w-full
                                               rounded-[var(--radius-md)] border
                                               border-[var(--border)] overflow-hidden
                                               shadow-[var(--shadow-lg)] max-h-48
                                               overflow-y-auto"
                                    style={{ background: 'var(--bg-card)' }}
                                >
                                    {franchises.map(franchise => (
                                        <button
                                            key={franchise._id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedFranchiseId(franchise._id)
                                                setShowFranchiseDropdown(false)
                                            }}
                                            className="w-full flex items-center gap-3
                                                       px-4 py-3 text-left transition-colors
                                                       hover:bg-[var(--bg-muted)]"
                                        >
                                            {franchise.logo ? (
                                                <img
                                                    src={franchise.logo}
                                                    alt={franchise.franchiseName}
                                                    className="w-8 h-8 rounded-lg object-contain border"
                                                    style={{ borderColor: 'var(--border)' }}
                                                />
                                            ) : (
                                                <div
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                    style={{
                                                        background: 'var(--primary-50)',
                                                        color: 'var(--primary-500)',
                                                    }}
                                                >
                                                    <Building2 size={14} />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p
                                                    className="text-sm font-medium truncate"
                                                    style={{ color: 'var(--text-primary)' }}
                                                >
                                                    {franchise.franchiseName}
                                                </p>
                                                <p
                                                    className="text-xs"
                                                    style={{ color: 'var(--text-muted)' }}
                                                >
                                                    {franchise.franchiseCode} •{' '}
                                                    {franchise.city}, {franchise.state}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Recipient Type Toggle */}
            {template.applicableTo === 'both' && (
                <div
                    className="flex rounded-[var(--radius-md)] border
                               border-[var(--border)] overflow-hidden"
                >
                    {(['student', 'staff'] as const).map(type => (
                        <button
                            key={type}
                            type="button"
                            onClick={() =>
                                setForm(p => ({
                                    ...p,
                                    recipientType: type,
                                    class: '',
                                    section: '',
                                }))
                            }
                            className="flex-1 py-2 text-sm font-medium transition-colors capitalize"
                            style={{
                                background:
                                    form.recipientType === type
                                        ? 'var(--primary-500)'
                                        : 'var(--bg-card)',
                                color:
                                    form.recipientType === type
                                        ? '#ffffff'
                                        : 'var(--text-secondary)',
                            }}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            )}

            {/* Class / Section Filter (School only) */}
            {institutionType === 'school' &&
                form.recipientType === 'student' && (
                    <div className="grid grid-cols-2 gap-3">
                        <Select
                            label="Filter by Class"
                            value={form.class}
                            onChange={e =>
                                setForm(p => ({ ...p, class: e.target.value }))
                            }
                            options={classOptions}
                        />
                        <Select
                            label="Filter by Section"
                            value={form.section}
                            onChange={e =>
                                setForm(p => ({
                                    ...p,
                                    section: e.target.value,
                                }))
                            }
                            options={sectionOptions}
                        />
                    </div>
                )}

            {/* Title Template */}
            <div>
                <Input
                    label="Title Template *"
                    value={form.titleTemplate}
                    onChange={e =>
                        setForm(p => ({
                            ...p,
                            titleTemplate: e.target.value,
                        }))
                    }
                    placeholder="e.g. Certificate of Merit — {{recipientName}}"
                />
                <p className="input-hint">
                    Use {'{{recipientName}}'} to auto-fill each
                    recipient's name
                </p>
            </div>

            {/* Academic Year */}
            <Input
                label="Academic Year (optional)"
                value={form.academicYear}
                onChange={e =>
                    setForm(p => ({ ...p, academicYear: e.target.value }))
                }
                placeholder="e.g. 2024-25"
            />

            {/* Preview */}
            <div>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={handlePreview}
                    loading={previewing}
                    disabled={!form.titleTemplate.trim()}
                >
                    Preview Recipients
                </Button>

                {preview && (
                    <div
                        className="mt-3 p-3 rounded-[var(--radius-md)] border
                                   border-[var(--border)]"
                        style={{ background: 'var(--bg-subtle)' }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Users
                                size={14}
                                style={{ color: 'var(--primary-500)' }}
                            />
                            <p
                                className="text-sm font-semibold"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {preview.count} certificates will be issued
                                {selectedFranchise && (
                                    <span
                                        className="ml-2 text-xs font-normal"
                                        style={{ color: 'var(--text-muted)' }}
                                    >
                                        via {selectedFranchise.franchiseName}
                                    </span>
                                )}
                            </p>
                        </div>
                        <p
                            className="text-xs mb-2"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            Sample titles:
                        </p>
                        {preview.samples.map((s, i) => (
                            <p
                                key={i}
                                className="text-xs py-1 border-b border-[var(--border)] last:border-0"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                {s}
                            </p>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-2">
                <Button
                    variant="ghost"
                    onClick={onCancel}
                    disabled={saving}
                >
                    Cancel
                </Button>
                <Button onClick={handleBulkIssue} loading={saving}>
                    <Users size={15} />
                    Issue to All
                    {selectedFranchise && (
                        <span className="ml-1 text-xs opacity-80">
                            ({selectedFranchise.franchiseCode})
                        </span>
                    )}
                </Button>
            </div>
        </div>
    )
}