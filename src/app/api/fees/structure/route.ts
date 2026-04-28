// FILE: src/app/api/fees/structure/route.ts
// ✅ UPDATED: Multi-tenant support
// ✅ BACKWARD COMPATIBLE: School logic unchanged

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { FeeStructure } from '@/models/FeeStructure'
import { Fee } from '@/models/Fee'
import { Student } from '@/models/Student'
import { School } from '@/models/School'
import { Enrollment } from '@/models/Enrollment'
import { Course } from '@/models/Course'

/* ═══════════════════════════════════════════════════════════
   GET — List all fee structures
   ═══════════════════════════════════════════════════════════ */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    await connectDB()

    const { searchParams } = req.nextUrl
    const cls = searchParams.get('class')
    const academicYear = searchParams.get('year')
    const stream = searchParams.get('stream')
    const courseId = searchParams.get('courseId')

    // ✅ Get institution type from School
    const school = await School.findById(session.user.tenantId)
      .select('institutionType')
      .lean() as any
    
    const institutionType = school?.institutionType || 'school'

    const query: any = { 
      tenantId: session.user.tenantId,
      institutionType,  // ✅ Filter by institution type
    }

    // ── School filters ──
    if (institutionType === 'school') {
      if (cls && cls !== 'all') query.class = { $in: [cls, 'all'] }
      if (academicYear) query.academicYear = academicYear
      if (stream) {
        query.$or = [
          { stream: '' },
          { stream: stream },
        ]
      }
    }

    // ── Academy/Coaching filters ──
    if (institutionType === 'academy' || institutionType === 'coaching') {
      if (courseId) query.courseId = courseId
      if (academicYear) query.academicYear = academicYear
    }

    const structures = await FeeStructure.find(query)
      .populate('courseId', 'name code category') // ✅ Populate course
      .sort({ createdAt: -1 })
      .lean()

    // Count assigned students per structure
    const withCounts = await Promise.all(
      structures.map(async s => {
        const assignedCount = await Fee.countDocuments({
          tenantId: session.user.tenantId,
          structureId: s._id,
          isOptionalFee: { $ne: true },
        })
        return { ...s, assignedCount }
      })
    )

    return NextResponse.json({ structures: withCounts })
  } catch (err: any) {
    console.error('[FeeStructure GET Error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/* ═══════════════════════════════════════════════════════════
   POST — Create new fee structure + auto-assign
   ═══════════════════════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    await connectDB()

    const body = await req.json()

    // ✅ Get institution type from School
    const school = await School.findById(session.user.tenantId)
      .select('institutionType')
      .lean() as any
    
    const institutionType = school?.institutionType || 'school'

    // ── Validation ──
    if (!body.name || !body.dueDate || !body.items?.length) {
      return NextResponse.json(
        { error: 'name, dueDate, items required' }, 
        { status: 400 }
      )
    }

    // ✅ School-specific validation
    if (institutionType === 'school' && !body.class) {
      return NextResponse.json(
        { error: 'School fee structure must have a class' },
        { status: 400 }
      )
    }

    // ✅ Academy/Coaching-specific validation
    if ((institutionType === 'academy' || institutionType === 'coaching') && !body.courseId) {
      return NextResponse.json(
        { error: 'Academy/Coaching fee structure must have a courseId' },
        { status: 400 }
      )
    }

    // ✅ Calculate mandatory amount
    const mandatoryTotal = body.items
      .filter((i: any) => !i.isOptional)
      .reduce((s: number, i: any) => s + Number(i.amount), 0)

    // ── Create structure ──
    const structure = await FeeStructure.create({
      tenantId: session.user.tenantId,
      institutionType,  // ✅ Set institution type
      name: body.name,
      
      // ✅ School fields
      ...(institutionType === 'school' && {
        class: body.class,
        section: body.section || 'all',
        stream: body.stream || '',
      }),
      
      // ✅ Academy/Coaching fields
      ...(institutionType !== 'school' && {
        courseId: body.courseId,
      }),
      
      // Common fields
      academicYear: body.academicYear ?? 
        `${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(-2)}`,
      term: body.term ?? 'Term 1',
      items: body.items,
      totalAmount: mandatoryTotal,
      dueDate: new Date(body.dueDate),
      lateFinePerDay: Number(body.lateFinePerDay) || 0,
      lateFineType: body.lateFineType || 'fixed',
      maxLateFine: Number(body.maxLateFine) || 0,
      isActive: true,
      autoAssign: body.autoAssign !== false,
      createdBy: session.user.id,
    })

    // ── Auto-assign fees ──
    let feesCreated = 0

    if (body.autoAssign !== false) {
      
      // ✅ SCHOOL AUTO-ASSIGN
      if (institutionType === 'school') {
        const studentQuery: any = {
          tenantId: session.user.tenantId,
          status: 'active',
          academicYear: body.academicYear,
        }
        
        if (body.class !== 'all') {
          studentQuery.class = { 
            $in: body.class.split(',').map((c: string) => c.trim()) 
          }
        }
        
        if (body.section && body.section !== 'all') {
          studentQuery.section = body.section
        }
        
        if (body.stream) {
          studentQuery.stream = body.stream
        }

        const students = await Student.find(studentQuery).select('_id').lean()

        if (students.length > 0) {
          const ops = students.map(s => ({
            insertOne: {
              document: {
                tenantId: session.user.tenantId,
                studentId: s._id,
                institutionType: 'school',
                structureId: structure._id,
                amount: mandatoryTotal,
                discount: 0,
                lateFine: 0,
                finalAmount: mandatoryTotal,
                dueDate: new Date(body.dueDate),
                status: 'pending',
                paidAmount: 0,
                academicYear: body.academicYear,
              },
            },
          }))
          await Fee.bulkWrite(ops)
          feesCreated = students.length
        }
      }
      
      // ✅ ACADEMY/COACHING AUTO-ASSIGN
      else {
        // Get all active enrollments for this course
        const enrollmentQuery: any = {
          tenantId: session.user.tenantId,
          courseId: body.courseId,
          status: 'active',
        }

        const enrollments = await Enrollment.find(enrollmentQuery)
          .populate('studentId', '_id')
          .lean() as any[]

        if (enrollments.length > 0) {
          const ops = enrollments.map(e => ({
            insertOne: {
              document: {
                tenantId: session.user.tenantId,
                studentId: e.studentId._id,
                institutionType,
                courseId: body.courseId,
                batchId: e.batchId,
                enrollmentId: e._id,
                structureId: structure._id,
                amount: mandatoryTotal,
                discount: 0,
                lateFine: 0,
                finalAmount: mandatoryTotal,
                dueDate: new Date(body.dueDate),
                status: 'pending',
                paidAmount: 0,
                academicYear: body.academicYear,
              },
            },
          }))
          await Fee.bulkWrite(ops)
          feesCreated = enrollments.length
        }
      }
    }

    return NextResponse.json({ 
      structure, 
      feesCreated,
      institutionType,
    }, { status: 201 })

  } catch (err: any) {
    console.error('[FeeStructure POST Error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}