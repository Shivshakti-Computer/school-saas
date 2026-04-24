// FILE: src/components/certificates/TemplateForm.tsx
// Create/Edit certificate template form
// ═══════════════════════════════════════════════════════════

'use client'

import { useState } from 'react'
import { Plus, Trash2, Info } from 'lucide-react'
import { Button, Input, Select, Alert, Spinner } from '@/components/ui'
import type { CreateTemplateInput } from '@/lib/validators/certificate'

// ── Constants ─────────────────────────────────────────────

const CERT_TYPES_BY_INSTITUTION = {
  school: [
    { value: 'merit', label: 'Merit Certificate' },
    { value: 'participation', label: 'Participation Certificate' },
    { value: 'achievement', label: 'Achievement Award' },
    { value: 'appreciation', label: 'Appreciation Certificate' },
    { value: 'character', label: 'Character Certificate' },
    { value: 'sports', label: 'Sports Certificate' },
    { value: 'custom', label: 'Custom Certificate' },
  ],
  academy: [
    { value: 'completion', label: 'Course Completion Certificate' },
    { value: 'skill', label: 'Skill Certificate' },
    { value: 'internship', label: 'Internship Certificate' },
    { value: 'merit', label: 'Merit Certificate' },
    { value: 'participation', label: 'Participation Certificate' },
    { value: 'achievement', label: 'Achievement Award' },
    { value: 'appreciation', label: 'Appreciation Certificate' },
    { value: 'custom', label: 'Custom Certificate' },
  ],
  coaching: [
    { value: 'completion', label: 'Course Completion Certificate' },
    { value: 'test_topper', label: 'Test Topper Certificate' },
    { value: 'merit', label: 'Merit Certificate' },
    { value: 'participation', label: 'Participation Certificate' },
    { value: 'achievement', label: 'Achievement Award' },
    { value: 'appreciation', label: 'Appreciation Certificate' },
    { value: 'custom', label: 'Custom Certificate' },
  ],
}

const LAYOUT_OPTIONS = [
  { value: 'modern', label: 'Modern — Clean with gold accents' },
  { value: 'classic', label: 'Classic — Traditional formal style' },
  { value: 'elegant', label: 'Elegant — Indigo with decorative borders' },
]

const APPLICABLE_TO_OPTIONS = [
  { value: 'student', label: 'Students only' },
  { value: 'staff', label: 'Staff / Faculty only' },
  { value: 'both', label: 'Both Students & Staff' },
]

const SIGNATURE_LABELS = [
  { value: 'Principal', label: 'Principal' },
  { value: 'Director', label: 'Director' },
  { value: 'Center Head', label: 'Center Head' },
  { value: 'Chairman', label: 'Chairman' },
  { value: 'Dean', label: 'Dean' },
  { value: 'Coordinator', label: 'Coordinator' },
]

const TEMPLATE_VARIABLES = [
  { var: '{{recipientName}}', desc: 'Recipient full name' },
  { var: '{{class}}', desc: 'Student class (school)' },
  { var: '{{section}}', desc: 'Student section (school)' },
  { var: '{{academicYear}}', desc: 'Academic year' },
  { var: '{{courseName}}', desc: 'Course name (academy/coaching)' },
]

// ── Types ──────────────────────────────────────────────────

interface TemplateFormProps {
  institutionType: 'school' | 'academy' | 'coaching'
  onSuccess: (template: any) => void
  onCancel: () => void
  initialData?: Partial<CreateTemplateInput> & { _id?: string }
}

// ── Component ──────────────────────────────────────────────

