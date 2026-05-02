// FILE: src/app/(dashboard)/admin/settings/SettingsClient.tsx
// FIXES:
// 1. useSession import add karo — session.user.tenantId crash fix
// 2. CertificateTab ko institutionType + subscriptionStatus + isTrial pass karo
// 3. schoolId: session?.user?.tenantId || '' — safe access

'use client'

import { useState, Suspense } from 'react'
import { useSession } from 'next-auth/react' // ✅ FIX: Import add karo
import { SettingsNav } from '@/components/settings/SettingsNav'
import { SchoolProfileTab } from '@/components/settings/tabs/SchoolProfileTab'
import { AcademicTab } from '@/components/settings/tabs/AcademicTab'
import { NotificationsTab } from '@/components/settings/tabs/NotificationsTab'
import { PaymentTab } from '@/components/settings/tabs/PaymentTab'
import { AppearanceTab } from '@/components/settings/tabs/AppearanceTab'
import { ModulesTab } from '@/components/settings/tabs/ModulesTab'
import { DataTab } from '@/components/settings/tabs/DataTab'
import { SecurityTab } from '@/components/settings/tabs/SecurityTab'
import { SubscriptionTab } from '@/components/settings/tabs/SubscriptionTab'
import { CertificateTab } from '@/components/settings/tabs/CertificateTab'
import type { SettingsResponse, SettingsTab } from '@/types/settings'
import { useSearchParams } from 'next/navigation'

interface SettingsClientProps {
    initialData: SettingsResponse
    lastUpdatedBy?: string
}

function SettingsInner({ initialData, lastUpdatedBy }: SettingsClientProps) {
    const searchParams = useSearchParams()
    const activeTab = (searchParams.get('tab') || 'school') as SettingsTab
    const [data, setData] = useState<SettingsResponse>(initialData)

    // ✅ FIX: session yahan se lo — certificates case crash fix
    const { data: session } = useSession()

    const [enabledModules, setEnabledModules] = useState<string[]>(
        initialData.school.enabledModules || []
    )

    const renderTab = () => {
        switch (activeTab) {
            case 'school':
                return (
                    <SchoolProfileTab
                        school={data.school}
                        institutionType={
                            data.school.institutionType as any
                        }
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
                        institutionType={
                            data.school.institutionType as any
                        }
                        onSaved={(updated) =>
                            setData((prev) => ({
                                ...prev,
                                academic: updated,
                            }))
                        }
                    />
                )

            case 'certificates':
                return (
                    // ✅ FIX: session?.user?.tenantId — safe access
                    // ✅ FIX: institutionType + subscriptionStatus + isTrial pass karo
                    <CertificateTab
                        schoolId={
                            session?.user?.tenantId ||
                            data.school.id ||
                            ''
                        }
                        institutionType={
                            (data.school.institutionType as
                                | 'school'
                                | 'academy'
                                | 'coaching') || 'school'
                        }
                        subscriptionStatus={
                            data.school.subscriptionStatus || 'trial'
                        }
                        isTrial={
                            data.school.subscriptionStatus === 'trial'
                        }
                    />
                )

            case 'notifications':
                return (
                    <NotificationsTab
                        notifications={data.notifications}
                        institutionType={
                            data.school.institutionType as any
                        }
                        onSaved={(updated) =>
                            setData((prev) => ({
                                ...prev,
                                notifications: updated,
                            }))
                        }
                    />
                )

            case 'payment':
                return (
                    <PaymentTab
                        payment={data.payment}
                        plan={data.school.plan}
                        subscriptionStatus={
                            data.school.subscriptionStatus
                        }
                        institutionType={
                            data.school.institutionType as any
                        }
                        onSaved={(updated) =>
                            setData((prev) => ({
                                ...prev,
                                payment: {
                                    ...prev.payment,
                                    ...updated,
                                },
                            }))
                        }
                    />
                )

            case 'appearance':
                return (
                    <AppearanceTab
                        appearance={data.appearance}
                        schoolName={data.school.name}
                        institutionType={
                            data.school.institutionType as any
                        }
                        onSaved={(updated) =>
                            setData((prev) => ({
                                ...prev,
                                appearance: updated,
                            }))
                        }
                    />
                )

            case 'modules':
                return (
                    <ModulesTab
                        modules={data.modules}
                        enabledModules={enabledModules}
                        plan={data.school.plan}
                        subscriptionStatus={
                            data.school.subscriptionStatus
                        }
                        institutionType={data.school.institutionType}
                        isTrial={
                            data.school.subscriptionStatus === 'trial'
                        }
                        onSaved={({
                            modules,
                            enabledModules: newEnabled,
                        }) => {
                            setData((prev) => ({
                                ...prev,
                                modules,
                            }))
                            setEnabledModules(newEnabled)
                        }}
                    />
                )

            case 'data':
                return <DataTab />

            case 'security':
                return <SecurityTab />

            case 'subscription':
                return <SubscriptionTab />

            default:
                return (
                    <SchoolProfileTab
                        school={data.school}
                        institutionType={
                            data.school.institutionType as any
                        }
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
            <aside
                className="
                    hidden md:flex flex-col
                    w-52 lg:w-56 flex-shrink-0
                    sticky top-0 self-start
                    max-h-[calc(100vh-3.75rem-3rem)]
                    overflow-y-auto scrollbar-hide
                "
            >
                <div className="pb-3 mb-1 border-b border-[var(--border)] flex-shrink-0">
                    <h1 className="text-base font-700 text-[var(--text-primary)] leading-tight">
                        Settings
                    </h1>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-tight">
                        {data.school.institutionType === 'academy'
                            ? 'Academy configuration'
                            : data.school.institutionType === 'coaching'
                            ? 'Institute configuration'
                            : 'School configuration'}
                    </p>
                    {lastUpdatedBy && (
                        <p className="text-[10px] text-[var(--text-muted)] mt-1.5 leading-tight">
                            Updated by{' '}
                            <span className="font-600 text-[var(--text-secondary)]">
                                {lastUpdatedBy}
                            </span>
                        </p>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hide pt-1">
                    <SettingsNav
                        activeTab={activeTab}
                        plan={data.school.plan}
                        institutionType={
                            data.school.institutionType as any
                        }
                        subscriptionStatus={
                            data.school.subscriptionStatus
                        }
                    />
                </div>
            </aside>

            {/* Mobile nav — UNCHANGED */}
            <div className="md:hidden w-full">
                <div className="mb-4">
                    <h1 className="text-xl font-700 text-[var(--text-primary)]">
                        Settings
                    </h1>
                    <p className="text-sm text-[var(--text-muted)] mt-0.5">
                        {data.school.institutionType === 'academy'
                            ? 'Academy configuration'
                            : data.school.institutionType === 'coaching'
                            ? 'Institute configuration'
                            : 'School configuration'}
                    </p>
                </div>
                <div className="mb-4">
                    <SettingsNav
                        activeTab={activeTab}
                        plan={data.school.plan}
                        institutionType={
                            data.school.institutionType as any
                        }
                        subscriptionStatus={
                            data.school.subscriptionStatus
                        }
                    />
                </div>
            </div>

            <main className="flex-1 min-w-0 pb-10">
                {renderTab()}
            </main>
        </div>
    )
}

export function SettingsClient({
    initialData,
    lastUpdatedBy,
}: SettingsClientProps) {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-[var(--primary-200)] border-t-[var(--primary-600)] rounded-full animate-spin" />
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