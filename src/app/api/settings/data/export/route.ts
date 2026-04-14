// FILE: src/app/api/settings/data/export/route.ts
// ═══════════════════════════════════════════════════════════
// POST /api/settings/data/export
// Export school data as JSON or CSV
// Supported: students, staff, fees, attendance, results, notices
//
// Large datasets ke liye streaming approach use kiya
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuardWithBody } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import type { ExportRequestBody } from '@/types/settings'

// ── CSV Helper ──
function toCSV(data: Record<string, any>[]): string {
  if (!data.length) return ''

  const headers = Object.keys(data[0])
  const escape  = (val: any): string => {
    if (val === null || val === undefined) return ''
    const str = String(val).replace(/"/g, '""')
    return str.includes(',') || str.includes('\n') || str.includes('"')
      ? `"${str}"`
      : str
  }

  const rows = data.map((row) =>
    headers.map((h) => escape(row[h])).join(',')
  )

  return [headers.join(','), ...rows].join('\n')
}

// ── Flatten nested object for CSV ──
function flattenObject(
  obj: Record<string, any>,
  prefix = ''
): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, val] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}_${key}` : key
    if (
      val !== null &&
      typeof val === 'object' &&
      !Array.isArray(val) &&
      !(val instanceof Date)
    ) {
      Object.assign(result, flattenObject(val, newKey))
    } else if (Array.isArray(val)) {
      result[newKey] = val.join('; ')
    } else {
      result[newKey] = val
    }
  }
  return result
}

export async function POST(req: NextRequest) {
  const guard = await apiGuardWithBody<ExportRequestBody>(req, {
    allowedRoles: ['admin'],
    rateLimit: 'mutation',
    auditAction: 'EXPORT',
    auditResource: 'School',
  })
  if (guard instanceof NextResponse) return guard

  const { session, body } = guard
  const tenantId = session.user.tenantId

  const { dataType, format = 'json', filters = {} } = body

  const ALLOWED_TYPES = [
    'students', 'staff', 'fees',
    'attendance', 'results', 'notices',
  ]

  if (!ALLOWED_TYPES.includes(dataType)) {
    return NextResponse.json(
      { error: `Invalid data type. Allowed: ${ALLOWED_TYPES.join(', ')}` },
      { status: 400 }
    )
  }

  if (!['json', 'csv'].includes(format)) {
    return NextResponse.json(
      { error: 'Invalid format. Use json or csv' },
      { status: 400 }
    )
  }

  try {
    await connectDB()

    let data: Record<string, any>[] = []
    let filename = `${dataType}_export_${Date.now()}`

    // ── Fetch Data based on type ──
    switch (dataType) {

      case 'students': {
        const { Student } = await import('@/models/Student')
        const query: Record<string, any> = { tenantId }
        if (filters.academicYear) query.academicYear = filters.academicYear
        if (filters.class)        query.class        = filters.class
        if (filters.section)      query.section      = filters.section
        if (filters.status)       query.status       = filters.status

        const students = await Student.find(query)
          .select(
            'admissionNo rollNo academicYear class section stream ' +
            'dateOfBirth gender category nationality ' +
            'fatherName fatherPhone motherName parentPhone parentEmail ' +
            'address city state pincode status admissionDate'
          )
          .populate('userId', 'name email phone')
          .lean() as any[]

        data = students.map((s) => ({
          admission_no:   s.admissionNo,
          roll_no:        s.rollNo,
          name:           (s.userId as any)?.name || '',
          email:          (s.userId as any)?.email || '',
          phone:          (s.userId as any)?.phone || '',
          academic_year:  s.academicYear,
          class:          s.class,
          section:        s.section,
          stream:         s.stream || '',
          gender:         s.gender,
          date_of_birth:  s.dateOfBirth
            ? new Date(s.dateOfBirth).toLocaleDateString('en-IN')
            : '',
          category:       s.category,
          father_name:    s.fatherName,
          father_phone:   s.fatherPhone || '',
          mother_name:    s.motherName  || '',
          parent_phone:   s.parentPhone,
          parent_email:   s.parentEmail || '',
          address:        s.address,
          city:           s.city    || '',
          state:          s.state   || '',
          pincode:        s.pincode || '',
          status:         s.status,
          admission_date: s.admissionDate
            ? new Date(s.admissionDate).toLocaleDateString('en-IN')
            : '',
        }))
        filename = `students_${filters.academicYear || 'all'}_${Date.now()}`
        break
      }

      case 'staff': {
        const { Staff } = await import('@/models/Staff')
        const query: Record<string, any> = { tenantId }
        if (filters.status) query.status = filters.status

        const staff = await Staff.find(query)
          .select(
            'employeeId fullName gender designation department ' +
            'staffCategory qualification joiningDate phone email ' +
            'basicSalary grossSalary netSalary status'
          )
          .lean() as any[]

        data = staff.map((s) => ({
          employee_id:    s.employeeId,
          name:           s.fullName,
          gender:         s.gender,
          designation:    s.designation,
          department:     s.department,
          category:       s.staffCategory,
          qualification:  s.qualification,
          joining_date:   s.joiningDate
            ? new Date(s.joiningDate).toLocaleDateString('en-IN')
            : '',
          phone:          s.phone,
          email:          s.email || '',
          basic_salary:   s.basicSalary,
          gross_salary:   s.grossSalary,
          net_salary:     s.netSalary,
          status:         s.status,
        }))
        filename = `staff_${Date.now()}`
        break
      }

      case 'fees': {
        const { Fee } = await import('@/models/Fee')
        const query: Record<string, any> = { tenantId }
        if (filters.academicYear) query.academicYear = filters.academicYear
        if (filters.status)       query.status       = filters.status
        if (filters.dateFrom || filters.dateTo) {
          query.createdAt = {}
          if (filters.dateFrom) {
            query.createdAt.$gte = new Date(filters.dateFrom)
          }
          if (filters.dateTo) {
            query.createdAt.$lte = new Date(filters.dateTo)
          }
        }

        const fees = await Fee.find(query)
          .select(
            'receiptNo studentId amount paidAmount dueAmount ' +
            'status dueDate paidAt academicYear paymentMethod'
          )
          .populate('studentId', 'admissionNo class section')
          .populate({
            path:   'studentId',
            populate: { path: 'userId', select: 'name' },
          })
          .lean() as any[]

        data = fees.map((f) => ({
          receipt_no:     f.receiptNo || '',
          student_name:   (f.studentId as any)?.userId?.name || '',
          admission_no:   (f.studentId as any)?.admissionNo  || '',
          class:          (f.studentId as any)?.class         || '',
          section:        (f.studentId as any)?.section       || '',
          academic_year:  f.academicYear,
          total_amount:   f.amount,
          paid_amount:    f.paidAmount  || 0,
          due_amount:     f.dueAmount   || 0,
          status:         f.status,
          due_date:       f.dueDate
            ? new Date(f.dueDate).toLocaleDateString('en-IN')
            : '',
          paid_date:      f.paidAt
            ? new Date(f.paidAt).toLocaleDateString('en-IN')
            : '',
          payment_method: f.paymentMethod || '',
        }))
        filename = `fees_${filters.academicYear || 'all'}_${Date.now()}`
        break
      }

      case 'attendance': {
        const { Attendance } = await import('@/models/Attendance')
        const query: Record<string, any> = { tenantId }
        if (filters.class)   query.class   = filters.class
        if (filters.section) query.section = filters.section
        if (filters.dateFrom || filters.dateTo) {
          query.date = {}
          if (filters.dateFrom) query.date.$gte = new Date(filters.dateFrom)
          if (filters.dateTo)   query.date.$lte = new Date(filters.dateTo)
        }

        const attendance = await Attendance.find(query)
          .select('date class section academicYear records')
          .lean() as any[]

        // Flatten attendance records
        data = []
        for (const att of attendance) {
          for (const record of att.records || []) {
            data.push({
              date:          new Date(att.date).toLocaleDateString('en-IN'),
              class:         att.class,
              section:       att.section,
              academic_year: att.academicYear,
              student_id:    record.studentId?.toString() || '',
              status:        record.status,
              remark:        record.remark || '',
            })
          }
        }
        filename = `attendance_${Date.now()}`
        break
      }

      case 'notices': {
        const { Notice } = await import('@/models/Notice')
        const query: Record<string, any> = { tenantId }
        if (filters.dateFrom || filters.dateTo) {
          query.createdAt = {}
          if (filters.dateFrom) {
            query.createdAt.$gte = new Date(filters.dateFrom)
          }
          if (filters.dateTo) {
            query.createdAt.$lte = new Date(filters.dateTo)
          }
        }

        const notices = await Notice.find(query)
          .select(
            'title content priority targetAudience status ' +
            'publishedAt expiresAt createdBy'
          )
          .lean() as any[]

        data = notices.map((n) => ({
          title:           n.title,
          priority:        n.priority,
          target_audience: Array.isArray(n.targetAudience)
            ? n.targetAudience.join('; ')
            : n.targetAudience,
          status:          n.status,
          published_at:    n.publishedAt
            ? new Date(n.publishedAt).toLocaleDateString('en-IN')
            : '',
          expires_at:      n.expiresAt
            ? new Date(n.expiresAt).toLocaleDateString('en-IN')
            : '',
        }))
        filename = `notices_${Date.now()}`
        break
      }

      default:
        return NextResponse.json(
          { error: 'Data type not implemented yet' },
          { status: 400 }
        )
    }

    // ── Generate Response ──
    if (format === 'csv') {
      const csvData = toCSV(data)
      return new NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type':        'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
          'X-Record-Count':      String(data.length),
        },
      })
    }

    // JSON format
    return new NextResponse(
      JSON.stringify({ data, count: data.length, exportedAt: new Date().toISOString() }),
      {
        status: 200,
        headers: {
          'Content-Type':        'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`,
          'X-Record-Count':      String(data.length),
        },
      }
    )

  } catch (error: any) {
    console.error('[POST /api/settings/data/export]', error)
    return NextResponse.json(
      { error: 'Export failed. Please try again.' },
      { status: 500 }
    )
  }
}