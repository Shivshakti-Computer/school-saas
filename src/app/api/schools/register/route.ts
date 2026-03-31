// FILE: src/app/api/schools/register/route.ts (UPDATED with security)

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { User } from '@/models/User'
import {
  sanitizeBody,
  checkRateLimit,
  RATE_LIMITS,
  rateLimitResponse,
  validatePasswordStrength,
  getClientInfo,
} from '@/lib/security'
import { logAudit } from '@/lib/audit'

export async function POST(req: NextRequest) {
  // ── Rate Limit ──
  const rl = checkRateLimit(req, RATE_LIMITS.register)
  if (!rl.allowed) {
    return rateLimitResponse(rl.resetIn)
  }

  try {
    await connectDB()

    // ── Sanitize Input ──
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
    } = body

    // ── Validation ──
    if (!schoolName?.trim() || !subdomain?.trim() || !adminName?.trim() || !phone?.trim() || !password) {
      return NextResponse.json(
        { error: 'School name, school code, admin name, phone, and password are required.' },
        { status: 400 }
      )
    }

    // ── Password Strength ──
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 }
      )
    }

    // ── Phone Validation ──
    const cleanPhone = phone.trim().replace(/[^0-9]/g, '')
    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        { error: 'Enter a valid 10-digit phone number.' },
        { status: 400 }
      )
    }

    // ── Email Validation (if provided) ──
    if (email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json(
          { error: 'Enter a valid email address.' },
          { status: 400 }
        )
      }
    }

    // ── Clean school code ──
    const schoolCode = subdomain.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '')

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

    // ── Reserved codes ──
    const reserved = [
      'admin', 'api', 'www', 'app', 'login', 'register',
      'superadmin', 'test', 'demo', 'skolify', 'support',
      'help', 'billing', 'null', 'undefined', 'dashboard',
    ]
    if (reserved.includes(schoolCode)) {
      return NextResponse.json(
        { error: 'This school code is reserved. Please choose another.' },
        { status: 400 }
      )
    }

    // ── Check duplicate school code ──
    const exists = await School.findOne({ subdomain: schoolCode })
    if (exists) {
      return NextResponse.json(
        { error: 'This school code is already taken.' },
        { status: 409 }
      )
    }

    // ── Check duplicate phone ──
    const phoneExists = await User.findOne({ phone: cleanPhone })
    if (phoneExists) {
      return NextResponse.json(
        { error: 'This phone number is already registered with another school.' },
        { status: 409 }
      )
    }

    // ── Trial: 15 days ──
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 15)

    // ── Create school ──
    const school = await School.create({
      name: schoolName.trim(),
      subdomain: schoolCode,
      address: address?.trim() || '',
      phone: cleanPhone,
      email: email?.trim() || '',
      plan: 'starter',
      trialEndsAt,
      modules: ['students', 'teachers', 'attendance', 'notices', 'website', 'gallery'],
      isActive: true,
      onboardingComplete: false,
    })

    // ── Create admin user (with stronger hash) ──
    const hashedPwd = await bcrypt.hash(password, 12) // Increased from 10 to 12

    await User.create({
      tenantId: school._id,
      name: adminName.trim(),
      phone: cleanPhone,
      email: email?.trim() || '',
      role: 'admin',
      password: hashedPwd,
      isActive: true,
    })

    // ── Audit Log ──
    const clientInfo = getClientInfo(req)
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
        trialEndsAt: trialEndsAt.toISOString(),
      },
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
    })

    // ── Send welcome email (optional) ──
    if (email?.trim()) {
      try {
        const { sendEmail, EMAIL_TEMPLATES } = await import('@/lib/email')
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://skolify.in'
        const { subject, html } = EMAIL_TEMPLATES.welcome(
          schoolName.trim(),
          adminName.trim(),
          `${appUrl}/login`
        )
        await sendEmail(email.trim(), subject, html)
      } catch (mailError) {
        console.error('Email send failed (non-critical):', mailError)
      }
    }

    return NextResponse.json(
      {
        success: true,
        schoolCode,
        schoolName: schoolName.trim(),
        trialEndsAt: trialEndsAt.toISOString(),
        trialDays: 15,
        message: `School registered successfully.`,
      },
      { status: 201 }
    )

  } catch (error: any) {
    console.error('REGISTER ERROR:', error)

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0]
      return NextResponse.json(
        { error: `This ${field === 'subdomain' ? 'school code' : field} is already taken.` },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}