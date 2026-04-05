// src/app/(dashboard)/layout.tsx

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

    const allowedRoles = ['admin', 'teacher', 'staff', 'student', 'parent', 'superadmin']

    if (!allowedRoles.includes(session.user.role)) {
        redirect('/login')
    }

    return (
        <SidebarLayout>
            {children}
        </SidebarLayout>
    )
}