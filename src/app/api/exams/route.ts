// FILE: src/app/api/exams/route.ts
// PRODUCTION READY
// GET  → List exams (with filters)
// POST → Create exam schedule
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard, apiGuardWithBody } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { Exam } from '@/models/Exam'
import { logAudit } from '@/lib/audit'
import { getCurrentAcademicYear } from '@/lib/academicYear'

// ── Validation ──────────────────────────────────────────────
function validateExamBody(body: any): string | null {
  if (!body.name?.trim())        return 'Exam name is required'
  if (!body.class?.trim())       return 'Class is required'
  if (!body.academicYear?.trim())return 'Academic year is required'

  if (!Array.isArray(body.subjects) || body.subjects.length === 0) {
    return 'At least one subject is required'
  }

  for (const sub of body.subjects) {
    if (!sub.name?.trim())  return `Subject name is required`
    if (!sub.date)          return `Date is required for ${sub.name}`
    if (!sub.maxMarks || sub.maxMarks <= 0) {
      return `Max marks must be greater than 0 for ${sub.name}`
    }
    if (sub.minMarks < 0 || sub.minMarks > sub.maxMarks) {
      return `Pass marks invalid for ${sub.name}`
    }
  }

  return null
}

// ══════════════════════════════════════════════════════════
// GET — List Exams
// ══════════════════════════════════════════════════════════

export async function GET(req: NextRequest) {
  const guard = await apiGuard(req, {
    allowedRoles: ['admin', 'teacher', 'staff', 'student', 'parent'],
    rateLimit:    'api',
    requiredModules: ['exams'],
  })
  if (guard instanceof NextResponse) return guard
  const { session } = guard

  try {
    await connectDB()

    const url          = new URL(req.url)
    const cls          = url.searchParams.get('class')
    const section      = url.searchParams.get('section')
    const academicYear = url.searchParams.get('academicYear')
    const status       = url.searchParams.get('status')

    const query: any = { tenantId: session.user.tenantId }

    if (cls)          query.class = cls
    if (section)      query.section = section
    if (academicYear) query.academicYear = academicYear
    if (status)       query.status = status

    // Student sirf apni class ke exams dekhe
    if (session.user.role === 'student') {
      query.class   = session.user.class
      query.section = session.user.section
    }

    const exams = await Exam.find(query)
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({ exams })

  } catch (err: any) {
    console.error('[EXAMS GET]', err)
    return NextResponse.json(
      { error: err.message || 'Failed to fetch exams' },
      { status: 500 }
    )
  }
}

// ══════════════════════════════════════════════════════════
// POST — Create Exam
// ══════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  const guard = await apiGuardWithBody(req, {
    allowedRoles:    ['admin', 'teacher'],
    rateLimit:       'mutation',
    requiredModules: ['exams'],
    auditAction:     'CREATE',
    auditResource:   'Exam',
  })
  if (guard instanceof NextResponse) return guard
  const { session, body, clientInfo } = guard

  try {
    await connectDB()

    const error = validateExamBody(body)
    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }

    const exam = await Exam.create({
      tenantId:      session.user.tenantId,
      createdBy:     session.user.id,
      name:          body.name.trim(),
      class:         body.class.trim(),
      section:       body.section?.trim() || undefined,
      academicYear:  body.academicYear.trim(),
      status:        'upcoming',
      resultPublished: false,
      subjects:      body.subjects.map((s: any) => ({
        name:      s.name.trim(),
        date:      new Date(s.date),
        time:      s.time || '10:00 AM',
        duration:  Number(s.duration) || 180,
        maxMarks:  Number(s.maxMarks),
        minMarks:  Number(s.minMarks),
      })),
    })

    await logAudit({
      tenantId:    session.user.tenantId,
      userId:      session.user.id,
      userName:    session.user.name,
      userRole:    session.user.role,
      action:      'CREATE',
      resource:    'Exam',
      resourceId:  exam._id.toString(),
      description: `Created exam: ${exam.name} — Class ${exam.class}`,
      ipAddress:   clientInfo.ip,
      userAgent:   clientInfo.userAgent,
      status:      'SUCCESS',
    })

    return NextResponse.json({ exam }, { status: 201 })

  } catch (err: any) {
    console.error('[EXAMS POST]', err)
    return NextResponse.json(
      { error: err.message || 'Failed to create exam' },
      { status: 500 }
    )
  }
}