// -------------------------------------------------------------
// FILE: src/app/api/fees/structure/[id]/late-fine/route.ts
// POST → calculate + apply late fines for overdue fees
// Call this from cron or manually
// -------------------------------------------------------------

import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { Fee } from "@/models/Fee"
import { FeeStructure } from "@/models/FeeStructure"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    await connectDB()

    const structure = await FeeStructure.findOne({ _id: id, tenantId: session.user.tenantId })
    if (!structure || structure.lateFinePerDay === 0) {
        return NextResponse.json({ updated: 0 })
    }

    const today = new Date()
    const overdueFees = await Fee.find({
        tenantId: session.user.tenantId,
        structureId: id,
        status: 'pending',
        dueDate: { $lt: today },
    })

    let updated = 0
    for (const fee of overdueFees) {
        const daysOverdue = Math.floor((today.getTime() - new Date(fee.dueDate).getTime()) / 86400000)
        let lateFine = 0

        if (structure.lateFineType === 'fixed') {
            lateFine = structure.lateFinePerDay * daysOverdue
        } else {
            // Percent per day
            lateFine = (fee.amount * structure.lateFinePerDay / 100) * daysOverdue
        }

        // Apply max cap
        if (structure.maxLateFine > 0) {
            lateFine = Math.min(lateFine, structure.maxLateFine)
        }

        await Fee.findByIdAndUpdate(fee._id, {
            lateFine,
            finalAmount: fee.amount - fee.discount + lateFine,
        })
        updated++
    }

    return NextResponse.json({ updated })
}