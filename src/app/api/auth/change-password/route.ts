// FILE: src/app/api/auth/change-password/route.ts
// Universal password change — works for ALL roles

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { checkRateLimit, RATE_LIMITS, rateLimitResponse, sanitizeBody } from '@/lib/security'
import { logAudit } from '@/lib/audit'

export async function POST(req: NextRequest) {
  // Rate limit: 5 attempts per 15 minutes
  const rl = checkRateLimit(req, {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    identifier: 'change-password',
  })
  if (!rl.allowed) return rateLimitResponse(rl.resetIn)

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = sanitizeBody(await req.json())
    const { currentPassword, newPassword, confirmPassword } = body

    // ── Validation ──
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New passwords do not match' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      )
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      )
    }

    await connectDB()

    // ── Get user with password ──
    const user = await User.findById(session.user.id).select('+password')
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // ── Verify current password ──
    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      // Log failed attempt
      await logAudit({
        tenantId: session.user.tenantId,
        userId: session.user.id,
        userName: session.user.name || 'Unknown',
        userRole: session.user.role,
        action: 'PASSWORD_CHANGE',
        resource: 'Auth',
        description: 'Password change failed — incorrect current password',
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        status: 'FAILURE',
      })

      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      )
    }

    // ── Hash new password ──
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // ── Update password ──
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
    })

    // ── Audit log ──
    await logAudit({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      userName: session.user.name || 'Unknown',
      userRole: session.user.role,
      action: 'PASSWORD_CHANGE',
      resource: 'Auth',
      description: `Password changed successfully by ${session.user.role}`,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      status: 'SUCCESS',
    })

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    })

  } catch (err: any) {
    console.error('Change password error:', err)
    return NextResponse.json(
      { error: 'Failed to change password. Please try again.' },
      { status: 500 }
    )
  }
}