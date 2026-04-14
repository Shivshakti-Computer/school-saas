import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { apiGuard, apiGuardWithBody } from '@/lib/apiGuard'
import { logAudit } from '@/lib/audit'
import { Route } from '@/models/Transport'
import '@/models/Student'
import '@/models/User'

// ─────────────────────────────────────────────
// GET /api/transport
// Roles: admin, staff
// ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
    const guard = await apiGuard(req, {
        allowedRoles: ['admin', 'staff'],
        requiredModules: ['transport'],
        rateLimit: 'api',
    })
    if (guard instanceof NextResponse) return guard

    const { session } = guard

    await connectDB()

    try {
        const routes = await Route.find({
            tenantId: session.user.tenantId,
            isActive: true,
        })
            .populate({
                path: 'assignedStudents',
                select: 'admissionNo class section',
                populate: { path: 'userId', select: 'name' },
            })
            .sort({ routeNo: 1 })
            .lean()

        const stats = {
            totalRoutes: routes.length,
            totalStudents: routes.reduce((s, r) => s + (r.assignedStudents?.length ?? 0), 0),
            totalCapacity: routes.reduce((s, r) => s + r.capacity, 0),
            totalBuses: routes.filter(r => r.vehicleType === 'bus').length,
            totalVans: routes.filter(r => r.vehicleType === 'van').length,
        }

        return NextResponse.json({ success: true, routes, stats })

    } catch (err: any) {
        console.error('[TRANSPORT GET]', err)
        return NextResponse.json(
            { error: 'Failed to fetch routes' },
            { status: 500 }
        )
    }
}

// ─────────────────────────────────────────────
// POST /api/transport — Create route
// Roles: admin only
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
    const guard = await apiGuardWithBody<{
        routeName: string
        routeNo: string
        busNo: string
        vehicleType?: string
        driverName: string
        driverPhone: string
        driverLicense?: string
        conductorName?: string
        conductorPhone?: string
        capacity?: number
        stops?: any[]
        notes?: string
    }>(req, {
        allowedRoles: ['admin'],
        requiredModules: ['transport'],
        rateLimit: 'mutation',
        auditAction: 'CREATE',
        auditResource: 'Transport',
    })
    if (guard instanceof NextResponse) return guard

    const { session, body, clientInfo } = guard

    // ── Validate ──
    if (!body.routeName?.trim()) {
        return NextResponse.json({ error: 'Route name is required' }, { status: 400 })
    }
    if (!body.routeNo?.trim()) {
        return NextResponse.json({ error: 'Route number is required' }, { status: 400 })
    }
    if (!body.busNo?.trim()) {
        return NextResponse.json({ error: 'Bus number is required' }, { status: 400 })
    }
    if (!body.driverName?.trim()) {
        return NextResponse.json({ error: 'Driver name is required' }, { status: 400 })
    }
    if (!body.driverPhone?.trim()) {
        return NextResponse.json({ error: 'Driver phone is required' }, { status: 400 })
    }

    // Validate stops times
    const timeRx = /^([01]\d|2[0-3]):([0-5]\d)$/
    for (const stop of body.stops ?? []) {
        if (!stop.name?.trim()) {
            return NextResponse.json({ error: 'All stop names are required' }, { status: 400 })
        }
        if (!timeRx.test(stop.pickupTime) || !timeRx.test(stop.dropTime)) {
            return NextResponse.json(
                { error: `Invalid time format for stop "${stop.name}"` },
                { status: 400 }
            )
        }
    }

    await connectDB()

    try {
        // Duplicate routeNo check
        const dup = await Route.findOne({
            tenantId: session.user.tenantId,
            routeNo: body.routeNo.trim(),
            isActive: true,
        }).lean()

        if (dup) {
            return NextResponse.json(
                { error: `Route number "${body.routeNo}" already exists` },
                { status: 409 }
            )
        }

        const route = await Route.create({
            tenantId: session.user.tenantId,
            routeName: body.routeName.trim(),
            routeNo: body.routeNo.trim().toUpperCase(),
            busNo: body.busNo.trim().toUpperCase(),
            vehicleType: body.vehicleType ?? 'bus',
            driverName: body.driverName.trim(),
            driverPhone: body.driverPhone.trim(),
            driverLicense: body.driverLicense?.trim() ?? '',
            conductorName: body.conductorName?.trim() ?? '',
            conductorPhone: body.conductorPhone?.trim() ?? '',
            capacity: Math.max(1, parseInt(String(body.capacity ?? 40)) || 40),
            stops: (body.stops ?? []).map((s, i) => ({
                name: s.name.trim(),
                pickupTime: s.pickupTime,
                dropTime: s.dropTime,
                fee: Math.max(0, Number(s.fee) || 0),
                order: i + 1,
            })),
            notes: body.notes?.trim() ?? '',
            isActive: true,
            createdBy: session.user.id,
        })

        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: 'CREATE',
            resource: 'Transport',
            resourceId: route._id.toString(),
            description: `Created route "${route.routeName}" (${route.routeNo}) — Bus: ${route.busNo}`,
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            status: 'SUCCESS',
        })

        return NextResponse.json(
            { success: true, route, message: 'Route created successfully' },
            { status: 201 }
        )

    } catch (err: any) {
        console.error('[TRANSPORT POST]', err)
        if (err.code === 11000) {
            return NextResponse.json(
                { error: 'Route number already exists' },
                { status: 409 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to create route' },
            { status: 500 }
        )
    }
}

// ─────────────────────────────────────────────
// PUT /api/transport — Update route
// Body: { id, ...fields }
// Roles: admin only
// ─────────────────────────────────────────────
export async function PUT(req: NextRequest) {
    const guard = await apiGuardWithBody<{
        id: string
        routeName?: string
        busNo?: string
        vehicleType?: string
        driverName?: string
        driverPhone?: string
        driverLicense?: string
        conductorName?: string
        conductorPhone?: string
        capacity?: number
        stops?: any[]
        notes?: string
        assignedStudents?: string[]
    }>(req, {
        allowedRoles: ['admin'],
        requiredModules: ['transport'],
        rateLimit: 'mutation',
        auditAction: 'UPDATE',
        auditResource: 'Transport',
    })
    if (guard instanceof NextResponse) return guard

    const { session, body, clientInfo } = guard

    if (!body.id) {
        return NextResponse.json({ error: 'Route ID is required' }, { status: 400 })
    }

    await connectDB()

    try {
        const existing = await Route.findOne({
            _id: body.id,
            tenantId: session.user.tenantId,
            isActive: true,
        })
        if (!existing) {
            return NextResponse.json({ error: 'Route not found' }, { status: 404 })
        }

        const updateData: Record<string, any> = {
            updatedBy: session.user.id,
        }

        if (body.routeName) updateData.routeName = body.routeName.trim()
        if (body.busNo) updateData.busNo = body.busNo.trim().toUpperCase()
        if (body.vehicleType) updateData.vehicleType = body.vehicleType
        if (body.driverName) updateData.driverName = body.driverName.trim()
        if (body.driverPhone) updateData.driverPhone = body.driverPhone.trim()
        if (body.driverLicense !== undefined) updateData.driverLicense = body.driverLicense?.trim() ?? ''
        if (body.conductorName !== undefined) updateData.conductorName = body.conductorName?.trim() ?? ''
        if (body.conductorPhone !== undefined) updateData.conductorPhone = body.conductorPhone?.trim() ?? ''
        if (body.capacity) updateData.capacity = Math.max(1, parseInt(String(body.capacity)) || 40)
        if (body.notes !== undefined) updateData.notes = body.notes?.trim() ?? ''

        if (body.stops) {
            updateData.stops = body.stops.map((s, i) => ({
                name: s.name.trim(),
                pickupTime: s.pickupTime,
                dropTime: s.dropTime,
                fee: Math.max(0, Number(s.fee) || 0),
                order: i + 1,
            }))
        }

        if (body.assignedStudents !== undefined) {
            updateData.assignedStudents = body.assignedStudents
        }

        const route = await Route.findByIdAndUpdate(
            body.id,
            { $set: updateData },
            { new: true, runValidators: true }
        )

        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: 'UPDATE',
            resource: 'Transport',
            resourceId: body.id,
            description: `Updated route "${existing.routeName}" (${existing.routeNo})`,
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            status: 'SUCCESS',
        })

        return NextResponse.json({ success: true, route })

    } catch (err: any) {
        console.error('[TRANSPORT PUT]', err)
        return NextResponse.json(
            { error: 'Failed to update route' },
            { status: 500 }
        )
    }
}

