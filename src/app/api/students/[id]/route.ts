/* ─────────────────────────────────────────────────────────────
   FILE: src/app/api/students/[id]/route.ts
   GET    → single student
   PUT    → update student
   DELETE → soft delete (status = inactive)
   ─────────────────────────────────────────────────────────── */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Student } from '@/models/Student'


export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const student = await Student.findOne({
        _id: params.id,
        tenantId: session.user.tenantId,
    }).populate('userId', 'name phone email').lean()

    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ student })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const body = await req.json()

    const student = await Student.findOneAndUpdate(
        { _id: params.id, tenantId: session.user.tenantId },
        { $set: body },
        { new: true }
    )

    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ student })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    // Soft delete only — data preserve karo
    await Student.findOneAndUpdate(
        { _id: params.id, tenantId: session.user.tenantId },
        { $set: { status: 'inactive' } }
    )

    return NextResponse.json({ success: true })
}