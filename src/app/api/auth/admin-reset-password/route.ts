// FILE: src/app/api/auth/admin-reset-password/route.ts
// Admin can reset password of any user in their school

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { checkRateLimit, rateLimitResponse, sanitizeBody } from '@/lib/security'
import { logAudit } from '@/lib/audit'

export async function POST(req: NextRequest) {
    // Rate limit
    const rl = checkRateLimit(req, {
        windowMs: 15 * 60 * 1000,
        maxRequests: 10,
        identifier: 'admin-reset-pwd',
    })
    if (!rl.allowed) return rateLimitResponse(rl.resetIn)

    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Only admin and superadmin can reset others' passwords
        if (session.user.role !== 'admin' && session.user.role !== 'superadmin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = sanitizeBody(await req.json())
        const { userId, newPassword } = body

        if (!userId || !newPassword) {
            return NextResponse.json(
                { error: 'User ID and new password are required' },
                { status: 400 }
            )
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            )
        }

        await connectDB()

        // Find user — must belong to same school (tenant)
        const targetUser = await User.findOne({
            _id: userId,
            tenantId: session.user.tenantId,
            isActive: true,
        }).select('name role phone')

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Admin cannot reset another admin's password
        if (targetUser.role === 'admin' && session.user.role !== 'superadmin') {
            return NextResponse.json(
                { error: 'Cannot reset another admin\'s password' },
                { status: 403 }
            )
        }

        // Hash and update
        const hashedPassword = await bcrypt.hash(newPassword, 12)
        await User.findByIdAndUpdate(userId, { password: hashedPassword })

        // Audit log
        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name || 'Unknown',
            userRole: session.user.role,
            action: 'PASSWORD_RESET',
            resource: 'User',
            resourceId: userId,
            description: `Admin reset password for ${targetUser.role}: ${targetUser.name} (${targetUser.phone})`,
            ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
            userAgent: req.headers.get('user-agent') || 'unknown',
            status: 'SUCCESS',
            metadata: {
                targetUserId: userId,
                targetUserName: targetUser.name,
                targetUserRole: targetUser.role,
            },
        })

        return NextResponse.json({
            success: true,
            message: `Password reset for ${targetUser.name} (${targetUser.role})`,
        })

    } catch (err: any) {
        console.error('Admin reset password error:', err)
        return NextResponse.json(
            { error: 'Failed to reset password' },
            { status: 500 }
        )
    }
}