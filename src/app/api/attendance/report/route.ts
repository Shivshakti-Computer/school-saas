/* ─────────────────────────────────────────────────────────────
   FILE: src/app/api/attendance/report/route.ts
   GET → monthly attendance report for student or class
   ─────────────────────────────────────────────────────────── */

import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { Attendance } from "@/models"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"


export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { searchParams } = req.nextUrl
  const month = searchParams.get('month')     // "2025-03"
  const studentId = searchParams.get('studentId')
  const cls = searchParams.get('class')

  if (!month) return NextResponse.json({ error: 'month required' }, { status: 400 })

  const [year, mon] = month.split('-')
  const startDate = `${year}-${mon}-01`
  const endDate = `${year}-${mon}-31`

  const query: any = {
    tenantId: session.user.tenantId,
    date: { $gte: startDate, $lte: endDate },
  }
  if (studentId) query.studentId = studentId

  const records = await Attendance.find(query)
    .populate('studentId', 'rollNo class section admissionNo')
    .lean()

  // Group by student
  const byStudent = records.reduce((acc: any, r) => {
    const id = r.studentId._id.toString()
    if (!acc[id]) acc[id] = { student: r.studentId, present: 0, absent: 0, late: 0, total: 0 }
    acc[id][r.status] = (acc[id][r.status] || 0) + 1
    acc[id].total++
    return acc
  }, {})

  const report = Object.values(byStudent).map((s: any) => ({
    ...s,
    percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
    lowAttendance: s.total > 0 && (s.present / s.total) < 0.75,
  }))

  return NextResponse.json({ report, month })
}