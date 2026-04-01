// FILE: src/app/api/pdf/idcard/[studentId]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Student } from '@/models/Student'

// ✅ generateIDCardBuffer import karo — NOT generateIDCardPDF
import { generateIDCardBuffer } from '@/lib/pdf'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ studentId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { studentId } = await params

        await connectDB()

        // Tenant isolation
        const student = await Student.findOne({
            _id:      studentId,
            tenantId: session.user.tenantId,
        }).lean()

        if (!student) {
            return NextResponse.json(
                { error: 'Student not found' },
                { status: 404 }
            )
        }

        // ✅ Buffer generate karo — Cloudinary nahi
        const pdfBuffer = await generateIDCardBuffer(studentId)

        // ✅ Direct PDF response
        return new NextResponse(pdfBuffer as any, {
            status: 200,
            headers: {
                'Content-Type':        'application/pdf',
                'Content-Disposition': `inline; filename="idcard-${studentId}.pdf"`,
                'Cache-Control':       'no-store, no-cache',
            },
        })

    } catch (err: any) {
        console.error('[ID Card Error]', err)
        return NextResponse.json(
            { error: err.message ?? 'Failed to generate ID card' },
            { status: 500 }
        )
    }
}