/* ============================================================
   FILE: src/app/api/reports/attendance/route.ts
   COMPLETE: Stream support + validators + type fixes
   ============================================================ */

import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import ExcelJS from 'exceljs'
import { type ColDef, C, buildPdf } from '@/lib/pdf-builder'
import { z } from 'zod'

// ✅ Never cache — filters (month, class) must always be fresh
export const dynamic = 'force-dynamic'

// ── Constants ─────────────────────────────────────────────────

const STREAM_CLASSES = ['11', '12']

// ── Validator ─────────────────────────────────────────────────

const reportQuerySchema = z.object({
  month:   z.string().regex(/^\d{4}-\d{2}$/).optional(),
  format:  z.enum(['excel', 'pdf']).default('excel'),
  class:   z.string().optional(),
  section: z.string().optional(),
  stream:  z.string().optional(),
})

// ── Types ─────────────────────────────────────────────────────

interface StudentLeanReport {
  _id:         any
  admissionNo: string
  rollNo:      string
  class:       string
  section?:    string
  stream?:     string
  userId?:     { name: string }
}

interface AttendanceRecordLean {
  studentId: any
  date:      string
  status:    'present' | 'absent' | 'late' | 'holiday' | 'half-day'
}

interface StudentRow {
  student: StudentLeanReport
  present: number
  absent:  number
  late:    number
  holiday: number
  total:   number
  pct:     number
}

// ── Helper: Excel Header Styling ──────────────────────────────

function styleXlsHeader(
  sheet: ExcelJS.Worksheet,
  rowNum: number,
  colCount: number,
) {
  const row = sheet.getRow(rowNum)
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }
  row.alignment = { vertical: 'middle', horizontal: 'center' }
  row.height = 22
  
  for (let c = 1; c <= colCount; c++) {
    const cell = sheet.getCell(rowNum, c)
    cell.border = {
      top:    { style: 'thin' },
      bottom: { style: 'thin' },
      left:   { style: 'thin' },
      right:  { style: 'thin' },
    }
  }
}

// ── Helper: Empty Excel ───────────────────────────────────────

async function generateEmptyExcel(month: string, schoolName: string) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'School Management System'
  const sheet = wb.addWorksheet('No Data')
  
  sheet.mergeCells('A1:E1')
  const cell = sheet.getCell('A1')
  cell.value = `No students found for ${month} — ${schoolName}`
  cell.font = { bold: true, size: 12 }
  cell.alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getRow(1).height = 40
  
  return Buffer.from(await wb.xlsx.writeBuffer())
}

// ── Helper: Empty PDF ─────────────────────────────────────────

async function generateEmptyPdf(month: string, schoolName: string) {
  return await buildPdf({
    title: 'Attendance Report',
    schoolName,
    month,
    stats: [
      { label: 'Total Students', value: '0', color: C.slate500 },
    ],
    cols: [
      { header: 'No Data', width: 500, align: 'center' },
    ],
    rows: [['No students found matching the selected filters']],
  })
}

// ════════════════════════════════════════════════════════════
// GET /api/reports/attendance
// Query params:
//   month   = YYYY-MM         (default: current month)
//   format  = excel | pdf     (default: excel)
//   class   = 1–12 | Nursery | LKG | UKG  (optional)
//   section = A–E             (optional)
//   stream  = science | commerce | arts   (optional, for class 11/12)
// ════════════════════════════════════════════════════════════

