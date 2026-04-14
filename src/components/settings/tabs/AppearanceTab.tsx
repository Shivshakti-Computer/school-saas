// FILE: src/components/settings/tabs/AppearanceTab.tsx
// Theme colors, print header settings

'use client'

import { useState } from 'react'
import { Palette, Printer, Monitor } from 'lucide-react'
import { SettingSection } from '../shared/SettingSection'
import { SettingRow, ToggleRow } from '../shared/SettingRow'
import { SaveBar } from '../shared/SaveButton'
import { isValidHexColor } from '@/types/settings'
import type { IAppearanceSettings } from '@/types/settings'

interface AppearanceTabProps {
    appearance: IAppearanceSettings
    onSaved: (updated: IAppearanceSettings) => void
}

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

export function AppearanceTab({ appearance, onSaved }: AppearanceTabProps) {
    const [form, setForm] = useState<IAppearanceSettings>({ ...appearance })
    const [isDirty, setIsDirty] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [colorErrors, setColorErrors] = useState<{
        primary?: string; accent?: string
    }>({})

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
        setForm((prev) => ({
            ...prev,
            portalTheme: { ...prev.portalTheme, [field]: val },
        }))
        setIsDirty(true)
    }

    const updatePrintHeader = (
        field: keyof IAppearanceSettings['printHeader'],
        val: any
    ) => {
        setForm((prev) => ({
            ...prev,
            printHeader: { ...prev.printHeader, [field]: val },
        }))
        setIsDirty(true)
    }

    const applyPreset = (preset: typeof PRESET_COLORS[0]) => {
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
    }

    const handleSave = async () => {
        // Validate colors
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

        setSaving(true)
        setError(null)
        setSuccess(null)

        try {
            const res = await fetch('/api/settings/appearance', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    portalTheme: form.portalTheme,
                    printHeader: form.printHeader,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Save failed')

            setIsDirty(false)
            setSuccess('Appearance settings saved')
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
    }

    const primaryColor = form.portalTheme?.primaryColor || '#6366f1'
    const accentColor = form.portalTheme?.accentColor || '#f97316'

    return (
        <div className="space-y-5 portal-content-enter">

            {error && (
                <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--danger-light)] border border-[rgba(239,68,68,0.2)] text-sm text-[var(--danger-dark)]">
                    {error}
                </div>
            )}
            {success && (
                <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--success-light)] border border-[rgba(16,185,129,0.2)] text-sm text-[var(--success-dark)]">
                    {success}
                </div>
            )}

            {/* ── Portal Theme ── */}
            <SettingSection
                title="Portal Theme"
                description="Colors used throughout the admin portal"
            >
                {/* Color preview */}
                <div
                    className="
            h-16 rounded-[var(--radius-md)] mb-4
            flex items-center justify-center gap-3
            overflow-hidden relative
          "
                    style={{
                        background: `linear-gradient(135deg, ${primaryColor}20, ${accentColor}15)`,
                        border: `1px solid ${primaryColor}30`,
                    }}
                >
                    <div
                        className="w-8 h-8 rounded-full shadow-sm"
                        style={{ background: primaryColor }}
                    />
                    <div
                        className="h-8 w-24 rounded-[var(--radius-sm)] shadow-sm"
                        style={{ background: primaryColor }}
                    />
                    <div
                        className="w-6 h-6 rounded-full shadow-sm"
                        style={{ background: accentColor }}
                    />
                    <p className="text-xs text-[var(--text-muted)] absolute bottom-2 right-3">
                        Preview
                    </p>
                </div>

                {/* Presets */}
                <div className="mb-4">
                    <p className="text-xs font-600 text-[var(--text-secondary)] mb-2">
                        Color Presets
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
                  rounded-[var(--radius-full)]
                  border border-[var(--border)]
                  text-xs text-[var(--text-secondary)]
                  hover:border-[var(--border-strong)]
                  transition-all
                "
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
                        description="Main brand color"
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
                                    }}
                                    placeholder="#6366f1"
                                    className={`
                    input-clean font-mono pl-10 uppercase
                    ${colorErrors.primary ? 'input-error' : ''}
                  `}
                                    maxLength={7}
                                />
                                <div
                                    className="
                    absolute left-3 top-1/2 -translate-y-1/2
                    w-4 h-4 rounded-full border border-[var(--border)]
                  "
                                    style={{ background: primaryColor }}
                                />
                            </div>
                            <input
                                type="color"
                                value={primaryColor}
                                onChange={(e) => updateTheme('primaryColor', e.target.value)}
                                className="w-10 h-10 rounded-[var(--radius-sm)] border border-[var(--border)] cursor-pointer p-0.5"
                                title="Pick color"
                            />
                        </div>
                    </SettingRow>

                    <SettingRow
                        label="Accent Color"
                        description="Secondary highlight color"
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
                                    }}
                                    placeholder="#f97316"
                                    className={`
                    input-clean font-mono pl-10 uppercase
                    ${colorErrors.accent ? 'input-error' : ''}
                  `}
                                    maxLength={7}
                                />
                                <div
                                    className="
                    absolute left-3 top-1/2 -translate-y-1/2
                    w-4 h-4 rounded-full border border-[var(--border)]
                  "
                                    style={{ background: accentColor }}
                                />
                            </div>
                            <input
                                type="color"
                                value={accentColor}
                                onChange={(e) => updateTheme('accentColor', e.target.value)}
                                className="w-10 h-10 rounded-[var(--radius-sm)] border border-[var(--border)] cursor-pointer p-0.5"
                                title="Pick color"
                            />
                        </div>
                    </SettingRow>
                </div>

                {/* Dark mode preference */}
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                    <SettingRow
                        label="Default Theme Mode"
                        description="Portal display mode preference"
                    >
                        <div className="grid grid-cols-3 gap-2">
                            {(
                                [
                                    { key: 'light', label: 'Light', icon: '☀️' },
                                    { key: 'dark', label: 'Dark', icon: '🌙' },
                                    { key: 'system', label: 'System', icon: '🖥️' },
                                ] as { key: 'light' | 'dark' | 'system'; label: string; icon: string }[]
                            ).map((mode) => (
                                <button
                                    key={mode.key}
                                    type="button"
                                    onClick={() => updateTheme('darkMode', mode.key)}
                                    className={`
                    flex flex-col items-center gap-1 py-3
                    rounded-[var(--radius-md)] border text-xs font-600
                    transition-all
                    ${form.portalTheme?.darkMode === mode.key
                                            ? 'bg-[var(--primary-50)] border-[var(--primary-300)] text-[var(--primary-600)]'
                                            : 'bg-[var(--bg-muted)] border-[var(--border)] text-[var(--text-secondary)]'
                                        }
                  `}
                                >
                                    <span className="text-base">{mode.icon}</span>
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                    </SettingRow>
                </div>
            </SettingSection>

            {/* ── Print Header ── */}
            <SettingSection
                title="Print Header"
                description="What appears at the top of printed reports, receipts, and documents"
            >
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
                        description="Optional tagline below school name"
                    >
                        <input
                            type="text"
                            value={form.printHeader?.customTagline || ''}
                            onChange={(e) =>
                                updatePrintHeader('customTagline', e.target.value)
                            }
                            placeholder="e.g. Excellence in Education Since 1995"
                            className="input-clean"
                            maxLength={100}
                        />
                    </SettingRow>
                </div>

                {/* Print preview */}
                <div
                    className="
            mt-4 p-4 border border-dashed border-[var(--border)]
            rounded-[var(--radius-md)] bg-white
          "
                >
                    <p className="text-xs text-[var(--text-muted)] mb-3 text-center">
                        Print Preview
                    </p>
                    <div className="flex items-center gap-3">
                        {form.printHeader?.showLogo && form.schoolLogo && (
                            <img
                                src={form.schoolLogo}
                                alt="Logo"
                                className="w-10 h-10 object-contain"
                            />
                        )}
                        {form.printHeader?.showLogo && !form.schoolLogo && (
                            <div
                                className="
          w-10 h-10 rounded bg-[var(--primary-100)]
          flex items-center justify-center text-[var(--primary-600)]
          text-xs font-700
        "
                            >
                                LOGO
                            </div>
                        )}
                        <div>
                            {form.printHeader?.showSchoolName && (
                                <p className="font-700 text-sm text-gray-900">
                                    Your School Name
                                </p>
                            )}
                            {form.printHeader?.customTagline && (
                                <p className="text-xs text-gray-500 italic">
                                    {form.printHeader.customTagline}
                                </p>
                            )}
                            {form.printHeader?.showAddress && (
                                <p className="text-xs text-gray-400">
                                    123, School Street, City - 400001
                                </p>
                            )}
                            {form.printHeader?.showPhone && (
                                <p className="text-xs text-gray-400">
                                    📞 98765 43210
                                </p>
                            )}
                        </div>
                    </div>
                </div>
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