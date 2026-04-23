// FILE: src/app/api/batches/route.ts
// Manage batches (Academy/Coaching only)
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard, apiGuardWithBody } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { Batch } from '@/models/Batch'
import { Course } from '@/models/Course'
import { School } from '@/models/School'

export async function GET(req: NextRequest) {
    const guard = await apiGuard(req, {
        allowedRoles: ['admin', 'staff', 'teacher'],
    })
    if (guard instanceof NextResponse) return guard

    const { session } = guard
    await connectDB()

    // Check institution type
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

    const query: any = { tenantId: session.user.tenantId }
    if (courseId) query.courseId = courseId
    if (status) query.status = status

    const batches = await Batch.find(query)
        .populate('courseId', 'name code')
        .populate('instructorId', 'fullName employeeId')
        .sort({ startDate: -1 })
        .lean()

    return NextResponse.json({ batches })
}

export async function POST(req: NextRequest) {
    const guard = await apiGuardWithBody(req, {
        allowedRoles: ['admin'],
    })
    if (guard instanceof NextResponse) return guard

    const { session, body } = guard
    await connectDB()

    // Check institution type
    const school = await School.findById(session.user.tenantId)
        .select('institutionType').lean() as any

    if (!school || school.institutionType === 'school') {
        return NextResponse.json(
            { error: 'Batches are only for academies and coaching institutes' },
            { status: 403 }
        )
    }

    // Validation
    if (!body.courseId || !body.batchCode || !body.batchName ||
        !body.startDate || !body.endDate || !body.instructorId) {
        return NextResponse.json(
            { error: 'courseId, batchCode, batchName, startDate, endDate, and instructorId required' },
            { status: 400 }
        )
    }

    // Check course exists
    const course = await Course.findOne({
        _id: body.courseId,
        tenantId: session.user.tenantId,
    })

    if (!course) {
        return NextResponse.json(
            { error: 'Course not found' },
            { status: 404 }
        )
    }

    // Check duplicate batch code
    const existing = await Batch.findOne({
        tenantId: session.user.tenantId,
        batchCode: body.batchCode.toUpperCase(),
    })

    if (existing) {
        return NextResponse.json(
            { error: `Batch code ${body.batchCode} already exists` },
            { status: 409 }
        )
    }

    const batch = await Batch.create({
        tenantId: session.user.tenantId,
        courseId: body.courseId,
        batchCode: body.batchCode.toUpperCase(),
        batchName: body.batchName,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        schedule: body.schedule || {},
        maxStudents: body.maxStudents || 30,
        currentEnrollments: 0,
        instructorId: body.instructorId,
        status: 'upcoming',
    })

    return NextResponse.json(
        { batch, message: 'Batch created successfully' },
        { status: 201 }
    )
}