// FILE: src/app/(dashboard)/student/security/page.tsx

'use client'

import { PageHeader } from '@/components/ui'
import { ChangePasswordCard } from '@/components/security/ChangePasswordCard'

export default function StudentSecurityPage() {
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