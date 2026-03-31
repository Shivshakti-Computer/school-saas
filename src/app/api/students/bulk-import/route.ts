// =============================================================
// FILE: src/app/api/students/bulk-import/route.ts
// UPDATED: Added limit check before bulk import
// =============================================================
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Student, User } from '@/models'
import { checkCanAddStudent } from '@/lib/limitGuard'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws) as any[]

  // ─── CHECK STUDENT LIMIT BEFORE IMPORT ───
  const limitCheck = await checkCanAddStudent(session.user.tenantId)
  if (!limitCheck.isUnlimited && limitCheck.remaining < rows.length) {
    return NextResponse.json({
      error: `Cannot import ${rows.length} students. Only ${limitCheck.remaining} slots available (${limitCheck.current}/${limitCheck.limit}). Upgrade your plan.`,
      limitReached: true,
      current: limitCheck.current,
      limit: limitCheck.limit,
      canImport: limitCheck.remaining,
    }, { status: 403 })
  }

  const results = { success: 0, failed: 0, errors: [] as string[] }

  for (const row of rows) {
    try {
      const phone = String(row['Phone'] || row['phone'] || '')
      if (!phone) throw new Error('Phone required')

      const existing = await User.findOne({ tenantId: session.user.tenantId, phone })
      if (existing) {
        results.failed++
        results.errors.push(`${row['Name']}: Phone ${phone} already exists`)
        continue
      }

      const year = new Date().getFullYear()
      const count = await Student.countDocuments({ tenantId: session.user.tenantId })
      const admissionNo = `${year}-${String(count + 1).padStart(4, '0')}`
      const hashedPwd = await bcrypt.hash(String(row['Parent Phone'] || phone), 10)

      const user = await User.create({
        tenantId: session.user.tenantId,
        name: row['Name'] || row['name'],
        phone,
        role: 'student',
        password: hashedPwd,
        class: String(row['Class'] || row['class'] || ''),
        section: String(row['Section'] || row['section'] || 'A'),
      })

      await Student.create({
        tenantId: session.user.tenantId,
        userId: user._id,
        admissionNo,
        rollNo: row['Roll No'] || String(count + 1),
        class: String(row['Class'] || ''),
        section: String(row['Section'] || 'A'),
        fatherName: row['Father Name'] || '',
        parentPhone: String(row['Parent Phone'] || phone),
        address: row['Address'] || '',
        dateOfBirth: new Date(row['DOB'] || Date.now()),
        gender: (row['Gender'] || 'male').toLowerCase(),
        admissionDate: new Date(),
      })

      results.success++
    } catch (err: any) {
      results.failed++
      results.errors.push(`Row ${results.success + results.failed}: ${err.message}`)
    }
  }

  return NextResponse.json(results)
}