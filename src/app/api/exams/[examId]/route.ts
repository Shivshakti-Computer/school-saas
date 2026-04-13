// src/app/api/exams/[examId]/route.ts
// COMPLETE FILE — GET + PATCH (fixed) + DELETE
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
        }).lean() as any

        if (!exam) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
        }

        // ── Backward compat: normalize subjects ──────────────
        // Purane docs mein maxMarks tha, naye mein totalMaxMarks hai
        const normalized = {
            ...exam,
            subjects: (exam.subjects ?? []).map((s: any) => ({
                ...s,
                totalMaxMarks: s.totalMaxMarks ?? s.maxMarks ?? 0,
                components: s.components ?? [],
                isGradeOnly: s.isGradeOnly ?? false,
            })),
        }

        return NextResponse.json({ exam: normalized })

    } catch (err: any) {
        console.error('[EXAM GET]', err)
        return NextResponse.json(
            { error: err.message || 'Failed to fetch exam' },
            { status: 500 }
        )
    }
}

// ══════════════════════════════════════════════════════════
// PATCH — Update Exam
// FIX: findOneAndUpdate instead of save() to avoid
//      schema validation on old subjects missing totalMaxMarks
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

        // Pehle check karo exist karta hai ya nahi
        const existing = await Exam.findOne({
            _id: examId,
            tenantId: session.user.tenantId,
        }).lean() as any

        if (!existing) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
        }

        // ── Build $set object (sirf allowed fields) ──────────
        const $set: Record<string, any> = {}

        if (
            body.status &&
            ['upcoming', 'ongoing', 'completed'].includes(body.status)
        ) {
            $set.status = body.status
        }

        if (typeof body.resultPublished === 'boolean') {
            $set.resultPublished = body.resultPublished
        }

        if (typeof body.admitCardEnabled === 'boolean') {
            $set.admitCardEnabled = body.admitCardEnabled
        }

        if (body.name?.trim()) {
            $set.name = body.name.trim()
        }

        if (body.examCenter !== undefined) {
            $set.examCenter = body.examCenter
        }

        if (Array.isArray(body.instructions)) {
            $set.instructions = body.instructions
        }

        if (Array.isArray(body.subjects) && body.subjects.length > 0) {
            $set.subjects = body.subjects.map((s: any) => {
                const components = Array.isArray(s.components)
                    ? s.components
                        .filter((c: any) => c.name?.trim())
                        .map((c: any) => ({
                            name: c.name.trim(),
                            maxMarks: Number(c.maxMarks) || 0,
                        }))
                    : []

                const totalMaxMarks = components.length > 0
                    ? components.reduce(
                        (sum: number, c: any) => sum + c.maxMarks, 0
                    )
                    : Number(s.totalMaxMarks) || 0

                return {
                    name: s.name,
                    date: s.isGradeOnly
                        ? new Date()
                        : new Date(s.date),
                    time: s.time || '10:00 AM',
                    duration: Number(s.duration) || 180,
                    totalMaxMarks,
                    minMarks: Number(s.minMarks) || 0,
                    components,
                    isGradeOnly: Boolean(s.isGradeOnly),
                }
            })
        }

        // ── findOneAndUpdate — bypass Mongoose validation ────
        // runValidators: false → purane subjects ka schema
        // mismatch ignore hoga
        const updated = await Exam.findOneAndUpdate(
            {
                _id: examId,
                tenantId: session.user.tenantId,
            },
            { $set },
            {
                new: true,
                runValidators: false,  // ← KEY FIX
            }
        ).lean() as any

        if (!updated) {
            return NextResponse.json({ error: 'Update failed' }, { status: 500 })
        }

        // Normalize response
        const normalized = {
            ...updated,
            subjects: (updated.subjects ?? []).map((s: any) => ({
                ...s,
                totalMaxMarks: s.totalMaxMarks ?? s.maxMarks ?? 0,
                components: s.components ?? [],
                isGradeOnly: s.isGradeOnly ?? false,
            })),
        }

        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: 'UPDATE',
            resource: 'Exam',
            resourceId: examId,
            description: `Updated exam: ${updated.name}`,
            metadata: $set,
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            status: 'SUCCESS',
        })

        return NextResponse.json({ exam: normalized })

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
        }).lean() as any

        if (!exam) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
        }

        await Promise.all([
            Exam.findByIdAndDelete(examId),
            Result.deleteMany({
                examId,
                tenantId: session.user.tenantId,
            }),
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