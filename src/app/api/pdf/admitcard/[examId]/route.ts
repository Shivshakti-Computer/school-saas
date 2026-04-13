// src/app/api/pdf/admitcard/[examId]/route.ts
// NEW: Admit card generate karo per student
// Query param: ?studentId=xxx
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard } from '@/lib/apiGuard'
import { generateAdmitCardBuffer } from '@/lib/pdf'
import { connectDB } from '@/lib/db'
import { Student } from '@/models/Student'

type Params = { params: Promise<{ examId: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { examId } = await params

  const guard = await apiGuard(req, {
    allowedRoles:    ['admin', 'teacher', 'student', 'parent'],
    rateLimit:       'api',
    requiredModules: ['exams'],
  })
  if (guard instanceof NextResponse) return guard
  const { session } = guard

  try {
    await connectDB()

    const url       = new URL(req.url)
    let   studentId = url.searchParams.get('studentId')

    // Student khud apna admit card le sakta hai
    if (session.user.role === 'student') {
      const student = await Student.findOne({
        userId:   session.user.id,
        tenantId: session.user.tenantId,
      }).select('_id').lean() as any

      if (!student) {
        return NextResponse.json(
          { error: 'Student not found' },
          { status: 404 }
        )
      }
      studentId = String(student._id)
    }

    if (!studentId) {
      return NextResponse.json(
        { error: 'studentId is required' },
        { status: 400 }
      )
    }

    const buffer = await generateAdmitCardBuffer(examId, studentId)

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `inline; filename="admit-card-${examId}.pdf"`,
        'Content-Length':      String(buffer.length),
        'Cache-Control':       'private, max-age=600',
      },
    })

  } catch (err: any) {
    console.error('[ADMIT CARD PDF]', err)
    return NextResponse.json(
      { error: err.message || 'Failed to generate admit card' },
      { status: 500 }
    )
  }
}