import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Timetable } from '@/models'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['admin', 'teacher'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { searchParams } = req.nextUrl
    const cls = searchParams.get('class')
    const section = searchParams.get('section')

    const filter: any = { tenantId: session.user.tenantId }
    if (cls) filter.class = cls
    if (section) filter.section = section

    const timetables = await Timetable.find(filter)
        .populate('days.periods.teacherId', 'name')
        .lean()

    return NextResponse.json(timetables)
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const data = await req.json()

    const timetable = await Timetable.findOneAndUpdate(
        {
            tenantId: session.user.tenantId,
            class: data.class,
            section: data.section || null,
        },
        {
            ...data,
            tenantId: session.user.tenantId,
            createdBy: session.user.id,
        },
        { upsert: true, new: true }
    )

    return NextResponse.json(timetable)
}