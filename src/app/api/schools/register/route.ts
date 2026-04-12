// FILE: src/app/api/schools/register/route.ts
// UPDATED: Welcome email — @/lib/email → resend.ts directly
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { User } from '@/models/User'
import { OTPVerification } from '@/models/OTPVerification'
import {
  sanitizeBody,
  checkRateLimit,
  RATE_LIMITS,
  rateLimitResponse,
  getClientInfo,
} from '@/lib/security'
import { logAudit } from '@/lib/audit'
import { TRIAL_CONFIG } from '@/config/pricing'
import { grantTrialCredits } from '@/lib/credits'

export async function POST(req: NextRequest) {

  // ── Rate Limiting ──────────────────────────────────────
  const rl = checkRateLimit(req, RATE_LIMITS.register)
  if (!rl.allowed) return rateLimitResponse(rl.resetIn)

  try {
    await connectDB()

    // ── Parse & Sanitize ───────────────────────────────────
    const raw = await req.json()
    const body = sanitizeBody(raw)

    const {
      schoolName,
      subdomain,
      adminName,
      phone,
      email,
      password,
      address,
      verificationToken,
    } = body

    console.log('[REGISTER] Registration request received')
    console.log('[REGISTER] School:', schoolName?.slice(0, 20))
    console.log('[REGISTER] Phone:', phone)
    console.log('[REGISTER] Has verification token:', !!verificationToken)

    // ── Basic Validation ───────────────────────────────────
    if (!schoolName?.trim()) {
      return NextResponse.json(
        { error: 'School name is required.' },
        { status: 400 }
      )
    }

    if (!subdomain?.trim()) {
      return NextResponse.json(
        { error: 'School code is required.' },
        { status: 400 }
      )
    }

    if (!adminName?.trim()) {
      return NextResponse.json(
        { error: 'Admin name is required.' },
        { status: 400 }
      )
    }

    if (!phone?.trim()) {
      return NextResponse.json(
        { error: 'Phone number is required.' },
        { status: 400 }
      )
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required.' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 }
      )
    }

    // ── Phone Cleaning ─────────────────────────────────────
    const cleanPhone = phone.trim().replace(/[^0-9]/g, '')

    console.log('[REGISTER] Original phone:', phone)
    console.log('[REGISTER] Cleaned phone:', cleanPhone)

    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        { error: 'Enter a valid 10-digit phone number.' },
        { status: 400 }
      )
    }

    // ── Email Validation (Optional) ────────────────────────
    if (email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json(
          { error: 'Enter a valid email address.' },
          { status: 400 }
        )
      }
    }

    // ── School Code Validation ─────────────────────────────
    const schoolCode = subdomain
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '')

    if (schoolCode.length < 3) {
      return NextResponse.json(
        { error: 'School code must be at least 3 characters.' },
        { status: 400 }
      )
    }

    if (schoolCode.length > 30) {
      return NextResponse.json(
        { error: 'School code must be 30 characters or less.' },
        { status: 400 }
      )
    }

    const reserved = [
      'admin', 'api', 'www', 'app', 'login', 'register',
      'superadmin', 'test', 'demo', 'skolify', 'support',
      'help', 'billing', 'null', 'undefined', 'dashboard',
      'portal', 'payment', 'settings', 'profile', 'logout',
    ]

    if (reserved.includes(schoolCode)) {
      return NextResponse.json(
        { error: 'This school code is reserved. Please choose another.' },
        { status: 400 }
      )
    }

    // ── OTP Verification ───────────────────────────────────
    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Phone verification required. Please verify your phone number first.' },
        { status: 400 }
      )
    }

    console.log('[REGISTER] Verifying OTP token...')

    let otpRecord = null

    // Try 1: Phone se dhundo
    otpRecord = await OTPVerification.findOne({
      phone: cleanPhone,
      purpose: 'registration',
      verified: true,
      token: verificationToken,
    })

    console.log('[REGISTER] OTP record found by phone:', !!otpRecord)

    // Try 2: Email se dhundo (agar phone se nahi mila)
    if (!otpRecord && email?.trim()) {
      const cleanEmail = email.toLowerCase().trim()

      otpRecord = await OTPVerification.findOne({
        phone: cleanEmail,
        purpose: 'registration',
        verified: true,
        token: verificationToken,
      })

      console.log('[REGISTER] OTP record found by email:', !!otpRecord)
    }

    if (!otpRecord) {
      console.error('[REGISTER] ❌ OTP verification failed')

      const anyPhoneRecord = await OTPVerification.findOne({
        phone: cleanPhone,
      }).sort({ createdAt: -1 })

      const anyEmailRecord = email?.trim()
        ? await OTPVerification.findOne({
          phone: email.toLowerCase().trim(),
        }).sort({ createdAt: -1 })
        : null

      if (anyPhoneRecord) {
        console.error('[REGISTER] Phone record found (criteria mismatch):', {
          verified: anyPhoneRecord.verified,
          purpose: anyPhoneRecord.purpose,
          tokenMatch: anyPhoneRecord.token === verificationToken,
          expired: new Date() > anyPhoneRecord.expiresAt,
        })
      }

      if (anyEmailRecord) {
        console.error('[REGISTER] Email record found (criteria mismatch):', {
          verified: anyEmailRecord.verified,
          purpose: anyEmailRecord.purpose,
          tokenMatch: anyEmailRecord.token === verificationToken,
          expired: new Date() > anyEmailRecord.expiresAt,
        })
      }

      return NextResponse.json(
        { error: 'Invalid or expired verification. Please verify your phone or email again.' },
        { status: 400 }
      )
    }

    if (new Date() > otpRecord.expiresAt) {
      console.log('[REGISTER] ❌ OTP record expired')
      await OTPVerification.findByIdAndDelete(otpRecord._id)
      return NextResponse.json(
        { error: 'Verification expired. Please verify again.' },
        { status: 400 }
      )
    }

    console.log('[REGISTER] ✅ OTP verification passed')

    // ── Check Duplicates ───────────────────────────────────
    const existingSchool = await School.findOne({
      subdomain: schoolCode,
    })
    if (existingSchool) {
      return NextResponse.json(
        { error: 'This school code is already taken. Please choose another.' },
        { status: 409 }
      )
    }

    const existingUser = await User.findOne({ phone: cleanPhone })
    if (existingUser) {
      return NextResponse.json(
        { error: 'This phone number is already registered with another school.' },
        { status: 409 }
      )
    }

    if (email?.trim()) {
      const existingEmail = await User.findOne({
        email: email.toLowerCase().trim(),
      })
      if (existingEmail) {
        return NextResponse.json(
          { error: 'This email is already registered.' },
          { status: 409 }
        )
      }
    }

    console.log('[REGISTER] ✅ No duplicates found')

    // ── Create School ──────────────────────────────────────
    const trialEndsAt = new Date()
    trialEndsAt.setDate(
      trialEndsAt.getDate() + TRIAL_CONFIG.durationDays
    )

    console.log('[REGISTER] Creating school...')

    const school = await School.create({
      name: schoolName.trim(),
      subdomain: schoolCode,
      address: address?.trim() || '',
      phone: cleanPhone,
      email: email?.trim() || '',
      plan: TRIAL_CONFIG.plan,
      trialEndsAt,
      modules: TRIAL_CONFIG.modules,
      isActive: true,
      onboardingComplete: false,
      creditBalance: 0,
    })

    console.log('[REGISTER] ✅ School created:', school._id)

    // ── Grant Trial Credits ────────────────────────────────
    try {
      await grantTrialCredits(school._id.toString())
      console.log('[REGISTER] ✅ Trial credits granted')
    } catch (creditError) {
      console.error('[REGISTER] ⚠️ Trial credits failed:', creditError)
    }

    // ── Create Admin User ──────────────────────────────────
    console.log('[REGISTER] Creating admin user...')

    const hashedPassword = await bcrypt.hash(password, 12)

    await User.create({
      tenantId: school._id,
      name: adminName.trim(),
      phone: cleanPhone,
      email: email?.trim() || '',
      role: 'admin',
      password: hashedPassword,
      isActive: true,
    })

    console.log('[REGISTER] ✅ Admin user created')

    // ── Cleanup OTP ────────────────────────────────────────
    await OTPVerification.findByIdAndDelete(otpRecord._id)
    console.log('[REGISTER] ✅ OTP record cleaned up')

    // ── Audit Log ──────────────────────────────────────────
    const clientInfo = getClientInfo(req)

    try {
      await logAudit({
        tenantId: school._id.toString(),
        userName: adminName.trim(),
        userRole: 'admin',
        action: 'SCHOOL_REGISTER',
        resource: 'School',
        resourceId: school._id.toString(),
        description: `New school registered: ${schoolName.trim()} (${schoolCode})`,
        metadata: {
          schoolCode,
          phone: cleanPhone,
          email: email?.trim() || '',
          trialEndsAt: trialEndsAt.toISOString(),
          trialDays: TRIAL_CONFIG.durationDays,
          phoneVerified: true,
        },
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.userAgent,
      })
      console.log('[REGISTER] ✅ Audit log created')
    } catch (auditError) {
      console.error('[REGISTER] ⚠️ Audit log failed:', auditError)
    }

    // ── Welcome Email ──────────────────────────────────────
    if (email?.trim()) {
      try {
        // ✅ FIX: resend.ts directly — @/lib/email exist nahi karta
        const { resendSendEmail } = await import(
          '@/lib/message/providers/resend'
        )
        const { EMAIL_TEMPLATES } = await import(
          '@/lib/message/templates'
        )

        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

        const { subject, html } = EMAIL_TEMPLATES.welcome(
          schoolName.trim(),
          adminName.trim(),
          `${appUrl}/login`
        )

        // isHtml = true — full HTML system email
        await resendSendEmail(
          email.trim(),
          subject,
          html,
          'Skolify Team',
          true    // ← isHtml: true
        )

        console.log('[REGISTER] ✅ Welcome email sent to:', email.trim())
      } catch (emailError) {
        console.error(
          '[REGISTER] ⚠️ Welcome email failed (non-critical):',
          emailError
        )
        // Non-critical — registration already successful
      }
    }

    // ── Success Response ───────────────────────────────────
    console.log('[REGISTER] ✅✅✅ Registration completed successfully')

    return NextResponse.json(
      {
        success: true,
        schoolCode,
        schoolName: schoolName.trim(),
        trialEndsAt: trialEndsAt.toISOString(),
        trialDays: TRIAL_CONFIG.durationDays,
        message: `School registered successfully. ${TRIAL_CONFIG.durationDays}-day free trial activated.`,
      },
      { status: 201 }
    )

  } catch (error: any) {
    console.error('[REGISTER] ❌ Error:', error)
    console.error('[REGISTER] Stack:', error.stack)

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0]
      const fieldName =
        field === 'subdomain' ? 'school code'
          : field === 'phone' ? 'phone number'
            : field === 'email' ? 'email'
              : field

      return NextResponse.json(
        { error: `This ${fieldName} is already taken.` },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}