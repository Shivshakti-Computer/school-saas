// FILE: src/app/api/settings/data/audit/route.ts
// ═══════════════════════════════════════════════════════════
// GET /api/settings/data/audit
// Paginated audit logs with filters
// Query params:
//   page, limit, action, resource, riskLevel,
//   status, dateFrom, dateTo, search
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { AuditLog } from '@/models/AuditLog'
import type { AuditLogFilters, AuditLogResponse } from '@/types/settings'

export async function GET(req: NextRequest) {
    const guard = await apiGuard(req, {
        allowedRoles: ['admin'],
        rateLimit: 'mutation',
    })
    if (guard instanceof NextResponse) return guard

    const { session } = guard
    const tenantId = session.user.tenantId

    // ── Parse Query Params ──
    const { searchParams } = req.nextUrl

    const filters: AuditLogFilters = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '20'),
        action: searchParams.get('action') || undefined,
        resource: searchParams.get('resource') || undefined,
        riskLevel: searchParams.get('riskLevel') || undefined,
        status: searchParams.get('status') || undefined,
        dateFrom: searchParams.get('dateFrom') || undefined,
        dateTo: searchParams.get('dateTo') || undefined,
        search: searchParams.get('search') || undefined,
    }

    // ── Sanitize ──
    const page = Math.max(1, filters.page || 1)
    const limit = Math.min(50, Math.max(1, filters.limit || 20))
    const skip = (page - 1) * limit

    try {
        await connectDB()

        // ── Build MongoDB Query ──
        const query: Record<string, any> = { tenantId }

        if (filters.action) {
            query.action = filters.action.toUpperCase()
        }

        if (filters.resource) {
            query.resource = filters.resource
        }

        if (filters.riskLevel) {
            query.riskLevel = filters.riskLevel.toUpperCase()
        }

        if (filters.status) {
            query.status = filters.status.toUpperCase()
        }

        // Date range
        if (filters.dateFrom || filters.dateTo) {
            query.createdAt = {}
            if (filters.dateFrom) {
                query.createdAt.$gte = new Date(filters.dateFrom)
            }
            if (filters.dateTo) {
                // End of day
                const endDate = new Date(filters.dateTo)
                endDate.setHours(23, 59, 59, 999)
                query.createdAt.$lte = endDate
            }
        }

        // Text search — userName ya description mein
        if (filters.search) {
            const searchRegex = new RegExp(
                filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
                'i'
            )
            query.$or = [
                { userName: searchRegex },
                { description: searchRegex },
                { resourceId: searchRegex },
            ]
        }

        // ── Execute ──
        const [logs, total] = await Promise.all([
            AuditLog.find(query)
                .select(
                    'action resource resourceId description userName userRole ' +
                    'ipAddress status riskLevel createdAt metadata'
                )
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            AuditLog.countDocuments(query),
        ])

        const totalPages = Math.ceil(total / limit)

        const response: AuditLogResponse = {
            logs: logs.map((log: any) => ({
                id: log._id.toString(),
                action: log.action,
                resource: log.resource,
                resourceId: log.resourceId,
                description: log.description,
                userName: log.userName,
                userRole: log.userRole,
                ipAddress: log.ipAddress,
                status: log.status,
                riskLevel: log.riskLevel,
                createdAt: log.createdAt?.toISOString(),
                metadata: log.metadata,
            })),
            total,
            page,
            totalPages,
            hasMore: page < totalPages,
        }

        return NextResponse.json(response)

    } catch (error: any) {
        console.error('[GET /api/settings/data/audit]', error)
        return NextResponse.json(
            { error: 'Failed to fetch audit logs' },
            { status: 500 }
        )
    }
}