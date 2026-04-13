// src/app/api/exams/route.ts
// COMPLETE FILE
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard, apiGuardWithBody } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { Exam } from '@/models/Exam'
import { logAudit } from '@/lib/audit'
import { getCurrentAcademicYear } from '@/lib/academicYear'
import { Student, User } from '@/models'

// ── Validation ──────────────────────────────────────────────
function validateExamBody(body: any): string | null {
    if (!body.name?.trim()) return 'Exam name is required'
    if (!body.class?.trim()) return 'Class is required'
    if (!body.academicYear?.trim()) return 'Academic year is required'

    if (!Array.isArray(body.subjects) || body.subjects.length === 0) {
        return 'At least one subject is required'
    }

    for (const sub of body.subjects) {
        if (!sub.name?.trim()) return 'Subject name is required'

        // Grade-only subjects ke liye marks validation skip
        if (sub.isGradeOnly) continue

        // ── totalMaxMarks calculate karo ──
        // Components hain → unka sum use karo
        // Nahi hain → totalMaxMarks directly use karo
        const computedMax = Array.isArray(sub.components) && sub.components.length > 0
            ? sub.components.reduce(
                (sum: number, c: any) => sum + (Number(c.maxMarks) || 0),
                0
            )
            : Number(sub.totalMaxMarks) || 0

        if (computedMax <= 0) {
            return `Max marks must be greater than 0 for ${sub.name}`
        }

        if (!sub.date) {
            return `Date is required for ${sub.name}`
        }

        const minMarks = Number(sub.minMarks) || 0
        if (minMarks < 0 || minMarks > computedMax) {
            return `Pass marks invalid for ${sub.name} (must be between 0 and ${computedMax})`
        }
    }

    return null
}

// ══════════════════════════════════════════════════════════
// GET — List Exams
// ══════════════════════════════════════════════════════════

export async function GET(req: NextRequest) {
    const guard = await apiGuard(req, {
        allowedRoles: ['admin', 'teacher', 'staff', 'student', 'parent'],
        rateLimit: 'api',
        requiredModules: ['exams'],
    })
    if (guard instanceof NextResponse) return guard
    const { session } = guard

    try {
        await connectDB()

        const url = new URL(req.url)
        const cls = url.searchParams.get('class')
        const section = url.searchParams.get('section')
        const academicYear = url.searchParams.get('academicYear')
        const status = url.searchParams.get('status')

        const query: any = { tenantId: session.user.tenantId }

        if (cls) query.class = cls
        if (section) query.section = section
        if (academicYear) query.academicYear = academicYear
        if (status) query.status = status

        // ── Student: DB se class/section fetch karo ──────────
        if (session.user.role === 'student') {
            const student = await Student.findOne({
                userId: session.user.id,
                tenantId: session.user.tenantId,
                status: 'active',
            }).select('class section academicYear').lean() as any

            if (!student) {
                return NextResponse.json({ exams: [] })
            }

            query.class = student.class
            // Section filter: exam section ya to student ki section
            // se match kare ya blank ho (poori class ka exam)
            query.$or = [
                { section: student.section },
                { section: { $exists: false } },
                { section: '' },
                { section: null },
            ]

            // Only published results wale exams ya upcoming exams
            // (student sirf relevant exams dekhe)
        }

        // ── Parent: bachche ki info DB se fetch karo ─────────
        if (session.user.role === 'parent') {
            const parentUser = await User.findById(session.user.id)
                .select('studentRef')
                .lean() as any

            if (!parentUser?.studentRef) {
                return NextResponse.json({ exams: [] })
            }

            // studentRef array ya single ref ho sakta hai
            const studentIds = Array.isArray(parentUser.studentRef)
                ? parentUser.studentRef
                : [parentUser.studentRef]

            if (studentIds.length === 0) {
                return NextResponse.json({ exams: [] })
            }

            // Pehle student ki class/section lo
            const student = await Student.findOne({
                _id: { $in: studentIds },
                tenantId: session.user.tenantId,
                status: 'active',
            }).select('class section').lean() as any

            if (!student) {
                return NextResponse.json({ exams: [] })
            }

            query.class = student.class
            query.$or = [
                { section: student.section },
                { section: { $exists: false } },
                { section: '' },
                { section: null },
            ]
        }

        const exams = await Exam.find(query)
            .sort({ createdAt: -1 })
            .lean() as any[]

        // ── Student/Parent: sirf published ya upcoming exams ──
        // (completed + unpublished filter out)
        let filtered = exams
        if (
            session.user.role === 'student' ||
            session.user.role === 'parent'
        ) {
            filtered = exams.filter(e =>
                // Upcoming/Ongoing exams dikhao
                e.status !== 'completed' ||
                // Completed mein sirf published results wale
                e.resultPublished === true
            )
        }

        // ── Backward compat normalize ─────────────────────────
        const normalized = filtered.map(exam => ({
            ...exam,
            subjects: (exam.subjects ?? []).map((s: any) => ({
                ...s,
                totalMaxMarks: s.totalMaxMarks ?? s.maxMarks ?? 0,
                components: s.components ?? [],
                isGradeOnly: s.isGradeOnly ?? false,
            })),
        }))

        return NextResponse.json({ exams: normalized })

    } catch (err: any) {
        console.error('[EXAMS GET]', err)
        return NextResponse.json(
            { error: err.message || 'Failed to fetch exams' },
            { status: 500 }
        )
    }
}

