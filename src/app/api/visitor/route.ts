import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Visitor } from '@/models'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { searchParams } = req.nextUrl
    const status = searchParams.get('status')

    const filter: any = { tenantId: session.user.tenantId }
    if (status) filter.status = status

    const visitors = await Visitor.find(filter).sort({ createdAt: -1 }).lean()

    return NextResponse.json(visitors)
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const data = await req.json()

    // Generate gate pass number
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const count = await Visitor.countDocuments({ tenantId: session.user.tenantId, createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } })
    const gatePassNo = `GP-${today}-${String(count + 1).padStart(3, '0')}`

    const visitor = await Visitor.create({
        ...data,
        tenantId: session.user.tenantId,
        gatePassNo,
        createdBy: session.user.id,
    })

    return NextResponse.json(visitor)
}

export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { id, action } = await req.json()

    if (action === 'checkout') {
        const visitor = await Visitor.findOneAndUpdate(
            { _id: id, tenantId: session.user.tenantId },
            { status: 'completed', outTime: new Date() },
            { new: true }
        )
        return NextResponse.json(visitor)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}