import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Homework } from '@/models'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['admin', 'teacher', 'student', 'parent'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { searchParams } = req.nextUrl
    const cls = searchParams.get('class')

    const filter: any = { tenantId: session.user.tenantId }
    if (cls) filter.class = cls

    const homework = await Homework.find(filter)
        .sort({ dueDate: -1 })
        .populate('assignedBy', 'name')
        .lean()

    return NextResponse.json(homework)
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['admin', 'teacher'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const data = await req.json()

    const hw = await Homework.create({
        ...data,
        tenantId: session.user.tenantId,
        assignedBy: session.user.id,
    })

    return NextResponse.json(hw)
}