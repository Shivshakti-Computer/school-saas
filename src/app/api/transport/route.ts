import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Route } from '@/models/Transport'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const routes = await Route.find({
        tenantId: session.user.tenantId,
        isActive: true,
    }).populate('assignedStudents', 'admissionNo').sort({ routeNo: 1 }).lean()

    const stats = {
        totalRoutes: routes.length,
        totalStudents: routes.reduce((s, r) => s + (r.assignedStudents?.length || 0), 0),
        totalCapacity: routes.reduce((s, r) => s + r.capacity, 0),
    }

    return NextResponse.json({ routes, stats })
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const body = await req.json()

    const route = await Route.create({
        tenantId: session.user.tenantId,
        ...body,
        isActive: true,
    })

    return NextResponse.json({ route }, { status: 201 })
}

export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { id, ...data } = await req.json()

    const route = await Route.findOneAndUpdate(
        { _id: id, tenantId: session.user.tenantId },
        data,
        { new: true }
    )

    return NextResponse.json({ route })
}

export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { id } = await req.json()

    await Route.findOneAndUpdate(
        { _id: id, tenantId: session.user.tenantId },
        { isActive: false }
    )

    return NextResponse.json({ success: true })
}