export function TemplateForm({
  institutionType,
  onSuccess,
  onCancel,
  initialData,
}: TemplateFormProps) {
  const isEdit = Boolean(initialData?._id)
  const certTypes = CERT_TYPES_BY_INSTITUTION[institutionType]

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showVarGuide, setShowVarGuide] = useState(false)

  const [form, setForm] = useState<CreateTemplateInput>({
    name: initialData?.name || '',
    type: (initialData?.type as any) || certTypes[0].value,
    category: initialData?.category || '',
    template: initialData?.template || '',
    layout: initialData?.layout || 'modern',
    applicableTo: initialData?.applicableTo || 'student',
    fields: initialData?.fields || [
      { name: 'recipientName', type: 'text', required: true, placeholder: 'Recipient name' },
    ],
    showAccreditations: initialData?.showAccreditations ?? true,
    signatureLabel: initialData?.signatureLabel || 'Principal',
    borderStyle: initialData?.borderStyle || '',
  })

  // ── Field helpers ──────────────────────────────────────────
  const addField = () => {
    if (form.fields.length >= 10) return
    setForm(prev => ({
      ...prev,
      fields: [
        ...prev.fields,
        { name: '', type: 'text', required: false, placeholder: '' },
      ],
    }))
  }

  const removeField = (idx: number) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== idx),
    }))
  }

  const updateField = (idx: number, key: string, val: any) => {
    setForm(prev => {
      const fields = [...prev.fields]
      fields[idx] = { ...fields[idx], [key]: val }
      return { ...prev, fields }
    })
  }

  // ── Insert variable at cursor ──────────────────────────────
  const insertVariable = (varStr: string) => {
    const textarea = document.getElementById(
      'cert-template-textarea'
    ) as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = form.template.slice(0, start)
    const after = form.template.slice(end)
    const newVal = before + varStr + after

    setForm(prev => ({ ...prev, template: newVal }))

    setTimeout(() => {
      textarea.focus()
      const pos = start + varStr.length
      textarea.setSelectionRange(pos, pos)
    }, 0)
  }

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError(null)

    if (!form.name.trim()) {
      setError('Certificate name is required')
      return
    }
    if (!form.template.trim() || form.template.trim().length < 20) {
      setError('Template content must be at least 20 characters')
      return
    }
    if (form.fields.some(f => !f.name.trim())) {
      setError('All field names are required')
      return
    }

    setSaving(true)

    try {
      const payload = isEdit
        ? {
            action: 'update_template',
            ...form,
          }
        : {
            action: 'create_template',
            ...form,
          }

      const url = isEdit
        ? `/api/certificates?id=${initialData!._id}`
        : '/api/certificates'

      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save template')

      onSuccess(data.template)
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

      {/* Basic Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Certificate Name *"
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          placeholder="e.g. Annual Merit Award 2024"
        />

        <Select
          label="Certificate Type *"
          value={form.type}
          onChange={e =>
            setForm(p => ({ ...p, type: e.target.value as any }))
          }
          options={certTypes}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Category (optional)"
          value={form.category || ''}
          onChange={e =>
            setForm(p => ({ ...p, category: e.target.value }))
          }
          placeholder="e.g. Annual Function, Inter-School Competition"
        />

        <Select
          label="Applicable To *"
          value={form.applicableTo}
          onChange={e =>
            setForm(p => ({ ...p, applicableTo: e.target.value as any }))
          }
          options={APPLICABLE_TO_OPTIONS}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Certificate Layout *"
          value={form.layout}
          onChange={e =>
            setForm(p => ({ ...p, layout: e.target.value as any }))
          }
          options={LAYOUT_OPTIONS}
        />

        <Select
          label="Signature Label *"
          value={form.signatureLabel}
          onChange={e =>
            setForm(p => ({ ...p, signatureLabel: e.target.value }))
          }
          options={SIGNATURE_LABELS}
        />
      </div>

      {/* Template Content */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="input-label">
            Certificate Content *
          </label>
          <button
            type="button"
            onClick={() => setShowVarGuide(p => !p)}
            className="flex items-center gap-1.5 text-xs font-medium
                       text-[var(--primary-600)] hover:text-[var(--primary-700)]
                       transition-colors"
          >
            <Info size={13} />
            Variable Guide
          </button>
        </div>

        {/* Variable Guide */}
        {showVarGuide && (
          <div
            className="mb-3 p-3 rounded-[var(--radius-md)] border
                       border-[var(--primary-200)]"
            style={{ background: 'var(--primary-50)' }}
          >
            <p
              className="text-xs font-semibold mb-2"
              style={{ color: 'var(--primary-700)' }}
            >
              Click a variable to insert at cursor position:
            </p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_VARIABLES.map(v => (
                <button
                  key={v.var}
                  type="button"
                  onClick={() => insertVariable(v.var)}
                  title={v.desc}
                  className="text-xs px-2 py-1 rounded-[var(--radius-sm)]
                             font-mono font-medium transition-colors
                             border border-[var(--primary-300)]
                             hover:border-[var(--primary-500)]"
                  style={{
                    background: 'var(--bg-card)',
                    color: 'var(--primary-600)',
                  }}
                >
                  {v.var}
                </button>
              ))}
            </div>
            <p
              className="text-xs mt-2"
              style={{ color: 'var(--primary-600)' }}
            >
              You can also add custom variables using{' '}
              <code className="font-mono bg-white px-1 rounded">
                {'{{fieldName}}'}
              </code>{' '}
              syntax. Define them in Dynamic Fields below.
            </p>
          </div>
        )}

        <textarea
          id="cert-template-textarea"
          value={form.template}
          onChange={e =>
            setForm(p => ({ ...p, template: e.target.value }))
          }
          rows={5}
          placeholder={
            'This is to certify that {{recipientName}} has successfully ' +
            'completed the course {{courseName}} with distinction.'
          }
          className="w-full px-3 py-2.5 text-sm rounded-[var(--radius-md)]
                     border border-[var(--border)] font-mono
                     focus:border-[var(--primary-500)] focus:outline-none
                     focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]
                     transition-all resize-none"
          style={{
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
          }}
        />
        <p className="input-hint">
          Use {'{{variableName}}'} syntax for dynamic values. These will be
          filled when issuing the certificate.
        </p>
      </div>

      {/* Dynamic Fields */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="input-label">
            Dynamic Fields
            <span
              className="ml-1.5 text-xs font-normal"
              style={{ color: 'var(--text-muted)' }}
            >
              ({form.fields.length}/10)
            </span>
          </label>
          <button
            type="button"
            onClick={addField}
            disabled={form.fields.length >= 10}
            className="flex items-center gap-1 text-xs font-medium
                       text-[var(--primary-600)] hover:text-[var(--primary-700)]
                       disabled:opacity-40 disabled:cursor-not-allowed
                       transition-colors"
          >
            <Plus size={13} />
            Add Field
          </button>
        </div>

        <div className="space-y-2">
          {form.fields.map((field, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <div className="flex-1">
                <input
                  type="text"
                  value={field.name}
                  onChange={e => updateField(idx, 'name', e.target.value)}
                  placeholder="Field name (e.g. grade, rank)"
                  className="input-clean text-sm"
                />
              </div>

              <select
                value={field.type}
                onChange={e => updateField(idx, 'type', e.target.value)}
                className="h-10 px-2 text-sm rounded-[var(--radius-md)]
                           border border-[var(--border)]
                           focus:border-[var(--primary-500)] focus:outline-none
                           transition-colors"
                style={{
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  minWidth: '90px',
                }}
              >
                <option value="text">Text</option>
                <option value="date">Date</option>
                <option value="number">Number</option>
              </select>

              <label className="flex items-center gap-1.5 h-10 text-xs
                                text-[var(--text-secondary)] whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={e =>
                    updateField(idx, 'required', e.target.checked)
                  }
                  className="rounded"
                />
                Required
              </label>

              <button
                type="button"
                onClick={() => removeField(idx)}
                disabled={form.fields.length === 1}
                className="h-10 w-10 flex items-center justify-center
                           rounded-[var(--radius-md)] transition-colors
                           text-[var(--danger)] hover:bg-[var(--danger-light)]
                           disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Options */}
      <div
        className="flex items-center gap-3 p-3 rounded-[var(--radius-md)]
                   border border-[var(--border)]"
        style={{ background: 'var(--bg-subtle)' }}
      >
        <input
          type="checkbox"
          id="showAccreditations"
          checked={form.showAccreditations}
          onChange={e =>
            setForm(p => ({ ...p, showAccreditations: e.target.checked }))
          }
          className="rounded"
        />
        <label
          htmlFor="showAccreditations"
          className="text-sm font-medium cursor-pointer"
          style={{ color: 'var(--text-primary)' }}
        >
          Show institution accreditations on certificate
          <span
            className="block text-xs font-normal mt-0.5"
            style={{ color: 'var(--text-muted)' }}
          >
            Displays affiliations (CBSE, ISO) and registrations (MSME) in
            certificate footer for credibility
          </span>
        </label>
      </div>

      {/* Footer Buttons */}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} loading={saving}>
          {isEdit ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </div>
  )
}