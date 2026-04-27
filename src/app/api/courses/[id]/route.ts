// FILE: src/app/api/courses/[id]/route.ts
// Single course GET, PUT, DELETE
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard, apiGuardWithBody } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { Course } from '@/models/Course'
import { Batch } from '@/models/Batch'
import { Enrollment } from '@/models/Enrollment'
import { School } from '@/models/School'
import mongoose from 'mongoose'

/* ══════════════════════════════════════════════
   GET /api/courses/[id]
   ══════════════════════════════════════════════ */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
    }

    const guard = await apiGuard(req, {
        allowedRoles: ['admin', 'staff', 'teacher'],
    })
    if (guard instanceof NextResponse) return guard

    const { session } = guard
    await connectDB()

    const course = await Course.findOne({
        _id: id,
        tenantId: session.user.tenantId,
    })
        .populate('createdBy', 'name email')
        .lean()

    if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // ── Get statistics ──
    const [batchCount, enrollmentCount, activeEnrollments] = await Promise.all([
        Batch.countDocuments({
            tenantId: session.user.tenantId,
            courseId: id,
        }),
        Enrollment.countDocuments({
            tenantId: session.user.tenantId,
            courseId: id,
        }),
        Enrollment.countDocuments({
            tenantId: session.user.tenantId,
            courseId: id,
            status: 'active',
        }),
    ])

    return NextResponse.json({
        course: {
            ...course,
            stats: {
                batchCount,
                totalEnrollments: enrollmentCount,
                activeEnrollments,
            },
        },
    })
}

/* ══════════════════════════════════════════════
   PUT /api/courses/[id]
   ══════════════════════════════════════════════ */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
    }

    const guard = await apiGuardWithBody(req, {
        allowedRoles: ['admin'],
    })
    if (guard instanceof NextResponse) return guard

    const { session, body } = guard
    await connectDB()

    // ── Check course exists ──
    const course = await Course.findOne({
        _id: id,
        tenantId: session.user.tenantId,
    })

    if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // ── If code is being changed, check duplicate ──
    if (body.code && body.code.toUpperCase() !== course.code) {
        const existing = await Course.findOne({
            tenantId: session.user.tenantId,
            code: body.code.toUpperCase().trim(),
            _id: { $ne: id },
        })

        if (existing) {
            return NextResponse.json(
                { error: `Course code "${body.code}" already exists` },
                { status: 409 }
            )
        }
    }

    // ── Installment validation ──
    if (body.feeType === 'installment' && body.installments) {
        if (body.installments.number < 2) {
            return NextResponse.json(
                { error: 'Installment plan requires at least 2 installments' },
                { status: 400 }
            )
        }
        if (body.installments.dueDay < 1 || body.installments.dueDay > 28) {
            return NextResponse.json(
                { error: 'Installment due day must be between 1 and 28' },
                { status: 400 }
            )
        }
        // Auto-calculate
        const feeAmount = body.feeAmount || course.feeAmount
        body.installments.amount = Math.ceil(feeAmount / body.installments.number)
    }

    // ── Update course ──
    const updated = await Course.findByIdAndUpdate(
        id,
        {
            $set: {
                ...(body.name && { name: body.name.trim() }),
                ...(body.code && { code: body.code.toUpperCase().trim() }),
                ...(body.category && { category: body.category.trim() }),
                ...(body.durationType && { durationType: body.durationType }),
                ...(body.durationValue && { durationValue: body.durationValue }),
                ...(body.customDurationText !== undefined && {
                    customDurationText: body.customDurationText?.trim(),
                }),
                ...(body.feeAmount !== undefined && { feeAmount: body.feeAmount }),
                ...(body.feeType && { feeType: body.feeType }),
                ...(body.installments && { installments: body.installments }),
                ...(body.description !== undefined && {
                    description: body.description?.trim() || '',
                }),
                ...(body.syllabus && { syllabus: body.syllabus }),
                ...(body.prerequisites && { prerequisites: body.prerequisites }),
                ...(body.learningOutcomes && { learningOutcomes: body.learningOutcomes }),
                ...(body.maxStudents !== undefined && { maxStudents: body.maxStudents }),
                ...(body.minStudents !== undefined && { minStudents: body.minStudents }),
                ...(body.isActive !== undefined && { isActive: body.isActive }),
                ...(body.certificateEligible !== undefined && {
                    certificateEligible: body.certificateEligible,
                }),
                ...(body.certificateTemplate !== undefined && {
                    certificateTemplate: body.certificateTemplate,
                }),
            },
        },
        { new: true }
    )

    return NextResponse.json({
        course: updated,
        message: 'Course updated successfully',
    })
}

/* ══════════════════════════════════════════════
   DELETE /api/courses/[id]
   ══════════════════════════════════════════════ */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
    }

    const guard = await apiGuard(req, {
        allowedRoles: ['admin'],
    })
    if (guard instanceof NextResponse) return guard

    const { session } = guard
    await connectDB()

    // ── Check course exists ──
    const course = await Course.findOne({
        _id: id,
        tenantId: session.user.tenantId,
    })

    if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // ── Check if course has active enrollments ──
    const activeEnrollments = await Enrollment.countDocuments({
        tenantId: session.user.tenantId,
        courseId: id,
        status: 'active',
    })

    if (activeEnrollments > 0) {
        return NextResponse.json(
            {
                error: `Cannot delete course with ${activeEnrollments} active enrollments`,
                message: 'Please complete or transfer all enrollments first',
            },
            { status: 409 }
        )
    }

    // ── Check if course has batches ──
    const batchCount = await Batch.countDocuments({
        tenantId: session.user.tenantId,
        courseId: id,
        status: { $in: ['upcoming', 'ongoing'] },
    })

    if (batchCount > 0) {
        return NextResponse.json(
            {
                error: `Cannot delete course with ${batchCount} upcoming/ongoing batches`,
                message: 'Please complete or cancel all batches first',
            },
            { status: 409 }
        )
    }

    // ── Soft delete (mark as inactive) ──
    await Course.findByIdAndUpdate(id, {
        $set: { isActive: false },
    })

    return NextResponse.json({
        success: true,
        message: 'Course marked as inactive',
    })
}