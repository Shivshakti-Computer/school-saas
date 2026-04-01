// FILE: src/app/(dashboard)/admin/layout.tsx
// FIXED: Staff role can access /admin/* routes
// Module-level restrictions handled by sidebar + API guards

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)

    if (!session) redirect('/login')

    const role = session.user.role

    // Admin, Staff, and Superadmin can access /admin/* routes
    // Staff sees only allowed modules (filtered by sidebar + API)
    if (role !== 'admin' && role !== 'staff' && role !== 'superadmin') {
        const dashMap: Record<string, string> = {
            teacher: '/teacher',
            student: '/student',
            parent: '/parent',
        }
        redirect(dashMap[role] || '/login')
    }

    return <>{children}</>
}