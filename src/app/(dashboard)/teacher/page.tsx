/* ============================================================
   FILE: src/app/(dashboard)/teacher/page.tsx
   Teacher Dashboard
   ============================================================ */

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Attendance } from '@/models/Attendance'
import  '@/models/User'
import { StatCard } from '@/components/ui'
import { CheckSquare, BookOpen } from 'lucide-react'

// FIX 1: Define an interface that includes the custom properties you are using
interface TeacherUser {
    id: string
    role: string
    tenantId: string
    class?: string
    name?: string | null
}

export default async function TeacherDashboard() {
    const session = await getServerSession(authOptions)
    
    // FIX 2: Cast session.user to TeacherUser so TypeScript knows these properties exist
    const user = session?.user as TeacherUser

    if (!session || user.role !== 'teacher') redirect('/login')

    await connectDB()
    const today = new Date().toISOString().split('T')[0]

    const todayMarked = await Attendance.countDocuments({
        tenantId: user.tenantId, // Use 'user' instead of 'session.user'
        markedBy: user.id,       // Use 'user' instead of 'session.user'
        date: today,
    })

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-slate-800">
                    Namaste, {user.name?.split(' ')[0]} 👋
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                    {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <StatCard
                    label="Attendance Marked Today"
                    value={todayMarked}
                    icon={<CheckSquare size={20} />}
                    color="emerald"
                />
                <StatCard
                    label="My Class"
                    value={user.class ?? 'N/A'} // Use 'user' instead of 'session.user'
                    icon={<BookOpen size={20} />}
                    color="indigo"
                />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick Actions</p>
                <div className="flex flex-wrap gap-2">
                    <a href="/teacher/attendance" className="px-3 py-1.5 text-sm bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-lg border border-slate-200 transition-colors">
                        Mark Attendance
                    </a>
                    <a href="/teacher/marks" className="px-3 py-1.5 text-sm bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-lg border border-slate-200 transition-colors">
                        Enter Marks
                    </a>
                </div>
            </div>
        </div>
    )
}