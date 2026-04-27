// FILE: src/app/api/courses/route.ts
// PRODUCTION READY — Complete CRUD with filters
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard, apiGuardWithBody } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { Course } from '@/models/Course'
import { School } from '@/models/School'
import { Enrollment } from '@/models/Enrollment'

/* ══════════════════════════════════════════════
   GET /api/courses
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
            { error: 'Courses are only available for academies and coaching institutes' },
            { status: 403 }
        )
    }

    const { searchParams } = req.nextUrl
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const query: any = {
        tenantId: session.user.tenantId,
        institutionType: school.institutionType,
    }

    if (category) query.category = category
    if (isActive !== null) query.isActive = isActive === 'true'
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { code: { $regex: search, $options: 'i' } },
            { category: { $regex: search, $options: 'i' } },
        ]
    }

    const [courses, total] = await Promise.all([
        Course.find(query)
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Course.countDocuments(query),
    ])

    // ── Get enrollment counts for each course ──
    const coursesWithStats = await Promise.all(
        courses.map(async (course: any) => {
            const enrollmentCount = await Enrollment.countDocuments({
                tenantId: session.user.tenantId,
                courseId: course._id,
                status: { $in: ['active', 'completed'] },
            })

            return {
                ...course,
                enrollmentCount,
            }
        })
    )

    return NextResponse.json({
        courses: coursesWithStats,
        total,
        page,
        pages: Math.ceil(total / limit),
    })
}

/* ══════════════════════════════════════════════
   POST /api/courses
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
            { error: 'Courses are only for academies and coaching institutes' },
            { status: 403 }
        )
    }

    // ── Validation ──
    if (!body.name?.trim()) {
        return NextResponse.json(
            { error: 'Course name is required' },
            { status: 400 }
        )
    }

    if (!body.code?.trim()) {
        return NextResponse.json(
            { error: 'Course code is required' },
            { status: 400 }
        )
    }

    if (!body.category?.trim()) {
        return NextResponse.json(
            { error: 'Category is required' },
            { status: 400 }
        )
    }

    if (!body.feeAmount || body.feeAmount < 0) {
        return NextResponse.json(
            { error: 'Valid fee amount is required' },
            { status: 400 }
        )
    }

    if (!body.durationValue || body.durationValue < 1) {
        return NextResponse.json(
            { error: 'Valid duration is required' },
            { status: 400 }
        )
    }

    // ── Check duplicate code ──
    const existing = await Course.findOne({
        tenantId: session.user.tenantId,
        code: body.code.toUpperCase().trim(),
    })

    if (existing) {
        return NextResponse.json(
            { error: `Course code "${body.code}" already exists` },
            { status: 409 }
        )
    }

    // ── Installment validation ──
    if (body.feeType === 'installment') {
        if (!body.installments?.number || body.installments.number < 2) {
            return NextResponse.json(
                { error: 'Installment plan requires at least 2 installments' },
                { status: 400 }
            )
        }
        if (!body.installments?.dueDay || body.installments.dueDay < 1 || body.installments.dueDay > 28) {
            return NextResponse.json(
                { error: 'Installment due day must be between 1 and 28' },
                { status: 400 }
            )
        }
        // Auto-calculate installment amount
        body.installments.amount = Math.ceil(body.feeAmount / body.installments.number)
    }

    // ── Create course ──
    const course = await Course.create({
        tenantId: session.user.tenantId,
        institutionType: school.institutionType,
        name: body.name.trim(),
        code: body.code.toUpperCase().trim(),
        category: body.category.trim(),
        durationType: body.durationType || 'months',
        durationValue: body.durationValue,
        customDurationText: body.customDurationText?.trim(),
        feeAmount: body.feeAmount,
        feeType: body.feeType || 'one-time',
        installments: body.installments,
        description: body.description?.trim() || '',
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
        {
            course,
            message: 'Course created successfully',
        },
        { status: 201 }
    )
}