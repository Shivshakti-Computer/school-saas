// FILE: src/app/api/notices/[id]/route.ts
// Single notice operations
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard, apiGuardWithBody } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { Notice } from '@/models/Notice'
import { logAudit, logDataChange } from '@/lib/audit'
import { updateNoticeSchema } from '@/lib/validators/notice'

// ✅ FIXED: params is now a Promise in Next.js 15
interface RouteContext {
    params: Promise<{ id: string }>
}

// ══════════════════════════════════════════════════════════
// GET — Single Notice
// ══════════════════════════════════════════════════════════

export async function GET(
    req: NextRequest,
    context: RouteContext
) {
    const guard = await apiGuard(req, {
        allowedRoles: ['admin', 'teacher', 'staff', 'student', 'parent'],
        rateLimit: 'api',
    })

    if (guard instanceof NextResponse) return guard
    const { session } = guard

    try {
        await connectDB()

        // ✅ FIXED: Await params
        const { id } = await context.params

        const notice = await Notice.findOne({
            _id: id,
            tenantId: session.user.tenantId,
            isActive: true,
        }).lean()

        if (!notice) {
            return NextResponse.json(
                { error: 'Notice not found' },
                { status: 404 }
            )
        }

        // Check access for non-admins
        if (session.user.role !== 'admin' && session.user.role !== 'superadmin') {
            const hasAccess =
                notice.targetRole === 'all' ||
                notice.targetRole === session.user.role

            if (!hasAccess) {
                return NextResponse.json(
                    { error: 'Access denied' },
                    { status: 403 }
                )
            }
        }

        return NextResponse.json({ notice })

    } catch (err: any) {
        console.error('Notice GET error:', err)
        return NextResponse.json(
            { error: err.message },
            { status: 500 }
        )
    }
}

// ══════════════════════════════════════════════════════════
// PATCH — Update Notice
// ══════════════════════════════════════════════════════════

export async function PATCH(
    req: NextRequest,
    context: RouteContext
) {
    const guard = await apiGuardWithBody(req, {
        allowedRoles: ['admin', 'teacher', 'staff'],
        rateLimit: 'mutation',
        requiredModules: ['notices'],
    })

    if (guard instanceof NextResponse) return guard
    const { session, body, clientInfo } = guard

    try {
        await connectDB()

        // ✅ FIXED: Await params
        const { id } = await context.params

        // ── Find Existing Notice ──
        const existing = await Notice.findOne({
            _id: id,
            tenantId: session.user.tenantId,
            isActive: true,
        })

        if (!existing) {
            return NextResponse.json(
                { error: 'Notice not found' },
                { status: 404 }
            )
        }

        // ── Permission Check (non-admin can only edit own notices) ──
        if (session.user.role !== 'admin') {
            if (existing.createdBy.toString() !== session.user.id) {
                return NextResponse.json(
                    { error: 'You can only edit your own notices' },
                    { status: 403 }
                )
            }
        }

        // ── Validate Update Data ──
        const validated = updateNoticeSchema.parse(body)

        // ── Store Previous Data for Audit ──
        const previousData = existing.toObject()

        // ── Update Notice ──
        Object.assign(existing, validated)

        // If status changed to published, set publishedAt
        if (validated.status === 'published' && !existing.publishedAt) {
            existing.publishedAt = new Date()
        }

        await existing.save()

        // ── Audit Log ──
        await logDataChange(
            'UPDATE',
            'Notice',
            existing._id.toString(),
            `Updated notice: ${existing.title}`,
            session,
            clientInfo.ip,
            previousData,
            existing.toObject()
        )

        const updated = await Notice.findById(existing._id).lean()

        return NextResponse.json({ notice: updated })

    } catch (err: any) {
        console.error('Notice PATCH error:', err)

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
// DELETE — Soft Delete Notice
// ══════════════════════════════════════════════════════════

export async function DELETE(
    req: NextRequest,
    context: RouteContext
) {
    const guard = await apiGuard(req, {
        allowedRoles: ['admin'],
        rateLimit: 'mutation',
        requiredModules: ['notices'],
    })

    if (guard instanceof NextResponse) return guard
    const { session, clientInfo } = guard

    try {
        await connectDB()

        // ✅ FIXED: Await params
        const { id } = await context.params

        const notice = await Notice.findOne({
            _id: id,
            tenantId: session.user.tenantId,
            isActive: true,
        })

        if (!notice) {
            return NextResponse.json(
                { error: 'Notice not found' },
                { status: 404 }
            )
        }

        // Soft delete
        notice.isActive = false
        await notice.save()

        // Audit log
        await logDataChange(
            'DELETE',
            'Notice',
            notice._id.toString(),
            `Deleted notice: ${notice.title}`,
            session,
            clientInfo.ip,
            notice.toObject(),
            { isActive: false }
        )

        return NextResponse.json({
            success: true,
            message: 'Notice deleted successfully'
        })

    } catch (err: any) {
        console.error('Notice DELETE error:', err)
        return NextResponse.json(
            { error: err.message },
            { status: 500 }
        )
    }
}