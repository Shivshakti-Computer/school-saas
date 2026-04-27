// FILE: src/app/api/batches/[id]/route.ts
// Single batch GET, PUT, DELETE with capacity management
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard, apiGuardWithBody } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { Batch } from '@/models/Batch'
import { Course } from '@/models/Course'
import { Enrollment } from '@/models/Enrollment'
import { Staff } from '@/models/Staff'
import { Student } from '@/models/Student'
import mongoose from 'mongoose'

/* ══════════════════════════════════════════════
   GET /api/batches/[id]
   ══════════════════════════════════════════════ */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ error: 'Invalid batch ID' }, { status: 400 })
    }

    const guard = await apiGuard(req, {
        allowedRoles: ['admin', 'staff', 'teacher'],
    })
    if (guard instanceof NextResponse) return guard

    const { session } = guard
    await connectDB()

    const batch = await Batch.findOne({
        _id: id,
        tenantId: session.user.tenantId,
    })
        .populate('courseId', 'name code feeAmount durationType durationValue')
        .populate('instructorId', 'fullName employeeId phone email')
        .lean()

    if (!batch) {
        return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    // ── Get enrolled students ──
    const enrollments = await Enrollment.find({
        tenantId: session.user.tenantId,
        batchId: id,
        status: { $in: ['active', 'completed'] },
    })
        .populate({
            path: 'studentId',
            select: 'admissionNo userId',
            populate: {
                path: 'userId',
                select: 'name phone email',
            },
        })
        .select('studentId enrollmentNo enrollmentDate status completionPercentage')
        .sort({ enrollmentDate: -1 })
        .lean()

    // ── Statistics ──
    const [activeCount, completedCount, dropoutCount] = await Promise.all([
        Enrollment.countDocuments({
            tenantId: session.user.tenantId,
            batchId: id,
            status: 'active',
        }),
        Enrollment.countDocuments({
            tenantId: session.user.tenantId,
            batchId: id,
            status: 'completed',
        }),
        Enrollment.countDocuments({
            tenantId: session.user.tenantId,
            batchId: id,
            status: 'dropout',
        }),
    ])

    return NextResponse.json({
        batch: {
            ...batch,
            enrollments,
            stats: {
                activeEnrollments: activeCount,
                completedEnrollments: completedCount,
                dropouts: dropoutCount,
                totalEnrolled: activeCount + completedCount + dropoutCount,
                availableSeats: (batch as any).maxStudents - (batch as any).currentEnrollments,
                isFull: (batch as any).currentEnrollments >= (batch as any).maxStudents,
            },
        },
    })
}

/* ══════════════════════════════════════════════
   PUT /api/batches/[id]
   ══════════════════════════════════════════════ */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ error: 'Invalid batch ID' }, { status: 400 })
    }

    const guard = await apiGuardWithBody(req, {
        allowedRoles: ['admin'],
    })
    if (guard instanceof NextResponse) return guard

    const { session, body } = guard
    await connectDB()

    // ── Check batch exists ──
    const batch = await Batch.findOne({
        _id: id,
        tenantId: session.user.tenantId,
    })

    if (!batch) {
        return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    // ── If batch code is being changed, check duplicate ──
    if (body.batchCode && body.batchCode.toUpperCase() !== batch.batchCode) {
        const existing = await Batch.findOne({
            tenantId: session.user.tenantId,
            batchCode: body.batchCode.toUpperCase().trim(),
            _id: { $ne: id },
        })

        if (existing) {
            return NextResponse.json(
                { error: `Batch code "${body.batchCode}" already exists` },
                { status: 409 }
            )
        }
    }

    // ── Capacity validation ──
    if (body.maxStudents !== undefined) {
        if (body.maxStudents < batch.currentEnrollments) {
            return NextResponse.json(
                {
                    error: `Cannot reduce capacity below current enrollments (${batch.currentEnrollments})`,
                },
                { status: 400 }
            )
        }
    }

    // ── Date validation ──
    if (body.startDate || body.endDate) {
        const startDate = body.startDate ? new Date(body.startDate) : batch.startDate
        const endDate = body.endDate ? new Date(body.endDate) : batch.endDate

        if (endDate <= startDate) {
            return NextResponse.json(
                { error: 'End date must be after start date' },
                { status: 400 }
            )
        }
    }

    // ── Instructor validation ──
    if (body.instructorId && body.instructorId !== batch.instructorId.toString()) {
        const instructor = await Staff.findOne({
            _id: body.instructorId,
            tenantId: session.user.tenantId,
            status: { $in: ['active', 'on_leave'] },
        })

        if (!instructor) {
            return NextResponse.json(
                { error: 'Instructor not found or inactive' },
                { status: 404 }
            )
        }
    }

    // ── Auto-update status based on dates ──
    let autoStatus = batch.status
    if (body.startDate || body.endDate) {
        const now = new Date()
        const startDate = body.startDate ? new Date(body.startDate) : batch.startDate
        const endDate = body.endDate ? new Date(body.endDate) : batch.endDate

        if (now < startDate) {
            autoStatus = 'upcoming'
        } else if (now >= startDate && now <= endDate) {
            autoStatus = 'ongoing'
        } else if (now > endDate) {
            autoStatus = 'completed'
        }
    }

    // ── Update batch ──
    const updated = await Batch.findByIdAndUpdate(
        id,
        {
            $set: {
                ...(body.batchCode && { batchCode: body.batchCode.toUpperCase().trim() }),
                ...(body.batchName && { batchName: body.batchName.trim() }),
                ...(body.startDate && { startDate: new Date(body.startDate) }),
                ...(body.endDate && { endDate: new Date(body.endDate) }),
                ...(body.schedule && { schedule: body.schedule }),
                ...(body.maxStudents !== undefined && { maxStudents: body.maxStudents }),
                ...(body.instructorId && { instructorId: body.instructorId }),
                ...(body.status && { status: body.status }),
                ...(!body.status && { status: autoStatus }),
            },
        },
        { new: true }
    )
        .populate('courseId', 'name code')
        .populate('instructorId', 'fullName employeeId')

    return NextResponse.json({
        batch: updated,
        message: 'Batch updated successfully',
    })
}

/* ══════════════════════════════════════════════
   DELETE /api/batches/[id]
   ══════════════════════════════════════════════ */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ error: 'Invalid batch ID' }, { status: 400 })
    }

    const guard = await apiGuard(req, {
        allowedRoles: ['admin'],
    })
    if (guard instanceof NextResponse) return guard

    const { session } = guard
    await connectDB()

    // ── Check batch exists ──
    const batch = await Batch.findOne({
        _id: id,
        tenantId: session.user.tenantId,
    })

    if (!batch) {
        return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    // ── Check if batch has active enrollments ──
    const activeEnrollments = await Enrollment.countDocuments({
        tenantId: session.user.tenantId,
        batchId: id,
        status: 'active',
    })

    if (activeEnrollments > 0) {
        return NextResponse.json(
            {
                error: `Cannot delete batch with ${activeEnrollments} active enrollments`,
                message: 'Please complete or transfer all enrollments first',
            },
            { status: 409 }
        )
    }

    // ── Mark as cancelled instead of hard delete ──
    await Batch.findByIdAndUpdate(id, {
        $set: { status: 'cancelled' },
    })

    return NextResponse.json({
        success: true,
        message: 'Batch cancelled successfully',
    })
}