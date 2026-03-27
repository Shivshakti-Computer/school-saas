/* ─────────────────────────────────────────────────────────────
   FILE: src/app/api/schools/register/route.ts
   POST → New school signup (creates school + admin user)
   ─────────────────────────────────────────────────────────── */

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { User } from '@/models/User'
import { sendEmail, EMAIL_TEMPLATES } from '@/lib/email'

export async function POST(req: NextRequest) {
    try {
        await connectDB()

        const body = await req.json()
        console.log("📦 BODY:", body)

        // Required fields
        const {
            schoolName,
            subdomain,
            adminName,
            phone,
            email,
            password,
            address,
        } = body

        if (!schoolName || !subdomain || !adminName || !phone || !password) {
            return NextResponse.json(
                { error: 'All fields required' },
                { status: 400 }
            )
        }

        // Subdomain: only lowercase alphanumeric and hyphens
        const cleanSub = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '')

        if (cleanSub !== subdomain) {
            return NextResponse.json(
                { error: 'Subdomain can only have letters, numbers, hyphens' },
                { status: 400 }
            )
        }

        // Check duplicate subdomain
        const exists = await School.findOne({ subdomain: cleanSub })
        console.log("🔍 EXISTING SCHOOL:", exists)

        if (exists) {
            return NextResponse.json(
                { error: 'This school code is taken. Try another.' },
                { status: 409 }
            )
        }

        // Trial = 15 days from now
        const trialEndsAt = new Date()
        trialEndsAt.setDate(trialEndsAt.getDate() + 15)

        // ✅ Create school
        const school = await School.create({
            name: schoolName,
            subdomain: cleanSub,
            address: address || '',
            phone,
            email,
            plan: 'starter',
            trialEndsAt,
            modules: ['students', 'attendance', 'notices'],
            isActive: true,
            onboardingComplete: false,
        })

        console.log("✅ SCHOOL CREATED:", school)

        // ✅ Create admin user
        const hashedPwd = await bcrypt.hash(password, 10)

        const user = await User.create({
            tenantId: school._id,
            name: adminName,
            phone,
            email,
            role: 'admin',
            password: hashedPwd,
            isActive: true,
        })

        console.log("✅ USER CREATED:", user)

        // ✅ Send welcome email (same logic retained)
        if (email) {
            try {
                const { subject, html } = EMAIL_TEMPLATES.welcome(
                    schoolName,
                    adminName,
                    `https://${cleanSub}.${process.env.NEXT_PUBLIC_APP_DOMAIN}/login`
                )

                await sendEmail(email, subject, html)
                console.log("📧 Email sent")
            } catch (mailError) {
                console.error("⚠️ Email failed:", mailError)
                // ❗ Email fail hone pe signup fail nahi hona chahiye
            }
        }

        return NextResponse.json(
            {
                success: true,
                subdomain: cleanSub,
                loginUrl: `https://${cleanSub}.${process.env.NEXT_PUBLIC_APP_DOMAIN}/login`,
                trialEndsAt,
            },
            { status: 201 }
        )

    } catch (error: any) {
        console.error("🔥 REGISTER ERROR:", error)

        return NextResponse.json(
            {
                error: error.message || 'Internal server error',
            },
            { status: 500 }
        )
    }
}