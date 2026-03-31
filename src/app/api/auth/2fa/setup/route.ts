// FILE: src/app/api/auth/2fa/setup/route.ts (UPDATED)

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { enable2FA, disable2FA, get2FAStatus } from '@/lib/twoFactor'
import { logAudit } from '@/lib/audit'

// GET — Check 2FA status (full details)
export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const status = await get2FAStatus(session.user.id)
        return NextResponse.json(status)
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// POST — Enable 2FA
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (session.user.role !== 'admin' && session.user.role !== 'superadmin') {
            return NextResponse.json(
                { error: '2FA is currently available for admin accounts only' },
                { status: 403 }
            )
        }

        const body = await req.json().catch(() => ({}))
        const method = body.method || 'otp_phone'

        const result = await enable2FA(session.user.id, session.user.tenantId, method)

        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name || 'Unknown',
            userRole: session.user.role,
            action: '2FA_ENABLE',
            resource: 'Auth',
            description: `2FA enabled via ${method}`,
            ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
        })

        return NextResponse.json({
            success: true,
            message: '2FA enabled successfully',
            backupCodes: result.backupCodes,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// DELETE — Disable 2FA
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await disable2FA(session.user.id)

        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name || 'Unknown',
            userRole: session.user.role,
            action: '2FA_DISABLE',
            resource: 'Auth',
            description: '2FA disabled',
            ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
        })

        return NextResponse.json({ success: true, message: '2FA disabled' })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}