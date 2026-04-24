// FILE: src/components/certificates/BulkIssueModal.tsx
// Bulk issue certificates to class/section or custom selection
// ═══════════════════════════════════════════════════════════

'use client'

import { useState } from 'react'
import { Users, Info } from 'lucide-react'
import { Button, Input, Select, Alert, Spinner } from '@/components/ui'

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
}

export function BulkIssueModal({
    template,
    institutionType,
    classes = [],
    sections = [],
    onSuccess,
    onCancel,
}: BulkIssueModalProps) {
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [form, setForm] = useState({
        recipientType: template.applicableTo === 'staff' ? 'staff' : 'student',
        filterBy: 'class' as 'class' | 'all',
        class: '',
        section: '',
        titleTemplate: '',
        academicYear: '',
    })

    const [preview, setPreview] = useState<{
        count: number
        samples: string[]
    } | null>(null)
    const [previewing, setPreviewing] = useState(false)

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
                type: 'issued',
                ...(form.class && { class: form.class }),
                ...(form.section && { section: form.section }),
                limit: '3',
            })

            const res = await fetch(
                `/api/students/list?search=&limit=3${form.class ? `&class=${form.class}` : ''}${form.section ? `&section=${form.section}` : ''}`
            )
            const data = await res.json()
            const samples = (data.students || []).map(
                (s: any) =>
                    form.titleTemplate.replace(/\{\{recipientName\}\}/g, s.name)
            )

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

            const res = await fetch('/api/certificates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await res.json()
            if (!res.ok)
                throw new Error(data.error || 'Failed to issue certificates')

            onSuccess({ count: data.count })
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    // ── Class options ──────────────────────────────────────────
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
                <Alert type="error" message={error} onClose={() => setError(null)} />
            )}

            {/* Info Banner */}
            <div
                className="flex gap-3 p-3 rounded-[var(--radius-md)] border"
                style={{
                    background: 'var(--info-light)',
                    borderColor: 'rgba(59,130,246,0.2)',
                }}
            >
                <Info size={16} style={{ color: 'var(--info)', flexShrink: 0, marginTop: 2 }} />
                <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--info-dark)' }}>
                        Bulk Issue: {template.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--info-dark)' }}>
                        This will create individual certificates for all matching
                        recipients. Use{' '}
                        <code className="font-mono bg-white px-1 rounded">
                            {'{{recipientName}}'}
                        </code>{' '}
                        in the title template — it will be replaced automatically.
                    </p>
                </div>
            </div>

            {/* Recipient Type */}
            {template.applicableTo === 'both' && (
                <div className="flex rounded-[var(--radius-md)] border border-[var(--border)] overflow-hidden">
                    {(['student', 'staff'] as const).map(type => (
                        <button
                            key={type}
                            type="button"
                            onClick={() =>
                                setForm(p => ({ ...p, recipientType: type, class: '', section: '' }))
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
            {institutionType === 'school' && form.recipientType === 'student' && (
                <div className="grid grid-cols-2 gap-3">
                    <Select
                        label="Filter by Class"
                        value={form.class}
                        onChange={e => setForm(p => ({ ...p, class: e.target.value }))}
                        options={classOptions}
                    />
                    <Select
                        label="Filter by Section"
                        value={form.section}
                        onChange={e => setForm(p => ({ ...p, section: e.target.value }))}
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
                        setForm(p => ({ ...p, titleTemplate: e.target.value }))
                    }
                    placeholder="e.g. Certificate of Merit — {{recipientName}}"
                />
                <p className="input-hint">
                    Use {'{{recipientName}}'} to auto-fill each recipient's name
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
                >
                    Preview Recipients
                </Button>

                {preview && (
                    <div
                        className="mt-3 p-3 rounded-[var(--radius-md)] border border-[var(--border)]"
                        style={{ background: 'var(--bg-subtle)' }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Users size={14} style={{ color: 'var(--primary-500)' }} />
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {preview.count} certificates will be issued
                            </p>
                        </div>
                        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                            Sample titles:
                        </p>
                        {preview.samples.map((s, i) => (
                            <p key={i} className="text-xs py-1 border-b border-[var(--border)] last:border-0"
                                style={{ color: 'var(--text-secondary)' }}>
                                {s}
                            </p>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={onCancel} disabled={saving}>
                    Cancel
                </Button>
                <Button onClick={handleBulkIssue} loading={saving}>
                    <Users size={15} />
                    Issue to All
                </Button>
            </div>
        </div>
    )
}