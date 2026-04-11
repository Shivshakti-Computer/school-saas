/* ============================================================
   FILE: src/app/api/reports/attendance/student/route.ts
   Student-wise detailed attendance report with calendar
   ============================================================ */

import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import ExcelJS from 'exceljs'
import { buildPdf, C } from '@/lib/pdf-builder'
import { z } from 'zod'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  studentId: z.string().regex(/^[a-f\d]{24}$/i),
  month:     z.string().regex(/^\d{4}-\d{2}$/),
  format:    z.enum(['pdf', 'excel']).default('pdf'),
})

// ── Types ────────────────────────────────────────────────────
interface StudentLeanForReport {
  _id:         mongoose.Types.ObjectId
  rollNo:      string
  class:       string
  section:     string
  admissionNo: string
  userId?:     {
    _id:  mongoose.Types.ObjectId
    name: string
  }
}

interface AttendanceLean {
  _id:       mongoose.Types.ObjectId
  studentId: mongoose.Types.ObjectId
  date:      string
  status:    'present' | 'absent' | 'late' | 'holiday' | 'pending'
  tenantId:  mongoose.Types.ObjectId
}

function getDaysInMonth(year: number, month: number): string[] {
  const days: string[] = []
  const lastDay = new Date(year, month + 1, 0).getDate()
  
  for (let day = 1; day <= lastDay; day++) {
    const d = new Date(year, month, day)
    days.push(d.toISOString().split('T')[0])
  }
  
  return days
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rawParams = Object.fromEntries(req.nextUrl.searchParams)
  const parsed = querySchema.safeParse(rawParams)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { studentId, month, format } = parsed.data
  const [year, mon] = month.split('-').map(Number)

  try {
    await connectDB()

    const { Student } = await import('@/models/Student')
    const { Attendance } = await import('@/models/Attendance')

    // Get student with explicit type
    const student = await Student
      .findOne({ 
        _id: new mongoose.Types.ObjectId(studentId), 
        tenantId: new mongoose.Types.ObjectId(session.user.tenantId) 
      })
      .populate<{ userId: { name: string } }>('userId', 'name')
      .select('rollNo class section admissionNo userId')
      .lean() as unknown as StudentLeanForReport | null

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Get all days in month
    const days = getDaysInMonth(year, mon - 1)

    // Get attendance records with explicit type
    const records = await Attendance
      .find({
        tenantId: new mongoose.Types.ObjectId(session.user.tenantId),
        studentId: new mongoose.Types.ObjectId(studentId),
        date: { $gte: days[0], $lte: days[days.length - 1] },
      })
      .select('date status')
      .lean() as AttendanceLean[]

    const statusMap = new Map(records.map(r => [r.date, r.status]))

    // Build day-wise data
    const dayRecords = days.map(dateStr => {
      const date = new Date(dateStr)
      return {
        date: dateStr,
        day: date.toLocaleDateString('en-IN', { weekday: 'short' }),
        dayNum: date.getDate(),
        status: statusMap.get(dateStr) || 'pending',
      }
    })

    const present = dayRecords.filter(d => d.status === 'present').length
    const absent  = dayRecords.filter(d => d.status === 'absent').length
    const late    = dayRecords.filter(d => d.status === 'late').length
    const holiday = dayRecords.filter(d => d.status === 'holiday').length
    const total   = present + absent + late + holiday
    const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0

    const schoolName = (session.user as any).schoolName || 'School'

    // ── EXCEL ──
    if (format === 'excel') {
      const wb = new ExcelJS.Workbook()
      const sheet = wb.addWorksheet('Attendance Detail')

      // Title
      sheet.mergeCells('A1:E1')
      sheet.getCell('A1').value = `Student Attendance Detail — ${month}`
      sheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF4F46E5' } }
      sheet.getCell('A1').alignment = { horizontal: 'center' }

      // Student info
      sheet.addRow([])
      sheet.addRow(['Student:', student.userId?.name ?? 'Unknown'])
      sheet.addRow(['Admission No:', student.admissionNo])
      sheet.addRow(['Class:', `${student.class} - ${student.section}`])
      sheet.addRow(['Attendance:', `${percentage}%`])
      sheet.addRow([])

      // Stats
      sheet.addRow(['Present:', present, 'Absent:', absent, 'Late:', late, 'Holiday:', holiday])
      sheet.addRow([])

      // Table
      sheet.addRow(['Date', 'Day', 'Status'])
      const headerRow = sheet.lastRow
      if (headerRow) {
        headerRow.font = { bold: true }
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      }

      dayRecords.forEach(d => {
        sheet.addRow([d.date, d.day, d.status])
      })

      sheet.columns = [
        { width: 15 },
        { width: 10 },
        { width: 12 },
      ]

      const buffer = Buffer.from(await wb.xlsx.writeBuffer())
      return new Response(buffer as any, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="attendance-${student.admissionNo}-${month}.xlsx"`,
        },
      })
    }

    // ── PDF ──
    const cols = [
      { header: 'Date', width: 80, align: 'left' as const },
      { header: 'Day', width: 60, align: 'center' as const },
      { header: 'Status', width: 100, align: 'center' as const, color: (val: string) => {
        if (val === 'present') return C.green
        if (val === 'absent') return C.red
        if (val === 'late') return C.orange
        return C.slate500
      }},
    ]

    const rows = dayRecords.map(d => [d.date, d.day, d.status])

    const buffer = await buildPdf({
      title: 'Student Attendance Detail',
      schoolName,
      month,
      stats: [
        { label: 'Present', value: String(present), color: C.green },
        { label: 'Absent', value: String(absent), color: C.red },
        { label: 'Late', value: String(late), color: C.orange },
        { label: 'Attendance', value: `${percentage}%`, color: percentage >= 75 ? C.green : C.red },
      ],
      cols,
      rows,
      footer: `${student.userId?.name ?? 'Unknown'} • ${student.admissionNo} • Class ${student.class} - ${student.section}`,
    })

    return new Response(buffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="attendance-${student.admissionNo}-${month}.pdf"`,
      },
    })
  } catch (err) {
    console.error('[Student Attendance Report]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}