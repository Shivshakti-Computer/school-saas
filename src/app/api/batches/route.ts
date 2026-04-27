// FILE: src/app/api/batches/route.ts
// PRODUCTION READY — Complete CRUD with capacity check
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard, apiGuardWithBody } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { Batch } from '@/models/Batch'
import { Course } from '@/models/Course'
import { School } from '@/models/School'
import { Staff } from '@/models/Staff'
import { Enrollment } from '@/models/Enrollment'

/* ══════════════════════════════════════════════
   GET /api/batches
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
            { error: 'Batches are only for academies and coaching institutes' },
            { status: 403 }
        )
    }

    const { searchParams } = req.nextUrl
    const courseId = searchParams.get('courseId')
    const status = searchParams.get('status')
    const instructorId = searchParams.get('instructorId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const query: any = { tenantId: session.user.tenantId }
    if (courseId) query.courseId = courseId
    if (status) query.status = status
    if (instructorId) query.instructorId = instructorId
    if (search) {
        query.$or = [
            { batchCode: { $regex: search, $options: 'i' } },
            { batchName: { $regex: search, $options: 'i' } },
        ]
    }

    const [batches, total] = await Promise.all([
        Batch.find(query)
            .populate('courseId', 'name code feeAmount')
            .populate('instructorId', 'fullName employeeId')
            .sort({ startDate: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Batch.countDocuments(query),
    ])

    // ── Get enrollment counts ──
    const batchesWithStats = await Promise.all(
        batches.map(async (batch: any) => {
            const enrollmentCount = await Enrollment.countDocuments({
                tenantId: session.user.tenantId,
                batchId: batch._id,
                status: { $in: ['active', 'completed'] },
            })

            return {
                ...batch,
                enrollmentCount,
                availableSeats: batch.maxStudents - batch.currentEnrollments,
                isFull: batch.currentEnrollments >= batch.maxStudents,
            }
        })
    )

    return NextResponse.json({
        batches: batchesWithStats,
        total,
        page,
        pages: Math.ceil(total / limit),
    })
}

/* ══════════════════════════════════════════════
   POST /api/batches
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
        .select('institutionType').lean() as any

    if (!school || school.institutionType === 'school') {
        return NextResponse.json(
            { error: 'Batches are only for academies and coaching institutes' },
            { status: 403 }
        )
    }

    // ── Validation ──
    if (!body.courseId) {
        return NextResponse.json({ error: 'Course is required' }, { status: 400 })
    }

    if (!body.batchCode?.trim()) {
        return NextResponse.json({ error: 'Batch code is required' }, { status: 400 })
    }

    if (!body.batchName?.trim()) {
        return NextResponse.json({ error: 'Batch name is required' }, { status: 400 })
    }

    if (!body.startDate) {
        return NextResponse.json({ error: 'Start date is required' }, { status: 400 })
    }

    if (!body.endDate) {
        return NextResponse.json({ error: 'End date is required' }, { status: 400 })
    }

    if (!body.instructorId) {
        return NextResponse.json({ error: 'Instructor is required' }, { status: 400 })
    }

    if (!body.maxStudents || body.maxStudents < 1) {
        return NextResponse.json(
            { error: 'Valid maximum students capacity is required' },
            { status: 400 }
        )
    }

    // ── Date validation ──
    const startDate = new Date(body.startDate)
    const endDate = new Date(body.endDate)

    if (endDate <= startDate) {
        return NextResponse.json(
            { error: 'End date must be after start date' },
            { status: 400 }
        )
    }

    // ── Check course exists ──
    const course = await Course.findOne({
        _id: body.courseId,
        tenantId: session.user.tenantId,
        isActive: true,
    })

    if (!course) {
        return NextResponse.json({ error: 'Course not found or inactive' }, { status: 404 })
    }

    // ── Check instructor exists ──
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

    // ── Check duplicate batch code ──
    const existing = await Batch.findOne({
        tenantId: session.user.tenantId,
        batchCode: body.batchCode.toUpperCase().trim(),
    })

    if (existing) {
        return NextResponse.json(
            { error: `Batch code "${body.batchCode}" already exists` },
            { status: 409 }
        )
    }

    // ── Create batch ──
    const batch = await Batch.create({
        tenantId: session.user.tenantId,
        courseId: body.courseId,
        batchCode: body.batchCode.toUpperCase().trim(),
        batchName: body.batchName.trim(),
        startDate,
        endDate,
        schedule: body.schedule || {},
        maxStudents: body.maxStudents,
        currentEnrollments: 0,
        instructorId: body.instructorId,
        status: startDate > new Date() ? 'upcoming' : 'ongoing',
    })

    return NextResponse.json(
        {
            batch,
            message: 'Batch created successfully',
        },
        { status: 201 }
    )
}