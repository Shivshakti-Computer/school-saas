/* ============================================================
   FILE: src/app/(dashboard)/layout.tsx
   Wraps all dashboard pages — Admin, Teacher, Student, Parent
   ============================================================ */

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

    return <SidebarLayout>{children}</SidebarLayout>
}