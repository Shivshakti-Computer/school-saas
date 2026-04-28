// FILE: src/app/api/enrollments/route.ts
// PRODUCTION READY — Enrollment management with fee integration
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard, apiGuardWithBody } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { Enrollment } from '@/models/Enrollment'
import '@/models/Franchise'
import { Student } from '@/models/Student'
import { Batch } from '@/models/Batch'
import { Course } from '@/models/Course'
import { School } from '@/models/School'
import { Fee } from '@/models/Fee'
import { getCurrentAcademicYear } from '@/lib/admissionUtils'

/* ══════════════════════════════════════════════
   Helper — Generate Enrollment Number
   ══════════════════════════════════════════════ */
async function generateEnrollmentNo(
    tenantId: string,
    schoolCode: string,
    academicYear: string
): Promise<string> {
    const lastEnrollment = await Enrollment.findOne({ tenantId })
        .sort({ createdAt: -1 })
        .select('enrollmentNo')
        .lean() as { enrollmentNo?: string } | null

    let seq = 1
    if (lastEnrollment?.enrollmentNo) {
        const parts = lastEnrollment.enrollmentNo.split('/')
        const lastSeq = parseInt(parts[parts.length - 1] || '0') || 0
        seq = lastSeq + 1
    }

    return `${schoolCode}/ENR/${academicYear}/${String(seq).padStart(4, '0')}`
}

/* ══════════════════════════════════════════════
   GET /api/enrollments
   ══════════════════════════════════════════════ */
