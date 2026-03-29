// FILE: src/app/api/reports/fees/route.ts

import { buildPdf, C, type ColDef } from '@/lib/pdf-builder'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import ExcelJS from 'exceljs'
export const dynamic = 'force-dynamic'

function styleHeaderRow(sheet: ExcelJS.Worksheet, rowNum: number, cols: number, color = 'FF059669') {
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

function inr(n: number) {
    return `Rs. ${n.toLocaleString('en-IN')}`
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

    const { Fee } = await import('@/models/Fee')

    // Query using paidAt for the month (paid fees) + dueDate for pending
    const feeQuery: any = {
        tenantId: session.user.tenantId,
    }

    // If month filter: get fees whose dueDate falls in month OR paidAt falls in month
    feeQuery.$or = [
        { dueDate: { $gte: startDate, $lt: endDate } },
        { paidAt: { $gte: startDate, $lt: endDate } },
    ]

    const fees = await Fee.find(feeQuery)
        .populate({
            path: 'studentId',
            populate: { path: 'userId', select: 'name' },
            select: 'admissionNo class section userId',
        })
        .populate('structureId', 'title feeType')
        .lean() as any[]

    // Filter by class if provided
    const filtered = cls
        ? fees.filter(f => f.studentId?.class === cls)
        : fees

    // Aggregate per-student
    const studentMap: Record<string, {
        admissionNo: string
        name: string
        class: string
        section: string
        totalDue: number
        totalPaid: number
        totalDiscount: number
        totalLateFine: number
        pending: number
        waived: number
        status: string
        paymentMode: string
        receiptNumber: string
        paidAt: string
    }> = {}

    for (const fee of filtered) {
        const sid = fee.studentId?._id?.toString() ?? 'unknown'
        if (!studentMap[sid]) {
            studentMap[sid] = {
                admissionNo: fee.studentId?.admissionNo ?? '—',
                name: fee.studentId?.userId?.name ?? '—',
                class: fee.studentId?.class ?? '—',
                section: fee.studentId?.section ?? '—',
                totalDue: 0,
                totalPaid: 0,
                totalDiscount: 0,
                totalLateFine: 0,
                pending: 0,
                waived: 0,
                status: fee.status,
                paymentMode: fee.paymentMode ?? '—',
                receiptNumber: fee.receiptNumber ?? '—',
                paidAt: fee.paidAt ? new Date(fee.paidAt).toLocaleDateString('en-IN') : '—',
            }
        }

        studentMap[sid].totalDue += fee.finalAmount ?? 0
        studentMap[sid].totalPaid += fee.paidAmount ?? 0
        studentMap[sid].totalDiscount += fee.discount ?? 0
        studentMap[sid].totalLateFine += fee.lateFine ?? 0

        if (fee.status === 'pending' || fee.status === 'partial') {
            studentMap[sid].pending += (fee.finalAmount ?? 0) - (fee.paidAmount ?? 0)
        }
        if (fee.status === 'waived') {
            studentMap[sid].waived += fee.finalAmount ?? 0
        }
        // Keep latest paidAt
        if (fee.paidAt) {
            studentMap[sid].paidAt = new Date(fee.paidAt).toLocaleDateString('en-IN')
            studentMap[sid].paymentMode = fee.paymentMode ?? '—'
            studentMap[sid].receiptNumber = fee.receiptNumber ?? '—'
        }
    }

    const rows = Object.values(studentMap)

    // Summary totals
    const totalDue = rows.reduce((s, r) => s + r.totalDue, 0)
    const totalCollected = rows.reduce((s, r) => s + r.totalPaid, 0)
    const totalPending = rows.reduce((s, r) => s + r.pending, 0)
    const totalLateFine = rows.reduce((s, r) => s + r.totalLateFine, 0)
    const totalDiscount = rows.reduce((s, r) => s + r.totalDiscount, 0)

    // ── EXCEL ──────────────────────────────────────────────
    if (format === 'excel') {
        const wb = new ExcelJS.Workbook()
        wb.creator = 'Shivshakti School Suite'
        const sheet = wb.addWorksheet('Fee Collection')

        // Title
        sheet.mergeCells('A1:J1')
        sheet.getCell('A1').value = `Fee Collection Report — ${month}  |  ${session.user.schoolName ?? ''}`
        sheet.getCell('A1').font = { bold: true, size: 13 }
        sheet.getCell('A1').alignment = { horizontal: 'center' }
        sheet.addRow([])

        // Summary block
        sheet.addRow(['Total Due', inr(totalDue), '', 'Collected', inr(totalCollected), '', 'Pending', inr(totalPending), '', `Discount: ${inr(totalDiscount)}`])
        sheet.getRow(3).font = { bold: true }
        sheet.getRow(3).getCell(2).font = { bold: true, color: { argb: 'FF1E293B' } }
        sheet.getRow(3).getCell(5).font = { bold: true, color: { argb: 'FF059669' } }
        sheet.getRow(3).getCell(8).font = { bold: true, color: { argb: 'FFDC2626' } }
        sheet.addRow([])

        // Header
        const headers = ['Adm No', 'Name', 'Class', 'Sec', 'Total Due', 'Paid', 'Pending', 'Late Fine', 'Discount', 'Mode', 'Receipt No', 'Paid On']
        sheet.addRow(headers)
        styleHeaderRow(sheet, 5, headers.length)

        sheet.columns = [
            { width: 12 }, { width: 28 }, { width: 8 }, { width: 6 },
            { width: 13 }, { width: 13 }, { width: 13 }, { width: 11 },
            { width: 11 }, { width: 10 }, { width: 14 }, { width: 14 },
        ]

        let ri = 6
        for (const r of rows) {
            const row = sheet.addRow([
                r.admissionNo, r.name, r.class, r.section,
                r.totalDue, r.totalPaid, r.pending,
                r.totalLateFine, r.totalDiscount,
                r.paymentMode, r.receiptNumber, r.paidAt,
            ])

            // Format currency cells
            for (const col of [5, 6, 7, 8, 9]) {
                row.getCell(col).numFmt = '₹#,##0'
            }
            // Highlight pending
            if (r.pending > 0) {
                row.getCell(7).font = { color: { argb: 'FFDC2626' }, bold: true }
            }
            // Zebra
            if (ri % 2 === 0) {
                row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } }
            }
            ri++
        }

        // Total row
        const totalRow = sheet.addRow(['', 'TOTAL', '', '',
            totalDue, totalCollected, totalPending, totalLateFine, totalDiscount, '', '', ''])
        totalRow.font = { bold: true }
        totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } }
        for (const col of [5, 6, 7, 8, 9]) {
            totalRow.getCell(col).numFmt = '₹#,##0'
        }

        const buffer = Buffer.from(await wb.xlsx.writeBuffer())
        return new Response(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="fees-${month}.xlsx"`,
            },
        })
    }

    if (format === 'pdf') {
        const cols: ColDef[] = [
            { header: 'Adm No', width: 60 },
            { header: 'Name', width: 140 },
            { header: 'Class', width: 40, align: 'center' },
            { header: 'Sec', width: 40, align: 'center' },
            { header: 'Due', width: 60, align: 'right' },
            { header: 'Paid', width: 60, align: 'right', color: () => C.green },
            {
                header: 'Pending', width: 60, align: 'right',
                color: (v) => parseInt(v) > 0 ? C.red : C.slate800,
            },
            { header: 'Late', width: 50, align: 'right' },
            { header: 'Mode', width: 60 },
            { header: 'Paid On', width: 70 },
        ]

        const tableRows = rows.map(r => [
            r.admissionNo,
            r.name,
            String(r.class),
            r.section,
            String(r.totalDue),
            String(r.totalPaid),
            String(r.pending),
            String(r.totalLateFine),
            r.paymentMode,
            r.paidAt,
        ])

        const buffer = await buildPdf({
            title: 'Fee Collection Report',
            schoolName: session.user.schoolName ?? '',
            month,
            stats: [
                { label: 'Total Due', value: inr(totalDue), color: C.indigo },
                { label: 'Collected', value: inr(totalCollected), color: C.green },
                { label: 'Pending', value: inr(totalPending), color: totalPending > 0 ? C.red : C.green },
                { label: 'Discount', value: inr(totalDiscount), color: C.indigo },
            ],
            cols,
            rows: tableRows,
        })

        return new Response(buffer as any, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="fees-${month}.pdf"`,
                'Content-Length': String(buffer.byteLength),
            },
        })
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
}