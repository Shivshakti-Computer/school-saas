// FILE: src/components/certificates/IssueModal.tsx
// UPDATED: Franchise selector + production-ready
// Zero breaking changes — franchiseId is optional
// ═══════════════════════════════════════════════════════════

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Award, Search, User, Building2, ChevronDown, X } from 'lucide-react'
import { Button, Input, Alert, Spinner } from '@/components/ui'

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

interface Template {
    _id: string
    name: string
    type: string
    applicableTo: string
    fields: Array<{
        name: string
        type: string
        required: boolean
        placeholder?: string
    }>
}

interface Recipient {
    _id: string
    name: string
    identifier: string
    class?: string
    section?: string
    academicYear?: string
    courseName?: string
}

interface FranchiseOption {
    _id: string
    franchiseName: string
    franchiseCode: string
    city: string
    state: string
    logo?: string
}

interface IssueModalProps {
    template: Template
    institutionType: 'school' | 'academy' | 'coaching'
    onSuccess: (issued: any) => void
    onCancel: () => void
    // ✅ NEW: Optional franchise context
    defaultFranchiseId?: string
    showFranchiseSelector?: boolean
}

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────

export function IssueModal({
    template,
    institutionType,
    onSuccess,
    onCancel,
    defaultFranchiseId,
    showFranchiseSelector = false,
}: IssueModalProps) {
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Recipient
    const [searchQuery, setSearchQuery] = useState('')
    const [searching, setSearching] = useState(false)
    const [recipients, setRecipients] = useState<Recipient[]>([])
    const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null)
    const [recipientType, setRecipientType] = useState<'student' | 'staff'>(
        template.applicableTo === 'staff' ? 'staff' : 'student'
    )

    // Franchise
    const [franchises, setFranchises] = useState<FranchiseOption[]>([])
    const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>(
        defaultFranchiseId || ''
    )
    const [showFranchiseDropdown, setShowFranchiseDropdown] = useState(false)
    const [loadingFranchises, setLoadingFranchises] = useState(false)

    // Form
    const [form, setForm] = useState({
        title: '',
        customData: {} as Record<string, string>,
    })

    // ── Fetch Franchises (if selector enabled) ─────────────────

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

    // ── Search Recipients ──────────────────────────────────────

    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) {
            setRecipients([])
            return
        }

        const timer = setTimeout(async () => {
            setSearching(true)
            try {
                const endpoint =
                    recipientType === 'student'
                        ? `/api/students/list?search=${encodeURIComponent(searchQuery)}&limit=10`
                        : `/api/staff?search=${encodeURIComponent(searchQuery)}&limit=10`

                const res = await fetch(endpoint)
                const data = await res.json()

                if (recipientType === 'student') {
                    setRecipients(
                        (data.students || []).map((s: any) => ({
                            _id: s._id,
                            name: s.userId?.name || 'Unknown Student',
                            identifier: s.admissionNo,
                            class: s.class,
                            section: s.section,
                            academicYear: s.academicYear,
                        }))
                    )
                } else {
                    setRecipients(
                        (data.staff || []).map((s: any) => ({
                            _id: s._id,
                            name: s.fullName || s.name || 'Unknown',
                            identifier: s.employeeId || s.empId || '',
                        }))
                    )
                }
            } catch {
                setRecipients([])
            } finally {
                setSearching(false)
            }
        }, 350)

        return () => clearTimeout(timer)
    }, [searchQuery, recipientType])

    // ── Selected Franchise Info ────────────────────────────────

    const selectedFranchise = franchises.find(f => f._id === selectedFranchiseId)

    // ── Clear Franchise ────────────────────────────────────────

    const clearFranchise = useCallback(() => {
        setSelectedFranchiseId('')
        setShowFranchiseDropdown(false)
    }, [])

    // ── Submit ─────────────────────────────────────────────────

    const handleIssue = async () => {
        setError(null)

        if (!selectedRecipient) {
            setError('Please select a recipient')
            return
        }
        if (!form.title.trim()) {
            setError('Certificate title is required')
            return
        }

        // Auto-populate recipientName
        const enrichedCustomData = { ...form.customData }
        const hasRecipientNameField = template.fields.some(
            f => f.name === 'recipientName'
        )

        if (hasRecipientNameField && selectedRecipient) {
            enrichedCustomData.recipientName = selectedRecipient.name
        }

        // Validate required fields
        const requiredFields = template.fields.filter(f => f.required)
        for (const field of requiredFields) {
            if (field.name === 'recipientName' && hasRecipientNameField) continue

            if (!enrichedCustomData[field.name]?.trim()) {
                setError(`Field "${field.name}" is required`)
                return
            }
        }

        setSaving(true)

        try {
            const payload: Record<string, any> = {
                action: 'issue',
                templateId: template._id,
                recipientType,
                recipientId: selectedRecipient._id,
                title: form.title,
                class: selectedRecipient.class,
                section: selectedRecipient.section,
                academicYear: selectedRecipient.academicYear,
                courseName: selectedRecipient.courseName,
                customData: enrichedCustomData,
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
            if (!res.ok) throw new Error(data.error || 'Failed to issue certificate')

            onSuccess(data.issued)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    // ── Render ─────────────────────────────────────────────────

    return (
        <div className="space-y-5">
            {error && (
                <Alert type="error" message={error} onClose={() => setError(null)} />
            )}

            {/* ✅ NEW: Franchise Selector */}
            {showFranchiseSelector && (
                <div>
                    <label className="input-label">
                        Franchise Branch (Optional)
                    </label>
                    <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                        Leave empty to issue from main institution
                    </p>

                    {/* Selected Franchise Display */}
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
                                    {selectedFranchise.city}, {selectedFranchise.state}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={clearFranchise}
                                className="p-1 rounded-full hover:bg-[var(--primary-100)]
                                           transition-colors"
                            >
                                <X size={14} style={{ color: 'var(--primary-600)' }} />
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

                            {/* Dropdown */}
                            {showFranchiseDropdown && franchises.length > 0 && (
                                <div
                                    className="absolute z-20 top-full mt-1 w-full
                                               rounded-[var(--radius-md)] border
                                               border-[var(--border)] shadow-[var(--shadow-lg)]
                                               overflow-hidden max-h-48 overflow-y-auto"
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
                                            className="w-full flex items-center gap-3 px-4 py-3
                                                       text-left transition-colors
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
                            onClick={() => {
                                setRecipientType(type)
                                setSelectedRecipient(null)
                                setSearchQuery('')
                                setRecipients([])
                            }}
                            className="flex-1 py-2 text-sm font-medium transition-colors capitalize"
                            style={{
                                background:
                                    recipientType === type
                                        ? 'var(--primary-500)'
                                        : 'var(--bg-card)',
                                color:
                                    recipientType === type
                                        ? '#ffffff'
                                        : 'var(--text-secondary)',
                            }}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            )}

            {/* Recipient Search */}
            <div>
                <label className="input-label">Search Recipient *</label>
                <div className="relative">
                    <Search
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--text-muted)' }}
                    />
                    <input
                        type="text"
                        value={searchQuery || ''}
                        onChange={e => {
                            setSearchQuery(e.target.value || '')
                            setSelectedRecipient(null)
                        }}
                        placeholder={
                            recipientType === 'student'
                                ? 'Search by name or admission number...'
                                : 'Search by name or employee ID...'
                        }
                        className="input-clean pl-9"
                    />
                    {searching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Spinner size="sm" />
                        </div>
                    )}
                </div>

                {/* Search Results */}
                {recipients.length > 0 && !selectedRecipient && (
                    <div
                        className="mt-1 border border-[var(--border)]
                                   rounded-[var(--radius-md)]
                                   shadow-[var(--shadow-dropdown)] overflow-hidden
                                   max-h-48 overflow-y-auto"
                        style={{ background: 'var(--bg-card)' }}
                    >
                        {recipients.map(r => (
                            <button
                                key={r._id}
                                type="button"
                                onClick={() => {
                                    setSelectedRecipient(r)
                                    setSearchQuery(r.name)
                                    setRecipients([])
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5
                                           text-left transition-colors
                                           hover:bg-[var(--bg-muted)]"
                            >
                                <div
                                    className="w-8 h-8 rounded-full flex items-center
                                               justify-center flex-shrink-0 text-xs font-bold"
                                    style={{
                                        background: 'var(--primary-50)',
                                        color: 'var(--primary-600)',
                                    }}
                                >
                                    {r.name?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div>
                                    <p
                                        className="text-sm font-medium"
                                        style={{ color: 'var(--text-primary)' }}
                                    >
                                        {r.name || 'Unknown'}
                                    </p>
                                    <p
                                        className="text-xs"
                                        style={{ color: 'var(--text-muted)' }}
                                    >
                                        {r.identifier}
                                        {r.class && ` • Class ${r.class}`}
                                        {r.section && `-${r.section}`}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Selected Recipient */}
                {selectedRecipient && (
                    <div
                        className="mt-2 flex items-center gap-3 px-4 py-2.5
                                   rounded-[var(--radius-md)] border"
                        style={{
                            background: 'var(--success-light)',
                            borderColor: 'rgba(16,185,129,0.3)',
                        }}
                    >
                        <div
                            className="w-8 h-8 rounded-full flex items-center
                                       justify-center flex-shrink-0 text-xs font-bold"
                            style={{
                                background: 'rgba(16,185,129,0.2)',
                                color: 'var(--success-dark)',
                            }}
                        >
                            <User size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p
                                className="text-sm font-semibold truncate"
                                style={{ color: 'var(--success-dark)' }}
                            >
                                {selectedRecipient.name}
                            </p>
                            <p
                                className="text-xs"
                                style={{ color: 'var(--success-dark)' }}
                            >
                                {selectedRecipient.identifier}
                                {selectedRecipient.class &&
                                    ` • Class ${selectedRecipient.class}${selectedRecipient.section
                                        ? `-${selectedRecipient.section}`
                                        : ''}`}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedRecipient(null)
                                setSearchQuery('')
                            }}
                            className="text-xs font-medium"
                            style={{ color: 'var(--success-dark)' }}
                        >
                            Change
                        </button>
                    </div>
                )}
            </div>

            {/* Certificate Title */}
            <Input
                label="Certificate Title *"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. First Rank — Annual Examination 2024"
            />

            {/* Custom Fields */}
            {template.fields
                .filter(f => f.name !== 'recipientName')
                .map(field => (
                    <div key={field.name}>
                        <label className="input-label capitalize">
                            {field.name.replace(/([A-Z])/g, ' $1').trim()}
                            {field.required && (
                                <span style={{ color: 'var(--danger)' }}> *</span>
                            )}
                        </label>
                        <input
                            type={
                                field.type === 'date'
                                    ? 'date'
                                    : field.type === 'number'
                                        ? 'number'
                                        : 'text'
                            }
                            value={form.customData[field.name] || ''}
                            onChange={e =>
                                setForm(p => ({
                                    ...p,
                                    customData: {
                                        ...p.customData,
                                        [field.name]: e.target.value,
                                    },
                                }))
                            }
                            placeholder={field.placeholder || `Enter ${field.name}`}
                            className="input-clean"
                        />
                    </div>
                ))}

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={onCancel} disabled={saving}>
                    Cancel
                </Button>
                <Button onClick={handleIssue} loading={saving}>
                    <Award size={15} />
                    Issue Certificate
                </Button>
            </div>
        </div>
    )
}