// FILE: src/app/api/exams/results/route.ts
// GET  → Results fetch (with rank calculation)
// POST → Save/update marks (bulk)
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard, apiGuardWithBody } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { Exam, Result, calculateGrade } from '@/models/Exam'
import { Student } from '@/models/Student'
import { logAudit } from '@/lib/audit'

// ══════════════════════════════════════════════════════════
// GET — Fetch Results
// ══════════════════════════════════════════════════════════

export async function GET(req: NextRequest) {
  const guard = await apiGuard(req, {
    allowedRoles: ['admin', 'teacher', 'staff', 'student', 'parent'],
    rateLimit: 'api',
    requiredModules: ['exams'],
  })
  if (guard instanceof NextResponse) return guard
  const { session } = guard

  try {
    await connectDB()

    const url = new URL(req.url)
    const examId = url.searchParams.get('examId')
    const studentId = url.searchParams.get('studentId')

    const query: any = { tenantId: session.user.tenantId }
    if (examId) query.examId = examId
    if (studentId) query.studentId = studentId

    // Student sirf apne results dekhe
    if (session.user.role === 'student') {
      const student = await Student.findOne({
        userId: session.user.id,
        tenantId: session.user.tenantId,
      }).select('_id').lean()

      if (student) query.studentId = student._id
      else return NextResponse.json({ results: [] })
    }

    // Parent apne bachhe ke results dekhe
    if (session.user.role === 'parent') {
      // studentRef array from session
      const studentRefs = session.user.studentRef || []
      if (studentId && studentRefs.includes(studentId)) {
        query.studentId = studentId
      } else if (studentRefs.length > 0) {
        query.studentId = { $in: studentRefs }
      } else {
        return NextResponse.json({ results: [] })
      }
    }

    const results = await Result.find(query)
      .populate({
        path: 'studentId',
        select: 'admissionNo rollNo class section userId',
        populate: { path: 'userId', select: 'name' },
      })
      .populate('examId', 'name class section academicYear subjects')
      .sort({ percentage: -1 })
      .lean()

    return NextResponse.json({ results })

  } catch (err: any) {
    console.error('[RESULTS GET]', err)
    return NextResponse.json(
      { error: err.message || 'Failed to fetch results' },
      { status: 500 }
    )
  }
}

// ══════════════════════════════════════════════════════════
// POST — Save Marks (Bulk)
// ══════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  const guard = await apiGuardWithBody(req, {
    allowedRoles: ['admin', 'teacher'],
    rateLimit: 'mutation',
    requiredModules: ['exams'],
    auditAction: 'UPDATE',
    auditResource: 'Exam',
  })
  if (guard instanceof NextResponse) return guard
  const { session, body, clientInfo } = guard

  try {
    await connectDB()

    const { examId, results } = body

    if (!examId) {
      return NextResponse.json({ error: 'examId is required' }, { status: 400 })
    }
    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ error: 'Results array is required' }, { status: 400 })
    }

    const exam = await Exam.findOne({
      _id: examId,
      tenantId: session.user.tenantId,
    })

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    const totalMax = exam.subjects.reduce(
      (sum: number, sub: any) => sum + sub.maxMarks, 0
    )

    const savedResults = []

    for (const r of results) {
      if (!r.studentId) continue

      // ── Calculate totals ──
      const totalObtained = r.marks.reduce((sum: number, m: any) => {
        return sum + (m.isAbsent ? 0 : Number(m.marksObtained || 0))
      }, 0)

      const percentage = totalMax > 0
        ? Math.round((totalObtained / totalMax) * 10000) / 100
        : 0

      const grade = calculateGrade(percentage)
      const isPassed = !r.marks.some((m: any) => {
        if (m.isAbsent) return true  // Absent = fail
        const subConfig = exam.subjects.find(
          (s: any) => s.name === m.subject
        )
        return subConfig &&
          Number(m.marksObtained) < subConfig.minMarks
      })

      // ── Per-subject grade ──
      const marksWithGrades = r.marks.map((m: any) => {
        const subConfig = exam.subjects.find(
          (s: any) => s.name === m.subject
        )
        const subMax = subConfig?.maxMarks || 100
        const subObtained = Number(m.marksObtained || 0)
        const subPct = m.isAbsent ? 0 : (subObtained / subMax) * 100

        return {
          subject: m.subject,
          marksObtained: m.isAbsent ? 0 : subObtained,
          maxMarks: subMax,
          grade: m.isAbsent ? 'AB' : calculateGrade(subPct),
          isAbsent: m.isAbsent || false,
          remarks: m.remarks || '',
        }
      })

      // ── Upsert result ──
      const saved = await Result.findOneAndUpdate(
        {
          tenantId: session.user.tenantId,
          examId,
          studentId: r.studentId,
        },
        {
          $set: {
            marks: marksWithGrades,
            totalMarks: totalMax,
            totalObtained,
            percentage,
            grade,
            isPassed,
            enteredBy: session.user.id,
          },
        },
        { upsert: true, new: true }
      )

      savedResults.push(saved)
    }

    // ── Calculate & update ranks ──────────────────────────
    await calculateRanks(examId, session.user.tenantId)

    await logAudit({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      action: 'UPDATE',
      resource: 'Exam',
      resourceId: examId,
      description: `Marks entered for ${savedResults.length} students — ${exam.name}`,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      status: 'SUCCESS',
    })

    return NextResponse.json({
      success: true,
      saved: savedResults.length,
    })

  } catch (err: any) {
    console.error('[RESULTS POST]', err)
    return NextResponse.json(
      { error: err.message || 'Failed to save marks' },
      { status: 500 }
    )
  }
}

// ── Rank Calculator ──────────────────────────────────────
async function calculateRanks(
  examId: string,
  tenantId: string
): Promise<void> {
  // Sort by percentage desc, then totalObtained desc
  const allResults = await Result.find({ examId, tenantId })
    .sort({ percentage: -1, totalObtained: -1 })
    .lean()

  const bulkOps = allResults.map((r, index) => ({
    updateOne: {
      filter: { _id: r._id },
      update: { $set: { rank: index + 1 } },
    },
  }))

  if (bulkOps.length > 0) {
    await Result.bulkWrite(bulkOps)
  }
}