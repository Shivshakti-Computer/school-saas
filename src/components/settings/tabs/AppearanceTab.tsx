// FILE: src/components/settings/tabs/AppearanceTab.tsx
// ═══════════════════════════════════════════════════════════
// CHANGES:
// 1. Plan gating add kiya — pricing.ts ke PLANS se
// 2. applyAndSaveTheme — save hone pe turant DOM update
// 3. Logo upload section add kiya (SchoolProfile se alag)
// 4. Locked features visually indicate kiye
// ═══════════════════════════════════════════════════════════

'use client'

import { useState, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
    Lock, Upload, X, CheckCircle2,
    Info, AlertTriangle,
} from 'lucide-react'
import { SettingSection } from '../shared/SettingSection'
import { SettingRow, ToggleRow } from '../shared/SettingRow'
import { SaveBar } from '../shared/SaveButton'
import { applyAndSaveTheme } from '@/hooks/usePortalTheme'
import { isValidHexColor } from '@/types/settings'
import { PLANS } from '@/config/pricing'
import type { IAppearanceSettings } from '@/types/settings'
import type { PlanId } from '@/config/pricing'

// ─────────────────────────────────────────────────────────
// Plan Feature Gates
// ─────────────────────────────────────────────────────────
const APPEARANCE_PLAN_GATES = {
    logoUpload: ['starter', 'growth', 'pro', 'enterprise'],  // All plans
    themeColors: ['growth', 'pro', 'enterprise'],             // Growth+
    darkMode: ['growth', 'pro', 'enterprise'],             // Growth+
    printHeader: ['pro', 'enterprise'],                       // Pro+
    customTagline: ['pro', 'enterprise'],                       // Pro+
} as const

const PLAN_ORDER: Record<string, number> = {
    starter: 1, growth: 2, pro: 3, enterprise: 4,
}

function isPlanFeatureAllowed(
    currentPlan: string,
    feature: keyof typeof APPEARANCE_PLAN_GATES
): boolean {
    const allowed = APPEARANCE_PLAN_GATES[feature] as readonly string[]
    return allowed.includes(currentPlan)
}

