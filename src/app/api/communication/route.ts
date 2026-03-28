import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Communication, Student } from '@/models'
import { sendSMS } from '@/lib/sms'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const history = await Communication.find({
        tenantId: session.user.tenantId
    }).sort({ sentAt: -1 }).limit(50).lean()

    return NextResponse.json(history)
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const data = await req.json()

    // Get target students
    let students: any[] = []
    if (data.recipients === 'all') {
        students = await Student.find({ tenantId: session.user.tenantId, status: 'active' })
    } else if (data.recipients === 'class') {
        students = await Student.find({ tenantId: session.user.tenantId, class: data.targetClass, status: 'active' })
    }

    // Send SMS
    let sent = 0
    let failed = 0

    if (data.type === 'sms') {
        for (const s of students) {
            try {
                await sendSMS(s.parentPhone, data.content)
                sent++
            } catch (e) {
                failed++
            }
        }
    }

    // Log communication
    const comm = await Communication.create({
        ...data,
        tenantId: session.user.tenantId,
        sentBy: session.user.id,
        totalSent: sent,
        totalFailed: failed,
    })

    return NextResponse.json({ success: true, sent, failed, comm })
}