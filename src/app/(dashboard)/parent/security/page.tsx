// FILE: src/app/(dashboard)/parent/security/page.tsx

'use client'

import { PageHeader } from '@/components/ui'
import { ChangePasswordCard } from '@/components/security/ChangePasswordCard'

export default function ParentSecurityPage() {
    return (
        <div>
            <PageHeader
                title="Security"
                subtitle="Change your login password"
            />
            <div className="max-w-2xl">
                <ChangePasswordCard />
            </div>
        </div>
    )
}