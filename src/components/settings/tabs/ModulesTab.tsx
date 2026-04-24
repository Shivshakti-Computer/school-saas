// FILE: src/components/settings/tabs/ModulesTab.tsx
// ✅ FIX: enabledModules ab sahi source se aa raha hai (page.tsx → DB fresh)
// initialHidden calculation correct hoga ab

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
    Users, CheckSquare, CreditCard, BookOpen, Bell,
    Globe, Image, Clock, FileText, FileCheck, BarChart2,
    MessageSquare, Library, Award, PlayCircle, Briefcase,
    Bus, Building, Package, UserPlus, Heart, GraduationCap,
    Lock, Info,
} from 'lucide-react'
import { SettingSection } from '../shared/SettingSection'
import { ToggleRow, SettingRow } from '../shared/SettingRow'
import { SaveBar } from '../shared/SaveButton'
import { MODULE_REGISTRY } from '@/lib/moduleRegistry'
import { getPlan } from '@/lib/plans'
import type { IModuleSettings } from '@/types/settings'
import type { ModuleKey } from '@/lib/moduleRegistry'
import type { PlanId } from '@/lib/plans'

const MODULE_ICONS: Record<string, React.ElementType> = {
    Users, CheckSquare, CreditCard, BookOpen, Bell,
    Globe, Image, Clock, FileText, FileCheck, BarChart2,
    MessageSquare, Library, Award, PlayCircle, Briefcase,
    Bus, Building, Package, UserPlus, Heart, GraduationCap,
    UserCheck: Users,
}

interface ModulesTabProps {
    modules: IModuleSettings
    // ✅ DB se fresh: planModules - hiddenModules
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
    const router = useRouter()
    const { update: updateSession } = useSession()

    // Plan ke saare modules = base set
    const planConfig = getPlan(plan as PlanId)
    const planModules = planConfig.modules

    // ✅ FIX: hiddenModules = planModules - enabledModules
    // enabledModules ab sahi source se aa raha hai (DB fresh, page.tsx se)
    const initialHidden = planModules.filter(
        (m) => !enabledModules.includes(m)
    )

    const [moduleSettings, setModuleSettings] = useState<IModuleSettings>({
        ...modules,
    })
    const [activeModules, setActiveModules] = useState<string[]>([
        ...enabledModules,
    ])
    const [hiddenModules, setHiddenModules] = useState<string[]>(initialHidden)

