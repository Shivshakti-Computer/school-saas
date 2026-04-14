// FILE: src/app/(dashboard)/admin/settings/SettingsClient.tsx

'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { SettingsNav } from '@/components/settings/SettingsNav'
import { SchoolProfileTab } from '@/components/settings/tabs/SchoolProfileTab'
import { AcademicTab } from '@/components/settings/tabs/AcademicTab'
import { NotificationsTab } from '@/components/settings/tabs/NotificationsTab'
import { PaymentTab } from '@/components/settings/tabs/PaymentTab'
import { AppearanceTab } from '@/components/settings/tabs/AppearanceTab'
import { ModulesTab } from '@/components/settings/tabs/ModulesTab'
import { DataTab } from '@/components/settings/tabs/DataTab'
import type { SettingsResponse, SettingsTab } from '@/types/settings'

interface SettingsClientProps {
    initialData: SettingsResponse
    lastUpdatedBy?: string          // ✅ page.tsx se pass hoga
}

function SettingsInner({ initialData, lastUpdatedBy }: SettingsClientProps) {
    const searchParams = useSearchParams()
    const activeTab = (searchParams.get('tab') || 'school') as SettingsTab
    const [data, setData] = useState<SettingsResponse>(initialData)

    const renderTab = () => {
        switch (activeTab) {
            case 'school':
                return (
                    <SchoolProfileTab
                        school={data.school}
                        onSaved={(updated) =>
                            setData((prev) => ({
                                ...prev,
                                school: { ...prev.school, ...updated },
                            }))
                        }
                    />
                )
            case 'academic':
                return (
                    <AcademicTab
                        academic={data.academic}
                        onSaved={(updated) =>
                            setData((prev) => ({ ...prev, academic: updated }))
                        }
                    />
                )
            case 'notifications':
                return (
                    <NotificationsTab
                        notifications={data.notifications}
                        onSaved={(updated) =>
                            setData((prev) => ({ ...prev, notifications: updated }))
                        }
                    />
                )
            case 'payment':
                return (
                    <PaymentTab
                        payment={data.payment}
                        plan={data.school.plan}
                        onSaved={(updated) =>
                            setData((prev) => ({
                                ...prev,
                                payment: { ...prev.payment, ...updated },
                            }))
                        }
                    />
                )
            case 'appearance':
                return (
                    <AppearanceTab
                        appearance={data.appearance}
                        onSaved={(updated) =>
                            setData((prev) => ({ ...prev, appearance: updated }))
                        }
                    />
                )
            case 'modules':
                return (
                    <ModulesTab
                        modules={data.modules}
                        enabledModules={
                            data.school.id
                                ? (initialData.school as any).modules || []
                                : []
                        }
                        plan={data.school.plan}
                        onSaved={({ modules }) =>
                            setData((prev) => ({ ...prev, modules }))
                        }
                    />
                )
            case 'data':
                return <DataTab />
            default:
                return (
                    <SchoolProfileTab
                        school={data.school}
                        onSaved={(updated) =>
                            setData((prev) => ({
                                ...prev,
                                school: { ...prev.school, ...updated },
                            }))
                        }
                    />
                )
        }
    }

    return (
        <div className="flex gap-6 items-start">

            {/* ════════════════════════════════════════════════
                DESKTOP SIDEBAR — Sticky
                
                Scroll container = <main> in SidebarLayout
                  → overflow-y-auto
                  → padding: p-4 md:p-6
                
                top-0 = main scroll container ke bilkul top se
                        chipkayega — koi header scroll issue nahi
                        kyunki page title ab yahan hai
                
                max-h = 100vh - topbar(3.75rem) - padding(3rem)
                ════════════════════════════════════════════════ */}
            <aside
                className="
                    hidden md:flex
                    flex-col
                    w-52 lg:w-56
                    flex-shrink-0
                    sticky
                    top-6
                    self-start
                    max-h-[calc(100vh-3.75rem-3rem)]
                    overflow-y-auto
                    scrollbar-hide
                "
            >
                {/* ✅ Title sidebar ke andar — scroll nahi hogi */}
                <div className="
                    pb-3 mb-1
                    border-b border-[var(--border)]
                    flex-shrink-0
                ">
                    <h1 className="
                        text-base font-700
                        text-[var(--text-primary)]
                        leading-tight
                    ">
                        Settings
                    </h1>
                    <p className="
                        text-xs text-[var(--text-muted)]
                        mt-0.5 leading-tight
                    ">
                        School configuration
                    </p>
                    {/* Last updated info */}
                    {lastUpdatedBy && (
                        <p className="
                            text-[10px] text-[var(--text-muted)]
                            mt-1.5 leading-tight
                        ">
                            Updated by{' '}
                            <span className="
                                font-600
                                text-[var(--text-secondary)]
                            ">
                                {lastUpdatedBy}
                            </span>
                        </p>
                    )}
                </div>

                {/* Nav Items */}
                <div className="flex-1 overflow-y-auto scrollbar-hide pt-1">
                    <SettingsNav
                        activeTab={activeTab}
                        plan={data.school.plan}
                    />
                </div>
            </aside>

            {/* ════════════════════════════════════════════════
                MOBILE — Title + Nav stacked
                ════════════════════════════════════════════════ */}
            <div className="md:hidden w-full">
                {/* Mobile Title */}
                <div className="mb-4">
                    <h1 className="
                        text-xl font-700
                        text-[var(--text-primary)]
                    ">
                        Settings
                    </h1>
                    <p className="text-sm text-[var(--text-muted)] mt-0.5">
                        School configuration
                    </p>
                </div>
                {/* Mobile Nav */}
                <div className="mb-4">
                    <SettingsNav
                        activeTab={activeTab}
                        plan={data.school.plan}
                    />
                </div>
            </div>

            {/* ════════════════════════════════════════════════
                TAB CONTENT — freely scrolls with page
                ════════════════════════════════════════════════ */}
            <main className="flex-1 min-w-0 pb-10">
                {renderTab()}
            </main>

        </div>
    )
}

export function SettingsClient({ initialData, lastUpdatedBy }: SettingsClientProps) {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3">
                        <div className="
                            w-8 h-8 border-2
                            border-[var(--primary-200)]
                            border-t-[var(--primary-600)]
                            rounded-full animate-spin
                        " />
                        <p className="text-sm text-[var(--text-muted)]">
                            Loading settings...
                        </p>
                    </div>
                </div>
            }
        >
            <SettingsInner
                initialData={initialData}
                lastUpdatedBy={lastUpdatedBy}
            />
        </Suspense>
    )
}