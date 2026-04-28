// FILE: src/components/settings/tabs/SchoolProfileTab.tsx
// ✅ UPDATED: Multi-tenant support — School vs Academy vs Coaching
// Dynamic labels, terminology, validation messages institution-aware

'use client'

import { useState, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
    Upload, X, Building2, Phone, Mail, MapPin, Globe,
    GraduationCap, BookOpen, CheckCircle2,
} from 'lucide-react'
import { SettingSection } from '../shared/SettingSection'
import { SettingRow } from '../shared/SettingRow'
import { SaveBar } from '../shared/SaveButton'
import type { SchoolProfileData, UpdateSchoolProfileBody } from '@/types/settings'
import type { InstitutionType } from '@/lib/institutionConfig'

// ─────────────────────────────────────────────────────────
// Institution Config — dynamic labels
// ─────────────────────────────────────────────────────────

const INSTITUTION_CONFIG = {
    school: {
        label: 'School',
        namePlaceholder: 'e.g. Delhi Public School',
        nameDescription: 'Official name of your school',
        logoDescription: 'Used in portal header, reports, receipts, and print documents',
        sectionTitle: 'Basic Information',
        sectionDescription: 'Core school details visible across the portal',
        subdomainHint: (sub: string) => `Your portal URL: ${sub}.skolify.in`,
    },
    academy: {
        label: 'Academy',
        namePlaceholder: 'e.g. CodeCraft Academy',
        nameDescription: 'Official name of your academy',
        logoDescription: 'Used in course certificates, receipts, and student portal',
        sectionTitle: 'Basic Information',
        sectionDescription: 'Core academy details visible across the portal',
        subdomainHint: (sub: string) => `Your portal URL: ${sub}.skolify.in`,
    },
    coaching: {
        label: 'Institute',
        namePlaceholder: 'e.g. Sharma Coaching Institute',
        nameDescription: 'Official name of your institute',
        logoDescription: 'Used in batch cards, fee receipts, and student portal',
        sectionTitle: 'Basic Information',
        sectionDescription: 'Core institute details visible across the portal',
        subdomainHint: (sub: string) => `Your portal URL: ${sub}.skolify.in`,
    },
} as const

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface SchoolProfileTabProps {
    school: SchoolProfileData
    onSaved: (updated: Partial<SchoolProfileData>) => void
    institutionType?: InstitutionType  // ✅ ADD — page.tsx se pass hoga
}

interface FormErrors {
    name?: string
    email?: string
    phone?: string
    address?: string
}

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────

