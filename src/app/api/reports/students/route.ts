// FILE: src/app/api/reports/students/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import ExcelJS from 'exceljs'
import { buildPdf, C, type ColDef } from '@/lib/pdf-builder'

export const dynamic = 'force-dynamic'

function styleHeaderRow(sheet: ExcelJS.Worksheet, rowNum: number, cols: number) {
    const row = sheet.getRow(rowNum)
    row.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }
    row.alignment = { vertical: 'middle', horizontal: 'center' }
    row.height = 22
    for (let c = 1; c <= cols; c++) {
        sheet.getCell(rowNum, c).border = {
            top: { style: 'thin' }, bottom: { style: 'thin' },
            left: { style: 'thin' }, right: { style: 'thin' },
        }
    }
}

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const { searchParams } = req.nextUrl
    const format = searchParams.get('format') ?? 'excel'
    const cls = searchParams.get('class')

    const { Student } = await import('@/models/Student')

    const query: any = { tenantId: session.user.tenantId, status: 'active' }
    if (cls) query.class = cls

    const students = await Student.find(query)
        .populate('userId', 'name email phone')
        .sort({ class: 1, section: 1, admissionNo: 1 })
        .lean() as any[]

    // ── EXCEL ──────────────────────────────────────────────
    if (format === 'excel') {
        const wb = new ExcelJS.Workbook()
        wb.creator = 'Shivshakti School Suite'
        const sheet = wb.addWorksheet('Student Directory')

        sheet.mergeCells('A1:L1')
        sheet.getCell('A1').value = `Student Directory  |  ${session.user.schoolName ?? ''}  |  Total: ${students.length}`
        sheet.getCell('A1').font = { bold: true, size: 13 }
        sheet.getCell('A1').alignment = { horizontal: 'center' }
        sheet.addRow([])

        const headers = [
            'Adm No', 'Name', 'Class', 'Section', 'Roll No',
            'Gender', 'DOB', 'Phone', 'Email',
            "Father's Name", "Mother's Name", 'Address',
        ]
        sheet.addRow(headers)
        styleHeaderRow(sheet, 3, headers.length)

        sheet.columns = [
            { width: 12 }, { width: 28 }, { width: 8 }, { width: 10 },
            { width: 9 }, { width: 10 }, { width: 13 }, { width: 14 },
            { width: 26 }, { width: 22 }, { width: 22 }, { width: 36 },
        ]

        let ri = 4
        for (const s of students) {
            const row = sheet.addRow([
                s.admissionNo,
                s.userId?.name ?? s.name ?? '—',
                s.class,
                s.section ?? '—',
                s.rollNo ?? '—',
                s.gender ?? '—',
                s.dob ? new Date(s.dob).toLocaleDateString('en-IN') : '—',
                s.userId?.phone ?? s.phone ?? '—',
                s.userId?.email ?? s.email ?? '—',
                s.fatherName ?? '—',
                s.motherName ?? '—',
                s.address ?? '—',
            ])

            if (ri % 2 === 0) {
                row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F3FF' } }
            }
            ri++
        }

        sheet.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: headers.length } }

        const buffer = Buffer.from(await wb.xlsx.writeBuffer())
        return new Response(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="students${cls ? `-class${cls}` : ''}.xlsx"`,
            },
        })
    }

    // ── PDF ──────────────────────────────────────────────
    if (format === 'pdf') {
        const cols: ColDef[] = [
            { header: 'Adm No', width: 60 },
            { header: 'Name', width: 140 },
            { header: 'Class', width: 40 },
            { header: 'Sec', width: 40 },
            { header: 'Roll', width: 40 },
            { header: 'Phone', width: 80 },
            { header: 'Father', width: 120 },
        ]

        const tableRows = students.map(s => [
            s.admissionNo,
            s.userId?.name ?? '—',
            String(s.class),
            s.section ?? '—',
            s.rollNo ?? '—',
            s.userId?.phone ?? '—',
            s.fatherName ?? '—',
        ])

        const buffer = await buildPdf({
            title: 'Student Directory',
            schoolName: session.user.schoolName ?? '',
            month: 'All Students',
            stats: [
                { label: 'Total Students', value: String(students.length), color: C.indigo },
            ],
            cols,
            rows: tableRows,
        })

        return new Response(buffer as any, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="students.pdf"`,
            },
        })
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
}