// FILE: src/app/api/exams/[examId]/route.ts
// GET    → Single exam detail
// PATCH  → Update exam (status, publish results)
// DELETE → Delete exam
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard, apiGuardWithBody } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { Exam, Result } from '@/models/Exam'
import { logAudit } from '@/lib/audit'

type Params = { params: Promise<{ examId: string }> }

// ══════════════════════════════════════════════════════════
// GET — Single Exam
// ══════════════════════════════════════════════════════════

export async function GET(req: NextRequest, { params }: Params) {
    const { examId } = await params

    const guard = await apiGuard(req, {
        allowedRoles: ['admin', 'teacher', 'staff', 'student', 'parent'],
        rateLimit: 'api',
        requiredModules: ['exams'],
    })
    if (guard instanceof NextResponse) return guard
    const { session } = guard

    try {
        await connectDB()

        const exam = await Exam.findOne({
            _id: examId,
            tenantId: session.user.tenantId,
        }).lean()

        if (!exam) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
        }

        return NextResponse.json({ exam })

    } catch (err: any) {
        console.error('[EXAM GET]', err)
        return NextResponse.json(
            { error: err.message || 'Failed to fetch exam' },
            { status: 500 }
        )
    }
}

// ══════════════════════════════════════════════════════════
// PATCH — Update Exam (status / publish)
// ══════════════════════════════════════════════════════════

export async function PATCH(req: NextRequest, { params }: Params) {
    const { examId } = await params

    const guard = await apiGuardWithBody(req, {
        allowedRoles: ['admin'],
        rateLimit: 'mutation',
        requiredModules: ['exams'],
        auditAction: 'UPDATE',
        auditResource: 'Exam',
    })
    if (guard instanceof NextResponse) return guard
    const { session, body, clientInfo } = guard

    try {
        await connectDB()

        const exam = await Exam.findOne({
            _id: examId,
            tenantId: session.user.tenantId,
        })

        if (!exam) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
        }

        // Allowed updates
        const updates: any = {}
        if (body.status && ['upcoming', 'ongoing', 'completed'].includes(body.status)) {
            updates.status = body.status
        }
        if (typeof body.resultPublished === 'boolean') {
            updates.resultPublished = body.resultPublished
        }
        if (body.name?.trim()) updates.name = body.name.trim()

        Object.assign(exam, updates)
        await exam.save()

        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: 'UPDATE',
            resource: 'Exam',
            resourceId: examId,
            description: `Updated exam: ${exam.name}`,
            metadata: updates,
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            status: 'SUCCESS',
        })

        return NextResponse.json({ exam })

    } catch (err: any) {
        console.error('[EXAM PATCH]', err)
        return NextResponse.json(
            { error: err.message || 'Failed to update exam' },
            { status: 500 }
        )
    }
}

// ══════════════════════════════════════════════════════════
// DELETE — Delete Exam + Results
// ══════════════════════════════════════════════════════════

export async function DELETE(req: NextRequest, { params }: Params) {
    const { examId } = await params

    const guard = await apiGuard(req, {
        allowedRoles: ['admin'],
        rateLimit: 'mutation',
        requiredModules: ['exams'],
        auditAction: 'DELETE',
        auditResource: 'Exam',
    })
    if (guard instanceof NextResponse) return guard
    const { session, clientInfo } = guard

    try {
        await connectDB()

        const exam = await Exam.findOne({
            _id: examId,
            tenantId: session.user.tenantId,
        })

        if (!exam) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
        }

        // Delete exam + all results
        await Promise.all([
            Exam.findByIdAndDelete(examId),
            Result.deleteMany({ examId, tenantId: session.user.tenantId }),
        ])

        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: 'DELETE',
            resource: 'Exam',
            resourceId: examId,
            description: `Deleted exam: ${exam.name}`,
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            status: 'SUCCESS',
        })

        return NextResponse.json({ success: true })

    } catch (err: any) {
        console.error('[EXAM DELETE]', err)
        return NextResponse.json(
            { error: err.message || 'Failed to delete exam' },
            { status: 500 }
        )
    }
}