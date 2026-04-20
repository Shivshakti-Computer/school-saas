// FILE: src/app/api/storage/cancel/route.ts
// Cancel storage addon (with grace period)
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuardWithBody } from '@/lib/apiGuard'
import { cancelStorageAddon } from '@/lib/storageExport'
import { logAudit } from '@/lib/audit'

export async function POST(req: NextRequest) {
    const guard = await apiGuardWithBody<{
        downloadCompleted?: boolean
    }>(req, {
        allowedRoles: ['admin'],
        rateLimit: 'mutation',
    })
    if (guard instanceof NextResponse) return guard

    const { session, body, clientInfo } = guard

    try {
        const result = await cancelStorageAddon(
            session.user.tenantId,
            body.downloadCompleted ?? false
        )

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 })
        }

        // ── Audit log ──
        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name || 'Admin',
            userRole: 'admin',
            action: 'STORAGE_CANCEL',
            resource: 'Storage',
            description: `Storage addon canceled — grace period till ${result.gracePeriodEndsAt?.toLocaleDateString('en-IN')}`,
            metadata: {
                downloadCompleted: body.downloadCompleted,
                gracePeriodEndsAt: result.gracePeriodEndsAt,
            },
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
        })

        return NextResponse.json({
            success: true,
            message: 'Storage addon canceled',
            gracePeriodEndsAt: result.gracePeriodEndsAt,
        })

    } catch (err: any) {
        console.error('[POST /api/storage/cancel]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}