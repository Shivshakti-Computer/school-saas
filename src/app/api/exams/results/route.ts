// src/app/api/exams/results/route.ts
// GET  → Results fetch
// POST → Bulk marks save (composite marks support)
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard, apiGuardWithBody } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import {
  Exam, Result,
  calculateGrade, calculateActivityGrade, getClassGroup,
} from '@/models/Exam'
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

    // Student → sirf apne results
    if (session.user.role === 'student') {
      const student = await Student.findOne({
        userId: session.user.id,
        tenantId: session.user.tenantId,
      }).select('_id').lean()

      if (student) query.studentId = (student as any)._id
      else return NextResponse.json({ results: [] })
    }

    // Parent → apne bachhe ke results
    if (session.user.role === 'parent') {
      const refs = session.user.studentRef || []
      if (studentId && refs.includes(studentId)) {
        query.studentId = studentId
      } else if (refs.length > 0) {
        query.studentId = { $in: refs }
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
      .sort({ rank: 1, percentage: -1 })
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
// POST — Save Marks (Bulk, Composite Support)
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
      return NextResponse.json(
        { error: 'Results array is required' },
        { status: 400 }
      )
    }

    const exam = await Exam.findOne({
      _id: examId,
      tenantId: session.user.tenantId,
    })
    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    const classGroup = getClassGroup(exam.class)
    const isNursery = classGroup === 'nursery-kg'

    // Total max marks (from exam config)
    const totalMax = exam.subjects.reduce(
      (sum: number, sub: any) => sum + sub.totalMaxMarks, 0
    )

    const savedCount = { count: 0 }

    for (const r of results) {
      if (!r.studentId) continue

      let totalObtained = 0

      // ── Build per-subject marks ────────────────────────
      const marksArr = r.marks.map((m: any) => {
        const subConfig = exam.subjects.find(
          (s: any) => s.name === m.subject
        )
        const subMax = subConfig?.totalMaxMarks ?? 100

        // Composite marks: sum of components
        let subObtained = 0
        const componentResults: Array<{
          name: string; marksObtained: number; maxMarks: number
        }> = []

        if (
          subConfig?.components?.length > 0 &&
          Array.isArray(m.components) &&
          m.components.length > 0
        ) {
          // Composite mode
          for (const comp of subConfig.components) {
            const entered = m.components.find(
              (c: any) => c.name === comp.name
            )
            const obtained = m.isAbsent
              ? 0
              : Math.min(Number(entered?.marksObtained ?? 0), comp.maxMarks)

            subObtained += obtained
            componentResults.push({
              name: comp.name,
              marksObtained: obtained,
              maxMarks: comp.maxMarks,
            })
          }
        } else {
          // Simple mode (backward compatible)
          subObtained = m.isAbsent
            ? 0
            : Math.min(Number(m.marksObtained ?? 0), subMax)
        }

        totalObtained += subObtained

        const subPct = subMax > 0 ? (subObtained / subMax) * 100 : 0
        const grade = m.isAbsent ? 'AB' : calculateGrade(subPct)
        const actGrade = m.isAbsent ? 'Absent' : calculateActivityGrade(subPct)

        return {
          subject: m.subject,
          components: componentResults,
          marksObtained: m.isAbsent ? 0 : subObtained,
          maxMarks: subMax,
          grade: isNursery ? '' : grade,
          activityGrade: isNursery ? actGrade : '',
          isAbsent: m.isAbsent ?? false,
          remarks: m.remarks ?? '',
        }
      })

      const percentage = totalMax > 0
        ? Math.round((totalObtained / totalMax) * 10000) / 100
        : 0

      const overallGrade = isNursery
        ? calculateActivityGrade(percentage)
        : calculateGrade(percentage)

      // Pass/Fail: koi bhi subject fail → overall fail
      // Absent bhi fail maana jayega
      const isPassed = !marksArr.some((m: any) => {
        if (m.isAbsent) return true
        const subConfig = exam.subjects.find(
          (s: any) => s.name === m.subject
        )
        return subConfig && m.marksObtained < subConfig.minMarks
      })

      await Result.findOneAndUpdate(
        {
          tenantId: session.user.tenantId,
          examId,
          studentId: r.studentId,
        },
        {
          $set: {
            marks: marksArr,
            totalMarks: totalMax,
            totalObtained,
            percentage,
            grade: overallGrade,
            isPassed,
            enteredBy: session.user.id,
          },
        },
        { upsert: true, new: true }
      )

      savedCount.count++
    }

    // Ranks recalculate
    await calculateRanks(examId, session.user.tenantId)

    await logAudit({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      action: 'UPDATE',
      resource: 'Exam',
      resourceId: examId,
      description: `Marks entered for ${savedCount.count} students — ${exam.name}`,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      status: 'SUCCESS',
    })

    return NextResponse.json({
      success: true,
      saved: savedCount.count,
    })

  } catch (err: any) {
    console.error('[RESULTS POST]', err)
    return NextResponse.json(
      { error: err.message || 'Failed to save marks' },
      { status: 500 }
    )
  }
}

// ── Rank Calculator ──────────────────────────────────────────
async function calculateRanks(
  examId: string,
  tenantId: string
): Promise<void> {
  const allResults = await Result.find({ examId, tenantId })
    .sort({ percentage: -1, totalObtained: -1 })
    .lean()

  if (allResults.length === 0) return

  const bulkOps = allResults.map((r, i) => ({
    updateOne: {
      filter: { _id: r._id },
      update: { $set: { rank: i + 1 } },
    },
  }))

  await Result.bulkWrite(bulkOps)
}