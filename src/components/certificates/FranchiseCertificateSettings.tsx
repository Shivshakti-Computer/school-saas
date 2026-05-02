// FILE: src/components/certificates/FranchiseCertificateSettings.tsx
// FIX: ToggleRow component use kiya (NotificationsTab jaisa)

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
    Shield,
    Building2,
    Handshake,
    Info,
    ChevronDown,
    ChevronUp,
    Image as ImageIcon,
    X,
} from 'lucide-react'
import { Button, Alert, Spinner } from '@/components/ui'
// ✅ ADD: ToggleRow import
import { ToggleRow, SettingRow } from '@/components/settings/shared/SettingRow'
import { SettingSection } from '@/components/settings/shared/SettingSection'

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

interface FranchiseAccreditation {
    name: string
    logoUrl: string
    registrationNo?: string
    issuedBy?: string
    validFrom?: string
    validUntil?: string
    isActive: boolean
    displayOrder: number
}

interface FranchiseCertSettings {
    enableOwnBranding: boolean
    showParentBranding: boolean
    enableDigitalSignature: boolean
    digitalSignatureUrl?: string
    signatureName?: string
    signatureDesignation?: string
    enableQRCode: boolean
    qrCodePosition: 'bottom-left' | 'bottom-right' | 'bottom-center'
    customCertificatePrefix?: string
    allowIndependentAccreditations: boolean
    inheritParentAccreditations: boolean
}

interface FranchiseCertificateSettingsProps {
    franchiseId: string
    franchiseName: string
    onSaved?: () => void
}

// ────────────────────────────────────────────────────────────
// Franchise Accreditation Categories
// ────────────────────────────────────────────────────────────

const FRANCHISE_ACCRED_CATEGORIES = [
    {
        key: 'registrations' as const,
        label: 'Local Registrations',
        description: 'MSME, Local authority registrations',
        icon: Building2,
        color: 'var(--warning)',
        bg: 'var(--warning-light)',
        examples: ['MSME', 'Local Authority', 'GST', 'Trade License'],
    },
    {
        key: 'partnerships' as const,
        label: 'Local Partnerships',
        description: 'Local tie-ups and collaborations',
        icon: Handshake,
        color: 'var(--info)',
        bg: 'var(--info-light)',
        examples: ['Local Companies', 'Institutions', 'NGOs'],
    },
    {
        key: 'awards' as const,
        label: 'Awards & Achievements',
        description: 'Local awards and recognitions',
        icon: Award,
        color: 'var(--primary-500)',
        bg: 'var(--primary-50)',
        examples: ['Best Branch', 'Quality Award', 'Local Recognition'],
    },
]

// ────────────────────────────────────────────────────────────
// Sub-Component: Simple Accreditation Editor
// ────────────────────────────────────────────────────────────