export function SchoolProfileTab({
    school,
    onSaved,
    institutionType,
}: SchoolProfileTabProps) {
    const { update: updateSession } = useSession()

    // ✅ institutionType prop se lo — session fallback nahi
    const instType: InstitutionType = institutionType || school.institutionType as InstitutionType || 'school'
    const config = INSTITUTION_CONFIG[instType] || INSTITUTION_CONFIG.school

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
        type: 'success' | 'error'
        msg: string
    } | null>(null)

    const [logo, setLogo] = useState<string | undefined>(school.logo)
    const [logoPreview, setLogoPreview] = useState<string | undefined>(school.logo)
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [dragOver, setDragOver] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // ─────────────────────────────────────────────────────
    // Form Handlers
    // ─────────────────────────────────────────────────────

    const handleChange = (field: keyof typeof form, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }))
        setIsDirty(true)
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }))
        }
    }

    const validate = (): boolean => {
        const newErrors: FormErrors = {}
        const label = config.label

        if (!form.name.trim()) {
            newErrors.name = `${label} name is required`
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

    // ─────────────────────────────────────────────────────
    // Save
    // ─────────────────────────────────────────────────────

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

            if (logoPreview !== school.logo) {
                body.logo = logoPreview
                body.logoPublicId = logoPreview
            }

            const res = await fetch('/api/settings/schools', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to save')
            }

            setIsDirty(false)
            setAlert({
                type: 'success',
                msg: `${config.label} profile saved successfully`,
            })
            onSaved({ ...form, logo: logoPreview })

            // ✅ Session update — sidebar turant update hoga
            const updateData: Record<string, string> = {}
            if (body.name) updateData.schoolName = body.name.trim()
            if (body.logo) updateData.schoolLogo = body.logo

            if (Object.keys(updateData).length > 0) {
                await updateSession(updateData)
            }

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
        setLogoPreview(school.logo)
        setLogo(school.logo)
        setErrors({})
        setIsDirty(false)
        setAlert(null)
    }

    // ─────────────────────────────────────────────────────
    // Logo Upload
    // ─────────────────────────────────────────────────────

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

            // ✅ Sirf preview update — actual save handleSave me hoga
            setLogoPreview(data.url)
            setIsDirty(true)

            setAlert({
                type: 'success',
                msg: 'Logo uploaded. Click Save to confirm.',
            })

        } catch (err: any) {
            console.error('[SchoolProfileTab] Logo upload error:', err)
            setUploadError(err.message || 'Upload failed')
            setAlert({ type: 'error', msg: err.message || 'Upload failed' })
        } finally {
            setUploading(false)
        }
    }, [])

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

    // ─────────────────────────────────────────────────────
    // Subscription Info — institution-aware labels
    // ─────────────────────────────────────────────────────

    const subscriptionCards = [
        {
            label: 'Current Plan',
            value: school.plan
                ? school.plan.charAt(0).toUpperCase() + school.plan.slice(1)
                : 'Free',
            color: 'text-[var(--primary-600)]',
        },
        {
            label: school.subscriptionStatus === 'trial'
                ? 'Trial Ends'
                : 'Subscription',
            value: school.trialEndsAt
                ? new Date(school.trialEndsAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                })
                : school.subscriptionStatus === 'active'
                    ? 'Active'
                    : 'N/A',
            color: 'text-[var(--text-primary)]',
        },
        {
            label: 'SMS Credits',
            value: String(school.creditBalance ?? 0),
            color:
                (school.creditBalance ?? 0) < 10
                    ? 'text-[var(--danger)]'
                    : 'text-[var(--success)]',
        },
    ]

    // ─────────────────────────────────────────────────────
    // Institution Type Badge — readonly info
    // ─────────────────────────────────────────────────────

    const institutionBadgeColor = {
        school: 'var(--primary-600)',
        academy: 'var(--info-dark)',
        coaching: 'var(--warning-dark)',
    }[instType] || 'var(--primary-600)'

    const institutionBadgeBg = {
        school: 'var(--primary-50)',
        academy: 'var(--info-light)',
        coaching: 'var(--warning-light)',
    }[instType] || 'var(--primary-50)'

    // ─────────────────────────────────────────────────────
    // Icon — institution-aware
    // ─────────────────────────────────────────────────────

    const InstitutionIcon =
        instType === 'academy'
            ? GraduationCap
            : instType === 'coaching'
                ? BookOpen
                : Building2

    // ─────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────

    return (
        <div className="space-y-5 portal-content-enter">

            {/* ── Alert ── */}
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
                    {alert.type === 'success' && (
                        <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" />
                    )}
                    <p className="flex-1">{alert.msg}</p>
                    <button
                        type="button"
                        onClick={() => setAlert(null)}
                        className="flex-shrink-0 opacity-70 hover:opacity-100"
                        aria-label="Dismiss alert"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* ── Logo Section ── */}
            <SettingSection
                title={`${config.label} Logo`}
                description={config.logoDescription}
            >
                <div className="flex flex-col sm:flex-row items-start gap-5">

                    {/* Preview */}
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
                            {logoPreview ? (
                                <img
                                    src={logoPreview}
                                    alt={`${config.label} logo`}
                                    className="w-full h-full object-contain p-1"
                                />
                            ) : (
                                <InstitutionIcon
                                    size={32}
                                    className="text-[var(--text-light)]"
                                />
                            )}
                        </div>
                        {logoPreview && (
                            <p
                                className="text-[10px] text-center mt-1"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                {logoPreview !== school.logo ? 'Unsaved preview' : 'Current logo'}
                            </p>
                        )}
                    </div>

                    {/* Upload Zone */}
                    <div className="flex-1 min-w-0">
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`
                                relative border-2 border-dashed rounded-[var(--radius-md)]
                                p-5 text-center cursor-pointer transition-all duration-150
                                ${dragOver
                                    ? 'border-[var(--primary-400)] bg-[var(--primary-50)]'
                                    : 'border-[var(--border)] hover:border-[var(--primary-300)] hover:bg-[var(--bg-muted)]'
                                }
                            `}
                            role="button"
                            aria-label={`Upload ${config.label} logo`}
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
                                            w-7 h-7 border-2 rounded-full animate-spin
                                        "
                                        style={{
                                            borderColor: 'var(--primary-200)',
                                            borderTopColor: 'var(--primary-600)',
                                        }}
                                    />
                                    <p className="text-xs text-[var(--text-muted)]">
                                        Uploading...
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-1.5">
                                    <Upload size={20} className="text-[var(--text-muted)]" />
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

                        {logoPreview && (
                            <button
                                type="button"
                                onClick={() => {
                                    setLogoPreview(undefined)
                                    setLogo(undefined)
                                    setIsDirty(true)
                                }}
                                className="mt-2 text-xs text-[var(--danger)] hover:underline flex items-center gap-1"
                            >
                                <X size={11} /> Remove logo
                            </button>
                        )}
                    </div>
                </div>
            </SettingSection>

            {/* ── Basic Info ── */}
            <SettingSection
                title={config.sectionTitle}
                description={config.sectionDescription}
                icon={InstitutionIcon}
            >
                <div className="space-y-0">

                    {/* Name */}
                    <SettingRow
                        horizontal
                        label={`${config.label} Name`}
                        description={config.nameDescription}
                        required
                        error={errors.name}
                    >
                        <div className="input-group">
                            <InstitutionIcon className="input-icon-left" size={15} />
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder={config.namePlaceholder}
                                className="input-clean has-icon-left"
                                maxLength={100}
                                aria-label={`${config.label} name`}
                            />
                        </div>
                    </SettingRow>

                    {/* Institution Type — readonly badge */}
                    <SettingRow
                        horizontal
                        label="Institution Type"
                        description="Set during registration — contact support to change"
                    >
                        <div className="flex items-center gap-2">
                            <span
                                className="
                                    inline-flex items-center gap-1.5
                                    px-3 py-1.5 rounded-[var(--radius-full)]
                                    text-xs font-700 border
                                "
                                style={{
                                    background: institutionBadgeBg,
                                    color: institutionBadgeColor,
                                    borderColor: `${institutionBadgeColor}30`,
                                }}
                            >
                                <InstitutionIcon size={11} />
                                {config.label}
                            </span>
                            <span className="text-xs text-[var(--text-muted)]">
                                (Read-only)
                            </span>
                        </div>
                    </SettingRow>

                    {/* Subdomain */}
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
                                className="input-clean has-icon-left opacity-60 cursor-not-allowed"
                                aria-label="Subdomain (read-only)"
                            />
                        </div>
                        <p className="input-hint">
                            {config.subdomainHint(school.subdomain)
                                .split(school.subdomain + '.skolify.in')[0]}
                            <span className="font-600 text-[var(--text-primary)]">
                                {school.subdomain}.skolify.in
                            </span>
                        </p>
                    </SettingRow>

                    {/* Email */}
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
                                placeholder={
                                    instType === 'school'
                                        ? 'school@example.com'
                                        : instType === 'academy'
                                            ? 'academy@example.com'
                                            : 'institute@example.com'
                                }
                                className="input-clean has-icon-left"
                                aria-label="Email address"
                            />
                        </div>
                    </SettingRow>

                    {/* Phone */}
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
                                aria-label="Phone number"
                            />
                        </div>
                    </SettingRow>

                    {/* Address */}
                    <SettingRow
                        horizontal
                        label="Address"
                        description={`${config.label} physical address`}
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
                                placeholder={
                                    instType === 'school'
                                        ? '123, Street Name, City, State - PIN'
                                        : instType === 'academy'
                                            ? 'Academy address, City, State - PIN'
                                            : 'Institute address, City, State - PIN'
                                }
                                className="input-clean has-icon-left resize-none"
                                rows={3}
                                maxLength={300}
                                aria-label="Address"
                            />
                        </div>
                        <p className="input-hint text-right">
                            {form.address.length}/300
                        </p>
                    </SettingRow>

                </div>
            </SettingSection>

            {/* ── Subscription Info ── */}
            <SettingSection
                title="Subscription Info"
                description={`Your current plan and ${config.label.toLowerCase()} usage`}
            >
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {subscriptionCards.map((item) => (
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

                {/* ✅ Trial badge — subscription status aware */}
                {school.subscriptionStatus === 'trial' && school.trialEndsAt && (
                    <div
                        className="
                            mt-3 flex items-center gap-2 p-3
                            rounded-[var(--radius-md)] border text-xs
                        "
                        style={{
                            background: 'var(--warning-light)',
                            borderColor: 'rgba(245,158,11,0.2)',
                            color: 'var(--warning-dark)',
                        }}
                    >
                        <span className="font-700">Trial Active</span>
                        <span>—</span>
                        <span>
                            Expires{' '}
                            {new Date(school.trialEndsAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                            })}
                        </span>
                        <a
                            href="/admin/subscription"
                            className="ml-auto font-700 underline"
                            style={{ color: 'var(--warning-dark)' }}
                        >
                            Upgrade →
                        </a>
                    </div>
                )}
            </SettingSection>

            <SaveBar
                isDirty={isDirty}
                onSave={handleSave}
                onDiscard={handleDiscard}
                saving={saving}
            />
        </div>
    )
}