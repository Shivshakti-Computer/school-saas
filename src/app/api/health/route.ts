import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { HealthRecord } from '@/models'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { searchParams } = req.nextUrl
    const studentId = searchParams.get('studentId')

    const filter: any = { tenantId: session.user.tenantId }
    if (studentId) filter.studentId = studentId

    const records = await HealthRecord.find(filter).lean()

    return NextResponse.json(records)
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const data = await req.json()

    const record = await HealthRecord.findOneAndUpdate(
        { tenantId: session.user.tenantId, studentId: data.studentId },
        { ...data, tenantId: session.user.tenantId },
        { upsert: true, new: true }
    )

    return NextResponse.json(record)
}