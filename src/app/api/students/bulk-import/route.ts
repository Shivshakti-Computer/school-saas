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
// ✅ NEW — Password = DOB (DDMMYYYY)
// Simple, yaad rakhne wala
// e.g. 15 May 2008 → "15052008"
// ─────────────────────────────────────────────

function formatDOBPassword(dob: Date): string {
  const dd = String(dob.getDate()).padStart(2, '0')
  const mm = String(dob.getMonth() + 1).padStart(2, '0')
  const yyyy = dob.getFullYear()
  return `${dd}${mm}${yyyy}`
}

// ─────────────────────────────────────────────
// Normalizers
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
// Multi-column helper
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

  const rawYear = formData.get('academicYear') as string || ''
  const academicYear = isValidAcademicYear(rawYear)
    ? rawYear
    : getCurrentAcademicYear()

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

  const results = {
    success: 0,
    failed: 0,
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
      // ── Required fields ──
      const name = col(row, 'Name', 'name')
      const className = col(row, 'Class', 'class')
      const fatherName = col(row, 'Father Name', 'father_name', 'fatherName')
      const address = col(row, 'Address', 'address')

      if (!name) throw { field: 'Name', message: 'Name column empty hai' }
      if (!className) throw { field: 'Class', message: 'Class column empty hai' }
      if (!fatherName) throw { field: 'Father Name', message: 'Father Name column empty hai' }
      if (!address) throw { field: 'Address', message: 'Address column empty hai' }

      // ── Optional fields ──
      const section = col(row, 'Section', 'section') || 'A'

      // ✅ Phone optional — chote bachhe ka nahi hota
      const phoneRaw = col(row, 'Phone', 'phone')
      const studentPhone: string | null = phoneRaw || null

      // Phone diya hai to validate karo
      if (studentPhone && !/^\d{10}$/.test(studentPhone)) {
        throw {
          field: 'Phone',
          message: `Phone invalid: "${studentPhone}" — 10 digits chahiye (bina +91)`,
        }
      }

      // ✅ Parent phone — required
      const parentPhoneRaw = col(row, 'Parent Phone', 'parent_phone', 'parentPhone')
      const parentPhone = parentPhoneRaw || studentPhone || ''

      if (!parentPhone) {
        throw {
          field: 'Parent Phone',
          message: 'Parent Phone required hai',
        }
      }
      if (!/^\d{10}$/.test(parentPhone)) {
        throw {
          field: 'Parent Phone',
          message: `Parent Phone invalid: "${parentPhone}" — 10 digits chahiye`,
        }
      }

      // Student phone = parent phone nahi hona chahiye
      if (studentPhone && studentPhone === parentPhone) {
        throw {
          field: 'Phone',
          message: 'Student phone aur parent phone alag hone chahiye',
        }
      }

      // Stream normalize
      const streamRaw = col(row, 'Stream', 'stream')
      const stream = normalizeStream(streamRaw)

      if (['11', '12'].includes(className)) {
        if (streamRaw && !stream) {
          throw {
            field: 'Stream',
            message: `Stream invalid: "${streamRaw}" — valid: science, commerce, arts, vocational`,
          }
        }
        if (!streamRaw) {
          throw {
            field: 'Stream',
            message: 'Class 11/12 ke liye Stream required hai',
          }
        }
      }

      const gender = normalizeGender(col(row, 'Gender', 'gender'))
      const category = normalizeCategory(col(row, 'Category', 'category'))
      const bloodGroup = normalizeBloodGroup(
        col(row, 'Blood Group', 'blood_group', 'bloodGroup')
      )
      const dateOfBirth = parseDOB(
        col(row, 'DOB', 'dob', 'Date of Birth', 'dateOfBirth')
      )

      // ── Duplicate phone check ──
      if (studentPhone) {
        const existing = await User.findOne({
          tenantId: session.user.tenantId,
          phone: studentPhone,
        })
        if (existing) {
          throw {
            field: 'Phone',
            message: `Phone ${studentPhone} already registered hai`,
          }
        }

        // Parent phone kisi student ka phone to nahi?
        const parentAsStudent = await User.findOne({
          tenantId: session.user.tenantId,
          phone: parentPhone,
          role: 'student',
        })
        if (parentAsStudent) {
          throw {
            field: 'Parent Phone',
            message: `Parent phone ${parentPhone} ek student account pe registered hai`,
          }
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

      // ✅ Password = DOB (DDMMYYYY)
      const dobPassword = formatDOBPassword(dateOfBirth)
      const hashedPwd = await bcrypt.hash(dobPassword, 10)

      // ── Create Student User ──
      const user = await User.create({
        tenantId: session.user.tenantId,
        name,
        // ✅ null agar phone nahi diya
        phone: studentPhone || null,
        role: 'student',
        password: hashedPwd,
        // ✅ admissionNo store — login ke liye (phone nahi to)
        admissionNo,
        class: className,
        section,
        isActive: true,
      })

      createdUserId = user._id.toString()

      // ── Create Student Record ──
      await Student.create({
        tenantId: session.user.tenantId,
        userId: user._id,
        admissionNo,
        rollNo,
        academicYear,
        admissionDate: new Date(),
        admissionClass: className,
        class: className,
        section,
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

        // ✅ Parent Account — Sibling Aware
        // Fire and forget — student already saved
        ; (async () => {
          try {
            const existingParent = await User.findOne({
              tenantId: session.user.tenantId,
              phone: parentPhone,
              role: 'parent',
            })

            if (existingParent) {
              // Sibling — existing parent mein add karo
              // Password change NAHI — pehle bachche ka DOB hi rahega
              await User.findByIdAndUpdate(existingParent._id, {
                $addToSet: { studentRef: user._id },
              })
            } else {
              // Naya parent — password = is bachche ka DOB
              const parentHashedPwd = await bcrypt.hash(dobPassword, 10)
              await User.create({
                tenantId: session.user.tenantId,
                name: `${fatherName} (Parent)`,
                phone: parentPhone,
                role: 'parent',
                password: parentHashedPwd,
                studentRef: [user._id],
                isActive: true,
              })
            }
          } catch (e: any) {
            // 11000 = race condition duplicate — ignore
            if (e.code !== 11000) {
              console.error('[Parent Error]', e)
            }
          }
        })()

      successOffset++
      results.success++

    } catch (err: any) {
      results.failed++

      if (createdUserId) {
        try {
          await User.findByIdAndDelete(createdUserId)
        } catch { }
      }

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
    errors: results.errors,
    academicYear,
    schoolCode,
    message: results.success > 0
      ? `${results.success} students imported for ${academicYear} | Password: DOB (DDMMYYYY)`
      : 'Koi bhi student import nahi hua',
  })
}