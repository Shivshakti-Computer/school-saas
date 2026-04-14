import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Timetable } from '@/models/Timetable'
import { getCurrentAcademicYear } from '@/lib/academicYear'
import { TimetableClient } from './TimetableClient'
import { requireModule } from '@/lib/planGaurd'

export const metadata = {
    title: 'Timetable | Skolify',
}

export default async function TimetablePage() {
    await requireModule('timetable')

    const session = await getServerSession(authOptions)
    if (!session?.user) redirect('/login')

    await connectDB()

    const academicYear = getCurrentAcademicYear()

    // Fetch all timetables for this school + year
    const timetables = await Timetable.find({
        tenantId: session.user.tenantId,
        academicYear,
        isActive: true,
    })
        .populate('days.periods.teacherId', 'name')
        .sort({ class: 1, section: 1 })
        .lean()

    // Serialize
    const serialized = JSON.parse(JSON.stringify(timetables))

    return (
        <TimetableClient
            initialTimetables={serialized}
            academicYear={academicYear}
            userRole={session.user.role}
        />
    )
}