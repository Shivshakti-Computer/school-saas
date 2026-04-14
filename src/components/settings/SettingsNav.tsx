// FILE: src/components/settings/SettingsNav.tsx
// Tab navigation for settings page

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
    Building2, GraduationCap, Bell,
    CreditCard, Palette, LayoutGrid, Database,
} from 'lucide-react'
import { SETTINGS_TABS } from '@/types/settings'
import type { SettingsTab } from '@/types/settings'

const ICONS: Record<string, React.ElementType> = {
    Building2,
    GraduationCap,
    Bell,
    CreditCard,
    Palette,
    LayoutGrid,
    Database,
}

interface SettingsNavProps {
    activeTab: SettingsTab
    plan: string
}

export function SettingsNav({ activeTab, plan }: SettingsNavProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleTabChange = (tab: SettingsTab) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('tab', tab)
        router.push(`?${params.toString()}`, { scroll: false })
    }

    // Plan hierarchy check
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

    return (
        <>
            {/* ── Desktop — Vertical sidebar nav ── */}
            <nav className="hidden md:flex flex-col gap-0.5 w-52 flex-shrink-0">
                {SETTINGS_TABS.map((tab) => {
                    const Icon = ICONS[tab.icon]
                    const isActive = activeTab === tab.id
                    const isLocked = !isPlanAllowed(tab.requiredPlan)

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => !isLocked && handleTabChange(tab.id)}
                            disabled={isLocked}
                            title={
                                isLocked
                                    ? `Requires ${tab.requiredPlan} plan`
                                    : tab.description
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
                            <span className="flex-1 truncate">{tab.label}</span>
                            {isLocked && (
                                <span className="text-[10px] badge badge-warning px-1 py-0.5">
                                    {tab.requiredPlan}
                                </span>
                            )}
                        </button>
                    )
                })}
            </nav>

            {/* ── Mobile — Horizontal scroll nav ── */}
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
                            {tab.label}
                        </button>
                    )
                })}
            </nav>
        </>
    )
}