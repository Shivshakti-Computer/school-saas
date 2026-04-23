// FILE: src/app/api/courses/route.ts
// Manage courses (Academy/Coaching only)
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard, apiGuardWithBody } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { Course } from '@/models/Course'
import { School } from '@/models/School'

export async function GET(req: NextRequest) {
    const guard = await apiGuard(req, {
        allowedRoles: ['admin', 'staff'],
    })
    if (guard instanceof NextResponse) return guard

    const { session } = guard
    await connectDB()

    // Check institution type
    const school = await School.findById(session.user.tenantId)
        .select('institutionType').lean() as any

    if (!school || school.institutionType === 'school') {
        return NextResponse.json(
            { error: 'Courses are only available for academies and coaching institutes' },
            { status: 403 }
        )
    }

    const { searchParams } = req.nextUrl
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')

    const query: any = {
        tenantId: session.user.tenantId,
        institutionType: school.institutionType,
    }

    if (category) query.category = category
    if (isActive !== null) query.isActive = isActive === 'true'

    const courses = await Course.find(query)
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .lean()

    return NextResponse.json({ courses })
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
            { error: 'Courses are only for academies and coaching institutes' },
            { status: 403 }
        )
    }

    // Validation
    if (!body.name || !body.code || !body.category || !body.feeAmount) {
        return NextResponse.json(
            { error: 'name, code, category, and feeAmount are required' },
            { status: 400 }
        )
    }

    // Check duplicate code
    const existing = await Course.findOne({
        tenantId: session.user.tenantId,
        code: body.code.toUpperCase(),
    })

    if (existing) {
        return NextResponse.json(
            { error: `Course code ${body.code} already exists` },
            { status: 409 }
        )
    }

    const course = await Course.create({
        tenantId: session.user.tenantId,
        institutionType: school.institutionType,
        name: body.name,
        code: body.code.toUpperCase(),
        category: body.category,
        durationType: body.durationType || 'months',
        durationValue: body.durationValue || 3,
        customDurationText: body.customDurationText,
        feeAmount: body.feeAmount,
        feeType: body.feeType || 'one-time',
        installments: body.installments,
        description: body.description || '',
        syllabus: body.syllabus || [],
        prerequisites: body.prerequisites || [],
        learningOutcomes: body.learningOutcomes || [],
        maxStudents: body.maxStudents,
        minStudents: body.minStudents,
        isActive: body.isActive !== false,
        certificateEligible: body.certificateEligible !== false,
        certificateTemplate: body.certificateTemplate,
        createdBy: session.user.id,
    })

    return NextResponse.json(
        { course, message: 'Course created successfully' },
        { status: 201 }
    )
}