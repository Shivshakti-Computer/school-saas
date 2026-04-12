// FILE: src/app/api/auth/otp/send/route.ts
// UPDATED:
// - Pre-tenant OTP sends provider-level sends directly
// - No MessageLog / no tenantId dependency
// - Uses Fast2SMS + Resend properly
// - OTP remains free and outside credit system
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db'
import { OTPVerification } from '@/models/OTPVerification'
import {
  checkRateLimit,
  RATE_LIMITS,
  rateLimitResponse,
} from '@/lib/security'
import { SMS_TEMPLATES, EMAIL_TEMPLATES } from '@/lib/message'
import { fast2smsSendSMS } from '@/lib/message/providers/fast2sms'
import { resendSendEmail } from '@/lib/message/providers/resend'

const OTP_EXPIRY_MINUTES = 10
const MAX_RESEND_PER_HOUR = 3

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, RATE_LIMITS.register)
  if (!rl.allowed) return rateLimitResponse(rl.resetIn)

  try {
    await connectDB()

    const body = await req.json()
    const rawPhone = body?.phone?.toString?.() || ''
    const rawEmail = body?.email?.toString?.() || ''
    const channel = body?.channel as 'sms' | 'email'

    // ── Validate Channel ──────────────────────────────────
    if (!['sms', 'email'].includes(channel)) {
      return NextResponse.json(
        { error: 'Invalid channel' },
        { status: 400 }
      )
    }

    // ── Normalize Inputs ──────────────────────────────────
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '')
    const cleanEmail = rawEmail.toLowerCase().trim()

    // ── Validate Input by Channel ─────────────────────────
    if (channel === 'sms') {
      if (!cleanPhone) {
        return NextResponse.json(
          { error: 'Phone number required' },
          { status: 400 }
        )
      }

      if (cleanPhone.length !== 10) {
        return NextResponse.json(
          { error: 'Valid 10-digit phone required' },
          { status: 400 }
        )
      }
    }

    if (channel === 'email') {
      if (!cleanEmail) {
        return NextResponse.json(
          { error: 'Email required' },
          { status: 400 }
        )
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(cleanEmail)) {
        return NextResponse.json(
          { error: 'Valid email required' },
          { status: 400 }
        )
      }
    }

    const identifier = channel === 'sms' ? cleanPhone : cleanEmail

    // ── Resend Limit (3 per hour) ─────────────────────────
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const recentCount = await OTPVerification.countDocuments({
      phone: identifier, // field reused as identifier (phone/email)
      purpose: 'registration',
      createdAt: { $gte: oneHourAgo },
    })

    if (recentCount >= MAX_RESEND_PER_HOUR) {
      return NextResponse.json(
        {
          error:
            'Too many OTP requests. Please wait 1 hour before trying again.',
        },
        { status: 429 }
      )
    }

    // ── Generate OTP ──────────────────────────────────────
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const hashedOTP = await bcrypt.hash(otp, 10)
    const expiresAt = new Date(
      Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
    )

    // ── Delete old unverified OTPs ────────────────────────
    await OTPVerification.deleteMany({
      phone: identifier,
      purpose: 'registration',
      verified: false,
    })

    // ── Save new OTP ──────────────────────────────────────
    await OTPVerification.create({
      phone: identifier,
      hashedOTP,
      purpose: 'registration',
      attempts: 0,
      verified: false,
      token: '',
      expiresAt,
    })

    // ── Send OTP using provider layer directly ────────────
    let sendResult: { success: boolean; error?: string }

    if (channel === 'sms') {
      sendResult = await fast2smsSendSMS(
        cleanPhone,
        SMS_TEMPLATES.otp(otp)
      )
    } else {
      const template = EMAIL_TEMPLATES.otp(otp)

      sendResult = await resendSendEmail(
        cleanEmail,
        template.subject,
        template.html,
        'Skolify',
        true // full HTML system email
      )
    }

    if (!sendResult.success) {
      console.error('[OTP-SEND] Failed:', sendResult.error)

      // Failed send pe OTP record cleanup kar do
      await OTPVerification.deleteMany({
        phone: identifier,
        purpose: 'registration',
        verified: false,
      })

      return NextResponse.json(
        { error: 'Failed to send OTP. Please try again.' },
        { status: 500 }
      )
    }

    // ── Success Response ──────────────────────────────────
    return NextResponse.json({
      success: true,
      message:
        channel === 'sms'
          ? `OTP sent to ${cleanPhone.slice(0, 2)}XXXXXX${cleanPhone.slice(-2)}`
          : `OTP sent to ${cleanEmail.slice(0, 3)}***${cleanEmail.slice(cleanEmail.indexOf('@'))}`,
      expiresIn: OTP_EXPIRY_MINUTES * 60,
    })
  } catch (err: any) {
    console.error('[OTP-SEND] Error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}