    const [isDirty, setIsDirty] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const toggleModule = (key: string) => {
        const config = MODULE_REGISTRY[key as ModuleKey]
        if (!config || config.isCore) return
        if (!planModules.includes(key)) return

        const isCurrentlyActive = activeModules.includes(key)

        if (isCurrentlyActive) {
            setActiveModules((prev) => prev.filter((m) => m !== key))
            setHiddenModules((prev) => [...prev, key])
        } else {
            setActiveModules((prev) => [...prev, key])
            setHiddenModules((prev) => prev.filter((m) => m !== key))
        }

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
            const toEnable = activeModules.filter(
                (m) => !enabledModules.includes(m)
            )
            const toDisable = enabledModules.filter(
                (m) => !activeModules.includes(m)
            )

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
                    hr: moduleSettings.hr,
                    certificates: moduleSettings.certificates,
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Save failed')

            setIsDirty(false)
            setSuccess('Module settings saved successfully. Sidebar will update shortly.')

            onSaved({
                modules: moduleSettings,
                enabledModules: activeModules,
            })

            await updateSession({ modules: activeModules })
            router.refresh()

            // ✅ 3 seconds baad success message auto-remove
            setTimeout(() => setSuccess(null), 3000)

        } catch (err: any) {
            setError(err.message)

            // ✅ Error bhi 5 seconds baad auto-remove
            setTimeout(() => setError(null), 5000)

        } finally {
            setSaving(false)
        }
    }

    const handleDiscard = () => {
        setModuleSettings({ ...modules })
        setActiveModules([...enabledModules])
        setHiddenModules(initialHidden)
        setIsDirty(false)
        setError(null)
        setSuccess(null)
    }

    // ── Module cards build karo ──
    type AllModule = {
        key: string
        config: typeof MODULE_REGISTRY[ModuleKey]
        isEnabled: boolean
        isInPlan: boolean
        isCore: boolean
    }

    // Plan ke modules — toggle wale
    const planModulesList: AllModule[] = planModules
        .filter((key) => {
            const config = MODULE_REGISTRY[key as ModuleKey]
            return config && config.adminRoute && !config.comingSoon
        })
        .map((key) => {
            const config = MODULE_REGISTRY[key as ModuleKey]!
            return {
                key,
                config,
                // ✅ Core modules hamesha enabled
                isEnabled: config.isCore ? true : activeModules.includes(key),
                isInPlan: true,
                isCore: config.isCore || false,
            }
        })

    // Plan me nahi hain — locked dikhao
    const lockedModules: AllModule[] = Object.entries(MODULE_REGISTRY)
        .filter(([key, config]) => {
            return (
                !planModules.includes(key) &&
                config.adminRoute &&
                !config.comingSoon &&
                !config.isCore
            )
        })
        .map(([key, config]) => ({
            key,
            config,
            isEnabled: false,
            isInPlan: false,
            isCore: false,
        }))

    const renderModuleCard = (mod: AllModule) => {
        const Icon = MODULE_ICONS[mod.config.icon] || Users

        return (
            <div
                key={mod.key}
                className={`
                    flex items-center gap-3 p-3.5
                    rounded-[var(--radius-md)] border
                    transition-all duration-150
                    ${!mod.isInPlan
                        ? 'bg-[var(--bg-muted)] border-[var(--border)] opacity-60 cursor-not-allowed'
                        : mod.isCore
                            ? 'bg-[var(--bg-card)] border-[var(--border)] cursor-default'
                            : mod.isEnabled
                                ? 'bg-[var(--bg-card)] border-[var(--border)] cursor-pointer hover:border-[var(--primary-200)]'
                                : 'bg-[var(--bg-muted)] border-[var(--border)] cursor-pointer opacity-70 hover:opacity-90'
                    }
                `}
                onClick={() =>
                    mod.isInPlan && !mod.isCore && toggleModule(mod.key)
                }
            >
                {/* Icon */}
                <div
                    className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0"
                    style={{
                        background:
                            mod.isEnabled && mod.isInPlan
                                ? `${mod.config.color}18`
                                : 'var(--bg-muted)',
                    }}
                >
                    <Icon
                        size={17}
                        style={{
                            color:
                                mod.isEnabled && mod.isInPlan
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
                        {mod.isCore && (
                            <span className="badge badge-brand text-[10px] px-1.5 py-0.5 flex-shrink-0">
                                Core
                            </span>
                        )}
                        {!mod.isEnabled && !mod.isCore && mod.isInPlan && (
                            <span className="badge badge-neutral text-[10px] px-1.5 py-0.5 flex-shrink-0">
                                Hidden
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                        {mod.config.description}
                    </p>
                </div>

                {/* Toggle / Lock / Always On */}
                <div className="flex-shrink-0">
                    {!mod.isInPlan ? (
                        <div className="flex items-center gap-1 text-[var(--text-muted)]">
                            <Lock size={13} />
                            <span className="text-xs capitalize">
                                {mod.config.plans[0]}+
                            </span>
                        </div>
                    ) : mod.isCore ? (
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
                                    ${mod.isEnabled
                                        ? 'translate-x-4'
                                        : 'translate-x-0'
                                    }
                                `}
                            />
                        </div>
                    )}
                </div>
            </div>
        )
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

            {/* Info banner */}
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
                    All modules included in your <strong>{planConfig.name} Plan</strong> are listed below.
                    Disable any module to hide it from the sidebar.
                    Re-enable it anytime to restore access.
                </p>
            </div>

            {/* Plan modules — toggle wale */}
            <SettingSection
                title={`${planConfig.name} Plan Modules`}
                description={`${activeModules.length} active · ${hiddenModules.filter(
                    (m) => !MODULE_REGISTRY[m as ModuleKey]?.isCore
                ).length} hidden`}
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {planModulesList.map(renderModuleCard)}
                </div>
            </SettingSection>

            {/* Locked modules */}
            {lockedModules.length > 0 && (
                <SettingSection
                    title="Upgrade Required"
                    description="Ye modules aapke current plan mein available nahi hain"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {lockedModules.map(renderModuleCard)}
                    </div>
                </SettingSection>
            )}

            {/* Module feature settings — sirf active modules ke liye */}
            {activeModules.includes('fees') && (
                <SettingSection
                    title="Fee Module Settings"
                    description="Configure fee module behavior"
                >
                    <ToggleRow
                        label="Allow Partial Payment"
                        description="Students can pay partial fee amount"
                        checked={moduleSettings.fees?.allowPartialPayment ?? false}
                        onChange={(v) =>
                            updateModuleSetting('fees', 'allowPartialPayment', v)
                        }
                    />
                    <ToggleRow
                        label="Show Due Amount on Portal"
                        description="Students/parents can see pending dues"
                        checked={moduleSettings.fees?.showDueAmountOnPortal ?? true}
                        onChange={(v) =>
                            updateModuleSetting('fees', 'showDueAmountOnPortal', v)
                        }
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
                                    value={
                                        moduleSettings.attendance?.editWindowHours ?? 24
                                    }
                                    onChange={(e) =>
                                        updateModuleSetting(
                                            'attendance',
                                            'editWindowHours',
                                            parseInt(e.target.value) || 24
                                        )
                                    }
                                    className="input-clean w-20"
                                />
                                <span className="text-sm text-[var(--text-muted)]">
                                    hours
                                </span>
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
                        <SettingRow
                            horizontal
                            label="Max Grace Marks"
                            description="Maximum %"
                        >
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min={0}
                                    max={10}
                                    value={
                                        moduleSettings.exams?.gracemarksLimit ?? 5
                                    }
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
                                value={
                                    moduleSettings.library?.maxBooksPerStudent ?? 2
                                }
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
                        checked={
                            moduleSettings.homework?.allowStudentSubmission ?? true
                        }
                        onChange={(v) =>
                            updateModuleSetting(
                                'homework',
                                'allowStudentSubmission',
                                v
                            )
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
                                    value={
                                        moduleSettings.homework?.maxFileSizeMB ?? 10
                                    }
                                    onChange={(e) =>
                                        updateModuleSetting(
                                            'homework',
                                            'maxFileSizeMB',
                                            parseInt(e.target.value) || 10
                                        )
                                    }
                                    className="input-clean w-20"
                                />
                                <span className="text-sm text-[var(--text-muted)]">
                                    MB
                                </span>
                            </div>
                        </SettingRow>
                    )}
                </SettingSection>
            )}

            {activeModules.includes('hr') && (
                <SettingSection
                    title="HR & Payroll Settings"
                    description="Salary structure, leave policy, and payslip configuration"
                >
                    {/* ── Salary Slip Notifications ── */}
                    {/* NotificationsTab se sync — ye toggles wahi kaam karte hain */}
                    <div className="mb-1">
                        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                            Salary Slip Notifications
                        </p>
                    </div>

                    <ToggleRow
                        label="Send Salary Slip via Email"
                        description="Email salary slip to staff when payroll is generated"
                        checked={moduleSettings.hr?.sendSalarySlipEmail ?? false}
                        onChange={(v) =>
                            updateModuleSetting('hr', 'sendSalarySlipEmail', v)
                        }
                    />
                    <ToggleRow
                        label="Send Salary Slip via SMS"
                        description="SMS notification to staff on salary day (uses credits)"
                        checked={moduleSettings.hr?.sendSalarySlipSMS ?? false}
                        onChange={(v) =>
                            updateModuleSetting('hr', 'sendSalarySlipSMS', v)
                        }
                    />

                    {/* ── PF & ESI Settings ── */}
                    <div className="mt-4 mb-1 pt-4 border-t border-[var(--border)]">
                        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                            Statutory Deductions
                        </p>
                    </div>

                    <ToggleRow
                        label="Enable PF Deduction"
                        description="Provident Fund deduction from salary (Employee contribution)"
                        checked={moduleSettings.hr?.pfEnabled ?? true}
                        onChange={(v) =>
                            updateModuleSetting('hr', 'pfEnabled', v)
                        }
                    />

                    {moduleSettings.hr?.pfEnabled && (
                        <SettingRow
                            horizontal
                            label="PF Percentage"
                            description="Standard rate is 12% of basic salary"
                        >
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min={0}
                                    max={30}
                                    step={0.5}
                                    value={moduleSettings.hr?.pfPercentage ?? 12}
                                    onChange={(e) =>
                                        updateModuleSetting(
                                            'hr',
                                            'pfPercentage',
                                            parseFloat(e.target.value) || 12
                                        )
                                    }
                                    className="input-clean w-20"
                                />
                                <span className="text-sm text-[var(--text-muted)]">
                                    % of basic salary
                                </span>
                            </div>
                        </SettingRow>
                    )}

                    <ToggleRow
                        label="Enable ESI Deduction"
                        description="Employee State Insurance (applicable if gross salary ≤ ₹21,000)"
                        checked={moduleSettings.hr?.esiEnabled ?? false}
                        onChange={(v) =>
                            updateModuleSetting('hr', 'esiEnabled', v)
                        }
                    />

                    {moduleSettings.hr?.esiEnabled && (
                        <SettingRow
                            horizontal
                            label="ESI Percentage"
                            description="Standard rate is 0.75% of gross salary"
                        >
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min={0}
                                    max={10}
                                    step={0.25}
                                    value={moduleSettings.hr?.esiPercentage ?? 0.75}
                                    onChange={(e) =>
                                        updateModuleSetting(
                                            'hr',
                                            'esiPercentage',
                                            parseFloat(e.target.value) || 0.75
                                        )
                                    }
                                    className="input-clean w-20"
                                />
                                <span className="text-sm text-[var(--text-muted)]">
                                    % of gross salary
                                </span>
                            </div>
                        </SettingRow>
                    )}

                    <ToggleRow
                        label="Enable Professional Tax"
                        description="State-wise professional tax deduction"
                        checked={moduleSettings.hr?.professionalTaxEnabled ?? false}
                        onChange={(v) =>
                            updateModuleSetting('hr', 'professionalTaxEnabled', v)
                        }
                    />

                    {/* ── Leave Policy ── */}
                    <div className="mt-4 mb-1 pt-4 border-t border-[var(--border)]">
                        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                            Annual Leave Policy
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mb-3">
                            New staff records will get these leave balances by default
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <SettingRow
                            label="Casual Leaves / Year"
                            description="CL per year"
                        >
                            <input
                                type="number"
                                min={0}
                                max={30}
                                value={moduleSettings.hr?.casualLeavesPerYear ?? 12}
                                onChange={(e) =>
                                    updateModuleSetting(
                                        'hr',
                                        'casualLeavesPerYear',
                                        parseInt(e.target.value) || 12
                                    )
                                }
                                className="input-clean"
                            />
                        </SettingRow>
                        <SettingRow
                            label="Sick Leaves / Year"
                            description="SL per year"
                        >
                            <input
                                type="number"
                                min={0}
                                max={30}
                                value={moduleSettings.hr?.sickLeavesPerYear ?? 10}
                                onChange={(e) =>
                                    updateModuleSetting(
                                        'hr',
                                        'sickLeavesPerYear',
                                        parseInt(e.target.value) || 10
                                    )
                                }
                                className="input-clean"
                            />
                        </SettingRow>
                        <SettingRow
                            label="Earned Leaves / Year"
                            description="EL accrued per year"
                        >
                            <input
                                type="number"
                                min={0}
                                max={60}
                                value={moduleSettings.hr?.earnedLeavesPerYear ?? 15}
                                onChange={(e) =>
                                    updateModuleSetting(
                                        'hr',
                                        'earnedLeavesPerYear',
                                        parseInt(e.target.value) || 15
                                    )
                                }
                                className="input-clean"
                            />
                        </SettingRow>
                    </div>

                    {/* ── Payroll Settings ── */}
                    <div className="mt-4 mb-1 pt-4 border-t border-[var(--border)]">
                        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                            Payroll Configuration
                        </p>
                    </div>

                    <SettingRow
                        horizontal
                        label="Salary Disbursement Day"
                        description="What day of the month is the salary process?"
                    >
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={1}
                                max={28}
                                value={moduleSettings.hr?.salaryDisbursementDay ?? 1}
                                onChange={(e) =>
                                    updateModuleSetting(
                                        'hr',
                                        'salaryDisbursementDay',
                                        parseInt(e.target.value) || 1
                                    )
                                }
                                className="input-clean w-20"
                            />
                            <span className="text-sm text-[var(--text-muted)]">
                                of every month
                            </span>
                        </div>
                    </SettingRow>

                    <SettingRow
                        horizontal
                        label="Payslip Footer Text"
                        description="Text shown at bottom of salary slip email"
                    >
                        <input
                            type="text"
                            value={moduleSettings.hr?.payslipFooterText ?? ''}
                            onChange={(e) =>
                                updateModuleSetting(
                                    'hr',
                                    'payslipFooterText',
                                    e.target.value
                                )
                            }
                            placeholder="This is a computer generated payslip."
                            className="input-clean"
                            maxLength={200}
                        />
                        <p className="input-hint text-right">
                            {(moduleSettings.hr?.payslipFooterText ?? '').length}/200
                        </p>
                    </SettingRow>
                </SettingSection>
            )}

            {/* ✅ NEW: Certificate Settings Section */}
            {activeModules.includes('certificates') && (
                <SettingSection
                    title="Certificate Settings"
                    description="Configure certificate number format and prefix"
                >
                    <ToggleRow
                        label="Auto-generate Prefix"
                        description="Use institution code (subdomain) as certificate prefix"
                        checked={moduleSettings.certificates?.autoGeneratePrefix ?? true}
                        onChange={(v) =>
                            updateModuleSetting('certificates', 'autoGeneratePrefix', v)
                        }
                    />

                    {!moduleSettings.certificates?.autoGeneratePrefix && (
                        <>
                            <SettingRow
                                horizontal
                                label="Custom Prefix"
                                description="Custom code for certificate numbers (max 6 chars, alphanumeric)"
                            >
                                <input
                                    type="text"
                                    value={moduleSettings.certificates?.prefix ?? ''}
                                    onChange={(e) => {
                                        // Auto uppercase, alphanumeric only, max 6 chars
                                        const val = e.target.value
                                            .toUpperCase()
                                            .replace(/[^A-Z0-9]/g, '')
                                            .slice(0, 6)
                                        updateModuleSetting('certificates', 'prefix', val)
                                    }}
                                    placeholder="e.g., SHIV, DPS, CAREER"
                                    className="input-clean w-32 font-mono uppercase"
                                    maxLength={6}
                                />
                            </SettingRow>
                            <p className="text-xs text-[var(--text-muted)] mt-1 ml-1">
                                Preview:{' '}
                                <span className="font-mono">
                                    {(moduleSettings.certificates?.prefix || 'INST')}-MERI-{new Date().getFullYear()}-0001
                                </span>
                            </p>
                        </>
                    )}

                    {moduleSettings.certificates?.autoGeneratePrefix && (
                        <p className="text-xs text-[var(--text-muted)] mt-1 ml-1">
                            Prefix will be auto-generated from your institution code.
                            Preview:{' '}
                            <span className="font-mono">
                                INST-MERI-{new Date().getFullYear()}-0001
                            </span>
                        </p>
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