// FILE: src/app/(dashboard)/layout.tsx
// FIXED: Added 'staff' role to allowed list
// Staff users access admin routes via (dashboard) layout

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { SidebarLayout } from '@/components/layouts/SidebarLayout'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)
    if (!session) redirect('/login')

    // All dashboard roles allowed — routing handled by sub-layouts
    const allowedRoles = ['admin', 'teacher', 'staff', 'student', 'parent', 'superadmin']

    if (!allowedRoles.includes(session.user.role)) {
        redirect('/login')
    }

    return <SidebarLayout>{children}</SidebarLayout>
}