// ══════════════════════════════════════════════════════════
// POST — Create Exam
// ══════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
    const guard = await apiGuardWithBody(req, {
        allowedRoles: ['admin', 'teacher'],
        rateLimit: 'mutation',
        requiredModules: ['exams'],
        auditAction: 'CREATE',
        auditResource: 'Exam',
    })
    if (guard instanceof NextResponse) return guard
    const { session, body, clientInfo } = guard

    try {
        await connectDB()

        const error = validateExamBody(body)
        if (error) {
            return NextResponse.json({ error }, { status: 400 })
        }

        // ── Build subjects array ─────────────────────────────
        const subjects = body.subjects.map((s: any) => {
            // Components se totalMaxMarks calculate karo
            const components = Array.isArray(s.components)
                ? s.components
                    .filter((c: any) => c.name?.trim())
                    .map((c: any) => ({
                        name: c.name.trim(),
                        maxMarks: Number(c.maxMarks) || 0,
                    }))
                : []

            const totalMaxMarks = components.length > 0
                ? components.reduce((sum: number, c: any) => sum + c.maxMarks, 0)
                : Number(s.totalMaxMarks) || 0

            return {
                name: s.name.trim(),
                date: s.isGradeOnly ? new Date() : new Date(s.date),
                time: s.time || '10:00 AM',
                duration: Number(s.duration) || 180,
                totalMaxMarks,
                minMarks: Number(s.minMarks) || 0,
                components,
                isGradeOnly: Boolean(s.isGradeOnly),
            }
        })

        const exam = await Exam.create({
            tenantId: session.user.tenantId,
            createdBy: session.user.id,
            name: body.name.trim(),
            class: body.class.trim(),
            section: body.section?.trim() || undefined,
            academicYear: body.academicYear.trim(),
            status: 'upcoming',
            resultPublished: false,
            admitCardEnabled: Boolean(body.admitCardEnabled),
            examCenter: body.examCenter?.trim() || '',
            instructions: Array.isArray(body.instructions)
                ? body.instructions.filter((i: string) => i.trim())
                : [],
            subjects,
        })

        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: 'CREATE',
            resource: 'Exam',
            resourceId: exam._id.toString(),
            description: `Created exam: ${exam.name} — Class ${exam.class}`,
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            status: 'SUCCESS',
        })

        return NextResponse.json({ exam }, { status: 201 })

    } catch (err: any) {
        console.error('[EXAMS POST]', err)
        return NextResponse.json(
            { error: err.message || 'Failed to create exam' },
            { status: 500 }
        )
    }
}