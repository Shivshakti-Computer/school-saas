// FILE: src/app/api/reports/results/route.ts
import { buildPdf, C, type ColDef } from '@/lib/pdf-builder'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import ExcelJS from 'exceljs'
import { calculateGrade } from '@/models/Exam'

export const dynamic = 'force-dynamic'
function styleHeaderRow(sheet: ExcelJS.Worksheet, rowNum: number, cols: number, color = 'FF7C3AED') {
    const row = sheet.getRow(rowNum)
    row.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } }
    row.alignment = { vertical: 'middle', horizontal: 'center' }
    row.height = 22
    for (let c = 1; c <= cols; c++) {
        sheet.getCell(rowNum, c).border = {
            top: { style: 'thin' }, bottom: { style: 'thin' },
            left: { style: 'thin' }, right: { style: 'thin' },
        }
    }
}

// Grade badge color for Excel
function gradeColor(grade: string): string {
    const map: Record<string, string> = {
        'A+': 'FF065F46', 'A': 'FF047857', 'B+': 'FF1D4ED8',
        'B': 'FF2563EB', 'C+': 'FF92400E', 'C': 'FFB45309',
        'D': 'FFEA580C', 'F': 'FFDC2626',
    }
    return map[grade] ?? 'FF1E293B'
}

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const { searchParams } = req.nextUrl
    const month = searchParams.get('month') ?? new Date().toISOString().slice(0, 7)
    const format = searchParams.get('format') ?? 'excel'
    const cls = searchParams.get('class')

    const [year, mon] = month.split('-')
    const startDate = new Date(`${year}-${mon}-01T00:00:00.000Z`)
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + 1)

    const { Exam, Result } = await import('@/models/Exam')

    // Fetch exams within the month (by createdAt) or completed in the month
    const examQuery: any = {
        tenantId: session.user.tenantId,
        status: 'completed',
        resultPublished: true,
        createdAt: { $gte: startDate, $lt: endDate },
    }
    if (cls) examQuery.class = cls

    const exams = await Exam.find(examQuery).lean() as any[]

    if (exams.length === 0) {
        // Fallback: get latest published exams for this class regardless of month
        const fallbackQuery: any = {
            tenantId: session.user.tenantId,
            status: 'completed',
            resultPublished: true,
        }
        if (cls) fallbackQuery.class = cls
        const fallback = await Exam.find(fallbackQuery)
            .sort({ createdAt: -1 })
            .limit(5)
            .lean() as any[]
        exams.push(...fallback)
    }

    if (exams.length === 0) {
        return NextResponse.json({ error: 'No published results found for this period' }, { status: 404 })
    }

    const examIds = exams.map(e => e._id)

    // Fetch all results for these exams
    const results = await Result.find({
        tenantId: session.user.tenantId,
        examId: { $in: examIds },
    })
        .populate({
            path: 'studentId',
            populate: { path: 'userId', select: 'name' },
            select: 'admissionNo class section userId rollNo',
        })
        .populate('examId', 'name class section academicYear')
        .lean() as any[]

    // Build exam lookup
    const examMap: Record<string, any> = {}
    for (const e of exams) examMap[e._id.toString()] = e

    // ── EXCEL — one sheet per exam ─────────────────────────
    if (format === 'excel') {
        const wb = new ExcelJS.Workbook()
        wb.creator = 'Shivshakti School Suite'

        // Group results by examId
        const byExam: Record<string, any[]> = {}
        for (const r of results) {
            const eid = r.examId?._id?.toString() ?? r.examId?.toString()
            if (!byExam[eid]) byExam[eid] = []
            byExam[eid].push(r)
        }

        for (const exam of exams) {
            const eid = exam._id.toString()
            const examResults = byExam[eid] ?? []
            const sheetName = `${exam.name}`.slice(0, 31) // Excel sheet name max 31 chars

            const sheet = wb.addWorksheet(sheetName)

            // Title
            const subjectNames = exam.subjects?.map((s: any) => s.name) ?? []
            const totalCols = 6 + subjectNames.length // Adm, Name, Class, Sec, Roll + subjects + Total, %, Grade, Rank, Pass
            const endCol = String.fromCharCode(64 + Math.min(totalCols, 26))

            sheet.mergeCells(`A1:${endCol}1`)
            sheet.getCell('A1').value = `${exam.name}  |  Class ${exam.class}${exam.section ? '-' + exam.section : ''}  |  ${session.user.schoolName ?? ''}`
            sheet.getCell('A1').font = { bold: true, size: 13 }
            sheet.getCell('A1').alignment = { horizontal: 'center' }
            sheet.addRow([])

            // Exam meta
            sheet.addRow([`Academic Year: ${exam.academicYear}`, '', `Total Students: ${examResults.length}`, '', `Published Results`])
            sheet.getRow(3).font = { italic: true, color: { argb: 'FF64748B' } }
            sheet.addRow([])

            // Header — dynamic columns per exam
            const headers = ['Adm No', 'Name', 'Class', 'Sec', 'Roll', ...subjectNames, 'Total', '%', 'Grade', 'Rank', 'Pass?']
            sheet.addRow(headers)
            styleHeaderRow(sheet, 5, headers.length)

            // Column widths
            const colWidths = [12, 28, 8, 6, 7, ...subjectNames.map(() => 12), 10, 8, 8, 8, 8]
            sheet.columns = colWidths.map(width => ({ width }))

            // Sort by rank
            const sorted = [...examResults].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))

            let ri = 6
            for (const r of sorted) {
                // Build subject marks in exam.subjects order
                const subjectMarks = subjectNames.map((subj: string) => {
                    const mark = r.marks?.find((m: any) => m.subject === subj)
                    if (!mark) return '—'
                    if (mark.isAbsent) return 'AB'
                    return `${mark.marksObtained}/${mark.maxMarks}`
                })

                const row = sheet.addRow([
                    r.studentId?.admissionNo ?? '—',
                    r.studentId?.userId?.name ?? '—',
                    r.studentId?.class ?? exam.class,
                    r.studentId?.section ?? exam.section ?? '—',
                    r.studentId?.rollNo ?? '—',
                    ...subjectMarks,
                    `${r.totalObtained}/${r.totalMarks}`,
                    `${r.percentage}%`,
                    r.grade,
                    r.rank ?? '—',
                    r.isPassed ? 'PASS' : 'FAIL',
                ])

                // Grade color
                const gradeCol = 6 + subjectNames.length + 2
                row.getCell(gradeCol).font = { bold: true, color: { argb: gradeColor(r.grade) } }

                // Pass/Fail color
                const passCol = gradeCol + 2
                row.getCell(passCol).font = {
                    bold: true,
                    color: { argb: r.isPassed ? 'FF059669' : 'FFDC2626' },
                }

                // Zebra
                if (ri % 2 === 0) {
                    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F3FF' } }
                }
                ri++
            }

            // Class stats footer
            const passCount = examResults.filter(r => r.isPassed).length
            const avgPct = examResults.length > 0
                ? Math.round(examResults.reduce((s, r) => s + r.percentage, 0) / examResults.length)
                : 0
            const topResult = sorted[0]

            sheet.addRow([])
            const statsRow = sheet.addRow([
                `Pass: ${passCount}/${examResults.length}`,
                `Fail: ${examResults.length - passCount}`,
                `Class Avg: ${avgPct}%`,
                `Topper: ${topResult?.studentId?.userId?.name ?? '—'}`,
                `(${topResult?.percentage ?? 0}%)`,
            ])
            statsRow.font = { italic: true, bold: true }
            statsRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDE9FE' } }
        }

        const buffer = Buffer.from(await wb.xlsx.writeBuffer())
        return new Response(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="results-${month}${cls ? '-class' + cls : ''}.xlsx"`,
            },
        })
    }

    if (format === 'pdf') {
        const rowsFlat = results.map(r => [
            r.studentId?.admissionNo ?? '—',
            r.studentId?.userId?.name ?? '—',
            `${r.studentId?.class}-${r.studentId?.section ?? ''}`,
            `${r.totalObtained}/${r.totalMarks}`,
            `${r.percentage}%`,
            r.grade,
            r.rank ?? '—',
            r.isPassed ? 'PASS' : 'FAIL',
        ])

        const cols: ColDef[] = [
            { header: 'Adm No', width: 60 },
            { header: 'Name', width: 140 },
            { header: 'Class', width: 60 },
            { header: 'Marks', width: 70, align: 'center' },
            { header: '%', width: 50, align: 'center' },
            { header: 'Grade', width: 50, align: 'center' },
            { header: 'Rank', width: 50, align: 'center' },
            {
                header: 'Result', width: 60, align: 'center',
                color: v => v === 'PASS' ? C.green : C.red,
            },
        ]

        const avgPct = results.length > 0
            ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length)
            : 0

        const buffer = await buildPdf({
            title: 'Result Report',
            schoolName: session.user.schoolName ?? '',
            month,
            stats: [
                { label: 'Class Avg', value: `${avgPct}%`, color: avgPct >= 75 ? C.green : C.red },
                { label: 'Students', value: String(results.length), color: C.indigo },
                { label: 'Failed', value: String(results.filter(r => !r.isPassed).length), color: C.red },
            ],
            cols,
            rows: rowsFlat,
        })

        return new Response(buffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="results-${month}.pdf"`,
            },
        })
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
}