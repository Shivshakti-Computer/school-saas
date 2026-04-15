// FILE: src/app/api/fees/structure/[id]/route.ts

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
    const structure = await FeeStructure.findOne({
        _id: id,
        tenantId: session.user.tenantId,
    }).lean()
    if (!structure) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
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

    // ✅ FIX 1 — Sirf MANDATORY items ka total calculate karo
    if (body.items) {
        const mandatoryTotal = body.items
            .filter((i: any) => !i.isOptional)       // ← KEY FIX
            .reduce((s: number, i: any) => s + Number(i.amount), 0)

        body.totalAmount = mandatoryTotal
    }

    const structure = await FeeStructure.findOneAndUpdate(
        { _id: id, tenantId: session.user.tenantId },
        { $set: body },
        { new: true }
    )
    if (!structure) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // ✅ FIX 2 — Sirf NON-OPTIONAL fees update karo
    if (body.items || body.dueDate) {
        const updateFields: any = {}

        if (body.items) {
            updateFields.amount = structure.totalAmount  // ✅ now correct
            updateFields.finalAmount = structure.totalAmount  // ✅ now correct
        }
        if (body.dueDate) {
            updateFields.dueDate = new Date(body.dueDate)
        }

        await Fee.updateMany(
            {
                tenantId: session.user.tenantId,
                structureId: id,
                status: 'pending',
                // ✅ FIX 3 — Optional fee records touch mat karo
                isOptionalFee: { $ne: true },
            },
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