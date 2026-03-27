/* ─────────────────────────────────────────────────────────────
   FILE: src/app/api/exams/route.ts
   GET  → list exams for class
   POST → create exam schedule
   ─────────────────────────────────────────────────────────── */
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Exam, Result, calculateGrade } from '@/models/Exam'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const cls = req.nextUrl.searchParams.get('class')

    const query: any = { tenantId: session.user.tenantId }
    if (cls) query.class = cls

    const exams = await Exam.find(query).sort({ createdAt: -1 }).lean()
    return NextResponse.json({ exams })
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const body = await req.json()

    const exam = await Exam.create({
        tenantId: session.user.tenantId,
        createdBy: session.user.id,
        ...body,
    })

    return NextResponse.json({ exam }, { status: 201 })
}