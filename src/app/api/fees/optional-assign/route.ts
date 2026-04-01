// FILE: src/app/api/fees/optional-assign/route.ts — NEW FILE

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

        const { structureId, studentIds, item, dueDate, academicYear } = await req.json()

        if (!structureId || !studentIds?.length || !item) {
            return NextResponse.json(
                { error: 'structureId, studentIds, item required' },
                { status: 400 }
            )
        }

        const structure = await FeeStructure.findOne({
            _id: structureId,
            tenantId: session.user.tenantId,
        })
        if (!structure) {
            return NextResponse.json({ error: 'Structure not found' }, { status: 404 })
        }

        // Har selected student ke liye Fee create karo
        // ✅ Check karo pehle se exist toh nahi karta
        let assigned = 0
        let skipped = 0

        const ops = []

        for (const studentId of studentIds) {
            // Same structure + same optional item label check
            const existing = await Fee.findOne({
                tenantId: session.user.tenantId,
                studentId,
                structureId,
                notes: `optional:${item.label}`, // tag se identify karo
            })

            if (existing) {
                skipped++
                continue
            }

            ops.push({
                insertOne: {
                    document: {
                        tenantId: session.user.tenantId,
                        studentId,
                        structureId,
                        amount: item.amount,
                        discount: 0,
                        lateFine: 0,
                        finalAmount: item.amount,
                        dueDate: new Date(dueDate),
                        status: 'pending',
                        paidAmount: 0,
                        notes: `optional:${item.label}`, // identify karo
                    },
                },
            })
            assigned++
        }

        if (ops.length > 0) {
            await Fee.bulkWrite(ops)
        }

        return NextResponse.json({ assigned, skipped })

    } catch (err: any) {
        console.error('[Optional Fee Assign Error]', err)
        return NextResponse.json(
            { error: err.message || 'Internal server error' },
            { status: 500 }
        )
    }
}