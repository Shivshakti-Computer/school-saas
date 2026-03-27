// -------------------------------------------------------------
// FILE: src/app/api/fees/structure/[id]/route.ts
// GET  → single structure
// PUT  → update structure (amount, due date, etc.)
// DELETE → deactivate structure
// -------------------------------------------------------------

import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { Fee } from "@/models/Fee"
import { FeeStructure } from "@/models/FeeStructure"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    await connectDB()
    const structure = await FeeStructure.findOne({ _id: id, tenantId: session.user.tenantId }).lean()
    if (!structure) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ structure })
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    await connectDB()
    const body = await req.json()

    // Recalculate total if items changed
    if (body.items) {
        body.totalAmount = body.items.reduce((s: number, i: any) => s + Number(i.amount), 0)
    }

    const structure = await FeeStructure.findOneAndUpdate(
        { _id: id, tenantId: session.user.tenantId },
        { $set: body },
        { new: true }
    )
    if (!structure) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // If amount or dueDate changed, update pending fees too
    if (body.items || body.dueDate) {
        const updateFields: any = {}
        if (body.items) {
            updateFields.amount = structure.totalAmount
            updateFields.finalAmount = structure.totalAmount
        }
        if (body.dueDate) {
            updateFields.dueDate = new Date(body.dueDate)
        }
        await Fee.updateMany(
            { tenantId: session.user.tenantId, structureId: id, status: 'pending' },
            { $set: updateFields }
        )
    }

    return NextResponse.json({ structure })
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    await connectDB()
    await FeeStructure.findOneAndUpdate(
        { _id: id, tenantId: session.user.tenantId },
        { $set: { isActive: false } }
    )
    return NextResponse.json({ success: true })
}