export async function GET(req: NextRequest) {
    const guard = await apiGuard(req, {
        allowedRoles: ['admin', 'staff', 'teacher'],
    })
    if (guard instanceof NextResponse) return guard

    const { session } = guard
    await connectDB()

    // ── Institution type check ──
    const school = await School.findById(session.user.tenantId)
        .select('institutionType').lean() as any

    if (!school || school.institutionType === 'school') {
        return NextResponse.json(
            { error: 'Enrollments are only for academies and coaching institutes' },
            { status: 403 }
        )
    }

    const { searchParams } = req.nextUrl
    const studentId = searchParams.get('studentId')
    const batchId = searchParams.get('batchId')
    const courseId = searchParams.get('courseId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const query: any = { tenantId: session.user.tenantId }
    if (studentId) query.studentId = studentId
    if (batchId) query.batchId = batchId
    if (courseId) query.courseId = courseId
    if (status) query.status = status
    if (search) {
        query.enrollmentNo = { $regex: search, $options: 'i' }
    }

    const [enrollments, total] = await Promise.all([
        Enrollment.find(query)
            .populate({
                path: 'studentId',
                select: 'admissionNo userId',
                populate: {
                    path: 'userId',
                    select: 'name phone email',
                },
            })
            .populate('courseId', 'name code feeAmount durationType durationValue')
            .populate('batchId', 'batchCode batchName')
            .populate('franchiseId', 'name code')
            .sort({ enrollmentDate: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Enrollment.countDocuments(query),
    ])

    return NextResponse.json({
        enrollments,
        total,
        page,
        pages: Math.ceil(total / limit),
    })
}

/* ══════════════════════════════════════════════
   POST /api/enrollments — Enroll Student
   ══════════════════════════════════════════════ */
export async function POST(req: NextRequest) {
    const guard = await apiGuardWithBody(req, {
        allowedRoles: ['admin'],
    })
    if (guard instanceof NextResponse) return guard

    const { session, body } = guard
    await connectDB()

    // ── Institution type check ──
    const school = await School.findById(session.user.tenantId)
        .select('institutionType subdomain').lean() as any

    if (!school || school.institutionType === 'school') {
        return NextResponse.json(
            { error: 'Enrollments are only for academies and coaching institutes' },
            { status: 403 }
        )
    }

    // ── Validation ──
    if (!body.studentId) {
        return NextResponse.json({ error: 'Student is required' }, { status: 400 })
    }

    if (!body.batchId) {
        return NextResponse.json({ error: 'Batch is required' }, { status: 400 })
    }

    if (!body.courseId) {
        return NextResponse.json({ error: 'Course is required' }, { status: 400 })
    }

    // ── Check student exists ──
    const student = await Student.findOne({
        _id: body.studentId,
        tenantId: session.user.tenantId,
        status: 'active',
    })

    if (!student) {
        return NextResponse.json(
            { error: 'Student not found or inactive' },
            { status: 404 }
        )
    }

    // ── Check course exists ──
    const course = await Course.findOne({
        _id: body.courseId,
        tenantId: session.user.tenantId,
        isActive: true,
    })

    if (!course) {
        return NextResponse.json(
            { error: 'Course not found or inactive' },
            { status: 404 }
        )
    }

    // ── Check batch exists and has capacity ──
    const batch = await Batch.findOne({
        _id: body.batchId,
        tenantId: session.user.tenantId,
        courseId: body.courseId,
    })

    if (!batch) {
        return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    if (batch.status === 'cancelled') {
        return NextResponse.json({ error: 'Cannot enroll in cancelled batch' }, { status: 400 })
    }

    if (batch.status === 'completed') {
        return NextResponse.json({ error: 'Cannot enroll in completed batch' }, { status: 400 })
    }

    // ✅ Capacity check — strict
    if (batch.currentEnrollments >= batch.maxStudents) {
        return NextResponse.json(
            {
                error: 'Batch is full',
                message: `Maximum capacity (${batch.maxStudents}) reached. Please upgrade plan or purchase student add-on.`,
                currentEnrollments: batch.currentEnrollments,
                maxStudents: batch.maxStudents,
            },
            { status: 409 }
        )
    }

    // ── Check duplicate enrollment ──
    const existingEnrollment = await Enrollment.findOne({
        tenantId: session.user.tenantId,
        studentId: body.studentId,
        batchId: body.batchId,
        status: { $in: ['active', 'completed'] },
    })

    if (existingEnrollment) {
        return NextResponse.json(
            { error: 'Student already enrolled in this batch' },
            { status: 409 }
        )
    }

    // ── Calculate expected end date ──
    const enrollmentDate = body.enrollmentDate
        ? new Date(body.enrollmentDate)
        : new Date()

    let expectedEndDate = new Date(batch.endDate)

    if (course.durationType !== 'custom') {
        const daysToAdd =
            course.durationType === 'days'
                ? course.durationValue
                : course.durationType === 'weeks'
                    ? course.durationValue * 7
                    : course.durationValue * 30

        expectedEndDate = new Date(enrollmentDate)
        expectedEndDate.setDate(expectedEndDate.getDate() + daysToAdd)
    }

    // ── Generate enrollment number ──
    const academicYear = getCurrentAcademicYear()
    const schoolCode = school.subdomain.toUpperCase().slice(0, 3)
    const enrollmentNo = await generateEnrollmentNo(
        session.user.tenantId,
        schoolCode,
        academicYear
    )

    // ── Create enrollment ──
    const enrollment = await Enrollment.create({
        tenantId: session.user.tenantId,
        studentId: body.studentId,
        courseId: body.courseId,
        batchId: body.batchId,
        enrollmentNo,
        enrollmentDate,
        startDate: enrollmentDate,
        expectedEndDate,
        totalFee: course.feeAmount,
        paidAmount: 0,
        dueAmount: course.feeAmount,
        feesPaid: false,
        status: 'active',
        completionPercentage: 0,
        attendancePercentage: 0,
        certificateIssued: false,
        franchiseId: body.franchiseId || null,
    })

    // ── Update student record ──
    await Student.findByIdAndUpdate(body.studentId, {
        $set: {
            currentBatch: body.batchId,
            currentCourse: body.courseId,
        },
        $push: {
            enrollments: enrollment._id,
        },
    })

    // ── Update batch enrollment count ──
    await Batch.findByIdAndUpdate(body.batchId, {
        $inc: { currentEnrollments: 1 },
    })

    // ✅ Fee Auto-Assignment (Course-based)
    if (course.feeType === 'one-time') {
        // Single fee entry
        await Fee.create({
            tenantId: session.user.tenantId,
            studentId: body.studentId,
            // structureId not needed for academy/coaching
            amount: course.feeAmount,
            discount: 0,
            lateFine: 0,
            finalAmount: course.feeAmount,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            status: 'pending',
            paidAmount: 0,
            academicYear,
            // Custom metadata
            courseId: course._id,
            batchId: batch._id,
            enrollmentId: enrollment._id,
        })
    } else if (course.feeType === 'installment' && course.installments) {
        // Multiple installments
        const installmentDocs = []
        const installmentAmount = course.installments.amount
        const dueDay = course.installments.dueDay

        for (let i = 0; i < course.installments.number; i++) {
            const dueDate = new Date()
            dueDate.setMonth(dueDate.getMonth() + i)
            dueDate.setDate(Math.min(dueDay, 28))

            installmentDocs.push({
                tenantId: session.user.tenantId,
                studentId: body.studentId,
                amount: installmentAmount,
                discount: 0,
                lateFine: 0,
                finalAmount: installmentAmount,
                dueDate,
                status: 'pending',
                paidAmount: 0,
                academicYear,
                courseId: course._id,
                batchId: batch._id,
                enrollmentId: enrollment._id,
            })
        }

        await Fee.insertMany(installmentDocs)
    } else if (course.feeType === 'monthly') {
        // Monthly fee for course duration
        const monthlyAmount = Math.ceil(
            course.feeAmount / (course.durationValue || 1)
        )

        const monthlyDocs = []
        for (let i = 0; i < (course.durationValue || 1); i++) {
            const dueDate = new Date()
            dueDate.setMonth(dueDate.getMonth() + i)
            dueDate.setDate(1)

            monthlyDocs.push({
                tenantId: session.user.tenantId,
                studentId: body.studentId,
                amount: monthlyAmount,
                discount: 0,
                lateFine: 0,
                finalAmount: monthlyAmount,
                dueDate,
                status: 'pending',
                paidAmount: 0,
                academicYear,
                courseId: course._id,
                batchId: batch._id,
                enrollmentId: enrollment._id,
            })
        }

        await Fee.insertMany(monthlyDocs)
    }

    return NextResponse.json(
        {
            enrollment,
            message: 'Student enrolled successfully',
            enrollmentNo,
            feeAssigned: true,
        },
        { status: 201 }
    )
}