// ─────────────────────────────────────────────
// DELETE /api/transport — Soft delete
// Body: { id }
// Roles: admin only
// ─────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
    const guard = await apiGuardWithBody<{ id: string }>(req, {
        allowedRoles: ['admin'],
        requiredModules: ['transport'],
        rateLimit: 'mutation',
        auditAction: 'DELETE',
        auditResource: 'Transport',
    })
    if (guard instanceof NextResponse) return guard

    const { session, body, clientInfo } = guard

    if (!body.id) {
        return NextResponse.json({ error: 'Route ID is required' }, { status: 400 })
    }

    await connectDB()

    try {
        const route = await Route.findOne({
            _id: body.id,
            tenantId: session.user.tenantId,
        })
        if (!route) {
            return NextResponse.json({ error: 'Route not found' }, { status: 404 })
        }

        // Warn if students assigned
        if (route.assignedStudents?.length > 0) {
            return NextResponse.json(
                {
                    error: `Cannot delete — ${route.assignedStudents.length} students are assigned to this route. Remove them first.`,
                },
                { status: 409 }
            )
        }

        await Route.findByIdAndUpdate(body.id, {
            $set: { isActive: false, updatedBy: session.user.id },
        })

        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: 'DELETE',
            resource: 'Transport',
            resourceId: body.id,
            description: `Deleted route "${route.routeName}" (${route.routeNo})`,
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            status: 'SUCCESS',
        })

        return NextResponse.json({
            success: true,
            message: 'Route deleted successfully',
        })

    } catch (err: any) {
        console.error('[TRANSPORT DELETE]', err)
        return NextResponse.json(
            { error: 'Failed to delete route' },
            { status: 500 }
        )
    }
}