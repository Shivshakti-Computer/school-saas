// FILE: src/app/api/students/bulk-import/route.ts

import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Student, User } from '@/models'
import { School } from '@/models/School'
import { checkCanAddStudent } from '@/lib/limitGuard'
import {
  getCurrentAcademicYear,
  getSchoolCode,
  generateRollNo,
  isValidAcademicYear,
} from '@/lib/admissionUtils'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const VALID_STREAMS = ['science', 'commerce', 'arts', 'vocational']
const VALID_GENDERS = ['male', 'female', 'other']
const VALID_CATEGORIES = ['general', 'obc', 'sc', 'st', 'other']
const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

// ─────────────────────────────────────────────
// Normalizers — case insensitive fix
// ─────────────────────────────────────────────

function normalizeStream(raw: string): string {
  if (!raw) return ''
  const v = raw.toLowerCase().trim()
  return VALID_STREAMS.includes(v) ? v : ''
}

function normalizeGender(raw: string): string {
  if (!raw) return 'male'
  const v = raw.toLowerCase().trim()
  return VALID_GENDERS.includes(v) ? v : 'male'
}

function normalizeCategory(raw: string): string {
  if (!raw) return 'general'
  const v = raw.toLowerCase().trim()
  return VALID_CATEGORIES.includes(v) ? v : 'general'
}

function normalizeBloodGroup(raw: string): string {
  if (!raw) return ''
  const v = raw.toUpperCase().trim()
  return VALID_BLOOD_GROUPS.includes(v) ? v : ''
}

function parseDOB(raw: any): Date {
  try {
    // Excel numeric date handle karo
    if (typeof raw === 'number') {
      const excelEpoch = new Date(1900, 0, 1)
      excelEpoch.setDate(excelEpoch.getDate() + raw - 2)
      return excelEpoch
    }
    const d = new Date(raw)
    if (!isNaN(d.getTime())) return d
  } catch { }
  return new Date('2005-01-01')
}

// ─────────────────────────────────────────────
// Multi-column name helper
// ─────────────────────────────────────────────

function col(row: any, ...keys: string[]): string {
  for (const k of keys) {
    const val = row[k]
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      return String(val).trim()
    }
  }
  return ''
}

// ─────────────────────────────────────────────
// Admission Number Generator
// ─────────────────────────────────────────────

async function generateBulkAdmissionNo(
  tenantId: string,
  schoolCode: string,
  academicYear: string,
  offset: number
): Promise<string> {
  const last = await Student.findOne({ tenantId, academicYear })
    .sort({ createdAt: -1 })
    .select('admissionNo')
    .lean() as { admissionNo?: string } | null

  let baseSeq = 1
  if (last?.admissionNo) {
    const parts = last.admissionNo.split('/')
    const lastSeq = parseInt(parts[parts.length - 1] || '0') || 0
    baseSeq = lastSeq + 1
  }

  return `${schoolCode}/${academicYear}/${String(baseSeq + offset).padStart(4, '0')}`
}

