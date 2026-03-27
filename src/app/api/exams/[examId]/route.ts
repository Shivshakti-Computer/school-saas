// ─────────────────────────────────────────────────────────────
// FILE: src/app/api/exams/[examId]/route.ts
// GET single exam by ID
// ─────────────────────────────────────────────────────────── */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Exam } from '@/models/Exam'

export async function GET(
    req: NextRequest,
    { params }: { params: { examId: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const exam = await Exam.findOne({
        _id: params.examId,
        tenantId: session.user.tenantId,
    }).lean()

    if (!exam) {
        return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    return NextResponse.json({ exam })
}