function FranchiseAccreditationEditor({
    item,
    index,
    onUpdate,
    onRemove,
    onLogoUpload,
    uploading,
}: {
    item: FranchiseAccreditation
    index: number
    onUpdate: (index: number, field: string, value: any) => void
    onRemove: (index: number) => void
    onLogoUpload: (index: number, file: File) => void
    uploading: boolean
}) {
    const fileRef = useRef<HTMLInputElement>(null)
    const [expanded, setExpanded] = useState(!item.logoUrl)

    return (
        <div
            className="rounded-[var(--radius-md)] border overflow-hidden"
            style={{ borderColor: 'var(--border)' }}
        >
            {/* Header */}
            <div
                className="flex items-center gap-3 px-4 py-3"
                style={{ background: 'var(--bg-subtle)' }}
            >
                {/* Logo */}
                <div
                    className="w-9 h-9 rounded-[var(--radius-sm)] border
                               flex items-center justify-center overflow-hidden flex-shrink-0"
                    style={{
                        background: 'var(--bg-card)',
                        borderColor: 'var(--border)',
                    }}
                >
                    {item.logoUrl ? (
                        <img
                            src={item.logoUrl}
                            alt={item.name}
                            className="w-full h-full object-contain p-0.5"
                        />
                    ) : (
                        <ImageIcon
                            size={14}
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
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={item.isActive}
                        onChange={e =>
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
                    onClick={() => setExpanded(p => !p)}
                    className="p-1 rounded hover:bg-[var(--bg-muted)] transition-colors"
                >
                    {expanded ? (
                        <ChevronUp
                            size={13}
                            style={{ color: 'var(--text-muted)' }}
                        />
                    ) : (
                        <ChevronDown
                            size={13}
                            style={{ color: 'var(--text-muted)' }}
                        />
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="p-1 rounded hover:bg-[var(--danger-light)] transition-colors"
                >
                    <Trash2 size={13} style={{ color: 'var(--danger)' }} />
                </button>
            </div>

            {expanded && (
                <div className="px-4 py-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="input-label">Name *</label>
                            <input
                                type="text"
                                value={item.name}
                                onChange={e =>
                                    onUpdate(index, 'name', e.target.value)
                                }
                                placeholder="e.g. MSME, Local Award"
                                className="input-clean"
                            />
                        </div>
                        <div>
                            <label className="input-label">Reg. No.</label>
                            <input
                                type="text"
                                value={item.registrationNo || ''}
                                onChange={e =>
                                    onUpdate(
                                        index,
                                        'registrationNo',
                                        e.target.value
                                    )
                                }
                                placeholder="Certificate number"
                                className="input-clean"
                            />
                        </div>
                    </div>

                    {/* Logo Upload */}
                    <div>
                        <label className="input-label">Logo</label>
                        {item.logoUrl ? (
                            <div className="flex items-center gap-3">
                                <img
                                    src={item.logoUrl}
                                    alt={item.name}
                                    className="w-12 h-12 object-contain rounded-[var(--radius-sm)] border p-1"
                                    style={{
                                        borderColor: 'var(--border)',
                                        background: 'var(--bg-card)',
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        onUpdate(index, 'logoUrl', '')
                                    }
                                    className="text-xs"
                                    style={{ color: 'var(--danger)' }}
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                disabled={uploading}
                                className="flex items-center gap-2 px-3 py-2 text-sm
                                           rounded-[var(--radius-md)] border border-dashed
                                           transition-colors hover:border-[var(--primary-400)]
                                           hover:bg-[var(--primary-50)]"
                                style={{
                                    borderColor: 'var(--border)',
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                {uploading ? (
                                    <Spinner size="sm" />
                                ) : (
                                    <Upload size={13} />
                                )}
                                Upload Logo
                            </button>
                        )}

                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            className="hidden"
                            onChange={e => {
                                const file = e.target.files?.[0]
                                if (file) onLogoUpload(index, file)
                                e.target.value = ''
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

// ────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────

export function FranchiseCertificateSettings({
    franchiseId,
    franchiseName,
    onSaved,
}: FranchiseCertificateSettingsProps) {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [alert, setAlert] = useState<{
        type: 'success' | 'error'
        msg: string
    } | null>(null)

    // Certificate settings
    const [settings, setSettings] = useState<FranchiseCertSettings>({
        enableOwnBranding: true,
        showParentBranding: true,
        enableDigitalSignature: false,
        digitalSignatureUrl: '',
        signatureName: '',
        signatureDesignation: 'Branch Head',
        enableQRCode: true,
        qrCodePosition: 'bottom-right',
        customCertificatePrefix: '',
        allowIndependentAccreditations: true,
        inheritParentAccreditations: true,
    })

    // Accreditations
    const [accreditations, setAccreditations] = useState<{
        registrations: FranchiseAccreditation[]
        partnerships: FranchiseAccreditation[]
        awards: FranchiseAccreditation[]
    }>({
        registrations: [],
        partnerships: [],
        awards: [],
    })

    const [signatureUploading, setSignatureUploading] = useState(false)
    const [accredUploadingIndex, setAccredUploadingIndex] = useState<{
        category: string
        index: number
    } | null>(null)

    const signatureFileRef = useRef<HTMLInputElement>(null)

    // ── Fetch Settings ───────────────────────────────────────

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/franchises?id=${franchiseId}`)
                const data = await res.json()
                const franchise = data.franchise

                if (franchise?.certificateSettings) {
                    setSettings(prev => ({
                        ...prev,
                        ...franchise.certificateSettings,
                    }))
                }

                if (franchise?.accreditations) {
                    setAccreditations({
                        registrations:
                            franchise.accreditations.registrations || [],
                        partnerships:
                            franchise.accreditations.partnerships || [],
                        awards: franchise.accreditations.awards || [],
                    })
                }
            } catch {
                // Use defaults
            } finally {
                setLoading(false)
            }
        }

        fetchSettings()
    }, [franchiseId])

    // ── Save Settings ────────────────────────────────────────

    const handleSave = async () => {
        setSaving(true)
        setAlert(null)

        try {
            const res = await fetch(`/api/franchises?id=${franchiseId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    certificateSettings: settings,
                    accreditations,
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to save')

            setAlert({
                type: 'success',
                msg: 'Certificate settings saved successfully',
            })
            onSaved?.()
        } catch (err: any) {
            setAlert({ type: 'error', msg: err.message })
        } finally {
            setSaving(false)
        }
    }

    // ── Upload Signature ─────────────────────────────────────

    const handleSignatureUpload = async (file: File) => {
        if (file.size > 2 * 1024 * 1024) {
            setAlert({ type: 'error', msg: 'File must be less than 2MB' })
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
            if (!res.ok) throw new Error(data.error || 'Upload failed')

            setSettings(prev => ({
                ...prev,
                digitalSignatureUrl: data.url,
            }))
        } catch (err: any) {
            setAlert({ type: 'error', msg: err.message })
        } finally {
            setSignatureUploading(false)
        }
    }

    // ── Upload Accreditation Logo ────────────────────────────

    const handleAccredLogoUpload = useCallback(async (
        category: 'registrations' | 'partnerships' | 'awards',
        index: number,
        file: File
    ) => {
        if (file.size > 2 * 1024 * 1024) {
            setAlert({ type: 'error', msg: 'Logo must be less than 2MB' })
            return
        }

        setAccredUploadingIndex({ category, index })
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('folder', 'certificates/accreditations')

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Upload failed')

            setAccreditations(prev => {
                const updated = [...prev[category]]
                updated[index] = { ...updated[index], logoUrl: data.url }
                return { ...prev, [category]: updated }
            })
        } catch (err: any) {
            setAlert({ type: 'error', msg: err.message })
        } finally {
            setAccredUploadingIndex(null)
        }
    }, [])

    // ── Accreditation CRUD ───────────────────────────────────

    const addAccreditation = (
        category: 'registrations' | 'partnerships' | 'awards'
    ) => {
        setAccreditations(prev => ({
            ...prev,
            [category]: [
                ...prev[category],
                {
                    name: '',
                    logoUrl: '',
                    registrationNo: '',
                    isActive: true,
                    displayOrder: prev[category].length,
                },
            ],
        }))
    }

    const updateAccreditation = (
        category: 'registrations' | 'partnerships' | 'awards',
        index: number,
        field: string,
        value: any
    ) => {
        setAccreditations(prev => {
            const updated = [...prev[category]]
            updated[index] = { ...updated[index], [field]: value }
            return { ...prev, [category]: updated }
        })
    }

    const removeAccreditation = (
        category: 'registrations' | 'partnerships' | 'awards',
        index: number
    ) => {
        setAccreditations(prev => ({
            ...prev,
            [category]: prev[category].filter((_, i) => i !== index),
        }))
    }

    // ── Loading ──────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Spinner size="lg" />
            </div>
        )
    }

    // ── Render ───────────────────────────────────────────────

    return (
        <div className="space-y-6 max-w-2xl">
            {alert && (
                <Alert
                    type={alert.type}
                    message={alert.msg}
                    onClose={() => setAlert(null)}
                />
            )}

            {/* Franchise Info Banner */}
            <div
                className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] border"
                style={{
                    background: 'var(--primary-50)',
                    borderColor: 'var(--primary-200)',
                }}
            >
                <Building2
                    size={18}
                    style={{ color: 'var(--primary-600)' }}
                />
                <div>
                    <p
                        className="text-sm font-semibold"
                        style={{ color: 'var(--primary-700)' }}
                    >
                        {franchiseName}
                    </p>
                    <p
                        className="text-xs"
                        style={{ color: 'var(--primary-600)' }}
                    >
                        Certificate settings for this franchise branch
                    </p>
                </div>
            </div>

            {/* ── Section 1: Branding Settings ─────────────── */}
            <SettingSection
                title="Branding Settings"
                description="Configure logo and branding options for certificates"
            >
                {/* ✅ FIX: ToggleRow use kiya */}
                <ToggleRow
                    label="Show Franchise Logo"
                    description="Display this franchise's logo on certificates"
                    checked={settings.enableOwnBranding}
                    onChange={(v) =>
                        setSettings(p => ({
                            ...p,
                            enableOwnBranding: v,
                        }))
                    }
                />

                {/* ✅ FIX: ToggleRow use kiya */}
                <ToggleRow
                    label="Show Parent Academy Logo"
                    description="Also display parent institution's branding"
                    checked={settings.showParentBranding}
                    onChange={(v) =>
                        setSettings(p => ({
                            ...p,
                            showParentBranding: v,
                        }))
                    }
                />

                {/* ✅ FIX: ToggleRow use kiya */}
                <ToggleRow
                    label="Inherit Parent Accreditations"
                    description="Show parent academy's affiliations & recognitions"
                    checked={settings.inheritParentAccreditations}
                    onChange={(v) =>
                        setSettings(p => ({
                            ...p,
                            inheritParentAccreditations: v,
                        }))
                    }
                />

                {/* Custom Certificate Prefix */}
                <SettingRow
                    label="Certificate Number Prefix (Optional)"
                    description="Leave empty to use parent institution prefix. Max 6 alphanumeric characters."
                >
                    <input
                        type="text"
                        value={settings.customCertificatePrefix || ''}
                        onChange={e =>
                            setSettings(p => ({
                                ...p,
                                customCertificatePrefix: e.target.value
                                    .toUpperCase()
                                    .replace(/[^A-Z0-9]/g, '')
                                    .slice(0, 6),
                            }))
                        }
                        placeholder="e.g. DEL01"
                        maxLength={6}
                        className="input-clean uppercase font-mono w-32"
                    />
                </SettingRow>
            </SettingSection>

            {/* ── Section 2: QR Settings ────────────────────── */}
            <SettingSection
                title="QR Code Settings"
                description="Enable QR code for certificate verification"
            >
                {/* ✅ FIX: ToggleRow use kiya */}
                <ToggleRow
                    label="Enable QR Code"
                    description="Scannable QR code for instant verification"
                    checked={settings.enableQRCode}
                    onChange={(v) =>
                        setSettings(p => ({
                            ...p,
                            enableQRCode: v,
                        }))
                    }
                />

                {settings.enableQRCode && (
                    <SettingRow
                        label="QR Code Position"
                        description="Where to place QR on certificate"
                    >
                        <select
                            value={settings.qrCodePosition}
                            onChange={e =>
                                setSettings(p => ({
                                    ...p,
                                    qrCodePosition: e.target.value as any,
                                }))
                            }
                            className="h-9 px-3 text-sm rounded-[var(--radius-md)]
                                       border border-[var(--border)]
                                       focus:outline-none focus:border-[var(--primary-500)]"
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
                )}
            </SettingSection>

            {/* ── Section 3: Digital Signature ─────────────── */}
            <SettingSection
                title="Digital Signature"
                description="Branch head or manager signature on certificates"
            >
                {/* ✅ FIX: ToggleRow use kiya */}
                <ToggleRow
                    label="Enable Digital Signature"
                    description="Branch head or manager signature on certificates"
                    checked={settings.enableDigitalSignature}
                    onChange={(v) =>
                        setSettings(p => ({
                            ...p,
                            enableDigitalSignature: v,
                        }))
                    }
                />

                {settings.enableDigitalSignature && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                            <SettingRow label="Signatory Name">
                                <input
                                    type="text"
                                    value={settings.signatureName || ''}
                                    onChange={e =>
                                        setSettings(p => ({
                                            ...p,
                                            signatureName: e.target.value,
                                        }))
                                    }
                                    placeholder="Branch Manager Name"
                                    className="input-clean w-full"
                                />
                            </SettingRow>
                            <SettingRow label="Designation">
                                <input
                                    type="text"
                                    value={
                                        settings.signatureDesignation || ''
                                    }
                                    onChange={e =>
                                        setSettings(p => ({
                                            ...p,
                                            signatureDesignation:
                                                e.target.value,
                                        }))
                                    }
                                    placeholder="Branch Head"
                                    className="input-clean w-full"
                                />
                            </SettingRow>
                        </div>

                        <SettingRow label="Signature Image">
                            {settings.digitalSignatureUrl ? (
                                <div className="flex items-center gap-4">
                                    <div
                                        className="px-4 py-2 rounded-[var(--radius-md)] border"
                                        style={{
                                            background: 'var(--bg-subtle)',
                                            borderColor: 'var(--border)',
                                        }}
                                    >
                                        <img
                                            src={settings.digitalSignatureUrl}
                                            alt="Signature"
                                            className="h-14 object-contain"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSettings(p => ({
                                                ...p,
                                                digitalSignatureUrl: '',
                                            }))
                                        }
                                        className="text-xs"
                                        style={{ color: 'var(--danger)' }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() =>
                                        signatureFileRef.current?.click()
                                    }
                                    disabled={signatureUploading}
                                    className="flex items-center gap-2 px-4 py-2 text-sm
                                               rounded-[var(--radius-md)] border-2 border-dashed
                                               transition-colors
                                               hover:border-[var(--primary-400)]
                                               hover:bg-[var(--primary-50)]"
                                    style={{
                                        borderColor: 'var(--border)',
                                        color: 'var(--text-secondary)',
                                    }}
                                >
                                    {signatureUploading ? (
                                        <Spinner size="sm" />
                                    ) : (
                                        <Upload size={14} />
                                    )}
                                    Upload Signature Image
                                </button>
                            )}

                            <input
                                ref={signatureFileRef}
                                type="file"
                                accept="image/png,image/jpeg"
                                className="hidden"
                                onChange={e => {
                                    const file = e.target.files?.[0]
                                    if (file) handleSignatureUpload(file)
                                    e.target.value = ''
                                }}
                            />
                        </SettingRow>
                    </>
                )}
            </SettingSection>

            {/* ── Section 4: Franchise Accreditations ──────── */}
            {settings.allowIndependentAccreditations && (
                <SettingSection
                    title="Franchise Accreditations"
                    description="These logos will appear alongside parent institution accreditations on certificates"
                >
                    <div className="space-y-3">
                        {FRANCHISE_ACCRED_CATEGORIES.map(category => {
                            const Icon = category.icon
                            const items =
                                accreditations[
                                category.key as
                                | 'registrations'
                                | 'partnerships'
                                | 'awards'
                                ]

                            return (
                                <div
                                    key={category.key}
                                    className="rounded-[var(--radius-lg)] border overflow-hidden"
                                    style={{ borderColor: 'var(--border)' }}
                                >
                                    <div
                                        className="flex items-center gap-3 px-4 py-3"
                                        style={{ background: 'var(--bg-subtle)' }}
                                    >
                                        <div
                                            className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center flex-shrink-0"
                                            style={{
                                                background: category.bg,
                                                color: category.color,
                                            }}
                                        >
                                            <Icon size={14} />
                                        </div>
                                        <div className="flex-1">
                                            <p
                                                className="text-sm font-semibold"
                                                style={{
                                                    color:
                                                        'var(--text-primary)',
                                                }}
                                            >
                                                {category.label}
                                                <span
                                                    className="ml-2 px-1.5 py-0.5 rounded text-xs"
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
                                                style={{
                                                    color: 'var(--text-muted)',
                                                }}
                                            >
                                                {category.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div
                                        className="p-3 space-y-2 border-t"
                                        style={{
                                            borderColor: 'var(--border)',
                                        }}
                                    >
                                        {items.length === 0 && (
                                            <p
                                                className="text-sm text-center py-2"
                                                style={{
                                                    color: 'var(--text-muted)',
                                                }}
                                            >
                                                No items added
                                            </p>
                                        )}

                                        {items.map((item, idx) => (
                                            <FranchiseAccreditationEditor
                                                key={idx}
                                                item={item}
                                                index={idx}
                                                onUpdate={(i, f, v) =>
                                                    updateAccreditation(
                                                        category.key as any,
                                                        i,
                                                        f,
                                                        v
                                                    )
                                                }
                                                onRemove={i =>
                                                    removeAccreditation(
                                                        category.key as any,
                                                        i
                                                    )
                                                }
                                                onLogoUpload={(i, file) =>
                                                    handleAccredLogoUpload(
                                                        category.key as any,
                                                        i,
                                                        file
                                                    )
                                                }
                                                uploading={
                                                    accredUploadingIndex?.category ===
                                                        category.key &&
                                                    accredUploadingIndex?.index ===
                                                        idx
                                                }
                                            />
                                        ))}

                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() =>
                                                addAccreditation(
                                                    category.key as any
                                                )
                                            }
                                        >
                                            <Plus size={12} />
                                            Add
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </SettingSection>
            )}

            {/* Save Button */}
            <div
                className="flex justify-end pt-4 border-t"
                style={{ borderColor: 'var(--border)' }}
            >
                <Button onClick={handleSave} loading={saving}>
                    <Save size={15} />
                    Save Settings
                </Button>
            </div>
        </div>
    )
}