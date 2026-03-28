import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { InventoryItem } from '@/models'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const items = await InventoryItem.find({
        tenantId: session.user.tenantId
    }).sort({ name: 1 }).lean()

    return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const data = await req.json()

    const item = await InventoryItem.create({
        ...data,
        tenantId: session.user.tenantId,
        updatedBy: session.user.id,
    })

    return NextResponse.json(item)
}

export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { id, ...data } = await req.json()

    const item = await InventoryItem.findOneAndUpdate(
        { _id: id, tenantId: session.user.tenantId },
        { ...data, updatedBy: session.user.id, lastUpdated: new Date() },
        { new: true }
    )

    return NextResponse.json(item)
}