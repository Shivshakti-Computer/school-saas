import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { HostelRoom, MessMenu } from '@/models/Hostel'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { searchParams } = req.nextUrl
    const type = searchParams.get('type')

    if (type === 'mess') {
        const menu = await MessMenu.find({ tenantId: session.user.tenantId }).lean()
        return NextResponse.json({ menu })
    }

    const rooms = await HostelRoom.find({
        tenantId: session.user.tenantId,
        isActive: true,
    }).populate('occupants', 'admissionNo').sort({ hostelName: 1, roomNo: 1 }).lean()

    const hostels = [...new Set(rooms.map(r => r.hostelName))]
    const stats = {
        totalRooms: rooms.length,
        totalCapacity: rooms.reduce((s, r) => s + r.capacity, 0),
        totalOccupied: rooms.reduce((s, r) => s + (r.occupants?.length || 0), 0),
        hostels,
    }

    return NextResponse.json({ rooms, stats })
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const body = await req.json()

    if (body.type === 'mess') {
        const menu = await MessMenu.findOneAndUpdate(
            { tenantId: session.user.tenantId, day: body.day },
            { tenantId: session.user.tenantId, day: body.day, meals: body.meals },
            { upsert: true, new: true }
        )
        return NextResponse.json({ menu })
    }

    const room = await HostelRoom.create({
        tenantId: session.user.tenantId,
        ...body,
        isActive: true,
    })

    return NextResponse.json({ room }, { status: 201 })
}

export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { id, action, studentId, ...data } = await req.json()

    if (action === 'assign' && studentId) {
        const room = await HostelRoom.findOne({ _id: id, tenantId: session.user.tenantId })
        if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
        if (room.occupants.length >= room.capacity) {
            return NextResponse.json({ error: 'Room is full' }, { status: 400 })
        }
        await HostelRoom.findByIdAndUpdate(id, { $addToSet: { occupants: studentId } })
        return NextResponse.json({ success: true })
    }

    if (action === 'remove' && studentId) {
        await HostelRoom.findByIdAndUpdate(id, { $pull: { occupants: studentId } })
        return NextResponse.json({ success: true })
    }

    const room = await HostelRoom.findOneAndUpdate(
        { _id: id, tenantId: session.user.tenantId },
        data,
        { new: true }
    )

    return NextResponse.json({ room })
}