// ─────────────────────────────────────────────
// POST
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }

  // ✅ UI se academicYear lo — FormData mein bheja tha
  const rawYear = formData.get('academicYear') as string || ''
  const academicYear = isValidAcademicYear(rawYear)
    ? rawYear
    : getCurrentAcademicYear()

  // ── Parse Excel ──
  const buffer = Buffer.from(await file.arrayBuffer())
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws) as any[]

  if (rows.length === 0) {
    return NextResponse.json(
      { error: 'File mein koi data nahi hai' },
      { status: 400 }
    )
  }

  // ── Limit check ──
  const limitCheck = await checkCanAddStudent(session.user.tenantId)
  if (!limitCheck.isUnlimited && limitCheck.remaining < rows.length) {
    return NextResponse.json({
      error: `Cannot import ${rows.length} students. Only ${limitCheck.remaining} slots available.`,
      limitReached: true,
      current: limitCheck.current,
      limit: limitCheck.limit,
      canImport: limitCheck.remaining,
    }, { status: 403 })
  }

  // ── School info ──
  const school = await School.findById(session.user.tenantId)
    .select('subdomain')
    .lean() as { subdomain?: string } | null

  const subdomain = school?.subdomain || 'SCH'
  const schoolCode = getSchoolCode(subdomain)

  // ── Results tracker ──
  const results = {
    success: 0,
    failed: 0,
    // ✅ Detailed errors — row number + field + reason
    errors: [] as Array<{
      row: number
      name: string
      field: string
      message: string
    }>,
  }

  let successOffset = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2
    const rowName = col(row, 'Name', 'name') || `Row ${rowNum}`
    let createdUserId: string | null = null

    try {
      // ── Required field validation ──
      const name = col(row, 'Name', 'name')
      const phone = col(row, 'Phone', 'phone')
      const className = col(row, 'Class', 'class')
      const fatherName = col(row, 'Father Name', 'father_name', 'fatherName')
      const address = col(row, 'Address', 'address')

      // ✅ Har field ke liye alag error — user ko exact pata chale
      if (!name) throw { field: 'Name', message: 'Name column empty hai' }
      if (!phone) throw { field: 'Phone', message: 'Phone column empty hai' }
      if (!/^\d{10}$/.test(phone)) {
        throw {
          field: 'Phone',
          message: `Phone invalid: "${phone}" — sirf 10 digits chahiye (bina +91)`,
        }
      }
      if (!className) throw { field: 'Class', message: 'Class column empty hai' }
      if (!fatherName) throw { field: 'Father Name', message: 'Father Name column empty hai' }
      if (!address) throw { field: 'Address', message: 'Address column empty hai' }

      // ── Optional fields — normalize karo ──
      const section = col(row, 'Section', 'section') || 'A'
      const parentPhone = col(row, 'Parent Phone', 'parent_phone', 'parentPhone') || phone

      // ✅ Stream normalize — "Science" → "science"
      const streamRaw = col(row, 'Stream', 'stream')
      const stream = normalizeStream(streamRaw)

      // Stream validation for class 11/12
      if (['11', '12'].includes(className)) {
        if (streamRaw && !stream) {
          // Stream value tha but invalid tha
          throw {
            field: 'Stream',
            message: `Stream invalid: "${streamRaw}" — valid values: science, commerce, arts, vocational`,
          }
        }
        if (!streamRaw) {
          throw {
            field: 'Stream',
            message: 'Class 11/12 ke liye Stream required hai (science/commerce/arts/vocational)',
          }
        }
      }

      // ✅ Gender normalize — "Male" → "male"
      const gender = normalizeGender(col(row, 'Gender', 'gender'))

      // ✅ Category normalize — "OBC" → "obc"
      const category = normalizeCategory(col(row, 'Category', 'category'))

      // ✅ Blood group normalize — "a+" → "A+"
      const bloodGroup = normalizeBloodGroup(
        col(row, 'Blood Group', 'blood_group', 'bloodGroup')
      )

      const dateOfBirth = parseDOB(
        col(row, 'DOB', 'dob', 'Date of Birth', 'dateOfBirth')
      )

      // ── Duplicate check ──
      const existing = await User.findOne({
        tenantId: session.user.tenantId,
        phone,
      })
      if (existing) {
        throw {
          field: 'Phone',
          message: `Phone ${phone} already registered hai`,
        }
      }

      // ── Generate IDs ──
      const admissionNo = await generateBulkAdmissionNo(
        session.user.tenantId,
        schoolCode,
        academicYear,
        successOffset
      )

      const rollNoFromSheet = col(row, 'Roll No', 'roll_no', 'rollNo')
      const rollNo = rollNoFromSheet ||
        (await generateRollNo(
          session.user.tenantId,
          className,
          section,
          academicYear
        ))

      // ── Create User ──
      const hashedPwd = await bcrypt.hash(parentPhone || phone, 10)

      const user = await User.create({
        tenantId: session.user.tenantId,
        name,
        phone,
        role: 'student',
        password: hashedPwd,
        class: className,
        section,
        isActive: true,
      })

      createdUserId = user._id.toString()

      // ── Create Student ──
      await Student.create({
        tenantId: session.user.tenantId,
        userId: user._id,

        admissionNo,
        rollNo,
        // ✅ UI se aaya academicYear use karo
        academicYear,
        admissionDate: new Date(),
        admissionClass: className,

        class: className,
        section,
        // ✅ Already normalized — hook bhi karega but pre-normalize better
        stream,

        dateOfBirth,
        gender,
        bloodGroup,
        nationality: col(row, 'Nationality', 'nationality') || 'Indian',
        religion: col(row, 'Religion', 'religion'),
        category,

        fatherName,
        fatherOccupation: col(row, 'Father Occupation', 'father_occupation'),
        fatherPhone: col(row, 'Father Phone', 'father_phone'),
        motherName: col(row, 'Mother Name', 'mother_name'),
        motherOccupation: col(row, 'Mother Occupation', 'mother_occupation'),
        motherPhone: col(row, 'Mother Phone', 'mother_phone'),
        parentPhone,
        parentEmail: col(row, 'Parent Email', 'parent_email'),

        address,
        city: col(row, 'City', 'city'),
        state: col(row, 'State', 'state'),
        pincode: col(row, 'Pincode', 'pincode'),

        emergencyContact: col(row, 'Emergency Contact', 'emergency_contact'),
        emergencyName: col(row, 'Emergency Name', 'emergency_name'),

        previousSchool: col(row, 'Previous School', 'previous_school'),
        previousClass: col(row, 'Previous Class', 'previous_class'),
        tcNumber: col(row, 'TC Number', 'tc_number'),

        sessionHistory: [{
          academicYear,
          class: className,
          section,
          rollNo,
        }],

        status: 'active',
        documents: [],
      })

      successOffset++
      results.success++

    } catch (err: any) {
      results.failed++

      // ✅ Rollback
      if (createdUserId) {
        try {
          await User.findByIdAndDelete(createdUserId)
        } catch { }
      }

      // ✅ Structured error — field + message alag alag
      const field = err.field || 'Unknown'
      const message = err.message || String(err)

      results.errors.push({
        row: rowNum,
        name: rowName,
        field,
        message,
      })
    }
  }

  return NextResponse.json({
    success: results.success,
    failed: results.failed,
    // ✅ Structured errors array
    errors: results.errors,
    academicYear,   // ✅ Actual year jo use hua
    schoolCode,
    message: results.success > 0
      ? `${results.success} students successfully imported for ${academicYear}`
      : 'Koi bhi student import nahi hua',
  })
}