// FILE: src/components/settings/tabs/CertificateTab.tsx
// ENHANCED: With live preview integration
// ═══════════════════════════════════════════════════════════

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
    Award,
    QrCode,
    PenLine,
    Upload,
    Trash2,
    Plus,
    Save,
    AlertCircle,
    CheckCircle,
    Shield,
    Building2,
    Handshake,
    GraduationCap,
    X,
    Image as ImageIcon,
    ChevronDown,
    ChevronUp,
    Info,
    Zap,
    Eye,
    EyeOff,
} from 'lucide-react'
import { Button, Alert, Spinner } from '@/components/ui'
import { ToggleRow, SettingRow } from '../shared/SettingRow'
import { SettingSection } from '../shared/SettingSection'
import { SaveBar } from '../shared/SaveButton'
import { CertificatePreview } from '@/components/certificates/CertificatePreview'

// ────────────────────────────────────────────────────────────
// Types (Existing — Unchanged)
// ────────────────────────────────────────────────────────────

interface Accreditation {
    name: string
    logoUrl: string
    registrationNo?: string
    issuedBy?: string
    validFrom?: string
    validUntil?: string
    isActive: boolean
    displayOrder: number
}

interface AccreditationGroup {
    affiliations: Accreditation[]
    recognitions: Accreditation[]
    registrations: Accreditation[]
    partnerships: Accreditation[]
}

interface CertificateSettings {
    enableDigitalSignature: boolean
    digitalSignatureUrl?: string
    signatureName?: string
    signatureDesignation?: string
    enableQRCode: boolean
    qrCodePosition: 'bottom-left' | 'bottom-right' | 'bottom-center'
    showVerificationURL: boolean
    defaultLayout: 'classic' | 'modern' | 'elegant'
    showAccreditationsOnCertificate: boolean
    watermarkText?: string
    enableWatermark: boolean
}

interface CertificateTabProps {
    schoolId: string
    institutionType: 'school' | 'academy' | 'coaching'
    subscriptionStatus?: string
    isTrial?: boolean
}

// ────────────────────────────────────────────────────────────
// Helper Functions (Existing)
// ────────────────────────────────────────────────────────────

function getAccreditationCategories(
    institutionType: 'school' | 'academy' | 'coaching'
) {
    return [
        {
            key: 'affiliations' as const,
            label:
                institutionType === 'school'
                    ? 'Affiliations'
                    : 'University / Board Affiliations',
            description:
                institutionType === 'school'
                    ? 'CBSE, ICSE, State Board, University affiliations'
                    : institutionType === 'academy'
                        ? 'University affiliations, Awarding bodies'
                        : 'Affiliated boards, Assessment bodies',
            icon: GraduationCap,
            color: 'var(--primary-500)',
            bg: 'var(--primary-50)',
            examples:
                institutionType === 'school'
                    ? ['CBSE', 'ICSE', 'State Board', 'University']
                    : institutionType === 'academy'
                        ? ['NSDC', 'NIELIT', 'University', 'Awarding Body']
                        : ['CBSE', 'State Board', 'Assessment Body'],
        },
        {
            key: 'recognitions' as const,
            label: 'Recognitions & Certifications',
            description:
                institutionType === 'school'
                    ? 'NAAC, AICTE, ISO, Awards and certifications'
                    : 'ISO, NSDC, Skill India, Quality certifications',
            icon: Shield,
            color: 'var(--success)',
            bg: 'var(--success-light)',
            examples:
                institutionType === 'school'
                    ? ['NAAC', 'AICTE', 'ISO 9001', 'NIRF']
                    : ['ISO 9001', 'NSDC', 'Skill India', 'NIELIT'],
        },
        {
            key: 'registrations' as const,
            label: 'Registrations',
            description:
                'MSME, Society, Trust, MCA, Startup India registrations',
            icon: Building2,
            color: 'var(--warning)',
            bg: 'var(--warning-light)',
            examples: ['MSME', 'Trust', 'Society', 'MCA', 'Startup India'],
        },
        {
            key: 'partnerships' as const,
            label:
                institutionType === 'academy'
                    ? 'Industry Partnerships & Tie-ups'
                    : 'Partnerships & Tie-ups',
            description:
                institutionType === 'academy'
                    ? 'Industry tie-ups, Placement partners, MoU'
                    : 'MoU, Collaborations with companies or institutions',
            icon: Handshake,
            color: 'var(--info)',
            bg: 'var(--info-light)',
            examples:
                institutionType === 'academy'
                    ? ['TCS', 'Infosys', 'Industry Partner', 'MoU']
                    : ['Industry Partners', 'MoU', 'Collaboration'],
        },
    ]
}

