// FILE: src/app/(dashboard)/teacher/security/page.tsx

'use client'

import { PageHeader } from '@/components/ui'
import { ChangePasswordCard } from '@/components/security/ChangePasswordCard'

export default function TeacherSecurityPage() {
    return (
        <div>
            <PageHeader
                title="Security"
                subtitle="Manage your account password"
            />
            <div className="max-w-2xl">
                <ChangePasswordCard />
            </div>
        </div>
    )
}