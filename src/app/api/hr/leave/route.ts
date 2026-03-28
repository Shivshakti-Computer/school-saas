import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Staff } from '@/models/Staff'

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { staffId, leaveType, days } = await req.json()

    const staff = await Staff.findOne({ _id: staffId, tenantId: session.user.tenantId })
    if (!staff) return NextResponse.json({ error: 'Staff not found' }, { status: 404 })

    const balance = staff.leaveBalance[leaveType as keyof typeof staff.leaveBalance]
    if (balance === undefined) return NextResponse.json({ error: 'Invalid leave type' }, { status: 400 })
    if (balance < days) return NextResponse.json({ error: `Only ${balance} ${leaveType} leaves remaining` }, { status: 400 })

    await Staff.findByIdAndUpdate(staffId, {
        $inc: { [`leaveBalance.${leaveType}`]: -days }
    })

    return NextResponse.json({ success: true, remainingBalance: balance - days })
}