const emptyAccreditation = (): Accreditation => ({
    name: '',
    logoUrl: '',
    registrationNo: '',
    issuedBy: '',
    validFrom: '',
    validUntil: '',
    isActive: true,
    displayOrder: 0,
})

// ────────────────────────────────────────────────────────────
// Sub-Components (Existing — Keep as is)
// ────────────────────────────────────────────────────────────

function AccreditationItemEditor({
    item,
    index,
    onUpdate,
    onRemove,
    onLogoUpload,
    uploading,
}: {
    item: Accreditation
    index: number
    onUpdate: (index: number, field: string, value: any) => void
    onRemove: (index: number) => void
    onLogoUpload: (index: number, file: File) => void
    uploading: boolean
}) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [expanded, setExpanded] = useState(!item.logoUrl)

    return (
        <div
            className="rounded-[var(--radius-md)] border overflow-hidden"
            style={{ borderColor: 'var(--border)' }}
        >
            <div
                className="flex items-center gap-3 px-4 py-3"
                style={{ background: 'var(--bg-subtle)' }}
            >
                <div
                    className="w-10 h-10 rounded-[var(--radius-sm)] border
                               flex items-center justify-center flex-shrink-0
                               overflow-hidden"
                    style={{
                        borderColor: 'var(--border)',
                        background: 'var(--bg-card)',
                    }}
                >
                    {item.logoUrl ? (
                        <img
                            src={item.logoUrl}
                            alt={item.name}
                            className="w-full h-full object-contain p-1"
                        />
                    ) : (
                        <ImageIcon
                            size={16}
                            style={{ color: 'var(--text-muted)' }}
                        />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <p
                        className="text-sm font-medium truncate"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {item.name || `Item ${index + 1}`}
                    </p>
                    {item.registrationNo && (
                        <p
                            className="text-xs truncate"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            {item.registrationNo}
                        </p>
                    )}
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={item.isActive}
                        onChange={(e) =>
                            onUpdate(index, 'isActive', e.target.checked)
                        }
                        className="rounded"
                    />
                    <span
                        className="text-xs"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        Active
                    </span>
                </label>

                <button
                    type="button"
                    onClick={() => setExpanded((p) => !p)}
                    className="p-1 rounded transition-colors hover:bg-[var(--bg-muted)]"
                >
                    {expanded ? (
                        <ChevronUp
                            size={14}
                            style={{ color: 'var(--text-muted)' }}
                        />
                    ) : (
                        <ChevronDown
                            size={14}
                            style={{ color: 'var(--text-muted)' }}
                        />
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="p-1 rounded transition-colors hover:bg-[var(--danger-light)]"
                >
                    <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                </button>
            </div>

            {expanded && (
                <div className="px-4 py-3 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="input-label">Name *</label>
                            <input
                                type="text"
                                value={item.name}
                                onChange={(e) =>
                                    onUpdate(index, 'name', e.target.value)
                                }
                                placeholder="e.g. CBSE, ISO 9001, MSME"
                                className="input-clean"
                            />
                        </div>
                        <div>
                            <label className="input-label">
                                Registration / Certificate No.
                            </label>
                            <input
                                type="text"
                                value={item.registrationNo || ''}
                                onChange={(e) =>
                                    onUpdate(
                                        index,
                                        'registrationNo',
                                        e.target.value
                                    )
                                }
                                placeholder="e.g. UDYAM-UP-01-0012345"
                                className="input-clean"
                            />
                        </div>
                        <div>
                            <label className="input-label">Issued By</label>
                            <input
                                type="text"
                                value={item.issuedBy || ''}
                                onChange={(e) =>
                                    onUpdate(
                                        index,
                                        'issuedBy',
                                        e.target.value
                                    )
                                }
                                placeholder="e.g. Ministry of Education"
                                className="input-clean"
                            />
                        </div>
                        <div>
                            <label className="input-label">
                                Display Order
                            </label>
                            <input
                                type="number"
                                value={item.displayOrder}
                                onChange={(e) =>
                                    onUpdate(
                                        index,
                                        'displayOrder',
                                        Number(e.target.value)
                                    )
                                }
                                min={0}
                                max={100}
                                className="input-clean"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="input-label">Logo</label>
                        <div className="flex items-center gap-3">
                            {item.logoUrl ? (
                                <div className="flex items-center gap-3 flex-1">
                                    <img
                                        src={item.logoUrl}
                                        alt={item.name}
                                        className="w-12 h-12 object-contain rounded-[var(--radius-sm)] border p-1"
                                        style={{
                                            borderColor: 'var(--border)',
                                            background: 'var(--bg-card)',
                                        }}
                                    />
                                    <div className="flex-1">
                                        <p
                                            className="text-xs truncate"
                                            style={{
                                                color: 'var(--text-muted)',
                                            }}
                                        >
                                            {item.logoUrl.split('/').pop()}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onUpdate(
                                                    index,
                                                    'logoUrl',
                                                    ''
                                                )
                                            }
                                            className="text-xs mt-1"
                                            style={{
                                                color: 'var(--danger)',
                                            }}
                                        >
                                            Remove logo
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    disabled={uploading}
                                    className="flex items-center gap-2 px-3 py-2
                                               text-sm rounded-[var(--radius-md)]
                                               border border-dashed transition-colors
                                               hover:border-[var(--primary-400)]
                                               hover:bg-[var(--primary-50)]"
                                    style={{
                                        borderColor: 'var(--border)',
                                        color: 'var(--text-secondary)',
                                    }}
                                >
                                    {uploading ? (
                                        <Spinner size="sm" />
                                    ) : (
                                        <Upload size={14} />
                                    )}
                                    Upload Logo (PNG/JPG, max 2MB)
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) onLogoUpload(index, file)
                                    e.target.value = ''
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function AccreditationGroupSection({
    category,
    items,
    onAdd,
    onUpdate,
    onRemove,
    onLogoUpload,
    uploadingIndex,
}: {
    category: ReturnType<typeof getAccreditationCategories>[number]
    items: Accreditation[]
    onAdd: () => void
    onUpdate: (index: number, field: string, value: any) => void
    onRemove: (index: number) => void
    onLogoUpload: (index: number, file: File) => void
    uploadingIndex: number | null
}) {
    const Icon = category.icon
    const [collapsed, setCollapsed] = useState(false)

    return (
        <div
            className="rounded-[var(--radius-lg)] border overflow-hidden"
            style={{ borderColor: 'var(--border)' }}
        >
            <button
                type="button"
                onClick={() => setCollapsed((p) => !p)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left
                           transition-colors hover:bg-[var(--bg-subtle)]"
                style={{ background: 'var(--bg-card)' }}
            >
                <div
                    className="w-8 h-8 rounded-[var(--radius-sm)] flex
                               items-center justify-center flex-shrink-0"
                    style={{
                        background: category.bg,
                        color: category.color,
                    }}
                >
                    <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                    <p
                        className="text-sm font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {category.label}
                        <span
                            className="ml-2 px-1.5 py-0.5 rounded text-xs font-medium"
                            style={{
                                background: category.bg,
                                color: category.color,
                            }}
                        >
                            {items.length}
                        </span>
                    </p>
                    <p
                        className="text-xs"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        {category.description}
                    </p>
                </div>
                {collapsed ? (
                    <ChevronDown
                        size={16}
                        style={{ color: 'var(--text-muted)' }}
                    />
                ) : (
                    <ChevronUp
                        size={16}
                        style={{ color: 'var(--text-muted)' }}
                    />
                )}
            </button>

            {!collapsed && (
                <div
                    className="p-4 space-y-3 border-t"
                    style={{
                        borderColor: 'var(--border)',
                        background: 'var(--bg-subtle)',
                    }}
                >
                    <div
                        className="flex items-start gap-2 p-2.5 rounded-[var(--radius-sm)]"
                        style={{
                            background: category.bg,
                            border: `1px solid ${category.color}22`,
                        }}
                    >
                        <Info
                            size={13}
                            className="mt-0.5 flex-shrink-0"
                            style={{ color: category.color }}
                        />
                        <p
                            className="text-xs"
                            style={{ color: category.color }}
                        >
                            Examples: {category.examples.join(', ')}
                        </p>
                    </div>

                    {items.length === 0 && (
                        <p
                            className="text-sm text-center py-4"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            No {category.label.toLowerCase()} added yet
                        </p>
                    )}

                    {items.map((item, idx) => (
                        <AccreditationItemEditor
                            key={idx}
                            item={item}
                            index={idx}
                            onUpdate={onUpdate}
                            onRemove={onRemove}
                            onLogoUpload={onLogoUpload}
                            uploading={uploadingIndex === idx}
                        />
                    ))}

                    <Button variant="secondary" size="sm" onClick={onAdd}>
                        <Plus size={13} />
                        Add {category.label}
                    </Button>
                </div>
            )}
        </div>
    )
}

// ────────────────────────────────────────────────────────────
// ✅ ENHANCED: Main Component with Preview
// ────────────────────────────────────────────────────────────

export function CertificateTab({
    schoolId,
    institutionType,
    subscriptionStatus = 'trial',
    isTrial = true,
}: CertificateTabProps) {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [alert, setAlert] = useState<{
        type: 'success' | 'error'
        msg: string
    } | null>(null)

    // ✅ NEW: Preview toggle state
    const [showPreview, setShowPreview] = useState(true)

    const [settings, setSettings] = useState<CertificateSettings>({
        enableDigitalSignature: false,
        digitalSignatureUrl: '',
        signatureName: '',
        signatureDesignation:
            institutionType === 'school'
                ? 'Principal'
                : institutionType === 'academy'
                    ? 'Director'
                    : 'Head of Institute',
        enableQRCode: true,
        qrCodePosition: 'bottom-right',
        showVerificationURL: true,
        defaultLayout: 'modern',
        showAccreditationsOnCertificate: true,
        watermarkText: '',
        enableWatermark: false,
    })

    const [accreditations, setAccreditations] =
        useState<AccreditationGroup>({
            affiliations: [],
            recognitions: [],
            registrations: [],
            partnerships: [],
        })

    // ✅ NEW: Branding data for preview
    const [branding, setBranding] = useState<{
        schoolName: string
        schoolLogo?: string
        address?: string
        phone?: string
        email?: string
    }>({
        schoolName: '',
    })

    const [signatureUploading, setSignatureUploading] = useState(false)
    const [accredUploadingIndex, setAccredUploadingIndex] = useState<{
        category: string
        index: number
    } | null>(null)

    const signatureFileRef = useRef<HTMLInputElement>(null)

    const accreditationCategories = getAccreditationCategories(institutionType)

    // ── Fetch Settings ───────────────────────────────────────
    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true)
            try {
                const res = await fetch('/api/settings/schools')
                const data = await res.json()

                // ✅ FIX 1: certificateSettings top-level hai
                if (data.certificateSettings) {
                    setSettings((prev) => ({
                        ...prev,
                        ...data.certificateSettings,
                    }))
                }

                // ✅ FIX 2: accreditations top-level hai
                if (data.accreditations) {
                    setAccreditations({
                        affiliations: data.accreditations.affiliations || [],
                        recognitions: data.accreditations.recognitions || [],
                        registrations: data.accreditations.registrations || [],
                        partnerships: data.accreditations.partnerships || [],
                    })
                }

                // ✅ FIX 3: branding data school object ke andar hai
                // data.name nahi — data.school.name hai!
                if (data.school) {
                    setBranding({
                        schoolName: data.school.name || 'Demo Institution',
                        schoolLogo: data.school.logo,
                        address: data.school.address,
                        phone: data.school.phone,
                        email: data.school.email,
                    })
                }
            } catch {
                // Use defaults silently
            } finally {
                setLoading(false)
            }
        }

        fetchSettings()
    }, [])

    // ── Save Settings ────────────────────────────────────────
    const handleSave = async () => {
        setSaving(true)
        setAlert(null)

        try {
            const res = await fetch('/api/settings/schools', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    certificateSettings: settings,
                    accreditations,
                }),
            })

            const data = await res.json()
            if (!res.ok)
                throw new Error(data.error || 'Failed to save')

            setAlert({
                type: 'success',
                msg: 'Certificate settings saved successfully',
            })
        } catch (err: any) {
            setAlert({ type: 'error', msg: err.message })
        } finally {
            setSaving(false)
        }
    }

    // ── Upload Signature ─────────────────────────────────────
    const handleSignatureUpload = async (file: File) => {
        if (file.size > 2 * 1024 * 1024) {
            setAlert({
                type: 'error',
                msg: 'Signature image must be less than 2MB',
            })
            return
        }

        setSignatureUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('folder', 'certificates/signatures')

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            const data = await res.json()
            if (!res.ok)
                throw new Error(data.error || 'Upload failed')

            setSettings((prev) => ({
                ...prev,
                digitalSignatureUrl: data.url,
            }))
            setAlert({
                type: 'success',
                msg: 'Signature uploaded successfully',
            })
        } catch (err: any) {
            setAlert({ type: 'error', msg: err.message })
        } finally {
            setSignatureUploading(false)
        }
    }

    // ── Upload Accreditation Logo ────────────────────────────
    const handleAccredLogoUpload = useCallback(
        async (
            category: keyof AccreditationGroup,
            index: number,
            file: File
        ) => {
            if (file.size > 2 * 1024 * 1024) {
                setAlert({
                    type: 'error',
                    msg: 'Logo must be less than 2MB',
                })
                return
            }

            setAccredUploadingIndex({ category, index })
            try {
                const formData = new FormData()
                formData.append('file', file)
                formData.append(
                    'folder',
                    'certificates/accreditations'
                )

                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                })

                const data = await res.json()
                if (!res.ok)
                    throw new Error(data.error || 'Upload failed')

                setAccreditations((prev) => {
                    const updated = [...prev[category]]
                    updated[index] = {
                        ...updated[index],
                        logoUrl: data.url,
                    }
                    return { ...prev, [category]: updated }
                })
            } catch (err: any) {
                setAlert({ type: 'error', msg: err.message })
            } finally {
                setAccredUploadingIndex(null)
            }
        },
        []
    )

    // ── Accreditation CRUD ───────────────────────────────────
    const addAccreditation = useCallback(
        (category: keyof AccreditationGroup) => {
            setAccreditations((prev) => ({
                ...prev,
                [category]: [
                    ...prev[category],
                    {
                        ...emptyAccreditation(),
                        displayOrder: prev[category].length,
                    },
                ],
            }))
        },
        []
    )

    const updateAccreditation = useCallback(
        (
            category: keyof AccreditationGroup,
            index: number,
            field: string,
            value: any
        ) => {
            setAccreditations((prev) => {
                const updated = [...prev[category]]
                updated[index] = { ...updated[index], [field]: value }
                return { ...prev, [category]: updated }
            })
        },
        []
    )

    const removeAccreditation = useCallback(
        (category: keyof AccreditationGroup, index: number) => {
            setAccreditations((prev) => ({
                ...prev,
                [category]: prev[category].filter((_, i) => i !== index),
            }))
        },
        []
    )

    // ── Loading State ────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <Spinner size="lg" />
            </div>
        )
    }

    const signatoryLabel =
        institutionType === 'school'
            ? 'Principal / Director'
            : institutionType === 'academy'
                ? 'Director / Academy Head'
                : 'Institute Head / Director'

    const sectionTitle =
        institutionType === 'school'
            ? 'Certificate Settings'
            : institutionType === 'academy'
                ? 'Academy Certificate Settings'
                : 'Institute Certificate Settings'

    // ── Render ───────────────────────────────────────────────
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ✅ LEFT COLUMN: Settings */}
            <div className="space-y-6">
                {isTrial && (
                    <div
                        className="flex items-start gap-3 p-3.5
                                   rounded-[var(--radius-md)] border text-sm"
                        style={{
                            background: 'var(--info-light)',
                            borderColor: 'rgba(59,130,246,0.2)',
                            color: 'var(--info-dark)',
                        }}
                    >
                        <Zap size={15} className="flex-shrink-0 mt-0.5" />
                        <p>
                            <strong>Trial Mode</strong> — Certificate
                            settings fully accessible. Configure
                            accreditations, signatures, and QR codes during
                            your trial period.
                        </p>
                    </div>
                )}

                {alert && (
                    <Alert
                        type={alert.type}
                        message={alert.msg}
                        onClose={() => setAlert(null)}
                    />
                )}

                {/* ✅ NEW: Preview Toggle */}
                <div className="flex items-center justify-between">
                    <h2
                        className="text-lg font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {sectionTitle}
                    </h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPreview(p => !p)}
                    >
                        {showPreview ? (
                            <>
                                <EyeOff size={14} />
                                Hide Preview
                            </>
                        ) : (
                            <>
                                <Eye size={14} />
                                Show Preview
                            </>
                        )}
                    </Button>
                </div>

                {/* Section 1: General Settings */}
                <SettingSection
                    title="General Settings"
                    description="Configure certificate layout and branding"
                >
                    <SettingRow
                        label="Default Certificate Layout"
                        description="Templates can override this setting"
                    >
                        <select
                            value={settings.defaultLayout}
                            onChange={(e) =>
                                setSettings((p) => ({
                                    ...p,
                                    defaultLayout: e.target.value as any,
                                }))
                            }
                            className="h-9 px-3 text-sm rounded-[var(--radius-md)]
                                       border border-[var(--border)]
                                       focus:outline-none
                                       focus:border-[var(--primary-500)]"
                            style={{
                                background: 'var(--bg-card)',
                                color: 'var(--text-primary)',
                            }}
                        >
                            <option value="modern">
                                Modern (Gold Accent)
                            </option>
                            <option value="classic">
                                Classic (Deep Blue)
                            </option>
                            <option value="elegant">
                                Elegant (Indigo)
                            </option>
                        </select>
                    </SettingRow>

                    <ToggleRow
                        label="Show Accreditations on Certificates"
                        description="Display affiliation & recognition logos"
                        checked={settings.showAccreditationsOnCertificate}
                        onChange={(v) =>
                            setSettings((p) => ({
                                ...p,
                                showAccreditationsOnCertificate: v,
                            }))
                        }
                    />

                    <ToggleRow
                        label="Enable Watermark"
                        description="Diagonal watermark text on certificates"
                        checked={settings.enableWatermark}
                        onChange={(v) =>
                            setSettings((p) => ({
                                ...p,
                                enableWatermark: v,
                            }))
                        }
                    />

                    {settings.enableWatermark && (
                        <SettingRow
                            label="Watermark Text"
                            description="Maximum 20 characters"
                        >
                            <input
                                type="text"
                                value={settings.watermarkText || ''}
                                onChange={(e) =>
                                    setSettings((p) => ({
                                        ...p,
                                        watermarkText: e.target.value,
                                    }))
                                }
                                placeholder="e.g. CERTIFIED, OFFICIAL"
                                maxLength={20}
                                className="input-clean w-48"
                            />
                        </SettingRow>
                    )}
                </SettingSection>

                {/* Section 2: QR Code Settings */}
                <SettingSection
                    title="QR Code & Verification"
                    description="Enable QR code for instant certificate verification"
                >
                    <ToggleRow
                        label="Enable QR Code"
                        description="Scannable QR code for instant verification"
                        checked={settings.enableQRCode}
                        onChange={(v) =>
                            setSettings((p) => ({
                                ...p,
                                enableQRCode: v,
                            }))
                        }
                    />

                    {settings.enableQRCode && (
                        <>
                            <SettingRow
                                label="QR Code Position"
                                description="Where to place QR on certificate"
                            >
                                <select
                                    value={settings.qrCodePosition}
                                    onChange={(e) =>
                                        setSettings((p) => ({
                                            ...p,
                                            qrCodePosition: e.target
                                                .value as any,
                                        }))
                                    }
                                    className="h-9 px-3 text-sm rounded-[var(--radius-md)]
                                               border border-[var(--border)]
                                               focus:outline-none
                                               focus:border-[var(--primary-500)]"
                                    style={{
                                        background: 'var(--bg-card)',
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    <option value="bottom-right">
                                        Bottom Right
                                    </option>
                                    <option value="bottom-left">
                                        Bottom Left
                                    </option>
                                    <option value="bottom-center">
                                        Bottom Center
                                    </option>
                                </select>
                            </SettingRow>

                            <ToggleRow
                                label="Show Verification URL"
                                description="Print the verification link below QR"
                                checked={settings.showVerificationURL}
                                onChange={(v) =>
                                    setSettings((p) => ({
                                        ...p,
                                        showVerificationURL: v,
                                    }))
                                }
                            />
                        </>
                    )}
                </SettingSection>

                {/* Section 3: Digital Signature */}
                <SettingSection
                    title="Digital Signature"
                    description="Upload scanned signature image for certificates"
                >
                    <ToggleRow
                        label="Enable Digital Signature"
                        description="Upload scanned signature image for certificates"
                        checked={settings.enableDigitalSignature}
                        onChange={(v) =>
                            setSettings((p) => ({
                                ...p,
                                enableDigitalSignature: v,
                            }))
                        }
                    />

                    {settings.enableDigitalSignature && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                                <SettingRow label={`${signatoryLabel} Name`}>
                                    <input
                                        type="text"
                                        value={
                                            settings.signatureName || ''
                                        }
                                        onChange={(e) =>
                                            setSettings((p) => ({
                                                ...p,
                                                signatureName:
                                                    e.target.value,
                                            }))
                                        }
                                        placeholder="e.g. Dr. Rajesh Kumar"
                                        className="input-clean w-full"
                                    />
                                </SettingRow>
                                <SettingRow label="Designation">
                                    <input
                                        type="text"
                                        value={
                                            settings.signatureDesignation ||
                                            ''
                                        }
                                        onChange={(e) =>
                                            setSettings((p) => ({
                                                ...p,
                                                signatureDesignation:
                                                    e.target.value,
                                            }))
                                        }
                                        placeholder={
                                            institutionType === 'school'
                                                ? 'e.g. Principal'
                                                : institutionType ===
                                                    'academy'
                                                    ? 'e.g. Director'
                                                    : 'e.g. Institute Head'
                                        }
                                        className="input-clean w-full"
                                    />
                                </SettingRow>
                            </div>

                            <SettingRow label="Signature Image">
                                {settings.digitalSignatureUrl ? (
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="px-4 py-2 rounded-[var(--radius-md)] border"
                                            style={{
                                                background:
                                                    'var(--bg-subtle)',
                                                borderColor:
                                                    'var(--border)',
                                            }}
                                        >
                                            <img
                                                src={
                                                    settings.digitalSignatureUrl
                                                }
                                                alt="Signature"
                                                className="h-14 object-contain"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() =>
                                                    signatureFileRef.current?.click()
                                                }
                                            >
                                                <Upload size={13} />
                                                Replace
                                            </Button>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() =>
                                                    setSettings((p) => ({
                                                        ...p,
                                                        digitalSignatureUrl:
                                                            '',
                                                    }))
                                                }
                                            >
                                                <Trash2 size={13} />
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            signatureFileRef.current?.click()
                                        }
                                        disabled={signatureUploading}
                                        className="flex items-center gap-2 px-4 py-2
                                                   text-sm rounded-[var(--radius-md)]
                                                   border-2 border-dashed
                                                   transition-colors
                                                   hover:border-[var(--primary-400)]
                                                   hover:bg-[var(--primary-50)]"
                                        style={{
                                            borderColor: 'var(--border)',
                                            color: 'var(--text-secondary)',
                                        }}
                                    >
                                        {signatureUploading ? (
                                            <>
                                                <Spinner size="sm" />
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={14} />
                                                Upload Signature
                                            </>
                                        )}
                                    </button>
                                )}

                                <input
                                    ref={signatureFileRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file)
                                            handleSignatureUpload(file)
                                        e.target.value = ''
                                    }}
                                />
                            </SettingRow>
                        </>
                    )}
                </SettingSection>

                {/* Section 4: Accreditations */}
                <SettingSection
                    title="Accreditations & Affiliations"
                    description={
                        institutionType === 'academy'
                            ? 'These logos will appear on certificates — add NSDC, NIELIT, ISO, industry tie-ups'
                            : institutionType === 'coaching'
                                ? 'Add CBSE affiliation, MSME registration, and other certifications'
                                : 'These logos will appear on certificates when "Show Accreditations" is enabled'
                    }
                >
                    <div className="space-y-3">
                        {accreditationCategories.map((category) => (
                            <AccreditationGroupSection
                                key={category.key}
                                category={category}
                                items={accreditations[category.key]}
                                onAdd={() =>
                                    addAccreditation(category.key)
                                }
                                onUpdate={(index, field, value) =>
                                    updateAccreditation(
                                        category.key,
                                        index,
                                        field,
                                        value
                                    )
                                }
                                onRemove={(index) =>
                                    removeAccreditation(category.key, index)
                                }
                                onLogoUpload={(index, file) =>
                                    handleAccredLogoUpload(
                                        category.key,
                                        index,
                                        file
                                    )
                                }
                                uploadingIndex={
                                    accredUploadingIndex?.category ===
                                        category.key
                                        ? accredUploadingIndex.index
                                        : null
                                }
                            />
                        ))}
                    </div>
                </SettingSection>

                <SaveBar
                    isDirty={true}
                    onSave={handleSave}
                    onDiscard={() => { }}
                    saving={saving}
                />
            </div>

            {/* ✅ RIGHT COLUMN: Live Preview */}
            {showPreview && (
                <div className="lg:sticky lg:top-6 h-fit">
                    <CertificatePreview
                        settings={settings}
                        accreditations={accreditations}
                        branding={branding}
                        institutionType={institutionType}
                        autoRefresh={true}
                    />
                </div>
            )}
        </div>
    )
}