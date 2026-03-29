import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Student } from '@/models/Student'


export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const student = await Student.findOne({
        _id: id,
        tenantId: session.user.tenantId,
    }).populate('userId', 'name phone email').lean()

    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ student })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const body = await req.json()

    const student = await Student.findOneAndUpdate(
        { _id: id, tenantId: session.user.tenantId },
        { $set: body },
        { new: true }
    )

    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ student })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    await Student.findOneAndUpdate(
        { _id: id, tenantId: session.user.tenantId },
        { $set: { status: 'inactive' } }
    )

    return NextResponse.json({ success: true })
}