// FILE: src/components/settings/SettingsNav.tsx
// ✅ UPDATED: Institution-aware labels (School/Academy/Coaching)

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
    Building2, GraduationCap, Bell,
    CreditCard, Palette, LayoutGrid, Database,
    Shield, Zap,
} from 'lucide-react'
import { SETTINGS_TABS } from '@/types/settings'
import type { SettingsTab } from '@/types/settings'
import type { InstitutionType } from '@/lib/institutionConfig'

const ICONS: Record<string, React.ElementType> = {
    Building2,
    GraduationCap,
    Bell,
    CreditCard,
    Palette,
    LayoutGrid,
    Database,
    Shield,
    Zap,
}

interface SettingsNavProps {
    activeTab: SettingsTab
    plan: string
    institutionType?: InstitutionType  // ✅ ADD
}

export function SettingsNav({ activeTab, plan, institutionType }: SettingsNavProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { data: session } = useSession()

    // ✅ Fallback to session if not passed
    const instType = institutionType || ((session?.user as any)?.institutionType as InstitutionType) || 'school'

    const handleTabChange = (tab: SettingsTab) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('tab', tab)
        router.push(`/admin/settings?${params.toString()}`, { scroll: false })
    }

    const planOrder: Record<string, number> = {
        starter: 1,
        growth: 2,
        pro: 3,
        enterprise: 4,
    }

    const isPlanAllowed = (requiredPlan?: string) => {
        if (!requiredPlan) return true
        return (planOrder[plan] || 0) >= (planOrder[requiredPlan] || 0)
    }

    // ✅ Dynamic tab label based on institution type
    const getTabLabel = (tab: typeof SETTINGS_TABS[number]): string => {
        if (tab.id === 'school') {
            return instType === 'school' 
                ? 'School Profile'
                : instType === 'academy'
                    ? 'Academy Profile'
                    : 'Institute Profile'
        }
        if (tab.id === 'academic') {
            return instType === 'school'
                ? 'Academic'
                : instType === 'academy'
                    ? 'Course Structure'
                    : 'Batch Structure'
        }
        if (tab.id === 'payment') {
            return instType === 'school'
                ? 'Payment & Fees'
                : 'Payment Settings'
        }
        return tab.label
    }

    // ✅ Dynamic tab description
    const getTabDescription = (tab: typeof SETTINGS_TABS[number]): string => {
        if (tab.id === 'school') {
            return instType === 'school'
                ? 'School name, contact, address'
                : instType === 'academy'
                    ? 'Academy name, contact, address'
                    : 'Institute name, contact, address'
        }
        if (tab.id === 'academic') {
            return instType === 'school'
                ? 'Classes, sections, subjects, grading'
                : instType === 'academy'
                    ? 'Courses, batches, syllabus'
                    : 'Batches, courses, subjects'
        }
        if (tab.id === 'payment') {
            return instType === 'school'
                ? 'Razorpay, receipts, GST, late fine'
                : 'Razorpay, receipts, course fees'
        }
        return tab.description
    }

    return (
        <>
            <nav className="hidden md:flex flex-col gap-0.5 w-52 flex-shrink-0">
                {SETTINGS_TABS.map((tab) => {
                    const Icon = ICONS[tab.icon]
                    const isActive = activeTab === tab.id
                    const isLocked = !isPlanAllowed(tab.requiredPlan)
                    const displayLabel = getTabLabel(tab)
                    const displayDesc = getTabDescription(tab)

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => !isLocked && handleTabChange(tab.id)}
                            disabled={isLocked}
                            title={
                                isLocked
                                    ? `Requires ${tab.requiredPlan} plan`
                                    : displayDesc
                            }
                            className={`
                                portal-nav-item w-full text-left
                                ${isActive ? 'active' : ''}
                                ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                        >
                            {Icon && (
                                <Icon
                                    size={16}
                                    className={`
                                        nav-icon flex-shrink-0
                                        ${isActive ? 'text-[var(--primary-500)]' : ''}
                                    `}
                                />
                            )}
                            <span className="flex-1 truncate">{displayLabel}</span>
                            {isLocked && (
                                <span className="text-[10px] badge badge-warning px-1 py-0.5">
                                    {tab.requiredPlan}
                                </span>
                            )}
                        </button>
                    )
                })}
            </nav>

            <nav
                className="
                    md:hidden flex gap-1 overflow-x-auto
                    scrollbar-hide pb-1 -mx-4 px-4
                "
            >
                {SETTINGS_TABS.map((tab) => {
                    const Icon = ICONS[tab.icon]
                    const isActive = activeTab === tab.id
                    const isLocked = !isPlanAllowed(tab.requiredPlan)
                    const displayLabel = getTabLabel(tab)

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => !isLocked && handleTabChange(tab.id)}
                            disabled={isLocked}
                            className={`
                                flex items-center gap-1.5
                                px-3 py-2 rounded-[var(--radius-md)]
                                text-xs font-600 whitespace-nowrap
                                flex-shrink-0 transition-all duration-150
                                ${isActive
                                    ? 'bg-[var(--primary-50)] text-[var(--primary-600)] border border-[var(--primary-200)]'
                                    : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-transparent'
                                }
                                ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                        >
                            {Icon && <Icon size={13} />}
                            {displayLabel}
                        </button>
                    )
                })}
            </nav>
        </>
    )
}