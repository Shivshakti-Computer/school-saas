// FILE: src/components/settings/SettingsNav.tsx
// ✅ UPDATED: Trial users ko payment tab unlock
//            subscriptionStatus aware isPlanAllowed
//            Institution-aware labels (School/Academy/Coaching)

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
    Building2, GraduationCap, Bell,
    CreditCard, Palette, LayoutGrid, Database,
    Shield, Zap,
    Award,
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
    Award,
}

interface SettingsNavProps {
    activeTab: SettingsTab
    plan: string
    institutionType?: InstitutionType
    subscriptionStatus?: string  // ✅ ADD
}

export function SettingsNav({
    activeTab,
    plan,
    institutionType,
    subscriptionStatus,
}: SettingsNavProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { data: session } = useSession()

    // ✅ institutionType — prop > session > default
    const instType: InstitutionType =
        institutionType ||
        ((session?.user as any)?.institutionType as InstitutionType) ||
        'school'

    // ✅ subscriptionStatus — prop > session > default
    const subStatus =
        subscriptionStatus ||
        (session?.user as any)?.subscriptionStatus ||
        'trial'

    const isTrial = subStatus === 'trial'

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

    // ✅ FIX: Trial mein sab unlock — paid mein plan check
    const isPlanAllowed = (requiredPlan?: string): boolean => {
        if (!requiredPlan) return true
        // Trial users — sabhi tabs accessible
        if (isTrial) return true
        // Paid users — plan tier check
        return (planOrder[plan] || 0) >= (planOrder[requiredPlan] || 0)
    }

    // ✅ Lock reason — badge text ke liye
    const getLockReason = (requiredPlan?: string): string => {
        if (!requiredPlan) return ''
        if (isTrial) return ''
        return requiredPlan
    }

    // ✅ Dynamic tab label — institution type aware
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

    // ✅ Dynamic tab description — institution type aware
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

    // ✅ Tooltip text
    const getTooltip = (
        tab: typeof SETTINGS_TABS[number],
        isLocked: boolean,
        displayDesc: string
    ): string => {
        if (!isLocked) return displayDesc
        if (isTrial) return displayDesc // Trial mein lock nahi
        return `Requires ${tab.requiredPlan} plan to access`
    }

    return (
        <>
            {/* ── Desktop Nav ── */}
            <nav className="hidden md:flex flex-col gap-0.5 w-52 flex-shrink-0">
                {SETTINGS_TABS.map((tab) => {
                    const Icon = ICONS[tab.icon]
                    const isActive = activeTab === tab.id
                    const isLocked = !isPlanAllowed(tab.requiredPlan)
                    const lockReason = getLockReason(tab.requiredPlan)
                    const displayLabel = getTabLabel(tab)
                    const displayDesc = getTabDescription(tab)

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => !isLocked && handleTabChange(tab.id)}
                            disabled={isLocked}
                            title={getTooltip(tab, isLocked, displayDesc)}
                            aria-current={isActive ? 'page' : undefined}
                            className={`
                                portal-nav-item w-full text-left
                                ${isActive ? 'active' : ''}
                                ${isLocked
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'cursor-pointer'
                                }
                            `}
                        >
                            {Icon && (
                                <Icon
                                    size={16}
                                    className={`
                                        nav-icon flex-shrink-0
                                        ${isActive
                                            ? 'text-[var(--primary-500)]'
                                            : ''
                                        }
                                    `}
                                    aria-hidden="true"
                                />
                            )}
                            <span className="flex-1 truncate">
                                {displayLabel}
                            </span>
                            {/* ✅ Lock badge — sirf paid plan mismatch pe */}
                            {isLocked && lockReason && (
                                <span className="text-[10px] badge badge-warning px-1 py-0.5 flex-shrink-0">
                                    {lockReason}
                                </span>
                            )}
                            {/* ✅ Trial badge — trial mein sab accessible */}
                            {isTrial && tab.requiredPlan && !isLocked && (
                                <span
                                    className="text-[9px] px-1 py-0.5 rounded flex-shrink-0 font-600"
                                    style={{
                                        background: 'var(--primary-50)',
                                        color: 'var(--primary-500)',
                                        border: '1px solid var(--primary-100)',
                                    }}
                                >
                                    trial
                                </span>
                            )}
                        </button>
                    )
                })}
            </nav>

            {/* ── Mobile Nav ── */}
            <nav
                className="
                    md:hidden flex gap-1 overflow-x-auto
                    scrollbar-hide pb-1 -mx-4 px-4
                "
                aria-label="Settings navigation"
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
                            aria-current={isActive ? 'page' : undefined}
                            className={`
                                flex items-center gap-1.5
                                px-3 py-2 rounded-[var(--radius-md)]
                                text-xs font-600 whitespace-nowrap
                                flex-shrink-0 transition-all duration-150
                                ${isActive
                                    ? 'bg-[var(--primary-50)] text-[var(--primary-600)] border border-[var(--primary-200)]'
                                    : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-transparent'
                                }
                                ${isLocked
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'cursor-pointer'
                                }
                            `}
                        >
                            {Icon && (
                                <Icon size={13} aria-hidden="true" />
                            )}
                            {displayLabel}
                            {isLocked && (
                                <span className="text-[9px] opacity-70">🔒</span>
                            )}
                        </button>
                    )
                })}
            </nav>
        </>
    )
}