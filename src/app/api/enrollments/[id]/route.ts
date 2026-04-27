// FILE: src/app/api/enrollments/[id]/route.ts
// Single enrollment GET, PUT (update progress/status)
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard, apiGuardWithBody } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { Enrollment } from '@/models/Enrollment'
import { Student } from '@/models/Student'
import { Batch } from '@/models/Batch'
import mongoose from 'mongoose'

/* ══════════════════════════════════════════════
   GET /api/enrollments/[id]
   ══════════════════════════════════════════════ */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ error: 'Invalid enrollment ID' }, { status: 400 })
    }

    const guard = await apiGuard(req, {
        allowedRoles: ['admin', 'staff', 'teacher'],
    })
    if (guard instanceof NextResponse) return guard

    const { session } = guard
    await connectDB()

    const enrollment = await Enrollment.findOne({
        _id: id,
        tenantId: session.user.tenantId,
    })
        .populate({
            path: 'studentId',
            select: 'admissionNo userId',
            populate: {
                path: 'userId',
                select: 'name phone email',
            },
        })
        .populate('courseId', 'name code feeAmount durationType durationValue certificateEligible')
        .populate('batchId', 'batchCode batchName instructorId')
        .populate('franchiseId', 'name code')
        .lean()

    if (!enrollment) {
        return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    return NextResponse.json({ enrollment })
}

/* ══════════════════════════════════════════════
   PUT /api/enrollments/[id]
   Update progress, status, fees
   ══════════════════════════════════════════════ */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ error: 'Invalid enrollment ID' }, { status: 400 })
    }

    const guard = await apiGuardWithBody(req, {
        allowedRoles: ['admin', 'staff'],
    })
    if (guard instanceof NextResponse) return guard

    const { session, body } = guard
    await connectDB()

    // ── Check enrollment exists ──
    const enrollment = await Enrollment.findOne({
        _id: id,
        tenantId: session.user.tenantId,
    })

    if (!enrollment) {
        return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    // ── Completion percentage validation ──
    if (body.completionPercentage !== undefined) {
        if (body.completionPercentage < 0 || body.completionPercentage > 100) {
            return NextResponse.json(
                { error: 'Completion percentage must be between 0 and 100' },
                { status: 400 }
            )
        }

        // ✅ Auto-complete if 100%
        if (body.completionPercentage === 100 && enrollment.status === 'active') {
            body.status = 'completed'
            body.completionDate = new Date()
        }
    }

    // ── Attendance percentage validation ──
    if (body.attendancePercentage !== undefined) {
        if (body.attendancePercentage < 0 || body.attendancePercentage > 100) {
            return NextResponse.json(
                { error: 'Attendance percentage must be between 0 and 100' },
                { status: 400 }
            )
        }
    }

    // ── Status change validations ──
    if (body.status && body.status !== enrollment.status) {
        if (body.status === 'completed' && !body.completionDate) {
            body.completionDate = new Date()
        }

        if (body.status === 'dropout' && !body.dropoutReason) {
            return NextResponse.json(
                { error: 'Dropout reason is required when marking as dropout' },
                { status: 400 }
            )
        }

        // ✅ Batch enrollment count update
        if (body.status === 'dropout' && enrollment.status === 'active') {
            await Batch.findByIdAndUpdate(enrollment.batchId, {
                $inc: { currentEnrollments: -1 },
            })
        }
    }

    // ── Fee payment tracking ──
    if (body.paidAmount !== undefined) {
        const newDueAmount = enrollment.totalFee - body.paidAmount
        body.dueAmount = newDueAmount
        body.feesPaid = newDueAmount <= 0
    }

    // ── Certificate issuance ──
    if (body.certificateIssued && !enrollment.certificateIssued) {
        body.certificateIssuedAt = new Date()
        if (!body.certificateNo) {
            // Auto-generate certificate number
            const certCount = await Enrollment.countDocuments({
                tenantId: session.user.tenantId,
                certificateIssued: true,
            })
            body.certificateNo = `CERT/${new Date().getFullYear()}/${String(certCount + 1).padStart(5, '0')}`
        }
    }

    // ── Update enrollment ──
    const updated = await Enrollment.findByIdAndUpdate(
        id,
        {
            $set: {
                ...(body.completionPercentage !== undefined && {
                    completionPercentage: body.completionPercentage,
                }),
                ...(body.attendancePercentage !== undefined && {
                    attendancePercentage: body.attendancePercentage,
                }),
                ...(body.status && { status: body.status }),
                ...(body.completionDate && { completionDate: body.completionDate }),
                ...(body.dropoutReason && { dropoutReason: body.dropoutReason }),
                ...(body.remarks !== undefined && { remarks: body.remarks }),
                ...(body.paidAmount !== undefined && { paidAmount: body.paidAmount }),
                ...(body.dueAmount !== undefined && { dueAmount: body.dueAmount }),
                ...(body.feesPaid !== undefined && { feesPaid: body.feesPaid }),
                ...(body.certificateIssued !== undefined && {
                    certificateIssued: body.certificateIssued,
                }),
                ...(body.certificateIssuedAt && {
                    certificateIssuedAt: body.certificateIssuedAt,
                }),
                ...(body.certificateNo && { certificateNo: body.certificateNo }),
            },
        },
        { new: true }
    )
        .populate('studentId', 'admissionNo userId')
        .populate('courseId', 'name code')
        .populate('batchId', 'batchCode batchName')

    // ── Update student's current enrollment status ──
    if (body.status === 'completed' || body.status === 'dropout') {
        await Student.findByIdAndUpdate(enrollment.studentId, {
            $set: {
                currentBatch: null,
                currentCourse: null,
            },
        })
    }

    return NextResponse.json({
        enrollment: updated,
        message: 'Enrollment updated successfully',
    })
}