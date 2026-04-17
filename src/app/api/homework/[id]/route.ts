// FILE: src/app/api/homework/[id]/route.ts
// ═══════════════════════════════════════════════════════════
// Single Homework — View, Update, Delete
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard, apiGuardWithBody } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { Homework } from '@/models/Homework'
import { logAudit, logDataChange } from '@/lib/audit'
import { updateHomeworkSchema } from '@/lib/validators/homework'

interface RouteContext {
    params: Promise<{ id: string }>
}

// ══════════════════════════════════════════════════════════
// GET — Single Homework
// ══════════════════════════════════════════════════════════

export async function GET(
    req: NextRequest,
    context: RouteContext
) {
    const guard = await apiGuard(req, {
        allowedRoles: ['admin', 'teacher', 'staff', 'student', 'parent'],
        rateLimit: 'api',
        requiredModules: ['homework'],
    })

    if (guard instanceof NextResponse) return guard
    const { session } = guard

    try {
        await connectDB()

        const { id } = await context.params

        const homework = await Homework.findOne({
            _id: id,
            tenantId: session.user.tenantId,
            isActive: true,
        }).lean()

        if (!homework) {
            return NextResponse.json(
                { error: 'Homework not found' },
                { status: 404 }
            )
        }

        // Role-based access
        if (session.user.role === 'teacher') {
            if (homework.createdBy.toString() !== session.user.id) {
                return NextResponse.json(
                    { error: 'Access denied' },
                    { status: 403 }
                )
            }
        }

        // Student: only show their submission
        if (session.user.role === 'student') {
            const studentSubmission = homework.submissions.find(
                (s: any) => s.studentId.toString() === session.user.id
            )

            return NextResponse.json({
                homework: {
                    ...homework,
                    submissions: studentSubmission ? [studentSubmission] : [],
                },
            })
        }

        // Parent: only show child's submission
        if (session.user.role === 'parent') {
            // Get child ID from query or session
            const childId = req.nextUrl.searchParams.get('childId')
            if (!childId) {
                return NextResponse.json(
                    { error: 'Child ID required' },
                    { status: 400 }
                )
            }

            const childSubmission = homework.submissions.find(
                (s: any) => s.studentId.toString() === childId
            )

            return NextResponse.json({
                homework: {
                    ...homework,
                    submissions: childSubmission ? [childSubmission] : [],
                },
            })
        }

        return NextResponse.json({ homework })

    } catch (err: any) {
        console.error('Homework GET error:', err)
        return NextResponse.json(
            { error: err.message },
            { status: 500 }
        )
    }
}

// ══════════════════════════════════════════════════════════
// PATCH — Update Homework
// ══════════════════════════════════════════════════════════

export async function PATCH(
    req: NextRequest,
    context: RouteContext
) {
    const guard = await apiGuardWithBody(req, {
        allowedRoles: ['admin', 'teacher'],
        rateLimit: 'mutation',
        requiredModules: ['homework'],
    })

    if (guard instanceof NextResponse) return guard
    const { session, body, clientInfo } = guard

    try {
        await connectDB()

        const { id } = await context.params

        const existing = await Homework.findOne({
            _id: id,
            tenantId: session.user.tenantId,
            isActive: true,
        })

        if (!existing) {
            return NextResponse.json(
                { error: 'Homework not found' },
                { status: 404 }
            )
        }

        // Permission check
        if (session.user.role === 'teacher') {
            if (existing.createdBy.toString() !== session.user.id) {
                return NextResponse.json(
                    { error: 'You can only edit your own homework' },
                    { status: 403 }
                )
            }
        }

        const validated = updateHomeworkSchema.parse(body)
        const previousData = existing.toObject()

        // Update fields
        Object.assign(existing, validated)
        await existing.save()

        // Audit log
        await logDataChange(
            'UPDATE',
            'Homework',
            existing._id.toString(),
            `Updated homework: ${existing.title}`,
            session,
            clientInfo.ip,
            previousData,
            existing.toObject()
        )

        const updated = await Homework.findById(existing._id).lean()

        return NextResponse.json({ homework: updated })

    } catch (err: any) {
        console.error('Homework PATCH error:', err)

        if (err.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation failed', details: err.errors },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: err.message },
            { status: 500 }
        )
    }
}

// ══════════════════════════════════════════════════════════
// DELETE — Soft Delete Homework
// ══════════════════════════════════════════════════════════

export async function DELETE(
    req: NextRequest,
    context: RouteContext
) {
    const guard = await apiGuard(req, {
        allowedRoles: ['admin', 'teacher'],
        rateLimit: 'mutation',
        requiredModules: ['homework'],
    })

    if (guard instanceof NextResponse) return guard
    const { session, clientInfo } = guard

    try {
        await connectDB()

        const { id } = await context.params

        const homework = await Homework.findOne({
            _id: id,
            tenantId: session.user.tenantId,
            isActive: true,
        })

        if (!homework) {
            return NextResponse.json(
                { error: 'Homework not found' },
                { status: 404 }
            )
        }

        // Permission check
        if (session.user.role === 'teacher') {
            if (homework.createdBy.toString() !== session.user.id) {
                return NextResponse.json(
                    { error: 'You can only delete your own homework' },
                    { status: 403 }
                )
            }
        }

        homework.isActive = false
        homework.status = 'archived'
        await homework.save()

        // Audit log
        await logDataChange(
            'DELETE',
            'Homework',
            homework._id.toString(),
            `Deleted homework: ${homework.title}`,
            session,
            clientInfo.ip,
            homework.toObject(),
            { isActive: false, status: 'archived' }
        )

        return NextResponse.json({
            success: true,
            message: 'Homework deleted successfully',
        })

    } catch (err: any) {
        console.error('Homework DELETE error:', err)
        return NextResponse.json(
            { error: err.message },
            { status: 500 }
        )
    }
}