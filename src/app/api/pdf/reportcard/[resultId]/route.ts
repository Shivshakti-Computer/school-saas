import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Result } from '@/models/Exam'
import { Student } from '@/models/Student'
import { User } from '@/models/User'
import { generateReportCard } from '@/lib/pdf'
 
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ resultId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
 
    const { resultId } = await params
    await connectDB()
 
    // Result verify — sirf apna result dekhe
    let result: any
    if (['student', 'parent'].includes(session.user.role)) {
      // Student ID resolve karo
      let studentId: string | null = null
      if (session.user.role === 'student') {
        const stu = await Student.findOne({
          userId:   session.user.id,
          tenantId: session.user.tenantId,
        }).select('_id').lean()
        studentId = stu?._id?.toString() ?? null
      } else {
        const p = await User.findById(session.user.id).select('studentRef').lean() as any
        studentId = p?.studentRef?.toString() ?? null
      }
 
      result = await Result.findOne({
        _id:       resultId,
        tenantId:  session.user.tenantId,
        studentId,
      })
    } else {
      result = await Result.findOne({
        _id:      resultId,
        tenantId: session.user.tenantId,
      })
    }
 
    if (!result) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 })
    }
 
    // Agar already generated hai to redirect karo
    if (result.reportCardUrl) {
      return NextResponse.redirect(result.reportCardUrl)
    }
 
    const url = await generateReportCard(resultId)
    await Result.findByIdAndUpdate(resultId, { reportCardUrl: url })
    return NextResponse.redirect(url)
 
  } catch (err: any) {
    console.error('Report card error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}