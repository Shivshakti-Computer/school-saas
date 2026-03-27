// src/app/api/pdf/idcard/[studentId]/route.ts
// Next.js 15 fix: params ko await karna padega

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Student } from '@/models/Student'
import { generateIDCardPDF } from '@/lib/pdf'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ studentId: string }> }  // ← Promise type
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { studentId } = await params  // ← await karo

        await connectDB()

        const student = await Student.findOne({
            _id: studentId,
            tenantId: session.user.tenantId,
        })

        if (!student) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 })
        }

        const url = await generateIDCardPDF(studentId)
        return NextResponse.redirect(url)

    } catch (err: any) {
        console.error('ID Card error:', err)
        return NextResponse.json(
            { error: err.message ?? 'Failed to generate ID card' },
            { status: 500 }
        )
    }
}