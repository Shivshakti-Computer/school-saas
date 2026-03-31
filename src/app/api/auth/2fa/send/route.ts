// FILE: src/app/api/auth/2fa/send/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { School } from '@/models/School'
import { generateAndSendOTP } from '@/lib/twoFactor'
import { checkRateLimit, RATE_LIMITS, rateLimitResponse, sanitizeBody } from '@/lib/security'
import { logAudit } from '@/lib/audit'

export async function POST(req: NextRequest) {
    // Rate limit OTP requests
    const rl = checkRateLimit(req, RATE_LIMITS.otp)
    if (!rl.allowed) return rateLimitResponse(rl.resetIn)

    try {
        await connectDB()
        const body = sanitizeBody(await req.json())
        const { userId, tenantId } = body

        if (!userId || !tenantId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Get user's phone/email
        const user = await User.findOne({ _id: userId, tenantId, isActive: true })
            .select('phone email name role')
            .lean() as any

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Send OTP to phone
        const result = await generateAndSendOTP(userId, tenantId, 'otp_phone', user.phone)

        await logAudit({
            tenantId,
            userId,
            userName: user.name,
            userRole: user.role,
            action: '2FA_VERIFY',
            resource: 'Auth',
            description: `2FA OTP sent to ${user.phone}`,
            ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
            status: result.success ? 'SUCCESS' : 'FAILURE',
        })

        if (!result.success) {
            return NextResponse.json({ error: result.message }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: result.message,
            expiresIn: result.expiresIn,
            // Masked phone for UI
            maskedPhone: user.phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2'),
        })

    } catch (err: any) {
        console.error('2FA send error:', err)
        return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
    }
}