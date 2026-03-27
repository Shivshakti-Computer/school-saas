/* ─────────────────────────────────────────────────────────────
   FILE: src/app/api/exams/results/route.ts
   GET  → results for exam (teacher/student view)
   POST → save/update marks (by teacher)
   ─────────────────────────────────────────────────────────── */
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { calculateGrade, Exam, Result, Student } from "@/models"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 
  await connectDB()
  const { searchParams } = req.nextUrl
  const examId    = searchParams.get('examId')
  const studentId = searchParams.get('studentId')
 
  const query: any = { tenantId: session.user.tenantId }
  if (examId)    query.examId    = examId
  if (studentId) query.studentId = studentId
 
  // Student can only see own results
  if (session.user.role === 'student') {
    const student = await Student.findOne({
      userId:   session.user.id,
      tenantId: session.user.tenantId,
    })
    if (student) query.studentId = student._id
  }
 
  const results = await Result.find(query)
    .populate('studentId', 'admissionNo rollNo class section')
    .populate('examId', 'name')
    .lean()
 
  return NextResponse.json({ results })
}
 
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !['admin','teacher'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
 
  await connectDB()
  const { examId, results } = await req.json()
  // results: [{ studentId, marks: [{ subject, marksObtained, isAbsent }] }]
 
  const exam = await Exam.findOne({ _id: examId, tenantId: session.user.tenantId })
  if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
 
  const saved = []
 
  for (const r of results) {
    const totalMax     = exam.subjects.reduce((s: number, sub: any) => s + sub.maxMarks, 0)
    const totalObtained = r.marks.reduce((s: number, m: any) => s + (m.isAbsent ? 0 : m.marksObtained), 0)
    const percentage   = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0
    const grade        = calculateGrade(percentage)
    const isPassed     = !r.marks.some(
      (m: any) => !m.isAbsent &&
      m.marksObtained < (exam.subjects.find((s: any) => s.name === m.subject)?.minMarks || 0)
    )
 
    const marksWithGrades = r.marks.map((m: any) => {
      const subjectConfig = exam.subjects.find((s: any) => s.name === m.subject)
      const subPct = subjectConfig && !m.isAbsent
        ? (m.marksObtained / subjectConfig.maxMarks) * 100 : 0
      return {
        ...m,
        maxMarks: subjectConfig?.maxMarks || 0,
        grade:    m.isAbsent ? 'AB' : calculateGrade(subPct),
      }
    })
 
    const result = await Result.findOneAndUpdate(
      { tenantId: session.user.tenantId, examId, studentId: r.studentId },
      {
        $set: {
          marks:         marksWithGrades,
          totalMarks:    totalMax,
          totalObtained,
          percentage:    Math.round(percentage * 100) / 100,
          grade,
          isPassed,
          enteredBy:     session.user.id,
        },
      },
      { upsert: true, new: true }
    )
    saved.push(result)
  }
 
  return NextResponse.json({ saved: saved.length })
}