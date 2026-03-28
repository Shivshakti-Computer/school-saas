/* ─────────────────────────────────────────────────────────────
   FILE: src/app/api/schools/register/route.ts
   POST → New school signup (creates school + admin user)
   Returns school code for login (no subdomain URL)
   ─────────────────────────────────────────────────────────── */

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { User } from '@/models/User'

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const body = await req.json()

    const {
      schoolName,
      subdomain,    // This is the "School Code"
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

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 }
      )
    }

    // ── Clean school code ──
    const schoolCode = subdomain.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '')

    if (schoolCode.length < 3) {
      return NextResponse.json(
        { error: 'School code must be at least 3 characters.' },
        { status: 400 }
      )
    }

    if (schoolCode !== subdomain.toLowerCase().trim()) {
      return NextResponse.json(
        { error: 'School code can only contain lowercase letters, numbers, underscore (_), and hyphen (-).' },
        { status: 400 }
      )
    }

    // ── Reserved codes ──
    const reserved = ['admin', 'api', 'www', 'app', 'login', 'register', 'superadmin', 'test', 'demo']
    if (reserved.includes(schoolCode)) {
      return NextResponse.json(
        { error: 'This school code is reserved. Please choose another.' },
        { status: 400 }
      )
    }

    // ── Check duplicate ──
    const exists = await School.findOne({ subdomain: schoolCode })
    if (exists) {
      return NextResponse.json(
        { error: 'This school code is already taken. Please try a different one.' },
        { status: 409 }
      )
    }

    // ── Check duplicate phone ──
    const phoneExists = await User.findOne({ phone: phone.trim() })
    if (phoneExists) {
      return NextResponse.json(
        { error: 'This phone number is already registered with another school.' },
        { status: 409 }
      )
    }

    // ── Trial: 15 days from now ──
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 15)

    // ── Create school ──
    const school = await School.create({
      name: schoolName.trim(),
      subdomain: schoolCode,
      address: address?.trim() || '',
      phone: phone.trim(),
      email: email?.trim() || '',
      plan: 'starter',
      trialEndsAt,
      modules: ['students', 'teachers', 'attendance', 'notices', 'website', 'gallery'],
      isActive: true,
      onboardingComplete: false,
    })

    // ── Create admin user ──
    const hashedPwd = await bcrypt.hash(password, 10)

    await User.create({
      tenantId: school._id,
      name: adminName.trim(),
      phone: phone.trim(),
      email: email?.trim() || '',
      role: 'admin',
      password: hashedPwd,
      isActive: true,
    })

    // ── Send welcome email (optional, non-blocking) ──
    if (email?.trim()) {
      try {
        // Dynamic import to avoid breaking if email module doesn't exist
        const { sendEmail, EMAIL_TEMPLATES } = await import('@/lib/email')

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vidyaflow.in'

        const { subject, html } = EMAIL_TEMPLATES.welcome(
          schoolName.trim(),
          adminName.trim(),
          `${appUrl}/login`  // Single login URL, not subdomain-based
        )

        await sendEmail(email.trim(), subject, html)
      } catch (mailError) {
        // Email failure should NOT block registration
        console.error('Email send failed (non-critical):', mailError)
      }
    }

    // ── Return success ──
    return NextResponse.json(
      {
        success: true,
        schoolCode,
        schoolName: schoolName.trim(),
        trialEndsAt: trialEndsAt.toISOString(),
        trialDays: 15,
        message: `School registered successfully. Login with school code: ${schoolCode}`,
      },
      { status: 201 }
    )

  } catch (error: any) {
    console.error('REGISTER ERROR:', error)

    // Handle MongoDB duplicate key error
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