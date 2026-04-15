// FILE: src/app/api/fees/optional-assign/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Fee } from '@/models/Fee'
import { FeeStructure } from '@/models/FeeStructure'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()

        const body = await req.json()
        const { structureId, studentIds, dueDate, academicYear } = body

        const items: Array<{ label: string; amount: number; isOptional: boolean }> =
            body.items
                ? body.items
                : body.item
                    ? [body.item]
                    : []

        if (!structureId || !studentIds?.length || !items.length) {
            return NextResponse.json(
                { error: 'structureId, studentIds, aur kam se kam ek item required hai' },
                { status: 400 }
            )
        }

        const structure = await FeeStructure.findOne({
            _id:      structureId,
            tenantId: session.user.tenantId,
        })
        if (!structure) {
            return NextResponse.json({ error: 'Structure not found' }, { status: 404 })
        }

        // Validate optional items
        const structureOptionalLabels = structure.items
            .filter((i: any) => i.isOptional)
            .map((i: any) => i.label)

        const invalidItems = items.filter(
            (i: any) => !structureOptionalLabels.includes(i.label)
        )
        if (invalidItems.length > 0) {
            return NextResponse.json(
                { error: `Invalid optional items: ${invalidItems.map((i: any) => i.label).join(', ')}` },
                { status: 400 }
            )
        }

        const selectedLabels = items.map((i: any) => i.label)

        let assigned   = 0
        let skipped    = 0
        let alreadyHad = 0

        for (const studentId of studentIds) {

            const existingFee = await Fee.findOne({
                tenantId:      session.user.tenantId,
                studentId,
                structureId,
                isOptionalFee: { $ne: true },
            })

            if (!existingFee) {
                skipped++
                continue
            }

            // ✅ Null-safe — purane docs mein null ho sakta hai
            const alreadyAdded: string[] = Array.isArray(existingFee.optionalItemLabels)
                ? existingFee.optionalItemLabels
                : []

            const newLabels = selectedLabels.filter(
                (label: string) => !alreadyAdded.includes(label)
            )

            if (newLabels.length === 0) {
                alreadyHad++
                continue
            }

            const newItemsAmount = items
                .filter((i: any) => newLabels.includes(i.label))
                .reduce((sum: number, i: any) => sum + Number(i.amount), 0)

            // ✅ FIX 1 — Simple approach: do alag operations
            // Step A: amount increment karo
            await Fee.findByIdAndUpdate(
                existingFee._id,
                {
                    $inc: {
                        amount:      newItemsAmount,
                        finalAmount: newItemsAmount,
                    },
                }
            )

            // Step B: ✅ FIX 2 — optionalItemLabels safely set karo
            // Pehle current value lo (already fetched hai)
            const updatedLabels = [...alreadyAdded, ...newLabels]

            await Fee.findByIdAndUpdate(
                existingFee._id,
                {
                    $set: {
                        // ✅ Direct set — null issue nahi hoga
                        optionalItemLabels: updatedLabels,
                    },
                }
            )

            assigned++
        }

        return NextResponse.json({
            assigned,
            skipped,
            alreadyHad,
            message: `${assigned} students ko optional fees add ho gayi`,
        })

    } catch (err: any) {
        console.error('[Optional Fee Assign Error]', err)
        return NextResponse.json(
            { error: err.message || 'Internal server error' },
            { status: 500 }
        )
    }
}