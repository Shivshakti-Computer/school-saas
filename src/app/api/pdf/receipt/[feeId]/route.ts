// -------------------------------------------------------------
// FILE: src/app/api/pdf/receipt/[feeId]/route.ts
// GET → receipt generate karo ya existing return karo
// REPLACE with fixed Next.js 15 version (await params)
// -------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Fee } from '@/models/Fee'
import { Student } from '@/models/Student'
import { User } from '@/models/User'
import { generateReceiptPDF } from '@/lib/pdf'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ feeId: string }> }   // Next.js 15: Promise
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { feeId } = await params   // await karo
        await connectDB()

        // Fee verify — apni hi fee dekhe
        let feeQuery: any = { _id: feeId, tenantId: session.user.tenantId }

        if (['student', 'parent'].includes(session.user.role)) {
            let studentId: string | null = null
            if (session.user.role === 'student') {
                const stu = await Student.findOne({
                    userId: session.user.id, tenantId: session.user.tenantId,
                }).select('_id').lean()
                studentId = stu?._id?.toString() ?? null
            } else {
                const p = await User.findById(session.user.id).select('studentRef').lean() as any
                studentId = p?.studentRef?.toString() ?? null
            }
            if (studentId) feeQuery.studentId = studentId
        }

        const fee = await Fee.findOne(feeQuery)
        if (!fee) return NextResponse.json({ error: 'Fee not found' }, { status: 404 })

        // Return existing receipt URL if available
        if (fee.receiptUrl) {
            return NextResponse.json({ url: fee.receiptUrl })
        }

        // Generate new receipt
        const url = await generateReceiptPDF(feeId)
        await Fee.findByIdAndUpdate(fee._id, { receiptUrl: url })

        return NextResponse.json({ url })

    } catch (err: any) {
        console.error('Receipt error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}