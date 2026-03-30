// FILE: src/app/(public)/security/layout.tsx

import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Security — How We Protect Your School Data',
    description:
        'Learn about Skolify security — HTTPS encryption, role-based access, tenant isolation, plan-based module locking, and cloud infrastructure.',
    alternates: { canonical: '/security' },
}

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}