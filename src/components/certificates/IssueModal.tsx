// FILE: src/components/certificates/IssueModal.tsx
// Issue single certificate to student or staff
// ═══════════════════════════════════════════════════════════

'use client'

import { useState, useEffect } from 'react'
import { Award, Search, User } from 'lucide-react'
import { Button, Input, Alert, Spinner } from '@/components/ui'

// ── Types ──────────────────────────────────────────────────

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

interface IssueModalProps {
    template: Template
    institutionType: 'school' | 'academy' | 'coaching'
    onSuccess: (issued: any) => void
    onCancel: () => void
}

// ── Component ──────────────────────────────────────────────

export function IssueModal({
    template,
    institutionType,
    onSuccess,
    onCancel,
}: IssueModalProps) {
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [searching, setSearching] = useState(false)
    const [recipients, setRecipients] = useState<Recipient[]>([])
    const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null)
    const [recipientType, setRecipientType] = useState<'student' | 'staff'>(
        template.applicableTo === 'staff' ? 'staff' : 'student'
    )

    const [form, setForm] = useState({
        title: '',
        customData: {} as Record<string, string>,
    })

    // ── Search recipients ──────────────────────────────────────
    useEffect(() => {
        if (searchQuery.length < 2) {
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
                            name: s.name,
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
                            name: s.fullName,
                            identifier: s.employeeId,
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

        const requiredFields = template.fields.filter(f => f.required)
        for (const field of requiredFields) {
            if (!form.customData[field.name]?.trim()) {
                setError(`Field "${field.name}" is required`)
                return
            }
        }

        setSaving(true)

        try {
            const payload = {
                action: 'issue',
                templateId: template._id,
                recipientType,
                recipientId: selectedRecipient._id,
                title: form.title,
                class: selectedRecipient.class,
                section: selectedRecipient.section,
                academicYear: selectedRecipient.academicYear,
                courseName: selectedRecipient.courseName,
                customData: form.customData,
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

            {/* Recipient Type Toggle */}
            {template.applicableTo === 'both' && (
                <div className="flex rounded-[var(--radius-md)] border border-[var(--border)] overflow-hidden">
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
                        value={searchQuery}
                        onChange={e => {
                            setSearchQuery(e.target.value)
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
                        className="mt-1 border border-[var(--border)] rounded-[var(--radius-md)]
                       shadow-[var(--shadow-dropdown)] overflow-hidden"
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
                                    {r.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p
                                        className="text-sm font-medium"
                                        style={{ color: 'var(--text-primary)' }}
                                    >
                                        {r.name}
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
                            className="w-8 h-8 rounded-full flex items-center justify-center
                         flex-shrink-0 text-xs font-bold"
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
                            <p className="text-xs" style={{ color: 'var(--success-dark)' }}>
                                {selectedRecipient.identifier}
                                {selectedRecipient.class &&
                                    ` • Class ${selectedRecipient.class}${selectedRecipient.section ? `-${selectedRecipient.section}` : ''}`}
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

            {/* Custom Fields (excluding recipientName — auto-filled) */}
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
                            type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
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