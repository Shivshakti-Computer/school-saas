// FILE: src/app/api/auth/2fa/backup-codes/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { regenerateBackupCodes } from '@/lib/twoFactor'
import { logAudit } from '@/lib/audit'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const result = await regenerateBackupCodes(session.user.id)

        if (!result) {
            return NextResponse.json(
                { error: '2FA is not enabled. Enable it first.' },
                { status: 400 }
            )
        }

        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name || 'Unknown',
            userRole: session.user.role,
            action: '2FA_ENABLE',
            resource: 'Auth',
            description: 'Backup codes regenerated',
            ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
        })

        return NextResponse.json({
            success: true,
            backupCodes: result.backupCodes,
            warning: 'Old backup codes are now invalid. Save these new codes.',
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}