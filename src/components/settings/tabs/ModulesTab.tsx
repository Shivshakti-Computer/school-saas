// FILE: src/components/settings/tabs/ModulesTab.tsx
// Enable/disable modules + per-module feature toggles

'use client'

import { useState } from 'react'
import {
    Users, CheckSquare, CreditCard, BookOpen, Bell,
    Globe, Image, Clock, FileText, FileCheck, BarChart2,
    MessageSquare, Library, Award, PlayCircle, Briefcase,
    Bus, Building, Package, UserPlus, Heart, GraduationCap,
    AlertTriangle, Lock,
} from 'lucide-react'
import { SettingSection } from '../shared/SettingSection'
import { ToggleRow, SettingRow } from '../shared/SettingRow'
import { SaveBar } from '../shared/SaveButton'
import { MODULE_REGISTRY } from '@/lib/moduleRegistry'
import type { IModuleSettings } from '@/types/settings'
import type { ModuleKey } from '@/lib/moduleRegistry'

const MODULE_ICONS: Record<string, React.ElementType> = {
    Users, CheckSquare, CreditCard, BookOpen, Bell,
    Globe, Image, Clock, FileText, FileCheck, BarChart2,
    MessageSquare, Library, Award, PlayCircle, Briefcase,
    Bus, Building, Package, UserPlus, Heart, GraduationCap,
    UserCheck: Users,
}

interface ModulesTabProps {
    modules: IModuleSettings
    enabledModules: string[]
    plan: string
    onSaved: (updated: {
        modules: IModuleSettings
        enabledModules: string[]
    }) => void
}

