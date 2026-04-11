/* ============================================================
   FILE: src/app/api/attendance/summary/route.ts
   NEW — Dashboard widget ke liye daily summary
   GET /api/attendance/summary?date=2025-01-15&class=5
   ============================================================ */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Attendance } from '@/models/Attendance'
import { attendanceSummarySchema } from '@/lib/validators/attendance'

function errRes(msg: string, status: number) {
    return NextResponse.json({ error: msg }, { status })
}

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return errRes('Unauthorized', 401)

    const raw = Object.fromEntries(req.nextUrl.searchParams)
    const parsed = attendanceSummarySchema.safeParse(raw)

    if (!parsed.success) {
        return NextResponse.json(
            { error: 'Invalid params', details: parsed.error.flatten().fieldErrors },
            { status: 400 }
        )
    }

    const { date, class: cls, section } = parsed.data
    const targetDate = date ?? new Date().toISOString().split('T')[0]

    try {
        await connectDB()

        const summary = cls
            ? await Attendance.getDailyClassSummary(
                session.user.tenantId,
                targetDate,
                cls,
                section
            )
            : await Attendance.getDailyClassSummary(
                session.user.tenantId,
                targetDate,
                '',   // All classes
                undefined
            )

        return NextResponse.json({
            summary,
            date: targetDate,
            ...(cls ? { class: cls, section } : {}),
        })
    } catch (err) {
        console.error('[GET /api/attendance/summary]', err)
        return errRes('Internal server error', 500)
    }
}