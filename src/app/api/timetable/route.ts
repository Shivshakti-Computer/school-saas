import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { apiGuard, apiGuardWithBody } from '@/lib/apiGuard'
import { logAudit } from '@/lib/audit'
import { Timetable } from '@/models/Timetable'
import { getCurrentAcademicYear } from '@/lib/academicYear'

// ─────────────────────────────────────────────
// GET /api/timetable
// Query: class, section, academicYear
// Roles: admin, staff, teacher
// ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
    const guard = await apiGuard(req, {
        allowedRoles: ['admin', 'staff', 'teacher'],
        requiredModules: ['timetable'],
        rateLimit: 'api',        // ✅ fixed
    })
    if (guard instanceof NextResponse) return guard

    const { session } = guard
    const { searchParams } = req.nextUrl

    const cls = searchParams.get('class')?.trim()
    const section = searchParams.get('section')?.trim() ?? ''
    const academicYear =
        searchParams.get('academicYear')?.trim() || getCurrentAcademicYear()

    // Teacher can only see their own class timetable
    // No restriction — all see all (read-only for teacher)

    await connectDB()

    try {
        const filter: Record<string, any> = {
            tenantId: session.user.tenantId,
            academicYear,
            isActive: true,
        }
        if (cls) filter.class = cls
        if (section) filter.section = section

        const timetables = await Timetable.find(filter)
            .populate('days.periods.teacherId', 'name employeeId')
            .sort({ class: 1, section: 1 })
            .lean()

        return NextResponse.json({ success: true, data: timetables })

    } catch (err: any) {
        console.error('[TIMETABLE GET]', err)
        return NextResponse.json(
            { error: 'Failed to fetch timetable' },
            { status: 500 }
        )
    }
}

// ─────────────────────────────────────────────
// POST /api/timetable
// Upsert timetable for a class+section
// Roles: admin, staff (with timetable module)
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
    const guard = await apiGuardWithBody<{
        class: string
        section?: string
        academicYear?: string
        days: any[]
    }>(req, {
        allowedRoles: ['admin', 'staff'],
        requiredModules: ['timetable'],
        rateLimit: 'mutation',   // ✅ fixed
        auditAction: 'CREATE',
        auditResource: 'Timetable',
    })
    if (guard instanceof NextResponse) return guard

    const { session, body, clientInfo } = guard

    // ── Validate ──
    if (!body.class?.trim()) {
        return NextResponse.json({ error: 'Class is required' }, { status: 400 })
    }
    if (!Array.isArray(body.days) || body.days.length === 0) {
        return NextResponse.json({ error: 'Days schedule is required' }, { status: 400 })
    }

    const academicYear = body.academicYear?.trim() || getCurrentAcademicYear()
    const section = body.section?.trim() ?? ''

    // Validate time format for all periods
    const timeRx = /^([01]\d|2[0-3]):([0-5]\d)$/
    for (const day of body.days) {
        for (const p of day.periods ?? []) {
            if (!timeRx.test(p.startTime) || !timeRx.test(p.endTime)) {
                return NextResponse.json(
                    { error: `Invalid time format in period ${p.periodNo} on ${day.day}` },
                    { status: 400 }
                )
            }
            // endTime > startTime
            const [sh, sm] = (p.startTime as string).split(':').map(Number)
            const [eh, em] = (p.endTime as string).split(':').map(Number)
            if (eh * 60 + em <= sh * 60 + sm) {
                return NextResponse.json(
                    { error: `Period ${p.periodNo} on ${day.day}: end time must be after start time` },
                    { status: 400 }
                )
            }
        }
    }

    await connectDB()

    try {
        const existing = await Timetable.findOne({
            tenantId: session.user.tenantId,
            academicYear,
            class: body.class.trim(),
            section,
        })

        const isNew = !existing

        const timetable = await Timetable.findOneAndUpdate(
            {
                tenantId: session.user.tenantId,
                academicYear,
                class: body.class.trim(),
                section,
            },
            {
                $set: {
                    tenantId: session.user.tenantId,
                    academicYear,
                    class: body.class.trim(),
                    section,
                    days: body.days,
                    isActive: true,
                    updatedBy: session.user.id,
                },
                $setOnInsert: {
                    createdBy: session.user.id,
                },
            },
            { upsert: true, new: true, runValidators: true }
        )

        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: isNew ? 'CREATE' : 'UPDATE',
            resource: 'Timetable',
            resourceId: timetable._id.toString(),
            description: `${isNew ? 'Created' : 'Updated'} timetable for Class ${body.class}${section ? `-${section}` : ''} (${academicYear})`,
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            status: 'SUCCESS',
        })

        return NextResponse.json(
            {
                success: true,
                data: timetable,
                message: `Timetable ${isNew ? 'created' : 'updated'} successfully`,
            },
            { status: isNew ? 201 : 200 }
        )

    } catch (err: any) {
        console.error('[TIMETABLE POST]', err)

        if (err.message?.includes('endTime must be after')) {
            return NextResponse.json({ error: err.message }, { status: 400 })
        }
        if (err.message?.includes('Duplicate periodNo')) {
            return NextResponse.json({ error: err.message }, { status: 400 })
        }

        return NextResponse.json(
            { error: 'Failed to save timetable' },
            { status: 500 }
        )
    }
}

// ─────────────────────────────────────────────
// DELETE /api/timetable
// Query: class, section, academicYear
// Roles: admin only
// ─────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
    const guard = await apiGuard(req, {
        allowedRoles: ['admin'],
        requiredModules: ['timetable'],
        rateLimit: 'mutation',   // ✅ fixed
        auditAction: 'DELETE',
        auditResource: 'Timetable',
    })
    if (guard instanceof NextResponse) return guard

    const { session, clientInfo } = guard
    const { searchParams } = req.nextUrl

    const cls = searchParams.get('class')?.trim()
    const section = searchParams.get('section')?.trim() ?? ''
    const academicYear = searchParams.get('academicYear')?.trim() || getCurrentAcademicYear()

    if (!cls) {
        return NextResponse.json({ error: 'Class is required' }, { status: 400 })
    }

    await connectDB()

    try {
        const result = await Timetable.findOneAndUpdate(
            {
                tenantId: session.user.tenantId,
                academicYear,
                class: cls,
                section,
            },
            { $set: { isActive: false, updatedBy: session.user.id } },
            { new: true }
        )

        if (!result) {
            return NextResponse.json(
                { error: 'Timetable not found' },
                { status: 404 }
            )
        }

        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: 'DELETE',
            resource: 'Timetable',
            resourceId: result._id.toString(),
            description: `Deleted timetable for Class ${cls}${section ? `-${section}` : ''} (${academicYear})`,
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            status: 'SUCCESS',
        })

        return NextResponse.json({
            success: true,
            message: 'Timetable deleted successfully',
        })

    } catch (err: any) {
        console.error('[TIMETABLE DELETE]', err)
        return NextResponse.json(
            { error: 'Failed to delete timetable' },
            { status: 500 }
        )
    }
}