// ─────────────────────────────────────────────────────────
// Locked Feature Overlay
// ─────────────────────────────────────────────────────────
function LockedFeature({
    requiredPlan,
    children,
}: {
    requiredPlan: string
    children: React.ReactNode
}) {
    const plan = PLANS[requiredPlan as PlanId]
    const planLabel = plan?.name || requiredPlan

    return (
        <div className="relative">
            {/* Blurred content */}
            <div className="pointer-events-none select-none opacity-40 blur-[1px]">
                {children}
            </div>

            {/* Lock overlay */}
            <div
                className="
          absolute inset-0 flex flex-col items-center justify-center
          rounded-[var(--radius-md)] z-10
        "
                style={{
                    background: 'rgba(var(--bg-card), 0.85)',
                    backdropFilter: 'blur(2px)',
                }}
            >
                <div
                    className="
            w-10 h-10 rounded-full flex items-center justify-center mb-2
          "
                    style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)' }}
                >
                    <Lock size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
                <p
                    className="text-xs font-700 mb-0.5"
                    style={{ color: 'var(--text-primary)' }}
                >
                    {planLabel} Plan Required
                </p>
                <a
                    href="/admin/subscription"
                    className="text-xs font-600 underline"
                    style={{ color: 'var(--primary-500)' }}
                >
                    Upgrade →
                </a>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────
// Color Presets
// ─────────────────────────────────────────────────────────
const PRESET_COLORS = [
    { label: 'Indigo', primary: '#6366f1', accent: '#f97316' },
    { label: 'Blue', primary: '#3b82f6', accent: '#f59e0b' },
    { label: 'Emerald', primary: '#10b981', accent: '#6366f1' },
    { label: 'Violet', primary: '#8b5cf6', accent: '#f97316' },
    { label: 'Rose', primary: '#f43f5e', accent: '#3b82f6' },
    { label: 'Teal', primary: '#14b8a6', accent: '#f97316' },
    { label: 'Amber', primary: '#f59e0b', accent: '#6366f1' },
    { label: 'Slate', primary: '#475569', accent: '#6366f1' },
]

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────
interface AppearanceTabProps {
    appearance: IAppearanceSettings
    schoolName: string
    onSaved: (updated: IAppearanceSettings) => void
}

export function AppearanceTab({
    appearance,
    schoolName,
    onSaved,
}: AppearanceTabProps) {
    const { data: session, update: updateSession } = useSession()
    const currentPlan = (session?.user?.plan || 'starter') as string
    const tenantId = session?.user?.tenantId || ''

    const [form, setForm] = useState<IAppearanceSettings>({ ...appearance })
    const [isDirty, setIsDirty] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [colorErrors, setColorErrors] = useState<{
        primary?: string; accent?: string
    }>({})

    // Logo upload state
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [dragOver, setDragOver] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Feature permission helpers
    const canTheme = isPlanFeatureAllowed(currentPlan, 'themeColors')
    const canDarkMode = isPlanFeatureAllowed(currentPlan, 'darkMode')
    const canPrint = isPlanFeatureAllowed(currentPlan, 'printHeader')
    const canTagline = isPlanFeatureAllowed(currentPlan, 'customTagline')

    const update = <K extends keyof IAppearanceSettings>(
        field: K,
        val: IAppearanceSettings[K]
    ) => {
        setForm((prev) => ({ ...prev, [field]: val }))
        setIsDirty(true)
        setError(null)
    }

    const updateTheme = (
        field: keyof IAppearanceSettings['portalTheme'],
        val: string
    ) => {
        if (!canTheme && field !== 'darkMode') return
        if (!canDarkMode && field === 'darkMode') return
        setForm((prev) => ({
            ...prev,
            portalTheme: { ...prev.portalTheme, [field]: val },
        }))
        setIsDirty(true)
        setError(null)
    }

    const updatePrintHeader = (
        field: keyof IAppearanceSettings['printHeader'],
        val: any
    ) => {
        if (!canPrint) return
        setForm((prev) => ({
            ...prev,
            printHeader: { ...prev.printHeader, [field]: val },
        }))
        setIsDirty(true)
    }

    const applyPreset = (preset: typeof PRESET_COLORS[0]) => {
        if (!canTheme) return
        setForm((prev) => ({
            ...prev,
            portalTheme: {
                ...prev.portalTheme,
                primaryColor: preset.primary,
                accentColor: preset.accent,
            },
        }))
        setIsDirty(true)
        setColorErrors({})

        // Live preview — turant apply karo (save se pehle bhi)
        applyAndSaveTheme(
            tenantId,
            preset.primary,
            preset.accent,
            form.portalTheme?.darkMode || 'light'
        )
    }

    // ── Logo Upload ──
    const handleLogoUpload = useCallback(async (file: File) => {
        const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
        const MAX_BYTES = 2 * 1024 * 1024

        if (!ALLOWED.includes(file.type)) {
            setUploadError('Invalid file type. Use JPG, PNG, WebP, or SVG')
            return
        }
        if (file.size > MAX_BYTES) {
            setUploadError('File too large. Max 2MB')
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

            setForm((prev) => ({ ...prev, schoolLogo: data.url, schoolLogoPublicId: data.publicId }))
            setSuccess('Logo uploaded successfully')

            // Session update karo — sidebar mein turant logo dikhega
            await updateSession({ schoolLogo: data.url })

        } catch (err: any) {
            setUploadError(err.message || 'Upload failed')
        } finally {
            setUploading(false)
        }
    }, [updateSession])

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

    // ── Save ──
    const handleSave = async () => {
        // Validate colors (only if plan allows)
        if (canTheme) {
            const errors: typeof colorErrors = {}
            if (
                form.portalTheme?.primaryColor &&
                !isValidHexColor(form.portalTheme.primaryColor)
            ) {
                errors.primary = 'Invalid hex color'
            }
            if (
                form.portalTheme?.accentColor &&
                !isValidHexColor(form.portalTheme.accentColor)
            ) {
                errors.accent = 'Invalid hex color'
            }
            if (Object.keys(errors).length) {
                setColorErrors(errors)
                throw new Error('Invalid color values')
            }
        }

        setSaving(true)
        setError(null)
        setSuccess(null)

        try {
            // Only send what plan allows
            const payload: Partial<IAppearanceSettings> = {}

            if (canTheme || canDarkMode) {
                payload.portalTheme = {
                    primaryColor: canTheme ? form.portalTheme?.primaryColor || '#6366f1' : appearance.portalTheme?.primaryColor || '#6366f1',
                    accentColor: canTheme ? form.portalTheme?.accentColor || '#f97316' : appearance.portalTheme?.accentColor || '#f97316',
                    darkMode: canDarkMode ? form.portalTheme?.darkMode || 'light' : appearance.portalTheme?.darkMode || 'light',
                }
            }

            if (canPrint) {
                payload.printHeader = form.printHeader
            }

            const res = await fetch('/api/settings/appearance', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Save failed')

            // ✅ Turant theme apply karo — no reload needed
            if (canTheme || canDarkMode) {
                applyAndSaveTheme(
                    tenantId,
                    payload.portalTheme?.primaryColor || '#6366f1',
                    payload.portalTheme?.accentColor || '#f97316',
                    payload.portalTheme?.darkMode || 'light'
                )
            }

            setIsDirty(false)
            setSuccess('Appearance settings saved and applied!')
            onSaved(form)

        } catch (err: any) {
            setError(err.message)
            throw err
        } finally {
            setSaving(false)
        }
    }

    const handleDiscard = () => {
        setForm({ ...appearance })
        setIsDirty(false)
        setError(null)
        setSuccess(null)
        setColorErrors({})
        // Revert theme preview
        if (canTheme) {
            applyAndSaveTheme(
                tenantId,
                appearance.portalTheme?.primaryColor || '#6366f1',
                appearance.portalTheme?.accentColor || '#f97316',
                appearance.portalTheme?.darkMode || 'light'
            )
        }
    }

    const primaryColor = form.portalTheme?.primaryColor || '#6366f1'
    const accentColor = form.portalTheme?.accentColor || '#f97316'

    return (
        <div className="space-y-5 portal-content-enter">

            {/* Alerts */}
            {error && (
                <div
                    className="p-3.5 rounded-[var(--radius-md)] border text-sm"
                    style={{
                        background: 'var(--danger-light)',
                        borderColor: 'rgba(239,68,68,0.2)',
                        color: 'var(--danger-dark)',
                    }}
                >
                    {error}
                </div>
            )}
            {success && (
                <div
                    className="flex items-center gap-2 p-3.5 rounded-[var(--radius-md)] border text-sm"
                    style={{
                        background: 'var(--success-light)',
                        borderColor: 'rgba(16,185,129,0.2)',
                        color: 'var(--success-dark)',
                    }}
                >
                    <CheckCircle2 size={15} />
                    {success}
                </div>
            )}

            {/* Plan info banner */}
            {currentPlan === 'starter' && (
                <div
                    className="flex items-start gap-3 p-3.5 rounded-[var(--radius-md)] border text-sm"
                    style={{
                        background: 'var(--info-light)',
                        borderColor: 'rgba(59,130,246,0.2)',
                        color: 'var(--info-dark)',
                    }}
                >
                    <Info size={15} className="flex-shrink-0 mt-0.5" />
                    <p>
                        <strong>Starter Plan:</strong> Logo upload available.
                        Upgrade to <strong>Growth</strong> for theme colors,
                        <strong> Pro</strong> for print settings.
                    </p>
                </div>
            )}

            {/* ── School Logo (All Plans) ── */}
            <SettingSection
                title="School Logo"
                description="Shown in sidebar, reports, receipts and print documents"
                badge={{ label: 'All Plans', color: 'success' }}
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
                            {form.schoolLogo ? (
                                <img
                                    src={form.schoolLogo}
                                    alt="School logo"
                                    className="w-full h-full object-contain p-1"
                                />
                            ) : (
                                <div
                                    className="
                    w-full h-full flex items-center justify-center
                    text-2xl font-bold
                  "
                                    style={{
                                        background: `linear-gradient(135deg, var(--primary-100), var(--primary-50))`,
                                        color: 'var(--primary-500)',
                                    }}
                                >
                                    {schoolName.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        {form.schoolLogo && (
                            <p className="text-[10px] text-center mt-1" style={{ color: 'var(--text-muted)' }}>
                                Current logo
                            </p>
                        )}
                    </div>

                    {/* Upload */}
                    <div className="flex-1 min-w-0">
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className="
                relative border-2 border-dashed rounded-[var(--radius-md)]
                p-5 text-center cursor-pointer
                transition-all duration-150
              "
                            style={{
                                borderColor: dragOver
                                    ? 'var(--primary-400)'
                                    : 'var(--border)',
                                background: dragOver
                                    ? 'var(--primary-50)'
                                    : 'transparent',
                            }}
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
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                        Uploading to Cloudinary...
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-1.5">
                                    <Upload size={20} style={{ color: 'var(--text-muted)' }} />
                                    <p className="text-sm font-500" style={{ color: 'var(--text-secondary)' }}>
                                        Click or drag to upload
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                        JPG, PNG, WebP, SVG — max 2MB
                                    </p>
                                </div>
                            )}
                        </div>

                        {uploadError && (
                            <p className="input-error-msg mt-1.5">{uploadError}</p>
                        )}

                        {form.schoolLogo && (
                            <button
                                type="button"
                                onClick={() => setForm((prev) => ({
                                    ...prev,
                                    schoolLogo: undefined,
                                    schoolLogoPublicId: undefined,
                                }))}
                                className="mt-2 text-xs flex items-center gap-1 hover:underline"
                                style={{ color: 'var(--danger)' }}
                            >
                                <X size={11} /> Remove logo
                            </button>
                        )}
                    </div>
                </div>
            </SettingSection>

            {/* ── Portal Theme (Growth+) ── */}
            <SettingSection
                title="Portal Theme Colors"
                description="Primary and accent colors used throughout the portal"
                badge={
                    canTheme
                        ? { label: 'Active', color: 'success' }
                        : { label: 'Growth+ Required', color: 'warning' }
                }
            >
                {!canTheme ? (
                    <LockedFeature requiredPlan="growth">
                        <div className="space-y-4">
                            <div className="h-14 rounded-[var(--radius-md)] bg-[var(--bg-muted)]" />
                            <div className="grid grid-cols-4 gap-2">
                                {PRESET_COLORS.slice(0, 4).map((p) => (
                                    <div
                                        key={p.label}
                                        className="h-8 rounded-[var(--radius-full)]"
                                        style={{ background: p.primary }}
                                    />
                                ))}
                            </div>
                        </div>
                    </LockedFeature>
                ) : (
                    <>
                        {/* Live Preview */}
                        <div
                            className="h-14 rounded-[var(--radius-md)] mb-4 flex items-center justify-center gap-3 relative overflow-hidden"
                            style={{
                                background: `linear-gradient(135deg, ${primaryColor}20, ${accentColor}15)`,
                                border: `1px solid ${primaryColor}30`,
                            }}
                        >
                            <div className="w-8 h-8 rounded-full shadow-sm" style={{ background: primaryColor }} />
                            <div className="h-7 w-20 rounded-[var(--radius-sm)] shadow-sm" style={{ background: primaryColor }} />
                            <div className="w-5 h-5 rounded-full shadow-sm" style={{ background: accentColor }} />
                            <p className="text-xs absolute bottom-1.5 right-3" style={{ color: 'var(--text-muted)' }}>
                                Live Preview
                            </p>
                        </div>

                        {/* Presets */}
                        <div className="mb-4">
                            <p className="text-xs font-600 mb-2" style={{ color: 'var(--text-secondary)' }}>
                                Quick Presets
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {PRESET_COLORS.map((preset) => (
                                    <button
                                        key={preset.label}
                                        type="button"
                                        title={preset.label}
                                        onClick={() => applyPreset(preset)}
                                        className="
                      flex items-center gap-1.5 px-2.5 py-1.5
                      rounded-[var(--radius-full)] border text-xs
                      transition-all
                    "
                                        style={{
                                            borderColor: form.portalTheme?.primaryColor === preset.primary
                                                ? preset.primary
                                                : 'var(--border)',
                                            background: form.portalTheme?.primaryColor === preset.primary
                                                ? `${preset.primary}10`
                                                : 'transparent',
                                            color: 'var(--text-secondary)',
                                        }}
                                    >
                                        <span
                                            className="w-3 h-3 rounded-full"
                                            style={{ background: preset.primary }}
                                        />
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom colors */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <SettingRow
                                label="Primary Color"
                                description="Buttons, active states, highlights"
                                error={colorErrors.primary}
                            >
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={form.portalTheme?.primaryColor || '#6366f1'}
                                            onChange={(e) => {
                                                updateTheme('primaryColor', e.target.value)
                                                if (colorErrors.primary) {
                                                    setColorErrors((p) => ({ ...p, primary: undefined }))
                                                }
                                                // Live preview on valid hex
                                                if (isValidHexColor(e.target.value)) {
                                                    applyAndSaveTheme(
                                                        tenantId,
                                                        e.target.value,
                                                        form.portalTheme?.accentColor || '#f97316',
                                                        form.portalTheme?.darkMode || 'light'
                                                    )
                                                }
                                            }}
                                            placeholder="#6366f1"
                                            className={`input-clean font-mono pl-10 uppercase ${colorErrors.primary ? 'input-error' : ''}`}
                                            maxLength={7}
                                        />
                                        <div
                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-[var(--border)]"
                                            style={{ background: primaryColor }}
                                        />
                                    </div>
                                    <input
                                        type="color"
                                        value={primaryColor}
                                        onChange={(e) => {
                                            updateTheme('primaryColor', e.target.value)
                                            applyAndSaveTheme(
                                                tenantId,
                                                e.target.value,
                                                form.portalTheme?.accentColor || '#f97316',
                                                form.portalTheme?.darkMode || 'light'
                                            )
                                        }}
                                        className="w-10 h-10 rounded-[var(--radius-sm)] border border-[var(--border)] cursor-pointer p-0.5"
                                        title="Pick color"
                                    />
                                </div>
                            </SettingRow>

                            <SettingRow
                                label="Accent Color"
                                description="Secondary highlights, badges"
                                error={colorErrors.accent}
                            >
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={form.portalTheme?.accentColor || '#f97316'}
                                            onChange={(e) => {
                                                updateTheme('accentColor', e.target.value)
                                                if (colorErrors.accent) {
                                                    setColorErrors((p) => ({ ...p, accent: undefined }))
                                                }
                                                if (isValidHexColor(e.target.value)) {
                                                    applyAndSaveTheme(
                                                        tenantId,
                                                        form.portalTheme?.primaryColor || '#6366f1',
                                                        e.target.value,
                                                        form.portalTheme?.darkMode || 'light'
                                                    )
                                                }
                                            }}
                                            placeholder="#f97316"
                                            className={`input-clean font-mono pl-10 uppercase ${colorErrors.accent ? 'input-error' : ''}`}
                                            maxLength={7}
                                        />
                                        <div
                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-[var(--border)]"
                                            style={{ background: accentColor }}
                                        />
                                    </div>
                                    <input
                                        type="color"
                                        value={accentColor}
                                        onChange={(e) => {
                                            updateTheme('accentColor', e.target.value)
                                            applyAndSaveTheme(
                                                tenantId,
                                                form.portalTheme?.primaryColor || '#6366f1',
                                                e.target.value,
                                                form.portalTheme?.darkMode || 'light'
                                            )
                                        }}
                                        className="w-10 h-10 rounded-[var(--radius-sm)] border border-[var(--border)] cursor-pointer p-0.5"
                                        title="Pick color"
                                    />
                                </div>
                            </SettingRow>
                        </div>

                        {/* Dark mode */}
                        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                            <SettingRow
                                label="Theme Mode"
                                description="Portal light/dark mode"
                            >
                                <div className="grid grid-cols-3 gap-2">
                                    {(
                                        [
                                            { key: 'light', label: 'Light', icon: '☀️' },
                                            { key: 'dark', label: 'Dark', icon: '🌙' },
                                            { key: 'system', label: 'System', icon: '🖥️' },
                                        ] as { key: 'light' | 'dark' | 'system'; label: string; icon: string }[]
                                    ).map((mode) => {
                                        const isSelected = form.portalTheme?.darkMode === mode.key
                                        return (
                                            <button
                                                key={mode.key}
                                                type="button"
                                                onClick={() => {
                                                    updateTheme('darkMode', mode.key)
                                                    applyAndSaveTheme(
                                                        tenantId,
                                                        primaryColor,
                                                        accentColor,
                                                        mode.key
                                                    )
                                                }}
                                                className="
                          flex flex-col items-center gap-1 py-3
                          rounded-[var(--radius-md)] border text-xs font-600
                          transition-all
                        "
                                                style={{
                                                    background: isSelected ? 'var(--primary-50)' : 'var(--bg-muted)',
                                                    borderColor: isSelected ? 'var(--primary-300)' : 'var(--border)',
                                                    color: isSelected ? 'var(--primary-600)' : 'var(--text-secondary)',
                                                }}
                                            >
                                                <span className="text-base">{mode.icon}</span>
                                                {mode.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </SettingRow>
                        </div>
                    </>
                )}
            </SettingSection>

            {/* ── Print Header (Pro+) ── */}
            <SettingSection
                title="Print Header"
                description="Appears at top of printed reports, receipts, fee slips"
                badge={
                    canPrint
                        ? { label: 'Active', color: 'success' }
                        : { label: 'Pro+ Required', color: 'warning' }
                }
            >
                {!canPrint ? (
                    <LockedFeature requiredPlan="pro">
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="h-10 rounded-[var(--radius-md)] bg-[var(--bg-muted)]"
                                />
                            ))}
                        </div>
                    </LockedFeature>
                ) : (
                    <>
                        <ToggleRow
                            label="Show School Logo"
                            description="Display logo in print header"
                            checked={form.printHeader?.showLogo ?? true}
                            onChange={(v) => updatePrintHeader('showLogo', v)}
                        />
                        <ToggleRow
                            label="Show School Name"
                            description="Display school name in bold"
                            checked={form.printHeader?.showSchoolName ?? true}
                            onChange={(v) => updatePrintHeader('showSchoolName', v)}
                        />
                        <ToggleRow
                            label="Show Address"
                            description="Show school address"
                            checked={form.printHeader?.showAddress ?? true}
                            onChange={(v) => updatePrintHeader('showAddress', v)}
                        />
                        <ToggleRow
                            label="Show Phone"
                            description="Show contact number"
                            checked={form.printHeader?.showPhone ?? true}
                            onChange={(v) => updatePrintHeader('showPhone', v)}
                        />

                        <div className="mt-4">
                            <SettingRow
                                label="Custom Tagline"
                                description="Optional tagline below school name (Pro+)"
                            >
                                {!canTagline ? (
                                    <div className="relative">
                                        <input
                                            type="text"
                                            disabled
                                            placeholder="Upgrade to Pro to add tagline"
                                            className="input-clean opacity-50 cursor-not-allowed"
                                        />
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        value={form.printHeader?.customTagline || ''}
                                        onChange={(e) => updatePrintHeader('customTagline', e.target.value)}
                                        placeholder="e.g. Excellence in Education Since 1995"
                                        className="input-clean"
                                        maxLength={100}
                                    />
                                )}
                            </SettingRow>
                        </div>

                        {/* Print Preview */}
                        <div
                            className="mt-4 p-4 border rounded-[var(--radius-md)]"
                            style={{
                                borderStyle: 'dashed',
                                borderColor: 'var(--border)',
                                background: '#ffffff',
                            }}
                        >
                            <p
                                className="text-xs text-center mb-3"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                Print Preview
                            </p>
                            <div className="flex items-center gap-3">
                                {form.printHeader?.showLogo && (
                                    form.schoolLogo ? (
                                        <img
                                            src={form.schoolLogo}
                                            alt="Logo"
                                            className="w-10 h-10 object-contain"
                                        />
                                    ) : (
                                        <div
                                            className="w-10 h-10 rounded flex items-center justify-center text-xs font-700"
                                            style={{
                                                background: 'var(--primary-100)',
                                                color: 'var(--primary-600)',
                                            }}
                                        >
                                            LOGO
                                        </div>
                                    )
                                )}
                                <div>
                                    {form.printHeader?.showSchoolName && (
                                        <p className="font-700 text-sm text-gray-900">
                                            {schoolName}
                                        </p>
                                    )}
                                    {form.printHeader?.customTagline && (
                                        <p className="text-xs text-gray-500 italic">
                                            {form.printHeader.customTagline}
                                        </p>
                                    )}
                                    {form.printHeader?.showAddress && (
                                        <p className="text-xs text-gray-400">
                                            123, School Street, City — 400001
                                        </p>
                                    )}
                                    {form.printHeader?.showPhone && (
                                        <p className="text-xs text-gray-400">📞 98765 43210</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
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