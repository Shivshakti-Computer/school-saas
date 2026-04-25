import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isValidAcademicYear, getCurrentAcademicYear } from '@/lib/admissionUtils'
import * as XLSX from 'xlsx'
import { connectDB } from '@/lib/db'  // ✅ ADD
import { School } from '@/models/School'  // ✅ ADD

// ── getCurrentAcademicYear admissionUtils se import ho rahi hai ──
// Local function hatao — duplicate avoid karo

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ ADD: Institution type check
    await connectDB();
    const school = await School.findById(session.user.tenantId)
        .select('institutionType').lean() as any

    if (school?.institutionType !== 'school') {
        return NextResponse.json(
            { error: 'Template only available for schools' },
            { status: 403 }
        )
    }


    // ✅ Query param se academicYear lo — UI se aayega
    // Agar nahi aaya / invalid hai to current year use karo
    const { searchParams } = req.nextUrl
    const rawYear = searchParams.get('academicYear') || ''

    const academicYear = isValidAcademicYear(rawYear)
        ? rawYear
        : getCurrentAcademicYear()

    const wb = XLSX.utils.book_new()

    // ════════════════════════════════════════════════════
    // SHEET 1 — STUDENTS (Headers only)
    // ════════════════════════════════════════════════════

    const requiredHeaders = [
        'Name',
        'Phone',
        'Class',
        'Father Name',
        'Address',
    ]

    const optionalHeaders = [
        'Section',
        'Roll No',
        'Gender',
        'DOB',
        'Category',
        'Blood Group',
        'Nationality',
        'Religion',
        'Stream',
        'Parent Phone',
        'Parent Email',
        'Father Phone',
        'Father Occupation',
        'Mother Name',
        'Mother Phone',
        'Mother Occupation',
        'City',
        'State',
        'Pincode',
        'Emergency Contact',
        'Emergency Name',
        'Previous School',
        'Previous Class',
        'TC Number',
    ]

    const allHeaders = [...requiredHeaders, ...optionalHeaders]

    const ws = XLSX.utils.aoa_to_sheet([allHeaders])

    // ── Column widths ──
    ws['!cols'] = [
        { wch: 28 }, // Name
        { wch: 16 }, // Phone
        { wch: 10 }, // Class
        { wch: 28 }, // Father Name
        { wch: 38 }, // Address
        { wch: 12 }, // Section
        { wch: 12 }, // Roll No
        { wch: 10 }, // Gender
        { wch: 16 }, // DOB
        { wch: 12 }, // Category
        { wch: 14 }, // Blood Group
        { wch: 14 }, // Nationality
        { wch: 14 }, // Religion
        { wch: 14 }, // Stream
        { wch: 16 }, // Parent Phone
        { wch: 26 }, // Parent Email
        { wch: 16 }, // Father Phone
        { wch: 22 }, // Father Occupation
        { wch: 22 }, // Mother Name
        { wch: 16 }, // Mother Phone
        { wch: 22 }, // Mother Occupation
        { wch: 16 }, // City
        { wch: 16 }, // State
        { wch: 12 }, // Pincode
        { wch: 20 }, // Emergency Contact
        { wch: 20 }, // Emergency Name
        { wch: 28 }, // Previous School
        { wch: 16 }, // Previous Class
        { wch: 16 }, // TC Number
    ]

    ws['!freeze'] = { xSplit: 0, ySplit: 1 }
    ws['!rows'] = [{ hpt: 30 }]

    // ── Header styles ──
    const reqHeaderStyle = {
        font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
        fill: { patternType: 'solid', fgColor: { rgb: '1E3A8A' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
            top: { style: 'medium', color: { rgb: '1D4ED8' } },
            bottom: { style: 'medium', color: { rgb: '1D4ED8' } },
            left: { style: 'thin', color: { rgb: '3B82F6' } },
            right: { style: 'thin', color: { rgb: '3B82F6' } },
        },
    }

    const optHeaderStyle = {
        font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
        fill: { patternType: 'solid', fgColor: { rgb: '2563EB' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
            top: { style: 'medium', color: { rgb: '1D4ED8' } },
            bottom: { style: 'medium', color: { rgb: '1D4ED8' } },
            left: { style: 'thin', color: { rgb: '93C5FD' } },
            right: { style: 'thin', color: { rgb: '93C5FD' } },
        },
    }

    allHeaders.forEach((_, colIdx) => {
        const cellAddr = XLSX.utils.encode_cell({ r: 0, c: colIdx })
        if (!ws[cellAddr]) return
        ws[cellAddr].s = colIdx < requiredHeaders.length
            ? reqHeaderStyle
            : optHeaderStyle
    })

    // ── Pre-style 200 data rows ──
    const dataStyleOdd = {
        font: { sz: 10, name: 'Calibri', color: { rgb: '0F172A' } },
        fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
        alignment: { vertical: 'center' },
        border: {
            top: { style: 'thin', color: { rgb: 'E2E8F0' } },
            bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
            left: { style: 'thin', color: { rgb: 'E2E8F0' } },
            right: { style: 'thin', color: { rgb: 'E2E8F0' } },
        },
    }

    const dataStyleEven = {
        ...dataStyleOdd,
        fill: { patternType: 'solid', fgColor: { rgb: 'F8FAFC' } },
    }

    for (let row = 1; row <= 200; row++) {
        for (let col = 0; col < allHeaders.length; col++) {
            const cellAddr = XLSX.utils.encode_cell({ r: row, c: col })
            if (!ws[cellAddr]) ws[cellAddr] = { t: 's', v: '' }
            ws[cellAddr].s = row % 2 === 0 ? dataStyleEven : dataStyleOdd
        }
    }

    ws['!ref'] = XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: 200, c: allHeaders.length - 1 },
    })

    XLSX.utils.book_append_sheet(wb, ws, '📋 Students')

    // ════════════════════════════════════════════════════
    // SHEET 2 — INSTRUCTIONS
    // ✅ academicYear dynamic — UI se aaya hua use karo
    // ════════════════════════════════════════════════════

    const wsInfo = XLSX.utils.aoa_to_sheet([
        // ✅ Title mein selected academicYear show karo
        [`SKOLIFY — Student Bulk Import Template  |  Academic Year: ${academicYear}`],
        [''],
        ['Column', 'Required', 'Format / Rules', 'Valid Values', 'Example'],

        // Required
        ['Name', 'हाँ ✔', 'Student ka poora naam', 'Text', 'Rahul Sharma'],
        ['Phone', 'हाँ ✔', '10 digit (bina +91, spaces nahi)', 'Sirf numbers', '9876543210'],
        ['Class', 'हाँ ✔', 'Class number ya naam', '1-12, Nursery, KG...', '10'],
        ['Father Name', 'हाँ ✔', 'Pita ka poora naam', 'Text', 'Ramesh Sharma'],
        ['Address', 'हाँ ✔', 'Ghar ka pata', 'Text', 'Gandhi Nagar, Jaipur'],

        // Optional
        ['Section', 'Nahi', 'Class section (default: A)', 'A, B, C, D...', 'A'],
        ['Roll No', 'Nahi', 'Auto-generate hoga agar blank', 'Number', '25'],
        ['Gender', 'Nahi', 'Lowercase mein (default: male)', 'male / female / other', 'male'],
        ['DOB', 'Nahi', 'Date of birth — YYYY-MM-DD', 'YYYY-MM-DD', '2008-05-15'],
        ['Category', 'Nahi', 'Caste category (default: general)', 'general / obc / sc / st / other', 'general'],
        ['Blood Group', 'Nahi', 'Blood group', 'A+ A- B+ B- O+ O- AB+ AB-', 'B+'],
        ['Nationality', 'Nahi', 'Nationality (default: Indian)', 'Text', 'Indian'],
        ['Religion', 'Nahi', 'Dharm', 'Text', 'Hindu'],
        ['Stream', 'Nahi', 'Class 11-12 ke liye', 'science / commerce / arts', 'science'],
        ['Parent Phone', 'Nahi', 'Primary contact (default: Phone)', '10 digit number', '9876543200'],
        ['Parent Email', 'Nahi', 'Parent ka email', 'Valid email', 'ramesh@gmail.com'],
        ['Father Phone', 'Nahi', 'Pita ka phone', '10 digit number', '9876543210'],
        ['Father Occupation', 'Nahi', 'Pita ka kaam', 'Text', 'Farmer'],
        ['Mother Name', 'Nahi', 'Mata ka naam', 'Text', 'Sunita Sharma'],
        ['Mother Phone', 'Nahi', 'Mata ka phone', '10 digit number', '9876543211'],
        ['Mother Occupation', 'Nahi', 'Mata ka kaam', 'Text', 'Housewife'],
        ['City', 'Nahi', 'Shahar', 'Text', 'Jaipur'],
        ['State', 'Nahi', 'Rajya', 'Text', 'Rajasthan'],
        ['Pincode', 'Nahi', '6 digit PIN code', 'Sirf numbers', '302001'],
        ['Emergency Contact', 'Nahi', 'Emergency phone number', '10 digit number', '9876543299'],
        ['Emergency Name', 'Nahi', 'Emergency contact ka naam', 'Text', 'Suresh Sharma'],
        ['Previous School', 'Nahi', 'Pichli school ka naam', 'Text', 'Delhi Public School'],
        ['Previous Class', 'Nahi', 'Pichli school mein class', 'Text', '9'],
        ['TC Number', 'Nahi', 'Transfer Certificate number', 'Text/Number', 'TC/2024/123'],
        [''],

        // ✅ Auto-generated section — academicYear dynamic
        ['🤖  AUTO-GENERATED FIELDS (aapko fill nahi karne)'],
        ['Admission No', `— DPS/2025-26/0001 format mein auto-generate hoga`],
        // ✅ KEY FIX: Dynamic academicYear show karo
        ['Academic Year', `— Is template ke liye set hai: ${academicYear}`],
        ['Admission Date', '— Aaj ki date automatically set hogi'],
        ['Password', '— Parent Phone (ya Phone agar blank) set hoga'],
        [''],

        ['⚠️  IMPORTANT NOTES'],
        ['1.  "Students" sheet mein data bharen — yahan nahi'],
        ['2.  Column names EXACTLY same rakhein — capital/small matter karta hai'],
        ['3.  Phone number UNIQUE hona chahiye — duplicate skip ho jaayega'],
        ['4.  DOB format strictly: 2008-05-15  (YYYY-MM-DD)'],
        ['5.  Pehli row (header row) kabhi delete mat karein'],
        ['6.  Ek baar mein maximum 500 students import kar sakte hain'],
        ['7.  Agar koi row fail ho to baaki import hote rahenge'],
    ])

    // ── Column widths ──
    wsInfo['!cols'] = [
        { wch: 22 },
        { wch: 12 },
        { wch: 42 },
        { wch: 36 },
        { wch: 22 },
    ]

    // ── Row heights ──
    const infoRows: any[] = [{ hpt: 38 }, { hpt: 6 }, { hpt: 24 }]
    for (let i = 0; i < 29; i++) infoRows.push({ hpt: 20 })
    infoRows.push({ hpt: 6 }, { hpt: 22 })
    for (let i = 0; i < 4; i++) infoRows.push({ hpt: 20 })
    infoRows.push({ hpt: 6 }, { hpt: 22 })
    for (let i = 0; i < 7; i++) infoRows.push({ hpt: 20 })
    wsInfo['!rows'] = infoRows

    // ── Title style ──
    if (wsInfo['A1']) {
        wsInfo['A1'].s = {
            font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
            fill: { patternType: 'solid', fgColor: { rgb: '1E40AF' } },
            alignment: { horizontal: 'left', vertical: 'center' },
        }
    }

    // ── Table header (row 2) ──
    const colNames = ['Column', 'Required', 'Format / Rules', 'Valid Values', 'Example']
    colNames.forEach((_, col) => {
        const cell = XLSX.utils.encode_cell({ r: 2, c: col })
        if (!wsInfo[cell]) return
        wsInfo[cell].s = {
            font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
            fill: { patternType: 'solid', fgColor: { rgb: '334155' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
                top: { style: 'medium', color: { rgb: '1E293B' } },
                bottom: { style: 'medium', color: { rgb: '1E293B' } },
                left: { style: 'thin', color: { rgb: '475569' } },
                right: { style: 'thin', color: { rgb: '475569' } },
            },
        }
    })

    // ── Required rows style (3-7) ──
    for (let row = 3; row <= 7; row++) {
        for (let col = 0; col < 5; col++) {
            const cell = XLSX.utils.encode_cell({ r: row, c: col })
            if (!wsInfo[cell]) wsInfo[cell] = { t: 's', v: '' }
            wsInfo[cell].s = {
                font: { sz: 10, name: 'Calibri', color: { rgb: '0F172A' }, bold: col === 0 },
                fill: { patternType: 'solid', fgColor: { rgb: row % 2 === 0 ? 'DBEAFE' : 'EFF6FF' } },
                alignment: { horizontal: col === 1 ? 'center' : 'left', vertical: 'center' },
                border: {
                    top: { style: 'thin', color: { rgb: 'BFDBFE' } },
                    bottom: { style: 'thin', color: { rgb: 'BFDBFE' } },
                    left: { style: 'thin', color: { rgb: 'BFDBFE' } },
                    right: { style: 'thin', color: { rgb: 'BFDBFE' } },
                },
            }
        }
    }

    // ── Optional rows style (8-31) ──
    for (let row = 8; row <= 31; row++) {
        for (let col = 0; col < 5; col++) {
            const cell = XLSX.utils.encode_cell({ r: row, c: col })
            if (!wsInfo[cell]) wsInfo[cell] = { t: 's', v: '' }
            wsInfo[cell].s = {
                font: { sz: 10, name: 'Calibri', color: { rgb: '475569' }, bold: col === 0 },
                fill: { patternType: 'solid', fgColor: { rgb: row % 2 === 0 ? 'F8FAFC' : 'FFFFFF' } },
                alignment: { horizontal: col === 1 ? 'center' : 'left', vertical: 'center' },
                border: {
                    top: { style: 'thin', color: { rgb: 'E2E8F0' } },
                    bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
                    left: { style: 'thin', color: { rgb: 'E2E8F0' } },
                    right: { style: 'thin', color: { rgb: 'E2E8F0' } },
                },
            }
        }
    }

    // ── Auto-generated section header (row 33) ──
    const autoRow = 33
    const autoHeaderCell = XLSX.utils.encode_cell({ r: autoRow, c: 0 })
    if (wsInfo[autoHeaderCell]) {
        wsInfo[autoHeaderCell].s = {
            font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
            fill: { patternType: 'solid', fgColor: { rgb: '059669' } },
            alignment: { vertical: 'center' },
        }
    }

    for (let row = 34; row <= 37; row++) {
        for (let col = 0; col < 2; col++) {
            const cell = XLSX.utils.encode_cell({ r: row, c: col })
            if (!wsInfo[cell]) wsInfo[cell] = { t: 's', v: '' }
            wsInfo[cell].s = {
                font: { sz: 10, name: 'Calibri', color: { rgb: '065F46' } },
                fill: { patternType: 'solid', fgColor: { rgb: row % 2 === 0 ? 'D1FAE5' : 'ECFDF5' } },
                alignment: { vertical: 'center' },
            }
        }
    }

    // ── Notes section header (row 39) ──
    const notesRow = 39
    const notesHeaderCell = XLSX.utils.encode_cell({ r: notesRow, c: 0 })
    if (wsInfo[notesHeaderCell]) {
        wsInfo[notesHeaderCell].s = {
            font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
            fill: { patternType: 'solid', fgColor: { rgb: 'B45309' } },
            alignment: { vertical: 'center' },
        }
    }

    for (let row = 40; row <= 46; row++) {
        const cell = XLSX.utils.encode_cell({ r: row, c: 0 })
        if (!wsInfo[cell]) wsInfo[cell] = { t: 's', v: '' }
        wsInfo[cell].s = {
            font: { sz: 10, name: 'Calibri', color: { rgb: '292524' } },
            fill: { patternType: 'solid', fgColor: { rgb: row % 2 === 0 ? 'FFFBEB' : 'FEF3C7' } },
            alignment: { vertical: 'center' },
        }
    }

    // ── Merges ──
    wsInfo['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
        { s: { r: 33, c: 0 }, e: { r: 33, c: 4 } },
        { s: { r: 34, c: 1 }, e: { r: 34, c: 4 } },
        { s: { r: 35, c: 1 }, e: { r: 35, c: 4 } },
        { s: { r: 36, c: 1 }, e: { r: 36, c: 4 } },
        { s: { r: 37, c: 1 }, e: { r: 37, c: 4 } },
        { s: { r: 39, c: 0 }, e: { r: 39, c: 4 } },
        { s: { r: 40, c: 0 }, e: { r: 40, c: 4 } },
        { s: { r: 41, c: 0 }, e: { r: 41, c: 4 } },
        { s: { r: 42, c: 0 }, e: { r: 42, c: 4 } },
        { s: { r: 43, c: 0 }, e: { r: 43, c: 4 } },
        { s: { r: 44, c: 0 }, e: { r: 44, c: 4 } },
        { s: { r: 45, c: 0 }, e: { r: 45, c: 4 } },
        { s: { r: 46, c: 0 }, e: { r: 46, c: 4 } },
    ]

    XLSX.utils.book_append_sheet(wb, wsInfo, '📖 Instructions')

    // ════════════════════════════════════════════════════
    // GENERATE BUFFER
    // ════════════════════════════════════════════════════

    const buffer = XLSX.write(wb, {
        type: 'buffer',
        bookType: 'xlsx',
        cellStyles: true,
    })

    // ✅ Filename mein bhi selected academicYear
    const filename = `student-import-template-${academicYear}.xlsx`

    return new NextResponse(buffer, {
        status: 200,
        headers: {
            'Content-Type':
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-store',
        },
    })
}