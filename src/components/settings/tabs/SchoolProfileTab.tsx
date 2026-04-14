// FILE: src/components/settings/tabs/SchoolProfileTab.tsx
// School name, email, phone, address, logo upload

'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Building2, Phone, Mail, MapPin, Globe } from 'lucide-react'
import { SettingSection } from '../shared/SettingSection'
import { SettingRow } from '../shared/SettingRow'
import { SaveBar } from '../shared/SaveButton'
import type { SchoolProfileData, UpdateSchoolProfileBody } from '@/types/settings'

interface SchoolProfileTabProps {
    school: SchoolProfileData
    onSaved: (updated: Partial<SchoolProfileData>) => void
}

interface FormErrors {
    name?: string
    email?: string
    phone?: string
    address?: string
}

export function SchoolProfileTab({ school, onSaved }: SchoolProfileTabProps) {
    const [form, setForm] = useState({
        name: school.name || '',
        email: school.email || '',
        phone: school.phone || '',
        address: school.address || '',
    })

    const [errors, setErrors] = useState<FormErrors>({})
    const [isDirty, setIsDirty] = useState(false)
    const [saving, setSaving] = useState(false)
    const [alert, setAlert] = useState<{
        type: 'success' | 'error'; msg: string
    } | null>(null)

    // Logo upload state
    const [logo, setLogo] = useState<string | undefined>(school.logo)
    const [logoPublicId, setLogoPublicId] = useState<string>('')
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [dragOver, setDragOver] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // ── Field change handler ──
    const handleChange = (
        field: keyof typeof form,
        value: string
    ) => {
        setForm((prev) => ({ ...prev, [field]: value }))
        setIsDirty(true)
        // Clear field error on change
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }))
        }
    }

    // ── Client-side validation ──
    const validate = (): boolean => {
        const newErrors: FormErrors = {}

        if (!form.name.trim()) {
            newErrors.name = 'School name is required'
        } else if (form.name.trim().length < 3) {
            newErrors.name = 'Name must be at least 3 characters'
        } else if (form.name.trim().length > 100) {
            newErrors.name = 'Name too long (max 100 chars)'
        }

        if (form.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(form.email)) {
                newErrors.email = 'Invalid email address'
            }
        }

        if (form.phone) {
            const cleaned = form.phone.replace(/[\s\-\+]/g, '')
            if (!/^[6-9]\d{9}$/.test(cleaned)) {
                newErrors.phone = 'Invalid Indian phone number (10 digits)'
            }
        }

        if (form.address && form.address.length > 300) {
            newErrors.address = 'Address too long (max 300 chars)'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // ── Save handler ──
    const handleSave = async () => {
        if (!validate()) throw new Error('Validation failed')

        setSaving(true)
        setAlert(null)

        try {
            const body: UpdateSchoolProfileBody = {}
            if (form.name !== school.name) body.name = form.name.trim()
            if (form.email !== school.email) body.email = form.email.trim()
            if (form.phone !== school.phone) body.phone = form.phone.trim()
            if (form.address !== school.address) body.address = form.address.trim()

            const res = await fetch('/api/settings/school', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to save')
            }

            setIsDirty(false)
            setAlert({ type: 'success', msg: 'School profile saved successfully' })
            onSaved({ ...form, logo })

        } catch (err: any) {
            setAlert({ type: 'error', msg: err.message || 'Save failed' })
            throw err
        } finally {
            setSaving(false)
        }
    }

    const handleDiscard = () => {
        setForm({
            name: school.name || '',
            email: school.email || '',
            phone: school.phone || '',
            address: school.address || '',
        })
        setErrors({})
        setIsDirty(false)
        setAlert(null)
    }

    // ── Logo Upload ──
    const handleLogoUpload = useCallback(async (file: File) => {
        const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
        const MAX_MB = 2

        if (!ALLOWED.includes(file.type)) {
            setUploadError('Invalid file type. Use JPG, PNG, WebP, or SVG')
            return
        }
        if (file.size > MAX_MB * 1024 * 1024) {
            setUploadError(`File too large. Max ${MAX_MB}MB`)
            return
        }

        setUploading(true)
        setUploadError(null)

        try {
            const formData = new FormData()
            formData.append('logo', file)
            formData.append('type', 'logo')

            const res = await fetch('/api/settings/appearance', {
                method: 'POST',
                body: formData,
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Upload failed')

            setLogo(data.url)
            setLogoPublicId(data.publicId)
            onSaved({ logo: data.url })
            setAlert({ type: 'success', msg: 'Logo uploaded successfully' })

        } catch (err: any) {
            setUploadError(err.message || 'Upload failed')
        } finally {
            setUploading(false)
        }
    }, [onSaved])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleLogoUpload(file)
        e.target.value = ''
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files?.[0]
        if (file) handleLogoUpload(file)
    }

    return (
        <div className="space-y-5 portal-content-enter">

            {/* Alert */}
            {alert && (
                <div
                    className={`
            flex items-start gap-3 p-3.5 rounded-[var(--radius-md)]
            border text-sm
            ${alert.type === 'success'
                            ? 'bg-[var(--success-light)] border-[rgba(16,185,129,0.2)] text-[var(--success-dark)]'
                            : 'bg-[var(--danger-light)] border-[rgba(239,68,68,0.2)] text-[var(--danger-dark)]'
                        }
          `}
                >
                    <p className="flex-1">{alert.msg}</p>
                    <button
                        type="button"
                        onClick={() => setAlert(null)}
                        className="flex-shrink-0 opacity-70 hover:opacity-100"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* ── School Logo ── */}
            <SettingSection
                title="School Logo"
                description="Used in portal header, reports, receipts, and print documents"
            >
                <div className="flex flex-col sm:flex-row items-start gap-5">
                    {/* Logo Preview */}
                    <div className="flex-shrink-0">
                        <div
                            className="
                w-24 h-24 rounded-[var(--radius-lg)]
                border-2 border-[var(--border)]
                bg-[var(--bg-muted)]
                flex items-center justify-center
                overflow-hidden
              "
                        >
                            {logo ? (
                                <img
                                    src={logo}
                                    alt="School logo"
                                    className="w-full h-full object-contain p-1"
                                />
                            ) : (
                                <Building2
                                    size={32}
                                    className="text-[var(--text-light)]"
                                />
                            )}
                        </div>
                    </div>

                    {/* Upload Area */}
                    <div className="flex-1 min-w-0">
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`
                relative border-2 border-dashed rounded-[var(--radius-md)]
                p-5 text-center cursor-pointer
                transition-all duration-150
                ${dragOver
                                    ? 'border-[var(--primary-400)] bg-[var(--primary-50)]'
                                    : 'border-[var(--border)] hover:border-[var(--primary-300)] hover:bg-[var(--bg-muted)]'
                                }
              `}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                                className="hidden"
                                onChange={handleFileChange}
                            />

                            {uploading ? (
                                <div className="flex flex-col items-center gap-2">
                                    <div
                                        className="
                      w-7 h-7 border-2 border-[var(--primary-200)]
                      border-t-[var(--primary-600)] rounded-full animate-spin
                    "
                                    />
                                    <p className="text-xs text-[var(--text-muted)]">
                                        Uploading...
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-1.5">
                                    <Upload
                                        size={20}
                                        className="text-[var(--text-muted)]"
                                    />
                                    <p className="text-sm font-500 text-[var(--text-secondary)]">
                                        Click or drag to upload logo
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        JPG, PNG, WebP, SVG — max 2MB
                                    </p>
                                </div>
                            )}
                        </div>

                        {uploadError && (
                            <p className="input-error-msg mt-1.5">{uploadError}</p>
                        )}

                        {logo && (
                            <button
                                type="button"
                                onClick={() => {
                                    setLogo(undefined)
                                    setLogoPublicId('')
                                    setIsDirty(true)
                                }}
                                className="
                  mt-2 text-xs text-[var(--danger)]
                  hover:underline flex items-center gap-1
                "
                            >
                                <X size={11} /> Remove logo
                            </button>
                        )}
                    </div>
                </div>
            </SettingSection>

            {/* ── Basic Info ── */}
            <SettingSection
                title="Basic Information"
                description="Core school details visible across the portal"
            >
                <div className="space-y-0">
                    <SettingRow
                        horizontal
                        label="School Name"
                        description="Official name of your school"
                        required
                        error={errors.name}
                    >
                        <div className="input-group">
                            <Building2 className="input-icon-left" size={15} />
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="e.g. Delhi Public School"
                                className="input-clean has-icon-left"
                                maxLength={100}
                            />
                        </div>
                    </SettingRow>

                    <SettingRow
                        horizontal
                        label="Subdomain"
                        description="Cannot be changed after registration"
                    >
                        <div className="input-group">
                            <Globe className="input-icon-left" size={15} />
                            <input
                                type="text"
                                value={school.subdomain}
                                disabled
                                className="input-clean has-icon-left"
                            />
                        </div>
                        <p className="input-hint">
                            Your portal URL:{' '}
                            <span className="font-600 text-[var(--text-primary)]">
                                {school.subdomain}.skolify.in
                            </span>
                        </p>
                    </SettingRow>

                    <SettingRow
                        horizontal
                        label="Email Address"
                        description="Used for official communication"
                        error={errors.email}
                    >
                        <div className="input-group">
                            <Mail className="input-icon-left" size={15} />
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                placeholder="school@example.com"
                                className="input-clean has-icon-left"
                            />
                        </div>
                    </SettingRow>

                    <SettingRow
                        horizontal
                        label="Phone Number"
                        description="10-digit Indian mobile/landline"
                        error={errors.phone}
                    >
                        <div className="input-group">
                            <Phone className="input-icon-left" size={15} />
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                placeholder="9876543210"
                                className="input-clean has-icon-left"
                                maxLength={15}
                            />
                        </div>
                    </SettingRow>

                    <SettingRow
                        horizontal
                        label="Address"
                        description="School physical address"
                        error={errors.address}
                    >
                        <div className="input-group items-start">
                            <MapPin
                                className="input-icon-left"
                                size={15}
                                style={{ top: '0.75rem', transform: 'none' }}
                            />
                            <textarea
                                value={form.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                                placeholder="123, Street Name, City, State - PIN"
                                className="input-clean has-icon-left resize-none"
                                rows={3}
                                maxLength={300}
                            />
                        </div>
                        <p className="input-hint text-right">
                            {form.address.length}/300
                        </p>
                    </SettingRow>
                </div>
            </SettingSection>

            {/* ── Plan Info — Read only ── */}
            <SettingSection
                title="Subscription Info"
                description="Your current plan and usage"
            >
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                        {
                            label: 'Current Plan',
                            value: school.plan.charAt(0).toUpperCase() + school.plan.slice(1),
                            color: 'text-[var(--primary-600)]',
                        },
                        {
                            label: 'Trial Ends',
                            value: new Date(school.trialEndsAt).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric',
                            }),
                            color: 'text-[var(--text-primary)]',
                        },
                        {
                            label: 'SMS Credits',
                            value: String(school.creditBalance),
                            color: school.creditBalance < 10
                                ? 'text-[var(--danger)]'
                                : 'text-[var(--success)]',
                        },
                    ].map((item) => (
                        <div
                            key={item.label}
                            className="
                bg-[var(--bg-muted)] rounded-[var(--radius-md)]
                p-3 border border-[var(--border)]
              "
                        >
                            <p className="text-xs text-[var(--text-muted)] mb-0.5">
                                {item.label}
                            </p>
                            <p className={`text-sm font-700 ${item.color}`}>
                                {item.value}
                            </p>
                        </div>
                    ))}
                </div>
            </SettingSection>

            {/* Save Bar */}
            <SaveBar
                isDirty={isDirty}
                onSave={handleSave}
                onDiscard={handleDiscard}
                saving={saving}
            />
        </div>
    )
}