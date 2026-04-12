// FILE: src/app/api/auth/otp/send/route.ts
// UPDATED: Uses new messaging system (Fast2SMS + Resend)
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db'
import { OTPVerification } from '@/models/OTPVerification'
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/security'
import { sendMessage, SMS_TEMPLATES, EMAIL_TEMPLATES } from '@/lib/message'

const OTP_EXPIRY_MINUTES = 10
const MAX_RESEND_PER_HOUR = 3

export async function POST(req: NextRequest) {
  // ── Rate limit ──
  const rl = checkRateLimit(req, RATE_LIMITS.register)
  if (!rl.allowed) return rateLimitResponse(rl.resetIn)

  try {
    await connectDB()

    const body = await req.json()
    const { phone, email, channel } = body
    // channel: 'sms' | 'email'

    // ── Validate ──
    if (channel === 'sms') {
      if (!phone) {
        return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
      }
      const cleanPhone = phone.replace(/[^0-9]/g, '')
      if (cleanPhone.length !== 10) {
        return NextResponse.json({ error: 'Valid 10-digit phone required' }, { status: 400 })
      }
    } else if (channel === 'email') {
      if (!email) {
        return NextResponse.json({ error: 'Email required' }, { status: 400 })
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: 'Invalid channel' }, { status: 400 })
    }

    const identifier =
      channel === 'sms' ? phone.replace(/[^0-9]/g, '') : email.toLowerCase().trim()

    // ── Check resend limit (3 per hour) ──
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentCount = await OTPVerification.countDocuments({
      phone: identifier,
      purpose: 'registration',
      createdAt: { $gte: oneHourAgo },
    })

    if (recentCount >= MAX_RESEND_PER_HOUR) {
      return NextResponse.json(
        { error: 'Too many OTP requests. Please wait 1 hour before trying again.' },
        { status: 429 }
      )
    }

    // ── Generate OTP ──
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const hashedOTP = await bcrypt.hash(otp, 10)
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    // ── Delete old OTPs for this identifier ──
    await OTPVerification.deleteMany({
      phone: identifier,
      purpose: 'registration',
      verified: false,
    })

    // ── Save new OTP ──
    await OTPVerification.create({
      phone: identifier,
      hashedOTP,
      purpose: 'registration',
      attempts: 0,
      verified: false,
      token: '',
      expiresAt,
    })

    // ── Send OTP via new messaging system ──
    let sendResult: { success: boolean; error?: string }

    if (channel === 'sms') {
      // ✅ NEW: Use sendMessage from unified system
      sendResult = await sendMessage({
        tenantId: 'system', // System messages don't need tenant
        channel: 'sms',
        purpose: 'otp',
        recipient: identifier,
        message: SMS_TEMPLATES.otp(otp),
        skipCreditCheck: true, // OTP is free, no credit check
      })
    } else {
      // ✅ NEW: Use sendMessage for email
      const template = EMAIL_TEMPLATES.otp(otp)
      sendResult = await sendMessage({
        tenantId: 'system',
        channel: 'email',
        purpose: 'otp',
        recipient: email.toLowerCase().trim(),
        message: template.subject,
        subject: template.subject,
        html: template.html,
        skipCreditCheck: true,
      })
    }

    if (!sendResult.success) {
      console.error('[OTP-SEND] Failed:', sendResult.error)
      return NextResponse.json(
        { error: 'Failed to send OTP. Please try again.' },
        { status: 500 }
      )
    }

    // ── Success response ──
    return NextResponse.json({
      success: true,
      message:
        channel === 'sms'
          ? `OTP sent to ${identifier.slice(0, 2)}XXXXXXXX${identifier.slice(-2)}`
          : `OTP sent to ${email.slice(0, 3)}***${email.slice(email.indexOf('@'))}`,
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