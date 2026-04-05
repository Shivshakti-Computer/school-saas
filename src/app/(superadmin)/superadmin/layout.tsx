import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { SuperadminNav } from '@/components/superadmin/SuperadminNav'
import { ChatWidget } from '@/components/marketing/ChatWidget'

export default async function SuperadminLayout({
    children,
}: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'superadmin') redirect('/login')

    return (
        <div className="min-h-screen bg-slate-50">
            <SuperadminNav userName={session.user.name || 'Super Admin'} />
            <main className="p-4 md:p-6 max-w-7xl mx-auto">
                {children}
                <ChatWidget />
            </main>
        </div>
    )
}