export function ModulesTab({
    modules,
    enabledModules,
    plan,
    onSaved,
}: ModulesTabProps) {
    const [moduleSettings, setModuleSettings] = useState<IModuleSettings>({ ...modules })
    const [activeModules, setActiveModules] = useState<string[]>([...enabledModules])
    const [isDirty, setIsDirty] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const planOrder: Record<string, number> = {
        starter: 1, growth: 2, pro: 3, enterprise: 4,
    }

    const isPlanAllowed = (requiredPlans: string[]) => {
        const currentOrder = planOrder[plan] || 0
        return requiredPlans.some(
            (p) => (planOrder[p] || 0) <= currentOrder
        )
    }

    const toggleModule = (key: string) => {
        const config = MODULE_REGISTRY[key as ModuleKey]
        if (!config || config.isCore) return

        setActiveModules((prev) => {
            const isActive = prev.includes(key)
            return isActive
                ? prev.filter((m) => m !== key)
                : [...prev, key]
        })
        setIsDirty(true)
        setError(null)
    }

    const updateModuleSetting = (
        section: keyof IModuleSettings,
        field: string,
        val: any
    ) => {
        setModuleSettings((prev) => ({
            ...prev,
            [section]: { ...(prev[section] as any), [field]: val },
        }))
        setIsDirty(true)
    }

    const handleSave = async () => {
        setSaving(true)
        setError(null)
        setSuccess(null)

        try {
            // Diff enabled/disabled
            const toEnable = activeModules.filter((m) => !enabledModules.includes(m))
            const toDisable = enabledModules.filter((m) => !activeModules.includes(m))

            const res = await fetch('/api/settings/modules', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    enableModules: toEnable,
                    disableModules: toDisable,
                    fees: moduleSettings.fees,
                    attendance: moduleSettings.attendance,
                    exams: moduleSettings.exams,
                    library: moduleSettings.library,
                    homework: moduleSettings.homework,
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Save failed')

            setIsDirty(false)
            setSuccess('Module settings saved')
            onSaved({ modules: moduleSettings, enabledModules: activeModules })
        } catch (err: any) {
            setError(err.message)
            throw err
        } finally {
            setSaving(false)
        }
    }

    const handleDiscard = () => {
        setModuleSettings({ ...modules })
        setActiveModules([...enabledModules])
        setIsDirty(false)
        setError(null)
        setSuccess(null)
    }

    // Group modules by plan requirement
    const modulesGrouped = {
        core: [] as typeof allModules,
        starter: [] as typeof allModules,
        growth: [] as typeof allModules,
        pro: [] as typeof allModules,
        enterprise: [] as typeof allModules,
    }

    type AllModule = {
        key: string
        config: typeof MODULE_REGISTRY[ModuleKey]
        isEnabled: boolean
        isAllowed: boolean
    }
    const allModules: AllModule[] = Object.entries(MODULE_REGISTRY)
        .filter(([, config]) => config.adminRoute && !config.comingSoon)
        .map(([key, config]) => ({
            key,
            config,
            isEnabled: activeModules.includes(key) || config.isCore,
            isAllowed: isPlanAllowed(config.plans),
        }))

    allModules.forEach((mod) => {
        if (mod.config.isCore) {
            modulesGrouped.core.push(mod)
        } else if (mod.config.plans.includes('starter')) {
            modulesGrouped.starter.push(mod)
        } else if (mod.config.plans.includes('growth')) {
            modulesGrouped.growth.push(mod)
        } else if (mod.config.plans.includes('pro')) {
            modulesGrouped.pro.push(mod)
        } else {
            modulesGrouped.enterprise.push(mod)
        }
    })

    const renderModuleCard = (mod: AllModule) => {
        const Icon = MODULE_ICONS[mod.config.icon] || Users
        const isCore = mod.config.isCore

        return (
            <div
                key={mod.key}
                className={`
          flex items-center gap-3 p-3.5
          rounded-[var(--radius-md)] border
          transition-all duration-150
          ${mod.isEnabled && mod.isAllowed
                        ? 'bg-[var(--bg-card)] border-[var(--border)]'
                        : 'bg-[var(--bg-muted)] border-[var(--border)] opacity-70'
                    }
          ${isCore ? 'cursor-default' : 'cursor-pointer'}
        `}
                onClick={() => !isCore && mod.isAllowed && toggleModule(mod.key)}
            >
                {/* Icon */}
                <div
                    className="
            w-9 h-9 rounded-[var(--radius-md)]
            flex items-center justify-center flex-shrink-0
          "
                    style={{
                        background: mod.isEnabled && mod.isAllowed
                            ? `${mod.config.color}18`
                            : 'var(--bg-muted)',
                    }}
                >
                    <Icon
                        size={17}
                        style={{
                            color: mod.isEnabled && mod.isAllowed
                                ? mod.config.color
                                : 'var(--text-light)',
                        }}
                    />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <p className="text-sm font-600 text-[var(--text-primary)] truncate">
                            {mod.config.label}
                        </p>
                        {isCore && (
                            <span className="badge badge-brand text-[10px] px-1.5 py-0.5 flex-shrink-0">
                                Core
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                        {mod.config.description}
                    </p>
                </div>

                {/* Toggle / Lock */}
                <div className="flex-shrink-0">
                    {!mod.isAllowed ? (
                        <div className="flex items-center gap-1 text-[var(--text-muted)]">
                            <Lock size={13} />
                            <span className="text-xs capitalize">
                                {mod.config.plans[0]}+
                            </span>
                        </div>
                    ) : isCore ? (
                        <span className="text-xs text-[var(--success)] font-600">
                            Always On
                        </span>
                    ) : (
                        <div
                            className={`
                relative inline-flex h-5 w-9 flex-shrink-0
                rounded-full border-2 border-transparent
                transition-colors duration-200
                ${mod.isEnabled
                                    ? 'bg-[var(--primary-500)]'
                                    : 'bg-[var(--border-strong)]'
                                }
              `}
                        >
                            <span
                                className={`
                  pointer-events-none inline-block h-4 w-4
                  transform rounded-full bg-white shadow
                  transition duration-200
                  ${mod.isEnabled ? 'translate-x-4' : 'translate-x-0'}
                `}
                            />
                        </div>
                    )}
                </div>
            </div>
        )
    }

    const planLabels: Record<string, string> = {
        core: 'Core Modules (Always Active)',
        starter: 'Starter Plan Modules',
        growth: 'Growth Plan Modules',
        pro: 'Pro Plan Modules',
        enterprise: 'Enterprise Plan Modules',
    }

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

            {/* ── Module List ── */}
            {(
                Object.entries(modulesGrouped) as [
                    keyof typeof modulesGrouped,
                    AllModule[],
                ][]
            )
                .filter(([, mods]) => mods.length > 0)
                .map(([group, mods]) => (
                    <SettingSection
                        key={group}
                        title={planLabels[group]}
                        description={
                            group === 'core'
                                ? 'These modules cannot be disabled'
                                : `Requires ${group} plan or above`
                        }
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {mods.map(renderModuleCard)}
                        </div>
                    </SettingSection>
                ))}

            {/* ── Module Feature Settings ── */}
            {activeModules.includes('fees') && (
                <SettingSection
                    title="Fee Module Settings"
                    description="Configure fee module behavior"
                >
                    <ToggleRow
                        label="Allow Partial Payment"
                        description="Students can pay partial fee amount"
                        checked={moduleSettings.fees?.allowPartialPayment ?? false}
                        onChange={(v) => updateModuleSetting('fees', 'allowPartialPayment', v)}
                    />
                    <ToggleRow
                        label="Show Due Amount on Portal"
                        description="Students/parents can see pending dues"
                        checked={moduleSettings.fees?.showDueAmountOnPortal ?? true}
                        onChange={(v) => updateModuleSetting('fees', 'showDueAmountOnPortal', v)}
                    />
                </SettingSection>
            )}

            {activeModules.includes('attendance') && (
                <SettingSection
                    title="Attendance Module Settings"
                    description="Configure attendance marking behavior"
                >
                    <ToggleRow
                        label="Allow Teacher Edit"
                        description="Teachers can edit submitted attendance"
                        checked={moduleSettings.attendance?.allowTeacherEdit ?? true}
                        onChange={(v) =>
                            updateModuleSetting('attendance', 'allowTeacherEdit', v)
                        }
                    />
                    {moduleSettings.attendance?.allowTeacherEdit && (
                        <SettingRow
                            horizontal
                            label="Edit Window"
                            description="Hours after submission when editing is allowed"
                        >
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min={1}
                                    max={72}
                                    value={moduleSettings.attendance?.editWindowHours ?? 24}
                                    onChange={(e) =>
                                        updateModuleSetting(
                                            'attendance',
                                            'editWindowHours',
                                            parseInt(e.target.value) || 24
                                        )
                                    }
                                    className="input-clean w-20"
                                />
                                <span className="text-sm text-[var(--text-muted)]">hours</span>
                            </div>
                        </SettingRow>
                    )}
                </SettingSection>
            )}

            {activeModules.includes('exams') && (
                <SettingSection
                    title="Exam Module Settings"
                    description="Configure exam and result behavior"
                >
                    <ToggleRow
                        label="Show Result to Student"
                        description="Students can view their results"
                        checked={moduleSettings.exams?.showResultToStudent ?? true}
                        onChange={(v) =>
                            updateModuleSetting('exams', 'showResultToStudent', v)
                        }
                    />
                    <ToggleRow
                        label="Show Result to Parent"
                        description="Parents can view their child's results"
                        checked={moduleSettings.exams?.showResultToParent ?? true}
                        onChange={(v) =>
                            updateModuleSetting('exams', 'showResultToParent', v)
                        }
                    />
                    <ToggleRow
                        label="Allow Grace Marks"
                        description="Teacher can award grace marks"
                        checked={moduleSettings.exams?.allowGraceMarks ?? false}
                        onChange={(v) =>
                            updateModuleSetting('exams', 'allowGraceMarks', v)
                        }
                    />
                    {moduleSettings.exams?.allowGraceMarks && (
                        <SettingRow horizontal label="Max Grace Marks" description="Maximum %">
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min={0}
                                    max={10}
                                    value={moduleSettings.exams?.gracemarksLimit ?? 5}
                                    onChange={(e) =>
                                        updateModuleSetting(
                                            'exams',
                                            'gracemarksLimit',
                                            parseInt(e.target.value) || 5
                                        )
                                    }
                                    className="input-clean w-20"
                                />
                                <span className="text-sm text-[var(--text-muted)]">%</span>
                            </div>
                        </SettingRow>
                    )}
                </SettingSection>
            )}

            {activeModules.includes('library') && (
                <SettingSection
                    title="Library Module Settings"
                    description="Book issue and fine configuration"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <SettingRow label="Max Books/Student">
                            <input
                                type="number"
                                min={1}
                                max={20}
                                value={moduleSettings.library?.maxBooksPerStudent ?? 2}
                                onChange={(e) =>
                                    updateModuleSetting(
                                        'library',
                                        'maxBooksPerStudent',
                                        parseInt(e.target.value) || 2
                                    )
                                }
                                className="input-clean"
                            />
                        </SettingRow>
                        <SettingRow label="Max Issue Days">
                            <input
                                type="number"
                                min={1}
                                max={60}
                                value={moduleSettings.library?.maxIssueDays ?? 14}
                                onChange={(e) =>
                                    updateModuleSetting(
                                        'library',
                                        'maxIssueDays',
                                        parseInt(e.target.value) || 14
                                    )
                                }
                                className="input-clean"
                            />
                        </SettingRow>
                        <SettingRow label="Fine Per Day (₹)">
                            <input
                                type="number"
                                min={0}
                                value={moduleSettings.library?.finePerDay ?? 2}
                                onChange={(e) =>
                                    updateModuleSetting(
                                        'library',
                                        'finePerDay',
                                        parseFloat(e.target.value) || 0
                                    )
                                }
                                className="input-clean"
                            />
                        </SettingRow>
                    </div>
                </SettingSection>
            )}

            {activeModules.includes('homework') && (
                <SettingSection
                    title="Homework Module Settings"
                    description="Student submission configuration"
                >
                    <ToggleRow
                        label="Allow Student Submission"
                        description="Students can submit homework files"
                        checked={moduleSettings.homework?.allowStudentSubmission ?? true}
                        onChange={(v) =>
                            updateModuleSetting('homework', 'allowStudentSubmission', v)
                        }
                    />
                    {moduleSettings.homework?.allowStudentSubmission && (
                        <SettingRow
                            horizontal
                            label="Max File Size"
                            description="Per submission"
                        >
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min={1}
                                    max={50}
                                    value={moduleSettings.homework?.maxFileSizeMB ?? 10}
                                    onChange={(e) =>
                                        updateModuleSetting(
                                            'homework',
                                            'maxFileSizeMB',
                                            parseInt(e.target.value) || 10
                                        )
                                    }
                                    className="input-clean w-20"
                                />
                                <span className="text-sm text-[var(--text-muted)]">MB</span>
                            </div>
                        </SettingRow>
                    )}
                </SettingSection>
            )}

            <SaveBar
                isDirty={isDirty}
                onSave={handleSave}
                onDiscard={handleDiscard}
                saving={saving}
            />
        </div>
    )
}