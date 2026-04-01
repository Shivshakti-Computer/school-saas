// FILE: src/app/api/students/fees/route.ts
// GET → student ki fees list — FIXED summary calculation
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Student } from '@/models/Student'
import { Fee } from '@/models/Fee'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { User } from '@/models/User'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['student', 'parent'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    let resolvedStudentId: string | null = null

    if (session.user.role === 'student') {
      const stu = await Student.findOne({
        userId: session.user.id,
        tenantId: session.user.tenantId,
      }).select('_id').lean()
      resolvedStudentId = stu?._id?.toString() ?? null
    } else {
      const parentUser = await User.findById(session.user.id)
        .select('studentRef').lean() as any
      resolvedStudentId = parentUser?.studentRef?.toString() ?? null
    }

    if (!resolvedStudentId) {
      return NextResponse.json({
        fees: [],
        summary: { totalDue: 0, totalPaid: 0 },
      })
    }

    const status = req.nextUrl.searchParams.get('status')
    const query: any = {
      tenantId: session.user.tenantId,
      studentId: resolvedStudentId,
    }
    if (status) query.status = status

    const fees = await Fee.find(query)
      .populate('structureId', 'name items')
      .sort({ dueDate: -1 })
      .lean()

    // ✅ FIXED: totalDue = pending + partial remaining amount
    // ✅ FIXED: totalPaid = all paidAmount sum (paid + partial)
    const totalDue = fees
      .filter((f: any) => ['pending', 'partial'].includes(f.status))
      .reduce((s: number, f: any) => s + (f.finalAmount - f.paidAmount), 0)

    const totalPaid = fees
      .filter((f: any) => ['paid', 'partial'].includes(f.status))
      .reduce((s: number, f: any) => s + f.paidAmount, 0)

    return NextResponse.json({
      fees,
      summary: { totalDue, totalPaid },
    })
  } catch (err: any) {
    console.error('Student fees GET error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}