// FILE: src/app/api/reports/attendance/route.ts

import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import ExcelJS from 'exceljs'
import { type ColDef, C, buildPdf } from '@/lib/pdf-builder'

// ✅ Never cache — filters (month, class) must always be fresh
export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────────────────────
// Helper: style an Excel header row
// ─────────────────────────────────────────────────────────────
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
        sheet.getCell(rowNum, c).border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' },
        }
    }
}

// ─────────────────────────────────────────────────────────────
// GET /api/reports/attendance
// Query params:
//   month  = YYYY-MM        (default: current month)
//   format = excel | pdf    (default: excel)
//   class  = 1–12           (optional filter)
// ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {

    // ── Auth check ────────────────────────────────────────────
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    // ── Query params ──────────────────────────────────────────
    const { searchParams } = req.nextUrl
    const month = searchParams.get('month') ?? new Date().toISOString().slice(0, 7)
    const format = searchParams.get('format') ?? 'excel'
    const cls = searchParams.get('class')

    const [year, mon] = month.split('-')
    const schoolName = (session.user as any).schoolName ?? ''

    // ── Models (dynamic import for fast cold-start) ───────────
    const { Student } = await import('@/models/Student')
    const { Attendance } = await import('@/models/Attendance')

    // ── Fetch students ────────────────────────────────────────
    const studentQuery: Record<string, unknown> = {
        tenantId: session.user.tenantId,
        status: 'active',
    }
    if (cls) studentQuery.class = cls

    const students = await Student
        .find(studentQuery)
        .populate('userId', 'name')
        .sort({ class: 1, section: 1 })
        .lean() as any[]

    // ── Fetch attendance records ──────────────────────────────
    // ✅ Real last day of month — no hardcoded -31
    const firstDay = `${year}-${mon}-01`
    const lastDay = new Date(Number(year), Number(mon), 0)
        .toISOString()
        .slice(0, 10)

    const attendanceRecords = await Attendance.find({
        tenantId: session.user.tenantId,
        date: { $gte: firstDay, $lte: lastDay },
    }).lean() as any[]

    // ── Build lookup map: studentId → { date → status } ──────
    const attMap: Record<string, Record<string, string>> = {}
    for (const r of attendanceRecords) {
        const sid = r.studentId.toString()
        if (!attMap[sid]) attMap[sid] = {}
        attMap[sid][r.date] = r.status
    }

    // ── Per-student stats ──────────────────────────────────────
    const rows = students.map(student => {
        const records = attMap[student._id.toString()] ?? {}
        const vals = Object.values(records)
        const present = vals.filter(v => v === 'present').length
        const absent = vals.filter(v => v === 'absent').length
        const late = vals.filter(v => v === 'late').length
        const total = vals.length
        const pct = total > 0 ? Math.round((present / total) * 100) : 0
        return { student, present, absent, late, total, pct }
    })

    // ── Summary numbers ───────────────────────────────────────
    const avgPct = rows.length > 0
        ? Math.round(rows.reduce((s, r) => s + r.pct, 0) / rows.length)
        : 0
    const below75 = rows.filter(r => r.pct < 75 && r.total > 0).length

    // ════════════════════════════════════════════════════════
    // EXCEL
    // ════════════════════════════════════════════════════════
    if (format === 'excel') {
        const wb = new ExcelJS.Workbook()
        wb.creator = 'School Suite'
        const sheet = wb.addWorksheet('Attendance Report')

        // Title row
        sheet.mergeCells('A1:I1')
        sheet.getCell('A1').value = `Attendance Report — ${month}  |  ${schoolName}`
        sheet.getCell('A1').font = { bold: true, size: 13 }
        sheet.getCell('A1').alignment = { horizontal: 'center' }

        sheet.addRow([])
        sheet.addRow([
            `Total: ${students.length}`, '',
            `Avg: ${avgPct}%`, '',
            `Below 75%: ${below75}`,
        ])
        sheet.getRow(3).font = { italic: true }
        sheet.addRow([])

        const headers = [
            'Adm No', 'Name', 'Class', 'Section',
            'Present', 'Absent', 'Late', 'Total Days', 'Attendance %',
        ]
        sheet.addRow(headers)
        styleXlsHeader(sheet, 5, headers.length)

        sheet.columns = [
            { width: 12 }, { width: 28 }, { width: 8 }, { width: 10 },
            { width: 10 }, { width: 10 }, { width: 8 }, { width: 12 }, { width: 14 },
        ]

        let ri = 6
        for (const { student, present, absent, late, total, pct } of rows) {
            const row = sheet.addRow([
                student.admissionNo ?? '—',
                student.userId?.name ?? '—',
                student.class,
                student.section ?? '—',
                present, absent, late, total,
                `${pct}%`,
            ])
            if (pct < 75 && total > 0)
                row.getCell(9).font = { color: { argb: 'FFDC2626' }, bold: true }
            else if (pct >= 90)
                row.getCell(9).font = { color: { argb: 'FF059669' }, bold: true }
            if (ri % 2 === 0)
                row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FF' } }
            ri++
        }

        sheet.autoFilter = {
            from: { row: 5, column: 1 },
            to: { row: 5, column: 9 },
        }

        const buffer = Buffer.from(await wb.xlsx.writeBuffer() as ArrayBuffer)
        
        // FIX: Cast buffer to any to bypass TypeScript mismatch with BodyInit
        return new Response(buffer as any, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="attendance-${month}.xlsx"`,
                'Content-Length': String(buffer.byteLength),
            },
        })
    }

    // ════════════════════════════════════════════════════════
    // PDF  (pdfmake — zero font filesystem issues)
    // ════════════════════════════════════════════════════════
    if (format === 'pdf') {
        const cols: ColDef[] = [
            { header: 'Adm No', width: 55 },
            { header: 'Name', width: 145 },
            { header: 'Class', width: 35, align: 'center' },
            { header: 'Section', width: 45, align: 'center' },
            { header: 'Present', width: 45, align: 'center' },
            { header: 'Absent', width: 45, align: 'center' },
            { header: 'Late', width: 35, align: 'center' },
            { header: 'Total', width: 40, align: 'center' },
            {
                header: 'Attendance %', width: 60, align: 'center',
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
            student.admissionNo ?? '—',
            student.userId?.name ?? '—',
            String(student.class),
            student.section ?? '—',
            String(present), String(absent), String(late), String(total),
            total > 0 ? `${pct}%` : '—',
        ])

        const buffer = await buildPdf({
            title: 'Attendance Report',
            schoolName,
            month,
            stats: [
                { label: 'Total Students', value: String(students.length), color: C.indigo },
                { label: 'Average', value: `${avgPct}%`, color: avgPct >= 75 ? C.green : C.red },
                { label: 'Below 75%', value: String(below75), color: C.red },
            ],
            cols,
            rows: tableRows,
        })

        // FIX: Cast buffer to any to bypass TypeScript mismatch with BodyInit
        return new Response(buffer as any, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="attendance-${month}.pdf"`,
                'Content-Length': String(buffer.byteLength),
            },
        })
    }

    return NextResponse.json(
        { error: 'Invalid format. Use excel or pdf.' },
        { status: 400 },
    )
}