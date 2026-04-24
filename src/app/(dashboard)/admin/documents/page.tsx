// FILE: src/app/(dashboard)/admin/documents/page.tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import DocumentsClient from './DocumentsClient'

export const metadata = {
    title: 'Documents | Skolify',
}

export default async function DocumentsPage() {
    const session = await getServerSession(authOptions)
    if (!session?.user) redirect('/login')

    const role = session.user.role
    if (role !== 'admin' && role !== 'staff') redirect('/login')

    // Module check
    const modules = session.user.modules ?? []
    const hasModule = modules.includes('documents') ||
        session.user.subscriptionStatus === 'trial'

    if (!hasModule) redirect('/admin/subscription?blocked=documents')

    return <DocumentsClient />
}