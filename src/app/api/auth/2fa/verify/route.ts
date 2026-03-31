// FILE: src/app/api/auth/2fa/verify/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { verifyOTP, verifyBackupCode, addTrustedDevice } from '@/lib/twoFactor'
import { checkRateLimit, RATE_LIMITS, rateLimitResponse, sanitizeBody } from '@/lib/security'
import { logAudit } from '@/lib/audit'

export async function POST(req: NextRequest) {
  // Strict rate limit for OTP verification
  const rl = checkRateLimit(req, { windowMs: 15 * 60 * 1000, maxRequests: 10, identifier: 'otp-verify' })
  if (!rl.allowed) return rateLimitResponse(rl.resetIn)

  try {
    const body = sanitizeBody(await req.json())
    const { userId, tenantId, otp, backupCode, trustDevice, deviceName, userName, userRole } = body

    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })
    }

    let result: { verified: boolean; message: string }

    if (backupCode) {
      // Verify backup code
      const backupResult = await verifyBackupCode(userId, backupCode)
      result = backupResult

      if (backupResult.verified && backupResult.remainingCodes <= 2) {
        // Warn user about low backup codes
        return NextResponse.json({
          success: true,
          verified: true,
          warning: `Only ${backupResult.remainingCodes} backup codes remaining. Please generate new ones.`,
        })
      }
    } else if (otp) {
      // Verify OTP
      result = await verifyOTP(userId, otp)
    } else {
      return NextResponse.json({ error: 'Provide OTP or backup code' }, { status: 400 })
    }

    // Log the attempt
    await logAudit({
      tenantId,
      userId,
      userName: userName || 'Unknown',
      userRole: userRole || 'unknown',
      action: result.verified ? '2FA_VERIFY' : '2FA_FAILED',
      resource: 'Auth',
      description: result.verified
        ? '2FA verification successful'
        : `2FA verification failed: ${result.message}`,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      status: result.verified ? 'SUCCESS' : 'FAILURE',
    })

    if (!result.verified) {
      return NextResponse.json({ success: false, message: result.message }, { status: 401 })
    }

    // Trust device if requested
    let deviceId: string | null = null
    if (trustDevice) {
      deviceId = await addTrustedDevice(
        userId,
        deviceName || req.headers.get('user-agent')?.slice(0, 50) || 'Unknown'
      )
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: 'Verification successful',
      deviceId, // Client should store this in localStorage
    })

  } catch (err: any) {
    console.error('2FA verify error:', err)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}