export async function GET(req: NextRequest) {

  // ── Auth check ──────────────────────────────────────────────
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  // ── Parse & validate query params ───────────────────────────
  const rawParams = Object.fromEntries(req.nextUrl.searchParams)
  const parsed = reportQuerySchema.safeParse(rawParams)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid query parameters',
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  const { month, format, class: cls, section, stream } = parsed.data

  // Default to current month if not provided
  const targetMonth = month ?? new Date().toISOString().slice(0, 7)
  const [year, mon] = targetMonth.split('-')

  const schoolName = (session.user as any).schoolName ?? 'School'

  // ── Models (dynamic import for fast cold-start) ─────────────
  const { Student }    = await import('@/models/Student')
  const { Attendance } = await import('@/models/Attendance')

  // ── Build student query ──────────────────────────────────────
  const studentQuery: Record<string, unknown> = {
    tenantId: session.user.tenantId,
    status:   'active',
  }

  if (cls)     studentQuery.class   = cls
  if (section) studentQuery.section = section

  // ✅ Stream filter — only for Class 11/12
  if (stream && cls && STREAM_CLASSES.includes(cls)) {
    studentQuery.stream = stream.toLowerCase()
  }

  // ── Fetch students ───────────────────────────────────────────
  const students = await Student
    .find(studentQuery)
    .populate<{ userId: { name: string } }>('userId', 'name')
    .sort({ class: 1, section: 1, rollNo: 1 })
    .lean() as unknown as StudentLeanReport[]

  if (!students.length) {
    // Return empty report if no students found
    const emptyBuffer = format === 'excel'
      ? await generateEmptyExcel(targetMonth, schoolName)
      : await generateEmptyPdf(targetMonth, schoolName)

    return new Response(emptyBuffer as any, {
      headers: {
        'Content-Type': format === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf',
        'Content-Disposition': `attachment; filename="attendance-${targetMonth}-empty.${format === 'excel' ? 'xlsx' : 'pdf'}"`,
      },
    })
  }

  // ── Fetch attendance records ─────────────────────────────────
  // ✅ Real last day of month calculation
  const firstDay = `${year}-${mon.padStart(2, '0')}-01`
  const lastDay  = new Date(Number(year), Number(mon), 0)
    .toISOString()
    .slice(0, 10)

  const attendanceRecords = await Attendance.find({
    tenantId:  session.user.tenantId,
    date:      { $gte: firstDay, $lte: lastDay },
    studentId: { $in: students.map(s => s._id) },
  }).lean() as unknown as AttendanceRecordLean[]

  // ── Build lookup map: studentId → { date → status } ─────────
  const attMap: Record<string, Record<string, string>> = {}
  
  for (const r of attendanceRecords) {
    const sid = r.studentId.toString()
    if (!attMap[sid]) attMap[sid] = {}
    attMap[sid][r.date] = r.status
  }

  // ── Per-student stats ────────────────────────────────────────
  const rows: StudentRow[] = students.map(student => {
    const records = attMap[student._id.toString()] ?? {}
    const vals = Object.values(records)
    
    const present = vals.filter(v => v === 'present').length
    const absent  = vals.filter(v => v === 'absent').length
    const late    = vals.filter(v => v === 'late').length
    const holiday = vals.filter(v => v === 'holiday').length
    
    // Total working days (exclude holidays)
    const total = vals.length
    const workingDays = total - holiday
    
    // Percentage: (present + late) / workingDays
    const attended = present + late
    const pct = workingDays > 0
      ? Math.round((attended / workingDays) * 100)
      : 0
    
    return { student, present, absent, late, holiday, total: workingDays, pct }
  })

  // ── Summary statistics ───────────────────────────────────────
  const avgPct = rows.length > 0
    ? Math.round(rows.reduce((sum, r) => sum + r.pct, 0) / rows.length)
    : 0
  
  const below75 = rows.filter(r => r.pct < 75 && r.total > 0).length
  const above90 = rows.filter(r => r.pct >= 90 && r.total > 0).length

  // ════════════════════════════════════════════════════════════
  // EXCEL GENERATION
  // ════════════════════════════════════════════════════════════

  if (format === 'excel') {
    const wb = new ExcelJS.Workbook()
    wb.creator = 'School Management System'
    wb.created = new Date()
    
    const sheet = wb.addWorksheet('Attendance Report')

    // ── Title row ──
    sheet.mergeCells('A1:J1')
    const titleCell = sheet.getCell('A1')
    titleCell.value = `Attendance Report — ${targetMonth}  |  ${schoolName}`
    titleCell.font = { bold: true, size: 14, color: { argb: 'FF4F46E5' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    sheet.getRow(1).height = 28

    // ── Filter info row ──
    sheet.addRow([])
    const filterRow = sheet.getRow(2)
    let filterText = `Total Students: ${students.length}  |  Average: ${avgPct}%  |  Below 75%: ${below75}  |  Above 90%: ${above90}`
    
    if (cls) filterText += `  |  Class: ${cls}`
    if (section) filterText += ` - ${section}`
    if (stream && STREAM_CLASSES.includes(cls!)) filterText += ` (${stream})`
    
    sheet.mergeCells('A2:J2')
    const filterCell = sheet.getCell('A2')
    filterCell.value = filterText
    filterCell.font = { italic: true, size: 10 }
    filterCell.alignment = { horizontal: 'center' }

    sheet.addRow([])

    // ── Headers ──
    const headers = [
      'Roll No',
      'Adm No',
      'Name',
      'Class',
      'Section',
      'Present',
      'Absent',
      'Late',
      'Total Days',
      'Attendance %',
    ]
    
    sheet.addRow(headers)
    styleXlsHeader(sheet, 4, headers.length)

    // ── Column widths ──
    sheet.columns = [
      { width: 10 },  // Roll No
      { width: 12 },  // Adm No
      { width: 28 },  // Name
      { width: 8 },   // Class
      { width: 10 },  // Section
      { width: 10 },  // Present
      { width: 10 },  // Absent
      { width: 8 },   // Late
      { width: 12 },  // Total
      { width: 14 },  // Percentage
    ]

    // ── Data rows ──
    let rowIndex = 5
    
    for (const { student, present, absent, late, total, pct } of rows) {
      const dataRow = sheet.addRow([
        student.rollNo ?? '—',
        student.admissionNo ?? '—',
        student.userId?.name ?? 'Unknown',
        student.class,
        student.section ?? '—',
        present,
        absent,
        late,
        total,
        total > 0 ? `${pct}%` : '—',
      ])

      // ✅ Color coding for percentage
      const pctCell = dataRow.getCell(10)
      
      if (pct < 75 && total > 0) {
        pctCell.font = { color: { argb: 'FFDC2626' }, bold: true }
      } else if (pct >= 90) {
        pctCell.font = { color: { argb: 'FF059669' }, bold: true }
      }

      // Zebra striping
      if (rowIndex % 2 === 0) {
        dataRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8F9FF' },
        }
      }

      rowIndex++
    }

    // ── Auto filter ──
    sheet.autoFilter = {
      from: { row: 4, column: 1 },
      to:   { row: 4, column: 10 },
    }

    // ── Generate buffer ──
    const buffer = Buffer.from(await wb.xlsx.writeBuffer())

    return new Response(buffer as any, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="attendance-${targetMonth}${cls ? `-class${cls}` : ''}.xlsx"`,
        'Content-Length': String(buffer.byteLength),
      },
    })
  }

  // ════════════════════════════════════════════════════════════
  // PDF GENERATION (pdfmake)
  // ════════════════════════════════════════════════════════════

  if (format === 'pdf') {
    const cols: ColDef[] = [
      { header: 'Roll',   width: 35,  align: 'center' },
      { header: 'Adm No', width: 50 },
      { header: 'Name',   width: 135 },
      { header: 'Class',  width: 30,  align: 'center' },
      { header: 'Sec',    width: 30,  align: 'center' },
      { header: 'P',      width: 30,  align: 'center' },
      { header: 'A',      width: 30,  align: 'center' },
      { header: 'L',      width: 25,  align: 'center' },
      { header: 'Total',  width: 35,  align: 'center' },
      {
        header: 'Att %',
        width: 45,
        align: 'center',
        color: (val) => {
          const n = parseInt(val)
          if (isNaN(n) || val === '—') return C.slate500
          if (n < 75) return C.red
          if (n >= 90) return C.green
          return C.slate800
        },
      },
    ]

    const tableRows = rows.map(({ student, present, absent, late, total, pct }) => [
      student.rollNo ?? '—',
      student.admissionNo ?? '—',
      student.userId?.name ?? 'Unknown',
      String(student.class),
      student.section ?? '—',
      String(present),
      String(absent),
      String(late),
      String(total),
      total > 0 ? `${pct}%` : '—',
    ])

    const buffer = await buildPdf({
      title: 'Attendance Report',
      schoolName,
      month: targetMonth,
      stats: [
        { label: 'Total Students', value: String(students.length), color: C.indigo },
        { label: 'Average', value: `${avgPct}%`, color: avgPct >= 75 ? C.green : C.red },
        { label: 'Below 75%', value: String(below75), color: C.red },
        { label: 'Above 90%', value: String(above90), color: C.green },
      ],
      cols,
      rows: tableRows,
      footer: cls || section || stream
        ? `Filters: ${cls ? `Class ${cls}` : ''}${section ? ` - ${section}` : ''}${stream && STREAM_CLASSES.includes(cls!) ? ` (${stream})` : ''}`
        : undefined,
    })

    return new Response(buffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="attendance-${targetMonth}${cls ? `-class${cls}` : ''}.pdf"`,
        'Content-Length': String(buffer.byteLength),
      },
    })
  }

  // ── Invalid format ────────────────────────────────────────────
  return NextResponse.json(
    { error: 'Invalid format. Use excel or pdf.' },
    { status: 400 }
  )
}